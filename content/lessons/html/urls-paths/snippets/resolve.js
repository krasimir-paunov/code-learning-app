const page = 'https://site.example/blog/2026/spring-trails.html';

console.log(new URL('photos/ridge.jpg', page).pathname);
console.log(new URL('../images/map.png', page).pathname);
console.log(new URL('/images/logo.svg', page).pathname);
console.log(new URL('https://cdn.example/lib.js', page).href);
