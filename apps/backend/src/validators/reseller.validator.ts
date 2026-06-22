import { z } from "zod";

  export const createResellerSchema = z.object({
    userId: z.string().optional(),
    username: z.string().min(3).max(32).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    name: z.string().min(1).max(100),
    commission: z.number().min(0).max(100).default(0),
  });

  export const updateResellerSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    commission: z.number().min(0).max(100).optional(),
    balance: z.number().nonnegative().optional(),
  });
  