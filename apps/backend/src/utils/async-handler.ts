import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async Express handler so that rejected promises
 * are forwarded to next() and caught by the error middleware.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
