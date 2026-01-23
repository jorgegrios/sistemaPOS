/**
 * Bar Domain Service (Bar Display System)
 * Manages bar display system
 * RULE: Bar only sees items with status = 'sent' from bar categories
 * SSOT: All bar operations go through this service
 */

import { Pool } from 'pg';
import { BarOrderItem, BarOrder } from './types';
import { emitEvent, DomainEventType } from '../../shared/events';

export class BarService {
  constructor(private pool: Pool) { }

  /**
   * Get Active Bar Items
   * RULE: Only show items with status = 'sent' (not 'prepared') from bar categories
   * Bar categories: metadata.type = 'bar' or 'drinks'
   * Items disappear when marked as 'prepared'
   */
  async getActiveItems(companyId: string): Promise<BarOrderItem[]> {
    const result = await this.pool.query(
      `SELECT 
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.name as product_name,
        oi.quantity,
        oi.status,
        oi.notes,
        t.name as table_number,
        o.order_number,
        oi.created_at,
        o.created_at as sent_at
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.id
       INNER JOIN tables t ON o.table_id = t.id
       INNER JOIN menu_items mi ON oi.product_id = mi.id
       LEFT JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE oi.status = 'sent'
       AND o.status IN ('sent_to_kitchen', 'served')
       AND (
         mc.metadata->>'type' = 'bar' 
         OR mc.metadata->>'type' = 'drinks'
         OR mc.metadata->>'location' = 'bar'
         OR LOWER(mc.name) LIKE '%bebida%'
         OR LOWER(mc.name) LIKE '%bar%'
         OR LOWER(mc.name) LIKE '%cocktail%'
       )
       ORDER BY oi.created_at ASC, o.order_number ASC`,
      []
    );

    return result.rows.map(row => this.mapRowToBarOrderItem(row));
  }

  /**
   * Get Bar Items by Order
   */
  async getItemsByOrder(orderId: string, companyId: string): Promise<BarOrderItem[]> {
    const result = await this.pool.query(
      `SELECT 
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.name as product_name,
        oi.quantity,
        oi.status,
        oi.notes,
        t.name as table_number,
        o.order_number,
        oi.created_at,
        o.created_at as sent_at
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.id
       INNER JOIN tables t ON o.table_id = t.id
       INNER JOIN menu_items mi ON oi.product_id = mi.id
       LEFT JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE oi.order_id = $1
       AND oi.status IN ('sent', 'prepared')
       AND (
         mc.metadata->>'type' = 'bar' 
         OR mc.metadata->>'type' = 'drinks'
         OR mc.metadata->>'location' = 'bar'
         OR LOWER(mc.name) LIKE '%bebida%'
         OR LOWER(mc.name) LIKE '%bar%'
         OR LOWER(mc.name) LIKE '%cocktail%'
       )
       ORDER BY oi.created_at ASC`,
      [orderId]
    );

    return result.rows.map(row => this.mapRowToBarOrderItem(row));
  }

  /**
   * Get Bar Orders (grouped by order)
   */
  async getBarOrders(companyId: string): Promise<BarOrder[]> {
    const items = await this.getActiveItems(companyId);

    // Group items by order
    const ordersMap = new Map<string, BarOrder>();

    items.forEach(item => {
      if (!ordersMap.has(item.orderId)) {
        ordersMap.set(item.orderId, {
          orderId: item.orderId,
          orderNumber: item.orderNumber,
          tableNumber: item.tableNumber,
          items: [],
          createdAt: item.createdAt,
        });
      }

      ordersMap.get(item.orderId)!.items.push(item);
    });

    return Array.from(ordersMap.values());
  }

  /**
   * Mark Order Item as Prepared
   * RULE: Only mark items with status = 'sent' as 'prepared'
   */
  async markItemPrepared(orderItemId: string, companyId: string): Promise<BarOrderItem> {
    // Verify item exists and is in 'sent' status
    const itemResult = await this.pool.query(
      `SELECT oi.id, oi.order_id, oi.status
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE oi.id = $1 AND o.company_id = $2`,
      [orderItemId, companyId]
    );

    if (itemResult.rows.length === 0) {
      throw new Error(`Order item ${orderItemId} not found`);
    }

    const item = itemResult.rows[0];

    if (item.status !== 'sent') {
      throw new Error(`Cannot mark item as prepared: current status is ${item.status}`);
    }

    // Update item status to 'prepared'
    await this.pool.query(
      `UPDATE order_items SET status = 'prepared' WHERE id = $1`,
      [orderItemId]
    );

    // Get updated item
    const updatedItems = await this.getItemsByOrder(item.order_id, companyId);
    const updatedItem = updatedItems.find(i => i.id === orderItemId);

    if (!updatedItem) {
      throw new Error(`Failed to get updated item ${orderItemId}`);
    }

    // Check if all items in order are prepared
    const allItemsResult = await this.pool.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'prepared' THEN 1 ELSE 0 END) as prepared,
              SUM(CASE WHEN status = 'served' THEN 1 ELSE 0 END) as served
       FROM order_items 
       WHERE order_id = $1`,
      [item.order_id]
    );

    const { total, prepared, served } = allItemsResult.rows[0];
    const totalInt = parseInt(total);
    const preparedInt = parseInt(prepared);
    const servedInt = parseInt(served);

    // Emit event
    emitEvent(DomainEventType.ORDER_ITEM_PREPARED, {
      orderId: item.order_id,
      orderItemId,
    } as any);

    // If all items are prepared, emit event
    if (totalInt > 0 && totalInt === preparedInt + servedInt) {
      emitEvent(DomainEventType.ALL_ITEMS_PREPARED, {
        orderId: item.order_id,
        items: [],
      } as any);
    }

    return updatedItem;
  }

  /**
   * Get Served Bar Orders
   * RULE: Only show orders with all bar items prepared or served
   */
  async getServedOrders(companyId: string): Promise<BarOrder[]> {
    // Get all orders that have at least one bar item with status 'prepared' or 'served'
    const allOrdersResult = await this.pool.query(
      `SELECT DISTINCT o.id as order_id, o.order_number, o.status as order_status, o.created_at, o.paid_at
       FROM orders o
       INNER JOIN order_items oi ON oi.order_id = o.id
       INNER JOIN menu_items mi ON oi.product_id = mi.id
       LEFT JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE o.status IN ('sent_to_kitchen', 'served', 'closed')
       AND oi.status IN ('prepared', 'served')
       AND (
         mc.metadata->>'type' = 'bar' 
         OR mc.metadata->>'type' = 'drinks'
         OR mc.metadata->>'location' = 'bar'
         OR LOWER(mc.name) LIKE '%bebida%'
         OR LOWER(mc.name) LIKE '%bar%'
         OR LOWER(mc.name) LIKE '%cocktail%'
       )
       AND o.company_id = $1
       ORDER BY o.created_at DESC`,
      [companyId]
    );

    console.log('[Bar] Checking', allOrdersResult.rows.length, 'orders for served bar items');

    if (allOrdersResult.rows.length === 0) {
      console.log('[Bar] No orders found with prepared/served bar items');
      return [];
    }

    const allServedOrders: BarOrder[] = [];

    for (const orderRow of allOrdersResult.rows) {
      const orderId = orderRow.order_id;

      // Get all bar items for this order that are prepared or served
      // Also get the max created_at from items with status 'served' as served_at
      const barItemsResult = await this.pool.query(
        `SELECT 
          oi.id,
          oi.order_id,
          oi.product_id,
          oi.name as product_name,
          oi.quantity,
          oi.status,
          oi.notes,
          t.name as table_number,
          o.order_number,
          oi.created_at,
          o.created_at as sent_at,
          (SELECT MAX(oi2.created_at) FROM order_items oi2 WHERE oi2.order_id = o.id AND oi2.status = 'served') as served_at
         FROM order_items oi
         INNER JOIN orders o ON oi.order_id = o.id
         INNER JOIN tables t ON o.table_id = t.id
         INNER JOIN menu_items mi ON oi.product_id = mi.id
         LEFT JOIN menu_categories mc ON mi.category_id = mc.id
         WHERE oi.order_id = $1
         AND oi.status IN ('prepared', 'served')
         AND (
           mc.metadata->>'type' = 'bar' 
           OR mc.metadata->>'type' = 'drinks'
           OR mc.metadata->>'location' = 'bar'
           OR LOWER(mc.name) LIKE '%bebida%'
           OR LOWER(mc.name) LIKE '%bar%'
           OR LOWER(mc.name) LIKE '%cocktail%'
         )
         ORDER BY oi.created_at ASC`,
        [orderId]
      );

      if (barItemsResult.rows.length > 0) {
        const items = barItemsResult.rows.map(row => this.mapRowToBarOrderItem(row));

        // Get served_at from the first row (it's the same for all items in the order)
        const servedAt = barItemsResult.rows[0]?.served_at
          ? new Date(barItemsResult.rows[0].served_at).toISOString()
          : (orderRow.paid_at ? new Date(orderRow.paid_at).toISOString() : undefined);

        allServedOrders.push({
          orderId: orderRow.order_id,
          orderNumber: orderRow.order_number,
          tableNumber: items[0].tableNumber,
          items: items,
          createdAt: items[0].createdAt,
          servedAt: servedAt,
        });
      }
    }

    console.log('[Bar] Returning', allServedOrders.length, 'served bar orders');
    return allServedOrders;
  }

  /**
   * Map database row to BarOrderItem
   */
  private mapRowToBarOrderItem(row: any): BarOrderItem {
    return {
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      productName: row.product_name,
      quantity: row.quantity,
      status: row.status,
      notes: row.notes,
      tableNumber: row.table_number,
      orderNumber: row.order_number,
      createdAt: row.created_at.toISOString(),
      sentAt: row.sent_at.toISOString(),
    };
  }
}





