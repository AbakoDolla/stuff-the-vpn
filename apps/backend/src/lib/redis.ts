import { createClient } from "redis";
import { env } from "../config/env.js";

let client: ReturnType<typeof createClient> | null = null;

export async function getRedis() {
  if (!client) {
    client = createClient({ url: env.REDIS_URL ?? "redis://localhost:6379" });
    client.on("error", (err) => console.error("[Redis] error:", err));
    await client.connect();
  }
  return client;
}

export async function redisSet(key: string, value: string, ttlSec?: number) {
  const r = await getRedis();
  if (ttlSec) await r.set(key, value, { EX: ttlSec });
  else await r.set(key, value);
}

export async function redisGet(key: string): Promise<string | null> {
  const r = await getRedis();
  return r.get(key);
}

export async function redisDel(key: string) {
  const r = await getRedis();
  return r.del(key);
}

export async function redisIncr(key: string) {
  const r = await getRedis();
  return r.incr(key);
}
