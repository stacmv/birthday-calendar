// Run from WSL only: `make test-e2e` (never launch a browser on the Windows host).
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    ...devices['Pixel 5'],
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: `node ../scripts/static-server.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/app/`,
    reuseExistingServer: false,
    timeout: 20000,
  },
});
