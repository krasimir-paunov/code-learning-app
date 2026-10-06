const page = 'https://site.example/shop/shoes/trail.html';

console.log(new URL('../bags/day-pack.html', page).pathname);
console.log(new URL('./sizes.html', page).pathname);
console.log(new URL('/cart', page).pathname);
