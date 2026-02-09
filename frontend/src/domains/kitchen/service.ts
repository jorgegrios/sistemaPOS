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
  async getActiveItems(station?: 'kitchen' | 'bar'): Promise<KitchenOrderItem[]> {
    const query = station ? `?station=${station}` : '';
    const response = await apiClient.get<{ items: KitchenOrderItem[] }>(`/v2/kitchen/active-items${query}`);
    return response.items;
  }

  /**
   * Get Kitchen Orders (grouped by order)
   */
  async getKitchenOrders(station?: 'kitchen' | 'bar'): Promise<{ orders: KitchenOrder[]; serverTime: string }> {
    const query = station ? `?station=${station}` : '';
    return apiClient.get<{ orders: KitchenOrder[]; serverTime: string }>(`/v2/kitchen/orders${query}`);
  }

  /**
   * Get Kitchen Items by Order
   */
  async getItemsByOrder(orderId: string, station?: 'kitchen' | 'bar'): Promise<KitchenOrderItem[]> {
    const query = station ? `?station=${station}` : '';
    const response = await apiClient.get<{ items: KitchenOrderItem[] }>(`/v2/kitchen/orders/${orderId}/items${query}`);
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
  async getServedOrders(station?: 'kitchen' | 'bar'): Promise<KitchenOrder[]> {
    const query = station ? `?station=${station}` : '';
    const response = await apiClient.get<{ orders: KitchenOrder[] }>(`/v2/kitchen/served-orders${query}`);
    return response.orders;
  }
}

export const kitchenDomainService = new KitchenDomainService();


