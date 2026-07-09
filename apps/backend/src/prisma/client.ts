import { PrismaClient } from "@prisma/client";
import { logger } from "../lib/logger.js";

function createPrismaClient() {
  const client = new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

  client.$on("error", (e) => logger.error(e, "Prisma error"));
  client.$on("warn", (e) => logger.warn(e, "Prisma warn"));

  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
