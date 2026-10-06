/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { appHtml } from './tools/vite-plugin-app-html.ts';
import { contentPlugin } from './tools/vite-plugin-content/index.ts';

export default defineConfig(({ mode }) => ({
  // '/<repo>/' on GitHub Pages, '/' with a custom domain or locally.
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    appHtml(),
    // e2e builds also include test-only fixture lessons (tests/fixtures/content).
    contentPlugin({ fixtures: mode === 'e2e' }),
  ],
  build: {
    target: 'es2023',
    manifest: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
}));
