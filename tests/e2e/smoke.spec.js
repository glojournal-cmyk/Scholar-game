const { test, expect } = require('@playwright/test');

test('core shell renders without uncaught errors', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('./', { waitUntil: 'domcontentloaded' });

  // Validate real app structure instead of assuming a non-existent #app wrapper.
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('[data-global-route="home"]').first()).toBeVisible();
  await expect(page.locator('[data-global-route="study"]').first()).toBeVisible();
  await expect(page.locator('[data-global-route="garden"]').first()).toBeVisible();
  await expect(page.locator('[data-global-route="scholar"]').first()).toBeVisible();

  // At least one actual screen container must be visible after boot.
  const visibleScreens = await page.locator('section, main, [id$="Screen"]').evaluateAll(nodes =>
    nodes.filter(n => {
      const s = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    }).length
  );
  expect(visibleScreens).toBeGreaterThan(0);

  if (pageErrors.length || consoleErrors.length) {
    console.error('BROWSER_DIAGNOSTICS');
    for (const err of pageErrors) console.error('pageerror:', err);
    for (const err of consoleErrors) console.error('console.error:', err);
  }

  expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  expect(consoleErrors, `Console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
});

test('Tiffin master character asset loads', async ({ page }) => {
  const response = await page.goto('./scholar_master_uniform.png');
  expect(response && response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('image');
});
