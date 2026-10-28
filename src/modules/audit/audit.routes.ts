import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), AuditController.list);

export default router;

