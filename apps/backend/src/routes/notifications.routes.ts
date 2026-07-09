import { Router } from "express";
import * as c from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/",          c.listNotifications);
router.patch("/read-all", c.markAllRead);
router.patch("/:id/read", c.markRead);

export default router;
