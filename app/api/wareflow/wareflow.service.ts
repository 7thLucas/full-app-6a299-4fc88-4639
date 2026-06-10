import { ItemModel } from "./models/item.model";
import { ShipmentModel } from "./models/shipment.model";
import { OrderModel } from "./models/order.model";

/**
 * Format a location into a single readable code, e.g. "A-12-03".
 * Returns null when the item has no known location yet.
 */
export function formatLocation(
  zone?: string | null,
  aisle?: string | null,
  bin?: string | null,
): string | null {
  if (!zone && !aisle && !bin) return null;
  return [zone, aisle, bin].filter(Boolean).join("-");
}

const notDeleted = { deletedAt: { $in: [null, undefined] } };

// ── Shipments ──────────────────────────────────────────────────────────────

export const ShipmentService = {
  async list() {
    return ShipmentModel.find(notDeleted).sort({ createdAt: -1 }).lean().exec();
  },

  async get(id: string) {
    return ShipmentModel.findOne({ _id: id, ...notDeleted }).lean().exec();
  },

  async create(data: {
    reference: string;
    supplier: string;
    notes?: string;
    lines: Array<{ sku: string; name: string; quantity: number }>;
  }) {
    return ShipmentModel.create({
      reference: data.reference,
      supplier: data.supplier,
      notes: data.notes ?? "",
      lines: data.lines ?? [],
      status: "expected",
    });
  },

  /**
   * Check a shipment in at the dock. Creates an Item (awaiting_putaway) for
   * every expected line, so each unit immediately enters the location flow.
   */
  async checkIn(id: string) {
    const shipment = await ShipmentModel.findOne({ _id: id, ...notDeleted }).exec();
    if (!shipment) return null;
    if (shipment.status === "checked_in") return shipment.toObject();

    const createdItems = [];
    for (const line of shipment.lines) {
      const item = await ItemModel.create({
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        status: "awaiting_putaway",
        zone: null,
        aisle: null,
        bin: null,
        shipmentId: String(shipment._id),
      });
      createdItems.push(item);
    }

    shipment.status = "checked_in";
    shipment.checkedInAt = new Date();
    await shipment.save();

    return shipment.toObject();
  },
};

// ── Items / Storage ──────────────────────────────────────────────────────────

export const ItemService = {
  async list(filter: { status?: string; q?: string } = {}) {
    const query: Record<string, unknown> = { ...notDeleted };
    if (filter.status) query.status = filter.status;
    if (filter.q) {
      const rx = new RegExp(escapeRegExp(filter.q), "i");
      query.$or = [
        { sku: rx },
        { name: rx },
        { zone: rx },
        { aisle: rx },
        { bin: rx },
      ];
    }
    return ItemModel.find(query).sort({ updatedAt: -1 }).lean().exec();
  },

  async get(id: string) {
    return ItemModel.findOne({ _id: id, ...notDeleted }).lean().exec();
  },

  /**
   * Assign (or move) an item to a slot/bin/zone. This is the moment a unit
   * gets a trustworthy known location and becomes pickable.
   */
  async assignLocation(
    id: string,
    loc: { zone?: string | null; aisle?: string | null; bin?: string | null },
  ) {
    const item = await ItemModel.findOne({ _id: id, ...notDeleted }).exec();
    if (!item) return null;

    item.zone = loc.zone ?? null;
    item.aisle = loc.aisle ?? null;
    item.bin = loc.bin ?? null;

    // Assigning a location moves the item into "stored" (unless dispatched).
    if (item.status === "awaiting_putaway" || item.status === "stored") {
      const hasLocation = !!(item.zone || item.aisle || item.bin);
      item.status = hasLocation ? "stored" : "awaiting_putaway";
    }
    await item.save();
    return item.toObject();
  },
};

// ── Orders ───────────────────────────────────────────────────────────────────

export const OrderService = {
  async list() {
    return OrderModel.find(notDeleted).sort({ createdAt: -1 }).lean().exec();
  },

  async get(id: string) {
    return OrderModel.findOne({ _id: id, ...notDeleted }).lean().exec();
  },

  /**
   * Build an outbound order from stored items. Each line snapshots the item's
   * known location so picking is guided, never guessed.
   */
  async create(data: {
    reference: string;
    customer: string;
    notes?: string;
    lines: Array<{ itemId: string; quantity: number }>;
  }) {
    const resolvedLines = [];
    for (const line of data.lines ?? []) {
      const item = await ItemModel.findOne({ _id: line.itemId, ...notDeleted }).lean().exec();
      if (!item) continue;
      resolvedLines.push({
        itemId: String(item._id),
        sku: item.sku,
        name: item.name,
        quantity: line.quantity,
        location: formatLocation(item.zone, item.aisle, item.bin) ?? "UNASSIGNED",
        picked: false,
      });
    }

    return OrderModel.create({
      reference: data.reference,
      customer: data.customer,
      notes: data.notes ?? "",
      lines: resolvedLines,
      status: "open",
    });
  },

  /** Mark a single line as picked, pulling that item into "picked" status. */
  async pickLine(orderId: string, itemId: string) {
    const order = await OrderModel.findOne({ _id: orderId, ...notDeleted }).exec();
    if (!order) return null;

    let changed = false;
    order.lines = order.lines.map((l) => {
      if (l.itemId === itemId && !l.picked) {
        changed = true;
        return { ...l, picked: true };
      }
      return l;
    });

    if (changed) {
      await ItemModel.updateOne(
        { _id: itemId, ...notDeleted },
        { $set: { status: "picked", orderId: String(order._id) } },
      ).exec();
    }

    order.status = computeOrderStatus(order.lines);
    await order.save();
    return order.toObject();
  },

  /**
   * Confirm dispatch. Only allowed when every line is picked. Marks the order
   * dispatched and pushes its items out of the building.
   */
  async confirmDispatch(orderId: string) {
    const order = await OrderModel.findOne({ _id: orderId, ...notDeleted }).exec();
    if (!order) return null;

    const allPicked = order.lines.length > 0 && order.lines.every((l) => l.picked);
    if (!allPicked) {
      return { error: "All lines must be picked before dispatch." as const };
    }

    const itemIds = order.lines.map((l) => l.itemId);
    await ItemModel.updateMany(
      { _id: { $in: itemIds }, ...notDeleted },
      { $set: { status: "dispatched" } },
    ).exec();

    order.status = "dispatched";
    order.dispatchedAt = new Date();
    await order.save();
    return order.toObject();
  },
};

// ── Dashboard ────────────────────────────────────────────────────────────────

export const DashboardService = {
  async summary() {
    const [
      shipmentsExpected,
      awaitingPutaway,
      storedItems,
      openOrders,
      dispatchedToday,
    ] = await Promise.all([
      ShipmentModel.countDocuments({ status: "expected", ...notDeleted }).exec(),
      ItemModel.countDocuments({ status: "awaiting_putaway", ...notDeleted }).exec(),
      ItemModel.countDocuments({ status: "stored", ...notDeleted }).exec(),
      OrderModel.countDocuments({ status: { $in: ["open", "picking", "ready"] }, ...notDeleted }).exec(),
      OrderModel.countDocuments({
        status: "dispatched",
        dispatchedAt: { $gte: startOfToday() },
        ...notDeleted,
      }).exec(),
    ]);

    return {
      shipmentsExpected,
      awaitingPutaway,
      storedItems,
      openOrders,
      dispatchedToday,
    };
  },
};

// ── helpers ──────────────────────────────────────────────────────────────────

function computeOrderStatus(
  lines: Array<{ picked: boolean }>,
): "open" | "picking" | "ready" | "dispatched" {
  if (lines.length === 0) return "open";
  const pickedCount = lines.filter((l) => l.picked).length;
  if (pickedCount === 0) return "open";
  if (pickedCount === lines.length) return "ready";
  return "picking";
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
