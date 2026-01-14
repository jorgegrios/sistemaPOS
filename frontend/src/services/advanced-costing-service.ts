/**
 * Advanced Costing Service
 * Complete cost calculation system including labor, overhead, packaging, and food cost management
 */

import { apiClient } from './api-client';

export interface CostConfig {
  id: string;
  restaurant_id: string;
  target_food_cost_percentage: number;
  currency: string;
  tax_percentage: number;
  price_rounding_method: 'nearest' | 'up' | 'down' | 'none';
  include_labor_in_cost: boolean;
  include_overhead_in_cost: boolean;
  include_packaging_in_cost: boolean;
  created_at: string;
  updated_at: string;
}

export interface LaborPosition {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  monthly_salary: number;
  hours_per_month: number;
  cost_per_minute: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemLabor {
  id: string;
  menu_item_id: string;
  labor_position_id: string;
  preparation_time_minutes: number;
  position_name?: string;
  cost_per_minute?: number;
  total_labor_cost?: number;
}

export interface OverheadCost {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  monthly_amount: number;
  category?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OverheadAllocationMethod {
  id: string;
  restaurant_id: string;
  method_type: 'fixed_percentage' | 'per_plate' | 'production_hours';
  fixed_percentage?: number;
  per_plate_amount?: number;
  production_hours_per_month?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackagingCost {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  cost_per_unit: number;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemPackaging {
  id: string;
  menu_item_id: string;
  packaging_cost_id: string;
  quantity: number;
  channel: 'dine_in' | 'delivery' | 'takeout' | 'all';
  packaging_name?: string;
  cost_per_unit?: number;
  total_packaging_cost?: number;
}

export interface CompleteCostCalculation {
  menuItemId: string;
  menuItemName: string;
  sellingPrice: number;
  costs: {
    ingredients: number;
    labor: number;
    overhead: number;
    packaging: number;
    total: number;
  };
  foodCostPercentage: number;
  profitMargin: number;
  profitPercentage: number;
  targetFoodCostPercentage: number;
  suggestedPrice: number;
  config: {
    includeLabor: boolean;
    includeOverhead: boolean;
    includePackaging: boolean;
  };
}

export interface MenuItemCostSummary {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  costs: {
    ingredients: number;
    labor: number;
    overhead: number;
    packaging: number;
    total: number;
  };
  foodCostPercentage: number;
  profitMargin: number;
  profitPercentage: number;
  ingredientCount: number;
}

class AdvancedCostingService {
  // ==================== CONFIGURATION ====================

  async getConfig(): Promise<CostConfig> {
    return apiClient.get<CostConfig>('/v1/advanced-costing/config');
  }

  async updateConfig(config: Partial<CostConfig>): Promise<CostConfig> {
    return apiClient.put<CostConfig>('/v1/advanced-costing/config', config);
  }

  // ==================== LABOR COSTS ====================

  async getLaborPositions(): Promise<LaborPosition[]> {
    const response = await apiClient.get<{ positions: LaborPosition[] }>('/v1/advanced-costing/labor-positions');
    return response.positions;
  }

  async createLaborPosition(data: {
    name: string;
    description?: string;
    monthly_salary: number;
    hours_per_month?: number;
  }): Promise<LaborPosition> {
    return apiClient.post<LaborPosition>('/v1/advanced-costing/labor-positions', data);
  }

  async updateLaborPosition(id: string, data: Partial<LaborPosition>): Promise<LaborPosition> {
    return apiClient.put<LaborPosition>(`/v1/advanced-costing/labor-positions/${id}`, data);
  }

  async deleteLaborPosition(id: string): Promise<void> {
    await apiClient.delete(`/v1/advanced-costing/labor-positions/${id}`);
  }

  async getMenuItemLabor(menuItemId: string): Promise<MenuItemLabor[]> {
    const response = await apiClient.get<{ labor: MenuItemLabor[] }>(`/v1/advanced-costing/menu-items/${menuItemId}/labor`);
    return response.labor;
  }

  async addMenuItemLabor(menuItemId: string, data: {
    labor_position_id: string;
    preparation_time_minutes: number;
  }): Promise<MenuItemLabor> {
    return apiClient.post<MenuItemLabor>(`/v1/advanced-costing/menu-items/${menuItemId}/labor`, data);
  }

  async deleteMenuItemLabor(id: string): Promise<void> {
    await apiClient.delete(`/v1/advanced-costing/menu-items/labor/${id}`);
  }

  // ==================== OVERHEAD COSTS ====================

  async getOverheadCosts(): Promise<OverheadCost[]> {
    const response = await apiClient.get<{ costs: OverheadCost[] }>('/v1/advanced-costing/overhead-costs');
    return response.costs;
  }

  async createOverheadCost(data: {
    name: string;
    description?: string;
    monthly_amount: number;
    category?: string;
  }): Promise<OverheadCost> {
    return apiClient.post<OverheadCost>('/v1/advanced-costing/overhead-costs', data);
  }

  async updateOverheadCost(id: string, data: Partial<OverheadCost>): Promise<OverheadCost> {
    return apiClient.put<OverheadCost>(`/v1/advanced-costing/overhead-costs/${id}`, data);
  }

  async deleteOverheadCost(id: string): Promise<void> {
    await apiClient.delete(`/v1/advanced-costing/overhead-costs/${id}`);
  }

  async getOverheadAllocation(): Promise<OverheadAllocationMethod | null> {
    const response = await apiClient.get<{ method: OverheadAllocationMethod | null }>('/v1/advanced-costing/overhead-allocation');
    return response.method;
  }

  async setOverheadAllocation(data: {
    method_type: 'fixed_percentage' | 'per_plate' | 'production_hours';
    fixed_percentage?: number;
    per_plate_amount?: number;
    production_hours_per_month?: number;
  }): Promise<OverheadAllocationMethod> {
    return apiClient.post<OverheadAllocationMethod>('/v1/advanced-costing/overhead-allocation', data);
  }

  // ==================== PACKAGING COSTS ====================

  async getPackagingCosts(): Promise<PackagingCost[]> {
    const response = await apiClient.get<{ costs: PackagingCost[] }>('/v1/advanced-costing/packaging-costs');
    return response.costs;
  }

  async createPackagingCost(data: {
    name: string;
    description?: string;
    cost_per_unit: number;
    unit?: string;
  }): Promise<PackagingCost> {
    return apiClient.post<PackagingCost>('/v1/advanced-costing/packaging-costs', data);
  }

  async updatePackagingCost(id: string, data: Partial<PackagingCost>): Promise<PackagingCost> {
    return apiClient.put<PackagingCost>(`/v1/advanced-costing/packaging-costs/${id}`, data);
  }

  async deletePackagingCost(id: string): Promise<void> {
    await apiClient.delete(`/v1/advanced-costing/packaging-costs/${id}`);
  }

  async getMenuItemPackaging(menuItemId: string): Promise<MenuItemPackaging[]> {
    const response = await apiClient.get<{ packaging: MenuItemPackaging[] }>(`/v1/advanced-costing/menu-items/${menuItemId}/packaging`);
    return response.packaging;
  }

  async addMenuItemPackaging(menuItemId: string, data: {
    packaging_cost_id: string;
    quantity?: number;
    channel?: 'dine_in' | 'delivery' | 'takeout' | 'all';
  }): Promise<MenuItemPackaging> {
    return apiClient.post<MenuItemPackaging>(`/v1/advanced-costing/menu-items/${menuItemId}/packaging`, data);
  }

  async deleteMenuItemPackaging(id: string): Promise<void> {
    await apiClient.delete(`/v1/advanced-costing/menu-items/packaging/${id}`);
  }

  // ==================== COMPLETE COST CALCULATION ====================

  async calculateCompleteCost(menuItemId: string): Promise<CompleteCostCalculation> {
    return apiClient.get<CompleteCostCalculation>(`/v1/advanced-costing/menu-items/${menuItemId}/calculate-complete`);
  }

  async getAllMenuItemCosts(): Promise<MenuItemCostSummary[]> {
    const response = await apiClient.get<{ items: MenuItemCostSummary[] }>('/v1/advanced-costing/menu-items');
    return response.items;
  }
}

export const advancedCostingService = new AdvancedCostingService();

