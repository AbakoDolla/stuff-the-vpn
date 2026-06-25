import { Router } from "express";
import * as inboundController from "../controllers/inbound.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createInboundSchema, updateInboundSchema } from "../validators/inbound.validator.js";

const router = Router();

router.use(authMiddleware);

// All authenticated users can view inbounds
router.get("/", inboundController.listInbounds);
router.get("/:id", inboundController.getInboundById);

// Admin only
router.post(
  "/",
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(createInboundSchema),
  inboundController.createInbound,
);
router.patch(
  "/:id",
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(updateInboundSchema),
  inboundController.updateInbound,
);
router.delete(
  "/:id",
  requireRole("ADMIN", "SUPER_ADMIN"),
  inboundController.deleteInbound,
);

export default router;
