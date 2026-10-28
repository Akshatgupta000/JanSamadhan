import { Request, Response, NextFunction } from 'express';
import { EvaluationService } from './evaluation.service';
import { ResponseUtil } from '../../common/utils/response';

export class EvaluationController {
  public static async runComparativeExperiment(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await EvaluationService.runComparativeExperiment();
      ResponseUtil.success(res, data, 'Comparative recommendation experiment completed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async evaluateClassification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const predictions = req.body.predictions;
      const data = EvaluationService.calculateClassificationMetrics(predictions);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

