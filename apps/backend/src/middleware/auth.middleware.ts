import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
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
    if (!session || !session.isActive) {
      sendError(res, "Session expired or invalid", HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    // Rafraîchir lastUsedAt de façon non-bloquante
    void prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {/* ignore */});

    req.user = payload;
    next();
  } catch {
    sendError(res, "Invalid or expired token", HTTP_STATUS.UNAUTHORIZED);
  }
}

/**
 * Middleware d'authentification pour les appareils mobiles.
 * Vérifie le JWT et valide que l'appareil est toujours actif.
 */
export async function deviceAuthMiddleware(
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

    // Vérifier que c'est un token d'appareil
    if (payload.type !== "device" || !payload.deviceId) {
      sendError(res, "Device token required", HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    // Vérifier que l'appareil existe et est actif
    const device = await prisma.device.findUnique({
      where: { deviceId: payload.deviceId },
    });

    if (!device) {
      sendError(res, "Device not found", HTTP_STATUS.NOT_FOUND);
      return;
    }

    if (device.status !== "ACTIVE") {
      sendError(res, `Device ${device.status.toLowerCase()}`, HTTP_STATUS.FORBIDDEN);
      return;
    }

    // Mettre à jour lastSeen de façon non-bloquante
    void prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    }).catch(() => {/* ignore */});

    req.user = payload;
    next();
  } catch {
    sendError(res, "Invalid or expired token", HTTP_STATUS.UNAUTHORIZED);
  }
}

/**
 * Vérifie que l'utilisateur a un des rôles requis.
 * Les rôles sont passés en string (UserRole Prisma).
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as string)) {
      sendError(res, "Insufficient permissions", HTTP_STATUS.FORBIDDEN);
      return;
    }
    next();
  };
}

/**
 * Middleware d'authentification pour les admins du dashboard.
 * Ajoute adminId à la requête.
 */
export async function authenticateAdmin(
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

    // Vérifier que c'est un token admin
    if (payload.type !== "admin") {
      sendError(res, "Admin token required", HTTP_STATUS.FORBIDDEN);
      return;
    }

    // Ajouter adminId à la requête
    (req as any).adminId = payload.userId;
    req.user = payload;
    next();
  } catch {
    sendError(res, "Invalid or expired token", HTTP_STATUS.UNAUTHORIZED);
  }
}

/** Alias pratiques */
export const requireAdmin     = requireRole("ADMIN", "SUPER_ADMIN");
export const requireSuperAdmin = requireRole("SUPER_ADMIN");
export const requireReseller  = requireRole("RESELLER", "ADMIN", "SUPER_ADMIN");
