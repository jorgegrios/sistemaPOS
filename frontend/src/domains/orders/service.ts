/**
 * Orders Domain Service (Frontend)
 * Uses new v2 API endpoints with idempotency and ALDELO specification
 * SSOT: All order operations use this service
 */

import { apiClient } from '../../services/api-client';

export type OrderStatus = 'draft' | 'sent_to_kitchen' | 'served' | 'closed' | 'cancelled';
export type OrderItemStatus = 'pending' | 'sent' | 'prepared' | 'served';

export interface Order {
  id: string;
  tableId: string;
  waiterId: string;
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
  priceSnapshot: number;
  status: OrderItemStatus;
  notes?: string;
  createdAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderRequest {
  tableId: string;
  waiterId: string;
}

export interface AddItemsRequest {
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
}

class OrdersDomainService {
  /**
   * Create Order (Idempotent)
   * RULE: Returns existing order if active order exists for table
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>('/v2/orders', request);
  }

  /**
   * Get Order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    return apiClient.get<Order>(`/v2/orders/${orderId}`);
  }

  /**
   * Get Order with Items
   */
  async getOrderWithItems(orderId: string): Promise<OrderWithItems> {
    return apiClient.get<OrderWithItems>(`/v2/orders/${orderId}`);
  }

  /**
   * Add Items to Order
   * RULE: Only if order is in 'draft' status
   */
  async addItemsToOrder(orderId: string, request: AddItemsRequest): Promise<OrderItem[]> {
    const response = await apiClient.post<{ items: OrderItem[] }>(`/v2/orders/${orderId}/items`, request);
    return response.items;
  }

  /**
   * Remove All Items from Order
   * RULE: Only if order is in 'draft' status
   * Used to sync cart with database before sending to kitchen
   */
  async removeAllItemsFromOrder(orderId: string): Promise<void> {
    await apiClient.delete(`/v2/orders/${orderId}/items`);
  }

  /**
   * Send Order to Kitchen (Idempotent)
   * RULE: Does nothing if already sent
   */
  async sendToKitchen(orderId: string): Promise<Order> {
    return apiClient.post<Order>(`/v2/orders/${orderId}/send-to-kitchen`, {});
  }

  /**
   * Mark Order as Served
   * RULE: Only if all items are prepared
   */
  async markAsServed(orderId: string): Promise<Order> {
    return apiClient.post<Order>(`/v2/orders/${orderId}/serve`, {});
  }

  /**
   * Close Order
   * RULE: Only if all items served and payment completed
   */
  async closeOrder(orderId: string): Promise<Order> {
    return apiClient.post<Order>(`/v2/orders/${orderId}/close`, {});
  }

  /**
   * Cancel Order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    return apiClient.post<Order>(`/v2/orders/${orderId}/cancel`, {});
  }
}

export const ordersDomainService = new OrdersDomainService();

