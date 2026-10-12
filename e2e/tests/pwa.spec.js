import { test, expect } from '@playwright/test';

test('manifest is valid and linked', async ({ page, request }) => {
  await page.goto('/app/');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  expect(href).toBe('manifest.webmanifest');
  const res = await request.get('/app/manifest.webmanifest');
  expect(res.headers()['content-type']).toContain('application/manifest+json');
  const m = await res.json();
  expect(m.start_url).toBe('./');
  expect(m.scope).toBe('./');
  expect(m.display).toBe('standalone');
  const sizes = m.icons.map((i) => `${i.sizes}:${i.purpose}`);
  expect(sizes).toContain('192x192:any');
  expect(sizes).toContain('512x512:any');
  expect(sizes).toContain('512x512:maskable');
  for (const icon of m.icons) {
    const r = await request.get(`/app/${icon.src}`);
    expect(r.status(), icon.src).toBe(200);
  }
});

test('service worker registers, controls the page and serves it offline', async ({ page, context }) => {
  await page.goto('/app/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames.some((n) => n.startsWith('anniversary-calendar-'))).toBe(true);

  await context.setOffline(true);
  await page.goto('/app/?d=1990-05-15');
  await expect(page.getByRole('heading', { name: 'Юбилеи в днях' })).toBeVisible();
  await context.setOffline(false);
});

test('install UI is hidden until the browser offers installation', async ({ page }) => {
  await page.goto('/app/');
  await expect(page.locator('#install-banner')).toBeHidden();
  await expect(page.locator('#update-banner')).toBeHidden();
});

test('offline page exists and is cached', async ({ request }) => {
  const r = await request.get('/app/offline.html');
  expect(r.status()).toBe(200);
});
