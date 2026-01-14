/**
 * Products Domain Service (Frontend)
 * Uses new v2 API endpoints
 * SSOT: All product operations use this service
 */

import { apiClient } from '../../services/api-client';

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  basePrice: number;
  active: boolean;
  description?: string;
  imageUrl?: string;
  metadata?: Record<string, any>; // Para almacenar ingredientes, etc.
  createdAt: string;
}

export interface Modifier {
  id: string;
  name: string;
  priceDelta: number;
  active: boolean;
  createdAt: string;
}

export interface ProductWithModifiers extends Product {
  modifiers: Modifier[];
}

export interface CreateProductRequest {
  name: string;
  categoryId: string;
  basePrice: number;
  description?: string;
  imageUrl?: string;
  active?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  categoryId?: string;
  basePrice?: number;
  description?: string;
  imageUrl?: string;
  active?: boolean;
}

export interface CreateModifierRequest {
  name: string;
  priceDelta: number;
  active?: boolean;
}

class ProductsDomainService {
  /**
   * Create Product
   */
  async createProduct(request: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>('/v2/products', request);
  }

  /**
   * Get Product by ID
   */
  async getProduct(productId: string): Promise<Product> {
    return apiClient.get<Product>(`/v2/products/${productId}`);
  }

  /**
   * Get Product with Modifiers
   */
  async getProductWithModifiers(productId: string): Promise<ProductWithModifiers> {
    return apiClient.get<ProductWithModifiers>(`/v2/products/${productId}?withModifiers=true`);
  }

  /**
   * Get All Products by Category
   */
  async getProductsByCategory(categoryId: string, activeOnly: boolean = true): Promise<Product[]> {
    const response = await apiClient.get<{ products: Product[] }>(
      `/v2/products?categoryId=${categoryId}&activeOnly=${activeOnly}`
    );
    return response.products;
  }

  /**
   * Get All Active Products
   */
  async getActiveProducts(): Promise<Product[]> {
    const response = await apiClient.get<{ products: Product[] }>('/v2/products');
    return response.products;
  }

  /**
   * Update Product
   */
  async updateProduct(productId: string, request: UpdateProductRequest): Promise<Product> {
    return apiClient.put<Product>(`/v2/products/${productId}`, request);
  }

  /**
   * Delete Product (soft delete)
   */
  async deleteProduct(productId: string): Promise<void> {
    await apiClient.delete(`/v2/products/${productId}`);
  }

  /**
   * Create Modifier
   */
  async createModifier(request: CreateModifierRequest): Promise<Modifier> {
    return apiClient.post<Modifier>('/v2/products/modifiers', request);
  }

  /**
   * Get All Active Modifiers
   */
  async getActiveModifiers(): Promise<Modifier[]> {
    const response = await apiClient.get<{ modifiers: Modifier[] }>('/v2/products/modifiers');
    return response.modifiers;
  }

  /**
   * Add Modifier to Product
   */
  async addModifierToProduct(productId: string, modifierId: string): Promise<void> {
    await apiClient.post(`/v2/products/${productId}/modifiers/${modifierId}`, {});
  }

  /**
   * Remove Modifier from Product
   */
  async removeModifierFromProduct(productId: string, modifierId: string): Promise<void> {
    await apiClient.delete(`/v2/products/${productId}/modifiers/${modifierId}`);
  }
}

export const productsDomainService = new ProductsDomainService();


