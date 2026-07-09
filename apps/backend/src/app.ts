import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import { env } from "./config/env.js";
import router from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app: Express = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
const corsOrigin = env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Device-Name"],
  }),
);

// ─── Logging ─────────────────────────────────────────────────────────────────
if (env.NODE_ENV === "production") {
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
        },
        res(res) {
          return { statusCode: res.statusCode };
        },
      },
    }),
  );
} else {
  app.use(morgan("dev"));
}

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────────────────────
// APK download
app.get("/api/apk/download", (req, res) => {
  const apkPath = "/home/ubuntu/sxbvpn-debug.apk";
  res.download(apkPath, "sxbvpn-debug.apk", (err) => {
    if (err) {
      console.error("APK download error:", err);
      res.status(500).json({ success: false, message: "APK not available" });
    }
  });
});

app.use("/api", router);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    timestamp: new Date().toISOString(),
  });
});

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
