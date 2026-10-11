import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.prefix-sums';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Prefix Sums and Difference Arrays',
  summary: 'O(1) range sums, subarray-sum-equals-k with a hashmap, and O(1) range updates.',
  level: 'core',
  status: 'complete',
  estMinutes: 75,
  prerequisites: ['dsa.hashing'],
  related: ['dsa.kadane', 'dsa.sliding-window', 'dsa.fenwick-segment', 'dsa.matrix'],
  subtopics: ['1-D prefix sums', 'Subarray sum = k (with negatives)', 'Prefix sums modulo k', '2-D prefix sums', 'Difference arrays for range updates', 'Prefix XOR / products'],
  objectives: [
    'Answer any range-sum query in O(1) after O(n) preprocessing, with correct indexing.',
    'Count or find subarrays with a target sum (negatives allowed) using prefix sums plus a hash map.',
    'Apply many range-add updates in O(1) each with a difference array.',
    'Extend the idea to 2-D grids, XOR, and "sum divisible by k" problems.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'The core identity',
      bodyMd: `Define \`pre[0] = 0\` and \`pre[i+1] = pre[i] + a[i]\`. Then the sum of the half-open range [l, r) is

> **sum(l, r) = pre[r] − pre[l]**

Using a prefix array of length **n + 1** with a leading 0 removes every special case for ranges that start at index 0.

The same telescoping trick works for any operation with an inverse: XOR (\`x ^ x = 0\`), and products when no zeros are present.

**Difference array** is the reverse idea. To add v to every element in [l, r]: \`d[l] += v; d[r+1] −= v\`. After all updates, the prefix sum of \`d\` reconstructs the final array. Each update is O(1) instead of O(r − l).`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Recognising prefix-sum problems',
      bodyMd: `- "Sum of elements between i and j", asked many times: precompute prefix sums.
- "Number of subarrays whose sum is k / divisible by k / equals 0": a subarray (i, j] has sum \`pre[j] − pre[i]\`. Fix j and ask **how many earlier prefixes equal pre[j] − k**. That is a hash-map count. This works with negative numbers, unlike a sliding window.
- "Longest subarray with sum k": store the **first** index of each prefix value.
- "Equal number of 0s and 1s": map 0 → −1, and the question becomes "subarray with sum 0".
- "Apply many range increments, then report the array" (bookings, car pooling): difference array.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: count subarrays with sum k = 3',
      bodyMd: 'a = [1, 2, 1, −1, 3]. Keep a running prefix and a map from prefix value to count, seeded with {0: 1}. At each step add count[pre − k].',
      trace: [
        { note: 'Start: pre = 0, counts {0:1}, answer 0.', array: [1, 2, 1, -1, 3], vars: { pre: 0, counts: '{0:1}', ans: 0 } },
        { note: 'x = 1: pre = 1. Need pre − 3 = −2: not seen. counts {0:1, 1:1}.', array: [1, 2, 1, -1, 3], pointers: { j: 0 }, vars: { pre: 1, ans: 0 } },
        { note: 'x = 2: pre = 3. Need 0: seen once, so [1, 2] works. ans = 1.', array: [1, 2, 1, -1, 3], pointers: { j: 1 }, window: [0, 1], vars: { pre: 3, ans: 1 } },
        { note: 'x = 1: pre = 4. Need 1: seen once, so [2, 1] works. ans = 2.', array: [1, 2, 1, -1, 3], pointers: { j: 2 }, window: [1, 2], vars: { pre: 4, ans: 2 } },
        { note: 'x = −1: pre = 3. Need 0: seen once, so [1, 2, 1, −1] works. ans = 3. counts[3] becomes 2.', array: [1, 2, 1, -1, 3], pointers: { j: 3 }, window: [0, 3], vars: { pre: 3, ans: 3 } },
        { note: 'x = 3: pre = 6. Need 3: seen twice, so [1, −1, 3] and [3] both work. ans = 5.', array: [1, 2, 1, -1, 3], pointers: { j: 4 }, vars: { pre: 6, ans: 5 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Range-sum queries, counting subarrays with sum k, and a difference array for range updates.',
      code: [
        cpp(`
// Range sum queries after O(n) preprocessing.
struct PrefixSum {
    vector<long long> pre;
    explicit PrefixSum(const vector<int>& a) : pre(a.size() + 1, 0) {
        for (size_t i = 0; i < a.size(); ++i) pre[i + 1] = pre[i] + a[i];
    }
    long long sum(int l, int r) const { return pre[r + 1] - pre[l]; }   // inclusive [l, r]
};

// Number of subarrays with sum exactly k (negatives allowed).
int subarraySum(const vector<int>& a, int k) {
    unordered_map<long long, int> cnt;
    cnt[0] = 1;                       // the empty prefix
    long long pre = 0;
    int ans = 0;
    for (int x : a) {
        pre += x;
        auto it = cnt.find(pre - k);
        if (it != cnt.end()) ans += it->second;
        cnt[pre]++;
    }
    return ans;
}

// Apply updates (l, r, v) meaning "add v to a[l..r]", then return the final array.
vector<long long> applyRangeAdds(int n, const vector<array<int, 3>>& updates) {
    vector<long long> d(n + 1, 0);
    for (const auto& u : updates) { d[u[0]] += u[2]; d[u[1] + 1] -= u[2]; }
    vector<long long> out(n);
    long long run = 0;
    for (int i = 0; i < n; ++i) { run += d[i]; out[i] = run; }
    return out;
}`, 'C++'),
        java(`
class PrefixSum {
    private final long[] pre;
    PrefixSum(int[] a) {
        pre = new long[a.length + 1];
        for (int i = 0; i < a.length; i++) pre[i + 1] = pre[i] + a[i];
    }
    long sum(int l, int r) { return pre[r + 1] - pre[l]; }   // inclusive [l, r]
}

int subarraySum(int[] a, int k) {
    Map<Long, Integer> cnt = new HashMap<>();
    cnt.put(0L, 1);
    long pre = 0;
    int ans = 0;
    for (int x : a) {
        pre += x;
        ans += cnt.getOrDefault(pre - k, 0);
        cnt.merge(pre, 1, Integer::sum);
    }
    return ans;
}

long[] applyRangeAdds(int n, int[][] updates) {
    long[] d = new long[n + 1];
    for (int[] u : updates) { d[u[0]] += u[2]; d[u[1] + 1] -= u[2]; }
    long[] out = new long[n];
    long run = 0;
    for (int i = 0; i < n; i++) { run += d[i]; out[i] = run; }
    return out;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Building prefix sums: **O(n) time, O(n) space**; each query O(1). Without them, q queries cost O(n·q).
- Subarray-sum counting: one pass with average O(1) map operations, giving **O(n) time and O(n) space**.
- Difference array: O(1) per update plus one O(n) reconstruction, so **O(n + u)** for u updates.
- 2-D prefix sums: O(R·C) build, then O(1) per rectangle query via inclusion-exclusion.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Forgetting the seed \`cnt[0] = 1\`**, which misses subarrays that start at index 0.
2. **Inserting the current prefix before querying.** With k = 0 every element would count itself as a subarray.
3. **Overflow:** prefix sums of 10⁵ values up to 10⁹ need 64-bit integers.
4. **Inclusive vs exclusive indexing** (\`pre[r+1] − pre[l]\` for inclusive [l, r]).
5. **Using a sliding window when negatives exist**: use prefix sums with a map instead.
6. **Modulo with negatives:** in C++ and Java \`−1 % 5 == −1\`. Normalise with \`((x % k) + k) % k\` before using it as a key.
7. **Difference array size:** allocate n + 1 so that \`d[r + 1]\` is valid when r = n − 1.`,
    },
  ],
  recognition: {
    signals: ['Many range-sum queries on a static array', 'Count or find subarrays with sum k, 0, or divisible by k', 'Negative numbers rule out a sliding window', 'Many range-increment updates followed by one read'],
    antiSignals: ['Updates interleaved with queries: Fenwick or segment tree', 'Maximum subarray sum: Kadane (though prefix-min also works)', 'Only non-negative values and a window condition: sliding window is simpler'],
    decisionQuestions: ['Can I express the subarray quantity as a difference of two prefix values?', 'For a fixed right end, what must the earlier prefix equal?', 'Do I need a count (map of counts) or a length (map of first index)?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Why does subarray-sum-equals-k need a hash map instead of two pointers?', answerMd: 'With negative numbers, extending the window can decrease the sum, so there is no monotonic rule for moving pointers. Prefix sums turn the question into "how many earlier prefixes equal pre − k", which a hash map counts in O(1).' },
    { id: 'iq2', q: 'How do you count subarrays whose sum is divisible by k?', answerMd: 'Two prefixes with the same remainder mod k bound a subarray whose sum is divisible by k. Count prefix remainders (normalised to be non-negative), and for each remainder r with frequency f add f·(f − 1)/2, or accumulate on the fly.' },
    { id: 'iq3', q: 'Explain a difference array.', answerMd: 'To add v on [l, r], do d[l] += v and d[r + 1] −= v. The prefix sum of d then gives the final values, because each update "turns on" at l and "turns off" after r. Each update is O(1), and reconstruction is O(n).' },
    { id: 'iq4', q: 'How do 2-D prefix sums answer a rectangle query?', answerMd: 'With P[i][j] = sum of the rectangle (0,0)…(i−1,j−1): sum(r1..r2, c1..c2) = P[r2+1][c2+1] − P[r1][c2+1] − P[r2+1][c1] + P[r1][c1] (inclusion-exclusion).' },
    { id: 'iq5', q: 'When would you switch from prefix sums to a Fenwick tree?', answerMd: 'When point updates are interleaved with range queries. Prefix sums need O(n) rebuilding after each update; a Fenwick tree does both operations in O(log n).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- \`pre\` of length n + 1, \`pre[0] = 0\`; sum[l..r] = pre[r+1] − pre[l].
- Count subarrays with sum k: \`cnt = {0: 1}\`; for each x: \`pre += x; ans += cnt[pre − k]; cnt[pre]++\`.
- Longest subarray with sum k: store the **first** index of each prefix.
- Divisible by k: key = ((pre % k) + k) % k.
- 0/1 balance means map 0 → −1 and look for sum 0.
- Range-add updates: difference array, then a prefix sum.
- Use 64-bit sums.`,
    flashcards: [
      { id: 'f1', front: 'Seed value for the prefix-count map in subarray-sum-k?', backMd: '`cnt[0] = 1` (the empty prefix), so subarrays starting at index 0 count.' },
      { id: 'f2', front: 'Inclusive range sum [l, r] with pre of length n + 1?', backMd: 'pre[r + 1] − pre[l].' },
      { id: 'f3', front: 'Add v to a[l..r] in O(1)?', backMd: 'Difference array: d[l] += v, d[r + 1] −= v; reconstruct with a prefix sum.' },
      { id: 'f4', front: 'Longest subarray with equal 0s and 1s?', backMd: 'Map 0 → −1, track the first index of each prefix sum, and maximise j − first[pre].' },
      { id: 'f5', front: 'Safe modulo key for negative prefix sums?', backMd: '((pre % k) + k) % k' },
    ],
    templates: [cpp(`
// Longest subarray with sum k (negatives allowed): store the FIRST index of each prefix.
int longestSumK(const vector<int>& a, long long k) {
    unordered_map<long long, int> first;
    first[0] = -1;
    long long pre = 0; int best = 0;
    for (int i = 0; i < (int)a.size(); ++i) {
        pre += a[i];
        auto it = first.find(pre - k);
        if (it != first.end()) best = max(best, i - it->second);
        first.emplace(pre, i);                 // emplace keeps the earliest index
    }
    return best;
}`, 'Longest subarray with sum k (C++)')],
  },
  mastery: { testSize: 8, testMinutes: 12, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Prefix Sums (USACO Guide)', url: 'https://usaco.guide/silver/prefix-sums', kind: 'article' },
    { title: 'std::partial_sum (cppreference)', url: 'https://en.cppreference.com/w/cpp/algorithm/partial_sum', kind: 'official-docs' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.prefix-sums.q1', type: 'concept', difficulty: 'easy',
    stem: 'With `pre[0] = 0` and `pre[i+1] = pre[i] + a[i]`, what is the sum of a[2..5] **inclusive**?',
    options: [['pre[5] − pre[2]', 'That covers indices 2..4 only.'], 'pre[6] − pre[2]', ['pre[6] − pre[1]', 'That starts at index 1.'], ['pre[5] − pre[1]', 'That covers indices 1..4.']],
    answer: 1,
    explanation: 'pre[6] is the sum of a[0..5] and pre[2] is the sum of a[0..1]; their difference is a[2..5].',
  }),
  mcq({
    ...base, id: 'dsa.prefix-sums.q2', type: 'edge-case', difficulty: 'medium',
    stem: 'A subarray-sum-equals-k solution forgets to seed the map with `{0: 1}`. For a = [3, 1], k = 3, what does it return?',
    options: ['0', ['1', 'The correct answer is 1, but the bug misses it.'], ['2', 'There is only one valid subarray.'], ['It crashes', 'It just under-counts.']],
    answer: 0,
    explanation: 'The only valid subarray, [3], starts at index 0. It needs an earlier prefix equal to 3 − 3 = 0, which is the empty prefix. Without the seed it is never counted.',
  }),
  mcq({
    ...base, id: 'dsa.prefix-sums.q3', type: 'pattern', difficulty: 'medium',
    stem: 'You receive 10⁵ bookings, each "add seats v to every flight from l to r", and must report the final seat count of each of 10⁵ flights. Best approach?',
    options: [['Loop over [l, r] for each booking', 'O(n · q) in the worst case: 10¹⁰ operations.'], 'Difference array, then one prefix-sum pass', ['A max-heap of bookings', 'Heaps do not apply range additions.'], ['Sort the bookings by l', 'Sorting alone does not apply the updates efficiently.']],
    answer: 1,
    explanation: 'Each booking becomes two O(1) writes (d[l] += v, d[r+1] −= v); one prefix pass produces all totals. O(n + q).',
  }),
  mcq({
    ...base, id: 'dsa.prefix-sums.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
int main() {
    vector<int> a = {1, -1, 0};
    unordered_map<long long, int> cnt;
    cnt[0] = 1;
    long long pre = 0;
    int ans = 0;
    for (int x : a) {
        pre += x;
        ans += cnt[pre - 0];
        cnt[pre]++;
    }
    cout << ans << endl;
    return 0;
}`, 'C++', '3'),
    options: [['1', 'Several subarrays sum to 0.'], ['2', 'Count again: [1, −1], [0] and [1, −1, 0].'], '3', ['4', 'Only three subarrays have sum 0.']],
    answer: 2,
    explanation: 'Prefixes are 1, 0, 0. With k = 0: at pre = 1, none; at the first pre = 0 the seed gives 1 ([1, −1]); at the second pre = 0, count is 2 ([0] and [1, −1, 0]). Total 3.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.prefix-sums.q5', type: 'concept', difficulty: 'medium',
    stem: 'In "longest subarray with sum k", you store each prefix value with its index. Which index should you keep for a repeated prefix value?',
    options: ['The first (earliest) index', ['The last index', 'A later start makes the subarray shorter.'], ['Any index', 'The choice changes the length.'], ['The middle index', 'There is no reason to choose the middle.']],
    answer: 0,
    explanation: 'For a fixed end j, the longest subarray starts right after the earliest prefix equal to pre[j] − k. Never overwrite an existing entry.',
  }),
  mcq({
    ...base, id: 'dsa.prefix-sums.q6', type: 'edge-case', difficulty: 'hard',
    stem: 'Counting subarrays with sum divisible by k = 5 using prefix remainders. Why must you normalise `pre % 5`?',
    options: ['In C++ and Java the remainder of a negative number is negative, so −1 and 4 would be different keys although they are congruent', ['To avoid division by zero', 'k is 5, not zero.'], ['Because hash maps cannot store negative keys', 'They can.'], ['It is not needed when values are negative', 'That is exactly when it is needed.']],
    answer: 0,
    explanation: '−1 % 5 is −1 in C++ and Java, while 4 % 5 is 4, but both prefixes leave the same remainder class. Use ((pre % k) + k) % k.',
  }),
  mcq({
    ...base, id: 'dsa.prefix-sums.q7', type: 'complexity', difficulty: 'easy',
    stem: 'An array of n numbers receives q range-sum queries and no updates. What is the total time using prefix sums?',
    options: [['O(n · q)', 'That is answering each query by looping.'], 'O(n + q)', ['O(q log n)', 'No tree is needed for static data.'], ['O(n log n + q)', 'No sorting is needed.']],
    answer: 1,
    explanation: 'O(n) to build, then O(1) per query.',
  }),
  mcq({
    ...base, id: 'dsa.prefix-sums.q8', type: 'pattern', difficulty: 'medium',
    stem: 'Find the longest contiguous subarray of a binary array with an equal number of 0s and 1s. Which transformation makes it a standard prefix-sum problem?',
    options: ['Replace 0 with −1 and find the longest subarray with sum 0', ['Sort the array', 'Contiguity would be lost.'], ['Replace 1 with 2', 'Balance would not map to a fixed sum.'], ['Count 0s and 1s globally', 'That ignores contiguity.']],
    answer: 0,
    explanation: 'With 0 → −1, equal counts means the sum is 0. Track the first index of each prefix sum; the answer is the max of j − first[pre].',
  }),
];
