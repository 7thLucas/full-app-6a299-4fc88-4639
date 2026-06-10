import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

/**
 * Shipment — an inbound delivery arriving at the dock. Supervisors log the
 * shipment, record its expected contents, then check items in (which creates
 * Item records in awaiting_putaway status).
 *
 * status lifecycle:
 *   expected    → logged, not yet arrived
 *   checked_in  → received at the dock, items created and awaiting put-away
 */
@modelOptions({
  schemaOptions: {
    collection: "tbl_wf_shipments",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Shipment extends CommonTypegooseEntity {
  @prop({ type: String, required: true })
  reference!: string;

  @prop({ type: String, required: true })
  supplier!: string;

  @prop({ type: String, required: true, default: "expected" })
  status!: "expected" | "checked_in";

  @prop({ type: Date, required: false, default: null })
  checkedInAt?: Date | null;

  // Expected contents declared when the shipment is logged.
  @prop({ type: () => [Object], required: true, default: [] })
  lines!: Array<{ sku: string; name: string; quantity: number }>;

  @prop({ type: String, required: false, default: "" })
  notes?: string;
}

export const ShipmentModel = getModelForClass(Shipment);
