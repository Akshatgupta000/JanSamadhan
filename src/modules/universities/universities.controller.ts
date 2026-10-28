import { Request, Response, NextFunction } from 'express';
import { UniversitiesService } from './universities.service';
import { ResponseUtil } from '../../common/utils/response';

export class UniversitiesController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UniversitiesService.list(req.query as any);
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

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UniversitiesService.getById(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getCapabilities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UniversitiesService.getCapabilities(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}
