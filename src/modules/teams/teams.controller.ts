import { Request, Response, NextFunction } from 'express';
import { TeamsService } from './teams.service';
import { ResponseUtil } from '../../common/utils/response';

export class TeamsController {
  public static async createTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await TeamsService.createTeam({
        ...req.body,
        createdById: req.user!.id,
      });
      ResponseUtil.created(res, data, 'Team formed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await TeamsService.addMember(req.params.id, req.body, req.user!);
      ResponseUtil.created(res, data, 'Team invitation sent');
    } catch (error) {
      next(error);
    }
  }

  public static async respondInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accept = Boolean(req.body.accept);
      const data = await TeamsService.respondInvitation(req.params.id, req.user!.id, accept);
      ResponseUtil.success(res, data, accept ? 'Invitation accepted' : 'Invitation declined');
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await TeamsService.getById(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

