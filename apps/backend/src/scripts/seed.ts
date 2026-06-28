import { PrismaClient, UserRole, ServerProtocol, PlanDuration } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ── Super Admin ──────────────────────────────────────────────────
  const adminEmail = process.env["SEED_ADMIN_EMAIL"] ?? "admin@sxbvpn.com";
  const adminUsername = process.env["SEED_ADMIN_USERNAME"] ?? "superadmin";
  const adminPassword = process.env["SEED_ADMIN_PASSWORD"] ?? "Admin123!";

  const hashed = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      username: adminUsername,
      email: adminEmail,
      password: hashed,
      role: UserRole.SUPER_ADMIN,
      deviceLimit: 99,
      quotaRemainingGB: 999999,
    },
  });
  console.log(`✓ Super Admin: ${admin.email}`);

  // ── Plans ────────────────────────────────────────────────────────
  const plans = [
    { name: "24h Starter",  duration: PlanDuration.HOURS_24, durationDays: 1,  quotaGB: 5,   price: 1,   deviceLimit: 1 },
    { name: "3 Jours",      duration: PlanDuration.DAYS_3,   durationDays: 3,  quotaGB: 15,  price: 2.5, deviceLimit: 1 },
    { name: "7 Jours",      duration: PlanDuration.DAYS_7,   durationDays: 7,  quotaGB: 30,  price: 5,   deviceLimit: 2 },
    { name: "15 Jours",     duration: PlanDuration.DAYS_15,  durationDays: 15, quotaGB: 60,  price: 8,   deviceLimit: 2 },
    { name: "30 Jours",     duration: PlanDuration.DAYS_30,  durationDays: 30, quotaGB: 100, price: 12,  deviceLimit: 3 },
    { name: "60 Jours",     duration: PlanDuration.DAYS_60,  durationDays: 60, quotaGB: 200, price: 20,  deviceLimit: 3 },
    { name: "90 Jours",     duration: PlanDuration.DAYS_90,  durationDays: 90, quotaGB: 500, price: 30,  deviceLimit: 5 },
    { name: "Illimité",     duration: PlanDuration.UNLIMITED, durationDays: 36500, quotaGB: 100000, price: 50, deviceLimit: 5 },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { id: p.name },
      update: {},
      create: { id: p.name, ...p, isActive: true },
    });
  }
  console.log(`✓ ${plans.length} plans created`);

  // ── Default settings ─────────────────────────────────────────────
  const settings = [
    { key: "app_name",        value: "SxB VPN" },
    { key: "app_logo",        value: "/logo.png" },
    { key: "maintenance",     value: false },
    { key: "allow_register",  value: true },
    { key: "default_plan",    value: "30 Jours" },
    { key: "support_email",   value: "support@sxbvpn.com" },
    { key: "telegram_bot",    value: "" },
    { key: "max_devices",     value: 3 },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value as string | boolean | number },
    });
  }
  console.log(`✓ ${settings.length} settings initialized`);

  console.log("\n✅ Seed complete!");
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
