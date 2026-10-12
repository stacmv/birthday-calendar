import { test, expect } from '@playwright/test';

const NOW = new Date('2026-10-12T10:00:00+03:00');

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

async function submit(page, d, t) {
  await page.getByLabel(/Дата рождения/).fill(d);
  if (t) await page.getByLabel(/Время рождения/).fill(t);
  await page.getByRole('button', { name: 'Показать календарь юбилеев' }).click();
}

test('reload shows the calendar directly (saved date)', async ({ page }) => {
  await page.goto('/app/');
  await submit(page, '1990-05-15', '14:30');
  await expect(page.getByRole('heading', { name: 'Юбилеи в днях' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Юбилеи в днях' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Когда вы родились?' })).toHaveCount(0);
  await expect(page.locator('#birth-text')).toContainText('15 мая 1990');
});

test('Change shows a prefilled form; Forget clears storage', async ({ page }) => {
  await page.goto('/app/');
  await submit(page, '1990-05-15', '14:30');
  await page.getByRole('button', { name: 'Изменить' }).click();
  await expect(page.getByLabel(/Дата рождения/)).toHaveValue('1990-05-15');
  await expect(page.getByLabel(/Время рождения/)).toHaveValue('14:30');
  await submit(page, '1991-06-16', '');
  await expect(page.locator('#birth-text')).toContainText('16 июня 1991');

  await page.getByRole('button', { name: 'Забыть' }).click();
  await expect(page.getByLabel(/Дата рождения/)).toHaveValue('');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Когда вы родились?' })).toBeVisible();
});

test('URL params take precedence, are saved and stripped from the address', async ({ page }) => {
  await page.goto('/app/');
  await submit(page, '1980-01-01', '');
  await page.goto('/app/?d=1990-05-15&t=14:30');
  await expect(page.locator('#birth-text')).toContainText('15 мая 1990');
  await expect(page.locator('#birth-text')).toContainText('14:30');
  expect(new URL(page.url()).search).toBe('');
  await page.goto('/app/');
  await expect(page.locator('#birth-text')).toContainText('15 мая 1990');
});

test('permalink reopens the same calendar', async ({ page, context }) => {
  await page.goto('/app/');
  await submit(page, '1990-05-15', '14:30');
  const link = await page.locator('#permalink').inputValue();
  expect(link).toContain('/app/?d=1990-05-15&t=14%3A30');
  const other = await context.newPage();
  await other.clock.setFixedTime(NOW);
  await other.evaluate(() => localStorage.clear()).catch(() => {});
  await other.goto(link);
  await expect(other.locator('#birth-text')).toContainText('15 мая 1990');
});
