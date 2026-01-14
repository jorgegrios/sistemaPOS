"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const ioredis_1 = __importDefault(require("ioredis"));
const pg_1 = require("pg");
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
class PaymentOrchestrator {
    constructor() {
        this.maxRetries = 3;
        this.retryDelayMs = 1000;
    }
    /**
     * Process payment with idempotency and retry support
     */
    async processPayment(req) {
        const idempotencyKey = req.idempotencyKey || (0, uuid_1.v4)();
        const transactionId = (0, uuid_1.v4)();
        // Check idempotency: if same key exists, return cached result
        const cachedResult = await redis.get(`idempotency:${idempotencyKey}`);
        if (cachedResult) {
            console.log(`[Payment] Idempotency hit for key ${idempotencyKey}`);
            return JSON.parse(cachedResult);
        }
        // Store pending transaction
        await this.storePendingTransaction(transactionId, req, idempotencyKey);
        let response;
        let lastError = null;
        // Retry loop
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                response = await this.routeToProvider(req, transactionId, idempotencyKey);
                // Cache successful response
                if (response.status === 'succeeded' || response.status === 'requires_action') {
                    await redis.setex(`idempotency:${idempotencyKey}`, 3600, JSON.stringify(response));
                }
                // Update transaction
                await this.updateTransaction(transactionId, response);
                return response;
            }
            catch (error) {
                lastError = error;
                console.error(`[Payment] Attempt ${attempt}/${this.maxRetries} failed:`, lastError.message);
                if (attempt < this.maxRetries) {
                    await new Promise((r) => setTimeout(r, this.retryDelayMs * attempt));
                }
            }
        }
        // All retries failed
        const failedResponse = {
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
    async routeToProvider(req, transactionId, idempotencyKey) {
        // For cash payments, return success immediately (no provider needed)
        if (req.method === 'cash') {
            return {
                transactionId,
                status: 'succeeded',
                amount: req.amount,
                providerTransactionId: `cash-${transactionId}`
            };
        }
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
    async processStripePayment(req, transactionId, idempotencyKey) {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const intent = await stripe.paymentIntents.create({
            amount: Math.round(req.amount * 100),
            currency: req.currency.toLowerCase(),
            payment_method: req.paymentMethodId,
            confirm: true,
            capture_method: 'automatic'
        }, { idempotencyKey });
        return {
            transactionId,
            status: intent.status === 'succeeded' ? 'succeeded' : intent.status,
            amount: req.amount,
            providerTransactionId: intent.id
        };
    }
    /**
     * Square payment processing
     */
    async processSquarePayment(req, transactionId, idempotencyKey) {
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
    async processMercadoPagoPayment(req, transactionId, idempotencyKey) {
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
    async storePendingTransaction(transactionId, req, idempotencyKey) {
        const query = `
      INSERT INTO payment_transactions 
      (id, order_id, payment_method, payment_provider, amount, currency, status, card_token, created_at, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
    `;
        await pool.query(query, [
            transactionId,
            req.orderId || null, // Allow null for general payments
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
    async updateTransaction(transactionId, response) {
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
exports.default = new PaymentOrchestrator();
