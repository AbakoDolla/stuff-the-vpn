import { Router } from "express";
import * as vpnController from "../controllers/vpn.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/my-config", vpnController.getMyConfig);
router.get("/servers", vpnController.getServers);
router.get("/recommended", vpnController.getRecommendedServer);
router.get("/config", vpnController.getVpnConfig);
router.get("/status", vpnController.getVpnStatus);
router.post("/connect", vpnController.connectVpn);
router.post("/disconnect", vpnController.disconnectVpn);

export default router;