/**
 * Payment Service
 * Handles payment processing with multiple providers
 */

import { apiClient } from './api-client';

export type PaymentProvider = 'stripe' | 'square' | 'mercado_pago' | 'paypal';

export interface Payment {
  id: string;
  transactionId: string;
  orderId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  createdAt: string;
}

export interface ProcessPaymentRequest {
  orderId: string;
  provider: PaymentProvider;
  amount: number;
  currency?: string;
  token?: string;
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
    return apiClient.post<Payment>('/payments/process', data);
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
}

export const paymentService = new PaymentService();
