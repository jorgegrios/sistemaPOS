/**
 * Cashier Routes
 * Endpoints for cashier view
 */

import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from './auth';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/v1/cashier/active-tables
 * Get all tables with their status (active = has pending orders, inactive = no pending orders)
 */
router.get('/active-tables', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Get ALL tables for the restaurant
    const allTablesResult = await pool.query(
      `SELECT id, table_number, capacity, status
       FROM tables
       WHERE restaurant_id = $1
       ORDER BY table_number ASC`,
      [restaurantId]
    );

      // Get pending orders for tables
      // First check if check_requested_at column exists
      let hasCheckRequestedColumn = false;
      try {
        const columnCheck = await pool.query(
          `SELECT column_name 
           FROM information_schema.columns 
           WHERE table_name = 'orders' 
           AND column_name = 'check_requested_at' 
           AND table_schema = 'public'`
        );
        hasCheckRequestedColumn = columnCheck.rows.length > 0;
      } catch (err) {
        console.error('Error checking for check_requested_at column:', err);
      }

      let pendingOrdersResult;
      if (hasCheckRequestedColumn) {
        // Query with check_requested_at column and order status
        pendingOrdersResult = await pool.query(
          `SELECT 
            t.id as table_id,
            o.id as order_id,
            o.order_number,
            o.total,
            o.subtotal,
            o.tax,
            o.tip,
            o.payment_status,
            o.status as order_status,
            o.check_requested_at,
            o.created_at as order_created_at,
            COUNT(oi.id) as item_count,
            COUNT(CASE WHEN oi.status = 'served' THEN 1 END) as served_count
           FROM tables t
           INNER JOIN orders o ON t.id = o.table_id
           LEFT JOIN order_items oi ON o.id = oi.order_id
           WHERE t.restaurant_id = $1
             AND o.payment_status = 'pending'
             AND o.status != 'cancelled'
             AND o.status != 'closed'
             AND o.status IN ('draft', 'sent_to_kitchen', 'served')
             AND o.total > 0
           GROUP BY t.id, o.id, o.order_number, o.total, o.subtotal, o.tax, o.tip, o.payment_status, o.status, o.check_requested_at, o.created_at
           ORDER BY 
             CASE WHEN o.check_requested_at IS NOT NULL THEN 0 ELSE 1 END,
             CASE WHEN o.status = 'served' THEN 0 ELSE 1 END,
             o.created_at DESC`,
          [restaurantId]
        );
      } else {
        // Query without check_requested_at column (fallback for databases without migration)
        pendingOrdersResult = await pool.query(
          `SELECT 
            t.id as table_id,
            o.id as order_id,
            o.order_number,
            o.total,
            o.subtotal,
            o.tax,
            o.tip,
            o.payment_status,
            o.status as order_status,
            NULL as check_requested_at,
            o.created_at as order_created_at,
            COUNT(oi.id) as item_count,
            COUNT(CASE WHEN oi.status = 'served' THEN 1 END) as served_count
           FROM tables t
           INNER JOIN orders o ON t.id = o.table_id
           LEFT JOIN order_items oi ON o.id = oi.order_id
           WHERE t.restaurant_id = $1
             AND o.payment_status = 'pending'
             AND o.status != 'cancelled'
             AND o.status != 'closed'
           GROUP BY t.id, o.id, o.order_number, o.total, o.subtotal, o.tax, o.tip, o.payment_status, o.status, o.created_at
           ORDER BY 
             CASE WHEN o.status = 'served' THEN 0 ELSE 1 END,
             o.created_at DESC`,
          [restaurantId]
        );
      }

    // Create a map of table_id -> orders
    const ordersByTable = new Map();
    console.log(`[Cashier] Found ${pendingOrdersResult.rows.length} order rows from database`);
    pendingOrdersResult.rows.forEach((row: any) => {
      // Log each order for debugging
      console.log(`[Cashier] Order ${row.order_id} for table ${row.table_id}: payment_status=${row.payment_status}, order_status=${row.order_status}, total=${row.total}`);
      
      if (!ordersByTable.has(row.table_id)) {
        ordersByTable.set(row.table_id, []);
      }
      ordersByTable.get(row.table_id).push({
        id: row.order_id,
        orderNumber: row.order_number,
        total: parseFloat(row.total),
        subtotal: parseFloat(row.subtotal),
        tax: parseFloat(row.tax),
        tip: parseFloat(row.tip || 0),
        paymentStatus: row.payment_status,
        orderStatus: row.order_status, // 'sent_to_kitchen', 'served', etc.
        checkRequestedAt: row.check_requested_at || null,
        itemCount: parseInt(row.item_count),
        servedCount: parseInt(row.served_count || 0),
        createdAt: row.order_created_at
      });
    });

    // Build response with all tables, marking active/inactive
    const tables = allTablesResult.rows.map((table: any) => {
      const orders = ordersByTable.get(table.id) || [];
      // Double-check: filter out any orders that shouldn't be here
      const validOrders = orders.filter(order => {
        const isValid = order.paymentStatus === 'pending' && 
                       order.orderStatus !== 'closed' && 
                       order.orderStatus !== 'cancelled' &&
                       order.total > 0; // Excluir órdenes vacías (total = 0)
        if (!isValid && orders.length > 0) {
          console.log(`[Cashier] Filtering out invalid order ${order.id} for table ${table.table_number}: paymentStatus=${order.paymentStatus}, orderStatus=${order.orderStatus}, total=${order.total}`);
        }
        return isValid;
      });
      
      const result = {
        id: table.id,
        tableNumber: table.table_number,
        capacity: parseInt(table.capacity),
        status: table.status,
        isActive: validOrders.length > 0, // Active if has pending orders
        orders: validOrders // Use filtered orders
      };
      
      if (validOrders.length > 0) {
        console.log(`[Cashier] Table ${table.table_number}: ${validOrders.length} valid orders, isActive: ${result.isActive}`);
        validOrders.forEach(order => {
          console.log(`  - Order ${order.id}: ${order.orderNumber}, total: $${order.total}, paymentStatus: ${order.paymentStatus}, orderStatus: ${order.orderStatus}`);
        });
      }
      
      return result;
    });

    console.log(`[Cashier] Returning ${tables.length} tables. Active: ${tables.filter(t => t.isActive).length}, Available: ${tables.filter(t => !t.isActive).length}`);

    return res.json({ tables });
  } catch (error: any) {
    console.error('[Cashier] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/cashier/cash-register-summary
 * Get cash register summary for today
 */
router.get('/cash-register-summary', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all completed payments for today
    const paymentsResult = await pool.query(
      `SELECT 
        pt.payment_method,
        pt.amount,
        pt.status,
        pt.created_at,
        o.id as order_id,
        o.order_number,
        o.table_id,
        t.table_number
       FROM payment_transactions pt
       LEFT JOIN orders o ON pt.order_id = o.id
       LEFT JOIN tables t ON o.table_id = t.id
       WHERE pt.status = 'completed'
         AND pt.created_at >= $1
         AND pt.created_at < $2
         AND (o.id IS NULL OR EXISTS (
           SELECT 1 FROM tables t2 WHERE t2.id = o.table_id AND t2.restaurant_id = $3
         ))
       ORDER BY pt.created_at DESC`,
      [today, tomorrow, restaurantId]
    );

    // Calculate totals by payment method
    const totalsByMethod: Record<string, { count: number; total: number }> = {};
    let totalCash = 0;
    let totalCard = 0;
    let totalOther = 0;
    let totalAmount = 0;
    let totalTransactions = 0;

    paymentsResult.rows.forEach((row: any) => {
      const amount = parseFloat(row.amount);
      const method = row.payment_method || 'unknown';
      
      if (!totalsByMethod[method]) {
        totalsByMethod[method] = { count: 0, total: 0 };
      }
      
      totalsByMethod[method].count++;
      totalsByMethod[method].total += amount;
      totalAmount += amount;
      totalTransactions++;

      if (method === 'cash') {
        totalCash += amount;
      } else if (method === 'card') {
        totalCard += amount;
      } else {
        totalOther += amount;
      }
    });

    // Get cash register base (if exists)
    const baseResult = await pool.query(
      `SELECT value FROM restaurant_config 
       WHERE restaurant_id = $1 AND key = 'cash_register_base'`,
      [restaurantId]
    );
    const cashBase = baseResult.rows.length > 0 ? parseFloat(baseResult.rows[0].value) : 0;

    // Calculate expected cash in drawer
    const expectedCash = cashBase + totalCash;

    return res.json({
      date: today.toISOString().split('T')[0],
      cashBase,
      totalCash,
      totalCard,
      totalOther,
      totalAmount,
      totalTransactions,
      expectedCash,
      totalsByMethod,
      payments: paymentsResult.rows.map(row => ({
        id: row.id,
        orderId: row.order_id,
        orderNumber: row.order_number,
        tableNumber: row.table_number,
        paymentMethod: row.payment_method,
        amount: parseFloat(row.amount),
        status: row.status,
        createdAt: row.created_at
      }))
    });
  } catch (error: any) {
    console.error('[Cashier] Error getting cash register summary:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/cashier/paid-orders
 * Get all paid orders with details
 */
router.get('/paid-orders', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const { date, limit = '100', offset = '0' } = req.query;

    // Build date filter
    const params: any[] = [restaurantId];
    let dateFilter = '';
    if (date) {
      // Parse date string (format: YYYY-MM-DD)
      const dateParts = (date as string).split('-');
      const startDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      dateFilter = `AND o.paid_at >= $${params.length + 1} AND o.paid_at < $${params.length + 2}`;
      params.push(startDate, endDate);
      console.log(`[Cashier] Date filter: ${date} -> ${startDate.toISOString()} to ${endDate.toISOString()}`);
    } else {
      console.log(`[Cashier] No date filter applied`);
    }

    // Get paid orders - simplified and fixed query
    const ordersResult = await pool.query(
      `SELECT 
        o.id,
        o.order_number,
        o.table_id,
        t.table_number,
        o.subtotal,
        o.tax,
        o.tip,
        o.discount,
        o.total,
        o.payment_status,
        COALESCE(o.paid_at, (SELECT MAX(pt.created_at) FROM payment_transactions pt WHERE pt.order_id = o.id AND pt.status = 'completed')) as paid_at,
        o.created_at,
        u.name as waiter_name
       FROM orders o
       INNER JOIN tables t ON o.table_id = t.id
       LEFT JOIN users u ON o.waiter_id = u.id
       WHERE o.payment_status = 'paid'
         AND t.restaurant_id = $1
         ${dateFilter}
       ORDER BY COALESCE(o.paid_at, o.created_at) DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit as string), parseInt(offset as string)]
    );

    console.log(`[Cashier] Paid orders query: found ${ordersResult.rows.length} orders for restaurant ${restaurantId}, date filter: ${date || 'none'}`);
    if (ordersResult.rows.length > 0) {
      console.log(`[Cashier] Sample order: ${ordersResult.rows[0].order_number}, paid_at: ${ordersResult.rows[0].paid_at}`);
      ordersResult.rows.forEach((row: any, idx: number) => {
        console.log(`[Cashier] Order ${idx + 1}: ${row.order_number}, paid_at: ${row.paid_at}, table: ${row.table_number}`);
      });
    } else {
      console.log(`[Cashier] No orders found. Checking if query is correct...`);
      // Debug query without date filter
      const debugResult = await pool.query(
        `SELECT COUNT(*) as total
         FROM orders o
         INNER JOIN tables t ON o.table_id = t.id
         WHERE o.payment_status = 'paid'
           AND t.restaurant_id = $1`,
        [restaurantId]
      );
      console.log(`[Cashier] Total paid orders for restaurant (no date filter): ${debugResult.rows[0].total}`);
      
      // Also check with date filter to see what's happening
      if (date) {
        const debugWithDate = await pool.query(
          `SELECT o.id, o.order_number, o.paid_at, t.table_number
           FROM orders o
           INNER JOIN tables t ON o.table_id = t.id
           WHERE o.payment_status = 'paid'
             AND t.restaurant_id = $1
           ORDER BY o.paid_at DESC
           LIMIT 10`,
          [restaurantId]
        );
        console.log(`[Cashier] Sample paid orders (first 10, no date filter):`);
        debugWithDate.rows.forEach((row: any) => {
          console.log(`  - ${row.order_number}: paid_at=${row.paid_at}, table=${row.table_number}`);
        });
      }
    }

    // Get order items and payments for each order
    const ordersWithDetails = await Promise.all(
      ordersResult.rows.map(async (order: any) => {
        // Get order items
        const itemsResult = await pool.query(
          `SELECT 
            oi.id,
            oi.name,
            oi.quantity,
            oi.price,
            oi.notes,
            oi.status as item_status
           FROM order_items oi
           WHERE oi.order_id = $1
           ORDER BY oi.created_at ASC`,
          [order.id]
        );

        // Get payments for this order
        const paymentsResult = await pool.query(
          `SELECT 
            pt.id,
            pt.payment_method,
            pt.amount,
            pt.status,
            pt.created_at
           FROM payment_transactions pt
           WHERE pt.order_id = $1
           ORDER BY pt.created_at ASC`,
          [order.id]
        );

        // Get cancelled items (items with status 'cancelled' or in cancelled orders)
        const cancelledItems = itemsResult.rows.filter((item: any) => 
          item.item_status === 'cancelled' || item.notes?.toLowerCase().includes('cancelado')
        );

        return {
          id: order.id,
          orderNumber: order.order_number,
          tableId: order.table_id,
          tableNumber: order.table_number,
          waiterName: order.waiter_name,
          subtotal: parseFloat(order.subtotal),
          tax: parseFloat(order.tax),
          tip: parseFloat(order.tip || 0),
          discount: parseFloat(order.discount || 0),
          total: parseFloat(order.total),
          paymentStatus: order.payment_status,
          paidAt: order.paid_at,
          createdAt: order.created_at,
          items: itemsResult.rows.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price),
            notes: item.notes,
            status: item.item_status,
            isCancelled: item.item_status === 'cancelled' || item.notes?.toLowerCase().includes('cancelado')
          })),
          payments: paymentsResult.rows.map((payment: any) => ({
            id: payment.id,
            method: payment.payment_method,
            amount: parseFloat(payment.amount),
            status: payment.status,
            createdAt: payment.created_at
          })),
          cancelledItems: cancelledItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price),
            notes: item.notes
          })),
          cancelledItemsTotal: cancelledItems.reduce((sum: number, item: any) => 
            sum + (parseFloat(item.price) * item.quantity), 0
          )
        };
      })
    );

    // Get total count
    const countParams: any[] = [restaurantId];
    let countDateFilter = '';
    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      countDateFilter = `AND o.paid_at >= $${countParams.length + 1} AND o.paid_at < $${countParams.length + 2}`;
      countParams.push(startDate, endDate);
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM orders o
       INNER JOIN tables t ON o.table_id = t.id
       WHERE o.payment_status = 'paid'
         AND t.restaurant_id = $1
         ${countDateFilter}`,
      countParams
    );

    return res.json({
      orders: ordersWithDetails,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error: any) {
    console.error('[Cashier] Error getting paid orders:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

