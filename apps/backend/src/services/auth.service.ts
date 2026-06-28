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
      // Défaut: CLIENT (aligné avec l'enum Prisma UserRole)
      role: (input.role as "CLIENT" | "SUPPORT" | "RESELLER" | "ADMIN") ?? "CLIENT",
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
    : await prisma.user.findUnique({ where: { phone: input.phone } });

  if (!user) throw new Error("Invalid credentials");
  if (user.status !== "ACTIVE") throw new Error(`Account is ${user.status.toLowerCase()}`);
  if (!user.password) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { userId: user.id, role: user.role } satisfies Omit<AuthPayload, "sessionId">,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  const session = await prisma.session.create({
    data: { token, deviceName, ipAddress, userId: user.id },
  });

  // Re-sign with sessionId
  const finalToken = jwt.sign(
    { userId: user.id, role: user.role, sessionId: session.id } satisfies AuthPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  await prisma.session.update({ where: { id: session.id }, data: { token: finalToken } });

  return { token: finalToken, user: omit(user, ["password"]) };
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
        role: "CLIENT",
        status: "ACTIVE",
        deviceLimit: 1,
        quotaRemainingGB: 0,
        quotaUsedGB: 0,
      },
    });
    // Link license to user
    await licenseService.bindLicenseToUser(license.id, user.id);
  }

  if (user.status !== "ACTIVE") throw new Error(`ACCOUNT_${user.status}`);

  // Device binding
  const existingDevice = await prisma.device.findUnique({ where: { deviceId } });
  if (!existingDevice) {
    await prisma.device.create({
      data: { deviceId, userId: user.id, deviceName },
    });
  } else if (existingDevice.userId !== user.id) {
    throw new Error("DEVICE_BOUND_TO_ANOTHER_ACCOUNT");
  }

  const sessionToken = jwt.sign(
    { userId: user.id, role: user.role, sessionId: "" } satisfies AuthPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  const session = await prisma.session.create({
    data: { token: sessionToken, userId: user.id, deviceName, ipAddress },
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
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return omit(user, ["password"]);
}

export async function logoutSession(token: string) {
  await prisma.session.updateMany({
    where: { token },
    data: { isActive: false },
  });
}
