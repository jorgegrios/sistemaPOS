import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * POST /api/v1/orders
 * Create a new order
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { tableId, waiterId, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now()}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Create order
    const result = await pool.query(
      `INSERT INTO orders (id, order_number, table_id, waiter_id, status, subtotal, tax, total, payment_status)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, 'pending')
       RETURNING *`,
      [orderId, orderNumber, tableId, waiterId, subtotal, tax, total]
    );

    const order = result.rows[0];

    // Create order items
    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), orderId, item.menuItemId, item.name, item.price, item.quantity, item.notes || null]
      );
    }

    return res.status(201).json({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax),
      total: parseFloat(order.total),
      itemCount: items.length
    });
  } catch (error: any) {
    console.error('[Orders] Error creating order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/orders
 * List all orders with filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return res.json({
      orders: result.rows.map(row => ({
        id: row.id,
        orderNumber: row.order_number,
        status: row.status,
        paymentStatus: row.payment_status,
        subtotal: parseFloat(row.subtotal),
        tax: parseFloat(row.tax),
        total: parseFloat(row.total),
        createdAt: row.created_at,
        paidAt: row.paid_at
      })),
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('[Orders] Error listing orders:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/orders/:id
 * Get order details with items
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get order
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get items
    const itemsResult = await pool.query(
      `SELECT oi.*, mi.description as item_description
       FROM order_items oi
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = $1`,
      [id]
    );

    return res.json({
      id: order.id,
      orderNumber: order.order_number,
      tableId: order.table_id,
      waiterId: order.waiter_id,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax),
      tip: parseFloat(order.tip),
      discount: parseFloat(order.discount),
      total: parseFloat(order.total),
      items: itemsResult.rows.map(row => ({
        id: row.id,
        menuItemId: row.menu_item_id,
        name: row.name,
        description: row.item_description,
        price: parseFloat(row.price),
        quantity: row.quantity,
        notes: row.notes
      })),
      createdAt: order.created_at,
      paidAt: order.paid_at
    });
  } catch (error: any) {
    console.error('[Orders] Error getting order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/orders/:id
 * Update order (status, notes, etc.)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, tip, discount } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (tip !== undefined) {
      updates.push(`tip = $${paramCount}`);
      params.push(tip);
      paramCount++;
    }

    if (discount !== undefined) {
      updates.push(`discount = $${paramCount}`);
      params.push(discount);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    return res.json({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      tip: parseFloat(order.tip),
      discount: parseFloat(order.discount),
      total: parseFloat(order.total)
    });
  } catch (error: any) {
    console.error('[Orders] Error updating order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/orders/:id
 * Cancel order (only if not paid)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Cannot cancel paid order' });
    }

    // Delete order items
    await pool.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    // Delete order
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);

    return res.json({ ok: true, message: 'Order cancelled' });
  } catch (error: any) {
    console.error('[Orders] Error deleting order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/orders/:id/items
 * Add item to existing order
 */
router.post('/:id/items', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { menuItemId, name, price, quantity, notes } = req.body;

    if (!menuItemId || !name || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check order exists
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Add item
    const itemId = uuidv4();
    await pool.query(
      `INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [itemId, id, menuItemId, name, price, quantity, notes || null]
    );

    // Recalculate order totals
    const itemsResult = await pool.query(
      'SELECT SUM(price * quantity) as subtotal FROM order_items WHERE order_id = $1',
      [id]
    );

    const subtotal = parseFloat(itemsResult.rows[0].subtotal) || 0;
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    await pool.query(
      'UPDATE orders SET subtotal = $1, tax = $2, total = $3 WHERE id = $4',
      [subtotal, tax, total, id]
    );

    return res.status(201).json({ ok: true, itemId });
  } catch (error: any) {
    console.error('[Orders] Error adding item:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
