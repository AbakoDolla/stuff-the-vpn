import { Router } from "express";
import * as voucherController from "../controllers/voucher.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createVoucherSchema,
  redeemVoucherSchema,
  updateVoucherSchema,
} from "../validators/voucher.validator.js";

const router = Router();

router.use(authMiddleware);

// All users can redeem
router.post("/redeem", validate(redeemVoucherSchema), voucherController.redeemVoucher);

// Admin/Reseller only
router.post(
  "/",
  requireRole("ADMIN", "SUPER_ADMIN", "RESELLER"),
  validate(createVoucherSchema),
  voucherController.createVouchers,
);
router.get(
  "/",
  requireRole("ADMIN", "SUPER_ADMIN", "RESELLER"),
  voucherController.listVouchers,
);
router.patch(
  "/:id",
  requireRole("ADMIN", "SUPER_ADMIN"),
  validate(updateVoucherSchema),
  voucherController.updateVoucher,
);
router.delete(
  "/:id",
  requireRole("ADMIN", "SUPER_ADMIN"),
  voucherController.deleteVoucher,
);

export default router;
