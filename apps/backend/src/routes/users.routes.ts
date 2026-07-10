import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { 
  requirePermission, 
  requireResellerOwnership,
  getResellerFilter 
} from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  suspendUserSchema,
  addQuotaSchema,
  extendExpirySchema,
} from "../validators/user.validator.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authMiddleware);

// GET /users - Liste des utilisateurs selon le rôle
router.get("/", requirePermission(PERMISSIONS.USERS_VIEW), userController.listUsers);

// POST /users - Créer un utilisateur
router.post("/", requirePermission(PERMISSIONS.USERS_CREATE), validate(createUserSchema), userController.createUser);

// GET /users/:id - Détails d'un utilisateur
router.get("/:id", requirePermission(PERMISSIONS.USERS_VIEW), requireResellerOwnership(), userController.getUserById);

// PATCH /users/:id - Modifier un utilisateur
router.patch("/:id", requirePermission(PERMISSIONS.USERS_UPDATE), requireResellerOwnership(), userController.updateUser);

// DELETE /users/:id - Supprimer un utilisateur (SUPER_ADMIN seulement)
router.delete("/:id", requirePermission(PERMISSIONS.USERS_DELETE), requireResellerOwnership(), userController.deleteUser);

// PATCH /users/:id/status - Changer le statut
router.patch("/:id/status", requirePermission(PERMISSIONS.USERS_MANAGE_STATUS), requireResellerOwnership(), validate(suspendUserSchema), userController.setUserStatus);

// PATCH /users/:id/quota - Gérer les quotas
router.patch("/:id/quota", requirePermission(PERMISSIONS.USERS_MANAGE_QUOTA), requireResellerOwnership(), validate(addQuotaSchema), userController.addQuota);

// PATCH /users/:id/extend - Prolonger l'expiration
router.patch("/:id/extend", requirePermission(PERMISSIONS.USERS_MANAGE_QUOTA), requireResellerOwnership(), validate(extendExpirySchema), userController.extendExpiry);

// POST /users/:id/regenerate-token - Régénérer le token de connexion
router.post("/:id/regenerate-token", requirePermission(PERMISSIONS.TOKENS_CREATE), requireResellerOwnership(), userController.regenerateLoginToken);

export default router;
