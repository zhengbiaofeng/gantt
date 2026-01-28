import { test, expect } from '@playwright/test';

test('Verify conflict sidebar click interaction', async ({ page }) => {
  // 1. Go to page
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // 2. Switch to Conflict View
  const selectLocator = page.locator('select', { has: page.locator('option[value="conflict"]') });
  await selectLocator.selectOption('conflict');
  await page.waitForTimeout(500);

  // 3. Locate sidebar item for "张参谋"
  const zhangSidebarItem = page.locator('.sidebar-item').filter({ hasText: '张参谋' });
  await expect(zhangSidebarItem).toBeVisible();

  // 4. Click sidebar item
  await zhangSidebarItem.click();
  await page.waitForTimeout(500);

  // 5. Verify right panel opens
  const rightPanel = page.locator('.right-panel');
  await expect(rightPanel).toBeVisible();

  // 6. Verify active class on sidebar item
  await expect(zhangSidebarItem).toHaveClass(/active/);

  // 7. Verify panel content is filtered
  // Should show conflict card for 张参谋
  const conflictCards = page.locator('.conflict-card-new');
  await expect(conflictCards).toHaveCount(1);
  await expect(conflictCards.first().locator('.person-name')).toHaveText('张参谋');

  // 8. Click another person "李参谋"
  const liSidebarItem = page.locator('.sidebar-item').filter({ hasText: '李参谋' });
  await liSidebarItem.click();
  await page.waitForTimeout(500);

  // Verify content updates
  await expect(conflictCards).toHaveCount(1);
  await expect(conflictCards.first().locator('.person-name')).toHaveText('李参谋');
  await expect(liSidebarItem).toHaveClass(/active/);
  await expect(zhangSidebarItem).not.toHaveClass(/active/);

  // 9. Click conflict bar for 张参谋
  // Find a conflict bar (need to ensure it's 张参谋's bar, but finding by text/color might be hard,
  // let's just click the first conflict bar which we know is usually 张参谋 based on mock data order)
  // Actually, wait, if I click the bar, it should switch back to 张参谋
  
  // Find a bar that has conflict class
  const conflictBar = page.locator('.conflict-bar-content.has-conflict').first();
  await conflictBar.click();
  await page.waitForTimeout(500);

  // Verify selection switches back to 张参谋
  await expect(zhangSidebarItem).toHaveClass(/active/);
  await expect(conflictCards.first().locator('.person-name')).toHaveText('张参谋');

});
