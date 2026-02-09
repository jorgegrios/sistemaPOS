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
  seatNumber?: number;
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
    seatNumber?: number;
  }>;
}

class OrdersDomainService {
  private queue: Array<{ type: 'create' | 'addItems', data: any }> = [];

  constructor() {
    // Load queue from local storage on init
    try {
      const stored = localStorage.getItem('offlineOrdersQueue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load offline queue', e);
    }

    // Attempt sync when coming online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncQueue());
    }
  }

  private saveQueue() {
    localStorage.setItem('offlineOrdersQueue', JSON.stringify(this.queue));
  }

  /**
   * Create Order (Idempotent)
   * RULE: Returns existing order if active order exists for table
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    if (!navigator.onLine) {
      console.log('Offline: Queueing createOrder');
      this.queue.push({ type: 'create', data: request });
      this.saveQueue();
      // Return optimistic temporary order
      return {
        id: `temp-${Date.now()}`,
        tableId: request.tableId,
        waiterId: request.waiterId,
        status: 'draft',
        subtotal: 0,
        tax: 0,
        total: 0,
        createdAt: new Date().toISOString()
      };
    }
    return apiClient.post<Order>('/v2/orders', request);
  }

  /**
   * Get Order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    // If offline, try to find in local storage or return error/mock
    // For now, let it fail or implementing caching is larger scope
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
    if (!navigator.onLine) {
      console.log('Offline: Queueing addItems');
      this.queue.push({ type: 'addItems', data: { orderId, request } });
      this.saveQueue();
      // Return optimistic items
      return request.items.map((item, i) => ({
        id: `temp-item-${Date.now()}-${i}`,
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        priceSnapshot: 0, // Unknown offline
        status: 'pending',
        notes: item.notes,
        createdAt: new Date().toISOString()
      }));
    }
    const response = await apiClient.post<{ items: OrderItem[] }>(`/v2/orders/${orderId}/items`, request);
    return response.items;
  }

  /**
   * Remove All Items from Order
   * RULE: Only if order is in 'draft' status
   * Used to sync cart with database before sending to kitchen
   */
  async removeAllItemsFromOrder(orderId: string): Promise<void> {
    if (!navigator.onLine) return; // Skip if offline for now
    await apiClient.delete(`/v2/orders/${orderId}/items`);
  }

  /**
   * Cancel or Remove a single item from order
   */
  async cancelOrderItem(orderId: string, itemId: string): Promise<void> {
    if (!navigator.onLine) return;
    await apiClient.delete(`/v2/orders/${orderId}/items/${itemId}`);
  }

  /**
   * Send Order to Kitchen (Idempotent)
   * RULE: Does nothing if already sent
   */
  async sendToKitchen(orderId: string): Promise<Order> {
    if (!navigator.onLine) {
      // Ideally queue this too, but for scope we just warn or let it fail
      // as KDS sync requires network
      throw new Error('Cannot send to kitchen while offline');
    }
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

  /**
   * Sync Queue (Process offline orders)
   */
  async syncQueue() {
    if (this.queue.length === 0) return;

    console.log('Syncing offline queue...');
    const queueCopy = [...this.queue];
    this.queue = [];
    this.saveQueue();

    for (const item of queueCopy) {
      try {
        if (item.type === 'create') {
          await this.createOrder(item.data);
        } else if (item.type === 'addItems') {
          await this.addItemsToOrder(item.data.orderId, item.data.request);
        }
      } catch (err) {
        console.error('Failed to sync item', item, err);
        // Maybe re-queue?
      }
    }
  }
}

export const ordersDomainService = new OrdersDomainService();

