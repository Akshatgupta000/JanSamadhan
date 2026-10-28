import { Request, Response, NextFunction } from 'express';
import { ChallengesService } from './challenges.service';
import { ResponseUtil } from '../../common/utils/response';

export class ChallengesController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ChallengesService.list(req.query as any);
      ResponseUtil.success(res, data.items, undefined, 200, {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ChallengesService.getById(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ChallengesService.create(req.body, req.user!);
      ResponseUtil.created(res, data, 'Innovation challenge created');
    } catch (error) {
      next(error);
    }
  }
}

