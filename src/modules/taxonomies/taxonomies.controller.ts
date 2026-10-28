import { Request, Response, NextFunction } from 'express';
import { TaxonomiesService } from './taxonomies.service';
import { ResponseUtil } from '../../common/utils/response';

export class TaxonomiesController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as string;
      const data = await TaxonomiesService.list(type);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await TaxonomiesService.create(req.body);
      ResponseUtil.created(res, data, 'Taxonomy entry created');
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await TaxonomiesService.update(req.params.id, req.body);
      ResponseUtil.success(res, data, 'Taxonomy entry updated');
    } catch (error) {
      next(error);
    }
  }
}

