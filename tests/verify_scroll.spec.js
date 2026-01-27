import { test, expect } from '@playwright/test';

test('Verify auto-scroll to task on click', async ({ page }) => {
  page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

  // Set viewport size to ensure scrolling is needed
  await page.setViewportSize({ width: 800, height: 600 });
  
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000); // Wait for data load

  // Locate the chart wrapper
  const chartWrapper = page.locator('.chart-wrapper');
  
  // Get initial scroll position
  const initialScrollLeft = await chartWrapper.evaluate(el => el.scrollLeft);
  console.log('Initial ScrollLeft:', initialScrollLeft);

  // Find the last task in the sidebar
  const lastTask = page.locator('.sidebar-item.is-task').last();
  const taskName = await lastTask.innerText();
  console.log(`Clicking last task: ${taskName}`);

  // Click the task
  await lastTask.click();
  
  // Wait for smooth scroll (give it a bit of time)
  await page.waitForTimeout(2000);

  // Get new scroll position
  const newScrollLeft = await chartWrapper.evaluate(el => el.scrollLeft);
  console.log('New ScrollLeft:', newScrollLeft);
  
  // Also check if scrollWidth > clientWidth
  const dimensions = await chartWrapper.evaluate(el => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth
  }));
  console.log('Dimensions:', dimensions);

  expect(newScrollLeft).toBeGreaterThan(initialScrollLeft);
});
