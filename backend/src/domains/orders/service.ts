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
  constructor(private pool: Pool) {}

  /**
   * Create Order (Idempotent)
   * RULE: One table = one active order (idempotent)
   * Returns existing order if active order exists for table
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    // IDEMPOTENCY CHECK: Check if active order exists for table
    const existingOrderId = await getActiveOrderForTable(this.pool, request.tableId);
    
    if (existingOrderId) {
      // Return existing order (idempotent)
      return this.getOrder(existingOrderId);
    }

    // Create new draft order
    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now()}`;

    const result = await this.pool.query(
      `INSERT INTO orders (id, order_number, table_id, waiter_id, status, subtotal, tax, total)
       VALUES ($1, $2, $3, $4, 'draft', 0, 0, 0)
       RETURNING id, table_id, waiter_id, status, subtotal, tax, total, created_at`,
      [orderId, orderNumber, request.tableId, request.waiterId]
    );

    const order = this.mapRowToOrder(result.rows[0]);

    // Emit event
    emitEvent(DomainEventType.ORDER_CREATED, {
      orderId: order.id,
      tableId: order.tableId,
      waiterId: order.waiterId,
    });

    return order;
  }

  /**
   * Get Order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    const result = await this.pool.query(
      `SELECT id, table_id, waiter_id, status, subtotal, tax, total, created_at
       FROM orders WHERE id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    return this.mapRowToOrder(result.rows[0]);
  }

  /**
   * Get Order with Items
   */
  async getOrderWithItems(orderId: string): Promise<OrderWithItems> {
    const order = await this.getOrder(orderId);
    const items = await this.getOrderItems(orderId);

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
  async addItemsToOrder(orderId: string, request: AddItemsRequest): Promise<OrderItem[]> {
    // Verify order exists and is in draft status
    const order = await this.getOrder(orderId);
    
    if (order.status !== 'draft') {
      throw new Error(`Cannot add items to order with status: ${order.status}`);
    }

    const newItems: OrderItem[] = [];

    // Get product prices and add items
    for (const item of request.items) {
      // Get product price (freeze it)
      // Note: menu_items table uses 'available' column, not 'active'
      const productResult = await this.pool.query(
        `SELECT COALESCE(base_price, price) as base_price, name 
         FROM menu_items 
         WHERE id = $1 AND available = true`,
        [item.productId]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.productId} not found or unavailable`);
      }

      const product = productResult.rows[0];
      const priceSnapshot = parseFloat(product.base_price);

      // Create order item
      const itemId = uuidv4();
      await this.pool.query(
        `INSERT INTO order_items (id, order_id, product_id, menu_item_id, name, price, quantity, notes, status)
         VALUES ($1, $2, $3, $3, $4, $5, $6, $7, 'pending')`,
        [itemId, orderId, item.productId, product.name, priceSnapshot, item.quantity, item.notes || null]
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
        createdAt: new Date().toISOString(),
      });
    }

    // Recalculate totals
    await this.recalculateOrderTotals(orderId);

    // Emit event
    emitEvent(DomainEventType.ORDER_ITEMS_ADDED, {
      orderId,
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
  async removeAllItemsFromOrder(orderId: string): Promise<void> {
    // Verify order exists and is in draft status
    const order = await this.getOrder(orderId);
    
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
      `UPDATE orders SET subtotal = 0, tax = 0, total = 0 WHERE id = $1`,
      [orderId]
    );
  }

  /**
   * Send Order to Kitchen (Idempotent)
   * RULE: Change status to 'sent_to_kitchen'
   * RULE: Change all order_items.status to 'sent'
   * RULE: Do not resend if already sent (idempotent)
   */
  async sendToKitchen(orderId: string): Promise<Order> {
    // IDEMPOTENCY CHECK: Already sent?
    if (await isOrderSentToKitchen(this.pool, orderId)) {
      // Return existing order (idempotent)
      return this.getOrder(orderId);
    }

    // Verify order exists and is in draft status
    const order = await this.getOrder(orderId);
    
    if (order.status !== 'draft') {
      throw new Error(`Cannot send order to kitchen with status: ${order.status}`);
    }

    // Change order status
    await this.pool.query(
      `UPDATE orders SET status = 'sent_to_kitchen' WHERE id = $1`,
      [orderId]
    );

    // Change all order items status to 'sent'
    await this.pool.query(
      `UPDATE order_items SET status = 'sent' WHERE order_id = $1 AND status = 'pending'`,
      [orderId]
    );

    // Get order items for event
    const items = await this.getOrderItems(orderId);

    // Emit event (include tableId for table occupation)
    emitEvent(DomainEventType.ORDER_SENT_TO_KITCHEN, {
      orderId,
      tableId: order.tableId,
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
    } as any);

    return this.getOrder(orderId);
  }

  /**
   * Mark Order as Served
   * RULE: Only if all items are 'prepared' or 'served'
   */
  async markAsServed(orderId: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    
    if (order.status !== 'sent_to_kitchen') {
      throw new Error(`Cannot mark order as served with status: ${order.status}`);
    }

    // Verify all items are prepared or served
    const items = await this.getOrderItems(orderId);
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
      `UPDATE orders SET status = 'served' WHERE id = $1`,
      [orderId]
    );

    // Emit event
    emitEvent(DomainEventType.ORDER_SERVED, {
      orderId,
      tableId: order.tableId,
      waiterId: order.waiterId,
    } as any);

    return this.getOrder(orderId);
  }

  /**
   * Close Order
   * RULE: Only if all items are 'served'
   * RULE: Only if payment is completed
   */
  async closeOrder(orderId: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    
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
      `UPDATE orders SET status = 'closed' WHERE id = $1`,
      [orderId]
    );

    const closedOrder = await this.getOrder(orderId);

    // Emit event
    emitEvent(DomainEventType.ORDER_CLOSED, {
      orderId: closedOrder.id,
      tableId: closedOrder.tableId,
      waiterId: closedOrder.waiterId,
    } as any);

    return closedOrder;
  }

  /**
   * Cancel Order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    
    if (order.status === 'closed') {
      throw new Error('Cannot cancel closed order');
    }

    await this.pool.query(
      `UPDATE orders SET status = 'cancelled' WHERE id = $1`,
      [orderId]
    );

    emitEvent(DomainEventType.ORDER_CANCELLED, {
      orderId,
      tableId: order.tableId,
      waiterId: order.waiterId,
    } as any);

    return this.getOrder(orderId);
  }

  /**
   * Get Order Items
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
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
  private async recalculateOrderTotals(orderId: string): Promise<void> {
    const result = await this.pool.query(
      `SELECT SUM(price * quantity) as subtotal
       FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    const subtotal = parseFloat(result.rows[0].subtotal || '0');
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    await this.pool.query(
      `UPDATE orders SET subtotal = $1, tax = $2, total = $3 WHERE id = $4`,
      [subtotal, tax, total, orderId]
    );
  }

  /**
   * Map database row to Order
   */
  private mapRowToOrder(row: any): Order {
    return {
      id: row.id,
      tableId: row.table_id,
      waiterId: row.waiter_id,
      status: row.status,
      subtotal: parseFloat(row.subtotal),
      tax: parseFloat(row.tax),
      total: parseFloat(row.total),
      createdAt: row.created_at.toISOString(),
    };
  }
}

