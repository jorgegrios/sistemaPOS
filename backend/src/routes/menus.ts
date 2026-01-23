import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, AuthRequest } from './auth';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/v1/menus/:restaurantId
 * Get all menus for a restaurant
 */
router.get('/:restaurantId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await pool.query(
      `SELECT m.id, m.name, m.description, 
        COUNT(DISTINCT mc.id) as category_count,
        COUNT(DISTINCT mi.id) as item_count
       FROM menus m
       LEFT JOIN menu_categories mc ON m.id = mc.menu_id
       LEFT JOIN menu_items mi ON mc.id = mi.category_id
       WHERE m.restaurant_id = $1 AND m.company_id = $2 AND m.active = true
       GROUP BY m.id
       ORDER BY m.created_at`,
      [restaurantId, companyId]
    );

    return res.json({
      menus: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        categoryCount: parseInt(row.category_count),
        itemCount: parseInt(row.item_count)
      }))
    });
  } catch (error: any) {
    console.error('[Menus] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/menus/:restaurantId/:menuId
 * Get menu with categories and items
 */
router.get('/:restaurantId/:menuId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId, menuId } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    // Get menu with company check
    const menuResult = await pool.query(
      'SELECT * FROM menus WHERE id = $1 AND restaurant_id = $2 AND company_id = $3',
      [menuId, restaurantId, companyId]
    );

    if (menuResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found or unauthorized' });
    }

    const menu = menuResult.rows[0];

    // Get categories with items (isolation ensured by menuId check)
    const categoriesResult = await pool.query(
      `SELECT mc.id, mc.name, mc.display_order, COALESCE(mc.metadata, '{}'::jsonb) as metadata,
        json_agg(json_build_object(
          'id', mi.id,
          'name', mi.name,
          'description', mi.description,
          'price', mi.price,
          'basePrice', COALESCE(mi.base_price, mi.price),
          'available', mi.available,
          'imageUrl', mi.image_url,
          'metadata', COALESCE(mi.metadata, '{}'::jsonb)
        ) ORDER BY mi.display_order) as items
       FROM menu_categories mc
       LEFT JOIN menu_items mi ON mc.id = mi.category_id
       WHERE mc.menu_id = $1
       GROUP BY mc.id, mc.metadata
       ORDER BY mc.display_order`,
      [menuId]
    );

    return res.json({
      id: menu.id,
      name: menu.name,
      description: menu.description,
      categories: categoriesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        displayOrder: row.display_order,
        metadata: row.metadata || {},
        items: (row.items || []).filter((i: any) => i.id !== null).map((item: any) => ({
          ...item,
          metadata: item.metadata || {}
        }))
      }))
    });
  } catch (error: any) {
    console.error('[Menus] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/menus/:restaurantId
 * Create new menu
 */
router.post('/:restaurantId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { name, description } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });
    if (!name) return res.status(400).json({ error: 'Menu name is required' });

    const menuId = uuidv4();
    await pool.query(
      `INSERT INTO menus (id, restaurant_id, company_id, name, description, active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [menuId, restaurantId, companyId, name, description || null]
    );

    return res.status(201).json({
      id: menuId,
      restaurantId,
      name,
      description
    });
  } catch (error: any) {
    console.error('[Menus] Error creating menu:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/menus/categories
 * Create new menu category
 */
router.post('/categories', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { menuId, name, displayOrder } = req.body;

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const categoryId = uuidv4();
    await pool.query(
      `INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [categoryId, menuId, companyId, name, displayOrder || 0]
    );

    return res.status(201).json({
      id: categoryId,
      menuId,
      name,
      displayOrder: displayOrder || 0
    });
  } catch (error: any) {
    console.error('[Menus] Error creating category:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/menus/categories/:id
 * Update menu category
 */
router.put('/categories/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, displayOrder } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }

    if (displayOrder !== undefined) {
      updates.push(`display_order = $${paramCount}`);
      params.push(displayOrder);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    params.push(id);
    params.push(companyId);

    const result = await pool.query(
      `UPDATE menu_categories SET ${updates.join(', ')} WHERE id = $${paramCount} AND company_id = $${paramCount + 1} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.json({
      id: result.rows[0].id,
      menuId: result.rows[0].menu_id,
      name: result.rows[0].name,
      displayOrder: result.rows[0].display_order
    });
  } catch (error: any) {
    console.error('[Menus] Error updating category:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/menus/categories/:id
 * Delete menu category
 */
router.delete('/categories/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await pool.query(
      'DELETE FROM menu_categories WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.json({ ok: true, message: 'Category deleted' });
  } catch (error: any) {
    console.error('[Menus] Error deleting category:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/menus/items
 * Create new menu item
 */
router.post('/items', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, name, description, price, imageUrl, available, metadata } = req.body;

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const itemId = uuidv4();

    // Preparar metadata (ingredientes, imagen, etc.)
    const metadataJson = metadata || (imageUrl ? { imageUrl } : null);

    await pool.query(
      `INSERT INTO menu_items (id, company_id, category_id, name, description, price, base_price, image_url, available, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9)`,
      [
        itemId,
        companyId,
        categoryId,
        name,
        description || null,
        price,
        imageUrl || null,
        available !== false,
        metadataJson ? JSON.stringify(metadataJson) : null
      ]
    );

    const result = await pool.query(
      'SELECT * FROM menu_items WHERE id = $1',
      [itemId]
    );

    const item = result.rows[0];

    return res.status(201).json({
      id: item.id,
      categoryId: item.category_id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      basePrice: item.base_price ? parseFloat(item.base_price) : parseFloat(item.price),
      imageUrl: item.image_url,
      available: item.available,
      metadata: item.metadata || {}
    });
  } catch (error: any) {
    console.error('[Items] Error creating item:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/menus/items/:id
 * Get menu item details
 */
router.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM menu_items WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = result.rows[0];

    return res.json({
      id: item.id,
      categoryId: item.category_id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      imageUrl: item.image_url,
      available: item.available,
      metadata: item.metadata
    });
  } catch (error: any) {
    console.error('[Items] Error getting item:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/menus/items/:id
 * Update menu item (price, availability, description)
 */
router.put('/items/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, available, imageUrl, metadata } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }

    if (description) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      params.push(price);
      paramCount++;
    }

    if (available !== undefined) {
      updates.push(`available = $${paramCount}`);
      params.push(available);
      paramCount++;
    }

    if (imageUrl) {
      updates.push(`image_url = $${paramCount}`);
      params.push(imageUrl);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    params.push(id);
    params.push(companyId);

    const result = await pool.query(
      `UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${paramCount} AND company_id = $${paramCount + 1} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = result.rows[0];

    return res.json({
      id: item.id,
      categoryId: item.category_id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      available: item.available
    });
  } catch (error: any) {
    console.error('[Items] Error updating item:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/menus/items/:id
 * Delete menu item
 */
router.delete('/items/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await pool.query(
      'DELETE FROM menu_items WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json({ ok: true, message: 'Item deleted' });
  } catch (error: any) {
    console.error('[Items] Error deleting item:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
