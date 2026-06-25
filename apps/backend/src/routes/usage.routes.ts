import { Router } from "express";
import * as usageController from "../controllers/usage.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requireRole("ADMIN", "SUPER_ADMIN"), usageController.listUsage);
router.get("/:userId", usageController.getUserUsage);

export default router;
