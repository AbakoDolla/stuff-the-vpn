/**
 * @stuff-the-vpn/types
 * Types TypeScript partagés entre le backend, le dashboard et les packages.
 */

import { z } from "zod";

  // ─── Health ───────────────────────────────────────────────────────────────────
  export const HealthCheckResponse = z.object({
    status: z.literal("ok"),
    timestamp: z.string().optional(),
  });
  export type HealthCheckResponseType = z.infer<typeof HealthCheckResponse>;

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
    bandwidthMb: number;
    durationDays: number;
    maxDevices: number;
    protocol: VpnProtocol;
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
    load: number;
  }

  export type ServerStatus = 'online' | 'offline' | 'maintenance';

  // ─── Revendeur ────────────────────────────────────────────────────────────────
  export interface Reseller {
    id: string;
    name: string;
    email: string;
    commissionRate: number;
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
  