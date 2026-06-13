/**
 * @stuff-the-vpn/types
 * Types TypeScript partagés entre le backend, le dashboard et les packages.
 *
 * TODO (Phase 2/3): Définir les types en parallèle du schéma Prisma.
 */

// ─── Utilisateur ─────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  resellerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'reseller' | 'client';
export type AccountStatus = 'active' | 'suspended' | 'expired';

// ─── Voucher ──────────────────────────────────────────────────────────────────
export interface Voucher {
  id: string;
  code: string;
  status: VoucherStatus;
  quota: QuotaConfig;
  activatedBy?: string;
  activatedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export type VoucherStatus = 'pending' | 'active' | 'expired' | 'revoked';

// ─── Quota ────────────────────────────────────────────────────────────────────
export interface QuotaConfig {
  bandwidthMb: number;       // Quota de bande passante en MB
  durationDays: number;      // Durée de validité en jours
  maxDevices: number;        // Nombre max d'appareils simultanés
  protocol: VpnProtocol;     // Protocole VPN autorisé
}

export type VpnProtocol = 'v2ray' | 'ssh' | 'both';

// ─── Serveur VPN ─────────────────────────────────────────────────────────────
export interface VpnServer {
  id: string;
  name: string;
  host: string;
  country: string;
  protocol: VpnProtocol;
  status: ServerStatus;
  load: number; // Charge en pourcentage (0-100)
}

export type ServerStatus = 'online' | 'offline' | 'maintenance';

// ─── Revendeur ────────────────────────────────────────────────────────────────
export interface Reseller {
  id: string;
  name: string;
  email: string;
  commissionRate: number; // Taux de commission en %
  status: AccountStatus;
  balance: number;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
