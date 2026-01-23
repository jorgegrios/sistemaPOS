/**
 * Products Domain Service
 * Manages products and modifiers
 * SSOT: All product operations go through this service
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Product, Modifier, CreateProductRequest, UpdateProductRequest, CreateModifierRequest, ProductWithModifiers } from './types';

export class ProductsService {
  constructor(private pool: Pool) { }

  /**
   * Create Product
   */
  async createProduct(request: CreateProductRequest, companyId: string): Promise<Product> {
    const productId = uuidv4();

    const result = await this.pool.query(
      `INSERT INTO menu_items (id, company_id, category_id, name, description, price, base_price, image_url, available, active, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $8, $9)
       RETURNING id, name, category_id, base_price, available as active, description, image_url, metadata, created_at`,
      [
        productId,
        companyId,
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
  async getProduct(productId: string, companyId: string): Promise<Product> {
    const result = await this.pool.query(
      `SELECT id, name, category_id, base_price, price, available as active, description, image_url, metadata, created_at
       FROM menu_items WHERE id = $1 AND company_id = $2`,
      [productId, companyId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Product ${productId} not found or unauthorized`);
    }

    return this.mapRowToProduct(result.rows[0]);
  }

  /**
   * Get Product with Modifiers
   */
  async getProductWithModifiers(productId: string, companyId: string): Promise<ProductWithModifiers> {
    const product = await this.getProduct(productId, companyId);

    // Get modifiers for product
    const modifiersResult = await this.pool.query(
      `SELECT m.id, m.name, m.price_delta, m.active, m.created_at
       FROM modifiers m
       INNER JOIN product_modifiers pm ON m.id = pm.modifier_id
       WHERE pm.product_id = $1 AND m.active = true AND m.company_id = $2
       ORDER BY m.name ASC`,
      [productId, companyId]
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
  async getProductsByCategory(categoryId: string, companyId: string, activeOnly: boolean = true): Promise<Product[]> {
    let query = `
      SELECT id, name, category_id, base_price, price, available as active, description, image_url, metadata, created_at
      FROM menu_items
      WHERE category_id = $1 AND company_id = $2
    `;

    const params: any[] = [categoryId, companyId];

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
  async getActiveProducts(companyId: string): Promise<Product[]> {
    const result = await this.pool.query(
      `SELECT id, name, category_id, base_price, price, available as active, description, image_url, metadata, created_at
       FROM menu_items
       WHERE available = true AND company_id = $1
       ORDER BY name ASC`,
      [companyId]
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  /**
   * Update Product
   */
  async updateProduct(productId: string, companyId: string, request: UpdateProductRequest): Promise<Product> {
    // Verify ownership first
    await this.getProduct(productId, companyId);

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
      return this.getProduct(productId, companyId);
    }

    params.push(productId);
    params.push(companyId);

    const finalParamIndex = paramCount;
    const companyIdParamIndex = paramCount + 1;

    await this.pool.query(
      `UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${finalParamIndex} AND company_id = $${companyIdParamIndex}`,
      params
    );

    return this.getProduct(productId, companyId);
  }

  /**
   * Delete Product (soft delete - set active = false)
   */
  async deleteProduct(productId: string, companyId: string): Promise<void> {
    await this.updateProduct(productId, companyId, { active: false });
  }

  /**
   * Create Modifier
   */
  async createModifier(request: CreateModifierRequest, companyId: string): Promise<Modifier> {
    const modifierId = uuidv4();

    const result = await this.pool.query(
      `INSERT INTO modifiers (id, company_id, name, price_delta, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, price_delta, active, created_at`,
      [modifierId, companyId, request.name, request.priceDelta, request.active !== false]
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
  async getModifier(modifierId: string, companyId: string): Promise<Modifier> {
    const result = await this.pool.query(
      `SELECT id, name, price_delta, active, created_at
       FROM modifiers WHERE id = $1 AND company_id = $2`,
      [modifierId, companyId]
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
  async getActiveModifiers(companyId: string): Promise<Modifier[]> {
    const result = await this.pool.query(
      `SELECT id, name, price_delta, active, created_at
       FROM modifiers
       WHERE active = true AND company_id = $1
       ORDER BY name ASC`,
      [companyId]
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
  async addModifierToProduct(productId: string, modifierId: string, companyId: string): Promise<void> {
    // Verify product and modifier exist and belong to company
    await this.getProduct(productId, companyId);
    await this.getModifier(modifierId, companyId);

    const id = uuidv4();

    await this.pool.query(
      `INSERT INTO product_modifiers (id, product_id, modifier_id, company_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [id, productId, modifierId, companyId]
    );
  }

  /**
   * Remove Modifier from Product
   */
  async removeModifierFromProduct(productId: string, modifierId: string, companyId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM product_modifiers
       WHERE product_id = $1 AND modifier_id = $2 AND company_id = $3`,
      [productId, modifierId, companyId]
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


