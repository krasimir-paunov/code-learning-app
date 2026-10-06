const xs = [1, 3, 5, 7, 9, 11];
let lo = 0;
let hi = xs.length - 1;
let steps = 0;
while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  steps++;
  if (xs[mid] === 4) break;
  if (xs[mid] < 4) lo = mid + 1;
  else hi = mid - 1;
}
console.log(steps, lo, hi);
