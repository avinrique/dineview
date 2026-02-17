import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    dishId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
    specialNotes: z.string().max(500).optional(),
  })).min(1, 'Order must have at least one item'),
  specialNotes: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'PAID', 'CANCELLED']),
  note: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
