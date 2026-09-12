const { test, expect } = require('@playwright/test');

test('core shell renders without uncaught errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('./', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('[data-global-route="home"]').first()).toBeVisible();
  await expect(page.locator('[data-global-route="study"]').first()).toBeVisible();
  await expect(page.locator('[data-global-route="garden"]').first()).toBeVisible();
  await expect(page.locator('[data-global-route="scholar"]').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Tiffin master character asset loads', async ({ page }) => {
  const response = await page.goto('./scholar_master_uniform.png');
  expect(response && response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('image');
});
