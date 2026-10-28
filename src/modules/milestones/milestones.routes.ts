import { Router } from 'express';
import { MilestonesController } from './milestones.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.post(
  '/projects/:projectId/milestones',
  authenticate,
  requireRoles('STUDENT', 'FACULTY', 'PLATFORM_ADMIN'),
  MilestonesController.create
);
router.post(
  '/milestones/:id/deliverable',
  authenticate,
  requireRoles('STUDENT', 'FACULTY', 'PLATFORM_ADMIN'),
  MilestonesController.submitDeliverable
);
router.patch(
  '/milestones/:id/review',
  authenticate,
  requireRoles('FACULTY', 'GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'),
  MilestonesController.review
);

export default router;

