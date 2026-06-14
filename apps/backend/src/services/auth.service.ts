import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client.js";
import { env } from "../config/env.js";
import { omit } from "../utils/crypto.js";
import type { RegisterInput, LoginInput } from "../validators/auth.validator.js";
import type { AuthPayload } from "../types/index.js";

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

  // Embed sessionId in token metadata (for logout/validation)
  const finalToken = jwt.sign(
    { userId: user.id, role: user.role, sessionId: session.id },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  // Update session with final token
  await prisma.session.update({ where: { id: session.id }, data: { token: finalToken } });

  return { token: finalToken, user: omit(user, ["password"]) };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return omit(user, ["password"]);
}

export async function logoutSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}
