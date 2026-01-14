"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const webhooks_1 = require("../lib/webhooks");
const router = (0, express_1.Router)();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });
/**
 * POST /api/v1/webhooks/stripe
 * Stripe webhook handler with HMAC verification
 */
router.post('/stripe', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.WEBHOOK_SECRET_STRIPE || '';
    try {
        if (!sig) {
            return res.status(400).json({ error: 'Missing Stripe signature header' });
        }
        // Verify Stripe signature using their SDK
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        // Handle specific event types
        await (0, webhooks_1.handleStripeWebhook)(event);
        // Return 200 to acknowledge receipt
        return res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('[Webhooks] Stripe error:', error.message);
        return res.status(400).json({ error: error.message });
    }
});
/**
 * POST /api/v1/webhooks/square
 * Square webhook handler with HMAC verification
 */
router.post('/square', express_1.default.json(), async (req, res) => {
    const signature = req.headers['x-square-hmac-sha256'];
    const webhookSecret = process.env.WEBHOOK_SECRET_SQUARE || '';
    try {
        if (!signature) {
            return res.status(400).json({ error: 'Missing Square signature header' });
        }
        // Get raw body for signature verification
        const rawBody = JSON.stringify(req.body);
        // Verify Square signature
        if (!(0, webhooks_1.verifySquareSignature)(rawBody, signature, webhookSecret)) {
            return res.status(403).json({ error: 'Invalid signature' });
        }
        // Handle event
        await (0, webhooks_1.handleSquareWebhook)(req.body);
        // Return 200 to acknowledge receipt
        return res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('[Webhooks] Square error:', error.message);
        return res.status(400).json({ error: error.message });
    }
});
/**
 * POST /api/v1/webhooks/mercadopago
 * Mercado Pago webhook handler with HMAC verification
 */
router.post('/mercadopago', express_1.default.json(), async (req, res) => {
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    const webhookSecret = process.env.WEBHOOK_SECRET_MERCADOPAGO || '';
    try {
        if (!signature) {
            return res.status(400).json({ error: 'Missing Mercado Pago signature header' });
        }
        const rawBody = JSON.stringify(req.body);
        // Verify Mercado Pago signature
        if (!(0, webhooks_1.verifyMercadoPagoSignature)(rawBody, signature, webhookSecret, requestId)) {
            return res.status(403).json({ error: 'Invalid signature' });
        }
        // Handle event
        await (0, webhooks_1.handleMercadoPagoWebhook)(req.body);
        // Return 200 to acknowledge receipt
        return res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('[Webhooks] Mercado Pago error:', error.message);
        return res.status(400).json({ error: error.message });
    }
});
/**
 * POST /api/v1/webhooks/paypal
 * PayPal webhook handler with HMAC verification
 */
router.post('/paypal', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';
        const body = req.body.toString();
        // Verify PayPal signature
        if (!(0, webhooks_1.verifyPayPalSignature)(req.headers, body, webhookId)) {
            return res.status(403).json({ error: 'Invalid PayPal signature' });
        }
        // Parse JSON body
        const event = JSON.parse(body);
        // Handle webhook event
        await (0, webhooks_1.handlePayPalWebhook)(event);
        // Return 200 to acknowledge receipt
        return res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('[Webhooks] PayPal error:', error.message);
        return res.status(400).json({ error: error.message });
    }
});
exports.default = router;
