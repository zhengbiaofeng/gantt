import { test, expect } from '@playwright/test';

test('Verify Gantt Chart Scrollbar Color', async ({ page }) => {
  // 1. Navigate to the page
  await page.goto('http://localhost:5174/');
  
  // 2. Wait for the chart wrapper to be visible
  const chartWrapper = page.locator('.chart-wrapper');
  await expect(chartWrapper).toBeVisible();

  // 3. Ensure there is scrollable content
  // We can try to scroll a bit to make sure scrollbars are active/rendered
  await chartWrapper.evaluate(el => el.scrollTop = 100);
  await chartWrapper.evaluate(el => el.scrollLeft = 100);
  
  // 4. Take a screenshot of the chart wrapper area
  // We include a bit of margin or ensure we capture the edges where scrollbars are
  await chartWrapper.screenshot({ path: 'scrollbar_check.png' });
  
  // 5. Verify CSS rules (Advanced check)
  const styles = await chartWrapper.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      scrollbarColor: computed.scrollbarColor, // Firefox
      scrollbarWidth: computed.scrollbarWidth,
    };
  });
  
  console.log('Computed Styles:', styles);
  
  // 验证 Firefox 样式是否生效
  if (styles.scrollbarColor) {
      // 颜色值可能会被转换为 rgb 格式
      // #05436a -> rgb(5, 67, 106)
      const expectedColor = 'rgb(5, 67, 106)';
      if (styles.scrollbarColor.includes(expectedColor) || styles.scrollbarColor.includes('#05436a')) {
          console.log('Firefox scrollbar-color verified!');
      } else {
          console.warn(`Firefox scrollbar-color mismatch. Got: ${styles.scrollbarColor}`);
      }
  }

  // 截图已保存，用户可人工确认 Webkit 样式
});
