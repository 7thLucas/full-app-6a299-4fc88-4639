import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  fetchShipments,
  createShipment,
  checkInShipment,
} from "~/features/wareflow/client";
import type { Shipment, ShipmentLine } from "~/features/wareflow/types";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Textarea,
  Modal,
  LoadingBlock,
} from "~/features/wareflow/components/ui";
import { StatusBadge } from "~/features/wareflow/components/status-badge";
import { useToast } from "~/features/wareflow/components/toast";

export function meta() {
  return [{ title: "Inbound · WareFlow" }];
}

export default function InboundPage() {
  const toast = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const data = await fetchShipments();
    setShipments(data);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function handleCheckIn(s: Shipment) {
    setBusyId(s._id);
    try {
      await checkInShipment(s._id);
      await refresh();
      const units = s.lines.reduce((n, l) => n + 1, 0);
      toast.success(`${s.reference} checked in — ${units} item type(s) now awaiting put-away.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check-in failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingBlock label="Loading shipments…" />;

  const expected = shipments.filter((s) => s.status === "expected");
  const checkedIn = shipments.filter((s) => s.status === "checked_in");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Inbound shipments</h2>
          <p className="text-sm text-muted-foreground">
            Log arrivals and check them in at the dock.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <PlusIcon /> Log shipment
        </Button>
      </div>

      {shipments.length === 0 ? (
        <EmptyState
          icon={<TruckIcon />}
          title="No shipments yet"
          description="Log an expected arrival to start tracking it from the dock."
          action={<Button onClick={() => setShowCreate(true)}>Log shipment</Button>}
        />
      ) : (
        <div className="space-y-6">
          <Section title="Expected at the dock" count={expected.length}>
            <ShipmentTable
              shipments={expected}
              busyId={busyId}
              onCheckIn={handleCheckIn}
            />
          </Section>
          <Section title="Checked in" count={checkedIn.length}>
            <ShipmentTable shipments={checkedIn} busyId={busyId} onCheckIn={handleCheckIn} />
          </Section>
        </div>
      )}

      <CreateShipmentModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={async () => {
          setShowCreate(false);
          await refresh();
          toast.success("Shipment logged. Check it in when it arrives.");
        }}
      />
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function ShipmentTable({
  shipments,
  busyId,
  onCheckIn,
}: {
  shipments: Shipment[];
  busyId: string | null;
  onCheckIn: (s: Shipment) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Supplier</th>
              <th className="px-4 py-3 font-semibold">Lines</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shipments.map((s) => (
              <tr key={s._id} className="hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <Link to={`/inbound/${s._id}`} className="font-loc font-semibold text-primary hover:underline">
                    {s.reference}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground">{s.supplier}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {s.lines.length} line{s.lines.length === 1 ? "" : "s"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {s.status === "expected" ? (
                    <Button
                      size="md"
                      onClick={() => onCheckIn(s)}
                      disabled={busyId === s._id}
                    >
                      {busyId === s._id ? "Checking in…" : "Check in"}
                    </Button>
                  ) : (
                    <Link
                      to={`/inbound/${s._id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Create shipment modal ─────────────────────────────────────────────────────
function CreateShipmentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [reference, setReference] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<ShipmentLine[]>([
    { sku: "", name: "", quantity: 1 },
  ]);
  const [saving, setSaving] = useState(false);

  function reset() {
    setReference("");
    setSupplier("");
    setNotes("");
    setLines([{ sku: "", name: "", quantity: 1 }]);
  }

  const valid = useMemo(() => {
    if (!reference.trim() || !supplier.trim()) return false;
    return lines.every((l) => l.sku.trim() && l.name.trim() && l.quantity > 0);
  }, [reference, supplier, lines]);

  function updateLine(idx: number, patch: Partial<ShipmentLine>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  async function submit() {
    if (!valid) return;
    setSaving(true);
    try {
      await createShipment({
        reference: reference.trim(),
        supplier: supplier.trim(),
        notes: notes.trim(),
        lines: lines.map((l) => ({
          sku: l.sku.trim(),
          name: l.name.trim(),
          quantity: Number(l.quantity),
        })),
      });
      reset();
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log shipment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Log shipment"
      description="Record an expected arrival and its contents."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? "Saving…" : "Log shipment"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reference" htmlFor="ref">
            <Input
              id="ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="INB-2042"
            />
          </Field>
          <Field label="Supplier" htmlFor="sup">
            <Input
              id="sup"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Northwind Supply Co."
            />
          </Field>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-semibold">Expected contents</span>
            <button
              type="button"
              onClick={() => setLines((ls) => [...ls, { sku: "", name: "", quantity: 1 }])}
              className="text-sm font-semibold text-primary hover:underline"
            >
              + Add line
            </button>
          </div>
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 items-center gap-2">
                <Input
                  className="col-span-3 font-loc"
                  placeholder="SKU"
                  value={line.sku}
                  onChange={(e) => updateLine(idx, { sku: e.target.value })}
                />
                <Input
                  className="col-span-6"
                  placeholder="Item name"
                  value={line.name}
                  onChange={(e) => updateLine(idx, { name: e.target.value })}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(idx, { quantity: Number(e.target.value) })
                  }
                />
                <button
                  type="button"
                  className="col-span-1 flex h-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30"
                  disabled={lines.length === 1}
                  onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}
                  aria-label="Remove line"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Notes" htmlFor="notes" hint="Optional — dock, ETA, anything the floor should know.">
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ETA 14:00. Dock 3."
          />
        </Field>
      </div>
    </Modal>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
    </svg>
  );
}
