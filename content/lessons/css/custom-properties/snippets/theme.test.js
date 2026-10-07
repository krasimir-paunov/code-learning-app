// Paint a colour on a canvas to read it back as sRGB, whatever notation it was written in.
const paint = (color) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
};
const luminance = (color) => {
  const [r, g, b] = paint(color).map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.floor(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};
const styleOf = (selector) => getComputedStyle($(selector));
const inTheme = (theme, check) => {
  if (theme) document.documentElement.dataset.theme = theme;
  try {
    check();
  } finally {
    delete document.documentElement.dataset.theme;
  }
};

test('dark theme: the page background is dark', () => {
  inTheme('dark', () => expect(luminance(styleOf('body').backgroundColor)).toBeLessThan(0.1));
});

test('dark theme: body text reaches 4.5:1', () => {
  inTheme('dark', () => {
    const body = styleOf('body');
    expect(contrast(body.color, body.backgroundColor)).toBeGreaterThan(4.49);
  });
});

test('dark theme: the button text reaches 4.5:1 on the button', () => {
  inTheme('dark', () => {
    const buy = styleOf('.buy');
    expect(contrast(buy.color, buy.backgroundColor)).toBeGreaterThan(4.49);
  });
});

test('without the attribute, the page stays light', () => {
  inTheme(null, () => expect(luminance(styleOf('body').backgroundColor)).toBeGreaterThan(0.8));
});
