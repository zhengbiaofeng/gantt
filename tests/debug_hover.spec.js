
import { test, expect } from '@playwright/test';

test('Debug hover overflow detection with static data', async ({ page }) => {
  // Capture console logs from the browser
  page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));

  await page.goto('http://localhost:5174');

  // Wait for load
  await page.waitForSelector('.gantt-bar-content');

  // Switch to Conflict view to test "Existing Task" which should fit
  await page.selectOption('.view-switcher select', 'conflict');
  await page.waitForTimeout(500);

  // Find "方案新增：紧急会议"
  // Duration 4 hours (10:00 - 14:00). Width ~192px.
  // Text + Icon should fit.
  const targetTask = page.locator('.gantt-bar-content', { hasText: '方案新增：紧急会议' }).first();
  await expect(targetTask).toBeVisible();

  // Get dimensions before hover
  const box = await targetTask.boundingBox();
  console.log('Task Box:', box);

  // Hover
  await targetTask.hover();
  await page.waitForTimeout(500);

  // Check if class was added
  const hasClass = await targetTask.evaluate(el => el.classList.contains('is-overflowing'));
  console.log('Has is-overflowing class:', hasClass);

  // If hasClass is true, we want to know WHY.
  // The browser logs should show "checkOverflow scrollWidth clientWidth"
});
