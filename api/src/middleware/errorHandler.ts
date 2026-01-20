import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn('Application error', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
    });

    return res.status(err.statusCode).json({
      error: err.code || 'ERROR',
      message: err.message,
      ...(err.data && { data: err.data }),
    });
  }

  // Unexpected errors
  logger.error('Unexpected error', {
    error: err,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}
