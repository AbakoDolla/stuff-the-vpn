import type { Request, Response, NextFunction } from "express";
import * as inboundService from "../services/inbound.service.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";

export async function createInbound(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inbound = await inboundService.createInbound(req.body);
    sendSuccess(res, inbound, "Inbound created successfully", HTTP_STATUS.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function listInbounds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inbounds = await inboundService.listInbounds();
    sendSuccess(res, inbounds, "Inbounds fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getInboundById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inbound = await inboundService.getInboundById(req.params["id"]!);
    sendSuccess(res, inbound, "Inbound fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateInbound(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inbound = await inboundService.updateInbound(req.params["id"]!, req.body);
    sendSuccess(res, inbound, "Inbound updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function deleteInbound(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await inboundService.deleteInbound(req.params["id"]!);
    sendSuccess(res, null, "Inbound deleted successfully");
  } catch (err) {
    next(err);
  }
}
