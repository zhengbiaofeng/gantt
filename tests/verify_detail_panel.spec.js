
import { test, expect } from '@playwright/test';

test('Detail panel interaction logic', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  
  // Wait for data to load
  await page.waitForTimeout(1000);

  // 1. Verify default state: Panel should be hidden (collapsed)
  const rightPanel = page.locator('.right-panel');
  await expect(rightPanel).not.toBeVisible();

  // 2. Click sidebar task name to expand
  // Find a task item (not a phase item)
  const taskItem = page.locator('.sidebar-item.is-task').first();
  await taskItem.click();
  
  // Verify panel is now visible
  await expect(rightPanel).toBeVisible();

  // 3. Click inside the panel -> should stay visible
  await rightPanel.click();
  await expect(rightPanel).toBeVisible();

  // 4. Click blank area (e.g., the main container or body) -> should collapse
  // We click somewhere safe, like the top header or just body (0,0)
  await page.mouse.click(10, 10);
  
  // Verify panel is hidden again
  await expect(rightPanel).not.toBeVisible();

  // 5. Verify clicking sidebar item again keeps it open (or re-opens it)
  await taskItem.click();
  await expect(rightPanel).toBeVisible();

  // 7. Verify clicking task bar also opens panel
  const taskBar = page.locator('.gantt-bar-content').first();
  await taskBar.click();
  await expect(rightPanel).toBeVisible();
});
