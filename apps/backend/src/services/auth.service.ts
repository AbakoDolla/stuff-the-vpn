import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client.js";
import { env } from "../config/env.js";
import { omit } from "../utils/crypto.js";
import type { RegisterInput, LoginInput } from "../validators/auth.validator.js";
import type { AuthPayload } from "../types/index.js";
import * as licenseService from "./license.service.js";

export async function registerUser(input: RegisterInput) {
  const hashed = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      username: input.username,
      email:    input.email,
      password: hashed,
      role: (input.role as "USER" | "SUPPORT" | "RESELLER" | "ADMIN" | "SUPER_ADMIN") ?? "USER",
    },
  });
  return omit(user, ["password"]);
}

export async function loginUser(
  input: LoginInput,
  deviceName?: string,
  ipAddress?: string,
) {
  const identifier = input.email ?? input.phone;
  if (!identifier) throw new Error("Invalid credentials");

  const user = input.email
    ? await prisma.user.findUnique({ where: { email: input.email } })
    : await prisma.user.findFirst({ where: { phone: input.phone } });

  if (!user) throw new Error("Invalid credentials");
  if (user.status !== "ACTIVE") throw new Error(`Account is ${user.status.toLowerCase()}`);
  if (!user.password) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const session = await prisma.session.create({
    data: { token: "tmp", deviceName, ipAddress, userId: user.id },
  });

  const finalToken = jwt.sign(
    { userId: user.id, role: user.role, sessionId: session.id } satisfies AuthPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  await prisma.session.update({ where: { id: session.id }, data: { token: finalToken } });

  return { token: finalToken, user: omit(user, ["password"]) };
}

/**
 * Dashboard login — permet à TOUS les utilisateurs actifs de se connecter au dashboard.
 * Vérifie d'abord la table User, puis la table Admin séparée.
 */
export async function loginAdmin(
  email: string,
  password: string,
  ipAddress?: string,
) {
  // 1. Try User table (ALL roles allowed)
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (user.status !== "ACTIVE") throw new Error(`Account is ${user.status.toLowerCase()}`);
    if (!user.password) throw new Error("Invalid credentials");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    const session = await prisma.session.create({
      data: { token: "tmp", userId: user.id, ipAddress },
    });

    const finalToken = jwt.sign(
      { userId: user.id, role: user.role, sessionId: session.id, type: "admin" } satisfies AuthPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
    );
    await prisma.session.update({ where: { id: session.id }, data: { token: finalToken } });

    return { token: finalToken, user: omit(user, ["password"]) };
  }

  // 2. Fallback: check Admin table
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !admin.isActive) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) throw new Error("Invalid credentials");

  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  const token = jwt.sign(
    { userId: admin.id, role: admin.role ?? "ADMIN", type: "admin" } as AuthPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  return {
    token,
    user: {
      id:       admin.id,
      username: admin.name ?? "Admin",
      email:    admin.email,
      role:     admin.role ?? "ADMIN",
      status:   "ACTIVE",
    },
  };
}

export async function loginWithLicense(
  token: string,
  phone: string,
  deviceId: string,
  deviceName?: string,
  ipAddress?: string,
) {
  const license = await licenseService.validateLicense(token, phone, deviceId);

  let user = license.userId
    ? await prisma.user.findUnique({ where: { id: license.userId } })
    : null;

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        username: `user_${token.slice(0, 8)}`,
        role: "USER",
        status: "ACTIVE",
        deviceLimit: 1,
        quotaRemainingGB: 0,
        quotaUsedGB: 0,
      },
    });
    await licenseService.bindLicenseToUser(license.id, user.id);
  }

  if (user.status !== "ACTIVE") throw new Error(`ACCOUNT_${user.status}`);

  const existingDevice = await prisma.device.findUnique({
    where: { userId_deviceId: { userId: user.id, deviceId } },
  });
  if (!existingDevice) {
    await prisma.device.create({
      data: { deviceId, userId: user.id, deviceName },
    });
  } else if (existingDevice.userId !== user.id) {
    throw new Error("DEVICE_BOUND_TO_ANOTHER_ACCOUNT");
  }

  const session = await prisma.session.create({
    data: { token: "tmp", userId: user.id, deviceName, ipAddress },
  });

  const finalToken = jwt.sign(
    { userId: user.id, role: user.role, sessionId: session.id } satisfies AuthPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
  await prisma.session.update({ where: { id: session.id }, data: { token: finalToken } });

  return { token: finalToken, user: omit(user, ["password"]) };
}

export async function refreshToken(userId: string, sessionId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const newToken = jwt.sign(
    { userId: user.id, role: user.role, sessionId } satisfies AuthPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
  await prisma.session.update({ where: { id: sessionId }, data: { token: newToken, lastUsedAt: new Date() } });
  return { token: newToken };
}

export async function getMe(userId: string) {
  // Try User table first
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) return omit(user, ["password"]);

  // Try Admin table
  const admin = await prisma.admin.findUnique({ where: { id: userId } });
  if (admin) return { id: admin.id, username: admin.name ?? "Admin", email: admin.email, role: admin.role, status: "ACTIVE" };

  throw new Error("User not found");
}

export async function logoutSession(token: string) {
  await prisma.session.updateMany({
    where: { token },
    data: { isActive: false },
  });
}
