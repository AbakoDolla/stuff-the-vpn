import type { Response, NextFunction } from "express";
import * as voucherService from "../services/voucher.service.js";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";

export async function createVouchers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quotaGB, durationDay, count } = req.body as { quotaGB: number; durationDay: number; count: number };
    const vouchers = await voucherService.createVouchers(quotaGB, durationDay, count, req.user!.userId);
    sendSuccess(res, vouchers, `${vouchers.length} voucher(s) created successfully`, HTTP_STATUS.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function listVouchers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query["page"] ?? 1);
    const limit = Number(req.query["limit"] ?? 20);
    const result = await voucherService.listVouchers(page, limit);
    sendSuccess(res, result, "Vouchers fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function redeemVoucher(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.body as { code: string };
    const voucher = await voucherService.redeemVoucher(code, req.user!.userId);
    sendSuccess(res, voucher, "Voucher redeemed successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateVoucher(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    const voucher = await voucherService.updateVoucher(id, req.body);
    sendSuccess(res, voucher, "Voucher updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function deleteVoucher(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"]);
    await voucherService.deleteVoucher(id);
    sendSuccess(res, null, "Voucher deleted successfully");
  } catch (err) {
    next(err);
  }
}
