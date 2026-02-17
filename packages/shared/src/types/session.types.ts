export type SessionStatus = 'ACTIVE' | 'CLOSED';

export interface TableSession {
  id: string;
  status: SessionStatus;
  guestCount: number;
  startedAt: Date;
  endedAt: Date | null;
  tableId: string;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
  orders?: import('./order.types').Order[];
}

export interface SessionJwtPayload {
  sessionId: string;
  restaurantId: string;
  tableId: string;
  tableLabel: string;
  iat?: number;
  exp?: number;
}

export interface ScanQrResponse {
  sessionToken: string;
  restaurant: {
    id: string;
    name: string;
    logo: string | null;
    currency: string;
    settings: import('./restaurant.types').RestaurantSettings;
  };
  table: {
    id: string;
    label: string;
  };
  session: {
    id: string;
    guestCount: number;
    startedAt: Date;
  };
}
