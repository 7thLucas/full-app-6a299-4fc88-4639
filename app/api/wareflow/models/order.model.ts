import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

/**
 * Order — an outbound order to fulfill. Supervisors build the order, pick each
 * line from its known storage location, then confirm dispatch.
 *
 * status lifecycle:
 *   open        → built, nothing picked yet
 *   picking     → at least one line picked, not all
 *   ready       → all lines picked, awaiting dispatch confirmation
 *   dispatched  → confirmed out the door
 *
 * Each line references a stored Item by id and captures the location it was
 * picked from, so the pick path is always known.
 */
@modelOptions({
  schemaOptions: {
    collection: "tbl_wf_orders",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Order extends CommonTypegooseEntity {
  @prop({ type: String, required: true })
  reference!: string;

  @prop({ type: String, required: true })
  customer!: string;

  @prop({ type: String, required: true, default: "open" })
  status!: "open" | "picking" | "ready" | "dispatched";

  @prop({ type: Date, required: false, default: null })
  dispatchedAt?: Date | null;

  // Order lines reference an Item and remember where it was picked from.
  @prop({ type: () => [Object], required: true, default: [] })
  lines!: Array<{
    itemId: string;
    sku: string;
    name: string;
    quantity: number;
    location: string; // human-readable location code at pick time
    picked: boolean;
  }>;

  @prop({ type: String, required: false, default: "" })
  notes?: string;
}

export const OrderModel = getModelForClass(Order);
