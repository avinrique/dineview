import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config';
import { hashPassword } from '../../utils/crypto';
import { ApiError } from '../../utils/api-error';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/api-response';

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      where: { restaurantId: req.user!.restaurantId! },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, { data: users });
  } catch (error) { next(error); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.user!.restaurantId!;
    const passwordHash = await hashPassword(req.body.password);
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        passwordHash,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role,
        restaurantId,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    sendCreated(res, user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      next(ApiError.conflict('User with this email already exists'));
    } else {
      next(error);
    }
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id as string, restaurantId: req.user!.restaurantId! },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    });
    if (!user) throw ApiError.notFound('User not found');
    sendSuccess(res, { data: user });
  } catch (error) { next(error); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id as string, restaurantId: req.user!.restaurantId! },
    });
    if (!user) throw ApiError.notFound('User not found');
    if (user.id === req.user!.id) throw ApiError.badRequest('Cannot delete yourself');

    await prisma.user.delete({ where: { id: req.params.id as string } });
    sendNoContent(res);
  } catch (error) { next(error); }
}
