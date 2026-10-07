// After a single-page app shows a new view, move focus to its heading.
const heading = document.querySelector('main h1');
heading.setAttribute('tabindex', '-1');
heading.focus();
