/**
 * Orders Domain Service
 * Implements all order flows with idempotency
 * SSOT: All order operations go through this service
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderItem, CreateOrderRequest, AddItemsRequest, OrderWithItems } from './types';
import { getActiveOrderForTable, isOrderSentToKitchen, canCloseOrder } from '../../shared/idempotency';
import { emitEvent, DomainEventType } from '../../shared/events';

export class OrdersService {
  constructor(private pool: Pool) { }

  /**
   * Create Order (Idempotent)
   * RULE: One table = one active order (idempotent)
   * Returns existing order if active order exists for table
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    // IDEMPOTENCY CHECK: Check if active order exists for table (within company context)
    const existingOrderId = await getActiveOrderForTable(this.pool, request.tableId, request.companyId);

    if (existingOrderId) {
      // Return existing order (idempotent)
      return this.getOrder(existingOrderId, request.companyId);
    }

    // Create new draft order
    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now()}`;

    const result = await this.pool.query(
      `INSERT INTO orders (id, order_number, table_id, waiter_id, company_id, status, subtotal, tax, total)
       VALUES ($1, $2, $3, $4, $5, 'draft', 0, 0, 0)
       RETURNING id, table_id, waiter_id, company_id, status, subtotal, tax, total, created_at`,
      [orderId, orderNumber, request.tableId, request.waiterId, request.companyId]
    );

    const order = this.mapRowToOrder(result.rows[0]);

    // Log status change: null -> draft
    await this.logStatusChange(order.id, null, 'draft', request.companyId, request.waiterId);

    // Emit event
    emitEvent(DomainEventType.ORDER_CREATED, {
      orderId: order.id,
      tableId: order.tableId,
      waiterId: order.waiterId,
      companyId: order.companyId
    } as any);

    return order;
  }

  /**
   * Get Order by ID
   */
  async getOrder(orderId: string, companyId: string): Promise<Order> {
    const result = await this.pool.query(
      `SELECT id, table_id, waiter_id, company_id, status, subtotal, tax, total, created_at
       FROM orders WHERE id = $1 AND company_id = $2`,
      [orderId, companyId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Order ${orderId} not found or unauthorized`);
    }

    return this.mapRowToOrder(result.rows[0]);
  }

  /**
   * Get Order with Items
   */
  async getOrderWithItems(orderId: string, companyId: string): Promise<OrderWithItems> {
    const order = await this.getOrder(orderId, companyId);
    const items = await this.getOrderItems(orderId, companyId);

    return {
      ...order,
      items,
    };
  }

  /**
   * Add Items to Order
   * RULE: Only add items if order is in 'draft' status
   * RULE: Freeze price at time of order (price_snapshot)
   */
  async addItemsToOrder(orderId: string, companyId: string, request: AddItemsRequest): Promise<OrderItem[]> {
    // Verify order exists and is in a modifiable status (draft or sent_to_kitchen)
    const order = await this.getOrder(orderId, companyId);

    if (order.status !== 'draft' && order.status !== 'sent_to_kitchen') {
      throw new Error(`Cannot add items to order with status: ${order.status}`);
    }

    const newItems: OrderItem[] = [];

    // Get product prices and add items
    for (const item of request.items) {
      // Get product price (freeze it)
      const productResult = await this.pool.query(
        `SELECT COALESCE(base_price, price) as base_price, name 
         FROM menu_items 
         WHERE id = $1 AND available = true AND company_id = $2`,
        [item.productId, companyId]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.productId} not found or unavailable in this company`);
      }

      const product = productResult.rows[0];
      const priceSnapshot = parseFloat(product.base_price);

      // Create order item
      const itemId = uuidv4();
      await this.pool.query(
        `INSERT INTO order_items (id, order_id, company_id, product_id, menu_item_id, name, price, quantity, notes, seat_number, status)
         VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, 'pending')`,
        [itemId, orderId, companyId, item.productId, product.name, priceSnapshot, item.quantity, item.notes || null, item.seatNumber || null]
      );

      newItems.push({
        id: itemId,
        orderId,
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        priceSnapshot,
        status: 'pending',
        notes: item.notes,
        seatNumber: item.seatNumber,
        createdAt: new Date().toISOString(),
      });
    }

    // Recalculate totals
    await this.recalculateOrderTotals(orderId, companyId);

    // Emit event
    emitEvent(DomainEventType.ORDER_ITEMS_ADDED, {
      orderId,
      companyId,
      items: newItems.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
    } as any);

    return newItems;
  }

  /**
   * Remove all items from order (only for draft orders)
   * Used to sync cart with database before sending to kitchen
   */
  async removeAllItemsFromOrder(orderId: string, companyId: string): Promise<void> {
    // Verify order exists and is in draft status
    const order = await this.getOrder(orderId, companyId);

    if (order.status !== 'draft') {
      throw new Error(`Cannot remove items from order with status: ${order.status}`);
    }

    // Delete all order items
    await this.pool.query(
      `DELETE FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    // Reset order totals
    await this.pool.query(
      `UPDATE orders SET subtotal = 0, tax = 0, total = 0 WHERE id = $1 AND company_id = $2`,
      [orderId, companyId]
    );
  }

  /**
   * Send Order to Kitchen (Idempotent)
   * RULE: Change status to 'sent_to_kitchen'
   * RULE: Change all order_items.status to 'sent'
   * RULE: Do not resend if already sent (idempotent)
   */
  async sendToKitchen(orderId: string, companyId: string): Promise<Order> {
    // Verify order exists and is in a valid status for preparation
    const order = await this.getOrder(orderId, companyId);

    if (order.status !== 'draft' && order.status !== 'sent_to_kitchen' && order.status !== 'served') {
      throw new Error(`Cannot send order to kitchen with status: ${order.status}`);
    }

    // Generate kitchen tasks for items
    // Logic:
    // 1. Check if item has components (split item)
    // 2. If not, check if product has a specific station
    // 3. If not, assign to default station

    // Get all items that need tasks (status 'pending')
    const itemsPending = await this.pool.query(
      `SELECT oi.id, oi.product_id, oi.name, oi.menu_item_id
       FROM order_items oi
       WHERE oi.order_id = $1 AND oi.status = 'pending'`,
      [orderId]
    );

    for (const item of itemsPending.rows) {
      const productId = item.product_id || item.menu_item_id;

      // 1. Check for components
      const componentsResult = await this.pool.query(
        `SELECT pc.id, pc.station_id, pc.component_name as name, kstation.name as station_name
             FROM product_components pc
             JOIN kitchen_stations kstation ON pc.station_id = kstation.id
             WHERE pc.product_id = $1`,
        [productId]
      );

      if (componentsResult.rows.length > 0) {
        // Create a task for each component
        for (const component of componentsResult.rows) {
          await this.pool.query(
            `INSERT INTO kitchen_tasks (id, order_item_id, station_id, component_name, status)
                     VALUES (gen_random_uuid(), $1, $2, $3, 'pending')`,
            [item.id, component.station_id, component.name]
          );
        }
      } else {
        // 2. Check for default station or assign to "General"
        // For now, we'll try to find a default station or create one if it doesn't exist
        // TODO: In a real app, we should look up the product's assigned station

        // Get default station
        let stationResult = await this.pool.query(
          `SELECT id FROM kitchen_stations WHERE company_id = $1 AND is_default = true LIMIT 1`,
          [companyId]
        );

        let stationId;
        if (stationResult.rows.length === 0) {
          // Determine station based on category metadata (migration path)
          // This preserves existing logic: "Bar" vs "Kitchen"
          const itemMetadataResult = await this.pool.query(
            `SELECT mc.metadata, mc.name
                     FROM menu_items mi
                     LEFT JOIN menu_categories mc ON mi.category_id = mc.id
                     WHERE mi.id = $1`,
            [productId]
          );

          const metadata = itemMetadataResult.rows[0]?.metadata || {};
          const categoryName = (itemMetadataResult.rows[0]?.name || '').toLowerCase();

          const isBar =
            metadata.type === 'bar' ||
            metadata.location === 'bar' ||
            categoryName.includes('bebida') ||
            categoryName.includes('bar');

          const stationName = isBar ? 'Bar' : 'Cocina';

          // Find or create this station
          const findStation = await this.pool.query(
            `SELECT id FROM kitchen_stations WHERE company_id = $1 AND name = $2`,
            [companyId, stationName]
          );

          if (findStation.rows.length > 0) {
            stationId = findStation.rows[0].id;
          } else {
            const createStation = await this.pool.query(
              `INSERT INTO kitchen_stations (company_id, name, is_default)
                         VALUES ($1, $2, $3) RETURNING id`,
              [companyId, stationName, !isBar] // Make Kitchen default
            );
            stationId = createStation.rows[0].id;
          }
        } else {
          stationId = stationResult.rows[0].id;
        }

        // Create single task for the item
        await this.pool.query(
          `INSERT INTO kitchen_tasks (id, order_item_id, station_id, component_name, status)
                 VALUES (gen_random_uuid(), $1, $2, $3, 'pending')`,
          [item.id, stationId, item.name || 'Item']
        );
      }
    }

    // Change all 'pending' order items status to 'sent'
    const updateResult = await this.pool.query(
      `UPDATE order_items 
       SET status = 'sent' 
       WHERE order_id = $1 AND status = 'pending'
       RETURNING id`,
      [orderId]
    );

    const updatedItemCount = updateResult.rows.length;

    // If order was in 'draft', change its status to 'sent_to_kitchen'
    if (order.status === 'draft' || order.status === 'served') {
      await this.pool.query(
        `UPDATE orders SET status = 'sent_to_kitchen', sent_to_kitchen_at = NOW() WHERE id = $1 AND company_id = $2`,
        [orderId, companyId]
      );

      // Log status change
      await this.logStatusChange(orderId, order.status, 'sent_to_kitchen', companyId, order.waiterId);
    } else if (order.status === 'sent_to_kitchen') {
      // If already sent, just ensure sent_to_kitchen_at is set if it was null
      await this.pool.query(
        `UPDATE orders SET sent_to_kitchen_at = COALESCE(sent_to_kitchen_at, NOW()) WHERE id = $1 AND company_id = $2`,
        [orderId, companyId]
      );
    }

    // Only emit event if something actually changed
    // We should probably emit an event about tasks created as well
    if (updatedItemCount > 0 || order.status === 'draft') {
      const items = await this.getOrderItems(orderId, companyId);

      emitEvent(DomainEventType.ORDER_SENT_TO_KITCHEN, {
        orderId,
        companyId,
        tableId: order.tableId,
        items: items.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      } as any);
    }

    return this.getOrder(orderId, companyId);
  }

  /**
   * Mark Order as Served
   * RULE: Only if all items are 'prepared' or 'served'
   */
  async markAsServed(orderId: string, companyId: string): Promise<Order> {
    const order = await this.getOrder(orderId, companyId);

    if (order.status !== 'sent_to_kitchen') {
      throw new Error(`Cannot mark order as served with status: ${order.status}`);
    }

    // Verify all items are prepared or served
    const items = await this.getOrderItems(orderId, companyId);
    const allPreparedOrServed = items.every(item =>
      item.status === 'prepared' || item.status === 'served'
    );

    if (!allPreparedOrServed) {
      throw new Error('Cannot mark order as served: not all items are prepared');
    }

    // Mark all items as served
    await this.pool.query(
      `UPDATE order_items SET status = 'served' WHERE order_id = $1`,
      [orderId]
    );

    // Change order status
    await this.pool.query(
      `UPDATE orders SET status = 'served' WHERE id = $1 AND company_id = $2`,
      [orderId, companyId]
    );

    // Log status change
    await this.logStatusChange(orderId, order.status, 'served', companyId, order.waiterId);

    // Emit event
    emitEvent(DomainEventType.ORDER_SERVED, {
      orderId,
      companyId,
      tableId: order.tableId,
      waiterId: order.waiterId,
    } as any);

    return this.getOrder(orderId, companyId);
  }

  /**
   * Close Order
   * RULE: Only if all items are 'served'
   * RULE: Only if payment is completed
   */
  async closeOrder(orderId: string, companyId: string): Promise<Order> {
    const order = await this.getOrder(orderId, companyId);

    if (order.status === 'closed') {
      // Already closed (idempotent)
      return order;
    }

    // Verify order can be closed (all items served)
    if (!await canCloseOrder(this.pool, orderId)) {
      throw new Error('Cannot close order: not all items are served');
    }

    // Change order status to closed
    await this.pool.query(
      `UPDATE orders SET status = 'closed' WHERE id = $1 AND company_id = $2`,
      [orderId, companyId]
    );

    // Log status change
    await this.logStatusChange(orderId, order.status, 'closed', companyId, order.waiterId);

    const closedOrder = await this.getOrder(orderId, companyId);

    // Emit event
    emitEvent(DomainEventType.ORDER_CLOSED, {
      orderId: closedOrder.id,
      companyId: closedOrder.companyId,
      tableId: closedOrder.tableId,
      waiterId: closedOrder.waiterId,
    } as any);

    return closedOrder;
  }

  /**
   * Cancel Order
   */
  async cancelOrder(orderId: string, companyId: string): Promise<Order> {
    const order = await this.getOrder(orderId, companyId);

    if (order.status === 'closed') {
      throw new Error('Cannot cancel closed order');
    }

    await this.pool.query(
      `UPDATE orders SET status = 'cancelled' WHERE id = $1 AND company_id = $2`,
      [orderId, companyId]
    );

    // Log status change
    await this.logStatusChange(orderId, order.status, 'cancelled', companyId, order.waiterId);

    emitEvent(DomainEventType.ORDER_CANCELLED, {
      orderId,
      companyId,
      tableId: order.tableId,
      waiterId: order.waiterId,
    } as any);

    return this.getOrder(orderId, companyId);
  }

  /**
   * Get Order Items
   */
  async getOrderItems(orderId: string, companyId: string): Promise<OrderItem[]> {
    // Security check: Verify order belongs to company
    await this.getOrder(orderId, companyId);

    const result = await this.pool.query(
      `SELECT id, order_id, product_id, name, quantity, price as price_snapshot, status, notes, created_at
       FROM order_items WHERE order_id = $1
       ORDER BY created_at ASC`,
      [orderId]
    );

    return result.rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      productName: row.name || `Producto ${(row.product_id || '').substring(0, 8)}`,
      quantity: parseInt(row.quantity) || 1,
      priceSnapshot: parseFloat(row.price_snapshot || '0'),
      status: row.status,
      notes: row.notes || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    }));
  }

  /**
   * Recalculate Order Totals
   */
  private async recalculateOrderTotals(orderId: string, companyId: string): Promise<void> {
    const result = await this.pool.query(
      `SELECT SUM(price * quantity) as subtotal
       FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    const subtotal = parseFloat(result.rows[0].subtotal || '0');
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    await this.pool.query(
      `UPDATE orders SET subtotal = $1, tax = $2, total = $3 WHERE id = $4 AND company_id = $5`,
      [subtotal, tax, total, orderId, companyId]
    );
  }

  /**
   * Cancel or Remove Order Item
   * RULE: If 'pending', delete the record
   * RULE: If 'sent', 'prepared', or 'served', change status to 'cancelled'
   */
  async cancelOrderItem(orderId: string, itemId: string, companyId: string): Promise<void> {
    // Check if item exists and belongs to company via order
    await this.getOrder(orderId, companyId);

    const itemResult = await this.pool.query(
      `SELECT status FROM order_items WHERE id = $1 AND order_id = $2`,
      [itemId, orderId]
    );

    if (itemResult.rows.length === 0) {
      throw new Error(`Item ${itemId} not found in order ${orderId}`);
    }

    const { status } = itemResult.rows[0];

    if (status === 'pending') {
      await this.pool.query(
        `DELETE FROM order_items WHERE id = $1`,
        [itemId]
      );
    } else {
      await this.pool.query(
        `UPDATE order_items SET status = 'cancelled' WHERE id = $1`,
        [itemId]
      );
    }

    // Recalculate totals
    await this.recalculateOrderTotals(orderId, companyId);

    // Emit event
    emitEvent(DomainEventType.ORDER_ITEM_CANCELLED, {
      orderId,
      companyId,
      itemId,
      previousStatus: status
    } as any);
  }

  /**
   * Map database row to Order
   */
  private mapRowToOrder(row: any): Order {
    return {
      id: row.id,
      tableId: row.table_id,
      waiterId: row.waiter_id,
      companyId: row.company_id,
      status: row.status,
      subtotal: parseFloat(row.subtotal),
      tax: parseFloat(row.tax),
      total: parseFloat(row.total),
      createdAt: row.created_at.toISOString(),
    };
  }

  /**
   * Log Order Status Change (Audit)
   */
  private async logStatusChange(
    orderId: string,
    oldStatus: string | null,
    newStatus: string,
    companyId: string,
    userId?: string
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO order_status_history (id, order_id, old_status, new_status, user_id, company_id, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [orderId, oldStatus, newStatus, userId || null, companyId]
      );
    } catch (err) {
      console.error('[OrdersService] Error logging status change:', err);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Get Order Status History (Audit Timeline)
   */
  async getStatusHistory(orderId: string, companyId: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT h.id, h.old_status, h.new_status, h.user_id, u.name as user_name, h.created_at
       FROM order_status_history h
       LEFT JOIN users u ON h.user_id = u.id
       WHERE h.order_id = $1 AND h.company_id = $2
       ORDER BY h.created_at DESC`,
      [orderId, companyId]
    );

    return result.rows;
  }
}

