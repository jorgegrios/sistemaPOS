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






