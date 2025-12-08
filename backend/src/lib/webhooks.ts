import crypto from 'crypto';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Verify Stripe webhook signature
 * https://stripe.com/docs/webhooks/signatures
 */
export function verifyStripeSignature(body: string, signature: string, secret: string): boolean {
  try {
    const timestamp = signature.split(',')[0].split('=')[1];
    const recvSignature = signature.split(',')[1].split('=')[1];

    const signedContent = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedContent)
      .digest('hex');

    return recvSignature === expectedSignature;
  } catch (error) {
    return false;
  }
}

/**
 * Verify Square webhook signature
 * https://developer.squareup.com/docs/webhooks
 */
export function verifySquareSignature(body: string, signature: string, secret: string): boolean {
  try {
    const notificationUrl = process.env.WEBHOOK_URL || 'https://api.example/webhooks/square';
    const signedContent = notificationUrl + body;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedContent)
      .digest('base64');

    return signature === expectedSignature;
  } catch (error) {
    return false;
  }
}

/**
 * Verify Mercado Pago webhook signature
 * https://developer.mercadopago.com/en/docs/webhooks
 */
export function verifyMercadoPagoSignature(
  body: string,
  signature: string,
  secret: string,
  requestId?: string
): boolean {
  try {
    // Mercado Pago uses x-signature header which is: timestamp + signature (separated by comma)
    const parts = signature.split(',');
    const [ts, sig] = parts[0].includes('ts=')
      ? [parts[0].split('=')[1], parts[1].split('=')[1]]
      : [parts[1].split('=')[1], parts[0].split('=')[1]];

    const signedContent = `id=${requestId};request-id=${requestId};ts=${ts};${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedContent)
      .digest('hex');

    return sig === expectedSignature;
  } catch (error) {
    return false;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: any): Promise<void> {
  try {
    const { type, data } = event;
    const object = data.object;

    console.log(`[Stripe Webhook] Processing event: ${type}`);

    if (type === 'payment_intent.succeeded') {
      // Update order to PAID
      const idempotencyKey = object.metadata?.idempotencyKey;
      await pool.query(
        `UPDATE payment_transactions
         SET status = 'succeeded', provider_response = $1, updated_at = NOW()
         WHERE provider_transaction_id = $2`,
        [JSON.stringify(object), object.id]
      );

      if (object.metadata?.orderId) {
        await pool.query(
          `UPDATE orders SET payment_status = 'paid', paid_at = NOW() WHERE id = $1`,
          [object.metadata.orderId]
        );
      }
    } else if (type === 'payment_intent.payment_failed') {
      // Update transaction to FAILED
      await pool.query(
        `UPDATE payment_transactions
         SET status = 'failed', provider_response = $1, updated_at = NOW()
         WHERE provider_transaction_id = $2`,
        [JSON.stringify(object), object.id]
      );

      if (object.metadata?.orderId) {
        await pool.query(
          `UPDATE orders SET payment_status = 'failed' WHERE id = $1`,
          [object.metadata.orderId]
        );
      }
    } else if (type === 'charge.refunded') {
      // Mark refund as complete
      await pool.query(
        `UPDATE refunds SET status = 'completed', provider_response = $1, processed_at = NOW()
         WHERE provider_refund_id = $2`,
        [JSON.stringify(object), object.refunds?.data?.[0]?.id]
      );
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error handling event:', error);
    throw error;
  }
}

/**
 * Handle Square webhook events
 */
export async function handleSquareWebhook(event: any): Promise<void> {
  try {
    const { type, data } = event;

    console.log(`[Square Webhook] Processing event: ${type}`);

    if (type === 'payment.created' || type === 'payment.updated') {
      const payment = data.object.payment;

      if (payment.status === 'COMPLETED') {
        // Update transaction to SUCCEEDED
        await pool.query(
          `UPDATE payment_transactions
           SET status = 'succeeded', provider_response = $1, updated_at = NOW()
           WHERE provider_transaction_id = $2`,
          [JSON.stringify(payment), payment.id]
        );

        if (payment.metadata?.orderId) {
          await pool.query(
            `UPDATE orders SET payment_status = 'paid', paid_at = NOW() WHERE id = $1`,
            [payment.metadata.orderId]
          );
        }
      } else if (payment.status === 'CANCELED' || payment.status === 'FAILED') {
        await pool.query(
          `UPDATE payment_transactions
           SET status = $1, provider_response = $2, updated_at = NOW()
           WHERE provider_transaction_id = $3`,
          [payment.status.toLowerCase(), JSON.stringify(payment), payment.id]
        );
      }
    } else if (type === 'refund.created' || type === 'refund.updated') {
      const refund = data.object.refund;

      if (refund.status === 'COMPLETED') {
        await pool.query(
          `UPDATE refunds SET status = 'completed', provider_response = $1, processed_at = NOW()
           WHERE provider_refund_id = $2`,
          [JSON.stringify(refund), refund.id]
        );
      }
    }
  } catch (error) {
    console.error('[Square Webhook] Error handling event:', error);
    throw error;
  }
}

/**
 * Handle Mercado Pago webhook events
 */
export async function handleMercadoPagoWebhook(event: any): Promise<void> {
  try {
    const { type, data } = event;

    console.log(`[Mercado Pago Webhook] Processing event: ${type}`);

    if (type === 'payment' && data.action === 'payment.updated') {
      const paymentId = data.id;

      // You would fetch payment details from Mercado Pago API here
      // For now, we just update based on the status in the webhook

      if (data.status === 'approved') {
        await pool.query(
          `UPDATE payment_transactions
           SET status = 'succeeded', provider_response = $1, updated_at = NOW()
           WHERE provider_transaction_id = $2`,
          [JSON.stringify(data), paymentId]
        );

        // Update order
        const txResult = await pool.query(
          `SELECT order_id FROM payment_transactions WHERE provider_transaction_id = $1`,
          [paymentId]
        );

        if (txResult.rows[0]) {
          await pool.query(
            `UPDATE orders SET payment_status = 'paid', paid_at = NOW() WHERE id = $1`,
            [txResult.rows[0].order_id]
          );
        }
      } else if (data.status === 'rejected' || data.status === 'cancelled') {
        await pool.query(
          `UPDATE payment_transactions
           SET status = 'failed', provider_response = $1, updated_at = NOW()
           WHERE provider_transaction_id = $2`,
          [JSON.stringify(data), paymentId]
        );
      }
    }
  } catch (error) {
    console.error('[Mercado Pago Webhook] Error handling event:', error);
    throw error;
  }
}
