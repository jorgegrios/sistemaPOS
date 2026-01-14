/**
 * Dashboard Service
 * Frontend service for dashboard data
 */

import { apiClient } from './api-client';

export interface DailySummary {
  date: string;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalSales: number;
  cashAmount: number;
  cardAmount: number;
  kitchenSales: number;
  barSales: number;
  baseAmount: number;
  orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      categoryType: string;
    }>;
  }>;
}

class DashboardService {
  /**
   * Get daily summary
   */
  async getDailySummary(): Promise<DailySummary> {
    return apiClient.get<DailySummary>('/v1/dashboard/daily-summary');
  }
}

export const dashboardService = new DashboardService();



