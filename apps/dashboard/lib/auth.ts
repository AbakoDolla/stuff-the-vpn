'use client';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'RESELLER' | 'USER';

export interface AdminUser {
  id: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  role: Role;
  status: string;
  permissions: string[];
  resellerId?: string | null;
  deviceLimit?: number;
  quotaUsedGB?: number;
  quotaRemainingGB?: number;
  expireAt?: string | null;
  createdAt: string;
  token?: string;
  expiresIn?: string;
}

export function saveAuth(user: AdminUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sxb_token', user.token || '');
  localStorage.setItem('sxb_user', JSON.stringify(user));
  // Stocker aussi en cookie pour le middleware Next.js
  if (user.token) {
    document.cookie = `stv_token=${user.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  }
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sxb_token');
  localStorage.removeItem('sxb_user');
  // Supprimer le cookie
  document.cookie = 'stv_token=; path=/; max-age=0';
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('sxb_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sxb_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Obtenir le niveau du rôle (pour comparaisons)
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
 * Vérifier si le rôle peut accéder à une ressource
 */
export function canAccessRole(userRole: Role, targetRole: Role): boolean {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
}

/**
 * Vérifier si l'utilisateur est un administrateur
 */
export function isAdmin(user: AdminUser | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

/**
 * Vérifier si l'utilisateur est un Super Admin
 */
export function isSuperAdmin(user: AdminUser | null): boolean {
  return user?.role === 'SUPER_ADMIN';
}

/**
 * Vérifier si l'utilisateur est un revendeur
 */
export function isReseller(user: AdminUser | null): boolean {
  return user?.role === 'RESELLER';
}

/**
 * Vérifier si l'utilisateur est dans le support
 */
export function isSupport(user: AdminUser | null): boolean {
  return user?.role === 'SUPPORT';
}
