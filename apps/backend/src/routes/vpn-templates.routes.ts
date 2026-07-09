import { Router } from "express";
import * as c from "../controllers/vpn-templates.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

// Mobile — get own active config (any authenticated user)
router.get("/my-config", c.getMyConfig);

// Admin — template CRUD
router.get("/",                requireRole("ADMIN","SUPER_ADMIN"), c.listTemplates);
router.post("/",               requireRole("ADMIN","SUPER_ADMIN"), c.createTemplate);
router.post("/generate-keys",  requireRole("ADMIN","SUPER_ADMIN"), c.generateKeys);
router.get("/:id",             requireRole("ADMIN","SUPER_ADMIN"), c.getTemplate);
router.put("/:id",             requireRole("ADMIN","SUPER_ADMIN"), c.updateTemplate);
router.delete("/:id",          requireRole("ADMIN","SUPER_ADMIN"), c.deleteTemplate);
router.post("/:id/duplicate",  requireRole("ADMIN","SUPER_ADMIN"), c.duplicateTemplate);
router.post("/:id/assign",     requireRole("ADMIN","SUPER_ADMIN"), c.assignTemplate);
router.delete("/:id/assign",   requireRole("ADMIN","SUPER_ADMIN"), c.unassignTemplate);

// Admin — user profile assignments
router.get("/user-profiles",   requireRole("ADMIN","SUPER_ADMIN","RESELLER"), c.listUserProfiles);
router.post("/user-profiles",  requireRole("ADMIN","SUPER_ADMIN"), c.createUserProfile);
router.patch("/user-profiles/:id/status", requireRole("ADMIN","SUPER_ADMIN"), c.setUserProfileStatus);

export default router;
