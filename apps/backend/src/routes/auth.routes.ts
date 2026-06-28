import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { authRateLimit, strictRateLimit } from "../middleware/rate-limit.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();

// Public routes (rate limited)
router.post("/register", authRateLimit, validate(registerSchema), authController.register);
router.post("/login",    authRateLimit, validate(loginSchema),    authController.login);
router.post("/login/license", authRateLimit, authController.loginWithLicense);
router.post("/refresh",  authRateLimit, authController.refreshToken);

// Auth required
router.get( "/me",     authMiddleware, authController.me);
router.post("/logout", authMiddleware, authController.logout);

export default router;
