import { Request, Response, NextFunction } from 'express';
import { ReadinessService } from './readiness.service';
import { ResponseUtil } from '../../common/utils/response';

export class ReadinessController {
  public static async advanceIRL(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ReadinessService.advanceIRL(
        req.params.id,
        req.body.targetIrl,
        req.body.evidenceSummary,
        req.body.reason,
        req.user!
      );
      ResponseUtil.success(res, data, 'Innovation Readiness Level advanced successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ReadinessService.getHistory(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

