import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  fetchOrder,
  pickOrderLine,
  confirmDispatch,
} from "~/features/wareflow/client";
import type { Order } from "~/features/wareflow/types";
import {
  Button,
  Card,
  LoadingBlock,
} from "~/features/wareflow/components/ui";
import { StatusBadge } from "~/features/wareflow/components/status-badge";
import { useToast } from "~/features/wareflow/components/toast";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Order · WareFlow" }];
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  async function refresh() {
    if (!id) return;
    setOrder(await fetchOrder(id));
  }

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [id]); // refresh closes over the same id; intentional reload on id change

  async function handlePick(itemId: string) {
    if (!order) return;
    setPickingId(itemId);
    try {
      const updated = await pickOrderLine(order._id, itemId);
      setOrder(updated);
      toast.success("Line picked.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not pick line.");
    } finally {
      setPickingId(null);
    }
  }

  async function handleDispatch() {
    if (!order) return;
    setDispatching(true);
    try {
      const updated = await confirmDispatch(order._id);
      setOrder(updated);
      toast.success(`${order.reference} dispatched. Out the door.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm dispatch.");
    } finally {
      setDispatching(false);
    }
  }

  if (loading) return <LoadingBlock />;
  if (!order) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Order not found.
        </Card>
      </div>
    );
  }

  const pickedCount = order.lines.filter((l) => l.picked).length;
  const allPicked = order.lines.length > 0 && pickedCount === order.lines.length;
  const isDispatched = order.status === "dispatched";

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-loc text-2xl font-bold tracking-tight">
              {order.reference}
            </h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{order.customer}</p>
        </div>
        {!isDispatched ? (
          <Button
            variant="success"
            onClick={handleDispatch}
            disabled={!allPicked || dispatching}
            title={!allPicked ? "Pick every line first" : undefined}
          >
            {dispatching ? "Dispatching…" : "Confirm dispatch"}
          </Button>
        ) : null}
      </div>

      {/* Progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Pick progress</span>
          <span className="font-loc text-muted-foreground">
            {pickedCount}/{order.lines.length} picked
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isDispatched ? "bg-emerald-500" : "bg-primary",
            )}
            style={{
              width: `${order.lines.length ? (pickedCount / order.lines.length) * 100 : 0}%`,
            }}
          />
        </div>
        {!isDispatched && !allPicked ? (
          <p className="mt-3 text-xs text-amber-600">
            Pick every line from its location before you can confirm dispatch.
          </p>
        ) : null}
        {!isDispatched && allPicked ? (
          <p className="mt-3 text-xs text-emerald-600">
            All lines picked. Ready to confirm dispatch.
          </p>
        ) : null}
      </Card>

      {/* Pick list */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-bold">Pick list</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">SKU</th>
                <th className="px-5 py-3 font-semibold">Item</th>
                <th className="px-5 py-3 font-semibold">Qty</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 text-right font-semibold">Pick</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {order.lines.map((l) => (
                <tr key={l.itemId} className={cn(l.picked && "bg-emerald-50/40")}>
                  <td className="px-5 py-3 font-loc font-semibold">{l.sku}</td>
                  <td className="px-5 py-3 text-foreground">{l.name}</td>
                  <td className="px-5 py-3 font-loc text-muted-foreground">{l.quantity}</td>
                  <td className="px-5 py-3">
                    <span className="font-loc font-semibold text-foreground">
                      {l.location}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {l.picked ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                        <CheckIcon /> Picked
                      </span>
                    ) : isDispatched ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <Button
                        onClick={() => handlePick(l.itemId)}
                        disabled={pickingId === l.itemId}
                      >
                        {pickingId === l.itemId ? "Picking…" : "Pick"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {order.notes ? (
        <Card className="p-5">
          <h3 className="text-sm font-bold">Notes</h3>
          <p className="mt-1 text-sm text-muted-foreground">{order.notes}</p>
        </Card>
      ) : null}

      {isDispatched && order.dispatchedAt ? (
        <Card className="bg-emerald-50/50 p-5">
          <p className="text-sm text-emerald-800">
            Dispatched {new Date(order.dispatchedAt).toLocaleString()}. Every item
            left with a known location on record.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function BackLink() {
  return (
    <Link
      to="/outbound"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
      </svg>
      Back to Outbound
    </Link>
  );
}
