import { Router } from "express";
import { authMiddleware, deviceAuthMiddleware } from "../middleware/auth.middleware.js";
import * as mobile from "../controllers/mobile.controller.js";
import { authRateLimit, apiRateLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();

/*
 * Routes publiques (sans authentification JWT)
 */

// Activation d'appareil par token cryptographique (NOUVEAU SYSTÈME)
router.post("/device/activate", authRateLimit, mobile.activateDevice);

// Activation par licence legacy
router.post("/activate", authRateLimit, mobile.activateLicense);

/*
 * Routes protégées (JWT requis)
 */

// Configuration VPN pour l'app mobile
router.get("/config", deviceAuthMiddleware, mobile.getMobileConfig);

// Statut de l'abonnement
router.get("/subscription", deviceAuthMiddleware, mobile.getSubscriptionStatus);

// Logs de connexion
router.get("/logs", deviceAuthMiddleware, mobile.getConnectionLogs);
router.post("/logs", deviceAuthMiddleware, mobile.postConnectionLog);

/*
 * Routes de synchronisation (JWT appareil requis)
 */

// Synchronisation des configurations
router.get("/sync", deviceAuthMiddleware, mobile.syncDevice);

// Mise à jour de l'usage
router.post("/usage", deviceAuthMiddleware, mobile.updateDeviceUsage);

export default router;
