import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/profile", userController.getProfile);
router.get("/subscription", userController.getSubscription);
router.get("/status", userController.getUserStatus);

export default router;