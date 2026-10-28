import { Router } from 'express';
import { TeamsController } from './teams.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/:id', optionalAuth, TeamsController.getById);
router.post(
  '/',
  authenticate,
  requireRoles('STUDENT', 'FACULTY', 'UNIVERSITY_ADMIN', 'PLATFORM_ADMIN'),
  TeamsController.createTeam
);
router.post('/:id/members', authenticate, TeamsController.addMember);
router.post('/:id/respond', authenticate, TeamsController.respondInvitation);

export default router;
