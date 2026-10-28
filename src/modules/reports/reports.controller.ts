import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { ResponseUtil } from '../../common/utils/response';
import { StorageFactory } from '../../integrations/storage/storage.factory';
import { BadRequestError } from '../../common/errors/app-error';
import crypto from 'crypto';
import path from 'path';

export class ReportsController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ReportsService.create(req.body, req.user!, {
        correlationId: req.correlationId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      ResponseUtil.created(res, data, 'Report submitted successfully. AI analysis scheduled.');
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ReportsService.getById(req.params.id, req.user);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ReportsService.list(req.query as any, req.user);
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

  public static async getMyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ReportsService.getUserReports(req.user!.id, req.query as any);
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

  public static async uploadEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) throw new BadRequestError('No file uploaded');

      const storage = StorageFactory.getAdapter();
      const ext = path.extname(file.originalname);
      const safeKey = `evidence/${req.params.id}/${crypto.randomBytes(16).toString('hex')}${ext}`;

      const uploadResult = await storage.uploadFile(file.buffer, safeKey, file.mimetype);

      const evidence = await ReportsService.addEvidence(
        req.params.id,
        {
          fileKey: uploadResult.fileKey,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          storageProvider: uploadResult.storageProvider,
        },
        req.user!
      );

      ResponseUtil.created(res, evidence, 'Evidence attachment uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ReportsService.withdraw(
        req.params.id,
        req.user!,
        req.body?.reason
      );
      ResponseUtil.success(res, result, 'Report withdrawn successfully');
    } catch (error) {
      next(error);
    }
  }
}

