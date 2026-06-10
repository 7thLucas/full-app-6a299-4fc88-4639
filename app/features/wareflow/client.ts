import { apiRequest, apiGet, type ApiResponse } from "~/lib/api.client";
import type {
  Shipment,
  Item,
  Order,
  DashboardSummary,
  ShipmentLine,
} from "./types";

function unwrap<T>(res: ApiResponse<T>): T {
  if (!res.success) {
    throw new Error(res.message || res.error || "Request failed");
  }
  return res.data as T;
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export async function fetchDashboard(): Promise<DashboardSummary> {
  return unwrap(await apiGet<DashboardSummary>("/api/wareflow/dashboard"));
}

// ── Inbound shipments ────────────────────────────────────────────────────────
export async function fetchShipments(): Promise<Shipment[]> {
  return unwrap(await apiGet<Shipment[]>("/api/wareflow/shipments"));
}

export async function fetchShipment(id: string): Promise<Shipment> {
  return unwrap(await apiGet<Shipment>(`/api/wareflow/shipments/${id}`));
}

export async function createShipment(input: {
  reference: string;
  supplier: string;
  notes?: string;
  lines: ShipmentLine[];
}): Promise<Shipment> {
  return unwrap(
    await apiRequest<Shipment>("/api/wareflow/shipments", {
      method: "POST",
      data: input,
    }),
  );
}

export async function checkInShipment(id: string): Promise<Shipment> {
  return unwrap(
    await apiRequest<Shipment>(`/api/wareflow/shipments/${id}/check-in`, {
      method: "POST",
    }),
  );
}

// ── Storage / items ──────────────────────────────────────────────────────────
export async function fetchItems(params?: {
  status?: string;
  q?: string;
}): Promise<Item[]> {
  return unwrap(await apiGet<Item[]>("/api/wareflow/items", params));
}

export async function fetchItem(id: string): Promise<Item> {
  return unwrap(await apiGet<Item>(`/api/wareflow/items/${id}`));
}

export async function assignLocation(
  id: string,
  loc: { zone?: string | null; aisle?: string | null; bin?: string | null },
): Promise<Item> {
  return unwrap(
    await apiRequest<Item>(`/api/wareflow/items/${id}/assign`, {
      method: "POST",
      data: loc,
    }),
  );
}

// ── Outbound orders ───────────────────────────────────────────────────────────
export async function fetchOrders(): Promise<Order[]> {
  return unwrap(await apiGet<Order[]>("/api/wareflow/orders"));
}

export async function fetchOrder(id: string): Promise<Order> {
  return unwrap(await apiGet<Order>(`/api/wareflow/orders/${id}`));
}

export async function createOrder(input: {
  reference: string;
  customer: string;
  notes?: string;
  lines: Array<{ itemId: string; quantity: number }>;
}): Promise<Order> {
  return unwrap(
    await apiRequest<Order>("/api/wareflow/orders", {
      method: "POST",
      data: input,
    }),
  );
}

export async function pickOrderLine(
  orderId: string,
  itemId: string,
): Promise<Order> {
  return unwrap(
    await apiRequest<Order>(`/api/wareflow/orders/${orderId}/pick`, {
      method: "POST",
      data: { itemId },
    }),
  );
}

export async function confirmDispatch(orderId: string): Promise<Order> {
  return unwrap(
    await apiRequest<Order>(`/api/wareflow/orders/${orderId}/dispatch`, {
      method: "POST",
    }),
  );
}
