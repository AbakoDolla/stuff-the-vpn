import app from "./app.js";
  import { logger } from "./lib/logger.js";
  import { prisma } from "./prisma/client.js";

  const rawPort = process.env["PORT"];

  if (!rawPort) {
    throw new Error("PORT environment variable is required but was not provided.");
  }

  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
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

  app.listen(port, async (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
    await autoSeed();
  });
  