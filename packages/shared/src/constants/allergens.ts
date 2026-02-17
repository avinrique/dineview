import type { Allergen } from '../types/menu.types';

export const EU_ALLERGENS: Allergen[] = [
  'CELERY', 'GLUTEN', 'CRUSTACEANS', 'EGGS', 'FISH',
  'LUPIN', 'MILK', 'MOLLUSCS', 'MUSTARD', 'NUTS',
  'PEANUTS', 'SESAME', 'SOYBEANS', 'SULPHITES',
];

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  CELERY: 'Celery',
  GLUTEN: 'Gluten',
  CRUSTACEANS: 'Crustaceans',
  EGGS: 'Eggs',
  FISH: 'Fish',
  LUPIN: 'Lupin',
  MILK: 'Milk',
  MOLLUSCS: 'Molluscs',
  MUSTARD: 'Mustard',
  NUTS: 'Tree Nuts',
  PEANUTS: 'Peanuts',
  SESAME: 'Sesame',
  SOYBEANS: 'Soybeans',
  SULPHITES: 'Sulphites',
};

export const ALLERGEN_ICONS: Record<Allergen, string> = {
  CELERY: '🌿',
  GLUTEN: '🌾',
  CRUSTACEANS: '🦐',
  EGGS: '🥚',
  FISH: '🐟',
  LUPIN: '🌸',
  MILK: '🥛',
  MOLLUSCS: '🦪',
  MUSTARD: '🟡',
  NUTS: '🌰',
  PEANUTS: '🥜',
  SESAME: '⚪',
  SOYBEANS: '🫘',
  SULPHITES: '🧪',
};
