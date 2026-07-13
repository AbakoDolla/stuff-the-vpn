/**
 * sxb-token-generator.ts - SXB VPN
 * Script VPS pour générer des tokens SXB à partir des configs 3X-UI/Xray
 * 
 * Usage: 
 *   npx tsx src/scripts/sxb-token-generator.ts --generate --count 10
 *   npx tsx src/scripts/sxb-token-generator.ts --list
 *   npx tsx src/scripts/sxb-token-generator.ts --revoke <token>
 */

import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG_PATH = process.env.XRAY_CONFIG_PATH || "/usr/local/etc/xray/config.json";
const DATABASE_URL = process.env.DATABASE_URL;
const SXB_ENCRYPTION_KEY = process.env.SXB_ENCRYPTION_KEY || "default-sxb-key-change-in-production";

// Prisma client
const prisma = new PrismaClient();

// ── Token Generation ─────────────────────────────────────────────────────────

function generateSxbToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const parts = [];

  for (let i = 0; i < 3; i++) {
    let part = "";
    for (let j = 0; j < 4; j++) {
      part += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(part);
  }

  return `SXB-${parts.join("-")}`;
}

function encryptConfig(config: any, secretKey: string): string {
  const key = crypto.scryptSync(secretKey, "sxb-salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const configStr = JSON.stringify(config);
  let encrypted = cipher.update(configStr, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function hashConfig(config: any): string {
  const configStr = JSON.stringify(config);
  return crypto.createHash("sha256").update(configStr).digest("hex");
}

// ── Xray Config Parser ───────────────────────────────────────────────────────

interface XrayInbound {
  port: number;
  protocol: string;
  listen?: string;
  settings?: any;
  streamSettings?: any;
  sniffing?: any;
  tag?: string;
}

interface XrayConfig {
  inbounds?: XrayInbound[];
  outbounds?: any[];
}

function parseXrayConfig(configPath: string): XrayInbound[] {
  try {
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`);
      return [];
    }

    const content = fs.readFileSync(configPath, "utf8");
    const config: XrayConfig = JSON.parse(content);

    return config.inbounds || [];
  } catch (error) {
    console.error("Error parsing Xray config:", error);
    return [];
  }
}

function extractV2RayConfig(inbound: XrayInbound): any {
  const protocol = inbound.protocol.toUpperCase();
  const isReality = inbound.protocol === "vless" && 
    inbound.streamSettings?.realitySettings;

  // Extraire les paramètres communs
  const config: any = {
    protocol: protocol,
    port: inbound.port,
    host: inbound.listen || "0.0.0.0",
  };

  // VLESS
  if (protocol === "VLESS" || protocol === "BLACKHOLE") {
    const clients = inbound.settings?.clients || [];
    if (clients.length > 0) {
      config.uuid = clients[0].id;
      config.email = clients[0].email || "";
    }
    
    if (isReality) {
      config.type = "wireguard"; // Reality uses wireguard type
      config.publicKey = inbound.streamSettings?.realitySettings?.publicKey || "";
      config.shortId = inbound.streamSettings?.realitySettings?.shortId || "0";
      config.serverName = inbound.streamSettings?.realitySettings?.serverNames?.[0] || "";
    }
  }

  // VMess
  if (protocol === "VMESS") {
    const clients = inbound.settings?.vmes?? || [];
    if (clients.length > 0) {
      config.uuid = clients[0].id;
      config.alterId = clients[0].alterId || 0;
    }
  }

  // Trojan
  if (protocol === "TROJAN") {
    const clients = inbound.settings?.clients || [];
    if (clients.length > 0) {
      config.password = clients[0].password || clients[0];
    }
  }

  // SSH (direct)
  if (protocol === "DOKODEMO-DOOR" || protocol === "SHADOWSOCKS") {
    config.type = inbound.settings?.network || "tcp";
  }

  // Stream settings
  if (inbound.streamSettings) {
    config.network = inbound.streamSettings.network || "tcp";
    config.security = inbound.streamSettings.security || "none";

    if (inbound.streamSettings.tlsSettings) {
      config.tls = "tls";
      config.tlsSettings = inbound.streamSettings.tlsSettings;
    }

    if (inbound.streamSettings.realitySettings) {
      config.tls = "reality";
      config.realitySettings = inbound.streamSettings.realitySettings;
    }

    if (inbound.streamSettings.wsSettings) {
      config.path = inbound.streamSettings.wsSettings.path || "/";
      config.host = inbound.streamSettings.wsSettings.headers?.Host || config.host;
    }

    if (inbound.streamSettings.grpcSettings) {
      config.serviceName = inbound.streamSettings.grpcSettings.serviceName || "";
    }
  }

  // Sniffing
  if (inbound.sniffing) {
    config.sniffing = inbound.sniffing;
  }

  return config;
}

// ── Database Operations ───────────────────────────────────────────────────────

async function createSxbToken(
  config: any,
  protocol: string,
  remark?: string,
  quotaMB: number = 0,
  deviceLimit: number = 1,
  expiresAt?: Date
): Promise<string> {
  // Encrypt config
  const encryptedConfig = encryptConfig(config, SXB_ENCRYPTION_KEY);
  const configHash = hashConfig(config);

  // Generate unique token
  let token: string;
  let attempts = 0;
  do {
    token = generateSxbToken();
    const existing = await prisma.sxbToken.findUnique({ where: { token } });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error("Failed to generate unique token");
  }

  // Create in database
  const sxbToken = await prisma.sxbToken.create({
    data: {
      token,
      encryptedConfig,
      configHash,
      protocol,
      remark: remark || null,
      serverHost: config.host || null,
      quotaMB,
      deviceLimit,
      expiresAt: expiresAt || null,
      status: "ACTIVE",
    },
  });

  console.log(`✓ Token created: ${sxbToken.token}`);
  return sxbToken.token;
}

async function listTokens(limit: number = 50): Promise<void> {
  const tokens = await prisma.sxbToken.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      token: true,
      protocol: true,
      remark: true,
      status: true,
      quotaMB: true,
      quotaUsedMB: true,
      deviceLimit: true,
      deviceCount: true,
      expiresAt: true,
      createdAt: true,
      usedAt: true,
    },
  });

  console.log("\n╔════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                         SXB Tokens                                             ║");
  console.log("╠════════════════════════════════════════════════════════════════════════════════╣");
  console.log("║ Token              │ Protocol │ Remark         │ Status   │ Quota    │ Expires  ║");
  console.log("╠════════════════════════════════════════════════════════════════════════════════╣");

  for (const t of tokens) {
    const quotaStr = t.quotaMB > 0 ? `${(t.quotaMB / 1024).toFixed(1)} GB` : "∞";
    const expiresStr = t.expiresAt 
      ? new Date(t.expiresAt).toLocaleDateString() 
      : "Never";
    const remark = (t.remark || "-").substring(0, 15).padEnd(15);
    
    console.log(
      `║ ${t.token.substring(0, 16).padEnd(18)} │ ${(t.protocol || "-").substring(0, 8).padEnd(8)} │ ${remark} │ ${(t.status || "-").padEnd(8)} │ ${quotaStr.padEnd(8)} │ ${expiresStr} ║`
    );
  }

  console.log("╚════════════════════════════════════════════════════════════════════════════════╝");
}

async function revokeToken(token: string): Promise<void> {
  const sxbToken = await prisma.sxbToken.findUnique({
    where: { token: token.toUpperCase() },
  });

  if (!sxbToken) {
    console.error(`Token not found: ${token}`);
    return;
  }

  await prisma.sxbToken.update({
    where: { id: sxbToken.id },
    data: { status: "REVOKED" },
  });

  console.log(`✓ Token revoked: ${token}`);
}

async function generateFromXrayConfig(
  count: number = 1,
  quotaMB: number = 0,
  deviceLimit: number = 1
): Promise<void> {
  console.log(`\n📡 Parsing Xray config from: ${CONFIG_PATH}`);
  
  const inbounds = parseXrayConfig(CONFIG_PATH);
  
  if (inbounds.length === 0) {
    console.error("No inbounds found in Xray config");
    return;
  }

  console.log(`Found ${inbounds.length} inbound(s)`);

  // Filter usable protocols
  const usableInbounds = inbounds.filter(i => {
    const p = i.protocol?.toUpperCase();
    return ["VLESS", "VMESS", "TROJAN", "SHADOWSOCKS"].includes(p);
  });

  if (usableInbounds.length === 0) {
    console.error("No usable protocols found (VLESS, VMESS, TROJAN, SHADOWSOCKS)");
    return;
  }

  console.log(`Usable protocols: ${usableInbounds.map(i => i.protocol).join(", ")}`);

  // Generate tokens
  for (let i = 0; i < count; i++) {
    // Pick a random inbound
    const inbound = usableInbounds[Math.floor(Math.random() * usableInbounds.length)];
    const config = extractV2RayConfig(inbound);
    const protocol = inbound.protocol.toUpperCase();
    const remark = `${protocol} Server ${inbound.port}`;

    try {
      await createSxbToken(config, protocol, remark, quotaMB, deviceLimit);
    } catch (error) {
      console.error(`Error creating token: ${error}`);
    }
  }

  console.log(`\n✓ Generated ${count} token(s)`);
}

// ── CLI Interface ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                SXB Token Generator                                ║
╠════════════════════════════════════════════════════════════════════╣
║ Usage:                                                            ║
║   npx tsx src/scripts/sxb-token-generator.ts --generate [options]  ║
║   npx tsx src/scripts/sxb-token-generator.ts --list [limit]       ║
║   npx tsx src/scripts/sxb-token-generator.ts --revoke <token>     ║
║                                                                    ║
║ Options:                                                          ║
║   --generate       Generate new tokens from Xray config            ║
║   --count <n>      Number of tokens to generate (default: 1)      ║
║   --quota <MB>     Quota in MB (default: 0 = unlimited)          ║
║   --limit <n>      Device limit per token (default: 1)          ║
║   --list           List all tokens                                 ║
║   --revoke <token> Revoke a token                                 ║
╚════════════════════════════════════════════════════════════════════╝
    `);
    return;
  }

  // Parse command
  const command = args[0];
  
  try {
    await prisma.$connect();
    console.log("✓ Database connected");
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    process.exit(1);
  }

  try {
    switch (command) {
      case "--generate":
      case "generate": {
        const countIndex = args.indexOf("--count");
        const count = countIndex !== -1 ? parseInt(args[countIndex + 1]) : 1;
        
        const quotaIndex = args.indexOf("--quota");
        const quotaMB = quotaIndex !== -1 ? parseInt(args[quotaIndex + 1]) : 0;
        
        const limitIndex = args.indexOf("--limit");
        const deviceLimit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : 1;
        
        await generateFromXrayConfig(count, quotaMB, deviceLimit);
        break;
      }
      
      case "--list":
      case "list": {
        const limit = parseInt(args[1]) || 50;
        await listTokens(limit);
        break;
      }
      
      case "--revoke":
      case "revoke": {
        const token = args[1];
        if (!token) {
          console.error("Token required");
          break;
        }
        await revokeToken(token);
        break;
      }
      
      default:
        console.error(`Unknown command: ${command}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
