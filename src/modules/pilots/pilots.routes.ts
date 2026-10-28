import { Router } from 'express';
import { PilotsController } from './pilots.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, PilotsController.list);
router.post(
  '/projects/:projectId/pilots',
  authenticate,
  requireRoles('STUDENT', 'FACULTY', 'PLATFORM_ADMIN'),
  PilotsController.create
);
router.patch(
  '/pilots/:id/results',
  authenticate,
  requireRoles('STUDENT', 'FACULTY', 'PLATFORM_ADMIN'),
  PilotsController.updateResults
);
router.patch(
  '/pilots/:id/review',
  authenticate,
  requireRoles('FACULTY', 'GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'),
  PilotsController.review
);

export default router;
