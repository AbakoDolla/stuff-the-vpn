import { Router } from "express";
import * as ctrl from "../controllers/inbound.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// Public — list active inbounds (mobile app)
router.get("/",     asyncHandler(ctrl.list));
router.get("/:id",  asyncHandler(ctrl.getById));

// Admin only
router.post("/",
  authMiddleware, requireRole("ADMIN","SUPER_ADMIN"), asyncHandler(ctrl.create));
router.put("/:id",
  authMiddleware, requireRole("ADMIN","SUPER_ADMIN"), asyncHandler(ctrl.update));
router.delete("/:id",
  authMiddleware, requireRole("ADMIN","SUPER_ADMIN"), asyncHandler(ctrl.remove));
router.patch("/:id/stats",
  authMiddleware, requireRole("ADMIN","SUPER_ADMIN"), asyncHandler(ctrl.updateStats));

export default router;
