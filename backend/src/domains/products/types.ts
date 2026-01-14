/**
 * Products Domain Types
 * SSOT: Product types defined here
 */

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  basePrice: number;
  active: boolean;
  description?: string;
  imageUrl?: string;
  metadata?: Record<string, any>; // Para almacenar ingredientes identificados, etc.
  createdAt: string;
}

export interface Modifier {
  id: string;
  name: string;
  priceDelta: number;
  active: boolean;
  createdAt: string;
}

export interface ProductModifier {
  id: string;
  productId: string;
  modifierId: string;
}

export interface CreateProductRequest {
  name: string;
  categoryId: string;
  basePrice: number;
  description?: string;
  imageUrl?: string;
  active?: boolean;
  metadata?: Record<string, any>; // Para almacenar ingredientes identificados, etc.
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

export interface ProductWithModifiers extends Product {
  modifiers: Modifier[];
}


