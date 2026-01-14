import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Refund Orchestration Layer
 * - Routes refunds to appropriate payment provider
 * - Handles partial and full refunds
 * - Updates transaction and order status
 * - Stores refund records in database
 */

export interface RefundRequest {
  transactionId: string;
  amount?: number; // If not provided, refund full amount
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  refundId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'processing';
  amount: number;
  providerRefundId?: string;
  error?: string;
}

class RefundOrchestrator {
  /**
   * Process refund for a payment transaction
   */
  async processRefund(req: RefundRequest): Promise<RefundResponse> {
    // Get original transaction
    const transactionResult = await pool.query(
      'SELECT * FROM payment_transactions WHERE id = $1',
      [req.transactionId]
    );

    if (transactionResult.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    const transaction = transactionResult.rows[0];

    // Validate transaction can be refunded
    if (transaction.status !== 'succeeded') {
      throw new Error(`Transaction status is ${transaction.status}, cannot refund`);
    }

    if (!transaction.provider_transaction_id) {
      throw new Error('Transaction does not have a provider transaction ID');
    }

    // Calculate refund amount (default to full amount)
    const refundAmount = req.amount || parseFloat(transaction.amount.toString());
    
    // Validate refund amount
    if (refundAmount <= 0) {
      throw new Error('Refund amount must be greater than 0');
    }

    if (refundAmount > parseFloat(transaction.amount.toString())) {
      throw new Error('Refund amount cannot exceed original transaction amount');
    }

    // Check for existing refunds to prevent over-refunding
    const existingRefundsResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_refunded 
       FROM refunds 
       WHERE payment_transaction_id = $1 AND status IN ('succeeded', 'processing', 'pending')`,
      [req.transactionId]
    );

    const totalRefunded = parseFloat(existingRefundsResult.rows[0].total_refunded || '0');
    const remainingAmount = parseFloat(transaction.amount.toString()) - totalRefunded;

    if (refundAmount > remainingAmount) {
      throw new Error(
        `Refund amount (${refundAmount}) exceeds remaining refundable amount (${remainingAmount})`
      );
    }

    // Create refund record
    const refundId = uuidv4();
    await pool.query(
      `INSERT INTO refunds (id, payment_transaction_id, amount, reason, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())`,
      [refundId, req.transactionId, refundAmount, req.reason || null]
    );

    try {
      // Route to appropriate provider
      const providerResponse = await this.routeToProvider(
        transaction.payment_provider,
        transaction.provider_transaction_id,
        refundAmount,
        transaction.currency || 'USD'
      );

      // Update refund record with provider response
      await pool.query(
        `UPDATE refunds 
         SET status = $1, provider_refund_id = $2, provider_response = $3, processed_at = NOW()
         WHERE id = $4`,
        [
          providerResponse.status,
          providerResponse.providerRefundId,
          JSON.stringify(providerResponse),
          refundId
        ]
      );

      // Update transaction status if full refund
      if (refundAmount >= remainingAmount) {
        await pool.query(
          `UPDATE payment_transactions SET status = 'refunded', updated_at = NOW() WHERE id = $1`,
          [req.transactionId]
        );

        // Update order payment status
        await pool.query(
          `UPDATE orders SET payment_status = 'refunded' WHERE id = $1`,
          [transaction.order_id]
        );
      }

      return {
        refundId,
        status: providerResponse.status,
        amount: refundAmount,
        providerRefundId: providerResponse.providerRefundId
      };
    } catch (error: any) {
      // Update refund record with error
      await pool.query(
        `UPDATE refunds SET status = 'failed', provider_response = $1, processed_at = NOW() WHERE id = $2`,
        [JSON.stringify({ error: error.message }), refundId]
      );

      return {
        refundId,
        status: 'failed',
        amount: refundAmount,
        error: error.message
      };
    }
  }

  /**
   * Route refund to appropriate payment provider
   */
  private async routeToProvider(
    provider: string,
    providerTransactionId: string,
    amount: number,
    currency: string
  ): Promise<{ status: 'pending' | 'succeeded' | 'failed' | 'processing'; providerRefundId?: string }> {
    switch (provider?.toLowerCase()) {
      case 'stripe':
        return await this.processStripeRefund(providerTransactionId, amount, currency);
      case 'square':
        return await this.processSquareRefund(providerTransactionId, amount, currency);
      case 'mercadopago':
      case 'mercado_pago':
        return await this.processMercadoPagoRefund(providerTransactionId, amount, currency);
      default:
        throw new Error(`Refund not supported for provider: ${provider}`);
    }
  }

  /**
   * Process Stripe refund
   */
  private async processStripeRefund(
    paymentIntentId: string,
    amount: number,
    currency: string
  ): Promise<{ status: 'pending' | 'succeeded' | 'failed' | 'processing'; providerRefundId?: string }> {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15'
    });

    try {
      // Get the payment intent to find the charge ID
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent.latest_charge) {
        throw new Error('Payment intent does not have a charge');
      }

      // Create refund
      const refund = await stripe.refunds.create({
        charge: paymentIntent.latest_charge,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          refunded_at: new Date().toISOString()
        }
      });

      return {
        status: refund.status === 'succeeded' ? 'succeeded' : 'processing',
        providerRefundId: refund.id
      };
    } catch (error: any) {
      console.error('[Refund] Stripe error:', error);
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  /**
   * Process Square refund
   */
  private async processSquareRefund(
    paymentId: string,
    amount: number,
    currency: string
  ): Promise<{ status: 'pending' | 'succeeded' | 'failed' | 'processing'; providerRefundId?: string }> {
    const { Client, Environment } = require('square');
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' 
        ? Environment.Production 
        : Environment.Sandbox
    });

    try {
      const { result } = await client.refundsApi.refundPayment({
        idempotencyKey: uuidv4(),
        amountMoney: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toUpperCase()
        },
        paymentId: paymentId
      });

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].detail || 'Square refund failed');
      }

      return {
        status: result.refund?.status === 'COMPLETED' ? 'succeeded' : 'processing',
        providerRefundId: result.refund?.id
      };
    } catch (error: any) {
      console.error('[Refund] Square error:', error);
      throw new Error(`Square refund failed: ${error.message}`);
    }
  }

  /**
   * Process Mercado Pago refund
   */
  private async processMercadoPagoRefund(
    paymentId: string,
    amount: number,
    currency: string
  ): Promise<{ status: 'pending' | 'succeeded' | 'failed' | 'processing'; providerRefundId?: string }> {
    const mercadopago = require('mercadopago');
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
    });

    try {
      // Mercado Pago refunds are done by payment ID
      const refund = await mercadopago.refund.create({
        payment_id: paymentId,
        amount: amount
      });

      return {
        status: refund.body.status === 'approved' ? 'succeeded' : 'processing',
        providerRefundId: refund.body.id?.toString()
      };
    } catch (error: any) {
      console.error('[Refund] Mercado Pago error:', error);
      throw new Error(`Mercado Pago refund failed: ${error.message}`);
    }
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string): Promise<any> {
    const result = await pool.query(
      `SELECT r.*, pt.order_id, pt.payment_provider, pt.provider_transaction_id
       FROM refunds r
       JOIN payment_transactions pt ON r.payment_transaction_id = pt.id
       WHERE r.id = $1`,
      [refundId]
    );

    if (result.rows.length === 0) {
      throw new Error('Refund not found');
    }

    return result.rows[0];
  }

  /**
   * List refunds for a transaction
   */
  async getRefundsByTransaction(transactionId: string): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM refunds WHERE payment_transaction_id = $1 ORDER BY created_at DESC',
      [transactionId]
    );

    return result.rows;
  }
}

export default new RefundOrchestrator();

