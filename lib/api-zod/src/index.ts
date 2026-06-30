import { z } from "zod";

export const HealthCheckResponse = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.string().datetime().optional(),
  service: z.string().optional(),
});

export const HealthCheckRequest = z.object({
  service: z.string().optional(),
});

export type HealthCheckResponseType = z.infer<typeof HealthCheckResponse>;
export type HealthCheckRequestType = z.infer<typeof HealthCheckRequest>;