import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Aligné sur l'enum Prisma UserRole
  role: z.enum(["CLIENT", "SUPPORT", "RESELLER", "ADMIN"]).optional(),
});

export const loginSchema = z.object({
  email:    z.string().email("Invalid email address").optional(),
  phone:    z.string().optional(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;
