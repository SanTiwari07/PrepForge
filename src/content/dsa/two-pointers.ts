import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.two-pointers';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Two Pointers',
  summary: 'Shrink an O(n²) pair search to O(n) by moving two indices with a rule.',
  level: 'core',
  status: 'complete',
  estMinutes: 75,
  prerequisites: ['dsa.arrays-strings', 'dsa.complexity'],
  related: ['dsa.sliding-window', 'dsa.binary-search', 'dsa.fast-slow-pointers', 'dsa.sorting'],
  subtopics: ['Opposite ends (converging)', 'Same direction (read/write)', 'Partitioning', 'k-Sum with sorting', 'Merging two sorted sequences'],
  objectives: [
    'Recognise when sortedness or a monotonic condition lets you discard a whole row of pairs at once.',
    'Write the converging template and justify each pointer move with an argument.',
    'Use a read pointer and a write pointer to filter or compact in place with O(1) space.',
    'Solve 3Sum in O(n²) and handle duplicate triplets correctly.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Why two pointers works',
      bodyMd: `Two indices walk through the data, and **each step discards possibilities that provably cannot be the answer**. Because every pointer only moves in one direction, the total work is O(n).

**Converging pointers on sorted input (pair with sum = target):** let l = 0 and r = n − 1.
- If a[l] + a[r] < target, then a[l] paired with *any* element is too small, because a[r] is the largest remaining value. Discard a[l]: l++.
- If the sum is greater than target, a[r] is too large with any remaining partner. Discard a[r]: r−−.

Each comparison eliminates a whole row or column of the n × n pair grid, which is why n steps suffice.

**Same-direction pointers (read/write):** \`read\` scans every element, while \`write\` marks where the next kept element goes. This compacts arrays in place (remove duplicates, move zeros) in O(n) time and O(1) space.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'How to recognise it',
      bodyMd: `Ask: **"If I move one end, can I prove I never need the discarded element again?"**

- The input is **sorted**, or sorting is allowed and you only need values, not original indices.
- You are looking for a **pair or triplet** that satisfies a sum or difference condition.
- The question asks for in-place modification with O(1) extra space.
- A palindrome or symmetric check compares the two ends of a string.
- "Container" or "trapping" problems where the shorter side limits the answer.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: pair sum on a sorted array',
      bodyMd: 'a = [1, 3, 4, 6, 9, 11], target = 10.',
      trace: [
        { note: 'l = 0, r = 5: 1 + 11 = 12 > 10. 11 is too big with any partner, so r−−.', array: [1, 3, 4, 6, 9, 11], pointers: { l: 0, r: 5 }, vars: { sum: 12 } },
        { note: 'l = 0, r = 4: 1 + 9 = 10. Found the pair (1, 9).', array: [1, 3, 4, 6, 9, 11], pointers: { l: 0, r: 4 }, highlight: [0, 4], vars: { sum: 10 } },
        { note: 'If all pairs were needed: move both, l = 1, r = 3: 3 + 6 = 9 < 10, so l++.', array: [1, 3, 4, 6, 9, 11], pointers: { l: 1, r: 3 }, vars: { sum: 9 } },
        { note: 'l = 2, r = 3: 4 + 6 = 10. Found (4, 6). Then l ≥ r after moving, so stop.', array: [1, 3, 4, 6, 9, 11], pointers: { l: 2, r: 3 }, highlight: [2, 3], vars: { sum: 10 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates: converging, read/write, and 3Sum',
      bodyMd: 'In 3Sum, sorting enables the inner two-pointer scan, and skipping equal values at both levels prevents duplicate triplets.',
      code: [
        cpp(`
// 3Sum: all unique triplets summing to 0. O(n^2) time, O(1) extra (besides output).
vector<vector<int>> threeSum(vector<int> a) {
    sort(a.begin(), a.end());
    vector<vector<int>> res;
    int n = a.size();
    for (int i = 0; i < n - 2; ++i) {
        if (i > 0 && a[i] == a[i - 1]) continue;      // skip duplicate anchors
        if (a[i] > 0) break;                          // smallest is positive -> no zero sum
        int l = i + 1, r = n - 1;
        while (l < r) {
            int s = a[i] + a[l] + a[r];
            if (s < 0) ++l;
            else if (s > 0) --r;
            else {
                res.push_back({a[i], a[l], a[r]});
                ++l; --r;
                while (l < r && a[l] == a[l - 1]) ++l;  // skip duplicate seconds
            }
        }
    }
    return res;
}

// Read/write pointers: remove duplicates from a sorted array in place.
int removeDuplicates(vector<int>& a) {
    if (a.empty()) return 0;
    int w = 1;
    for (int r = 1; r < (int)a.size(); ++r)
        if (a[r] != a[w - 1]) a[w++] = a[r];
    return w;
}`, 'C++'),
        java(`
// 3Sum: all unique triplets summing to 0. O(n^2) time.
List<List<Integer>> threeSum(int[] a) {
    Arrays.sort(a);
    List<List<Integer>> res = new ArrayList<>();
    int n = a.length;
    for (int i = 0; i < n - 2; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;
        if (a[i] > 0) break;
        int l = i + 1, r = n - 1;
        while (l < r) {
            int s = a[i] + a[l] + a[r];
            if (s < 0) l++;
            else if (s > 0) r--;
            else {
                res.add(Arrays.asList(a[i], a[l], a[r]));
                l++; r--;
                while (l < r && a[l] == a[l - 1]) l++;
            }
        }
    }
    return res;
}

// Read/write pointers: remove duplicates from a sorted array in place.
int removeDuplicates(int[] a) {
    if (a.length == 0) return 0;
    int w = 1;
    for (int r = 1; r < a.length; r++)
        if (a[r] != a[w - 1]) a[w++] = a[r];
    return w;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Converging pair search: each step moves l or r inward, so at most n steps: **O(n)** after an O(n log n) sort if one is needed.
- 3Sum: sort O(n log n) + n anchors × O(n) scan = **O(n²)**. You cannot do asymptotically better in general for 3Sum in this model.
- Read/write compaction: one pass, **O(n) time, O(1) space**.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Using converging pointers on unsorted data.** The discard argument depends on order.
2. **Sorting when the answer needs original indices** (classic Two Sum). Either store (value, index) pairs before sorting or use a hash map.
3. **Duplicate triplets in 3Sum:** forgetting to skip equal anchors (\`a[i] == a[i-1]\`) or equal second elements after a match.
4. **Infinite loops:** in the equal case you must move at least one pointer.
5. **Off-by-one with \`l < r\` vs \`l <= r\`**: for pairs of distinct indices, use \`l < r\`.
6. **Overflow** in 4Sum when adding four values near 10⁹: use 64-bit sums.`,
    },
  ],
  recognition: {
    signals: ['Sorted array (or sorting allowed) plus a pair or triplet condition', 'In-place removal or partitioning with O(1) space', 'Comparing symmetric ends (palindromes)', 'The answer depends on the min or max of two ends (container problems)'],
    antiSignals: ['Unsorted data where the original indices matter: use hashing', 'A contiguous subarray with a running constraint: sliding window (a same-direction variant)', 'Arbitrary subsets, not pairs: backtracking or DP'],
    decisionQuestions: ['When I move a pointer, which candidates do I discard, and why can none of them be optimal?', 'Do I need values only (so sorting is OK) or original indices?', 'How do I skip duplicates?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Prove why moving the left pointer is safe when a[l] + a[r] < target in a sorted array.', answerMd: 'a[r] is the largest element still available. If even a[l] + a[r] is below target, then a[l] + a[k] ≤ a[l] + a[r] < target for every k ≤ r. So a[l] cannot be part of any valid pair and can be discarded.' },
    { id: 'iq2', q: 'Container With Most Water: why move the shorter line?', answerMd: 'The area is limited by the shorter line times the width. Moving the taller line inward cannot increase the height bound (the shorter line still limits it) and strictly decreases the width, so the area cannot improve. Only moving the shorter line has a chance of finding a taller boundary.' },
    { id: 'iq3', q: 'How do you avoid duplicate triplets in 3Sum without using a set?', answerMd: 'Sort first. Skip an anchor equal to the previous anchor. After recording a triplet, advance l (and r) past equal values. Each distinct triplet is then produced exactly once.' },
    { id: 'iq4', q: 'Two pointers vs hash map for Two Sum?', answerMd: 'A hash map is O(n) time and O(n) space and keeps the original indices. Two pointers needs sorted input: O(n log n) with sorting but O(1) extra space. If the input is already sorted (Two Sum II), two pointers is strictly better.' },
    { id: 'iq5', q: 'What is the complexity of k-Sum using two pointers?', answerMd: 'O(n^(k−1)): fix k−2 elements with nested loops, then run a linear two-pointer scan for the last two.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Converging: sorted input, compare the sum with target; too small means l++, too big means r−−.
- Justify every move with "the discarded element cannot pair with anything left".
- Read/write: \`w\` points to the next slot; keep \`a[r]\` if it passes the filter.
- 3Sum: sort, anchor i, skip equal anchors, two-pointer scan, skip equal seconds after a hit. O(n²).
- Container: move the shorter side.
- Needs original indices? Use a hash map instead, or sort (value, index) pairs.`,
    flashcards: [
      { id: 'f1', front: 'Container With Most Water: which pointer moves?', backMd: 'The shorter line. Moving the taller one cannot increase the area.' },
      { id: 'f2', front: '3Sum complexity and the key trick?', backMd: 'O(n²): sort, fix an anchor, then two pointers; skip duplicates at both levels.' },
      { id: 'f3', front: 'Precondition for converging pointers on pair sums?', backMd: 'Sorted order, which gives monotonic sums as pointers move.' },
      { id: 'f4', front: 'In-place filter template?', backMd: 'w = 0; for r over all: if keep(a[r]) then a[w++] = a[r]. O(n), O(1).' },
      { id: 'f5', front: 'Valid Palindrome with non-alphanumerics: approach?', backMd: 'Converging pointers that skip non-alphanumerics and compare lowercase characters.' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 12, passPct: 80, minIndependentSolves: 4, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'NeetCode practice: Two Pointers', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
    { title: 'LeetCode Top Interview 150', url: 'https://leetcode.com/studyplan/top-interview-150/', kind: 'practice', httpVerifiable: false },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.two-pointers.q1', type: 'pattern', difficulty: 'easy',
    stem: 'An array is **sorted** in non-decreasing order. Find whether any two distinct elements sum to a target, using O(1) extra space. Best approach?',
    options: [['A hash set of seen values', 'Correct, but O(n) space.'], 'Converging two pointers from both ends', ['Check all pairs', 'O(n²) time.'], ['A sliding window of fixed size', 'Pairs need not be adjacent.']],
    answer: 1,
    explanation: 'Sortedness makes the pair sum monotonic in each pointer, so l/r moves discard impossible candidates: O(n) time and O(1) space.',
  }),
  mcq({
    ...base, id: 'dsa.two-pointers.q2', type: 'concept', difficulty: 'medium',
    stem: 'In Container With Most Water, heights are h[l] = 4 and h[r] = 9. Which move is correct, and why?',
    options: [['Move r, because 9 is larger', 'Moving the taller side keeps the height bound at most 4 and reduces the width, so the area cannot grow.'], 'Move l, because the shorter side limits the area', ['Move both', 'You might skip the optimal pair that keeps r.'], ['Either; it does not matter', 'Moving the taller side can never help, so the choice matters for correctness of the pruning argument.']],
    answer: 1,
    explanation: 'Area = min(h[l], h[r]) × (r − l). Any pair that keeps l = 4 and moves r has height ≤ 4 and a smaller width, so all of them are worse. Discard l.',
  }),
  mcq({
    ...base, id: 'dsa.two-pointers.q3', type: 'complexity', difficulty: 'easy',
    stem: 'What is the time complexity of 3Sum with sorting plus two pointers?',
    options: [['O(n)', 'There is one linear scan per anchor, and there are n anchors.'], ['O(n log n)', 'Sorting is O(n log n), but the scans dominate.'], 'O(n²)', ['O(n³)', 'That is the brute force.']],
    answer: 2,
    explanation: 'For each of the n anchors, the two-pointer scan is O(n), giving O(n²) plus O(n log n) for sorting.',
  }),
  mcq({
    ...base, id: 'dsa.two-pointers.q4', type: 'edge-case', difficulty: 'medium',
    stem: 'A 3Sum solution sorts the array but **never skips equal anchors**. For nums = [−1, −1, 0, 1, 2], what goes wrong?',
    options: ['The triplet [−1, 0, 1] is reported twice', ['It misses [−1, −1, 2]', 'That triplet is found from the first −1 anchor.'], ['It runs forever', 'The pointers still converge.'], ['Nothing; the output is correct', 'Duplicates appear.']],
    answer: 0,
    explanation: 'Both −1 anchors find (0, 1), so [−1, 0, 1] appears twice. Skip `i` when `a[i] == a[i−1]`.',
  }),
  mcq({
    ...base, id: 'dsa.two-pointers.q5', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {0, 0, 1, 1, 1, 2, 3, 3};
    int w = 1;
    for (int r = 1; r < (int)a.size(); ++r)
        if (a[r] != a[w - 1]) a[w++] = a[r];
    cout << w << " " << a[w - 1] << endl;
    return 0;
}`),
    options: ['4 3', ['3 2', 'The last distinct value 3 is also kept.'], ['8 3', 'w counts kept elements, not all elements.'], ['4 2', 'a[3] is overwritten with 3.']],
    answer: 0,
    explanation: 'Distinct values are 0, 1, 2, 3, so w = 4 and the compacted prefix is [0, 1, 2, 3]; a[w−1] = 3.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.two-pointers.q6', type: 'pattern', difficulty: 'medium',
    stem: 'Two Sum (return the **original indices**) on an unsorted array. Why is "sort + two pointers" awkward here?',
    options: [['Two pointers is slower than hashing asymptotically', 'With sorting it is O(n log n), close to hashing, but that is not the main issue.'], 'Sorting moves elements, so you must also track the original indices', ['Two pointers cannot handle negative numbers', 'Negatives are fine on sorted data.'], ['Two pointers needs distinct values', 'Duplicates are fine.']],
    answer: 1,
    explanation: 'After sorting, positions no longer match the input. You would need to sort (value, index) pairs. A hash map solves it in O(n) without that bookkeeping.',
  }),
  mcq({
    ...base, id: 'dsa.two-pointers.q7', type: 'debug', difficulty: 'medium',
    stem: 'A converging-pointers loop is `while (l < r) { if (a[l] + a[r] == t) { count++; } else if (a[l] + a[r] < t) l++; else r--; }`. What is the bug?',
    options: ['When the sum equals t, neither pointer moves, so the loop never ends', ['It should use l <= r', 'With l <= r it could pair an element with itself.'], ['count should be a long', 'Not the bug that breaks the program.'], ['It fails on negative numbers', 'Sortedness is what matters, not sign.']],
    answer: 0,
    explanation: 'In the equal case you must move at least one pointer (usually both, and skip duplicates if needed); otherwise it is an infinite loop.',
  }),
  mcq({
    ...base, id: 'dsa.two-pointers.q8', type: 'pattern', difficulty: 'hard',
    stem: 'Trapping Rain Water can be solved with two pointers in O(1) space. What invariant makes this correct?',
    options: ['Process the side with the smaller running max: its trapped water is fully determined by that max', ['Always process the left side first', 'Order is decided by which side has the smaller max.'], ['Water at i equals h[l] − h[i]', 'It depends on the running maxima, not the current pointer heights.'], ['Process the taller side first', 'The taller side is not yet bounded by the other side.']],
    answer: 0,
    explanation: 'water[i] = min(maxLeft, maxRight) − h[i]. If leftMax ≤ rightMax, the min is leftMax for position l whatever lies between, so l can be finalised and advanced. Symmetrically for the right side.',
  }),
];
