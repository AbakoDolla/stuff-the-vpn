'use client';

/**
 * Permissions système - Client side
 * Définit les permissions disponibles et les helpers pour vérifier les accès
 */

// ══════════════════════════════════════════════════════════════════
// PERMISSIONS
// ══════════════════════════════════════════════════════════════════

export const PERMISSIONS = {
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_STATUS: 'users.manage_status',
  USERS_MANAGE_QUOTA: 'users.manage_quota',

  // Devices
  DEVICES_VIEW: 'devices.view',
  DEVICES_MANAGE: 'devices.manage',
  DEVICES_RESET: 'devices.reset',

  // VPN
  VPN_CONFIG_VIEW: 'vpn.config.view',
  VPN_CONFIG_CREATE: 'vpn.config.create',
  VPN_CONFIG_UPDATE: 'vpn.config.update',
  VPN_CONFIG_DELETE: 'vpn.config.delete',

  // Servers
  SERVERS_VIEW: 'servers.view',
  SERVERS_CREATE: 'servers.create',
  SERVERS_UPDATE: 'servers.update',
  SERVERS_DELETE: 'servers.delete',
  SERVERS_MANAGE: 'servers.manage',

  // Inbounds
  INBOUNDS_VIEW: 'inbounds.view',
  INBOUNDS_CREATE: 'inbounds.create',
  INBOUNDS_UPDATE: 'inbounds.update',
  INBOUNDS_DELETE: 'inbounds.delete',
  INBOUNDS_MANAGE: 'inbounds.manage',

  // Licenses
  LICENSES_VIEW: 'licenses.view',
  LICENSES_CREATE: 'licenses.create',
  LICENSES_REVOKE: 'licenses.revoke',
  LICENSES_RESET_DEVICE: 'licenses.reset_device',

  // Quotas
  QUOTAS_VIEW: 'quotas.view',
  QUOTAS_MANAGE: 'quotas.manage',

  // Vouchers
  VOUCHERS_VIEW: 'vouchers.view',
  VOUCHERS_CREATE: 'vouchers.create',
  VOUCHERS_MANAGE: 'vouchERS.manage',

  // Resellers
  RESELLERS_VIEW: 'resellers.view',
  RESELLERS_CREATE: 'resellers.create',
  RESELLERS_UPDATE: 'resellers.update',
  RESELLERS_DELETE: 'resellers.delete',
  RESELLERS_MANAGE: 'resellers.manage',
  RESELLERS_CLIENTS: 'resellers.clients',

  // Roles & Permissions
  ROLES_MANAGE: 'roles.manage',
  PERMISSIONS_MANAGE: 'permissions.manage',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',

  // Logs
  LOGS_VIEW: 'logs.view',
  AUDIT_LOGS_VIEW: 'audit_logs.view',

  // Statistics
  STATISTICS_VIEW: 'statistics.view',
  STATISTICS_MANAGE: 'statistics.manage',

  // Support
  SUPPORT_VIEW: 'support.view',
  SUPPORT_MANAGE: 'support.manage',
  SUPPORT_TICKETS: 'support.tickets',

  // Financial
  FINANCIAL_VIEW: 'financial.view',
  FINANCIAL_MANAGE: 'financial.manage',

  // Admin
  ADMIN_DASHBOARD: 'admin.dashboard',
  ADMIN_STATS: 'admin.stats',

  // Tokens
  TOKENS_CREATE: 'tokens.create',
  TOKENS_REVOKE: 'tokens.revoke',

  // VPN Profiles
  VPN_PROFILES_VIEW: 'vpn_profiles.view',
  VPN_PROFILES_CREATE: 'vpn_profiles.create',
  VPN_PROFILES_UPDATE: 'vpn_profiles.update',
  VPN_PROFILES_DELETE: 'vpn_profiles.delete',

  // Plans
  PLANS_VIEW: 'plans.view',
  PLANS_CREATE: 'plans.create',
  PLANS_UPDATE: 'plans.update',
  PLANS_DELETE: 'plans.delete',

  // Payments
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_MANAGE: 'payments.manage',

  // Notifications
  NOTIFICATIONS_VIEW: 'notifications.view',
  NOTIFICATIONS_MANAGE: 'notifications.manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ══════════════════════════════════════════════════════════════════
// RÔLES
// ══════════════════════════════════════════════════════════════════

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
  RESELLER: 'RESELLER',
  USER: 'USER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// ══════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════════

/**
 * Vérifier si l'utilisateur a une permission
 */
export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  return userPermissions.includes(permission);
}

/**
 * Vérifier si l'utilisateur a toutes les permissions données
 */
export function hasAllPermissions(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.every(p => userPermissions.includes(p));
}

/**
 * Vérifier si l'utilisateur a au moins une des permissions données
 */
export function hasAnyPermission(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.some(p => userPermissions.includes(p));
}

/**
 * Obtenir le niveau hiérarchique d'un rôle
 */
export function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    'USER': 1,
    'RESELLER': 2,
    'SUPPORT': 3,
    'ADMIN': 4,
    'SUPER_ADMIN': 5,
  };
  return levels[role] || 0;
}

/**
 * Vérifier si un rôle peut modifier un autre rôle
 */
export function canModifyRole(userRole: Role, targetRole: Role): boolean {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
}

// ══════════════════════════════════════════════════════════════════
// NAVIGATION - PERMISSIONS REQUISES
// ══════════════════════════════════════════════════════════════════

export interface NavPermission {
  permission?: Permission;
  anyPermission?: Permission[];
  allPermissions?: Permission[];
  roles?: Role[];
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

export const NAV_PERMISSIONS: Record<string, NavPermission> = {
  // Overview
  '/dashboard': { permission: PERMISSIONS.ADMIN_DASHBOARD },
  '/analytics': { permission: PERMISSIONS.STATISTICS_VIEW },

  // Users
  '/dashboard/users': { permission: PERMISSIONS.USERS_VIEW },
  '/dashboard/devices-list': { permission: PERMISSIONS.DEVICES_VIEW },
  '/dashboard/tokens': { permission: PERMISSIONS.TOKENS_CREATE },
  '/dashboard/quotas': { permission: PERMISSIONS.QUOTAS_VIEW },

  // VPN
  '/dashboard/inbounds': { permission: PERMISSIONS.INBOUNDS_VIEW },
  '/dashboard/vpn': { permission: PERMISSIONS.VPN_PROFILES_VIEW },
  '/dashboard/servers': { permission: PERMISSIONS.SERVERS_VIEW },

  // Commercial
  '/licenses': { permission: PERMISSIONS.LICENSES_VIEW },
  '/vouchers': { permission: PERMISSIONS.VOUCHERS_VIEW },
  '/dashboard/payments': { permission: PERMISSIONS.PAYMENTS_VIEW },

  // Admin
  '/dashboard/tickets': { permission: PERMISSIONS.SUPPORT_TICKETS },
  '/dashboard/audit': { permission: PERMISSIONS.AUDIT_LOGS_VIEW },
  '/dashboard/settings': { permission: PERMISSIONS.SETTINGS_VIEW },
};

/**
 * Vérifier si l'utilisateur peut accéder à une page
 */
export function canAccessPage(
  path: string,
  userRole: Role | undefined,
  userPermissions: string[]
): boolean {
  if (!userRole) return false;

  // Super Admin a accès à tout
  if (userRole === 'SUPER_ADMIN') return true;

  const navPerm = NAV_PERMISSIONS[path];
  if (!navPerm) return true; // Pas de restriction spécifique

  // Vérifier les rôles autorisés
  if (navPerm.roles && !navPerm.roles.includes(userRole)) {
    return false;
  }

  // Vérifier admin only
  if (navPerm.adminOnly && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return false;
  }

  // Vérifier super admin only
  if (navPerm.superAdminOnly && userRole !== 'SUPER_ADMIN') {
    return false;
  }

  // Vérifier permission unique
  if (navPerm.permission && !userPermissions.includes(navPerm.permission)) {
    return false;
  }

  // Vérifier any permission
  if (navPerm.anyPermission && !hasAnyPermission(userPermissions, navPerm.anyPermission)) {
    return false;
  }

  // Vérifier all permissions
  if (navPerm.allPermissions && !hasAllPermissions(userPermissions, navPerm.allPermissions)) {
    return false;
  }

  return true;
}

/**
 * Filtrer les items de navigation selon les permissions
 */
export function filterNavByPermissions<T extends { href: string }>(
  items: T[],
  userRole: Role | undefined,
  userPermissions: string[]
): T[] {
  if (!userRole) return [];
  return items.filter(item => canAccessPage(item.href, userRole, userPermissions));
}
