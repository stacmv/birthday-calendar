import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
    coverage: { provider: 'v8', include: ['public/app/js/**', 'public/shared/**'] },
  },
});
