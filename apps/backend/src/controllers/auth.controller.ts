import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";
import { env } from "../config/env.js";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.registerUser(req.body);
    sendSuccess(res, user, "User registered successfully", HTTP_STATUS.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceName = req.headers["x-device-name"] as string | undefined;
    const result = await authService.loginUser(req.body, deviceName, req.ip);
    res.cookie("stv_token", result.token, COOKIE_OPTS);
    sendSuccess(res, result, "Login successful");
  } catch (err) {
    if (err instanceof Error && err.message.includes("Invalid credentials")) {
      sendError(res, err.message, HTTP_STATUS.UNAUTHORIZED);
      return;
    }
    next(err);
  }
}

/**
 * POST /api/auth/admin/login
 * Connexion dédiée aux administrateurs du dashboard.
 * Vérifie User table (ADMIN/SUPER_ADMIN) puis Admin table.
 */
export async function adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      sendError(res, "email and password are required", HTTP_STATUS.BAD_REQUEST);
      return;
    }
    const result = await authService.loginAdmin(email, password, req.ip);
    res.cookie("stv_token", result.token, COOKIE_OPTS);
    sendSuccess(res, result, "Admin login successful");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("Invalid credentials") || msg.includes("Account is")) {
      sendError(res, "Identifiants invalides ou compte inactif", HTTP_STATUS.UNAUTHORIZED);
      return;
    }
    next(err);
  }
}

export async function loginWithLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, phone, deviceId, deviceName } = req.body;
    if (!token || !phone || !deviceId) {
      sendError(res, "token, phone, and deviceId are required", HTTP_STATUS.BAD_REQUEST);
      return;
    }
    const result = await authService.loginWithLicense(token, phone, deviceId, deviceName, req.ip);
    res.cookie("stv_token", result.token, COOKIE_OPTS);
    sendSuccess(res, result, "Login successful");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.startsWith("LICENSE_") || msg.startsWith("ACCOUNT_") || msg.startsWith("DEVICE_")) {
      sendError(res, msg, HTTP_STATUS.UNAUTHORIZED);
      return;
    }
    next(err);
  }
}

export async function refreshToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, sessionId } = req.user!;
    const result = await authService.refreshToken(userId, sessionId!);
    res.cookie("stv_token", result.token, COOKIE_OPTS);
    sendSuccess(res, result, "Token refreshed");
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, user, "User fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.slice(7) ?? "";
    await authService.logoutSession(token);
    res.clearCookie("stv_token");
    sendSuccess(res, null, "Logged out successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/token/login
 * Connexion avec token de connexion généré par l'admin pour les utilisateurs/resellers
 */
export async function loginWithToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, deviceId, deviceName } = req.body as { token?: string; deviceId?: string; deviceName?: string };
    if (!token) {
      sendError(res, "Token de connexion requis", HTTP_STATUS.BAD_REQUEST);
      return;
    }
    const result = await authService.loginWithDashboardToken(token, req.ip, deviceId, deviceName);
    res.cookie("stv_token", result.token, COOKIE_OPTS);
    sendSuccess(res, result, "Connexion réussie");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    sendError(res, msg, HTTP_STATUS.UNAUTHORIZED);
  }
}
