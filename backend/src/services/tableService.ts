/**
 * Table Service
 * Manages dining tables
 */

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  status: string;
  createdAt: Date;
}

class TableService {
  /**
   * Get all tables for a restaurant
   */
  async getTables(restaurantId: string): Promise<Table[]> {
    const result = await pool.query(
      `SELECT id, restaurant_id, table_number, capacity, status, created_at
       FROM tables
       WHERE restaurant_id = $1
       ORDER BY table_number`,
      [restaurantId]
    );

    return result.rows.map(row => ({
      id: row.id,
      restaurantId: row.restaurant_id,
      tableNumber: row.table_number,
      capacity: parseInt(row.capacity),
      status: row.status,
      createdAt: row.created_at
    }));
  }

  /**
   * Get a single table by ID
   */
  async getTable(id: string): Promise<Table | null> {
    const result = await pool.query(
      `SELECT id, restaurant_id, table_number, capacity, status, created_at
       FROM tables
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      tableNumber: row.table_number,
      capacity: parseInt(row.capacity),
      status: row.status,
      createdAt: row.created_at
    };
  }

  /**
   * Create a new table
   */
  async createTable(restaurantId: string, tableNumber: string, capacity: number): Promise<Table> {
    const result = await pool.query(
      `INSERT INTO tables (restaurant_id, table_number, capacity, status)
       VALUES ($1, $2, $3, 'available')
       RETURNING id, restaurant_id, table_number, capacity, status, created_at`,
      [restaurantId, tableNumber, capacity]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      tableNumber: row.table_number,
      capacity: parseInt(row.capacity),
      status: row.status,
      createdAt: row.created_at
    };
  }

  /**
   * Update a table
   */
  async updateTable(id: string, tableNumber?: string, capacity?: number, status?: string): Promise<Table> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (tableNumber !== undefined) {
      updates.push(`table_number = $${paramCount++}`);
      values.push(tableNumber);
    }
    if (capacity !== undefined) {
      updates.push(`capacity = $${paramCount++}`);
      values.push(capacity);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      const table = await this.getTable(id);
      if (!table) {
        throw new Error('Table not found');
      }
      return table;
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE tables
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, restaurant_id, table_number, capacity, status, created_at`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Table not found');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      tableNumber: row.table_number,
      capacity: parseInt(row.capacity),
      status: row.status,
      createdAt: row.created_at
    };
  }

  /**
   * Delete a table
   */
  async deleteTable(id: string): Promise<void> {
    const result = await pool.query(
      `DELETE FROM tables WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new Error('Table not found');
    }
  }
}

export default new TableService();








