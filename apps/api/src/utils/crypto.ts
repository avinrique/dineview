import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateShortToken(length = 8): string {
  return crypto.randomBytes(length).toString('base64url').substring(0, length);
}

export function signAccessToken(payload: object): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function signSessionToken(payload: object): string {
  return jwt.sign(payload, env.JWT_SESSION_SECRET, { expiresIn: '4h' });
}

export function verifyAccessToken(token: string): any {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): any {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

export function verifySessionToken(token: string): any {
  return jwt.verify(token, env.JWT_SESSION_SECRET);
}
