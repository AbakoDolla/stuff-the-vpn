import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/index.js";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      sendError(
        res,
        "Validation error",
        HTTP_STATUS.UNPROCESSABLE,
        result.error.flatten().fieldErrors,
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      sendError(
        res,
        "Query validation error",
        HTTP_STATUS.BAD_REQUEST,
        result.error.flatten().fieldErrors,
      );
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
