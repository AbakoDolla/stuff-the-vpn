import { prisma } from "../prisma/client.js";
import { omit } from "../utils/crypto.js";

export async function listUsers(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { reseller: { select: { id: true, name: true } } },
    }),
    prisma.user.count(),
  ]);
  return { data: data.map((u) => omit(u, ["password"])), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
    include: {
      licenses: { select: { token: true, dataLimitGB: true, dataUsedGB: true, status: true, expireAt: true } },
      devices: { select: { deviceId: true, deviceName: true, lastSeenAt: true, isActive: true } },
    },
  });
  return omit(user, ["password"]);
}

export async function getSubscription(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const license = await prisma.license.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  return {
    plan: license ? "Premium" : "Free",
    dataLimit: license?.dataLimitGB ?? 0,
    dataUsed: user.quotaUsedGB,
    dataRemaining: user.quotaRemainingGB,
    deviceLimit: user.deviceLimit,
    deviceCount: await prisma.device.count({ where: { userId, isActive: true } }),
    expireAt: user.expireAt ?? license?.expireAt ?? null,
    status: user.status,
  };
}

export async function getUserStatus(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const activeSession = await prisma.session.findFirst({
    where: { userId, isActive: true },
    orderBy: { lastUsedAt: "desc" },
  });
  const deviceCount = await prisma.device.count({ where: { userId, isActive: true } });

  return {
    id: user.id,
    status: user.status,
    isOnline: activeSession !== null,
    deviceCount,
    deviceLimit: user.deviceLimit,
    quotaUsedGB: user.quotaUsedGB,
    quotaRemainingGB: user.quotaRemainingGB,
    expireAt: user.expireAt,
  };
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const user = await prisma.user.update({ where: { id }, data });
  return omit(user, ["password"]);
}

export async function setUserStatus(id: string, status: string) {
  const user = await prisma.user.update({
    where: { id },
    data: { status: status as any },
  });
  return omit(user, ["password"]);
}

export async function addQuota(id: string, addGB: number) {
  const user = await prisma.user.update({
    where: { id },
    data: { quotaRemainingGB: { increment: addGB } },
  });
  return omit(user, ["password"]);
}

export async function extendExpiry(id: string, days: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  const currentExpiry = user.expireAt ?? new Date();
  const newExpiry = new Date(currentExpiry.getTime() + days * 86400000);
  const updated = await prisma.user.update({
    where: { id },
    data: { expireAt: newExpiry },
  });
  return omit(updated, ["password"]);
}

export async function deleteUser(id: string) {
  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), status: "BANNED" },
  });
}