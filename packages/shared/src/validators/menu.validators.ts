import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const reorderCategoriesSchema = z.object({
  categories: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int().min(0),
  })),
});

export const createDishSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Price must be positive'),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional(),
  prepTimeMin: z.number().int().min(1).max(180).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  nutrition: z.object({
    calories: z.number().min(0).optional(),
    proteinG: z.number().min(0).optional(),
    carbsG: z.number().min(0).optional(),
    fatsG: z.number().min(0).optional(),
    fiberG: z.number().min(0).optional(),
    sugarG: z.number().min(0).optional(),
    sodiumMg: z.number().min(0).optional(),
    vitamins: z.record(z.number()).optional(),
  }).optional(),
  allergens: z.array(z.enum([
    'CELERY', 'GLUTEN', 'CRUSTACEANS', 'EGGS', 'FISH',
    'LUPIN', 'MILK', 'MOLLUSCS', 'MUSTARD', 'NUTS',
    'PEANUTS', 'SESAME', 'SOYBEANS', 'SULPHITES',
  ])).optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    isPrimary: z.boolean().optional().default(false),
  })).optional(),
});

export const updateDishSchema = createDishSchema.partial();

export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateDishInput = z.infer<typeof createDishSchema>;
export type UpdateDishInput = z.infer<typeof updateDishSchema>;
