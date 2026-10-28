import { Router } from 'express';
import { ValidationController } from './validation.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.post('/:id/start-review', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), ValidationController.startReview);
router.post('/:id/request-information', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), ValidationController.requestInformation);
router.post('/:id/validate', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), ValidationController.validateReport);
router.post('/:id/reject', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), ValidationController.rejectReport);

export default router;

