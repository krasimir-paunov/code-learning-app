// Paint a colour on a canvas to read it back as sRGB, whatever notation it was written in.
const paint = (color) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
};
const luminance = (rgb) => {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const muted = () => getComputedStyle($('.muted')).color;
const card = () => getComputedStyle($('.card')).backgroundColor;

test('the muted text reaches 4.5:1 on the card', () => {
  // Rounded down to two decimals, as contrast checkers do, so 4.499 doesn't pass.
  const contrast = Math.floor(ratio(paint(muted()), paint(card())) * 100) / 100;
  expect(contrast).toBeGreaterThan(4.49);
});

test('only the lightness changed: chroma 0.03, hue 262', () => {
  const [, c, h] = muted().match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/)?.slice(1).map(Number) ?? [];
  expect(c).toBe(0.03);
  expect(h).toBe(262);
});

test('the card is unchanged', () => {
  expect(card()).toBe('oklch(0.25 0.03 262)');
});
