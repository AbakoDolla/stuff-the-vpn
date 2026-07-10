import { Router } from "express";
import * as c from "../controllers/server.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();
router.use(authMiddleware);

// Public (any auth) — list enabled servers for mobile app
router.get("/", c.listServers);
router.get("/:id", c.getServer);

// Admin only - Server management
router.post("/", requirePermission(PERMISSIONS.SERVERS_CREATE), c.createServer);
router.put("/:id", requirePermission(PERMISSIONS.SERVERS_UPDATE), c.updateServer);
router.delete("/:id", requirePermission(PERMISSIONS.SERVERS_DELETE), c.deleteServer);
router.post("/:id/ping", requirePermission(PERMISSIONS.SERVERS_MANAGE), c.pingServer);

export default router;
