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

  'validate-binary-search-tree': {
    understandMd: "Decide whether a binary tree satisfies the BST rule: every key in a node's left subtree is strictly smaller than the node, and every key in its right subtree is strictly larger.",
    ioConstraintsMd: 'Up to 10⁴ nodes; keys are 32-bit ints, including INT_MIN and INT_MAX. Duplicates make the tree invalid.',
    edgeCases: ['A deep node violating an ancestor, e.g. root 5, left 4, and 4 has a right child 6', 'Keys equal to INT_MAX or INT_MIN', 'Duplicate keys, e.g. [2, 2, 2]', 'A single node'],
    bruteForceMd: 'For every node, check that it is larger than the maximum of its left subtree and smaller than the minimum of its right subtree, computing those extremes by scanning the subtrees.',
    bruteComplexity: 'O(n²) for a skewed tree (each node rescans its subtree).',
    bottleneckMd: 'Subtree extremes are recomputed for every ancestor. Instead, push the constraint down: each node only needs to know the range its ancestors allow.',
    hints: [
      'Checking each node only against its two children is not enough. Which nodes constrain a given node?',
      'Every ancestor imposes either a lower or an upper bound, depending on whether you went right or left from it.',
      'Pass an open interval (lo, hi) down: the left child gets (lo, node), the right child gets (node, hi). Alternatively, the inorder sequence must be strictly increasing.',
      'valid(n, lo, hi): if n is null return true; if not lo < n.val < hi return false; return valid(n.left, lo, n.val) and valid(n.right, n.val, hi). Use 64-bit bounds.',
    ],
    optimalMd: 'Depth-first search carrying the allowed range. The root may take any value; going left lowers the upper bound to the parent, going right raises the lower bound. 64-bit (or nullable) bounds avoid a false failure on INT_MAX/INT_MIN keys.',
    code: [
      cpp(`
bool valid(TreeNode* n, long long lo, long long hi) {
    if (!n) return true;
    if (n->val <= lo || n->val >= hi) return false;
    return valid(n->left, lo, n->val) && valid(n->right, n->val, hi);
}
bool isValidBST(TreeNode* root) { return valid(root, LLONG_MIN, LLONG_MAX); }`, 'C++'),
      java(`
public boolean isValidBST(TreeNode root) { return valid(root, Long.MIN_VALUE, Long.MAX_VALUE); }
private boolean valid(TreeNode n, long lo, long hi) {
    if (n == null) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return valid(n.left, lo, n.val) && valid(n.right, n.val, hi);
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(h) recursion stack.',
    testCases: [
      { input: '[2,1,3]', expected: 'true', why: 'A valid three-node BST' },
      { input: '[5,1,4,null,null,3,6]', expected: 'false', why: '3 is in the right subtree of 5 but smaller than 5' },
      { input: '[2147483647]', expected: 'true', why: 'INT_MAX must not fail with 32-bit bounds' },
      { input: '[2,2,2]', expected: 'false', why: 'Duplicates violate the strict rule' },
    ],
    takeawaysMd: 'Tree invariants about whole subtrees become ranges passed down the recursion. Pick bound types wider than the key type.',
  },

  'insert-interval': {
    understandMd: 'Given sorted, non-overlapping intervals and one new interval, insert it and merge as needed so the result is still sorted and non-overlapping.',
    ioConstraintsMd: 'Up to 10⁴ intervals, sorted by start; endpoints up to 10⁵. Touching intervals (end == start) merge.',
    edgeCases: ['Empty list', 'New interval before all others or after all others', 'New interval covering every existing one', 'Touching endpoints, e.g. [1,2] and new [2,3]'],
    bruteForceMd: 'Append the new interval, sort everything, and run the standard merge.',
    bruteComplexity: 'O(n log n) time.',
    bottleneckMd: 'The input is already sorted; the sort throws that away. Only the intervals that overlap the new one change.',
    hints: [
      'The list is sorted and disjoint. Which existing intervals can possibly change?',
      'Split the list into three parts: entirely before the new interval, overlapping it, entirely after it.',
      'An interval is before if its end < new start; it overlaps while its start ≤ new end. Merge overlapping ones into the new interval with min/max.',
      'copy while iv[i].end < s; while iv[i].start <= e: s = min(s, iv[i].start), e = max(e, iv[i].end); add [s, e]; copy the rest',
    ],
    optimalMd: 'One linear pass with three phases. The merged interval absorbs every overlapping interval by taking the minimum start and the maximum end. No sorting needed.',
    code: [
      cpp(`
vector<vector<int>> insert(vector<vector<int>>& iv, vector<int>& nw) {
    vector<vector<int>> out;
    int i = 0, n = iv.size(), s = nw[0], e = nw[1];
    while (i < n && iv[i][1] < s) out.push_back(iv[i++]);
    while (i < n && iv[i][0] <= e) { s = min(s, iv[i][0]); e = max(e, iv[i][1]); ++i; }
    out.push_back({s, e});
    while (i < n) out.push_back(iv[i++]);
    return out;
}`, 'C++'),
      java(`
public int[][] insert(int[][] iv, int[] nw) {
    List<int[]> out = new ArrayList<>();
    int i = 0, n = iv.length, s = nw[0], e = nw[1];
    while (i < n && iv[i][1] < s) out.add(iv[i++]);
    while (i < n && iv[i][0] <= e) { s = Math.min(s, iv[i][0]); e = Math.max(e, iv[i][1]); i++; }
    out.add(new int[] {s, e});
    while (i < n) out.add(iv[i++]);
    return out.toArray(new int[0][]);
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(n) output space.',
    testCases: [
      { input: 'intervals = [[1,3],[6,9]], new = [2,5]', expected: '[[1,5],[6,9]]', why: 'Merges with one interval' },
      { input: 'intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], new = [4,8]', expected: '[[1,2],[3,10],[12,16]]', why: 'Absorbs three intervals' },
      { input: 'intervals = [], new = [5,7]', expected: '[[5,7]]', why: 'Empty input' },
      { input: 'intervals = [[1,5]], new = [6,8]', expected: '[[1,5],[6,8]]', why: 'No overlap, appended after' },
    ],
    takeawaysMd: 'When the input is already sorted, look for a linear pass with phases instead of re-sorting.',
  },

  'jump-game-ii': {
    understandMd: 'From index 0, each value says how far you may jump forward at most. Return the minimum number of jumps to reach the last index (it is always reachable).',
    ioConstraintsMd: 'Up to 10⁴ elements, values up to 1000. O(n²) passes, but O(n) is expected.',
    edgeCases: ['A single element (0 jumps)', 'The first jump reaches the end directly', 'Many 1s: [1, 1, 1, 1] needs n − 1 jumps', 'A large value in the middle that dominates'],
    bruteForceMd: 'DP: best[i] = 1 + min over j < i with j + a[j] ≥ i of best[j].',
    bruteComplexity: 'O(n²) time, O(n) space.',
    bottleneckMd: 'The DP looks back at every j for every i. But the set of indices reachable in exactly k jumps is a contiguous range, so you can process whole ranges at once, like BFS levels.',
    hints: [
      'Which indices can you reach with exactly one jump? With two?',
      'Those sets are contiguous ranges. Think of them as BFS levels.',
      'While scanning the current range, track the farthest index reachable with one more jump. When you reach the end of the range, you must jump; the next range ends at that farthest index.',
      'jumps = end = far = 0; for i in 0..n−2: far = max(far, i + a[i]); if i == end: jumps += 1; end = far',
    ],
    optimalMd: 'Greedy BFS: `end` marks the edge of the current level and `far` the edge of the next. Each time i reaches `end`, take one jump and move the edge to `far`. Stop before the last index so you never count a jump from it.',
    code: [
      cpp(`
int jump(vector<int>& a) {
    int jumps = 0, end = 0, far = 0;
    for (int i = 0; i + 1 < (int)a.size(); ++i) {
        far = max(far, i + a[i]);
        if (i == end) { ++jumps; end = far; }
    }
    return jumps;
}`, 'C++'),
      java(`
public int jump(int[] a) {
    int jumps = 0, end = 0, far = 0;
    for (int i = 0; i + 1 < a.length; i++) {
        far = Math.max(far, i + a[i]);
        if (i == end) { jumps++; end = far; }
    }
    return jumps;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space.',
    testCases: [
      { input: '[2,3,1,1,4]', expected: '2', why: '0 → 1 → 4' },
      { input: '[2,3,0,1,4]', expected: '2', why: 'A zero that must be jumped over' },
      { input: '[0]', expected: '0', why: 'Already at the end' },
      { input: '[1,1,1,1]', expected: '3', why: 'One level per index' },
    ],
    takeawaysMd: 'When the states reachable in k steps form a contiguous range, BFS collapses to two boundaries and becomes O(n).',
  },
};
