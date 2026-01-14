/**
 * Dynamic Pricing Service
 * AI-powered pricing optimization system
 */

import { apiClient } from './api-client';

export interface PriceRecommendation {
  menuItemId: string;
  menuItemName: string;
  currentPrice: number;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  totalCost: number;
  projectedMargin: number;
  projectedMarginPercentage: number;
  projectedFoodCost: number;
  expectedSalesImpact: number;
  confidenceLevel: number;
  reasoning: string;
  recommendationId: string;
}

export interface PricingScenario {
  name: string;
  testPrice: number;
  description: string;
  projectedVolume: number;
  projectedRevenue: number;
  projectedMargin: number;
  projectedMarginTotal: number;
  projectedFoodCost: number;
  volumeChange: number;
}

export interface PriceElasticity {
  id: string;
  menu_item_id: string;
  elasticity_coefficient: number;
  price_sensitivity: 'elastic' | 'inelastic' | 'unitary';
  base_volume: number;
  base_price: number;
  calculated_at: string;
  updated_at: string;
}

export interface PricingConfig {
  id: string;
  menu_item_id: string;
  category_type?: 'star' | 'anchor' | 'complement';
  min_margin_percentage?: number;
  target_food_cost?: number;
  price_floor?: number;
  price_ceiling?: number;
  psychological_price_points?: number[];
  enable_dynamic_pricing: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceRecommendationHistory {
  id: string;
  menu_item_id: string;
  current_price: number;
  recommended_price: number;
  min_price?: number;
  max_price?: number;
  projected_margin?: number;
  projected_food_cost?: number;
  expected_sales_impact?: number;
  confidence_level?: number;
  model_version?: string;
  reasoning?: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  applied_at?: string;
  created_at: string;
  updated_at: string;
}

class DynamicPricingService {
  /**
   * Get AI-powered price recommendation for a menu item
   */
  async getRecommendation(menuItemId: string): Promise<PriceRecommendation> {
    return apiClient.get<PriceRecommendation>(`/v1/dynamic-pricing/menu-items/${menuItemId}/recommend`);
  }

  /**
   * Apply a price recommendation
   */
  async applyRecommendation(recommendationId: string): Promise<{ ok: boolean; message: string }> {
    return apiClient.post<{ ok: boolean; message: string }>(`/v1/dynamic-pricing/recommendations/${recommendationId}/apply`);
  }

  /**
   * Get pricing scenarios for a menu item
   */
  async getScenarios(menuItemId: string): Promise<PricingScenario[]> {
    const response = await apiClient.get<{ scenarios: PricingScenario[] }>(`/v1/dynamic-pricing/menu-items/${menuItemId}/scenarios`);
    return response.scenarios;
  }

  /**
   * Calculate or get price elasticity for a menu item
   */
  async getElasticity(menuItemId: string): Promise<PriceElasticity> {
    const response = await apiClient.get<{ elasticity: PriceElasticity }>(`/v1/dynamic-pricing/menu-items/${menuItemId}/elasticity`);
    return response.elasticity;
  }

  /**
   * Get all recommendations for a menu item
   */
  async getRecommendations(menuItemId: string): Promise<PriceRecommendationHistory[]> {
    const response = await apiClient.get<{ recommendations: PriceRecommendationHistory[] }>(`/v1/dynamic-pricing/menu-items/${menuItemId}/recommendations`);
    return response.recommendations;
  }

  /**
   * Get pricing configuration for a menu item
   */
  async getPricingConfig(menuItemId: string): Promise<PricingConfig | null> {
    const response = await apiClient.get<{ config: PricingConfig | null }>(`/v1/dynamic-pricing/menu-items/${menuItemId}/pricing-config`);
    return response.config;
  }

  /**
   * Update pricing configuration for a menu item
   */
  async updatePricingConfig(menuItemId: string, config: Partial<PricingConfig>): Promise<PricingConfig> {
    return apiClient.put<PricingConfig>(`/v1/dynamic-pricing/menu-items/${menuItemId}/pricing-config`, config);
  }
}

export const dynamicPricingService = new DynamicPricingService();

