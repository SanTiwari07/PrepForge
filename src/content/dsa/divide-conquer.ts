import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.divide-conquer';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Divide and Conquer',
  summary: 'Merge sort, quickselect and counting inversions.',
  level: 'core',
  status: 'complete',
  estMinutes: 75,
  prerequisites: ['dsa.recursion', 'dsa.sorting'],
  related: ['dsa.sorting', 'dsa.binary-search', 'dsa.recursion', 'dsa.fenwick-segment', 'dsa.binary-trees'],
  subtopics: ['Divide, conquer, combine', 'Recurrences and the master theorem', 'Counting across the split (inversions, reverse pairs)', 'Quickselect', 'Building trees from traversals', 'Merging k sorted lists'],
  objectives: [
    'Describe a divide-and-conquer algorithm as divide, solve the parts recursively, and combine, and identify the combine step.',
    'Solve recurrences such as T(n) = 2T(n/2) + O(n) and T(n) = T(n/2) + O(1) with the master theorem or a recursion tree.',
    'Count pairs that cross the split during a merge (inversions, reverse pairs, count of smaller numbers after self).',
    'Build a binary tree from preorder and inorder traversals in O(n) with an index map.',
    'Choose between pairwise merging, divide-and-conquer merging and a heap for merging k sorted lists.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Three steps',
      bodyMd: `1. **Divide** the input into smaller independent subproblems (usually halves).
2. **Conquer** each subproblem recursively; tiny inputs are base cases.
3. **Combine** the sub-answers into the answer for the whole input.

The **combine** step is where the problem-specific insight lives:

| Problem | Divide | Combine |
|---|---|---|
| Merge sort | halves | merge two sorted halves, O(n) |
| Count inversions / reverse pairs | halves | count pairs (i in left, j in right) while both halves are sorted |
| Maximum subarray (D&C version) | halves | best crossing subarray = best suffix of left + best prefix of right |
| Build tree from preorder + inorder | split inorder at the root | attach left and right subtrees |
| Merge k sorted lists | halves of the list of lists | merge two lists |
| Closest pair of points | by x-coordinate | check a strip around the dividing line |

Divide and conquer differs from DP in that the subproblems are **independent** (they do not overlap). When they overlap, memoise and you have DP.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Analysing recurrences',
      bodyMd: `**Master theorem** for T(n) = a·T(n/b) + O(n^d):
- if d > log_b a: T(n) = O(n^d) (the combine work at the top dominates);
- if d = log_b a: T(n) = O(n^d log n) (every level does equal work);
- if d < log_b a: T(n) = O(n^(log_b a)) (the leaves dominate).

| Recurrence | Example | Result |
|---|---|---|
| T(n) = 2T(n/2) + O(n) | merge sort, inversions | O(n log n) |
| T(n) = T(n/2) + O(1) | binary search | O(log n) |
| T(n) = T(n/2) + O(n) | quickselect (balanced pivots) | O(n) |
| T(n) = 2T(n/2) + O(1) | tree traversal, D&C max | O(n) |
| T(n) = 2T(n/2) + O(n log n) | naive closest pair | O(n log² n) |

**Counting across the split.** Many "count pairs i < j with a condition" problems become O(n log n): the pairs inside each half are counted recursively; the pairs that cross (i in the left half, j in the right) are counted in the combine step, where **both halves are already sorted**, so a two-pointer sweep counts them in O(n). Reverse Pairs (a[i] > 2·a[j]) is the classic: count with a second pointer before merging.

**Building a tree from preorder + inorder:** preorder's first element is the root; its position in inorder splits the left and right subtrees. With a hash map from value to inorder index, each node is placed in O(1), O(n) total (instead of O(n²) with linear searches).`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: Reverse Pairs on [1, 3, 2, 3, 1]',
      bodyMd: 'Count pairs i < j with a[i] > 2·a[j]. The answer is 2: (3, 1) at indices (1, 4) and (3, 4).',
      trace: [
        { note: 'Split into [1, 3] and [2, 3, 1]. Recursively, [1, 3] has 0 pairs.', array: [1, 3, 2, 3, 1], window: [0, 1] },
        { note: '[2, 3, 1] splits into [2] and [3, 1]. In [3, 1]: 3 > 2·1, one pair. Sorted: [1, 3].', array: [1, 3, 2, 1, 3], window: [3, 4], vars: { pairs: 1 } },
        { note: 'Combine [2] with [1, 3]: 2 > 2·1? No. Sorted: [1, 2, 3].', array: [1, 3, 1, 2, 3], window: [2, 4], vars: { pairs: 1 } },
        { note: 'Top combine: left [1, 3], right [1, 2, 3]. For left 1: no right value r has 1 > 2r. For left 3: r = 1 works (3 > 2), r = 2 does not. One more pair.', array: [1, 3, 1, 2, 3], vars: { pairs: 2 } },
        { note: 'Merge into [1, 1, 2, 3, 3]. Total 2. The pointer over the right half only moves forward because the left half is sorted.', array: [1, 1, 2, 3, 3], vars: { pairs: 2 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Reverse pairs with a merge, tree construction from traversals, and merge k sorted lists by halving.',
      code: [
        cpp(`
long long sortCount(vector<int>& a, int lo, int hi) {           // [lo, hi)
    if (hi - lo <= 1) return 0;
    int mid = lo + (hi - lo) / 2;
    long long cnt = sortCount(a, lo, mid) + sortCount(a, mid, hi);
    int j = mid;
    for (int i = lo; i < mid; ++i) {                             // both halves sorted here
        while (j < hi && (long long)a[i] > 2LL * a[j]) ++j;
        cnt += j - mid;
    }
    inplace_merge(a.begin() + lo, a.begin() + mid, a.begin() + hi);
    return cnt;
}
int reversePairs(vector<int>& a) { return (int)sortCount(a, 0, a.size()); }

TreeNode* build(const vector<int>& pre, int& p, int lo, int hi, unordered_map<int, int>& pos) {
    if (lo > hi) return nullptr;
    TreeNode* root = new TreeNode(pre[p++]);
    int m = pos[root->val];
    root->left = build(pre, p, lo, m - 1, pos);                 // left subtree first: preorder order
    root->right = build(pre, p, m + 1, hi, pos);
    return root;
}
TreeNode* buildTree(const vector<int>& pre, const vector<int>& in) {
    unordered_map<int, int> pos;
    for (int i = 0; i < (int)in.size(); ++i) pos[in[i]] = i;
    int p = 0;
    return build(pre, p, 0, in.size() - 1, pos);
}

ListNode* mergeTwo(ListNode* a, ListNode* b) {
    ListNode dummy(0), *t = &dummy;
    while (a && b) { if (a->val <= b->val) { t->next = a; a = a->next; } else { t->next = b; b = b->next; } t = t->next; }
    t->next = a ? a : b;
    return dummy.next;
}
ListNode* mergeKLists(vector<ListNode*>& lists) {               // O(N log k)
    if (lists.empty()) return nullptr;
    for (int step = 1; step < (int)lists.size(); step *= 2)
        for (int i = 0; i + step < (int)lists.size(); i += 2 * step)
            lists[i] = mergeTwo(lists[i], lists[i + step]);
    return lists[0];
}`, 'C++'),
        java(`
long sortCount(int[] a, int[] tmp, int lo, int hi) {
    if (hi - lo <= 1) return 0;
    int mid = lo + (hi - lo) / 2;
    long cnt = sortCount(a, tmp, lo, mid) + sortCount(a, tmp, mid, hi);
    int j = mid;
    for (int i = lo; i < mid; i++) {
        while (j < hi && (long) a[i] > 2L * a[j]) j++;
        cnt += j - mid;
    }
    int i = lo, k = lo; j = mid;
    while (i < mid && j < hi) tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    while (i < mid) tmp[k++] = a[i++];
    while (j < hi) tmp[k++] = a[j++];
    System.arraycopy(tmp, lo, a, lo, hi - lo);
    return cnt;
}
int reversePairs(int[] a) { return (int) sortCount(a, new int[a.length], 0, a.length); }

private int p;
private Map<Integer, Integer> pos;
TreeNode buildTree(int[] pre, int[] in) {
    pos = new HashMap<>();
    for (int i = 0; i < in.length; i++) pos.put(in[i], i);
    p = 0;
    return build(pre, 0, in.length - 1);
}
private TreeNode build(int[] pre, int lo, int hi) {
    if (lo > hi) return null;
    TreeNode root = new TreeNode(pre[p++]);
    int m = pos.get(root.val);
    root.left = build(pre, lo, m - 1);
    root.right = build(pre, m + 1, hi);
    return root;
}

ListNode mergeTwo(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), t = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; }
        t = t.next;
    }
    t.next = a != null ? a : b;
    return dummy.next;
}
ListNode mergeKLists(ListNode[] lists) {
    if (lists.length == 0) return null;
    for (int step = 1; step < lists.length; step *= 2)
        for (int i = 0; i + step < lists.length; i += 2 * step)
            lists[i] = mergeTwo(lists[i], lists[i + step]);
    return lists[0];
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Reverse pairs / inversions via merge: O(n log n) time, O(n) space.
- Build tree from preorder + inorder with an index map: O(n) time and space (O(n²) with a linear search per node).
- Merge k sorted lists of N total nodes: O(N log k) by halving or with a heap; merging one list at a time into an accumulator is O(N · k).
- Quickselect: O(n) expected (T(n) = T(n/2) + O(n)).
- Recursion depth is O(log n) for balanced splits and O(n) for degenerate ones (skewed trees).`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Counting cross pairs after merging** instead of before: once merged, you no longer know which elements came from which half.
2. **Overflow in 2·a[j]** when values are near ±2³¹; use 64-bit.
3. **Building the right subtree before the left** when consuming preorder left to right: preorder is root, left, right.
4. **Linear search for the root in inorder** at each level: O(n²) on skewed trees.
5. **Duplicate values** break the value→index map for tree construction; the problem guarantees distinct values for a reason.
6. **Merging k lists one by one into a growing accumulator:** O(N · k) instead of O(N log k).
7. **Base case mistakes** with half-open vs closed ranges ([lo, hi) vs [lo, hi]); pick one convention per function.`,
    },
  ],
  recognition: {
    signals: ['Count pairs i < j with an order condition in O(n log n)', 'The answer for the whole combines answers of halves plus a crossing part', 'Build a tree from traversals', 'Merge many sorted sequences', 'Recursively split a range or a structure (quad trees, segment trees)'],
    antiSignals: ['Subproblems overlap: DP', 'A single pass with a running state works (Kadane beats D&C max subarray)', 'Point updates and range queries online: Fenwick or segment tree'],
    decisionQuestions: ['What is the combine step, and what does it need from the halves (sorted order, prefix/suffix bests)?', 'Is the split balanced?', 'Do the subproblems overlap?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Use the master theorem on T(n) = 2T(n/2) + O(n) and on T(n) = T(n/2) + O(n).', answerMd: 'First: a = 2, b = 2, d = 1, log₂2 = 1 = d → O(n log n) (merge sort). Second: a = 1, b = 2, d = 1, log₂1 = 0 < d → O(n) (quickselect with good pivots): the top level\'s n dominates the geometric series n + n/2 + n/4 + …' },
    { id: 'iq2', q: 'Count reverse pairs (i < j and a[i] > 2·a[j]) in O(n log n).', answerMd: 'Merge sort. After sorting both halves, for each left element advance a pointer over the right half while a[i] > 2·a[j]; add the pointer offset. The pointer never moves back because the left half is sorted. Then merge. Use 64-bit for 2·a[j].' },
    { id: 'iq3', q: 'Construct a binary tree from preorder and inorder traversals.', answerMd: 'The next preorder value is the root of the current range; its inorder index m splits the range into left [lo, m−1] and right [m+1, hi]. Recurse left then right, consuming preorder in order. A hash map from value to inorder index makes it O(n).' },
    { id: 'iq4', q: 'Merge k sorted lists: compare approaches.', answerMd: 'One by one into an accumulator: O(Nk). Min-heap of the k heads: O(N log k), O(k) extra space. Pairwise halving (merge 1+2, 3+4, … then repeat): O(N log k), O(1) extra space for linked lists. Heap and halving are both good answers.' },
    { id: 'iq5', q: 'How does divide and conquer differ from dynamic programming?', answerMd: 'Both split a problem into subproblems. In divide and conquer, the subproblems are independent (merge sort\'s halves share nothing), so each is solved once naturally. In DP the subproblems overlap, so naive recursion repeats work and memoisation is needed.' },
    { id: 'iq6', q: 'Give the divide-and-conquer solution for maximum subarray. Is it better than Kadane?', answerMd: 'Best of left half, right half, and the best subarray crossing the middle (best suffix of left + best prefix of right, found in O(n)): T(n) = 2T(n/2) + O(n) = O(n log n). Kadane is O(n), so D&C is not better for one query, but returning (total, best prefix, best suffix, best) per node makes it combinable in O(1), which is how segment trees answer range max-subarray queries.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Divide → conquer → combine; the combine step is the insight.
- Master theorem: compare d with log_b a.
- Cross-pair counting during merge: count before merging; halves are sorted.
- Tree from preorder + inorder: hash map of inorder indices; build left before right.
- Merge k lists: halving or heap, O(N log k).
- Overlapping subproblems → DP instead.`,
    flashcards: [
      { id: 'f1', front: 'T(n) = 2T(n/2) + O(n) solves to?', backMd: 'O(n log n).' },
      { id: 'f2', front: 'T(n) = T(n/2) + O(n) solves to?', backMd: 'O(n): the geometric series n + n/2 + … ≤ 2n.' },
      { id: 'f3', front: 'When do you count reverse pairs in merge sort?', backMd: 'After both halves are sorted and before merging them, with a forward-only pointer.' },
      { id: 'f4', front: 'Complexity of building a tree from preorder + inorder with a hash map?', backMd: 'O(n).' },
      { id: 'f5', front: 'Merge k sorted lists: best complexities?', backMd: 'O(N log k) with a heap or pairwise halving.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 12, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Divide-and-conquer algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Divide-and-conquer_algorithm', kind: 'article' },
    { title: 'Master theorem (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Master_theorem_(analysis_of_algorithms)', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.dc.q1', type: 'complexity', difficulty: 'medium',
    stem: 'What does T(n) = 3T(n/2) + O(n) solve to?',
    options: ['O(n^log₂3) ≈ O(n^1.585)', ['O(n log n)', 'That needs a = b (two halves).'], ['O(n)', 'The leaves dominate: log₂3 > 1.'], ['O(n²)', 'log₂3 ≈ 1.585 < 2.']],
    answer: 0,
    explanation: 'a = 3, b = 2, d = 1: log₂3 ≈ 1.585 > d, so T(n) = O(n^1.585). This is Karatsuba multiplication.',
  }),
  mcq({
    ...base, id: 'dsa.dc.q2', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
long long cnt(vector<int>& a, int lo, int hi) {
    if (hi - lo <= 1) return 0;
    int mid = (lo + hi) / 2;
    long long c = cnt(a, lo, mid) + cnt(a, mid, hi);
    int j = mid;
    for (int i = lo; i < mid; ++i) {
        while (j < hi && (long long)a[i] > 2LL * a[j]) ++j;
        c += j - mid;
    }
    inplace_merge(a.begin() + lo, a.begin() + mid, a.begin() + hi);
    return c;
}
int main() {
    vector<int> a = {2, 4, 3, 5, 1};
    cout << cnt(a, 0, 5) << endl;
    return 0;
}`, 'C++', '3'),
    options: ['3', ['4', '(2, 1) does not count: 2 > 2·1 is false.'], ['2', '(5, 1) counts too: 5 > 2.'], ['1', 'Three right-side 1s pair up with 4, 3 and 5.']],
    answer: 0,
    explanation: 'Pairs with a[i] > 2·a[j]: (4, 1), (3, 1) and (5, 1). (2, 1) fails because 2 is not greater than 2, and (4, 3) fails because 4 < 6.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.dc.q3', type: 'concept', difficulty: 'easy',
    stem: 'What distinguishes divide and conquer from dynamic programming?',
    options: ['Divide-and-conquer subproblems are independent; DP subproblems overlap', ['Divide and conquer is always faster', 'Not necessarily.'], ['DP cannot use recursion', 'Memoised recursion is DP.'], ['Divide and conquer only works on arrays', 'Trees, points and lists too.']],
    answer: 0,
    explanation: 'Merge sort\'s halves share no work. Fibonacci\'s subproblems repeat, so they must be cached.',
  }),
  mcq({
    ...base, id: 'dsa.dc.q4', type: 'debug', difficulty: 'medium',
    stem: 'A reverse-pairs solution merges the two halves first and then counts pairs i < j (by position in the merged array) with a[i] > 2·a[j]. What is wrong?',
    options: ['After merging you cannot tell which elements came from the left half, so it counts the wrong pairs', ['Merging first is faster and still correct', 'The original index order is lost.'], ['It overflows', 'Overflow is a separate issue.'], ['It counts each pair twice', 'It counts different pairs, not duplicates.']],
    answer: 0,
    explanation: 'Cross pairs must have i in the left half and j in the right half of the original order. Count them while the halves are separate (each sorted), then merge.',
  }),
  mcq({
    ...base, id: 'dsa.dc.q5', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print (the postorder of the tree built from the traversals)?',
    code: java(`import java.util.*;

public class Main {
    static int p = 0;
    static Map<Integer, Integer> pos = new HashMap<>();
    static StringBuilder out = new StringBuilder();
    static void build(int[] pre, int lo, int hi) {
        if (lo > hi) return;
        int root = pre[p++];
        int m = pos.get(root);
        build(pre, lo, m - 1);
        build(pre, m + 1, hi);
        out.append(root).append(' ');
    }
    public static void main(String[] args) {
        int[] pre = {3, 9, 20, 15, 7}, in = {9, 3, 15, 20, 7};
        for (int i = 0; i < in.length; i++) pos.put(in[i], i);
        build(pre, 0, in.length - 1);
        System.out.println(out.toString().trim());
    }
}`, 'Java', '9 15 7 20 3'),
    options: ['9 15 7 20 3', ['3 9 20 15 7', 'That is the preorder input.'], ['9 3 15 20 7', 'That is the inorder input.'], ['15 7 20 9 3', 'The left subtree (9) is finished first.']],
    answer: 0,
    explanation: 'The tree is 3 with left child 9 and right child 20, which has children 15 and 7. Appending each root after its subtrees prints the postorder.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.dc.q6', type: 'complexity', difficulty: 'medium',
    stem: 'Merging k sorted lists with N nodes in total by repeatedly merging the next list into one growing result list costs how much?',
    options: ['O(N · k) in the worst case', ['O(N log k)', 'That is pairwise halving or a heap.'], ['O(N)', 'The growing list is rescanned at every step.'], ['O(k log N)', 'Every node must be visited.']],
    answer: 0,
    explanation: 'With equal list sizes N/k, step i merges about i·N/k nodes: the sum is about N·k/2. Halving merges each node only log₂k times.',
  }),
  mcq({
    ...base, id: 'dsa.dc.q7', type: 'pattern', difficulty: 'hard',
    stem: 'Count of Smaller Numbers After Self asks, for every i, how many j > i have a[j] < a[i]. Which approach fits?',
    options: ['Merge sort over (value, original index) pairs, adding the number of right-half elements merged before each left element', ['A single left-to-right scan with a counter', 'Each element needs information about all later elements.'], ['Sort and use the sorted position', 'Sorting loses the "after self" condition.'], ['A monotonic stack', 'It finds the next smaller element, not the count of smaller ones.']],
    answer: 0,
    explanation: 'When a left element is placed, every right-half element already placed is smaller and originally after it. A Fenwick tree over compressed values is the other standard O(n log n) solution.',
  }),
  mcq({
    ...base, id: 'dsa.dc.q8', type: 'edge-case', difficulty: 'easy',
    stem: 'Building a tree from preorder and inorder with a value→index map. Which input breaks it?',
    options: ['Traversals containing duplicate values', ['A single node', 'Handled by the base case.'], ['A skewed tree', 'Correct, with O(n) recursion depth.'], ['Negative values', 'They are valid keys.']],
    answer: 0,
    explanation: 'With duplicates, a value maps to one index while the tree may need another, so the split is ambiguous. LeetCode guarantees distinct values for this reason.',
  }),
];
