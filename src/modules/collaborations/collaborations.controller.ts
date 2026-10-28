import { Request, Response, NextFunction } from 'express';
import { CollaborationsService } from './collaborations.service';
import { ResponseUtil } from '../../common/utils/response';

export class CollaborationsController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CollaborationsService.create(req.body);
      ResponseUtil.created(res, data, 'Collaboration offer/request recorded');
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CollaborationsService.list(req.query as any);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CollaborationsService.updateStatus(
        req.params.id,
        req.body.status,
        req.user!
      );
      ResponseUtil.success(res, data, 'Collaboration status updated');
    } catch (error) {
      next(error);
    }
  }
}

