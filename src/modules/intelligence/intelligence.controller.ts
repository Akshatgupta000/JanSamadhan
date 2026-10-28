import { Request, Response, NextFunction } from 'express';
import { IntelligenceService } from './intelligence.service';
import { ResponseUtil } from '../../common/utils/response';

export class IntelligenceController {
  public static async getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await IntelligenceService.getAnalysis(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async reprocess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobId = await IntelligenceService.reprocess(req.params.id);
      ResponseUtil.success(res, { jobId, status: 'QUEUED' }, 'Reprocessing scheduled');
    } catch (error) {
      next(error);
    }
  }
}

