/**
 * Kitchen Domain Service (Frontend) - KDS
 * Uses new v2 API endpoints
 * SSOT: All kitchen operations use this service
 */

import { apiClient } from '../../services/api-client';
import { OrderItemStatus } from '../orders/service';

export interface KitchenTask {
  id: string;
  orderItemId: string;
  stationId: string;
  stationName: string;
  componentName: string; // e.g. "Carne"
  status: OrderItemStatus;
  createdAt: string;
  completedAt?: string;
}

export interface KitchenStation {
  id: string;
  name: string;
  isDefault: boolean;
}

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
  tasks?: KitchenTask[]; // New field
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
  async getActiveItems(stationId?: string): Promise<KitchenOrderItem[]> {
    const query = stationId ? `?stationId=${stationId}` : '';
    const response = await apiClient.get<{ items: KitchenOrderItem[] }>(`/v2/kitchen/active-items${query}`);
    return response.items;
  }

  /**
   * Get Kitchen Orders (grouped by order)
   */
  async getKitchenOrders(stationId?: string): Promise<{ orders: KitchenOrder[]; serverTime: string }> {
    // Determine if stationId is one of the old 'kitchen'/'bar' or a UUID
    // The backend now accepts stationId for UUIDs, and logic for 'kitchen'/'bar' is legacy/fallback
    const query = stationId ? `?stationId=${stationId}` : '';
    return apiClient.get<{ orders: KitchenOrder[]; serverTime: string }>(`/v2/kitchen/orders${query}`);
  }

  /**
   * Get Kitchen Items by Order
   */
  async getItemsByOrder(orderId: string, stationId?: string): Promise<KitchenOrderItem[]> {
    const query = stationId ? `?stationId=${stationId}` : '';
    const response = await apiClient.get<{ items: KitchenOrderItem[] }>(`/v2/kitchen/orders/${orderId}/items${query}`);
    return response.items;
  }

  /**
   * Mark Kitchen Task as Prepared
   */
  async markTaskPrepared(taskId: string): Promise<KitchenTask> {
    return apiClient.post<KitchenTask>(`/v2/kitchen/tasks/${taskId}/prepare`, {});
  }

  /**
   * Mark Order Item as Prepared (Legacy/Full Item)
   */
  async markItemPrepared(orderItemId: string): Promise<KitchenOrderItem> {
    return apiClient.post<KitchenOrderItem>(`/v2/kitchen/items/${orderItemId}/prepare`, {});
  }

  /**
   * Get Served Orders (orders with all items served)
   */
  async getServedOrders(stationId?: string): Promise<KitchenOrder[]> {
    const query = stationId ? `?stationId=${stationId}` : '';
    const response = await apiClient.get<{ orders: KitchenOrder[] }>(`/v2/kitchen/served-orders${query}`);
    return response.orders;
  }

  /**
   * Get All Kitchen Stations
   */
  async getStations(): Promise<KitchenStation[]> {
    const response = await apiClient.get<{ stations: KitchenStation[] }>(`/v2/kitchen/stations`);
    return response.stations;
  }
}

export const kitchenDomainService = new KitchenDomainService();
