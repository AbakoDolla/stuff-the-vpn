import { Router } from "express";
import * as voucherController from "../controllers/voucher.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createVoucherSchema,
  redeemVoucherSchema,
  updateVoucherSchema,
} from "../validators/voucher.validator.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authMiddleware);

// All users can redeem vouchers
router.post("/redeem", validate(redeemVoucherSchema), voucherController.redeemVoucher);

// Create vouchers - Admin et Reseller
router.post(
  "/",
  requirePermission(PERMISSIONS.VOUCHERS_CREATE),
  validate(createVoucherSchema),
  voucherController.createVouchers,
);

// List vouchers - Admin et Reseller
router.get(
  "/",
  requirePermission(PERMISSIONS.VOUCHERS_VIEW),
  voucherController.listVouchers,
);

// Update voucher - Admin seulement
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.VOUCHERS_MANAGE),
  validate(updateVoucherSchema),
  voucherController.updateVoucher,
);

// Delete voucher - Admin seulement
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.VOUCHERS_MANAGE),
  voucherController.deleteVoucher,
);

export default router;
