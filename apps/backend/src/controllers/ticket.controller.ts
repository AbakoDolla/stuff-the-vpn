import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { audit } from "../lib/audit.js";
import type { AuthRequest } from "../types/index.js";

export async function listTickets(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const isAdmin = req.user && ["ADMIN","SUPER_ADMIN","SUPPORT"].includes(req.user.role);
    const { status, page = 1, limit = 20 } = req.query as Record<string, string>;
    const tickets = await prisma.ticket.findMany({
      where: {
        ...(!isAdmin && { authorId: req.user!.userId }),
        ...(status && { status: status as "OPEN" }),
      },
      include: { author: { select: { username: true, email: true } }, replies: { take: 1, orderBy: { createdAt: "desc" } } },
      orderBy: { updatedAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    sendSuccess(res, tickets, "Tickets fetched");
  } catch (err) { next(err); }
}

export async function createTicket(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ticket = await prisma.ticket.create({
      data: { subject: req.body.subject, body: req.body.body, priority: req.body.priority, authorId: req.user!.userId },
    });
    await audit({ action: "TICKET_CREATE", userId: req.user?.userId, entityId: ticket.id, req });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: ticket, message: "Ticket created" });
  } catch (err) { next(err); }
}

export async function getTicket(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: req.params["id"] },
      include: { replies: { include: { author: { select: { username: true, role: true } } }, orderBy: { createdAt: "asc" } } },
    });
    sendSuccess(res, ticket, "Ticket fetched");
  } catch (err) { next(err); }
}

export async function reply(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const isStaff = req.user && ["ADMIN","SUPER_ADMIN","SUPPORT"].includes(req.user.role);
    const r = await prisma.ticketReply.create({
      data: { ticketId: req.params["id"]!, body: req.body.body, authorId: req.user!.userId, isStaff: !!isStaff },
    });
    await prisma.ticket.update({ where: { id: req.params["id"] }, data: { status: isStaff ? "IN_PROGRESS" : "OPEN", updatedAt: new Date() } });
    await audit({ action: "TICKET_REPLY", userId: req.user?.userId, entityId: req.params["id"], req });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: r, message: "Reply sent" });
  } catch (err) { next(err); }
}

export async function close(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params["id"] },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    await audit({ action: "TICKET_CLOSE", userId: req.user?.userId, entityId: ticket.id, req });
    sendSuccess(res, ticket, "Ticket closed");
  } catch (err) { next(err); }
}
