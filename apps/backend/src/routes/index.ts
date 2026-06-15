import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.routes.js";
import usersRouter from "./users.routes.js";
import vouchersRouter from "./vouchers.routes.js";
import plansRouter from "./plans.routes.js";
import inboundsRouter from "./inbounds.routes.js";
import usageRouter from "./usage.routes.js";
import resellersRouter from "./resellers.routes.js";
import vpnRouter from "./vpn.routes.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/vouchers", vouchersRouter);
router.use("/plans", plansRouter);
router.use("/inbounds", inboundsRouter);
router.use("/usage", usageRouter);
router.use("/resellers", resellersRouter);
router.use("/vpn", vpnRouter);

export default router;
