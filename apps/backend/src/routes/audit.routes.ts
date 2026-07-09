import { Router } from "express";
import * as c from "../controllers/audit.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);
router.use(requireRole("ADMIN","SUPER_ADMIN"));

router.get("/", c.listLogs);

export default router;
