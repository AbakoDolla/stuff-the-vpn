import { Router } from "express";
import * as licenseController from "../controllers/license.controller.js";
import * as voucherController from "../controllers/voucher.controller.js";
import * as userController from "../controllers/user.controller.js";
import * as adminController from "../controllers/admin.controller.js";
import * as trafficController from "../controllers/traffic.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authMiddleware);

// Stats globales (GET /api/admin/stats) - ADMIN et SUPER_ADMIN
router.get("/stats", requirePermission(PERMISSIONS.ADMIN_STATS), adminController.getStats);

// V2Ray traffic monitoring
router.get("/traffic", requirePermission(PERMISSIONS.STATISTICS_VIEW), trafficController.getTrafficSnapshot);
router.post("/traffic/sync", requirePermission(PERMISSIONS.STATISTICS_MANAGE), trafficController.triggerSync);

// License management
router.post("/generate-token", requirePermission(PERMISSIONS.LICENSES_CREATE), licenseController.generateToken);
router.get("/licenses", requirePermission(PERMISSIONS.LICENSES_VIEW), licenseController.listLicenses);
router.post("/revoke-license", requirePermission(PERMISSIONS.LICENSES_REVOKE), licenseController.revokeLicense);
router.post("/reset-device", requirePermission(PERMISSIONS.LICENSES_RESET_DEVICE), licenseController.resetDevice);

// Voucher bulk generation (POST /api/admin/bulk-generate)
router.post("/bulk-generate", requirePermission(PERMISSIONS.VOUCHERS_MANAGE), voucherController.createVouchers);

// User management (deprecated - use /users routes instead)
router.get("/users", requirePermission(PERMISSIONS.USERS_VIEW), userController.listUsers);
router.patch("/users/:id/status", requirePermission(PERMISSIONS.USERS_MANAGE_STATUS), userController.setUserStatus);
router.patch("/users/:id/quota", requirePermission(PERMISSIONS.USERS_MANAGE_QUOTA), userController.addQuota);
router.patch("/users/:id/extend", requirePermission(PERMISSIONS.USERS_MANAGE_QUOTA), userController.extendExpiry);
router.delete("/users/:id", requirePermission(PERMISSIONS.USERS_DELETE), userController.deleteUser);

export default router;
