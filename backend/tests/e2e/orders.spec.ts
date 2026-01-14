/**
 * E2E Tests for Orders
 * Run with: npx playwright test tests/e2e/orders.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'waiter@testrestaurant.com');
    await page.fill('input[type="password"]', 'password_waiter');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should create a new order', async ({ page }) => {
    await page.goto('/orders/new');
    
    // Select table
    await page.click('button:has-text("T1")');
    
    // Add item to cart (if menu items are available)
    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
    }
    
    // Create order
    await page.click('button:has-text("Create Order")');
    
    // Should redirect to order detail page
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);
  });

  test('should list orders', async ({ page }) => {
    await page.goto('/orders');
    
    // Should see orders page
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order (if available)
    const firstOrder = page.locator('a, button').filter({ hasText: /ORD-|View/ }).first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();
      
      // Should see order details
      await expect(page.locator('text=/Order|Total|Items/i')).toBeVisible();
    }
  });
});








