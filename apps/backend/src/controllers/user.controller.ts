import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query["page"] ?? 1);
    const limit = Number(req.query["limit"] ?? 20);
    const result = await userService.listUsers(page, limit);
    sendSuccess(res, result, "Users fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(req.params["id"]!);
    sendSuccess(res, user, "User fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.updateUser(req.params["id"]!, req.body);
    sendSuccess(res, user, "User updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function setUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.setUserStatus(req.params["id"]!, req.body.status);
    sendSuccess(res, user, `User ${req.body.status.toLowerCase()} successfully`);
  } catch (err) {
    next(err);
  }
}

export async function addQuota(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.addQuota(req.params["id"]!, req.body.addGB);
    sendSuccess(res, user, "Quota added successfully");
  } catch (err) {
    next(err);
  }
}

export async function extendExpiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.extendExpiry(req.params["id"]!, req.body.days);
    sendSuccess(res, user, "Expiry extended successfully");
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteUser(req.params["id"]!);
    sendSuccess(res, null, "User deleted successfully");
  } catch (err) {
    next(err);
  }
}
