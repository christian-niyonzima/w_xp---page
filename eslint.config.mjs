// Lint for real mistakes (undefined names, unreachable code…), not for formatting.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, module: 'readonly' } },
  },
  { files: ['sw.js'], languageOptions: { sourceType: 'script', globals: globals.serviceworker } },
  { files: ['tools/**/*.js'], languageOptions: { sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser } } },
  // Tests run code inside the page too (page.evaluate), where the site's XP global exists.
  { files: ['tests/**/*.js', 'playwright.config.js'], languageOptions: { sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser, XP: 'readonly', PROFILE: 'readonly' } } },
  {
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
