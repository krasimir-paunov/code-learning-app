// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { ALL_ON, assemble, misdecoded, phoneTextScale, tabLabel, type PageText } from './model.ts';

const page: PageText = {
  title: 'Café Menu',
  heading: 'Café Menu',
  body: ['Crème brûlée: €4'],
  lang: 'en',
  fileName: 'menu.html',
};

describe('assemble', () => {
  it('writes the full boilerplate when every line is on', () => {
    const html = assemble(page, ALL_ON);
    expect(html.startsWith('<!doctype html>\n<html lang="en">')).toBe(true);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<title>Café Menu</title>');
  });

  it('drops switched-off lines and the lang attribute', () => {
    const html = assemble(page, { ...ALL_ON, doctype: false, lang: false, title: false });
    expect(html.startsWith('<html>')).toBe(true);
    expect(html).not.toContain('<title>');
  });

  it('parses to quirks mode without the doctype (the real parser decides)', () => {
    const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html').compatMode;
    expect(parse(assemble(page, ALL_ON))).toBe('CSS1Compat');
    expect(parse(assemble(page, { ...ALL_ON, doctype: false }))).toBe('BackCompat');
  });
});

describe('consequences', () => {
  it('turns UTF-8 into mojibake when decoded as Windows-1252', () => {
    expect(misdecoded('Café')).toBe('CafÃ©');
    expect(misdecoded('€4')).toBe('â‚¬4');
    expect(misdecoded('plain ASCII')).toBe('plain ASCII');
    expect(misdecoded('Café €4 — crème')).toBe('CafÃ© â‚¬4 â€” crÃ¨me');
  });

  it('shrinks text on phones without the viewport line', () => {
    expect(phoneTextScale(ALL_ON)).toBe(1);
    expect(phoneTextScale({ ...ALL_ON, viewport: false })).toBeCloseTo(375 / 980);
  });

  it('shows the file name in the tab without a title', () => {
    expect(tabLabel(page, ALL_ON)).toBe('Café Menu');
    expect(tabLabel(page, { ...ALL_ON, title: false })).toBe('menu.html');
  });
});
