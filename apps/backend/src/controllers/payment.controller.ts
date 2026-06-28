import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { audit } from "../lib/audit.js";
import type { AuthRequest } from "../types/index.js";

export async function listPayments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId, status, page = 1, limit = 20 } = req.query as Record<string, string>;
    const isAdmin = req.user && ["ADMIN","SUPER_ADMIN"].includes(req.user.role);
    const payments = await prisma.payment.findMany({
      where: {
        ...(!isAdmin && { userId: req.user!.userId }),
        ...(userId && { userId }),
        ...(status && { status: status as "PENDING" }),
      },
      include: { user: { select: { username: true, email: true } }, plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    sendSuccess(res, payments, "Payments fetched");
  } catch (err) { next(err); }
}

export async function createPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const p = await prisma.payment.create({ data: req.body });
    await audit({ action: "PAYMENT_CREATE", userId: req.user?.userId, entityId: p.id, details: { amount: p.amount }, req });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: p, message: "Payment created" });
  } catch (err) { next(err); }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const p = await prisma.payment.update({ where: { id: req.params["id"] }, data: { status: req.body.status } });
    await audit({ action: req.body.status === "COMPLETED" ? "PAYMENT_COMPLETE" : "PAYMENT_FAIL", userId: req.user?.userId, entityId: p.id, req });
    sendSuccess(res, p, "Payment updated");
  } catch (err) { next(err); }
}
