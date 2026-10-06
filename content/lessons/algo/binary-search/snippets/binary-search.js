function binarySearch(xs, target) {
  let lo = 0;
  let hi = xs.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (xs[mid] === target) return mid;
    if (xs[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

const xs = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log(binarySearch(xs, 23));
console.log(binarySearch(xs, 24));
