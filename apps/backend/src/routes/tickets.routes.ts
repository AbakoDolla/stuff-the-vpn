import { Router } from "express";
import * as c from "../controllers/ticket.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/",         c.listTickets);
router.post("/",        c.createTicket);
router.get("/:id",      c.getTicket);
router.post("/:id/reply", c.reply);
router.patch("/:id/close", requireRole("ADMIN","SUPER_ADMIN","SUPPORT"), c.close);

export default router;
