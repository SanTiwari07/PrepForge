import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.design-ds';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Design Data Structures',
  summary: 'LRU cache, min stack, time-based key-value stores and iterators.',
  level: 'core',
  status: 'complete',
  estMinutes: 90,
  prerequisites: ['dsa.hashing', 'dsa.linked-lists'],
  related: ['dsa.hashing', 'dsa.linked-lists', 'dsa.heaps', 'dsa.stacks-queues', 'dsa.stl-collections', 'dsa.bst'],
  subtopics: ['Clarify the API and complexity targets', 'Combine structures (hash map + list, map + heap)', 'LRU cache', 'Insert, delete, getRandom in O(1)', 'Time-based key-value store', 'Iterators and lazy evaluation', 'Amortised analysis'],
  objectives: [
    'Turn a design question into a list of operations with target complexities before choosing structures.',
    'Implement an LRU cache with a hash map and a doubly linked list, all operations O(1).',
    'Support insert, remove and getRandom in O(1) average with an array plus an index map (swap-with-last deletion).',
    'Use binary search over per-key timestamp lists for a time-based key-value store.',
    'Explain amortised O(1) operations (queue from two stacks) and lazy techniques (iterators, lazy deletion).',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Start from the operations',
      bodyMd: `Design questions are graded on whether every operation meets its target. Work in this order:

1. **List the API** and ask about the access pattern (which operations are frequent, value ranges, capacity, concurrency).
2. **Write the target complexity** of each operation (often O(1) or O(log n)).
3. **Pick structures that each make one operation fast**, then connect them so they stay consistent.

| Need | Structure |
|---|---|
| Lookup by key | hash map |
| Order by recency, O(1) move/remove of a known node | doubly linked list (+ map from key to node) |
| Min/max at any time | heap, or a stack of running minimums |
| Sorted order, floor/ceiling | balanced BST (std::map, TreeMap) |
| Uniform random element | array (random index) + map from value to index |
| FIFO with O(1) amortised using LIFO pieces | two stacks |

The famous combinations: **hash map + doubly linked list** (LRU, LFU with frequency lists), **array + hash map** (RandomizedSet), **hash map + sorted list per key** (TimeMap), **two heaps** (median finder), **stack of pairs** (min stack).`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'How the classic designs work',
      bodyMd: `**LRU cache (get and put in O(1)):** a doubly linked list keeps keys from most recently used (front) to least recently used (back); a hash map points from key to its list node. get: look up the node, move it to the front. put: update or insert at the front; if over capacity, remove the back node and erase its key from the map. Sentinel head and tail nodes remove all null checks. (Java's \`LinkedHashMap\` with access order and \`removeEldestEntry\` does this for you, but interviewers usually want it by hand.)

**RandomizedSet (insert, remove, getRandom in O(1) average):** keep values in an array and a map value → index. Remove by moving the **last** element into the removed slot, updating its index, and popping the back. getRandom picks a random index.

**TimeMap (set(key, value, t), get(key, t) = value with the largest timestamp ≤ t):** per key, a list of (timestamp, value). Timestamps arrive increasing, so the list is sorted; get uses binary search (upper_bound − 1). O(1) set, O(log n) get.

**Queue with two stacks:** push to \`in\`; pop from \`out\`, refilling \`out\` from \`in\` only when \`out\` is empty. Each element moves at most twice, so operations are **amortised O(1)** even though one pop may take O(n).

**Iterators:** keep just enough state to produce the next element (a stack for BST and nested-list iterators). That makes next() amortised O(1) with O(h) memory instead of flattening everything up front.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: LRU cache with capacity 2',
      bodyMd: 'The list is shown from most recent (left) to least recent (right).',
      trace: [
        { note: 'put(1, A): list [1].', array: [1], vars: { map: '{1}' } },
        { note: 'put(2, B): list [2, 1].', array: [2, 1], vars: { map: '{1, 2}' } },
        { note: 'get(1) → A, and 1 moves to the front: [1, 2].', array: [1, 2], highlight: [0], vars: { returned: 'A' } },
        { note: 'put(3, C): over capacity, evict the back (2). List [3, 1].', array: [3, 1], highlight: [0], vars: { evicted: 2, map: '{1, 3}' } },
        { note: 'get(2) → −1 (evicted). get(3) → C, list [3, 1] unchanged order-wise (3 already at the front).', array: [3, 1], vars: { 'get(2)': -1, 'get(3)': 'C' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'LRU cache with a hand-written list, RandomizedSet and TimeMap.',
      code: [
        cpp(`
class LRUCache {
    struct Node { int key, val; Node *prev, *next; };
    int cap;
    unordered_map<int, Node*> where;
    Node head{0, 0, nullptr, nullptr}, tail{0, 0, nullptr, nullptr};   // sentinels
    void unlink(Node* n) { n->prev->next = n->next; n->next->prev = n->prev; }
    void pushFront(Node* n) { n->next = head.next; n->prev = &head; head.next->prev = n; head.next = n; }
public:
    LRUCache(int capacity) : cap(capacity) { head.next = &tail; tail.prev = &head; }
    int get(int key) {
        auto it = where.find(key);
        if (it == where.end()) return -1;
        unlink(it->second); pushFront(it->second);
        return it->second->val;
    }
    void put(int key, int value) {
        auto it = where.find(key);
        if (it != where.end()) { it->second->val = value; unlink(it->second); pushFront(it->second); return; }
        if ((int)where.size() == cap) {
            Node* old = tail.prev;
            unlink(old); where.erase(old->key); delete old;
        }
        Node* n = new Node{key, value, nullptr, nullptr};
        pushFront(n); where[key] = n;
    }
};

class RandomizedSet {
    vector<int> vals;
    unordered_map<int, int> idx;
    mt19937 rng{2024};
public:
    bool insert(int v) {
        if (idx.count(v)) return false;
        idx[v] = vals.size(); vals.push_back(v);
        return true;
    }
    bool remove(int v) {
        auto it = idx.find(v);
        if (it == idx.end()) return false;
        int last = vals.back();
        vals[it->second] = last; idx[last] = it->second;   // move the last value into the hole
        vals.pop_back(); idx.erase(v);
        return true;
    }
    int getRandom() { return vals[rng() % vals.size()]; }
};

class TimeMap {
    unordered_map<string, vector<pair<int, string>>> m;    // timestamps arrive increasing
public:
    void set(const string& k, const string& v, int t) { m[k].push_back({t, v}); }
    string get(const string& k, int t) {
        auto it = m.find(k);
        if (it == m.end()) return "";
        auto& v = it->second;
        int lo = 0, hi = v.size();                            // first index with time > t
        while (lo < hi) { int mid = (lo + hi) / 2; if (v[mid].first <= t) lo = mid + 1; else hi = mid; }
        return lo == 0 ? "" : v[lo - 1].second;
    }
};`, 'C++'),
        java(`
static class LRUCache {
    private static class Node { int key, val; Node prev, next; Node(int k, int v) { key = k; val = v; } }
    private final int cap;
    private final Map<Integer, Node> where = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0);
    LRUCache(int capacity) { cap = capacity; head.next = tail; tail.prev = head; }
    private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void pushFront(Node n) { n.next = head.next; n.prev = head; head.next.prev = n; head.next = n; }
    int get(int key) {
        Node n = where.get(key);
        if (n == null) return -1;
        unlink(n); pushFront(n);
        return n.val;
    }
    void put(int key, int value) {
        Node n = where.get(key);
        if (n != null) { n.val = value; unlink(n); pushFront(n); return; }
        if (where.size() == cap) { Node old = tail.prev; unlink(old); where.remove(old.key); }
        n = new Node(key, value);
        pushFront(n); where.put(key, n);
    }
}

static class RandomizedSet {
    private final List<Integer> vals = new ArrayList<>();
    private final Map<Integer, Integer> idx = new HashMap<>();
    private final Random rng = new Random(2024);
    boolean insert(int v) {
        if (idx.containsKey(v)) return false;
        idx.put(v, vals.size()); vals.add(v);
        return true;
    }
    boolean remove(int v) {
        Integer i = idx.get(v);
        if (i == null) return false;
        int last = vals.get(vals.size() - 1);
        vals.set(i, last); idx.put(last, i);
        vals.remove(vals.size() - 1); idx.remove(v);
        return true;
    }
    int getRandom() { return vals.get(rng.nextInt(vals.size())); }
}

static class TimeMap {
    private final Map<String, TreeMap<Integer, String>> m = new HashMap<>();
    void set(String k, String v, int t) { m.computeIfAbsent(k, x -> new TreeMap<>()).put(t, v); }
    String get(String k, int t) {
        TreeMap<Integer, String> tm = m.get(k);
        if (tm == null) return "";
        Map.Entry<Integer, String> e = tm.floorEntry(t);
        return e == null ? "" : e.getValue();
    }
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `| Design | Operations | Cost |
|---|---|---|
| LRU cache | get, put | O(1) average (hash map) |
| RandomizedSet | insert, remove, getRandom | O(1) average |
| TimeMap | set / get | O(1) / O(log n) (TreeMap: O(log n) / O(log n)) |
| Min stack | push, pop, top, getMin | O(1) |
| Queue from two stacks | push / pop | O(1) / amortised O(1) |
| Median finder (two heaps) | add / median | O(log n) / O(1) |
| BST iterator | next / hasNext | amortised O(1), O(h) memory |

"Average" for hash maps assumes a good hash function; adversarial inputs can degrade them, which is why Java switches long buckets to balanced trees.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **LRU: forgetting to move a key to the front on get**, or on put of an existing key.
2. **LRU: evicting without erasing the key from the map**, leaving a dangling pointer.
3. **Singly linked list for LRU:** removing an arbitrary node needs its predecessor, which costs O(n) to find.
4. **RandomizedSet: removing from the middle of the array** with \`erase\` (O(n)), or forgetting to update the moved element's index (and the special case where the removed element is the last one, which the order of updates above handles).
5. **TimeMap: linear scan** of timestamps instead of binary search.
6. **Iterators that precompute everything** in the constructor when the follow-up asks for O(h) memory.
7. **Not asking clarifying questions:** capacity 0, duplicate keys, thread safety, what get returns for missing keys.`,
    },
  ],
  recognition: {
    signals: ['"Design a class that supports …" with complexity requirements', 'Caches with eviction (LRU, LFU)', 'O(1) random access plus O(1) deletion', 'Queries "as of time t"', 'Iterators over trees, nested lists or streams'],
    antiSignals: ['A single algorithmic question with no state between calls', 'System-level design (many machines, persistence): system design, not DS design'],
    decisionQuestions: ['What does each operation need to find quickly?', 'Which structure makes each operation fast, and how do I keep them in sync?', 'Is amortised cost acceptable?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Design an LRU cache with O(1) get and put.', answerMd: 'A hash map from key to a node in a doubly linked list ordered by recency. get: find the node, move it to the front, return the value. put: if the key exists, update and move to the front; otherwise, if at capacity remove the tail node and its map entry, then insert a new node at the front. Sentinel head/tail nodes simplify edge cases.' },
    { id: 'iq2', q: 'Why does the LRU cache need a doubly linked list rather than a singly linked one?', answerMd: 'Moving or evicting a node requires unlinking it from the middle. With a prev pointer that is O(1); with a singly linked list you must find the predecessor, which is O(n).' },
    { id: 'iq3', q: 'Design a set with O(1) insert, remove and getRandom.', answerMd: 'An array of values plus a map value → index. Insert: append and record the index. Remove: copy the last value into the removed slot, update its index in the map, pop the back, erase the removed key. getRandom: a uniformly random index. All O(1) average.' },
    { id: 'iq4', q: 'Implement a queue using two stacks. What is the complexity?', answerMd: 'Push onto stack in. To pop or peek, if stack out is empty, move everything from in to out (reversing the order), then pop from out. Each element is pushed and popped at most twice, so any sequence of n operations costs O(n): amortised O(1) per operation, O(n) worst case for a single pop.' },
    { id: 'iq5', q: 'How would you design LFU (least frequently used) eviction in O(1)?', answerMd: 'Maps key → (value, frequency, node) and frequency → doubly linked list of keys (most recent first), plus a minFreq variable. get/put move a key from its frequency list to the next one and update minFreq when its old list empties. Eviction removes the tail of the minFreq list. A new key resets minFreq to 1.' },
    { id: 'iq6', q: 'Design a BST iterator with O(h) memory.', answerMd: 'Keep a stack of nodes: push the leftmost path from the root. next() pops a node, then pushes the leftmost path of its right child, and returns the popped value. Each node is pushed and popped once: amortised O(1) per next(), O(h) memory.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Operations → targets → one structure per need → keep them in sync.
- LRU = hash map + doubly linked list with sentinels; move on get and on update.
- RandomizedSet = array + value→index map; delete by swapping with the last.
- TimeMap = per-key sorted (time, value) list + binary search (or TreeMap.floorEntry).
- Queue from two stacks: amortised O(1).
- Iterators: stack-based, amortised O(1), O(h) memory.`,
    flashcards: [
      { id: 'f1', front: 'Structures behind an O(1) LRU cache?', backMd: 'A hash map from key to node plus a doubly linked list ordered by recency.' },
      { id: 'f2', front: 'How does RandomizedSet delete in O(1)?', backMd: 'Overwrite the deleted slot with the last element, update its index, pop the back.' },
      { id: 'f3', front: 'TimeMap get(key, t) in Java with one call?', backMd: '`treeMap.floorEntry(t)`.' },
      { id: 'f4', front: 'Why is the two-stack queue amortised O(1)?', backMd: 'Each element is moved from in to out at most once.' },
      { id: 'f5', front: 'Why sentinel nodes in a linked list design?', backMd: 'Every real node always has a prev and a next, so no null checks are needed when linking or unlinking.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 12, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Cache replacement policies (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Cache_replacement_policies', kind: 'article' },
    { title: 'LinkedHashMap (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html', kind: 'official-docs' },
    { title: 'LRU Cache (LeetCode 146)', url: 'https://leetcode.com/problems/lru-cache/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.design.q1', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        LinkedHashMap<Integer, String> lru = new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<Integer, String> e) { return size() > 2; }
        };
        lru.put(1, "A");
        lru.put(2, "B");
        lru.get(1);
        lru.put(3, "C");
        System.out.println(lru.keySet());
    }
}`, 'Java', '[1, 3]'),
    options: ['[1, 3]', ['[2, 3]', 'get(1) made 1 the most recently used, so 2 is evicted.'], ['[1, 2, 3]', 'removeEldestEntry caps the size at 2.'], ['[3, 1]', 'Iteration goes from least to most recently used.']],
    answer: 0,
    explanation: 'With accessOrder = true, iteration order is from least to most recently accessed. After get(1) the order is 2, 1; putting 3 evicts the eldest (2), leaving 1, 3.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.design.q2', type: 'design', difficulty: 'medium',
    stem: 'Why does an O(1) LRU cache use a doubly linked list instead of a singly linked list?',
    options: ['Unlinking a node from the middle needs its predecessor, which a prev pointer gives in O(1)', ['Doubly linked lists use less memory', 'They use more.'], ['Singly linked lists cannot store pairs', 'They can.'], ['To iterate backwards for printing', 'Not the reason.']],
    answer: 0,
    explanation: 'get and put move arbitrary nodes to the front; with only next pointers you would scan for the predecessor.',
  }),
  mcq({
    ...base, id: 'dsa.design.q3', type: 'design', difficulty: 'medium',
    stem: 'RandomizedSet stores values in an array with a value→index map. How do you remove a value in O(1)?',
    options: ['Overwrite its slot with the last element, update that element\'s index, pop the back', ['Erase it from the array and shift the rest', 'Shifting is O(n).'], ['Mark it as deleted and skip it in getRandom', 'getRandom would no longer be O(1) uniform.'], ['Swap it with the first element', 'Removing from the front of an array is O(n).']],
    answer: 0,
    explanation: 'Order does not matter in a set, so filling the hole with the last element keeps the array dense.',
  }),
  mcq({
    ...base, id: 'dsa.design.q4', type: 'complexity', difficulty: 'medium',
    stem: 'A queue built from two stacks performs n operations. What is the total cost?',
    options: ['O(n): each element is moved between stacks at most once', ['O(n²): a pop can move n elements', 'Expensive pops are rare; amortised over the sequence each element moves once.'], ['O(n log n)', 'No logarithmic factor appears.'], ['O(1)', 'n operations cost at least n.']],
    answer: 0,
    explanation: 'An element is pushed to in, moved to out once, and popped once: a constant number of moves per element.',
  }),
  mcq({
    ...base, id: 'dsa.design.q5', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <stack>
#include <algorithm>
using namespace std;
int main() {
    stack<pair<int, int>> st;                     // (value, minimum so far)
    auto push = [&](int x) { st.push({x, st.empty() ? x : min(x, st.top().second)}); };
    push(5); push(3); push(7); push(3);
    cout << st.top().second << " ";
    st.pop(); cout << st.top().second << " ";
    st.pop(); st.pop(); cout << st.top().second << endl;
    return 0;
}`, 'C++', '3 3 5'),
    options: ['3 3 5', ['3 7 5', 'The stored minimum below the top 3 is still 3.'], ['3 3 3', 'After popping both 3s, the minimum is 5.'], ['5 3 3', 'The minimum after pushing 3 is 3.']],
    answer: 0,
    explanation: 'Stored pairs: (5,5), (3,3), (7,3), (3,3). The minimum shown is the second component of the top: 3, then 3, then 5.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.design.q6', type: 'design', difficulty: 'easy',
    stem: 'TimeMap.get(key, t) returns the value set at the largest timestamp ≤ t. Timestamps for a key arrive in increasing order. Best structure per key?',
    options: ['A list of (timestamp, value) searched with binary search', ['A hash map from timestamp to value', 'Exact lookups miss "largest ≤ t".'], ['A heap of timestamps', 'A heap cannot find the floor of t efficiently.'], ['An unsorted list scanned linearly', 'O(n) per get.']],
    answer: 0,
    explanation: 'Appending keeps the list sorted for free; binary search finds the floor in O(log n). A TreeMap with floorEntry is equivalent.',
  }),
  mcq({
    ...base, id: 'dsa.design.q7', type: 'debug', difficulty: 'medium',
    stem: 'An LRU cache evicts the tail node when full but later returns a stale value for the evicted key. What was forgotten?',
    options: ['Removing the evicted key from the hash map', ['Moving the new node to the front', 'That affects order, not stale lookups.'], ['Updating the capacity', 'Capacity is fixed.'], ['Using a sentinel tail', 'Sentinels prevent null checks, not stale entries.']],
    answer: 0,
    explanation: 'The map still points at the freed (or detached) node, so get finds it. Erase the key in the same step as unlinking the node.',
  }),
  mcq({
    ...base, id: 'dsa.design.q8', type: 'design', difficulty: 'hard',
    stem: 'LFU cache in O(1): which state is needed besides key → (value, frequency)?',
    options: ['frequency → list of keys in recency order, plus the current minimum frequency', ['A min-heap of frequencies', 'Updating a frequency would cost O(log n).'], ['A sorted array of keys by frequency', 'Insertions cost O(n).'], ['Nothing else', 'You must find the least frequent, least recent key quickly.']],
    answer: 0,
    explanation: 'Bumping a key moves it to the front of the next frequency list; eviction takes the tail of the minFreq list; inserts reset minFreq to 1.',
  }),
];
