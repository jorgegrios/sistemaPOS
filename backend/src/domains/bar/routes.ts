/**
 * Bar Domain Routes (Bar Display System)
 * RESTful API for bar operations
 */

import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../../routes/auth';
import { BarService } from './service';
import { pool } from '../../shared/db';

const router = Router();
const barService = new BarService(pool);

/**
 * GET /api/v2/bar/active-items
 * Get all active bar items (status = 'sent' or 'prepared' from bar categories)
 * RULE: Bar only sees items with status = 'sent' or 'prepared' from bar categories
 */
router.get('/active-items', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verify user is bartender role
    if (req.user?.role !== 'bartender' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only bartender staff can access this endpoint' });
    }

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const items = await barService.getActiveItems(companyId);
    return res.json({ items });
  } catch (error: any) {
    console.error('[Bar] Error getting active items:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v2/bar/orders
 * Get bar orders (grouped by order)
 */
router.get('/orders', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verify user is bartender role
    if (req.user?.role !== 'bartender' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only bartender staff can access this endpoint' });
    }

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await barService.getBarOrders(companyId);
    return res.json({ orders });
  } catch (error: any) {
    console.error('[Bar] Error getting orders:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v2/bar/orders/:orderId/items
 * Get bar items by order
 */
router.get('/orders/:orderId/items', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verify user is bartender role
    if (req.user?.role !== 'bartender' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only bartender staff can access this endpoint' });
    }

    const { orderId } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const items = await barService.getItemsByOrder(orderId, companyId);
    return res.json({ items });
  } catch (error: any) {
    console.error('[Bar] Error getting items by order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v2/bar/items/:id/prepare
 * Mark order item as prepared
 * RULE: Only mark items with status = 'sent' as 'prepared'
 */
router.post('/items/:id/prepare', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verify user is bartender role
    if (req.user?.role !== 'bartender' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only bartender staff can access this endpoint' });
    }

    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const item = await barService.markItemPrepared(id, companyId);
    return res.json(item);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[Bar] Error marking item as prepared:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v2/bar/served-orders
 * Get served bar orders (all items prepared or served)
 */
router.get('/served-orders', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verify user is bartender role
    if (req.user?.role !== 'bartender' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only bartender staff can access this endpoint' });
    }

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await barService.getServedOrders(companyId);
    return res.json({ orders });
  } catch (error: any) {
    console.error('[Bar] Error getting served orders:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;





