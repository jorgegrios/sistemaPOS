/**
 * Menu Service
 * Handles menu and menu item operations
 */

import { apiClient } from './api-client';

export interface MenuItem {
  id: string;
  menuId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  displayOrder: number;
  metadata?: Record<string, any>;
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
}

export interface Menu {
  id: string;
  restaurantId: string;
  name: string;
  categories: MenuCategory[];
  createdAt: string;
}

export interface MenuDetail extends Menu {
  items?: MenuItem[];
}

export interface CreateMenuItemRequest {
  menuId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  available?: boolean;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  available?: boolean;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

class MenuService {
  /**
   * Get all menus for a restaurant
   */
  async getMenus(restaurantId: string): Promise<Menu[]> {
    return apiClient.get<Menu[]>(`/menus/${restaurantId}`, { skipAuth: true });
  }

  /**
   * Get a specific menu with all items and categories
   */
  async getMenuDetail(restaurantId: string, menuId: string): Promise<MenuDetail> {
    return apiClient.get<MenuDetail>(
      `/menus/${restaurantId}/${menuId}`,
      { skipAuth: true }
    );
  }

  /**
   * Create a new menu item
   */
  async createMenuItem(data: CreateMenuItemRequest): Promise<MenuItem> {
    return apiClient.post<MenuItem>('/menus', data);
  }

  /**
   * Update a menu item
   */
  async updateMenuItem(id: string, data: UpdateMenuItemRequest): Promise<MenuItem> {
    return apiClient.put<MenuItem>(`/menus/${id}`, data);
  }

  /**
   * Delete a menu item
   */
  async deleteMenuItem(id: string): Promise<void> {
    await apiClient.delete(`/menus/${id}`);
  }

  /**
   * Get available menu items (for ordering)
   */
  async getAvailableItems(restaurantId: string, menuId: string): Promise<MenuItem[]> {
    const menu = await this.getMenuDetail(restaurantId, menuId);
    return (menu.items || []).filter(item => item.available);
  }
}

export const menuService = new MenuService();
