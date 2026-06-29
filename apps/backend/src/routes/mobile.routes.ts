import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as mobile from "../controllers/mobile.controller.js";
import { authRateLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();

// Public: activate license → get JWT
router.post("/activate", authRateLimit, mobile.activateLicense);

// Protected: mobile app config & logs
router.get( "/config",       authMiddleware, mobile.getMobileConfig);
router.get( "/subscription", authMiddleware, mobile.getSubscriptionStatus);
router.get( "/logs",         authMiddleware, mobile.getConnectionLogs);
router.post("/logs",         authMiddleware, mobile.postConnectionLog);

export default router;
