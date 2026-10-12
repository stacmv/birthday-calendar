import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const NOW = new Date('2026-10-12T10:00:00+03:00');

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.goto('/app/?d=1990-05-15&t=14:30');
});

async function readDownload(download) {
  return fs.readFileSync(await download.path(), 'utf8');
}

test('download selected rows as .ics, next-batch event last', async ({ page }) => {
  await page.getByLabel(/Отметить для экспорта: 13\s300 дней/).check();
  await page.getByLabel(/Отметить для экспорта: 15\s000 дней/).check();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Скачать отмеченные (.ics)' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('jubilees-1990-05-15.ics');
  const ics = await readDownload(download);
  expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
  expect(ics).toContain('SUMMARY:13 300 дней с рождения');
  const events = ics.replace(/\r\n /g, '').split('BEGIN:VEVENT').slice(1);
  expect(events.at(-1)).toContain('Календарь юбилеев: получить следующие юбилеи');
  expect(events.at(-1)).toMatch(/URL:http:\/\/127\.0\.0\.1:\d+\/app\/\?d=1990-05-15&t=14%3A30/);
  expect(events[0]).toMatch(/DTSTART:\d{8}T\d{6}Z/);
});

test('download all', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Скачать все (.ics)' }).click(),
  ]);
  const ics = await readDownload(download);
  const rows = await page.locator('li.item').count();
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(rows + 1);
});

test('nothing selected shows a message and no download', async ({ page }) => {
  await page.getByRole('button', { name: 'Скачать отмеченные (.ics)' }).click();
  await expect(page.getByText('Ничего не отмечено.')).toBeVisible();
});

test('Google Calendar link per row', async ({ page }) => {
  const link = page.getByRole('link', { name: /В Google Календарь: 13\s300 дней/ });
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
  const href = new URL(await link.getAttribute('href'));
  expect(href.origin + href.pathname).toBe('https://calendar.google.com/calendar/render');
  expect(href.searchParams.get('action')).toBe('TEMPLATE');
  expect(href.searchParams.get('dates')).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
});

test('selection survives the beautiful toggle', async ({ page }) => {
  await page.getByLabel(/Отметить для экспорта: 13\s300 дней/).check();
  await page.getByLabel(/Красивые числа/).check();
  await expect(page.getByLabel(/Отметить для экспорта: 13\s300 дней/)).toBeChecked();
});

test('no horizontal overflow at 360px with export UI', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.getByLabel(/Красивые числа/).check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
