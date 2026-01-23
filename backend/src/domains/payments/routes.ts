/**
 * Payments Domain Routes
 * RESTful API for payment operations
 */

import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../../routes/auth';
import { PaymentsService } from './service';
import { CashierDomainService } from '../cashier/service';
import { pool } from '../../shared/db';

const router = Router();
const cashierService = new CashierDomainService(pool);
const paymentsService = new PaymentsService(pool, cashierService);

/**
 * POST /api/v1/payments
 * Create new payment and handle card processing if token provided
 */
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      orderId, method, amount, currency,
      subtotalAmount, taxAmount, serviceCharge, tipAmount,
      paymentToken
    } = req.body;

    if (!orderId || !method || amount === undefined) {
      return res.status(400).json({ error: 'orderId, method, and amount are required' });
    }

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Create the payment record with fiscal breakdown
    const payment = await paymentsService.createPayment({
      orderId,
      method,
      amount,
      currency,
      subtotalAmount,
      taxAmount,
      serviceCharge,
      tipAmount
    }, companyId);

    // 2. Handle Processing based on method
    let processedPayment = payment;

    if (method === 'card' && paymentToken) {
      // Process card via secure token (PCI-DSS)
      processedPayment = await paymentsService.processCardPayment(payment.id, companyId, paymentToken);
    } else if (method === 'cash') {
      // Cash is processed immediately
      processedPayment = await paymentsService.processPayment(payment.id, companyId);
    }

    // 3. Generate FACTA compliant print data
    const printData = {
      orderId: processedPayment.orderId,
      transactionId: processedPayment.transactionId || processedPayment.id,
      amount: processedPayment.amount,
      method: processedPayment.method,
      subtotal: processedPayment.subtotalAmount,
      tax: processedPayment.taxAmount,
      serviceCharge: processedPayment.serviceCharge,
      tip: processedPayment.tipAmount,
      maskedCard: processedPayment.maskedCard, // Masked per FACTA (last 4 only)
      timestamp: processedPayment.completedAt || processedPayment.createdAt
    };

    return res.status(201).json({
      ...processedPayment,
      print_data: printData
    });

  } catch (error: any) {
    console.error('[Payments] Error creating payment:', error);
    // Generic error for client (Security)
    if (error.message.includes('declined') || error.message.includes('card')) {
      return res.status(402).json({ error: 'Pago rechazado' });
    }
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/payments/:id/qr
 * Generate QR payload for a payment
 */
router.get('/:id/qr', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const qrData = await paymentsService.generateQRPayload(id, companyId);
    return res.json(qrData);
  } catch (error: any) {
    console.error('[Payments] Error generating QR:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/payments/:id/process
 * Process payment (manual mark as completed)
 */
router.post('/:id/process', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const payment = await paymentsService.processPayment(id, companyId);
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
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const payments = await paymentsService.getPaymentsByOrder(orderId, companyId);
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
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const payment = await paymentsService.getPayment(id, companyId);
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
 * Cancel payment
 */
router.post('/:id/cancel', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    await paymentsService.cancelPayment(id, companyId);
    return res.status(204).send();
  } catch (error: any) {
    console.error('[Payments] Error cancelling payment:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
