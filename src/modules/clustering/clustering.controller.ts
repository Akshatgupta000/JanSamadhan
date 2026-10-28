import { Request, Response, NextFunction } from 'express';
import { ClusteringService } from './clustering.service';
import { ResponseUtil } from '../../common/utils/response';

export class ClusteringController {
  public static async getDuplicateCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const threshold = req.query.threshold ? Number(req.query.threshold) : 0.70;
      const topK = req.query.topK ? Number(req.query.topK) : 5;
      const data = await ClusteringService.getDuplicateCandidates(req.params.id, threshold, topK);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async createCluster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ClusteringService.createCluster({
        ...req.body,
        createdById: req.user?.id,
      });
      ResponseUtil.created(res, data, 'Problem cluster created');
    } catch (error) {
      next(error);
    }
  }

  public static async listClusters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ClusteringService.listClusters(req.query as any);
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
      const data = await ClusteringService.getById(req.params.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async reviewCluster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ClusteringService.reviewCluster(req.params.id, req.user!, req.body);
      ResponseUtil.success(res, data, 'Cluster review updated');
    } catch (error) {
      next(error);
    }
  }
}

