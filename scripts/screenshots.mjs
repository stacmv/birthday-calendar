// Captures the landing-page screenshots from the real app with headless Chromium.
//
// RUN INSIDE WSL ONLY (`make landing-screenshots` does that): launching a browser on the
// Windows host of this machine can blue-screen it. The script refuses to run on win32.
// It imports only Node built-ins, ./static-server.mjs and playwright-core from e2e/node_modules.
//
//   node scripts/screenshots.mjs        skip when public/app + public/shared are unchanged
//   FORCE=1 node scripts/screenshots.mjs   recapture anyway
//
// The hash of public/app/** (without sw.js, whose stamp derives from the other files) and
// public/shared/** is kept in scripts/.shots.hash (committed). Prints `changed=1|0`.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { startServer } from './static-server.mjs';

if (process.platform === 'win32') {
  console.error('Refusing to launch a browser on the Windows host. Run `make landing-screenshots` (WSL).');
  process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const hashFile = path.join(root, 'scripts', '.shots.hash');
const outDir = path.join(publicDir, 'shots');

const SAMPLE = { d: '1990-05-15', t: '14:30' };
const NOW = new Date('2026-10-12T10:00:00+03:00');
const VIEWPORT = { width: 390, height: 844 };

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? listFiles(full) : [full];
  });
}

export function sourceHash() {
  const hash = crypto.createHash('sha256');
  const files = [...listFiles(path.join(publicDir, 'app')), ...listFiles(path.join(publicDir, 'shared'))]
    .filter((f) => !['sw.js', 'landing.css'].includes(path.basename(f)))
    .map((f) => path.relative(publicDir, f).split(path.sep).join('/'))
    .sort();
  for (const rel of files) {
    hash.update(rel);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(publicDir, rel)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function capture() {
  const require = createRequire(path.join(root, 'e2e', 'package.json'));
  const { chromium } = require('playwright-core');
  const { server, port } = await startServer(publicDir, 0);
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  try {
    for (const lang of ['ru', 'en']) {
      const dir = path.join(outDir, lang);
      fs.mkdirSync(dir, { recursive: true });
      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        locale: lang === 'ru' ? 'ru-RU' : 'en-US',
        timezoneId: 'Europe/Moscow',
        colorScheme: 'light',
        serviceWorkers: 'block',
      });
      const page = await context.newPage();
      await page.clock.setFixedTime(NOW);
      await page.addInitScript((l) => {
        try { localStorage.setItem('ac.lang', l); } catch { /* ignore */ }
      }, lang);

      // 1. Form
      await page.goto(`${base}/app/`);
      await page.locator('#f-date').fill(SAMPLE.d);
      await page.locator('#f-time').fill(SAMPLE.t);
      await page.screenshot({ path: path.join(dir, 'form.png') });

      // 2. Calendar with beautiful numbers on
      await page.evaluate(() => localStorage.setItem('ac.beautiful', '1'));
      await page.goto(`${base}/app/?d=${SAMPLE.d}&t=${SAMPLE.t}`);
      await page.locator('#opt-beautiful').waitFor();
      await page.screenshot({ path: path.join(dir, 'calendar.png') });

      // 3. Export: a few rows ticked, the days list at the top of the screen
      const boxes = page.locator('li.item input[type=checkbox]');
      for (const i of [0, 2, 3]) await boxes.nth(i).check();
      await page.locator('section.card').nth(2).evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await page.screenshot({ path: path.join(dir, 'export.png') });

      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

const hash = sourceHash();
const previous = fs.existsSync(hashFile) ? fs.readFileSync(hashFile, 'utf8').trim() : '';
const force = process.env.FORCE === '1';
const haveShots = ['ru', 'en'].every((l) => ['form', 'calendar', 'export'].every((n) => fs.existsSync(path.join(outDir, l, `${n}.png`))));

if (!force && hash === previous && haveShots) {
  console.log('landing-screenshots: app unchanged, skipped (FORCE=1 to recapture)');
  console.log('changed=0');
} else {
  await capture();
  fs.writeFileSync(hashFile, `${hash}\n`);
  console.log(`landing-screenshots: captured into ${path.relative(root, outDir)}/{ru,en}`);
  console.log('changed=1');
}
