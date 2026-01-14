/**
 * Bar Domain Types (Bar Display System)
 * SSOT: Bar types defined here
 */

import { OrderItemStatus } from '../../shared/types';

export interface BarOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  status: OrderItemStatus;
  notes?: string;
  tableNumber: string;
  orderNumber: string;
  createdAt: string;
  sentAt: string;
}

export interface BarOrder {
  orderId: string;
  orderNumber: string;
  tableNumber: string;
  items: BarOrderItem[];
  createdAt: string;
  servedAt?: string;
}





