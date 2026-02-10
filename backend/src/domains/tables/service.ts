/**
 * Tables Domain Service
 * Manages table lifecycle and status
 * SSOT: All table operations go through this service
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Table, CreateTableRequest, UpdateTableRequest, TableWithOrder } from './types';
import { TableStatus } from '../../shared/types';
import { emitEvent, DomainEventType } from '../../shared/events';

export class TablesService {
  constructor(private pool: Pool) { }

  /**
   * Create Table
   */
  async createTable(request: CreateTableRequest): Promise<Table> {
    const tableId = uuidv4();

    const result = await this.pool.query(
      `INSERT INTO tables (id, restaurant_id, table_number, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, NULL as capacity, 'available' as status, restaurant_id, created_at`,
      [tableId, request.restaurantId, request.name, request.name]
    );

    return this.mapRowToTable(result.rows[0]);
  }

  /**
   * Get Table by ID
   */
  async getTable(tableId: string): Promise<Table> {
    const result = await this.pool.query(
      `SELECT id, name, NULL as capacity, 'available' as status, restaurant_id, created_at
       FROM tables WHERE id = $1`,
      [tableId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Table ${tableId} not found`);
    }

    return this.mapRowToTable(result.rows[0]);
  }

  /**
   * Get Table with Active Order
   */
  async getTableWithOrder(tableId: string): Promise<TableWithOrder> {
    const table = await this.getTable(tableId);

    // Get active order for table - only 'draft' and 'sent_to_kitchen' are considered "active"
    // 'served' orders are already delivered, so they don't indicate active customers
    const orderResult = await this.pool.query(
      `SELECT id, total FROM orders 
       WHERE table_id = $1 
       AND status IN ('draft', 'sent_to_kitchen')
       ORDER BY created_at DESC
       LIMIT 1`,
      [tableId]
    );

    const tableWithOrder: TableWithOrder = { ...table };

    if (orderResult.rows.length > 0) {
      tableWithOrder.activeOrderId = orderResult.rows[0].id;
      tableWithOrder.activeOrderTotal = parseFloat(orderResult.rows[0].total);
    }

    return tableWithOrder;
  }

  /**
   * Get All Tables for Restaurant
   */
  async getTablesByRestaurant(restaurantId: string): Promise<Table[]> {
    const result = await this.pool.query(
      `SELECT id, name, NULL as capacity, 'available' as status, restaurant_id, created_at
       FROM tables 
       WHERE restaurant_id = $1
       ORDER BY name ASC`,
      [restaurantId]
    );

    return result.rows.map(row => this.mapRowToTable(row));
  }

  /**
   * Get All Tables with Active Orders
   */
  async getTablesWithOrders(restaurantId: string): Promise<TableWithOrder[]> {
    // PRIMERO: Obtener TODAS las mesas del restaurante (sin filtrar)
    const tables = await this.getTablesByRestaurant(restaurantId);
    console.log(`[Tables] DEBUG: Found ${tables.length} tables for restaurant`);

    // DEBUG: Log all orders for this restaurant to see what states exist
    const allOrdersDebug = await this.pool.query(
      `SELECT id, table_id, status, total, created_at FROM orders 
       WHERE table_id IN (
         SELECT id FROM tables WHERE restaurant_id = $1
       )
       ORDER BY created_at DESC`,
      [restaurantId]
    );
    console.log(`[Tables] DEBUG: All orders for restaurant ${restaurantId}:`, allOrdersDebug.rows.map((r: any) => ({
      id: r.id.substring(0, 8),
      table_id: r.table_id?.substring(0, 8),
      status: r.status,
      total: r.total
    })));

    // SEGUNDO: Obtener solo órdenes activas que TENGAN ITEMS
    // IMPORTANTE: Solo considerar órdenes que TENGAN ITEMS (no órdenes vacías)
    // IMPORTANTE: Solo considerar órdenes con payment_status = 'pending' (excluir pagadas)
    // 'served' orders are already delivered, so they don't indicate active customers
    // Una orden vacía (sin items) NO indica una mesa ocupada
    // NOTA: Usamos DISTINCT ON para obtener la orden más reciente por mesa
    const ordersResult = await this.pool.query(
      `SELECT DISTINCT ON (o.table_id) o.id, o.table_id, o.status, o.total, o.created_at
       FROM orders o
       INNER JOIN order_items oi ON oi.order_id = o.id
       WHERE o.table_id IN (
         SELECT id FROM tables WHERE restaurant_id = $1
       )
       AND o.status = ANY(ARRAY['draft', 'sent_to_kitchen']::text[])
       AND o.payment_status = 'pending'
       ORDER BY o.table_id, o.created_at DESC`,
      [restaurantId]
    );

    console.log(`[Tables] DEBUG: Active orders with items (draft or sent_to_kitchen, payment pending):`, ordersResult.rows.length, 'orders found');
    ordersResult.rows.forEach((r: any) => {
      console.log(`  - Order ${r.id.substring(0, 8)}: table ${r.table_id?.substring(0, 8)}, status: "${r.status}", total: ${r.total}`);
    });

    // TERCERO: Crear mapa de table_id -> order (solo una orden por mesa)
    // Usar la orden más reciente si existen múltiples (no debería pasar con idempotencia)
    const ordersByTable = new Map<string, { id: string; total: number }>();
    ordersResult.rows.forEach((row: any) => {
      // Solo establecer si no está ya en el mapa (la primera gana, que es la más reciente por ORDER BY)
      if (!ordersByTable.has(row.table_id)) {
        ordersByTable.set(row.table_id, {
          id: row.id,
          total: parseFloat(row.total),
        });
      }
    });

    // CUARTO: Combinar TODAS las mesas con sus órdenes activas (si tienen)
    // IMPORTANTE: Devolver TODAS las mesas, no solo las que tienen órdenes
    const result = tables.map(table => {
      const order = ordersByTable.get(table.id);
      if (order) {
        console.log(`[Tables] DEBUG: Table ${table.name} (${table.id.substring(0, 8)}) has active order ${order.id.substring(0, 8)}`);
        return {
          ...table,
          activeOrderId: order.id,
          activeOrderTotal: order.total,
        };
      }
      // Mesa sin orden activa - devolverla sin activeOrderId
      return table;
    });

    console.log(`[Tables] DEBUG: Returning ${result.length} tables, ${result.filter(t => (t as TableWithOrder).activeOrderId).length} with active orders`);
    return result;
  }

  /**
   * Update Table
   */
  async updateTable(tableId: string, request: UpdateTableRequest): Promise<Table> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (request.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(request.name);
      paramCount++;
    }

    if (request.capacity !== undefined) {
      updates.push(`capacity = $${paramCount}`);
      params.push(request.capacity);
      paramCount++;
    }

    if (request.status !== undefined) {
      updates.push(`status = $${paramCount}`);
      params.push(request.status);
      paramCount++;

      // Emit events for status changes
      if (request.status === 'occupied') {
        emitEvent(DomainEventType.TABLE_OCCUPIED, { orderId: '', tableId } as any);
      } else if (request.status === 'available') {
        emitEvent(DomainEventType.TABLE_FREED, { orderId: '', tableId } as any);
      } else if (request.status === 'reserved') {
        emitEvent(DomainEventType.TABLE_RESERVED, { orderId: '', tableId } as any);
      } else if (request.status === 'paid') {
        emitEvent(DomainEventType.TABLE_PAID as any, { tableId } as any);
      } else if (request.status === 'dirty') {
        emitEvent(DomainEventType.TABLE_DIRTY as any, { tableId } as any);
      }
    }

    if (updates.length === 0) {
      return this.getTable(tableId);
    }

    params.push(tableId);

    await this.pool.query(
      `UPDATE tables SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    return this.getTable(tableId);
  }

  /**
   * Occupy Table (set status to occupied)
   * Called when order is created
   */
  async occupyTable(tableId: string): Promise<Table> {
    return this.updateTable(tableId, { status: 'occupied' });
  }

  /**
   * Free Table (set status to available)
   * Called when order is closed (legacy) or manually
   */
  async freeTable(tableId: string): Promise<Table> {
    return this.updateTable(tableId, { status: 'available' });
  }

  /**
   * Mark Table as Paid (set status to paid)
   */
  async markAsPaid(tableId: string): Promise<Table> {
    return this.updateTable(tableId, { status: 'paid' });
  }

  /**
   * Mark Table as Dirty (set status to dirty)
   */
  async markAsDirty(tableId: string): Promise<Table> {
    return this.updateTable(tableId, { status: 'dirty' });
  }

  /**
   * Mark Table as Available/Clean (set status to available)
   */
  async markAsAvailable(tableId: string): Promise<Table> {
    return this.updateTable(tableId, { status: 'available' });
  }

  /**
   * Reserve Table
   */
  async reserveTable(tableId: string): Promise<Table> {
    return this.updateTable(tableId, { status: 'reserved' });
  }

  /**
   * Delete Table
   */
  async deleteTable(tableId: string): Promise<void> {
    await this.pool.query('DELETE FROM tables WHERE id = $1', [tableId]);
  }

  /**
   * Map database row to Table
   */
  private mapRowToTable(row: any): Table {
    return {
      id: row.id,
      name: row.name || row.table_number, // Fallback to table_number if name is null
      capacity: parseInt(row.capacity),
      status: row.status,
      restaurantId: row.restaurant_id,
      createdAt: row.created_at.toISOString(),
    };
  }
}


