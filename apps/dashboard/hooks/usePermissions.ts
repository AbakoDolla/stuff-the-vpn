'use client';

import { useMemo } from 'react';
import { useAuth, type AdminUser, type Role } from '@/lib/auth';
import { 
  hasPermission as checkPermission, 
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  canAccessPage,
  getRoleLevel,
  type Permission 
} from '@/lib/permissions';

export interface UsePermissionsReturn {
  role: Role | undefined;
  permissions: string[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  isReseller: boolean;
  isUser: boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  canAccess: (path: string) => boolean;
  canModifyRole: (targetRole: Role) => boolean;
  roleLevel: number;
}

/**
 * Hook pour gérer les permissions côté client
 */
export function usePermissions(): UsePermissionsReturn {
  const user = useAuth();

  return useMemo(() => {
    const role = user?.role as Role | undefined;
    const permissions = user?.permissions || [];

    return {
      role,
      permissions,
      isSuperAdmin: role === 'SUPER_ADMIN',
      isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
      isSupport: role === 'SUPPORT',
      isReseller: role === 'RESELLER',
      isUser: role === 'USER',
      
      can: (permission: Permission) => checkPermission(permissions, permission),
      canAny: (perms: Permission[]) => checkAnyPermission(permissions, perms),
      canAll: (perms: Permission[]) => checkAllPermissions(permissions, perms),
      canAccess: (path: string) => canAccessPage(path, role, permissions),
      canModifyRole: (targetRole: Role) => role ? getRoleLevel(role) > getRoleLevel(targetRole) : false,
      roleLevel: role ? getRoleLevel(role) : 0,
    };
  }, [user?.role, user?.permissions]);
}

/**
 * Hook simplifié pour les composants qui n'ont besoin que de vérifier une permission
 */
export function useCan(permission: Permission): boolean {
  const { can } = usePermissions();
  return can(permission);
}

/**
 * Hook pour obtenir l'utilisateur actuel
 */
export function useCurrentUser(): AdminUser | null {
  const user = useAuth();
  return user;
}
