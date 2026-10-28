import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { ClusteringController } from '../clustering/clustering.controller';
import { authenticate, optionalAuth, requireRoles } from '../../common/middleware/auth.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import { createReportSchema } from './reports.schema';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only JPEG, PNG, WEBP, PDF, and MP4 files are permitted.'));
    }
  },
});

const router = Router();

router.get('/', optionalAuth, ReportsController.list);
router.get('/me', authenticate, ReportsController.getMyReports);
router.get('/:id', optionalAuth, ReportsController.getById);
router.get('/:id/history', authenticate, ReportsController.getHistory);
router.get('/:id/duplicate-candidates', optionalAuth, ClusteringController.getDuplicateCandidates);
router.post('/', authenticate, validate({ body: createReportSchema }), ReportsController.create);
router.post('/:id/evidence', authenticate, upload.single('file'), ReportsController.uploadEvidence);
router.post('/:id/withdraw', authenticate, ReportsController.withdraw);

export default router;

