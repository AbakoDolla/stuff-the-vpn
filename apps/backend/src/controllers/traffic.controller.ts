import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { syncTrafficOnce } from "../services/traffic-sync.service.js";
import {
  queryUserTraffic,
  queryInboundTraffic,
  isV2RayReachable,
} from "../services/v2ray.service.js";

/** GET /api/admin/traffic — live per-user traffic snapshot (no reset) */
export async function getTrafficSnapshot(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [userStats, inboundStats, reachable] = await Promise.all([
      queryUserTraffic(false),
      queryInboundTraffic(false),
      isV2RayReachable(),
    ]);

    sendSuccess(res, {
      v2rayReachable: reachable,
      queriedAt: userStats.queriedAt,
      users: userStats.users,
      inbounds: inboundStats,
      totalUserCount: userStats.users.length,
      totalBandwidthGB: parseFloat(
        userStats.users
          .reduce((s, u) => s + u.totalGB, 0)
          .toFixed(6)
      ),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/traffic/sync — trigger a manual sync cycle */
export async function triggerSync(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await syncTrafficOnce();
    if (!result.v2rayOk) {
      sendError(
        res,
        "V2Ray stats API is unreachable — check V2RAY_API_URL",
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
      return;
    }
    sendSuccess(res, result, "Traffic sync completed");
  } catch (err) {
    next(err);
  }
}
