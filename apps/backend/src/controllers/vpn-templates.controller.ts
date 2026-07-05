import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { encrypt, decrypt } from "../lib/encryption.js";
import { audit } from "../lib/audit.js";
import {
  generateUUID, generateWireGuardKeys, generateRealityKeys,
  generateSSPassword, generateTrojanPassword, generateSlowDNSKeys,
  buildVlessLink, buildVmessLink, buildWireGuardLink, buildShadowsocksLink, buildTrojanLink,
} from "../lib/vpn-generators.js";
import type { AuthRequest } from "../types/index.js";

type ConfigMap = Record<string, unknown>;

// ── Auto-generate fields per protocol ────────────────────────────────────────
function autofill(protocol: string, raw: ConfigMap): ConfigMap {
  const cfg = { ...raw };
  switch (protocol) {
    case "VLESS":
    case "VMESS":
      if (!cfg["uuid"]) cfg["uuid"] = generateUUID();
      break;
    case "VLESS_REALITY": {
      if (!cfg["uuid"]) cfg["uuid"] = generateUUID();
      if (!cfg["pbk"] || !cfg["sid"]) {
        const keys = generateRealityKeys();
        cfg["pbk"] = keys.publicKey;
        cfg["pvk"] = keys.privateKey;
        cfg["sid"] = keys.shortId;
      }
      break;
    }
    case "WIREGUARD":
      if (!cfg["privateKey"]) {
        const keys = generateWireGuardKeys();
        Object.assign(cfg, keys);
      }
      break;
    case "SHADOWSOCKS":
    case "SHADOWSOCKS_R":
      if (!cfg["password"]) cfg["password"] = generateSSPassword();
      if (!cfg["cipher"]) cfg["cipher"] = "aes-256-gcm";
      break;
    case "TROJAN":
    case "TROJAN_GO":
      if (!cfg["password"]) cfg["password"] = generateTrojanPassword();
      break;
    case "SSH_SLOWDNS":
      if (!cfg["slowdnsPrivateKey"]) {
        const k = generateSlowDNSKeys();
        cfg["slowdnsPrivateKey"] = k.privateKey;
        cfg["slowdnsPublicKey"] = k.publicKey;
      }
      break;
  }
  return cfg;
}

// ── Generate shareable link per protocol ─────────────────────────────────────
function buildLink(protocol: string, cfg: ConfigMap): string | null {
  try {
    switch (protocol) {
      case "VLESS":
      case "VLESS_REALITY":
        return buildVlessLink(cfg as Record<string, string>);
      case "VMESS":
        return buildVmessLink(cfg as Record<string, string>);
      case "WIREGUARD":
        return buildWireGuardLink(cfg as Record<string, string>);
      case "SHADOWSOCKS":
        return buildShadowsocksLink(cfg as Record<string, string>);
      case "TROJAN":
      case "TROJAN_GO":
        return buildTrojanLink(cfg as Record<string, string>);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ═══════════════════════════ HANDLERS ═══════════════════════════════════════

export async function listTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const { protocol, isActive, page = 1, limit = 50 } = req.query as Record<string, string>;
    // Fallback: use VpnProfile model (newer schema) when VpnTemplate model is not present.
    // Map available fields to the older "template" shape expected by the frontend.
    const profiles = await prisma.vpnProfile.findMany({
      where: {
        ...(protocol && { protocol: protocol as string }),
        ...(isActive !== undefined && { status: isActive === "true" ? "ACTIVE" : { not: "ACTIVE" } }),
      },
      select: {
        id: true,
        name: true,
        protocol: true,
        server: true,
        port: true,
        status: true,
        priority: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { userProfiles: true } },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    // Map to legacy template shape used by frontend where possible
    const templates = profiles.map(p => ({
      id: p.id,
      name: p.name,
      description: null,
      protocol: p.protocol,
      category: null,
      country: null,
      city: null,
      flag: null,
      icon: null,
      color: null,
      isPremium: false,
      isActive: (p.status === "ACTIVE"),
      sortOrder: p.priority ?? 0,
      tags: [] as string[],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      _count: { userProfiles: p._count.userProfiles },
    }));

    sendSuccess(res, templates, "Templates fetched (from vpn profiles)");
  } catch (err) { next(err); }
}

export async function getTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const t = await prisma.vpnTemplate.findUniqueOrThrow({ where: { id: String(req.params["id"]) } });
    // Decrypt config for admin view
    let rawConfig: ConfigMap = {};
    try { rawConfig = JSON.parse(decrypt(t.encryptedConfig)); } catch {}
    sendSuccess(res, { ...t, rawConfig, encryptedConfig: undefined }, "Template fetched");
  } catch (err) { next(err); }
}

export async function createTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { rawConfig = {}, encryptedConfig: _ignored, ...meta } = req.body as { rawConfig: ConfigMap; encryptedConfig?: unknown } & Record<string, unknown>;
    const filled = autofill(meta["protocol"] as string, rawConfig as ConfigMap);
    const enc = encrypt(JSON.stringify(filled));

    const t = await prisma.vpnTemplate.create({
      data: { ...(meta as Parameters<typeof prisma.vpnTemplate.create>[0]["data"]), encryptedConfig: enc },
    });
    await audit({ action: "VPN_CREATE", userId: req.user?.userId, entity: "vpn_template", entityId: t.id, req });

    // Return with link for sharing
    const link = buildLink(meta["protocol"] as string, filled);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: { ...t, rawConfig: filled, encryptedConfig: undefined, shareLink: link },
      message: "VPN template created",
    });
  } catch (err) { next(err); }
}

export async function updateTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { rawConfig, encryptedConfig: _ignored, ...meta } = req.body as { rawConfig?: ConfigMap; encryptedConfig?: unknown } & Record<string, unknown>;

    const existing = await prisma.vpnTemplate.findUniqueOrThrow({ where: { id: String(req.params["id"]) } });
    let enc = existing.encryptedConfig;

    if (rawConfig) {
      let existingCfg: ConfigMap = {};
      try { existingCfg = JSON.parse(decrypt(existing.encryptedConfig)); } catch {}
      const merged = autofill(meta["protocol"] as string ?? existing.protocol, { ...existingCfg, ...rawConfig });
      enc = encrypt(JSON.stringify(merged));
    }

    const t = await prisma.vpnTemplate.update({
      where: { id: String(req.params["id"]) },
      data: { ...(meta as Parameters<typeof prisma.vpnTemplate.update>[0]["data"]), encryptedConfig: enc },
    });
    await audit({ action: "VPN_CREATE", userId: req.user?.userId, entity: "vpn_template", entityId: t.id, req });
    sendSuccess(res, { ...t, encryptedConfig: undefined }, "Template updated");
  } catch (err) { next(err); }
}

export async function deleteTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.vpnTemplate.delete({ where: { id: String(req.params["id"]) } });
    await audit({ action: "VPN_DELETE", userId: req.user?.userId, entity: "vpn_template", entityId: String(req.params["id"]), req });
    sendSuccess(res, null, "Template deleted");
  } catch (err) { next(err); }
}

export async function duplicateTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const src = await prisma.vpnTemplate.findUniqueOrThrow({ where: { id: String(req.params["id"]) } });
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...data } = src;
    const copy = await prisma.vpnTemplate.create({ data: { ...data, name: `${data.name} (copie)`, isActive: false } });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: copy, message: "Template duplicated" });
  } catch (err) { next(err); }
}

export async function assignTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { type, targetId } = req.body as { type: string; targetId: string };
    const a = await prisma.vpnTemplateAssignment.upsert({
      where: { templateId_type_targetId: { templateId: String(req.params["id"]), type, targetId } },
      update: {},
      create: { templateId: String(req.params["id"]), type, targetId },
    });
    sendSuccess(res, a, "Assignment created");
  } catch (err) { next(err); }
}

export async function unassignTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { type, targetId } = req.query as { type: string; targetId: string };
    await prisma.vpnTemplateAssignment.deleteMany({
      where: { templateId: String(req.params["id"]), type, targetId },
    });
    sendSuccess(res, null, "Assignment removed");
  } catch (err) { next(err); }
}

export async function generateKeys(req: Request, res: Response, next: NextFunction) {
  try {
    const { protocol } = req.body as { protocol: string };
    const keys = autofill(protocol, {});
    sendSuccess(res, keys, "Keys generated");
  } catch (err) { next(err); }
}

// ── Mobile distribution — returns decrypted config for the connected device ──
export async function getMyConfig(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await prisma.vpnUserProfile.findFirst({
      where: { userId: req.user!.userId, status: "ACTIVE" },
      include: {
        template: true,
        user: { select: { username: true, expireAt: true, quotaRemainingGB: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!profile) return sendSuccess(res, null, "No active profile");

    // Decrypt config — user gets connection params but UI hides sensitive fields
    let connectionConfig: ConfigMap = {};
    try { connectionConfig = JSON.parse(decrypt(profile.template.encryptedConfig)); } catch {}

    // Mobile-safe response: display info + connection params (app uses them internally)
    const response = {
      // Display only (shown in UI)
      profileId:    profile.id,
      displayName:  profile.template.displayName ?? profile.template.name,
      country:      profile.template.country,
      flag:         profile.template.flag,
      icon:         profile.template.icon,
      color:        profile.template.color,
      protocol:     profile.template.protocol,
      // Access info
      expireAt:     profile.expireAt ?? profile.user.expireAt,
      quotaGB:      profile.quotaGB,
      uploadUsedMB: profile.uploadUsedMB,
      downloadUsedMB: profile.downloadUsedMB,
      maxSpeedMbps: profile.maxSpeedMbps,
      // Connection config (used by app, never displayed in UI)
      config: connectionConfig,
    };

    await audit({ action: "VPN_CONNECT", userId: req.user?.userId, entityId: profile.id, req });
    sendSuccess(res, response, "Config fetched");
  } catch (err) { next(err); }
}

export async function listUserProfiles(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId, templateId, status } = req.query as Record<string, string>;
    const profiles = await prisma.vpnUserProfile.findMany({
      where: {
        ...(userId && { userId }),
        ...(templateId && { templateId }),
        ...(status && { status: status as "ACTIVE" }),
      },
      include: {
        template: { select: { name: true, protocol: true, country: true } },
        user: { select: { username: true, email: true } },
        device: { select: { deviceName: true, model: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    sendSuccess(res, profiles, "User profiles fetched");
  } catch (err) { next(err); }
}

export async function createUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const p = await prisma.vpnUserProfile.create({ data: req.body });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: p, message: "Profile assigned" });
  } catch (err) { next(err); }
}

export async function setUserProfileStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const p = await prisma.vpnUserProfile.update({
      where: { id: String(req.params["id"]) },
      data: { status: req.body.status },
    });
    sendSuccess(res, p, "Profile status updated");
  } catch (err) { next(err); }
}
