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



test('RF10.6.1 exposes audio controls and WebAudio runtime', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' });
  await expect(page.locator('#rf9SoundToggle')).toHaveCount(1);
  await expect(page.locator('#rf9MusicToggle')).toHaveCount(1);
  const audio = await page.evaluate(() => ({
    hasRuntime: !!window.ScholarAudio,
    soundDefault: window.ScholarAudio?.prefs?.().sound,
    hasContext: !!(window.AudioContext || window.webkitAudioContext)
  }));
  expect(audio.hasRuntime).toBeTruthy();
  expect(audio.soundDefault).toBeTruthy();
  expect(audio.hasContext).toBeTruthy();
});


test('deployment version endpoint matches HTML build', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' });

  const meta = await page.locator('meta[name="scholar-garden-build"]').getAttribute('content');
  expect(meta).toContain('RF10.7');

  const version = await page.evaluate(async () => {
    const r = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
    return { ok: r.ok, data: await r.json() };
  });
  expect(version.ok).toBeTruthy();
  expect(version.data.build).toBe('RF10.7');

  await expect(page.locator('footer[data-build="RF10.7"]')).toHaveCount(1);

  const guard = await page.request.get('./deploy-guard.js');
  expect(guard.ok()).toBeTruthy();
});


test('topic search finds imperfect tense and opens Latin revision', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' });

  await page.locator('#globalTopicSearch').click();
  await expect(page.locator('#topicSearchModal')).toBeVisible();

  const input = page.locator('#topicSearchInput');
  await input.fill('imperfect tense');

  const results = page.locator('[data-topic-search-id]');
  await expect(results.first()).toBeVisible();
  await expect(page.getByText(/Latin/i).first()).toBeVisible();

  const latin = results.filter({ hasText: 'Latin' }).first();
  await expect(latin).toBeVisible();
  await latin.click();

  await expect(page.locator('#subjectScreen')).toBeVisible();
  await expect(page.locator('#subjectScreen h1').first()).toHaveText('Latin');
  await expect(page).toHaveURL(/#subject\/latin-current\/learn/);
  await expect(page.locator('#genericLearnPane')).toContainText(/imperfect|tense/i);
});

test('topic search index is available and substantial', async ({ request }) => {
  const response = await request.get('./topic-search-index.json');
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.build).toBe('RF10.7');
  expect(data.count).toBeGreaterThan(100);
});


test('reference-aligned home layout has no giant blank scene', async ({ page }) => {
  await page.goto('./#home', { waitUntil: 'networkidle' });

  const scholar = page.locator('.rf107-scholar-panel');
  const stack = page.locator('.rf107-home-stack');
  const image = page.locator('#homeScholarImage');

  await expect(scholar).toBeVisible();
  await expect(stack).toBeVisible();
  await expect(image).toBeVisible();

  const sb = await scholar.boundingBox();
  const qb = await stack.boundingBox();
  const ib = await image.boundingBox();

  expect(sb.width).toBeGreaterThan(500);
  expect(sb.height).toBeGreaterThan(480);
  expect(qb.width).toBeGreaterThan(320);
  expect(qb.height).toBeGreaterThan(480);
  expect(ib.height).toBeGreaterThan(380);

  // The stack must sit beside the Scholar on normal desktop, not collapse below it.
  expect(Math.abs(sb.y - qb.y)).toBeLessThan(40);
  expect(qb.x).toBeGreaterThan(sb.x + sb.width - 20);
});

test('global navigation uses the dedicated PNG icon family', async ({ page }) => {
  await page.goto('./#home', { waitUntil: 'networkidle' });
  for (const name of ['home','study','garden','scholar']) {
    const img = page.locator(`[data-global-route="${name}"] img`);
    await expect(img).toHaveAttribute('src', new RegExp(`assets/ui-nav/${name}\\.png`));
  }
});
