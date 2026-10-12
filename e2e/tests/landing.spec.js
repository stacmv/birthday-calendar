import { test, expect } from '@playwright/test';

for (const lang of ['ru', 'en']) {
  test(`landing ${lang}: content, link to the app, screenshots load`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Heading order: h1, then h2 sections, h3 inside features.
    const levels = await page.locator('h1, h2, h3').evaluateAll((els) => els.map((e) => +e.tagName[1]));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    // Every image has alt text and actually loads.
    for (const img of await page.locator('main img').all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveAttribute('alt', /.+/);
      await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true);
    }
    const cta = page.locator('a.btn').first();
    await expect(cta).toHaveAttribute('href', '../app/');
    await cta.click();
    await expect(page).toHaveURL(/\/app\/$/);
    await expect(page.locator('main')).toBeVisible();
  });

  test(`landing ${lang}: no horizontal overflow at 360px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(`/${lang}/`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test('language switch links go to the other landing', async ({ page }) => {
  await page.goto('/ru/');
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await page.getByRole('link', { name: 'RU', exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/$/);
});

test('theme choice is shared between landing and app', async ({ page }) => {
  await page.goto('/ru/');
  await page.getByLabel('Тема').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/app/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('root index offers visible links without JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Русский' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'English' })).toBeVisible();
  await ctx.close();
});

test('root index redirects by browser language', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/ru\/$/);
});
