/**
 * mobile.controller.ts - SXB VPN
 * Endpoints dédiés à l'application mobile Flutter :
 *  - Activation d'appareil par token cryptographique
 *  - Synchronisation des configurations
 *  - Mise à jour de l'usage
 *  - Statut de l'abonnement
 */

import type { Request, Response, NextFunction } from "express";
import { sign } from "jsonwebtoken";
import { z } from "zod/v4";
import { prisma } from "../prisma/client.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";
import { audit } from "../lib/audit.js";
import { verifyActivationToken } from "../lib/token-generator.js";

// ── Zod schemas ──────────────────────────────────────────────────────────────

// Schéma pour activation par token cryptographique (nouveau système)
const DeviceActivateSchema = z.object({
  // Info appareil
  deviceId:     z.string().uuid(),
  deviceName:   z.string().optional(),
  brand:        z.string().optional(),
  model:        z.string().optional(),
  osVersion:    z.string().optional(),
  appVersion:   z.string().optional(),
  androidId:    z.string().optional(),
  fingerprint:  z.string().optional(),
  publicIp:     z.string().optional(),
  country:      z.string().optional(),
  // Token d'activation
  token:        z.string().min(10),
  // Info utilisateur (optionnel)
  phone:        z.string().optional(),
  email:        z.string().email().optional(),
  name:         z.string().optional(),
});

// Schéma legacy pour activation par licence
const LicenseActivateSchema = z.object({
  token:      z.string().min(10),
  deviceId:   z.string().min(1),
  deviceName: z.string().optional(),
  phone:      z.string().optional(),
});

// Schéma pour synchronisation
const SyncSchema = z.object({
  configVersion: z.number().int().optional(),
  uploadMB:      z.number().optional(),
  downloadMB:    z.number().optional(),
});

// Schéma pour usage
const UsageSchema = z.object({
  uploadMB:         z.number().optional(),
  downloadMB:       z.number().optional(),
  sessionDuration:  z.number().optional(),
  serverIp:         z.string().optional(),
});

// Schéma pour logs de connexion
const ConnectLogSchema = z.object({
  event:    z.enum(["CONNECT", "DISCONNECT", "ERROR", "RECONNECT", "TIMEOUT"]),
  protocol: z.string().optional(),
  server:   z.string().optional(),
  duration: z.number().optional(),
  errorMsg: z.string().optional(),
  rxBytes:  z.number().optional(),
  txBytes:  z.number().optional(),
  ping:     z.number().optional(),
});

// ── Activate device with cryptographic token ─────────────────────────────────

export async function activateDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = DeviceActivateSchema.parse(req.body);

    // 1. Vérifier le token cryptographique
    const tokenVerification = verifyActivationToken(parsed.token, parsed.deviceId);
    
    if (!tokenVerification.valid) {
      await audit({ 
        action: "FRAUD_ATTEMPT", 
        req,
        details: { reason: tokenVerification.error, deviceId: parsed.deviceId } 
      });
      return sendError(res, tokenVerification.error || "Token invalide", HTTP_STATUS.FORBIDDEN);
    }

    // 2. Vérifier le token en base de données
    const dbToken = await prisma.activationToken.findUnique({
      where: { token: parsed.token },
    });

    if (!dbToken) {
      return sendError(res, "Token introuvable", HTTP_STATUS.NOT_FOUND);
    }

    if (dbToken.status !== "ACTIVE") {
      return sendError(res, `Token ${dbToken.status.toLowerCase()}`, HTTP_STATUS.FORBIDDEN);
    }

    if (dbToken.expiresAt < new Date()) {
      await prisma.activationToken.update({
        where: { id: dbToken.id },
        data: { status: "EXPIRED" },
      });
      return sendError(res, "Token expiré", HTTP_STATUS.FORBIDDEN);
    }

    // 3. Trouver ou créer l'utilisateur
    let user = await prisma.user.findFirst({
      where: parsed.phone ? { phone: parsed.phone } : {},
    });

    if (!user && parsed.email) {
      user = await prisma.user.findFirst({
        where: { email: parsed.email },
      });
    }

    // Si pas d'utilisateur, en créer un temporaire
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: parsed.phone,
          email: parsed.email,
          name: parsed.name,
          status: "ACTIVE",
          deviceLimit: 3,
        },
      });
    }

    // Vérifier la limite d'appareils
    const deviceCount = await prisma.device.count({
      where: { userId: user.id },
    });

    if (deviceCount >= user.deviceLimit) {
      return sendError(res, `Limite d'appareils atteinte (${user.deviceLimit})`, HTTP_STATUS.FORBIDDEN);
    }

    // 4. Vérifier ou créer l'appareil
    let device = await prisma.device.findUnique({
      where: { deviceId: parsed.deviceId },
    });

    if (device && device.userId !== user.id) {
      return sendError(res, "Appareil déjà lié à un autre compte", HTTP_STATUS.FORBIDDEN);
    }

    if (!device) {
      device = await prisma.device.create({
        data: {
          deviceId:       parsed.deviceId,
          deviceName:     parsed.deviceName,
          brand:          parsed.brand,
          model:          parsed.model,
          osVersion:      parsed.osVersion,
          appVersion:     parsed.appVersion,
          androidId:      parsed.androidId,
          fingerprint:    parsed.fingerprint,
          publicIp:       parsed.publicIp,
          country:        parsed.country,
          status:         "ACTIVE",
          firstActivatedAt: new Date(),
          lastSyncAt:     new Date(),
          userId:         user.id,
        },
      });
    } else {
      device = await prisma.device.update({
        where: { deviceId: parsed.deviceId },
        data: {
          deviceName:    parsed.deviceName ?? device.deviceName,
          brand:         parsed.brand ?? device.brand,
          model:         parsed.model ?? device.model,
          osVersion:     parsed.osVersion ?? device.osVersion,
          appVersion:    parsed.appVersion ?? device.appVersion,
          publicIp:      parsed.publicIp ?? device.publicIp,
          country:       parsed.country ?? device.country,
          status:        "ACTIVE",
          lastSyncAt:    new Date(),
          lastIp:        parsed.publicIp,
          lastSeenAt:    new Date(),
        },
      });
    }

    // 5. Créer l'activation permanente
    await prisma.activation.upsert({
      where: { deviceId: parsed.deviceId },
      create: {
        deviceId:    parsed.deviceId,
        userId:      user.id,
        status:      "ACTIVATED",
        tokenUsed:   parsed.token,
        activatedAt: new Date(),
      },
      update: {
        status:      "ACTIVATED",
        tokenUsed:   parsed.token,
        activatedAt: new Date(),
        suspendedAt: null,
        revokedAt:   null,
      },
    });

    // 6. Marquer le token comme utilisé
    await prisma.activationToken.update({
      where: { id: dbToken.id },
      data: {
        status:       "USED",
        usedAt:       new Date(),
        usedByDevice: parsed.deviceId,
      },
    });

    // 7. Incrémenter le compteur de connexions
    await prisma.device.update({
      where: { id: device.id },
      data: { connectionCount: { increment: 1 } },
    });

    // 8. Récupérer les profils VPN actifs
    const profiles = await prisma.vpnProfile.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });

    // 9. Générer le JWT
    const jwtSecret = process.env["JWT_SECRET"]!;
    const accessToken = sign(
      { 
        userId: user.id, 
        deviceId: parsed.deviceId,
        role: user.role,
        type: "device"
      },
      jwtSecret,
      { expiresIn: "30d" }
    );

    // 10. Logger l'audit
    await audit({ 
      action: "DEVICE_ACTIVATE", 
      userId: user.id, 
      req,
      details: { 
        deviceId: parsed.deviceId, 
        brand: parsed.brand,
        model: parsed.model,
      } 
    });

    sendSuccess(res, {
      accessToken,
      device: {
        id: device.id,
        deviceId: device.deviceId,
        status: device.status,
      },
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        status: user.status,
        quotaRemainingGB: user.quotaRemainingGB,
        quotaUsedGB: user.quotaUsedGB,
        expireAt: user.expireAt,
        deviceLimit: user.deviceLimit,
      },
      profiles: profiles.map((p) => ({
        id:       p.id,
        name:     p.name,
        server:   p.server,
        port:     p.port,
        protocol: p.protocol,
        dns:      p.dns,
        network:  p.network,
        version:  p.version,
        status:   p.status,
      })),
      configVersion: Math.max(...profiles.map((p) => p.version), 1),
    }, "Appareil activé avec succès");

  } catch (err) { next(err); }
}

// ── Sync configurations ─────────────────────────────────────────────────────

export async function syncDevice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const deviceId = req.user!.deviceId;
    const parsed = SyncSchema.parse(req.query);

    // Vérifier que l'appareil existe et est actif
    const device = await prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      return sendError(res, "Appareil introuvable", HTTP_STATUS.NOT_FOUND);
    }

    if (device.status !== "ACTIVE") {
      return sendError(res, `Appareil ${device.status.toLowerCase()}`, HTTP_STATUS.FORBIDDEN);
    }

    // Mettre à jour les stats de l'appareil
    await prisma.device.update({
      where: { deviceId },
      data: {
        lastSyncAt:  new Date(),
        lastSeenAt:  new Date(),
        lastIp:      req.ip,
      },
    });

    // Mettre à jour l'usage si fourni
    if (parsed.uploadMB !== undefined || parsed.downloadMB !== undefined) {
      await updateUserUsage(userId, deviceId, parsed.uploadMB ?? 0, parsed.downloadMB ?? 0);
    }

    // Vérifier s'il y a de nouvelles configurations
    const latestProfile = await prisma.vpnProfile.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { version: "desc" },
    });

    const currentVersion = parsed.configVersion ?? 0;
    const newVersionAvailable = latestProfile && latestProfile.version > currentVersion;

    // Récupérer les profils si nouvelle version
    let profiles = null;
    if (newVersionAvailable) {
      profiles = await prisma.vpnProfile.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      });
    }

    // Logger la sync
    await prisma.syncLog.create({
      data: {
        deviceId:          deviceId,
        clientVersion:     device.appVersion ?? undefined,
        configVersion:     currentVersion,
        newConfigAvailable: newVersionAvailable ?? false,
        syncStatus:        "SUCCESS",
        clientIp:          req.ip ?? undefined,
      },
    });

    await audit({ 
      action: "DEVICE_SYNC", 
      userId, 
      req,
      details: { deviceId, configVersion: currentVersion } 
    });

    sendSuccess(res, {
      newConfigAvailable: newVersionAvailable ?? false,
      currentVersion,
      latestVersion:      latestProfile?.version ?? currentVersion,
      profiles: profiles?.map((p) => ({
        id:       p.id,
        name:     p.name,
        server:   p.server,
        port:     p.port,
        protocol: p.protocol,
        dns:      p.dns,
        network:  p.network,
        version:  p.version,
        status:   p.status,
      })),
    }, "Synchronisé");

  } catch (err) { next(err); }
}

// ── Update usage ────────────────────────────────────────────────────────────

export async function updateDeviceUsage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const deviceId = req.user!.deviceId;
    const parsed = UsageSchema.parse(req.body);

    await updateUserUsage(userId, deviceId, parsed.uploadMB ?? 0, parsed.downloadMB ?? 0, parsed.serverIp);

    sendSuccess(res, null, "Usage mis à jour");
  } catch (err) { next(err); }
}

async function updateUserUsage(userId: string, deviceId: string, uploadMB: number, downloadMB: number, serverIp?: string) {
  const uploadGB = uploadMB / 1024;
  const downloadGB = downloadMB / 1024;
  const totalGB = uploadGB + downloadGB;

  if (totalGB < 0.0001) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { quotaRemainingGB: true, quotaUsedGB: true },
  });

  if (!user) return;

  // Mettre à jour les quotas utilisateur
  const newUsedGB = parseFloat((user.quotaUsedGB + totalGB).toFixed(9));
  const newRemainingGB = Math.max(0, parseFloat((user.quotaRemainingGB - totalGB).toFixed(9)));

  await prisma.user.update({
    where: { id: userId },
    data: {
      quotaUsedGB:      newUsedGB,
      quotaRemainingGB: newRemainingGB,
    },
  });

  // Mettre à jour les quotas par appareil si existant
  const deviceQuota = await prisma.quota.findFirst({
    where: { deviceId },
  });

  if (deviceQuota) {
    await prisma.quota.update({
      where: { id: deviceQuota.id },
      data: {
        usedGB:       parseFloat((deviceQuota.usedGB + totalGB).toFixed(9)),
        remainingGB:  Math.max(0, parseFloat((deviceQuota.remainingGB - totalGB).toFixed(9))),
        lastUpdatedAt: new Date(),
      },
    });

    // Ajouter à l'historique
    await prisma.quotaHistory.create({
      data: {
        quotaId:     deviceQuota.id,
        usedGB:      totalGB,
        uploadGB,
        downloadGB,
        clientIp:    serverIp,
      },
    });

    // Vérifier si le quota est épuisé
    if (newRemainingGB <= 0 && deviceQuota.policy === "SUSPEND") {
      await audit({ 
        action: "QUOTA_EXCEEDED", 
        userId,
        details: { deviceId, usedGB: newUsedGB } 
      });
    }
  }

  // Logger l'usage
  await prisma.usageLog.create({
    data: { 
      userId, 
      downloadGB, 
      uploadGB, 
      totalGB,
    },
  });
}

// ── Activate license (legacy) ────────────────────────────────────────────────

export async function activateLicense(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = LicenseActivateSchema.parse(req.body);

    const license = await prisma.license.findUnique({ where: { token: parsed.token } });
    if (!license) return sendError(res, "Licence introuvable", HTTP_STATUS.NOT_FOUND);
    if (license.status !== "ACTIVE") return sendError(res, `Licence ${license.status}`, HTTP_STATUS.FORBIDDEN);
    if (license.expireAt && license.expireAt < new Date()) {
      await prisma.license.update({ where: { id: license.id }, data: { status: "EXPIRED" } });
      return sendError(res, "Licence expirée", HTTP_STATUS.FORBIDDEN);
    }

    // Bind device (first bind wins)
    if (license.deviceId && license.deviceId !== parsed.deviceId) {
      return sendError(res, "Appareil non autorisé", HTTP_STATUS.FORBIDDEN);
    }

    await prisma.license.update({
      where: { id: license.id },
      data: {
        deviceId:   parsed.deviceId,
        deviceName: parsed.deviceName ?? license.deviceName,
        phone:      parsed.phone ?? license.phone,
        lastUsedAt: new Date(),
      },
    });

    const user = license.userId
      ? await prisma.user.findUnique({ where: { id: license.userId } })
      : null;

    if (!user) return sendError(res, "Aucun compte associé à cette licence", HTTP_STATUS.NOT_FOUND);

    // Créer une session pour que authMiddleware puisse la valider
    const session = await prisma.session.create({
      data: { token: "tmp", userId: user.id, ipAddress: req.ip },
    });

    const jwtSecret = process.env["JWT_SECRET"]!;
    const accessToken = sign(
      { userId: user.id, role: user.role, sessionId: session.id },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // Mettre à jour la session avec le token final
    await prisma.session.update({ where: { id: session.id }, data: { token: accessToken } });

    await audit({ action: "USER_LOGIN", userId: user.id, req,
      details: { method: "license", deviceId: parsed.deviceId } });

    sendSuccess(res, {
      accessToken,
      user: {
        id: user.id, username: user.username, email: user.email,
        role: user.role, status: user.status,
        expireAt: user.expireAt,
        quotaRemainingGB: user.quotaRemainingGB,
        quotaUsedGB: user.quotaUsedGB,
      },
      license: {
        token: license.token, expireAt: license.expireAt,
        dataLimitGB: license.dataLimitGB, dataUsedGB: license.dataUsedGB,
        status: license.status,
      },
    }, "Licence activée");
  } catch (err) { next(err); }
}

// ── Get VPN config for mobile app ─────────────────────────────────────────────

export async function getMobileConfig(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, status: true, quotaRemainingGB: true,
        quotaUsedGB: true, expireAt: true,
      },
    });

    if (!user) return sendError(res, "Utilisateur introuvable", HTTP_STATUS.NOT_FOUND);
    if (user.status === "SUSPENDED") return sendError(res, "Compte suspendu", HTTP_STATUS.FORBIDDEN);
    if (user.quotaRemainingGB <= 0) return sendError(res, "Quota épuisé", 402);
    if (user.expireAt && user.expireAt < new Date()) return sendError(res, "Abonnement expiré", HTTP_STATUS.FORBIDDEN);

    // Get active inbounds
    const inbounds = await prisma.inbound.findMany({
      where: { enabled: true },
      orderBy: [{ isPremium: "asc" }, { sortOrder: "asc" }],
    });

    if (inbounds.length === 0) return sendError(res, "Aucun serveur disponible", HTTP_STATUS.NOT_FOUND);

    const profiles = inbounds.map((inb) => ({
      id:       inb.id,
      remark:   inb.remark ?? inb.host,
      protocol: inb.protocol,
      host:     inb.host,
      port:     inb.port,
      ...(["VLESS","VLESS_REALITY","VMESS"].includes(inb.protocol) && {
        uuid:    userId,
        network: inb.network ?? "tcp",
        tls:     inb.tls,
        sni:     inb.sni,
        path:    inb.path,
        ...(inb.protocol === "VLESS_REALITY" && { pbk: inb.pbk, sid: inb.sid, fp: inb.fp }),
      }),
      ...(["TROJAN","TROJAN_GO"].includes(inb.protocol) && {
        password: userId, // user's UUID as trojan password
        sni:      inb.sni,
        network:  inb.network,
      }),
      ...(["SHADOWSOCKS","SHADOWSOCKS_R"].includes(inb.protocol) && {
        method:   inb.ssMethod ?? "aes-256-gcm",
        password: inb.ssPassword,
      }),
      ...(inb.protocol === "WIREGUARD" && {
        publicKey:  inb.wgPublicKey,
        endpoint:   `${inb.host}:${inb.port}`,
        dns:        inb.wgDns ?? "1.1.1.1",
        allowedIps: "0.0.0.0/0,::/0",
        mtu:        1420,
      }),
      ...(inb.protocol.startsWith("SSH") && {
        username:   inb.sshUser,
        password:   inb.sshPassword,
        payload:    inb.sshPayload,
        slowDnsNs:  inb.slowdnsNs,
      }),
      ...(inb.protocol === "OPENVPN" && {
        ovpnConfig: inb.ovpnConfig,
      }),
      isPremium: inb.isPremium,
      ping:      null as number | null,
    }));

    await audit({ action: "VPN_CONNECT", userId, req,
      details: { profileCount: profiles.length } });

    sendSuccess(res, {
      profiles,
      quota: {
        usedGB:      user.quotaUsedGB,
        remainingGB: user.quotaRemainingGB,
        expireAt:    user.expireAt,
      },
    }, "Configurations récupérées");
  } catch (err) { next(err); }
}

// ── Connection log from mobile app ─────────────────────────────────────────────

export async function postConnectionLog(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const parsed = ConnectLogSchema.parse(req.body);

    await prisma.auditLog.create({
      data: {
        userId,
        action: parsed.event === "CONNECT"     ? "VPN_CONNECT"
               : parsed.event === "DISCONNECT"  ? "VPN_DISCONNECT"
               : "VPN_CONNECT",
        entity: "mobile_connection",
        details: {
          event:    parsed.event,
          protocol: parsed.protocol,
          server:   parsed.server,
          duration: parsed.duration,
          error:    parsed.errorMsg,
          rxBytes:  parsed.rxBytes,
          txBytes:  parsed.txBytes,
          ping:     parsed.ping,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    // Update usage if bytes provided
    if (parsed.rxBytes && parsed.txBytes) {
      const rxGB = parseFloat((parsed.rxBytes / 1_073_741_824).toFixed(9));
      const txGB = parseFloat((parsed.txBytes / 1_073_741_824).toFixed(9));
      if (rxGB + txGB > 0.000001) {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { quotaRemainingGB: true, quotaUsedGB: true },
        });
        if (u) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              quotaUsedGB:      parseFloat((u.quotaUsedGB + rxGB + txGB).toFixed(9)),
              quotaRemainingGB: Math.max(0, parseFloat((u.quotaRemainingGB - rxGB - txGB).toFixed(9))),
            },
          });
          await prisma.usageLog.create({
            data: { userId, downloadGB: rxGB, uploadGB: txGB, totalGB: rxGB + txGB },
          });
        }
      }
    }

    sendSuccess(res, null, "Log enregistré");
  } catch (err) { next(err); }
}

// ── Get connection logs ──────────────────────────────────────────────────────

export async function getConnectionLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query["limit"] ?? 50), 100);

    const logs = await prisma.auditLog.findMany({
      where: { userId, entity: "mobile_connection" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, action: true, details: true, createdAt: true, ipAddress: true },
    });

    sendSuccess(res, logs, "Logs récupérés");
  } catch (err) { next(err); }
}

// ── Subscription status ──────────────────────────────────────────────────────

export async function getSubscriptionStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, email: true, status: true,
        expireAt: true, quotaRemainingGB: true, quotaUsedGB: true, deviceLimit: true,
        licenses: {
          where: { status: "ACTIVE" },
          select: { token: true, expireAt: true, dataLimitGB: true, dataUsedGB: true, status: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) return sendError(res, "Utilisateur introuvable", HTTP_STATUS.NOT_FOUND);

    const activeLicense = user.licenses[0] ?? null;
    const isExpired = user.expireAt ? user.expireAt < new Date() : false;
    const daysLeft = user.expireAt
      ? Math.max(0, Math.ceil((user.expireAt.getTime() - Date.now()) / 86400000))
      : null;

    const dataLimitGB = activeLicense?.dataLimitGB ?? ((user.quotaUsedGB + user.quotaRemainingGB) || 0);
    const percentUsed = dataLimitGB > 0
      ? Math.min(100, Math.round((user.quotaUsedGB / dataLimitGB) * 100))
      : 0;

    sendSuccess(res, {
      status: isExpired ? "EXPIRED" : user.status,
      username: user.username, email: user.email, expireAt: user.expireAt,
      daysLeft,
      // Flat fields for mobile app compatibility
      dataUsed:      user.quotaUsedGB,
      dataRemaining: user.quotaRemainingGB,
      dataLimit:     dataLimitGB,
      plan: activeLicense ? "Premium" : "Free",
      // Nested quota for dashboard
      quota: {
        usedGB:      user.quotaUsedGB,
        remainingGB: user.quotaRemainingGB,
        percentUsed,
      },
      license: activeLicense,
      deviceLimit: user.deviceLimit,
    }, "Statut récupéré");
  } catch (err) { next(err); }
}
