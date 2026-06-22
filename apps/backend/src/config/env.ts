import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  NODE_ENV: process.env["NODE_ENV"] ?? "development",
  PORT: process.env["PORT"] ?? "5000",
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: process.env["JWT_SECRET"] ?? "changeme_jwt_secret_32chars_min!!",
  JWT_EXPIRES_IN: process.env["JWT_EXPIRES_IN"] ?? "7d",
  BCRYPT_ROUNDS: Number(process.env["BCRYPT_ROUNDS"] ?? "12"),
  CORS_ORIGIN: process.env["CORS_ORIGIN"] ?? "*",
};

