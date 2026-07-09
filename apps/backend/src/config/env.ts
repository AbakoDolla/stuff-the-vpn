import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  NODE_ENV:                process.env["NODE_ENV"] ?? "development",
  PORT:                    process.env["PORT"] ?? "4000",
  DATABASE_URL:            required("DATABASE_URL"),
  REDIS_URL:              process.env["REDIS_URL"] ?? "redis://redis:6379",
  // JWT
  JWT_SECRET:              process.env["JWT_SECRET"] ?? "changeme_jwt_secret_32chars_min!!",
  JWT_EXPIRES_IN:          process.env["JWT_EXPIRES_IN"] ?? "7d",
  JWT_REFRESH_EXPIRES_IN:  process.env["JWT_REFRESH_EXPIRES_IN"] ?? "30d",
  // Cryptographie
  ENCRYPTION_KEY:          process.env["ENCRYPTION_KEY"] ?? "changeme_32_chars_minimum_here!!",
  SERVER_SECRET:           process.env["SERVER_SECRET"] ?? "changeme_server_secret_32chars!!",
  // Token settings
  TOKEN_VALIDITY_MS:       Number(process.env["TOKEN_VALIDITY_MS"] ?? "3600000"), // 1 hour default
  // Auth
  BCRYPT_ROUNDS:           Number(process.env["BCRYPT_ROUNDS"] ?? "12"),
  CORS_ORIGIN:             process.env["CORS_ORIGIN"] ?? "*",
  // Admin seeding
  SEED_ADMIN:              process.env["SEED_ADMIN"] === "true",
  ADMIN_EMAIL:             process.env["ADMIN_EMAIL"] ?? "",
  ADMIN_USERNAME:          process.env["ADMIN_USERNAME"] ?? "superadmin",
  ADMIN_PASSWORD:          process.env["ADMIN_PASSWORD"] ?? "",
};
