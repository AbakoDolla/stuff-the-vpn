import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.createUser(req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: user, message: "User created successfully" });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await userService.getUserById(userId);
    sendSuccess(res, user, "Profile fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getSubscription(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const subscription = await userService.getSubscription(userId);
    sendSuccess(res, subscription, "Subscription fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getUserStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const status = await userService.getUserStatus(userId);
    sendSuccess(res, status, "User status fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query["page"] ?? 1);
    const limit = Number(req.query["limit"] ?? 20);
    const search = req.query["search"] ? String(req.query["search"]) : undefined;
    const result = await userService.listUsers(page, limit, search);
    res.json({
      success: true,
      message: "Users fetched successfully",
      data: result.users,
      total: result.total,
      page: result.page,
      limit: result.limit,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const user = await userService.getUserById(id);
    sendSuccess(res, user, "User fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const user = await userService.updateUser(id, req.body);
    sendSuccess(res, user, "User updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function setUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const user = await userService.setUserStatus(id, req.body.status);
    sendSuccess(res, user, `User ${String(req.body.status).toLowerCase()} successfully`);
  } catch (err) {
    next(err);
  }
}

export async function addQuota(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const user = await userService.addQuota(id, req.body.addGB);
    sendSuccess(res, user, "Quota added successfully");
  } catch (err) {
    next(err);
  }
}

export async function extendExpiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const user = await userService.extendExpiry(id, req.body.days);
    sendSuccess(res, user, "Expiry extended successfully");
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    await userService.deleteUser(id);
    sendSuccess(res, null, "User deleted successfully");
  } catch (err) {
    next(err);
  }
}

export async function regenerateLoginToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const result = await userService.regenerateLoginToken(id);
    sendSuccess(res, result, "Login token regenerated successfully");
  } catch (err) {
    next(err);
  }
}
