import { Router } from 'express';
import { MatchingController } from './matching.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';

const router = Router();

// University matching endpoints for challenges
router.get('/:id/university-matches', optionalAuth, MatchingController.getUniversityMatches);
router.post(
  '/:id/university-matches/generate',
  authenticate,
  requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN', 'UNIVERSITY_ADMIN'),
  MatchingController.generateUniversityMatches
);

// Industry matching endpoints for challenges
router.get('/:id/industry-matches', optionalAuth, MatchingController.getIndustryMatches);
router.post(
  '/:id/industry-matches/generate',
  authenticate,
  requireRoles('GOVERNMENT_OFFICER', 'PLATFORM_ADMIN', 'UNIVERSITY_ADMIN'),
  MatchingController.generateIndustryMatches
);

export default router;

