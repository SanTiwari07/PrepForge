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

  'course-schedule-ii': {
    understandMd: 'There are n courses and pairs [a, b] meaning b must be taken before a. Return any order that takes all courses, or an empty array if that is impossible.',
    ioConstraintsMd: 'n up to 2000, up to n(n−1) pairs, all distinct. Several valid orders may exist; any one is accepted.',
    edgeCases: ['No prerequisites at all (any order of 0..n−1)', 'A cycle such as [[0,1],[1,0]]', 'Courses that appear in no pair', 'A long chain 0 → 1 → … → n−1'],
    bruteForceMd: 'Try permutations of the courses and check each against every prerequisite.',
    bruteComplexity: 'O(n! · m): hopeless beyond tiny n.',
    bottleneckMd: 'We only ever need "which course can be taken now?": one with no unfinished prerequisites. Tracking how many prerequisites remain per course answers that without search.',
    hints: [
      'Model it as a graph. What is a vertex, and which way should an edge point?',
      'Edge b → a for each pair [a, b]. A valid order is a topological order of this directed graph.',
      'Repeatedly take a course whose remaining prerequisite count (in-degree) is 0, and decrement its successors. If you cannot take all n, there is a cycle.',
      'indeg[a]++ for each [a,b]; queue all indeg-0; pop u, append, for v in g[u]: if --indeg[v] == 0 push v; return order if size == n else []',
    ],
    optimalMd: "Kahn's algorithm. Build the adjacency list with edges prerequisite → course and an in-degree array. Process a queue of courses with in-degree 0; each pop appends a course to the order and frees its dependants. Fewer than n courses in the order means a cycle.",
    code: [
      cpp(`
vector<int> findOrder(int n, vector<vector<int>>& prerequisites) {
    vector<vector<int>> g(n);
    vector<int> indeg(n, 0), order;
    for (auto& p : prerequisites) { g[p[1]].push_back(p[0]); ++indeg[p[0]]; }
    queue<int> q;
    for (int v = 0; v < n; ++v) if (!indeg[v]) q.push(v);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : g[u]) if (--indeg[v] == 0) q.push(v);
    }
    return (int)order.size() == n ? order : vector<int>();
}`, 'C++'),
      java(`
public int[] findOrder(int n, int[][] prerequisites) {
    List<List<Integer>> g = new ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new ArrayList<>());
    int[] indeg = new int[n];
    for (int[] p : prerequisites) { g.get(p[1]).add(p[0]); indeg[p[0]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int v = 0; v < n; v++) if (indeg[v] == 0) q.add(v);
    int[] order = new int[n];
    int k = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        order[k++] = u;
        for (int v : g.get(u)) if (--indeg[v] == 0) q.add(v);
    }
    return k == n ? order : new int[0];
}`, 'Java'),
    ],
    finalComplexity: 'O(V + E) time and space.',
    testCases: [
      { input: 'n = 2, [[1,0]]', expected: '[0,1]', why: 'One prerequisite' },
      { input: 'n = 4, [[1,0],[2,0],[3,1],[3,2]]', expected: '[0,1,2,3] or [0,2,1,3]', why: 'Diamond; several answers' },
      { input: 'n = 2, [[1,0],[0,1]]', expected: '[]', why: 'Cycle' },
      { input: 'n = 3, []', expected: 'any permutation, e.g. [0,1,2]', why: 'No constraints' },
    ],
    takeawaysMd: 'Dependencies are directed edges from "before" to "after". Kahn gives the order and the cycle check in one pass.',
  },

  'redundant-connection': {
    understandMd: 'A tree with n vertices (labelled 1..n) had one extra edge added. Given the n edges in order, return the edge that can be removed so the rest is a tree; if several work, return the one that appears last.',
    ioConstraintsMd: 'n up to 1000; edges are undirected, with no duplicates or self-loops.',
    edgeCases: ['The extra edge is the last edge in the input', 'The cycle passes through vertex 1', 'A triangle: [[1,2],[1,3],[2,3]]'],
    bruteForceMd: 'For each edge from last to first, remove it and check with DFS whether the remaining graph is connected and acyclic.',
    bruteComplexity: 'O(n²): n DFS runs of O(n).',
    bottleneckMd: 'Each check rebuilds connectivity from scratch. Instead, add edges one by one and remember which vertices are already connected: the first edge that joins two already-connected vertices closes the only cycle.',
    hints: [
      'Add the edges one at a time. When does an edge create a cycle?',
      'When its two endpoints are already connected through earlier edges.',
      'Union-find answers "already connected?" and merges groups in near-constant time.',
      'for (a, b) in edges: if find(a) == find(b): return [a, b]; union(a, b)',
    ],
    optimalMd: 'Process edges in input order with a DSU. The first edge whose endpoints already share a root is the answer. It is also the last edge on the cycle in input order, which is why it satisfies the "return the last one" rule: every other cycle edge appears before it.',
    code: [
      cpp(`
vector<int> findRedundantConnection(vector<vector<int>>& edges) {
    int n = edges.size();
    vector<int> parent(n + 1);
    iota(parent.begin(), parent.end(), 0);
    function<int(int)> find = [&](int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); };
    for (auto& e : edges) {
        int a = find(e[0]), b = find(e[1]);
        if (a == b) return e;
        parent[a] = b;
    }
    return {};
}`, 'C++'),
      java(`
private int[] parent;
private int find(int x) { return parent[x] == x ? x : (parent[x] = find(parent[x])); }
public int[] findRedundantConnection(int[][] edges) {
    int n = edges.length;
    parent = new int[n + 1];
    for (int i = 0; i <= n; i++) parent[i] = i;
    for (int[] e : edges) {
        int a = find(e[0]), b = find(e[1]);
        if (a == b) return e;
        parent[a] = b;
    }
    return new int[0];
}`, 'Java'),
    ],
    finalComplexity: 'O(n α(n)) time, O(n) space.',
    testCases: [
      { input: '[[1,2],[1,3],[2,3]]', expected: '[2,3]', why: 'Triangle; the last cycle edge' },
      { input: '[[1,2],[2,3],[3,4],[1,4],[1,5]]', expected: '[1,4]', why: 'Cycle 1-2-3-4; [1,5] comes after' },
      { input: '[[2,3],[1,2],[1,3]]', expected: '[1,3]', why: 'Cycle closes on the third edge' },
    ],
    takeawaysMd: 'Online "does this edge close a cycle?" in an undirected graph is the textbook use of union-find.',
  },

  'network-delay-time': {
    understandMd: 'A signal starts at node k in a directed graph with travel times on the edges. Return how long it takes until every node has received it, or −1 if some node never does.',
    ioConstraintsMd: 'Up to 100 nodes and 6000 edges; weights 0..100 (non-negative); nodes labelled 1..n.',
    edgeCases: ['A node that is unreachable from k', 'n = 1 (answer 0)', 'Parallel paths where the longer-hop path is cheaper'],
    bruteForceMd: 'Enumerate all simple paths from k with DFS and record the cheapest arrival time per node.',
    bruteComplexity: 'Exponential in the worst case.',
    bottleneckMd: 'Paths are re-explored many times. Because weights are non-negative, the cheapest unsettled node can be finalised immediately, which is Dijkstra.',
    hints: [
      'The time for a node to receive the signal is its shortest-path distance from k. What is the answer in terms of those distances?',
      'The answer is the maximum of all shortest distances, or −1 if any is infinite.',
      'Weights are non-negative: use Dijkstra with a min-heap of (distance, node).',
      'dist[k] = 0; heap = [(0,k)]; pop (d,u); skip if d > dist[u]; relax each edge; answer = max(dist) or −1',
    ],
    optimalMd: 'Single-source shortest paths with Dijkstra (lazy deletion), then take the maximum distance. With n ≤ 100, Bellman-Ford (O(n · E)) or even Floyd-Warshall would also pass, but Dijkstra is the expected answer.',
    code: [
      cpp(`
int networkDelayTime(vector<vector<int>>& times, int n, int k) {
    vector<vector<pair<int, int>>> g(n + 1);
    for (auto& t : times) g[t[0]].push_back({t[1], t[2]});
    vector<int> dist(n + 1, INT_MAX);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    dist[k] = 0; pq.push({0, k});
    while (!pq.empty()) {
        int d = pq.top().first, u = pq.top().second; pq.pop();
        if (d > dist[u]) continue;
        for (auto& e : g[u])
            if (d + e.second < dist[e.first]) { dist[e.first] = d + e.second; pq.push({dist[e.first], e.first}); }
    }
    int best = 0;
    for (int v = 1; v <= n; ++v) { if (dist[v] == INT_MAX) return -1; best = max(best, dist[v]); }
    return best;
}`, 'C++'),
      java(`
public int networkDelayTime(int[][] times, int n, int k) {
    List<List<int[]>> g = new ArrayList<>();
    for (int i = 0; i <= n; i++) g.add(new ArrayList<>());
    for (int[] t : times) g.get(t[0]).add(new int[] {t[1], t[2]});
    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
    dist[k] = 0; pq.add(new int[] {0, k});
    while (!pq.isEmpty()) {
        int[] top = pq.poll();
        int d = top[0], u = top[1];
        if (d > dist[u]) continue;
        for (int[] e : g.get(u))
            if (d + e[1] < dist[e[0]]) { dist[e[0]] = d + e[1]; pq.add(new int[] {dist[e[0]], e[0]}); }
    }
    int best = 0;
    for (int v = 1; v <= n; v++) { if (dist[v] == Integer.MAX_VALUE) return -1; best = Math.max(best, dist[v]); }
    return best;
}`, 'Java'),
    ],
    finalComplexity: 'O(E log V) time, O(V + E) space.',
    testCases: [
      { input: 'times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2', expected: '2', why: 'Node 4 is reached last at time 2' },
      { input: 'times = [[1,2,1]], n = 2, k = 2', expected: '-1', why: 'Node 1 is unreachable from 2' },
      { input: 'times = [[1,2,5],[1,3,1],[3,2,1]], n = 3, k = 1', expected: '2', why: 'The two-hop path to 2 is cheaper' },
    ],
    takeawaysMd: '"When does everyone receive it?" is the maximum over single-source shortest distances. Check reachability before taking the maximum.',
  },

  'min-cost-to-connect-all-points': {
    understandMd: 'Points on a plane can be connected pairwise at a cost equal to their Manhattan distance. Return the minimum total cost to connect all points (directly or indirectly).',
    ioConstraintsMd: 'Up to 1000 points with coordinates in [−10⁶, 10⁶]; all points are distinct. The answer fits in a 32-bit int for the given limits.',
    edgeCases: ['A single point (cost 0)', 'Two points', 'Points on a line', 'Large coordinates (distances up to 4·10⁶)'],
    bruteForceMd: 'Generate all n(n−1)/2 edges, sort them, and run Kruskal with a DSU.',
    bruteComplexity: 'O(n² log n) time and O(n²) memory (≈ 500 000 edges for n = 1000). It passes, but it is heavy.',
    bottleneckMd: 'The graph is complete, so materialising and sorting every edge dominates. Prim with a plain array can find the cheapest edge out of the tree in O(n) per step without storing any edges.',
    hints: [
      'Connect all points with minimum total cost, no cycles needed. Which classic structure is that?',
      'A minimum spanning tree over the complete graph whose edge weights are Manhattan distances.',
      'With about n²/2 edges, prefer Prim with an O(n) scan per step over sorting all edges.',
      'best[] = ∞, best[0] = 0; repeat n times: pick the unvisited u with the smallest best, add best[u], mark u, update best[v] = min(best[v], dist(u, v)) for unvisited v',
    ],
    optimalMd: 'Dense Prim: keep, for each point outside the tree, the cheapest connection to any point inside it. Each of the n rounds picks the closest outside point (O(n)) and relaxes the others against it (O(n)).',
    code: [
      cpp(`
int minCostConnectPoints(vector<vector<int>>& p) {
    int n = p.size(), total = 0;
    vector<int> best(n, INT_MAX);
    vector<bool> in(n, false);
    best[0] = 0;
    for (int it = 0; it < n; ++it) {
        int u = -1;
        for (int v = 0; v < n; ++v) if (!in[v] && (u == -1 || best[v] < best[u])) u = v;
        in[u] = true;
        total += best[u];
        for (int v = 0; v < n; ++v)
            if (!in[v]) best[v] = min(best[v], abs(p[u][0] - p[v][0]) + abs(p[u][1] - p[v][1]));
    }
    return total;
}`, 'C++'),
      java(`
public int minCostConnectPoints(int[][] p) {
    int n = p.length, total = 0;
    int[] best = new int[n];
    Arrays.fill(best, Integer.MAX_VALUE);
    boolean[] in = new boolean[n];
    best[0] = 0;
    for (int it = 0; it < n; it++) {
        int u = -1;
        for (int v = 0; v < n; v++) if (!in[v] && (u == -1 || best[v] < best[u])) u = v;
        in[u] = true;
        total += best[u];
        for (int v = 0; v < n; v++)
            if (!in[v]) best[v] = Math.min(best[v], Math.abs(p[u][0] - p[v][0]) + Math.abs(p[u][1] - p[v][1]));
    }
    return total;
}`, 'Java'),
    ],
    finalComplexity: 'O(n²) time, O(n) space.',
    testCases: [
      { input: '[[0,0],[2,2],[3,10],[5,2],[7,0]]', expected: '20', why: 'Edges 4 + 3 + 4 + 9' },
      { input: '[[3,12],[-2,5],[-4,1]]', expected: '18', why: 'Negative coordinates' },
      { input: '[[0,0]]', expected: '0', why: 'Nothing to connect' },
    ],
    takeawaysMd: 'For an implicit complete graph, the array version of Prim is O(V²) and needs no edge list: it beats Kruskal on dense graphs.',
  },

  'edit-distance': {
    understandMd: 'Return the minimum number of single-character insertions, deletions and replacements needed to turn word1 into word2.',
    ioConstraintsMd: 'Both strings have length up to 500 and contain lowercase letters. O(mn) = 250 000 states is fine.',
    edgeCases: ['One string empty (answer = the other length)', 'Identical strings (0)', 'No common characters', 'One string is a subsequence of the other'],
    bruteForceMd: 'Recursively compare the last characters; on a mismatch try all three operations.',
    bruteComplexity: 'O(3^(m+n)) without memoisation.',
    bottleneckMd: 'The recursion only ever asks about pairs of prefixes (i, j), and the same pair is reached through many different operation sequences. There are only (m + 1)(n + 1) such pairs.',
    hints: [
      'Look at the last characters of both strings. If they match, what is left to do?',
      'Define dp[i][j] = the edit distance between the first i characters of word1 and the first j characters of word2.',
      'If the last characters match: dp[i−1][j−1]. Otherwise the last operation was a delete, an insert or a replace: 1 + min of the three neighbouring cells.',
      'dp[i][0] = i; dp[0][j] = j; dp[i][j] = a[i−1] == b[j−1] ? dp[i−1][j−1] : 1 + min(dp[i−1][j], dp[i][j−1], dp[i−1][j−1])',
    ],
    optimalMd: 'Fill the (m+1) × (n+1) table row by row; keep only two rows because each cell needs the row above and the cell to its left. The answer is dp[m][n].',
    code: [
      cpp(`
int minDistance(string a, string b) {
    int m = a.size(), n = b.size();
    vector<int> prev(n + 1), cur(n + 1);
    for (int j = 0; j <= n; ++j) prev[j] = j;
    for (int i = 1; i <= m; ++i) {
        cur[0] = i;
        for (int j = 1; j <= n; ++j)
            cur[j] = a[i - 1] == b[j - 1] ? prev[j - 1] : 1 + min({prev[j], cur[j - 1], prev[j - 1]});
        swap(prev, cur);
    }
    return prev[n];
}`, 'C++'),
      java(`
public int minDistance(String a, String b) {
    int m = a.length(), n = b.length();
    int[] prev = new int[n + 1], cur = new int[n + 1];
    for (int j = 0; j <= n; j++) prev[j] = j;
    for (int i = 1; i <= m; i++) {
        cur[0] = i;
        for (int j = 1; j <= n; j++)
            cur[j] = a.charAt(i - 1) == b.charAt(j - 1) ? prev[j - 1] : 1 + Math.min(prev[j], Math.min(cur[j - 1], prev[j - 1]));
        int[] t = prev; prev = cur; cur = t;
    }
    return prev[n];
}`, 'Java'),
    ],
    finalComplexity: 'O(mn) time, O(n) space.',
    testCases: [
      { input: '"horse", "ros"', expected: '3', why: 'Replace h→r, delete r, delete e' },
      { input: '"intention", "execution"', expected: '5', why: 'Classic example' },
      { input: '"", "abc"', expected: '3', why: 'Three inserts' },
      { input: '"abc", "abc"', expected: '0', why: 'Identical' },
    ],
    takeawaysMd: 'Two-sequence problems use prefix pairs as states. Decide what the last operation was, and the recurrence writes itself.',
  },

  'word-search-ii': {
    understandMd: 'Given a grid of letters and a list of words, return every word that can be traced through horizontally or vertically adjacent cells without reusing a cell within one word.',
    ioConstraintsMd: 'Grid up to 12 × 12; up to 3·10⁴ words of length up to 10; all words distinct.',
    edgeCases: ['A word that appears along two paths (report once)', 'Words that are prefixes of other words ("oa" and "oath")', 'A word longer than the number of cells', 'A 1 × 1 grid'],
    bruteForceMd: 'Run the single-word grid DFS (Word Search I) for every word.',
    bruteComplexity: 'O(W · R · C · 4 · 3^(L−1)): with 3·10⁴ words this times out.',
    bottleneckMd: 'Words sharing a prefix redo the same grid exploration, and each separate search keeps exploring paths that match no word. A trie shares prefixes and tells the DFS immediately when the current path is a dead end.',
    hints: [
      'Many words share prefixes. How could you search for all of them in one pass over the grid?',
      'Put the words in a trie. Walk the grid and the trie together: moving to a neighbouring cell means moving to the corresponding child node.',
      'Stop as soon as the trie has no child for the next letter. Store the full word at its end node so you can report it when reached.',
      'dfs(r, c, node): ch = grid[r][c]; nxt = node.child[ch]; if none return; if nxt.word: add it and clear it; mark cell; recurse on 4 neighbours; unmark',
    ],
    optimalMd: 'Build a trie of all words, storing each word at its end node. DFS from every cell, following trie children; mark cells as visited on the way down and restore them on the way back. Report a word when its node is reached, then clear it to avoid duplicates. Optionally prune trie nodes that have become empty.',
    code: [
      cpp(`
struct Node { Node* c[26] = {}; string word; };
void dfs(vector<vector<char>>& g, int r, int col, Node* node, vector<string>& out) {
    char ch = g[r][col];
    if (ch == '#' || !node->c[ch - 'a']) return;
    node = node->c[ch - 'a'];
    if (!node->word.empty()) { out.push_back(node->word); node->word.clear(); }
    g[r][col] = '#';                                   // visited
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int k = 0; k < 4; ++k) {
        int nr = r + dr[k], nc = col + dc[k];
        if (nr >= 0 && nc >= 0 && nr < (int)g.size() && nc < (int)g[0].size()) dfs(g, nr, nc, node, out);
    }
    g[r][col] = ch;                                    // restore
}
vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
    Node* root = new Node();
    for (auto& w : words) {
        Node* n = root;
        for (char ch : w) { if (!n->c[ch - 'a']) n->c[ch - 'a'] = new Node(); n = n->c[ch - 'a']; }
        n->word = w;
    }
    vector<string> out;
    for (int r = 0; r < (int)board.size(); ++r)
        for (int c = 0; c < (int)board[0].size(); ++c) dfs(board, r, c, root, out);
    return out;
}`, 'C++'),
      java(`
static class Node { Node[] c = new Node[26]; String word; }
private void dfs(char[][] g, int r, int col, Node node, List<String> out) {
    char ch = g[r][col];
    if (ch == '#' || node.c[ch - 'a'] == null) return;
    node = node.c[ch - 'a'];
    if (node.word != null) { out.add(node.word); node.word = null; }
    g[r][col] = '#';
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    for (int[] d : dirs) {
        int nr = r + d[0], nc = col + d[1];
        if (nr >= 0 && nc >= 0 && nr < g.length && nc < g[0].length) dfs(g, nr, nc, node, out);
    }
    g[r][col] = ch;
}
public List<String> findWords(char[][] board, String[] words) {
    Node root = new Node();
    for (String w : words) {
        Node n = root;
        for (char ch : w.toCharArray()) { if (n.c[ch - 'a'] == null) n.c[ch - 'a'] = new Node(); n = n.c[ch - 'a']; }
        n.word = w;
    }
    List<String> out = new ArrayList<>();
    for (int r = 0; r < board.length; r++)
        for (int c = 0; c < board[0].length; c++) dfs(board, r, c, root, out);
    return out;
}`, 'Java'),
    ],
    finalComplexity: 'Worst case O(R · C · 4 · 3^(L−1)) for maximum word length L, but trie pruning makes it far faster; the trie takes O(total characters) space.',
    testCases: [
      { input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]', expected: '["eat","oath"] (any order)', why: 'Classic example' },
      { input: 'board = [["a","b"],["c","d"]], words = ["abcb"]', expected: '[]', why: 'Would need to reuse a cell' },
      { input: 'board = [["a","a"]], words = ["aaa"]', expected: '[]', why: 'Only two cells' },
    ],
    takeawaysMd: 'When many searches share prefixes, put the queries in a trie and do the expensive traversal once. Clear reported words to avoid duplicates.',
  },
};
