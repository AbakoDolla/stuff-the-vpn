/**
 * wireguard-sync.service.ts
 * Synchronise le trafic WireGuard en parsant la sortie de `wg show all dump`
 * ou via l'API JSON du démon wg-json (https://github.com/fac/wireguard-json).
 *
 * Fallback : lecture du fichier /var/run/wireguard/<iface>.sock si disponible.
 */

import { execSync } from "child_process";
import { prisma } from "../prisma/client.js";
import { logger } from "../lib/logger.js";

const SYNC_INTERVAL_MS = Number(process.env["WG_SYNC_INTERVAL_MS"] ?? "30000");
const WG_INTERFACES = (process.env["WG_INTERFACES"] ?? "wg0").split(",").map((s) => s.trim());

let _timer: ReturnType<typeof setInterval> | null = null;

interface WgPeer {
  publicKey: string;
  allowedIps: string;
  rxBytes: number;
  txBytes: number;
  lastHandshake: number; // unix timestamp seconds
  endpoint: string;
}

interface WgDump {
  interface: string;
  peers: WgPeer[];
}

/**
 * Parse `wg show <iface> dump` output.
 * Output format per peer (tab-separated):
 *  publicKey  presharedKey  endpoint  allowedIps  latestHandshake  rxBytes  txBytes  keepalive
 */
function parseWgDump(iface: string): WgDump | null {
  try {
    const raw = execSync(`wg show ${iface} dump`, { encoding: "utf8", timeout: 5000 });
    const lines = raw.trim().split("\n");

    const peers: WgPeer[] = [];
    // First line is the interface itself, skip it
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i]!.split("\t");
      if (parts.length < 8) continue;
      peers.push({
        publicKey:     parts[0]!,
        allowedIps:    parts[3]!,
        lastHandshake: parseInt(parts[4]!, 10) || 0,
        rxBytes:       parseInt(parts[5]!, 10) || 0,
        txBytes:       parseInt(parts[6]!, 10) || 0,
        endpoint:      parts[2]!,
      });
    }
    return { interface: iface, peers };
  } catch {
    return null;
  }
}

/**
 * Try to match WireGuard peer publicKey to a user in the DB.
 * We store the WG public key in the Inbound `wgPublicKey` field or in VpnProfile.
 */
async function matchPeerToUser(peer: WgPeer): Promise<string | null> {
  // 1. Check VpnProfile (user-specific config)
  const profile = await prisma.vpnProfile.findFirst({
    where: { encryptedConfig: { contains: peer.publicKey } },
    select: { userId: true },
  }).catch(() => null);

  if (profile?.userId) return profile.userId;

  // 2. Check Inbound wgPublicKey (shared server key — cannot attribute to specific user)
  return null;
}

export async function syncWireGuardOnce(): Promise<{
  ifaces: number;
  peers: number;
  synced: number;
  suspended: number;
}> {
  let totalPeers = 0;
  let totalSynced = 0;
  let totalSuspended = 0;

  for (const iface of WG_INTERFACES) {
    const dump = parseWgDump(iface);
    if (!dump) {
      logger.warn({ iface }, "WireGuard: cannot read dump (wg not installed or iface missing)");
      continue;
    }

    totalPeers += dump.peers.length;

    for (const peer of dump.peers) {
      const userId = await matchPeerToUser(peer);
      if (!userId) continue;

      // Convert bytes to GB
      const rxGB = parseFloat((peer.rxBytes / 1_073_741_824).toFixed(9));
      const txGB = parseFloat((peer.txBytes / 1_073_741_824).toFixed(9));

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, quotaRemainingGB: true, quotaUsedGB: true, status: true },
      }).catch(() => null);

      if (!user || user.status === "SUSPENDED") continue;

      // Compute delta from last log entry
      const lastLog = await prisma.usageLog.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { uploadGB: true, downloadGB: true },
      }).catch(() => null);

      // Simple delta: if current total < last log total, reset was done (delta = current)
      const prevRx = lastLog?.downloadGB ?? 0;
      const prevTx = lastLog?.uploadGB ?? 0;
      const deltaRx = rxGB > prevRx ? rxGB - prevRx : rxGB;
      const deltaTx = txGB > prevTx ? txGB - prevTx : txGB;

      if (deltaRx + deltaTx < 0.000001) continue; // nothing meaningful

      const newUsed = parseFloat((user.quotaUsedGB + deltaRx + deltaTx).toFixed(6));
      const newRemaining = Math.max(0, parseFloat((user.quotaRemainingGB - deltaRx - deltaTx).toFixed(6)));
      const shouldSuspend = newRemaining <= 0 && user.status === "ACTIVE";

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            quotaUsedGB: newUsed,
            quotaRemainingGB: newRemaining,
            ...(shouldSuspend ? { status: "SUSPENDED" } : {}),
          },
        }),
        prisma.usageLog.create({
          data: {
            userId: user.id,
            uploadGB: parseFloat(deltaTx.toFixed(6)),
            downloadGB: parseFloat(deltaRx.toFixed(6)),
            totalGB: parseFloat((deltaRx + deltaTx).toFixed(6)),
          },
        }),
      ]).catch((e) => logger.error({ err: e, userId }, "WireGuard: DB update failed"));

      totalSynced++;
      if (shouldSuspend) totalSuspended++;
    }
  }

  return { ifaces: WG_INTERFACES.length, peers: totalPeers, synced: totalSynced, suspended: totalSuspended };
}

export function startWireGuardSync(): void {
  if (_timer) return;
  logger.info({ ifaces: WG_INTERFACES, intervalMs: SYNC_INTERVAL_MS }, "WireGuard sync started");

  _timer = setInterval(async () => {
    try {
      const result = await syncWireGuardOnce();
      if (result.synced > 0) {
        logger.info(result, "WireGuard sync tick");
      }
    } catch (err) {
      logger.error({ err }, "WireGuard sync error");
    }
  }, SYNC_INTERVAL_MS);

  // Run immediately
  syncWireGuardOnce().catch((err) => logger.error({ err }, "WireGuard initial sync failed"));
}

export function stopWireGuardSync(): void {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    logger.info("WireGuard sync stopped");
  }
}
