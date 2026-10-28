import { Router } from 'express';
import { IndustryController } from './industry.controller';
import { optionalAuth } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/partners', optionalAuth, IndustryController.listPartners);
router.get('/partners/:id', optionalAuth, IndustryController.getPartnerById);

export default router;
