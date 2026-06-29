import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ── Super Admin ──────────────────────────────────────────────────
  const adminEmail    = process.env["SEED_ADMIN_EMAIL"]    ?? "admin@sxbvpn.com";
  const adminUsername = process.env["SEED_ADMIN_USERNAME"] ?? "superadmin";
  const adminPassword = process.env["SEED_ADMIN_PASSWORD"] ?? "Admin123!";

  const hashed = await bcrypt.hash(adminPassword, 12);
  const admin  = await prisma.user.upsert({
    where:  { email: adminEmail },
    update: {},
    create: {
      username:        adminUsername,
      email:           adminEmail,
      password:        hashed,
      role:            "SUPER_ADMIN",
      deviceLimit:     99,
      quotaRemainingGB:999999,
    },
  });
  console.log(`✓ Super Admin: ${admin.email}`);

  // ── Plans ────────────────────────────────────────────────────────
  const plans: Array<{ name: string; durationDays: number; dataLimitGB: number; price: number; deviceLimit: number }> = [
    { name: "24h Starter",  durationDays: 1,     dataLimitGB: 5,      price: 500,   deviceLimit: 1 },
    { name: "3 Jours",      durationDays: 3,     dataLimitGB: 15,     price: 1000,  deviceLimit: 1 },
    { name: "7 Jours",      durationDays: 7,     dataLimitGB: 30,     price: 2000,  deviceLimit: 2 },
    { name: "15 Jours",     durationDays: 15,    dataLimitGB: 60,     price: 3500,  deviceLimit: 2 },
    { name: "30 Jours",     durationDays: 30,    dataLimitGB: 100,    price: 5000,  deviceLimit: 3 },
    { name: "60 Jours",     durationDays: 60,    dataLimitGB: 200,    price: 9000,  deviceLimit: 3 },
    { name: "90 Jours",     durationDays: 90,    dataLimitGB: 500,    price: 12000, deviceLimit: 5 },
    { name: "Illimité",     durationDays: 36500, dataLimitGB: 100000, price: 25000, deviceLimit: 5 },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where:  { id: p.name },
      update: {},
      create: { id: p.name, ...p, currency: "XAF", isActive: true },
    });
  }
  console.log(`✓ ${plans.length} plans created`);

  // ── Default settings ─────────────────────────────────────────────
  const settings: Array<{ key: string; value: unknown }> = [
    { key: "app_name",       value: "SxB VPN" },
    { key: "app_logo",       value: "/logo.png" },
    { key: "maintenance",    value: false },
    { key: "allow_register", value: true },
    { key: "default_plan",   value: "30 Jours" },
    { key: "support_email",  value: "support@sxbvpn.com" },
    { key: "telegram_bot",   value: "" },
    { key: "max_devices",    value: 3 },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where:  { key: s.key },
      update: {},
      create: { key: s.key, value: s.value as string },
    });
  }
  console.log(`✓ ${settings.length} settings created`);

  console.log("✅ Seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
