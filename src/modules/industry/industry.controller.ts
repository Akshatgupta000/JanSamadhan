import { Request, Response, NextFunction } from 'express';
import { IndustryService } from './industry.service';
import { ResponseUtil } from '../../common/utils/response';

export class IndustryController {
  public static async listPartners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await IndustryService.listPartners(req.query as any);
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

  public static async getPartnerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await IndustryService.getPartnerById(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}
