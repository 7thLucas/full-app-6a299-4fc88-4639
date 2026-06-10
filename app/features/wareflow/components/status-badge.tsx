import { cn } from "~/lib/utils";
import type { ItemStatus, ShipmentStatus, OrderStatus } from "../types";

type AnyStatus = ItemStatus | ShipmentStatus | OrderStatus | string;

/**
 * Status drives the whole WareFlow flow, so status color is a first-class
 * signal. Rendered as a calm chip (not a full-bleed background) per the design.
 *
 * Semantics:
 *   amber  — pending / awaiting action
 *   blue   — in progress / checked-in / assigned / picking
 *   green  — done / dispatched / shelved / ready
 *   red    — problem / blocked / unassigned
 */
const STATUS_META: Record<
  string,
  { label: string; tone: "amber" | "blue" | "green" | "red" | "slate" }
> = {
  // Shipments
  expected: { label: "Expected", tone: "amber" },
  checked_in: { label: "Checked in", tone: "blue" },
  // Items
  awaiting_putaway: { label: "Awaiting put-away", tone: "amber" },
  stored: { label: "Stored", tone: "green" },
  picked: { label: "Picked", tone: "blue" },
  // Orders
  open: { label: "Open", tone: "amber" },
  picking: { label: "Picking", tone: "blue" },
  ready: { label: "Ready to dispatch", tone: "green" },
  dispatched: { label: "Dispatched", tone: "green" },
  // Generic
  unassigned: { label: "Unassigned", tone: "red" },
};

const TONE_CLASSES: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AnyStatus;
  className?: string;
}) {
  const meta = STATUS_META[status] ?? { label: String(status), tone: "slate" as const };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset whitespace-nowrap",
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-amber-500": meta.tone === "amber",
          "bg-blue-500": meta.tone === "blue",
          "bg-emerald-500": meta.tone === "green",
          "bg-red-500": meta.tone === "red",
          "bg-slate-400": meta.tone === "slate",
        })}
      />
      {meta.label}
    </span>
  );
}
