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
  notes?: string;
  seatNumber?: number; // Added for split checks
}

export interface Order {
  id: string;
  restaurantId?: string;
  orderNumber: string;
  tableId: string;
  waiterId: string;
  status: 'draft' | 'sent_to_kitchen' | 'served' | 'closed' | 'cancelled' | 'pending' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  checkRequestedAt?: string | null; // When check was requested
  items?: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
}

export interface CreateOrderRequest {
  restaurantId: string;
  tableId: string;
  waiterId: string;
  items?: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
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
    return apiClient.post<Order>('/v1/orders', data);
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
    return apiClient.get<{ orders: Order[]; total: number }>(`/v1/orders${queryString}`);
  }

  /**
   * Get a specific order
   */
  async getOrder(orderId: string): Promise<Order> {
    return apiClient.get<Order>(`/v1/orders/${orderId}`);
  }

  /**
   * Update an order (status, discount, tip)
   */
  async updateOrder(orderId: string, data: UpdateOrderRequest): Promise<Order> {
    return apiClient.put<Order>(`/v1/orders/${orderId}`, data);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    await apiClient.delete(`/v1/orders/${orderId}`);
  }

  /**
   * Add item to an existing order
   */
  async addItemToOrder(orderId: string, data: AddOrderItemRequest): Promise<Order> {
    return apiClient.post<Order>(`/v1/orders/${orderId}/items`, data);
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

  /**
   * Request check (bill) for an order - generates customer receipt
   */
  async requestCheck(orderId: string): Promise<{ ok: boolean; message: string; order: { id: string; orderNumber: string; checkRequestedAt: string } }> {
    return apiClient.post(`/v1/orders/${orderId}/request-check`);
  }

  /**
   * Cancel check request (reset check_requested_at) - for cashier
   */
  async cancelCheck(orderId: string): Promise<{ ok: boolean; message: string; order: { id: string; orderNumber: string; checkRequestedAt: null } }> {
    return apiClient.post(`/v1/orders/${orderId}/cancel-check`);
  }

  /**
   * Get order status history
   */
  async getOrderHistory(orderId: string): Promise<{ history: any[] }> {
    return apiClient.get<{ history: any[] }>(`/v1/orders/${orderId}/history`);
  }
}

export const orderService = new OrderService();
