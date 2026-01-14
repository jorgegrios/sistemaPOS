/**
 * Payments Domain Routes
 * RESTful API for payment operations
 */

import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../../routes/auth';
import { PaymentsService } from './service';
import { pool } from '../../shared/db';

const router = Router();
const paymentsService = new PaymentsService(pool);

/**
 * POST /api/v1/payments
 * Create new payment
 */
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, method, amount, currency } = req.body;

    if (!orderId || !method || amount === undefined) {
      return res.status(400).json({ error: 'orderId, method, and amount are required' });
    }

    if (!['cash', 'card', 'split'].includes(method)) {
      return res.status(400).json({ error: 'method must be cash, card, or split' });
    }

    // Handle split payment
    if (method === 'split' && req.body.payments) {
      const payments = await paymentsService.createSplitPayment({
        orderId,
        payments: req.body.payments,
        currency,
      });
      return res.status(201).json({ payments });
    }

    // Regular payment
    const payment = await paymentsService.createPayment({
      orderId,
      method,
      amount,
      currency,
    });

    // Auto-process payment (in real system, this would involve payment gateway)
    // For now, we auto-complete cash payments
    if (method === 'cash') {
      const processedPayment = await paymentsService.processPayment(payment.id);
      return res.status(201).json(processedPayment);
    }

    return res.status(201).json(payment);
  } catch (error: any) {
    console.error('[Payments] Error creating payment:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/payments/:id/process
 * Process payment (mark as completed)
 */
router.post('/:id/process', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await paymentsService.processPayment(id);
    return res.json(payment);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[Payments] Error processing payment:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/payments/order/:orderId
 * Get all payments for an order
 */
router.get('/order/:orderId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const payments = await paymentsService.getPaymentsByOrder(orderId);
    return res.json({ payments });
  } catch (error: any) {
    console.error('[Payments] Error getting payments:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/payments/:id
 * Get payment by ID
 */
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await paymentsService.getPayment(id);
    return res.json(payment);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[Payments] Error getting payment:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/payments/:id/cancel
 * Cancel payment (only if pending)
 */
router.post('/:id/cancel', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await paymentsService.cancelPayment(id);
    return res.status(204).send();
  } catch (error: any) {
    console.error('[Payments] Error cancelling payment:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;






