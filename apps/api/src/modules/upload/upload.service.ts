import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { createId } from '@paralleldrive/cuid2';
import { env } from '../../config';
import { ApiError } from '../../utils/api-error';

const MB = 1024 * 1024;

const FILE_TYPES: Record<string, { kind: 'image' | 'model'; maxBytes: number }> = {
  jpg: { kind: 'image', maxBytes: 10 * MB },
  jpeg: { kind: 'image', maxBytes: 10 * MB },
  png: { kind: 'image', maxBytes: 10 * MB },
  webp: { kind: 'image', maxBytes: 10 * MB },
  avif: { kind: 'image', maxBytes: 10 * MB },
  gif: { kind: 'image', maxBytes: 10 * MB },
  glb: { kind: 'model', maxBytes: 50 * MB },
};

export const MAX_UPLOAD_BYTES = 50 * MB;

export async function saveUpload(restaurantId: string, fileName: string, body: unknown) {
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const type = FILE_TYPES[ext];
  if (!type) {
    throw ApiError.badRequest(`Unsupported file type ".${ext}". Use JPG, PNG, WebP for photos or GLB for 3D models.`);
  }
  if (!Buffer.isBuffer(body) || body.length === 0) {
    throw ApiError.badRequest('Empty upload — send the file as the raw request body');
  }
  if (body.length > type.maxBytes) {
    throw ApiError.badRequest(`File too large (max ${type.maxBytes / MB}MB for ${type.kind}s)`);
  }

  const dir = path.resolve(env.UPLOAD_DIR, restaurantId);
  await mkdir(dir, { recursive: true });
  const storedName = `${createId()}.${ext}`;
  await writeFile(path.join(dir, storedName), body);

  return {
    url: `/uploads/${restaurantId}/${storedName}`,
    kind: type.kind,
    fileSizeBytes: body.length,
  };
}
