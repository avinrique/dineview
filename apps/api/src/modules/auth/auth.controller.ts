import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as authService from './auth.service';
import { sendSuccess } from '../../utils/api-response';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, { data: result, message: 'Login successful' });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    sendSuccess(res, { data: result, message: 'Tokens refreshed' });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user!.id);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, { data: user });
  } catch (error) {
    next(error);
  }
}
