import type { Request } from "express";
import type { UserRole, UserStatus } from "@prisma/client";

export interface AuthPayload {
  userId: string;
  role: string;
  sessionId?: string;
  // Device auth
  type?: "user" | "device" | "admin";
  deviceId?: string;
  // License
  licenseToken?: string;
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
