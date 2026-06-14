import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";
import { logger } from "../lib/logger.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    sendError(
      res,
      "Validation error",
      HTTP_STATUS.UNPROCESSABLE,
      err.flatten().fieldErrors,
    );
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      sendError(res, "Resource already exists (duplicate)", HTTP_STATUS.CONFLICT);
      return;
    }
    if (err.code === "P2025") {
      sendError(res, "Resource not found", HTTP_STATUS.NOT_FOUND);
      return;
    }
  }

  if (err instanceof Error) {
    logger.error({ err }, "Unhandled error");
    sendError(res, err.message || "Internal server error", HTTP_STATUS.INTERNAL);
    return;
  }

  logger.error({ err }, "Unknown error");
  sendError(res, "Internal server error", HTTP_STATUS.INTERNAL);
}
