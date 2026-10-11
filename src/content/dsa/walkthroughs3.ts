import type { CoachWalkthrough } from '../schema';
import { cpp, java } from '../helpers';

// Original PrepForge walkthroughs (batch 3). Statements are not copied; read the official one.
export const walkthroughs3: Record<string, CoachWalkthrough> = {
  'maximum-product-subarray': {
    understandMd: 'Return the largest product of any non-empty contiguous subarray of an integer array.',
    ioConstraintsMd: 'Up to 2·10⁴ values in [−10, 10]; the answer fits in a 32-bit int. Zeros and negatives are allowed.',
    edgeCases: ['A single negative number, e.g. [−3]', 'Zeros that split the array, e.g. [−2, 0, −1]', 'An even number of negatives, e.g. [2, 3, −2, −4]', 'All negatives of odd count, e.g. [−1, −2, −3]'],
    bruteForceMd: 'For every start, extend the end and keep a running product; track the maximum.',
    bruteComplexity: 'O(n²) time, O(1) space.',
    bottleneckMd: 'Each start rebuilds products that the previous start already computed. As in Kadane, the best product ending at i can be derived from the best ending at i − 1, but a negative factor flips the order, so the worst product matters too.',
    hints: [
      'Think of the answer ending exactly at index i. What information from i − 1 do you need?',
      "This is Kadane's algorithm, but multiplication by a negative number swaps large and small.",
      'Track both the maximum and the minimum product ending at i; the new values are among x, hi·x and lo·x.',
      'for x in a[1:]: candidates = (x, hi*x, lo*x); hi, lo = max(candidates), min(candidates); best = max(best, hi)',
    ],
    optimalMd: 'Keep `hi` and `lo`, the largest and smallest products of subarrays ending at the current index. For each x, compute both new values from the old ones (x itself handles zeros and fresh starts). The answer is the largest `hi` seen.',
    code: [
      cpp(`
int maxProduct(vector<int>& nums) {
    int hi = nums[0], lo = nums[0], best = nums[0];
    for (int i = 1; i < (int)nums.size(); ++i) {
        int x = nums[i];
        int a = hi * x, b = lo * x;          // both from the OLD hi and lo
        hi = max({x, a, b});
        lo = min({x, a, b});
        best = max(best, hi);
    }
    return best;
}`, 'C++'),
      java(`
public int maxProduct(int[] nums) {
    int hi = nums[0], lo = nums[0], best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        int x = nums[i];
        int a = hi * x, b = lo * x;
        hi = Math.max(x, Math.max(a, b));
        lo = Math.min(x, Math.min(a, b));
        best = Math.max(best, hi);
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space.',
    testCases: [
      { input: '[2,3,-2,4]', expected: '6', why: '[2, 3]; the −2 breaks the run' },
      { input: '[-2,0,-1]', expected: '0', why: 'Zero beats any negative product' },
      { input: '[2,3,-2,-4]', expected: '48', why: 'Two negatives multiply to a positive; needs the min track' },
      { input: '[-3]', expected: '-3', why: 'Non-empty: a single negative is the answer' },
    ],
    takeawaysMd: 'When an operation can flip order (multiplying by a negative), carry both extremes. Always compute the new pair from the old pair.',
  },

  'find-the-duplicate-number': {
    understandMd: 'An array has n + 1 integers, each between 1 and n, so at least one value repeats; exactly one value is repeated (possibly many times). Return it without modifying the array, using O(1) extra space.',
    ioConstraintsMd: 'n up to 10⁵. The constraints forbid sorting, hash sets, and marking by negation (all modify the array or use O(n) space).',
    edgeCases: ['The duplicate appears more than twice, e.g. [2, 2, 2, 2, 2]', 'The duplicate is 1', 'The duplicate is at index 0'],
    bruteForceMd: 'Compare every pair, or count occurrences of each value in a hash set.',
    bruteComplexity: 'O(n²) time with pairs; O(n) time but O(n) space with a set.',
    bottleneckMd: 'We need O(n) time without memory. The values are valid indices, so the array defines a function i → nums[i]. Two indices map to the duplicate value, which is exactly what a cycle entrance looks like.',
    hints: [
      'Every value is in 1..n, so every value is also a valid index. What structure does "go to index nums[i]" create?',
      'Start at index 0 and keep following i = nums[i]. Since no value is 0, you never return to index 0, so the walk forms a tail followed by a cycle.',
      'The duplicate is the node with two incoming arrows: the entrance of the cycle. Floyd finds cycle entrances in O(1) space.',
      'slow = nums[slow], fast = nums[nums[fast]] until equal; then slow = 0 and move both one step until equal; return slow.',
    ],
    optimalMd: "Run Floyd's cycle detection on the implicit list starting at index 0. After the pointers meet, reset one to 0 and advance both one step at a time; they meet at the cycle entrance, which is the duplicate value. Alternative: binary search on the value v, counting how many elements are ≤ v (O(n log n)).",
    code: [
      cpp(`
int findDuplicate(vector<int>& nums) {
    int slow = 0, fast = 0;
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);
    slow = 0;
    while (slow != fast) { slow = nums[slow]; fast = nums[fast]; }
    return slow;
}`, 'C++'),
      java(`
public int findDuplicate(int[] nums) {
    int slow = 0, fast = 0;
    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);
    slow = 0;
    while (slow != fast) { slow = nums[slow]; fast = nums[fast]; }
    return slow;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space; the array is not modified.',
    testCases: [
      { input: '[1,3,4,2,2]', expected: '2', why: 'Indices 3 and 4 both point to 2' },
      { input: '[3,1,3,4,2]', expected: '3', why: 'The cycle entrance is 3' },
      { input: '[2,2,2,2,2]', expected: '2', why: 'Repeated many times' },
    ],
    takeawaysMd: 'If values can be read as indices, an array is a function, and repeated values become cycle entrances. Floyd works on any such function, not only on linked lists.',
  },

  'powx-n': {
    understandMd: 'Compute x raised to an integer power n, where n can be negative and as large as 2³¹ − 1 in magnitude.',
    ioConstraintsMd: 'x is a double in (−100, 100); n is a 32-bit int; the result fits in a double (|result| ≤ 10⁴ per the problem).',
    edgeCases: ['n = 0 (answer 1)', 'n negative', 'n = −2³¹, whose negation overflows a 32-bit int', 'x = 1 or −1 with huge n', 'x = 0 with positive n'],
    bruteForceMd: 'Multiply x by itself |n| times, then invert if n was negative.',
    bruteComplexity: 'O(|n|) multiplications: up to about 2·10⁹, far too slow.',
    bottleneckMd: 'Repeated multiplication recomputes the same powers. x^n = (x^(n/2))², so one half-sized answer, squared, gives the full answer.',
    hints: [
      'How is x⁸ related to x⁴? How is x⁹ related to x⁴?',
      'Halve the exponent each step: x^n = (x^(n/2))² times an extra x when n is odd.',
      'For negative n use (1/x)^(−n), but negate n in a 64-bit variable.',
      'e = (long)n; if e < 0: x = 1/x, e = −e; result = 1; while e > 0: if e odd: result *= x; x *= x; e //= 2',
    ],
    optimalMd: 'Exponentiation by squaring. Iteratively: scan the bits of the exponent from least significant; whenever a bit is 1, multiply the result by the current power of x, and square x each step. Convert n to a 64-bit type before negating.',
    code: [
      cpp(`
double myPow(double x, int n) {
    long long e = n;
    if (e < 0) { x = 1.0 / x; e = -e; }
    double result = 1.0;
    while (e > 0) {
        if (e & 1) result *= x;
        x *= x;
        e >>= 1;
    }
    return result;
}`, 'C++'),
      java(`
public double myPow(double x, int n) {
    long e = n;
    if (e < 0) { x = 1.0 / x; e = -e; }
    double result = 1.0;
    while (e > 0) {
        if ((e & 1) == 1) result *= x;
        x *= x;
        e >>= 1;
    }
    return result;
}`, 'Java'),
    ],
    finalComplexity: 'O(log |n|) time, O(1) space (the recursive form uses O(log |n|) stack).',
    testCases: [
      { input: 'x = 2.0, n = 10', expected: '1024.0', why: 'Basic positive exponent' },
      { input: 'x = 2.0, n = -2', expected: '0.25', why: 'Negative exponent' },
      { input: 'x = 1.0, n = -2147483648', expected: '1.0', why: 'INT_MIN: must not overflow when negated' },
      { input: 'x = 2.1, n = 3', expected: '9.261', why: 'Odd exponent needs the extra factor' },
    ],
    takeawaysMd: 'Halving the problem gives logarithmic recursion depth. Watch for the asymmetric range of two\'s complement integers whenever you negate.',
  },
};
