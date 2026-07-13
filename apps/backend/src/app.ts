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

// Configure CORS properly for both web and mobile clients
const getCorsOrigin = () => {
  const origin = env.CORS_ORIGIN;
  if (origin === "*" || env.NODE_ENV === "development") {
    return true;
  }
  // For production, allow multiple origins if comma-separated
  if (origin.includes(",")) {
    return origin.split(",").map((o) => o.trim());
  }
  return origin;
};

app.use(
  cors({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Device-Name"],
    maxAge: 86400,
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
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(__dirname, "..", "public", "downloads");

app.get("/api/apk/download", (req, res) => {
  const apkPath = path.join(publicPath, "sxb-vpn.apk");
  try {
    res.download(apkPath, "sxb-vpn.apk", (err) => {
      if (err) {
        logger.error({ err }, "APK download error");
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: "APK not available" });
        }
      }
    });
  } catch (err) {
    logger.error({ err }, "APK endpoint error");
    res.status(500).json({ success: false, message: "APK download failed" });
  }
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
