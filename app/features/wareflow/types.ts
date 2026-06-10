// Shared client-side types for the WareFlow domain. These mirror the server
// models but only carry the fields the UI needs.

export type ItemStatus = "awaiting_putaway" | "stored" | "picked" | "dispatched";
export type ShipmentStatus = "expected" | "checked_in";
export type OrderStatus = "open" | "picking" | "ready" | "dispatched";

export interface Item {
  _id: string;
  sku: string;
  name: string;
  quantity: number;
  status: ItemStatus;
  zone?: string | null;
  aisle?: string | null;
  bin?: string | null;
  shipmentId?: string | null;
  orderId?: string | null;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShipmentLine {
  sku: string;
  name: string;
  quantity: number;
}

export interface Shipment {
  _id: string;
  reference: string;
  supplier: string;
  status: ShipmentStatus;
  checkedInAt?: string | null;
  lines: ShipmentLine[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderLine {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  location: string;
  picked: boolean;
}

export interface Order {
  _id: string;
  reference: string;
  customer: string;
  status: OrderStatus;
  dispatchedAt?: string | null;
  lines: OrderLine[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  shipmentsExpected: number;
  awaitingPutaway: number;
  storedItems: number;
  openOrders: number;
  dispatchedToday: number;
}

/** Build a single readable location code from parts, e.g. "A-12-03". */
export function locationCode(
  zone?: string | null,
  aisle?: string | null,
  bin?: string | null,
): string {
  const parts = [zone, aisle, bin].filter(Boolean);
  return parts.length ? parts.join("-") : "—";
}
