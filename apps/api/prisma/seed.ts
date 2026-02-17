import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'bella-vista' },
    update: {},
    create: {
      name: 'Bella Vista',
      slug: 'bella-vista',
      address: '123 Main Street, New York, NY 10001',
      currency: 'USD',
      timezone: 'America/New_York',
      subscriptionPlan: 'PROFESSIONAL',
      settings: {
        taxRate: 8.875,
        serviceCharge: 0,
        autoAcceptOrders: false,
        enableAr: true,
        primaryColor: '#f97316',
        secondaryColor: '#1e293b',
      },
    },
  });

  console.log(`✅ Restaurant: ${restaurant.name}`);

  // Create users (one per role)
  const passwordHash = await bcrypt.hash('password123', 12);

  const users = [
    { email: 'superadmin@dineview.com', firstName: 'Super', lastName: 'Admin', role: 'SUPER_ADMIN' as const, restaurantId: null },
    { email: 'owner@bellavista.com', firstName: 'Marco', lastName: 'Rossi', role: 'OWNER' as const, restaurantId: restaurant.id },
    { email: 'manager@bellavista.com', firstName: 'Sofia', lastName: 'Chen', role: 'MANAGER' as const, restaurantId: restaurant.id },
    { email: 'kitchen@bellavista.com', firstName: 'James', lastName: 'Wilson', role: 'KITCHEN_STAFF' as const, restaurantId: restaurant.id },
    { email: 'waiter@bellavista.com', firstName: 'Emma', lastName: 'Davis', role: 'WAITER' as const, restaurantId: restaurant.id },
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: {
        email_restaurantId: {
          email: userData.email,
          restaurantId: userData.restaurantId ?? '',
        },
      },
      update: {},
      create: {
        ...userData,
        passwordHash,
      },
    });
  }

  console.log(`✅ Users: ${users.length} created`);

  // Create categories
  const categoriesData = [
    { name: 'Starters', slug: 'starters', description: 'Begin your culinary journey', sortOrder: 0 },
    { name: 'Mains', slug: 'mains', description: 'Signature main courses', sortOrder: 1 },
    { name: 'Drinks', slug: 'drinks', description: 'Beverages and cocktails', sortOrder: 2 },
    { name: 'Desserts', slug: 'desserts', description: 'Sweet endings', sortOrder: 3 },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.slug] = await prisma.category.upsert({
      where: {
        slug_restaurantId: {
          slug: cat.slug,
          restaurantId: restaurant.id,
        },
      },
      update: {},
      create: {
        ...cat,
        restaurantId: restaurant.id,
      },
    });
  }

  console.log(`✅ Categories: ${Object.keys(categories).length} created`);

  // Create dishes with nutrition and allergens
  const dishesData = [
    // Starters
    {
      name: 'Bruschetta Classica',
      slug: 'bruschetta-classica',
      description: 'Toasted ciabatta topped with fresh tomatoes, basil, garlic, and extra virgin olive oil',
      price: 12.99,
      prepTimeMin: 10,
      categorySlug: 'starters',
      isFeatured: true,
      nutrition: { calories: 280, proteinG: 6, carbsG: 32, fatsG: 14, fiberG: 3, sugarG: 4, sodiumMg: 420 },
      allergens: ['GLUTEN'] as const,
      ingredients: [
        { name: 'Ciabatta bread', isPrimary: true },
        { name: 'Roma tomatoes', isPrimary: true },
        { name: 'Fresh basil', isPrimary: false },
        { name: 'Garlic', isPrimary: false },
        { name: 'Extra virgin olive oil', isPrimary: false },
      ],
    },
    {
      name: 'Calamari Fritti',
      slug: 'calamari-fritti',
      description: 'Crispy fried squid rings served with lemon aioli and marinara sauce',
      price: 15.99,
      prepTimeMin: 12,
      categorySlug: 'starters',
      isFeatured: false,
      nutrition: { calories: 420, proteinG: 18, carbsG: 28, fatsG: 26, fiberG: 1, sugarG: 2, sodiumMg: 680 },
      allergens: ['GLUTEN', 'EGGS', 'MOLLUSCS'] as const,
      ingredients: [
        { name: 'Fresh squid', isPrimary: true },
        { name: 'Seasoned flour', isPrimary: false },
        { name: 'Lemon aioli', isPrimary: false },
        { name: 'Marinara sauce', isPrimary: false },
      ],
    },
    {
      name: 'Caprese Salad',
      slug: 'caprese-salad',
      description: 'Fresh buffalo mozzarella, vine-ripened tomatoes, and basil with balsamic reduction',
      price: 14.50,
      prepTimeMin: 5,
      categorySlug: 'starters',
      isFeatured: false,
      nutrition: { calories: 320, proteinG: 14, carbsG: 8, fatsG: 26, fiberG: 2, sugarG: 6, sodiumMg: 380 },
      allergens: ['MILK'] as const,
      ingredients: [
        { name: 'Buffalo mozzarella', isPrimary: true },
        { name: 'Vine tomatoes', isPrimary: true },
        { name: 'Fresh basil', isPrimary: false },
        { name: 'Balsamic reduction', isPrimary: false },
      ],
    },
    // Mains
    {
      name: 'Margherita Pizza',
      slug: 'margherita-pizza',
      description: 'San Marzano tomato sauce, fresh mozzarella, basil, and olive oil on Neapolitan dough',
      price: 18.99,
      prepTimeMin: 15,
      categorySlug: 'mains',
      isFeatured: true,
      nutrition: { calories: 680, proteinG: 24, carbsG: 72, fatsG: 30, fiberG: 4, sugarG: 8, sodiumMg: 920 },
      allergens: ['GLUTEN', 'MILK'] as const,
      ingredients: [
        { name: 'Neapolitan dough', isPrimary: true },
        { name: 'San Marzano tomatoes', isPrimary: true },
        { name: 'Fresh mozzarella', isPrimary: true },
        { name: 'Fresh basil', isPrimary: false },
        { name: 'Olive oil', isPrimary: false },
      ],
    },
    {
      name: 'Spaghetti Carbonara',
      slug: 'spaghetti-carbonara',
      description: 'Traditional Roman pasta with guanciale, pecorino romano, egg yolk, and black pepper',
      price: 22.50,
      prepTimeMin: 18,
      categorySlug: 'mains',
      isFeatured: true,
      nutrition: { calories: 780, proteinG: 32, carbsG: 68, fatsG: 40, fiberG: 3, sugarG: 2, sodiumMg: 1100 },
      allergens: ['GLUTEN', 'EGGS', 'MILK'] as const,
      ingredients: [
        { name: 'Spaghetti', isPrimary: true },
        { name: 'Guanciale', isPrimary: true },
        { name: 'Pecorino Romano', isPrimary: true },
        { name: 'Egg yolk', isPrimary: false },
        { name: 'Black pepper', isPrimary: false },
      ],
    },
    {
      name: 'Grilled Salmon',
      slug: 'grilled-salmon',
      description: 'Atlantic salmon fillet with lemon herb butter, roasted vegetables, and quinoa',
      price: 28.99,
      prepTimeMin: 20,
      categorySlug: 'mains',
      isFeatured: false,
      nutrition: { calories: 520, proteinG: 42, carbsG: 24, fatsG: 28, fiberG: 5, sugarG: 4, sodiumMg: 580 },
      allergens: ['FISH', 'MILK'] as const,
      ingredients: [
        { name: 'Atlantic salmon', isPrimary: true },
        { name: 'Lemon herb butter', isPrimary: false },
        { name: 'Seasonal vegetables', isPrimary: false },
        { name: 'Quinoa', isPrimary: false },
      ],
    },
    {
      name: 'Risotto ai Funghi',
      slug: 'risotto-ai-funghi',
      description: 'Creamy Arborio rice with wild mushrooms, truffle oil, and Parmigiano Reggiano',
      price: 24.50,
      prepTimeMin: 25,
      categorySlug: 'mains',
      isFeatured: false,
      nutrition: { calories: 620, proteinG: 16, carbsG: 72, fatsG: 30, fiberG: 3, sugarG: 2, sodiumMg: 780 },
      allergens: ['MILK'] as const,
      ingredients: [
        { name: 'Arborio rice', isPrimary: true },
        { name: 'Wild mushrooms', isPrimary: true },
        { name: 'Parmigiano Reggiano', isPrimary: false },
        { name: 'Truffle oil', isPrimary: false },
        { name: 'White wine', isPrimary: false },
      ],
    },
    // Drinks
    {
      name: 'Classic Mojito',
      slug: 'classic-mojito',
      description: 'Fresh mint, lime, white rum, sugar, and soda water',
      price: 13.50,
      prepTimeMin: 5,
      categorySlug: 'drinks',
      isFeatured: false,
      nutrition: { calories: 220, proteinG: 0, carbsG: 24, fatsG: 0, fiberG: 0, sugarG: 20, sodiumMg: 10 },
      allergens: [] as const,
      ingredients: [
        { name: 'White rum', isPrimary: true },
        { name: 'Fresh mint', isPrimary: true },
        { name: 'Lime juice', isPrimary: false },
        { name: 'Sugar syrup', isPrimary: false },
        { name: 'Soda water', isPrimary: false },
      ],
    },
    {
      name: 'Italian Lemonade',
      slug: 'italian-lemonade',
      description: 'House-made lemonade with Sicilian lemons and a hint of rosemary',
      price: 7.50,
      prepTimeMin: 3,
      categorySlug: 'drinks',
      isFeatured: false,
      nutrition: { calories: 120, proteinG: 0, carbsG: 30, fatsG: 0, fiberG: 0, sugarG: 26, sodiumMg: 5 },
      allergens: [] as const,
      ingredients: [
        { name: 'Sicilian lemons', isPrimary: true },
        { name: 'Rosemary', isPrimary: false },
        { name: 'Cane sugar', isPrimary: false },
      ],
    },
    // Desserts
    {
      name: 'Tiramisu',
      slug: 'tiramisu',
      description: 'Classic Italian dessert with espresso-soaked ladyfingers, mascarpone cream, and cocoa',
      price: 12.99,
      prepTimeMin: 5,
      categorySlug: 'desserts',
      isFeatured: true,
      nutrition: { calories: 450, proteinG: 8, carbsG: 42, fatsG: 28, fiberG: 1, sugarG: 30, sodiumMg: 120 },
      allergens: ['GLUTEN', 'EGGS', 'MILK'] as const,
      ingredients: [
        { name: 'Mascarpone', isPrimary: true },
        { name: 'Ladyfingers', isPrimary: true },
        { name: 'Espresso', isPrimary: false },
        { name: 'Cocoa powder', isPrimary: false },
        { name: 'Marsala wine', isPrimary: false },
      ],
    },
    {
      name: 'Panna Cotta',
      slug: 'panna-cotta',
      description: 'Silky vanilla bean panna cotta with mixed berry compote',
      price: 11.50,
      prepTimeMin: 5,
      categorySlug: 'desserts',
      isFeatured: false,
      nutrition: { calories: 380, proteinG: 6, carbsG: 36, fatsG: 24, fiberG: 2, sugarG: 28, sodiumMg: 80 },
      allergens: ['MILK'] as const,
      ingredients: [
        { name: 'Heavy cream', isPrimary: true },
        { name: 'Vanilla bean', isPrimary: true },
        { name: 'Mixed berries', isPrimary: false },
        { name: 'Gelatin', isPrimary: false },
      ],
    },
    {
      name: 'Chocolate Lava Cake',
      slug: 'chocolate-lava-cake',
      description: 'Warm dark chocolate cake with a molten center, served with vanilla gelato',
      price: 14.99,
      prepTimeMin: 15,
      categorySlug: 'desserts',
      isFeatured: false,
      nutrition: { calories: 580, proteinG: 10, carbsG: 62, fatsG: 34, fiberG: 3, sugarG: 48, sodiumMg: 180 },
      allergens: ['GLUTEN', 'EGGS', 'MILK', 'SOYBEANS'] as const,
      ingredients: [
        { name: 'Dark chocolate', isPrimary: true },
        { name: 'Butter', isPrimary: false },
        { name: 'Eggs', isPrimary: false },
        { name: 'Flour', isPrimary: false },
        { name: 'Vanilla gelato', isPrimary: false },
      ],
    },
  ];

  for (const dishData of dishesData) {
    const { nutrition, allergens, ingredients, categorySlug, ...rest } = dishData;
    const category = categories[categorySlug];

    const dish = await prisma.dish.upsert({
      where: {
        slug_restaurantId: {
          slug: rest.slug,
          restaurantId: restaurant.id,
        },
      },
      update: {},
      create: {
        ...rest,
        categoryId: category.id,
        restaurantId: restaurant.id,
      },
    });

    // Nutrition
    if (nutrition) {
      await prisma.nutrition.upsert({
        where: { dishId: dish.id },
        update: {},
        create: {
          ...nutrition,
          dishId: dish.id,
        },
      });
    }

    // Allergens
    for (const allergen of allergens) {
      await prisma.dishAllergen.upsert({
        where: {
          dishId_allergen: {
            dishId: dish.id,
            allergen,
          },
        },
        update: {},
        create: {
          dishId: dish.id,
          allergen,
        },
      });
    }

    // Ingredients
    if (ingredients) {
      // Delete existing ingredients first (no unique constraint to upsert on)
      await prisma.dishIngredient.deleteMany({ where: { dishId: dish.id } });
      for (const ing of ingredients) {
        await prisma.dishIngredient.create({
          data: {
            ...ing,
            dishId: dish.id,
          },
        });
      }
    }
  }

  console.log(`✅ Dishes: ${dishesData.length} created with nutrition, allergens, and ingredients`);

  // Create tables
  const tablesData = [
    { label: 'T1', capacity: 2, locationZone: 'Indoor' },
    { label: 'T2', capacity: 4, locationZone: 'Indoor' },
    { label: 'T3', capacity: 4, locationZone: 'Indoor' },
    { label: 'T4', capacity: 6, locationZone: 'Indoor' },
    { label: 'P1', capacity: 4, locationZone: 'Patio' },
    { label: 'P2', capacity: 8, locationZone: 'Patio' },
  ];

  for (const tableData of tablesData) {
    const table = await prisma.table.upsert({
      where: {
        label_restaurantId: {
          label: tableData.label,
          restaurantId: restaurant.id,
        },
      },
      update: {},
      create: {
        ...tableData,
        restaurantId: restaurant.id,
      },
    });

    // Create QR code for each table
    const token = `${restaurant.slug}-${tableData.label.toLowerCase()}-${Math.random().toString(36).substring(2, 8)}`;
    await prisma.qrCode.upsert({
      where: { token },
      update: {},
      create: {
        token,
        tableId: table.id,
        restaurantId: restaurant.id,
      },
    });
  }

  console.log(`✅ Tables: ${tablesData.length} created with QR codes`);

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
