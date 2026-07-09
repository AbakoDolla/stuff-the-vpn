/**
 * inbound.service.ts
 * Gestion des inbounds VPN (entrées V2Ray/SSH/WireGuard/etc.)
 */
import { prisma } from "../prisma/client.js";
import type { InboundProtocol, Prisma } from "@prisma/client";

export type CreateInboundInput = {
  protocol: InboundProtocol;
  host: string;
  port: number;
  remark: string;
  // V2Ray / VLESS / VMESS / Trojan
  uuid?: string;
  path?: string;
  sni?: string;
  network?: string;
  tls?: boolean;
  pbk?: string;
  sid?: string;
  fp?: string;
  // SSH
  sshUser?: string;
  sshPassword?: string;
  sshPayload?: string;
  // Shadowsocks
  ssMethod?: string;
  ssPassword?: string;
  // WireGuard
  wgPrivateKey?: string;
  wgPublicKey?: string;
  wgPeerKey?: string;
  wgDns?: string;
  // OpenVPN
  ovpnConfig?: string;
  // Misc
  xrayApiPort?: number;
  isPremium?: boolean;
  sortOrder?: number;
  enabled?: boolean;
};

export async function createInbound(data: CreateInboundInput) {
  return prisma.inbound.create({ data });
}

export async function listInbounds(filters?: { enabled?: boolean; protocol?: InboundProtocol }) {
  const where: Prisma.InboundWhereInput = {};
  if (filters?.enabled !== undefined) where.enabled = filters.enabled;
  if (filters?.protocol) where.protocol = filters.protocol;
  return prisma.inbound.findMany({ where, orderBy: { sortOrder: "asc" } });
}

export async function getInboundById(id: string) {
  return prisma.inbound.findUniqueOrThrow({ where: { id } });
}

export async function updateInbound(id: string, data: Partial<CreateInboundInput>) {
  return prisma.inbound.update({ where: { id }, data });
}

export async function deleteInbound(id: string) {
  await prisma.inbound.delete({ where: { id } });
}

/** Met à jour les stats temps réel d'un inbound (depuis Xray API) */
export async function updateInboundStats(id: string, stats: {
  activeConns?: number;
  totalUpGB?: number;
  totalDownGB?: number;
}) {
  return prisma.inbound.update({ where: { id }, data: stats });
}
