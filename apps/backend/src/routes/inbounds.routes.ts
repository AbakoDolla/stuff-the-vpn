import { Router } from "express";
import * as ctrl from "../controllers/inbound.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

// Public — list active inbounds (mobile app)
router.get("/",     asyncHandler(ctrl.list));
router.get("/:id",  asyncHandler(ctrl.getById));

// Admin only - Inbound management
router.post("/",
  authMiddleware, requirePermission(PERMISSIONS.INBOUNDS_CREATE), asyncHandler(ctrl.create));
router.put("/:id",
  authMiddleware, requirePermission(PERMISSIONS.INBOUNDS_UPDATE), asyncHandler(ctrl.update));
router.delete("/:id",
  authMiddleware, requirePermission(PERMISSIONS.INBOUNDS_DELETE), asyncHandler(ctrl.remove));
router.patch("/:id/stats",
  authMiddleware, requirePermission(PERMISSIONS.INBOUNDS_MANAGE), asyncHandler(ctrl.updateStats));

export default router;
