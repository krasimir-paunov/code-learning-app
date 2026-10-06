/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { appHtml } from './tools/vite-plugin-app-html.ts';

export default defineConfig({
  // '/<repo>/' on GitHub Pages, '/' with a custom domain or locally.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), appHtml()],
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
});
