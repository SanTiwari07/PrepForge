import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.sorting';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Sorting',
  summary: 'Merge, quick, heap and counting sort; stability and custom comparators.',
  level: 'foundation',
  status: 'complete',
  estMinutes: 85,
  prerequisites: ['dsa.complexity'],
  related: ['dsa.divide-conquer', 'dsa.two-pointers', 'dsa.intervals', 'dsa.greedy', 'dsa.heaps'],
  subtopics: ['Comparison sorts and the n log n lower bound', 'Merge sort', 'Quicksort and partitioning', 'Heap sort', 'Counting and bucket sort', 'Stability', 'Custom comparators', 'Dutch national flag (3-way partition)'],
  objectives: [
    'Compare merge sort, quicksort, heap sort and counting sort by time, space, stability and worst case.',
    'Implement merge sort and Lomuto/Hoare-style partitioning, and explain why random pivots avoid the O(n²) worst case in expectation.',
    'Write correct custom comparators in C++ and Java (strict weak ordering, no subtraction overflow).',
    'Know what the standard library sorts guarantee (std::sort vs std::stable_sort; Arrays.sort for primitives vs objects).',
    'Recognise when sorting turns a hard problem into a two-pointer, greedy or interval scan, and when a linear-time sort applies.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'The algorithms at a glance',
      bodyMd: `| Algorithm | Best | Average | Worst | Extra space | Stable |
|---|---|---|---|---|---|
| Insertion sort | O(n) | O(n²) | O(n²) | O(1) | yes |
| Merge sort | O(n log n) | O(n log n) | O(n log n) | O(n) | yes |
| Quicksort (random pivot) | O(n log n) | O(n log n) | O(n²) | O(log n) stack | no |
| Heap sort | O(n log n) | O(n log n) | O(n log n) | O(1) | no |
| Counting sort (keys in 0..k) | O(n + k) | O(n + k) | O(n + k) | O(n + k) | yes (if done carefully) |

**Lower bound:** any algorithm that sorts only by comparing elements needs Ω(n log n) comparisons in the worst case (a decision tree with n! leaves has height ≥ log₂ n!). Counting, radix and bucket sort beat it by using the values themselves, not comparisons.

**Stability** means equal keys keep their original relative order. It matters when you sort by one key after another (sort by name, then stably by department → grouped by department, names in order within each group).

**What the libraries do:**
- C++ \`std::sort\`: introsort (quicksort + heap sort fallback + insertion sort), O(n log n) worst case, **not stable**. \`std::stable_sort\` is a merge sort.
- Java \`Arrays.sort(int[])\` (primitives): dual-pivot quicksort, not stable (stability is meaningless for primitives). \`Arrays.sort(Object[])\` and \`Collections.sort\`: TimSort, **stable**, O(n log n).`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'How merge sort and quicksort divide the work',
      bodyMd: `**Merge sort** splits the array in half, sorts each half recursively, and **merges** the two sorted halves with two pointers. The work per level of recursion is O(n) and there are log₂ n levels: O(n log n) always. The merge step is also where you can count **inversions** (pairs i < j with a[i] > a[j]): when an element of the right half is taken, all remaining left-half elements are inversions with it.

**Quicksort** picks a pivot, **partitions** the array into "< pivot", (pivot), "≥ pivot", and recurses on both sides. Balanced splits give O(n log n); always picking the smallest element (a sorted input with a first-element pivot) gives O(n²). A random pivot makes the expected time O(n log n) for every input. **Quickselect** recurses into only one side to find the k-th smallest in O(n) expected time.

**Three-way partition (Dutch national flag):** three regions < pivot, = pivot, > pivot with pointers lo, mid, hi. This is Sort Colors in one pass and also protects quicksort from arrays with many equal keys.

**Comparators:** a comparator must be a *strict weak ordering*: irreflexive (comp(a, a) is false), and consistent. In C++, a comparator using \`<=\` violates this and can make \`std::sort\` crash or loop. In Java, \`(a, b) -> a - b\` overflows for large values; use \`Integer.compare\`.

**Sorting as a preprocessing step** is often the whole trick: 3Sum (sort + two pointers), meeting intervals, greedy assignments, grouping anagrams by their sorted letters, and Largest Number (a custom comparator: a before b if a + b > b + a as strings).`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: Lomuto partition of [3, 7, 8, 5, 2, 1, 9, 5, 4] with pivot 4',
      bodyMd: 'The pivot is the last element. `i` marks the end of the "< pivot" region; `j` scans.',
      trace: [
        { note: 'j = 0: 3 < 4, swap a[0] with a[0]; i = 1.', array: [3, 7, 8, 5, 2, 1, 9, 5, 4], pointers: { i: 1, j: 0 } },
        { note: 'j = 1..3: 7, 8, 5 are ≥ 4, skip.', array: [3, 7, 8, 5, 2, 1, 9, 5, 4], pointers: { i: 1, j: 3 } },
        { note: 'j = 4: 2 < 4, swap with a[1] (7); i = 2.', array: [3, 2, 8, 5, 7, 1, 9, 5, 4], pointers: { i: 2, j: 4 }, highlight: [1, 4] },
        { note: 'j = 5: 1 < 4, swap with a[2] (8); i = 3.', array: [3, 2, 1, 5, 7, 8, 9, 5, 4], pointers: { i: 3, j: 5 }, highlight: [2, 5] },
        { note: 'j = 6, 7: 9 and 5 are ≥ 4, skip. Finally swap the pivot into a[i].', array: [3, 2, 1, 4, 7, 8, 9, 5, 5], pointers: { i: 3 }, highlight: [3, 8] },
        { note: 'The pivot 4 is at index 3, its final sorted position. Recurse on [3, 2, 1] and [7, 8, 9, 5, 5].', array: [3, 2, 1, 4, 7, 8, 9, 5, 5], highlight: [3] },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Merge sort with inversion counting, randomised quickselect, Sort Colors and a custom comparator.',
      code: [
        cpp(`
// Sorts a[lo, hi) and returns the number of inversions in that range.
long long mergeSort(vector<int>& a, vector<int>& tmp, int lo, int hi) {
    if (hi - lo <= 1) return 0;
    int mid = lo + (hi - lo) / 2;
    long long inv = mergeSort(a, tmp, lo, mid) + mergeSort(a, tmp, mid, hi);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];          // <= keeps the sort stable
        else { inv += mid - i; tmp[k++] = a[j++]; }   // a[i..mid) are all > a[j]
    }
    while (i < mid) tmp[k++] = a[i++];
    while (j < hi) tmp[k++] = a[j++];
    copy(tmp.begin() + lo, tmp.begin() + hi, a.begin() + lo);
    return inv;
}

// k-th smallest (0-based), expected O(n).
int quickselect(vector<int> a, int k) {
    int lo = 0, hi = a.size() - 1;
    mt19937 rng(12345);
    while (true) {
        int p = lo + rng() % (hi - lo + 1);
        swap(a[p], a[hi]);
        int i = lo;
        for (int j = lo; j < hi; ++j) if (a[j] < a[hi]) swap(a[i++], a[j]);
        swap(a[i], a[hi]);                               // pivot at its final index i
        if (i == k) return a[i];
        if (i < k) lo = i + 1; else hi = i - 1;
    }
}

void sortColors(vector<int>& a) {                        // 0s, 1s, 2s in one pass
    int lo = 0, mid = 0, hi = a.size() - 1;
    while (mid <= hi) {
        if (a[mid] == 0) swap(a[lo++], a[mid++]);
        else if (a[mid] == 1) ++mid;
        else swap(a[mid], a[hi--]);                      // do not advance mid: re-check the swapped value
    }
}

string largestNumber(vector<int> nums) {
    vector<string> s;
    for (int x : nums) s.push_back(to_string(x));
    sort(s.begin(), s.end(), [](const string& a, const string& b) { return a + b > b + a; });
    if (s[0] == "0") return "0";
    string out;
    for (auto& t : s) out += t;
    return out;
}`, 'C++'),
        java(`
long mergeSort(int[] a, int[] tmp, int lo, int hi) {
    if (hi - lo <= 1) return 0;
    int mid = lo + (hi - lo) / 2;
    long inv = mergeSort(a, tmp, lo, mid) + mergeSort(a, tmp, mid, hi);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];
        else { inv += mid - i; tmp[k++] = a[j++]; }
    }
    while (i < mid) tmp[k++] = a[i++];
    while (j < hi) tmp[k++] = a[j++];
    System.arraycopy(tmp, lo, a, lo, hi - lo);
    return inv;
}

int quickselect(int[] a, int k) {
    Random rng = new Random(12345);
    int lo = 0, hi = a.length - 1;
    while (true) {
        int p = lo + rng.nextInt(hi - lo + 1);
        int t = a[p]; a[p] = a[hi]; a[hi] = t;
        int i = lo;
        for (int j = lo; j < hi; j++) if (a[j] < a[hi]) { t = a[i]; a[i] = a[j]; a[j] = t; i++; }
        t = a[i]; a[i] = a[hi]; a[hi] = t;
        if (i == k) return a[i];
        if (i < k) lo = i + 1; else hi = i - 1;
    }
}

void sortColors(int[] a) {
    int lo = 0, mid = 0, hi = a.length - 1;
    while (mid <= hi) {
        if (a[mid] == 0) { int t = a[lo]; a[lo++] = a[mid]; a[mid++] = t; }
        else if (a[mid] == 1) mid++;
        else { int t = a[hi]; a[hi--] = a[mid]; a[mid] = t; }
    }
}

String largestNumber(int[] nums) {
    String[] s = new String[nums.length];
    for (int i = 0; i < nums.length; i++) s[i] = String.valueOf(nums[i]);
    Arrays.sort(s, (a, b) -> (b + a).compareTo(a + b));
    if (s[0].equals("0")) return "0";
    return String.join("", s);
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity and choosing an algorithm',
      bodyMd: `- Library sorts: O(n log n). Use them in interviews unless asked to implement one.
- Merge sort: Θ(n log n) always; O(n) extra space; the natural choice for linked lists (merge needs no extra array there) and for counting inversions.
- Quicksort: O(n log n) expected with random pivots; O(n²) worst; in place apart from the O(log n) expected stack.
- Quickselect: O(n) expected, O(n²) worst; median-of-medians gives O(n) worst case but is rarely expected.
- Counting sort: O(n + k) for integer keys in a range of size k; radix sort: O(d · (n + b)) for d digits in base b.
- Sorting strings of total length S: O(S log n) comparisons-worth of character work in the worst case, since comparing two strings is not O(1).`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Invalid comparators:** \`<=\` in C++ (not a strict ordering; can crash std::sort), or \`a - b\` in Java (overflow).
2. **Assuming std::sort is stable.** Use std::stable_sort when the order of equal elements matters.
3. **Sorting when only the k-th element is needed:** a heap (O(n log k)) or quickselect (O(n)) is better.
4. **Sort Colors: advancing mid after swapping with hi**, which skips checking the value that came from the end.
5. **Quicksort with the first element as the pivot on sorted input:** O(n²) and deep recursion.
6. **Merge with \`<\` instead of \`<=\`** when stability (or correct inversion counts with duplicates) matters.
7. **Largest Number: forgetting the all-zero case** ("00" instead of "0").
8. **Sorting a copy and then using the original indices**: when you need original positions, sort indices or (value, index) pairs.`,
    },
  ],
  recognition: {
    signals: ['Order matters for a greedy or two-pointer scan', 'Group equal items or detect duplicates', 'k-th smallest/largest or median', 'Merge sorted data, count inversions', 'Values in a small range (counting sort)'],
    antiSignals: ['Only the maximum or minimum: a single pass', 'Need original order preserved: sort indices, or use a hash map', 'Online data with repeated min/max: a heap'],
    decisionQuestions: ['Does sorting make the problem a two-pointer or greedy scan?', 'Do I need stability?', 'Is n log n acceptable, or is there a linear method (counting, quickselect, hashing)?', 'Is my comparator a strict weak ordering?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Merge sort vs quicksort: when would you choose each?', answerMd: 'Merge sort: guaranteed O(n log n), stable, O(n) extra space; ideal for linked lists and external sorting. Quicksort: in place, cache-friendly, usually faster in practice, O(n log n) expected with random pivots but O(n²) worst; not stable. Standard libraries combine them (introsort, TimSort).' },
    { id: 'iq2', q: 'Why can no comparison sort beat O(n log n)?', answerMd: 'A comparison sort is a binary decision tree whose leaves are the n! possible orderings. A tree with n! leaves has height ≥ log₂(n!) = Θ(n log n), so some input needs that many comparisons. Counting and radix sort avoid the bound by indexing on the values instead of comparing them.' },
    { id: 'iq3', q: 'Count inversions in an array in O(n log n).', answerMd: 'Merge sort. During the merge, when an element from the right half is placed before the remaining left-half elements, each of those (mid − i of them) forms an inversion with it. Sum over all merges. Use 64-bit counts (up to n(n−1)/2).' },
    { id: 'iq4', q: 'What is a stable sort, and give an example where it matters.', answerMd: 'Equal keys keep their relative input order. Example: a list of employees already sorted by name; stably sorting it by department leaves names alphabetical within each department. An unstable sort may scramble them.' },
    { id: 'iq5', q: 'Sort an array of 0s, 1s and 2s in one pass with O(1) space.', answerMd: 'Dutch national flag: lo, mid, hi. a[mid] == 0 → swap with a[lo], lo++, mid++. 1 → mid++. 2 → swap with a[hi], hi-- (do not advance mid). Invariant: [0, lo) are 0s, [lo, mid) are 1s, (hi, end] are 2s.' },
    { id: 'iq6', q: 'Find the k-th largest element without sorting.', answerMd: 'Quickselect: partition around a random pivot and recurse into the side containing index n − k; O(n) expected. Or a min-heap of size k: O(n log k), works on streams. Sorting is O(n log n).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Comparison lower bound Ω(n log n); counting/radix beat it on integer keys.
- Merge: stable, O(n log n) always, O(n) space; counts inversions.
- Quick: in place, expected O(n log n) with random pivot, O(n²) worst; quickselect O(n) expected.
- std::sort unstable (introsort); std::stable_sort stable. Java objects: TimSort (stable); primitives: dual-pivot quicksort.
- Comparators: strict (<, not <=); Java Integer.compare, not a − b.
- Dutch flag: lo/mid/hi; don't advance mid after swapping with hi.`,
    flashcards: [
      { id: 'f1', front: 'Is std::sort stable?', backMd: 'No. Use std::stable_sort.' },
      { id: 'f2', front: 'Which Java sort is stable?', backMd: 'Arrays.sort on objects and Collections.sort (TimSort). Primitive Arrays.sort uses dual-pivot quicksort.' },
      { id: 'f3', front: 'Worst case of quicksort and how to avoid it in expectation?', backMd: 'O(n²); choose pivots at random.' },
      { id: 'f4', front: 'How does merge sort count inversions?', backMd: 'When a right-half element is merged before the remaining left elements, add (mid − i).' },
      { id: 'f5', front: 'Why is `<=` an invalid C++ comparator?', backMd: 'It is not a strict weak ordering (comp(a, a) must be false); std::sort may misbehave or crash.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Sorting algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Sorting_algorithm', kind: 'article' },
    { title: 'std::sort (cppreference)', url: 'https://en.cppreference.com/w/cpp/algorithm/sort', kind: 'official-docs' },
    { title: 'Arrays (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html', kind: 'official-docs' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.sorting.q1', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
long long inv = 0;
void ms(vector<int>& a, vector<int>& t, int lo, int hi) {
    if (hi - lo <= 1) return;
    int mid = (lo + hi) / 2;
    ms(a, t, lo, mid); ms(a, t, mid, hi);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (a[i] <= a[j]) t[k++] = a[i++];
        else { inv += mid - i; t[k++] = a[j++]; }
    }
    while (i < mid) t[k++] = a[i++];
    while (j < hi) t[k++] = a[j++];
    copy(t.begin() + lo, t.begin() + hi, a.begin() + lo);
}
int main() {
    vector<int> a = {2, 4, 1, 3, 5}, t(5);
    ms(a, t, 0, 5);
    cout << inv << endl;
    return 0;
}`, 'C++', '3'),
    options: ['3', ['2', 'Count the pairs: (2,1), (4,1), (4,3).'], ['4', '(2,3) is not an inversion.'], ['0', 'The array is not sorted.']],
    answer: 0,
    explanation: 'Inversions are pairs i < j with a[i] > a[j]: (2,1), (4,1), (4,3).',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.sorting.q2', type: 'concept', difficulty: 'easy',
    stem: 'Which of these sorts is stable?',
    options: ['Merge sort', ['Quicksort (Lomuto partition)', 'Partition swaps can reorder equal elements.'], ['Heap sort', 'Heap operations move equal keys around.'], ['Selection sort (swap-based)', 'The long-distance swap breaks stability.']],
    answer: 0,
    explanation: 'With a `<=` merge, merge sort takes the left-half element first on ties, preserving input order.',
  }),
  mcq({
    ...base, id: 'dsa.sorting.q3', type: 'complexity', difficulty: 'medium',
    stem: 'Quicksort always uses the first element as the pivot. What is its running time on an already sorted array of n elements?',
    options: ['O(n²)', ['O(n log n)', 'Every partition is maximally unbalanced.'], ['O(n)', 'Partitioning alone is O(n) per level.'], ['O(log n)', 'Far too small.']],
    answer: 0,
    explanation: 'Each partition removes only the pivot: n + (n−1) + … = O(n²), with recursion depth n.',
  }),
  mcq({
    ...base, id: 'dsa.sorting.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[] s = {"3", "30", "34", "5", "9"};
        Arrays.sort(s, (a, b) -> (b + a).compareTo(a + b));
        System.out.println(String.join("", s));
    }
}`, 'Java', '9534330'),
    options: ['9534330', ['9534303', '"3" + "30" = "330" beats "303", so 3 goes before 30.'], ['9543330', '"34" + "3" = "343" beats "334", so 34 goes before 3.'], ['3033459', 'That is plain lexicographic ascending order.']],
    answer: 0,
    explanation: 'Order a before b when a + b > b + a: 9, 5, 34, 3, 30 → "9534330" (LeetCode 179 example).',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.sorting.q5', type: 'debug', difficulty: 'medium',
    stem: 'A Sort Colors loop handles the value 2 with `swap(a[mid], a[hi]); hi--; mid++;`. Which input does it leave unsorted?',
    options: ['[1, 2, 0]', ['[2, 0, 1]', 'This one happens to come out sorted: 2 swaps with 1, then 0 moves to the front.'], ['[0, 1, 2]', 'Already sorted; the 2 swaps with itself.'], ['[1, 1, 1]', 'There are no 2s.']],
    answer: 0,
    explanation: 'At mid = 1 the 2 swaps with the 0 at the end, giving [1, 0, 2], and mid moves to 2 > hi, so the 0 that arrived is never examined. The result is [1, 0, 2]. After swapping with hi, keep mid where it is.',
  }),
  mcq({
    ...base, id: 'dsa.sorting.q6', type: 'concept', difficulty: 'medium',
    stem: 'Why is `sort(v.begin(), v.end(), [](int a, int b) { return a <= b; })` dangerous in C++?',
    options: ['The comparator is not a strict weak ordering, so std::sort has undefined behaviour', ['It sorts in descending order', '<= is still ascending; the problem is the equality case.'], ['Lambdas cannot be comparators', 'They can.'], ['It is merely slower', 'It can read out of bounds or crash.']],
    answer: 0,
    explanation: 'comp(a, a) must be false. Introsort implementations rely on this; with <= the inner loop can run past the array on inputs with many equal values.',
  }),
  mcq({
    ...base, id: 'dsa.sorting.q7', type: 'pattern', difficulty: 'easy',
    stem: 'n = 10⁶ exam scores, each an integer from 0 to 100. Fastest way to sort them?',
    options: ['Counting sort, O(n + 101)', ['Merge sort', 'O(n log n), slower than necessary.'], ['Insertion sort', 'O(n²).'], ['Quickselect', 'It finds one order statistic, not the full order.']],
    answer: 0,
    explanation: 'Count occurrences of each of the 101 values and write them back in order: linear time.',
  }),
  mcq({
    ...base, id: 'dsa.sorting.q8', type: 'concept', difficulty: 'hard',
    stem: 'Which statement about Java\'s Arrays.sort is correct?',
    options: ['For int[] it uses a dual-pivot quicksort; for Object[] it uses TimSort, which is stable', ['Both use merge sort', 'Primitives use dual-pivot quicksort.'], ['Both are unstable', 'Object sorting is guaranteed stable.'], ['For int[] it is stable and for Object[] it is not', 'The reverse; and stability is irrelevant for primitives.']],
    answer: 0,
    explanation: 'The Javadoc guarantees stability for the object sorts (Arrays.sort(Object[]), Collections.sort). For primitives, equal values are indistinguishable, so stability does not matter.',
  }),
];
