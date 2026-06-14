import { prisma } from "../prisma/client.js";
import { omit } from "../utils/crypto.js";
import type { DEFAULT_PAGE_SIZE } from "../constants/index.js";

export async function listUsers(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.user.count(),
  ]);
  return {
    users: users.map((u) => omit(u, ["password"])),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  return omit(user, ["password"]);
}

export async function updateUser(id: string, data: Partial<{
  username: string;
  email: string;
  deviceLimit: number;
  expireAt: string;
}>) {
  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      expireAt: data.expireAt ? new Date(data.expireAt) : undefined,
      updatedAt: new Date(),
    },
  });
  return omit(updated, ["password"]);
}

export async function setUserStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") {
  const updated = await prisma.user.update({ where: { id }, data: { status } });
  return omit(updated, ["password"]);
}

export async function addQuota(id: string, addGB: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.user.update({
    where: { id },
    data: { quotaRemainingGB: user.quotaRemainingGB + addGB },
  });
  return omit(updated, ["password"]);
}

export async function extendExpiry(id: string, days: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  const base = user.expireAt && user.expireAt > new Date() ? user.expireAt : new Date();
  const newExpiry = new Date(base.getTime() + days * 86_400_000);
  const updated = await prisma.user.update({ where: { id }, data: { expireAt: newExpiry } });
  return omit(updated, ["password"]);
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
}
