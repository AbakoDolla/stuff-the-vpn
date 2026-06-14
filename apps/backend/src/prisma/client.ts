import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { logger } from "../lib/logger.js";

function createPrismaClient() {
  // SUPABASE_DATABASE_URL takes priority (Replit overrides DATABASE_URL with its own DB)
  const databaseUrl = process.env["SUPABASE_DATABASE_URL"] ?? process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL is required");

  const pool = new pg.Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

  client.$on("error", (e: { message: string }) => logger.error(e, "Prisma error"));
  client.$on("warn", (e: { message: string }) => logger.warn(e, "Prisma warn"));

  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
