import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.sliding-window';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Sliding Window',
  summary: 'Maintain a contiguous window and its state incrementally instead of recomputing.',
  level: 'core',
  status: 'complete',
  estMinutes: 90,
  prerequisites: ['dsa.hashing', 'dsa.two-pointers'],
  related: ['dsa.prefix-sums', 'dsa.monotonic-stack-queue', 'dsa.hashing'],
  subtopics: ['Fixed-size window', 'Variable window: longest valid', 'Variable window: shortest valid', 'Counting subarrays with "at most k"', 'Window state with a frequency map'],
  objectives: [
    'Recognise contiguous subarray or substring problems with a monotonic validity condition.',
    'Write the expand-right / shrink-left template for longest and shortest windows.',
    'Count subarrays with exactly k of something via atMost(k) − atMost(k − 1).',
    'Explain why the total work is O(n) even with a nested while loop.',
    'Know when a sliding window fails (for example negative numbers in sum problems).',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'The idea',
      bodyMd: `A window is a contiguous range [l, r]. Instead of recomputing a property of every subarray (O(n²) windows), we **slide**: add a[r] when r advances and remove a[l] when l advances, updating the window state in O(1).

It works when the validity condition is **monotonic**: if a window is valid, every smaller window inside it is valid too (or, for "shortest" problems, every larger window containing it is valid). That is what lets l move only forward.

Typical window state: a sum, a count of distinct characters, a frequency map, or the number of "bad" elements.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'How to recognise it',
      bodyMd: `- The question says **subarray** or **substring** (contiguous), not subsequence.
- It asks for the **longest / shortest / count** of windows satisfying a constraint such as "at most k distinct", "sum ≥ target", "no repeating characters", or "at most k replacements".
- Brute force would check all O(n²) windows, and extending or shrinking a window changes the state predictably.

**Longest valid window:** expand r; while the window is invalid, shrink l; then record r − l + 1.
**Shortest valid window:** expand r; while the window is valid, record its length and shrink l.
**Fixed size k:** add a[r] and remove a[r − k] once r ≥ k.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: longest substring without repeating characters',
      bodyMd: 's = "abcabcbb". The window holds unique characters; when a[r] is already inside, shrink from the left until it is not.',
      trace: [
        { note: 'r = 0 ("a"): window "a", valid. best = 1.', array: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'], window: [0, 0], pointers: { l: 0, r: 0 }, vars: { best: 1 } },
        { note: 'r = 2 ("c"): window "abc", valid. best = 3.', array: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'], window: [0, 2], pointers: { l: 0, r: 2 }, vars: { best: 3 } },
        { note: 'r = 3 ("a"): "a" is already in the window, so shrink: remove s[0], l = 1. Window "bca".', array: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'], window: [1, 3], pointers: { l: 1, r: 3 }, vars: { best: 3 } },
        { note: 'r = 6 ("b"): duplicate "b"; shrink until it is gone: l moves to 5. Window "cb".', array: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'], window: [5, 6], pointers: { l: 5, r: 6 }, vars: { best: 3 } },
        { note: 'r = 7 ("b"): shrink to l = 7. Window "b". Final answer 3.', array: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'], window: [7, 7], pointers: { l: 7, r: 7 }, vars: { best: 3 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Longest valid window, shortest valid window, and exactly-k counting via at-most.',
      code: [
        cpp(`
// Longest substring without repeating characters.
int lengthOfLongestSubstring(const string& s) {
    vector<int> cnt(256, 0);
    int best = 0;
    for (int l = 0, r = 0; r < (int)s.size(); ++r) {
        cnt[(unsigned char)s[r]]++;
        while (cnt[(unsigned char)s[r]] > 1)          // invalid: shrink
            cnt[(unsigned char)s[l++]]--;
        best = max(best, r - l + 1);                  // valid: record
    }
    return best;
}

// Shortest subarray with sum >= target (all values positive).
int minSubArrayLen(int target, const vector<int>& a) {
    int best = INT_MAX; long long sum = 0;
    for (int l = 0, r = 0; r < (int)a.size(); ++r) {
        sum += a[r];
        while (sum >= target) {                       // valid: record, then shrink
            best = min(best, r - l + 1);
            sum -= a[l++];
        }
    }
    return best == INT_MAX ? 0 : best;
}

// Count subarrays with at most k distinct values; exactly(k) = atMost(k) - atMost(k-1).
long long atMostK(const vector<int>& a, int k) {
    unordered_map<int, int> cnt; long long res = 0;
    for (int l = 0, r = 0; r < (int)a.size(); ++r) {
        if (cnt[a[r]]++ == 0) --k;
        while (k < 0) if (--cnt[a[l++]] == 0) ++k;
        res += r - l + 1;                             // windows ending at r
    }
    return res;
}`, 'C++'),
        java(`
// Longest substring without repeating characters.
int lengthOfLongestSubstring(String s) {
    int[] cnt = new int[256];
    int best = 0;
    for (int l = 0, r = 0; r < s.length(); r++) {
        cnt[s.charAt(r)]++;
        while (cnt[s.charAt(r)] > 1) cnt[s.charAt(l++)]--;
        best = Math.max(best, r - l + 1);
    }
    return best;
}

// Shortest subarray with sum >= target (all values positive).
int minSubArrayLen(int target, int[] a) {
    int best = Integer.MAX_VALUE; long sum = 0;
    for (int l = 0, r = 0; r < a.length; r++) {
        sum += a[r];
        while (sum >= target) {
            best = Math.min(best, r - l + 1);
            sum -= a[l++];
        }
    }
    return best == Integer.MAX_VALUE ? 0 : best;
}

// Count subarrays with at most k distinct values.
long atMostK(int[] a, int k) {
    Map<Integer, Integer> cnt = new HashMap<>(); long res = 0;
    for (int l = 0, r = 0; r < a.length; r++) {
        if (cnt.merge(a[r], 1, Integer::sum) == 1) k--;
        while (k < 0) if (cnt.merge(a[l++], -1, Integer::sum) == 0) k++;
        res += r - l + 1;
    }
    return res;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Why it is O(n)',
      bodyMd: 'r advances n times. l only moves forward and never passes r, so it advances at most n times **in total** across all iterations of the inner while loop. Each move updates the state in O(1), so the total is **O(n) time**. Space is O(1) for sums, or O(σ) for a frequency table over an alphabet of size σ.',
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Using a window when values can be negative** in sum problems: adding an element can decrease the sum, so validity is not monotonic. Use prefix sums + hashing (or a monotonic deque for some variants).
2. **Recording the answer in the wrong place**: for *longest*, record after shrinking to validity; for *shortest*, record inside the while loop before shrinking.
3. **Forgetting to undo state** when l moves (decrement counts, subtract the sum).
4. **Counting "exactly k" directly**: a window with exactly k distinct values does not shrink monotonically. Use atMost(k) − atMost(k − 1).
5. **Longest Repeating Character Replacement:** the window is valid while \`len − maxFreq ≤ k\`. Not decreasing maxFreq when shrinking is fine (it is a known subtlety); recomputing it each time is also correct but O(26n).
6. **Subsequence problems are not windows**: if elements can be skipped, it is a two-pointer or DP problem instead.`,
    },
  ],
  recognition: {
    signals: ['Contiguous subarray or substring', 'Longest, shortest or count under a constraint', 'Constraint is monotonic: shrinking a valid window keeps it valid', 'Non-negative numbers for sum constraints'],
    antiSignals: ['Negative numbers with a sum target: prefix sum + hash map', 'Subsequences (not contiguous): DP or two pointers on separate strings', 'You need the max/min inside every window: monotonic deque'],
    decisionQuestions: ['What state must the window maintain?', 'What makes the window invalid, and does shrinking fix it monotonically?', 'Is this longest (record after fixing) or shortest (record while valid)?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Why is a sliding window O(n) even though it has a nested while loop?', answerMd: 'Both pointers only move forward and each moves at most n times overall. The inner loop does not restart from the beginning; its total iterations across the whole run are at most n, so the total work is O(2n).' },
    { id: 'iq2', q: 'Why does a sliding window fail for "longest subarray with sum = k" when negatives exist?', answerMd: 'With negatives, extending the window can decrease the sum and shrinking can increase it, so there is no monotonic rule for when to move l. Use prefix sums: store the first index of each prefix sum in a map and check pre − k.' },
    { id: 'iq3', q: 'How do you count subarrays with exactly k distinct integers?', answerMd: 'exactly(k) = atMost(k) − atMost(k − 1). atMost(k) uses a standard window that, for each r, adds r − l + 1 (the number of valid windows ending at r).' },
    { id: 'iq4', q: 'Explain the validity condition in Longest Repeating Character Replacement.', answerMd: 'A window can become all one letter with at most k replacements iff (window length − count of its most frequent letter) ≤ k. Expand r, update counts and maxFreq, shrink l while the condition fails, and record the length.' },
    { id: 'iq5', q: 'Minimum Window Substring: what state do you keep?', answerMd: 'Required counts for t, counts in the window, and a counter of how many required characters are fully satisfied. Expand r until all are satisfied, then shrink l while still satisfied, recording the smallest window. O(|s| + |t|).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Contiguous + longest/shortest/count + monotonic constraint means sliding window.
- Longest: expand, \`while invalid\` shrink, then record.
- Shortest: expand, \`while valid\` record and shrink.
- Fixed size k: add a[r], remove a[r − k].
- Exactly k = atMost(k) − atMost(k − 1); atMost adds \`r − l + 1\` per r.
- Negatives with a sum target means a prefix sum + hash map instead.
- Total O(n): each pointer moves at most n times.`,
    flashcards: [
      { id: 'f1', front: 'Longest-window template order?', backMd: 'Add a[r] → while invalid: remove a[l++] → best = max(best, r − l + 1).' },
      { id: 'f2', front: 'Shortest-window template order?', backMd: 'Add a[r] → while valid: best = min(best, len); remove a[l++].' },
      { id: 'f3', front: 'Count subarrays with exactly k distinct?', backMd: 'atMost(k) − atMost(k − 1).' },
      { id: 'f4', front: 'When does a sum-based window fail?', backMd: 'When negatives exist: the sum is not monotonic in window size.' },
      { id: 'f5', front: 'Validity for Longest Repeating Character Replacement?', backMd: 'len − maxFreq ≤ k.' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 12, passPct: 80, minIndependentSolves: 4, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'NeetCode practice: Sliding Window', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
    { title: 'Two Pointers (USACO Guide)', url: 'https://usaco.guide/silver/two-pointers', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.sliding-window.q1', type: 'pattern', difficulty: 'easy',
    stem: 'Find the length of the longest substring with at most 2 distinct characters, |s| ≤ 10⁵. Which approach?',
    options: [['Check every substring', 'O(n²) substrings, each needing work.'], 'Variable-size sliding window with a frequency map', ['Dynamic programming over positions', 'No overlapping-subproblem structure is needed here.'], ['Sort the string', 'Sorting destroys contiguity.']],
    answer: 1,
    explanation: 'The constraint "≤ 2 distinct" is monotonic: shrinking a valid window keeps it valid. Expand r, shrink l while the distinct count exceeds 2, and record the length. O(n).',
  }),
  mcq({
    ...base, id: 'dsa.sliding-window.q2', type: 'edge-case', difficulty: 'medium',
    stem: 'Which input breaks the sliding-window solution for "shortest subarray with sum ≥ target"?',
    options: [['a = [2, 3, 1, 2, 4, 3], target = 7', 'All positive: the window works.'], 'a = [5, −10, 6, 4], target = 10', ['a = [1, 1, 1], target = 5 (no answer)', 'The window handles "no answer" by returning 0.'], ['a = [10], target = 10', 'A single element is fine.']],
    answer: 1,
    explanation: 'Trace it: the running sum from index 0 is 5, −5, 1, 5, never ≥ 10, so the window never shrinks and the algorithm returns 0, yet [6, 4] sums to 10. The −10 makes the sum non-monotonic, so the "shrink while valid" rule is unsound. Negative values need prefix sums with a monotonic deque.',
  }),
  mcq({
    ...base, id: 'dsa.sliding-window.q3', type: 'complexity', difficulty: 'easy',
    stem: 'In the expand/shrink template, the inner `while` can run many times in one iteration of the outer loop. What is the total time over the whole array?',
    options: [['O(n²)', 'l never resets; it moves at most n times overall.'], 'O(n)', ['O(n log n)', 'There is no sorting or halving.'], ['O(n · k)', 'k does not multiply the pointer moves.']],
    answer: 1,
    explanation: 'Each of l and r moves at most n times in total, and each move is O(1), so the total is O(n).',
  }),
  mcq({
    ...base, id: 'dsa.sliding-window.q4', type: 'concept', difficulty: 'medium',
    stem: 'Count subarrays with **exactly** k distinct integers. Which identity is used?',
    options: ['exactly(k) = atMost(k) − atMost(k − 1)', ['exactly(k) = atLeast(k) + atMost(k)', 'That double counts and does not isolate k.'], ['exactly(k) = atMost(k) / k', 'There is no such division relation.'], ['Shrink while distinct > k and add 1 per r', 'That counts only one window per r, missing shorter valid ones.']],
    answer: 0,
    explanation: 'Windows with at most k distinct values minus windows with at most k − 1 leaves exactly those with k. Each atMost runs in O(n).',
  }),
  mcq({
    ...base, id: 'dsa.sliding-window.q5', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    string s = "pwwkew";
    vector<int> cnt(256, 0);
    int best = 0;
    for (int l = 0, r = 0; r < (int)s.size(); ++r) {
        cnt[s[r]]++;
        while (cnt[s[r]] > 1) cnt[s[l++]]--;
        best = max(best, r - l + 1);
    }
    cout << best << endl;
    return 0;
}`),
    options: [['2', '"wk" is not the longest; "wke" has 3 unique characters.'], '3', ['4', '"pwke" is a subsequence, not a substring.'], ['6', 'The string has repeated characters.']],
    answer: 1,
    explanation: 'The longest substring without repeats is "wke" (or "kew"), of length 3. "pwke" is not contiguous.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.sliding-window.q6', type: 'pattern', difficulty: 'medium',
    stem: 'Return the maximum of every window of size k in an array of 10⁵ numbers. Which structure gives O(n)?',
    options: [['A sliding window with a running max variable', 'When the max leaves the window you cannot recover the next max in O(1).'], 'A monotonic deque of indices with decreasing values', ['A max-heap of window elements', 'O(n log n) with lazy deletion: correct but not O(n).'], ['Prefix maxima', 'Prefix maxima cover the whole prefix, not just the window.']],
    answer: 1,
    explanation: 'Keep indices whose values are decreasing; pop from the back while the new value is larger and from the front when the index leaves the window. The front is the max. Each index is pushed and popped once.',
  }),
  mcq({
    ...base, id: 'dsa.sliding-window.q7', type: 'debug', difficulty: 'medium',
    stem: 'A solution for "shortest subarray with sum ≥ target" records `best = min(best, r − l + 1)` **after** the shrinking while loop ends. What is wrong?',
    options: ['After the loop the window is invalid (sum < target), so it records invalid windows or misses the shortest valid one', ['Nothing; the order does not matter', 'It does matter for shortest-window problems.'], ['It should record before adding a[r]', 'Then a[r] is not included.'], ['best should start at 0', 'It must start at infinity for a min.']],
    answer: 0,
    explanation: 'For shortest problems, record inside the loop while the window is still valid, then shrink. After the loop exits, the window no longer satisfies the constraint.',
  }),
  mcq({
    ...base, id: 'dsa.sliding-window.q8', type: 'pattern', difficulty: 'hard',
    stem: 'Given a string s and pattern p, find all start indices of anagrams of p in s. What is the most direct efficient approach?',
    options: ['A fixed-size window of length |p| with 26-count arrays, comparing counts as it slides', ['Sort every substring of length |p|', 'O(n · m log m).'], ['A hash set of all permutations of p', 'There are m! permutations.'], ['A variable window that shrinks on mismatch', 'The window size is fixed by |p|.']],
    answer: 0,
    explanation: 'Slide a window of size m, updating 26 counts in O(1) per step. Comparing two 26-arrays is O(26), or track a "matches" counter for O(1). Total O(26·n) or O(n).',
  }),
];
