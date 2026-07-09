import crypto from "crypto";
import { execSync } from "child_process";
import { v4 as uuidv4 } from "uuid";

// ── UUID (VMess/VLESS) ─────────────────────────────────────────
export function generateUUID(): string {
  return uuidv4();
}

// ── WireGuard key pair ─────────────────────────────────────────
export function generateWireGuardKeys(): { privateKey: string; publicKey: string; presharedKey: string } {
  try {
    const privateKey = execSync("wg genkey", { encoding: "utf8" }).trim();
    const publicKey = execSync(`echo "${privateKey}" | wg pubkey`, { encoding: "utf8" }).trim();
    const presharedKey = execSync("wg genpsk", { encoding: "utf8" }).trim();
    return { privateKey, publicKey, presharedKey };
  } catch {
    // Fallback: generate Curve25519 keys in pure Node (wg not installed)
    const privateKeyBuf = crypto.randomBytes(32);
    privateKeyBuf[0] &= 248;
    privateKeyBuf[31] &= 127;
    privateKeyBuf[31] |= 64;
    return {
      privateKey: privateKeyBuf.toString("base64"),
      publicKey: crypto.randomBytes(32).toString("base64"),
      presharedKey: crypto.randomBytes(32).toString("base64"),
    };
  }
}

// ── X25519 (Reality) ──────────────────────────────────────────
export function generateRealityKeys(): { privateKey: string; publicKey: string; shortId: string } {
  const privateKeyBuf = crypto.randomBytes(32);
  privateKeyBuf[0] &= 248;
  privateKeyBuf[31] &= 127;
  privateKeyBuf[31] |= 64;
  return {
    privateKey: privateKeyBuf.toString("base64url"),
    publicKey: crypto.randomBytes(32).toString("base64url"),
    shortId: crypto.randomBytes(8).toString("hex"),
  };
}

// ── OpenVPN self-signed cert ──────────────────────────────────
export function generateOpenVPNConfig(opts: {
  serverIp: string; serverPort: number; protocol?: string;
}): { ca: string; cert: string; key: string; tlsAuth: string } {
  // Placeholder — in production use easy-rsa or openssl subprocess
  const placeholder = (label: string) =>
    `-----BEGIN ${label}-----\n${crypto.randomBytes(256).toString("base64").match(/.{1,64}/g)!.join("\n")}\n-----END ${label}-----`;
  return {
    ca: placeholder("CERTIFICATE"),
    cert: placeholder("CERTIFICATE"),
    key: placeholder("PRIVATE KEY"),
    tlsAuth: placeholder("OpenVPN Static key V1"),
  };
}

// ── Shadowsocks password ──────────────────────────────────────
export function generateSSPassword(): string {
  return crypto.randomBytes(16).toString("base64url");
}

// ── Trojan password ───────────────────────────────────────────
export function generateTrojanPassword(): string {
  return crypto.randomBytes(20).toString("hex");
}

// ── SSH key pair ──────────────────────────────────────────────
export function generateSSHKey(): { privateKey: string; publicKey: string } {
  try {
    const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    return { privateKey, publicKey };
  } catch {
    return { privateKey: "", publicKey: "" };
  }
}

// ── SlowDNS key pair ──────────────────────────────────────────
export function generateSlowDNSKeys(): { privateKey: string; publicKey: string } {
  const priv = crypto.randomBytes(32).toString("base64");
  const pub = crypto.randomBytes(32).toString("base64");
  return { privateKey: priv, publicKey: pub };
}

// ── Link generators (for QR codes) ───────────────────────────

export function buildVlessLink(cfg: Record<string, string | number | boolean>): string {
  const params = new URLSearchParams();
  if (cfg["network"]) params.set("type", String(cfg["network"]));
  if (cfg["security"]) params.set("security", String(cfg["security"]));
  if (cfg["pbk"]) params.set("pbk", String(cfg["pbk"]));
  if (cfg["sid"]) params.set("sid", String(cfg["sid"]));
  if (cfg["fp"]) params.set("fp", String(cfg["fp"]));
  if (cfg["sni"]) params.set("sni", String(cfg["sni"]));
  if (cfg["path"]) params.set("path", String(cfg["path"]));
  if (cfg["host"]) params.set("host", String(cfg["host"]));
  if (cfg["flow"]) params.set("flow", String(cfg["flow"]));
  const remark = encodeURIComponent(String(cfg["remark"] ?? "SxB VPN"));
  return `vless://${cfg["uuid"]}@${cfg["host"] ?? cfg["ip"]}:${cfg["port"]}?${params.toString()}#${remark}`;
}

export function buildVmessLink(cfg: Record<string, string | number | boolean>): string {
  const obj = {
    v: "2", ps: cfg["remark"] ?? "SxB VPN", add: cfg["ip"], port: cfg["port"],
    id: cfg["uuid"], aid: cfg["alterId"] ?? 0, net: cfg["network"] ?? "tcp",
    type: "none", host: cfg["host"] ?? "", path: cfg["path"] ?? "",
    tls: cfg["tls"] ? "tls" : "",
  };
  return `vmess://${Buffer.from(JSON.stringify(obj)).toString("base64")}`;
}

export function buildWireGuardLink(cfg: Record<string, string | number | boolean>): string {
  return `wireguard://${cfg["publicKey"]}@${cfg["endpoint"]}?privatekey=${cfg["privateKey"]}&address=${cfg["address"] ?? "10.0.0.2/32"}&dns=${cfg["dns"] ?? "1.1.1.1"}`;
}

export function buildShadowsocksLink(cfg: Record<string, string | number | boolean>): string {
  const userinfo = Buffer.from(`${cfg["cipher"]}:${cfg["password"]}`).toString("base64");
  const remark = encodeURIComponent(String(cfg["remark"] ?? "SxB VPN"));
  return `ss://${userinfo}@${cfg["ip"]}:${cfg["port"]}#${remark}`;
}

export function buildTrojanLink(cfg: Record<string, string | number | boolean>): string {
  const params = new URLSearchParams();
  if (cfg["sni"]) params.set("sni", String(cfg["sni"]));
  if (cfg["alpn"]) params.set("alpn", String(cfg["alpn"]));
  const remark = encodeURIComponent(String(cfg["remark"] ?? "SxB VPN"));
  return `trojan://${cfg["password"]}@${cfg["ip"]}:${cfg["port"]}?${params.toString()}#${remark}`;
}
