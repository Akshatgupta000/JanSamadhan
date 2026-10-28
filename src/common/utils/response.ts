import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  correlationId?: string;
  timestamp: string;
}

export class ResponseUtil {
  public static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200,
    meta?: any
  ): Response {
    const payload: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta,
      correlationId: (res.req as any)?.correlationId,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }

  public static created<T>(res: Response, data: T, message: string = 'Created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  public static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ): Response {
    const payload: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
      correlationId: (res.req as any)?.correlationId,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }
}

