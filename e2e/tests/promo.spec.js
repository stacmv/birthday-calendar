import { test, expect } from '@playwright/test';

const CONCEPTS = ['odometer', 'holiday', 'invitation', 'numbers', 'newspaper'];

for (const lang of ['ru', 'en']) {
  test(`landing ${lang}: promo video picks a concept in the page language and plays muted`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    const video = page.locator('#promo');
    await expect(video).toHaveAttribute('aria-label', /.+/);
    await expect.poll(() => video.evaluate((v) => v.dataset.concept || '')).not.toBe('');
    const info = await video.evaluate((v) => ({
      concept: v.dataset.concept, src: v.currentSrc || v.querySelector('source').src, poster: v.poster,
      muted: v.muted, autoplay: v.autoplay, loop: v.loop, controls: v.controls,
    }));
    expect(CONCEPTS).toContain(info.concept);
    expect(info.src).toContain(`/video/${lang}/${info.concept}.mp4`);
    expect(info.poster).toContain(`/video/${lang}/${info.concept}.jpg`);
    expect(info).toMatchObject({ muted: true, autoplay: true, loop: true, controls: true });
    const res = await page.request.get(info.src);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('video/mp4');
    expect((await page.request.get(info.poster)).status()).toBe(200);
  });

  test(`landing ${lang}: promo video does not autoplay with reduced motion`, async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(`/${lang}/`);
    const video = page.locator('#promo');
    await expect.poll(() => video.evaluate((v) => v.dataset.concept || '')).not.toBe('');
    expect(await video.evaluate((v) => v.autoplay)).toBe(false);
    expect(await video.evaluate((v) => v.paused)).toBe(true);
    await ctx.close();
  });
}

test('every promo video and poster exists for both languages', async ({ request }) => {
  for (const lang of ['ru', 'en']) {
    for (const c of CONCEPTS) {
      expect((await request.get(`/video/${lang}/${c}.mp4`)).status(), `${lang}/${c}.mp4`).toBe(200);
      expect((await request.get(`/video/${lang}/${c}.jpg`)).status(), `${lang}/${c}.jpg`).toBe(200);
    }
  }
});

test('desktop: promo video sits left of the hero, vertically aligned; mobile: below it', async ({ browser }) => {
  const box = (page, sel) => page.locator(sel).evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, mid: r.top + r.height / 2 };
  });
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await desktop.goto('/ru/');
  const v = await box(desktop, '#promo');
  const h = await box(desktop, '.hero');
  expect(v.right).toBeLessThanOrEqual(h.left);
  expect(Math.abs(v.mid - h.mid)).toBeLessThan(40);
  // Visually hidden (still read by screen readers): the side-by-side layout needs no heading.
  expect((await desktop.locator('#promo-h').boundingBox()).width).toBeLessThanOrEqual(1);
  await desktop.close();

  const phone = await browser.newPage({ viewport: { width: 360, height: 800 } });
  await phone.goto('/ru/');
  expect((await box(phone, '#promo')).top).toBeGreaterThanOrEqual((await box(phone, '.hero')).bottom);
  await expect(phone.locator('#promo-h')).toBeVisible();
  expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await phone.close();
});
