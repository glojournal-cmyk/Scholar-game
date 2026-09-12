const { test, expect } = require('@playwright/test');

const routes = [
  { year: 'Year 9 · Current', subject: 'Biology', action: 'Learn', heading: 'Biology' },
  { year: 'Year 9 · Current', subject: 'Chemistry', action: 'Learn', heading: 'Chemistry' },
  { year: 'Year 9 · Current', subject: 'Physics', action: 'Learn', heading: 'Physics' },
  { year: 'Year 8 · Foundation', subject: 'Latin', action: 'Learn', heading: 'Latin' },
  { year: 'Year 8 · Foundation', subject: 'French', action: 'Practise', heading: 'French' },
  { year: 'Year 8 · Foundation', subject: 'Biology', action: 'Learn', heading: 'Biology' },
];

async function openStudy(page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-global-route="study"]').first().click();
  await expect(page.locator('#studyScreen')).toBeVisible();
}

async function chooseYear(page, year) {
  const yearButton = page.getByRole('button', { name: year, exact: true });
  await expect(yearButton).toBeVisible();
  await yearButton.click();
}

async function subjectCard(page, subject) {
  const card = page.locator('#studyScreen .study-card').filter({
    has: page.getByRole('heading', { name: subject, exact: true })
  }).first();
  await expect(card).toBeVisible();
  return card;
}

test.describe('Study Hub routing', () => {
  for (const route of routes) {
    test(`${route.year}: ${route.subject} → ${route.action}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));

      await openStudy(page);
      await chooseYear(page, route.year);
      const card = await subjectCard(page, route.subject);
      const button = card.getByRole('button', { name: route.action, exact: true });

      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();

      // This is a real browser pointer click, not JS dispatch.
      await button.click();

      await expect(page.locator('#subjectScreen')).toBeVisible();
      await expect(page.locator('#subjectScreen h1').first()).toHaveText(route.heading);
      await expect(page).toHaveURL(/#subject\//);
      await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeLessThan(40);
      expect(errors).toEqual([]);
    });
  }

  test('disabled current subjects remain disabled', async ({ page }) => {
    await openStudy(page);
    await chooseYear(page, 'Year 9 · Current');

    for (const subject of ['Latin', 'French', 'English']) {
      const card = await subjectCard(page, subject);
      await expect(card.getByRole('button', { name: 'Learn', exact: true })).toBeDisabled();
    }
  });

  test('cross-subject state never leaks from French to Biology', async ({ page }) => {
    await openStudy(page);
    await chooseYear(page, 'Year 8 · Foundation');

    let card = await subjectCard(page, 'French');
    await card.getByRole('button', { name: 'Practise', exact: true }).click();
    await expect(page.locator('#subjectScreen h1').first()).toHaveText('French');

    await page.locator('[data-global-route="study"]').first().click();
    await chooseYear(page, 'Year 8 · Foundation');

    card = await subjectCard(page, 'Biology');
    await card.getByRole('button', { name: 'Learn', exact: true }).click();
    await expect(page.locator('#subjectScreen h1').first()).toHaveText('Biology');
    await expect(page).toHaveURL(/#subject\/biology-foundation\/learn/);
  });
});
