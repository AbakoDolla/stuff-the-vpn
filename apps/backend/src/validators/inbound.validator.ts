import { z } from "zod";

export const createInboundSchema = z.object({
  protocol: z.enum(["SSH", "VLESS", "VMESS", "TROJAN", "SHADOWSOCKS"]),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  path: z.string().optional(),
  sni: z.string().optional(),
  remark: z.string().min(1).max(100),
  enabled: z.boolean().default(true),
});

export const updateInboundSchema = createInboundSchema.partial();
