import { Request, Response, NextFunction } from 'express';
import { DeploymentsService } from './deployments.service';
import { ResponseUtil } from '../../common/utils/response';

export class DeploymentsController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await DeploymentsService.create(req.body);
      ResponseUtil.created(res, data, 'Deployment registered successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await DeploymentsService.verify(
        req.params.id,
        req.body.status,
        Number(req.body.verifiedBeneficiaries) || 0,
        req.user!
      );
      ResponseUtil.success(res, data, 'Deployment verification status updated');
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await DeploymentsService.list(req.query as any);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}
