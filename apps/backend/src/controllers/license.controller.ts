import type { Request, Response, NextFunction } from "express";
import * as licenseService from "../services/license.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";

export async function validateLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, phone, deviceId } = req.body;
    if (!token) {
      sendError(res, "Token is required", HTTP_STATUS.BAD_REQUEST);
      return;
    }
    const license = await licenseService.validateLicense(token, phone, deviceId);
    sendSuccess(res, license, "License is valid");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.startsWith("LICENSE_")) {
      sendError(res, msg, HTTP_STATUS.BAD_REQUEST);
      return;
    }
    next(err);
  }
}

export async function bindDevice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, deviceId, deviceName, phone } = req.body;
    if (!token || !deviceId) {
      sendError(res, "token and deviceId are required", HTTP_STATUS.BAD_REQUEST);
      return;
    }
    const result = await licenseService.bindDevice(token, deviceId, deviceName, phone);
    sendSuccess(res, result, "Device bound successfully");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.startsWith("LICENSE_") || msg.startsWith("DEVICE_")) {
      sendError(res, msg, HTTP_STATUS.BAD_REQUEST);
      return;
    }
    next(err);
  }
}

export async function resetDevice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;
    if (!token) {
      sendError(res, "Token is required", HTTP_STATUS.BAD_REQUEST);
      return;
    }
    const result = await licenseService.resetDevice(token);
    sendSuccess(res, result, "Device reset successfully");
  } catch (err) {
    next(err);
  }
}

export async function revokeLicense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;
    if (!token) {
      sendError(res, "Token is required", HTTP_STATUS.BAD_REQUEST);
      return;
    }
    const result = await licenseService.revokeLicense(token);
    sendSuccess(res, result, "License revoked successfully");
  } catch (err) {
    next(err);
  }
}

export async function generateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dataLimitGB, deviceLimit, durationDays, resellerId, count } = req.body;
    const result = await licenseService.generateLicense({
      dataLimitGB,
      deviceLimit,
      durationDays,
      resellerId,
      createdBy: req.user?.userId,
      count,
    });
    sendSuccess(res, result, "License(s) generated successfully", HTTP_STATUS.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function listLicenses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query["page"] ?? 1);
    const limit = Number(req.query["limit"] ?? 20);
    const result = await licenseService.listLicenses(page, limit);
    sendSuccess(res, result, "Licenses fetched successfully");
  } catch (err) {
    next(err);
  }
}