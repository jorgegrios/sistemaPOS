/**
 * Cashier Service
 * Frontend service for cashier view
 */

import { apiClient } from './api-client';

export interface ActiveTable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  isActive: boolean; // true if has pending orders
  orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    subtotal: number;
    tax: number;
    tip: number;
    paymentStatus: string;
    orderStatus?: string; // 'sent_to_kitchen', 'served', etc.
    checkRequestedAt: string | null; // When check was requested
    itemCount: number;
    servedCount?: number; // Number of items served
    createdAt: string;
  }>;
}

export interface CashRegisterSummary {
  date: string;
  cashBase: number;
  totalCash: number;
  totalCard: number;
  totalOther: number;
  totalAmount: number;
  totalTransactions: number;
  expectedCash: number;
  totalsByMethod: Record<string, { count: number; total: number }>;
  payments: Array<{
    id: string;
    orderId: string | null;
    orderNumber: string | null;
    tableNumber: string | null;
    paymentMethod: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export interface PaidOrder {
  id: string;
  orderNumber: string;
  tableId: string | null;
  tableNumber: string | null;
  waiterName: string | null;
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  paymentStatus: string;
  paidAt: string;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes: string | null;
    status: string;
    isCancelled: boolean;
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  cancelledItems: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes: string | null;
  }>;
  cancelledItemsTotal: number;
}

export interface PaidOrdersResponse {
  orders: PaidOrder[];
  total: number;
  limit: number;
  offset: number;
}

export interface CashSession {
  id: string;
  restaurantId: string;
  userId: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  expectedBalance: number;
  actualBalance?: number;
  status: 'open' | 'closed';
}

export interface CashMovement {
  id: string;
  sessionId: string;
  type: 'in' | 'out';
  amount: number;
  description: string;
  createdAt: string;
}

class CashierService {
  /**
   * Get active tables (tables with pending orders)
   */
  async getActiveTables(): Promise<ActiveTable[]> {
    const response = await apiClient.get<{ tables: ActiveTable[] }>('/v1/cashier/active-tables');
    return response.tables;
  }

  /**
   * Get cash register summary for today
   */
  async getCashRegisterSummary(): Promise<CashRegisterSummary> {
    return apiClient.get<CashRegisterSummary>('/v1/cashier/cash-register-summary');
  }

  /**
   * Get paid orders with details
   */
  async getPaidOrders(date?: string, limit?: number, offset?: number): Promise<PaidOrdersResponse> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const query = params.toString();
    const url = `/v1/cashier/paid-orders${query ? `?${query}` : ''}`;
    console.log('[CashierService] Fetching paid orders from:', url);
    try {
      const response = await apiClient.get<PaidOrdersResponse>(url);
      console.log('[CashierService] Paid orders response:', response);
      return response;
    } catch (error: any) {
      console.error('[CashierService] Error fetching paid orders:', error);
      throw error;
    }
  }

  /**
   * Get current open cash session
   */
  async getCurrentSession(): Promise<CashSession | null> {
    const response = await apiClient.get<{ session: CashSession | null }>('/v2/cashier/sessions/current');
    return response.session;
  }

  /**
   * Open a new cash session
   */
  async openSession(openingBalance: number): Promise<CashSession> {
    const response = await apiClient.post<{ session: CashSession }>('/v2/cashier/sessions/open', { openingBalance });
    return response.session;
  }

  /**
   * Close a cash session
   */
  async closeSession(sessionId: string, actualBalance: number): Promise<CashSession> {
    const response = await apiClient.post<{ session: CashSession }>(`/v2/cashier/sessions/${sessionId}/close`, { actualBalance });
    return response.session;
  }

  /**
   * Add manual cash movement
   */
  async addMovement(request: { sessionId: string; type: 'in' | 'out'; amount: number; description: string }): Promise<CashMovement> {
    const response = await apiClient.post<{ movement: CashMovement }>('/v2/cashier/movements', request);
    return response.movement;
  }
}

export const cashierService = new CashierService();
