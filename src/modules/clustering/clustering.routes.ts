import { Router } from 'express';
import { ClusteringController } from './clustering.controller';
import { authenticate, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

// Duplicate candidate retrieval for a report
router.get('/reports/:id/duplicate-candidates', ClusteringController.getDuplicateCandidates);

// Cluster endpoints
router.get('/', ClusteringController.listClusters);
router.post('/', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), ClusteringController.createCluster);
router.get('/:id', ClusteringController.getById);
router.patch('/:id/review', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), ClusteringController.reviewCluster);
router.post('/:id/members', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), ClusteringController.addMember);
router.delete('/:id/members/:reportId', authenticate, requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN'), ClusteringController.removeMember);

export default router;

