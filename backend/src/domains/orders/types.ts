/**
 * Orders Domain Types
 * SSOT: Order types defined here
 */

import { OrderStatus, OrderItemStatus } from '../../shared/types';

export interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  companyId: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName?: string; // Product name (saved when item is created)
  quantity: number;
  priceSnapshot: number; // Frozen price at time of order
  status: OrderItemStatus;
  notes?: string;
  seatNumber?: number;
  createdAt: string;
}

export interface CreateOrderRequest {
  tableId: string;
  waiterId: string;
  companyId: string;
}

export interface AddItemsRequest {
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
    seatNumber?: number;
  }>;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}


