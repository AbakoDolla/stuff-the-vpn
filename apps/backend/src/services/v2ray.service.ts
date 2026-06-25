/**
 * V2Ray HTTP Stats API client.
 *
 * V2Ray (or Xray) exposes a simple HTTP API when you add a StatsServiceConfig
 * to your server config:
 *
 *   "stats": {},
 *   "policy": { "system": { "statsUserUplink": true, "statsUserDownlink": true } },
 *   "api": { "tag": "api", "services": ["StatsService"] },
 *
 * The HTTP server listens on V2RAY_API_URL (default http://127.0.0.1:10085).
 *
 * Stat name format:
 *   user>>>{email}>>>traffic>>>downlink   (bytes received by client)
 *   user>>>{email}>>>traffic>>>uplink     (bytes sent by client)
 *
 * We use email = "{userId}@sxbvpn" to map stats back to our users.
 */

import { logger } from "../lib/logger.js";

const V2RAY_API_URL = process.env["V2RAY_API_URL"] ?? "http://127.0.0.1:10085";
const V2RAY_ENABLED = process.env["V2RAY_API_ENABLED"] !== "false";
const FETCH_TIMEOUT_MS = 5_000;
const EMAIL_SUFFIX = "@sxbvpn";

export interface UserTrafficDelta {
  /** userId extracted from the stat email */
  userId: string;
  /** bytes uploaded (client → server) in this sampling window */
  uplinkBytes: number;
  /** bytes downloaded (server → client) in this sampling window */
  downlinkBytes: number;
  /** total bytes = uplink + downlink */
  totalBytes: number;
  /** total as GB (3 decimal places) */
  totalGB: number;
}

export interface V2RayStatsResult {
  ok: boolean;
  users: UserTrafficDelta[];
  /** raw error message if ok=false */
  error?: string;
  /** ISO timestamp of the query */
  queriedAt: string;
}

interface V2RayStat {
  name: string;
  /** The API returns the value as a string (int64 serialised as JSON string) */
  value?: string;
}

/**
 * Query V2Ray stats API and return per-user traffic deltas.
 * Passing `reset=true` resets the counters so the next call gets only the
 * traffic since this call — exactly what we want for incremental accounting.
 */
export async function queryUserTraffic(reset = true): Promise<V2RayStatsResult> {
  const now = new Date().toISOString();

  if (!V2RAY_ENABLED) {
    return { ok: false, error: "V2RAY_API_ENABLED=false", users: [], queriedAt: now };
  }

  const url = `${V2RAY_API_URL}/v1/stats/query?pattern=user&reset=${reset ? "true" : "false"}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} from V2Ray API`, users: [], queriedAt: now };
    }

    const body = (await res.json()) as { stat?: V2RayStat[] };
    const stats: V2RayStat[] = body.stat ?? [];

    // Group by userId
    const map = new Map<string, { uplink: number; downlink: number }>();

    for (const stat of stats) {
      // Format: user>>>{email}>>>traffic>>>{direction}
      const parts = stat.name.split(">>>");
      if (parts.length !== 4 || parts[0] !== "user" || parts[2] !== "traffic") continue;

      const email = parts[1];        // e.g. "abc123@sxbvpn"
      const direction = parts[3];    // "uplink" | "downlink"

      if (!email.endsWith(EMAIL_SUFFIX)) continue;
      const userId = email.slice(0, -EMAIL_SUFFIX.length);
      if (!userId) continue;

      const bytes = Number(stat.value ?? "0");
      if (!map.has(userId)) map.set(userId, { uplink: 0, downlink: 0 });
      const entry = map.get(userId)!;

      if (direction === "uplink") entry.uplink += bytes;
      else if (direction === "downlink") entry.downlink += bytes;
    }

    const users: UserTrafficDelta[] = [];
    for (const [userId, { uplink, downlink }] of map) {
      const totalBytes = uplink + downlink;
      users.push({
        userId,
        uplinkBytes: uplink,
        downlinkBytes: downlink,
        totalBytes,
        totalGB: parseFloat((totalBytes / 1_073_741_824).toFixed(6)),
      });
    }

    return { ok: true, users, queriedAt: now };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ err: msg, url }, "V2Ray stats API unavailable");
    return { ok: false, error: msg, users: [], queriedAt: now };
  }
}

/**
 * Query all inbound traffic stats (aggregate, not per-user).
 * Useful for the admin dashboard bandwidth widget.
 */
export interface InboundTraffic {
  tag: string;
  uplinkBytes: number;
  downlinkBytes: number;
  totalGB: number;
}

export async function queryInboundTraffic(reset = false): Promise<InboundTraffic[]> {
  if (!V2RAY_ENABLED) return [];

  const url = `${V2RAY_API_URL}/v1/stats/query?pattern=inbound&reset=${reset ? "true" : "false"}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) return [];

    const body = (await res.json()) as { stat?: V2RayStat[] };
    const stats: V2RayStat[] = body.stat ?? [];

    const map = new Map<string, { uplink: number; downlink: number }>();
    for (const stat of stats) {
      const parts = stat.name.split(">>>");
      if (parts.length !== 4 || parts[0] !== "inbound" || parts[2] !== "traffic") continue;
      const tag = parts[1];
      const dir = parts[3];
      if (!map.has(tag)) map.set(tag, { uplink: 0, downlink: 0 });
      const e = map.get(tag)!;
      const bytes = Number(stat.value ?? "0");
      if (dir === "uplink") e.uplink += bytes;
      else if (dir === "downlink") e.downlink += bytes;
    }

    return [...map.entries()].map(([tag, { uplink, downlink }]) => ({
      tag,
      uplinkBytes: uplink,
      downlinkBytes: downlink,
      totalGB: parseFloat(((uplink + downlink) / 1_073_741_824).toFixed(6)),
    }));
  } catch {
    return [];
  }
}

/** Check whether the V2Ray stats API is reachable */
export async function isV2RayReachable(): Promise<boolean> {
  if (!V2RAY_ENABLED) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3_000);
    try {
      const res = await fetch(`${V2RAY_API_URL}/v1/stats/query?pattern=PING&reset=false`, {
        signal: controller.signal,
      });
      return res.status < 500;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}
