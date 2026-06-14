import type { Request, Response, NextFunction } from "express";
import * as planService from "../services/plan.service.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";

export async function createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const plan = await planService.createPlan(req.body);
    sendSuccess(res, plan, "Plan created successfully", HTTP_STATUS.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const plans = await planService.listPlans();
    sendSuccess(res, plans, "Plans fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const plan = await planService.getPlanById(id);
    sendSuccess(res, plan, "Plan fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const plan = await planService.updatePlan(id, req.body);
    sendSuccess(res, plan, "Plan updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    await planService.deletePlan(id);
    sendSuccess(res, null, "Plan deleted successfully");
  } catch (err) {
    next(err);
  }
}
