import type { Request, Response, NextFunction } from "express";
import * as vpnService from "../services/vpn.service.js";
import { sendSuccess } from "../utils/response.js";

export async function getMyConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const config = await vpnService.getMyConfig(userId);
    sendSuccess(res, config, "VPN config fetched successfully");
  } catch (err) {
    next(err);
  }
}
