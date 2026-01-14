/**
 * Dashboard Routes
 * Endpoints for dashboard data
 */

import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from './auth';
import dashboardService from '../services/dashboardService';

const router = Router();

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/v1/dashboard/daily-summary
 * Get daily summary for dashboard
 */
router.get('/daily-summary', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    console.log('[Dashboard] Getting daily summary for restaurant:', restaurantId);
    const summary = await dashboardService.getDailySummary(restaurantId);
    console.log('[Dashboard] Summary generated:', {
      totalOrders: summary.totalOrders,
      totalSales: summary.totalSales
    });
    return res.json(summary);
  } catch (error: any) {
    console.error('[Dashboard] Error:', error);
    console.error('[Dashboard] Error stack:', error.stack);
    return res.status(500).json({ 
      error: error.message || 'Error al obtener resumen del día',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * PUT /api/v1/dashboard/cash-base
 * Set cash register base amount
 */
router.put('/cash-base', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { amount } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    if (amount === undefined || amount < 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Upsert the base amount
    await pool.query(
      `INSERT INTO restaurant_config (restaurant_id, key, value, updated_at)
       VALUES ($1, 'cash_register_base', $2, NOW())
       ON CONFLICT (restaurant_id, key)
       DO UPDATE SET value = $2, updated_at = NOW()`,
      [restaurantId, amount.toString()]
    );

    return res.json({ ok: true, baseAmount: parseFloat(amount) });
  } catch (error: any) {
    console.error('[Dashboard] Error setting cash base:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

