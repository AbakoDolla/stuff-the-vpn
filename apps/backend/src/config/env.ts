import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT:              z.coerce.number().default(4000),
  NODE_ENV:          z.enum(["development", "production", "test"]).default("development"),

  // Database
  DATABASE_URL:      z.string().min(1, "DATABASE_URL is required"),

  // Redis
  REDIS_URL:         z.string().default("redis://localhost:6379"),

  // JWT
  JWT_SECRET:        z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_EXPIRES_IN:    z.string().default("7d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  // Encryption (AES-256 key for VPN configs)
  ENCRYPTION_KEY:    z.string().min(32).default("change_me_32_chars_minimum_here!!"),

  // Auth
  BCRYPT_ROUNDS:     z.coerce.number().default(12),

  // CORS
  CORS_ORIGIN:       z.string().default("*"),

  // Seed
  SEED_ADMIN_EMAIL:    z.string().default("admin@sxbvpn.com"),
  SEED_ADMIN_USERNAME: z.string().default("superadmin"),
  SEED_ADMIN_PASSWORD: z.string().default("Admin123!"),

  // V2Ray (optional)
  V2RAY_API_URL:              z.string().optional(),
  V2RAY_API_ENABLED:          z.coerce.boolean().default(false),
  TRAFFIC_SYNC_INTERVAL_MS:   z.coerce.number().default(60000),

  // Firebase (optional)
  FIREBASE_PROJECT_ID:        z.string().optional(),
  FIREBASE_PRIVATE_KEY:       z.string().optional(),
  FIREBASE_CLIENT_EMAIL:      z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("\u274c Invalid environment variables:");
    result.error.issues.forEach((i) => console.error(`  \${i.path.join(".")}: \${i.message}`));
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
