/**
 * device-activation.controller.ts - SXB VPN
 * Système d'activation simple pour l'application mobile Android
 * 
 * Flux:
 * 1. App génère un deviceId et s'enregistre -> reçoit un code d'activation
 * 2. Admin voit les appareils en attente dans le dashboard
 * 3. Admin approuve l'appareil et définit le quota/config
 * 4. App vérifie si elle est approuvée et récupère le token
 * 5. App stocke le token et peut se connecter
 */

import type { Request, Response, NextFunction } from "express";
import { sign } from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../prisma/client.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { audit } from "../lib/audit.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";

// ── Schemas ──────────────────────────────────────────────────────────────

const RegisterDeviceSchema = z.object({
  deviceId:     z.string().min(1),
  deviceName:   z.string().optional(),
  brand:        z.string().optional(),
  model:        z.string().optional(),
  osVersion:    z.string().optional(),
  appVersion:   z.string().optional(),
  androidId:    z.string().optional(),
  fingerprint:  z.string().optional(),
  publicIp:     z.string().optional(),
  country:      z.string().optional(),
});

const ApproveDeviceSchema = z.object({
  quotaMB:        z.number().int().min(0).optional(), // 0 = illimité
  vpnConfig:      z.string().optional(), // Config JSON cryptée
  expiresInDays:  z.number().int().min(1).optional(), // Jours jusqu'à expiration
});

const UpdateQuotaSchema = z.object({
  quotaMB: z.number().int().min(0),
  vpnConfig: z.string().optional(),
});

const UpdateUsageSchema = z.object({
  uploadMB:   z.number().min(0).optional(),
  downloadMB: z.number().min(0).optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────

function generateActivationCode(): string {
  // Génère un code à 6 chiffres
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateAccessToken(deviceId: string, expiresAt: Date): string {
  const jwtSecret = process.env["JWT_SECRET"] || "your-secret-key";
  return sign(
    { deviceId, type: "device_access" },
    jwtSecret,
    { expiresIn: "30d" }
  );
}

// ── Endpoints Publics (App Mobile) ──────────────────────────────────────

/**
 * POST /mobile/device/register
 * Enregistre un nouvel appareil et retourne un code d'activation
 */
export async function registerDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = RegisterDeviceSchema.parse(req.body);

    // Vérifier si l'appareil existe déjà
    let activation = await prisma.deviceActivation.findUnique({
      where: { deviceId: parsed.deviceId },
    });

    if (activation) {
      // Si déjà approuvé, retourner le code existant
      if (activation.status === "ACTIVE" && activation.accessToken) {
        return sendSuccess(res, {
          deviceId: parsed.deviceId,
          activationCode: activation.activationCode,
          status: activation.status,
          message: "Appareil déjà activé",
          needsApproval: false,
        }, "Appareil déjà enregistré");
      }
      
      // Sinon générer un nouveau code
      const newCode = generateActivationCode();
      activation = await prisma.deviceActivation.update({
        where: { deviceId: parsed.deviceId },
        data: {
          activationCode: newCode,
          deviceName: parsed.deviceName ?? activation.deviceName,
          brand: parsed.brand ?? activation.brand,
          model: parsed.model ?? activation.model,
          osVersion: parsed.osVersion ?? activation.osVersion,
          appVersion: parsed.appVersion ?? activation.appVersion,
          androidId: parsed.androidId ?? activation.androidId,
          fingerprint: parsed.fingerprint ?? activation.fingerprint,
          publicIp: parsed.publicIp ?? activation.publicIp,
          country: parsed.country ?? activation.country,
          status: "PENDING",
        },
      });
    } else {
      // Créer une nouvelle activation
      const activationCode = generateActivationCode();
      activation = await prisma.deviceActivation.create({
        data: {
          deviceId: parsed.deviceId,
          deviceName: parsed.deviceName,
          brand: parsed.brand,
          model: parsed.model,
          osVersion: parsed.osVersion,
          appVersion: parsed.appVersion,
          androidId: parsed.androidId,
          fingerprint: parsed.fingerprint,
          publicIp: parsed.publicIp,
          country: parsed.country,
          activationCode,
          status: "PENDING",
        },
      });
    }

    await audit({
      action: "DEVICE_REGISTER",
      req,
      details: { deviceId: parsed.deviceId, deviceName: parsed.deviceName },
    });

    sendSuccess(res, {
      deviceId: parsed.deviceId,
      activationCode: activation.activationCode,
      status: activation.status,
      needsApproval: activation.status === "PENDING",
      message: activation.status === "PENDING" 
        ? "Enregistrez ce code dans le dashboard pour activer l'appareil"
        : "Appareil déjà actif",
    }, "Appareil enregistré");

  } catch (err) { next(err); }
}

/**
 * GET /mobile/device/:deviceId/status
 * Vérifie le statut d'activation d'un appareil
 */
export async function getDeviceStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;

    const activation = await prisma.deviceActivation.findUnique({
      where: { deviceId },
    });

    if (!activation) {
      return sendError(res, "Appareil non trouvé", HTTP_STATUS.NOT_FOUND);
    }

    // Si approuvé et token disponible
    if (activation.status === "ACTIVE" && activation.accessToken) {
      const isExpired = activation.tokenExpiresAt && activation.tokenExpiresAt < new Date();
      
      if (isExpired) {
        return sendSuccess(res, {
          status: "EXPIRED",
          needsApproval: true,
          message: "Token expiré. Veuillez contacter l'administrateur.",
        }, "Token expiré");
      }

      // Retourner le token et la config
      return sendSuccess(res, {
        status: "ACTIVE",
        accessToken: activation.accessToken,
        tokenExpiresAt: activation.tokenExpiresAt,
        quotaMB: activation.quotaMB.toString(),
        quotaUsedMB: activation.quotaUsedMB.toString(),
        quotaRemainingMB: (Number(activation.quotaMB) - Number(activation.quotaUsedMB)).toString(),
        vpnConfig: activation.vpnConfig,
        configVersion: activation.configVersion,
        needsSync: false,
      }, "Appareil actif");
    }

    // En attente
    if (activation.status === "PENDING") {
      return sendSuccess(res, {
        status: "PENDING",
        activationCode: activation.activationCode,
        needsApproval: true,
        message: "En attente d'approbation. Utilisez le code " + activation.activationCode + " dans le dashboard.",
      }, "En attente d'approbation");
    }

    // Rejeté
    return sendSuccess(res, {
      status: "REJECTED",
      needsApproval: true,
      message: "Appareil rejeté. Contactez l'administrateur.",
    }, "Appareil rejeté");

  } catch (err) { next(err); }
}

/**
 * POST /mobile/device/:deviceId/sync
 * Synchronise l'appareil et met à jour l'usage
 */
export async function syncDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;
    const parsed = UpdateUsageSchema.parse(req.body);

    const activation = await prisma.deviceActivation.findUnique({
      where: { deviceId },
    });

    if (!activation || activation.status !== "ACTIVE") {
      return sendError(res, "Appareil non autorisé", HTTP_STATUS.FORBIDDEN);
    }

    // Vérifier expiration
    if (activation.tokenExpiresAt && activation.tokenExpiresAt < new Date()) {
      return sendError(res, "Abonnement expiré", HTTP_STATUS.FORBIDDEN);
    }

    // Mettre à jour l'usage
    const uploadMB = parsed.uploadMB ?? 0;
    const downloadMB = parsed.downloadMB ?? 0;
    
    await prisma.deviceActivation.update({
      where: { deviceId },
      data: {
        quotaUsedMB: { increment: uploadMB + downloadMB },
      },
    });

    // Logger la synchronisation
    await audit({
      action: "DEVICE_SYNC",
      req,
      details: { deviceId, uploadMB, downloadMB },
    });

    // Vérifier si le quota est épuisé
    const updated = await prisma.deviceActivation.findUnique({ where: { deviceId } });
    const quotaRemaining = Number(updated!.quotaMB) - Number(updated!.quotaUsedMB);
    
    if (updated!.quotaMB > 0 && quotaRemaining <= 0) {
      return sendError(res, "Quota épuisé", HTTP_STATUS.PAYMENT_REQUIRED);
    }

    sendSuccess(res, {
      status: "ACTIVE",
      quotaMB: updated!.quotaMB.toString(),
      quotaUsedMB: updated!.quotaUsedMB.toString(),
      quotaRemainingMB: quotaRemaining.toString(),
      vpnConfig: updated!.vpnConfig,
      configVersion: updated!.configVersion,
    }, "Synchronisé");

  } catch (err) { next(err); }
}

/**
 * POST /mobile/device/:deviceId/connect
 * Notifie une connexion VPN (temps réel via polling ou webhook)
 */
export async function notifyConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;
    const { event, serverIp, duration } = req.body;

    const activation = await prisma.deviceActivation.findUnique({
      where: { deviceId },
    });

    if (!activation || activation.status !== "ACTIVE") {
      return sendError(res, "Appareil non autorisé", HTTP_STATUS.FORBIDDEN);
    }

    await audit({
      action: event === "CONNECT" ? "VPN_CONNECT" : "VPN_DISCONNECT",
      req,
      details: { deviceId, serverIp, duration, event },
    });

    sendSuccess(res, { acknowledged: true }, "Connexion notifiée");

  } catch (err) { next(err); }
}

// ── Endpoints Admin ──────────────────────────────────────────────────────

/**
 * GET /admin/devices/pending
 * Liste les appareils en attente d'approbation
 */
export async function getPendingDevices(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit = "50", offset = "0", status } = req.query;

    const where: any = {};
    if (status === "PENDING") where.status = "PENDING";
    else if (status === "ACTIVE") where.status = "ACTIVE";
    else if (status === "REJECTED") where.status = "REJECTED";
    else where.status = { in: ["PENDING", "ACTIVE", "REJECTED"] };

    const [devices, total] = await Promise.all([
      prisma.deviceActivation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.deviceActivation.count({ where }),
    ]);

    sendSuccess(res, {
      devices: devices.map(d => ({
        id: d.id,
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        brand: d.brand,
        model: d.model,
        osVersion: d.osVersion,
        appVersion: d.appVersion,
        publicIp: d.publicIp,
        country: d.country,
        status: d.status,
        activationCode: d.activationCode,
        quotaMB: d.quotaMB.toString(),
        quotaUsedMB: d.quotaUsedMB.toString(),
        vpnConfig: d.vpnConfig ? "[Config assignée]" : null,
        configVersion: d.configVersion,
        createdAt: d.createdAt,
        approvedAt: d.approvedAt,
        tokenExpiresAt: d.tokenExpiresAt,
      })),
      total,
      limit: Number(limit),
      offset: Number(offset),
    }, "Appareils récupérés");

  } catch (err) { next(err); }
}

/**
 * GET /admin/devices/:deviceId
 * Détails d'un appareil
 */
export async function getDeviceDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;

    const activation = await prisma.deviceActivation.findUnique({
      where: { deviceId },
    });

    if (!activation) {
      return sendError(res, "Appareil non trouvé", HTTP_STATUS.NOT_FOUND);
    }

    // Récupérer les logs récents
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        details: { path: ["deviceId"], equals: deviceId },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    sendSuccess(res, {
      ...activation,
      quotaMB: activation.quotaMB.toString(),
      quotaUsedMB: activation.quotaUsedMB.toString(),
      recentLogs,
    }, "Détails récupérés");

  } catch (err) { next(err); }
}

/**
 * POST /admin/devices/:deviceId/approve
 * Approuve un appareil et génère le token d'accès
 */
export async function approveDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;
    const parsed = ApproveDeviceSchema.parse(req.body);
    const adminId = (req as any).adminId;

    const activation = await prisma.deviceActivation.findUnique({
      where: { deviceId },
    });

    if (!activation) {
      return sendError(res, "Appareil non trouvé", HTTP_STATUS.NOT_FOUND);
    }

    if (activation.status === "ACTIVE") {
      return sendError(res, "Appareil déjà approuvé", HTTP_STATUS.CONFLICT);
    }

    // Calculer la date d'expiration
    const daysUntilExpiry = parsed.expiresInDays ?? 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysUntilExpiry);

    // Générer le token
    const accessToken = sign(
      { deviceId, type: "device_access" },
      process.env["JWT_SECRET"] || "your-secret-key",
      { expiresIn: `${daysUntilExpiry}d` }
    );

    // Mettre à jour l'activation
    const updated = await prisma.deviceActivation.update({
      where: { deviceId },
      data: {
        status: "ACTIVE",
        approvedAt: new Date(),
        approvedBy: adminId,
        accessToken,
        tokenExpiresAt: expiresAt,
        quotaMB: BigInt(parsed.quotaMB ?? 0),
        vpnConfig: parsed.vpnConfig,
        configVersion: 1,
      },
    });

    await audit({
      action: "DEVICE_ACTIVATE",
      req,
      details: { deviceId, quotaMB: parsed.quotaMB, expiresAt },
    });

    sendSuccess(res, {
      deviceId,
      status: "ACTIVE",
      accessToken,
      tokenExpiresAt: expiresAt,
      quotaMB: updated.quotaMB.toString(),
      vpnConfig: updated.vpnConfig ? "[Config assignée]" : null,
      message: "Appareil approuvé. L'utilisateur peut maintenant ouvrir l'application.",
    }, "Appareil approuvé");

  } catch (err) { next(err); }
}

/**
 * POST /admin/devices/:deviceId/reject
 * Rejette un appareil
 */
export async function rejectDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).adminId;

    const activation = await prisma.deviceActivation.findUnique({
      where: { deviceId },
    });

    if (!activation) {
      return sendError(res, "Appareil non trouvé", HTTP_STATUS.NOT_FOUND);
    }

    await prisma.deviceActivation.update({
      where: { deviceId },
      data: { status: "REJECTED" },
    });

    await audit({
      action: "DEVICE_BLOCK",
      req,
      details: { deviceId, reason },
    });

    sendSuccess(res, { deviceId, status: "REJECTED" }, "Appareil rejeté");

  } catch (err) { next(err); }
}

/**
 * PATCH /admin/devices/:deviceId/quota
 * Met à jour le quota et la config d'un appareil
 */
export async function updateDeviceQuota(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;
    const parsed = UpdateQuotaSchema.parse(req.body);
    const adminId = (req as any).adminId;

    const activation = await prisma.deviceActivation.findUnique({
      where: { deviceId },
    });

    if (!activation || activation.status !== "ACTIVE") {
      return sendError(res, "Appareil non trouvé ou inactif", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await prisma.deviceActivation.update({
      where: { deviceId },
      data: {
        quotaMB: BigInt(parsed.quotaMB),
        vpnConfig: parsed.vpnConfig ?? activation.vpnConfig,
        configVersion: { increment: 1 },
      },
    });

    await audit({
      action: "QUOTA_UPDATE",
      req,
      details: { deviceId, quotaMB: parsed.quotaMB },
    });

    sendSuccess(res, {
      deviceId,
      quotaMB: updated.quotaMB.toString(),
      quotaUsedMB: updated.quotaUsedMB.toString(),
      quotaRemainingMB: (Number(updated.quotaMB) - Number(updated.quotaUsedMB)).toString(),
      vpnConfig: updated.vpnConfig ? "[Config assignée]" : null,
      configVersion: updated.configVersion,
      message: "Quota et config mis à jour. L'utilisateur doit cliquer sur 'Synchroniser' dans l'app.",
    }, "Quota mis à jour");

  } catch (err) { next(err); }
}

/**
 * POST /admin/devices/:deviceId/revoke
 * Révoque l'accès d'un appareil
 */
export async function revokeDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).adminId;

    const activation = await prisma.deviceActivation.findUnique({
      where: { deviceId },
    });

    if (!activation) {
      return sendError(res, "Appareil non trouvé", HTTP_STATUS.NOT_FOUND);
    }

    await prisma.deviceActivation.update({
      where: { deviceId },
      data: {
        status: "REJECTED",
        accessToken: null,
        tokenExpiresAt: null,
      },
    });

    await audit({
      action: "DEVICE_BLOCK",
      req,
      details: { deviceId, reason },
    });

    sendSuccess(res, { deviceId, status: "REVOKED" }, "Accès révoqué");

  } catch (err) { next(err); }
}

/**
 * DELETE /admin/devices/:deviceId
 * Supprime un appareil
 */
export async function deleteDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;
    const adminId = (req as any).adminId;

    const activation = await prisma.deviceActivation.findUnique({
      where: { deviceId },
    });

    if (!activation) {
      return sendError(res, "Appareil non trouvé", HTTP_STATUS.NOT_FOUND);
    }

    await prisma.deviceActivation.delete({
      where: { deviceId },
    });

    await audit({
      action: "DEVICE_DELETE",
      req,
      details: { deviceId },
    });

    sendSuccess(res, null, "Appareil supprimé");

  } catch (err) { next(err); }
}
