import { test, expect } from '@playwright/test';

test('Verify group selection details (Unit perspective)', async ({ page }) => {
  // Go to page
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);

  // Switch to Unit perspective
  const perspectiveSelect = page.locator('.perspective-switcher select');
  await perspectiveSelect.selectOption('unit');
  await page.waitForTimeout(1000);

  // Click the first unit in the sidebar
  // Note: Sidebar items for groups are just .sidebar-item
  // We need to be careful not to click the header if it's inside sidebar-list, but header is sticky top.
  // The .sidebar-item elements are the rows.
  const firstUnit = page.locator('.sidebar-item').first();
  const unitName = (await firstUnit.innerText()).trim();
  console.log(`Selected unit: ${unitName}`);
  
  await firstUnit.click();
  await page.waitForTimeout(1000);

  // Check Right Panel
  const rightPanel = page.locator('.right-panel');
  await expect(rightPanel).toBeVisible();

  // Check Group Name
  // The structure is .detail-row > .label + .value
  const groupNameValue = rightPanel.locator('.detail-row', { hasText: '分组名称：' }).locator('.value');
  await expect(groupNameValue).toContainText(unitName);

  // Check Task List
  const taskList = rightPanel.locator('.group-task-list');
  await expect(taskList).toBeVisible();
  
  const tasks = taskList.locator('.group-task-item');
  const taskCount = await tasks.count();
  console.log(`Found ${taskCount} tasks in group details.`);
  expect(taskCount).toBeGreaterThan(0);

  // Check task content
  const firstTaskName = await tasks.first().locator('.task-name').innerText();
  console.log(`First task in group: ${firstTaskName}`);
  expect(firstTaskName).toBeTruthy();
});
