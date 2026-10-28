import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, NotificationsController.list);
router.patch('/:id/read', authenticate, NotificationsController.markAsRead);
router.post('/mark-all-read', authenticate, NotificationsController.markAllAsRead);

export default router;
