/**
   * Seed script — crée le compte admin par défaut SxBVPN si absent.
   * Usage : npx tsx src/scripts/seed-admin.ts
   *         ou automatiquement au démarrage via SEED_ADMIN=true
   */
import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client.js";

  async function seedAdmin() {
    const ADMIN_EMAIL = process.env["ADMIN_EMAIL"] ?? "admin@sxbvpn.com";
    const ADMIN_USERNAME = process.env["ADMIN_USERNAME"] ?? "SxBVPN";
    const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "SxBvpn2026";

    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      console.log(`[seed] Admin "${ADMIN_USERNAME}" already exists — skipping`);
      return;
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const admin = await prisma.user.create({
      data: {
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashed,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        deviceLimit: 99,
        quotaRemainingGB: 9999,
      },
    });

    console.log(`[seed] Admin created: ${admin.username} <${admin.email}>`);
    console.log(`[seed] Password: ${ADMIN_PASSWORD}  (change this in production!)`);
  }

  seedAdmin()
    .catch((e) => { console.error("[seed] Error:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
  