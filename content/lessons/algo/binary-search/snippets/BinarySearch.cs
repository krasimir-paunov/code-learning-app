int[] xs = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
Console.WriteLine(BinarySearch(xs, 23));
Console.WriteLine(BinarySearch(xs, 24));

static int BinarySearch(int[] xs, int target)
{
    int lo = 0;
    int hi = xs.Length - 1;
    while (lo <= hi)
    {
        int mid = lo + (hi - lo) / 2; // (lo + hi) / 2 can overflow int on huge arrays
        if (xs[mid] == target) return mid;
        if (xs[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
