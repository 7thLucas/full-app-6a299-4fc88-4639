import { createLogger } from "~/lib/logger";
import { ItemModel } from "./models/item.model";
import { ShipmentModel } from "./models/shipment.model";
import { OrderModel } from "./models/order.model";

const logger = createLogger("WareflowSeed");

/**
 * Seed a small, realistic warehouse so the app is immediately demonstrable:
 * one expected shipment, one already checked-in shipment, items at known
 * locations (plus some awaiting put-away), and outbound orders mid-flow.
 *
 * Idempotent: early-returns if any items already exist.
 */
export async function seedWareflow(): Promise<void> {
  try {
    const existing = await ItemModel.estimatedDocumentCount();
    if (existing > 0) {
      return;
    }

    logger.info("Seeding WareFlow demo data...");

    // ── Inbound: one expected, one checked-in ────────────────────────────────
    await ShipmentModel.create({
      reference: "INB-2041",
      supplier: "Northwind Supply Co.",
      status: "expected",
      lines: [
        { sku: "BOLT-M8-100", name: "M8 Hex Bolt (box of 100)", quantity: 40 },
        { sku: "WSHR-M8", name: "M8 Flat Washer (box of 500)", quantity: 15 },
      ],
      notes: "ETA 14:00. Dock 3.",
    });

    const checkedShipment = await ShipmentModel.create({
      reference: "INB-2038",
      supplier: "Atlas Components",
      status: "checked_in",
      checkedInAt: new Date(Date.now() - 1000 * 60 * 90),
      lines: [
        { sku: "PUMP-HX2", name: "HX2 Hydraulic Pump", quantity: 12 },
        { sku: "HOSE-12FT", name: "12ft Pressure Hose", quantity: 30 },
        { sku: "SEAL-KIT-A", name: "Seal Kit A", quantity: 50 },
      ],
    });
    const shipmentId = String(checkedShipment._id);

    // ── Storage: stored items at known locations + some awaiting put-away ─────
    const stored = await ItemModel.insertMany([
      { sku: "PUMP-HX2", name: "HX2 Hydraulic Pump", quantity: 12, status: "stored", zone: "B", aisle: "04", bin: "12", shipmentId },
      { sku: "HOSE-12FT", name: "12ft Pressure Hose", quantity: 30, status: "stored", zone: "A", aisle: "02", bin: "07", shipmentId },
      { sku: "SEAL-KIT-A", name: "Seal Kit A", quantity: 50, status: "awaiting_putaway", zone: null, aisle: null, bin: null, shipmentId },
      { sku: "FILTER-OIL", name: "Oil Filter (standard)", quantity: 120, status: "stored", zone: "C", aisle: "01", bin: "03" },
      { sku: "GLOVE-XL", name: "Work Gloves XL (pair)", quantity: 8, status: "stored", zone: "D", aisle: "05", bin: "01" },
      { sku: "TAPE-IND", name: "Industrial Tape Roll", quantity: 200, status: "stored", zone: "A", aisle: "03", bin: "11" },
    ]);

    const pump = stored.find((i) => i.sku === "PUMP-HX2")!;
    const hose = stored.find((i) => i.sku === "HOSE-12FT")!;
    const filter = stored.find((i) => i.sku === "FILTER-OIL")!;

    // ── Outbound: one open, one mid-pick ─────────────────────────────────────
    await OrderModel.create({
      reference: "OUT-5512",
      customer: "Riverside Plant Maintenance",
      status: "open",
      lines: [
        { itemId: String(pump._id), sku: pump.sku, name: pump.name, quantity: 2, location: "B-04-12", picked: false },
        { itemId: String(filter._id), sku: filter.sku, name: filter.name, quantity: 10, location: "C-01-03", picked: false },
      ],
      notes: "Priority — needed for scheduled service.",
    });

    await OrderModel.create({
      reference: "OUT-5509",
      customer: "Bayline Logistics",
      status: "picking",
      lines: [
        { itemId: String(hose._id), sku: hose.sku, name: hose.name, quantity: 5, location: "A-02-07", picked: true },
        { itemId: String(filter._id), sku: filter.sku, name: filter.name, quantity: 20, location: "C-01-03", picked: false },
      ],
    });

    // Reflect the picked hose in item status to keep the flow consistent.
    await ItemModel.updateOne({ _id: hose._id }, { $set: { status: "picked" } }).exec();

    logger.info("✅ WareFlow demo data seeded");
  } catch (error) {
    logger.error("❌ Failed to seed WareFlow data:", error);
  }
}
