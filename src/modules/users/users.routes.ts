import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, requireRoles('PLATFORM_ADMIN', 'GOVERNMENT_OFFICER'), UsersController.list);
router.post('/:id/roles', authenticate, requireRoles('PLATFORM_ADMIN'), UsersController.assignRole);
router.patch('/:id/status', authenticate, requireRoles('PLATFORM_ADMIN'), UsersController.updateStatus);

export default router;

