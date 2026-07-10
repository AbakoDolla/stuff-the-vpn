import { Router } from "express";
import * as c from "../controllers/settings.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();
router.use(authMiddleware);

// Settings - Admin et Super Admin
router.get("/", requirePermission(PERMISSIONS.SETTINGS_VIEW), c.getSettings);
router.post("/", requirePermission(PERMISSIONS.SETTINGS_MANAGE), c.updateSettings);

export default router;
