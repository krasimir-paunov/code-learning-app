import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dist-e2e',
      'coverage',
      'playwright-report',
      'test-results',
      '.cache',
      // Snippets are learner-facing content verified by verify:snippets, not app code.
      'content/**/snippets/**',
      'tests/fixtures/**/snippets/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  reactHooks.configs.flat['recommended-latest'],
  { files: ['src/**/*.tsx'], ...jsxA11y.flatConfigs.recommended },
  {
    files: ['tools/**/*.ts', 'vite.config.ts', 'playwright.config.ts', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // The test harness runs inside the sandbox iframe and in node:vm, so it is plain JS.
    files: ['src/engine/test-harness/*.js', 'public/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['tools/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  prettier,
);
