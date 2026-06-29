/**
 * inbound.controller.ts — Admin management of VPN inbounds
 */
import type { Request, Response } from "express";
import * as inboundService from "../services/inbound.service.js";
import * as v from "../validators/inbound.validator.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";

export async function list(req: Request, res: Response): Promise<void> {
  const { enabled, protocol } = req.query;
  const filters: Record<string, unknown> = {};
  if (enabled !== undefined) filters.enabled = enabled === "true";
  if (protocol) filters.protocol = String(protocol);
  const data = await inboundService.listInbounds(filters as Parameters<typeof inboundService.listInbounds>[0]);
  sendSuccess(res, data);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const inbound = await inboundService.getInboundById(req.params.id);
  sendSuccess(res, inbound);
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = v.createInboundSchema.parse(req.body);
  const inbound = await inboundService.createInbound(parsed);
  sendSuccess(res, inbound, HTTP_STATUS.CREATED);
}

export async function update(req: Request, res: Response): Promise<void> {
  const parsed = v.updateInboundSchema.parse(req.body);
  const inbound = await inboundService.updateInbound(req.params.id, parsed);
  sendSuccess(res, inbound);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await inboundService.deleteInbound(req.params.id);
  sendSuccess(res, null, HTTP_STATUS.NO_CONTENT);
}

export async function updateStats(req: Request, res: Response): Promise<void> {
  const { activeConns, totalUpGB, totalDownGB } = req.body as {
    activeConns?: number; totalUpGB?: number; totalDownGB?: number;
  };
  const inbound = await inboundService.updateInboundStats(req.params.id, {
    activeConns, totalUpGB, totalDownGB,
  });
  sendSuccess(res, inbound);
}
