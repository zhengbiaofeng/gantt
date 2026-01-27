
import { test, expect } from '@playwright/test';

test('Verify critical icon is an SVG', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  
  // Wait for sidebar items to load
  await page.waitForSelector('.sidebar-item');

  // Locate the critical icon
  const criticalIcon = page.locator('.critical-icon').first();
  
  // Check if it exists
  await expect(criticalIcon).toBeVisible();
  
  // Check if it is an SVG tag
  const tagName = await criticalIcon.evaluate(el => el.tagName.toLowerCase());
  expect(tagName).toBe('svg');
  
  // Check if it has the correct class
  await expect(criticalIcon).toHaveClass(/critical-icon/);
  
  // Check if it has the title
  await expect(criticalIcon).toHaveAttribute('title', '关键节点');
});
