import { PrismaClient } from "@prisma/client";

// Prisma 7: la datasource URL est gérée exclusivement par prisma.config.ts
// via defineConfig({ datasource: { url } }) — ne jamais la passer ici.
export const prisma = new PrismaClient();
