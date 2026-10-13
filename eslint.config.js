import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'e2e/node_modules/**', 'coverage/**', 'tools/**', 'videos/**'] },
  js.configs.recommended,
  {
    files: ['public/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser } },
  },
  {
    files: ['public/app/sw.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.serviceworker } },
  },
  {
    files: ['public/shared/theme-init.js'],
    languageOptions: { sourceType: 'script' },
  },
  {
    files: ['scripts/**/*.mjs', 'e2e/**/*.js', 'tests/**/*.js', '*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
];
