import { Request, Response, NextFunction } from 'express';
import { AppError, ERROR_CODES } from '../utils/errors';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }
  console.error(err);
  res.status(500).json({
    success: false,
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
  });
}