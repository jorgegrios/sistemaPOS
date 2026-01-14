/**
 * Purchases Routes
 * Manage suppliers and purchase orders
 */

import { Router, Request, Response } from 'express';
import purchaseService from '../services/purchaseService';
import { verifyToken, AuthRequest } from './auth';

const router = Router();

/**
 * SUPPLIERS
 */

/**
 * GET /api/v1/purchases/suppliers
 * List all suppliers
 */
router.get('/suppliers', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const activeOnly = req.query.activeOnly === 'true';
    const suppliers = await purchaseService.getSuppliers(restaurantId, activeOnly);

    return res.json({ suppliers });
  } catch (error: any) {
    console.error('[Purchases] Error listing suppliers:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/purchases/suppliers/:id
 * Get supplier details
 */
router.get('/suppliers/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await purchaseService.getSupplier(id);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    return res.json({ supplier });
  } catch (error: any) {
    console.error('[Purchases] Error getting supplier:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/purchases/suppliers
 * Create supplier
 */
router.post('/suppliers', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const {
      name, contactName, email, phone, address, taxId, paymentTerms, notes
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const supplier = await purchaseService.createSupplier({
      restaurantId,
      name,
      contactName,
      email,
      phone,
      address,
      taxId,
      paymentTerms,
      active: true,
      notes
    });

    return res.status(201).json({ supplier });
  } catch (error: any) {
    console.error('[Purchases] Error creating supplier:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/purchases/suppliers/:id
 * Update supplier
 */
router.put('/suppliers/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const supplier = await purchaseService.updateSupplier(id, updateData);

    return res.json({ supplier });
  } catch (error: any) {
    console.error('[Purchases] Error updating supplier:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PURCHASE ORDERS
 */

/**
 * GET /api/v1/purchases/orders
 * List purchase orders
 */
router.get('/orders', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const { status, supplierId } = req.query;

    const orders = await purchaseService.getPurchaseOrders(restaurantId, {
      status: status as any,
      supplierId: supplierId as string
    });

    return res.json({ orders });
  } catch (error: any) {
    console.error('[Purchases] Error listing orders:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/purchases/orders/:id
 * Get purchase order details
 */
router.get('/orders/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await purchaseService.getPurchaseOrder(id);

    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const items = await purchaseService.getPurchaseOrderItems(id);

    return res.json({ order, items });
  } catch (error: any) {
    console.error('[Purchases] Error getting order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/purchases/orders
 * Create purchase order
 */
router.post('/orders', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const { supplierId, items, expectedDeliveryDate, notes } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Supplier ID and items are required' });
    }

    const order = await purchaseService.createPurchaseOrder({
      restaurantId,
      supplierId,
      items,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      notes,
      createdBy: req.user?.id
    });

    const orderItems = await purchaseService.getPurchaseOrderItems(order.id);

    return res.status(201).json({ order, items: orderItems });
  } catch (error: any) {
    console.error('[Purchases] Error creating order:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/purchases/orders/:id/status
 * Update purchase order status
 */
router.put('/orders/:id/status', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['draft', 'sent', 'confirmed', 'received', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await purchaseService.updatePurchaseOrderStatus(id, status);

    return res.json({ order });
  } catch (error: any) {
    console.error('[Purchases] Error updating order status:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/purchases/orders/:id/receive
 * Receive purchase order (update inventory)
 */
router.post('/orders/:id/receive', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { receivedItems } = req.body;

    if (!receivedItems || !Array.isArray(receivedItems)) {
      return res.status(400).json({ error: 'Received items array is required' });
    }

    const order = await purchaseService.receivePurchaseOrder(
      id,
      receivedItems,
      req.user?.id
    );

    const items = await purchaseService.getPurchaseOrderItems(id);

    return res.json({ order, items });
  } catch (error: any) {
    console.error('[Purchases] Error receiving order:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;







