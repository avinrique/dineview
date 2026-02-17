export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
  dishes?: Dish[];
}

export interface Dish {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  prepTimeMin: number | null;
  categoryId: string;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  nutrition?: Nutrition;
  allergens?: DishAllergen[];
  ingredients?: DishIngredient[];
  arAsset?: ArAsset;
}

export interface Nutrition {
  id: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatsG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  vitamins: Record<string, number> | null;
  dishId: string;
}

export interface DishAllergen {
  id: string;
  dishId: string;
  allergen: Allergen;
}

export interface DishIngredient {
  id: string;
  name: string;
  isPrimary: boolean;
  dishId: string;
}

export interface ArAsset {
  id: string;
  fileUrl: string;
  fileSizeBytes: number;
  thumbnailUrl: string | null;
  scale: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  hotspots: ArHotspot[];
  status: 'PROCESSING' | 'READY' | 'FAILED';
  dishId: string;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArHotspot {
  id: string;
  label: string;
  position: { x: number; y: number; z: number };
  type: 'ingredient' | 'nutrition' | 'allergen' | 'info';
  content: string;
}

export type Allergen =
  | 'CELERY' | 'GLUTEN' | 'CRUSTACEANS' | 'EGGS' | 'FISH'
  | 'LUPIN' | 'MILK' | 'MOLLUSCS' | 'MUSTARD' | 'NUTS'
  | 'PEANUTS' | 'SESAME' | 'SOYBEANS' | 'SULPHITES';

export interface MenuResponse {
  categories: (Category & { dishes: Dish[] })[];
  restaurantId: string;
  restaurantName: string;
}
