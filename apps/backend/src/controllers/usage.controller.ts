import type { Request, Response, NextFunction } from "express";
import * as usageService from "../services/usage.service.js";
import { sendSuccess } from "../utils/response.js";

export async function listUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query["page"] ?? 1);
    const limit = Number(req.query["limit"] ?? 20);
    const result = await usageService.listUsageLogs(page, limit);
    sendSuccess(res, result, "Usage logs fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getUserUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query["page"] ?? 1);
    const limit = Number(req.query["limit"] ?? 20);
    const result = await usageService.getUserUsageLogs(req.params["userId"]!, page, limit);
    sendSuccess(res, result, "User usage logs fetched successfully");
  } catch (err) {
    next(err);
  }
}
