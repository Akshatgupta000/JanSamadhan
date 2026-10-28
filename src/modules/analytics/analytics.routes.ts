import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/overview', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN', 'UNIVERSITY_ADMIN'), AnalyticsController.getOverview);
router.get('/districts', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN', 'UNIVERSITY_ADMIN'), AnalyticsController.getDistrictHeatmap);
router.get('/domains', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN', 'UNIVERSITY_ADMIN'), AnalyticsController.getDomains);
router.get('/clusters', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN', 'UNIVERSITY_ADMIN'), AnalyticsController.getClusters);
router.get('/projects', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN', 'UNIVERSITY_ADMIN'), AnalyticsController.getProjects);

export default router;

