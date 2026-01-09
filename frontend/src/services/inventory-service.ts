/**
 * Inventory Service
 * Handles inventory items, stock levels, and movements
 */

import { apiClient } from './api-client';

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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
}

export interface StockAlert {
  inventoryItemId: string;
  name: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  status: 'low' | 'critical' | 'out_of_stock';
}

export interface CreateInventoryItemRequest {
  name: string;
  sku?: string;
  category?: string;
  unit: string;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  costPerUnit?: number;
  supplierId?: string;
  location?: string;
  notes?: string;
}

export interface AdjustStockRequest {
  quantity: number;
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'waste' | 'return';
  unitCost?: number;
  notes?: string;
}

class InventoryService {
  async getInventoryItems(filters?: {
    category?: string;
    active?: boolean;
    lowStock?: boolean;
  }): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.active !== undefined) params.append('active', String(filters.active));
    if (filters?.lowStock) params.append('lowStock', 'true');

    const response = await apiClient.get<{ items: InventoryItem[] }>(
      `/inventory?${params.toString()}`
    );
    return response.items;
  }

  async getInventoryItem(id: string): Promise<{ item: InventoryItem; movements: InventoryMovement[] }> {
    return await apiClient.get(`/inventory/${id}`);
  }

  async createInventoryItem(data: CreateInventoryItemRequest): Promise<InventoryItem> {
    const response = await apiClient.post<{ item: InventoryItem }>('/inventory', data);
    return response.item;
  }

  async updateInventoryItem(id: string, data: Partial<CreateInventoryItemRequest>): Promise<InventoryItem> {
    const response = await apiClient.put<{ item: InventoryItem }>(`/inventory/${id}`, data);
    return response.item;
  }

  async adjustStock(id: string, data: AdjustStockRequest): Promise<{ item: InventoryItem; movement: InventoryMovement }> {
    return await apiClient.post(`/inventory/${id}/adjust`, data);
  }

  async getStockAlerts(): Promise<StockAlert[]> {
    const response = await apiClient.get<{ alerts: StockAlert[] }>('/inventory/alerts/stock');
    return response.alerts;
  }

  async getInventoryMovements(
    id: string,
    filters?: {
      type?: InventoryMovement['type'];
      startDate?: string;
      endDate?: string;
    }
  ): Promise<InventoryMovement[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get<{ movements: InventoryMovement[] }>(
      `/inventory/${id}/movements?${params.toString()}`
    );
    return response.movements;
  }
}

export const inventoryService = new InventoryService();


