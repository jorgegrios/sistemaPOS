/**
 * Payments Domain Service
 * Manages payments and payment processing
 * SSOT: All payment operations go through this service
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Payment, CreatePaymentRequest, SplitPaymentRequest } from './types';
import { PaymentMethod, PaymentStatus } from '../../shared/types';
import { emitEvent, DomainEventType } from '../../shared/events';

export class PaymentsService {
  constructor(private pool: Pool) {}

  /**
   * Create Payment
   * RULE: method(cash,card,split), status(pending,completed)
   */
  async createPayment(request: CreatePaymentRequest): Promise<Payment> {
    const paymentId = uuidv4();
    const currency = request.currency || 'USD';
    
    // For cash payments, mark as completed immediately
    const initialStatus = request.method === 'cash' ? 'completed' : 'pending';

    const result = await this.pool.query(
      `INSERT INTO payment_transactions (
        id, order_id, payment_method, amount, currency, status
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, order_id, payment_method, amount, currency, status, created_at`,
      [paymentId, request.orderId, request.method, request.amount, currency, initialStatus]
    );

    const payment = this.mapRowToPayment(result.rows[0]);

    // For cash payments, also update order payment_status immediately
    if (request.method === 'cash' && initialStatus === 'completed') {
      await this.pool.query(
        `UPDATE orders 
         SET payment_status = 'paid', paid_at = NOW()
         WHERE id = $1 AND payment_status = 'pending'`,
        [request.orderId]
      );
    }

    return payment;
  }

  /**
   * Process Payment (mark as completed)
   * RULE: Only if payment status is 'pending'
   * NOTE: Idempotent - if already completed, returns the payment without error
   */
  async processPayment(paymentId: string): Promise<Payment> {
    // Verify payment exists
    const payment = await this.getPayment(paymentId);

    // If already completed, return it (idempotent operation)
    if (payment.status === 'completed') {
      return payment;
    }

    // If not pending, throw error (only pending payments can be processed)
    if (payment.status !== 'pending') {
      throw new Error(`Cannot process payment with status: ${payment.status}`);
    }

    // Mark payment as completed
    await this.pool.query(
      `UPDATE payment_transactions 
       SET status = 'completed', updated_at = NOW()
       WHERE id = $1`,
      [paymentId]
    );

    // Update order payment_status to 'paid'
    await this.pool.query(
      `UPDATE orders 
       SET payment_status = 'paid', paid_at = NOW()
       WHERE id = $1 AND payment_status = 'pending'`,
      [payment.orderId]
    );

    const updatedPayment = await this.getPayment(paymentId);

    // Emit event
    emitEvent(DomainEventType.PAYMENT_COMPLETED, {
      orderId: payment.orderId,
      amount: payment.amount,
      method: payment.method,
    } as any);

    // Check if order can be closed (all items served and payment completed)
    // Note: Actual closing is handled by orders service via event listener
    // The event is emitted, and the orders service will handle the closing logic

    return updatedPayment;
  }

  /**
   * Create Split Payment
   * RULE: Multiple payments for one order (method = 'split')
   */
  async createSplitPayment(request: SplitPaymentRequest): Promise<Payment[]> {
    const currency = request.currency || 'USD';
    const payments: Payment[] = [];

    for (const paymentReq of request.payments) {
      const paymentId = uuidv4();

      const result = await this.pool.query(
        `INSERT INTO payment_transactions (
          id, order_id, payment_method, amount, currency, status
         )
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING id, order_id, payment_method, amount, currency, status, created_at`,
        [paymentId, request.orderId, paymentReq.method, paymentReq.amount, currency]
      );

      payments.push(this.mapRowToPayment(result.rows[0]));
    }

    // Process all split payments
    for (const payment of payments) {
      await this.processPayment(payment.id);
    }

    return payments;
  }

  /**
   * Get Payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    const result = await this.pool.query(
      `SELECT id, order_id, payment_method, amount, currency, status, created_at, updated_at
       FROM payment_transactions WHERE id = $1`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    return this.mapRowToPayment(result.rows[0]);
  }

  /**
   * Get Payments by Order
   */
  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    const result = await this.pool.query(
      `SELECT id, order_id, payment_method, amount, currency, status, created_at, updated_at
       FROM payment_transactions 
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [orderId]
    );

    return result.rows.map(row => this.mapRowToPayment(row));
  }

  /**
   * Cancel Payment
   * RULE: Only if status is 'pending'
   */
  async cancelPayment(paymentId: string): Promise<void> {
    const payment = await this.getPayment(paymentId);

    if (payment.status !== 'pending') {
      throw new Error(`Cannot cancel payment with status: ${payment.status}`);
    }

    await this.pool.query(
      `UPDATE payment_transactions 
       SET status = 'failed', updated_at = NOW()
       WHERE id = $1`,
      [paymentId]
    );

    emitEvent(DomainEventType.PAYMENT_FAILED, {
      orderId: payment.orderId,
      amount: payment.amount,
      method: payment.method,
    } as any);
  }

  /**
   * Map database row to Payment
   */
  private mapRowToPayment(row: any): Payment {
    return {
      id: row.id,
      orderId: row.order_id,
      method: row.payment_method as PaymentMethod,
      amount: parseFloat(row.amount),
      status: row.status as PaymentStatus,
      currency: row.currency,
      createdAt: row.created_at.toISOString(),
      completedAt: row.updated_at && row.status === 'completed' ? row.updated_at.toISOString() : undefined,
    };
  }
}

