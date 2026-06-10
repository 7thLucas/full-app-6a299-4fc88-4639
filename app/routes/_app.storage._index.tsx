import { useEffect, useMemo, useState } from "react";
import { fetchItems, assignLocation } from "~/features/wareflow/client";
import type { Item } from "~/features/wareflow/types";
import { locationCode } from "~/features/wareflow/types";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  LoadingBlock,
} from "~/features/wareflow/components/ui";
import { StatusBadge } from "~/features/wareflow/components/status-badge";
import { useToast } from "~/features/wareflow/components/toast";
import { useConfigurables } from "~/modules/configurables";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Storage · WareFlow" }];
}

type Filter = "all" | "awaiting_putaway" | "stored" | "picked" | "dispatched";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "awaiting_putaway", label: "Awaiting put-away" },
  { key: "stored", label: "Stored" },
  { key: "picked", label: "Picked" },
  { key: "dispatched", label: "Dispatched" },
];

export default function StoragePage() {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [assignTarget, setAssignTarget] = useState<Item | null>(null);

  async function refresh() {
    const data = await fetchItems();
    setItems(data);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (filter !== "all" && it.status !== filter) return false;
      if (!q) return true;
      const loc = locationCode(it.zone, it.aisle, it.bin).toLowerCase();
      return (
        it.sku.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        loc.includes(q)
      );
    });
  }, [items, query, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Storage locations</h2>
        <p className="text-sm text-muted-foreground">
          Look up any item's current location instantly. Assign a slot to
          anything awaiting put-away.
        </p>
      </div>

      {/* Search-first lookup bar */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by SKU, item name, or location (e.g. B-04-12)…"
          className="h-14 pl-12 text-base"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-white text-muted-foreground ring-1 ring-inset ring-border hover:bg-secondary",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock label="Loading inventory…" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<BoxIcon />}
          title={query ? "No matches" : "No items yet"}
          description={
            query
              ? "Nothing matches that search. Try a different SKU or location."
              : "Items appear here once a shipment is checked in."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((it) => {
                  const loc = locationCode(it.zone, it.aisle, it.bin);
                  const hasLoc = loc !== "—";
                  return (
                    <tr key={it._id} className="hover:bg-secondary/40">
                      <td className="px-4 py-3 font-loc font-semibold">{it.sku}</td>
                      <td className="px-4 py-3 text-foreground">{it.name}</td>
                      <td className="px-4 py-3 font-loc text-muted-foreground">{it.quantity}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "font-loc font-semibold",
                            hasLoc ? "text-foreground" : "text-amber-600",
                          )}
                        >
                          {hasLoc ? loc : "Unassigned"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={it.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {it.status === "dispatched" ? (
                          <span className="text-xs text-muted-foreground">Shipped</span>
                        ) : (
                          <Button
                            variant={hasLoc ? "secondary" : "primary"}
                            onClick={() => setAssignTarget(it)}
                          >
                            {hasLoc ? "Move" : "Assign location"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AssignModal
        item={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={async (code) => {
          setAssignTarget(null);
          await refresh();
          toast.success(`Location set to ${code}. The item now has a known home.`);
        }}
      />
    </div>
  );
}

function AssignModal({
  item,
  onClose,
  onAssigned,
}: {
  item: Item | null;
  onClose: () => void;
  onAssigned: (code: string) => void;
}) {
  const toast = useToast();
  const { config } = useConfigurables();
  const zones =
    Array.isArray(config?.zones) && config.zones.length
      ? config.zones
      : ["A", "B", "C", "D"];

  const [zone, setZone] = useState("");
  const [aisle, setAisle] = useState("");
  const [bin, setBin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setZone(item.zone ?? "");
      setAisle(item.aisle ?? "");
      setBin(item.bin ?? "");
    }
  }, [item]);

  const valid = zone.trim() !== "" && aisle.trim() !== "" && bin.trim() !== "";
  const preview = locationCode(zone || null, aisle || null, bin || null);

  async function submit() {
    if (!item || !valid) return;
    setSaving(true);
    try {
      await assignLocation(item._id, {
        zone: zone.trim(),
        aisle: aisle.trim(),
        bin: bin.trim(),
      });
      onAssigned(preview);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not assign location.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title="Assign location"
      description={item ? `${item.sku} — ${item.name}` : ""}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? "Saving…" : "Assign to bin"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Zone">
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">—</option>
              {zones.map((z: string) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Aisle">
            <Input
              className="font-loc"
              value={aisle}
              onChange={(e) => setAisle(e.target.value)}
              placeholder="04"
            />
          </Field>
          <Field label="Bin">
            <Input
              className="font-loc"
              value={bin}
              onChange={(e) => setBin(e.target.value)}
              placeholder="12"
            />
          </Field>
        </div>
        <div className="rounded-lg bg-secondary px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">Location code</p>
          <p className="font-loc text-xl font-bold text-foreground">
            {valid ? preview : "—"}
          </p>
        </div>
      </div>
    </Modal>
  );
}

function BoxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}
