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
      email: input.email,
      password: hashed,
      role: input.role ?? "USER",
    },
  });
  return omit(user, ["password"]);
}

export async function loginUser(
  input: LoginInput,
  deviceName?: string,
  ipAddress?: string,
) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new Error("Invalid credentials");
  if (user.status !== "ACTIVE") throw new Error(`Account is ${user.status.toLowerCase()}`);

  // password can be null for license-only accounts
  if (!user.password) throw new Error("Invalid credentials");
  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const payload: Omit<AuthPayload, "sessionId"> & { sessionId?: string } = {
    userId: user.id,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  const session = await prisma.session.create({
    data: { token, deviceName, ipAddress, userId: user.id },
  });

  const finalToken = jwt.sign(
    { userId: user.id, role: user.role, sessionId: session.id },
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
        role: "USER",
        status: "ACTIVE",
        quotaRemainingGB: license.dataLimitGB,
        deviceLimit: license.deviceLimit,
        expireAt: license.expireAt,
      },
    });

    await prisma.license.update({
      where: { id: license.id },
      data: { userId: user.id, phone, deviceId, deviceName },
    });
  }

  if (user.status !== "ACTIVE") throw new Error(`ACCOUNT_${user.status}`);

  await licenseService.bindDevice(token, deviceId, deviceName, phone);

  const session = await prisma.session.create({
    data: { token: "", deviceName, ipAddress, userId: user.id },
  });

  const finalToken = jwt.sign(
    { userId: user.id, role: user.role, sessionId: session.id },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  await prisma.session.update({ where: { id: session.id }, data: { token: finalToken } });
  await prisma.license.update({ where: { id: license.id }, data: { lastUsedAt: new Date() } });

  return {
    token: finalToken,
    user: omit(user, ["password"]),
    license: {
      token: license.token,
      dataLimitGB: license.dataLimitGB,
      dataUsedGB: license.dataUsedGB,
      deviceLimit: license.deviceLimit,
      expireAt: license.expireAt,
    },
  };
}

export async function refreshToken(userId: string, sessionId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || !session.isActive) throw new Error("SESSION_EXPIRED");

  const newToken = jwt.sign(
    { userId: user.id, role: user.role, sessionId: session.id },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  await prisma.session.update({ where: { id: session.id }, data: { token: newToken, lastUsedAt: new Date() } });
  return { token: newToken };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return omit(user, ["password"]);
}

export async function logoutSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}
