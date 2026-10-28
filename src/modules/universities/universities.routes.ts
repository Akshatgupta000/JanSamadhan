import { Router } from 'express';
import { UniversitiesController } from './universities.controller';
import { optionalAuth } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, UniversitiesController.list);
router.get('/:id', optionalAuth, UniversitiesController.getById);
router.get('/:id/capabilities', optionalAuth, UniversitiesController.getCapabilities);

export default router;
