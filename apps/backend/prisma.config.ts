import { defineConfig } from "prisma/config";
import "dotenv/config";

const url = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];
if (!url) throw new Error("DATABASE_URL or DIRECT_URL is required");

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  datasource: {
    url,
  },
});
