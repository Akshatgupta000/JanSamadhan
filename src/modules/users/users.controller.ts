import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { ResponseUtil } from '../../common/utils/response';

export class UsersController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UsersService.list(req.query as any);
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

  public static async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UsersService.assignRole(
        req.params.id,
        req.body.role,
        req.user!
      );
      ResponseUtil.success(res, data, 'Role assigned successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UsersService.updateStatus(
        req.params.id,
        req.body.status,
        req.user!
      );
      ResponseUtil.success(res, data, 'Account status updated');
    } catch (error) {
      next(error);
    }
  }
}

