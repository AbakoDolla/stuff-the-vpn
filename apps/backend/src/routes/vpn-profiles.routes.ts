import { Router } from "express";
import * as c from "../controllers/vpn-profile.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

// User — get own active profile config (encrypted)
router.get("/my", c.getMyProfile);
router.post("/connect", c.recordConnect);
router.post("/disconnect", c.recordDisconnect);

// Admin
router.get("/",       requireRole("ADMIN","SUPER_ADMIN","RESELLER"), c.listProfiles);
router.post("/",      requireRole("ADMIN","SUPER_ADMIN"), c.createProfile);
router.delete("/:id", requireRole("ADMIN","SUPER_ADMIN"), c.deleteProfile);
router.patch("/:id/status", requireRole("ADMIN","SUPER_ADMIN"), c.setProfileStatus);

export default router;
