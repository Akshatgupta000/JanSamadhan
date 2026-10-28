import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ResponseUtil } from '../../common/utils/response';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../common/errors/app-error';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        correlationId: req.correlationId,
      });
      ResponseUtil.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        correlationId: req.correlationId,
      });
      ResponseUtil.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  public static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.refreshToken(req.body.refreshToken);
      ResponseUtil.success(res, result, 'Tokens refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.logout(req.body?.refreshToken);
      ResponseUtil.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          name: true,
          email: true,
          accountStatus: true,
          emailVerifiedAt: true,
          createdAt: true,
          roles: { select: { role: true } },
          orgMemberships: {
            include: {
              organization: true,
              department: true,
            },
          },
          facultyProfile: true,
        },
      });

      if (!user) throw new NotFoundError('User not found');
      ResponseUtil.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      ResponseUtil.success(res, null, 'Password updated successfully. Other sessions invalidated.');
    } catch (error) {
      next(error);
    }
  }
}

