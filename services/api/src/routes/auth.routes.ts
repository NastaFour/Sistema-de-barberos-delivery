import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  validateRequest(loginSchema),
  authController.login
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  authController.refreshToken
);

// GET /api/auth/me
router.get(
  '/me',
  authMiddleware,
  authController.getMe
);

export default router;
