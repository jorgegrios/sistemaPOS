/**
 * Payment Service
 * Handles payment processing with multiple providers
 * SSOT: Updated for modular v2 API with fiscal breakdown and PCI compliance
 */

import { apiClient } from './api-client';

export type PaymentMethod = 'card' | 'cash' | 'qr' | 'wallet' | 'split';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentPrintData {
  orderId: string;
  transactionId: string;
  amount: number;
  method: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  tip: number;
  maskedCard?: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  currency: string;
  createdAt: string;
  completedAt?: string;
  subtotalAmount?: number;
  taxAmount?: number;
  serviceCharge?: number;
  tipAmount?: number;
  maskedCard?: string;
  transactionId?: string;
  print_data?: PaymentPrintData;
}

export interface ProcessPaymentRequest {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  currency?: string;
  subtotalAmount?: number;
  taxAmount?: number;
  serviceCharge?: number;
  tipAmount?: number;
  paymentToken?: string; // PCI Token for cards
}

class PaymentService {
  /**
   * Process a payment through the modular v2 API
   */
  async processPayment(data: ProcessPaymentRequest): Promise<Payment> {
    // PRECAUCIÓN: EL FRONTEND NUNCA DEBE ENVIAR PAN O CVV DIRECTAMENTE AL BACKEND.
    // Solo enviamos tokens generados por el SDK del proveedor.
    return apiClient.post<Payment>('/v2/payments', data);
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<Payment> {
    return apiClient.get<Payment>(`/v2/payments/${paymentId}`);
  }

  /**
   * Get payments for a specific order
   */
  async getOrderPayments(orderId: string): Promise<{ payments: Payment[] }> {
    return apiClient.get<{ payments: Payment[] }>(`/v2/payments/order/${orderId}`);
  }

  /**
   * Format currency (utility)
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Get Stripe configuration (publishable key)
   */
  async getStripeConfig(): Promise<{ publishableKey: string | null; enabled: boolean }> {
    return apiClient.get<{ publishableKey: string | null; enabled: boolean }>(
      '/v1/payments/stripe/config'
    );
  }
}

export const paymentService = new PaymentService();
