import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { audit } from "../lib/audit.js";
import { decrypt } from "../lib/encryption.js";
import type { AuthRequest } from "../types/index.js";

export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Get profiles created by this user (via createdBy field)
    const profile = await prisma.vpnProfile.findFirst({
      where: { createdBy: req.user!.userId, status: "ACTIVE" },
    });

    if (!profile) return sendSuccess(res, null, "No active profile");

    // Decrypt config — client receives decrypted URI but never raw server credentials
    let config: string | null = null;
    if (profile.encryptedConfig) {
      try { config = decrypt(profile.encryptedConfig); } catch { /* leave null */ }
    }

    await audit({ action: "VPN_CONNECT", userId: req.user?.userId, entityId: profile.id, req });
    sendSuccess(res, { ...profile, encryptedConfig: undefined, config }, "Profile fetched");
  } catch (err) { next(err); }
}

export async function listProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, status, page = 1, limit = 20 } = req.query as Record<string, string>;
    // Filter by createdBy (userId) if provided
    const where: any = { ...(status && { status: status as "ACTIVE" }) };
    if (userId) {
      where.createdBy = userId;
    }
    const profiles = await prisma.vpnProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    sendSuccess(res, profiles, "Profiles fetched");
  } catch (err) { next(err); }
}

export async function createProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId, serverId, planId, deviceId, config, name, server, port, protocol, ...rest } = req.body;
    const { encrypt } = await import("../lib/encryption.js");
    const encryptedConfig = config ? encrypt(config as string) : undefined;

    const profile = await prisma.vpnProfile.create({
      data: {
        name: name || `${protocol}-${Date.now()}`,
        server: server || "vpnsxb.afrihall.com",
        port: port || 8443,
        protocol: protocol || "VLESS",
        admin: { connect: { id: req.user!.userId } },
        encryptedConfig,
        ...rest,
      },
    });
    await audit({ action: "VPN_CREATE", userId: req.user?.userId, entityId: profile.id, req });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: profile, message: "VPN profile created" });
  } catch (err) { next(err); }
}

export async function deleteProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.vpnProfile.delete({ where: { id: String(req.params["id"]) } });
    await audit({ action: "VPN_DELETE", userId: req.user?.userId, entityId: String(req.params["id"]), req });
    sendSuccess(res, null, "Profile deleted");
  } catch (err) { next(err); }
}

export async function setProfileStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await prisma.vpnProfile.update({
      where: { id: String(req.params["id"]) },
      data: { status: req.body.status },
    });
    sendSuccess(res, profile, "Profile status updated");
  } catch (err) { next(err); }
}

export async function recordConnect(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.vpnProfile.updateMany({
      where: { createdBy: req.user!.userId, status: "ACTIVE" },
      data: { updatedAt: new Date() },
    });
    sendSuccess(res, null, "Connect recorded");
  } catch (err) { next(err); }
}

export async function recordDisconnect(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await audit({ action: "VPN_DISCONNECT", userId: req.user?.userId, req });
    sendSuccess(res, null, "Disconnect recorded");
  } catch (err) { next(err); }
}
