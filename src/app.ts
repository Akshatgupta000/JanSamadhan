import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { apiRateLimiter } from './common/middleware/rate-limit.middleware';
import { errorHandler } from './common/errors/error-handler';
import { ResponseUtil } from './common/utils/response';
import { checkDatabaseConnection } from './config/database';
import { openApiSpec } from './docs/swagger';

// Routers
import authRouter from './modules/auth/auth.routes';
import usersRouter from './modules/users/users.routes';
import organizationsRouter from './modules/organizations/organizations.routes';
import taxonomiesRouter from './modules/taxonomies/taxonomies.routes';
import reportsRouter from './modules/reports/reports.routes';
import validationRouter from './modules/validation/validation.routes';
import intelligenceRouter from './modules/intelligence/intelligence.routes';
import prioritizationRouter from './modules/prioritization/prioritization.routes';
import clusteringRouter from './modules/clustering/clustering.routes';
import challengesRouter from './modules/challenges/challenges.routes';
import matchingRouter from './modules/matching/matching.routes';
import teamsRouter from './modules/teams/teams.routes';
import proposalsRouter from './modules/proposals/proposals.routes';
import projectsRouter from './modules/projects/projects.routes';
import milestonesRouter from './modules/milestones/milestones.routes';
import readinessRouter from './modules/readiness/readiness.routes';
import pilotsRouter from './modules/pilots/pilots.routes';
import deploymentsRouter from './modules/deployments/deployments.routes';
import collaborationsRouter from './modules/collaborations/collaborations.routes';
import impactRouter from './modules/impact/impact.routes';
import analyticsRouter from './modules/analytics/analytics.routes';
import auditRouter from './modules/audit/audit.routes';
import notificationsRouter from './modules/notifications/notifications.routes';
import evaluationRouter from './modules/evaluation/evaluation.routes';
import adminRouter from './modules/admin/admin.routes';

export function createApp(): Application {
  const app = express();

  // Security & standard middlewares
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Correlation ID & Rate Limiting
  app.use(requestIdMiddleware);
  app.use('/api', apiRateLimiter);

  // Swagger Documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Health & Readiness Endpoints
  app.get('/health', (_req: Request, res: Response) => {
    ResponseUtil.success(res, { status: 'UP', service: 'JanSamadhan Backend API' });
  });

  app.get('/ready', async (_req: Request, res: Response) => {
    const isDbConnected = await checkDatabaseConnection();
    if (isDbConnected) {
      ResponseUtil.success(res, {
        status: 'READY',
        database: 'CONNECTED',
        storage: env.STORAGE_PROVIDER,
        ai: env.AI_PROVIDER,
      });
    } else {
      ResponseUtil.error(res, 'Database dependency unreachable', 503, 'SERVICE_UNAVAILABLE');
    }
  });

  // API v1 Routing
  const apiV1 = express.Router();
  apiV1.use('/auth', authRouter);
  apiV1.use('/users', usersRouter);
  apiV1.use('/organizations', organizationsRouter);
  apiV1.use('/taxonomies', taxonomiesRouter);
  apiV1.use('/reports', reportsRouter);
  apiV1.use('/reports', validationRouter);
  apiV1.use('/reports', intelligenceRouter);
  apiV1.use('/reports', prioritizationRouter);
  apiV1.use('/clusters', clusteringRouter);
  apiV1.use('/challenges', challengesRouter);
  apiV1.use('/challenges', matchingRouter);
  apiV1.use('/teams', teamsRouter);
  apiV1.use('/proposals', proposalsRouter);
  apiV1.use('/projects', projectsRouter);
  apiV1.use('/', milestonesRouter);
  apiV1.use('/projects', readinessRouter);
  apiV1.use('/', pilotsRouter);
  apiV1.use('/deployments', deploymentsRouter);
  apiV1.use('/collaborations', collaborationsRouter);
  apiV1.use('/', impactRouter);
  apiV1.use('/analytics', analyticsRouter);
  apiV1.use('/audit', auditRouter);
  apiV1.use('/notifications', notificationsRouter);
  apiV1.use('/evaluation', evaluationRouter);
  apiV1.use('/admin', adminRouter);

  app.use(env.API_PREFIX, apiV1);

  // Fallback 404 handler
  app.use((_req: Request, res: Response) => {
    ResponseUtil.error(res, 'The requested API endpoint does not exist', 404, 'NOT_FOUND');
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
