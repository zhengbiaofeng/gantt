import { test, expect } from '@playwright/test';

test('Verify new conflict card UI elements', async ({ page }) => {
  // 1. Go to the page
  await page.goto('http://localhost:5173/');
  
  // 2. Click sidebar to open detail panel (if needed, but we are looking for conflict view)
  // Wait for load
  await page.waitForTimeout(1000);

  // 3. Switch to Conflict View
  // Using selectOption because it's a <select> element
  // We can find the select by the label "功能视图：" or simply by the option values if unique enough.
  // Or locate the select that contains the option 'conflict'
  
  const selectLocator = page.locator('select', { has: page.locator('option[value="conflict"]') });
   await selectLocator.selectOption('conflict');
   
   // Wait for conflict view to render
   await page.waitForTimeout(500);

   // Click on a conflict bar to open the right panel
   const conflictBar = page.locator('.conflict-bar-content.has-conflict').first();
   await conflictBar.click();
   
   // Wait for panel to open
   await page.waitForTimeout(500);
 
   // 4. Check for NEW UI elements (Redesign)
  const conflictCard = page.locator('.conflict-card-new').first();
  await expect(conflictCard).toBeVisible();

  // Check that the person header is present
  const header = conflictCard.locator('.card-header-person');
  await expect(header).toBeVisible();
  await expect(header.locator('.person-name')).toHaveText('张参谋');
  await expect(header.locator('.header-badge')).toHaveText('冲突预警');
  
  // Check that description is REMOVED
  await expect(conflictCard.locator('.card-desc')).not.toBeVisible();
  
  // Check for time row
  const timeRow = conflictCard.locator('.card-time-row');
  await expect(timeRow).toBeVisible();
  await expect(timeRow.locator('.time-tag')).toHaveText('时间冲突 2026-01-18 10:00-12:00');
  
  // Check related tasks section (Target the one with "冲突任务：")
  const relatedSection = conflictCard.locator('.related-tasks-section').filter({ hasText: '冲突任务：' });
  await expect(relatedSection).toBeVisible();
  await expect(relatedSection.locator('.section-title')).toHaveText('冲突任务：');

  // Check for task cards (should be 2)
  const taskCards = relatedSection.locator('.task-detail-card');
  await expect(taskCards).toHaveCount(2);

  // Verify first task card content (Existing Task: 日常值班, High Priority, Critical)
  const task1 = taskCards.first();
  await expect(task1).toHaveClass(/is-existing/);
  // Badge is removed
  await expect(task1.locator('.task-type-badge')).not.toBeVisible();
  await expect(task1.locator('.task-name')).toContainText('日常值班');
  // Button is removed
  await expect(task1.locator('.enter-btn')).not.toBeVisible();
  await expect(task1.locator('.task-card-meta')).toContainText('首长重点关注：是');
  await expect(task1.locator('.task-card-meta')).toContainText('优先级：高');
  await expect(task1.locator('.task-card-meta')).toContainText('关键节点：是');

  // Verify second task card content (New Task: 紧急会议, Medium Priority, Not Critical)
  const task2 = taskCards.nth(1);
  await expect(task2).toHaveClass(/is-new/);
  // Badge is removed
  await expect(task2.locator('.task-type-badge')).not.toBeVisible();
  await expect(task2.locator('.task-name')).toContainText('紧急会议');
  // Button is removed
  await expect(task2.locator('.enter-btn')).not.toBeVisible();
  await expect(task2.locator('.task-card-meta')).toContainText('首长重点关注：否');
  await expect(task2.locator('.task-card-meta')).toContainText('优先级：中');
  await expect(task2.locator('.task-card-meta')).toContainText('关键节点：否');

  // Verify modal interaction
  await task1.locator('.task-name').click();
  const modal = page.locator('.modal-overlay');
  await expect(modal).toBeVisible();
  await expect(modal.locator('.modal-header h3')).toHaveText('任务详情');
  await expect(modal.locator('.modal-body')).toContainText('任务名称：日常值班');
  await expect(modal.locator('.modal-body')).toContainText('优先级：高');
  await expect(modal.locator('.modal-body')).toContainText('关键节点：是');
  await expect(modal.locator('.modal-body')).toContainText('首长重点关注：是');

  // Close modal
  await modal.locator('.close-btn').click();
  await expect(modal).not.toBeVisible();
});
