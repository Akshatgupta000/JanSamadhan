import { Request, Response, NextFunction } from 'express';
import { ValidationService } from './validation.service';
import { ResponseUtil } from '../../common/utils/response';

export class ValidationController {
  public static async startReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ValidationService.startReview(
        req.params.id,
        req.user!,
        req.body?.notes
      );
      ResponseUtil.success(res, data, 'Report marked as UNDER_REVIEW');
    } catch (error) {
      next(error);
    }
  }

  public static async requestInformation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ValidationService.requestInformation(
        req.params.id,
        req.user!,
        req.body.notes
      );
      ResponseUtil.success(res, data, 'Information request dispatched to citizen');
    } catch (error) {
      next(error);
    }
  }

  public static async validateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ValidationService.validateReport(
        req.params.id,
        req.user!,
        req.body
      );
      ResponseUtil.success(res, data, 'Report successfully validated and recorded in governance audit');
    } catch (error) {
      next(error);
    }
  }

  public static async rejectReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ValidationService.rejectReport(
        req.params.id,
        req.user!,
        req.body.reason
      );
      ResponseUtil.success(res, data, 'Report rejected with recorded audit justification');
    } catch (error) {
      next(error);
    }
  }
}

