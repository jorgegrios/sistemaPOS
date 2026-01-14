/**
 * Dynamic Pricing Routes
 * AI-powered pricing optimization system for menu items
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, AuthRequest } from './auth';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ==================== PRICE RECOMMENDATIONS ====================

/**
 * GET /api/v1/dynamic-pricing/menu-items/:menuItemId/recommend
 * Get AI-powered price recommendation for a menu item
 */
router.get('/menu-items/:menuItemId/recommend', verifyToken, async (req: AuthRequest, res: Response) => {
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
    const currentPrice = parseFloat(menuItem.price);

    // Get complete cost calculation
    const costResult = await pool.query(
      `SELECT * FROM restaurant_cost_config WHERE restaurant_id = $1`,
      [restaurantId]
    );
    const config = costResult.rows[0] || {
      target_food_cost_percentage: 30.00,
      include_labor_in_cost: true,
      include_overhead_in_cost: true,
      include_packaging_in_cost: false,
    };

    // Calculate total cost (simplified - should use the advanced costing endpoint)
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
      } else {
        cost = quantity * costPerUnit;
      }
      ingredientCost += cost;
    });

    // Get labor cost
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

    // Get overhead cost (simplified)
    let overheadCost = 0;
    if (config.include_overhead_in_cost) {
      const overheadResult = await pool.query(
        'SELECT SUM(monthly_amount) as total FROM overhead_costs WHERE restaurant_id = $1 AND active = true',
        [restaurantId]
      );
      const totalMonthlyOverhead = parseFloat(overheadResult.rows[0]?.total || 0);
      overheadCost = totalMonthlyOverhead / 1000; // Simplified
    }

    // Get packaging cost
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

    const totalCost = ingredientCost + laborCost + overheadCost + packagingCost;
    const targetFoodCost = parseFloat(config.target_food_cost_percentage || 30);

    // Get pricing config for this item
    const pricingConfigResult = await pool.query(
      'SELECT * FROM menu_item_pricing_config WHERE menu_item_id = $1',
      [menuItemId]
    );
    const pricingConfig = pricingConfigResult.rows[0];

    // Get sales history for elasticity calculation
    const salesHistoryResult = await pool.query(
      `SELECT 
        unit_price,
        quantity,
        sold_at
       FROM sales_history
       WHERE menu_item_id = $1
       ORDER BY sold_at DESC
       LIMIT 100`,
      [menuItemId]
    );

    // Get price elasticity
    const elasticityResult = await pool.query(
      'SELECT * FROM price_elasticity WHERE menu_item_id = $1',
      [menuItemId]
    );
    const elasticity = elasticityResult.rows[0];

    // Calculate base price (simple heuristic)
    let recommendedPrice = totalCost / (targetFoodCost / 100);

    // Apply psychological pricing
    const psychologicalPoints = pricingConfig?.psychological_price_points || [];
    if (psychologicalPoints.length > 0) {
      const points = Array.isArray(psychologicalPoints) ? psychologicalPoints : JSON.parse(psychologicalPoints);
      // Find closest psychological price point
      const closestPoint = points.reduce((prev: number, curr: number) => {
        return Math.abs(curr - recommendedPrice) < Math.abs(prev - recommendedPrice) ? curr : prev;
      }, points[0]);
      if (Math.abs(closestPoint - recommendedPrice) / recommendedPrice < 0.1) {
        recommendedPrice = closestPoint;
      }
    }

    // Round price based on config
    const roundingMethod = config.price_rounding_method || 'nearest';
    if (roundingMethod === 'nearest') {
      recommendedPrice = Math.round(recommendedPrice);
    } else if (roundingMethod === 'up') {
      recommendedPrice = Math.ceil(recommendedPrice);
    } else if (roundingMethod === 'down') {
      recommendedPrice = Math.floor(recommendedPrice);
    }

    // Apply price floor and ceiling
    if (pricingConfig?.price_floor) {
      recommendedPrice = Math.max(recommendedPrice, parseFloat(pricingConfig.price_floor.toString()));
    }
    if (pricingConfig?.price_ceiling) {
      recommendedPrice = Math.min(recommendedPrice, parseFloat(pricingConfig.price_ceiling.toString()));
    }

    // Calculate projected metrics
    const projectedFoodCost = recommendedPrice > 0 ? (totalCost / recommendedPrice) * 100 : 0;
    const projectedMargin = recommendedPrice - totalCost;
    const projectedMarginPercentage = recommendedPrice > 0 ? (projectedMargin / recommendedPrice) * 100 : 0;

    // Estimate sales impact based on elasticity
    let expectedSalesImpact = 0;
    let confidenceLevel = 70; // Default confidence

    if (elasticity && salesHistoryResult.rows.length > 0) {
      const elasticityCoeff = parseFloat(elasticity.elasticity_coefficient?.toString() || '-1');
      const priceChange = ((recommendedPrice - currentPrice) / currentPrice) * 100;
      expectedSalesImpact = priceChange * elasticityCoeff;
      confidenceLevel = Math.min(90, 70 + (salesHistoryResult.rows.length / 10));
    }

    // Calculate price range (min-max)
    const minPrice = pricingConfig?.price_floor || totalCost * 1.2; // At least 20% margin
    const maxPrice = pricingConfig?.price_ceiling || totalCost * 3; // Max 3x cost

    // Generate reasoning
    const reasoning = generateReasoning({
      currentPrice,
      recommendedPrice,
      totalCost,
      projectedFoodCost,
      projectedMarginPercentage,
      elasticity,
      salesHistoryCount: salesHistoryResult.rows.length,
    });

    // Save recommendation
    const recommendationId = uuidv4();
    await pool.query(
      `INSERT INTO price_recommendations (
        id, menu_item_id, current_price, recommended_price, min_price, max_price,
        projected_margin, projected_food_cost, expected_sales_impact, confidence_level,
        model_version, reasoning, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        recommendationId,
        menuItemId,
        currentPrice,
        recommendedPrice,
        minPrice,
        maxPrice,
        projectedMarginPercentage,
        projectedFoodCost,
        expectedSalesImpact,
        confidenceLevel,
        'v1.0-heuristic',
        reasoning,
        'pending'
      ]
    );

    return res.json({
      menuItemId,
      menuItemName: menuItem.name,
      currentPrice,
      recommendedPrice,
      minPrice,
      maxPrice,
      totalCost,
      projectedMargin,
      projectedMarginPercentage,
      projectedFoodCost,
      expectedSalesImpact,
      confidenceLevel,
      reasoning,
      recommendationId,
    });
  } catch (error: any) {
    console.error('[Dynamic Pricing] Error getting recommendation:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/dynamic-pricing/recommendations/:id/apply
 * Apply a price recommendation
 */
router.post('/recommendations/:id/apply', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Verify recommendation belongs to restaurant's menu item
    const check = await pool.query(
      `SELECT pr.* 
       FROM price_recommendations pr
       JOIN menu_items mi ON pr.menu_item_id = mi.id
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE pr.id = $1 AND m.restaurant_id = $2`,
      [id, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    const recommendation = check.rows[0];

    // Update menu item price
    await pool.query(
      'UPDATE menu_items SET price = $1 WHERE id = $2',
      [recommendation.recommended_price, recommendation.menu_item_id]
    );

    // Update recommendation status
    await pool.query(
      `UPDATE price_recommendations 
       SET status = 'applied', applied_at = NOW() 
       WHERE id = $1`,
      [id]
    );

    return res.json({ ok: true, message: 'Price applied successfully' });
  } catch (error: any) {
    console.error('[Dynamic Pricing] Error applying recommendation:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/dynamic-pricing/menu-items/:menuItemId/scenarios
 * Generate pricing scenarios for a menu item
 */
router.get('/menu-items/:menuItemId/scenarios', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Get menu item and cost
    const menuItemResult = await pool.query(
      `SELECT mi.id, mi.name, mi.price
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mi.id = $1 AND m.restaurant_id = $2`,
      [menuItemId, restaurantId]
    );

    if (menuItemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const menuItem = menuItemResult.rows[0];
    const currentPrice = parseFloat(menuItem.price);

    // Get total cost (simplified - should use advanced costing)
    // For now, estimate from current price and food cost
    const configResult = await pool.query(
      'SELECT target_food_cost_percentage FROM restaurant_cost_config WHERE restaurant_id = $1',
      [restaurantId]
    );
    const targetFoodCost = parseFloat(configResult.rows[0]?.target_food_cost_percentage || 30);
    const estimatedCost = currentPrice * (targetFoodCost / 100);

    // Get elasticity
    const elasticityResult = await pool.query(
      'SELECT * FROM price_elasticity WHERE menu_item_id = $1',
      [menuItemId]
    );
    const elasticity = elasticityResult.rows[0];
    const elasticityCoeff = parseFloat(elasticity?.elasticity_coefficient?.toString() || '-1.5');

    // Get base volume
    const salesResult = await pool.query(
      `SELECT AVG(quantity) as avg_volume, COUNT(*) as total_sales
       FROM sales_history
       WHERE menu_item_id = $1
       AND sold_at >= NOW() - INTERVAL '30 days'`,
      [menuItemId]
    );
    const baseVolume = parseInt(salesResult.rows[0]?.avg_volume || '10');
    const totalSales = parseInt(salesResult.rows[0]?.total_sales || '0');

    // Generate scenarios
    const scenarios = [
      {
        name: 'Precio Bajo (-10%)',
        testPrice: currentPrice * 0.9,
        description: 'Reducir precio para aumentar volumen'
      },
      {
        name: 'Precio Actual',
        testPrice: currentPrice,
        description: 'Mantener precio actual'
      },
      {
        name: 'Precio Óptimo',
        testPrice: estimatedCost / (targetFoodCost / 100),
        description: 'Precio basado en food cost objetivo'
      },
      {
        name: 'Precio Alto (+10%)',
        testPrice: currentPrice * 1.1,
        description: 'Aumentar precio para maximizar margen'
      }
    ];

    const calculatedScenarios = scenarios.map(scenario => {
      const priceChange = ((scenario.testPrice - currentPrice) / currentPrice) * 100;
      const volumeChange = priceChange * elasticityCoeff;
      const projectedVolume = Math.max(1, Math.round(baseVolume * (1 + volumeChange / 100)));
      const projectedRevenue = scenario.testPrice * projectedVolume;
      const projectedMargin = scenario.testPrice - estimatedCost;
      const projectedMarginTotal = projectedMargin * projectedVolume;
      const projectedFoodCost = scenario.testPrice > 0 ? (estimatedCost / scenario.testPrice) * 100 : 0;

      return {
        ...scenario,
        testPrice: Math.round(scenario.testPrice * 100) / 100,
        projectedVolume,
        projectedRevenue: Math.round(projectedRevenue * 100) / 100,
        projectedMargin: Math.round(projectedMargin * 100) / 100,
        projectedMarginTotal: Math.round(projectedMarginTotal * 100) / 100,
        projectedFoodCost: Math.round(projectedFoodCost * 100) / 100,
        volumeChange: Math.round(volumeChange * 100) / 100,
      };
    });

    return res.json({ scenarios: calculatedScenarios });
  } catch (error: any) {
    console.error('[Dynamic Pricing] Error generating scenarios:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/dynamic-pricing/menu-items/:menuItemId/elasticity
 * Calculate or get price elasticity for a menu item
 */
router.get('/menu-items/:menuItemId/elasticity', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Get existing elasticity
    const existingResult = await pool.query(
      'SELECT * FROM price_elasticity WHERE menu_item_id = $1',
      [menuItemId]
    );

    if (existingResult.rows.length > 0) {
      return res.json({ elasticity: existingResult.rows[0] });
    }

    // Calculate elasticity from sales history
    const salesResult = await pool.query(
      `SELECT 
        unit_price,
        SUM(quantity) as total_quantity,
        COUNT(*) as transaction_count
       FROM sales_history
       WHERE menu_item_id = $1
       GROUP BY unit_price
       ORDER BY unit_price`,
      [menuItemId]
    );

    if (salesResult.rows.length < 2) {
      // Not enough data, return default
      return res.json({
        elasticity: {
          elasticity_coefficient: -1.5,
          price_sensitivity: 'elastic',
          base_volume: 10,
          base_price: 0,
          calculated_at: new Date().toISOString(),
        }
      });
    }

    // Simple elasticity calculation
    const prices = salesResult.rows.map((r: any) => parseFloat(r.unit_price));
    const quantities = salesResult.rows.map((r: any) => parseFloat(r.total_quantity));
    
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgQuantity = quantities.reduce((a, b) => a + b, 0) / quantities.length;

    // Calculate price elasticity coefficient
    let elasticityCoeff = -1.5; // Default
    if (prices.length >= 2) {
      const priceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
      const quantityChange = (quantities[quantities.length - 1] - quantities[0]) / quantities[0];
      if (priceChange !== 0) {
        elasticityCoeff = quantityChange / priceChange;
      }
    }

    const priceSensitivity = Math.abs(elasticityCoeff) > 1 ? 'elastic' : 
                            Math.abs(elasticityCoeff) < 1 ? 'inelastic' : 'unitary';

    // Save elasticity
    const id = uuidv4();
    await pool.query(
      `INSERT INTO price_elasticity (
        id, menu_item_id, elasticity_coefficient, price_sensitivity,
        base_volume, base_price
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, menuItemId, elasticityCoeff, priceSensitivity, Math.round(avgQuantity), avgPrice]
    );

    return res.json({
      elasticity: {
        id,
        menu_item_id: menuItemId,
        elasticity_coefficient: elasticityCoeff,
        price_sensitivity: priceSensitivity,
        base_volume: Math.round(avgQuantity),
        base_price: avgPrice,
        calculated_at: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('[Dynamic Pricing] Error calculating elasticity:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/dynamic-pricing/menu-items/:menuItemId/recommendations
 * Get all recommendations for a menu item
 */
router.get('/menu-items/:menuItemId/recommendations', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const result = await pool.query(
      `SELECT pr.* 
       FROM price_recommendations pr
       JOIN menu_items mi ON pr.menu_item_id = mi.id
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE pr.menu_item_id = $1 AND m.restaurant_id = $2
       ORDER BY pr.created_at DESC
       LIMIT 20`,
      [menuItemId, restaurantId]
    );

    return res.json({ recommendations: result.rows });
  } catch (error: any) {
    console.error('[Dynamic Pricing] Error getting recommendations:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/dynamic-pricing/menu-items/:menuItemId/pricing-config
 * Update pricing configuration for a menu item
 */
router.put('/menu-items/:menuItemId/pricing-config', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const {
      category_type,
      min_margin_percentage,
      target_food_cost,
      price_floor,
      price_ceiling,
      psychological_price_points,
      enable_dynamic_pricing,
    } = req.body;

    // Verify menu item belongs to restaurant
    const check = await pool.query(
      `SELECT mi.id 
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       JOIN menus m ON mc.menu_id = m.id
       WHERE mi.id = $1 AND m.restaurant_id = $2`,
      [menuItemId, restaurantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check if config exists
    const existingResult = await pool.query(
      'SELECT id FROM menu_item_pricing_config WHERE menu_item_id = $1',
      [menuItemId]
    );

    if (existingResult.rows.length === 0) {
      // Create new config
      const id = uuidv4();
      await pool.query(
        `INSERT INTO menu_item_pricing_config (
          id, menu_item_id, category_type, min_margin_percentage, target_food_cost,
          price_floor, price_ceiling, psychological_price_points, enable_dynamic_pricing
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          menuItemId,
          category_type || null,
          min_margin_percentage || null,
          target_food_cost || null,
          price_floor || null,
          price_ceiling || null,
          psychological_price_points ? JSON.stringify(psychological_price_points) : null,
          enable_dynamic_pricing !== undefined ? enable_dynamic_pricing : true,
        ]
      );
      return res.json({ id, menu_item_id: menuItemId, ...req.body });
    } else {
      // Update existing config
      const result = await pool.query(
        `UPDATE menu_item_pricing_config SET
          category_type = COALESCE($1, category_type),
          min_margin_percentage = COALESCE($2, min_margin_percentage),
          target_food_cost = COALESCE($3, target_food_cost),
          price_floor = COALESCE($4, price_floor),
          price_ceiling = COALESCE($5, price_ceiling),
          psychological_price_points = COALESCE($6, psychological_price_points),
          enable_dynamic_pricing = COALESCE($7, enable_dynamic_pricing),
          updated_at = NOW()
        WHERE menu_item_id = $8
        RETURNING *`,
        [
          category_type,
          min_margin_percentage,
          target_food_cost,
          price_floor,
          price_ceiling,
          psychological_price_points ? JSON.stringify(psychological_price_points) : null,
          enable_dynamic_pricing,
          menuItemId,
        ]
      );
      return res.json(result.rows[0]);
    }
  } catch (error: any) {
    console.error('[Dynamic Pricing] Error updating pricing config:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/dynamic-pricing/menu-items/:menuItemId/pricing-config
 * Get pricing configuration for a menu item
 */
router.get('/menu-items/:menuItemId/pricing-config', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const result = await pool.query(
      'SELECT * FROM menu_item_pricing_config WHERE menu_item_id = $1',
      [menuItemId]
    );

    if (result.rows.length === 0) {
      return res.json({ config: null });
    }

    const config = result.rows[0];
    if (config.psychological_price_points) {
      config.psychological_price_points = typeof config.psychological_price_points === 'string' 
        ? JSON.parse(config.psychological_price_points)
        : config.psychological_price_points;
    }

    return res.json({ config });
  } catch (error: any) {
    console.error('[Dynamic Pricing] Error getting pricing config:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Helper function to generate reasoning
function generateReasoning(params: any): string {
  const {
    currentPrice,
    recommendedPrice,
    totalCost,
    projectedFoodCost,
    projectedMarginPercentage,
    elasticity,
    salesHistoryCount,
  } = params;

  let reasoning = '';

  if (recommendedPrice > currentPrice) {
    reasoning += `Se recomienda aumentar el precio de $${currentPrice.toFixed(2)} a $${recommendedPrice.toFixed(2)}. `;
  } else if (recommendedPrice < currentPrice) {
    reasoning += `Se recomienda reducir el precio de $${currentPrice.toFixed(2)} a $${recommendedPrice.toFixed(2)}. `;
  } else {
    reasoning += `El precio actual de $${currentPrice.toFixed(2)} es óptimo. `;
  }

  reasoning += `El food cost proyectado sería ${projectedFoodCost.toFixed(1)}% y el margen ${projectedMarginPercentage.toFixed(1)}%. `;

  if (elasticity) {
    const sensitivity = elasticity.price_sensitivity;
    if (sensitivity === 'inelastic') {
      reasoning += 'Este plato tiene demanda inelástica, por lo que cambios de precio tendrán menor impacto en el volumen de ventas. ';
    } else if (sensitivity === 'elastic') {
      reasoning += 'Este plato tiene demanda elástica, por lo que cambios de precio pueden afectar significativamente el volumen de ventas. ';
    }
  }

  if (salesHistoryCount < 10) {
    reasoning += 'Nota: Hay datos limitados de ventas históricas, la recomendación tiene menor confianza. ';
  }

  return reasoning.trim();
}

export default router;






