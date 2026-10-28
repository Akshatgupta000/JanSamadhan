import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { ResponseUtil } from '../utils/response';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = (req as any).correlationId;

  // Log error
  logger.error(
    {
      correlationId,
      path: req.path,
      method: req.method,
      error: {
        name: err.name,
        message: err.message,
        stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
      },
    },
    'Request Error'
  );

  // Operational AppError
  if (err instanceof AppError) {
    ResponseUtil.error(
      res,
      err.message,
      err.statusCode,
      err.constructor.name,
      err.details
    );
    return;
  }

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      ResponseUtil.error(
        res,
        `Duplicate entry: A record with this ${target} already exists`,
        409,
        'DUPLICATE_RESOURCE',
        err.meta
      );
      return;
    }
    if (err.code === 'P2025') {
      ResponseUtil.error(
        res,
        'Requested record does not exist',
        404,
        'RECORD_NOT_FOUND',
        err.meta
      );
      return;
    }
  }

  // Fallback 500 error
  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal server error';

  ResponseUtil.error(res, message, 500, 'INTERNAL_SERVER_ERROR');
}

