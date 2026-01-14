/**
 * Products Domain Routes
 * RESTful API for product operations
 */

import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../../routes/auth';
import { ProductsService } from './service';
import { pool } from '../../shared/db';

const router = Router();
const productsService = new ProductsService(pool);

/**
 * POST /api/v1/products
 * Create new product
 */
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, categoryId, basePrice, description, imageUrl, active } = req.body;

    if (!name || !categoryId || basePrice === undefined) {
      return res.status(400).json({ error: 'name, categoryId, and basePrice are required' });
    }

    const product = await productsService.createProduct({
      name,
      categoryId,
      basePrice,
      description,
      imageUrl,
      active,
    });

    return res.status(201).json(product);
  } catch (error: any) {
    console.error('[Products] Error creating product:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/products
 * Get all active products
 */
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.query.categoryId as string;
    const activeOnly = req.query.activeOnly !== 'false';

    if (categoryId) {
      const products = await productsService.getProductsByCategory(categoryId, activeOnly);
      return res.json({ products });
    } else {
      const products = await productsService.getActiveProducts();
      return res.json({ products });
    }
  } catch (error: any) {
    console.error('[Products] Error getting products:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/products/:id
 * Get product by ID
 */
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const withModifiers = req.query.withModifiers === 'true';

    if (withModifiers) {
      const product = await productsService.getProductWithModifiers(id);
      return res.json(product);
    } else {
      const product = await productsService.getProduct(id);
      return res.json(product);
    }
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[Products] Error getting product:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/products/:id
 * Update product
 */
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, categoryId, basePrice, description, imageUrl, active } = req.body;

    const product = await productsService.updateProduct(id, {
      name,
      categoryId,
      basePrice,
      description,
      imageUrl,
      active,
    });

    return res.json(product);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[Products] Error updating product:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/products/:id
 * Delete product (soft delete)
 */
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await productsService.deleteProduct(id);
    return res.status(204).send();
  } catch (error: any) {
    console.error('[Products] Error deleting product:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/products/:id/modifiers/:modifierId
 * Add modifier to product
 */
router.post('/:id/modifiers/:modifierId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, modifierId } = req.params;
    await productsService.addModifierToProduct(id, modifierId);
    return res.status(204).send();
  } catch (error: any) {
    console.error('[Products] Error adding modifier:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/products/:id/modifiers/:modifierId
 * Remove modifier from product
 */
router.delete('/:id/modifiers/:modifierId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, modifierId } = req.params;
    await productsService.removeModifierFromProduct(id, modifierId);
    return res.status(204).send();
  } catch (error: any) {
    console.error('[Products] Error removing modifier:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;





