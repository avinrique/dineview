import { Router } from 'express';
import { authLimiter } from '../../middleware/rate-limiter';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth.middleware';
import { loginSchema, refreshTokenSchema } from '@dineview/shared';
import * as authController from './auth.controller';

export const authRouter = Router();

authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.post('/refresh', validate(refreshTokenSchema), authController.refresh);
authRouter.post('/logout', authenticate, authController.logout);
authRouter.get('/me', authenticate, authController.me);
