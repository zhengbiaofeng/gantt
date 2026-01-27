
import { test, expect } from '@playwright/test';

test('Verify right panel width is increased', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  
  // Wait for the page to load
  await page.waitForTimeout(1000);
  
  // Make sure the right panel is visible (it might be collapsed by default based on previous logic)
  // Check if it is collapsed
  const isCollapsed = await page.locator('.right-panel').isHidden();
  
  if (isCollapsed) {
    // If collapsed, try to open it by clicking a task or the expand button
    // Let's click the first task bar in the gantt chart
    const firstBar = page.locator('.gantt-bar-content').first();
    if (await firstBar.isVisible()) {
        await firstBar.click();
    } else {
        // Or click the expand trigger
        const expandTrigger = page.locator('.expand-panel-trigger');
        if (await expandTrigger.isVisible()) {
            await expandTrigger.click();
        }
    }
  }
  
  await page.waitForTimeout(500);
  
  // Get the right panel element
  const rightPanel = page.locator('.right-panel');
  await expect(rightPanel).toBeVisible();
  
  // Check the computed width
  const box = await rightPanel.boundingBox();
  expect(box.width).toBe(480);
});
