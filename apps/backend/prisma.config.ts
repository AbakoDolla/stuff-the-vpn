import { defineConfig } from "prisma/config";
import "dotenv/config";

// For migrations: use the DIRECT_URL (session-mode pooler port 5432)
// For runtime: use DATABASE_URL (transaction-mode pooler port 6543)
// Both are Supabase pooler URLs so both should be reachable
const url = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];

if (!url) throw new Error("DATABASE_URL or DIRECT_URL is required");

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  datasource: {
    url,
  },
});
