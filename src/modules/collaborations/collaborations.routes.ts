import { Router } from 'express';
import { CollaborationsController } from './collaborations.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, CollaborationsController.list);
router.post(
  '/',
  authenticate,
  requireRoles('INDUSTRY_PARTNER', 'FACULTY', 'UNIVERSITY_ADMIN', 'PLATFORM_ADMIN'),
  CollaborationsController.create
);
router.patch(
  '/:id/status',
  authenticate,
  requireRoles('INDUSTRY_PARTNER', 'FACULTY', 'UNIVERSITY_ADMIN', 'PLATFORM_ADMIN'),
  CollaborationsController.updateStatus
);

export default router;

