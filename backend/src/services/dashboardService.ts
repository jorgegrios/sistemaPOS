/**
 * Dashboard Service
 * Provides daily summary data for dashboard
 */

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface DailySummary {
  date: string;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalSales: number;
  cashAmount: number;
  cardAmount: number;
  kitchenSales: number;
  barSales: number;
  baseAmount: number; // Base inicial de cajas
  orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      categoryType: string;
    }>;
  }>;
}

class DashboardService {
  /**
   * Get daily summary for today
   */
  async getDailySummary(restaurantId?: string): Promise<DailySummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all orders from today
    // Note: orders table may not have restaurant_id, so we get all orders
    const ordersResult = await pool.query(
      `SELECT o.*, 
        COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.created_at >= $1 AND o.created_at < $2
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [today, tomorrow]
    ).catch((err) => {
      console.error('[Dashboard] Error fetching orders:', err);
      return { rows: [] };
    });

    const orders = ordersResult.rows;

    // Get order items with category information
    const orderIds = orders.map((o: any) => o.id);
    let itemsResult;
    if (orderIds.length > 0) {
      itemsResult = await pool.query(
        `SELECT oi.*, 
          mc.metadata as category_metadata,
          mc.name as category_name
         FROM order_items oi
         LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
         LEFT JOIN menu_categories mc ON mi.category_id = mc.id
         WHERE oi.order_id = ANY($1::uuid[])`,
        [orderIds]
      ).catch((err) => {
        console.error('[Dashboard] Error fetching order items:', err);
        return { rows: [] };
      });
    } else {
      itemsResult = { rows: [] };
    }

    // Organize items by order
    const itemsByOrder: Record<string, any[]> = {};
    itemsResult.rows.forEach((item: any) => {
      if (!itemsByOrder[item.order_id]) {
        itemsByOrder[item.order_id] = [];
      }
      itemsByOrder[item.order_id].push(item);
    });

    // Get payments for today - include both succeeded and completed payments
    const paymentsResult = await pool.query(
      `SELECT pt.*, o.id as order_id
       FROM payment_transactions pt
       INNER JOIN orders o ON pt.order_id = o.id
       WHERE pt.created_at >= $1 AND pt.created_at < $2
         AND pt.status IN ('succeeded', 'completed')`,
      [today, tomorrow]
    ).catch((err) => {
      console.error('[Dashboard] Error fetching payments:', err);
      return { rows: [] };
    });

    const payments = paymentsResult.rows;

    // Calculate totals
    // Include orders that are completed OR paid (payment_status = 'paid')
    const completedOrders = orders.filter((o: any) => 
      o.status === 'completed' || o.payment_status === 'paid' || o.status === 'closed'
    );
    const pendingOrders = orders.filter((o: any) => 
      o.status === 'pending' && o.payment_status !== 'paid'
    );
    const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled');
    
    // Calculate total sales from paid orders or completed orders
    // Prioritize paid orders, then completed orders
    const totalSales = orders
      .filter((o: any) => o.payment_status === 'paid' || o.status === 'completed' || o.status === 'closed')
      .reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0);
    
    console.log(`[Dashboard] Total orders: ${orders.length}, Completed/Paid: ${completedOrders.length}, Total Sales: $${totalSales.toFixed(2)}`);
    
    // Calculate cash vs card
    const cashAmount = payments
      .filter((p: any) => p.payment_method === 'cash')
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    
    const cardAmount = payments
      .filter((p: any) => p.payment_method !== 'cash' && p.payment_method)
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);

    // Calculate kitchen vs bar sales
    // Use all orders that are paid or completed
    let kitchenSales = 0;
    let barSales = 0;

    const salesOrders = orders.filter((o: any) => 
      o.payment_status === 'paid' || o.status === 'completed' || o.status === 'closed'
    );

    salesOrders.forEach((order: any) => {
      const orderItems = itemsByOrder[order.id] || [];
      orderItems.forEach((item: any) => {
        const categoryMetadata = item.category_metadata || {};
        const itemType = categoryMetadata.type || categoryMetadata.location || 'kitchen';
        const itemTotal = parseFloat(item.price || 0) * parseInt(item.quantity || 1);
        
        if (itemType === 'bar' || itemType === 'drinks') {
          barSales += itemTotal;
        } else {
          kitchenSales += itemTotal;
        }
      });
    });

    // Get base amount (from cash register or config)
    let baseAmount = 0;
    if (restaurantId) {
      try {
        const baseResult = await pool.query(
          `SELECT value FROM restaurant_config 
           WHERE restaurant_id = $1 AND key = 'cash_register_base'
           LIMIT 1`,
          [restaurantId]
        );
        
        if (baseResult.rows.length > 0) {
          baseAmount = parseFloat(baseResult.rows[0].value || 0);
        }
      } catch (err) {
        // Table might not exist yet, use default 0
        console.log('[Dashboard] restaurant_config table not found, using default base');
      }
    }

    // Format orders with items
    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.order_number,
      total: parseFloat(order.total || 0),
      status: order.status,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      items: (itemsByOrder[order.id] || []).map((item: any) => ({
        name: item.name,
        quantity: parseInt(item.quantity || 1),
        price: parseFloat(item.price || 0),
        categoryType: (item.category_metadata || {}).type || 'kitchen'
      }))
    }));

    return {
      date: today.toISOString().split('T')[0],
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalSales,
      cashAmount,
      cardAmount,
      kitchenSales,
      barSales,
      baseAmount,
      orders: formattedOrders
    };
  }
}

export default new DashboardService();

