import { Router } from "express";
import * as resellerController from "../controllers/reseller.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createResellerSchema, updateResellerSchema } from "../validators/reseller.validator.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authMiddleware);

// Reseller management - ADMIN et SUPER_ADMIN seulement
router.get("/", requirePermission(PERMISSIONS.RESELLERS_VIEW), resellerController.listResellers);
router.get("/:id", requirePermission(PERMISSIONS.RESELLERS_VIEW), resellerController.getResellerById);
router.get("/:id/clients", requirePermission(PERMISSIONS.RESELLERS_CLIENTS), resellerController.getResellerClients);
router.post("/", requirePermission(PERMISSIONS.RESELLERS_CREATE), validate(createResellerSchema), resellerController.createReseller);
router.patch("/:id", requirePermission(PERMISSIONS.RESELLERS_UPDATE), validate(updateResellerSchema), resellerController.updateReseller);
router.delete("/:id", requirePermission(PERMISSIONS.RESELLERS_DELETE), resellerController.deleteReseller);

export default router;
