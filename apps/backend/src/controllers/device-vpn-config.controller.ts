/**
 * device-vpn-config.controller.ts - SXB VPN
 * Gestion des configurations VPN assignées aux appareils
 * 
 * Le système crypte les configurations avec AES-256-GCM côté backend
 * L'app mobile déchiffre localement avec sa clé unique
 */

import type { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import { z } from "zod";
import { prisma } from "../prisma/client.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { audit } from "../lib/audit.js";

// ── Encryption Config ────────────────────────────────────────────────────────
const ENCRYPTION_KEY = process.env["CONFIG_ENCRYPTION_KEY"] || 
  crypto.createHash('sha256').update(process.env["JWT_SECRET"] || 'default-key').digest('base64url').slice(0, 32);
const ALGORITHM = 'aes-256-gcm';

// ── Schemas ──────────────────────────────────────────────────────────────
const AssignConfigSchema = z.object({
  deviceId:      z.string().min(1),
  profileId:     z.string().optional(),
  configName:    z.string().min(1),
  protocol:      z.string().min(1),
  serverHost:    z.string().min(1),
  serverPort:    z.number().int().min(1).max(65535),
  serverCountry: z.string().min(1),
  serverFlag:    z.string().optional(),
  configData:    z.record(z.any()),
  validUntil:    z.string().datetime().optional(),
});

// ── Encryption Helpers ───────────────────────────────────────────────────
function encryptConfig(configData: Record<string, any>): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'utf8').slice(0, 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const jsonData = JSON.stringify(configData);
  let encrypted = cipher.update(jsonData, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  const fullEncrypted = Buffer.concat([
    Buffer.from(encrypted, 'base64'),
    authTag
  ]).toString('base64url');
  return { encrypted: fullEncrypted, iv: iv.toString('base64url') };
}

function decryptConfig(encrypted: string, iv: string): Record<string, any> | null {
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'utf8').slice(0, 32);
    const ivBuffer = Buffer.from(iv, 'base64url');
    const combined = Buffer.from(encrypted, 'base64url');
    const authTag = combined.slice(-16);
    const encryptedData = combined.slice(0, -16);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

// ── Public Endpoints (Mobile App) ────────────────────────────────────────
export async function getDeviceVpnConfigs(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;
    const activation = await prisma.activation.findUnique({ where: { deviceId } });
    if (!activation || activation.status !== 'ACTIVE') {
      return sendError(res, "Appareil non autorisé", HTTP_STATUS.FORBIDDEN);
    }
    const configs = await prisma.deviceVpnConfig.findMany({
      where: {
        deviceId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }]
      },
      orderBy: { assignedAt: 'desc' }
    });
    sendSuccess(res, {
      configs: configs.map(c => ({
        id: c.id,
        configName: c.configName,
        protocol: c.protocol,
        serverHost: c.serverHost,
        serverPort: c.serverPort,
        serverCountry: c.serverCountry,
        serverFlag: c.serverFlag,
        encryptedConfig: c.encryptedConfig,
        configIV: c.configIV,
        configVersion: c.configVersion,
        validUntil: c.validUntil,
        syncedAt: c.syncedAt,
        needsUpdate: !c.syncedAt || c.configVersion > 1
      })),
      serverTime: new Date().toISOString()
    }, "Configurations récupérées");
  } catch (err) { next(err); }
}

export async function fullSync(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;
    const activation = await prisma.activation.findUnique({ where: { deviceId } });
    if (!activation || activation.status !== 'ACTIVE') {
      return sendError(res, "Appareil non autorisé", HTTP_STATUS.FORBIDDEN);
    }
    const configs = await prisma.deviceVpnConfig.findMany({
      where: {
        deviceId,
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }]
      },
      orderBy: { assignedAt: 'desc' }
    });
    const processedConfigs = await Promise.all(configs.map(async (c) => {
      const decryptedData = decryptConfig(c.encryptedConfig, c.configIV);
      await prisma.deviceVpnConfig.update({
        where: { id: c.id },
        data: { syncedAt: new Date() }
      });
      return {
        id: c.id,
        configName: c.configName,
        protocol: c.protocol,
        serverHost: c.serverHost,
        serverPort: c.serverPort,
        serverCountry: c.serverCountry,
        serverFlag: c.serverFlag,
        configData: decryptedData,
        configVersion: c.configVersion,
        syncedAt: new Date()
      };
    }));
    sendSuccess(res, {
      configs: processedConfigs,
      totalCount: processedConfigs.length,
      serverTime: new Date().toISOString()
    }, "Synchronisation complète");
  } catch (err) { next(err); }
}

// ── Admin Endpoints ──────────────────────────────────────────────────────
export async function assignConfigToDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = AssignConfigSchema.parse(req.body);
    const adminId = (req as any).adminId;
    const activation = await prisma.activation.findUnique({ where: { deviceId: parsed.deviceId } });
    if (!activation) {
      return sendError(res, "Appareil non trouvé", HTTP_STATUS.NOT_FOUND);
    }
    const { encrypted, iv } = encryptConfig(parsed.configData);
    const config = await prisma.deviceVpnConfig.upsert({
      where: {
        deviceId_profileId: {
          deviceId: parsed.deviceId,
          profileId: parsed.profileId || null
        }
      },
      create: {
        deviceId: parsed.deviceId,
        profileId: parsed.profileId,
        configName: parsed.configName,
        protocol: parsed.protocol,
        serverHost: parsed.serverHost,
        serverPort: parsed.serverPort,
        serverCountry: parsed.serverCountry,
        serverFlag: parsed.serverFlag || '🏳️',
        encryptedConfig: encrypted,
        configIV: iv,
        validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
        assignedBy: adminId
      },
      update: {
        configName: parsed.configName,
        protocol: parsed.protocol,
        serverHost: parsed.serverHost,
        serverPort: parsed.serverPort,
        serverCountry: parsed.serverCountry,
        serverFlag: parsed.serverFlag || '🏳️',
        encryptedConfig: encrypted,
        configIV: iv,
        configVersion: { increment: 1 },
        validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
        assignedBy: adminId
      }
    });
    await audit({ action: "VPN_CONFIG_ASSIGN", req, details: { deviceId: parsed.deviceId, configName: parsed.configName, adminId } });
    sendSuccess(res, {
      id: config.id,
      deviceId: config.deviceId,
      configName: config.configName,
      protocol: config.protocol,
      serverHost: config.serverHost,
      serverPort: config.serverPort,
      serverCountry: config.serverCountry,
      serverFlag: config.serverFlag,
      configVersion: config.configVersion,
      assignedAt: config.assignedAt
    }, "Configuration assignée");
  } catch (err) { next(err); }
}

export async function listDeviceConfigs(req: Request, res: Response, next: NextFunction) {
  try {
    const { deviceId } = req.params;
    const configs = await prisma.deviceVpnConfig.findMany({
      where: { deviceId },
      orderBy: { assignedAt: 'desc' }
    });
    sendSuccess(res, {
      configs: configs.map(c => ({
        ...c,
        hasValidConfig: c.encryptedConfig.length > 0,
        isExpired: c.validUntil ? c.validUntil < new Date() : false
      }))
    }, "Configurations listées");
  } catch (err) { next(err); }
}

export async function deleteConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { configId } = req.params;
    await prisma.deviceVpnConfig.delete({ where: { id: configId } });
    await audit({ action: "VPN_CONFIG_DELETE", req, details: { configId } });
    sendSuccess(res, null, "Configuration supprimée");
  } catch (err) { next(err); }
}

export async function invalidateConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { configId } = req.params;
    const config = await prisma.deviceVpnConfig.update({
      where: { id: configId },
      data: { configVersion: { increment: 1 } }
    });
    sendSuccess(res, { id: config.id, configVersion: config.configVersion }, "Configuration invalidée");
  } catch (err) { next(err); }
}
