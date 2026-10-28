import { Router } from 'express';
import { OrganizationsController } from './organizations.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

router.get('/', OrganizationsController.list);
router.get('/:id', OrganizationsController.getById);
router.post('/', authenticate, requireRoles('PLATFORM_ADMIN', 'GOVERNMENT_OFFICER'), OrganizationsController.create);
router.patch('/:id', authenticate, requireRoles('PLATFORM_ADMIN', 'UNIVERSITY_ADMIN', 'INDUSTRY_PARTNER'), OrganizationsController.update);
router.post('/:id/departments', authenticate, requireRoles('PLATFORM_ADMIN', 'UNIVERSITY_ADMIN'), OrganizationsController.addDepartment);
router.post('/:id/laboratories', authenticate, requireRoles('PLATFORM_ADMIN', 'UNIVERSITY_ADMIN'), OrganizationsController.addLaboratory);

export default router;

