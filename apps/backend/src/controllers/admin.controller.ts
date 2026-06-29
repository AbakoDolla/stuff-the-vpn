import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";
import { queryUserTraffic, queryInboundTraffic, isV2RayReachable } from "../services/v2ray.service.js";

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalVouchers,
      activeVouchers,
      usedVouchers,
      totalLicenses,
      activeLicenses,
      totalInbounds,
      activeInbounds,
      totalPlans,
      activePlans,
      recentUsers,
      // Bandwidth totals from DB (accumulated by traffic-sync)
      bandwidthAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      prisma.voucher.count(),
      prisma.voucher.count({ where: { status: "ACTIVE" } }),
      prisma.voucher.count({ where: { status: "USED" } }),
      prisma.license.count(),
      prisma.license.count({ where: { status: "ACTIVE" } }),
      prisma.inbound.count(),
      prisma.inbound.count({ where: { enabled: true } }),
      prisma.plan.count(),
      prisma.plan.count({ where: { isActive: true } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { username: true, email: true, createdAt: true, status: true },
      }),
      // Sum all usage logs for total bandwidth consumed
      prisma.usageLog.aggregate({
        _sum: { uploadGB: true, downloadGB: true },
      }),
    ]);

    // Total bandwidth in GB from DB logs
    const totalUploadMB = bandwidthAgg._sum.uploadGB ?? 0;
    const totalDownloadMB = bandwidthAgg._sum.downloadGB ?? 0;
    const totalBandwidthGB = parseFloat(((totalUploadMB + totalDownloadMB) / 1024).toFixed(3));

    // Live V2Ray data (non-blocking — falls back gracefully if V2Ray is down)
    let v2rayStatus: {
      reachable: boolean;
      activeConnections: number;
      liveBandwidthGB: number;
      inbounds: { tag: string; totalGB: number }[];
    } = { reachable: false, activeConnections: 0, liveBandwidthGB: 0, inbounds: [] };

    try {
      const [reachable, liveUsers, liveInbounds] = await Promise.all([
        isV2RayReachable(),
        queryUserTraffic(false),   // snapshot without reset
        queryInboundTraffic(false),
      ]);
      v2rayStatus = {
        reachable,
        activeConnections: liveUsers.users.filter((u) => u.totalBytes > 0).length,
        liveBandwidthGB: parseFloat(
          liveUsers.users.reduce((s, u) => s + u.totalGB, 0).toFixed(6)
        ),
        inbounds: liveInbounds.map((i) => ({ tag: i.tag, totalGB: i.totalGB })),
      };
    } catch {
      // V2Ray unavailable — stats still work, just without live data
    }

    sendSuccess(res, {
      // Users
      totalUsers,
      activeUsers,
      suspendedUsers,
      // Vouchers
      totalVouchers,
      activeVouchers,
      usedVouchers,
      // Licenses
      totalLicenses,
      activeLicenses,
      // Inbounds
      totalInbounds,
      activeInbounds,
      // Plans
      totalPlans,
      activePlans,
      // Recent activity
      recentUsers,
      // Bandwidth (accumulated from UsageLogs)
      bandwidth: {
        totalUploadMB: parseFloat(totalUploadMB.toFixed(3)),
        totalDownloadMB: parseFloat(totalDownloadMB.toFixed(3)),
        totalGB: totalBandwidthGB,
      },
      // Live V2Ray metrics
      v2ray: v2rayStatus,
    }, "Stats fetched successfully");
  } catch (err) {
    next(err);
  }
}
