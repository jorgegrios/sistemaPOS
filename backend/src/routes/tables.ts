/**
 * Tables Routes
 * Manage dining tables
 */

import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from './auth';
import tableService from '../services/tableService';

const router = Router();

/**
 * GET /api/v1/tables
 * Get all tables for the restaurant
 */
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const companyId = req.user?.companyId;

    if (!restaurantId || !companyId) {
      return res.status(400).json({ error: 'Restaurant and Company ID required' });
    }

    const tables = await tableService.getTables(restaurantId, companyId);
    return res.json({ tables });
  } catch (error: any) {
    console.error('[Tables] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/tables/:id
 * Get a single table
 */
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const table = await tableService.getTable(id, companyId);

    if (!table) {
      return res.status(404).json({ error: 'Table not found or unauthorized' });
    }

    return res.json({ table });
  } catch (error: any) {
    console.error('[Tables] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/tables
 * Create a new table (admin/manager only)
 */
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const companyId = req.user?.companyId;
    const { tableNumber, capacity } = req.body;

    if (!restaurantId || !companyId) {
      return res.status(400).json({ error: 'Restaurant and Company ID required' });
    }

    if (!tableNumber) {
      return res.status(400).json({ error: 'Table number is required' });
    }

    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Only admins and managers can create tables' });
    }

    const table = await tableService.createTable(restaurantId, tableNumber, parseInt(capacity), companyId);
    return res.status(201).json({ table });
  } catch (error: any) {
    console.error('[Tables] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/tables/:id
 * Update a table (admin/manager only)
 */
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const { tableNumber, capacity, status } = req.body;

    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Only admins and managers can update tables' });
    }

    const table = await tableService.updateTable(
      id,
      companyId,
      tableNumber,
      capacity ? parseInt(capacity) : undefined,
      status
    );

    return res.json({ table });
  } catch (error: any) {
    console.error('[Tables] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/tables/:id
 * Delete a table (admin only)
 */
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete tables' });
    }

    await tableService.deleteTable(req.params.id, companyId);
    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[Tables] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;








