import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/status', authenticate, requireRoles('PLATFORM_ADMIN'), AdminController.getSystemStatus);
router.get('/jobs', authenticate, requireRoles('PLATFORM_ADMIN'), AdminController.listBackgroundJobs);
router.get('/users', authenticate, requireRoles('PLATFORM_ADMIN'), AdminController.listUsers);
router.post('/users/:id/roles', authenticate, requireRoles('PLATFORM_ADMIN'), AdminController.assignUserRole);
router.get('/roles', authenticate, requireRoles('PLATFORM_ADMIN', 'GOVERNMENT_OFFICER'), AdminController.getRoles);
router.get('/taxonomies', authenticate, requireRoles('PLATFORM_ADMIN', 'GOVERNMENT_OFFICER'), AdminController.getTaxonomies);
router.get('/configuration', authenticate, requireRoles('PLATFORM_ADMIN'), AdminController.getConfiguration);

export default router;

