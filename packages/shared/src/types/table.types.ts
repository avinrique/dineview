export interface Table {
  id: string;
  label: string;
  capacity: number;
  isActive: boolean;
  locationZone: string | null;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
  qrCodes?: QrCode[];
}

export interface QrCode {
  id: string;
  token: string;
  isActive: boolean;
  scannedCount: number;
  tableId: string;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableRequest {
  label: string;
  capacity: number;
  locationZone?: string;
}

export interface UpdateTableRequest {
  label?: string;
  capacity?: number;
  isActive?: boolean;
  locationZone?: string;
}
