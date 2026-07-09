import { z } from "zod";

  export const createUserSchema = z.object({
    username: z.string().min(3).max(32),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(["USER", "ADMIN", "SUPER_ADMIN", "RESELLER"]).optional(),
    deviceLimit: z.number().int().min(1).max(100).optional(),
    quotaRemainingGB: z.number().nonnegative().optional(),
    expireAt: z.string().datetime().optional(),
  });

  export const updateUserSchema = z.object({
    username: z.string().min(3).max(32).optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
    deviceLimit: z.number().int().min(1).max(100).optional(),
    quotaRemainingGB: z.number().nonnegative().optional(),
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
    limit: z.coerce.number().int().min(1).max(1000).default(20),
  });
  