/** "p.price" / "button#buy.primary": how DevTools labels an element. */
export function elementLabel(element: Element): string {
  const id = element.id ? `#${element.id}` : '';
  const classes = Array.from(element.classList, (c) => `.${c}`).join('');
  return `${element.localName}${id}${classes}`;
}
