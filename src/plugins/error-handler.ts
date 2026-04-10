import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../lib/errors';

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: 'NOT_FOUND',
    message: 'Route not found',
  });
};

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  console.error(error);

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  response.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong',
  });
};

export default errorHandler;
