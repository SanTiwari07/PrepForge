import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.intervals';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Intervals',
  summary: 'Sort and merge, insert, overlap counting and sweep line.',
  level: 'core',
  status: 'complete',
  estMinutes: 70,
  prerequisites: ['dsa.sorting'],
  related: ['dsa.greedy', 'dsa.heaps', 'dsa.advanced-patterns', 'dsa.prefix-sums'],
  subtopics: ['Overlap test', 'Merge after sorting by start', 'Insert into sorted intervals', 'Minimum removals (sort by end)', 'Maximum overlap with a sweep line or a heap', 'Closed vs half-open intervals'],
  objectives: [
    'Test whether two intervals overlap with one comparison, and state whether touching endpoints count.',
    'Merge overlapping intervals in O(n log n) by sorting by start.',
    'Insert a new interval into a sorted, disjoint list in O(n) with three phases.',
    'Choose the sort key correctly: start for merging, end for "keep the most non-overlapping intervals".',
    'Count the maximum number of simultaneous intervals with a sweep line over events or a min-heap of end times.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'One comparison decides overlap',
      bodyMd: `For closed intervals [a, b] and [c, d], they overlap exactly when

\`a <= d && c <= b\`  (equivalently, max(a, c) <= min(b, d))

and the overlap is [max(a, c), min(b, d)]. They are disjoint when one ends before the other starts: \`b < c || d < a\`.

**Touching endpoints** ([1, 2] and [2, 3]) overlap for closed intervals, which is how LeetCode's Merge Intervals treats them. For meeting times, a meeting ending at 10:00 does not clash with one starting at 10:00, so those are half-open [start, end) and the test becomes \`a < d && c < b\`. Read the problem statement for this; most interval bugs are here.

Almost every interval problem starts by **sorting**, because then each interval only needs comparing with the last one you kept, instead of with every other interval.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Which sort key, and why',
      bodyMd: `| Goal | Sort by | Then |
|---|---|---|
| Merge overlapping intervals | **start** | extend the last merged interval while the next start ≤ its end |
| Insert into a sorted disjoint list | (already sorted) | copy those ending before the new one, merge those overlapping it, copy the rest |
| Minimum removals to make them disjoint (Non-overlapping Intervals) | **end** | greedily keep the interval that finishes first; count the ones that start before the last kept end |
| Minimum arrows / points that hit every interval | **end** | shoot at the end of the first unhit interval |
| Maximum simultaneous intervals (meeting rooms) | events, or start + heap of ends | +1 at start, −1 at end; the running maximum is the answer |

**Why sort by end for "keep the most":** among intervals that conflict with each other, the one that ends earliest leaves the most room for the rest. That is the classic exchange argument of activity selection: swapping any optimal solution's first choice for the earliest-ending interval never makes it worse.

**Sweep line:** turn each interval into two events, (start, +1) and (end, −1), sort them, and walk through keeping a running count. For half-open intervals, process an end before a start at the same time so that back-to-back meetings do not count as overlapping.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: merge [[1,3],[8,10],[2,6],[15,18],[9,12]]',
      bodyMd: 'After sorting by start: [1,3], [2,6], [8,10], [9,12], [15,18]. `last` is the interval being built.',
      trace: [
        { note: 'Take [1,3] as last.', array: ['[1,3]', '[2,6]', '[8,10]', '[9,12]', '[15,18]'], pointers: { i: 0 }, vars: { last: '[1,3]' } },
        { note: '[2,6]: 2 ≤ 3, overlap. Extend: last = [1, max(3,6)] = [1,6].', array: ['[1,3]', '[2,6]', '[8,10]', '[9,12]', '[15,18]'], pointers: { i: 1 }, vars: { last: '[1,6]' } },
        { note: '[8,10]: 8 > 6. Emit [1,6]; last = [8,10].', array: ['[1,3]', '[2,6]', '[8,10]', '[9,12]', '[15,18]'], pointers: { i: 2 }, vars: { out: '[1,6]', last: '[8,10]' } },
        { note: '[9,12]: 9 ≤ 10. last = [8,12].', array: ['[1,3]', '[2,6]', '[8,10]', '[9,12]', '[15,18]'], pointers: { i: 3 }, vars: { out: '[1,6]', last: '[8,12]' } },
        { note: '[15,18]: 15 > 12. Emit [8,12]; last = [15,18]. At the end, emit it. Result: [1,6], [8,12], [15,18].', array: ['[1,3]', '[2,6]', '[8,10]', '[9,12]', '[15,18]'], pointers: { i: 4 }, vars: { out: '[1,6] [8,12] [15,18]' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Merge, insert, minimum removals and the maximum number of simultaneous meetings.',
      code: [
        cpp(`
vector<vector<int>> merge(vector<vector<int>> iv) {
    sort(iv.begin(), iv.end());                       // by start, then end
    vector<vector<int>> out;
    for (auto& cur : iv) {
        if (!out.empty() && cur[0] <= out.back()[1]) out.back()[1] = max(out.back()[1], cur[1]);
        else out.push_back(cur);
    }
    return out;
}

vector<vector<int>> insert(const vector<vector<int>>& iv, vector<int> nw) {
    vector<vector<int>> out;
    int i = 0, n = iv.size();
    while (i < n && iv[i][1] < nw[0]) out.push_back(iv[i++]);          // entirely before
    while (i < n && iv[i][0] <= nw[1]) {                                // overlapping
        nw[0] = min(nw[0], iv[i][0]); nw[1] = max(nw[1], iv[i][1]); ++i;
    }
    out.push_back(nw);
    while (i < n) out.push_back(iv[i++]);                               // entirely after
    return out;
}

int eraseOverlapIntervals(vector<vector<int>>& iv) {
    sort(iv.begin(), iv.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });
    int removed = 0;
    long long lastEnd = LLONG_MIN;
    for (auto& x : iv) {
        if (x[0] >= lastEnd) lastEnd = x[1];          // touching is allowed here
        else ++removed;
    }
    return removed;
}

int minMeetingRooms(vector<vector<int>>& iv) {         // half-open [start, end)
    vector<pair<int, int>> ev;
    for (auto& x : iv) { ev.push_back({x[0], +1}); ev.push_back({x[1], -1}); }
    sort(ev.begin(), ev.end());                       // at equal times, -1 sorts before +1
    int cur = 0, best = 0;
    for (auto& e : ev) { cur += e.second; best = max(best, cur); }
    return best;
}`, 'C++'),
        java(`
int[][] merge(int[][] iv) {
    Arrays.sort(iv, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> out = new ArrayList<>();
    for (int[] cur : iv) {
        if (!out.isEmpty() && cur[0] <= out.get(out.size() - 1)[1]) {
            int[] last = out.get(out.size() - 1);
            last[1] = Math.max(last[1], cur[1]);
        } else out.add(new int[] {cur[0], cur[1]});
    }
    return out.toArray(new int[0][]);
}

int[][] insert(int[][] iv, int[] nw) {
    List<int[]> out = new ArrayList<>();
    int i = 0, n = iv.length;
    int s = nw[0], e = nw[1];
    while (i < n && iv[i][1] < s) out.add(iv[i++]);
    while (i < n && iv[i][0] <= e) { s = Math.min(s, iv[i][0]); e = Math.max(e, iv[i][1]); i++; }
    out.add(new int[] {s, e});
    while (i < n) out.add(iv[i++]);
    return out.toArray(new int[0][]);
}

int eraseOverlapIntervals(int[][] iv) {
    Arrays.sort(iv, (a, b) -> Integer.compare(a[1], b[1]));
    int removed = 0;
    long lastEnd = Long.MIN_VALUE;
    for (int[] x : iv) {
        if (x[0] >= lastEnd) lastEnd = x[1];
        else removed++;
    }
    return removed;
}

int minMeetingRooms(int[][] iv) {
    int n = iv.length;
    int[] starts = new int[n], ends = new int[n];
    for (int k = 0; k < n; k++) { starts[k] = iv[k][0]; ends[k] = iv[k][1]; }
    Arrays.sort(starts); Arrays.sort(ends);
    int rooms = 0, best = 0, j = 0;
    for (int s : starts) {
        while (j < n && ends[j] <= s) { j++; rooms--; }   // free rooms that ended by s
        rooms++;
        best = Math.max(best, rooms);
    }
    return best;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Merge, minimum removals, arrows, meeting rooms: **O(n log n)** for the sort plus an O(n) scan; O(n) output space (O(log n) to O(n) for the sort itself).
- Insert into an already sorted list: **O(n)**, no sort needed. Binary search can find the boundaries in O(log n), but copying the output is still O(n).
- Pairwise overlap checks are O(n²); the sort removes the need for them because only neighbours in sorted order can merge.
- When interval endpoints are small integers (say ≤ 10⁶), a difference array gives the maximum overlap in O(n + range) without sorting.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Not sorting first**, or sorting a copy and then iterating the original.
2. **Merging with \`last.end = cur.end\`** instead of \`max(last.end, cur.end)\`: [1, 10] followed by [2, 3] would shrink to [1, 3].
3. **Wrong boundary semantics:** using \`<\` where touching intervals should merge, or \`<=\` for meetings where back-to-back is allowed.
4. **Sorting by start for "minimum removals".** Keeping the earliest *start* can keep a huge interval that blocks many others; sort by end.
5. **Comparator overflow in Java:** \`(a, b) -> a[0] - b[0]\` overflows for values near ±2³¹. Use \`Integer.compare\`.
6. **Sweep line tie order:** at equal times, ends must be processed before starts for half-open intervals, or back-to-back meetings count as needing two rooms.
7. **Mutating the input's arrays** in Java when the caller reuses them; copy if needed.`,
    },
  ],
  recognition: {
    signals: ['Input is a list of [start, end] pairs', 'Merge, insert, remove overlaps, or count overlaps', 'Calendar, booking, meeting rooms, ranges of IP addresses or time slots', 'Minimum number of points/arrows to cover intervals'],
    antiSignals: ['Contiguous subarray questions on one array: sliding window or prefix sums', 'Many range updates with point queries on a fixed small domain: difference array', 'Range queries with updates: Fenwick or segment tree'],
    decisionQuestions: ['Do touching endpoints count as overlapping?', 'Should I sort by start (merging) or by end (keeping as many as possible)?', 'Do I need the intervals themselves or just a count?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Merge overlapping intervals. Why does sorting by start work?', answerMd: 'After sorting by start, if interval i does not overlap the current merged block, no later interval can either, because every later start is at least as large as interval i\'s start, which already exceeds the block\'s end. So a single pass that compares each interval with the last merged block is enough. O(n log n).' },
    { id: 'iq2', q: 'Find the minimum number of intervals to remove so the rest do not overlap.', answerMd: 'Sort by end. Greedily keep an interval when it starts at or after the end of the last kept one; otherwise remove it. Choosing the earliest end leaves the most room (exchange argument). Answer = n − kept. O(n log n).' },
    { id: 'iq3', q: 'What is the minimum number of meeting rooms?', answerMd: 'The maximum number of meetings in progress at any moment. Either sweep sorted start and end times (process ends before starts at equal times), or sort by start and keep a min-heap of end times, popping rooms that are free. O(n log n).' },
    { id: 'iq4', q: 'Insert a new interval into a sorted list of disjoint intervals.', answerMd: 'Three phases in one pass: copy intervals that end before the new start; merge every interval whose start ≤ the new end into the new interval (taking min start and max end); append it, then copy the rest. O(n), no sorting.' },
    { id: 'iq5', q: 'How do you check if a person can attend all meetings?', answerMd: 'Sort by start time and check that each meeting starts at or after the previous one ends. Any violation means a conflict. O(n log n). Mention whether back-to-back meetings are allowed.' },
    { id: 'iq6', q: 'Given intervals and many point queries "how many intervals contain x?", what would you do?', answerMd: 'Offline: sort starts and ends separately; count(x) = (#starts ≤ x) − (#ends < x) using binary search, O(log n) per query. For a small integer domain, a difference array plus prefix sums answers each query in O(1).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Overlap (closed): a ≤ d && c ≤ b. Half-open: a < d && c < b.
- Merge: sort by start; extend with max(end).
- Insert: before / overlapping / after, O(n).
- Keep the most (min removals, arrows): sort by **end**, greedy.
- Max simultaneous: events (+1 start, −1 end; ends first on ties) or a min-heap of ends.
- Java comparators: Integer.compare, never subtraction.`,
    templates: [cpp(`
vector<vector<int>> mergeIntervals(vector<vector<int>> iv) {
    sort(iv.begin(), iv.end());
    vector<vector<int>> out;
    for (auto& c : iv)
        if (!out.empty() && c[0] <= out.back()[1]) out.back()[1] = max(out.back()[1], c[1]);
        else out.push_back(c);
    return out;
}`, 'C++')],
    flashcards: [
      { id: 'f1', front: 'Overlap test for closed intervals [a,b] and [c,d]?', backMd: '`a <= d && c <= b`.' },
      { id: 'f2', front: 'Sort key for Non-overlapping Intervals (minimum removals)?', backMd: 'End time; keep the earliest-finishing compatible interval.' },
      { id: 'f3', front: 'Merging bug with `last.end = cur.end`?', backMd: 'A contained interval would shrink the block; use max(last.end, cur.end).' },
      { id: 'f4', front: 'Minimum meeting rooms equals…?', backMd: 'The maximum number of overlapping meetings at any moment.' },
      { id: 'f5', front: 'Sweep line tie-break for half-open meetings?', backMd: 'Process end events before start events at the same time.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Interval scheduling (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Interval_scheduling', kind: 'article' },
    { title: 'Merge Intervals (LeetCode 56)', url: 'https://leetcode.com/problems/merge-intervals/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.intervals.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<vector<int>> iv = {{1, 4}, {0, 2}, {5, 7}, {7, 9}, {3, 3}};
    sort(iv.begin(), iv.end());
    vector<vector<int>> out;
    for (auto& c : iv) {
        if (!out.empty() && c[0] <= out.back()[1]) out.back()[1] = max(out.back()[1], c[1]);
        else out.push_back(c);
    }
    for (auto& x : out) cout << "[" << x[0] << "," << x[1] << "] ";
    cout << endl;
    return 0;
}`, 'C++', '[0,4] [5,9]'),
    options: ['[0,4] [5,9]', ['[0,4] [5,7] [7,9]', 'With <=, touching intervals [5,7] and [7,9] merge.'], ['[0,2] [1,4] [5,9]', 'Sorting puts [0,2] before [1,4], and they overlap.'], ['[0,9]', '[0,4] ends before 5.']],
    answer: 0,
    explanation: 'Sorted: [0,2], [1,4], [3,3], [5,7], [7,9]. The first three merge into [0,4] ([3,3] is inside it); [5,7] and [7,9] touch and merge into [5,9].',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.intervals.q2', type: 'pattern', difficulty: 'medium',
    stem: 'To remove the fewest intervals so the rest do not overlap, what should you sort by?',
    options: ['End time', ['Start time', 'Keeping the earliest start can keep a long interval that blocks many short ones.'], ['Length', 'Shortest-first can still choose a badly placed interval.'], ['No sort; use a heap of all intervals', 'Sorting by end with one pass is enough.']],
    answer: 0,
    explanation: 'The earliest-ending interval leaves the most room for the rest. Counterexample for start-sorting: [1,10], [2,3], [4,5]. Start order keeps [1,10] and must remove two; end order keeps [2,3], [4,5] and removes one.',
  }),
  mcq({
    ...base, id: 'dsa.intervals.q3', type: 'edge-case', difficulty: 'medium',
    stem: 'Meetings [9,10] and [10,11] are back to back. With a sweep line that sorts events (time, delta) and processes ties in that order, which delta must come first at time 10 to report 1 room?',
    options: ['The end (−1) before the start (+1)', ['The start (+1) before the end (−1)', 'That briefly counts two meetings at time 10.'], ['Ties do not matter', 'They decide whether back-to-back meetings overlap.'], ['Either, as long as you sort by duration', 'Duration is irrelevant.']],
    answer: 0,
    explanation: 'Sorting pairs (10, −1) before (10, +1) happens naturally because −1 < +1. Then the count goes 1 → 0 → 1, never 2.',
  }),
  mcq({
    ...base, id: 'dsa.intervals.q4', type: 'complexity', difficulty: 'easy',
    stem: 'Inserting a new interval into a list that is already sorted and non-overlapping takes how long with the three-phase scan?',
    options: ['O(n)', ['O(n log n)', 'No sort is needed; the input is already sorted.'], ['O(log n)', 'Binary search finds positions, but building the output is O(n).'], ['O(n²)', 'Each interval is copied or merged once.']],
    answer: 0,
    explanation: 'Each existing interval is visited once: copied before, merged, or copied after.',
  }),
  mcq({
    ...base, id: 'dsa.intervals.q5', type: 'debug', difficulty: 'medium',
    stem: 'This merge loop turns [[1,10],[2,3]] into [[1,3]]. What is wrong?\n\n```\nif (cur[0] <= last[1]) last[1] = cur[1];\n```',
    options: ['It should keep max(last[1], cur[1])', ['It should compare cur[1] with last[0]', 'The overlap test is correct.'], ['It needs to sort by end', 'Merging sorts by start.'], ['It should use < instead of <=', 'Touching intervals still merge in this problem.']],
    answer: 0,
    explanation: '[2,3] lies inside [1,10]; assigning its end shrinks the block. Use max.',
  }),
  mcq({
    ...base, id: 'dsa.intervals.q6', type: 'concept', difficulty: 'easy',
    stem: 'Do the closed intervals [1, 5] and [5, 8] overlap?',
    options: ['Yes, at the point 5', ['No, they only touch', 'For closed intervals touching means sharing the point 5.'], ['Only if sorted', 'Overlap does not depend on order.'], ['Only for half-open intervals', 'Half-open [1,5) and [5,8) do not overlap.']],
    answer: 0,
    explanation: 'a ≤ d (1 ≤ 8) and c ≤ b (5 ≤ 5) both hold. For half-open intervals the strict test 5 < 5 fails, so they would not overlap.',
  }),
  mcq({
    ...base, id: 'dsa.intervals.q7', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[][] iv = {{1, 2}, {2, 3}, {3, 4}, {1, 3}};
        Arrays.sort(iv, (a, b) -> Integer.compare(a[1], b[1]));
        int removed = 0;
        long lastEnd = Long.MIN_VALUE;
        for (int[] x : iv) {
            if (x[0] >= lastEnd) lastEnd = x[1];
            else removed++;
        }
        System.out.println(removed);
    }
}`, 'Java', '1'),
    options: ['1', ['2', 'Only [1,3] conflicts with the chain [1,2], [2,3], [3,4].'], ['0', '[1,3] overlaps [2,3].'], ['3', 'Touching is allowed here (>=), so the chain is kept.']],
    answer: 0,
    explanation: 'Sorted by end: [1,2], [2,3], [1,3], [3,4] (Java\'s sort is stable for objects, so [2,3] stays before [1,3]). Keep [1,2], keep [2,3], remove [1,3] (1 < 3), keep [3,4].',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.intervals.q8', type: 'pattern', difficulty: 'hard',
    stem: 'Balloons are intervals on the x-axis; an arrow at x bursts every balloon with start ≤ x ≤ end. What is the greedy for the minimum number of arrows?',
    options: ['Sort by end; shoot at the end of the first unburst balloon, skip all balloons that start at or before that point', ['Sort by start; shoot at each start', 'That uses one arrow per balloon.'], ['Merge overlapping balloons, one arrow per merged block', 'Chains like [1,2], [2,3], [3,4] merge into one block but need two arrows.'], ['Shoot at the midpoint of the longest balloon first', 'There is no exchange argument for it.']],
    answer: 0,
    explanation: 'Shooting as far right as possible while still hitting the earliest-ending balloon hits every balloon that overlaps it. This is the same earliest-end greedy as activity selection.',
  }),
];
