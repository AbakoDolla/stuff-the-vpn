'use client';

  export interface AdminUser {
    id: string;
    username: string;
    email: string;
    role: string;
    token: string;
  }

  export function saveAuth(user: AdminUser) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sxb_token', user.token);
    localStorage.setItem('sxb_user', JSON.stringify(user));
  }

  export function clearAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('sxb_token');
    localStorage.removeItem('sxb_user');
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
  