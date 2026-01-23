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
import { PaymentProviderFactory } from './providers';
import { CashierDomainService } from '../cashier/service';

export class PaymentsService {
  constructor(
    private pool: Pool,
    private cashierService?: CashierDomainService
  ) { }

  /**
   * Create Payment
   * RULE: method(cash,card,split), status(pending,completed)
   * Aisolation: Uses companyId to verify order ownership
   */
  async createPayment(request: CreatePaymentRequest, companyId: string): Promise<Payment> {
    const paymentId = uuidv4();
    const currency = request.currency || 'USD';

    // Security check: Verify order belongs to company
    const orderCheck = await this.pool.query(
      'SELECT id FROM orders WHERE id = $1 AND company_id = $2',
      [request.orderId, companyId]
    );

    if (orderCheck.rows.length === 0) {
      throw new Error(`Order ${request.orderId} not found or unauthorized`);
    }

    // For cash payments, mark as completed immediately
    const initialStatus = request.method === 'cash' ? 'completed' : 'pending';

    // Check for an active cash session if it's a cash payment
    let sessionId: string | null = null;
    if (request.method === 'cash' && this.cashierService) {
      const activeSession = await this.cashierService.getCurrentSession(companyId);
      if (activeSession) {
        sessionId = activeSession.id;
      }
    }

    const result = await this.pool.query(
      `INSERT INTO payment_transactions (
        id, order_id, company_id, payment_method, amount, currency, status,
        subtotal_amount, tax_amount, service_charge, tip_amount, session_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, order_id, payment_method, amount, currency, status, 
                 subtotal_amount, tax_amount, service_charge, tip_amount, 
                 session_id, created_at`,
      [
        paymentId,
        request.orderId,
        companyId,
        request.method,
        request.amount,
        currency,
        initialStatus,
        request.subtotalAmount || 0,
        request.taxAmount || 0,
        request.serviceCharge || 0,
        request.tipAmount || 0,
        sessionId
      ]
    );

    const payment = this.mapRowToPayment(result.rows[0]);

    // For cash payments, also update order payment_status immediately
    if (request.method === 'cash' && initialStatus === 'completed') {
      await this.pool.query(
        `UPDATE orders 
         SET payment_status = 'paid', paid_at = NOW()
         WHERE id = $1 AND company_id = $2 AND payment_status = 'pending'`,
        [request.orderId, companyId]
      );

      // Get order details for event
      const orderInfo = await this.pool.query(
        'SELECT restaurant_id FROM orders WHERE id = $1',
        [request.orderId]
      );
      const restaurantId = orderInfo.rows[0]?.restaurant_id;

      emitEvent(DomainEventType.PAYMENT_COMPLETED, {
        orderId: payment.orderId,
        companyId: companyId,
        restaurantId: restaurantId,
        amount: payment.amount,
        method: payment.method,
      } as any);
    }

    return payment;
  }

  /**
   * Process Card Payment
   * RULE: PCI-DSS Compliance - Backend only receives Token
   */
  async processCardPayment(paymentId: string, companyId: string, token: string): Promise<Payment> {
    // PRECAUCIÓN: BAJO NINGUNA CIRCUNSTANCIA ALMACENAR PAN (NÚMERO DE TARJETA) O CVV EN LOGS O BASE DE DATOS.

    // Get payment and company settings
    const payment = await this.getPayment(paymentId, companyId);

    if (payment.method !== 'card') {
      throw new Error('Only card payments can be processed via provider');
    }

    const companyRes = await this.pool.query(
      'SELECT payment_settings FROM companies WHERE id = $1',
      [companyId]
    );
    const settings = companyRes.rows[0]?.payment_settings || {};

    // Get provider from factory
    const provider = PaymentProviderFactory.getProvider(settings);

    // Process via provider
    const result = await provider.processPayment(payment.amount, token, {
      orderId: payment.orderId,
      paymentId: payment.id,
      companyId
    });

    if (!result.success) {
      await this.pool.query(
        'UPDATE payment_transactions SET status = $1, provider_error_code = $2 WHERE id = $3',
        ['failed', result.errorCode, paymentId]
      );
      throw new Error(result.errorMessage || 'Card payment declined');
    }

    // Success: Update transaction
    await this.pool.query(
      `UPDATE payment_transactions 
         SET status = 'completed', 
             provider_transaction_id = $1, 
             masked_card = $2, 
             updated_at = NOW()
         WHERE id = $3`,
      [result.transactionId, result.maskedCard, paymentId]
    );

    // Update order
    await this.pool.query(
      `UPDATE orders 
         SET payment_status = 'paid', paid_at = NOW()
         WHERE id = $1 AND company_id = $2`,
      [payment.orderId, companyId]
    );

    const updatedPayment = await this.getPayment(paymentId, companyId);

    // Get order details for event
    const orderInfo = await this.pool.query(
      'SELECT restaurant_id FROM orders WHERE id = $1',
      [payment.orderId]
    );
    const restaurantId = orderInfo.rows[0]?.restaurant_id;

    emitEvent(DomainEventType.PAYMENT_COMPLETED, {
      orderId: payment.orderId,
      companyId: companyId,
      restaurantId: restaurantId,
      amount: payment.amount,
      method: payment.method,
    } as any);

    return updatedPayment;
  }

  /**
   * Generate QR Payload for a payment
   * RULE: Dynamically fetch tenant QR settings
   */
  async generateQRPayload(paymentId: string, companyId: string): Promise<any> {
    const payment = await this.getPayment(paymentId, companyId);

    if (payment.method !== 'qr') {
      throw new Error('QR payload can only be generated for QR payment method');
    }

    const companyRes = await this.pool.query(
      'SELECT name, payment_settings FROM companies WHERE id = $1',
      [companyId]
    );
    const settings = companyRes.rows[0]?.payment_settings || {};
    const companyName = companyRes.rows[0]?.name;

    // Get order details for memo
    const orderRes = await this.pool.query(
      'SELECT order_number FROM orders WHERE id = $1',
      [payment.orderId]
    );
    const orderNumber = orderRes.rows[0]?.order_number;

    const qrProvider = PaymentProviderFactory.getQRProvider(settings);

    const qrData = await qrProvider.generateQR(payment.amount, {
      orderId: payment.orderId,
      orderNumber: orderNumber,
      paymentId: payment.id,
      companyName
    });

    return qrData;
  }

  /**
   * Process Payment (general manual/cash process)
   */
  async processPayment(paymentId: string, companyId: string): Promise<Payment> {
    const payment = await this.getPayment(paymentId, companyId);

    if (payment.status === 'completed') {
      return payment;
    }

    await this.pool.query(
      `UPDATE payment_transactions 
       SET status = 'completed', updated_at = NOW()
       WHERE id = $1 AND company_id = $2`,
      [paymentId, companyId]
    );

    await this.pool.query(
      `UPDATE orders 
       SET payment_status = 'paid', paid_at = NOW()
       WHERE id = $1 AND company_id = $2 AND payment_status = 'pending'`,
      [payment.orderId, companyId]
    );

    const updatedPayment = await this.getPayment(paymentId, companyId);

    // Get order details for event and session tracking
    const orderInfo = await this.pool.query(
      'SELECT restaurant_id FROM orders WHERE id = $1',
      [payment.orderId]
    );
    const restaurantId = orderInfo.rows[0]?.restaurant_id;

    // If it's a cash payment, record it in the cash session
    if (payment.method === 'cash' && this.cashierService && restaurantId) {
      const currentSession = await this.cashierService.getCurrentSession(restaurantId);
      if (currentSession) {
        await this.cashierService.recordPayment(currentSession.id, 'cash', payment.amount);
      }
    }

    emitEvent(DomainEventType.PAYMENT_COMPLETED, {
      orderId: payment.orderId,
      companyId: companyId,
      restaurantId: restaurantId,
      amount: payment.amount,
      method: payment.method,
    } as any);

    return updatedPayment;
  }

  /**
   * Get Payment by ID
   */
  async getPayment(paymentId: string, companyId: string): Promise<Payment> {
    const result = await this.pool.query(
      `SELECT id, order_id, payment_method, amount, currency, status, created_at, updated_at,
              subtotal_amount, tax_amount, service_charge, tip_amount,
              masked_card, provider_transaction_id as transaction_id
       FROM payment_transactions WHERE id = $1 AND company_id = $2`,
      [paymentId, companyId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Payment ${paymentId} not found or unauthorized`);
    }

    return this.mapRowToPayment(result.rows[0]);
  }

  /**
   * Get Payments by Order
   */
  async getPaymentsByOrder(orderId: string, companyId: string): Promise<Payment[]> {
    const result = await this.pool.query(
      `SELECT id, order_id, payment_method, amount, currency, status, created_at, updated_at,
              subtotal_amount, tax_amount, service_charge, tip_amount,
              masked_card, provider_transaction_id as transaction_id
       FROM payment_transactions 
       WHERE order_id = $1 AND company_id = $2
       ORDER BY created_at ASC`,
      [orderId, companyId]
    );

    return result.rows.map(row => this.mapRowToPayment(row));
  }

  /**
   * Cancel Payment
   */
  async cancelPayment(paymentId: string, companyId: string): Promise<void> {
    const payment = await this.getPayment(paymentId, companyId);

    if (payment.status !== 'pending') {
      throw new Error(`Cannot cancel payment with status: ${payment.status}`);
    }

    await this.pool.query(
      `UPDATE payment_transactions 
       SET status = 'failed', updated_at = NOW()
       WHERE id = $1 AND company_id = $2`,
      [paymentId, companyId]
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
      subtotalAmount: parseFloat(row.subtotal_amount || 0),
      taxAmount: parseFloat(row.tax_amount || 0),
      serviceCharge: parseFloat(row.service_charge || 0),
      tipAmount: parseFloat(row.tip_amount || 0),
      maskedCard: row.masked_card,
      transactionId: row.transaction_id,
      createdAt: row.created_at.toISOString(),
      completedAt: row.updated_at && row.status === 'completed' ? row.updated_at.toISOString() : undefined,
    };
  }
}
