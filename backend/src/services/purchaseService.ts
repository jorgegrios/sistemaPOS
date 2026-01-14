/**
 * Purchase Service
 * Manages suppliers, purchase orders, and receiving
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import inventoryService from './inventoryService';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface Supplier {
  id: string;
  restaurantId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  restaurantId: string;
  orderNumber: string;
  supplierId: string;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  expectedDeliveryDate?: Date;
  receivedAt?: Date;
  createdBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  inventoryItemId?: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  receivedQuantity: number;
  notes?: string;
  createdAt: Date;
}

class PurchaseService {
  /**
   * SUPPLIERS
   */

  async getSuppliers(restaurantId: string, activeOnly: boolean = false): Promise<Supplier[]> {
    let query = 'SELECT * FROM suppliers WHERE restaurant_id = $1';
    const params: any[] = [restaurantId];

    if (activeOnly) {
      query += ' AND active = true';
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    return result.rows.map(this.mapRowToSupplier);
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToSupplier(result.rows[0]);
  }

  async createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO suppliers (
        id, restaurant_id, name, contact_name, email, phone, address,
        tax_id, payment_terms, active, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id, data.restaurantId, data.name, data.contactName || null,
        data.email || null, data.phone || null, data.address || null,
        data.taxId || null, data.paymentTerms || null, data.active,
        data.notes || null
      ]
    );

    return this.mapRowToSupplier(result.rows[0]);
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
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
      return this.getSupplier(id) as Promise<Supplier>;
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `UPDATE suppliers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, params);

    return this.mapRowToSupplier(result.rows[0]);
  }

  /**
   * PURCHASE ORDERS
   */

  async getPurchaseOrders(
    restaurantId: string,
    filters?: { status?: PurchaseOrder['status']; supplierId?: string }
  ): Promise<PurchaseOrder[]> {
    let query = 'SELECT * FROM purchase_orders WHERE restaurant_id = $1';
    const params: any[] = [restaurantId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.supplierId) {
      query += ` AND supplier_id = $${paramIndex}`;
      params.push(filters.supplierId);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows.map(this.mapRowToPurchaseOrder);
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
    const result = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToPurchaseOrder(result.rows[0]);
  }

  async createPurchaseOrder(data: {
    restaurantId: string;
    supplierId: string;
    items: Array<{
      inventoryItemId?: string;
      name: string;
      quantity: number;
      unit: string;
      unitCost: number;
      notes?: string;
    }>;
    expectedDeliveryDate?: Date;
    notes?: string;
    createdBy?: string;
  }): Promise<PurchaseOrder> {
    const id = uuidv4();
    const orderNumber = `PO-${Date.now()}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of data.items) {
      subtotal += item.unitCost * item.quantity;
    }
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Create purchase order
    const result = await pool.query(
      `INSERT INTO purchase_orders (
        id, restaurant_id, order_number, supplier_id, status,
        subtotal, tax, total, expected_delivery_date, created_by, notes
      ) VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        id, data.restaurantId, orderNumber, data.supplierId,
        subtotal, tax, total, data.expectedDeliveryDate || null,
        data.createdBy || null, data.notes || null
      ]
    );

    const purchaseOrder = this.mapRowToPurchaseOrder(result.rows[0]);

    // Create items
    for (const item of data.items) {
      await pool.query(
        `INSERT INTO purchase_order_items (
          id, purchase_order_id, inventory_item_id, name, quantity, unit, unit_cost, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuidv4(), id, item.inventoryItemId || null, item.name,
          item.quantity, item.unit, item.unitCost, item.notes || null
        ]
      );
    }

    return purchaseOrder;
  }

  async updatePurchaseOrderStatus(
    id: string,
    status: PurchaseOrder['status']
  ): Promise<PurchaseOrder> {
    const updates: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: any[] = [status];

    if (status === 'received') {
      updates.push('received_at = NOW()');
    }

    params.push(id);

    const query = `UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`;
    const result = await pool.query(query, params);

    return this.mapRowToPurchaseOrder(result.rows[0]);
  }

  /**
   * Receive purchase order (update inventory)
   */
  async receivePurchaseOrder(
    id: string,
    receivedItems: Array<{
      itemId: string;
      receivedQuantity: number;
    }>,
    userId?: string
  ): Promise<PurchaseOrder> {
    // Get purchase order with items
    const po = await this.getPurchaseOrder(id);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    const itemsResult = await pool.query(
      'SELECT * FROM purchase_order_items WHERE purchase_order_id = $1',
      [id]
    );

    // Update received quantities and inventory
    for (const receivedItem of receivedItems) {
      const poItem = itemsResult.rows.find((r: any) => r.id === receivedItem.itemId);
      if (!poItem) continue;

      // Update received quantity
      await pool.query(
        'UPDATE purchase_order_items SET received_quantity = $1 WHERE id = $2',
        [receivedItem.receivedQuantity, receivedItem.itemId]
      );

      // Update inventory if item is linked
      if (poItem.inventory_item_id) {
        await inventoryService.adjustStock(
          poItem.inventory_item_id,
          receivedItem.receivedQuantity,
          'purchase',
          {
            unitCost: parseFloat(poItem.unit_cost),
            referenceType: 'purchase_order',
            referenceId: id,
            userId,
            notes: `Received from PO ${po.orderNumber}`
          }
        );
      }
    }

    // Update PO status
    return this.updatePurchaseOrderStatus(id, 'received');
  }

  /**
   * Get purchase order items
   */
  async getPurchaseOrderItems(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
    const result = await pool.query(
      'SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY created_at',
      [purchaseOrderId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      purchaseOrderId: row.purchase_order_id,
      inventoryItemId: row.inventory_item_id,
      name: row.name,
      quantity: parseFloat(row.quantity),
      unit: row.unit,
      unitCost: parseFloat(row.unit_cost),
      receivedQuantity: parseFloat(row.received_quantity),
      notes: row.notes,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Mappers
   */

  private mapRowToSupplier(row: any): Supplier {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      name: row.name,
      contactName: row.contact_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      taxId: row.tax_id,
      paymentTerms: row.payment_terms,
      active: row.active,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToPurchaseOrder(row: any): PurchaseOrder {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      orderNumber: row.order_number,
      supplierId: row.supplier_id,
      status: row.status,
      subtotal: parseFloat(row.subtotal),
      tax: parseFloat(row.tax),
      total: parseFloat(row.total),
      expectedDeliveryDate: row.expected_delivery_date ? new Date(row.expected_delivery_date) : undefined,
      receivedAt: row.received_at ? new Date(row.received_at) : undefined,
      createdBy: row.created_by,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export default new PurchaseService();








