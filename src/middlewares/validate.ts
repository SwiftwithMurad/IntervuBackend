import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError, ERROR_CODES } from "../utils/errors";

type Target = "body" | "query" | "params";

export function validate(schema: ZodSchema, target: Target = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const value = req[target];
      const parsed = schema.parse(value);
      (req as unknown as Record<string, unknown>)[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors[0]?.message ?? "Invalid input";
        return next(new AppError(ERROR_CODES.VALIDATION_ERROR, message, 400));
      }
      next(err);
    }
  };
}
