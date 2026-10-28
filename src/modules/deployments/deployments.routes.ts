import { Router } from 'express';
import { DeploymentsController } from './deployments.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, DeploymentsController.list);
router.post(
  '/',
  authenticate,
  requireRoles('FACULTY', 'UNIVERSITY_ADMIN', 'INDUSTRY_PARTNER', 'PLATFORM_ADMIN'),
  DeploymentsController.create
);
router.patch(
  '/:id/verify',
  authenticate,
  requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'),
  DeploymentsController.verify
);

export default router;

