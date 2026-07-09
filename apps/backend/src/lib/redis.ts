/**
 * redis.ts — Client Redis singleton
 * Utilisé pour : rate limiting, cache sessions, pub/sub Socket.IO
 */
import { createClient } from "redis";
import { logger } from "./logger.js";
import { env } from "../config/env.js";

const client = createClient({ url: env.REDIS_URL });

client.on("error", (err) => { logger.error({ err }, "Redis client error"); });
client.on("connect", () => { logger.info("Redis connected"); });

let _connected = false;

export async function connectRedis(): Promise<void> {
  if (_connected) return;
  await client.connect();
  _connected = true;
}

export async function disconnectRedis(): Promise<void> {
  if (!_connected) return;
  await client.disconnect();
  _connected = false;
}

export { client as redis };

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    await client.setEx(`sxbvpn:${key}`, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn({ err, key }, "Redis cacheSet failed");
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await client.get(`sxbvpn:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheDel(key: string): Promise<void> {
  try { await client.del(`sxbvpn:${key}`); } catch { /* ignore */ }
}
