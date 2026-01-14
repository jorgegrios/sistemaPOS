/**
 * Table Service
 * Frontend service for table management
 */

import { apiClient } from './api-client';

export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  status: string;
  createdAt: string;
}

class TableService {
  /**
   * Get all tables
   */
  async getTables(): Promise<Table[]> {
    const response = await apiClient.get<{ tables: Table[] }>('/v1/tables');
    return response.tables;
  }

  /**
   * Get a single table
   */
  async getTable(id: string): Promise<Table> {
    const response = await apiClient.get<{ table: Table }>(`/v1/tables/${id}`);
    return response.table;
  }

  /**
   * Create a new table
   */
  async createTable(tableNumber: string, capacity: number): Promise<Table> {
    const response = await apiClient.post<{ table: Table }>('/v1/tables', {
      tableNumber,
      capacity
    });
    return response.table;
  }

  /**
   * Update a table
   */
  async updateTable(id: string, data: { tableNumber?: string; capacity?: number; status?: string }): Promise<Table> {
    const response = await apiClient.put<{ table: Table }>(`/v1/tables/${id}`, data);
    return response.table;
  }

  /**
   * Delete a table
   */
  async deleteTable(id: string): Promise<void> {
    await apiClient.delete(`/v1/tables/${id}`);
  }
}

export const tableService = new TableService();



