import { Request, Response, NextFunction } from 'express';
import { AuditRetrievalService } from './audit.service';
import { ResponseUtil } from '../../common/utils/response';

export class AuditController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AuditRetrievalService.list(req.query as any);
      ResponseUtil.success(res, data.items, undefined, 200, {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }
}

