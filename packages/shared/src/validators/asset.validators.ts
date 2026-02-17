import { z } from 'zod';

export const updateArAssetSchema = z.object({
  scale: z.object({
    x: z.number().positive(),
    y: z.number().positive(),
    z: z.number().positive(),
  }).optional(),
  rotation: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional(),
  hotspots: z.array(z.object({
    id: z.string(),
    label: z.string(),
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    type: z.enum(['ingredient', 'nutrition', 'allergen', 'info']),
    content: z.string(),
  })).optional(),
});

export type UpdateArAssetInput = z.infer<typeof updateArAssetSchema>;
