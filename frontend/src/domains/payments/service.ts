/**
 * Payments Domain Service (Frontend)
 * Uses new v2 API endpoints
 * SSOT: All payment operations use this service
 */

import { apiClient } from '../../services/api-client';

export type PaymentMethod = 'cash' | 'card' | 'split';
export type PaymentStatus = 'pending' | 'completed';

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  currency: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  currency?: string;
}

export interface SplitPaymentRequest {
  orderId: string;
  payments: Array<{
    method: PaymentMethod;
    amount: number;
  }>;
  currency?: string;
}

class PaymentsDomainService {
  /**
   * Create Payment
   * RULE: method(cash,card,split), status(pending,completed)
   */
  async createPayment(request: CreatePaymentRequest): Promise<Payment> {
    return apiClient.post<Payment>('/v2/payments', request);
  }

  /**
   * Process Payment (mark as completed)
   * RULE: Only if payment status is 'pending'
   */
  async processPayment(paymentId: string): Promise<Payment> {
    return apiClient.post<Payment>(`/v2/payments/${paymentId}/process`, {});
  }

  /**
   * Create Split Payment
   * RULE: Multiple payments for one order
   */
  async createSplitPayment(request: SplitPaymentRequest): Promise<Payment[]> {
    const response = await apiClient.post<{ payments: Payment[] }>('/v2/payments', {
      method: 'split',
      ...request,
    });
    return response.payments;
  }

  /**
   * Get Payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    return apiClient.get<Payment>(`/v2/payments/${paymentId}`);
  }

  /**
   * Get Payments by Order
   */
  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    const response = await apiClient.get<{ payments: Payment[] }>(`/v2/payments/order/${orderId}`);
    return response.payments;
  }

  /**
   * Cancel Payment
   * RULE: Only if status is 'pending'
   */
  async cancelPayment(paymentId: string): Promise<void> {
    await apiClient.post(`/v2/payments/${paymentId}/cancel`, {});
  }
}

export const paymentsDomainService = new PaymentsDomainService();





