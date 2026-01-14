/**
 * Bar Domain Service (Frontend) - Bar Display System
 * Uses new v2 API endpoints
 * SSOT: All bar operations use this service
 */

import { apiClient } from '../../services/api-client';
import { OrderItemStatus } from '../orders/service';

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

class BarDomainService {
  /**
   * Get Active Bar Items
   * RULE: Only shows items with status = 'sent' or 'prepared' from bar categories
   */
  async getActiveItems(): Promise<BarOrderItem[]> {
    const response = await apiClient.get<{ items: BarOrderItem[] }>('/v2/bar/active-items');
    return response.items;
  }

  /**
   * Get Bar Orders (grouped by order)
   */
  async getBarOrders(): Promise<BarOrder[]> {
    const response = await apiClient.get<{ orders: BarOrder[] }>('/v2/bar/orders');
    return response.orders;
  }

  /**
   * Get Bar Items by Order
   */
  async getItemsByOrder(orderId: string): Promise<BarOrderItem[]> {
    const response = await apiClient.get<{ items: BarOrderItem[] }>(`/v2/bar/orders/${orderId}/items`);
    return response.items;
  }

  /**
   * Mark Order Item as Prepared
   * RULE: Only mark items with status = 'sent' as 'prepared'
   */
  async markItemPrepared(orderItemId: string): Promise<BarOrderItem> {
    return apiClient.post<BarOrderItem>(`/v2/bar/items/${orderItemId}/prepare`, {});
  }

  /**
   * Get Served Bar Orders (orders with all items prepared or served)
   */
  async getServedOrders(): Promise<BarOrder[]> {
    console.log('[BarDomainService] Fetching served orders from /v2/bar/served-orders');
    const response = await apiClient.get<{ orders: BarOrder[] }>('/v2/bar/served-orders');
    console.log('[BarDomainService] Received response:', response);
    console.log('[BarDomainService] Number of orders:', response.orders?.length || 0);
    return response.orders || [];
  }
}

export const barDomainService = new BarDomainService();





