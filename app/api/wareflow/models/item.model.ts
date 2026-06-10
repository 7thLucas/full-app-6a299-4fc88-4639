import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

/**
 * Item — the heart of WareFlow. Every item carries a known location at every
 * step of the flow. An item is created when a shipment is checked in, then it
 * lives at a storage location until it is picked and dispatched on an order.
 *
 * status lifecycle:
 *   awaiting_putaway  → checked in at the dock, not yet shelved (location == null)
 *   stored            → assigned a slot/bin/zone, available to pick
 *   picked            → reserved/picked for an outbound order
 *   dispatched        → shipped out, no longer in the building
 */
@modelOptions({
  schemaOptions: {
    collection: "tbl_wf_items",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Item extends CommonTypegooseEntity {
  @prop({ type: String, required: true })
  sku!: string;

  @prop({ type: String, required: true })
  name!: string;

  @prop({ type: Number, required: true, default: 0 })
  quantity!: number;

  @prop({ type: String, required: true, default: "awaiting_putaway" })
  status!: "awaiting_putaway" | "stored" | "picked" | "dispatched";

  // Known location — the sacred field. Null only while awaiting put-away.
  @prop({ type: String, required: false, default: null })
  zone?: string | null;

  @prop({ type: String, required: false, default: null })
  aisle?: string | null;

  @prop({ type: String, required: false, default: null })
  bin?: string | null;

  // Provenance + destination linkage (string ids of shipment / order)
  @prop({ type: String, required: false, default: null })
  shipmentId?: string | null;

  @prop({ type: String, required: false, default: null })
  orderId?: string | null;

  @prop({ type: String, required: false, default: "" })
  notes?: string;
}

export const ItemModel = getModelForClass(Item);
