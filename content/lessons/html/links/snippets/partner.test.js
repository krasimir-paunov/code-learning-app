test('the link leads to the Parcel Post site', () => {
  expect(new URL($('a').href).hostname).toBe('www.parcelpost.example');
});

test('it uses HTTPS', () => {
  expect(new URL($('a').href).protocol).toBe('https:');
});
