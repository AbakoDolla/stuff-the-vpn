import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { env } from "./config/env.js";
import router from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { apiRateLimit } from "./middleware/rate-limit.middleware.js";
import { connectRedis } from "./lib/redis.js";

const app: Express = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Device-Name", "X-Device-Id"],
  }),
);

// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.NODE_ENV === "production") {
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
        res(res) { return { statusCode: res.statusCode }; },
      },
    }),
  );
} else {
  app.use(morgan("dev"));
}

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Global rate limiting ────────────────────────────────────────────────────
app.use("/api", apiRateLimit);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found", timestamp: new Date().toISOString() });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Init Redis (non-bloquant) ────────────────────────────────────────────────
connectRedis().catch((err) => logger.warn({ err }, "Redis connection failed — rate limiting will use in-memory fallback"));

export default app;
