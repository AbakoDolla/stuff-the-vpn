/**
 * XPanel (X-NET) Controller
 * API routes for X-NET VPN Panel integration
 */

import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../utils/response.js";
import { HTTP_STATUS } from "../../constants/index.js";
import type { AuthRequest } from "../../types/index.js";
import * as xpanelService from "./xpanel.service.js";

/**
 * Create VPN user
 * POST /api/xpanel/users
 */
export async function createVPNUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, username, email, packageType, quotaGB, expireDays } = req.body;

    if (!userId || !username || !packageType) {
      sendError(res, "userId, username and packageType are required", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const result = await xpanelService.createVPNUser({
      userId,
      username,
      email,
      packageType,
      quotaGB,
      expireDays,
    });

    if (!result.success) {
      sendError(res, result.error || "Failed to create VPN user", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    sendSuccess(res, result, "VPN user created successfully", HTTP_STATUS.CREATED);
  } catch (err) {
    next(err);
  }
}

/**
 * Delete VPN user
 * DELETE /api/xpanel/users/:userId
 */
export async function deleteVPNUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      sendError(res, "userId is required", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const result = await xpanelService.deleteVPNUser({ userId });

    if (!result.success) {
      sendError(res, result.error || "Failed to delete VPN user", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    sendSuccess(res, null, "VPN user deleted successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Update VPN user
 * PATCH /api/xpanel/users/:userId
 */
export async function updateVPNUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;
    const { quotaGB, expireDays, enable } = req.body;

    if (!userId) {
      sendError(res, "userId is required", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const result = await xpanelService.updateVPNUser({
      userId,
      quotaGB,
      expireDays,
      enable,
    });

    if (!result.success) {
      sendError(res, result.error || "Failed to update VPN user", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    sendSuccess(res, null, "VPN user updated successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Get all VPN users
 * GET /api/xpanel/users
 */
export async function getVPNUsers(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await xpanelService.getVPNUsers();

    if (!result.success) {
      sendError(res, result.error || "Failed to get VPN users", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    sendSuccess(res, result.users, "VPN users fetched successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Get traffic usage for a user
 * GET /api/xpanel/users/:userId/traffic
 */
export async function getTrafficUsage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      sendError(res, "userId is required", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const result = await xpanelService.getTrafficUsage(userId);

    if (!result.success) {
      sendError(res, result.error || "Failed to get traffic usage", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    sendSuccess(res, result.usage, "Traffic usage fetched successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Sync VPN users between SXB and XPanel
 * POST /api/xpanel/sync
 */
export async function syncVPNUsers(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await xpanelService.syncVPNUsers();
    sendSuccess(res, result, "VPN users synced successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Get subscription link for a user
 * GET /api/xpanel/users/:userId/subscription
 */
export async function getSubscriptionLink(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      sendError(res, "userId is required", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const result = await xpanelService.getSubscriptionLink(userId);

    if (!result.success) {
      sendError(res, result.error || "Failed to get subscription link", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    sendSuccess(res, { link: result.link }, "Subscription link fetched successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Reset traffic for a user
 * POST /api/xpanel/users/:userId/reset-traffic
 */
export async function resetUserTraffic(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      sendError(res, "userId is required", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const result = await xpanelService.resetUserTraffic(userId);

    if (!result.success) {
      sendError(res, result.error || "Failed to reset traffic", HTTP_STATUS.BAD_REQUEST);
      return;
    }

    sendSuccess(res, null, "Traffic reset successfully");
  } catch (err) {
    next(err);
  }
}
