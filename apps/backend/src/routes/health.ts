import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@stuff-the-vpn/types";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
