import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { fetchShipment, checkInShipment } from "~/features/wareflow/client";
import type { Shipment } from "~/features/wareflow/types";
import {
  Button,
  Card,
  LoadingBlock,
} from "~/features/wareflow/components/ui";
import { StatusBadge } from "~/features/wareflow/components/status-badge";
import { useToast } from "~/features/wareflow/components/toast";

export function meta() {
  return [{ title: "Shipment · WareFlow" }];
}

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!id) return;
    const data = await fetchShipment(id);
    setShipment(data);
  }

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [id]); // refresh closes over the same id; intentional reload on id change

  async function handleCheckIn() {
    if (!shipment) return;
    setBusy(true);
    try {
      await checkInShipment(shipment._id);
      await refresh();
      toast.success("Checked in. Items are now awaiting put-away in Storage.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check-in failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingBlock />;
  if (!shipment) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Shipment not found.
        </Card>
      </div>
    );
  }

  const totalUnits = shipment.lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-loc text-2xl font-bold tracking-tight">
              {shipment.reference}
            </h2>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{shipment.supplier}</p>
        </div>
        {shipment.status === "expected" ? (
          <Button onClick={handleCheckIn} disabled={busy}>
            {busy ? "Checking in…" : "Check in at dock"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Lines" value={shipment.lines.length} />
        <Stat label="Total units" value={totalUnits} />
        <Stat
          label="Checked in"
          value={
            shipment.checkedInAt
              ? new Date(shipment.checkedInAt).toLocaleString()
              : "—"
          }
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-bold">Expected contents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">SKU</th>
                <th className="px-5 py-3 font-semibold">Item</th>
                <th className="px-5 py-3 text-right font-semibold">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shipment.lines.map((l, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 font-loc font-semibold">{l.sku}</td>
                  <td className="px-5 py-3 text-foreground">{l.name}</td>
                  <td className="px-5 py-3 text-right font-loc">{l.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {shipment.notes ? (
        <Card className="p-5">
          <h3 className="text-sm font-bold">Notes</h3>
          <p className="mt-1 text-sm text-muted-foreground">{shipment.notes}</p>
        </Card>
      ) : null}

      {shipment.status === "checked_in" ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/50 p-5">
          <p className="text-sm text-foreground">
            Items from this shipment are awaiting put-away. Assign each one a
            location so it never goes missing.
          </p>
          <Link to="/storage">
            <Button variant="secondary">Go to Storage</Button>
          </Link>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-loc text-lg font-bold">{value}</p>
    </Card>
  );
}

function BackLink() {
  return (
    <Link
      to="/inbound"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
      </svg>
      Back to Inbound
    </Link>
  );
}
