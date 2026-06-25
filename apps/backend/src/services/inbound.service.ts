import { prisma } from "../prisma/client.js";
import type { InboundProtocol } from "@prisma/client";

export async function createInbound(data: {
  protocol: InboundProtocol;
  host: string;
  port: number;
  path?: string;
  sni?: string;
  remark: string;
  enabled?: boolean;
}) {
  return prisma.inbound.create({ data });
}

export async function listInbounds() {
  return prisma.inbound.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getInboundById(id: string) {
  return prisma.inbound.findUniqueOrThrow({ where: { id } });
}

export async function updateInbound(id: string, data: Partial<{
  protocol: InboundProtocol;
  host: string;
  port: number;
  path: string;
  sni: string;
  remark: string;
  enabled: boolean;
}>) {
  return prisma.inbound.update({ where: { id }, data });
}

export async function deleteInbound(id: string) {
  await prisma.inbound.delete({ where: { id } });
}
