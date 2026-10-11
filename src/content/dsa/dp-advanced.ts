import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.dp-advanced';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Dynamic Programming III',
  summary: 'Interval DP, bitmask DP and DP on trees.',
  level: 'advanced',
  status: 'complete',
  estMinutes: 110,
  prerequisites: ['dsa.dp-2d'],
  related: ['dsa.dp-2d', 'dsa.bit-manipulation', 'dsa.binary-trees', 'dsa.recursion'],
  subtopics: ['Interval DP: dp[i][j] over substrings or subarrays', 'Choosing the last operation (burst balloons, cutting sticks)', 'Palindrome DP', 'Bitmask DP over subsets', 'DP on trees with post-order returns', 'Choosing the iteration order'],
  objectives: [
    'Recognise interval DP (answers for every contiguous range [i, j]) and fill it by increasing length.',
    'Use the "last action" trick (Burst Balloons, Minimum Cost to Cut a Stick) to split an interval into independent halves.',
    'Write bitmask DP over subsets for n ≤ 16–20, and estimate its O(2ⁿ · n) cost.',
    'Solve tree DP problems by returning several values per subtree in a post-order traversal (House Robber III, Binary Tree Cameras).',
    'Pick an evaluation order that guarantees every needed state is computed first.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Three advanced state shapes',
      bodyMd: `**1. Interval DP.** The state is a contiguous range: \`dp[i][j]\` = best answer for the subarray or substring i..j. The transition splits the range at some k: \`dp[i][j] = best over k of combine(dp[i][k], dp[k][j], cost(i, k, j))\`. Fill by **increasing length** so that shorter ranges are ready. Typical cost: O(n²) states × O(n) split points = **O(n³)**, fine for n ≤ 300–500.

Examples: Longest Palindromic Subsequence (O(n²), no split loop), Palindrome Partitioning II, Burst Balloons, Minimum Cost to Cut a Stick, matrix-chain multiplication, Stone Game.

**2. Bitmask DP.** The state includes a subset, stored as a bitmask: \`dp[mask]\` or \`dp[mask][last]\`. Transitions add one element to the mask. With n ≤ 16, 2¹⁶ · 16 ≈ 10⁶ states. Examples: Shortest Path Visiting All Nodes (BFS over (mask, node)), Partition to K Equal Sum Subsets, the travelling salesman problem, assigning n tasks to n workers.

**3. DP on trees.** Each node's answer depends only on its children's answers, so compute them in **post-order** (children first) and return a small tuple per node. Example: House Robber III returns (best if this node is robbed, best if it is not).`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'The "last action" trick and tree returns',
      bodyMd: `**Burst Balloons** looks impossible as "which balloon do I burst first?": after a burst, the neighbours change, so the two sides are not independent. Flip it: choose the balloon k that is burst **last** in the open interval (i, j). While everything else between i and j is being burst, k is still there, so the left part (i, k) and the right part (k, j) never interact. When k finally bursts, its neighbours are exactly i and j:

\`dp[i][j] = max over i < k < j of dp[i][k] + dp[k][j] + val[i]·val[k]·val[j]\`

with sentinel 1s added at both ends. O(n³).

**Minimum Cost to Cut a Stick** is the same shape: add 0 and n as cut positions and sort them; the first cut in (cuts[i], cuts[j]) costs the length cuts[j] − cuts[i], plus the costs of the two sides.

**Longest Palindromic Subsequence:** dp[i][j] = dp[i+1][j−1] + 2 if s[i] == s[j], else max(dp[i+1][j], dp[i][j−1]). It equals LCS(s, reverse(s)).

**Tree DP returns.** For House Robber III, each call returns a pair (rob, skip):
- rob = node.val + left.skip + right.skip (cannot rob a child)
- skip = max(left.rob, left.skip) + max(right.rob, right.skip)

Binary Tree Cameras returns one of three states per node (covered without a camera, has a camera, not covered) and places a camera at a parent whenever a child is not covered, which is a greedy tree DP.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: Burst Balloons on [3, 1, 5, 8]',
      bodyMd: 'With sentinels the values are [1, 3, 1, 5, 8, 1] (indices 0..5). dp[i][j] covers balloons strictly between i and j.',
      trace: [
        { note: 'Length 2 intervals hold one balloon: dp[0][2] = 1·3·1 = 3, dp[1][3] = 3·1·5 = 15, dp[2][4] = 1·5·8 = 40, dp[3][5] = 5·8·1 = 40.', array: [1, 3, 1, 5, 8, 1], vars: { 'dp[1][3]': 15, 'dp[2][4]': 40 } },
        { note: 'dp[1][4] (balloons 1, 5): last = 1 → dp[2][4] + 3·1·8 = 64; last = 5 → dp[1][3] + 3·5·8 = 135. dp[1][4] = 135.', array: [1, 3, 1, 5, 8, 1], window: [2, 3], vars: { 'dp[1][4]': 135 } },
        { note: 'dp[2][5] (balloons 5, 8): last = 5 → 0 + dp[3][5] + 1·5·1 = 45; last = 8 → dp[2][4] + 1·8·1 = 48. dp[2][5] = 48.', array: [1, 3, 1, 5, 8, 1], window: [3, 4], vars: { 'dp[2][5]': 48 } },
        { note: 'dp[0][5]: try each balloon last. last = 8 (index 4): dp[0][4] + dp[4][5] + 1·8·1. dp[0][4] = 159 (computed the same way), giving 167.', array: [1, 3, 1, 5, 8, 1], window: [1, 4], vars: { 'dp[0][4]': 159 } },
        { note: 'The maximum over all choices of the last balloon is 167, the LeetCode example answer.', array: [1, 3, 1, 5, 8, 1], vars: { answer: 167 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Burst Balloons (interval DP), House Robber III (tree DP) and Partition to K Equal Sum Subsets (bitmask DP).',
      code: [
        cpp(`
int maxCoins(vector<int> nums) {
    nums.insert(nums.begin(), 1); nums.push_back(1);
    int n = nums.size();
    vector<vector<int>> dp(n, vector<int>(n, 0));
    for (int len = 2; len < n; ++len)                       // j - i = len
        for (int i = 0; i + len < n; ++i) {
            int j = i + len;
            for (int k = i + 1; k < j; ++k)                 // k is burst LAST in (i, j)
                dp[i][j] = max(dp[i][j], dp[i][k] + dp[k][j] + nums[i] * nums[k] * nums[j]);
        }
    return dp[0][n - 1];
}

pair<int, int> robTree(TreeNode* node) {                   // (rob this node, skip it)
    if (!node) return {0, 0};
    pair<int, int> l = robTree(node->left), r = robTree(node->right);
    int rob = node->val + l.second + r.second;
    int skip = max(l.first, l.second) + max(r.first, r.second);
    return {rob, skip};
}
int rob(TreeNode* root) { pair<int, int> p = robTree(root); return max(p.first, p.second); }

// dp[mask] = filled amount of the current bucket using the elements in mask, or -1 if unreachable.
bool canPartitionKSubsets(const vector<int>& a, int k) {
    int n = a.size(), sum = accumulate(a.begin(), a.end(), 0);
    if (sum % k) return false;
    int target = sum / k;
    vector<int> dp(1 << n, -1);
    dp[0] = 0;
    for (int mask = 0; mask < (1 << n); ++mask) {
        if (dp[mask] < 0) continue;
        for (int i = 0; i < n; ++i) {
            if (mask >> i & 1) continue;
            if (dp[mask] + a[i] > target) continue;
            int nxt = mask | (1 << i);
            if (dp[nxt] < 0) dp[nxt] = (dp[mask] + a[i]) % target;   // a full bucket wraps to 0
        }
    }
    return dp[(1 << n) - 1] == 0;
}`, 'C++'),
        java(`
int maxCoins(int[] nums) {
    int n = nums.length + 2;
    int[] v = new int[n];
    v[0] = v[n - 1] = 1;
    for (int i = 0; i < nums.length; i++) v[i + 1] = nums[i];
    int[][] dp = new int[n][n];
    for (int len = 2; len < n; len++)
        for (int i = 0; i + len < n; i++) {
            int j = i + len;
            for (int k = i + 1; k < j; k++)
                dp[i][j] = Math.max(dp[i][j], dp[i][k] + dp[k][j] + v[i] * v[k] * v[j]);
        }
    return dp[0][n - 1];
}

int[] robTree(TreeNode node) {                             // {rob, skip}
    if (node == null) return new int[] {0, 0};
    int[] l = robTree(node.left), r = robTree(node.right);
    return new int[] {node.val + l[1] + r[1], Math.max(l[0], l[1]) + Math.max(r[0], r[1])};
}
int rob(TreeNode root) { int[] p = robTree(root); return Math.max(p[0], p[1]); }

boolean canPartitionKSubsets(int[] a, int k) {
    int n = a.length, sum = 0;
    for (int x : a) sum += x;
    if (sum % k != 0) return false;
    int target = sum / k;
    int[] dp = new int[1 << n];
    Arrays.fill(dp, -1);
    dp[0] = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        if (dp[mask] < 0) continue;
        for (int i = 0; i < n; i++) {
            if ((mask >> i & 1) == 1 || dp[mask] + a[i] > target) continue;
            int nxt = mask | (1 << i);
            if (dp[nxt] < 0) dp[nxt] = (dp[mask] + a[i]) % target;
        }
    }
    return dp[(1 << n) - 1] == 0;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Interval DP with a split point: O(n³) time, O(n²) space (Burst Balloons, cutting sticks, matrix chain). n ≤ 300–500.
- Interval DP without a split loop (palindromic subsequence): O(n²).
- Palindrome Partitioning II: O(n²) with a precomputed isPalindrome table.
- Bitmask DP: O(2ⁿ · n) (subset growth) or O(2ⁿ · n²) (mask + last element), so n ≤ ~16–20.
- Tree DP: O(n) time, O(h) stack.
- Knuth's or divide-and-conquer optimisations can cut some interval DPs to O(n²), but they are beyond typical interviews.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Filling interval DP row by row** (i from 0 upwards) when dp[i][j] needs dp[i+1][…] or longer-to-shorter dependencies: iterate by length, or i downwards.
2. **Choosing the first action** in Burst Balloons, which leaves dependent subproblems. Choose the last one.
3. **Forgetting sentinels** (1s around the balloons, 0 and n around the cuts).
4. **Bitmask DP with n = 25:** 2²⁵ · 25 ≈ 8·10⁸; check the constraint before committing.
5. **Tree DP returning one number** when the parent needs to know whether the child was chosen; return a pair or a state.
6. **Recursion depth** for tree DP on skewed trees with 10⁴+ nodes; usually fine, but know the iterative fallback.`,
    },
  ],
  recognition: {
    signals: ['Answer for every contiguous range, merging or splitting ranges', 'Removing/bursting/cutting elements where neighbours change', 'n ≤ 20 with "every subset" or "visit all"', 'Choices at tree nodes that constrain parents or children'],
    antiSignals: ['Prefix-only dependencies: 1-D or 2-D DP', 'n up to 10⁵ with ranges: an O(n³) interval DP is impossible; look for greedy or prefix structure', 'Independent subsets with large n: greedy or knapsack'],
    decisionQuestions: ['Is the natural subproblem a range [i, j], a subset, or a subtree?', 'If I fix the last action, do the two sides become independent?', 'What order guarantees that every state I read is final?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the Burst Balloons recurrence.', answerMd: 'Pad with 1s. dp[i][j] = max coins from bursting all balloons strictly between i and j. Choose k as the last balloon burst in that range: then (i, k) and (k, j) are independent, and bursting k last earns val[i]·val[k]·val[j]. dp[i][j] = max over k of dp[i][k] + dp[k][j] + val[i]·val[k]·val[j]. Fill by increasing j − i. O(n³).' },
    { id: 'iq2', q: 'Why iterate interval DP by length?', answerMd: 'dp[i][j] depends on strictly shorter intervals inside [i, j]. Processing lengths 1, 2, 3, … guarantees those are computed. Iterating i from n − 1 down to 0 and j from i upwards also works for many recurrences.' },
    { id: 'iq3', q: 'House Robber III: why return two values per node?', answerMd: 'Whether a node can be robbed depends on whether its children were robbed. Returning (best if robbed, best if not) lets the parent combine them: rob = val + left.skip + right.skip; skip = max(left) + max(right). Post-order, O(n).' },
    { id: 'iq4', q: 'When is bitmask DP feasible?', answerMd: 'When the state must record a subset of a small set: 2ⁿ masks times the other dimensions. With n ≤ 16 and an extra dimension of n, about 10⁶ states, fine; n = 20 gives 2·10⁷ with n transitions each, borderline; n ≥ 25 is too large.' },
    { id: 'iq5', q: 'Relate Longest Palindromic Subsequence to LCS.', answerMd: 'LPS(s) = LCS(s, reverse(s)): a common subsequence of s and its reverse is a palindrome and vice versa. The direct interval DP is dp[i][j] = dp[i+1][j−1] + 2 if s[i] == s[j], else max(dp[i+1][j], dp[i][j−1]); both are O(n²).' },
    { id: 'iq6', q: 'Minimum Cost to Cut a Stick: model it.', answerMd: 'Sort the cuts and add 0 and n. dp[i][j] = minimum cost to make all cuts strictly between cuts[i] and cuts[j]. The first cut k in that piece costs cuts[j] − cuts[i] and splits it into (i, k) and (k, j): dp[i][j] = min over k of dp[i][k] + dp[k][j] + cuts[j] − cuts[i]. O(m³) for m cuts.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Interval DP: dp[i][j] over ranges; fill by length; split at k; O(n³).
- Burst Balloons / cutting sticks: choose the LAST (or first-cut) action so sides are independent; add sentinels.
- LPS = LCS(s, reverse s); O(n²).
- Bitmask DP: dp[mask] or dp[mask][last]; n ≤ 16–20.
- Tree DP: post-order, return a tuple (rob/skip, covered/camera/uncovered).`,
    flashcards: [
      { id: 'f1', front: 'Burst Balloons: which balloon do you fix in the recurrence?', backMd: 'The one burst last in the interval, so the two sides are independent.' },
      { id: 'f2', front: 'Fill order for interval DP?', backMd: 'By increasing interval length (or i descending, j ascending).' },
      { id: 'f3', front: 'Typical cost of interval DP with a split point?', backMd: 'O(n³) time, O(n²) space.' },
      { id: 'f4', front: 'House Robber III return value?', backMd: '(best if this node is robbed, best if it is skipped).' },
      { id: 'f5', front: 'Feasible n for bitmask DP?', backMd: 'Up to about 16–20 (2ⁿ states).' },
    ],
  },
  mastery: { testSize: 6, testMinutes: 14, passPct: 75, minIndependentSolves: 2, minMediumIndependent: 1, retentionDays: 10 },
  resources: [
    { title: 'Matrix chain multiplication (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Matrix_chain_multiplication', kind: 'article' },
    { title: 'Burst Balloons (LeetCode 312)', url: 'https://leetcode.com/problems/burst-balloons/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.dp3.q1', type: 'code-output', difficulty: 'hard',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int maxCoins(vector<int> v) {
    v.insert(v.begin(), 1); v.push_back(1);
    int n = v.size();
    vector<vector<int>> dp(n, vector<int>(n, 0));
    for (int len = 2; len < n; ++len)
        for (int i = 0; i + len < n; ++i) {
            int j = i + len;
            for (int k = i + 1; k < j; ++k)
                dp[i][j] = max(dp[i][j], dp[i][k] + dp[k][j] + v[i] * v[k] * v[j]);
        }
    return dp[0][n - 1];
}
int main() {
    cout << maxCoins({3, 1, 5, 8}) << " " << maxCoins({1, 5}) << endl;
    return 0;
}`, 'C++', '167 10'),
    options: ['167 10', ['167 6', 'For [1, 5]: burst 1 first (1·1·5 = 5), then 5 (1·5·1 = 5), total 10.'], ['159 10', '159 is dp[0][4], before including the last balloon.'], ['120 10', 'Lower than the optimum.']],
    answer: 0,
    explanation: '167 is the LeetCode example. For [1, 5]: bursting 1 first earns 5 and then 5 earns 5, total 10 (bursting 5 first gives 5 + 1 = 6).',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.dp3.q2', type: 'concept', difficulty: 'medium',
    stem: 'Why does Burst Balloons choose the balloon burst LAST in an interval instead of the first?',
    options: ['If k is last, the left and right parts never become neighbours, so they are independent subproblems', ['It is faster to iterate backwards', 'Speed is the same; correctness is the issue.'], ['The first balloon always gives fewer coins', 'Not true in general.'], ['Because the array is sorted', 'It is not sorted.']],
    answer: 0,
    explanation: 'Choosing the first burst changes the neighbours of the remaining balloons, so the two sides interact. Fixing the last burst keeps k as a wall between them.',
  }),
  mcq({
    ...base, id: 'dsa.dp3.q3', type: 'complexity', difficulty: 'medium',
    stem: 'An interval DP has O(n²) states and tries O(n) split points per state. For n = 500, roughly how many operations?',
    options: ['About 2 · 10⁷ (n³/6)', ['About 2.5 · 10⁵', 'That is only the number of states.'], ['About 10¹⁰', 'n³ = 1.25 · 10⁸ is the upper bound; with i < k < j it is about n³/6.'], ['About 500', 'Far too small.']],
    answer: 0,
    explanation: 'The triple loop over i < k < j runs about C(500, 3) ≈ 2.07 · 10⁷ times, comfortably fast.',
  }),
  mcq({
    ...base, id: 'dsa.dp3.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print (House Robber III on the tree 3 → (2 → right 3), (3 → right 1))?',
    code: java(`public class Main {
    static class Node { int val; Node left, right; Node(int v) { val = v; } }
    static int[] go(Node n) {
        if (n == null) return new int[] {0, 0};
        int[] l = go(n.left), r = go(n.right);
        return new int[] {n.val + l[1] + r[1], Math.max(l[0], l[1]) + Math.max(r[0], r[1])};
    }
    public static void main(String[] args) {
        Node root = new Node(3);
        root.left = new Node(2); root.right = new Node(3);
        root.left.right = new Node(3); root.right.right = new Node(1);
        int[] p = go(root);
        System.out.println(p[0] + " " + p[1] + " " + Math.max(p[0], p[1]));
    }
}`, 'Java', '7 6 7'),
    options: ['7 6 7', ['7 5 7', 'Skipping the root allows robbing both children: 2 + 3 = 5, or better 3 + 3 = 6 via the grandchildren.'], ['6 7 7', 'p[0] is "rob the root".'], ['9 6 9', 'Adjacent houses cannot both be robbed.']],
    answer: 0,
    explanation: 'Rob root: 3 + 3 + 1 = 7 (root and both grandchildren). Skip root: best of left (rob 2 or its child 3 → 3) + best of right (3) = 6. Answer 7 (LeetCode 337 example).',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.dp3.q5', type: 'pattern', difficulty: 'medium',
    stem: 'n ≤ 12 graph nodes; find the shortest walk that visits every node (revisiting allowed). Which state space?',
    options: ['(mask of visited nodes, current node), searched with BFS', ['Current node only', 'Cannot tell which nodes are left.'], ['Number of visited nodes', 'Different sets of the same size differ.'], ['Pairs of nodes', 'Does not encode the visited set.']],
    answer: 0,
    explanation: '2¹² · 12 ≈ 49 000 states with unit edges, so BFS finds the minimum number of steps.',
  }),
  mcq({
    ...base, id: 'dsa.dp3.q6', type: 'debug', difficulty: 'medium',
    stem: 'An interval DP fills `for i in 0..n−1: for j in i+1..n−1: dp[i][j] = f(dp[i+1][j], dp[i][j−1], …)`. Why are some answers wrong?',
    options: ['dp[i+1][j] is read before it has been computed', ['dp[i][j−1] is read before it has been computed', 'For fixed i, j increases, so dp[i][j−1] is ready.'], ['The loops should start at 1', 'Indexing is not the problem.'], ['Interval DP cannot be iterative', 'It can.']],
    answer: 0,
    explanation: 'Row i + 1 is filled after row i, so dp[i+1][j] is still 0. Iterate i downwards (n − 1 to 0) or by increasing length.',
  }),
  mcq({
    ...base, id: 'dsa.dp3.q7', type: 'concept', difficulty: 'easy',
    stem: 'Longest Palindromic Subsequence of s equals which other quantity?',
    options: ['LCS(s, reverse(s))', ['The longest palindromic substring', 'A subsequence need not be contiguous.'], ['n − (number of distinct characters)', 'Unrelated.'], ['Edit distance between s and its reverse', 'That counts edits, not common characters.']],
    answer: 0,
    explanation: 'For "bbbab", LCS with "babbb" is "bbbb" (length 4), which is the LPS.',
  }),
  mcq({
    ...base, id: 'dsa.dp3.q8', type: 'complexity', difficulty: 'hard',
    stem: 'A bitmask DP has states (mask, last) with n = 20 and tries n transitions per state. Roughly how many operations?',
    options: ['About 4 · 10⁸ (2²⁰ · 20 · 20)', ['About 2 · 10⁷', 'That ignores the transition loop.'], ['About 10⁶', 'That is only 2²⁰.'], ['About 10¹²', 'Overestimated.']],
    answer: 0,
    explanation: '2²⁰ ≈ 10⁶ masks × 20 last nodes × 20 transitions ≈ 4.2 · 10⁸: borderline in C++, likely too slow in Java. Prune unreachable states or reduce n.',
  }),
];
