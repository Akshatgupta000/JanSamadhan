import { Router } from 'express';
import { ChallengesController } from './challenges.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, ChallengesController.list);
router.get('/:id', optionalAuth, ChallengesController.getById);
router.post('/', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), ChallengesController.create);

export default router;

