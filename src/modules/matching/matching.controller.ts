import { Request, Response, NextFunction } from 'express';
import { UniversityMatchingService } from './university-matching.service';
import { IndustryMatchingService } from './industry-matching.service';
import { ResponseUtil } from '../../common/utils/response';

export class MatchingController {
  public static async generateUniversityMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UniversityMatchingService.generateMatches(req.params.id);
      ResponseUtil.success(res, data, 'Explainable university recommendation rankings generated');
    } catch (error) {
      next(error);
    }
  }

  public static async getUniversityMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UniversityMatchingService.getMatches(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async generateIndustryMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await IndustryMatchingService.generateMatches(req.params.id);
      ResponseUtil.success(res, data, 'Industry partner matches generated');
    } catch (error) {
      next(error);
    }
  }

  public static async getIndustryMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await IndustryMatchingService.getMatches(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

