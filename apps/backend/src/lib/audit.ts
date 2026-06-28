import { prisma } from "../prisma/client.js";
import type { AuditAction } from "@prisma/client";
import type { Request } from "express";

export async function audit(opts: {
  action: AuditAction;
  userId?: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  req?: Request;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: opts.action,
        userId: opts.userId,
        entity: opts.entity,
        entityId: opts.entityId,
        details: opts.details as object | undefined,
        ipAddress: opts.req ? getIp(opts.req) : undefined,
        userAgent: opts.req?.headers["user-agent"],
      },
    });
  } catch {
    // Audit failures must never break the main request
  }
}

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]!.trim();
  return req.socket.remoteAddress ?? "unknown";
}
