/**
 * Menu Costs Service
 * Handles menu item cost calculations based on ingredients
 */

import { apiClient } from './api-client';

export interface MenuItemIngredient {
  id: string;
  menuItemId: string;
  inventoryItemId: string;
  quantity: number;
  unit: string;
  ingredientName: string;
  ingredientUnit: string;
  costPerUnit: number;
}

export interface IngredientCost {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  ingredientUnit: string;
  costPerUnit: number;
  cost: number;
}

export interface MenuItemCost {
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  totalCost: number;
  profitMargin: number;
  profitPercentage: number;
  ingredients: IngredientCost[];
}

export interface MenuItemCostSummary {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  cost: number;
  profitMargin: number;
  profitPercentage: number;
  ingredientCount: number;
}

class MenuCostsService {
  /**
   * Get all ingredients for a menu item
   */
  async getMenuItemIngredients(menuItemId: string): Promise<MenuItemIngredient[]> {
    const response = await apiClient.get<{ ingredients: MenuItemIngredient[] }>(
      `/menu-costs/items/${menuItemId}/ingredients`
    );
    return response.ingredients;
  }

  /**
   * Add ingredient to menu item
   */
  async addIngredient(
    menuItemId: string,
    data: {
      inventoryItemId: string;
      quantity: number;
      unit: string;
    }
  ): Promise<MenuItemIngredient> {
    return apiClient.post<MenuItemIngredient>(
      `/menu-costs/items/${menuItemId}/ingredients`,
      data
    );
  }

  /**
   * Update ingredient quantity
   */
  async updateIngredient(
    id: string,
    data: {
      quantity: number;
      unit: string;
    }
  ): Promise<void> {
    await apiClient.put(`/menu-costs/ingredients/${id}`, data);
  }

  /**
   * Remove ingredient from menu item
   */
  async removeIngredient(id: string): Promise<void> {
    await apiClient.delete(`/menu-costs/ingredients/${id}`);
  }

  /**
   * Calculate total cost of a menu item
   */
  async calculateMenuItemCost(menuItemId: string): Promise<MenuItemCost> {
    return apiClient.get<MenuItemCost>(`/menu-costs/items/${menuItemId}/calculate`);
  }

  /**
   * Get all menu items with their calculated costs
   */
  async getAllMenuItemCosts(): Promise<MenuItemCostSummary[]> {
    const response = await apiClient.get<{ items: MenuItemCostSummary[] }>(
      '/menu-costs/items'
    );
    return response.items;
  }
}

export const menuCostsService = new MenuCostsService();

