import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { audit } from "../lib/audit.js";
import type { AuthRequest } from "../types/index.js";
import net from "net";

export async function listServers(req: Request, res: Response, next: NextFunction) {
  try {
    const isAdmin = (req as AuthRequest).user?.role && ["ADMIN","SUPER_ADMIN"].includes((req as AuthRequest).user!.role);
    const servers = await prisma.server.findMany({
      where: isAdmin ? {} : { isEnabled: true },
      orderBy: [{ sortOrder: "asc" }, { country: "asc" }],
    });
    sendSuccess(res, servers, "Servers fetched");
  } catch (err) { next(err); }
}

export async function getServer(req: Request, res: Response, next: NextFunction) {
  try {
    const server = await prisma.server.findUniqueOrThrow({ where: { id: req.params["id"] } });
    sendSuccess(res, server, "Server fetched");
  } catch (err) { next(err); }
}

export async function createServer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const server = await prisma.server.create({ data: req.body });
    await audit({ action: "SERVER_CREATE", userId: req.user?.userId, entity: "server", entityId: server.id, req });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: server, message: "Server created" });
  } catch (err) { next(err); }
}

export async function updateServer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const server = await prisma.server.update({ where: { id: req.params["id"] }, data: req.body });
    await audit({ action: "SERVER_UPDATE", userId: req.user?.userId, entity: "server", entityId: server.id, req });
    sendSuccess(res, server, "Server updated");
  } catch (err) { next(err); }
}

export async function deleteServer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.server.delete({ where: { id: req.params["id"] } });
    await audit({ action: "SERVER_DELETE", userId: req.user?.userId, entity: "server", entityId: req.params["id"], req });
    sendSuccess(res, null, "Server deleted");
  } catch (err) { next(err); }
}

export async function pingServer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const server = await prisma.server.findUniqueOrThrow({ where: { id: req.params["id"] } });
    const start = Date.now();
    const online = await tcpPing(server.ip, server.port);
    const ms = Date.now() - start;

    await prisma.server.update({
      where: { id: server.id },
      data: {
        status: online ? "ONLINE" : "OFFLINE",
        lastPingMs: online ? ms : null,
        lastCheckedAt: new Date(),
      },
    });
    sendSuccess(res, { online, pingMs: online ? ms : null }, `Server is ${online ? "ONLINE" : "OFFLINE"}`);
  } catch (err) { next(err); }
}

function tcpPing(host: string, port: number, timeout = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(timeout);
    sock.connect(port, host, () => { sock.destroy(); resolve(true); });
    sock.on("error", () => resolve(false));
    sock.on("timeout", () => { sock.destroy(); resolve(false); });
  });
}
