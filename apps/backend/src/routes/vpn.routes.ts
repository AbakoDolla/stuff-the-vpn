import { Router } from "express";
import * as vpnController from "../controllers/vpn.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/my-config", vpnController.getMyConfig);

export default router;
