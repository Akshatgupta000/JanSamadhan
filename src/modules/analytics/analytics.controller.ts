import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { ResponseUtil } from '../../common/utils/response';

export class AnalyticsController {
  public static async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getOverview();
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getDistrictHeatmap(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getDistrictHeatmap();
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}
