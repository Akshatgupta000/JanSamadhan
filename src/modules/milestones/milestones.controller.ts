import { Request, Response, NextFunction } from 'express';
import { MilestonesService } from './milestones.service';
import { ResponseUtil } from '../../common/utils/response';

export class MilestonesController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MilestonesService.create(req.params.projectId, req.body);
      ResponseUtil.created(res, data, 'Milestone created');
    } catch (error) {
      next(error);
    }
  }

  public static async submitDeliverable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MilestonesService.submitDeliverable(
        req.params.id,
        req.body.deliverableUrl,
        req.body.notes
      );
      ResponseUtil.success(res, data, 'Milestone deliverable submitted');
    } catch (error) {
      next(error);
    }
  }

  public static async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MilestonesService.review(
        req.params.id,
        req.body.status,
        req.user!,
        req.body.notes
      );
      ResponseUtil.success(res, data, 'Milestone review updated');
    } catch (error) {
      next(error);
    }
  }
}

