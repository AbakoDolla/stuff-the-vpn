import { Router } from "express";
import * as c from "../controllers/payment.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/",    requireRole("ADMIN","SUPER_ADMIN","RESELLER"), c.listPayments);
router.post("/",   requireRole("ADMIN","SUPER_ADMIN"), c.createPayment);
router.patch("/:id/status", requireRole("ADMIN","SUPER_ADMIN"), c.updateStatus);

export default router;
