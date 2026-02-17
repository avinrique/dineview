export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  currency: string;
  timezone: string;
  subscriptionPlan: SubscriptionPlan;
  settings: RestaurantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantSettings {
  taxRate: number;
  serviceCharge: number;
  autoAcceptOrders: boolean;
  enableAr: boolean;
  primaryColor: string;
  secondaryColor: string;
}

export interface UpdateRestaurantRequest {
  name?: string;
  logo?: string;
  address?: string;
  currency?: string;
  timezone?: string;
  settings?: Partial<RestaurantSettings>;
}
