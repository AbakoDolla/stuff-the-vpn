import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client.js";
import { omit } from "../utils/crypto.js";

  export async function createUser(data: {
    username: string;
    email: string;
    password?: string;
    role?: string;
    deviceLimit?: number;
    quotaRemainingGB?: number;
    expireAt?: string;
  }) {
    const hashed = data.password ? await bcrypt.hash(data.password, 10) : null;
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashed,
        role: (data.role ?? "USER") as "USER" | "ADMIN" | "SUPER_ADMIN" | "RESELLER",
        deviceLimit: data.deviceLimit ?? 2,
        quotaRemainingGB: data.quotaRemainingGB ?? 10,
        expireAt: data.expireAt ? new Date(data.expireAt) : null,
      },
    });
    return omit(user, ["password"]);
  }

  export async function listUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: { reseller: { select: { id: true, name: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: data.map((u) => { const { password: _pw, ...rest } = u; return rest; }),
      total,
      page,
      limit,
    };
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
    const existingUser = await prisma.user.findUniqueOrThrow({ where: { id } });
    if (existingUser.role === "SUPER_ADMIN" && data["role"] && data["role"] !== "SUPER_ADMIN") {
      throw new Error("Cannot change role of SUPER_ADMIN users");
    }
    if (existingUser.role === "SUPER_ADMIN") {
      delete data["role"];
    }
    const user = await prisma.user.update({ where: { id }, data });
    return omit(user, ["password"]);
  }

  export async function setUserStatus(id: string, status: string) {
    const existingUser = await prisma.user.findUniqueOrThrow({ where: { id } });
    if (existingUser.role === "SUPER_ADMIN") {
      throw new Error("Cannot change status of SUPER_ADMIN users");
    }
    const user = await prisma.user.update({
      where: { id },
      data: { status: status as "ACTIVE" | "SUSPENDED" | "BANNED" },
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
    const newExpiry = new Date(currentExpiry.getTime() + days * 86_400_000);
    const updated = await prisma.user.update({ where: { id }, data: { expireAt: newExpiry } });
    return omit(updated, ["password"]);
  }

  export async function deleteUser(id: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    if (user.role === "SUPER_ADMIN") {
      throw new Error("Cannot delete SUPER_ADMIN users");
    }
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: "BANNED" },
    });
  }
