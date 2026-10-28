import { Request, Response, NextFunction } from 'express';
import { ImpactService } from './impact.service';
import { ResponseUtil } from '../../common/utils/response';

export class ImpactController {
  public static async calculateAndSubmit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ImpactService.calculateAndSubmit(req.params.projectId, req.body);
      ResponseUtil.created(res, data, 'Social impact assessment calculated and submitted for verification');
    } catch (error) {
      next(error);
    }
  }

  public static async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ImpactService.verify(
        req.params.id,
        req.body.decision,
        req.body.notes,
        req.user!
      );
      ResponseUtil.success(res, data, 'Impact verification status recorded');
    } catch (error) {
      next(error);
    }
  }

  public static async getByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ImpactService.getByProject(req.params.projectId);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

