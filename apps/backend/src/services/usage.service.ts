import { prisma } from "../prisma/client.js";

export async function listUsageLogs(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [logs, total] = await prisma.$transaction([
    prisma.usageLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, username: true, email: true } } },
    }),
    prisma.usageLog.count(),
  ]);
  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserUsageLogs(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const [logs, total] = await prisma.$transaction([
    prisma.usageLog.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.usageLog.count({ where: { userId } }),
  ]);
  const agg = await prisma.usageLog.aggregate({
    where: { userId },
    _sum: { uploadGB: true, downloadGB: true },
  });
  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalUploadMB: agg._sum.uploadGB ?? 0,
    totalDownloadMB: agg._sum.downloadGB ?? 0,
  };
}
