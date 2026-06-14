import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().nonnegative(),
  quotaGB: z.number().positive(),
  durationDay: z.number().int().positive(),
  description: z.string().max(500).optional(),
  active: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial();
