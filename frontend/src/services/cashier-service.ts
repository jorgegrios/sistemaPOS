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
    checkRequestedAt: string | null; // When check was requested
    itemCount: number;
    createdAt: string;
  }>;
}

class CashierService {
  /**
   * Get active tables (tables with pending orders)
   */
  async getActiveTables(): Promise<ActiveTable[]> {
    const response = await apiClient.get<{ tables: ActiveTable[] }>('/cashier/active-tables');
    return response.tables;
  }
}

export const cashierService = new CashierService();

