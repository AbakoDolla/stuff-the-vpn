import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS, ROLES } from "../constants/index.js";
import type { AuthPayload, AuthRequest } from "../types/index.js";
import { prisma } from "../prisma/client.js";

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, "No token provided", HTTP_STATUS.UNAUTHORIZED);
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    const session = await prisma.session.findUnique({ where: { token } });
    if (!session) {
      sendError(res, "Session expired or invalid", HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    req.user = payload;
    next();
  } catch {
    sendError(res, "Invalid or expired token", HTTP_STATUS.UNAUTHORIZED);
  }
}

export function requireRole(...roles: (keyof typeof ROLES)[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as keyof typeof ROLES)) {
      sendError(res, "Insufficient permissions", HTTP_STATUS.FORBIDDEN);
      return;
    }
    next();
  };
}
