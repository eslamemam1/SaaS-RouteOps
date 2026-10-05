import { test, expect } from '@playwright/test';

test('shows the product name', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toContainText('حركة');
});
