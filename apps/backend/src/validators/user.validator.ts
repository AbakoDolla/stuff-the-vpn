import { z } from "zod";

// Custom date parser that accepts both ISO datetime and YYYY-MM-DD
const dateString = z.string().refine(
  (val) => {
    if (!val) return true; // empty is ok
    // Try ISO format first
    const isoDate = new Date(val);
    if (!isNaN(isoDate.getTime())) return true;
    // Try YYYY-MM-DD format
    const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (ymdRegex.test(val)) return true;
    return false;
  },
  { message: "Date invalide. Format attendu: YYYY-MM-DD" }
).optional();

export const createUserSchema = z.object({
  username: z.string().min(3, "Username doit contenir au moins 3 caractères").max(32),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  password: z.string().min(6, "Mot de passe doit contenir au moins 6 caractères").optional(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN", "RESELLER"]).optional(),
  deviceLimit: z.number().int().min(1).max(100).optional(),
  quotaRemainingGB: z.number().nonnegative().optional(),
  expireAt: dateString,
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(32).optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
  deviceLimit: z.number().int().min(1).max(100).optional(),
  quotaRemainingGB: z.number().nonnegative().optional(),
  expireAt: dateString,
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
