// A GitHub Pages project site lives in a subfolder: /my-site/
const page = 'https://user.github.io/my-site/about.html';

console.log(new URL('/images/logo.svg', page).href);
