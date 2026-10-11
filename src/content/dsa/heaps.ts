import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.heaps';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Heaps and Priority Queues',
  summary: 'Top-k, k-way merge, two heaps for medians, and scheduling.',
  level: 'core',
  status: 'complete',
  estMinutes: 85,
  prerequisites: ['dsa.binary-trees'],
  related: ['dsa.shortest-paths', 'dsa.greedy', 'dsa.linked-lists', 'dsa.sorting'],
  subtopics: ['Binary heap as an array', 'Top-k with a size-k heap', 'k-way merge', 'Two heaps (running median)', 'Greedy scheduling with a heap', 'Lazy deletion'],
  objectives: [
    'Explain how a binary heap supports push and pop in O(log n) and top in O(1).',
    'Use a heap of size k to find the k largest/smallest/most frequent items in O(n log k).',
    'Merge k sorted sequences with a heap, and maintain a running median with two heaps.',
    'Write correct comparators in C++ (`greater<>`, custom structs) and Java (`Comparator`), avoiding overflow.',
    'Decide when a heap beats sorting and when sorting is simpler.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'What a heap gives you',
      bodyMd: `A **binary heap** is a complete binary tree stored in an array where every parent is ≤ its children (min-heap) or ≥ (max-heap). Children of index i are 2i + 1 and 2i + 2.

| Operation | Cost |
|---|---|
| Peek the min/max | O(1) |
| Push | O(log n): sift up |
| Pop the min/max | O(log n): move the last element to the root, sift down |
| Build from n items | O(n) (heapify) |
| Search or delete an arbitrary item | O(n) |

A heap is **not sorted**. It only guarantees the top. Use it when you repeatedly need "the current smallest/largest" while items keep arriving or changing.

**Language defaults (a classic trap):**
- C++ \`priority_queue<int>\` is a **max**-heap. For a min-heap: \`priority_queue<int, vector<int>, greater<int>>\`.
- Java \`PriorityQueue<Integer>\` is a **min**-heap. For a max-heap: \`new PriorityQueue<>(Comparator.reverseOrder())\`.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Heap patterns',
      bodyMd: `1. **Top-k largest:** keep a *min*-heap of size k. Push each item; if the size exceeds k, pop the smallest. The heap holds the k largest, and its top is the k-th largest. O(n log k).
2. **k-way merge:** push the first element of each sorted list; repeatedly pop the smallest and push its successor. O(N log k).
3. **Two heaps for the median:** a max-heap for the lower half and a min-heap for the upper half, kept balanced (sizes differ by at most 1). The median is read from the tops.
4. **Greedy + heap:** process events in time order, and keep the currently best option in a heap (meeting rooms: the earliest ending meeting; task scheduler: the most frequent remaining task; IPO: the most profitable affordable project).
5. **Dijkstra** is a heap-driven graph search (see Shortest Paths).

Signal words: *k-th largest*, *top k*, *closest k*, *merge k*, *median of a stream*, *minimum cost to repeatedly combine*.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: 3rd largest with a min-heap of size 3',
      bodyMd: 'a = [5, 1, 9, 3, 7, 6]. Keep at most 3 items; the top is the smallest of the 3 largest seen so far.',
      trace: [
        { note: 'Push 5, 1, 9. Heap {1, 5, 9}; top 1.', array: [5, 1, 9, 3, 7, 6], pointers: { i: 2 }, vars: { heap: '{1,5,9}', top: 1 } },
        { note: 'Push 3: size 4 > 3, so pop the min (1). Heap {3, 5, 9}.', array: [5, 1, 9, 3, 7, 6], pointers: { i: 3 }, vars: { heap: '{3,5,9}', top: 3 } },
        { note: 'Push 7: pop 3. Heap {5, 7, 9}.', array: [5, 1, 9, 3, 7, 6], pointers: { i: 4 }, vars: { heap: '{5,7,9}', top: 5 } },
        { note: 'Push 6: pop 5. Heap {6, 7, 9}. Answer: top = 6, the 3rd largest.', array: [5, 1, 9, 3, 7, 6], pointers: { i: 5 }, vars: { heap: '{6,7,9}', top: 6 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'k-th largest with a size-k heap, the running median with two heaps, and a custom comparator.',
      code: [
        cpp(`
int findKthLargest(const vector<int>& a, int k) {
    priority_queue<int, vector<int>, greater<int>> minHeap;   // min-heap
    for (int x : a) {
        minHeap.push(x);
        if ((int)minHeap.size() > k) minHeap.pop();
    }
    return minHeap.top();
}

class MedianFinder {
    priority_queue<int> lo;                                   // max-heap: lower half
    priority_queue<int, vector<int>, greater<int>> hi;        // min-heap: upper half
public:
    void addNum(int x) {
        lo.push(x);
        hi.push(lo.top()); lo.pop();                          // keep every lo <= every hi
        if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }
    }
    double findMedian() const {
        return lo.size() > hi.size() ? lo.top() : (lo.top() + (double)hi.top()) / 2.0;
    }
};

// k closest points to the origin: max-heap on distance, keep size k.
vector<vector<int>> kClosest(const vector<vector<int>>& pts, int k) {
    auto dist = [](const vector<int>& p) { return 1LL * p[0] * p[0] + 1LL * p[1] * p[1]; };
    priority_queue<pair<long long, int>> heap;                // (distance, index), max on top
    for (int i = 0; i < (int)pts.size(); ++i) {
        heap.push({dist(pts[i]), i});
        if ((int)heap.size() > k) heap.pop();
    }
    vector<vector<int>> res;
    while (!heap.empty()) { res.push_back(pts[heap.top().second]); heap.pop(); }
    return res;
}`, 'C++'),
        java(`
int findKthLargest(int[] a, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();   // min-heap by default
    for (int x : a) {
        minHeap.offer(x);
        if (minHeap.size() > k) minHeap.poll();
    }
    return minHeap.peek();
}

class MedianFinder {
    private final PriorityQueue<Integer> lo = new PriorityQueue<>(Comparator.reverseOrder());
    private final PriorityQueue<Integer> hi = new PriorityQueue<>();
    public void addNum(int x) {
        lo.offer(x);
        hi.offer(lo.poll());
        if (hi.size() > lo.size()) lo.offer(hi.poll());
    }
    public double findMedian() {
        return lo.size() > hi.size() ? lo.peek() : (lo.peek() + (double) hi.peek()) / 2.0;
    }
}

int[][] kClosest(int[][] pts, int k) {
    // Max-heap by distance; Long.compare avoids the overflow of "b - a" comparators.
    PriorityQueue<int[]> heap = new PriorityQueue<>((p, q) -> Long.compare(
        (long) q[0] * q[0] + (long) q[1] * q[1], (long) p[0] * p[0] + (long) p[1] * p[1]));
    for (int[] p : pts) {
        heap.offer(p);
        if (heap.size() > k) heap.poll();
    }
    return heap.toArray(new int[0][]);
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Top-k with a size-k heap: **O(n log k) time, O(k) space**, better than sorting (O(n log n)) when k ≪ n, and works on a stream.
- Quickselect finds the k-th largest in **O(n) average** (O(n²) worst case) without extra space. Mention it as a follow-up.
- Running median: O(log n) per insertion, O(1) per query.
- k-way merge: O(N log k).
- Heapify (building from an array) is O(n), not O(n log n): most nodes are near the bottom and sift down only a little.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Wrong default heap direction**: C++ is a max-heap, Java a min-heap.
2. **Using a max-heap of all n items for top-k largest**: correct, but O(n log n) and O(n) memory. A size-k *min*-heap is the intended answer.
3. **Comparator overflow in Java:** \`(a, b) -> b - a\` overflows for large or negative ints. Use \`Integer.compare\` / \`Long.compare\` or \`Comparator.reverseOrder()\`.
4. **Assuming a heap is sorted**: iterating a \`PriorityQueue\` does *not* give sorted order; only repeated \`poll\` does.
5. **Integer overflow in distances** (x² + y² with 10⁴ coordinates fits in int, but larger inputs do not; use 64-bit).
6. **Removing arbitrary elements:** \`PriorityQueue.remove(obj)\` is O(n). For sliding-window medians use lazy deletion (mark and skip at the top) or a balanced BST/multiset.
7. **Median of an even count with integer division** truncates; divide as double.`,
    },
  ],
  recognition: {
    signals: ['k-th largest/smallest, top k, k closest, k most frequent', 'Repeatedly take the current min/max while items arrive', 'Merge k sorted inputs', 'Running median or balance two halves', 'Greedy choice of the best currently available option'],
    antiSignals: ['A single sort answers it and n is small: just sort', 'Min/max of a sliding window: monotonic deque (O(n))', 'Need sorted iteration or floor/ceiling queries: an ordered set/map'],
    decisionQuestions: ['What should be at the top: the smallest or the largest?', 'Can I cap the heap at size k?', 'What exactly is the comparison key, and can it overflow?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Find the k-th largest element. Compare approaches.', answerMd: 'Sorting: O(n log n). Size-k min-heap: O(n log k), O(k) space, works on streams. Quickselect: O(n) average, O(n²) worst case (mitigated with random pivots), in place. Mention the trade-offs.' },
    { id: 'iq2', q: 'Why is building a heap O(n)?', answerMd: 'Bottom-up heapify sifts down each internal node. About half the nodes are leaves (cost 0), a quarter sift down 1 level, an eighth 2 levels, and so on: the sum n·Σ k/2^(k+1) converges to O(n).' },
    { id: 'iq3', q: 'Design a data structure for the median of a data stream.', answerMd: 'Two heaps: a max-heap for the lower half and a min-heap for the upper half. Insert into the lower half, move its top to the upper half, rebalance so that size(lo) ≥ size(hi) and they differ by at most 1. The median is lo.top or the mean of both tops. O(log n) insert, O(1) query.' },
    { id: 'iq4', q: 'How would you schedule meetings into the minimum number of rooms?', answerMd: 'Sort by start time; keep a min-heap of end times of rooms in use. For each meeting, if the earliest-ending room is free (end ≤ start), reuse it (pop); push this meeting\'s end. The heap size at the end is the answer. O(n log n).' },
    { id: 'iq5', q: 'What is the difference between a heap and a BST for "get min"?', answerMd: 'Both give the min in O(log n) or better (heap O(1) peek). A heap is simpler and has a smaller constant but cannot do ordered iteration, floor/ceiling, or delete arbitrary elements efficiently. A balanced BST (std::set, TreeMap) supports all of those in O(log n).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Peek O(1); push/pop O(log n); heapify O(n); not sorted.
- C++ priority_queue = max-heap; min-heap via \`greater<>\`. Java PriorityQueue = min-heap.
- Top k largest: a **min**-heap of size k; top = k-th largest.
- k-way merge: push heads, pop the min, push its next. O(N log k).
- Median: max-heap lo + min-heap hi, balanced.
- Java comparators: \`Integer.compare\`, never \`a - b\` when values can be large.
- Window min/max: a monotonic deque beats a heap.`,
    flashcards: [
      { id: 'f1', front: 'Top k largest: which heap and what size?', backMd: 'A min-heap capped at size k; pop when size > k. The top is the k-th largest.' },
      { id: 'f2', front: 'C++ min-heap declaration?', backMd: '`priority_queue<int, vector<int>, greater<int>>`' },
      { id: 'f3', front: 'Running median structure?', backMd: 'A max-heap for the lower half and a min-heap for the upper half, sizes differing by at most 1.' },
      { id: 'f4', front: 'Complexity of building a heap from n elements?', backMd: 'O(n) with bottom-up heapify.' },
      { id: 'f5', front: 'Why avoid `(a, b) -> b - a` in Java comparators?', backMd: 'Integer overflow for large or negative values; use Integer.compare(b, a).' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 12, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'std::priority_queue (cppreference)', url: 'https://en.cppreference.com/w/cpp/container/priority_queue', kind: 'official-docs' },
    { title: 'PriorityQueue (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/PriorityQueue.html', kind: 'official-docs' },
    { title: 'Binary heap (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Binary_heap', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.heaps.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this C++ program print?',
    code: cpp(`#include <iostream>
#include <queue>
using namespace std;
int main() {
    priority_queue<int> pq;
    for (int x : {4, 1, 7, 3}) pq.push(x);
    cout << pq.top() << " ";
    pq.pop();
    cout << pq.top() << endl;
    return 0;
}`, 'C++', '7 4'),
    options: [['1 3', 'C++ priority_queue is a max-heap by default.'], '7 4', ['4 1', 'Insertion order is irrelevant.'], ['7 3', 'After removing 7, the next largest is 4.']],
    answer: 1,
    explanation: 'std::priority_queue<int> is a max-heap: top is 7; after pop, top is 4.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.heaps.q2', type: 'pattern', difficulty: 'medium',
    stem: 'Find the 10 largest values in a stream of 10⁸ integers with limited memory. Best approach?',
    options: ['A min-heap of size 10', ['Sort the whole stream', 'Needs O(n) memory and O(n log n) time.'], ['A max-heap of all elements', 'O(n) memory.'], ['A hash set', 'It does not order values.']],
    answer: 0,
    explanation: 'Keep the 10 best seen so far; the smallest of them (heap top) is the bar a new value must beat. O(n log 10) time, O(10) memory.',
  }),
  mcq({
    ...base, id: 'dsa.heaps.q3', type: 'complexity', difficulty: 'medium',
    stem: 'What is the time complexity of building a binary heap from n unsorted elements using bottom-up heapify?',
    options: ['O(n)', ['O(n log n)', 'That is n separate pushes; bottom-up heapify is cheaper.'], ['O(log n)', 'Every element must be placed.'], ['O(n²)', 'Far too pessimistic.']],
    answer: 0,
    explanation: 'Most nodes are near the leaves and sift down only a few levels; the total work sums to O(n).',
  }),
  mcq({
    ...base, id: 'dsa.heaps.q4', type: 'debug', difficulty: 'medium',
    stem: 'A Java max-heap uses `new PriorityQueue<>((a, b) -> b - a)` and occasionally orders values wrongly. Why?',
    options: ['b − a can overflow int for large or negative values, flipping the sign of the comparison', ['Lambdas cannot be comparators', 'They can.'], ['PriorityQueue does not accept comparators', 'It does.'], ['It should be a - b', 'That makes a min-heap; overflow remains.']],
    answer: 0,
    explanation: 'For a = −2³¹ and b = 1, b − a overflows. Use `Comparator.reverseOrder()` or `(a, b) -> Integer.compare(b, a)`.',
  }),
  mcq({
    ...base, id: 'dsa.heaps.q5', type: 'concept', difficulty: 'medium',
    stem: 'In the two-heap running median, the lower half is a ___ and the upper half is a ___.',
    options: ['max-heap; min-heap', ['min-heap; max-heap', 'Then the tops would be the extremes, not the middle values.'], ['max-heap; max-heap', 'The upper half needs its smallest value on top.'], ['sorted array; sorted array', 'Insertion would be O(n).']],
    answer: 0,
    explanation: 'The largest of the lower half and the smallest of the upper half sit on top, which are exactly the candidates for the median.',
  }),
  mcq({
    ...base, id: 'dsa.heaps.q6', type: 'pattern', difficulty: 'medium',
    stem: 'Given meeting intervals, find the minimum number of rooms. Which approach is standard?',
    options: ['Sort by start; keep a min-heap of end times; reuse the room that frees earliest', ['Sort by end and count overlaps pairwise', 'Pairwise checks are O(n²).'], ['A max-heap of durations', 'Durations alone do not capture overlap.'], ['Binary search on the number of rooms', 'Feasibility checking would still need the heap idea.']],
    answer: 0,
    explanation: 'The heap tracks the end times of rooms in use; its maximum size equals the peak number of simultaneous meetings. O(n log n).',
  }),
  mcq({
    ...base, id: 'dsa.heaps.q7', type: 'concept', difficulty: 'easy',
    stem: 'What does iterating over a Java `PriorityQueue` with a for-each loop give you?',
    options: ['Elements in internal array order, which is not sorted', ['Elements in sorted order', 'Only repeated poll() yields sorted order.'], ['Elements in insertion order', 'The heap reorders elements.'], ['A ConcurrentModificationException always', 'Only if you modify it during iteration.']],
    answer: 0,
    explanation: 'The iterator walks the backing array; only the head is guaranteed to be the minimum.',
  }),
];
