/**
 * device-vpn-config.routes.ts - SXB VPN
 * Routes pour la gestion des configurations VPN des appareils
 */

import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import * as deviceVpnConfig from "../controllers/device-vpn-config.controller.js";

const router = Router();

// ── Routes Publiques (App Mobile) ──────────────────────────────────────────
router.get("/mobile/device/:deviceId/vpn-configs", deviceVpnConfig.getDeviceVpnConfigs);
router.post("/mobile/device/:deviceId/full-sync", deviceVpnConfig.fullSync);

// ── Routes Admin ───────────────────────────────────────────────────────────
router.post("/admin/device-vpn-config", authenticateAdmin, deviceVpnConfig.assignConfigToDevice);
router.get("/admin/device-vpn-config/:deviceId", authenticateAdmin, deviceVpnConfig.listDeviceConfigs);
router.delete("/admin/device-vpn-config/:configId", authenticateAdmin, deviceVpnConfig.deleteConfig);
router.post("/admin/device-vpn-config/:configId/invalidate", authenticateAdmin, deviceVpnConfig.invalidateConfig);

export default router;
