/**
 * Kitchen Domain Types (KDS - Kitchen Display System)
 * SSOT: Kitchen types defined here
 */

import { OrderItemStatus } from '../../shared/types';

export interface KitchenOrderItem {
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

export interface KitchenOrder {
  orderId: string;
  orderNumber: string;
  tableNumber: string;
  items: KitchenOrderItem[];
  createdAt: string; // Fecha/hora cuando el mesero tomó la orden
  servedAt?: string; // Fecha/hora cuando se entregó (solo para órdenes servidas)
}


