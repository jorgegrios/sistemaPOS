/**
 * Order Service
 * Handles order creation, management, and operations
 */

import { apiClient } from './api-client';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  orderNumber: string;
  tableId: string;
  waiterId: string;
  status: 'pending' | 'completed' | 'cancelled';
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  restaurantId: string;
  tableId: string;
  waiterId: string;
  items?: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

export interface UpdateOrderRequest {
  status?: 'pending' | 'completed' | 'cancelled';
  discount?: number;
  tip?: number;
}

export interface AddOrderItemRequest {
  menuItemId: string;
  quantity: number;
}

class OrderService {
  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>('/orders', data);
  }

  /**
   * Get all orders with optional filters
   */
  async getOrders(params?: {
    restaurantId?: string;
    status?: 'pending' | 'completed' | 'cancelled';
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return apiClient.get<{ orders: Order[]; total: number }>(`/orders${queryString}`);
  }

  /**
   * Get a specific order
   */
  async getOrder(orderId: string): Promise<Order> {
    return apiClient.get<Order>(`/orders/${orderId}`);
  }

  /**
   * Update an order (status, discount, tip)
   */
  async updateOrder(orderId: string, data: UpdateOrderRequest): Promise<Order> {
    return apiClient.put<Order>(`/orders/${orderId}`, data);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    await apiClient.delete(`/orders/${orderId}`);
  }

  /**
   * Add item to an existing order
   */
  async addItemToOrder(orderId: string, data: AddOrderItemRequest): Promise<Order> {
    return apiClient.post<Order>(`/orders/${orderId}/items`, data);
  }

  /**
   * Mark order as completed
   */
  async completeOrder(orderId: string): Promise<Order> {
    return this.updateOrder(orderId, { status: 'completed' });
  }

  /**
   * Add tip to order
   */
  async addTip(orderId: string, tipAmount: number): Promise<Order> {
    return this.updateOrder(orderId, { tip: tipAmount });
  }

  /**
   * Apply discount to order
   */
  async applyDiscount(orderId: string, discountAmount: number): Promise<Order> {
    return this.updateOrder(orderId, { discount: discountAmount });
  }
}

export const orderService = new OrderService();
