import { Router } from "express";
import * as licenseController from "../controllers/license.controller.js";
import * as voucherController from "../controllers/voucher.controller.js";
import * as userController from "../controllers/user.controller.js";
import * as adminController from "../controllers/admin.controller.js";
import * as trafficController from "../controllers/traffic.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("ADMIN", "SUPER_ADMIN"));

// Stats globales (GET /api/admin/stats)
router.get("/stats", adminController.getStats);

// V2Ray traffic monitoring
router.get("/traffic", trafficController.getTrafficSnapshot);
router.post("/traffic/sync", trafficController.triggerSync);

// License management
router.post("/generate-token", licenseController.generateToken);
router.get("/licenses", licenseController.listLicenses);
router.post("/revoke-license", licenseController.revokeLicense);
router.post("/reset-device", licenseController.resetDevice);

// Voucher bulk generation (POST /api/admin/bulk-generate)
router.post("/bulk-generate", voucherController.createVouchers);

// User management
router.get("/users", userController.listUsers);
router.patch("/users/:id/status", userController.setUserStatus);
router.patch("/users/:id/quota", userController.addQuota);
router.patch("/users/:id/extend", userController.extendExpiry);
router.delete("/users/:id", userController.deleteUser);

export default router;
