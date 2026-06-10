import { Router, type Request, type Response } from "express";
import { createLogger } from "~/lib/logger";
import {
  ShipmentService,
  ItemService,
  OrderService,
  DashboardService,
} from "./wareflow.service";

const logger = createLogger("WareflowApi");
const router = Router();

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function ok(res: Response, data: unknown) {
  return res.json({ success: true, data });
}
function fail(res: Response, message: string, status = 400) {
  return res.status(status).json({ success: false, message });
}
function handle(res: Response, err: unknown, context: string) {
  logger.error(`${context} failed`, err);
  return fail(res, "Something went wrong on the floor. Try again.", 500);
}

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get("/wareflow/dashboard", async (_req: Request, res: Response) => {
  try {
    return ok(res, await DashboardService.summary());
  } catch (err) {
    return handle(res, err, "dashboard.summary");
  }
});

// ── Inbound shipments ────────────────────────────────────────────────────────
router.get("/wareflow/shipments", async (_req: Request, res: Response) => {
  try {
    return ok(res, await ShipmentService.list());
  } catch (err) {
    return handle(res, err, "shipments.list");
  }
});

router.get("/wareflow/shipments/:id", async (req: Request, res: Response) => {
  try {
    const shipment = await ShipmentService.get(param(req.params.id));
    if (!shipment) return fail(res, "Shipment not found.", 404);
    return ok(res, shipment);
  } catch (err) {
    return handle(res, err, "shipments.get");
  }
});

router.post("/wareflow/shipments", async (req: Request, res: Response) => {
  try {
    const { reference, supplier, lines, notes } = req.body ?? {};
    if (!reference || !supplier) return fail(res, "Reference and supplier are required.");
    const shipment = await ShipmentService.create({ reference, supplier, lines, notes });
    return ok(res, shipment);
  } catch (err) {
    return handle(res, err, "shipments.create");
  }
});

router.post("/wareflow/shipments/:id/check-in", async (req: Request, res: Response) => {
  try {
    const shipment = await ShipmentService.checkIn(param(req.params.id));
    if (!shipment) return fail(res, "Shipment not found.", 404);
    return ok(res, shipment);
  } catch (err) {
    return handle(res, err, "shipments.checkIn");
  }
});

// ── Storage / items ──────────────────────────────────────────────────────────
router.get("/wareflow/items", async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    return ok(res, await ItemService.list({ status, q }));
  } catch (err) {
    return handle(res, err, "items.list");
  }
});

router.get("/wareflow/items/:id", async (req: Request, res: Response) => {
  try {
    const item = await ItemService.get(param(req.params.id));
    if (!item) return fail(res, "Item not found.", 404);
    return ok(res, item);
  } catch (err) {
    return handle(res, err, "items.get");
  }
});

router.post("/wareflow/items/:id/assign", async (req: Request, res: Response) => {
  try {
    const { zone, aisle, bin } = req.body ?? {};
    const item = await ItemService.assignLocation(param(req.params.id), { zone, aisle, bin });
    if (!item) return fail(res, "Item not found.", 404);
    return ok(res, item);
  } catch (err) {
    return handle(res, err, "items.assign");
  }
});

// ── Outbound orders ───────────────────────────────────────────────────────────
router.get("/wareflow/orders", async (_req: Request, res: Response) => {
  try {
    return ok(res, await OrderService.list());
  } catch (err) {
    return handle(res, err, "orders.list");
  }
});

router.get("/wareflow/orders/:id", async (req: Request, res: Response) => {
  try {
    const order = await OrderService.get(param(req.params.id));
    if (!order) return fail(res, "Order not found.", 404);
    return ok(res, order);
  } catch (err) {
    return handle(res, err, "orders.get");
  }
});

router.post("/wareflow/orders", async (req: Request, res: Response) => {
  try {
    const { reference, customer, lines, notes } = req.body ?? {};
    if (!reference || !customer) return fail(res, "Reference and customer are required.");
    const order = await OrderService.create({ reference, customer, lines, notes });
    return ok(res, order);
  } catch (err) {
    return handle(res, err, "orders.create");
  }
});

router.post("/wareflow/orders/:id/pick", async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body ?? {};
    if (!itemId) return fail(res, "itemId is required.");
    const order = await OrderService.pickLine(param(req.params.id), itemId);
    if (!order) return fail(res, "Order not found.", 404);
    return ok(res, order);
  } catch (err) {
    return handle(res, err, "orders.pick");
  }
});

router.post("/wareflow/orders/:id/dispatch", async (req: Request, res: Response) => {
  try {
    const result = await OrderService.confirmDispatch(param(req.params.id));
    if (!result) return fail(res, "Order not found.", 404);
    if ("error" in result) return fail(res, result.error);
    return ok(res, result);
  } catch (err) {
    return handle(res, err, "orders.dispatch");
  }
});

export default router;
