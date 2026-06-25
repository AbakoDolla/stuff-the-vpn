import { z } from "zod";

export const createVoucherSchema = z.object({
  quotaGB: z.number().positive("Quota must be positive"),
  durationDay: z.number().int().positive("Duration must be positive"),
  count: z.number().int().min(1).max(500).default(1),
});

export const redeemVoucherSchema = z.object({
  code: z.string().min(1, "Voucher code is required"),
});

export const updateVoucherSchema = z.object({
  status: z.enum(["ACTIVE", "USED", "EXPIRED"]).optional(),
  quotaGB: z.number().positive().optional(),
  durationDay: z.number().int().positive().optional(),
});
