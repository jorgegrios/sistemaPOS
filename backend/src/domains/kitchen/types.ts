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
  seatNumber?: number;
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

export interface KitchenStation {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface KitchenTask {
  id: string;
  orderItemId: string;
  stationId: string;
  stationName: string; // Joined from stations table
  componentName: string;
  status: OrderItemStatus; // reusing status enum
  createdAt: string;
  completedAt?: string;
}

export interface KitchenOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  status: OrderItemStatus;
  notes?: string;
  seatNumber?: number;
  tableNumber: string;
  orderNumber: string;
  createdAt: string;
  sentAt: string;
  // New field: tasks for this item
  tasks?: KitchenTask[];
}


