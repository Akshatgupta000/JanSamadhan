import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/status', authenticate, requireRoles('PLATFORM_ADMIN'), AdminController.getSystemStatus);
router.get('/jobs', authenticate, requireRoles('PLATFORM_ADMIN'), AdminController.listBackgroundJobs);

export default router;
