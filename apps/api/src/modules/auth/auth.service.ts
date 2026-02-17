import { prisma } from '../../config';
import { ApiError } from '../../utils/api-error';
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  hashToken,
  generateToken,
  verifyRefreshToken,
} from '../../utils/crypto';
import type { LoginInput } from '@dineview/shared';

export async function login(input: LoginInput) {
  const user = await prisma.user.findFirst({
    where: { email: input.email },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId,
  });

  const rawRefreshToken = generateToken();
  const tokenHash = hashToken(rawRefreshToken);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      restaurantId: user.restaurantId,
    },
    accessToken,
    refreshToken: rawRefreshToken,
  };
}

export async function refreshTokens(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!storedToken) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Rotate: delete old, create new
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const user = storedToken.user;
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId,
  });

  const newRawToken = generateToken();
  const newHash = hashToken(newRawToken);

  await prisma.refreshToken.create({
    data: {
      tokenHash: newHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken: newRawToken };
}

export async function logout(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      restaurantId: true,
      restaurant: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
}
