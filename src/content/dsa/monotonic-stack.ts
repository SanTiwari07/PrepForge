import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.monotonic-stack-queue';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Monotonic Stack and Queue',
  summary: 'Next greater element, histograms and sliding-window maximum in O(n).',
  level: 'core',
  status: 'complete',
  estMinutes: 80,
  prerequisites: ['dsa.stacks-queues'],
  related: ['dsa.sliding-window', 'dsa.stacks-queues', 'dsa.greedy'],
  subtopics: ['Next greater / smaller element', 'Previous greater / smaller element', 'Largest rectangle in a histogram', 'Sliding-window maximum (deque)', 'Contribution technique'],
  objectives: [
    'Find the next or previous greater/smaller element for every index in O(n).',
    'Choose between strictly and non-strictly monotonic stacks to handle duplicates correctly.',
    'Solve the largest-rectangle-in-histogram problem by computing span boundaries.',
    'Maintain a sliding-window maximum with a monotonic deque.',
    'Explain why every element is pushed and popped at most once.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Keep only the candidates that can still matter',
      bodyMd: `A monotonic stack keeps its elements in sorted order (for example decreasing from bottom to top). When a new element arrives, pop everything it "beats". Those popped elements have just found their **next greater element**: the new one.

Why discard them? If \`a[j] ≥ a[i]\` and \`j > i\`, then \`a[i]\` can never be the next greater element for anything to the right of j, because \`a[j]\` is both closer and at least as large. So \`a[i]\` is useless from now on.

Store **indices**, not values, so you can compute distances (days until a warmer temperature) and widths (histogram).

The **monotonic deque** applies the same idea to a sliding window: the front is the window maximum; pop from the back while the new value is larger; pop from the front when the index leaves the window.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Spotting it',
      bodyMd: `- "For each element, find the nearest element to the left/right that is larger/smaller."
- "How many days until a warmer day?", "next greater element", "stock span".
- "Largest rectangle / maximal area" where each bar extends until a smaller bar blocks it.
- "Sum of subarray minimums": each element's contribution is \`a[i] × (left span) × (right span)\`, with spans from previous/next smaller elements.
- "Maximum (or minimum) of every window of size k".

If your brute force is "for each i, scan right until something bigger appears", it is O(n²) and a monotonic stack makes it O(n).`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: next warmer day',
      bodyMd: 'temps = [73, 74, 75, 71, 69, 72, 76, 73]. The stack holds indices with decreasing temperatures. When a warmer day arrives, popped indices get their answer: i − popped.',
      trace: [
        { note: 'i = 0 (73): push. Stack [0].', array: [73, 74, 75, 71, 69, 72, 76, 73], pointers: { i: 0 }, stack: [0] },
        { note: 'i = 1 (74) > 73: pop 0, so ans[0] = 1. Push 1. Then i = 2 (75): pop 1, ans[1] = 1, push 2.', array: [73, 74, 75, 71, 69, 72, 76, 73], pointers: { i: 2 }, stack: [2] },
        { note: 'i = 3 (71) and i = 4 (69) are colder: push both. Stack [2, 3, 4].', array: [73, 74, 75, 71, 69, 72, 76, 73], pointers: { i: 4 }, stack: [2, 3, 4] },
        { note: 'i = 5 (72): pop 4 (69), ans[4] = 1; pop 3 (71), ans[3] = 2. 75 > 72, so stop. Push 5.', array: [73, 74, 75, 71, 69, 72, 76, 73], pointers: { i: 5 }, stack: [2, 5] },
        { note: 'i = 6 (76): pop 5, ans[5] = 1; pop 2, ans[2] = 4. Push 6. i = 7 (73): push. Remaining indices get 0.', array: [73, 74, 75, 71, 69, 72, 76, 73], pointers: { i: 6 }, stack: [6, 7] },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Next greater element distances, largest rectangle in a histogram, and sliding-window maximum.',
      code: [
        cpp(`
vector<int> dailyTemperatures(const vector<int>& t) {
    int n = t.size();
    vector<int> ans(n, 0), st;                        // st holds indices, temps decreasing
    for (int i = 0; i < n; ++i) {
        while (!st.empty() && t[st.back()] < t[i]) {
            ans[st.back()] = i - st.back();
            st.pop_back();
        }
        st.push_back(i);
    }
    return ans;
}

int largestRectangleArea(vector<int> h) {
    h.push_back(0);                                    // sentinel flushes the stack at the end
    vector<int> st;                                    // indices with increasing heights
    int best = 0;
    for (int i = 0; i < (int)h.size(); ++i) {
        while (!st.empty() && h[st.back()] >= h[i]) {
            int height = h[st.back()]; st.pop_back();
            int left = st.empty() ? -1 : st.back();    // previous smaller bar
            best = max(best, height * (i - left - 1)); // i is the next smaller bar
        }
        st.push_back(i);
    }
    return best;
}

vector<int> maxSlidingWindow(const vector<int>& a, int k) {
    deque<int> dq;                                     // indices, values decreasing
    vector<int> res;
    for (int i = 0; i < (int)a.size(); ++i) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();     // left the window
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();  // dominated
        dq.push_back(i);
        if (i >= k - 1) res.push_back(a[dq.front()]);
    }
    return res;
}`, 'C++'),
        java(`
int[] dailyTemperatures(int[] t) {
    int n = t.length;
    int[] ans = new int[n];
    Deque<Integer> st = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && t[st.peek()] < t[i]) {
            int j = st.pop();
            ans[j] = i - j;
        }
        st.push(i);
    }
    return ans;
}

int largestRectangleArea(int[] heights) {
    int n = heights.length, best = 0;
    Deque<Integer> st = new ArrayDeque<>();
    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];            // sentinel
        while (!st.isEmpty() && heights[st.peek()] >= h) {
            int height = heights[st.pop()];
            int left = st.isEmpty() ? -1 : st.peek();
            best = Math.max(best, height * (i - left - 1));
        }
        st.push(i);
    }
    return best;
}

int[] maxSlidingWindow(int[] a, int k) {
    Deque<Integer> dq = new ArrayDeque<>();
    int[] res = new int[a.length - k + 1];
    for (int i = 0; i < a.length; i++) {
        if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
        while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
        dq.offerLast(i);
        if (i >= k - 1) res[i - k + 1] = a[dq.peekFirst()];
    }
    return res;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Why it is O(n)',
      bodyMd: 'Every index is pushed exactly once and popped at most once, so the total number of stack (or deque) operations across the whole loop is at most 2n. The inner `while` looks nested, but its iterations are paid for by earlier pushes (amortised analysis). **O(n) time, O(n) space.**',
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Storing values instead of indices**, which loses distances and widths.
2. **Strict vs non-strict comparison:** for "next *greater*", pop while \`a[top] < a[i]\`; using \`<=\` changes how equal values are treated. In contribution problems (sum of subarray minimums), use strict on one side and non-strict on the other, or duplicates are double counted.
3. **Forgetting the leftover stack:** elements never popped have no next greater element (answer 0 or −1). In the histogram, a sentinel 0 flushes them.
4. **Width off by one:** the width is \`next_smaller − previous_smaller − 1\`.
5. **Deque window check:** remove the front when \`front ≤ i − k\` *before* reading the max.
6. **Using a heap** for sliding-window max works, but is O(n log n) and needs lazy deletion. The deque is O(n).`,
    },
  ],
  recognition: {
    signals: ['Nearest greater or smaller element to the left or right', 'Spans: how far an element extends before being blocked', 'Max or min of every fixed-size window', '"Sum over all subarrays of min/max"'],
    antiSignals: ['Global top-k (no locality): a heap', 'Sum of a window: plain sliding window', 'Arbitrary range queries with updates: a segment tree'],
    decisionQuestions: ['For each element, which neighbour (left/right, greater/smaller) do I need?', 'Should the stack be increasing or decreasing to expose that neighbour on a pop?', 'How should equal values be handled?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Why is the monotonic stack solution O(n) despite the nested while loop?', answerMd: 'Each index is pushed once and popped at most once, so all iterations of the inner loop together are bounded by n. That gives at most 2n operations total.' },
    { id: 'iq2', q: 'Explain largest rectangle in a histogram.', answerMd: 'Each bar, used as the shortest bar of a rectangle, extends left to the previous smaller bar and right to the next smaller bar. An increasing stack finds both boundaries when the bar is popped: the new index is the next smaller, and the element below it on the stack is the previous smaller. Area = h × (right − left − 1). O(n).' },
    { id: 'iq3', q: 'How do you get the maximum of every window of size k in O(n)?', answerMd: 'Use a deque of indices with decreasing values. For each i: drop the front if it left the window, pop the back while its value ≤ a[i], push i; the front is the max. Each index enters and leaves once.' },
    { id: 'iq4', q: 'How does the stack orientation change for "next smaller element"?', answerMd: 'Keep an increasing stack and pop while a[top] > a[i] (or ≥, depending on tie rules). Popped elements get i as their next smaller element.' },
    { id: 'iq5', q: 'How do you handle duplicates in "sum of subarray minimums"?', answerMd: 'Count each subarray\'s minimum exactly once by breaking ties asymmetrically: previous smaller uses strict <, next smaller uses ≤ (or vice versa). Otherwise subarrays with equal minimums are counted twice.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Pop the elements the new value beats; popped elements get their "next" answer.
- Decreasing stack means next greater; increasing stack means next smaller.
- Store indices; distance = i − j; width = next − prev − 1.
- Histogram: append a sentinel 0 to flush the stack.
- Window max: a deque with decreasing values; evict the front when ≤ i − k.
- Ties: strict on one side, non-strict on the other in contribution problems.
- Each index is pushed and popped once, giving O(n).`,
    flashcards: [
      { id: 'f1', front: 'Next greater element: stack order and pop condition?', backMd: 'Decreasing stack (bottom → top); pop while a[top] < a[i]. Popped index j gets answer i.' },
      { id: 'f2', front: 'Histogram width when bar j is popped at i?', backMd: 'i − (new top or −1) − 1.' },
      { id: 'f3', front: 'Sliding-window max: two deque checks per step?', backMd: 'Pop the front if it is ≤ i − k; pop the back while its value ≤ a[i]; then push i.' },
      { id: 'f4', front: 'Why O(n)?', backMd: 'Each index is pushed once and popped at most once.' },
      { id: 'f5', front: 'Daily temperatures answer for indices left on the stack?', backMd: '0 (no warmer day ahead).' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 12, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Minimum stack / minimum queue (cp-algorithms)', url: 'https://cp-algorithms.com/data_structures/stack_queue_modification.html', kind: 'article' },
    { title: 'NeetCode practice: Stack', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.monotonic.q1', type: 'pattern', difficulty: 'easy',
    stem: 'For each day, find how many days until a warmer temperature (n ≤ 10⁵). Best approach?',
    options: [['For each day, scan forward', 'O(n²) in the worst case (decreasing temperatures).'], 'A monotonic decreasing stack of indices', ['Sort the temperatures', 'Sorting loses the day order.'], ['A min-heap of temperatures', 'A heap does not give the nearest warmer day.']],
    answer: 1,
    explanation: 'When a warmer day arrives, every colder index on the stack has found its answer. Each index is pushed and popped once: O(n).',
  }),
  mcq({
    ...base, id: 'dsa.monotonic.q2', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print (next greater element, −1 if none)?',
    code: cpp(`#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {2, 1, 2, 4, 3};
    vector<int> ans(a.size(), -1), st;
    for (int i = 0; i < (int)a.size(); ++i) {
        while (!st.empty() && a[st.back()] < a[i]) {
            ans[st.back()] = a[i];
            st.pop_back();
        }
        st.push_back(i);
    }
    for (int x : ans) cout << x << " ";
    cout << endl;
    return 0;
}`, 'C++', '4 2 4 -1 -1'),
    options: ['4 2 4 -1 -1', ['2 2 4 -1 -1', 'The first 2 is not *greater* than 2; it waits for 4.'], ['4 2 4 3 -1', '3 is smaller than 4, so 4 has no next greater.'], ['-1 2 4 -1 -1', 'The first 2 is popped when 4 arrives.']],
    answer: 0,
    explanation: 'Strict `<` means equal values do not pop each other: index 0 (2) survives index 2 (2) and is popped by 4. Index 1 (1) is popped by 2. 4 and 3 have nothing greater to their right.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.monotonic.q3', type: 'complexity', difficulty: 'medium',
    stem: 'The monotonic-stack loop has a `while` inside a `for`. What is the worst-case total time?',
    options: [['O(n²)', 'The inner loop pops elements that never come back.'], 'O(n)', ['O(n log n)', 'There is no sorting or tree.'], ['O(n · k)', 'There is no k here.']],
    answer: 1,
    explanation: 'Every index is pushed once and popped at most once, so the inner loop runs at most n times in total across all iterations.',
  }),
  mcq({
    ...base, id: 'dsa.monotonic.q4', type: 'concept', difficulty: 'medium',
    stem: 'In largest-rectangle-in-histogram, bar j is popped while processing index i, and the stack top below it is index p (or −1). What is the width of the largest rectangle using bar j as the shortest bar?',
    options: ['i − p − 1', ['i − j', 'The rectangle also extends left of j, back to p + 1.'], ['j − p', 'That ignores the extension to the right.'], ['i − p + 1', 'p and i are both strictly shorter bars, so they are excluded.']],
    answer: 0,
    explanation: 'p is the previous smaller bar and i the next smaller bar, both excluded, so the rectangle spans p + 1 … i − 1: width i − p − 1.',
  }),
  mcq({
    ...base, id: 'dsa.monotonic.q5', type: 'debug', difficulty: 'medium',
    stem: 'A sliding-window-maximum solution reads `a[dq.front()]` **before** removing indices that left the window. What goes wrong?',
    options: ['It can report the maximum of an element that is no longer in the window', ['It becomes O(n²)', 'The complexity does not change.'], ['It crashes on every input', 'Only some inputs give wrong values.'], ['Nothing, the order does not matter', 'It does matter when the old max is the front.']],
    answer: 0,
    explanation: 'Example: a = [9, 1, 1], k = 2. At i = 2 the front is index 0 (value 9), which already left the window [1, 2]; the correct max is 1. Evict first, then read.',
  }),
  mcq({
    ...base, id: 'dsa.monotonic.q6', type: 'pattern', difficulty: 'hard',
    stem: 'Compute the sum of min(subarray) over all subarrays. What is the key idea for O(n)?',
    options: ['For each element, multiply it by the number of subarrays where it is the minimum: left span × right span from previous/next smaller elements', ['Enumerate all subarrays with a running min', 'O(n²).'], ['Sort the array and use prefix sums', 'Sorting breaks contiguity.'], ['Binary search on the answer', 'There is no monotonic predicate.']],
    answer: 0,
    explanation: 'a[i] is the minimum of (i − prevSmaller) × (nextSmallerOrEqual − i) subarrays. Two monotonic-stack passes compute the spans; break ties asymmetrically to avoid double counting.',
  }),
  mcq({
    ...base, id: 'dsa.monotonic.q7', type: 'concept', difficulty: 'easy',
    stem: 'To find the **next smaller** element for every index with one left-to-right pass, keep the stack…',
    options: ['increasing from bottom to top, and pop while a[top] > a[i]', ['decreasing, and pop while a[top] < a[i]', 'That finds the next greater element.'], ['sorted by index only', 'Indices are always increasing; the values decide.'], ['empty after every step', 'Then nothing waits for an answer.']],
    answer: 0,
    explanation: 'A new smaller value "beats" larger values above it, which then get their answer. What remains is increasing.',
  }),
];
