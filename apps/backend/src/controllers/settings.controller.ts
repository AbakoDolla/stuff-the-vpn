import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { sendSuccess } from "../utils/response.js";

export async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.setting.findMany();
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    sendSuccess(res, settings, "Settings fetched");
  } catch (err) { next(err); }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const updates = Object.entries(req.body as Record<string, unknown>);
    await Promise.all(updates.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value: value as string | boolean | number }, create: { key, value: value as string | boolean | number } })
    ));
    sendSuccess(res, null, "Settings updated");
  } catch (err) { next(err); }
}
