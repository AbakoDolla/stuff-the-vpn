import type { Request, Response, NextFunction } from "express";
import * as vpnService from "../services/vpn.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";

export async function getMyConfig(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const config = await vpnService.getMyConfig(userId);
    sendSuccess(res, config, "VPN config fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getServers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const servers = await vpnService.getServers();
    sendSuccess(res, servers, "Servers fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getRecommendedServer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const server = await vpnService.getRecommendedServer();
    if (!server) {
      sendError(res, "No recommended server found", HTTP_STATUS.NOT_FOUND);
      return;
    }
    sendSuccess(res, server, "Recommended server fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getVpnConfig(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const config = await vpnService.getVpnConfig(userId);
    sendSuccess(res, config, "VPN config fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getVpnStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const status = await vpnService.getVpnStatus(userId);
    sendSuccess(res, status, "VPN status fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function connectVpn(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { serverId } = req.body;
    const result = await vpnService.connectVpn(userId, serverId);
    sendSuccess(res, result, "VPN connected successfully");
  } catch (err) {
    next(err);
  }
}

export async function disconnectVpn(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await vpnService.disconnectVpn(userId);
    sendSuccess(res, result, "VPN disconnected successfully");
  } catch (err) {
    next(err);
  }
}