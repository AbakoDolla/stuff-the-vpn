/**
 * sxb.routes.ts - SXB VPN
 * Routes pour les tokens SXB et l'import de configuration VPN
 */

import { Router } from "express";
import * as sxb from "../controllers/sxb.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { apiRateLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();

/*
 * Routes publiques — pas de JWT requis
 */

// Vérifier le statut d'un token (public)
router.get("/status/:token", sxb.checkStatus);

// Récupérer la configuration d'un token (protégé)
router.get("/config/:token", sxb.getConfig);

// Importer un token et récupérer la configuration (protégé)
router.post("/import", apiRateLimit, sxb.importToken);

// Mettre à jour l'usage d'un token
router.post("/usage", sxb.updateUsage);

/*
 * Routes admin — JWT requis
 */

// Générer un nouveau token SXB (admin only)
router.post("/generate", authMiddleware, requireRole("ADMIN", "SUPER_ADMIN"), sxb.generateToken);

export default router;
