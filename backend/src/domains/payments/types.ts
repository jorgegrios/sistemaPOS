/**
 * Payments Domain Types
 * SSOT: Payment types defined here
 */

import { PaymentMethod, PaymentStatus } from '../../shared/types';

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  currency: string;
  createdAt: string;
  completedAt?: string;

  // Fiscal Breakdown
  subtotalAmount?: number;
  taxAmount?: number;
  serviceCharge?: number;
  tipAmount?: number;

  // Security/Receipt Info
  maskedCard?: string;
  transactionId?: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  currency?: string;

  // Fiscal Breakdown
  subtotalAmount?: number;
  taxAmount?: number;
  serviceCharge?: number;
  tipAmount?: number;

  // PCI Token (for card payments)
  paymentToken?: string;
}

export interface SplitPaymentRequest {
  orderId: string;
  payments: Array<{
    method: PaymentMethod;
    amount: number;
  }>;
  currency?: string;
}
