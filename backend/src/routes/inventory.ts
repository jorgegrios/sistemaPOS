/**
 * Inventory Routes
 * Manage inventory items, stock levels, and movements
 */

import { Router, Request, Response } from 'express';
import inventoryService from '../services/inventoryService';
import { verifyToken, AuthRequest } from './auth';

const router = Router();

/**
 * GET /api/v1/inventory
 * List all inventory items
 */
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category, active, lowStock } = req.query;
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const items = await inventoryService.getInventoryItems(restaurantId, {
      category: category as string,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
      lowStock: lowStock === 'true'
    });

    return res.json({ items });
  } catch (error: any) {
    console.error('[Inventory] Error listing items:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/inventory/:id
 * Get inventory item details
 */
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await inventoryService.getInventoryItem(id);

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Get movements
    const movements = await inventoryService.getInventoryMovements(id);

    return res.json({ item, movements });
  } catch (error: any) {
    console.error('[Inventory] Error getting item:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/inventory
 * Create inventory item
 */
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const {
      name, sku, category, unit, currentStock, minStock, maxStock,
      reorderPoint, costPerUnit, supplierId, location, notes
    } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ error: 'Name and unit are required' });
    }

    const item = await inventoryService.createInventoryItem({
      restaurantId,
      name,
      sku,
      category,
      unit,
      currentStock: currentStock || 0,
      minStock,
      maxStock,
      reorderPoint,
      costPerUnit: costPerUnit || 0,
      supplierId,
      location,
      active: true,
      notes
    });

    return res.status(201).json({ item });
  } catch (error: any) {
    console.error('[Inventory] Error creating item:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/inventory/:id
 * Update inventory item
 */
router.put('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await inventoryService.updateInventoryItem(id, updateData);

    return res.json({ item });
  } catch (error: any) {
    console.error('[Inventory] Error updating item:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/inventory/:id/adjust
 * Adjust stock (add, remove, or set)
 */
router.post('/:id/adjust', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, type, unitCost, notes } = req.body;

    if (!quantity || !type) {
      return res.status(400).json({ error: 'Quantity and type are required' });
    }

    const validTypes = ['purchase', 'sale', 'adjustment', 'transfer', 'waste', 'return'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid movement type' });
    }

    const result = await inventoryService.adjustStock(id, quantity, type, {
      unitCost,
      userId: req.user?.id,
      notes
    });

    return res.json(result);
  } catch (error: any) {
    console.error('[Inventory] Error adjusting stock:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/inventory/alerts/stock
 * Get stock alerts (low stock items)
 */
router.get('/alerts/stock', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const alerts = await inventoryService.getStockAlerts(restaurantId);

    return res.json({ alerts });
  } catch (error: any) {
    console.error('[Inventory] Error getting alerts:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/inventory/:id/movements
 * Get inventory movements
 */
router.get('/:id/movements', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, startDate, endDate } = req.query;

    const movements = await inventoryService.getInventoryMovements(id, {
      type: type as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    return res.json({ movements });
  } catch (error: any) {
    console.error('[Inventory] Error getting movements:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;







