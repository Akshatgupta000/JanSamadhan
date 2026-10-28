import { Request, Response, NextFunction } from 'express';
import { PrioritizationService } from './prioritization.service';
import { ResponseUtil } from '../../common/utils/response';

export class PrioritizationController {
  public static async getPriority(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PrioritizationService.getReportPriority(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async recordDecision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PrioritizationService.recordDecision(
        req.params.id,
        req.user!,
        req.body
      );
      ResponseUtil.success(res, data, 'Priority decision and human override recorded with audit event');
    } catch (error) {
      next(error);
    }
  }
}

