/**
 * Payment Service
 * Handles payment processing with multiple providers
 */

import { apiClient } from './api-client';

export type PaymentProvider = 'stripe' | 'square' | 'mercado_pago' | 'paypal';

export interface Payment {
  id: string;
  transaction_id?: string;
  transactionId?: string;
  order_id?: string;
  orderId?: string;
  payment_provider?: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  created_at?: string;
  createdAt?: string;
}

export interface ProcessPaymentRequest {
  orderId?: string; // Optional: can be undefined for general payments
  provider: PaymentProvider;
  amount: number;
  currency?: string;
  method?: 'card' | 'cash' | 'qr' | 'wallet';
  paymentMethodId?: string;
  token?: string;
  idempotencyKey?: string;
  tip?: number;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  amount?: number;
  reason?: string;
}

class PaymentService {
  /**
   * Process a payment through a provider
   */
  async processPayment(data: ProcessPaymentRequest): Promise<Payment> {
    // Map frontend format to backend format
    const backendData = {
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency || 'USD',
      method: data.method || 'card',
      provider: data.provider,
      paymentMethodId: data.paymentMethodId || data.token,
      idempotencyKey: data.idempotencyKey,
      tip: data.tip,
      metadata: data.metadata
    };
    return apiClient.post<Payment>('/payments/process', backendData);
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<Payment> {
    return apiClient.get<Payment>(`/payments/${paymentId}`);
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, data?: RefundRequest): Promise<Payment> {
    return apiClient.post<Payment>(`/payments/${paymentId}/refund`, data || {});
  }

  /**
   * Process payment with Stripe
   */
  async processStripePayment(
    orderId: string,
    amount: number,
    token: string,
    currency: string = 'USD'
  ): Promise<Payment> {
    return this.processPayment({
      orderId,
      provider: 'stripe',
      amount,
      currency,
      token,
      metadata: { provider: 'stripe' }
    });
  }

  /**
   * Process payment with Square
   */
  async processSquarePayment(
    orderId: string,
    amount: number,
    token: string,
    currency: string = 'USD'
  ): Promise<Payment> {
    return this.processPayment({
      orderId,
      provider: 'square',
      amount,
      currency,
      token,
      metadata: { provider: 'square' }
    });
  }

  /**
   * Process payment with Mercado Pago
   */
  async processMercadoPagoPayment(
    orderId: string,
    amount: number,
    token: string,
    currency: string = 'ARS'
  ): Promise<Payment> {
    return this.processPayment({
      orderId,
      provider: 'mercado_pago',
      amount,
      currency,
      token,
      metadata: { provider: 'mercado_pago' }
    });
  }

  /**
   * Process payment with PayPal
   */
  async processPayPalPayment(
    orderId: string,
    amount: number,
    token: string,
    currency: string = 'USD'
  ): Promise<Payment> {
    return this.processPayment({
      orderId,
      provider: 'paypal',
      amount,
      currency,
      token,
      metadata: { provider: 'paypal' }
    });
  }

  /**
   * Get all payments with optional filters
   */
  async getPayments(params?: {
    orderId?: string;
    status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
    provider?: PaymentProvider;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: Payment[]; total: number; limit: number; offset: number }> {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return apiClient.get<{ payments: Payment[]; total: number; limit: number; offset: number }>(
      `/payments${queryString}`
    );
  }

  /**
   * Check if payment succeeded
   */
  isPaymentSuccessful(payment: Payment): boolean {
    return payment.status === 'succeeded';
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount / 100);
  }

  /**
   * Get Stripe configuration (publishable key)
   */
  async getStripeConfig(): Promise<{ publishableKey: string; enabled: boolean }> {
    return apiClient.get<{ publishableKey: string; enabled: boolean }>(
      '/payments/stripe/config'
    );
  }
}

export const paymentService = new PaymentService();
