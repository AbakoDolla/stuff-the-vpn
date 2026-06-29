import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";

export async function listLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, action, page = 1, limit = 50 } = req.query as Record<string, string>;
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(action && { action: action as "USER_LOGIN" }),
      },
      include: { user: { select: { username: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    sendSuccess(res, logs, "Audit logs fetched");
  } catch (err) { next(err); }
}
