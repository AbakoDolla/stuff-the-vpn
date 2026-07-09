import { Router } from "express";
import * as c from "../controllers/settings.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);
router.use(requireRole("ADMIN","SUPER_ADMIN"));

router.get("/",  c.getSettings);
router.post("/", c.updateSettings);

export default router;
