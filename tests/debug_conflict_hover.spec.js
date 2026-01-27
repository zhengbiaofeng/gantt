import { test, expect } from '@playwright/test';

test('Debug hover overflow detection in Conflict View', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  
  // 1. Switch to Conflict View
  await page.selectOption('.view-switcher select', 'conflict');
  
  // Wait for animation/render
  await page.waitForTimeout(1000);

  // 2. Find the specific task bar "方案新增：紧急会议"
  // Note: The text might be inside a span inside the div
  const taskBar = page.locator('.gantt-bar-content', { hasText: '方案新增：紧急会议' }).first();
  
  // Check initial state
  const box = await taskBar.boundingBox();
  console.log('Initial Box:', box);
  
  // Get initial width
  const initialWidth = box.width;
  
  // Check scrollWidth vs clientWidth
  const dimensions = await taskBar.evaluate(el => {
    return {
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      offsetWidth: el.offsetWidth,
      styleWidth: el.style.width,
      classList: Array.from(el.classList)
    };
  });
  console.log('Dimensions before hover:', dimensions);

  // 3. Hover
  await taskBar.hover();
  await page.waitForTimeout(500); // Wait for potential reaction

  // 4. Check status after hover
  const isOverflowing = await taskBar.evaluate(el => el.classList.contains('is-overflowing'));
  console.log('Has is-overflowing class:', isOverflowing);

  const boxAfter = await taskBar.boundingBox();
  console.log('Box after hover:', boxAfter);

  // Check if width changed significantly
  if (Math.abs(boxAfter.width - initialWidth) > 2) {
      console.log(`Width changed! ${initialWidth} -> ${boxAfter.width}`);
  } else {
      console.log('Width stayed same.');
  }
  
  // If class is added but it shouldn't be (width fits), that's a bug.
  // 240px width vs ~150px content.
  if (isOverflowing && dimensions.scrollWidth <= dimensions.clientWidth + 2) {
      console.log('BUG DETECTED: Overflow class added despite content fitting!');
  }

});
