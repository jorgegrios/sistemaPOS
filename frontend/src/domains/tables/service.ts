/**
 * Tables Domain Service (Frontend)
 * Uses new v2 API endpoints
 * SSOT: All table operations use this service
 */

import { apiClient } from '../../services/api-client';

export type TableStatus = 'free' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  restaurantId: string;
  createdAt: string;
}

export interface TableWithOrder extends Table {
  activeOrderId?: string;
  activeOrderTotal?: number;
}

export interface CreateTableRequest {
  name: string;
  capacity: number;
  restaurantId: string;
}

export interface UpdateTableRequest {
  name?: string;
  capacity?: number;
  status?: TableStatus;
}

class TablesDomainService {
  /**
   * Create Table
   */
  async createTable(request: CreateTableRequest): Promise<Table> {
    return apiClient.post<Table>('/v2/tables', request);
  }

  /**
   * Get Table by ID
   */
  async getTable(tableId: string): Promise<Table> {
    return apiClient.get<Table>(`/v2/tables/${tableId}`);
  }

  /**
   * Get Table with Active Order
   */
  async getTableWithOrder(tableId: string): Promise<TableWithOrder> {
    return apiClient.get<TableWithOrder>(`/v2/tables/${tableId}?withOrder=true`);
  }

  /**
   * Get All Tables for Restaurant
   * Note: restaurantId is filtered by backend via user context
   */
  async getTablesByRestaurant(_restaurantId: string): Promise<Table[]> {
    const response = await apiClient.get<{ tables: Table[] }>('/v2/tables');
    return response.tables;
  }

  /**
   * Get All Tables with Active Orders
   * Note: restaurantId is filtered by backend via user context
   */
  async getTablesWithOrders(_restaurantId: string): Promise<TableWithOrder[]> {
    const response = await apiClient.get<{ tables: TableWithOrder[] }>('/v2/tables?withOrders=true');
    return response.tables;
  }

  /**
   * Update Table
   */
  async updateTable(tableId: string, request: UpdateTableRequest): Promise<Table> {
    return apiClient.put<Table>(`/v2/tables/${tableId}`, request);
  }

  /**
   * Occupy Table
   */
  async occupyTable(tableId: string): Promise<Table> {
    return this.updateTable(tableId, { status: 'occupied' });
  }

  /**
   * Free Table
   */
  async freeTable(tableId: string): Promise<Table> {
    return this.updateTable(tableId, { status: 'free' });
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
    await apiClient.delete(`/v2/tables/${tableId}`);
  }
}

export const tablesDomainService = new TablesDomainService();

