import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { ResponseUtil } from '../../common/utils/response';

export class NotificationsController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await NotificationsService.getUserNotifications(req.user!.id);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await NotificationsService.markAsRead(req.params.id, req.user!.id);
      ResponseUtil.success(res, data, 'Marked as read');
    } catch (error) {
      next(error);
    }
  }

  public static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationsService.markAllAsRead(req.user!.id);
      ResponseUtil.success(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }
}

