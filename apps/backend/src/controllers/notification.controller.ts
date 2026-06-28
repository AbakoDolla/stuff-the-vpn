import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";
import type { AuthRequest } from "../types/index.js";

export async function listNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    sendSuccess(res, notifs, "Notifications fetched");
  } catch (err) { next(err); }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.notification.update({ where: { id: req.params["id"] }, data: { isRead: true, readAt: new Date() } });
    sendSuccess(res, null, "Marked as read");
  } catch (err) { next(err); }
}

export async function markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
    sendSuccess(res, null, "All marked as read");
  } catch (err) { next(err); }
}
