import express, { Router, Request, Response, raw } from 'express';
import Stripe from 'stripe';
import {
  verifyStripeSignature,
  verifySquareSignature,
  verifyMercadoPagoSignature,
  handleStripeWebhook,
  handleSquareWebhook,
  handleMercadoPagoWebhook
} from '../lib/webhooks';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

/**
 * POST /api/v1/webhooks/stripe
 * Stripe webhook handler with HMAC verification
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.WEBHOOK_SECRET_STRIPE || '';

  try {
    if (!sig) {
      return res.status(400).json({ error: 'Missing Stripe signature header' });
    }

    // Verify Stripe signature using their SDK
    const event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);

    // Handle specific event types
    await handleStripeWebhook(event);

    // Return 200 to acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Webhooks] Stripe error:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/webhooks/square
 * Square webhook handler with HMAC verification
 */
router.post('/square', express.json(), async (req: Request, res: Response) => {
  const signature = req.headers['x-square-hmac-sha256'] as string;
  const webhookSecret = process.env.WEBHOOK_SECRET_SQUARE || '';

  try {
    if (!signature) {
      return res.status(400).json({ error: 'Missing Square signature header' });
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Verify Square signature
    if (!verifySquareSignature(rawBody, signature, webhookSecret)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Handle event
    await handleSquareWebhook(req.body);

    // Return 200 to acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Webhooks] Square error:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/webhooks/mercadopago
 * Mercado Pago webhook handler with HMAC verification
 */
router.post('/mercadopago', express.json(), async (req: Request, res: Response) => {
  const signature = req.headers['x-signature'] as string;
  const requestId = req.headers['x-request-id'] as string;
  const webhookSecret = process.env.WEBHOOK_SECRET_MERCADOPAGO || '';

  try {
    if (!signature) {
      return res.status(400).json({ error: 'Missing Mercado Pago signature header' });
    }

    const rawBody = JSON.stringify(req.body);

    // Verify Mercado Pago signature
    if (!verifyMercadoPagoSignature(rawBody, signature, webhookSecret, requestId)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Handle event
    await handleMercadoPagoWebhook(req.body);

    // Return 200 to acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Webhooks] Mercado Pago error:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/webhooks/paypal
 * PayPal webhook handler with HMAC verification
 * TODO: Implement PayPal signature verification
 */
router.post('/paypal', express.json(), async (req: Request, res: Response) => {
  try {
    const event = req.body;

    console.log(`[PayPal Webhook] Processing event: ${event.event_type}`);

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource;
      // TODO: Update transaction status to succeeded
      // TODO: Update order status to paid
    } else if (event.event_type === 'PAYMENT.CAPTURE.DENIED' || event.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
      // TODO: Update transaction status to failed or refunded
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Webhooks] PayPal error:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

export default router;
