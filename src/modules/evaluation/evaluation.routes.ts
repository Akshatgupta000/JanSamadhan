import { Router } from 'express';
import { EvaluationController } from './evaluation.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/experiment', optionalAuth, EvaluationController.runComparativeExperiment);
router.post('/classification-metrics', authenticate, requireRoles('PLATFORM_ADMIN', 'GOVERNMENT_OFFICER'), EvaluationController.evaluateClassification);

export default router;

