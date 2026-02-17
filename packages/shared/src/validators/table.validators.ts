import { z } from 'zod';

export const createTableSchema = z.object({
  label: z.string().min(1).max(50),
  capacity: z.number().int().min(1).max(50),
  locationZone: z.string().max(100).optional(),
});

export const updateTableSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
  locationZone: z.string().max(100).optional(),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
