/**
 * Cashier Domain Routes
 */

import { Router, Response } from 'express';
import { AuthRequest } from '../../routes/auth';
import { CashierDomainService } from './service';
import { pool } from '../../shared/db';

const router = Router();
const cashierService = new CashierDomainService(pool);

/**
 * GET /api/v2/cashier/sessions/current
 * Get current open session
 */
router.get('/sessions/current', async (req: AuthRequest, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID required' });

        const session = await cashierService.getCurrentSession(restaurantId);
        return res.json({ session });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/v2/cashier/sessions/open
 * Open a new cash session
 */
router.post('/sessions/open', async (req: AuthRequest, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        const userId = req.user?.id;
        const { openingBalance } = req.body;

        if (!restaurantId || !userId) return res.status(400).json({ error: 'Restaurant and User ID required' });
        if (openingBalance === undefined) return res.status(400).json({ error: 'Opening balance required' });

        const session = await cashierService.openSession({
            restaurantId,
            userId,
            openingBalance: parseFloat(openingBalance)
        });

        return res.status(201).json({ session });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/v2/cashier/sessions/:id/close
 * Close a cash session
 */
router.post('/sessions/:id/close', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { actualBalance } = req.body;

        if (actualBalance === undefined) return res.status(400).json({ error: 'Actual balance required' });

        const session = await cashierService.closeSession({
            sessionId: id,
            actualBalance: parseFloat(actualBalance)
        });

        return res.json({ session });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/v2/cashier/movements
 * Add manual cash movement
 */
router.post('/movements', async (req: AuthRequest, res: Response) => {
    try {
        const { sessionId, type, amount, description } = req.body;

        if (!sessionId || !type || amount === undefined) {
            return res.status(400).json({ error: 'Session ID, type, and amount required' });
        }

        const movement = await cashierService.addMovement({
            sessionId,
            type,
            amount: parseFloat(amount),
            description: description || ''
        });

        return res.status(201).json({ movement });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
