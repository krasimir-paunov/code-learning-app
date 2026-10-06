// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { imgTag, judgeAlt, type LabImage } from './model.ts';

const photo: LabImage = { id: 'p', file: 'shoe-4302.jpg', purpose: 'informative', shows: 'x' };
const divider: LabImage = { id: 'd', file: 'swoosh.svg', purpose: 'decorative', shows: 'x' };
const logo: LabImage = { id: 'l', file: 'logo.svg', purpose: 'link', linkTo: '/', shows: 'x' };

describe('judgeAlt', () => {
  it('accepts a description for an informative image', () => {
    expect(judgeAlt(photo, 'Red trail shoe, side view')).toMatchObject({
      ok: true,
      announced: 'Red trail shoe, side view, image',
    });
  });

  it('rejects missing alt, file names and "image of"', () => {
    expect(judgeAlt(photo, null)).toMatchObject({ ok: false });
    expect(judgeAlt(photo, null).announced).toContain('shoe-4302.jpg');
    expect(judgeAlt(photo, 'shoe-4302.jpg').ok).toBe(false);
    expect(judgeAlt(photo, 'Image of a red shoe').ok).toBe(false);
    expect(judgeAlt(photo, '').ok).toBe(false);
  });

  it('wants empty alt on decorative images', () => {
    expect(judgeAlt(divider, '')).toMatchObject({ ok: true, announced: '(skipped: decorative)' });
    expect(judgeAlt(divider, 'Blue swoosh').ok).toBe(false);
  });

  it('names a link through its image', () => {
    expect(judgeAlt(logo, 'Trailhead home page')).toMatchObject({
      ok: true,
      announced: 'link, Trailhead home page',
    });
    expect(judgeAlt(logo, '')).toMatchObject({ ok: false, announced: 'link, (no name)' });
  });
});

describe('imgTag', () => {
  it('wraps link images in their link', () => {
    expect(imgTag(logo, 'Home')).toBe('<a href="/"><img src="logo.svg" alt="Home"></a>');
    expect(imgTag(photo, null)).toBe('<img src="shoe-4302.jpg">');
  });
});
