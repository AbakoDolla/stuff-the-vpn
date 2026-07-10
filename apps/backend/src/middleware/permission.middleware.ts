/**
 * permission.middleware.ts
 * Middleware de vérification des permissions RBAC
 * 
 * Ce middleware vérifie que l'utilisateur a les permissions
 * nécessaires pour accéder à une route.
 */

import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { 
  PERMISSIONS, 
  ROLE_PERMISSIONS, 
  hasPermission, 
  hasAnyPermission,
  hasAllPermissions,
  type Permission,
  type Role 
} from "../constants/permissions.js";
import { prisma } from "../prisma/client.js";

/**
 * Vérifie que l'utilisateur a une permission spécifique
 */
export function requirePermission(permission: Permission) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, "Authentication required", HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const role = req.user.role as Role;
    
    if (!hasPermission(role, permission)) {
      // Log de la tentative d'accès non autorisée
      logUnauthorizedAccess(req, permission);
      sendError(res, `Permission denied: ${permission}`, HTTP_STATUS.FORBIDDEN);
      return;
    }

    next();
  };
}

/**
 * Vérifie que l'utilisateur a AU MOINS UNE des permissions données
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, "Authentication required", HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const role = req.user.role as Role;
    
    if (!hasAnyPermission(role, permissions)) {
      logUnauthorizedAccess(req, permissions.join(", "));
      sendError(res, "Permission denied", HTTP_STATUS.FORBIDDEN);
      return;
    }

    next();
  };
}

/**
 * Vérifie que l'utilisateur a TOUTES les permissions données
 */
export function requireAllPermissions(...permissions: Permission[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, "Authentication required", HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const role = req.user.role as Role;
    
    if (!hasAllPermissions(role, permissions)) {
      logUnauthorizedAccess(req, permissions.join(", "));
      sendError(res, "Permission denied", HTTP_STATUS.FORBIDDEN);
      return;
    }

    next();
  };
}

/**
 * Vérifie que l'utilisateur a un des rôles requis
 * Remplace l'ancienne fonction requireRole
 */
export function requireRole(...roles: Role[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, "Authentication required", HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const userRole = req.user.role as Role;
    
    if (!roles.includes(userRole)) {
      logUnauthorizedAccess(req, `role: ${roles.join(" OR ")}`);
      sendError(res, "Insufficient role", HTTP_STATUS.FORBIDDEN);
      return;
    }

    next();
  };
}

/**
 * Vérifie que l'utilisateur est le SUPER_ADMIN
 */
export const requireSuperAdmin = requireRole("SUPER_ADMIN");

/**
 * Vérifie que l'utilisateur est ADMIN ou SUPER_ADMIN
 */
export const requireAdmin = requireRole("ADMIN", "SUPER_ADMIN");

/**
 * Vérifie que l'utilisateur peut gérer les rôles (SUPER_ADMIN uniquement)
 */
export const requireCanManageRoles = requirePermission(PERMISSIONS.ROLES_MANAGE);

/**
 * Vérifie l'isolation des revendeurs - permet d'accéder uniquement à ses propres données
 */
export function requireResellerOwnership() {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, "Authentication required", HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const role = req.user.role as Role;
    const userId = req.user.userId;

    // Les ADMIN et SUPER_ADMIN ont accès à tous les utilisateurs
    if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "SUPPORT") {
      next();
      return;
    }

    // Pour les revendeurs, vérifier qu'ils accèdent à leurs propres clients
    if (role === "RESELLER") {
      const targetId = req.params.userId || req.params.id;
      
      if (targetId) {
        // Vérifier si l'utilisateur cible appartient au revendeur
        const user = await prisma.user.findUnique({
          where: { id: targetId },
          select: { resellerId: true }
        });

        if (!user) {
          sendError(res, "User not found", HTTP_STATUS.NOT_FOUND);
          return;
        }

        if (user.resellerId !== userId) {
          logUnauthorizedAccess(req, `reseller_access: ${targetId}`);
          sendError(res, "Access denied: This user does not belong to you", HTTP_STATUS.FORBIDDEN);
          return;
        }
      }

      // Ajouter resellerId au request pour filtrer les queries
      (req as any).resellerId = userId;
    }

    // Pour les utilisateurs normaux, ils ne peuvent accéder qu'à leurs propres données
    if (role === "USER") {
      const targetId = req.params.userId || req.params.id;
      
      if (targetId && targetId !== userId) {
        logUnauthorizedAccess(req, `user_access: ${targetId}`);
        sendError(res, "Access denied: You can only access your own data", HTTP_STATUS.FORBIDDEN);
        return;
      }
    }

    next();
  };
}

/**
 * Filtre les données selon le rôle (pour les requêtes GET)
 * Ajoute des conditions WHERE basées sur le rôle
 */
export function getResellerFilter(role: Role, userId: string): { resellerId?: string } | {} {
  // Les ADMIN et SUPER_ADMIN voient tout
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "SUPPORT") {
    return {};
  }

  // Les revendeurs ne voient que leurs clients
  if (role === "RESELLER") {
    return { resellerId: userId };
  }

  // Les utilisateurs normaux ne voient qu'eux-mêmes
  return { id: userId };
}

/**
 * Vérifie que l'utilisateur peut accéder à une ressource spécifique
 * Utilisé pour vérifier l'accès horizontal (un utilisateur tentant d'accéder aux données d'un autre)
 */
export async function checkResourceAccess(
  userId: string,
  role: Role,
  resourceType: "user" | "device" | "license" | "voucher",
  resourceId: string
): Promise<boolean> {
  // Les ADMIN et SUPER_ADMIN ont accès à tout
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "SUPPORT") {
    return true;
  }

  switch (resourceType) {
    case "user":
      const user = await prisma.user.findUnique({
        where: { id: resourceId },
        select: { resellerId: true }
      });
      if (!user) return false;
      
      if (role === "RESELLER") {
        return user.resellerId === userId;
      }
      return resourceId === userId;

    case "device":
      const device = await prisma.device.findUnique({
        where: { id: resourceId },
        select: { userId: true }
      });
      if (!device) return false;
      
      if (role === "RESELLER") {
        const deviceUser = await prisma.user.findUnique({
          where: { id: device.userId },
          select: { resellerId: true }
        });
        return deviceUser?.resellerId === userId;
      }
      return device.userId === userId;

    case "license":
      const license = await prisma.license.findUnique({
        where: { id: resourceId },
        select: { userId: true, resellerId: true }
      });
      if (!license) return false;
      
      if (role === "RESELLER") {
        return license.resellerId === userId;
      }
      return license.userId === userId;

    case "voucher":
      const voucher = await prisma.voucher.findUnique({
        where: { id: resourceId },
        select: { resellerId: true }
      });
      if (!voucher) return false;
      
      if (role === "RESELLER") {
        return voucher.resellerId === userId;
      }
      return true;

    default:
      return false;
  }
}

/**
 * Log des tentatives d'accès non autorisé
 */
async function logUnauthorizedAccess(req: AuthRequest, permission: string): Promise<void> {
  try {
    const userId = req.user?.userId;
    const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await prisma.auditLog.create({
      data: {
        action: "FRAUD_ATTEMPT",
        entity: "permission",
        entityId: permission,
        details: {
          attemptedPermission: permission,
          path: req.path,
          method: req.method,
        },
        userId: userId,
        ipAddress: ip,
        userAgent: userAgent,
      }
    }).catch(() => {/* ignore */});
  } catch {
    // Ne pas bloquer si le log échoue
  }
}

/**
 * Middleware pour vérifier l'accès aux statistiques
 * Les revendeurs ne voient que leurs propres statistiques
 */
export async function checkStatsAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    sendError(res, "Authentication required", HTTP_STATUS.UNAUTHORIZED);
    return;
  }

  const role = req.user.role as Role;

  // Les ADMIN et SUPER_ADMIN voient toutes les statistiques
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    (req as any).statsFilter = {};
    next();
    return;
  }

  // Les Support ne voient pas les statistiques détaillées
  if (role === "SUPPORT") {
    sendError(res, "Access denied: Support cannot view statistics", HTTP_STATUS.FORBIDDEN);
    return;
  }

  // Les revendeurs ne voient que leurs propres stats
  if (role === "RESELLER") {
    (req as any).statsFilter = { resellerId: req.user.userId };
    next();
    return;
  }

  // Les utilisateurs normaux ne voient que leurs propres stats
  (req as any).statsFilter = { userId: req.user.userId };
  next();
}
