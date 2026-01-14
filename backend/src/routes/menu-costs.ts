/**
 * Menu Costs Routes
 * Calculate and manage costs of menu items based on ingredients
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, AuthRequest } from './auth';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/v1/menu-costs/items/:menuItemId/ingredients
 * Get all ingredients for a menu item
 */
router.get('/items/:menuItemId/ingredients', verifyToken, async (req: AuthRequest, res: Response) => {
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

    // Get ingredients
    const result = await pool.query(
      `SELECT 
        mii.id,
        mii.menu_item_id,
        mii.inventory_item_id,
        mii.quantity,
        mii.unit,
        ii.name as ingredient_name,
        ii.unit as ingredient_unit,
        ii.cost_per_unit
       FROM menu_item_ingredients mii
       JOIN inventory_items ii ON mii.inventory_item_id = ii.id
       WHERE mii.menu_item_id = $1
       ORDER BY ii.name`,
      [menuItemId]
    );

    return res.json({
      ingredients: result.rows.map((row: any) => ({
        id: row.id,
        menuItemId: row.menu_item_id,
        inventoryItemId: row.inventory_item_id,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        ingredientName: row.ingredient_name,
        ingredientUnit: row.ingredient_unit,
        costPerUnit: parseFloat(row.cost_per_unit)
      }))
    });
  } catch (error: any) {
    console.error('[Menu Costs] Error getting ingredients:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/menu-costs/items/:menuItemId/ingredients
 * Add ingredient to menu item
 */
router.post('/items/:menuItemId/ingredients', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const { inventoryItemId, quantity, unit } = req.body;
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    if (!inventoryItemId || !quantity || !unit) {
      return res.status(400).json({ error: 'inventoryItemId, quantity, and unit are required' });
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

    // Check if ingredient already exists
    const existing = await pool.query(
      'SELECT id FROM menu_item_ingredients WHERE menu_item_id = $1 AND inventory_item_id = $2',
      [menuItemId, inventoryItemId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ingredient already added to this menu item' });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO menu_item_ingredients (id, menu_item_id, inventory_item_id, quantity, unit)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, menuItemId, inventoryItemId, quantity, unit]
    );

    return res.status(201).json({
      id,
      menuItemId,
      inventoryItemId,
      quantity: parseFloat(quantity),
      unit
    });
  } catch (error: any) {
    console.error('[Menu Costs] Error adding ingredient:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/menu-costs/ingredients/:id
 * Update ingredient quantity
 */
router.put('/ingredients/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, unit } = req.body;
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    if (!quantity || !unit) {
      return res.status(400).json({ error: 'quantity and unit are required' });
    }

    // Verify ingredient belongs to restaurant's menu item
    const check = await pool.query(
      `SELECT mii.id 
       FROM menu_item_ingredients mii
       JOIN menu_items mi ON mii.menu_item_id = mi.id
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mii.id = $1 AND m.restaurant_id = $2`,
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    await pool.query(
      'UPDATE menu_item_ingredients SET quantity = $1, unit = $2 WHERE id = $3',
      [quantity, unit, id]
    );

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[Menu Costs] Error updating ingredient:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/menu-costs/ingredients/:id
 * Remove ingredient from menu item
 */
router.delete('/ingredients/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Verify ingredient belongs to restaurant's menu item
    const check = await pool.query(
      `SELECT mii.id 
       FROM menu_item_ingredients mii
       JOIN menu_items mi ON mii.menu_item_id = mi.id
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mii.id = $1 AND m.restaurant_id = $2`,
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    await pool.query('DELETE FROM menu_item_ingredients WHERE id = $1', [id]);

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[Menu Costs] Error deleting ingredient:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/menu-costs/items/:menuItemId/calculate
 * Calculate total cost of a menu item based on ingredients
 */
router.get('/items/:menuItemId/calculate', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

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

    // Get ingredients with costs
    const ingredientsResult = await pool.query(
      `SELECT 
        mii.id,
        mii.quantity,
        mii.unit,
        ii.name as ingredient_name,
        ii.unit as ingredient_unit,
        ii.cost_per_unit
       FROM menu_item_ingredients mii
       JOIN inventory_items ii ON mii.inventory_item_id = ii.id
       WHERE mii.menu_item_id = $1`,
      [menuItemId]
    );

    let totalCost = 0;
    const ingredientCosts = ingredientsResult.rows.map((row: any) => {
      const quantity = parseFloat(row.quantity);
      const costPerUnit = parseFloat(row.cost_per_unit);
      const recipeUnit = row.unit.toLowerCase();
      const inventoryUnit = row.ingredient_unit.toLowerCase();
      
      // Calculate cost based on unit conversion
      let cost = 0;
      
      // If units match, direct calculation
      if (recipeUnit === inventoryUnit) {
        cost = quantity * costPerUnit;
      }
      // For grams specifically: if recipe is in grams and inventory is in kg
      else if ((recipeUnit === 'g' || recipeUnit === 'gram' || recipeUnit === 'gramos') && 
               (inventoryUnit === 'kg' || inventoryUnit === 'kilogram' || inventoryUnit === 'kilogramos')) {
        cost = (quantity / 1000) * costPerUnit;
      }
      // If recipe is in kg and inventory is in grams
      else if ((recipeUnit === 'kg' || recipeUnit === 'kilogram' || recipeUnit === 'kilogramos') && 
               (inventoryUnit === 'g' || inventoryUnit === 'gram' || inventoryUnit === 'gramos')) {
        cost = quantity * (costPerUnit / 1000);
      }
      // For milliliters and liters
      else if ((recipeUnit === 'ml' || recipeUnit === 'mililitro' || recipeUnit === 'mililitros') && 
               (inventoryUnit === 'l' || inventoryUnit === 'litro' || inventoryUnit === 'litros')) {
        cost = (quantity / 1000) * costPerUnit;
      }
      else if ((recipeUnit === 'l' || recipeUnit === 'litro' || recipeUnit === 'litros') && 
               (inventoryUnit === 'ml' || inventoryUnit === 'mililitro' || inventoryUnit === 'mililitros')) {
        cost = quantity * (costPerUnit / 1000);
      }
      // For same unit types or 'unidad', direct multiplication
      else {
        cost = quantity * costPerUnit;
      }

      totalCost += cost;

      return {
        id: row.id,
        ingredientName: row.ingredient_name,
        quantity: quantity,
        unit: row.unit,
        ingredientUnit: row.ingredient_unit,
        costPerUnit: costPerUnit,
        cost: cost
      };
    });

    return res.json({
      menuItemId,
      menuItemName: menuItem.name,
      menuItemPrice: parseFloat(menuItem.price),
      totalCost: totalCost,
      profitMargin: menuItem.price - totalCost,
      profitPercentage: menuItem.price > 0 ? ((menuItem.price - totalCost) / menuItem.price) * 100 : 0,
      ingredients: ingredientCosts
    });
  } catch (error: any) {
    console.error('[Menu Costs] Error calculating cost:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/menu-costs/items
 * Get all menu items with their calculated costs
 */
router.get('/items', verifyToken, async (req: AuthRequest, res: Response) => {
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

    const items = await Promise.all(
      menuItemsResult.rows.map(async (row: any) => {
        // Get ingredients count and calculate cost
        const ingredientsResult = await pool.query(
          `SELECT 
            mii.quantity,
            mii.unit,
            ii.cost_per_unit,
            ii.unit as ingredient_unit
           FROM menu_item_ingredients mii
           JOIN inventory_items ii ON mii.inventory_item_id = ii.id
           WHERE mii.menu_item_id = $1`,
          [row.id]
        );

        let totalCost = 0;
        ingredientsResult.rows.forEach((ingRow: any) => {
          const quantity = parseFloat(ingRow.quantity);
          const costPerUnit = parseFloat(ingRow.cost_per_unit);
          
          if (ingRow.unit.toLowerCase() === 'g' || ingRow.unit.toLowerCase() === 'gram' || ingRow.unit.toLowerCase() === 'gramos') {
            if (ingRow.ingredient_unit.toLowerCase() === 'g' || ingRow.ingredient_unit.toLowerCase() === 'gram' || ingRow.ingredient_unit.toLowerCase() === 'gramos') {
              totalCost += (quantity / 1000) * costPerUnit;
            } else {
              totalCost += quantity * costPerUnit;
            }
          } else {
            totalCost += quantity * costPerUnit;
          }
        });

        return {
          id: row.id,
          name: row.name,
          categoryName: row.category_name,
          price: parseFloat(row.price),
          cost: totalCost,
          profitMargin: parseFloat(row.price) - totalCost,
          profitPercentage: parseFloat(row.price) > 0 ? ((parseFloat(row.price) - totalCost) / parseFloat(row.price)) * 100 : 0,
          ingredientCount: ingredientsResult.rows.length
        };
      })
    );

    return res.json({ items });
  } catch (error: any) {
    console.error('[Menu Costs] Error getting items:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

