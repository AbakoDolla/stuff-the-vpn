import { Router } from "express";
import * as licenseController from "../controllers/license.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Public: validate license
router.post("/validate", licenseController.validateLicense);

// Public: check license status by token
router.get("/:token/status", licenseController.getLicenseStatus);

// Authenticated
router.use(authMiddleware);

router.post("/bind-device", licenseController.bindDevice);
router.post("/reset-device", licenseController.resetDevice);
router.post("/revoke", requireRole("ADMIN", "SUPER_ADMIN"), licenseController.revokeLicense);

// Admin only
router.post("/generate", requireRole("ADMIN", "SUPER_ADMIN", "RESELLER"), licenseController.generateToken);
router.get("/", requireRole("ADMIN", "SUPER_ADMIN"), licenseController.listLicenses);

export default router;

