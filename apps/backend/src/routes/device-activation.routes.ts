/**
 * device-activation.routes.ts - SXB VPN
 * Routes pour l'activation simple des appareils mobiles
 */

import { Router } from "express";
import * as activation from "../controllers/device-activation.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// ── Routes publiques (App Mobile) ──────────────────────────────────────

// Enregistrer un nouvel appareil
router.post("/register", activation.registerDevice);

// Vérifier le statut d'activation
router.get("/:deviceId/status", activation.getDeviceStatus);

// Synchroniser l'appareil et mettre à jour l'usage
router.post("/:deviceId/sync", activation.syncDevice);

// Notifier une connexion
router.post("/:deviceId/connect", activation.notifyConnection);

// ── Routes Admin (Dashboard) ────────────────────────────────────────────

// Liste des appareils (tous statuts)
router.get("/", authenticateAdmin, activation.getPendingDevices);

// Créer un appareil et générer un code d'activation
router.post("/", authenticateAdmin, activation.createDevice);

// Détails d'un appareil
router.get("/:deviceId", authenticateAdmin, activation.getDeviceDetails);

// Générer un nouveau code d'activation
router.post("/:deviceId/code", authenticateAdmin, activation.generateActivationCode);

// Approuver un appareil
router.post("/:deviceId/approve", authenticateAdmin, activation.approveDevice);

// Rejeter un appareil
router.post("/:deviceId/reject", authenticateAdmin, activation.rejectDevice);

// Mettre à jour le quota
router.patch("/:deviceId/quota", authenticateAdmin, activation.updateDeviceQuota);

// Révoquer l'accès
router.post("/:deviceId/revoke", authenticateAdmin, activation.revokeDevice);

// Suspendre un appareil
router.post("/:deviceId/suspend", authenticateAdmin, activation.suspendDevice);

// Réactiver un appareil
router.post("/:deviceId/reactivate", authenticateAdmin, activation.reactivateDevice);

// Supprimer un appareil
router.delete("/:deviceId", authenticateAdmin, activation.deleteDevice);

export default router;
