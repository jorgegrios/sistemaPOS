/**
 * Tables Domain Types
 * SSOT: Table types defined here
 */

import { TableStatus } from '../../shared/types';

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  restaurantId: string;
  createdAt: string;
}

export interface CreateTableRequest {
  name: string;
  capacity: number;
  restaurantId: string;
}

export interface UpdateTableRequest {
  name?: string;
  capacity?: number;
  status?: TableStatus;
}

export interface TableWithOrder extends Table {
  activeOrderId?: string;
  activeOrderTotal?: number;
}





