import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.kadane';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: "Kadane's Algorithm",
  summary: 'Maximum subarray in one pass, and its product and circular variants.',
  level: 'core',
  status: 'complete',
  estMinutes: 60,
  prerequisites: ['dsa.prefix-sums'],
  related: ['dsa.dp-1d', 'dsa.sliding-window', 'dsa.greedy'],
  subtopics: ['Best subarray ending here', 'Recovering the indices', 'All-negative input', 'Maximum product (track min and max)', 'Circular arrays (total − minimum subarray)', 'Kadane as 1-D DP'],
  objectives: [
    'State the recurrence best(i) = max(a[i], best(i−1) + a[i]) and explain why it is correct.',
    'Return the maximum subarray sum and its start and end indices in O(n) time and O(1) space.',
    'Handle the all-negative case without returning 0 by mistake.',
    'Adapt the idea to maximum product (track both extremes) and circular arrays (total minus the minimum subarray).',
    'Recognise Kadane-style problems disguised as stock or "best segment" questions.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'The idea: the best subarray that ends here',
      bodyMd: `The brute force checks every subarray: O(n²) with running sums. Kadane's algorithm asks a narrower question at each index i:

> What is the largest sum of a subarray that **ends exactly at i**?

Call it \`cur\`. A subarray ending at i either is just \`[a[i]]\`, or extends the best subarray ending at i − 1. So

\`cur(i) = max(a[i], cur(i − 1) + a[i])\`

and the answer is the maximum \`cur\` over all i. Each step is O(1), so the whole pass is **O(n) time and O(1) space**.

Equivalent reading: if the running sum ever becomes negative, it can only hurt anything that follows, so drop it and start fresh at the next element. Both forms give the same answer; the \`max(a[i], cur + a[i])\` form handles all-negative arrays without special cases.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Why it is DP, and how it relates to prefix sums',
      bodyMd: `**As 1-D DP:** the state is "best sum ending at i", the transition is the \`max\` above, the base case is \`cur(0) = a[0]\`. Only the previous state is needed, so it compresses to one variable.

**As prefix sums:** sum(l..r) = P[r+1] − P[l]. For a fixed right end, the best subarray subtracts the **smallest prefix seen so far**. Tracking the minimum prefix while scanning gives the same O(n) answer. This view is exactly the stock problem: buy at the lowest price so far, sell today.

**Variants:**
| Problem | Change |
|---|---|
| Maximum product subarray | A negative number swaps the roles of the largest and smallest product, so track both: \`hi = max(x, hi·x, lo·x)\`, \`lo = min(x, hi·x, lo·x)\` (using the old values). |
| Circular array | The best circular subarray either does not wrap (plain Kadane) or wraps, which equals total − (minimum subarray). If every element is negative, the wrap case would mean an empty subarray, so return the plain answer. |
| Best time to buy and sell once | Kadane on the daily differences, or track the minimum price so far. |
| Max path sum in a binary tree | Kadane on paths: each node returns the best downward path, clamped at 0. |`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run on [−2, 1, −3, 4, −1, 2, 1, −5, 4]',
      bodyMd: '`cur` is the best sum ending at i; `best` is the best seen so far.',
      trace: [
        { note: 'i = 0: cur = −2, best = −2.', array: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 0 }, vars: { cur: -2, best: -2 } },
        { note: 'i = 1: max(1, −2 + 1) = 1. Starting fresh beats extending.', array: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 1 }, window: [1, 1], vars: { cur: 1, best: 1 } },
        { note: 'i = 2: max(−3, 1 − 3) = −2.', array: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 2 }, window: [1, 2], vars: { cur: -2, best: 1 } },
        { note: 'i = 3: max(4, −2 + 4) = 4. Start a new subarray at index 3.', array: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 3 }, window: [3, 3], vars: { cur: 4, best: 4 } },
        { note: 'i = 4..6: cur goes 3, 5, 6. best = 6 for [4, −1, 2, 1].', array: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 6 }, window: [3, 6], vars: { cur: 6, best: 6 } },
        { note: 'i = 7: cur = 1. i = 8: cur = 5. best stays 6.', array: [-2, 1, -3, 4, -1, 2, 1, -5, 4], pointers: { i: 8 }, window: [3, 6], vars: { cur: 5, best: 6 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Maximum subarray with indices, maximum product, and the circular variant.',
      code: [
        cpp(`
// Returns {best sum, start, end}. Works for all-negative arrays.
array<long long, 3> maxSubarray(const vector<int>& a) {
    long long cur = a[0], best = a[0];
    int start = 0, bestL = 0, bestR = 0;
    for (int i = 1; i < (int)a.size(); ++i) {
        if (cur + a[i] < a[i]) { cur = a[i]; start = i; }   // starting fresh is better
        else cur += a[i];
        if (cur > best) { best = cur; bestL = start; bestR = i; }
    }
    return {best, bestL, bestR};
}

int maxProduct(const vector<int>& a) {
    long long hi = a[0], lo = a[0], best = a[0];
    for (int i = 1; i < (int)a.size(); ++i) {
        long long x = a[i];
        long long h = max({x, hi * x, lo * x});
        long long l = min({x, hi * x, lo * x});
        hi = h; lo = l;                                       // update from the OLD values
        best = max(best, hi);
    }
    return (int)best;
}

int maxSubarraySumCircular(const vector<int>& a) {
    int total = 0, curMax = 0, bestMax = INT_MIN, curMin = 0, bestMin = INT_MAX;
    for (int x : a) {
        curMax = max(x, curMax + x); bestMax = max(bestMax, curMax);
        curMin = min(x, curMin + x); bestMin = min(bestMin, curMin);
        total += x;
    }
    return bestMax < 0 ? bestMax : max(bestMax, total - bestMin);   // all negative: no wrap
}`, 'C++'),
        java(`
// Returns {best sum, start, end}. Works for all-negative arrays.
long[] maxSubarray(int[] a) {
    long cur = a[0], best = a[0];
    int start = 0, bestL = 0, bestR = 0;
    for (int i = 1; i < a.length; i++) {
        if (cur + a[i] < a[i]) { cur = a[i]; start = i; }
        else cur += a[i];
        if (cur > best) { best = cur; bestL = start; bestR = i; }
    }
    return new long[] {best, bestL, bestR};
}

int maxProduct(int[] a) {
    long hi = a[0], lo = a[0], best = a[0];
    for (int i = 1; i < a.length; i++) {
        long x = a[i];
        long h = Math.max(x, Math.max(hi * x, lo * x));
        long l = Math.min(x, Math.min(hi * x, lo * x));
        hi = h; lo = l;
        best = Math.max(best, hi);
    }
    return (int) best;
}

int maxSubarraySumCircular(int[] a) {
    int total = 0, curMax = 0, bestMax = Integer.MIN_VALUE, curMin = 0, bestMin = Integer.MAX_VALUE;
    for (int x : a) {
        curMax = Math.max(x, curMax + x); bestMax = Math.max(bestMax, curMax);
        curMin = Math.min(x, curMin + x); bestMin = Math.min(bestMin, curMin);
        total += x;
    }
    return bestMax < 0 ? bestMax : Math.max(bestMax, total - bestMin);
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Every variant here is **O(n) time, O(1) extra space**: one pass, a constant number of variables.
- The brute force with running sums is O(n²); the triple loop that recomputes each sum is O(n³).
- A divide-and-conquer solution (best of left, right, and crossing the middle) is O(n log n). It is a classic follow-up question, but Kadane is the expected answer.
- Overflow: with n = 10⁵ and |a[i]| ≤ 10⁴ the sum fits in 32 bits (≤ 10⁹), but products overflow almost immediately. LeetCode's maximum-product problem guarantees the answer fits in 32 bits; intermediate products may still need 64 bits.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Initialising best = 0.** For [−3, −1, −2] that returns 0, which is the empty subarray. Initialise with a[0] (or −∞) unless the problem explicitly allows an empty subarray.
2. **Resetting before updating best**, which loses a single positive element that follows a negative run. Update \`cur\` first, then \`best\`.
3. **Product variant: updating hi, then using the new hi to compute lo.** Compute both from the old values.
4. **Forgetting zeros in the product variant.** A zero resets both extremes; \`max(x, …)\` handles it because x = 0 is a candidate.
5. **Circular variant when all numbers are negative:** total − minSubarray = 0 would describe an empty subarray. Return the plain maximum instead.
6. **Using a sliding window.** A window needs a monotonic validity condition; with negative numbers, shrinking does not reliably help. Kadane (or prefix sums) is the right tool.`,
    },
  ],
  recognition: {
    signals: ['Maximum (or minimum) sum or product of a contiguous subarray', 'Best single buy/sell, or best segment, in one pass', 'Circular array maximum segment', 'Path sums in a tree where a negative branch should be dropped'],
    antiSignals: ['Subarray with sum exactly k: prefix sums + hash map', 'Longest window under a constraint with non-negative values: sliding window', 'Non-contiguous choices (subsequence): DP or greedy, not Kadane'],
    decisionQuestions: ['Is the subarray contiguous?', 'What is the best answer that ends exactly at index i, in terms of the answer at i − 1?', 'Can the answer be empty? If not, what should an all-negative array return?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: "Explain Kadane's algorithm and prove it is correct.", answerMd: 'Let cur(i) be the best sum of a subarray ending at i. Any such subarray is either [a[i]] or a subarray ending at i − 1 extended by a[i]; the best extension uses the best subarray ending at i − 1. So cur(i) = max(a[i], cur(i−1) + a[i]). Every subarray ends somewhere, so the answer is max over i of cur(i). O(n) time, O(1) space.' },
    { id: 'iq2', q: 'How do you return the indices of the maximum subarray?', answerMd: 'Track `start`, the index where the current run began (reset to i whenever starting fresh wins). Whenever cur beats best, record (start, i). With ties, decide whether you want the first or the shortest occurrence and use > or ≥ accordingly.' },
    { id: 'iq3', q: 'Why does the maximum product subarray need two variables?', answerMd: 'Multiplying by a negative number turns the smallest (most negative) product into the largest. Keep the largest and smallest products ending at i; for each x, the new extremes are among x, hi·x and lo·x. Example: [2, 3, −2, −4] has answer 48, which needs the negative product −12 times −4.' },
    { id: 'iq4', q: 'Solve the maximum circular subarray sum.', answerMd: 'Either the best subarray does not wrap (plain Kadane), or it wraps, and then the excluded middle part is the minimum subarray: answer = total − minSubarray. Take the max of both, except when all values are negative (then return plain Kadane, because the wrap case is empty). O(n), O(1).' },
    { id: 'iq5', q: 'Can a sliding window solve maximum subarray sum?', answerMd: 'Not in general. A window works when growing or shrinking moves the condition monotonically, which needs non-negative values. With negatives, removing an element from the left can increase or decrease the sum, so there is no rule for when to shrink. Kadane solves it directly.' },
    { id: 'iq6', q: 'Give the divide-and-conquer solution and its complexity.', answerMd: 'Split at the middle. The answer is the best of the left half, the right half, or a crossing subarray (best suffix of the left + best prefix of the right, found in O(n)). T(n) = 2T(n/2) + O(n) = O(n log n). With a segment-tree style combine that returns (sum, best prefix, best suffix, best) per half, it becomes O(n) and supports updates.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- cur = max(a[i], cur + a[i]); best = max(best, cur). Initialise both with a[0].
- Indices: reset start = i when starting fresh; record (start, i) when best improves.
- Product: track hi and lo; compute both from the old values; zeros reset naturally.
- Circular: max(plain, total − minSubarray), unless everything is negative.
- Stock (one transaction): min price so far, or Kadane on differences.
- Not a sliding-window problem when negatives exist.`,
    templates: [cpp(`
long long kadane(const vector<int>& a) {
    long long best = a[0], cur = a[0];
    for (int i = 1; i < (int)a.size(); ++i) {
        cur = max((long long)a[i], cur + a[i]);
        best = max(best, cur);
    }
    return best;
}`, 'C++')],
    flashcards: [
      { id: 'f1', front: "Kadane's recurrence?", backMd: 'cur(i) = max(a[i], cur(i−1) + a[i]); answer = max over i of cur(i).' },
      { id: 'f2', front: 'What does Kadane return for [−5, −2, −8] if you initialise best = 0?', backMd: '0, which is wrong (the empty subarray). Initialise with a[0] to get −2.' },
      { id: 'f3', front: 'Maximum product subarray: what extra state?', backMd: 'The minimum product ending at i, because a negative factor swaps min and max.' },
      { id: 'f4', front: 'Circular maximum subarray formula?', backMd: 'max(plain Kadane, total − minimum subarray), except when every value is negative.' },
      { id: 'f5', front: 'Kadane in prefix-sum terms?', backMd: 'Best sum ending at r = P[r+1] − min(P[0..r]): subtract the smallest prefix seen so far.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Maximum subarray problem (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Maximum_subarray_problem', kind: 'article' },
    { title: 'Maximum Subarray (LeetCode 53)', url: 'https://leetcode.com/problems/maximum-subarray/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.kadane.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> a = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    int cur = a[0], best = a[0];
    for (size_t i = 1; i < a.size(); ++i) {
        cur = max(a[i], cur + a[i]);
        best = max(best, cur);
    }
    cout << best << endl;
    return 0;
}`, 'C++', '6'),
    options: ['6', ['7', 'No subarray sums to 7; [4, −1, 2, 1, −5, 4] is 5.'], ['4', 'That is the best single element.'], ['5', '[4, −1, 2, 1, −5, 4] = 5 is smaller than [4, −1, 2, 1] = 6.']],
    answer: 0,
    explanation: 'The best subarray is [4, −1, 2, 1] with sum 6. The running `cur` reaches 6 at index 6 and never exceeds it.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.kadane.q2', type: 'edge-case', difficulty: 'easy',
    stem: 'A Kadane implementation starts with `best = 0, cur = 0` and resets `cur` to 0 when it goes negative. What does it return for [−3, −1, −2]?',
    options: ['0', ['−1', 'That is the correct answer, but this implementation never records a negative best.'], ['−6', 'That is the total sum.'], ['−3', 'That is the first element.']],
    answer: 0,
    explanation: 'best never rises above its initial 0, so the function returns 0, which corresponds to an empty subarray. The non-empty answer is −1. Initialise best (and cur) with a[0].',
  }),
  mcq({
    ...base, id: 'dsa.kadane.q3', type: 'concept', difficulty: 'medium',
    stem: 'For the maximum product subarray, why is tracking only the largest product ending at i not enough?',
    options: ['A negative number can turn the smallest product into the largest one', ['Products can overflow', 'True, but it is not the reason for a second variable.'], ['Zeros cannot be handled otherwise', 'max(x, …) already handles zeros.'], ['The answer must be positive', 'It can be negative, e.g. [−3].']],
    answer: 0,
    explanation: 'In [2, 3, −2, −4], the product ending at −2 is smallest at −12; multiplying by −4 gives 48, the answer. Without the minimum you lose it.',
  }),
  mcq({
    ...base, id: 'dsa.kadane.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    public static void main(String[] args) {
        int[] a = {5, -3, 5};
        int total = 0, curMax = 0, bestMax = Integer.MIN_VALUE, curMin = 0, bestMin = Integer.MAX_VALUE;
        for (int x : a) {
            curMax = Math.max(x, curMax + x); bestMax = Math.max(bestMax, curMax);
            curMin = Math.min(x, curMin + x); bestMin = Math.min(bestMin, curMin);
            total += x;
        }
        System.out.println(bestMax < 0 ? bestMax : Math.max(bestMax, total - bestMin));
    }
}`, 'Java', '10'),
    options: ['10', ['7', 'That is the non-wrapping answer, [5, −3, 5].'], ['5', 'A single element.'], ['13', 'Elements cannot be used twice.']],
    answer: 0,
    explanation: 'Plain Kadane gives 7. The minimum subarray is [−3]; total − (−3) = 7 + 3 = 10, the wrapping subarray [5, 5] (last element followed by the first).',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.kadane.q5', type: 'complexity', difficulty: 'easy',
    stem: "What are the time and extra space of Kadane's algorithm on n elements?",
    options: ['O(n) time, O(1) space', ['O(n log n) time, O(log n) space', 'That is the divide-and-conquer solution.'], ['O(n²) time, O(1) space', 'That is the brute force with running sums.'], ['O(n) time, O(n) space', 'Only the previous state is needed.']],
    answer: 0,
    explanation: 'One pass, two variables. The DP table is compressed because cur(i) depends only on cur(i − 1).',
  }),
  mcq({
    ...base, id: 'dsa.kadane.q6', type: 'pattern', difficulty: 'medium',
    stem: 'Which problem is NOT best solved with a Kadane-style pass?',
    options: ['Count subarrays whose sum equals k', ['Best day to buy and sell a stock once', 'Track the minimum price so far: the prefix-sum view of Kadane.'], ['Maximum sum circular subarray', 'Kadane twice (max and min).'], ['Maximum product subarray', 'Kadane with min and max.']],
    answer: 0,
    explanation: 'Counting subarrays with an exact sum needs prefix sums with a hash map of prefix counts; Kadane only finds an optimum.',
  }),
  mcq({
    ...base, id: 'dsa.kadane.q7', type: 'debug', difficulty: 'medium',
    stem: 'This product loop returns 18 for [−2, −3, −1], whose correct answer is 6. What is the bug?\n\n```\nhi = max(x, max(hi * x, lo * x));\nlo = min(x, min(hi * x, lo * x));\n```',
    options: ['lo is computed with the already-updated hi', ['It should use + instead of *', 'This is the product variant.'], ['hi and lo should start at 1', 'Starting at a[0] is correct.'], ['It needs a check for zero', 'max(x, …) already handles zero.']],
    answer: 0,
    explanation: 'Save the old hi first (or compute both into temporaries). At x = −3 the new hi is 6, and 6 · (−3) = −18 becomes lo, a product of a subarray that does not exist (−2 · −3 · −3). At x = −1 that phantom −18 turns into 18.',
  }),
  mcq({
    ...base, id: 'dsa.kadane.q8', type: 'edge-case', difficulty: 'hard',
    stem: 'For the circular maximum subarray of [−3, −2, −5], what does `max(bestMax, total − bestMin)` return, and what is correct?',
    options: ['It returns 0; the correct answer is −2', ['It returns −2; correct', 'total − bestMin = −10 − (−10) = 0, which is larger than −2.'], ['It returns −10; the correct answer is −2', '−10 is the total.'], ['It returns −2; the correct answer is 0', 'An empty subarray is not allowed.']],
    answer: 0,
    explanation: 'The minimum subarray is the whole array, so the "wrap" case removes everything, leaving an empty subarray worth 0. When bestMax < 0, return bestMax.',
  }),
];
