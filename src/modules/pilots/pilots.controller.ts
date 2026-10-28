import { Request, Response, NextFunction } from 'express';
import { PilotsService } from './pilots.service';
import { ResponseUtil } from '../../common/utils/response';

export class PilotsController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PilotsService.create(req.params.projectId, req.body);
      ResponseUtil.created(res, data, 'Community pilot registered');
    } catch (error) {
      next(error);
    }
  }

  public static async updateResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PilotsService.updateResults(req.params.id, req.body);
      ResponseUtil.success(res, data, 'Pilot results and feedback recorded');
    } catch (error) {
      next(error);
    }
  }

  public static async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PilotsService.review(req.params.id, req.body.reviewStatus, req.user!);
      ResponseUtil.success(res, data, 'Pilot review updated');
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PilotsService.list(req.query.projectId as string);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

