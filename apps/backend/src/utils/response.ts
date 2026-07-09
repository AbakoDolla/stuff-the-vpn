import type { Response } from "express";
import type { ApiResponse } from "../types/index.js";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  status = 200,
): void {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  message: string,
  status = 500,
  data?: unknown,
): void {
  const body: ApiResponse = {
    success: false,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  res.status(status).json(body);
}
