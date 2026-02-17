export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'KITCHEN_STAFF' | 'WAITER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  restaurantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'createdAt' | 'updatedAt'>;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  restaurantId?: string;
}
