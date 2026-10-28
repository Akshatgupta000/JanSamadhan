import { Router } from 'express';
import { ProposalsController } from './proposals.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/:id', optionalAuth, ProposalsController.getById);
router.post(
  '/',
  authenticate,
  requireRoles('STUDENT', 'FACULTY', 'UNIVERSITY_ADMIN', 'PLATFORM_ADMIN'),
  ProposalsController.submit
);
router.post(
  '/:id/review',
  authenticate,
  requireRoles('FACULTY', 'GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'),
  ProposalsController.review
);

export default router;
