import { Router } from "express";
import * as licenseController from "../controllers/license.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

// Public: validate license
router.post("/validate", licenseController.validateLicense);

// Public: check license status by token
router.get("/:token/status", licenseController.getLicenseStatus);

// Authenticated
router.use(authMiddleware);

// License management
router.post("/bind-device", requirePermission(PERMISSIONS.DEVICES_MANAGE), licenseController.bindDevice);
router.post("/reset-device", requirePermission(PERMISSIONS.LICENSES_RESET_DEVICE), licenseController.resetDevice);
router.post("/revoke", requirePermission(PERMISSIONS.LICENSES_REVOKE), licenseController.revokeLicense);

// Generate tokens - Admin et Reseller
router.post("/generate", requirePermission(PERMISSIONS.LICENSES_CREATE), licenseController.generateToken);

// List licenses - Admin et Super Admin
router.get("/", requirePermission(PERMISSIONS.LICENSES_VIEW), licenseController.listLicenses);

export default router;

