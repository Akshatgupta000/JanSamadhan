import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../common/middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.schema';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authRateLimiter } from '../../common/middleware/rate-limit.middleware';

const router = Router();

router.post('/register', authRateLimiter, validate({ body: registerSchema }), AuthController.register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), AuthController.login);
router.post('/refresh', validate({ body: refreshTokenSchema }), AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), AuthController.changePassword);

export default router;

