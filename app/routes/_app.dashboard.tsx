import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchDashboard, fetchOrders, fetchItems } from "~/features/wareflow/client";
import type { DashboardSummary, Order, Item } from "~/features/wareflow/types";
import { locationCode } from "~/features/wareflow/types";
import { Card, LoadingBlock } from "~/features/wareflow/components/ui";
import { StatusBadge } from "~/features/wareflow/components/status-badge";
import { useConfigurables } from "~/modules/configurables";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Dashboard · WareFlow" }];
}

export default function DashboardPage() {
  const { config } = useConfigurables();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [awaiting, setAwaiting] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchDashboard(),
      fetchOrders(),
      fetchItems({ status: "awaiting_putaway" }),
    ])
      .then(([s, o, a]) => {
        if (!active) return;
        setSummary(s);
        setOrders(o);
        setAwaiting(a);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const supervisor =
    config?.supervisorName && !config.supervisorName.startsWith("FILL_")
      ? config.supervisorName
      : "Supervisor";

  if (loading) return <LoadingBlock label="Loading the floor…" />;

  const openOrders = orders.filter((o) => o.status !== "dispatched").slice(0, 5);

  const stats = [
    {
      label: "Shipments expected",
      value: summary?.shipmentsExpected ?? 0,
      to: "/inbound",
      tone: "amber",
    },
    {
      label: "Awaiting put-away",
      value: summary?.awaitingPutaway ?? 0,
      to: "/storage",
      tone: "amber",
    },
    {
      label: "Items stored",
      value: summary?.storedItems ?? 0,
      to: "/storage",
      tone: "blue",
    },
    {
      label: "Open orders",
      value: summary?.openOrders ?? 0,
      to: "/outbound",
      tone: "blue",
    },
    {
      label: "Dispatched today",
      value: summary?.dispatchedToday ?? 0,
      to: "/outbound",
      tone: "green",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Good shift, {supervisor}.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is where every item stands right now — dock to truck.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="h-full p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2">
                <span
                  className={cn("h-2 w-2 rounded-full", {
                    "bg-amber-500": s.tone === "amber",
                    "bg-blue-500": s.tone === "blue",
                    "bg-emerald-500": s.tone === "green",
                  })}
                />
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
              <p className="mt-2 font-loc text-3xl font-bold tracking-tight">
                {s.value}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders in flight */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Orders in flight</h3>
            <Link to="/outbound" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {openOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No open orders. The floor is clear.
              </p>
            ) : (
              openOrders.map((o) => {
                const picked = o.lines.filter((l) => l.picked).length;
                return (
                  <Link
                    key={o._id}
                    to={`/outbound/${o._id}`}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-secondary"
                  >
                    <div>
                      <p className="font-loc text-sm font-semibold">{o.reference}</p>
                      <p className="text-xs text-muted-foreground">{o.customer}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {picked}/{o.lines.length} picked
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        {/* Awaiting put-away — the misplaced-inventory guardrail */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Awaiting put-away</h3>
            <Link to="/storage" className="text-sm font-semibold text-primary hover:underline">
              Assign locations
            </Link>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Items checked in but not yet shelved. Assign a location before they go missing.
          </p>
          <div className="mt-4 space-y-2">
            {awaiting.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing waiting. Every item has a home.
              </p>
            ) : (
              awaiting.slice(0, 5).map((item) => (
                <Link
                  key={item._id}
                  to="/storage"
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-secondary"
                >
                  <div>
                    <p className="font-loc text-sm font-semibold">{item.sku}</p>
                    <p className="text-xs text-muted-foreground">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-loc text-xs text-muted-foreground">
                      {locationCode(item.zone, item.aisle, item.bin)}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
