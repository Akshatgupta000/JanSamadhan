import { Router } from 'express';
import { TaxonomiesController } from './taxonomies.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', TaxonomiesController.list);
router.post('/', authenticate, requireRoles('PLATFORM_ADMIN', 'GOVERNMENT_OFFICER'), TaxonomiesController.create);
router.patch('/:id', authenticate, requireRoles('PLATFORM_ADMIN'), TaxonomiesController.update);

export default router;

