import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as mobile from "../controllers/mobile.controller.js";
import { authRateLimit, apiRateLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();

/*
 * Routes publiques — pas de JWT requis
 */

// Activation par token cryptographique (nouveau système)
router.post("/device/activate", authRateLimit, mobile.activateDevice);

// Alias: ancienne APK appelle /mobile/activate, on redirige vers activateDevice
router.post("/activate",        authRateLimit, mobile.activateDevice);

// Activation par licence (système legacy, utilisé par l'app Flutter)
router.post("/activate-license", authRateLimit, mobile.activateLicense);

/*
 * Routes protégées — JWT utilisateur standard requis
 * (authMiddleware accepte les sessions créées par activateLicense)
 */

// Configuration VPN pour l'app mobile
router.get("/config",        authMiddleware, mobile.getMobileConfig);

// Statut de l'abonnement
router.get("/subscription",  authMiddleware, mobile.getSubscriptionStatus);

// Logs de connexion
router.get("/logs",          authMiddleware, mobile.getConnectionLogs);
router.post("/logs",         authMiddleware, mobile.postConnectionLog);

// Synchronisation
router.get("/sync",          authMiddleware, mobile.syncDevice);

// Mise à jour de l'usage
router.post("/usage",        authMiddleware, mobile.updateDeviceUsage);

export default router;
