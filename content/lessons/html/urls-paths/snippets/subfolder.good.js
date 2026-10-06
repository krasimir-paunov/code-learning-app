// Relative to the page, the subfolder is kept.
const page = 'https://user.github.io/my-site/about.html';

console.log(new URL('images/logo.svg', page).href);
