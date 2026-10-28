import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, ProjectsController.list);
router.get('/:id', optionalAuth, ProjectsController.getById);
router.patch(
  '/:id/links',
  authenticate,
  requireRoles('STUDENT', 'FACULTY', 'PLATFORM_ADMIN'),
  ProjectsController.updateLinks
);

export default router;

