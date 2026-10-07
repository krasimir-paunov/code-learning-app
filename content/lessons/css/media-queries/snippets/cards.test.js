const rules = () => [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]);
const cardsRules = (list) => list.filter((r) => r.selectorText === '.cards');
const isWideQuery = (text) => /\(min-width:\s*40rem\)|\(width\s*>=\s*40rem\)/.test(text);

test('without a media query, the cards are one column', () => {
  const base = cardsRules(rules());
  const columns = base.map((r) => r.style.gridTemplateColumns).filter(Boolean);
  expect(columns.every((c) => c === '1fr' || c === 'none')).toBe(true);
});

test('a query from 40rem up adds two columns', () => {
  const media = rules().filter((r) => r instanceof CSSMediaRule && isWideQuery(r.conditionText));
  const inside = media.flatMap((m) => cardsRules([...m.cssRules]).map((r) => r.style.gridTemplateColumns));
  expect(inside.some((c) => c === 'repeat(2, 1fr)' || c === '1fr 1fr')).toBe(true);
});

test('the layout is mobile-first: no max-width queries', () => {
  const desktopFirst = rules().filter(
    (r) => r instanceof CSSMediaRule && /max-width|width\s*</.test(r.conditionText),
  );
  expect(desktopFirst.length).toBe(0);
});
