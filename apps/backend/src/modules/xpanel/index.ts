/**
 * XPanel (X-NET) Routes
 * API routes for X-NET VPN Panel integration
 */

import { Router } from "express";
import * as xpanelController from "./xpanel.controller.js";
import { authMiddleware, requirePermission } from "../../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route POST /api/xpanel/users
 * @desc Create VPN user in XPanel
 * @access Admin, Reseller
 */
router.post(
  "/users",
  requirePermission("vpn_profiles.create"),
  xpanelController.createVPNUser
);

/**
 * @route GET /api/xpanel/users
 * @desc Get all VPN users from XPanel
 * @access Admin only
 */
router.get(
  "/users",
  requirePermission("vpn_profiles.view"),
  xpanelController.getVPNUsers
);

/**
 * @route GET /api/xpanel/users/:userId
 * @desc Get traffic usage for a user
 * @access Admin, Reseller (own users)
 */
router.get(
  "/users/:userId/traffic",
  requirePermission("vpn_profiles.view"),
  xpanelController.getTrafficUsage
);

/**
 * @route GET /api/xpanel/users/:userId/subscription
 * @desc Get subscription link for a user
 * @access Admin, Reseller (own users)
 */
router.get(
  "/users/:userId/subscription",
  requirePermission("vpn_profiles.view"),
  xpanelController.getSubscriptionLink
);

/**
 * @route PATCH /api/xpanel/users/:userId
 * @desc Update VPN user
 * @access Admin only
 */
router.patch(
  "/users/:userId",
  requirePermission("vpn_profiles.update"),
  xpanelController.updateVPNUser
);

/**
 * @route DELETE /api/xpanel/users/:userId
 * @desc Delete VPN user
 * @access Admin, Reseller (own users)
 */
router.delete(
  "/users/:userId",
  requirePermission("vpn_profiles.delete"),
  xpanelController.deleteVPNUser
);

/**
 * @route POST /api/xpanel/users/:userId/reset-traffic
 * @desc Reset traffic for a user
 * @access Admin only
 */
router.post(
  "/users/:userId/reset-traffic",
  requirePermission("vpn_profiles.update"),
  xpanelController.resetUserTraffic
);

/**
 * @route POST /api/xpanel/sync
 * @desc Sync VPN users between SXB and XPanel
 * @access Admin only
 */
router.post(
  "/sync",
  requirePermission("vpn_profiles.view"),
  xpanelController.syncVPNUsers
);

export default router;
