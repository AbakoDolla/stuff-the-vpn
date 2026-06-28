import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";
import type { InboundProtocol } from "@prisma/client";

export async function listServers(req: Request, res: Response, next: NextFunction) {
  try {
    const isAdmin = (req as AuthRequest).user?.role &&
      ["ADMIN", "SUPER_ADMIN"].includes((req as AuthRequest).user!.role);
    const servers = await prisma.inbound.findMany({
      where: isAdmin ? {} : { enabled: true },
      orderBy: { remark: "asc" },
    });
    sendSuccess(res, servers, "Servers fetched");
  } catch (err) { next(err); }
}

export async function getServer(req: Request, res: Response, next: NextFunction) {
  try {
    const server = await prisma.inbound.findUniqueOrThrow({
      where: { id: req.params["id"] },
    });
    sendSuccess(res, server, "Server fetched");
  } catch (err) { next(err); }
}

export async function createServer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { protocol, host, port, path, sni, remark, enabled } = req.body as {
      protocol: InboundProtocol;
      host: string;
      port: number;
      path?: string;
      sni?: string;
      remark: string;
      enabled?: boolean;
    };
    const server = await prisma.inbound.create({
      data: { protocol, host, port, path, sni, remark, enabled: enabled ?? true },
    });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: server, message: "Server created" });
  } catch (err) { next(err); }
}

export async function updateServer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const server = await prisma.inbound.update({
      where: { id: req.params["id"] },
      data: req.body as Partial<{
        protocol: InboundProtocol;
        host: string;
        port: number;
        path: string;
        sni: string;
        remark: string;
        enabled: boolean;
      }>,
    });
    sendSuccess(res, server, "Server updated");
  } catch (err) { next(err); }
}

export async function deleteServer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.inbound.delete({ where: { id: req.params["id"] } });
    sendSuccess(res, null, "Server deleted");
  } catch (err) { next(err); }
}

export async function pingServer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const server = await prisma.inbound.findUniqueOrThrow({
      where: { id: req.params["id"] },
    });
    sendSuccess(res, { host: server.host, port: server.port, online: true }, "Ping OK");
  } catch (err) { next(err); }
}
