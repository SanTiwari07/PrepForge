import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.advanced-patterns';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Advanced Patterns',
  summary: 'Meet in the middle, coordinate compression and sweep line.',
  level: 'advanced',
  status: 'complete',
  estMinutes: 95,
  prerequisites: ['dsa.sorting', 'dsa.binary-search'],
  related: ['dsa.intervals', 'dsa.fenwick-segment', 'dsa.bit-manipulation', 'dsa.heaps', 'dsa.prefix-sums'],
  subtopics: ['Meet in the middle (2ⁿ → 2^(n/2))', 'Coordinate compression', 'Sweep line over events', 'Sweep line with a heap or multiset (skyline)', 'Difference arrays on compressed coordinates', 'Area of union of rectangles (overview)'],
  objectives: [
    'Recognise when n ≈ 40 rules out 2ⁿ but allows 2^(n/2), and combine two half-enumerations with sorting and binary search.',
    'Compress large or sparse coordinates to ranks so arrays, prefix sums or Fenwick trees can index them.',
    'Turn interval problems into sorted events and sweep them while maintaining a count, a heap or a multiset.',
    'Solve The Skyline Problem with a sweep line and a max-multiset (or a heap with lazy deletion).',
    'Choose between a difference array, a sweep line and a segment tree based on the coordinate range and the query type.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Three ideas that unlock hard problems',
      bodyMd: `**Meet in the middle.** Enumerating all subsets of 40 items is 2⁴⁰ ≈ 10¹² (impossible), but each half has only 2²⁰ ≈ 10⁶ subsets. Enumerate the subset sums of each half, sort one list, and for each sum in the other list binary-search the best partner. Total O(2^(n/2) · n). Examples: Closest Subsequence Sum (target closest to a goal), Partition Array Into Two Arrays to Minimize Sum Difference (group the half-sums by subset size first).

**Coordinate compression.** When values are up to 10⁹ (or negative) but there are only n of them, replace each value with its rank among the sorted distinct values. Order is preserved, so comparisons, prefix sums and Fenwick trees work on indices 0..n−1 instead of the huge range.

**Sweep line.** Convert intervals or rectangles into **events** at their boundaries, sort the events, and process them in order while maintaining the "active set": a counter (maximum overlap, car pooling), a multiset or heap (skyline: the tallest active building), or a segment tree (union area of rectangles). Between consecutive events nothing changes, so you only compute at event points.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Skyline and other sweeps in detail',
      bodyMd: `**The Skyline Problem:** buildings [left, right, height]. The outline changes only at building edges.
1. Events: (left, −height) for starts, (right, +height) for ends. Sort by x; at equal x, the negative heights (starts) come first and taller starts before shorter ones, which avoids spurious points.
2. Keep a max-multiset of active heights, initialised with 0.
3. For each event, insert (start) or erase one copy (end) of the height; if the maximum changed, emit (x, new maximum).

With a heap instead of a multiset, removal is lazy: store (height, right edge) and pop the top while its right edge ≤ the current x.

**Car Pooling / Meeting Rooms II** are sweeps with a simple counter: +passengers at pickup, −passengers at drop-off, sorted by position (drop-offs first on ties when a seat frees exactly there). If the positions are small (≤ 1000), a difference array replaces the sort.

**My Calendar III** (maximum k-booking after each booking): keep a sorted map from position to delta (+1 at start, −1 at end) and re-sweep the map after each booking: O(n) per booking, O(n²) total, fine for n ≤ 400. A segment tree with lazy propagation gives O(log C) per booking.

**Rectangle Area II** (union area): compress the y-coordinates, sweep over x, and keep for each compressed y-segment how many rectangles cover it; the covered length times the x-gap adds to the area. O(n²) with a plain array, O(n log n) with a segment tree.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: skyline of [[2,9,10],[3,7,15],[5,12,12]]',
      bodyMd: 'Sorted events (x, h) with starts as negative heights: (2,−10), (3,−15), (5,−12), (7,15), (9,10), (12,12). The array shows the active heights.',
      trace: [
        { note: 'x = 2: add 10. Max 0 → 10: emit (2, 10).', array: [0, 10], vars: { out: '(2,10)' } },
        { note: 'x = 3: add 15. Max 10 → 15: emit (3, 15).', array: [0, 10, 15], vars: { out: '(2,10) (3,15)' } },
        { note: 'x = 5: add 12. Max stays 15: no point.', array: [0, 10, 12, 15], vars: { out: '(2,10) (3,15)' } },
        { note: 'x = 7: remove 15. Max 15 → 12: emit (7, 12).', array: [0, 10, 12], vars: { out: '(2,10) (3,15) (7,12)' } },
        { note: 'x = 9: remove 10. Max stays 12. x = 12: remove 12. Max → 0: emit (12, 0).', array: [0], vars: { out: '(2,10) (3,15) (7,12) (12,0)' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Meet in the middle for the closest subsequence sum, coordinate compression, and the skyline sweep.',
      code: [
        cpp(`
vector<long long> subsetSums(const vector<int>& a, int lo, int hi) {   // all sums of a[lo, hi)
    vector<long long> s = {0};
    for (int i = lo; i < hi; ++i) {
        int k = s.size();
        for (int j = 0; j < k; ++j) s.push_back(s[j] + a[i]);
    }
    return s;
}
long long minAbsDifference(const vector<int>& a, long long goal) {     // n <= 40
    int n = a.size();
    vector<long long> L = subsetSums(a, 0, n / 2), R = subsetSums(a, n / 2, n);
    sort(R.begin(), R.end());
    long long best = LLONG_MAX;
    for (long long x : L) {
        auto it = lower_bound(R.begin(), R.end(), goal - x);       // closest partner >= goal - x
        if (it != R.end()) best = min(best, llabs(x + *it - goal));
        if (it != R.begin()) best = min(best, llabs(x + *prev(it) - goal));
    }
    return best;
}

vector<int> compress(const vector<int>& a) {                         // value -> rank 0..m-1
    vector<int> vals(a);
    sort(vals.begin(), vals.end());
    vals.erase(unique(vals.begin(), vals.end()), vals.end());
    vector<int> r(a.size());
    for (size_t i = 0; i < a.size(); ++i) r[i] = lower_bound(vals.begin(), vals.end(), a[i]) - vals.begin();
    return r;
}

vector<vector<int>> getSkyline(const vector<vector<int>>& b) {
    vector<pair<int, int>> ev;                                       // (x, -h) start, (x, h) end
    for (auto& x : b) { ev.push_back({x[0], -x[2]}); ev.push_back({x[1], x[2]}); }
    sort(ev.begin(), ev.end());
    multiset<int> active = {0};
    vector<vector<int>> out;
    int prevMax = 0;
    for (auto& e : ev) {
        if (e.second < 0) active.insert(-e.second);
        else active.erase(active.find(e.second));                    // erase ONE copy
        int cur = *active.rbegin();
        if (cur != prevMax) { out.push_back({e.first, cur}); prevMax = cur; }
    }
    return out;
}`, 'C++'),
        java(`
long[] subsetSums(int[] a, int lo, int hi) {
    long[] s = new long[1 << (hi - lo)];
    int size = 1;
    for (int i = lo; i < hi; i++) {
        for (int j = 0; j < size; j++) s[size + j] = s[j] + a[i];
        size *= 2;
    }
    return s;
}
long minAbsDifference(int[] a, long goal) {
    int n = a.length;
    long[] L = subsetSums(a, 0, n / 2), R = subsetSums(a, n / 2, n);
    Arrays.sort(R);
    long best = Long.MAX_VALUE;
    for (long x : L) {
        int lo = 0, hi = R.length;                                     // first index with R >= goal - x
        while (lo < hi) { int mid = (lo + hi) >>> 1; if (R[mid] < goal - x) lo = mid + 1; else hi = mid; }
        if (lo < R.length) best = Math.min(best, Math.abs(x + R[lo] - goal));
        if (lo > 0) best = Math.min(best, Math.abs(x + R[lo - 1] - goal));
    }
    return best;
}

int[] compress(int[] a) {
    int[] vals = Arrays.stream(a).distinct().sorted().toArray();
    int[] r = new int[a.length];
    for (int i = 0; i < a.length; i++) r[i] = Arrays.binarySearch(vals, a[i]);
    return r;
}

List<List<Integer>> getSkyline(int[][] b) {
    List<int[]> ev = new ArrayList<>();
    for (int[] x : b) { ev.add(new int[] {x[0], -x[2]}); ev.add(new int[] {x[1], x[2]}); }
    ev.sort((p, q) -> p[0] != q[0] ? Integer.compare(p[0], q[0]) : Integer.compare(p[1], q[1]));
    TreeMap<Integer, Integer> active = new TreeMap<>();               // height -> count
    active.put(0, 1);
    List<List<Integer>> out = new ArrayList<>();
    int prevMax = 0;
    for (int[] e : ev) {
        if (e[1] < 0) active.merge(-e[1], 1, Integer::sum);
        else if (active.merge(e[1], -1, Integer::sum) == 0) active.remove(e[1]);
        int cur = active.lastKey();
        if (cur != prevMax) { out.add(List.of(e[0], cur)); prevMax = cur; }
    }
    return out;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Meet in the middle: O(2^(n/2)) sums per half, O(2^(n/2) · n) with sorting and binary search. For n = 40: about 10⁶ · 20 = 2 · 10⁷ operations, versus 10¹² for brute force. Memory O(2^(n/2)).
- Coordinate compression: O(n log n).
- Sweep line with a counter: O(n log n) for sorting events, O(n) to sweep.
- Skyline: O(n log n) with a multiset or TreeMap (each insert/erase O(log n)).
- Union area of rectangles: O(n²) with compressed coordinates and an array, O(n log n) with a segment tree.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Skyline tie order:** at the same x, process starts before ends and taller starts first; otherwise you emit extra points (or drop one).
2. **multiset.erase(value)** removing every equal height instead of one.
3. **Meet in the middle without sorting** one half (then the search is O(2^(n/2)) per element).
4. **Forgetting the empty subset** (sum 0) in each half.
5. **Compressing only some of the coordinates** you will query (for example rectangle edges but not query points), so a lookup fails.
6. **Overflow** in subset sums of 20 values up to 10⁷ (fine in 32 bits) vs 10⁹ (needs 64 bits).
7. **Using a sweep when the coordinate range is tiny:** a difference array is simpler.`,
    },
  ],
  recognition: {
    signals: ['n ≈ 30–40 and subsets: meet in the middle', 'Values up to 10⁹ used as indices: compress', 'Many intervals, rectangles or buildings: events and a sweep', 'Outline, union area, maximum overlap, k-booking'],
    antiSignals: ['n ≤ 20: plain bitmask enumeration', 'n ≥ 60 with subsets: there must be structure (DP, greedy)', 'A small coordinate range: difference arrays'],
    decisionQuestions: ['Can I split the input into two halves whose results combine with a sorted search?', 'What changes only at event points, and what structure keeps the active set?', 'What is the tie-break order at equal coordinates?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'What is meet in the middle, and when does it apply?', answerMd: 'Split the items into two halves, enumerate all 2^(n/2) results of each half, and combine them with sorting + binary search (or two pointers). It reduces O(2ⁿ) to O(2^(n/2) · n), which makes n ≈ 40 feasible. It applies when a full solution is a combination of independent choices from each half.' },
    { id: 'iq2', q: 'Explain the skyline sweep.', answerMd: 'Create start events (x, −h) and end events (x, h); sort them. Maintain a multiset of active heights containing 0. On a start insert h, on an end remove one h; after each event, if the maximum active height differs from the previous maximum, output (x, max). Sorting negative start heights first handles ties. O(n log n).' },
    { id: 'iq3', q: 'Why and how do you compress coordinates?', answerMd: 'Arrays and Fenwick trees need small indices, but values may be large, sparse or negative. Sort the distinct values and replace each value by its index (binary search or a hash map). Order and equality are preserved, which is all that comparisons, prefix sums and Fenwick queries need.' },
    { id: 'iq4', q: 'Car Pooling: sort-based sweep or difference array?', answerMd: 'With positions ≤ 1000 (as on LeetCode), a difference array over positions is simplest: add passengers at the start, subtract at the end, prefix-sum and check against capacity. With large positions, sort the events (drop-offs before pickups at the same position) and sweep with a counter. Both are linear or O(n log n).' },
    { id: 'iq5', q: 'How would you compute the area covered by overlapping rectangles?', answerMd: 'Compress the y-coordinates into elementary segments. Sweep x over the rectangle edges: between consecutive x values, area += (covered y-length) × (x gap). At each left edge increment the cover count of its y-segments, at each right edge decrement. With a segment tree storing cover counts and covered lengths, each update is O(log n).' },
    { id: 'iq6', q: 'Partition Array Into Two Arrays to Minimize Sum Difference with 2n ≤ 30: why is plain meet in the middle not enough?', answerMd: 'Both parts must have exactly n elements. Enumerate each half\'s subsets grouped by size: for k elements taken from the left half, the right half must contribute n − k. Sort each right-half group and binary-search the partner closest to (total/2 − leftSum). O(2ⁿ · n).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Meet in the middle: enumerate halves (2^(n/2)), sort one, binary-search partners; n ≤ ~40.
- Compression: sorted distinct values → ranks.
- Sweep: events at boundaries, sorted; maintain counter / multiset / segment tree.
- Skyline: (x, −h) starts, (x, h) ends; max-multiset with 0; emit when the max changes; erase one copy.
- Small ranges → difference arrays.`,
    flashcards: [
      { id: 'f1', front: 'Meet in the middle turns 2ⁿ into…?', backMd: 'O(2^(n/2) · n), using sorting and binary search to combine the halves.' },
      { id: 'f2', front: 'Skyline event encoding?', backMd: 'Start (x, −h), end (x, h); sorting handles the ties.' },
      { id: 'f3', front: 'Why start the skyline multiset with 0?', backMd: 'So the maximum is 0 when no building is active (the ground).' },
      { id: 'f4', front: 'What does coordinate compression preserve?', backMd: 'Order and equality of values.' },
      { id: 'f5', front: 'When does a difference array beat a sweep line?', backMd: 'When the coordinate range is small enough to allocate an array over it.' },
    ],
  },
  mastery: { testSize: 6, testMinutes: 12, passPct: 75, minIndependentSolves: 2, minMediumIndependent: 1, retentionDays: 10 },
  resources: [
    { title: 'Sweep line algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Sweep_line_algorithm', kind: 'article' },
    { title: 'Closest Subsequence Sum (LeetCode 1755)', url: 'https://leetcode.com/problems/closest-subsequence-sum/', kind: 'practice' },
    { title: 'The Skyline Problem (LeetCode 218)', url: 'https://leetcode.com/problems/the-skyline-problem/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.advp.q1', type: 'complexity', difficulty: 'medium',
    stem: 'n = 40 numbers; find a subset whose sum is closest to a goal. Roughly how much work does meet in the middle need?',
    options: ['About 2²⁰ · 20 ≈ 2 · 10⁷ operations', ['About 2⁴⁰ ≈ 10¹² operations', 'That is brute force over all subsets.'], ['About 40² operations', 'Subset problems are not polynomial in general.'], ['About 40 · log 40 operations', 'Far too small.']],
    answer: 0,
    explanation: 'Each half has 2²⁰ ≈ 10⁶ subset sums; sorting one half and binary-searching for each element of the other costs about 10⁶ · 20.',
  }),
  mcq({
    ...base, id: 'dsa.advp.q2', type: 'code-output', difficulty: 'hard',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <set>
#include <algorithm>
using namespace std;
int main() {
    vector<vector<int>> b = {{2, 9, 10}, {3, 7, 15}, {5, 12, 12}};
    vector<pair<int, int>> ev;
    for (auto& x : b) { ev.push_back({x[0], -x[2]}); ev.push_back({x[1], x[2]}); }
    sort(ev.begin(), ev.end());
    multiset<int> active = {0};
    int prevMax = 0;
    for (auto& e : ev) {
        if (e.second < 0) active.insert(-e.second);
        else active.erase(active.find(e.second));
        int cur = *active.rbegin();
        if (cur != prevMax) { cout << "(" << e.first << "," << cur << ") "; prevMax = cur; }
    }
    cout << endl;
    return 0;
}`, 'C++', '(2,10) (3,15) (7,12) (12,0)'),
    options: ['(2,10) (3,15) (7,12) (12,0)', ['(2,10) (3,15) (5,12) (7,12) (12,0)', 'At x = 5 the maximum is still 15, so no point is emitted.'], ['(2,10) (3,15) (7,10) (12,0)', 'The 12-high building is still active at x = 7.'], ['(2,10) (3,15) (7,12) (9,12) (12,0)', 'Removing 10 at x = 9 does not change the maximum.']],
    answer: 0,
    explanation: 'Points appear only when the tallest active height changes: up to 10 at 2, 15 at 3, down to 12 at 7, and to the ground at 12.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.advp.q3', type: 'concept', difficulty: 'easy',
    stem: 'What does coordinate compression do to the values [1000000, −5, 300, 1000000]?',
    options: ['Maps them to [2, 0, 1, 2]', ['Maps them to [0, 1, 2, 3]', 'Equal values must get equal ranks and order must be preserved.'], ['Maps them to [3, 0, 2, 3]', 'Ranks count distinct values: there are 3.'], ['Divides them by the maximum', 'Compression maps to ranks, not to fractions.']],
    answer: 0,
    explanation: 'Distinct sorted values: −5, 300, 1000000 → ranks 0, 1, 2.',
  }),
  mcq({
    ...base, id: 'dsa.advp.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print (Car Pooling with capacity 4)?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[][] trips = {{2, 1, 5}, {3, 3, 7}};    // {passengers, from, to}
        for (int capacity : new int[] {4, 5}) {
            int[] diff = new int[1001];
            for (int[] t : trips) { diff[t[1]] += t[0]; diff[t[2]] -= t[0]; }
            int cur = 0;
            boolean ok = true;
            for (int x = 0; x <= 1000; x++) { cur += diff[x]; if (cur > capacity) ok = false; }
            System.out.print(ok + " ");
        }
        System.out.println();
    }
}`, 'Java', 'false true'),
    options: ['false true', ['true true', 'Between positions 3 and 5, 5 passengers are on board.'], ['false false', 'Capacity 5 is enough.'], ['true false', 'Capacity 4 fails first.']],
    answer: 0,
    explanation: 'From 3 to 5 both trips overlap: 2 + 3 = 5 passengers. Drop-offs happen at "to", so the trips do not overlap after 5.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.advp.q5', type: 'debug', difficulty: 'medium',
    stem: 'A skyline solution uses `active.erase(h)` on a std::multiset when a building ends. Two buildings of height 10 overlap, and the outline drops to 0 too early. Why?',
    options: ['erase(value) removes every copy of 10, including the one still active', ['Ends should be processed before starts', 'That creates other bugs at shared edges.'], ['The multiset must start empty', 'Starting with 0 is correct.'], ['Heights must be negated', 'The issue is how many copies are erased.']],
    answer: 0,
    explanation: 'Use active.erase(active.find(h)) to remove a single copy.',
  }),
  mcq({
    ...base, id: 'dsa.advp.q6', type: 'pattern', difficulty: 'medium',
    stem: 'Which problem is the best fit for meet in the middle?',
    options: ['Choose a subset of 36 integers whose sum is closest to a target', ['Longest increasing subsequence of 10⁵ integers', 'Patience sorting is O(n log n).'], ['Choose a subset of 12 integers', '2¹² is tiny: enumerate directly.'], ['Subset sum with 10⁵ integers up to 10', 'A bitset/knapsack DP over small sums works.']],
    answer: 0,
    explanation: '2³⁶ ≈ 7 · 10¹⁰ is too many, but 2¹⁸ ≈ 2.6 · 10⁵ per half is easy.',
  }),
  mcq({
    ...base, id: 'dsa.advp.q7', type: 'concept', difficulty: 'medium',
    stem: 'In a sweep line over intervals, what is guaranteed between two consecutive event coordinates?',
    options: ['The active set does not change', ['Every interval is active', 'Only some may be.'], ['No interval is active', 'Some may be.'], ['The answer is zero', 'The active count can be anything.']],
    answer: 0,
    explanation: 'Changes happen only at starts and ends, so you compute once per event and multiply by the gap when measuring lengths or areas.',
  }),
  mcq({
    ...base, id: 'dsa.advp.q8', type: 'edge-case', difficulty: 'hard',
    stem: 'Skyline events are sorted as pairs (x, signedHeight) with starts negative. Buildings [0,2,3] and [2,5,3] touch at x = 2. Which output is correct?',
    options: ['(0,3) (5,0): the start at x = 2 is processed before the end, so the height never drops', ['(0,3) (2,0) (2,3) (5,0)', 'A correct skyline never has two points at the same x.'], ['(0,3) (2,3) (5,0)', 'No change at x = 2, so no point.'], ['(0,3) (2,0) (5,0)', 'The second building is active from 2 to 5.']],
    answer: 0,
    explanation: 'At x = 2 the events are (2, −3) then (2, 3). Adding the second 3 before removing the first keeps the maximum at 3, so no point is emitted until 5.',
  }),
];
