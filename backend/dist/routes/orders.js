"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pg_1 = require("pg");
const uuid_1 = require("uuid");
const kitchenPrintService_1 = __importDefault(require("../services/kitchenPrintService"));
const receiptService_1 = __importDefault(require("../services/receiptService"));
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
/**
 * POST /api/v1/orders
 * Create a new order
 */
router.post('/', async (req, res) => {
    try {
        const { tableId, waiterId, items } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item' });
        }
        const orderId = (0, uuid_1.v4)();
        const orderNumber = `ORD-${Date.now()}`;
        // Calculate totals
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.price * item.quantity;
        }
        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;
        // Create order
        const result = await pool.query(`INSERT INTO orders (id, order_number, table_id, waiter_id, status, subtotal, tax, total, payment_status)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, 'pending')
       RETURNING *`, [orderId, orderNumber, tableId, waiterId, subtotal, tax, total]);
        const order = result.rows[0];
        // Create order items
        for (const item of items) {
            await pool.query(`INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [(0, uuid_1.v4)(), orderId, item.menuItemId, item.name, item.price, item.quantity, item.notes || null]);
        }
        // Print kitchen/bar tickets automatically
        try {
            await kitchenPrintService_1.default.printOrderTickets(orderId);
        }
        catch (printError) {
            // Log error but don't fail the order creation
            console.error('[Orders] Error printing tickets:', printError.message);
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
    }
    catch (error) {
        console.error('[Orders] Error creating order:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/v1/orders
 * List all orders with filtering
 */
router.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        const restaurantId = req.user?.restaurantId;
        if (!restaurantId) {
            return res.status(400).json({ error: 'Restaurant ID required' });
        }
        const { status, limit = 50, offset = 0 } = req.query;
        // Mapear estados del frontend a estados de la base de datos
        const statusMap = {
            'pending': ['draft', 'pending', 'sent_to_kitchen'],
            'completed': ['completed', 'served', 'closed'],
            'cancelled': ['cancelled']
        };
        let query = `
      SELECT o.*, t.table_number, t.name as table_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE t.restaurant_id = $1
    `;
        const params = [restaurantId];
        let paramIndex = 2;
        if (status && statusMap[status]) {
            const statuses = statusMap[status];
            query += ` AND o.status = ANY($${paramIndex})`;
            params.push(statuses);
            paramIndex++;
        }
        query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        console.log('[Orders] Query:', query);
        console.log('[Orders] Params:', params);
        const result = await pool.query(query, params);
        // Obtener items para cada orden
        const ordersWithItems = await Promise.all(result.rows.map(async (row) => {
            const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [row.id]);
            // Mapear el estado de la BD al estado del frontend
            let frontendStatus = row.status;
            if (statusMap.pending.includes(row.status)) {
                frontendStatus = 'pending';
            }
            else if (statusMap.completed.includes(row.status)) {
                frontendStatus = 'completed';
            }
            else if (statusMap.cancelled.includes(row.status)) {
                frontendStatus = 'cancelled';
            }
            return {
                id: row.id,
                orderNumber: row.order_number,
                status: frontendStatus,
                paymentStatus: row.payment_status,
                subtotal: parseFloat(row.subtotal),
                tax: parseFloat(row.tax),
                tip: parseFloat(row.tip || 0),
                discount: parseFloat(row.discount || 0),
                total: parseFloat(row.total),
                createdAt: row.created_at,
                paidAt: row.paid_at,
                tableId: row.table_id,
                tableNumber: row.table_number || row.table_name,
                items: itemsResult.rows.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: parseFloat(item.price),
                    quantity: item.quantity,
                    notes: item.notes
                }))
            };
        }));
        // Obtener el total de órdenes (sin límite)
        const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE t.restaurant_id = $1
      ${status && statusMap[status] ? `AND o.status = ANY($2)` : ''}
    `;
        const countParams = [restaurantId];
        if (status && statusMap[status]) {
            countParams.push(statusMap[status]);
        }
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);
        console.log('[Orders] Returning', ordersWithItems.length, 'orders (total:', total, ')');
        return res.json({
            orders: ordersWithItems,
            total: total,
            count: ordersWithItems.length
        });
    }
    catch (error) {
        console.error('[Orders] Error listing orders:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/v1/orders/:id
 * Get order details with items
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Get order
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = orderResult.rows[0];
        // Get items
        const itemsResult = await pool.query(`SELECT oi.*, mi.description as item_description
       FROM order_items oi
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = $1`, [id]);
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
            checkRequestedAt: order.check_requested_at || null,
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
    }
    catch (error) {
        console.error('[Orders] Error getting order:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * PUT /api/v1/orders/:id
 * Update order (status, notes, etc.)
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, tip, discount } = req.body;
        const updates = [];
        const params = [];
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
        const result = await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, params);
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
    }
    catch (error) {
        console.error('[Orders] Error updating order:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * DELETE /api/v1/orders/:id
 * Cancel order (only if not paid)
 */
router.delete('/:id', async (req, res) => {
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
    }
    catch (error) {
        console.error('[Orders] Error deleting order:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/orders/:id/items
 * Add item to existing order
 */
router.post('/:id/items', async (req, res) => {
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
        const itemId = (0, uuid_1.v4)();
        await pool.query(`INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [itemId, id, menuItemId, name, price, quantity, notes || null]);
        // Recalculate order totals
        const itemsResult = await pool.query('SELECT SUM(price * quantity) as subtotal FROM order_items WHERE order_id = $1', [id]);
        const subtotal = parseFloat(itemsResult.rows[0].subtotal) || 0;
        const tax = subtotal * 0.1;
        const total = subtotal + tax;
        await pool.query('UPDATE orders SET subtotal = $1, tax = $2, total = $3 WHERE id = $4', [subtotal, tax, total, id]);
        return res.status(201).json({ ok: true, itemId });
    }
    catch (error) {
        console.error('[Orders] Error adding item:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/orders/:id/print-tickets
 * Manually trigger printing of kitchen/bar tickets
 */
router.post('/:id/print-tickets', async (req, res) => {
    try {
        const { id } = req.params;
        await kitchenPrintService_1.default.printOrderTickets(id);
        return res.json({ ok: true, message: 'Tickets printed successfully' });
    }
    catch (error) {
        console.error('[Orders] Error printing tickets:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/orders/:id/complete-ticket
 * Mark a kitchen or bar ticket as completed
 */
router.post('/:id/complete-ticket', async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'kitchen' or 'bar'
        if (!type || !['kitchen', 'bar'].includes(type)) {
            return res.status(400).json({ error: 'Invalid ticket type. Must be "kitchen" or "bar"' });
        }
        await kitchenPrintService_1.default.markTicketCompleted(id, type);
        return res.json({ ok: true, message: `Ticket marked as completed` });
    }
    catch (error) {
        console.error('[Orders] Error completing ticket:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/orders/:id/request-check
 * Request check (bill) for an order - generates customer receipt
 */
router.post('/:id/request-check', async (req, res) => {
    try {
        const { id } = req.params;
        // Check if order exists
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = orderResult.rows[0];
        // Check if check already requested
        if (order.check_requested_at) {
            return res.status(400).json({
                error: 'Check already requested',
                checkRequestedAt: order.check_requested_at
            });
        }
        // Update order to mark check as requested
        await pool.query('UPDATE orders SET check_requested_at = NOW() WHERE id = $1', [id]);
        // Generate and print customer receipt
        try {
            await receiptService_1.default.printReceipt(id);
        }
        catch (receiptError) {
            // Log error but don't fail the request
            console.error('[Orders] Error printing receipt:', receiptError.message);
        }
        // Get updated order
        const updatedOrderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        return res.json({
            ok: true,
            message: 'Check requested successfully',
            order: {
                id: updatedOrderResult.rows[0].id,
                orderNumber: updatedOrderResult.rows[0].order_number,
                checkRequestedAt: updatedOrderResult.rows[0].check_requested_at
            }
        });
    }
    catch (error) {
        console.error('[Orders] Error requesting check:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/v1/orders/:id/receipt
 * Get customer receipt as HTML
 */
router.get('/:id/receipt', async (req, res) => {
    try {
        const { id } = req.params;
        const orderResult = await pool.query('SELECT id FROM orders WHERE id = $1', [id]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const receiptHTML = await receiptService_1.default.getReceiptHTML(id);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(receiptHTML);
    }
    catch (error) {
        console.error('[Orders] Error getting receipt:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/orders/:id/cancel-check
 * Cancel check request (reset check_requested_at) - only cashier can do this
 */
router.post('/:id/cancel-check', async (req, res) => {
    try {
        const { id } = req.params;
        // Check if order exists
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = orderResult.rows[0];
        // Check if check was requested
        if (!order.check_requested_at) {
            return res.status(400).json({
                error: 'Check was not requested for this order'
            });
        }
        // Reset check_requested_at
        await pool.query('UPDATE orders SET check_requested_at = NULL WHERE id = $1', [id]);
        // Get updated order
        const updatedOrderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        return res.json({
            ok: true,
            message: 'Ticket cancelado exitosamente',
            order: {
                id: updatedOrderResult.rows[0].id,
                orderNumber: updatedOrderResult.rows[0].order_number,
                checkRequestedAt: null
            }
        });
    }
    catch (error) {
        console.error('[Orders] Error canceling check:', error);
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
