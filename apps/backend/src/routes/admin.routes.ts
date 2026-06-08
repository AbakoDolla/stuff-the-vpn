import { Router } from "express";
import * as licenseController from "../controllers/license.controller.js";
import * as userController from "../controllers/user.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("ADMIN", "SUPER_ADMIN"));

// License management
router.post("/generate-token", licenseController.generateToken);
router.post("/bulk-generate", licenseController.generateToken); // Same handler, accepts count
router.get("/licenses", licenseController.listLicenses);
router.post("/revoke-license", licenseController.revokeLicense);

// User management
router.get("/users", userController.listUsers);
router.patch("/users/:id/status", userController.setUserStatus);
router.patch("/users/:id/quota", userController.addQuota);
router.patch("/users/:id/extend", userController.extendExpiry);
router.delete("/users/:id", userController.deleteUser);

// Device management
router.post("/reset-device", licenseController.resetDevice);

export default router;