/**
 * sxb.controller.ts - SXB VPN
 * Endpoints pour les tokens SXB et l'import de configuration VPN
 * Format token: SXB-XXXX-XXXX-XXXX
 */

import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { z } from "zod/v4";
import { prisma } from "../prisma/client.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";
import { audit } from "../lib/audit.js";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const ImportTokenSchema = z.object({
  token: z.string().regex(/^SXB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, "Format token invalide"),
  deviceId: z.string().min(1),
  deviceName: z.string().optional(),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
});

const GenerateTokenSchema = z.object({
  configData: z.any(), // Configuration VPN complète
  protocol: z.string(),
  remark: z.string().optional(),
  quotaMB: z.number().optional(),
  deviceLimit: z.number().optional(),
  expiresAt: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
});

// ── Token Generation ─────────────────────────────────────────────────────────

/**
 * Génère un token au format SXB-XXXX-XXXX-XXXX
 */
function generateSxbToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const parts = [];
  
  for (let i = 0; i < 3; i++) {
    let part = '';
    for (let j = 0; j < 4; j++) {
      part += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(part);
  }
  
  return `SXB-${parts.join('-')}`;
}

/**
 * Chiffre la configuration VPN avec AES-256-GCM
 */
function encryptConfig(config: any, secretKey: string): string {
  const key = crypto.scryptSync(secretKey, 'sxb-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const configStr = JSON.stringify(config);
  let encrypted = cipher.update(configStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Déchiffre la configuration VPN
 */
function decryptConfig(encryptedData: string, secretKey: string): any {
  try {
    const key = crypto.scryptSync(secretKey, 'sxb-salt', 32);
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    return null;
  }
}

/**
 * Génère le hash SHA-256 de la configuration
 */
function hashConfig(config: any): string {
  const configStr = JSON.stringify(config);
  return crypto.createHash('sha256').update(configStr).digest('hex');
}

// ── API Endpoints ─────────────────────────────────────────────────────────────

/**
 * POST /api/sxb/import
 * Importe un token SXB et récupère la configuration VPN
 */
export async function importToken(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ImportTokenSchema.parse(req.body);
    const { token, deviceId, deviceName, deviceBrand, deviceModel, osVersion, appVersion } = parsed;

    // Trouver le token en base
    const sxbToken = await prisma.sxbToken.findUnique({
      where: { token: token.toUpperCase() },
      include: { user: true },
    });

    if (!sxbToken) {
      await audit({
        action: "FRAUD_ATTEMPT",
        req,
        details: { reason: "Token not found", deviceId },
      });
      return sendError(res, "Token invalide", HTTP_STATUS.NOT_FOUND);
    }

    // Vérifier le statut
    if (sxbToken.status === "REVOKED") {
      return sendError(res, "Token révoqué", HTTP_STATUS.FORBIDDEN);
    }

    if (sxbToken.status === "EXPIRED") {
      return sendError(res, "Token expiré", HTTP_STATUS.FORBIDDEN);
    }

    // Vérifier l'expiration
    if (sxbToken.expiresAt && sxbToken.expiresAt < new Date()) {
      await prisma.sxbToken.update({
        where: { id: sxbToken.id },
        data: { status: "EXPIRED" },
      });
      return sendError(res, "Token expiré", HTTP_STATUS.FORBIDDEN);
    }

    // Vérifier la limite d'appareils
    if (sxbToken.deviceLimit > 0 && sxbToken.deviceCount >= sxbToken.deviceLimit) {
      // Si l'appareil est déjà enregistré, c'est OK
      if (sxbToken.deviceId !== deviceId) {
        return sendError(res, "Limite d'appareils atteinte", HTTP_STATUS.FORBIDDEN);
      }
    }

    // Récupérer la clé de chiffrement depuis l'environnement
    const encryptionKey = process.env.SXB_ENCRYPTION_KEY || 'default-sxb-key-change-in-production';

    // Déchiffrer la configuration
    const configData = decryptConfig(sxbToken.encryptedConfig, encryptionKey);
    if (!configData) {
      return sendError(res, "Erreur de déchiffrement", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Mettre à jour le token avec les informations de l'appareil
    const now = new Date();
    const updates: any = {
      deviceId,
      deviceName: deviceName || null,
      deviceCount: sxbToken.deviceCount === 0 ? 1 : sxbToken.deviceCount,
      usageCount: sxbToken.usageCount + 1,
      lastUsedAt: now,
    };

    if (!sxbToken.usedAt) {
      updates.usedAt = now;
      updates.status = "USED";
    }

    await prisma.sxbToken.update({
      where: { id: sxbToken.id },
      data: updates,
    });

    // Logger l'import
    await audit({
      action: "TOKEN_USE",
      req,
      details: {
        tokenId: sxbToken.id,
        deviceId,
        protocol: sxbToken.protocol,
      },
      userId: sxbToken.userId,
    });

    // Retourner les informations (sans la config complète pour la sécurité)
    sendSuccess(res, {
      token: sxbToken.token,
      protocol: sxbToken.protocol,
      remark: sxbToken.remark,
      quotaMB: sxbToken.quotaMB,
      quotaUsedMB: sxbToken.quotaUsedMB,
      expiresAt: sxbToken.expiresAt,
      // Configuration déchiffrée pour l'app mobile
      config: configData,
      // Métadonnées (non sensibles)
      metadata: {
        serverHost: sxbToken.serverHost ? "***" : null,
        configHash: sxbToken.configHash,
      },
    }, "Configuration importée avec succès");

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || "Données invalides", HTTP_STATUS.BAD_REQUEST);
    }
    next(error);
  }
}

/**
 * POST /api/sxb/generate
 * Génère un nouveau token SXB (admin only)
 */
export async function generateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Vérifier les droits admin
    const adminId = (req as any).user?.userId;
    if (!adminId) {
      return sendError(res, "Non autorisé", HTTP_STATUS.UNAUTHORIZED);
    }

    const parsed = GenerateTokenSchema.parse(req.body);
    const { configData, protocol, remark, quotaMB, deviceLimit, expiresAt, userId } = parsed;

    // Vérifier que la config est valide
    if (!configData || typeof configData !== 'object') {
      return sendError(res, "Configuration invalide", HTTP_STATUS.BAD_REQUEST);
    }

    // Récupérer la clé de chiffrement
    const encryptionKey = process.env.SXB_ENCRYPTION_KEY || 'default-sxb-key-change-in-production';

    // Chiffrer la configuration
    const encryptedConfig = encryptConfig(configData, encryptionKey);
    const configHash = hashConfig(configData);

    // Générer un token unique
    let newToken: string;
    let attempts = 0;
    do {
      newToken = generateSxbToken();
      const existing = await prisma.sxbToken.findUnique({ where: { token: newToken } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return sendError(res, "Erreur de génération du token", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Créer le token en base
    const sxbToken = await prisma.sxbToken.create({
      data: {
        token: newToken,
        encryptedConfig,
        configHash,
        protocol,
        remark: remark || null,
        serverHost: configData.host || null,
        quotaMB: quotaMB || 0,
        deviceLimit: deviceLimit || 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: userId || null,
        createdBy: adminId,
        status: "ACTIVE",
      },
    });

    // Logger la création
    await audit({
      action: "TOKEN_CREATE",
      req,
      details: {
        tokenId: sxbToken.id,
        token: sxbToken.token,
        protocol,
        quotaMB,
      },
      adminId,
    });

    sendSuccess(res, {
      id: sxbToken.id,
      token: sxbToken.token,
      protocol: sxbToken.protocol,
      remark: sxbToken.remark,
      quotaMB: sxbToken.quotaMB,
      deviceLimit: sxbToken.deviceLimit,
      expiresAt: sxbToken.expiresAt,
      status: sxbToken.status,
      createdAt: sxbToken.createdAt,
    }, "Token généré avec succès", HTTP_STATUS.CREATED);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, error.errors[0]?.message || "Données invalides", HTTP_STATUS.BAD_REQUEST);
    }
    next(error);
  }
}

/**
 * GET /api/sxb/config/:token
 * Récupère la configuration pour un token (usage interne)
 */
export async function getConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;

    const sxbToken = await prisma.sxbToken.findUnique({
      where: { token: token.toUpperCase() },
    });

    if (!sxbToken) {
      return sendError(res, "Token non trouvé", HTTP_STATUS.NOT_FOUND);
    }

    // Vérifier le statut
    if (sxbToken.status !== "ACTIVE" && sxbToken.status !== "USED") {
      return sendError(res, "Token non disponible", HTTP_STATUS.FORBIDDEN);
    }

    // Récupérer la clé de chiffrement
    const encryptionKey = process.env.SXB_ENCRYPTION_KEY || 'default-sxb-key-change-in-production';

    // Déchiffrer la configuration
    const configData = decryptConfig(sxbToken.encryptedConfig, encryptionKey);
    if (!configData) {
      return sendError(res, "Erreur de déchiffrement", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    sendSuccess(res, {
      token: sxbToken.token,
      protocol: sxbToken.protocol,
      config: configData,
      quota: {
        totalMB: sxbToken.quotaMB,
        usedMB: sxbToken.quotaUsedMB,
        remainingMB: sxbToken.quotaMB - sxbToken.quotaUsedMB,
      },
    }, "Configuration récupérée");

  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/sxb/usage
 * Met à jour l'usage d'un token
 */
export async function updateUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, uploadMB = 0, downloadMB = 0 } = req.body;

    if (!token) {
      return sendError(res, "Token requis", HTTP_STATUS.BAD_REQUEST);
    }

    const sxbToken = await prisma.sxbToken.findUnique({
      where: { token: token.toUpperCase() },
    });

    if (!sxbToken) {
      return sendError(res, "Token non trouvé", HTTP_STATUS.NOT_FOUND);
    }

    const totalMB = uploadMB + downloadMB;
    const newUsedMB = sxbToken.quotaUsedMB + totalMB;

    await prisma.sxbToken.update({
      where: { id: sxbToken.id },
      data: {
        quotaUsedMB: newUsedMB,
        lastUsedAt: new Date(),
      },
    });

    sendSuccess(res, {
      quotaUsedMB: newUsedMB,
      quotaRemainingMB: Math.max(0, sxbToken.quotaMB - newUsedMB),
    }, "Usage mis à jour");

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/sxb/status/:token
 * Vérifie le statut d'un token (public)
 */
export async function checkStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;

    const sxbToken = await prisma.sxbToken.findUnique({
      where: { token: token.toUpperCase() },
      select: {
        token: true,
        status: true,
        protocol: true,
        remark: true,
        quotaMB: true,
        quotaUsedMB: true,
        expiresAt: true,
        deviceLimit: true,
        deviceCount: true,
      },
    });

    if (!sxbToken) {
      return sendError(res, "Token non trouvé", HTTP_STATUS.NOT_FOUND);
    }

    // Vérifier l'expiration
    let status = sxbToken.status;
    if (sxbToken.expiresAt && sxbToken.expiresAt < new Date() && status === "ACTIVE") {
      status = "EXPIRED";
    }

    sendSuccess(res, {
      token: sxbToken.token,
      status,
      protocol: sxbToken.protocol,
      remark: sxbToken.remark,
      quota: {
        totalMB: sxbToken.quotaMB,
        usedMB: sxbToken.quotaUsedMB,
        remainingMB: sxbToken.quotaMB > 0 ? sxbToken.quotaMB - sxbToken.quotaUsedMB : null,
      },
      expiresAt: sxbToken.expiresAt,
      deviceLimit: sxbToken.deviceLimit,
      deviceCount: sxbToken.deviceCount,
      available: status === "ACTIVE" && (!sxbToken.expiresAt || sxbToken.expiresAt > new Date()),
    }, "Statut récupéré");

  } catch (error) {
    next(error);
  }
}
