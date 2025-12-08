import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { Pool } from 'pg';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Payment orchestration layer
 * - Handles idempotency (prevent double charges via idempotency key)
 * - Routes to provider (Stripe/Square/Mercado Pago)
 * - Manages retries via Redis queue
 * - Stores transaction record in PostgreSQL
 */

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  method: 'card' | 'qr' | 'wallet' | 'cash';
  provider: 'stripe' | 'square' | 'mercadopago' | 'paypal';
  paymentMethodId?: string; // token or ID from provider
  idempotencyKey?: string;
  tip?: number;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'requires_action';
  amount: number;
  providerTransactionId?: string;
  error?: string;
  requiresAction?: any; // for 3D Secure, etc.
}

class PaymentOrchestrator {
  private maxRetries = 3;
  private retryDelayMs = 1000;

  /**
   * Process payment with idempotency and retry support
   */
  async processPayment(req: PaymentRequest): Promise<PaymentResponse> {
    const idempotencyKey = req.idempotencyKey || uuidv4();
    const transactionId = uuidv4();

    // Check idempotency: if same key exists, return cached result
    const cachedResult = await redis.get(`idempotency:${idempotencyKey}`);
    if (cachedResult) {
      console.log(`[Payment] Idempotency hit for key ${idempotencyKey}`);
      return JSON.parse(cachedResult);
    }

    // Store pending transaction
    await this.storePendingTransaction(transactionId, req, idempotencyKey);

    let response: PaymentResponse;
    let lastError: Error | null = null;

    // Retry loop
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        response = await this.routeToProvider(req, transactionId, idempotencyKey);
        
        // Cache successful response
        if (response.status === 'succeeded' || response.status === 'requires_action') {
          await redis.setex(
            `idempotency:${idempotencyKey}`,
            3600,
            JSON.stringify(response)
          );
        }

        // Update transaction
        await this.updateTransaction(transactionId, response);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `[Payment] Attempt ${attempt}/${this.maxRetries} failed:`,
          lastError.message
        );
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, this.retryDelayMs * attempt));
        }
      }
    }

    // All retries failed
    const failedResponse: PaymentResponse = {
      transactionId,
      status: 'failed',
      amount: req.amount,
      error: lastError?.message || 'Payment processing failed after retries'
    };
    await this.updateTransaction(transactionId, failedResponse);
    return failedResponse;
  }

  /**
   * Route to the appropriate payment provider
   */
  private async routeToProvider(
    req: PaymentRequest,
    transactionId: string,
    idempotencyKey: string
  ): Promise<PaymentResponse> {
    switch (req.provider) {
      case 'stripe':
        return await this.processStripePayment(req, transactionId, idempotencyKey);
      case 'square':
        return await this.processSquarePayment(req, transactionId, idempotencyKey);
      case 'mercadopago':
        return await this.processMercadoPagoPayment(req, transactionId, idempotencyKey);
      default:
        throw new Error(`Unknown provider: ${req.provider}`);
    }
  }

  /**
   * Stripe payment processing
   */
  private async processStripePayment(
    req: PaymentRequest,
    transactionId: string,
    idempotencyKey: string
  ): Promise<PaymentResponse> {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const intent = await stripe.paymentIntents.create(
      {
        amount: Math.round(req.amount * 100),
        currency: req.currency.toLowerCase(),
        payment_method: req.paymentMethodId,
        confirm: true,
        capture_method: 'automatic'
      },
      { idempotencyKey }
    );

    return {
      transactionId,
      status: intent.status === 'succeeded' ? 'succeeded' : (intent.status as any),
      amount: req.amount,
      providerTransactionId: intent.id
    };
  }

  /**
   * Square payment processing
   */
  private async processSquarePayment(
    req: PaymentRequest,
    transactionId: string,
    idempotencyKey: string
  ): Promise<PaymentResponse> {
    const { Client, Environment } = require('square');
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Production
    });

    const { result } = await client.paymentsApi.createPayment({
      sourceId: req.paymentMethodId,
      amountMoney: {
        amount: Math.round(req.amount * 100),
        currency: req.currency
      },
      idempotencyKey
    });

    return {
      transactionId,
      status: result.payment?.status === 'COMPLETED' ? 'succeeded' : 'pending',
      amount: req.amount,
      providerTransactionId: result.payment?.id
    };
  }

  /**
   * Mercado Pago payment processing
   */
  private async processMercadoPagoPayment(
    req: PaymentRequest,
    transactionId: string,
    idempotencyKey: string
  ): Promise<PaymentResponse> {
    const mercadopago = require('mercadopago');
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
    });

    const payment = await mercadopago.payment.create({
      transaction_amount: req.amount,
      currency_id: 'USD',
      payment_method_id: req.paymentMethodId,
      payer: { email: 'test@example.com' },
      external_reference: idempotencyKey
    });

    return {
      transactionId,
      status: payment.body.status === 'approved' ? 'succeeded' : 'pending',
      amount: req.amount,
      providerTransactionId: payment.body.id.toString()
    };
  }

  /**
   * Store pending transaction in database
   */
  private async storePendingTransaction(
    transactionId: string,
    req: PaymentRequest,
    idempotencyKey: string
  ): Promise<void> {
    const query = `
      INSERT INTO payment_transactions 
      (id, order_id, payment_method, payment_provider, amount, currency, status, card_token, created_at, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
    `;
    await pool.query(query, [
      transactionId,
      req.orderId,
      req.method,
      req.provider,
      req.amount,
      req.currency,
      'pending',
      req.paymentMethodId,
      JSON.stringify({ idempotencyKey, ...req.metadata })
    ]);
  }

  /**
   * Update transaction with final status
   */
  private async updateTransaction(
    transactionId: string,
    response: PaymentResponse
  ): Promise<void> {
    const query = `
      UPDATE payment_transactions
      SET status = $1, provider_transaction_id = $2, updated_at = NOW()
      WHERE id = $3
    `;
    await pool.query(query, [
      response.status,
      response.providerTransactionId,
      transactionId
    ]);
  }
}

export default new PaymentOrchestrator();
