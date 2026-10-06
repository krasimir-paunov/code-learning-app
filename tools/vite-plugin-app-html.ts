import type { Plugin } from 'vite';
import { APP_DESCRIPTION, APP_NAME } from '../src/config/app.ts';

/**
 * Production CSP, delivered by <meta> because GitHub Pages cannot send headers.
 * Styles allow 'unsafe-inline' because pre-highlighted code uses style attributes.
 * The code sandbox is a separate document (public/sandbox.html) with its own policy.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

/** The one reading font that is preloaded (DESIGN §2). */
const PRELOAD_FONT = 'inter-latin-wght-normal';

/** Fills APP_NAME/description into index.html; in builds also adds the CSP and the font preload. */
export function appHtml(): Plugin {
  let base = '/';
  return {
    name: 'app-html',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        let out = html
          .replaceAll('%APP_NAME%', APP_NAME)
          .replaceAll('%APP_DESCRIPTION%', APP_DESCRIPTION);
        if (!ctx.bundle) return out;
        const csp = `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`;
        const font = Object.values(ctx.bundle).find(
          (file) => file.type === 'asset' && file.fileName.includes(PRELOAD_FONT),
        );
        const preload = font
          ? `<link rel="preload" href="${base}${font.fileName}" as="font" type="font/woff2" crossorigin />`
          : '';
        out = out.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${csp}`);
        return out.replace('</head>', `  ${preload}\n  </head>`);
      },
    },
  };
}
