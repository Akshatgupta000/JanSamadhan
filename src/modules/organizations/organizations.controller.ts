import { Request, Response, NextFunction } from 'express';
import { OrganizationsService } from './organizations.service';
import { ResponseUtil } from '../../common/utils/response';

export class OrganizationsController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await OrganizationsService.list(req.query as any);
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
      const data = await OrganizationsService.getById(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await OrganizationsService.create(req.body);
      ResponseUtil.created(res, data, 'Organization created');
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await OrganizationsService.update(req.params.id, req.body, req.user!);
      ResponseUtil.success(res, data, 'Organization updated');
    } catch (error) {
      next(error);
    }
  }

  public static async addDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await OrganizationsService.addDepartment(req.params.id, req.body, req.user!);
      ResponseUtil.created(res, data, 'Department added');
    } catch (error) {
      next(error);
    }
  }

  public static async addLaboratory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await OrganizationsService.addLaboratory(req.params.id, req.body, req.user!);
      ResponseUtil.created(res, data, 'Laboratory added');
    } catch (error) {
      next(error);
    }
  }
}

