import { Router } from 'express';
import { ReadinessController } from './readiness.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/:id/readiness', optionalAuth, ReadinessController.getHistory);
router.post(
  '/:id/readiness/advance',
  authenticate,
  requireRoles('FACULTY', 'GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'),
  ReadinessController.advanceIRL
);

export default router;

