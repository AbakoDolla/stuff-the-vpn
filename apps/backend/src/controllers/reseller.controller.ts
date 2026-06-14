import type { Request, Response, NextFunction } from "express";
import * as resellerService from "../services/reseller.service.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";

export async function createReseller(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reseller = await resellerService.createReseller(req.body);
    sendSuccess(res, reseller, "Reseller created successfully", HTTP_STATUS.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function listResellers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query["page"] ?? 1);
    const limit = Number(req.query["limit"] ?? 20);
    const result = await resellerService.listResellers(page, limit);
    sendSuccess(res, result, "Resellers fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getResellerById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const reseller = await resellerService.getResellerById(id);
    sendSuccess(res, reseller, "Reseller fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getResellerClients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const clients = await resellerService.getResellerClients(id);
    sendSuccess(res, clients, "Reseller clients fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateReseller(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const reseller = await resellerService.updateReseller(id, req.body);
    sendSuccess(res, reseller, "Reseller updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function deleteReseller(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    await resellerService.deleteReseller(id);
    sendSuccess(res, null, "Reseller deleted successfully");
  } catch (err) {
    next(err);
  }
}
