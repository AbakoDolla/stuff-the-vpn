/**
 * rate-limit.middleware.ts
 * Rate limiting par IP basé sur Redis (sliding window).
 */
import type { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis.js";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { logger } from "../lib/logger.js";

interface RateLimitOptions {
  windowSec: number;
  maxRequests: number;
  keyPrefix?: string;
}

const memStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(opts: RateLimitOptions) {
  const { windowSec, maxRequests, keyPrefix = "rl" } = opts;
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip  = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const key = `sxbvpn:${keyPrefix}:${ip}`;
    try {
      const current = await redis.incr(key);
      if (current === 1) await redis.expire(key, windowSec);
      res.setHeader("X-RateLimit-Limit",     String(maxRequests));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, maxRequests - current)));
      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        res.setHeader("Retry-After", String(ttl));
        sendError(res, "Too many requests", HTTP_STATUS.TOO_MANY_REQUESTS);
        return;
      }
    } catch (err) {
      logger.warn({ err }, "Redis rate limit unavailable, using in-memory fallback");
      const now = Date.now();
      const entry = memStore.get(key);
      if (!entry || entry.resetAt < now) {
        memStore.set(key, { count: 1, resetAt: now + windowSec * 1000 });
      } else {
        entry.count++;
        if (entry.count > maxRequests) {
          sendError(res, "Too many requests", HTTP_STATUS.TOO_MANY_REQUESTS);
          return;
        }
      }
    }
    next();
  };
}

export const authRateLimit   = rateLimit({ windowSec: 60,  maxRequests: 10,  keyPrefix: "auth" });
export const apiRateLimit    = rateLimit({ windowSec: 60,  maxRequests: 120, keyPrefix: "api" });
export const strictRateLimit = rateLimit({ windowSec: 300, maxRequests: 5,   keyPrefix: "strict" });
