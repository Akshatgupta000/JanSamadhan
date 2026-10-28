import { Request, Response, NextFunction } from 'express';
import { prisma, checkDatabaseConnection } from '../../config/database';
import { ResponseUtil } from '../../common/utils/response';
import { env } from '../../config/env';
import { UsersService } from '../users/users.service';
import { TaxonomiesService } from '../taxonomies/taxonomies.service';

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

  public static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UsersService.list(req.query as any);
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

  public static async assignUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UsersService.assignRole(req.params.id, req.body.role, req.user!);
      ResponseUtil.success(res, data, 'Role assigned successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = [
        { role: 'CITIZEN', description: 'Submit, track and withdraw civic problem reports and view public challenges.' },
        { role: 'GOVERNMENT_OFFICER', description: 'Review and validate reports, override priority, create innovation challenges, review milestones and verify impact.' },
        { role: 'UNIVERSITY_ADMIN', description: 'Manage institutional profile, departments, laboratories, and oversee faculty and student teams.' },
        { role: 'FACULTY', description: 'Mentor student teams, submit proposals, advance IRL stages, submit milestone deliverables, and calculate project impact.' },
        { role: 'STUDENT', description: 'Participate in innovation project teams and submit technical milestone progress.' },
        { role: 'INDUSTRY_PARTNER', description: 'Offer technical mentorship, sandbox access, CSR sponsorship, and collaborate on deployments.' },
        { role: 'PLATFORM_ADMIN', description: 'Full system administration, user role assignments, taxonomies, and platform-wide audit access.' },
      ];
      ResponseUtil.success(res, roles);
    } catch (error) {
      next(error);
    }
  }

  public static async getTaxonomies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as string | undefined;
      const data = await TaxonomiesService.list(type);
      ResponseUtil.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  public static async getConfiguration(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        apiPrefix: env.API_PREFIX,
        aiProvider: env.AI_PROVIDER,
        embeddingModel: 'text-embedding-004 (768-dim)',
        storageProvider: env.STORAGE_PROVIDER,
        emailProvider: env.EMAIL_PROVIDER,
        tokenExpirations: {
          access: env.JWT_ACCESS_EXPIRATION,
          refresh: env.JWT_REFRESH_EXPIRATION,
        },
        algorithms: {
          priorityWeighting: {
            severity: '30%',
            population: '25%',
            urgency: '20%',
            publicSafety: '15%',
            recurrence: '10%',
          },
          universityMatching: {
            facultyExpertise: '30%',
            departmentSpecialization: '20%',
            previousProjects: '20%',
            labFacilities: '15%',
            pastSuccessMetrics: '10%',
            geographicalProximity: '5%',
          },
        },
      };
      ResponseUtil.success(res, config);
    } catch (error) {
      next(error);
    }
  }
}

