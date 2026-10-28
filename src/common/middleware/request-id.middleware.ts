import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || (req.headers['x-request-id'] as string) || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
}

