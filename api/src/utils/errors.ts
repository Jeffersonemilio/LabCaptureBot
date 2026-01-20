export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, data?: any) {
    super(409, message, 'CONFLICT', data);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, data?: any) {
    super(400, message, 'VALIDATION_ERROR', data);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_ERROR');
  }
}
