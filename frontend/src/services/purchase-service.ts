/**
 * Purchase Service
 * Handles suppliers and purchase orders
 */

import { apiClient } from './api-client';

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
  createdAt: string;
  updatedAt: string;
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
  expectedDeliveryDate?: string;
  receivedAt?: string;
  createdBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  items: Array<{
    inventoryItemId?: string;
    name: string;
    quantity: number;
    unit: string;
    unitCost: number;
    notes?: string;
  }>;
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface ReceivePurchaseOrderRequest {
  receivedItems: Array<{
    itemId: string;
    receivedQuantity: number;
  }>;
}

class PurchaseService {
  // Suppliers
  async getSuppliers(activeOnly: boolean = false): Promise<Supplier[]> {
    const params = activeOnly ? '?activeOnly=true' : '';
    const response = await apiClient.get<{ suppliers: Supplier[] }>(`/purchases/suppliers${params}`);
    return response.suppliers;
  }

  async getSupplier(id: string): Promise<Supplier> {
    const response = await apiClient.get<{ supplier: Supplier }>(`/purchases/suppliers/${id}`);
    return response.supplier;
  }

  async createSupplier(data: CreateSupplierRequest): Promise<Supplier> {
    const response = await apiClient.post<{ supplier: Supplier }>('/purchases/suppliers', data);
    return response.supplier;
  }

  async updateSupplier(id: string, data: Partial<CreateSupplierRequest>): Promise<Supplier> {
    const response = await apiClient.put<{ supplier: Supplier }>(`/purchases/suppliers/${id}`, data);
    return response.supplier;
  }

  // Purchase Orders
  async getPurchaseOrders(filters?: {
    status?: PurchaseOrder['status'];
    supplierId?: string;
  }): Promise<PurchaseOrder[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplierId) params.append('supplierId', filters.supplierId);

    const query = params.toString();
    const response = await apiClient.get<{ orders: PurchaseOrder[] }>(
      `/purchases/orders${query ? `?${query}` : ''}`
    );
    return response.orders;
  }

  async getPurchaseOrder(id: string): Promise<{ order: PurchaseOrder; items: PurchaseOrderItem[] }> {
    return await apiClient.get(`/purchases/orders/${id}`);
  }

  async createPurchaseOrder(data: CreatePurchaseOrderRequest): Promise<{ order: PurchaseOrder; items: PurchaseOrderItem[] }> {
    return await apiClient.post('/purchases/orders', data);
  }

  async updatePurchaseOrderStatus(id: string, status: PurchaseOrder['status']): Promise<PurchaseOrder> {
    const response = await apiClient.put<{ order: PurchaseOrder }>(`/purchases/orders/${id}/status`, { status });
    return response.order;
  }

  async receivePurchaseOrder(id: string, data: ReceivePurchaseOrderRequest): Promise<{ order: PurchaseOrder; items: PurchaseOrderItem[] }> {
    return await apiClient.post(`/purchases/orders/${id}/receive`, data);
  }
}

export const purchaseService = new PurchaseService();


