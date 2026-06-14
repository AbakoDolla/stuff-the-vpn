import { z } from "zod";

export const updateUserSchema = z.object({
  username: z.string().min(3).max(32).optional(),
  email: z.string().email().optional(),
  deviceLimit: z.number().int().min(1).max(10).optional(),
  expireAt: z.string().datetime().optional(),
});

export const suspendUserSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
});

export const addQuotaSchema = z.object({
  addGB: z.number().positive("Must be a positive number"),
});

export const extendExpirySchema = z.object({
  days: z.number().int().positive("Must be a positive number of days"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
