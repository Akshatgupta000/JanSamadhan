import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, ProjectsController.list);
router.get('/:id', optionalAuth, ProjectsController.getById);
router.get('/:id/team', optionalAuth, ProjectsController.getTeam);
router.get('/:id/proposals', optionalAuth, ProjectsController.getProposal);
router.get('/:id/milestones', optionalAuth, ProjectsController.getMilestones);
router.get('/:id/pilots', optionalAuth, ProjectsController.getPilots);
router.get('/:id/deployments', optionalAuth, ProjectsController.getDeployments);
router.patch(
  '/:id/links',
  authenticate,
  requireRoles('STUDENT', 'FACULTY', 'PLATFORM_ADMIN'),
  ProjectsController.updateLinks
);

export default router;

