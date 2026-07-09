import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";
import { queryUserTraffic, queryInboundTraffic, isV2RayReachable } from "../services/v2ray.service.js";

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, activeUsers, suspendedUsers,
      totalDevices, activeDevices,
      totalLicenses, activeLicenses,
      totalInbounds, activeInbounds,
      totalVouchers, activeVouchers,
      bandwidthAgg, todayBandwidthAgg,
      monthlyRevenue,
      recentActivities,
      topUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      prisma.device.count(),
      prisma.device.count({ where: { isActive: true } }),
      prisma.license.count(),
      prisma.license.count({ where: { status: "ACTIVE" } }),
      prisma.inbound.count(),
      prisma.inbound.count({ where: { enabled: true } }),
      prisma.voucher.count(),
      prisma.voucher.count({ where: { status: "ACTIVE" } }),
      prisma.usageLog.aggregate({ _sum: { uploadGB: true, downloadGB: true } }),
      prisma.usageLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { uploadGB: true, downloadGB: true },
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { action: true, userId: true, createdAt: true, details: true },
      }).catch(() => []),
      prisma.user.findMany({
        take: 5,
        orderBy: { quotaUsedGB: "desc" },
        where: { quotaUsedGB: { gt: 0 } },
        select: { id: true, username: true, email: true, quotaUsedGB: true, quotaRemainingGB: true },
      }),
    ]);

    const totalBandwidthGB =
      (bandwidthAgg._sum.uploadGB ?? 0) + (bandwidthAgg._sum.downloadGB ?? 0);
    const todayBandwidthGB =
      (todayBandwidthAgg._sum.uploadGB ?? 0) + (todayBandwidthAgg._sum.downloadGB ?? 0);

    let v2rayStatus = { reachable: false, activeConnections: 0, liveBandwidthGB: 0, inbounds: [] as { tag: string; totalGB: number }[] };
    try {
      const [reachable, liveUsers, liveInbounds] = await Promise.all([
        isV2RayReachable(),
        queryUserTraffic(false),
        queryInboundTraffic(false),
      ]);
      v2rayStatus = {
        reachable,
        activeConnections: liveUsers.users.filter((u) => u.totalBytes > 0).length,
        liveBandwidthGB: parseFloat(liveUsers.users.reduce((s, u) => s + u.totalGB, 0).toFixed(6)),
        inbounds: liveInbounds.map((i) => ({ tag: i.tag, totalGB: i.totalGB })),
      };
    } catch { /* V2Ray offline */ }

    sendSuccess(res, {
      users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers },
      devices: { total: totalDevices, active: activeDevices },
      licenses: { total: totalLicenses, active: activeLicenses },
      inbounds: { total: totalInbounds, active: activeInbounds },
      vouchers: { total: totalVouchers, active: activeVouchers },
      bandwidth: {
        totalGB: parseFloat(totalBandwidthGB.toFixed(3)),
        todayGB: parseFloat(todayBandwidthGB.toFixed(3)),
        uploadGB: parseFloat((bandwidthAgg._sum.uploadGB ?? 0).toFixed(3)),
        downloadGB: parseFloat((bandwidthAgg._sum.downloadGB ?? 0).toFixed(3)),
      },
      revenue: { monthly: monthlyRevenue._sum.amount ?? 0 },
      recentActivities,
      topUsers,
      v2ray: v2rayStatus,
      // Legacy fields for compatibility
      totalUsers, activeUsers, suspendedUsers,
      totalLicenses, activeLicenses,
      totalInbounds, activeInbounds,
    }, "Stats fetched");
  } catch (err) {
    next(err);
  }
}
