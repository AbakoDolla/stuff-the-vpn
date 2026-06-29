/**
 * mobile.controller.ts
 * Endpoints dédiés à l'application mobile Flutter :
 *  - Activation d'une licence (token)
 *  - Récupération de la configuration VPN
 *  - Logs de connexion
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

// ── Zod schemas ──────────────────────────────────────────────────────────────

const ActivateSchema = z.object({
  token:      z.string().min(10),
  deviceId:   z.string().min(1),
  deviceName: z.string().optional(),
  phone:      z.string().optional(),
});

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

// ── Activate license & get JWT ────────────────────────────────────────────────

export async function activateLicense(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ActivateSchema.parse(req.body);

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

    const jwtSecret = process.env["JWT_SECRET"]!;
    const accessToken = sign(
      { userId: user.id, role: user.role, licenseToken: parsed.token },
      jwtSecret,
      { expiresIn: "7d" }
    );

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

    sendSuccess(res, {
      status: isExpired ? "EXPIRED" : user.status,
      username: user.username, email: user.email, expireAt: user.expireAt,
      daysLeft,
      quota: {
        usedGB:      user.quotaUsedGB,
        remainingGB: user.quotaRemainingGB,
        percentUsed: activeLicense?.dataLimitGB
          ? Math.min(100, Math.round((user.quotaUsedGB / activeLicense.dataLimitGB) * 100))
          : 0,
      },
      license: activeLicense,
      deviceLimit: user.deviceLimit,
    }, "Statut récupéré");
  } catch (err) { next(err); }
}
