import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      next(new ValidationError('Invalid request body', error.errors));
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error: any) {
      next(new ValidationError('Invalid query parameters', error.errors));
    }
  };
}
