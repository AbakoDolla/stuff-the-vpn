import { Router } from "express";
import * as planController from "../controllers/plan.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createPlanSchema, updatePlanSchema } from "../validators/plan.validator.js";

const router = Router();

// Public: list plans
router.get("/", planController.listPlans);
router.get("/:id", planController.getPlanById);

// Admin only
router.use(authMiddleware, requireRole("ADMIN", "SUPER_ADMIN"));
router.post("/", validate(createPlanSchema), planController.createPlan);
router.patch("/:id", validate(updatePlanSchema), planController.updatePlan);
router.delete("/:id", planController.deletePlan);

export default router;
