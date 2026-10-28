import { Router } from 'express';
import { PrioritizationController } from './prioritization.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/:id/priority', PrioritizationController.getPriority);
router.post(
  '/:id/priority/decision',
  authenticate,
  requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'),
  PrioritizationController.recordDecision
);

export default router;

