import type { Request } from "express";
import type { UserRole, UserStatus } from "@prisma/client";
import type { Permission, Role } from "../constants/permissions.js";

export interface AuthPayload {
  userId: string;
  role: string;
  sessionId?: string;
  // Device auth
  type?: "user" | "device" | "admin";
  deviceId?: string;
  // License
  licenseToken?: string;
  // Permissions (included in token for quick access)
  permissions?: Permission[];
}

/**
 * Informations utilisateur retournées après connexion
 */
export interface UserSessionInfo {
  id: string;
  email?: string | null;
  username?: string | null;
  name?: string | null;
  phone?: string | null;
  role: Role;
  status: string;
  permissions: Permission[];
  resellerId?: string | null;
  deviceLimit?: number;
  quotaUsedGB?: number;
  quotaRemainingGB?: number;
  expireAt?: Date | null;
  createdAt: Date;
}

/**
 * Réponse de connexion
 */
export interface LoginResponse {
  token: string;
  user: UserSessionInfo;
  expiresIn: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  deviceLimit: number;
  quotaUsedGB: number;
  quotaRemainingGB: number;
  expireAt: Date | null;
  createdAt: Date;
}
