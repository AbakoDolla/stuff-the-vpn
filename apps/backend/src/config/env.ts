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

  // V2Ray / Xray Stats API
  // Set V2RAY_API_URL to your running instance (e.g. http://127.0.0.1:10085)
  // Set V2RAY_API_ENABLED=false to disable all V2Ray integration (e.g. in dev)
  V2RAY_API_URL: process.env["V2RAY_API_URL"] ?? "http://127.0.0.1:10085",
  V2RAY_API_ENABLED: process.env["V2RAY_API_ENABLED"] !== "false",

  // How often (ms) the traffic sync loop runs. Default: 60 s
  TRAFFIC_SYNC_INTERVAL_MS: Number(process.env["TRAFFIC_SYNC_INTERVAL_MS"] ?? "60000"),
};
