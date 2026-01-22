/**
 * Orders Domain Routes
 * RESTful API for order operations
 */

import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../../routes/auth';
import { OrdersService } from './service';
import { pool } from '../../shared/db';

const router = Router();
const ordersService = new OrdersService(pool);

/**
 * POST /api/v1/orders
 * Create new order (idempotent: returns existing if active order exists for table)
 */
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { tableId } = req.body;
    const waiterId = req.user?.id;

    if (!tableId || !waiterId) {
      return res.status(400).json({ error: 'tableId and waiterId are required' });
    }

    const order = await ordersService.createOrder({ tableId, waiterId });
    return res.status(201).json(order);
  } catch (error: any) {
    console.error('[Orders] Error creating order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/orders/:id
 * Get order by ID
 */
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await ordersService.getOrderWithItems(id);
    return res.json(order);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[Orders] Error getting order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/orders/:id/items
 * Add items to order (only if order is in 'draft' status)
 */
router.post('/:id/items', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const orderItems = await ordersService.addItemsToOrder(id, { items });
    return res.status(201).json({ items: orderItems });
  } catch (error: any) {
    console.error('[Orders] Error adding items:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v2/orders/:id/items
 * Remove all items from order (only if order is in 'draft' status)
 * Used to sync cart with database before sending to kitchen
 */
router.delete('/:id/items', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await ordersService.removeAllItemsFromOrder(id);
    return res.status(200).json({ message: 'All items removed from order' });
  } catch (error: any) {
    console.error('[Orders] Error removing items:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v2/orders/:id/items/:itemId
 * Cancel or Remove a single item from order
 */
router.delete('/:id/items/:itemId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, itemId } = req.params;
    await ordersService.cancelOrderItem(id, itemId);
    return res.status(200).json({ message: 'Item cancelled successfully' });
  } catch (error: any) {
    console.error('[Orders] Error cancelling item:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/orders/:id/send-to-kitchen
 * Send order to kitchen (idempotent: does nothing if already sent)
 */
router.post('/:id/send-to-kitchen', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await ordersService.sendToKitchen(id);
    return res.json(order);
  } catch (error: any) {
    console.error('[Orders] Error sending to kitchen:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/orders/:id/serve
 * Mark order as served (only if all items are prepared)
 */
router.post('/:id/serve', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await ordersService.markAsServed(id);
    return res.json(order);
  } catch (error: any) {
    console.error('[Orders] Error marking as served:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/orders/:id/close
 * Close order (only if all items served and payment completed)
 */
router.post('/:id/close', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await ordersService.closeOrder(id);
    return res.json(order);
  } catch (error: any) {
    console.error('[Orders] Error closing order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/orders/:id/cancel
 * Cancel order
 */
router.post('/:id/cancel', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await ordersService.cancelOrder(id);
    return res.json(order);
  } catch (error: any) {
    console.error('[Orders] Error cancelling order:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

