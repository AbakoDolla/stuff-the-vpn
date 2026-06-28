import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { audit } from "../lib/audit.js";
import crypto from "crypto";
import type { AuthRequest } from "../types/index.js";

export async function listKeys(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const keys = await prisma.apiKey.findMany({ where: { userId: req.user!.userId }, orderBy: { createdAt: "desc" } });
    sendSuccess(res, keys.map((k) => ({ ...k, keyHash: undefined })), "API keys fetched");
  } catch (err) { next(err); }
}

export async function createKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rawKey = `sxb_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 10);

    const key = await prisma.apiKey.create({
      data: { name: req.body.name, keyHash, keyPrefix, userId: req.user!.userId, permissions: req.body.permissions ?? [] },
    });
    await audit({ action: "APIKEY_CREATE", userId: req.user?.userId, entityId: key.id, req });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: { ...key, rawKey }, message: "API key created. Save it now — it won't be shown again." });
  } catch (err) { next(err); }
}

export async function revokeKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.apiKey.update({ where: { id: req.params["id"] }, data: { isActive: false } });
    await audit({ action: "APIKEY_REVOKE", userId: req.user?.userId, entityId: req.params["id"], req });
    sendSuccess(res, null, "API key revoked");
  } catch (err) { next(err); }
}
