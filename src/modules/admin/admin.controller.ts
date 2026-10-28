import { Request, Response, NextFunction } from 'express';
import { prisma, checkDatabaseConnection } from '../../config/database';
import { ResponseUtil } from '../../common/utils/response';
import { env } from '../../config/env';

export class AdminController {
  public static async getSystemStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isDbConnected = await checkDatabaseConnection();
      const recentJobs = await prisma.backgroundJob.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      ResponseUtil.success(res, {
        environment: env.NODE_ENV,
        database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
        aiProvider: env.AI_PROVIDER,
        storageProvider: env.STORAGE_PROVIDER,
        emailProvider: env.EMAIL_PROVIDER,
        recentBackgroundJobs: recentJobs,
        serverTime: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listBackgroundJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await prisma.backgroundJob.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      ResponseUtil.success(res, jobs);
    } catch (error) {
      next(error);
    }
  }
}
