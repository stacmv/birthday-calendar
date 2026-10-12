import { test, expect } from '@playwright/test';

// Fixed "now" keeps jubilee numbers deterministic.
const NOW = new Date('2026-10-12T10:00:00+03:00');

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

async function fillForm(page, d, t) {
  await page.getByLabel(/Дата рождения/).fill(d);
  if (t) await page.getByLabel(/Время рождения/).fill(t);
  await page.getByRole('button', { name: 'Показать календарь юбилеев' }).click();
}

test('first visit: form, submit, calendar', async ({ page }) => {
  await page.goto('/app/');
  await expect(page.getByRole('heading', { name: 'Когда вы родились?' })).toBeVisible();
  await fillForm(page, '1990-05-15', '14:30');
  await expect(page.getByRole('heading', { name: 'Юбилеи в днях' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Юбилеи в часах' })).toBeVisible();
  await expect(page.getByText('13 300 дней')).toBeVisible();
  await expect(page.locator('main')).toContainText('14:30');
});

test('invalid date shows an error', async ({ page }) => {
  await page.goto('/app/');
  await page.getByRole('button', { name: 'Показать календарь юбилеев' }).click();
  await expect(page.getByRole('alert')).toContainText('корректную дату');
});

test('no horizontal overflow at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/app/');
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(await overflow()).toBe(true);
  await fillForm(page, '1990-05-15', '14:30');
  await expect(page.getByRole('heading', { name: 'Юбилеи в днях' })).toBeVisible();
  expect(await overflow()).toBe(true);
});

test('theme switch persists across reload', async ({ page }) => {
  await page.goto('/app/');
  await page.getByLabel('Тема').selectOption('contrast');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'contrast');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'contrast');
  await expect(page.getByLabel('Тема')).toHaveValue('contrast');
});

test('language switch to English', async ({ page }) => {
  await page.goto('/app/');
  await page.getByLabel('Язык').selectOption('en');
  await expect(page.getByRole('heading', { name: 'When were you born?' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
