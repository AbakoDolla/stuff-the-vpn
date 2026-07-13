/**
 * device-vpn-config.routes.ts - SXB VPN
 * Routes pour la gestion des configurations VPN des appareils
 */

import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import * as deviceVpnConfig from "../controllers/device-vpn-config.controller.js";

const router = Router();

// ── Routes Publiques (App Mobile) ──────────────────────────────────────────
router.get("/:deviceId/vpn-configs", deviceVpnConfig.getDeviceVpnConfigs);
router.post("/:deviceId/full-sync", deviceVpnConfig.fullSync);

// ── Routes Admin ───────────────────────────────────────────────────────────
router.post("/admin", authenticateAdmin, deviceVpnConfig.assignConfigToDevice);
router.get("/admin/:deviceId", authenticateAdmin, deviceVpnConfig.listDeviceConfigs);
router.delete("/:configId", authenticateAdmin, deviceVpnConfig.deleteConfig);
router.post("/:configId/invalidate", authenticateAdmin, deviceVpnConfig.invalidateConfig);

export default router;
