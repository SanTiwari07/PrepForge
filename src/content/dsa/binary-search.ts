import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.binary-search';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Binary Search',
  summary: 'Search sorted data, find boundaries, and binary-search on the answer.',
  level: 'core',
  status: 'complete',
  estMinutes: 90,
  prerequisites: ['dsa.arrays-strings', 'dsa.complexity'],
  related: ['dsa.two-pointers', 'dsa.greedy', 'dsa.sorting'],
  subtopics: ['Exact match', 'First true (lower bound)', 'Rotated sorted arrays', 'Binary search on the answer', 'Real-valued search'],
  objectives: [
    'Write one boundary-search template ("first index where pred is true") and use it for everything.',
    'Avoid infinite loops and off-by-one errors by stating the loop invariant.',
    'Recognise "minimise the maximum" / "smallest capacity that works" as binary search on the answer.',
    'Handle rotated arrays by deciding which half is sorted.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Search on a monotonic predicate',
      bodyMd: `Binary search is not really about sorted arrays; it is about a **monotonic predicate**. If pred(x) is false, false, …, false, true, true, …, true over a range, you can find the **first true** in O(log range) by halving.

- Sorted array, find target: pred(i) = a[i] ≥ target. The first true index is the lower bound; check whether a[i] == target.
- Koko eating bananas: pred(speed) = "finishes within h hours". Faster speeds keep it true, so find the smallest speed where it is true.
- Rotated array minimum: pred(i) = a[i] ≤ a[n−1]. The first true index is the minimum.

> **Template invariant (half-open):** search in [lo, hi). Everything left of lo is false and everything at or after hi is true. Stop when lo == hi; that is the answer.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Recognising "binary search on the answer"',
      bodyMd: `The question asks for the **minimum (or maximum) value of X such that something is possible**, and:
1. Given a candidate X, you can **check feasibility** fast (often greedily in O(n)).
2. Feasibility is **monotonic**: if X works, any larger X also works (or any smaller one).

Typical phrases: *minimise the largest*, *maximise the minimum*, *smallest capacity / speed / time / day*, *at least k groups*. With values up to 10⁹, a linear scan over candidates is impossible, but log₂(10⁹) ≈ 30 feasibility checks is cheap.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: lower bound for target 7',
      bodyMd: 'a = [1, 3, 5, 7, 7, 9, 12], half-open [lo, hi) with lo = 0, hi = 7. pred(i) = a[i] ≥ 7.',
      trace: [
        { note: 'lo = 0, hi = 7, mid = 3. a[3] = 7 ≥ 7 is true, so the answer is ≤ 3: hi = mid = 3.', array: [1, 3, 5, 7, 7, 9, 12], pointers: { lo: 0, mid: 3, hi: 7 } },
        { note: 'lo = 0, hi = 3, mid = 1. a[1] = 3 ≥ 7 is false, so the answer is > 1: lo = mid + 1 = 2.', array: [1, 3, 5, 7, 7, 9, 12], pointers: { lo: 0, mid: 1, hi: 3 } },
        { note: 'lo = 2, hi = 3, mid = 2. a[2] = 5 ≥ 7 is false: lo = 3.', array: [1, 3, 5, 7, 7, 9, 12], pointers: { lo: 2, mid: 2, hi: 3 } },
        { note: 'lo = hi = 3. The first index with a[i] ≥ 7 is 3, the first occurrence of 7.', array: [1, 3, 5, 7, 7, 9, 12], pointers: { lo: 3, hi: 3 }, highlight: [3] },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'One generic "first true" search covers exact match, lower and upper bounds, and answer search.',
      code: [
        cpp(`
// First index in [lo, hi) where pred is true; returns hi if none.
template <class Pred>
long long firstTrue(long long lo, long long hi, Pred pred) {
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;      // avoids overflow
        if (pred(mid)) hi = mid;                 // answer is mid or to its left
        else lo = mid + 1;                       // answer is strictly right
    }
    return lo;
}

// Koko Eating Bananas: smallest speed to finish within h hours.
int minEatingSpeed(const vector<int>& piles, int h) {
    int maxPile = *max_element(piles.begin(), piles.end());
    return (int)firstTrue(1, (long long)maxPile + 1, [&](long long k) {
        long long hours = 0;
        for (int p : piles) hours += (p + k - 1) / k;   // ceil(p / k)
        return hours <= h;
    });
}

// Minimum in a rotated sorted array (distinct values).
int findMin(const vector<int>& a) {
    int last = a.back();
    long long i = firstTrue(0, a.size(), [&](long long m) { return a[m] <= last; });
    return a[i];
}`, 'C++'),
        java(`
// First index in [lo, hi) where pred is true; returns hi if none.
static long firstTrue(long lo, long hi, java.util.function.LongPredicate pred) {
    while (lo < hi) {
        long mid = lo + (hi - lo) / 2;
        if (pred.test(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

// Koko Eating Bananas: smallest speed to finish within h hours.
static int minEatingSpeed(int[] piles, int h) {
    int maxPile = Arrays.stream(piles).max().getAsInt();
    return (int) firstTrue(1, (long) maxPile + 1, k -> {
        long hours = 0;
        for (int p : piles) hours += (p + k - 1) / k;
        return hours <= h;
    });
}

// Minimum in a rotated sorted array (distinct values).
static int findMin(int[] a) {
    int last = a[a.length - 1];
    int i = (int) firstTrue(0, a.length, m -> a[(int) m] <= last);
    return a[i];
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Each iteration halves [lo, hi), so there are ⌈log₂(range)⌉ iterations: **O(log n)** for arrays.
- Binary search on the answer: **O(log(range) × cost of the check)**. Koko: O(n log maxPile).
- Space O(1) for the iterative version.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Infinite loop:** using \`lo = mid\` with \`mid = (lo + hi) / 2\` when hi = lo + 1, so mid == lo forever. With the half-open template, always use \`lo = mid + 1\` / \`hi = mid\`.
2. **Overflow:** \`(lo + hi) / 2\` overflows for values near 2³¹. Use \`lo + (hi − lo) / 2\` and 64-bit types for answer ranges.
3. **Mixing closed and half-open intervals** in one solution. Pick one invariant and state it in a comment.
4. **Wrong answer range:** for Koko the upper bound must include max(piles) (a speed that always works). Write \`hi = max + 1\` for half-open.
5. **Non-monotonic predicate:** if feasibility is not monotonic, binary search returns garbage. Argue monotonicity before coding.
6. **Rotated arrays with duplicates:** when a[mid] == a[hi] you cannot tell which half is sorted. Shrink hi−− (worst case O(n)).`,
    },
  ],
  recognition: {
    signals: ['Sorted (or rotated sorted) input with a search', '"Minimum X such that…" / "maximum X such that…" with a fast feasibility check', 'Huge value range (up to 10⁹) but a cheap check', 'O(log n) is explicitly required'],
    antiSignals: ['The predicate is not monotonic', 'You need all pairs or subarrays (two pointers / sliding window)', 'Small n where a linear scan is clearer'],
    decisionQuestions: ['What is the predicate, and is it monotonic?', 'What are the smallest and largest possible answers?', 'Can I check one candidate in O(n) or better?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you avoid infinite loops in binary search?', answerMd: 'Fix the invariant. With half-open [lo, hi) and "first true", update hi = mid when pred(mid) is true, else lo = mid + 1. mid is always < hi, so the range strictly shrinks. Never write lo = mid with a floor midpoint.' },
    { id: 'iq2', q: 'Explain binary search on the answer with an example.', answerMd: 'Ship packages within D days: the answer is a capacity C. Feasibility(C) is a greedy pass that counts the days needed; it is monotonic (a larger C never needs more days). Binary-search C in [max(weight), sum(weights)], giving O(n log sum).' },
    { id: 'iq3', q: 'How do you find the first and last occurrence of a target?', answerMd: 'first = lowerBound(target) = the first i with a[i] ≥ target; last = lowerBound(target + 1) − 1, or upperBound(target) − 1. Check the target actually exists at first.' },
    { id: 'iq4', q: 'Search in a rotated sorted array: what is the key decision?', answerMd: 'At each mid, one half is sorted (compare a[lo] with a[mid]). If the target lies within the sorted half\'s range, search there; otherwise search the other half. O(log n) for distinct values.' },
    { id: 'iq5', q: 'Why does lo + (hi − lo) / 2 matter?', answerMd: 'lo + hi can overflow a 32-bit int when both are large (around 2³⁰ or more). The subtraction form stays in range. This was a real bug in Java\'s Arrays.binarySearch for years.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Binary search finds the **first true of a monotonic predicate**.
- Half-open: \`while (lo < hi) { mid = lo + (hi − lo) / 2; pred(mid) ? hi = mid : lo = mid + 1; }\` and return lo.
- lower_bound: pred = a[i] ≥ x; upper_bound: pred = a[i] > x.
- Answer search: define feasible(X), prove it is monotonic, set [lo, hi) to cover every possible answer.
- Rotated minimum: pred = a[i] ≤ a[last].
- Use 64-bit for the answer range and sums inside the checks.`,
    flashcards: [
      { id: 'f1', front: 'Half-open "first true" loop body?', backMd: 'mid = lo + (hi − lo) / 2; if pred(mid) then hi = mid, else lo = mid + 1; loop while lo < hi.' },
      { id: 'f2', front: 'Signals for binary search on the answer?', backMd: '"Minimum/maximum X such that…", a monotonic feasibility check, and a huge value range.' },
      { id: 'f3', front: 'Predicate for the rotated-array minimum?', backMd: 'a[i] ≤ a[n − 1]: the first true index is the minimum.' },
      { id: 'f4', front: 'Koko answer range?', backMd: 'speed ∈ [1, max(piles)]; half-open hi = max + 1.' },
      { id: 'f5', front: 'Last occurrence of x?', backMd: 'upper_bound(x) − 1 (first index with a[i] > x, minus 1), if a[that] == x.' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 12, passPct: 80, minIndependentSolves: 4, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Binary Search (cp-algorithms)', url: 'https://cp-algorithms.com/num_methods/binary_search.html', kind: 'article' },
    { title: 'std::lower_bound (cppreference)', url: 'https://en.cppreference.com/w/cpp/algorithm/lower_bound', kind: 'official-docs' },
    { title: 'NeetCode practice: Binary Search', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.binary-search.q1', type: 'debug', difficulty: 'medium',
    stem: 'This loop sometimes never terminates. Why?',
    code: cpp(`int lo = 0, hi = n - 1;
while (lo < hi) {
    int mid = (lo + hi) / 2;
    if (a[mid] < target) lo = mid;
    else hi = mid;
}`),
    options: ['When hi = lo + 1 and a[lo] < target, mid == lo and lo never changes', ['hi should start at n', 'That changes the interval but does not fix the stuck update.'], ['It overflows for every input', 'Overflow happens only for very large indices.'], ['The condition should be lo <= hi', 'That makes it worse: hi = mid could loop forever.']],
    answer: 0,
    explanation: 'With a floor midpoint, mid == lo when the range has two elements. Setting lo = mid makes no progress. Use lo = mid + 1 in the "false" branch.',
  }),
  mcq({
    ...base, id: 'dsa.binary-search.q2', type: 'pattern', difficulty: 'medium',
    stem: 'Split an array into k contiguous parts to **minimise the largest part sum** (n ≤ 10⁵, values ≤ 10⁴). Which approach?',
    options: [['Greedy: always cut at the largest element', 'There is no such greedy guarantee.'], 'Binary search on the answer with a greedy feasibility check', ['Sort and distribute round-robin', 'The parts must be contiguous, so you cannot sort.'], ['Sliding window of size n/k', 'Parts need not be equal in length.']],
    answer: 1,
    explanation: 'feasible(M) = "a greedy pass that cuts whenever the running sum would exceed M uses ≤ k parts". It is monotonic in M, so binary-search M in [max, sum]. O(n log sum).',
  }),
  mcq({
    ...base, id: 'dsa.binary-search.q3', type: 'complexity', difficulty: 'easy',
    stem: 'Binary search on the answer over the range [1, 10⁹] with an O(n) feasibility check. Total time?',
    options: [['O(n)', 'You run the check about 30 times.'], 'O(n log 10⁹), about 30n', ['O(10⁹)', 'That is a linear scan of the range.'], ['O(n²)', 'Not quadratic.']],
    answer: 1,
    explanation: 'Each step halves the range, so there are ⌈log₂ 10⁹⌉ = 30 checks, each O(n).',
  }),
  mcq({
    ...base, id: 'dsa.binary-search.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> a = {1, 3, 3, 3, 5, 8};
    auto lo = lower_bound(a.begin(), a.end(), 3) - a.begin();
    auto hi = upper_bound(a.begin(), a.end(), 3) - a.begin();
    auto x  = lower_bound(a.begin(), a.end(), 4) - a.begin();
    cout << lo << " " << hi << " " << x << endl;
    return 0;
}`, 'C++', '1 4 4'),
    options: ['1 4 4', ['1 3 4', 'upper_bound returns the first element strictly greater than 3, at index 4.'], ['1 4 5', 'lower_bound(4) is the first element ≥ 4, which is 5 at index 4.'], ['0 4 4', 'Index 0 holds 1, which is < 3.']],
    answer: 0,
    explanation: 'lower_bound(3) is the first index with a[i] ≥ 3 → 1. upper_bound(3) is the first index with a[i] > 3 → 4. lower_bound(4) → 4 (value 5). The count of 3s is hi − lo = 3.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.binary-search.q5', type: 'concept', difficulty: 'medium',
    stem: 'Which predicate lets a "first true" binary search find the minimum of a rotated sorted array of **distinct** values?',
    options: ['a[i] ≤ a[n − 1]', ['a[i] ≥ a[0]', 'That is true on the left (larger) segment, so the first true is index 0.'], ['a[i] < a[i + 1]', 'Not monotonic across the whole array.'], ['a[i] == min(a)', 'You do not know the minimum yet.']],
    answer: 0,
    explanation: 'Elements in the rotated-left part are all > a[n − 1], and elements from the minimum onward are ≤ a[n − 1]. The predicate goes false…false, true…true, and the first true is the minimum.',
  }),
  mcq({
    ...base, id: 'dsa.binary-search.q6', type: 'edge-case', difficulty: 'medium',
    stem: 'Koko Eating Bananas: piles up to 10⁹, h up to 10⁹. Which detail most often causes a wrong answer?',
    options: ['Summing hours in a 32-bit int overflows when k is small', ['Using ceil division (p + k − 1) / k', 'That is correct.'], ['Starting the range at 1', 'A speed of 1 is a valid lower bound.'], ['Using a half-open interval', 'That is fine if hi = max + 1.']],
    answer: 0,
    explanation: 'With k = 1 the total hours can reach n·10⁹, which overflows int. Use a 64-bit accumulator (and you may break early once hours > h).',
  }),
  mcq({
    ...base, id: 'dsa.binary-search.q7', type: 'pattern', difficulty: 'easy',
    stem: 'Which problem is **not** naturally solved by binary search?',
    options: [['Find a peak element in O(log n)', 'Compare a[mid] with a[mid + 1] to move towards a peak.'], ['Find the first bad version', 'This is the classic monotonic predicate.'], 'Find the longest substring without repeating characters', ['Find the square root of x rounded down', 'Search for the largest r with r² ≤ x.']],
    answer: 2,
    explanation: 'The longest unique substring is a sliding-window problem: there is no monotonic predicate over a single searchable value that is cheap to check.',
  }),
  mcq({
    ...base, id: 'dsa.binary-search.q8', type: 'edge-case', difficulty: 'hard',
    stem: 'Search in a rotated sorted array **with duplicates** (e.g., [2, 2, 2, 3, 2]). Why does the worst case degrade to O(n)?',
    options: ['When a[lo] == a[mid] == a[hi], you cannot tell which half is sorted and must shrink by one', ['Duplicates make the array unsorted', 'Each segment is still sorted.'], ['Binary search needs distinct values to compute mid', 'mid does not depend on values.'], ['It does not degrade', 'With all-equal values except one, you can be forced into linear work.']],
    answer: 0,
    explanation: 'In [2, 2, 2, 3, 2] the endpoints and mid are equal and the 3 could be on either side, so you can only discard one end per step: O(n) worst case.',
  }),
];
