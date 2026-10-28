import { Router } from 'express';
import { IntelligenceController } from './intelligence.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/:id/analysis', IntelligenceController.getAnalysis);
router.post('/:id/analysis/reprocess', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), IntelligenceController.reprocess);

export default router;

