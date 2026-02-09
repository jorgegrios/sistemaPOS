/**
 * Kitchen Domain Service (KDS)
 * Manages kitchen display system
 * RULE: Kitchen only sees items with status = 'sent'
 * SSOT: All kitchen operations go through this service
 */

import { Pool } from 'pg';
import { KitchenOrderItem, KitchenOrder, KitchenTask, KitchenStation } from './types';
import { emitEvent, DomainEventType } from '../../shared/events';
import { canCloseOrder } from '../../shared/idempotency';

export class KitchenService {
  constructor(private pool: Pool) { }

  /**
   * Get Active Kitchen Items (Tasks)
   * RULE: Show kitchen_tasks with status = 'pending' or 'sent' or 'prepared'
   * @param stationId The station UUID to filter by
   */
  async getActiveItems(companyId: string, stationId?: string): Promise<KitchenOrderItem[]> {
    // If no stationId provided, return nothing or all? 
    // For KDS we usually want a specific station.

    let query = `
       SELECT 
        kt.id as task_id,
        kt.component_name,
        kt.status as task_status,
        kt.created_at as task_created_at,
        station.name as station_name,
        station.id as station_id,
        oi.id as item_id,
        oi.order_id,
        COALESCE(oi.product_id, oi.menu_item_id) as product_id,
        COALESCE(oi.name, mi.name) as product_name,
        oi.quantity,
        oi.status as item_status,
        oi.notes,
        oi.seat_number,
        COALESCE(t.name, t.table_number::text) as table_number,
        COALESCE(o.order_number, 'N/A') as order_number,
        oi.created_at as item_created_at,
        o.sent_to_kitchen_at as sent_at
       FROM kitchen_tasks kt
       INNER JOIN order_items oi ON kt.order_item_id = oi.id
       INNER JOIN orders o ON oi.order_id = o.id
       INNER JOIN kitchen_stations station ON kt.station_id = station.id
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN menu_items mi ON (COALESCE(oi.product_id, oi.menu_item_id) = mi.id)
       WHERE kt.status IN ('pending', 'sent', 'prepared')
       AND o.company_id = $1
    `;

    const params: any[] = [companyId];

    if (stationId) {
      query += ` AND kt.station_id = $2`;
      params.push(stationId);
    }

    query += ` ORDER BY o.sent_to_kitchen_at ASC, o.order_number ASC`;

    // DEBUG
    console.log('DEBUG: getActiveItems Query:', query);
    console.log('DEBUG: Running from:', __filename);

    const result = await this.pool.query(query, params);

    // Group tasks by order item to return KitchenOrderItem structure
    // But conceptually, KDS might want to show Tasks individually if they are separate components
    // However, the interface returns KitchenOrderItem.
    // Let's allow returning the same Item multiple times if it has multiple tasks for this station?
    // Or return Items with a list of tasks?
    // The previous interface returned OrderItems. 

    // Proposal: Return "KitchenOrderItem" but adapted.
    // Actually, for the Station View, we see "Carne - Termino Medio" as one card.

    // Let's Group by Item ID, but filtering tasks for this station.
    const itemsMap = new Map<string, KitchenOrderItem>();

    for (const row of result.rows) {
      if (!itemsMap.has(row.item_id)) {
        itemsMap.set(row.item_id, {
          id: row.item_id,
          orderId: row.order_id,
          productId: row.product_id,
          productName: row.product_name,
          quantity: row.quantity,
          status: row.item_status, // aggregate status
          notes: row.notes,
          seatNumber: row.seat_number,
          tableNumber: row.table_number,
          orderNumber: row.order_number,
          createdAt: row.item_created_at.toISOString(),
          sentAt: row.sent_at ? new Date(row.sent_at).toISOString() : new Date().toISOString(),
          tasks: [] // Initialize tasks array
        });
      }

      const item = itemsMap.get(row.item_id)!;
      item.tasks?.push({
        id: row.task_id,
        orderItemId: row.item_id,
        stationId: row.station_id,
        stationName: row.station_name,
        componentName: row.component_name,
        status: row.task_status,
        createdAt: row.task_created_at.toISOString()
      });
    }

    return Array.from(itemsMap.values());
  }

  /**
   * Get Kitchen Items by Order
   */
  async getItemsByOrder(orderId: string, companyId: string, station?: 'kitchen' | 'bar'): Promise<KitchenOrderItem[]> {
    const result = await this.pool.query(
      `SELECT 
        oi.id,
        oi.order_id,
        COALESCE(oi.product_id, oi.menu_item_id) as product_id,
        COALESCE(oi.name, mi.name) as product_name,
        oi.quantity,
        oi.status,
        oi.notes,
        oi.seat_number,
        COALESCE(t.name, t.table_number::text) as table_number,
        COALESCE(o.order_number, 'N/A') as order_number,
        oi.created_at,
        o.sent_to_kitchen_at as sent_at,
        mc.id as category_id,
        mc.name as category_name,
        COALESCE(mc.metadata, '{}'::jsonb) as category_metadata
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.id
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN menu_items mi ON (
         (oi.product_id IS NOT NULL AND oi.product_id = mi.id)
         OR (oi.product_id IS NULL AND oi.menu_item_id = mi.id)
       )
       LEFT JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE oi.order_id = $1
       AND oi.status IN ('sent', 'prepared')
       AND o.company_id = $2
       ORDER BY oi.created_at ASC`,
      [orderId, companyId]
    );

    // Filtrar items de bar en memoria
    const kitchenItems = result.rows.filter(row => {
      if (!row.category_id || !row.category_name) {
        return true;
      }

      const metadata = row.category_metadata || {};
      const categoryType = metadata.type || metadata.location || '';
      const categoryName = (row.category_name || '').toLowerCase();

      const isBarCategory =
        categoryType === 'bar' ||
        categoryType === 'drinks' ||
        categoryName.includes('bebida') ||
        categoryName.includes('bar') ||
        categoryName.includes('cocktail') ||
        categoryName.includes('coctel') ||
        categoryName.includes('cocteles') ||
        categoryName.includes('licores') ||
        categoryName.includes('cerveza') ||
        categoryName.includes('vino');

      if (station === 'bar') {
        return isBarCategory;
      } else if (station === 'kitchen') {
        return !isBarCategory;
      }

      return true;
    });

    return kitchenItems.map(row => this.mapRowToKitchenOrderItem(row));
  }

  /**
   * Get Kitchen Orders (grouped by order)
   * RULE: Only show orders with at least one item with status 'sent' (being prepared)
   * RULE: Exclude orders where all kitchen items are 'prepared' or 'served' (order complete)
   */
  async getKitchenOrders(companyId: string, station?: 'kitchen' | 'bar'): Promise<KitchenOrder[]> {
    // Only get items with status 'sent' or 'prepared' (not 'served')
    const items = await this.getActiveItems(companyId, station);

    // Group items by order and get order creation time
    const ordersMap = new Map<string, KitchenOrder>();

    // Get order creation times for all unique orders
    const uniqueOrderIds = [...new Set(items.map(item => item.orderId))];
    const orderTimesMap = new Map<string, string>();

    if (uniqueOrderIds.length > 0) {
      const orderTimesResult = await this.pool.query(
        `SELECT id, created_at, sent_to_kitchen_at FROM orders WHERE id = ANY($1::uuid[])`,
        [uniqueOrderIds]
      );

      orderTimesResult.rows.forEach(row => {
        // Use sent_to_kitchen_at if available, fallback to created_at, fallback to NOW
        const timestamp = row.sent_to_kitchen_at || row.created_at || new Date();
        orderTimesMap.set(row.id, new Date(timestamp).toISOString());
      });
    }

    items.forEach(item => {
      if (!ordersMap.has(item.orderId)) {
        // Use order creation time (when waiter took the order), fallback to item creation time
        const orderCreatedAt = orderTimesMap.get(item.orderId) || item.createdAt;

        ordersMap.set(item.orderId, {
          orderId: item.orderId,
          orderNumber: item.orderNumber,
          tableNumber: item.tableNumber,
          items: [],
          createdAt: orderCreatedAt,
        });
      }

      ordersMap.get(item.orderId)!.items.push(item);
    });

    // Filter out orders where all items are 'prepared' (no items with status 'sent')
    // When all items are prepared, they are automatically marked as 'served' and disappear
    const activeOrders = Array.from(ordersMap.values()).filter(order => {
      // Show orders that have at least one item being prepared (sent)
      // Once all are 'prepared', the order disappears from this view
      const hasPendingItems = order.items.some(item =>
        item.status === 'sent'
      );
      return hasPendingItems;
    });

    // Sort by oldest first (highest wait time at top)
    activeOrders.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return activeOrders;
  }

  /**
   * Mark Kitchen Task as Prepared
   * RULE: Mark specific task as prepared.
   * Check if all tasks for the order item are prepared -> update order item.
   * Check if all items for the order are prepared -> update order.
   */
  async markTaskPrepared(taskId: string, companyId: string): Promise<KitchenTask> {
    // 1. Get task and verify status
    const taskResult = await this.pool.query(
      `SELECT kt.id, kt.order_item_id, kt.status, kt.station_id, o.id as order_id
         FROM kitchen_tasks kt
         JOIN order_items oi ON kt.order_item_id = oi.id
         JOIN orders o ON oi.order_id = o.id
         WHERE kt.id = $1 AND o.company_id = $2`,
      [taskId, companyId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error(`Task ${taskId} not found`);
    }

    const task = taskResult.rows[0];

    // Update task status
    await this.pool.query(
      `UPDATE kitchen_tasks SET status = 'prepared', completed_at = NOW() WHERE id = $1`,
      [taskId]
    );

    // 2. Check parent Order Item
    // Are all tasks for this item prepared?
    const itemTasksResult = await this.pool.query(
      `SELECT count(*) as total,
                SUM(CASE WHEN status = 'prepared' OR status = 'served' THEN 1 ELSE 0 END) as completed
         FROM kitchen_tasks
         WHERE order_item_id = $1`,
      [task.order_item_id]
    );

    const { total, completed } = itemTasksResult.rows[0];

    if (parseInt(total) > 0 && parseInt(total) === parseInt(completed)) {
      // All tasks done, mark item as prepared
      await this.pool.query(
        `UPDATE order_items SET status = 'prepared' WHERE id = $1`,
        [task.order_item_id]
      );

      // Emit item prepared event
      emitEvent(DomainEventType.ORDER_ITEM_PREPARED, {
        orderId: task.order_id,
        orderItemId: task.order_item_id,
      } as any);
    }

    // Return updated task info
    // Fetch full task details
    const updatedTaskResult = await this.pool.query(
      `SELECT kt.id, kt.order_item_id as orderItemId, kt.station_id as stationId, 
                ks.name as stationName, kt.component_name as componentName, 
                kt.status, kt.created_at as createdAt, kt.completed_at as completedAt
         FROM kitchen_tasks kt
         JOIN kitchen_stations ks ON kt.station_id = ks.id
         WHERE kt.id = $1`,
      [taskId]
    );

    // Check order level is handled by separate logic or re-checked here?
    // Existing logic had a check for "All Kitchen Items".
    // We can keep specific logic separate or trigger it.

    return {
      id: updatedTaskResult.rows[0].id,
      orderItemId: updatedTaskResult.rows[0].orderitemid,
      stationId: updatedTaskResult.rows[0].stationid,
      stationName: updatedTaskResult.rows[0].stationname,
      componentName: updatedTaskResult.rows[0].componentname,
      status: updatedTaskResult.rows[0].status,
      createdAt: updatedTaskResult.rows[0].createdat.toISOString(),
      completedAt: updatedTaskResult.rows[0].completedat?.toISOString()
    };
  }

  // Legacy method kept for compatibility but should be deprecated or adapted
  async markItemPrepared(orderItemId: string, companyId: string): Promise<KitchenOrderItem> {
    // NOTE: This logic assumes we are marking the WHOLE item.
    // If we have tasks, we should force using markTaskPrepared.
    // Or we mark ALL tasks as prepared.

    // For now, let's auto-complete all tasks for this item
    const tasks = await this.pool.query(
      `SELECT id FROM kitchen_tasks WHERE order_item_id = $1 AND status != 'prepared'`,
      [orderItemId]
    );

    for (const row of tasks.rows) {
      await this.markTaskPrepared(row.id, companyId);
    }

    // Return updated item
    const items = await this.getItemsByOrder(
      (await this.pool.query('SELECT order_id FROM order_items WHERE id = $1', [orderItemId])).rows[0].order_id,
      companyId
    );

    return items.find(i => i.id === orderItemId)!;
  }

  /**
   * Get Served Orders (orders with all items served)
   * RULE: Only show orders where all kitchen items have status = 'served'
   */
  async getServedOrders(companyId: string, station?: 'kitchen' | 'bar'): Promise<KitchenOrder[]> {
    // Get ALL orders that have at least one item with status 'served' or 'prepared'
    // We'll check each one to see if ALL kitchen items are served/prepared
    const allOrdersResult = await this.pool.query(
      `SELECT DISTINCT o.id as order_id, o.order_number, o.status as order_status, o.created_at
       FROM orders o
       INNER JOIN order_items oi ON oi.order_id = o.id
       WHERE o.status IN ('served', 'sent_to_kitchen', 'closed')
       AND oi.status IN ('served', 'prepared')
       AND o.company_id = $1
       ORDER BY o.sent_to_kitchen_at DESC`,
      [companyId]
    );

    console.log('[Kitchen] Checking', allOrdersResult.rows.length, 'orders for served status (have items with served/prepared status)');

    if (allOrdersResult.rows.length === 0) {
      console.log('[Kitchen] No orders found with served/prepared items');
      return [];
    }

    const ordersWithServedItemsResult = allOrdersResult;

    // Now, for each order, get all its kitchen items (only those with status 'served')
    // and verify that ALL kitchen items in that order are served
    const allServedOrders: KitchenOrder[] = [];

    for (const orderRow of ordersWithServedItemsResult.rows) {
      const orderId = orderRow.order_id;

      // Get all kitchen items for this order (regardless of status)
      // We need to check ALL items to see if they're all served
      const allKitchenItemsResult = await this.pool.query(
        `SELECT 
          oi.id,
          oi.order_id,
          oi.status,
          oi.seat_number,
          COALESCE(oi.product_id, oi.menu_item_id) as product_id,
          mi.id as menu_item_id,
          mc.id as category_id,
          mc.name as category_name,
          COALESCE(mc.metadata, '{}'::jsonb) as category_metadata
         FROM order_items oi
         LEFT JOIN menu_items mi ON (COALESCE(oi.product_id, oi.menu_item_id) = mi.id)
         LEFT JOIN menu_categories mc ON mi.category_id = mc.id
         WHERE oi.order_id = $1`,
        [orderId]
      );

      console.log(`[Kitchen] Order ${orderId} has ${allKitchenItemsResult.rows.length} total items`);

      // Filter items by station - items without category are assumed to be kitchen items
      const kitchenItems = allKitchenItemsResult.rows.filter(row => {
        if (!row.category_id || !row.category_name) {
          return station !== 'bar';
        }

        let metadata: any = {};
        if (row.category_metadata) {
          metadata = typeof row.category_metadata === 'string'
            ? JSON.parse(row.category_metadata)
            : row.category_metadata;
        }

        const categoryType = (metadata?.type || metadata?.location || '') as string;
        const categoryName = ((row.category_name || '') as string).toLowerCase();

        const isBarCategory =
          categoryType === 'bar' ||
          categoryType === 'drinks' ||
          categoryName.includes('bebida') ||
          categoryName.includes('bar') ||
          categoryName.includes('cocktail') ||
          categoryName.includes('coctel') ||
          categoryName === 'cocteles' ||
          categoryName.includes('licores') ||
          categoryName.includes('cerveza') ||
          categoryName.includes('vino');

        if (station === 'bar') return isBarCategory;
        if (station === 'kitchen') return !isBarCategory;
        return true;
      });

      console.log(`[Kitchen] Order ${orderId} has ${kitchenItems.length} kitchen items (excluding bar)`);

      // Check if ALL kitchen items are served or prepared
      // If there are no kitchen items, skip this order (it's all bar items)
      if (kitchenItems.length === 0) {
        console.log(`[Kitchen] Order ${orderId} has no kitchen items (all bar items), skipping`);
        continue;
      }

      const servedCount = kitchenItems.filter(item => item.status === 'served').length;
      const preparedCount = kitchenItems.filter(item => item.status === 'prepared').length;
      const sentCount = kitchenItems.filter(item => item.status === 'sent').length;

      // Check if ALL kitchen items are served OR (prepared + served)
      // If all items are prepared, they should be marked as served automatically
      // But we'll include them in served orders if all are prepared/served
      const allKitchenItemsServed = kitchenItems.length > 0 &&
        (kitchenItems.every(item => item.status === 'served') ||
          (servedCount + preparedCount === kitchenItems.length && sentCount === 0));

      console.log(`[Kitchen] Order ${orderId}: ${servedCount} served, ${preparedCount} prepared, ${sentCount} sent out of ${kitchenItems.length} kitchen items. All served: ${allKitchenItemsServed}`);

      if (allKitchenItemsServed) {
        console.log(`[Kitchen] Order ${orderId} - ALL kitchen items are served/prepared, including in served orders list`);

        // If all items are prepared but not yet served, mark them as served first
        // Capture the timestamp when marking as served
        let servedAtTimestamp: Date | null = null;
        if (preparedCount > 0 && servedCount < kitchenItems.length) {
          console.log(`[Kitchen] Order ${orderId} - Marking ${preparedCount} prepared items as served`);
          servedAtTimestamp = new Date(); // Capture current timestamp when marking as served

          await this.pool.query(
            `UPDATE order_items oi
             SET status = 'served'
             WHERE oi.order_id = $1 
             AND oi.status = 'prepared'
             AND EXISTS (
               SELECT 1 
               FROM menu_items mi
               LEFT JOIN menu_categories mc ON mi.category_id = mc.id
               WHERE (COALESCE(oi.product_id, oi.menu_item_id) = mi.id)
               AND (
                 mc.id IS NULL 
                 OR (
                   COALESCE(mc.metadata->>'type', '') NOT IN ('bar', 'drinks')
                   AND COALESCE(mc.metadata->>'location', '') != 'bar'
                   AND LOWER(COALESCE(mc.name, '')) NOT LIKE '%bebida%'
                   AND LOWER(COALESCE(mc.name, '')) NOT LIKE '%bar%'
                   AND LOWER(COALESCE(mc.name, '')) NOT LIKE '%cocktail%'
                   AND LOWER(COALESCE(mc.name, '')) NOT LIKE '%coctel%'
                   AND LOWER(COALESCE(mc.name, '')) != 'cocteles'
                 )
               )
             )`,
            [orderId]
          );
        }

        // Get full details of served items for this order (now all should be 'served')
        const servedItemsResult = await this.pool.query(
          `SELECT 
            oi.id,
            oi.order_id,
            COALESCE(oi.product_id, oi.menu_item_id) as product_id,
            COALESCE(oi.name, mi.name) as product_name,
            oi.quantity,
            oi.status,
            oi.notes,
            oi.seat_number,
            COALESCE(t.name, t.table_number::text) as table_number,
            COALESCE(o.order_number, 'N/A') as order_number,
            o.sent_to_kitchen_at as order_created_at,
            oi.created_at,
            mc.id as category_id,
            mc.name as category_name,
            COALESCE(mc.metadata, '{}'::jsonb) as category_metadata
           FROM order_items oi
           INNER JOIN orders o ON oi.order_id = o.id
           LEFT JOIN tables t ON o.table_id = t.id
           LEFT JOIN menu_items mi ON (
             COALESCE(oi.product_id, oi.menu_item_id) = mi.id
           )
           LEFT JOIN menu_categories mc ON mi.category_id = mc.id
           WHERE oi.order_id = $1
           AND oi.status = 'served'
           AND (
             mc.id IS NULL 
             OR (
               COALESCE(mc.metadata->>'type', '') NOT IN ('bar', 'drinks')
               AND COALESCE(mc.metadata->>'location', '') != 'bar'
               AND LOWER(COALESCE(mc.name, '')) NOT LIKE '%bebida%'
               AND LOWER(COALESCE(mc.name, '')) NOT LIKE '%bar%'
               AND LOWER(COALESCE(mc.name, '')) NOT LIKE '%cocktail%'
               AND LOWER(COALESCE(mc.name, '')) NOT LIKE '%coctel%'
               AND LOWER(COALESCE(mc.name, '')) != 'cocteles'
             )
           )
           ORDER BY oi.created_at ASC`,
          [orderId]
        );

        // Filter bar items
        const servedKitchenItems = servedItemsResult.rows.filter(row => {
          if (!row.category_id || !row.category_name) {
            return true;
          }

          let metadata: any = {};
          if (row.category_metadata) {
            if (typeof row.category_metadata === 'string') {
              try {
                metadata = JSON.parse(row.category_metadata);
              } catch (e) {
                metadata = {};
              }
            } else {
              metadata = row.category_metadata;
            }
          }

          const categoryType = (metadata?.type || metadata?.location || '') as string;
          const categoryName = ((row.category_name || '') as string).toLowerCase();

          const isBarCategory =
            categoryType === 'bar' ||
            categoryType === 'drinks' ||
            categoryName.includes('bebida') ||
            categoryName.includes('bar') ||
            categoryName.includes('cocktail') ||
            categoryName.includes('coctel') ||
            categoryName === 'cocteles';

          return !isBarCategory;
        });

        if (servedKitchenItems.length > 0) {
          const items = servedKitchenItems.map(row => this.mapRowToKitchenOrderItem(row));

          // Get order creation time (when waiter took the order)
          const orderCreatedAt = servedKitchenItems[0]?.order_created_at
            ? new Date(servedKitchenItems[0].order_created_at).toISOString()
            : items[0].createdAt;

          // Get served_at timestamp:
          // 1. If we just marked items as served, use the captured timestamp
          // 2. Otherwise, get the maximum created_at from items that are already served
          //    (this is an approximation, but better than nothing)
          let servedAt: string | undefined;
          if (servedAtTimestamp) {
            // We just marked items as served, use the timestamp we captured
            servedAt = servedAtTimestamp.toISOString();
          } else {
            // Items were already served, try to get the most recent item timestamp
            // For better accuracy, we could add an updated_at column to order_items in the future
            const maxItemCreatedAt = Math.max(
              ...items.map(item => new Date(item.createdAt).getTime())
            );
            servedAt = new Date(maxItemCreatedAt).toISOString();
          }

          console.log(`[Kitchen] Adding order ${orderId} (${items[0].tableNumber}) to served orders with ${items.length} items. Created: ${orderCreatedAt}, Served: ${servedAt}`);
          allServedOrders.push({
            orderId,
            orderNumber: items[0].orderNumber,
            tableNumber: items[0].tableNumber,
            items,
            createdAt: orderCreatedAt,
            servedAt,
          });
        } else {
          console.log(`[Kitchen] Order ${orderId} - no served kitchen items found after filtering, skipping`);
        }
      } else {
        console.log(`[Kitchen] Order ${orderId} - NOT all kitchen items are served/prepared. Status: ${servedCount} served, ${preparedCount} prepared, ${sentCount} sent out of ${kitchenItems.length} kitchen items. Excluding.`);
      }
    }

    // Sort by most recent first (using the first item's createdAt or order's createdAt)
    allServedOrders.sort((a, b) => {
      const dateA = new Date(a.items[0]?.createdAt || a.createdAt).getTime();
      const dateB = new Date(b.items[0]?.createdAt || b.createdAt).getTime();
      return dateB - dateA;
    });

    console.log('[Kitchen] Total served orders with all kitchen items served:', allServedOrders.length);

    return allServedOrders;
  }

  /**
   * Map database row to KitchenOrderItem
   */
  private mapRowToKitchenOrderItem(row: any): KitchenOrderItem {
    return {
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id || row.menu_item_id,
      productName: row.product_name || 'Producto',
      quantity: parseInt(row.quantity) || 1,
      status: row.status,
      notes: row.notes || undefined,
      seatNumber: row.seat_number,
      tableNumber: row.table_number || 'Sin mesa',
      orderNumber: row.order_number || 'N/A',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      sentAt: row.sent_at ? new Date(row.sent_at).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Get All Kitchen Stations
   */
  async getStations(companyId: string): Promise<KitchenStation[]> {
    const result = await this.pool.query(
      `SELECT id, name, is_default 
       FROM kitchen_stations 
       WHERE company_id = $1 
       ORDER BY name ASC`,
      [companyId]
    );

    // If no stations exist, return default ones for UI to show (compatibility)
    if (result.rows.length === 0) {
      return [
        { id: 'kitchen', name: 'Cocina', isDefault: true },
        { id: 'bar', name: 'Bar', isDefault: false }
      ];
    }

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      isDefault: row.is_default
    }));
  }
}

