/**
 * Inventory Service
 * Manages inventory items, stock levels, and movements
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  sku?: string;
  category?: string;
  unit: string;
  currentStock: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  costPerUnit: number;
  supplierId?: string;
  location?: string;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'waste' | 'return';
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  userId?: string;
  notes?: string;
  createdAt: Date;
}

export interface StockAlert {
  inventoryItemId: string;
  name: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  status: 'low' | 'critical' | 'out_of_stock';
}

class InventoryService {
  /**
   * Get all inventory items
   */
  async getInventoryItems(restaurantId: string, filters?: {
    category?: string;
    active?: boolean;
    lowStock?: boolean;
  }): Promise<InventoryItem[]> {
    let query = `
      SELECT * FROM inventory_items 
      WHERE restaurant_id = $1
    `;
    const params: any[] = [restaurantId];
    let paramIndex = 2;

    if (filters?.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.active !== undefined) {
      query += ` AND active = $${paramIndex}`;
      params.push(filters.active);
      paramIndex++;
    }

    if (filters?.lowStock) {
      query += ` AND current_stock <= reorder_point`;
    }

    query += ` ORDER BY name`;

    const result = await pool.query(query, params);
    return result.rows.map(this.mapRowToInventoryItem);
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    const result = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToInventoryItem(result.rows[0]);
  }

  /**
   * Create inventory item
   */
  async createInventoryItem(data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO inventory_items (
        id, restaurant_id, name, sku, category, unit, current_stock, 
        min_stock, max_stock, reorder_point, cost_per_unit, supplier_id, 
        location, active, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        id, data.restaurantId, data.name, data.sku || null, data.category || null,
        data.unit, data.currentStock, data.minStock || null, data.maxStock || null,
        data.reorderPoint || null, data.costPerUnit, data.supplierId || null,
        data.location || null, data.active, data.notes || null
      ]
    );

    return this.mapRowToInventoryItem(result.rows[0]);
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        const dbKey = this.camelToSnake(key);
        updates.push(`${dbKey} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return this.getInventoryItem(id) as Promise<InventoryItem>;
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `UPDATE inventory_items SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, params);

    return this.mapRowToInventoryItem(result.rows[0]);
  }

  /**
   * Adjust stock (add or remove)
   */
  async adjustStock(
    inventoryItemId: string,
    quantity: number,
    type: InventoryMovement['type'],
    options?: {
      unitCost?: number;
      referenceType?: string;
      referenceId?: string;
      userId?: string;
      notes?: string;
    }
  ): Promise<{ item: InventoryItem; movement: InventoryMovement }> {
    // Get current item
    const item = await this.getInventoryItem(inventoryItemId);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    // Calculate new stock
    let newStock = item.currentStock;
    if (type === 'purchase' || type === 'return') {
      newStock += quantity;
    } else if (type === 'sale' || type === 'waste') {
      newStock -= quantity;
    } else if (type === 'adjustment') {
      newStock = quantity; // Direct set
    }

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    // Update stock
    const updatedItem = await this.updateInventoryItem(inventoryItemId, {
      currentStock: newStock
    });

    // Create movement record
    const movementId = uuidv4();
    await pool.query(
      `INSERT INTO inventory_movements (
        id, inventory_item_id, type, quantity, unit_cost, 
        reference_type, reference_id, user_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        movementId, inventoryItemId, type, quantity,
        options?.unitCost || null, options?.referenceType || null,
        options?.referenceId || null, options?.userId || null,
        options?.notes || null
      ]
    );

    const movement: InventoryMovement = {
      id: movementId,
      inventoryItemId,
      type,
      quantity,
      unitCost: options?.unitCost,
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
      userId: options?.userId,
      notes: options?.notes,
      createdAt: new Date()
    };

    return { item: updatedItem, movement };
  }

  /**
   * Get stock alerts (low stock items)
   */
  async getStockAlerts(restaurantId: string): Promise<StockAlert[]> {
    const result = await pool.query(
      `SELECT id, name, current_stock, min_stock, reorder_point
       FROM inventory_items
       WHERE restaurant_id = $1 
         AND active = true
         AND (current_stock <= reorder_point OR current_stock <= min_stock)
       ORDER BY current_stock ASC`,
      [restaurantId]
    );

    return result.rows.map((row: any) => {
      let status: StockAlert['status'] = 'low';
      if (row.current_stock === 0) {
        status = 'out_of_stock';
      } else if (row.current_stock <= (row.min_stock || 0)) {
        status = 'critical';
      }

      return {
        inventoryItemId: row.id,
        name: row.name,
        currentStock: parseFloat(row.current_stock),
        minStock: parseFloat(row.min_stock || 0),
        reorderPoint: parseFloat(row.reorder_point || 0),
        status
      };
    });
  }

  /**
   * Get inventory movements
   */
  async getInventoryMovements(
    inventoryItemId?: string,
    filters?: {
      type?: InventoryMovement['type'];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<InventoryMovement[]> {
    let query = 'SELECT * FROM inventory_movements WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (inventoryItemId) {
      query += ` AND inventory_item_id = $${paramIndex}`;
      params.push(inventoryItemId);
      paramIndex++;
    }

    if (filters?.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters?.startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows.map((row: any) => ({
      id: row.id,
      inventoryItemId: row.inventory_item_id,
      type: row.type,
      quantity: parseFloat(row.quantity),
      unitCost: row.unit_cost ? parseFloat(row.unit_cost) : undefined,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      userId: row.user_id,
      notes: row.notes,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Map database row to InventoryItem
   */
  private mapRowToInventoryItem(row: any): InventoryItem {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      name: row.name,
      sku: row.sku,
      category: row.category,
      unit: row.unit,
      currentStock: parseFloat(row.current_stock),
      minStock: row.min_stock ? parseFloat(row.min_stock) : undefined,
      maxStock: row.max_stock ? parseFloat(row.max_stock) : undefined,
      reorderPoint: row.reorder_point ? parseFloat(row.reorder_point) : undefined,
      costPerUnit: parseFloat(row.cost_per_unit),
      supplierId: row.supplier_id,
      location: row.location,
      active: row.active,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export default new InventoryService();








