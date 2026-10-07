import { test, expect } from '@playwright/test';

test('shows the product name on the public home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.app-public-brand')).toContainText('حركة');
  await expect(page.locator('h1')).toContainText('نقل موظفي الشركات');
});

test('opens the contact page from the home page', async ({ page }) => {
  await page.goto('/');
  await page.locator('.app-public-header').getByRole('link', { name: 'تواصل معنا' }).click();

  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator('a[href^="tel:"]')).toBeVisible();
});
