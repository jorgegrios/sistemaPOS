/**
 * Advanced Costing Routes
 * Complete cost calculation system including labor, overhead, packaging, and food cost management
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, AuthRequest } from './auth';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ==================== CONFIGURATION ====================

/**
 * GET /api/v1/advanced-costing/config
 * Get restaurant cost configuration
 */
router.get('/config', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const result = await pool.query(
      'SELECT * FROM restaurant_cost_config WHERE restaurant_id = $1',
      [restaurantId]
    );

    if (result.rows.length === 0) {
      // Create default config
      const defaultConfig = {
        restaurant_id: restaurantId,
        target_food_cost_percentage: 30.00,
        currency: 'USD',
        tax_percentage: 0.00,
        price_rounding_method: 'nearest',
        include_labor_in_cost: true,
        include_overhead_in_cost: true,
        include_packaging_in_cost: false,
      };

      const insertResult = await pool.query(
        `INSERT INTO restaurant_cost_config (
          id, restaurant_id, target_food_cost_percentage, currency, tax_percentage,
          price_rounding_method, include_labor_in_cost, include_overhead_in_cost, include_packaging_in_cost
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          defaultConfig.restaurant_id,
          defaultConfig.target_food_cost_percentage,
          defaultConfig.currency,
          defaultConfig.tax_percentage,
          defaultConfig.price_rounding_method,
          defaultConfig.include_labor_in_cost,
          defaultConfig.include_overhead_in_cost,
          defaultConfig.include_packaging_in_cost,
        ]
      );

      return res.json(insertResult.rows[0]);
    }

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error getting config:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/advanced-costing/config
 * Update restaurant cost configuration
 */
router.put('/config', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const {
      target_food_cost_percentage,
      currency,
      tax_percentage,
      price_rounding_method,
      include_labor_in_cost,
      include_overhead_in_cost,
      include_packaging_in_cost,
    } = req.body;

    // Check if config exists
    const check = await pool.query(
      'SELECT id FROM restaurant_cost_config WHERE restaurant_id = $1',
      [restaurantId]
    );

    if (check.rows.length === 0) {
      // Create new config
      const result = await pool.query(
        `INSERT INTO restaurant_cost_config (
          id, restaurant_id, target_food_cost_percentage, currency, tax_percentage,
          price_rounding_method, include_labor_in_cost, include_overhead_in_cost, include_packaging_in_cost
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          restaurantId,
          target_food_cost_percentage || 30.00,
          currency || 'USD',
          tax_percentage || 0.00,
          price_rounding_method || 'nearest',
          include_labor_in_cost !== undefined ? include_labor_in_cost : true,
          include_overhead_in_cost !== undefined ? include_overhead_in_cost : true,
          include_packaging_in_cost !== undefined ? include_packaging_in_cost : false,
        ]
      );
      return res.json(result.rows[0]);
    }

    // Update existing config
    const result = await pool.query(
      `UPDATE restaurant_cost_config SET
        target_food_cost_percentage = COALESCE($1, target_food_cost_percentage),
        currency = COALESCE($2, currency),
        tax_percentage = COALESCE($3, tax_percentage),
        price_rounding_method = COALESCE($4, price_rounding_method),
        include_labor_in_cost = COALESCE($5, include_labor_in_cost),
        include_overhead_in_cost = COALESCE($6, include_overhead_in_cost),
        include_packaging_in_cost = COALESCE($7, include_packaging_in_cost),
        updated_at = NOW()
      WHERE restaurant_id = $8
      RETURNING *`,
      [
        target_food_cost_percentage,
        currency,
        tax_percentage,
        price_rounding_method,
        include_labor_in_cost,
        include_overhead_in_cost,
        include_packaging_in_cost,
        restaurantId,
      ]
    );

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error updating config:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== LABOR COSTS ====================

/**
 * GET /api/v1/advanced-costing/labor-positions
 * Get all labor positions
 */
router.get('/labor-positions', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const result = await pool.query(
      'SELECT * FROM labor_positions WHERE restaurant_id = $1 ORDER BY name',
      [restaurantId]
    );

    return res.json({ positions: result.rows });
  } catch (error: any) {
    console.error('[Advanced Costing] Error getting labor positions:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/advanced-costing/labor-positions
 * Create labor position
 */
router.post('/labor-positions', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const { name, description, monthly_salary, hours_per_month } = req.body;

    if (!name || !monthly_salary) {
      return res.status(400).json({ error: 'name and monthly_salary are required' });
    }

    const result = await pool.query(
      `INSERT INTO labor_positions (
        id, restaurant_id, name, description, monthly_salary, hours_per_month
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, COALESCE($5, 160))
      RETURNING *`,
      [restaurantId, name, description || null, monthly_salary, hours_per_month]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error creating labor position:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/advanced-costing/labor-positions/:id
 * Update labor position
 */
router.put('/labor-positions/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const { name, description, monthly_salary, hours_per_month, active } = req.body;

    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM labor_positions WHERE id = $1 AND restaurant_id = $2',
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Labor position not found' });
    }

    const result = await pool.query(
      `UPDATE labor_positions SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        monthly_salary = COALESCE($3, monthly_salary),
        hours_per_month = COALESCE($4, hours_per_month),
        active = COALESCE($5, active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *`,
      [name, description, monthly_salary, hours_per_month, active, id]
    );

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error updating labor position:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/advanced-costing/labor-positions/:id
 * Delete labor position
 */
router.delete('/labor-positions/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM labor_positions WHERE id = $1 AND restaurant_id = $2',
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Labor position not found' });
    }

    await pool.query('DELETE FROM labor_positions WHERE id = $1', [id]);

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[Advanced Costing] Error deleting labor position:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/advanced-costing/menu-items/:menuItemId/labor
 * Get labor costs for a menu item
 */
router.get('/menu-items/:menuItemId/labor', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Verify menu item belongs to restaurant
    const menuItemCheck = await pool.query(
      `SELECT mi.id 
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mi.id = $1 AND m.restaurant_id = $2`,
      [menuItemId, restaurantId]
    );

    if (menuItemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const result = await pool.query(
      `SELECT 
        mil.id,
        mil.menu_item_id,
        mil.labor_position_id,
        mil.preparation_time_minutes,
        lp.name as position_name,
        lp.cost_per_minute,
        (mil.preparation_time_minutes * lp.cost_per_minute) as total_labor_cost
       FROM menu_item_labor mil
       JOIN labor_positions lp ON mil.labor_position_id = lp.id
       WHERE mil.menu_item_id = $1`,
      [menuItemId]
    );

    return res.json({ labor: result.rows });
  } catch (error: any) {
    console.error('[Advanced Costing] Error getting menu item labor:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/advanced-costing/menu-items/:menuItemId/labor
 * Add labor cost to menu item
 */
router.post('/menu-items/:menuItemId/labor', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const { labor_position_id, preparation_time_minutes } = req.body;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    if (!labor_position_id || !preparation_time_minutes) {
      return res.status(400).json({ error: 'labor_position_id and preparation_time_minutes are required' });
    }

    // Verify menu item belongs to restaurant
    const menuItemCheck = await pool.query(
      `SELECT mi.id 
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mi.id = $1 AND m.restaurant_id = $2`,
      [menuItemId, restaurantId]
    );

    if (menuItemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check if already exists
    const existing = await pool.query(
      'SELECT id FROM menu_item_labor WHERE menu_item_id = $1 AND labor_position_id = $2',
      [menuItemId, labor_position_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Labor position already added to this menu item' });
    }

    const result = await pool.query(
      `INSERT INTO menu_item_labor (
        id, menu_item_id, labor_position_id, preparation_time_minutes
      ) VALUES (gen_random_uuid(), $1, $2, $3)
      RETURNING *`,
      [menuItemId, labor_position_id, preparation_time_minutes]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error adding labor to menu item:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/advanced-costing/menu-items/labor/:id
 * Remove labor cost from menu item
 */
router.delete('/menu-items/labor/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Verify ownership
    const check = await pool.query(
      `SELECT mil.id 
       FROM menu_item_labor mil
       JOIN menu_items mi ON mil.menu_item_id = mi.id
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mil.id = $1 AND m.restaurant_id = $2`,
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Labor assignment not found' });
    }

    await pool.query('DELETE FROM menu_item_labor WHERE id = $1', [id]);

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[Advanced Costing] Error deleting labor assignment:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== OVERHEAD COSTS ====================

/**
 * GET /api/v1/advanced-costing/overhead-costs
 * Get all overhead costs
 */
router.get('/overhead-costs', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const result = await pool.query(
      'SELECT * FROM overhead_costs WHERE restaurant_id = $1 ORDER BY category, name',
      [restaurantId]
    );

    return res.json({ costs: result.rows });
  } catch (error: any) {
    console.error('[Advanced Costing] Error getting overhead costs:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/advanced-costing/overhead-costs
 * Create overhead cost
 */
router.post('/overhead-costs', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const { name, description, monthly_amount, category } = req.body;

    if (!name || !monthly_amount) {
      return res.status(400).json({ error: 'name and monthly_amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO overhead_costs (
        id, restaurant_id, name, description, monthly_amount, category
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
      RETURNING *`,
      [restaurantId, name, description || null, monthly_amount, category || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error creating overhead cost:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/advanced-costing/overhead-costs/:id
 * Update overhead cost
 */
router.put('/overhead-costs/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const { name, description, monthly_amount, category, active } = req.body;

    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM overhead_costs WHERE id = $1 AND restaurant_id = $2',
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Overhead cost not found' });
    }

    const result = await pool.query(
      `UPDATE overhead_costs SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        monthly_amount = COALESCE($3, monthly_amount),
        category = COALESCE($4, category),
        active = COALESCE($5, active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *`,
      [name, description, monthly_amount, category, active, id]
    );

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error updating overhead cost:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/advanced-costing/overhead-costs/:id
 * Delete overhead cost
 */
router.delete('/overhead-costs/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM overhead_costs WHERE id = $1 AND restaurant_id = $2',
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Overhead cost not found' });
    }

    await pool.query('DELETE FROM overhead_costs WHERE id = $1', [id]);

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[Advanced Costing] Error deleting overhead cost:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/advanced-costing/overhead-allocation
 * Get overhead allocation method
 */
router.get('/overhead-allocation', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const result = await pool.query(
      'SELECT * FROM overhead_allocation_methods WHERE restaurant_id = $1 AND active = true ORDER BY created_at DESC LIMIT 1',
      [restaurantId]
    );

    if (result.rows.length === 0) {
      return res.json({ method: null });
    }

    return res.json({ method: result.rows[0] });
  } catch (error: any) {
    console.error('[Advanced Costing] Error getting overhead allocation:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/advanced-costing/overhead-allocation
 * Create or update overhead allocation method
 */
router.post('/overhead-allocation', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const { method_type, fixed_percentage, per_plate_amount, production_hours_per_month } = req.body;

    if (!method_type) {
      return res.status(400).json({ error: 'method_type is required' });
    }

    // Deactivate existing methods
    await pool.query(
      'UPDATE overhead_allocation_methods SET active = false WHERE restaurant_id = $1',
      [restaurantId]
    );

    // Create new method
    const result = await pool.query(
      `INSERT INTO overhead_allocation_methods (
        id, restaurant_id, method_type, fixed_percentage, per_plate_amount, production_hours_per_month
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
      RETURNING *`,
      [restaurantId, method_type, fixed_percentage || null, per_plate_amount || null, production_hours_per_month || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error creating overhead allocation:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== PACKAGING COSTS ====================

/**
 * GET /api/v1/advanced-costing/packaging-costs
 * Get all packaging costs
 */
router.get('/packaging-costs', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const result = await pool.query(
      'SELECT * FROM packaging_costs WHERE restaurant_id = $1 ORDER BY name',
      [restaurantId]
    );

    return res.json({ costs: result.rows });
  } catch (error: any) {
    console.error('[Advanced Costing] Error getting packaging costs:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/advanced-costing/packaging-costs
 * Create packaging cost
 */
router.post('/packaging-costs', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const { name, description, cost_per_unit, unit } = req.body;

    if (!name || !cost_per_unit) {
      return res.status(400).json({ error: 'name and cost_per_unit are required' });
    }

    const result = await pool.query(
      `INSERT INTO packaging_costs (
        id, restaurant_id, name, description, cost_per_unit, unit
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, COALESCE($5, 'unidad'))
      RETURNING *`,
      [restaurantId, name, description || null, cost_per_unit, unit]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error creating packaging cost:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/advanced-costing/packaging-costs/:id
 * Update packaging cost
 */
router.put('/packaging-costs/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const { name, description, cost_per_unit, unit, active } = req.body;

    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM packaging_costs WHERE id = $1 AND restaurant_id = $2',
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Packaging cost not found' });
    }

    const result = await pool.query(
      `UPDATE packaging_costs SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        cost_per_unit = COALESCE($3, cost_per_unit),
        unit = COALESCE($4, unit),
        active = COALESCE($5, active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *`,
      [name, description, cost_per_unit, unit, active, id]
    );

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error updating packaging cost:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/advanced-costing/packaging-costs/:id
 * Delete packaging cost
 */
router.delete('/packaging-costs/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM packaging_costs WHERE id = $1 AND restaurant_id = $2',
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Packaging cost not found' });
    }

    await pool.query('DELETE FROM packaging_costs WHERE id = $1', [id]);

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[Advanced Costing] Error deleting packaging cost:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/advanced-costing/menu-items/:menuItemId/packaging
 * Get packaging costs for a menu item
 */
router.get('/menu-items/:menuItemId/packaging', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Verify menu item belongs to restaurant
    const menuItemCheck = await pool.query(
      `SELECT mi.id 
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mi.id = $1 AND m.restaurant_id = $2`,
      [menuItemId, restaurantId]
    );

    if (menuItemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const result = await pool.query(
      `SELECT 
        mip.id,
        mip.menu_item_id,
        mip.packaging_cost_id,
        mip.quantity,
        mip.channel,
        pc.name as packaging_name,
        pc.cost_per_unit,
        (mip.quantity * pc.cost_per_unit) as total_packaging_cost
       FROM menu_item_packaging mip
       JOIN packaging_costs pc ON mip.packaging_cost_id = pc.id
       WHERE mip.menu_item_id = $1`,
      [menuItemId]
    );

    return res.json({ packaging: result.rows });
  } catch (error: any) {
    console.error('[Advanced Costing] Error getting menu item packaging:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/advanced-costing/menu-items/:menuItemId/packaging
 * Add packaging cost to menu item
 */
router.post('/menu-items/:menuItemId/packaging', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const { packaging_cost_id, quantity, channel } = req.body;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    if (!packaging_cost_id) {
      return res.status(400).json({ error: 'packaging_cost_id is required' });
    }

    // Verify menu item belongs to restaurant
    const menuItemCheck = await pool.query(
      `SELECT mi.id 
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mi.id = $1 AND m.restaurant_id = $2`,
      [menuItemId, restaurantId]
    );

    if (menuItemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const result = await pool.query(
      `INSERT INTO menu_item_packaging (
        id, menu_item_id, packaging_cost_id, quantity, channel
      ) VALUES (gen_random_uuid(), $1, $2, COALESCE($3, 1), COALESCE($4, 'all'))
      RETURNING *`,
      [menuItemId, packaging_cost_id, quantity, channel]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[Advanced Costing] Error adding packaging to menu item:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/advanced-costing/menu-items/packaging/:id
 * Remove packaging cost from menu item
 */
router.delete('/menu-items/packaging/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Verify ownership
    const check = await pool.query(
      `SELECT mip.id 
       FROM menu_item_packaging mip
       JOIN menu_items mi ON mip.menu_item_id = mi.id
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mip.id = $1 AND m.restaurant_id = $2`,
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Packaging assignment not found' });
    }

    await pool.query('DELETE FROM menu_item_packaging WHERE id = $1', [id]);

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[Advanced Costing] Error deleting packaging assignment:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== COMPLETE COST CALCULATION ====================

/**
 * GET /api/v1/advanced-costing/menu-items/:menuItemId/calculate-complete
 * Calculate complete cost including ingredients, labor, overhead, and packaging
 */
router.get('/menu-items/:menuItemId/calculate-complete', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Get config
    const configResult = await pool.query(
      'SELECT * FROM restaurant_cost_config WHERE restaurant_id = $1',
      [restaurantId]
    );
    const config = configResult.rows[0] || {
      include_labor_in_cost: true,
      include_overhead_in_cost: true,
      include_packaging_in_cost: false,
      target_food_cost_percentage: 30.00,
    };

    // Verify menu item belongs to restaurant
    const menuItemCheck = await pool.query(
      `SELECT mi.id, mi.name, mi.price
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mi.id = $1 AND m.restaurant_id = $2`,
      [menuItemId, restaurantId]
    );

    if (menuItemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const menuItem = menuItemCheck.rows[0];

    // Calculate ingredient costs
    const ingredientsResult = await pool.query(
      `SELECT 
        mii.quantity,
        mii.unit,
        ii.cost_per_unit,
        ii.unit as ingredient_unit
       FROM menu_item_ingredients mii
       JOIN inventory_items ii ON mii.inventory_item_id = ii.id
       WHERE mii.menu_item_id = $1`,
      [menuItemId]
    );

    let ingredientCost = 0;
    ingredientsResult.rows.forEach((row: any) => {
      const quantity = parseFloat(row.quantity);
      const costPerUnit = parseFloat(row.cost_per_unit);
      const recipeUnit = row.unit.toLowerCase();
      const inventoryUnit = row.ingredient_unit.toLowerCase();

      let cost = 0;
      if (recipeUnit === inventoryUnit) {
        cost = quantity * costPerUnit;
      } else if ((recipeUnit === 'g' || recipeUnit === 'gram' || recipeUnit === 'gramos') &&
                 (inventoryUnit === 'kg' || inventoryUnit === 'kilogram' || inventoryUnit === 'kilogramos')) {
        cost = (quantity / 1000) * costPerUnit;
      } else if ((recipeUnit === 'kg' || recipeUnit === 'kilogram' || recipeUnit === 'kilogramos') &&
                 (inventoryUnit === 'g' || inventoryUnit === 'gram' || inventoryUnit === 'gramos')) {
        cost = quantity * (costPerUnit / 1000);
      } else if ((recipeUnit === 'ml' || recipeUnit === 'mililitro' || recipeUnit === 'mililitros') &&
                 (inventoryUnit === 'l' || inventoryUnit === 'litro' || inventoryUnit === 'litros')) {
        cost = (quantity / 1000) * costPerUnit;
      } else if ((recipeUnit === 'l' || recipeUnit === 'litro' || recipeUnit === 'litros') &&
                 (inventoryUnit === 'ml' || inventoryUnit === 'mililitro' || inventoryUnit === 'mililitros')) {
        cost = quantity * (costPerUnit / 1000);
      } else {
        cost = quantity * costPerUnit;
      }
      ingredientCost += cost;
    });

    // Calculate labor costs
    let laborCost = 0;
    if (config.include_labor_in_cost) {
      const laborResult = await pool.query(
        `SELECT 
          mil.preparation_time_minutes,
          lp.cost_per_minute
         FROM menu_item_labor mil
         JOIN labor_positions lp ON mil.labor_position_id = lp.id
         WHERE mil.menu_item_id = $1`,
        [menuItemId]
      );

      laborResult.rows.forEach((row: any) => {
        laborCost += parseFloat(row.preparation_time_minutes) * parseFloat(row.cost_per_minute);
      });
    }

    // Calculate overhead costs
    let overheadCost = 0;
    if (config.include_overhead_in_cost) {
      // Get total monthly overhead
      const overheadResult = await pool.query(
        'SELECT SUM(monthly_amount) as total FROM overhead_costs WHERE restaurant_id = $1 AND active = true',
        [restaurantId]
      );
      const totalMonthlyOverhead = parseFloat(overheadResult.rows[0]?.total || 0);

      // Get allocation method
      const allocationResult = await pool.query(
        'SELECT * FROM overhead_allocation_methods WHERE restaurant_id = $1 AND active = true ORDER BY created_at DESC LIMIT 1',
        [restaurantId]
      );

      if (allocationResult.rows.length > 0) {
        const method = allocationResult.rows[0];
        if (method.method_type === 'per_plate' && method.per_plate_amount) {
          overheadCost = parseFloat(method.per_plate_amount);
        } else if (method.method_type === 'fixed_percentage' && method.fixed_percentage) {
          overheadCost = (ingredientCost + laborCost) * (parseFloat(method.fixed_percentage) / 100);
        } else if (method.method_type === 'production_hours' && method.production_hours_per_month) {
          // This would require tracking production hours, for now use a simple estimate
          // Assuming average 1 hour per plate preparation
          const hoursPerPlate = 1;
          overheadCost = (totalMonthlyOverhead / parseFloat(method.production_hours_per_month)) * hoursPerPlate;
        }
      } else {
        // Default: per plate based on total overhead / estimated monthly plates
        // Assuming 1000 plates per month as default
        overheadCost = totalMonthlyOverhead / 1000;
      }
    }

    // Calculate packaging costs
    let packagingCost = 0;
    if (config.include_packaging_in_cost) {
      const packagingResult = await pool.query(
        `SELECT 
          mip.quantity,
          pc.cost_per_unit
         FROM menu_item_packaging mip
         JOIN packaging_costs pc ON mip.packaging_cost_id = pc.id
         WHERE mip.menu_item_id = $1 AND pc.active = true`,
        [menuItemId]
      );

      packagingResult.rows.forEach((row: any) => {
        packagingCost += parseFloat(row.quantity) * parseFloat(row.cost_per_unit);
      });
    }

    // Calculate total cost
    const totalCost = ingredientCost + laborCost + overheadCost + packagingCost;

    // Calculate food cost percentage
    const sellingPrice = parseFloat(menuItem.price);
    const foodCostPercentage = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;

    // Calculate profit margin
    const profitMargin = sellingPrice - totalCost;
    const profitPercentage = sellingPrice > 0 ? (profitMargin / sellingPrice) * 100 : 0;

    // Calculate suggested price based on target food cost
    const targetFoodCost = parseFloat(config.target_food_cost_percentage || 30);
    const suggestedPrice = totalCost / (targetFoodCost / 100);

    // Round suggested price based on rounding method
    let roundedSuggestedPrice = suggestedPrice;
    const roundingMethod = config.price_rounding_method || 'nearest';
    if (roundingMethod === 'nearest') {
      roundedSuggestedPrice = Math.round(suggestedPrice);
    } else if (roundingMethod === 'up') {
      roundedSuggestedPrice = Math.ceil(suggestedPrice);
    } else if (roundingMethod === 'down') {
      roundedSuggestedPrice = Math.floor(suggestedPrice);
    }

    return res.json({
      menuItemId,
      menuItemName: menuItem.name,
      sellingPrice,
      costs: {
        ingredients: ingredientCost,
        labor: laborCost,
        overhead: overheadCost,
        packaging: packagingCost,
        total: totalCost,
      },
      foodCostPercentage,
      profitMargin,
      profitPercentage,
      targetFoodCostPercentage: targetFoodCost,
      suggestedPrice: roundedSuggestedPrice,
      config: {
        includeLabor: config.include_labor_in_cost,
        includeOverhead: config.include_overhead_in_cost,
        includePackaging: config.include_packaging_in_cost,
      },
    });
  } catch (error: any) {
    console.error('[Advanced Costing] Error calculating complete cost:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/advanced-costing/menu-items
 * Get all menu items with complete cost calculations
 */
router.get('/menu-items', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Get all menu items
    const menuItemsResult = await pool.query(
      `SELECT 
        mi.id,
        mi.name,
        mi.price,
        mc.name as category_name
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE m.restaurant_id = $1
       ORDER BY mc.name, mi.name`,
      [restaurantId]
    );

    // Get config
    const configResult = await pool.query(
      'SELECT * FROM restaurant_cost_config WHERE restaurant_id = $1',
      [restaurantId]
    );
    const config = configResult.rows[0] || {
      include_labor_in_cost: true,
      include_overhead_in_cost: true,
      include_packaging_in_cost: false,
      target_food_cost_percentage: 30.00,
    };

    const items = await Promise.all(
      menuItemsResult.rows.map(async (row: any) => {
        // Calculate costs (simplified version)
        const menuItemId = row.id;

        // Ingredient cost
        const ingredientsResult = await pool.query(
          `SELECT 
            mii.quantity,
            mii.unit,
            ii.cost_per_unit,
            ii.unit as ingredient_unit
           FROM menu_item_ingredients mii
           JOIN inventory_items ii ON mii.inventory_item_id = ii.id
           WHERE mii.menu_item_id = $1`,
          [menuItemId]
        );

        let ingredientCost = 0;
        ingredientsResult.rows.forEach((ingRow: any) => {
          const quantity = parseFloat(ingRow.quantity);
          const costPerUnit = parseFloat(ingRow.cost_per_unit);
          const recipeUnit = ingRow.unit.toLowerCase();
          const inventoryUnit = ingRow.ingredient_unit.toLowerCase();

          let cost = 0;
          if (recipeUnit === inventoryUnit) {
            cost = quantity * costPerUnit;
          } else if ((recipeUnit === 'g' || recipeUnit === 'gram' || recipeUnit === 'gramos') &&
                     (inventoryUnit === 'kg' || inventoryUnit === 'kilogram' || inventoryUnit === 'kilogramos')) {
            cost = (quantity / 1000) * costPerUnit;
          } else if ((recipeUnit === 'kg' || recipeUnit === 'kilogram' || recipeUnit === 'kilogramos') &&
                     (inventoryUnit === 'g' || inventoryUnit === 'gram' || inventoryUnit === 'gramos')) {
            cost = quantity * (costPerUnit / 1000);
          } else {
            cost = quantity * costPerUnit;
          }
          ingredientCost += cost;
        });

        // Labor cost
        let laborCost = 0;
        if (config.include_labor_in_cost) {
          const laborResult = await pool.query(
            `SELECT 
              mil.preparation_time_minutes,
              lp.cost_per_minute
             FROM menu_item_labor mil
             JOIN labor_positions lp ON mil.labor_position_id = lp.id
             WHERE mil.menu_item_id = $1`,
            [menuItemId]
          );

          laborResult.rows.forEach((labRow: any) => {
            laborCost += parseFloat(labRow.preparation_time_minutes) * parseFloat(labRow.cost_per_minute);
          });
        }

        // Overhead cost (simplified)
        let overheadCost = 0;
        if (config.include_overhead_in_cost) {
          const overheadResult = await pool.query(
            'SELECT SUM(monthly_amount) as total FROM overhead_costs WHERE restaurant_id = $1 AND active = true',
            [restaurantId]
          );
          const totalMonthlyOverhead = parseFloat(overheadResult.rows[0]?.total || 0);
          overheadCost = totalMonthlyOverhead / 1000; // Simplified: per plate
        }

        // Packaging cost
        let packagingCost = 0;
        if (config.include_packaging_in_cost) {
          const packagingResult = await pool.query(
            `SELECT 
              mip.quantity,
              pc.cost_per_unit
             FROM menu_item_packaging mip
             JOIN packaging_costs pc ON mip.packaging_cost_id = pc.id
             WHERE mip.menu_item_id = $1 AND pc.active = true`,
            [menuItemId]
          );

          packagingResult.rows.forEach((packRow: any) => {
            packagingCost += parseFloat(packRow.quantity) * parseFloat(packRow.cost_per_unit);
          });
        }

        const totalCost = ingredientCost + laborCost + overheadCost + packagingCost;
        const sellingPrice = parseFloat(row.price);
        const foodCostPercentage = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;
        const profitMargin = sellingPrice - totalCost;
        const profitPercentage = sellingPrice > 0 ? (profitMargin / sellingPrice) * 100 : 0;

        return {
          id: row.id,
          name: row.name,
          categoryName: row.category_name,
          price: sellingPrice,
          costs: {
            ingredients: ingredientCost,
            labor: laborCost,
            overhead: overheadCost,
            packaging: packagingCost,
            total: totalCost,
          },
          foodCostPercentage,
          profitMargin,
          profitPercentage,
          ingredientCount: ingredientsResult.rows.length,
        };
      })
    );

    return res.json({ items });
  } catch (error: any) {
    console.error('[Advanced Costing] Error getting menu items:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;






