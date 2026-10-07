const all = (selector) => [...document.querySelectorAll(selector)];
const texts = (selector) => all(selector).map((el) => el.textContent.trim());

test('the title is the caption, not a separate paragraph', () => {
  expect($('table caption')?.textContent.trim()).toBe('Bus 42 timetable');
  expect(all('p').length).toBe(0);
});

test('the header row is in <thead>, with a column header per column', () => {
  expect(texts('thead th[scope="col"]')).toEqual(['Stop', 'First bus', 'Last bus']);
});

test('each stop is the header of its row', () => {
  expect(texts('tbody tr > th[scope="row"]:first-child')).toEqual(['Central', 'Harbour', 'Airport']);
});

test('the times are data cells, unchanged', () => {
  expect(texts('tbody td')).toEqual(['05:40', '23:10', '05:52', '23:22', '06:15', '23:45']);
});
