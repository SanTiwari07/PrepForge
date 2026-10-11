import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.fenwick-segment';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Fenwick and Segment Trees',
  summary: 'Range queries with point updates in O(log n).',
  level: 'advanced',
  status: 'complete',
  estMinutes: 100,
  prerequisites: ['dsa.prefix-sums', 'dsa.binary-trees'],
  related: ['dsa.prefix-sums', 'dsa.divide-conquer', 'dsa.advanced-patterns', 'dsa.bit-manipulation'],
  subtopics: ['When prefix sums are not enough', 'Fenwick tree (binary indexed tree)', 'Segment tree: build, point update, range query', 'Other merge operations (min, max, gcd)', 'Counting with a Fenwick tree over values', 'Coordinate compression', 'Lazy propagation (overview)'],
  objectives: [
    'Explain why a static prefix-sum array fails when values change, and what a Fenwick or segment tree costs instead.',
    'Implement a Fenwick tree (1-indexed, i & −i) for point updates and prefix sums in O(log n).',
    'Implement an iterative or recursive segment tree for any associative operation (sum, min, max, gcd).',
    'Count inversions or "smaller numbers after self" with a Fenwick tree over compressed values.',
    'Know when lazy propagation is needed (range updates with range queries) and its complexity.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Prefix sums break when values change',
      bodyMd: `A prefix-sum array answers range sums in O(1), but a single update a[i] += d changes every prefix after i: O(n). With many updates and queries interleaved, you need a structure that balances both:

| Structure | Point update | Range query | Range update | Notes |
|---|---|---|---|---|
| Plain array | O(1) | O(n) | O(n) | |
| Prefix sums | O(n) | O(1) | O(n) | static data |
| **Fenwick tree** | O(log n) | O(log n) (sums via prefixes) | O(log n) with the difference trick | tiny code, invertible operations |
| **Segment tree** | O(log n) | O(log n) | O(log n) with lazy propagation | any associative operation |

**Fenwick tree (BIT):** an array \`bit[1..n]\` where \`bit[i]\` stores the sum of the range (i − lowbit(i), i], with lowbit(i) = i & −i.
- \`add(i, d)\`: for (; i ≤ n; i += i & −i) bit[i] += d
- \`prefix(i)\`: for (; i > 0; i −= i & −i) sum += bit[i]
- range sum (l, r) = prefix(r) − prefix(l − 1).

Each loop touches at most ⌊log₂ n⌋ + 1 indices. It works for operations with an inverse (sum, XOR); for min/max over arbitrary ranges use a segment tree.

**Segment tree:** a binary tree over the array where each node stores the merged value (sum, min, …) of its segment. A range query combines O(log n) nodes that exactly cover the range; a point update recomputes the O(log n) ancestors of one leaf.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Counting with a Fenwick tree, and lazy propagation',
      bodyMd: `**Counting over values.** To count, for each element, how many later elements are smaller (Count of Smaller Numbers After Self): scan from the right; for each x, query how many already-inserted values are < x (prefix(rank(x) − 1)), then insert x (add(rank(x), 1)). Values can be large or negative, so first **compress coordinates**: sort the distinct values and replace each value by its rank 1..m. O(n log n) overall. The same idea counts inversions, reverse pairs (with careful ranking of 2·x) and range-sum counts.

**Segment tree layout.** The common iterative layout puts the leaves at indices n..2n−1 of an array of size 2n, and node i's children at 2i and 2i + 1. Queries walk l and r upwards. The recursive layout (node, segment [lo, hi]) needs about 4n space but is easier to extend.

**Lazy propagation.** For range updates ("add 5 to every element in [l, r]") combined with range queries, store a pending update at each node and push it down to the children only when a query or update needs to go below that node. Both operations stay O(log n). For range update + point query only, a Fenwick tree over the difference array suffices: add(l, d), add(r + 1, −d), and the value at i is prefix(i).

**In interviews,** Fenwick/segment trees are an advanced follow-up ("what if the array is updated?" for Range Sum Query), and appear in harder OA questions. Knowing the Fenwick template by heart is usually enough.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: Fenwick tree on a = [3, 2, −1, 6, 5] (1-indexed)',
      bodyMd: 'bit[i] covers (i − lowbit(i), i]. lowbit: 1→1, 2→2, 3→1, 4→4, 5→1.',
      trace: [
        { note: 'Built: bit[1] = a1 = 3, bit[2] = a1+a2 = 5, bit[3] = a3 = −1, bit[4] = a1..a4 = 10, bit[5] = a5 = 5.', array: [3, 5, -1, 10, 5] },
        { note: 'prefix(5): bit[5] = 5, then i = 5 − 1 = 4: + bit[4] = 15, then i = 0. Sum = 15.', array: [3, 5, -1, 10, 5], highlight: [4, 3], vars: { prefix5: 15 } },
        { note: 'prefix(3): bit[3] = −1, i = 2: + bit[2] = 4. sum(3..5) = 15 − 4 = 11.', array: [3, 5, -1, 10, 5], highlight: [2, 1], vars: { 'sum(3..5)': 11 } },
        { note: 'add(3, +4) (a3 becomes 3): i = 3 → bit[3] = 3; i = 4 → bit[4] = 14; i = 8 > 5, stop.', array: [3, 5, 3, 14, 5], highlight: [2, 3] },
        { note: 'prefix(4) is now bit[4] = 14 = 3 + 2 + 3 + 6. Two indices touched by the update, two by the query.', array: [3, 5, 3, 14, 5], highlight: [3], vars: { prefix4: 14 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Fenwick tree, an iterative segment tree for range minimum, and Count of Smaller Numbers After Self.',
      code: [
        cpp(`
struct Fenwick {
    int n; vector<long long> bit;
    Fenwick(int n) : n(n), bit(n + 1, 0) {}
    void add(int i, long long d) { for (; i <= n; i += i & -i) bit[i] += d; }      // 1-indexed
    long long prefix(int i) const { long long s = 0; for (; i > 0; i -= i & -i) s += bit[i]; return s; }
    long long range(int l, int r) const { return prefix(r) - prefix(l - 1); }
};

struct MinSegTree {                       // iterative: leaves at [n, 2n)
    int n; vector<int> t;
    MinSegTree(const vector<int>& a) : n(a.size()), t(2 * a.size()) {
        for (int i = 0; i < n; ++i) t[n + i] = a[i];
        for (int i = n - 1; i > 0; --i) t[i] = min(t[2 * i], t[2 * i + 1]);
    }
    void set(int i, int v) { for (t[i += n] = v; i > 1; i /= 2) t[i / 2] = min(t[i], t[i ^ 1]); }
    int query(int l, int r) const {       // min over [l, r)
        int res = INT_MAX;
        for (l += n, r += n; l < r; l /= 2, r /= 2) {
            if (l & 1) res = min(res, t[l++]);
            if (r & 1) res = min(res, t[--r]);
        }
        return res;
    }
};

vector<int> countSmaller(const vector<int>& nums) {
    vector<int> vals(nums);
    sort(vals.begin(), vals.end());
    vals.erase(unique(vals.begin(), vals.end()), vals.end());   // coordinate compression
    Fenwick fw(vals.size());
    vector<int> out(nums.size());
    for (int i = (int)nums.size() - 1; i >= 0; --i) {
        int r = lower_bound(vals.begin(), vals.end(), nums[i]) - vals.begin() + 1;   // rank 1..m
        out[i] = (int)fw.prefix(r - 1);                          // strictly smaller, already to the right
        fw.add(r, 1);
    }
    return out;
}`, 'C++'),
        java(`
static class Fenwick {
    final int n; final long[] bit;
    Fenwick(int n) { this.n = n; bit = new long[n + 1]; }
    void add(int i, long d) { for (; i <= n; i += i & -i) bit[i] += d; }
    long prefix(int i) { long s = 0; for (; i > 0; i -= i & -i) s += bit[i]; return s; }
    long range(int l, int r) { return prefix(r) - prefix(l - 1); }
}

static class MinSegTree {
    final int n; final int[] t;
    MinSegTree(int[] a) {
        n = a.length; t = new int[2 * n];
        for (int i = 0; i < n; i++) t[n + i] = a[i];
        for (int i = n - 1; i > 0; i--) t[i] = Math.min(t[2 * i], t[2 * i + 1]);
    }
    void set(int i, int v) { for (t[i += n] = v; i > 1; i /= 2) t[i / 2] = Math.min(t[i], t[i ^ 1]); }
    int query(int l, int r) {             // min over [l, r)
        int res = Integer.MAX_VALUE;
        for (l += n, r += n; l < r; l /= 2, r /= 2) {
            if ((l & 1) == 1) res = Math.min(res, t[l++]);
            if ((r & 1) == 1) res = Math.min(res, t[--r]);
        }
        return res;
    }
}

List<Integer> countSmaller(int[] nums) {
    int[] vals = Arrays.stream(nums).distinct().sorted().toArray();
    Fenwick fw = new Fenwick(vals.length);
    Integer[] out = new Integer[nums.length];
    for (int i = nums.length - 1; i >= 0; i--) {
        int r = Arrays.binarySearch(vals, nums[i]) + 1;
        out[i] = (int) fw.prefix(r - 1);
        fw.add(r, 1);
    }
    return Arrays.asList(out);
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Fenwick: O(log n) per add and prefix query; O(n) space; building by n adds is O(n log n) (an O(n) build exists: add each bit[i] into bit[i + lowbit(i)]).
- Segment tree: O(n) build, O(log n) per point update and range query; 2n (iterative) or about 4n (recursive) space.
- With lazy propagation: O(log n) per range update and range query.
- Counting with a Fenwick tree over compressed values: O(n log n) including the sort.
- For static data, prefer prefix sums (sums) or a sparse table (min/max, O(1) queries after O(n log n) build).`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Using index 0 in a Fenwick tree:** i & −i is 0 for i = 0, so add(0, d) loops forever. Shift to 1-indexed.
2. **Updating with the new value instead of the difference:** a Fenwick add takes a delta; to set a[i] = v, add v − a[i] and remember a[i].
3. **Fenwick for range min:** min has no inverse, so prefix(r) − prefix(l − 1) does not apply. Use a segment tree.
4. **Inclusive vs exclusive bounds** in iterative segment trees ([l, r) above).
5. **Forgetting coordinate compression** when values are up to 10⁹ or negative.
6. **Equal values when counting "strictly smaller":** query prefix(rank − 1), not prefix(rank).
7. **Overflow** in sums of many large values; use 64-bit nodes.`,
    },
  ],
  recognition: {
    signals: ['Interleaved updates and range queries (sum, min, max)', '"Count elements to the right that are smaller", inversions, reverse pairs', 'Many range-add operations with point or range reads', 'Follow-up: "what if the array changes?" on a prefix-sum question'],
    antiSignals: ['No updates: prefix sums or a sparse table', 'Queries only at the ends: a heap or a deque', 'Small n (≤ 10³) with few queries: brute force is fine'],
    decisionQuestions: ['Is the operation invertible (sum/XOR → Fenwick) or only associative (min/max/gcd → segment tree)?', 'Are updates point or range? Are queries point or range?', 'Do values need compressing?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Range Sum Query with updates: what do you use and why?', answerMd: 'A Fenwick tree (or segment tree). Prefix sums give O(1) queries but O(n) updates; a plain array gives O(1) updates but O(n) queries. A Fenwick tree makes both O(log n) with about ten lines of code. Store the current array to convert "set a[i] = v" into "add v − a[i]".' },
    { id: 'iq2', q: 'Explain why a Fenwick update loop uses i += i & −i.', answerMd: 'bit[i] covers (i − lowbit(i), i]. The nodes whose ranges contain position i are exactly i, i + lowbit(i), and so on: adding the lowest set bit moves to the next range that also covers i. Each step increases the position of the lowest set bit, so there are O(log n) steps.' },
    { id: 'iq3', q: 'Count of Smaller Numbers After Self in O(n log n).', answerMd: 'Compress values to ranks. Scan from right to left: the answer for i is the number of inserted ranks below rank(nums[i]), i.e. prefix(rank − 1) in a Fenwick tree; then add 1 at rank(nums[i]). Merge sort with index tracking is the alternative.' },
    { id: 'iq4', q: 'When do you need a segment tree rather than a Fenwick tree?', answerMd: 'When the operation has no inverse (range min/max/gcd), when you need range updates with range queries (lazy propagation), or when nodes store richer data (for example best prefix/suffix/total to answer range maximum-subarray queries).' },
    { id: 'iq5', q: 'What is lazy propagation?', answerMd: 'For range updates, store the update at the highest nodes that fully cover the range instead of updating every leaf, and push it down to children only when later operations need to descend there. Range update and range query both stay O(log n).' },
    { id: 'iq6', q: 'How would you answer range-minimum queries on a static array?', answerMd: 'A sparse table: st[k][i] = min of a[i .. i + 2^k − 1], built in O(n log n). A query [l, r] takes the min of two overlapping power-of-two blocks: O(1). A segment tree also works (O(log n) per query) and supports updates.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Prefix sums: static only. Fenwick/segment tree: O(log n) update + query.
- Fenwick (1-indexed): add i += i&−i; prefix i −= i&−i; range = prefix(r) − prefix(l−1).
- Fenwick needs an inverse (sum, XOR); min/max → segment tree.
- Iterative segment tree: leaves at n..2n−1; query [l, r) walking up.
- Counting after self / inversions: compress, scan right-to-left, prefix(rank − 1).
- Range update + range query → lazy propagation.`,
    flashcards: [
      { id: 'f1', front: 'Fenwick update loop?', backMd: '`for (; i <= n; i += i & -i) bit[i] += d;` (1-indexed).' },
      { id: 'f2', front: 'Fenwick prefix-sum loop?', backMd: '`for (; i > 0; i -= i & -i) s += bit[i];`' },
      { id: 'f3', front: 'Why can\'t a Fenwick tree do arbitrary range minimum?', backMd: 'Min has no inverse, so a range cannot be obtained by subtracting two prefixes.' },
      { id: 'f4', front: 'What is coordinate compression?', backMd: 'Replace values by their rank among the sorted distinct values, so a Fenwick tree over 1..m works for large or negative values.' },
      { id: 'f5', front: 'Range update + point query with a Fenwick tree?', backMd: 'Use a difference array: add(l, d), add(r + 1, −d); the value at i is prefix(i).' },
    ],
  },
  mastery: { testSize: 6, testMinutes: 12, passPct: 75, minIndependentSolves: 2, minMediumIndependent: 1, retentionDays: 10 },
  resources: [
    { title: 'Fenwick tree (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Fenwick_tree', kind: 'article' },
    { title: 'Segment tree (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Segment_tree', kind: 'article' },
    { title: 'Range Sum Query - Mutable (LeetCode 307)', url: 'https://leetcode.com/problems/range-sum-query-mutable/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.fenwick.q1', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
using namespace std;
int n = 5;
vector<long long> bit(n + 1, 0);
void add(int i, long long d) { for (; i <= n; i += i & -i) bit[i] += d; }
long long prefix(int i) { long long s = 0; for (; i > 0; i -= i & -i) s += bit[i]; return s; }
int main() {
    int a[] = {3, 2, -1, 6, 5};
    for (int i = 0; i < 5; ++i) add(i + 1, a[i]);
    cout << prefix(5) << " " << prefix(5) - prefix(2) << " ";
    add(3, 4);
    cout << prefix(4) << " " << bit[4] << endl;
    return 0;
}`, 'C++', '15 10 14 14'),
    options: ['15 10 14 14', ['15 11 14 14', 'prefix(5) − prefix(2) = 15 − 5 = 10 (elements 3..5).'], ['15 10 10 14', 'The update adds 4 to a3, so prefix(4) grows from 10 to 14.'], ['15 10 14 10', 'bit[4] covers a1..a4 and was updated.']],
    answer: 0,
    explanation: 'Sum of all = 15; a3 + a4 + a5 = −1 + 6 + 5 = 10. After a3 += 4, prefix(4) = 3 + 2 + 3 + 6 = 14, which is exactly bit[4] since it covers (0, 4].',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.fenwick.q2', type: 'concept', difficulty: 'easy',
    stem: 'Why must a Fenwick tree be 1-indexed?',
    options: ['i & −i is 0 for i = 0, so the update loop would never advance', ['Because C++ arrays start at 1', 'They start at 0.'], ['To save memory', 'It uses one extra slot.'], ['Because prefix sums start at 1', 'That is a convention, not the reason.']],
    answer: 0,
    explanation: 'With i = 0, i += i & −i leaves i at 0 forever. Shift user indices by one.',
  }),
  mcq({
    ...base, id: 'dsa.fenwick.q3', type: 'complexity', difficulty: 'medium',
    stem: 'An array of n = 10⁵ values gets 10⁵ updates interleaved with 10⁵ range-sum queries. Which is best?',
    options: ['Fenwick tree: about 2·10⁵ · 17 operations', ['Recompute prefix sums after each update', '10⁵ updates × 10⁵ = 10¹⁰.'], ['Plain array and sum each query', '10⁵ queries × 10⁵ = 10¹⁰.'], ['Sort the array first', 'Sorting destroys positions.']],
    answer: 0,
    explanation: 'log₂ 10⁵ ≈ 17 steps per operation, so a few million steps in total.',
  }),
  mcq({
    ...base, id: 'dsa.fenwick.q4', type: 'pattern', difficulty: 'medium',
    stem: 'You need range minimum queries with point updates. Which structure?',
    options: ['Segment tree', ['Fenwick tree with prefix(r) − prefix(l − 1)', 'Min cannot be subtracted.'], ['Prefix-minimum array', 'It answers only prefixes and breaks on updates.'], ['Hash map', 'No range structure.']],
    answer: 0,
    explanation: 'Segment trees combine any associative operation over O(log n) nodes, and point updates recompute O(log n) ancestors.',
  }),
  mcq({
    ...base, id: 'dsa.fenwick.q5', type: 'code-output', difficulty: 'hard',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    static long[] bit;
    static int n;
    static void add(int i) { for (; i <= n; i += i & -i) bit[i]++; }
    static long prefix(int i) { long s = 0; for (; i > 0; i -= i & -i) s += bit[i]; return s; }
    public static void main(String[] args) {
        int[] nums = {5, 2, 6, 1};
        int[] vals = Arrays.stream(nums).distinct().sorted().toArray();
        n = vals.length; bit = new long[n + 1];
        int[] out = new int[nums.length];
        for (int i = nums.length - 1; i >= 0; i--) {
            int r = Arrays.binarySearch(vals, nums[i]) + 1;
            out[i] = (int) prefix(r - 1);
            add(r);
        }
        System.out.println(Arrays.toString(out));
    }
}`, 'Java', '[2, 1, 1, 0]'),
    options: ['[2, 1, 1, 0]', ['[3, 1, 1, 0]', 'Only 2 and 1 are smaller than 5 to its right.'], ['[2, 1, 0, 0]', '1 is to the right of 6 and smaller.'], ['[0, 1, 1, 2]', 'The scan goes right to left, but the answers are stored by index.']],
    answer: 0,
    explanation: 'Right of 5: {2, 6, 1} → 2 smaller. Right of 2: {6, 1} → 1. Right of 6: {1} → 1. Right of 1: none (LeetCode 315 example).',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.fenwick.q6', type: 'debug', difficulty: 'medium',
    stem: 'A Fenwick solution for "set a[i] = v" calls `add(i, v)`. Queries are wrong after the second update to the same index. Why?',
    options: ['add expects a delta; it should add v − a[i] and then store a[i] = v', ['The tree must be rebuilt after every update', 'O(log n) updates are the point.'], ['add must be called with i − 1', 'Indexing is not the issue.'], ['Fenwick trees cannot handle repeated updates', 'They can, with deltas.']],
    answer: 0,
    explanation: 'Adding v accumulates on top of the old value. Keep the current array and add the difference.',
  }),
  mcq({
    ...base, id: 'dsa.fenwick.q7', type: 'concept', difficulty: 'medium',
    stem: 'For range updates "add d to a[l..r]" and point queries "value of a[i]", what is the simplest O(log n) approach?',
    options: ['Fenwick tree over the difference array: add(l, d), add(r + 1, −d); value(i) = prefix(i)', ['A segment tree with lazy propagation', 'Works, but heavier than needed for point queries.'], ['Prefix sums recomputed after each update', 'O(n) per update.'], ['A heap of updates', 'A heap cannot answer positional queries.']],
    answer: 0,
    explanation: 'Prefix sums of the difference array reconstruct the values, so the Fenwick prefix query returns a[i] directly.',
  }),
  mcq({
    ...base, id: 'dsa.fenwick.q8', type: 'complexity', difficulty: 'easy',
    stem: 'What is the memory of an iterative segment tree with leaves stored at indices n..2n−1?',
    options: ['O(n): an array of 2n entries', ['O(n log n)', 'Each element is stored once per level only implicitly; the array has 2n slots.'], ['O(n²)', 'Far too large.'], ['O(log n)', 'There are n leaves.']],
    answer: 0,
    explanation: 'n leaves plus n − 1 internal nodes. The recursive layout usually allocates 4n to be safe.',
  }),
];
