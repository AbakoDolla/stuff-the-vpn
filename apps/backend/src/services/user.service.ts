import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client.js";
import { omit } from "../utils/crypto.js";

// Generate a unique login token
function generateLoginToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'SXB-';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

  export async function createUser(data: {
    username: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
    deviceLimit?: number;
    quotaRemainingGB?: number;
    expireAt?: string;
    name?: string;
  }) {
    const hashed = data.password ? await bcrypt.hash(data.password, 10) : null;
    
    // Generate login token for dashboard access (non-admin users)
    const loginToken = generateLoginToken();
    const loginTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        name: data.name || data.username,
        email: data.email || null,
        phone: data.phone || null,
        password: hashed,
        role: (data.role ?? "USER") as "USER" | "ADMIN" | "SUPER_ADMIN" | "RESELLER",
        deviceLimit: data.deviceLimit ?? 2,
        quotaRemainingGB: data.quotaRemainingGB ?? 10,
        expireAt: data.expireAt ? new Date(data.expireAt) : null,
        loginToken,
        loginTokenExpiresAt,
      },
    });
    return {
      ...omit(user, ["password"]),
      loginToken,
      loginTokenExpiresAt,
    };
  }

  export async function listUsers(page = 1, limit = 20, search?: string, additionalFilter?: Record<string, any>) {
    const skip = (page - 1) * limit;
    
    // Base where clause
    const where: Record<string, any> = {
      deletedAt: null, // Exclude soft-deleted users
    };
    
    // Add search filter
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
        { name: { contains: search, mode: "insensitive" as const } },
      ];
    }
    
    // Merge additional filter (for reseller isolation)
    if (additionalFilter) {
      Object.assign(where, additionalFilter);
    }

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

    // Exclude password and loginToken from list for security
    return {
      users: data.map((u) => { const { password: _pw, loginToken: _lt, ...rest } = u; return rest; }),
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

  export async function regenerateLoginToken(id: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      throw new Error("Cannot regenerate token for admin users");
    }
    const loginToken = generateLoginToken();
    const loginTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.user.update({
      where: { id },
      data: { loginToken, loginTokenExpiresAt },
    });
    return { loginToken, loginTokenExpiresAt };
  }
