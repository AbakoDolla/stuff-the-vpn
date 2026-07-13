import app from "./app.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./prisma/client.js";
import { startTrafficSync, stopTrafficSync } from "./services/traffic-sync.service.js";
import { startWireGuardSync, stopWireGuardSync } from "./services/wireguard-sync.service.js";

// Validate critical environment variables
const requiredEnvVars = ["DATABASE_URL"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error({ envVar }, `Critical environment variable missing: ${envVar}`);
    process.exit(1);
  }
}

const rawPort = process.env["PORT"] || "4000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0 || port > 65535) {
  logger.error({ port: rawPort }, `Invalid PORT value: "${rawPort}". Using default 4000`);
  process.env["PORT"] = "4000";
}

// Auto-seed admin account on startup if requested
async function autoSeed() {
  if (process.env["SEED_ADMIN"] !== "true") return;
  try {
    const { default: bcrypt } = await import("bcryptjs");
    const email = process.env["ADMIN_EMAIL"] ?? "admin@sxbvpn.com";
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const hashed = await bcrypt.hash(process.env["ADMIN_PASSWORD"] ?? "SxBvpn2026", 12);
      await prisma.user.create({
        data: {
          username: process.env["ADMIN_USERNAME"] ?? "SxBVPN",
          email,
          password: hashed,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          deviceLimit: 99,
          quotaRemainingGB: 9999,
        },
      });
      logger.info({ email }, "Admin account seeded");
    }
  } catch (err) {
    logger.warn({ err }, "Auto-seed skipped (DB may not be ready)");
  }
}

const server = app.listen(port, async (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
  await autoSeed();
  startTrafficSync();
  startWireGuardSync();
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received");
  stopTrafficSync();
  stopWireGuardSync();
  server.close(() => {
    void prisma.$disconnect().finally(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// APK download route
app.get('/api/apk/download', (req, res) => {
  const apkPath = '/home/ubuntu/stuff-the-vpn/apps/backend/public/downloads/sxb-vpn.apk';
  res.download(apkPath, 'sxb-vpn.apk', (err) => {
    if (err) {
      console.error('APK download error:', err);
      res.status(500).json({ success: false, message: 'APK not available' });
    }
  });
});
