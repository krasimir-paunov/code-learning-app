test('the Buy button is green', () => {
  expect(styleOf('.buy', 'background-color')).toBe('rgb(47, 210, 124)');
});

test('no !important was needed', () => {
  const rules = Array.from(document.styleSheets).flatMap((sheet) => Array.from(sheet.cssRules));
  const important = rules.filter((rule) => rule.style?.getPropertyPriority('background') === 'important');
  expect(important).toHaveLength(0);
});
