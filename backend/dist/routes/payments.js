"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentOrchestrator_1 = __importDefault(require("../services/paymentOrchestrator"));
const refundOrchestrator_1 = __importDefault(require("../services/refundOrchestrator"));
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
        // Validate input (orderId is now optional for general payments)
        if (!amount || !method || !provider) {
            return res.status(400).json({ error: 'Missing required fields: amount, method, provider' });
        }
        // Process payment (orderId can be null for general payments)
        const response = await paymentOrchestrator_1.default.processPayment({
            orderId: orderId || null,
            amount: amount + (tip || 0),
            currency,
            method,
            provider,
            paymentMethodId,
            idempotencyKey,
            tip,
            metadata
        });
        // If succeeded and orderId exists, update order status to PAID in database
        if (response.status === 'succeeded' && orderId) {
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
 *
 * Body:
 * - amount (optional): Partial refund amount. If not provided, full refund.
 * - reason (optional): Reason for refund
 * - metadata (optional): Additional metadata
 */
router.post('/refund/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;
        const { amount, reason, metadata } = req.body;
        // Process refund through orchestrator
        const refundResponse = await refundOrchestrator_1.default.processRefund({
            transactionId,
            amount: amount ? parseFloat(amount) : undefined,
            reason,
            metadata
        });
        return res.json({
            ok: true,
            refundId: refundResponse.refundId,
            status: refundResponse.status,
            amount: refundResponse.amount,
            providerRefundId: refundResponse.providerRefundId,
            error: refundResponse.error
        });
    }
    catch (error) {
        console.error('[Payments] Refund error:', error);
        // Return appropriate status code based on error
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('cannot refund') || error.message.includes('exceeds')) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/v1/payments/refund/:id
 * Get refund details
 */
router.get('/refund/:id', async (req, res) => {
    try {
        const refundId = req.params.id;
        const refund = await refundOrchestrator_1.default.getRefund(refundId);
        return res.json(refund);
    }
    catch (error) {
        console.error('[Payments] Get refund error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/v1/payments/:transactionId/refunds
 * List all refunds for a transaction
 */
router.get('/:transactionId/refunds', async (req, res) => {
    try {
        const { transactionId } = req.params;
        const refunds = await refundOrchestrator_1.default.getRefundsByTransaction(transactionId);
        return res.json({ refunds, total: refunds.length });
    }
    catch (error) {
        console.error('[Payments] List refunds error:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/v1/payments
 * List all payments with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { orderId, status, provider, limit = '50', offset = '0' } = req.query;
        let query = 'SELECT * FROM payment_transactions WHERE 1=1';
        const params = [];
        let paramCount = 1;
        if (orderId) {
            query += ` AND order_id = $${paramCount++}`;
            params.push(orderId);
        }
        if (status) {
            query += ` AND status = $${paramCount++}`;
            params.push(status);
        }
        if (provider) {
            query += ` AND payment_provider = $${paramCount++}`;
            params.push(provider);
        }
        query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(parseInt(limit), parseInt(offset));
        const result = await pool.query(query, params);
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) FROM payment_transactions WHERE 1=1';
        const countParams = [];
        let countParamCount = 1;
        if (orderId) {
            countQuery += ` AND order_id = $${countParamCount++}`;
            countParams.push(orderId);
        }
        if (status) {
            countQuery += ` AND status = $${countParamCount++}`;
            countParams.push(status);
        }
        if (provider) {
            countQuery += ` AND payment_provider = $${countParamCount++}`;
            countParams.push(provider);
        }
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);
        return res.json({
            payments: result.rows,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    }
    catch (error) {
        console.error('[Payments] Error listing payments:', error);
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
