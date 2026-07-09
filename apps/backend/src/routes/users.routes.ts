import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  suspendUserSchema,
  addQuotaSchema,
  extendExpirySchema,
} from "../validators/user.validator.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("ADMIN", "SUPER_ADMIN"));

router.post("/", validate(createUserSchema), userController.createUser);
router.get("/", userController.listUsers);
router.get("/:id", userController.getUserById);
router.patch("/:id", validate(updateUserSchema), userController.updateUser);
router.delete("/:id", userController.deleteUser);

router.patch("/:id/status", validate(suspendUserSchema), userController.setUserStatus);
router.patch("/:id/quota", validate(addQuotaSchema), userController.addQuota);
router.patch("/:id/extend", validate(extendExpirySchema), userController.extendExpiry);
router.post("/:id/regenerate-token", userController.regenerateLoginToken);

export default router;
