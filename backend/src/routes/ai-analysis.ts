/**
 * AI Analysis Routes
 * Endpoints for AI-powered business insights
 */

import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from './auth';
import aiAnalysisService from '../services/aiAnalysisService';

const router = Router();

/**
 * GET /api/v1/ai-analysis/insights
 * Get comprehensive business insights with AI analysis
 */
router.get('/insights', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const insights = await aiAnalysisService.getBusinessInsights(restaurantId, days);

    return res.json(insights);
  } catch (error: any) {
    console.error('[AI Analysis] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;







