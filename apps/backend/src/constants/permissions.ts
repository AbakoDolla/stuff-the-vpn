/**
 * permissions.ts — Définition complète des permissions par rôle
 * 
 * Ce fichier centralise TOUTES les permissions du système.
 * Chaque rôle a un ensemble de permissions qui lui est propre.
 */

// ══════════════════════════════════════════════════════════════════
// PERMISSIONS
// ══════════════════════════════════════════════════════════════════

export const PERMISSIONS = {
  // Users
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_MANAGE_STATUS: "users.manage_status",
  USERS_MANAGE_QUOTA: "users.manage_quota",
  
  // Devices
  DEVICES_VIEW: "devices.view",
  DEVICES_MANAGE: "devices.manage",
  DEVICES_RESET: "devices.reset",
  
  // VPN
  VPN_CONFIG_VIEW: "vpn.config.view",
  VPN_CONFIG_CREATE: "vpn.config.create",
  VPN_CONFIG_UPDATE: "vpn.config.update",
  VPN_CONFIG_DELETE: "vpn.config.delete",
  
  // Servers
  SERVERS_VIEW: "servers.view",
  SERVERS_CREATE: "servers.create",
  SERVERS_UPDATE: "servers.update",
  SERVERS_DELETE: "servers.delete",
  SERVERS_MANAGE: "servers.manage",
  
  // Inbounds
  INBOUNDS_VIEW: "inbounds.view",
  INBOUNDS_CREATE: "inbounds.create",
  INBOUNDS_UPDATE: "inbounds.update",
  INBOUNDS_DELETE: "inbounds.delete",
  INBOUNDS_MANAGE: "inbounds.manage",
  
  // Licenses
  LICENSES_VIEW: "licenses.view",
  LICENSES_CREATE: "licenses.create",
  LICENSES_REVOKE: "licenses.revoke",
  LICENSES_RESET_DEVICE: "licenses.reset_device",
  
  // Quotas
  QUOTAS_VIEW: "quotas.view",
  QUOTAS_MANAGE: "quotas.manage",
  
  // Vouchers
  VOUCHERS_VIEW: "vouchers.view",
  VOUCHERS_CREATE: "vouchers.create",
  VOUCHERS_MANAGE: "vouchers.manage",
  
  // Resellers
  RESELLERS_VIEW: "resellers.view",
  RESELLERS_CREATE: "resellers.create",
  RESELLERS_UPDATE: "resellers.update",
  RESELLERS_DELETE: "resellers.delete",
  RESELLERS_MANAGE: "resellers.manage",
  RESELLERS_CLIENTS: "resellers.clients",
  
  // Roles & Permissions
  ROLES_MANAGE: "roles.manage",
  PERMISSIONS_MANAGE: "permissions.manage",
  
  // Settings
  SETTINGS_VIEW: "settings.view",
  SETTINGS_MANAGE: "settings.manage",
  
  // Logs
  LOGS_VIEW: "logs.view",
  AUDIT_LOGS_VIEW: "audit_logs.view",
  
  // Statistics
  STATISTICS_VIEW: "statistics.view",
  STATISTICS_MANAGE: "statistics.manage",
  
  // Support
  SUPPORT_VIEW: "support.view",
  SUPPORT_MANAGE: "support.manage",
  SUPPORT_TICKETS: "support.tickets",
  
  // Financial
  FINANCIAL_VIEW: "financial.view",
  FINANCIAL_MANAGE: "financial.manage",
  
  // Admin
  ADMIN_DASHBOARD: "admin.dashboard",
  ADMIN_STATS: "admin.stats",
  
  // Tokens
  TOKENS_CREATE: "tokens.create",
  TOKENS_REVOKE: "tokens.revoke",
  
  // VPN Profiles
  VPN_PROFILES_VIEW: "vpn_profiles.view",
  VPN_PROFILES_CREATE: "vpn_profiles.create",
  VPN_PROFILES_UPDATE: "vpn_profiles.update",
  VPN_PROFILES_DELETE: "vpn_profiles.delete",
  
  // Plans
  PLANS_VIEW: "plans.view",
  PLANS_CREATE: "plans.create",
  PLANS_UPDATE: "plans.update",
  PLANS_DELETE: "plans.delete",
  
  // Payments
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_MANAGE: "payments.manage",
  
  // Notifications
  NOTIFICATIONS_VIEW: "notifications.view",
  NOTIFICATIONS_MANAGE: "notifications.manage",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ══════════════════════════════════════════════════════════════════
// RÔLES
// ══════════════════════════════════════════════════════════════════

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  SUPPORT: "SUPPORT",
  RESELLER: "RESELLER",
  USER: "USER",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// ══════════════════════════════════════════════════════════════════
// PERMISSIONS PAR RÔLE
// ══════════════════════════════════════════════════════════════════

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // SUPER_ADMIN — Accès complet au système
  [ROLES.SUPER_ADMIN]: [
    // Users
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_MANAGE_STATUS,
    PERMISSIONS.USERS_MANAGE_QUOTA,
    // Devices
    PERMISSIONS.DEVICES_VIEW,
    PERMISSIONS.DEVICES_MANAGE,
    PERMISSIONS.DEVICES_RESET,
    // VPN
    PERMISSIONS.VPN_CONFIG_VIEW,
    PERMISSIONS.VPN_CONFIG_CREATE,
    PERMISSIONS.VPN_CONFIG_UPDATE,
    PERMISSIONS.VPN_CONFIG_DELETE,
    // Servers
    PERMISSIONS.SERVERS_VIEW,
    PERMISSIONS.SERVERS_CREATE,
    PERMISSIONS.SERVERS_UPDATE,
    PERMISSIONS.SERVERS_DELETE,
    PERMISSIONS.SERVERS_MANAGE,
    // Inbounds
    PERMISSIONS.INBOUNDS_VIEW,
    PERMISSIONS.INBOUNDS_CREATE,
    PERMISSIONS.INBOUNDS_UPDATE,
    PERMISSIONS.INBOUNDS_DELETE,
    PERMISSIONS.INBOUNDS_MANAGE,
    // Licenses
    PERMISSIONS.LICENSES_VIEW,
    PERMISSIONS.LICENSES_CREATE,
    PERMISSIONS.LICENSES_REVOKE,
    PERMISSIONS.LICENSES_RESET_DEVICE,
    // Quotas
    PERMISSIONS.QUOTAS_VIEW,
    PERMISSIONS.QUOTAS_MANAGE,
    // Vouchers
    PERMISSIONS.VOUCHERS_VIEW,
    PERMISSIONS.VOUCHERS_CREATE,
    PERMISSIONS.VOUCHERS_MANAGE,
    // Resellers
    PERMISSIONS.RESELLERS_VIEW,
    PERMISSIONS.RESELLERS_CREATE,
    PERMISSIONS.RESELLERS_UPDATE,
    PERMISSIONS.RESELLERS_DELETE,
    PERMISSIONS.RESELLERS_MANAGE,
    PERMISSIONS.RESELLERS_CLIENTS,
    // Roles & Permissions
    PERMISSIONS.ROLES_MANAGE,
    PERMISSIONS.PERMISSIONS_MANAGE,
    // Settings
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
    // Logs
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW,
    // Statistics
    PERMISSIONS.STATISTICS_VIEW,
    PERMISSIONS.STATISTICS_MANAGE,
    // Support
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.SUPPORT_TICKETS,
    // Financial
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.FINANCIAL_MANAGE,
    // Admin
    PERMISSIONS.ADMIN_DASHBOARD,
    PERMISSIONS.ADMIN_STATS,
    // Tokens
    PERMISSIONS.TOKENS_CREATE,
    PERMISSIONS.TOKENS_REVOKE,
    // VPN Profiles
    PERMISSIONS.VPN_PROFILES_VIEW,
    PERMISSIONS.VPN_PROFILES_CREATE,
    PERMISSIONS.VPN_PROFILES_UPDATE,
    PERMISSIONS.VPN_PROFILES_DELETE,
    // Plans
    PERMISSIONS.PLANS_VIEW,
    PERMISSIONS.PLANS_CREATE,
    PERMISSIONS.PLANS_UPDATE,
    PERMISSIONS.PLANS_DELETE,
    // Payments
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_MANAGE,
    // Notifications
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_MANAGE,
  ],

  // ADMIN — Accès avancé mais limité
  [ROLES.ADMIN]: [
    // Users
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_MANAGE_STATUS,
    PERMISSIONS.USERS_MANAGE_QUOTA,
    // Devices
    PERMISSIONS.DEVICES_VIEW,
    PERMISSIONS.DEVICES_MANAGE,
    PERMISSIONS.DEVICES_RESET,
    // VPN
    PERMISSIONS.VPN_CONFIG_VIEW,
    PERMISSIONS.VPN_CONFIG_CREATE,
    PERMISSIONS.VPN_CONFIG_UPDATE,
    // Servers
    PERMISSIONS.SERVERS_VIEW,
    // Inbounds
    PERMISSIONS.INBOUNDS_VIEW,
    // Licenses
    PERMISSIONS.LICENSES_VIEW,
    PERMISSIONS.LICENSES_CREATE,
    PERMISSIONS.LICENSES_REVOKE,
    PERMISSIONS.LICENSES_RESET_DEVICE,
    // Quotas
    PERMISSIONS.QUOTAS_VIEW,
    PERMISSIONS.QUOTAS_MANAGE,
    // Vouchers
    PERMISSIONS.VOUCHERS_VIEW,
    PERMISSIONS.VOUCHERS_CREATE,
    PERMISSIONS.VOUCHERS_MANAGE,
    // Logs
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW,
    // Statistics
    PERMISSIONS.STATISTICS_VIEW,
    // Support
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.SUPPORT_TICKETS,
    // Admin
    PERMISSIONS.ADMIN_DASHBOARD,
    PERMISSIONS.ADMIN_STATS,
    // Tokens
    PERMISSIONS.TOKENS_CREATE,
    PERMISSIONS.TOKENS_REVOKE,
    // VPN Profiles
    PERMISSIONS.VPN_PROFILES_VIEW,
    PERMISSIONS.VPN_PROFILES_CREATE,
    PERMISSIONS.VPN_PROFILES_UPDATE,
    // Plans
    PERMISSIONS.PLANS_VIEW,
    // Payments
    PERMISSIONS.PAYMENTS_VIEW,
    // Notifications
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_MANAGE,
  ],

  // SUPPORT — Accès limité pour assistance technique
  [ROLES.SUPPORT]: [
    // Users
    PERMISSIONS.USERS_VIEW,
    // Devices
    PERMISSIONS.DEVICES_VIEW,
    PERMISSIONS.DEVICES_RESET,
    // VPN
    PERMISSIONS.VPN_CONFIG_VIEW,
    // Servers
    PERMISSIONS.SERVERS_VIEW,
    // Inbounds
    PERMISSIONS.INBOUNDS_VIEW,
    // Licenses
    PERMISSIONS.LICENSES_VIEW,
    // Quotas
    PERMISSIONS.QUOTAS_VIEW,
    // Logs
    PERMISSIONS.LOGS_VIEW,
    // Statistics
    PERMISSIONS.STATISTICS_VIEW,
    // Support
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_TICKETS,
    // Admin
    PERMISSIONS.ADMIN_DASHBOARD,
    // Notifications
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  // RESELLER — Partenaires commerciaux (isolés)
  [ROLES.RESELLER]: [
    // Users (ses propres clients uniquement)
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_MANAGE_QUOTA,
    // Devices (ses propres clients)
    PERMISSIONS.DEVICES_VIEW,
    // VPN (configs autorisées)
    PERMISSIONS.VPN_CONFIG_VIEW,
    // Licenses
    PERMISSIONS.LICENSES_VIEW,
    PERMISSIONS.LICENSES_CREATE,
    // Quotas
    PERMISSIONS.QUOTAS_VIEW,
    PERMISSIONS.QUOTAS_MANAGE,
    // Vouchers
    PERMISSIONS.VOUCHERS_VIEW,
    PERMISSIONS.VOUCHERS_CREATE,
    // Statistics
    PERMISSIONS.STATISTICS_VIEW,
    // Support
    PERMISSIONS.SUPPORT_TICKETS,
    // Notifications
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  // USER — Utilisateur standard
  [ROLES.USER]: [
    // Son propre compte
    PERMISSIONS.USERS_VIEW,
    // Ses propres appareils
    PERMISSIONS.DEVICES_VIEW,
    // Notifications
    PERMISSIONS.NOTIFICATIONS_VIEW,
    // Support
    PERMISSIONS.SUPPORT_TICKETS,
  ],
};

// ══════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════════

/**
 * Obtenir les permissions d'un rôle
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Vérifier si un rôle a une permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Vérifier si un rôle a toutes les permissions données
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  return permissions.every(p => rolePerms.includes(p));
}

/**
 * Vérifier si un rôle a au moins une des permissions données
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  return permissions.some(p => rolePerms.includes(p));
}

/**
 * Obtenir les informations d'un rôle (pour le frontend)
 */
export function getRoleInfo(role: Role): { name: string; description: string; color: string } {
  const infos: Record<Role, { name: string; description: string; color: string }> = {
    [ROLES.SUPER_ADMIN]: {
      name: "Super Admin",
      description: "Accès complet au système",
      color: "#e74c3c"
    },
    [ROLES.ADMIN]: {
      name: "Admin",
      description: "Accès avancé mais limité",
      color: "#3498db"
    },
    [ROLES.SUPPORT]: {
      name: "Support",
      description: "Assistance technique",
      color: "#9b59b6"
    },
    [ROLES.RESELLER]: {
      name: "Revendeur",
      description: "Partenaire commercial",
      color: "#27ae60"
    },
    [ROLES.USER]: {
      name: "Utilisateur",
      description: "Utilisateur standard",
      color: "#95a5a6"
    },
  };
  return infos[role] || { name: role, description: "", color: "#95a5a6" };
}

/**
 * Obtenir le niveau hiérarchique d'un rôle (plus élevé = plus de pouvoir)
 */
export function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    [ROLES.USER]: 1,
    [ROLES.RESELLER]: 2,
    [ROLES.SUPPORT]: 3,
    [ROLES.ADMIN]: 4,
    [ROLES.SUPER_ADMIN]: 5,
  };
  return levels[role] || 0;
}

/**
 * Vérifier si un rôle peut modifier un autre rôle
 */
export function canModifyRole(modifierRole: Role, targetRole: Role): boolean {
  return getRoleLevel(modifierRole) > getRoleLevel(targetRole);
}
