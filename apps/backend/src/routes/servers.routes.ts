import { Router } from "express";
import * as c from "../controllers/server.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

// Public (any auth) — list enabled servers for mobile app
router.get("/", c.listServers);
router.get("/:id", c.getServer);

// Admin only
router.post("/",         requireRole("ADMIN","SUPER_ADMIN"), c.createServer);
router.put("/:id",       requireRole("ADMIN","SUPER_ADMIN"), c.updateServer);
router.delete("/:id",    requireRole("ADMIN","SUPER_ADMIN"), c.deleteServer);
router.post("/:id/ping", requireRole("ADMIN","SUPER_ADMIN"), c.pingServer);

export default router;
