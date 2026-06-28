import { Router } from "express";
import * as c from "../controllers/api-key.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);
router.use(requireRole("ADMIN","SUPER_ADMIN"));

router.get("/",        c.listKeys);
router.post("/",       c.createKey);
router.delete("/:id",  c.revokeKey);

export default router;
