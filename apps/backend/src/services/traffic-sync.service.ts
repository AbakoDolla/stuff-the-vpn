/**
 * Traffic Sync Service
 *
 * Runs a periodic loop (default every 60 s) that:
 *  1. Queries V2Ray stats API for per-user traffic deltas (with reset=true)
 *  2. For each user with non-zero traffic:
 *     a. Increments quotaUsedGB
 *     b. Decrements quotaRemainingGB (floor at 0)
 *     c. Persists a UsageLog row
 *     d. Suspends user if quotaRemainingGB reaches 0
 *  3. Logs a summary
 *
 * Designed to be resilient: if V2Ray is unreachable the loop logs a warning
 * and retries on the next tick — it never crashes the process.
 */

import { prisma } from "../prisma/client.js";
import { logger } from "../lib/logger.js";
import { queryUserTraffic } from "./v2ray.service.js";

const SYNC_INTERVAL_MS = Number(process.env["TRAFFIC_SYNC_INTERVAL_MS"] ?? "60000");

let _timer: ReturnType<typeof setInterval> | null = null;
let _running = false;

export async function syncTrafficOnce(): Promise<{
  synced: number;
  suspended: number;
  skipped: number;
  v2rayOk: boolean;
}> {
  const result = await queryUserTraffic(true);  // reset=true for incremental deltas

  if (!result.ok || result.users.length === 0) {
    return { synced: 0, suspended: 0, skipped: 0, v2rayOk: result.ok };
  }

  // Filter out zero-traffic entries
  const active = result.users.filter((u) => u.totalBytes > 0);

  let synced = 0;
  let suspended = 0;
  const skipped = result.users.length - active.length;

  // Process in batches to avoid overwhelming the DB
  for (const delta of active) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: delta.userId },
        select: { id: true, quotaRemainingGB: true, quotaUsedGB: true, status: true },
      });

      if (!user) continue;           // user deleted between V2Ray tick and now
      if (user.status === "SUSPENDED") continue;

      const newUsed = parseFloat((user.quotaUsedGB + delta.totalGB).toFixed(6));
      const newRemaining = Math.max(0, parseFloat((user.quotaRemainingGB - delta.totalGB).toFixed(6)));
      const shouldSuspend = newRemaining <= 0 && user.status === "ACTIVE";

      // Atomic update + usage log in a transaction
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
            uploadMB: parseFloat((delta.uplinkBytes / 1_048_576).toFixed(3)),
            downloadMB: parseFloat((delta.downlinkBytes / 1_048_576).toFixed(3)),
          },
        }),
      ]);

      synced++;
      if (shouldSuspend) {
        suspended++;
        logger.warn({ userId: user.id }, "User suspended: quota exhausted");
      }
    } catch (err) {
      logger.error({ err, userId: delta.userId }, "Failed to sync traffic for user");
    }
  }

  logger.info(
    { synced, suspended, skipped, queriedAt: result.queriedAt },
    "Traffic sync complete"
  );

  return { synced, suspended, skipped, v2rayOk: true };
}

/** Start the periodic traffic sync loop. Call once from index.ts. */
export function startTrafficSync(): void {
  if (_running) {
    logger.warn("Traffic sync already running — ignoring duplicate start");
    return;
  }
  _running = true;

  // Run immediately on start, then every SYNC_INTERVAL_MS
  void syncTrafficOnce().catch((err) =>
    logger.error({ err }, "Initial traffic sync failed")
  );

  _timer = setInterval(() => {
    void syncTrafficOnce().catch((err) =>
      logger.error({ err }, "Periodic traffic sync failed")
    );
  }, SYNC_INTERVAL_MS);

  logger.info(
    { intervalMs: SYNC_INTERVAL_MS },
    "Traffic sync loop started"
  );
}

/** Stop the loop (for graceful shutdown). */
export function stopTrafficSync(): void {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    _running = false;
    logger.info("Traffic sync loop stopped");
  }
}
