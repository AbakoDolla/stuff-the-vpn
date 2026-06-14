import { Router } from "express";
import * as resellerController from "../controllers/reseller.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createResellerSchema, updateResellerSchema } from "../validators/reseller.validator.js";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN", "SUPER_ADMIN"));

router.get("/", resellerController.listResellers);
router.get("/:id", resellerController.getResellerById);
router.get("/:id/clients", resellerController.getResellerClients);
router.post("/", validate(createResellerSchema), resellerController.createReseller);
router.patch("/:id", validate(updateResellerSchema), resellerController.updateReseller);
router.delete("/:id", resellerController.deleteReseller);

export default router;
