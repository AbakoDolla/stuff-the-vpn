/**
 * vpn.service.ts
 * Service principal VPN — génère et retourne les configs chiffrées
 * pour l'application mobile. Utilise le modèle Inbound.
 */
import { prisma } from "../prisma/client.js";
import { encryptConfig, decryptConfig } from "../lib/crypto.js";

// ─── Config generation helpers ────────────────────────────────────────────────

function generateVlessUri(userId: string, inbound: {
  host: string; port: number; path?: string | null; sni?: string | null;
  pbk?: string | null; sid?: string | null; fp?: string | null;
  network?: string | null; tls: boolean; remark: string;
  protocol: string;
}): string {
  const isReality = inbound.protocol === "VLESS_REALITY";
  const params = new URLSearchParams();
  params.set("type",       inbound.network ?? "tcp");
  params.set("security",   isReality ? "reality" : (inbound.tls ? "tls" : "none"));
  if (inbound.path)    params.set("path",    inbound.path);
  if (inbound.sni)     params.set("sni",     inbound.sni);
  if (inbound.fp)      params.set("fp",      inbound.fp);
  if (isReality && inbound.pbk) params.set("pbk", inbound.pbk);
  if (isReality && inbound.sid) params.set("sid", inbound.sid);
  return `vless://${userId}@${inbound.host}:${inbound.port}?${params.toString()}#${encodeURIComponent(inbound.remark)}`;
}

function generateVmessUri(userId: string, inbound: {
  host: string; port: number; path?: string | null; sni?: string | null;
  network?: string | null; tls: boolean; remark: string;
}): string {
  const vmConfig = {
    v: "2", ps: inbound.remark, add: inbound.host, port: inbound.port,
    id: userId, aid: 0,
    net: inbound.network ?? "tcp",
    type: "none",
    host: inbound.sni ?? "",
    path: inbound.path ?? "",
    tls: inbound.tls ? "tls" : "",
  };
  return `vmess://${Buffer.from(JSON.stringify(vmConfig)).toString("base64")}`;
}

function generateTrojanUri(userId: string, inbound: {
  host: string; port: number; sni?: string | null; path?: string | null;
  network?: string | null; remark: string;
}): string {
  const params = new URLSearchParams();
  if (inbound.sni)     params.set("sni",  inbound.sni);
  if (inbound.path)    params.set("path", inbound.path);
  if (inbound.network) params.set("type", inbound.network);
  return `trojan://${userId}@${inbound.host}:${inbound.port}?${params.toString()}#${encodeURIComponent(inbound.remark)}`;
}

function generateSsUri(inbound: {
  host: string; port: number; ssMethod?: string | null;
  ssPassword?: string | null; remark: string;
}): string {
  const userinfo = Buffer.from(`${inbound.ssMethod ?? "aes-256-gcm"}:${inbound.ssPassword ?? ""}`).toString("base64");
  return `ss://${userinfo}@${inbound.host}:${inbound.port}#${encodeURIComponent(inbound.remark)}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Génère toutes les configs actives pour un utilisateur.
 * Les configs sont retournées CHIFFRÉES (AES-256).
 */
export async function getMyConfig(userId: string): Promise<string> {
  const inbounds = await prisma.inbound.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
  });

  const lines: string[] = [];

  for (const inbound of inbounds) {
    switch (inbound.protocol) {
      case "VLESS":
      case "VLESS_REALITY":
        lines.push(generateVlessUri(userId, inbound));
        break;
      case "VMESS":
        lines.push(generateVmessUri(userId, inbound));
        break;
      case "TROJAN":
      case "TROJAN_GO":
        lines.push(generateTrojanUri(userId, inbound));
        break;
      case "SHADOWSOCKS":
        lines.push(generateSsUri(inbound));
        break;
      // SSH, WireGuard, OpenVPN — configs retournées depuis le champ dédié
      case "SSH":
      case "SSH_PAYLOAD":
      case "SSH_SSL":
      case "SSH_WEBSOCKET":
      case "SSH_SLOWDNS":
        if (inbound.sshUser && inbound.sshPassword) {
          lines.push(`ssh://${inbound.sshUser}:${inbound.sshPassword}@${inbound.host}:${inbound.port}#${encodeURIComponent(inbound.remark)}`);
        }
        break;
      case "WIREGUARD":
        if (inbound.wgPublicKey) {
          lines.push(`wireguard://${inbound.host}:${inbound.port}?pubkey=${inbound.wgPublicKey}#${encodeURIComponent(inbound.remark)}`);
        }
        break;
      default:
        break;
    }
  }

  const rawConfig = lines.join("\n");
  // Chiffrement AES-256 — le mobile doit déchiffrer avec sa clé dérivée
  return encryptConfig(rawConfig);
}

/** Retourne la liste des inbounds actifs (sans credentials sensibles) */
export async function getServers() {
  return prisma.inbound.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, remark: true, host: true, port: true,
      protocol: true, network: true, tls: true,
      isPremium: true, sortOrder: true,
      activeConns: true, totalUpGB: true, totalDownGB: true,
    },
  });
}

/** Retourne le premier inbound actif recommandé */
export async function getRecommendedServer() {
  return prisma.inbound.findFirst({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, remark: true, host: true, port: true, protocol: true },
  });
}

/** Config VPN complète pour un utilisateur (chiffrée) */
export async function getVpnConfig(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, username: true, quotaRemainingGB: true, quotaUsedGB: true, expireAt: true, status: true },
  });

  if (user.status !== "ACTIVE") {
    throw new Error(`Account is ${user.status.toLowerCase()}`);
  }

  const encryptedConfig = await getMyConfig(userId);
  const serverCount = await prisma.inbound.count({ where: { enabled: true } });

  return {
    userId: user.id,
    username: user.username,
    encryptedConfig,
    serverCount,
    quotaUsedGB: user.quotaUsedGB,
    quotaRemainingGB: user.quotaRemainingGB,
    expireAt: user.expireAt,
  };
}

/** Statut de connexion VPN de l'utilisateur */
export async function getVpnStatus(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { quotaUsedGB: true, quotaRemainingGB: true, expireAt: true, status: true },
  });

  const activeSession = await prisma.session.findFirst({
    where: { userId, isActive: true },
    orderBy: { lastUsedAt: "desc" },
  });

  return {
    isConnected: activeSession !== null,
    connectedSince: activeSession?.createdAt ?? null,
    deviceName: activeSession?.deviceName ?? null,
    ipAddress: activeSession?.ipAddress ?? null,
    dataUsedGB: user.quotaUsedGB,
    dataRemainingGB: user.quotaRemainingGB,
    expireAt: user.expireAt,
    status: user.status,
  };
}

export async function connectVpn(userId: string, _serverId?: string) {
  await prisma.usageLog.create({
    data: { userId, uploadMB: 0, downloadMB: 0 },
  });
  return { status: "connected", message: "VPN connected successfully" };
}

export async function disconnectVpn(userId: string) {
  await prisma.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
  return { status: "disconnected", message: "VPN disconnected successfully" };
}
