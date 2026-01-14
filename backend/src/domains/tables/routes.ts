/**
 * Tables Domain Routes
 * RESTful API for table operations
 */

import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../../routes/auth';
import { TablesService } from './service';
import { pool } from '../../shared/db';

const router = Router();
const tablesService = new TablesService(pool);

/**
 * POST /api/v1/tables
 * Create new table
 */
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, capacity } = req.body;
    const restaurantId = req.user?.restaurantId;

    if (!name || !capacity || !restaurantId) {
      return res.status(400).json({ error: 'name, capacity, and restaurantId are required' });
    }

    const table = await tablesService.createTable({ name, capacity, restaurantId });
    return res.status(201).json(table);
  } catch (error: any) {
    console.error('[Tables] Error creating table:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/tables
 * Get all tables for restaurant
 */
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    const withOrders = req.query.withOrders === 'true';

    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurantId is required' });
    }

    if (withOrders) {
      const tables = await tablesService.getTablesWithOrders(restaurantId);
      return res.json({ tables });
    } else {
      const tables = await tablesService.getTablesByRestaurant(restaurantId);
      return res.json({ tables });
    }
  } catch (error: any) {
    console.error('[Tables] Error getting tables:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/tables/:id
 * Get table by ID
 */
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const withOrder = req.query.withOrder === 'true';

    if (withOrder) {
      const table = await tablesService.getTableWithOrder(id);
      return res.json(table);
    } else {
      const table = await tablesService.getTable(id);
      return res.json(table);
    }
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[Tables] Error getting table:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/tables/:id
 * Update table
 */
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, status } = req.body;

    const table = await tablesService.updateTable(id, { name, capacity, status });
    return res.json(table);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[Tables] Error updating table:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/tables/:id
 * Delete table
 */
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await tablesService.deleteTable(id);
    return res.status(204).send();
  } catch (error: any) {
    console.error('[Tables] Error deleting table:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;






