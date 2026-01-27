
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('Test_2026-01-24', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:5173/');

    // Hover over element
    await page.hover('#T-001');

    // Hover over element
    await page.hover('#T-002');

    // Navigate to URL
    await page.goto('http://localhost:5173/');

    // Hover over element
    await page.hover('#T-002');

    // Hover over element
    await page.hover('#T-003');

    // Take screenshot
    await page.screenshot({ path: 'hover_effect_snapshot.png' });
});