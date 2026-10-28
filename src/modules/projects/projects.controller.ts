import { Request, Response, NextFunction } from 'express';
import { ProjectsService } from './projects.service';
import { ResponseUtil } from '../../common/utils/response';

export class ProjectsController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ProjectsService.list(req.query as any);
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
      const data = await ProjectsService.getById(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async updateLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ProjectsService.updateLinks(req.params.id, req.body);
      ResponseUtil.success(res, data, 'Project links updated');
    } catch (error) {
      next(error);
    }
  }

  public static async getTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ProjectsService.getTeam(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ProjectsService.getProposal(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ProjectsService.getMilestones(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getPilots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ProjectsService.getPilots(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getDeployments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ProjectsService.getDeployments(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

