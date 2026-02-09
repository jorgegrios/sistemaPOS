/**
 * Kitchen Domain Routes (KDS)
 * RESTful API for kitchen operations
 */

import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../../routes/auth';
import { KitchenService } from './service';
import { pool } from '../../shared/db';

const router = Router();
const kitchenService = new KitchenService(pool);

/**
 * GET /api/v1/kitchen/active-items
 * Get all active kitchen items (status = 'sent' or 'prepared')
 */
router.get('/active-items', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    // Verify user is kitchen role or admin
    if (req.user?.role !== 'kitchen' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const station = req.query.station as 'kitchen' | 'bar' | undefined;
    const items = await kitchenService.getActiveItems(companyId, station);
    return res.json({ items });
  } catch (error: any) {
    console.error('[Kitchen] Error getting active items:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/kitchen/orders
 * Get kitchen orders (grouped by order)
 */
router.get('/orders', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user?.role !== 'kitchen' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const station = req.query.station as 'kitchen' | 'bar' | undefined;
    const orders = await kitchenService.getKitchenOrders(companyId, station);
    return res.json({
      orders,
      serverTime: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Kitchen] Error getting orders:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/kitchen/orders/:orderId/items
 * Get kitchen items by order
 */
router.get('/orders/:orderId/items', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user?.role !== 'kitchen' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { orderId } = req.params;
    const station = req.query.station as 'kitchen' | 'bar' | undefined;
    const items = await kitchenService.getItemsByOrder(orderId, companyId, station);
    return res.json({ items });
  } catch (error: any) {
    console.error('[Kitchen] Error getting items by order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/kitchen/items/:id/prepare
 * Mark order item as prepared
 */
router.post('/items/:id/prepare', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user?.role !== 'kitchen' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const item = await kitchenService.markItemPrepared(id, companyId);
    return res.json(item);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[Kitchen] Error marking item as prepared:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v2/kitchen/served-orders
 * Get served orders
 */
router.get('/served-orders', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user?.role !== 'kitchen' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const station = req.query.station as 'kitchen' | 'bar' | undefined;
    const orders = await kitchenService.getServedOrders(companyId, station);
    return res.json({ orders });
  } catch (error: any) {
    console.error('[Kitchen] Error getting served orders:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
