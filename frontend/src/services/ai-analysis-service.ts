/**
 * AI Analysis Service
 * Frontend service for AI-powered business insights
 */

import { apiClient } from './api-client';

export interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  topSellingItems: Array<{ name: string; quantity: number; revenue: number }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
}

export interface PurchaseData {
  totalSpent: number;
  totalOrders: number;
  receivedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  topSuppliers: Array<{ name: string; orders: number; totalSpent: number }>;
  spendingByDay: Array<{ date: string; spent: number; orders: number }>;
}

export interface BusinessInsights {
  sales: SalesData;
  purchases: PurchaseData;
  aiAnalysis: string;
  recommendations: string[];
  profitMargin: number;
  netProfit: number;
}

class AIAnalysisService {
  /**
   * Get comprehensive business insights
   */
  async getInsights(days: number = 30): Promise<BusinessInsights> {
    return apiClient.get<BusinessInsights>(`/v1/ai-analysis/insights?days=${days}`);
  }
}

export const aiAnalysisService = new AIAnalysisService();



