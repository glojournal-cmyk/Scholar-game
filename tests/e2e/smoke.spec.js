const { test, expect } = require('@playwright/test');

test('core shell renders without uncaught errors or missing resources', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  const badResponses = [];

  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      badResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto('./', { waitUntil: 'networkidle' });

  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('[data-global-route="home"]').first()).toBeVisible();
  await expect(page.locator('[data-global-route="study"]').first()).toBeVisible();
  await expect(page.locator('[data-global-route="garden"]').first()).toBeVisible();
  await expect(page.locator('[data-global-route="scholar"]').first()).toBeVisible();

  if (badResponses.length) {
    console.error('BAD_RESPONSES');
    for (const item of badResponses) console.error(item);
  }
  if (pageErrors.length || consoleErrors.length) {
    console.error('BROWSER_DIAGNOSTICS');
    for (const err of pageErrors) console.error('pageerror:', err);
    for (const err of consoleErrors) console.error('console.error:', err);
  }

  expect(badResponses, `HTTP failures:\n${badResponses.join('\n')}`).toEqual([]);
  expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  expect(consoleErrors, `Console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
});

test('Tiffin master character asset loads', async ({ page }) => {
  const response = await page.goto('./scholar_master_uniform.png');
  expect(response && response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('image');
});

test('French compatibility resources load locally', async ({ page }) => {
  for (const file of [
    'question-bank.json',
    'vocab-bank.json',
    'writing-bank.json',
    'notes-by-section.json',
    'french-reference-marker.js'
  ]) {
    const response = await page.goto(`./${file}`);
    expect(response && response.ok(), `${file} should load`).toBeTruthy();
  }
});
