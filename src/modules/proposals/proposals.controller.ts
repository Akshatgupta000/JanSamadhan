import { Request, Response, NextFunction } from 'express';
import { ProposalsService } from './proposals.service';
import { ResponseUtil } from '../../common/utils/response';

export class ProposalsController {
  public static async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ProposalsService.submit(req.body, req.user!);
      ResponseUtil.created(res, data, 'Proposal submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ProposalsService.review(
        req.params.id,
        req.body.decision,
        req.body.feedback,
        req.user!
      );
      ResponseUtil.success(res, data, 'Proposal review processed');
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ProposalsService.getById(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

