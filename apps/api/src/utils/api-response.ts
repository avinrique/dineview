import { Response } from 'express';

interface ApiResponseOptions<T> {
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function sendSuccess<T>(res: Response, options: ApiResponseOptions<T> = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message: options.message || 'Success',
    data: options.data ?? null,
    meta: options.meta || undefined,
  });
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully') {
  return sendSuccess(res, { data, message }, 201);
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}
