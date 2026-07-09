import { z } from "zod";

// Doit être aligné avec l'enum InboundProtocol du schema Prisma
const INBOUND_PROTOCOLS = [
  "VLESS", "VLESS_REALITY", "VMESS",
  "TROJAN", "TROJAN_GO",
  "SHADOWSOCKS", "SHADOWSOCKS_R",
  "SSH", "SSH_PAYLOAD", "SSH_SSL", "SSH_WEBSOCKET", "SSH_SLOWDNS",
  "WIREGUARD", "OPENVPN",
  "HTTP_PROXY", "SOCKS5",
  "HYSTERIA2", "TUIC",
] as const;

export const createInboundSchema = z.object({
  remark:       z.string().min(1).max(100),
  protocol:     z.enum(INBOUND_PROTOCOLS),
  host:         z.string().min(1),
  port:         z.number().int().min(1).max(65535),
  // V2Ray / VLESS / VMESS / Trojan
  uuid:         z.string().optional(),
  path:         z.string().optional(),
  sni:          z.string().optional(),
  network:      z.enum(["tcp","ws","grpc","h2","quic","kcp"]).optional(),
  tls:          z.boolean().default(false),
  pbk:          z.string().optional(),  // VLESS Reality public key
  sid:          z.string().optional(),  // VLESS Reality short ID
  fp:           z.string().optional(),  // fingerprint
  // SSH
  sshUser:      z.string().optional(),
  sshPassword:  z.string().optional(),
  sshPayload:   z.string().optional(),
  // Shadowsocks
  ssMethod:     z.string().optional(),
  ssPassword:   z.string().optional(),
  // WireGuard
  wgPrivateKey: z.string().optional(),
  wgPublicKey:  z.string().optional(),
  wgPeerKey:    z.string().optional(),
  wgDns:        z.string().optional(),
  // OpenVPN
  ovpnConfig:   z.string().optional(),
  // Misc
  xrayApiPort:  z.number().int().optional(),
  isPremium:    z.boolean().default(false),
  sortOrder:    z.number().int().default(0),
  enabled:      z.boolean().default(true),
});

export const updateInboundSchema = createInboundSchema.partial();

export type CreateInboundDto = z.infer<typeof createInboundSchema>;
export type UpdateInboundDto = z.infer<typeof updateInboundSchema>;
