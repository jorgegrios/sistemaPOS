"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pg_1 = require("pg");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
/**
 * GET /api/v1/menus/:restaurantId
 * Get all menus for a restaurant
 */
router.get('/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const result = await pool.query(`SELECT m.id, m.name, m.description, 
        COUNT(DISTINCT mc.id) as category_count,
        COUNT(DISTINCT mi.id) as item_count
       FROM menus m
       LEFT JOIN menu_categories mc ON m.id = mc.menu_id
       LEFT JOIN menu_items mi ON mc.id = mi.category_id
       WHERE m.restaurant_id = $1 AND m.active = true
       GROUP BY m.id
       ORDER BY m.created_at`, [restaurantId]);
        return res.json({
            menus: result.rows.map(row => ({
                id: row.id,
                name: row.name,
                description: row.description,
                categoryCount: parseInt(row.category_count),
                itemCount: parseInt(row.item_count)
            }))
        });
    }
    catch (error) {
        console.error('[Menus] Error:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/v1/menus/:restaurantId/:menuId
 * Get menu with categories and items
 */
router.get('/:restaurantId/:menuId', async (req, res) => {
    try {
        const { restaurantId, menuId } = req.params;
        // Get menu
        const menuResult = await pool.query('SELECT * FROM menus WHERE id = $1 AND restaurant_id = $2', [menuId, restaurantId]);
        if (menuResult.rows.length === 0) {
            return res.status(404).json({ error: 'Menu not found' });
        }
        const menu = menuResult.rows[0];
        // Get categories with items
        const categoriesResult = await pool.query(`SELECT mc.id, mc.name, mc.display_order,
        json_agg(json_build_object(
          'id', mi.id,
          'name', mi.name,
          'description', mi.description,
          'price', mi.price,
          'available', mi.available,
          'imageUrl', mi.image_url
        ) ORDER BY mi.display_order) as items
       FROM menu_categories mc
       LEFT JOIN menu_items mi ON mc.id = mi.category_id
       WHERE mc.menu_id = $1
       GROUP BY mc.id
       ORDER BY mc.display_order`, [menuId]);
        return res.json({
            id: menu.id,
            name: menu.name,
            description: menu.description,
            categories: categoriesResult.rows.map(row => ({
                id: row.id,
                name: row.name,
                displayOrder: row.display_order,
                items: row.items.filter((i) => i.id !== null) // Filter out null items
            }))
        });
    }
    catch (error) {
        console.error('[Menus] Error:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/items
 * Create new menu item
 */
router.post('/', async (req, res) => {
    try {
        const { categoryId, name, description, price, imageUrl, available } = req.body;
        if (!categoryId || !name || price === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const itemId = (0, uuid_1.v4)();
        await pool.query(`INSERT INTO menu_items (id, category_id, name, description, price, image_url, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [itemId, categoryId, name, description, price, imageUrl, available !== false]);
        return res.status(201).json({
            id: itemId,
            categoryId,
            name,
            description,
            price,
            imageUrl,
            available: available !== false
        });
    }
    catch (error) {
        console.error('[Items] Error creating item:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/v1/items/:id
 * Get menu item details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
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
    }
    catch (error) {
        console.error('[Items] Error getting item:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * PUT /api/v1/items/:id
 * Update menu item (price, availability, description)
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, available, imageUrl } = req.body;
        const updates = [];
        const params = [];
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
        params.push(id);
        const result = await pool.query(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, params);
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
    }
    catch (error) {
        console.error('[Items] Error updating item:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * DELETE /api/v1/items/:id
 * Delete menu item
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        return res.json({ ok: true, message: 'Item deleted' });
    }
    catch (error) {
        console.error('[Items] Error deleting item:', error);
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
