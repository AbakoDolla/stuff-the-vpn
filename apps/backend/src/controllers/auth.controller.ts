import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";

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
    const ipAddress = req.ip;
    const result = await authService.loginUser(req.body, deviceName, ipAddress);
    sendSuccess(res, result, "Login successful");
  } catch (err) {
    if (err instanceof Error && err.message.includes("Invalid credentials")) {
      sendError(res, err.message, HTTP_STATUS.UNAUTHORIZED);
      return;
    }
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
    sendSuccess(res, null, "Logged out successfully");
  } catch (err) {
    next(err);
  }
}
