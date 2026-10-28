import { Router } from 'express';
import { ImpactController } from './impact.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/projects/:projectId/impact', optionalAuth, ImpactController.getByProject);
router.post(
  '/projects/:projectId/impact',
  authenticate,
  requireRoles('FACULTY', 'STUDENT', 'PLATFORM_ADMIN'),
  ImpactController.calculateAndSubmit
);
router.patch(
  '/impact/:id/verify',
  authenticate,
  requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'),
  ImpactController.verify
);

export default router;
