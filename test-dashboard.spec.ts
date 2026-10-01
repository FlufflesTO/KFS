import { test, expect } from '@playwright/test';

test('dashboard loads', async ({ page }) => {
  await page.goto('http://localhost:4321');
  await expect(page.locator('body')).toBeVisible();
});
