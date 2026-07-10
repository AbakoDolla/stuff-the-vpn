import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";
import { getResellerFilter } from "../middleware/permission.middleware.js";
import { logUserCreate, logUserUpdate, logUserDelete, logUserStatusChange, logQuotaUpdate, auditFromRequest } from "../services/audit.service.js";
import type { Role } from "../constants/permissions.js";

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const role = (req as AuthRequest).user!.role as Role;
    
    // Pour les revendeurs, le createdBy doit être leur propre ID
    const data = { ...req.body };
    if (role === "RESELLER") {
      data.resellerId = userId;
    }
    
    const user = await userService.createUser(data);
    
    // Log l'action
    await logUserCreate(req, user.id, user.role as Role, user.resellerId || undefined);
    
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
    
    // Obtenir le filtre basé sur le rôle
    const role = (req as AuthRequest).user!.role as Role;
    const userId = (req as AuthRequest).user!.userId;
    const filter = getResellerFilter(role, userId);
    
    const result = await userService.listUsers(page, limit, search, filter);
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
    const oldUser = await userService.getUserById(id);
    const user = await userService.updateUser(id, req.body);
    
    // Log les changements
    const changes: Record<string, { from: any; to: any }> = {};
    const fieldsToTrack = ['username', 'email', 'phone', 'status', 'quotaRemainingGB', 'expireAt'];
    for (const field of fieldsToTrack) {
      if (oldUser[field as keyof typeof oldUser] !== user[field as keyof typeof user]) {
        changes[field] = { from: oldUser[field as keyof typeof oldUser], to: user[field as keyof typeof user] };
      }
    }
    if (Object.keys(changes).length > 0) {
      await logUserUpdate(req, id, changes);
    }
    
    sendSuccess(res, user, "User updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function setUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const newStatus = req.body.status as string;
    const user = await userService.setUserStatus(id, newStatus);
    
    // Log le changement de statut
    await logUserStatusChange(req, id, newStatus);
    
    sendSuccess(res, user, `User ${newStatus.toLowerCase()} successfully`);
  } catch (err) {
    next(err);
  }
}

export async function addQuota(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const addGB = req.body.addGB as number;
    const oldUser = await userService.getUserById(id);
    const user = await userService.addQuota(id, addGB);
    
    // Log la modification de quota
    await logQuotaUpdate(req, id, addGB, user.quotaRemainingGB);
    
    sendSuccess(res, user, "Quota added successfully");
  } catch (err) {
    next(err);
  }
}

export async function extendExpiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const days = req.body.days as number;
    const user = await userService.extendExpiry(id, days);
    
    // Log la modification
    await logUserUpdate(req, id, { expireAt: { from: null, to: user.expireAt } });
    
    sendSuccess(res, user, "Expiry extended successfully");
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const reason = req.body.reason as string | undefined;
    await userService.deleteUser(id);
    
    // Log la suppression
    await logUserDelete(req, id, reason);
    
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
