import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  fetchOrders,
  fetchItems,
  createOrder,
} from "~/features/wareflow/client";
import type { Order, Item } from "~/features/wareflow/types";
import { locationCode } from "~/features/wareflow/types";
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
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Outbound · WareFlow" }];
}

export default function OutboundPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function refresh() {
    const data = await fetchOrders();
    setOrders(data);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock label="Loading orders…" />;

  const active = orders.filter((o) => o.status !== "dispatched");
  const done = orders.filter((o) => o.status === "dispatched");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Outbound orders</h2>
          <p className="text-sm text-muted-foreground">
            Build orders, pick from known locations, confirm dispatch.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <PlusIcon /> Build order
        </Button>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardIcon />}
          title="No orders yet"
          description="Build an outbound order from items already on the shelf."
          action={<Button onClick={() => setShowCreate(true)}>Build order</Button>}
        />
      ) : (
        <div className="space-y-6">
          <OrderSection title="In flight" orders={active} />
          <OrderSection title="Dispatched" orders={done} />
        </div>
      )}

      <CreateOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={async () => {
          setShowCreate(false);
          await refresh();
          toast.success("Order built. Pick lines from their known locations.");
        }}
      />
    </div>
  );
}

function OrderSection({ title, orders }: { title: string; orders: Order[] }) {
  if (orders.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {orders.length}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {orders.map((o) => {
          const picked = o.lines.filter((l) => l.picked).length;
          const pct = o.lines.length ? Math.round((picked / o.lines.length) * 100) : 0;
          return (
            <Link key={o._id} to={`/outbound/${o._id}`}>
              <Card className="h-full p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-loc text-sm font-bold">{o.reference}</p>
                    <p className="text-xs text-muted-foreground">{o.customer}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {picked}/{o.lines.length} lines picked
                    </span>
                    <span className="font-loc">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        o.status === "dispatched" ? "bg-emerald-500" : "bg-primary",
                      )}
                      style={{ width: `${o.status === "dispatched" ? 100 : pct}%` }}
                    />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Build order modal ─────────────────────────────────────────────────────────
interface DraftLine {
  itemId: string;
  quantity: number;
}

function CreateOrderModal({
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
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [available, setAvailable] = useState<Item[]>([]);
  const [draft, setDraft] = useState<DraftLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingItems(true);
    fetchItems({ status: "stored" })
      .then(setAvailable)
      .finally(() => setLoadingItems(false));
  }, [open]);

  function reset() {
    setReference("");
    setCustomer("");
    setNotes("");
    setDraft([]);
  }

  function toggle(item: Item) {
    setDraft((d) => {
      const exists = d.find((x) => x.itemId === item._id);
      if (exists) return d.filter((x) => x.itemId !== item._id);
      return [...d, { itemId: item._id, quantity: 1 }];
    });
  }

  function setQty(itemId: string, quantity: number) {
    setDraft((d) => d.map((x) => (x.itemId === itemId ? { ...x, quantity } : x)));
  }

  const valid = useMemo(
    () =>
      reference.trim() !== "" &&
      customer.trim() !== "" &&
      draft.length > 0 &&
      draft.every((l) => l.quantity > 0),
    [reference, customer, draft],
  );

  async function submit() {
    if (!valid) return;
    setSaving(true);
    try {
      await createOrder({
        reference: reference.trim(),
        customer: customer.trim(),
        notes: notes.trim(),
        lines: draft.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })),
      });
      reset();
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Build outbound order"
      description="Pick stored items into a new order — each carries its known location."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? "Building…" : "Build order"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reference">
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="OUT-5513"
            />
          </Field>
          <Field label="Customer">
            <Input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Riverside Plant Maintenance"
            />
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Add stored items</p>
          {loadingItems ? (
            <div className="rounded-lg border border-border py-8 text-center text-sm text-muted-foreground">
              Loading shelf…
            </div>
          ) : available.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No stored items available. Assign locations in Storage first.
            </div>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
              {available.map((it) => {
                const sel = draft.find((x) => x.itemId === it._id);
                return (
                  <div
                    key={it._id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2",
                      sel ? "bg-blue-50 ring-1 ring-inset ring-blue-200" : "hover:bg-secondary",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={!!sel}
                      onChange={() => toggle(it)}
                      className="h-4 w-4 accent-[color:var(--primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => toggle(it)}
                      className="flex min-w-0 flex-1 items-center justify-between text-left"
                    >
                      <div className="min-w-0">
                        <p className="font-loc text-sm font-semibold">{it.sku}</p>
                        <p className="truncate text-xs text-muted-foreground">{it.name}</p>
                      </div>
                      <span className="font-loc text-xs font-semibold text-foreground">
                        {locationCode(it.zone, it.aisle, it.bin)}
                      </span>
                    </button>
                    {sel ? (
                      <Input
                        type="number"
                        min={1}
                        value={sel.quantity}
                        onChange={(e) => setQty(it._id, Number(e.target.value))}
                        className="h-9 w-16 font-loc"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Field label="Notes" hint="Optional — priority, carrier, special handling.">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
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
function ClipboardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" />
    </svg>
  );
}
