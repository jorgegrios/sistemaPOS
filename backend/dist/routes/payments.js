"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentOrchestrator_1 = __importDefault(require("../services/paymentOrchestrator"));
const pg_1 = require("pg");
const router = (0, express_1.Router)();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
/**
 * POST /api/v1/payments/process
 * Process a payment with idempotency and retry support
 */
router.post('/process', async (req, res) => {
    try {
        const { orderId, amount, currency = 'USD', method, // 'card', 'qr', 'wallet', 'cash'
        provider, // 'stripe', 'square', 'mercadopago'
        paymentMethodId, // token from frontend
        idempotencyKey, tip, metadata } = req.body;
        // Validate input
        if (!orderId || !amount || !method || !provider) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Process payment
        const response = await paymentOrchestrator_1.default.processPayment({
            orderId,
            amount: amount + (tip || 0),
            currency,
            method,
            provider,
            paymentMethodId,
            idempotencyKey,
            tip,
            metadata
        });
        // If succeeded, update order status to PAID in database
        if (response.status === 'succeeded') {
            await pool.query('UPDATE orders SET payment_status = $1, paid_at = NOW() WHERE id = $2', ['paid', orderId]);
        }
        return res.json(response);
    }
    catch (error) {
        console.error('[Payments] Error processing payment:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/payments/refund/:id
 * Refund a payment transaction
 */
router.post('/refund/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;
        const { amount, reason } = req.body;
        // Get original transaction
        const result = await pool.query('SELECT * FROM payment_transactions WHERE id = $1', [transactionId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        const transaction = result.rows[0];
        // TODO: route refund to appropriate provider based on transaction.payment_provider
        // For now, insert refund record
        await pool.query(`INSERT INTO refunds (payment_transaction_id, amount, reason, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())`, [transactionId, amount || transaction.amount, reason]);
        return res.json({ ok: true, refundId: transactionId });
    }
    catch (error) {
        console.error('[Payments] Refund error:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/v1/payments/:id
 * Get payment transaction details
 */
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query('SELECT * FROM payment_transactions WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        return res.json(result.rows[0]);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/v1/payments/methods
 * Return enabled payment methods for restaurant
 */
router.get('/methods', async (req, res) => {
    try {
        const methods = [
            { id: 'card', name: 'Debit/Credit Card', providers: ['stripe', 'square'] },
            { id: 'qr', name: 'QR Code', providers: ['mercadopago', 'stripe'] },
            { id: 'wallet', name: 'Digital Wallet', providers: ['paypal', 'mercadopago'] },
            { id: 'cash', name: 'Cash', providers: [] }
        ];
        return res.json(methods);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/payments/terminal/pair
 * Pair a physical payment terminal
 */
router.post('/terminal/pair', async (req, res) => {
    try {
        const { terminalId, provider, deviceType, locationId } = req.body;
        const result = await pool.query(`INSERT INTO payment_terminals (terminal_id, provider, device_type, location_id, status, created_at)
       VALUES ($1, $2, $3, $4, 'active', NOW())
       ON CONFLICT (terminal_id) DO UPDATE SET status = 'active', last_seen_at = NOW()
       RETURNING *`, [terminalId, provider, deviceType, locationId]);
        return res.json({ ok: true, terminal: result.rows[0] });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/payments/qr/generate
 * Generate dynamic QR code for transaction
 */
router.post('/qr/generate', async (req, res) => {
    try {
        const { orderId, amount, currency = 'USD' } = req.body;
        // TODO: integrate with QR generation library (qrcode)
        // For now, return dummy QR data
        const qr = `https://api.example/pay/${orderId}?amount=${amount}&currency=${currency}`;
        return res.json({ qr, expiresIn: 900 }); // expires in 15 minutes
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/payments/validate
 * Validate QR code or wallet payment
 */
router.post('/validate', async (req, res) => {
    try {
        const { qr, provider } = req.body;
        // TODO: validate with provider and return payment details
        return res.json({ ok: true, validatedAmount: 0 });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
