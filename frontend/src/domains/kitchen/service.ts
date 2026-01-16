/**
 * Kitchen Domain Service (Frontend) - KDS
 * Uses new v2 API endpoints
 * SSOT: All kitchen operations use this service
 */

import { apiClient } from '../../services/api-client';
import { OrderItemStatus } from '../orders/service';

export interface KitchenOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  status: OrderItemStatus;
  sentAt: string;
  seatNumber?: number;
  notes?: string; // Internal notes/modifiers
}

export interface KitchenOrder {
  orderId: string;
  orderNumber: string;
  tableNumber: string;
  items: KitchenOrderItem[];
  createdAt: string; // Fecha/hora cuando el mesero tomó la orden
  servedAt?: string; // Fecha/hora cuando se entregó (solo para órdenes servidas)
}

class KitchenDomainService {
  /**
   * Get Active Kitchen Items
   * RULE: Only shows items with status = 'sent' or 'prepared'
   */
  async getActiveItems(): Promise<KitchenOrderItem[]> {
    const response = await apiClient.get<{ items: KitchenOrderItem[] }>('/v2/kitchen/active-items');
    return response.items;
  }

  /**
   * Get Kitchen Orders (grouped by order)
   */
  async getKitchenOrders(): Promise<KitchenOrder[]> {
    const response = await apiClient.get<{ orders: KitchenOrder[] }>('/v2/kitchen/orders');
    return response.orders;
  }

  /**
   * Get Kitchen Items by Order
   */
  async getItemsByOrder(orderId: string): Promise<KitchenOrderItem[]> {
    const response = await apiClient.get<{ items: KitchenOrderItem[] }>(`/v2/kitchen/orders/${orderId}/items`);
    return response.items;
  }

  /**
   * Mark Order Item as Prepared
   * RULE: Only mark items with status = 'sent' as 'prepared'
   */
  async markItemPrepared(orderItemId: string): Promise<KitchenOrderItem> {
    return apiClient.post<KitchenOrderItem>(`/v2/kitchen/items/${orderItemId}/prepare`, {});
  }

  /**
   * Get Served Orders (orders with all items served)
   */
  async getServedOrders(): Promise<KitchenOrder[]> {
    const response = await apiClient.get<{ orders: KitchenOrder[] }>('/v2/kitchen/served-orders');
    return response.orders;
  }
}

export const kitchenDomainService = new KitchenDomainService();


