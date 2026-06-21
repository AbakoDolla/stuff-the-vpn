import { Router, type IRouter } from "express";
import { z } from "zod";

const HealthCheckResponse = z.object({
  status: z.literal("ok"),
  timestamp: z.string().optional(),
});

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
  res.json(data);
});

export default router;
