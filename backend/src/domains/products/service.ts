/**
 * Products Domain Service
 * Manages products and modifiers
 * SSOT: All product operations go through this service
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Product, Modifier, CreateProductRequest, UpdateProductRequest, CreateModifierRequest, ProductWithModifiers } from './types';

export class ProductsService {
  constructor(private pool: Pool) {}

  /**
   * Create Product
   */
  async createProduct(request: CreateProductRequest): Promise<Product> {
    const productId = uuidv4();

    const result = await this.pool.query(
      `INSERT INTO menu_items (id, category_id, name, description, price, base_price, image_url, available, active, metadata)
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $7, $8)
       RETURNING id, name, category_id, base_price, available as active, description, image_url, metadata, created_at`,
      [
        productId,
        request.categoryId,
        request.name,
        request.description || null,
        request.basePrice,
        request.imageUrl || null,
        request.active !== false,
        request.metadata ? JSON.stringify(request.metadata) : null,
      ]
    );

    return this.mapRowToProduct(result.rows[0]);
  }

  /**
   * Get Product by ID
   */
  async getProduct(productId: string): Promise<Product> {
    const result = await this.pool.query(
      `SELECT id, name, category_id, base_price, price, available as active, description, image_url, metadata, created_at
       FROM menu_items WHERE id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Product ${productId} not found`);
    }

    return this.mapRowToProduct(result.rows[0]);
  }

  /**
   * Get Product with Modifiers
   */
  async getProductWithModifiers(productId: string): Promise<ProductWithModifiers> {
    const product = await this.getProduct(productId);

    // Get modifiers for product
    const modifiersResult = await this.pool.query(
      `SELECT m.id, m.name, m.price_delta, m.active, m.created_at
       FROM modifiers m
       INNER JOIN product_modifiers pm ON m.id = pm.modifier_id
       WHERE pm.product_id = $1 AND m.active = true
       ORDER BY m.name ASC`,
      [productId]
    );

    const modifiers = modifiersResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      priceDelta: parseFloat(row.price_delta),
      active: row.active,
      createdAt: row.created_at.toISOString(),
    }));

    return {
      ...product,
      modifiers,
    };
  }

  /**
   * Get All Products by Category
   */
  async getProductsByCategory(categoryId: string, activeOnly: boolean = true): Promise<Product[]> {
    let query = `
      SELECT id, name, category_id, base_price, price, available as active, description, image_url, metadata, created_at
      FROM menu_items
      WHERE category_id = $1
    `;

    const params: any[] = [categoryId];

    if (activeOnly) {
      query += ` AND available = true`;
    }

    query += ` ORDER BY name ASC`;

    const result = await this.pool.query(query, params);

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Get All Active Products
   */
  async getActiveProducts(): Promise<Product[]> {
    const result = await this.pool.query(
      `SELECT id, name, category_id, base_price, price, available as active, description, image_url, metadata, created_at
       FROM menu_items
       WHERE available = true
       ORDER BY name ASC`
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Update Product
   */
  async updateProduct(productId: string, request: UpdateProductRequest): Promise<Product> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (request.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(request.name);
      paramCount++;
    }

    if (request.categoryId !== undefined) {
      updates.push(`category_id = $${paramCount}`);
      params.push(request.categoryId);
      paramCount++;
    }

    if (request.basePrice !== undefined) {
      updates.push(`base_price = $${paramCount}`);
      updates.push(`price = $${paramCount}`); // Keep price in sync
      params.push(request.basePrice);
      paramCount++;
    }

    if (request.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(request.description);
      paramCount++;
    }

    if (request.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCount}`);
      params.push(request.imageUrl);
      paramCount++;
    }

    if (request.active !== undefined) {
      updates.push(`available = $${paramCount}`);
      params.push(request.active);
      paramCount++;
    }

    if (updates.length === 0) {
      return this.getProduct(productId);
    }

    params.push(productId);

    await this.pool.query(
      `UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    return this.getProduct(productId);
  }

  /**
   * Delete Product (soft delete - set active = false)
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.updateProduct(productId, { active: false });
  }

  /**
   * Create Modifier
   */
  async createModifier(request: CreateModifierRequest): Promise<Modifier> {
    const modifierId = uuidv4();

    const result = await this.pool.query(
      `INSERT INTO modifiers (id, name, price_delta, active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, price_delta, active, created_at`,
      [modifierId, request.name, request.priceDelta, request.active !== false]
    );

    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      priceDelta: parseFloat(result.rows[0].price_delta),
      active: result.rows[0].active,
      createdAt: result.rows[0].created_at.toISOString(),
    };
  }

  /**
   * Get Modifier by ID
   */
  async getModifier(modifierId: string): Promise<Modifier> {
    const result = await this.pool.query(
      `SELECT id, name, price_delta, active, created_at
       FROM modifiers WHERE id = $1`,
      [modifierId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Modifier ${modifierId} not found`);
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      priceDelta: parseFloat(row.price_delta),
      active: row.active,
      createdAt: row.created_at.toISOString(),
    };
  }

  /**
   * Get All Active Modifiers
   */
  async getActiveModifiers(): Promise<Modifier[]> {
    const result = await this.pool.query(
      `SELECT id, name, price_delta, active, created_at
       FROM modifiers
       WHERE active = true
       ORDER BY name ASC`
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      priceDelta: parseFloat(row.price_delta),
      active: row.active,
      createdAt: row.created_at.toISOString(),
    }));
  }

  /**
   * Add Modifier to Product
   */
  async addModifierToProduct(productId: string, modifierId: string): Promise<void> {
    // Verify product and modifier exist
    await this.getProduct(productId);
    await this.getModifier(modifierId);

    const id = uuidv4();

    await this.pool.query(
      `INSERT INTO product_modifiers (id, product_id, modifier_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [id, productId, modifierId]
    );
  }

  /**
   * Remove Modifier from Product
   */
  async removeModifierFromProduct(productId: string, modifierId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM product_modifiers
       WHERE product_id = $1 AND modifier_id = $2`,
      [productId, modifierId]
    );
  }

  /**
   * Map database row to Product
   */
  private mapRowToProduct(row: any): Product {
    // Ensure name is always a string (never null or undefined)
    const productName = row.name && row.name.trim() ? row.name.trim() : `Producto ${row.id.substring(0, 8)}`;
    
    // Parse metadata if it exists
    let metadata: Record<string, any> | undefined = undefined;
    if (row.metadata) {
      try {
        metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      } catch (e) {
        console.warn(`[ProductsService] Error parsing metadata for product ${row.id}:`, e);
        metadata = {};
      }
    }
    
    return {
      id: row.id,
      name: productName,
      categoryId: row.category_id,
      basePrice: parseFloat(row.base_price || row.price || '0'), // Fallback to price if base_price is null
      active: row.active !== false, // Default to true if not explicitly false
      description: row.description || undefined,
      imageUrl: row.image_url || undefined,
      metadata: metadata,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    };
  }
}


