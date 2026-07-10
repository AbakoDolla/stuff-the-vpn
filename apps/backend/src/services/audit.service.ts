/**
 * audit.service.ts
 * Service de journalisation des actions importantes (Audit Logs)
 * 
 * Toutes les actions importantes sont enregistrées avec:
 * - Utilisateur
 * - Rôle
 * - Action
 * - Date
 * - Adresse IP
 * - Résultat
 */

import { prisma } from "../prisma/client.js";
import type { AuditAction } from "@prisma/client";
import type { Role } from "../constants/permissions.js";

export interface AuditLogInput {
  action: AuditAction;
  entity?: string;
  entityId?: string;
  details?: Record<string, any>;
  userId?: string;
  adminId?: string;
  ipAddress?: string;
  userAgent?: string;
  result?: "success" | "failure";
  errorMessage?: string;
}

/**
 * Créer une entrée d'audit log
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        details: input.details ? JSON.parse(JSON.stringify(input.details)) : undefined,
        userId: input.userId,
        adminId: input.adminId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      }
    });
  } catch (error) {
    // Ne pas bloquer l'opération si le log échoue
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Extraire l'IP du request
 */
export function getClientIP(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  return req.ip || req.connection?.remoteAddress || "unknown";
}

/**
 * Extraire le User-Agent
 */
export function getUserAgent(req: any): string {
  return req.headers["user-agent"] || "unknown";
}

/**
 * Créer un audit log à partir d'une requête Express
 */
export async function auditFromRequest(
  req: any,
  input: Omit<AuditLogInput, "ipAddress" | "userAgent">
): Promise<void> {
  const userId = req.user?.userId;
  const adminId = (req as any).adminId;
  
  await createAuditLog({
    ...input,
    userId: userId || input.userId,
    adminId: adminId || input.adminId,
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  });
}

// ══════════════════════════════════════════════════════════════════
// HELPERS POUR LES ACTIONS COURANTES
// ══════════════════════════════════════════════════════════════════

/**
 * Logger une connexion
 */
export async function logLogin(req: any, userId: string, success: boolean): Promise<void> {
  await auditFromRequest(req, {
    action: success ? "USER_LOGIN" : "FRAUD_ATTEMPT",
    entity: "session",
    entityId: userId,
    details: { type: "dashboard_login" },
    result: success ? "success" : "failure",
    errorMessage: success ? undefined : "Failed login attempt",
  });
}

/**
 * Logger une déconnexion
 */
export async function logLogout(req: any, userId: string): Promise<void> {
  await auditFromRequest(req, {
    action: "USER_LOGOUT",
    entity: "session",
    entityId: userId,
  });
}

/**
 * Logger une création d'utilisateur
 */
export async function logUserCreate(
  req: any, 
  targetUserId: string, 
  targetRole: Role,
  resellerId?: string
): Promise<void> {
  await auditFromRequest(req, {
    action: "USER_REGISTER",
    entity: "user",
    entityId: targetUserId,
    details: { 
      role: targetRole,
      resellerId,
    },
  });
}

/**
 * Logger une mise à jour d'utilisateur
 */
export async function logUserUpdate(
  req: any,
  targetUserId: string,
  changes: Record<string, { from: any; to: any }>
): Promise<void> {
  await auditFromRequest(req, {
    action: "USER_UPDATE",
    entity: "user",
    entityId: targetUserId,
    details: { changes },
  });
}

/**
 * Logger une suppression d'utilisateur
 */
export async function logUserDelete(
  req: any,
  targetUserId: string,
  reason?: string
): Promise<void> {
  await auditFromRequest(req, {
    action: "USER_DELETE",
    entity: "user",
    entityId: targetUserId,
    details: { reason },
  });
}

/**
 * Logger un changement de statut utilisateur
 */
export async function logUserStatusChange(
  req: any,
  targetUserId: string,
  newStatus: string
): Promise<void> {
  await auditFromRequest(req, {
    action: newStatus === "SUSPENDED" ? "USER_SUSPEND" : "USER_ACTIVATE",
    entity: "user",
    entityId: targetUserId,
    details: { newStatus },
  });
}

/**
 * Logger une modification de quota
 */
export async function logQuotaUpdate(
  req: any,
  targetUserId: string,
  quotaChange: number,
  newQuota: number
): Promise<void> {
  await auditFromRequest(req, {
    action: "QUOTA_UPDATE",
    entity: "user",
    entityId: targetUserId,
    details: { quotaChange, newQuota },
  });
}

/**
 * Logger une création de license
 */
export async function logLicenseCreate(
  req: any,
  licenseId: string,
  resellerId?: string
): Promise<void> {
  await auditFromRequest(req, {
    action: "LICENSE_CREATE",
    entity: "license",
    entityId: licenseId,
    details: { resellerId },
  });
}

/**
 * Logger une révocation de license
 */
export async function logLicenseRevoke(
  req: any,
  licenseId: string,
  reason?: string
): Promise<void> {
  await auditFromRequest(req, {
    action: "LICENSE_REVOKE",
    entity: "license",
    entityId: licenseId,
    details: { reason },
  });
}

/**
 * Logger une création de voucher
 */
export async function logVoucherCreate(
  req: any,
  voucherId: string,
  count: number = 1
): Promise<void> {
  await auditFromRequest(req, {
    action: "VOUCHER_CREATE",
    entity: "voucher",
    entityId: voucherId,
    details: { count },
  });
}

/**
 * Logger une utilisation de voucher
 */
export async function logVoucherRedeem(
  req: any,
  voucherId: string,
  userId: string
): Promise<void> {
  await auditFromRequest(req, {
    action: "VOUCHER_REDEEM",
    entity: "voucher",
    entityId: voucherId,
    details: { redeemedBy: userId },
  });
}

/**
 * Logger une création de reseller
 */
export async function logResellerCreate(
  req: any,
  resellerId: string,
  name: string
): Promise<void> {
  await auditFromRequest(req, {
    action: "RESELLER_CREATE",
    entity: "reseller",
    entityId: resellerId,
    details: { name },
  });
}

/**
 * Logger une mise à jour de reseller
 */
export async function logResellerUpdate(
  req: any,
  resellerId: string,
  changes: Record<string, { from: any; to: any }>
): Promise<void> {
  await auditFromRequest(req, {
    action: "RESELLER_UPDATE",
    entity: "reseller",
    entityId: resellerId,
    details: { changes },
  });
}

/**
 * Logger une modification de paramètres système
 */
export async function logSettingsUpdate(
  req: any,
  settingKey: string,
  oldValue: any,
  newValue: any
): Promise<void> {
  await auditFromRequest(req, {
    action: "SETTINGS_UPDATE",
    entity: "setting",
    entityId: settingKey,
    details: { settingKey, oldValue, newValue },
  });
}

/**
 * Logger une tentative d'accès non autorisé
 */
export async function logUnauthorizedAccess(
  req: any,
  attemptedAction: string,
  reason?: string
): Promise<void> {
  await auditFromRequest(req, {
    action: "FRAUD_ATTEMPT",
    entity: "access",
    details: { attemptedAction, reason },
    result: "failure",
  });
}

/**
 * Logger une action admin
 */
export async function logAdminAction(
  req: any,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, any>
): Promise<void> {
  await auditFromRequest(req, {
    action: "ADMIN_ACTION",
    entity: targetType,
    entityId: targetId,
    details: { adminAction: action, ...details },
  });
}

/**
 * Logger une création de serveur
 */
export async function logServerCreate(
  req: any,
  serverId: string,
  serverName: string
): Promise<void> {
  await auditFromRequest(req, {
    action: "SERVER_CREATE",
    entity: "server",
    entityId: serverId,
    details: { name: serverName },
  });
}

/**
 * Logger une mise à jour de serveur
 */
export async function logServerUpdate(
  req: any,
  serverId: string,
  changes: Record<string, { from: any; to: any }>
): Promise<void> {
  await auditFromRequest(req, {
    action: "SERVER_UPDATE",
    entity: "server",
    entityId: serverId,
    details: { changes },
  });
}

/**
 * Logger une suppression de serveur
 */
export async function logServerDelete(
  req: any,
  serverId: string,
  serverName: string
): Promise<void> {
  await auditFromRequest(req, {
    action: "SERVER_DELETE",
    entity: "server",
    entityId: serverId,
    details: { name: serverName },
  });
}
