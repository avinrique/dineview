import { z } from 'zod';

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  logo: z.string().url().optional(),
  address: z.string().max(500).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  settings: z.object({
    taxRate: z.number().min(0).max(100).optional(),
    serviceCharge: z.number().min(0).max(100).optional(),
    autoAcceptOrders: z.boolean().optional(),
    enableAr: z.boolean().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
  }).optional(),
});

export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
