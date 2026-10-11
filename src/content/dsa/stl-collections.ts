import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.stl-collections';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'C++ STL and Java Collections',
  summary: 'The containers you will use in every OA, their costs, and their traps.',
  level: 'foundation',
  status: 'complete',
  estMinutes: 80,
  prerequisites: ['dsa.complexity'],
  related: ['dsa.hashing', 'dsa.heaps', 'dsa.bst', 'dsa.design-ds', 'dsa.sorting'],
  subtopics: ['Sequence containers: vector/ArrayList, deque/ArrayDeque', 'Hash containers: unordered_map/HashMap', 'Ordered containers: map, set, multiset / TreeMap, TreeSet', 'Priority queues', 'lower_bound / ceiling queries', 'Iterator invalidation and fail-fast iterators', 'Autoboxing and Integer caching'],
  objectives: [
    'Pick the right container for each operation profile and state the complexity of its core operations.',
    'Use ordered containers for floor/ceiling, range and sliding-window-median queries (lower_bound, upper_bound, floorKey, ceilingKey).',
    'Avoid the classic traps: operator[] inserting into std::map, iterator invalidation, ConcurrentModificationException, Integer == comparisons.',
    'Translate common idioms between C++ and Java (counting, sorting pairs, custom comparators, multisets).',
    'Know which operations are amortised (vector push_back, ArrayList add) and which are worst-case.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Container cheat sheet',
      bodyMd: `| Need | C++ | Java | Core costs |
|---|---|---|---|
| Dynamic array | \`vector\` | \`ArrayList\` | index O(1), push/add at end O(1) amortised, insert/erase in the middle O(n) |
| Both ends | \`deque\` | \`ArrayDeque\` | push/pop both ends O(1) |
| Stack / queue | \`stack\`, \`queue\` (adaptors) | \`ArrayDeque\` (push/pop, offer/poll) | O(1) |
| Hash map / set | \`unordered_map\`, \`unordered_set\` | \`HashMap\`, \`HashSet\` | O(1) average, O(n) worst |
| Ordered map / set | \`map\`, \`set\`, \`multiset\` | \`TreeMap\`, \`TreeSet\` | O(log n) insert, erase, find, floor/ceiling |
| Priority queue | \`priority_queue\` (max-heap) | \`PriorityQueue\` (min-heap) | push/pop O(log n), top O(1) |
| Insertion-ordered map | (none; vector + map) | \`LinkedHashMap\` | O(1) average |

**Ordered queries:**
- C++: \`s.lower_bound(x)\` = first element ≥ x; \`s.upper_bound(x)\` = first element > x; the floor is \`prev(upper_bound(x))\` if it exists.
- Java: \`ceiling(x)\` ≥ x, \`higher(x)\` > x, \`floor(x)\` ≤ x, \`lower(x)\` < x (TreeSet); \`ceilingKey\`/\`floorKey\`/\`floorEntry\` on TreeMap. They return null when nothing qualifies.

**Multisets:** C++ has \`multiset\`. Java has none; use \`TreeMap<Integer, Integer>\` of counts and decrement or remove keys. With a C++ multiset, \`ms.erase(x)\` removes **all** copies of x; \`ms.erase(ms.find(x))\` removes one.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Traps that cost points in OAs',
      bodyMd: `**C++**
- \`m[key]\` on a \`map\`/\`unordered_map\` **inserts** a default value when the key is missing. Use \`find\` or \`count\` to check membership without inserting (and in const code you cannot use [] at all).
- **Iterator invalidation:** \`push_back\` may reallocate a vector, invalidating all iterators, pointers and references to its elements. Erasing from a vector invalidates iterators at or after the erased element. In a loop, use \`it = v.erase(it)\`.
- \`std::sort\` needs random-access iterators: sort a \`list\` with \`l.sort()\`.
- \`priority_queue\` is a max-heap; \`size()\` returns an unsigned \`size_t\`, so \`pq.size() - 1\` on an empty queue wraps around.
- \`unordered_map\` can be attacked with crafted keys (many collisions); on Codeforces-style judges people add a custom hash. On LeetCode this rarely matters.

**Java**
- **Integer caching:** \`Integer a = 127, b = 127; a == b\` is true (cached −128..127), but for 128 it is false. Compare boxed values with \`equals\` or unbox them.
- **ConcurrentModificationException:** modifying a collection while iterating with for-each. Use an \`Iterator\` and \`it.remove()\`, or \`removeIf\`.
- \`list.remove(1)\` on a \`List<Integer>\` removes the element **at index 1**; \`list.remove(Integer.valueOf(1))\` removes the value 1.
- \`Arrays.asList(arr)\` is fixed-size; \`List.of(...)\` is immutable.
- \`HashMap\` allows one null key; \`TreeMap\` throws on null keys (with natural ordering).
- \`getOrDefault\` and \`merge(key, 1, Integer::sum)\` make counting concise.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: nearest booking with std::set (My Calendar I)',
      bodyMd: 'Bookings are half-open [start, end). We store intervals ordered by start and check only the neighbours of a new booking.',
      trace: [
        { note: 'book(10, 20): set is empty → accept. Set {[10,20)}.', array: ['[10,20)'], vars: { result: 'true' } },
        { note: 'book(15, 25): lower_bound(15) finds no interval starting ≥ 15; the previous one, [10,20), ends at 20 > 15 → overlap.', array: ['[10,20)'], highlight: [0], vars: { result: 'false' } },
        { note: 'book(20, 30): lower_bound(20) → none; previous [10,20) ends at 20 ≤ 20 → no overlap. Accept.', array: ['[10,20)', '[20,30)'], highlight: [1], vars: { result: 'true' } },
        { note: 'book(5, 10): lower_bound(5) → [10,20), which starts at 10 ≥ 10 = end → no overlap; no previous. Accept.', array: ['[5,10)', '[10,20)', '[20,30)'], highlight: [0], vars: { result: 'true' } },
        { note: 'Each booking costs O(log n): one lower_bound and two neighbour checks, instead of scanning every booking.', array: ['[5,10)', '[10,20)', '[20,30)'] },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Idioms side by side',
      bodyMd: 'Counting, sorting pairs, ordered lookups, multisets and safe removal while iterating.',
      code: [
        cpp(`
void idioms(vector<int>& v, vector<pair<int, string>>& people) {
    // Counting without accidental inserts
    unordered_map<int, int> cnt;
    for (int x : v) ++cnt[x];                    // [] is fine when you WANT to insert
    bool hasSeven = cnt.count(7) > 0;            // membership: count/find, not cnt[7]
    (void)hasSeven;

    // Sort pairs: by first descending, then second ascending
    sort(people.begin(), people.end(), [](const pair<int, string>& a, const pair<int, string>& b) {
        if (a.first != b.first) return a.first > b.first;
        return a.second < b.second;
    });

    // Ordered queries
    set<int> s(v.begin(), v.end());
    auto it = s.lower_bound(10);                 // first >= 10
    if (it != s.end()) cout << "ceiling " << *it << "\\n";
    auto up = s.upper_bound(10);                 // first > 10
    if (up != s.begin()) cout << "floor " << *prev(up) << "\\n";

    // Multiset: erase ONE copy
    multiset<int> ms(v.begin(), v.end());
    auto one = ms.find(3);
    if (one != ms.end()) ms.erase(one);          // ms.erase(3) would erase all 3s

    // Erase while iterating
    for (auto i = v.begin(); i != v.end();) {
        if (*i % 2 == 0) i = v.erase(i); else ++i;
    }
}

// My Calendar I with std::map<start, end>
class MyCalendar {
    map<int, int> booked;
public:
    bool book(int start, int end) {
        auto next = booked.lower_bound(start);
        if (next != booked.end() && next->first < end) return false;
        if (next != booked.begin() && prev(next)->second > start) return false;
        booked[start] = end;
        return true;
    }
};`, 'C++'),
        java(`
void idioms(List<Integer> v, List<int[]> people) {
    // Counting
    Map<Integer, Integer> cnt = new HashMap<>();
    for (int x : v) cnt.merge(x, 1, Integer::sum);
    boolean hasSeven = cnt.containsKey(7);

    // Sort: by [0] descending, then [1] ascending
    people.sort((a, b) -> a[0] != b[0] ? Integer.compare(b[0], a[0]) : Integer.compare(a[1], b[1]));

    // Ordered queries
    TreeSet<Integer> s = new TreeSet<>(v);
    Integer ceil = s.ceiling(10), floor = s.floor(10);     // null when absent

    // Multiset via counts
    TreeMap<Integer, Integer> ms = new TreeMap<>();
    for (int x : v) ms.merge(x, 1, Integer::sum);
    ms.computeIfPresent(3, (k, c) -> c == 1 ? null : c - 1); // remove one copy of 3

    // Remove while iterating
    v.removeIf(x -> x % 2 == 0);
    Iterator<Integer> it = v.iterator();
    while (it.hasNext()) if (it.next() < 0) it.remove();

    // Boxed comparison
    Integer a = 1000, b = 1000;
    boolean same = a.equals(b);                              // not a == b
    System.out.println(hasSeven + " " + ceil + " " + floor + " " + same);
}

static class MyCalendar {
    private final TreeMap<Integer, Integer> booked = new TreeMap<>();
    boolean book(int start, int end) {
        Integer next = booked.ceilingKey(start);
        if (next != null && next < end) return false;
        Map.Entry<Integer, Integer> prev = booked.lowerEntry(start);
        if (prev != null && prev.getValue() > start) return false;
        booked.put(start, end);
        return true;
    }
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity notes',
      bodyMd: `- \`vector::push_back\` / \`ArrayList.add\`: O(1) **amortised** (capacity doubles), O(n) for the occasional reallocation. \`reserve(n)\` / \`new ArrayList<>(n)\` avoids reallocations.
- Hash containers: O(1) average; Java 8+ \`HashMap\` turns long collision chains into balanced trees, bounding the worst case at O(log n) per bucket for comparable keys.
- Ordered containers: O(log n) guaranteed per operation; iterating all n elements in order: O(n).
- \`std::multiset::count(x)\` is O(log n + k) for k copies; use a \`map<int, int>\` of counts if counts are queried often.
- Building a \`set\` from n elements is O(n log n); building a heap with \`make_heap\` or the \`PriorityQueue(Collection)\` constructor is O(n).
- \`String\` concatenation in a Java loop is O(n²) overall; use \`StringBuilder\`. In C++, \`s += c\` is amortised O(1), but \`s = s + c\` copies.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. \`if (m[k])\` on a C++ map to test membership: inserts k with value 0.
2. Comparing \`Integer\` objects with \`==\` in Java: works for −128..127 only.
3. \`multiset::erase(value)\` removing every copy when you meant one.
4. Modifying a Java collection inside a for-each loop: ConcurrentModificationException.
5. \`list.remove(int)\` vs \`list.remove(Object)\` confusion on \`List<Integer>\`.
6. Using a stale iterator or reference after \`push_back\` reallocates the vector.
7. \`size() - 1\` on an empty C++ container (unsigned wrap-around); compare with \`i + 1 < size()\` instead.
8. Expecting \`PriorityQueue\` iteration or \`toString\` to be sorted.`,
    },
  ],
  recognition: {
    signals: ['Need floor/ceiling or ordered iteration on a changing set: TreeMap/TreeSet, std::map/set', 'Sliding window median or "k-th smallest in a window": two multisets or two heaps with lazy deletion', 'Counting frequencies: hash map', 'Both-end operations: deque', 'Repeated min/max: priority queue'],
    antiSignals: ['Static data with many range queries: prefix sums or sparse tables', 'Tiny fixed alphabets: a plain int[26] beats a hash map'],
    decisionQuestions: ['Do I need order, or just membership?', 'Duplicates allowed? (multiset / count map)', 'Which operations dominate, and are their costs worst-case or amortised?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'HashMap vs TreeMap (unordered_map vs map): when do you use each?', answerMd: 'Hash maps give O(1) average lookups with no ordering. Tree maps are balanced BSTs with O(log n) guaranteed operations plus ordered iteration and floor/ceiling/range queries. Use a tree map when you need order (calendar bookings, nearest key, sorted output), a hash map otherwise.' },
    { id: 'iq2', q: 'Why is vector::push_back O(1) amortised?', answerMd: 'When full, the vector allocates a larger buffer (typically 1.5× or 2×) and moves all elements. With geometric growth, the total copying for n pushes is at most a constant times n (n + n/2 + n/4 + …), so each push costs O(1) on average, even though a single push can be O(n).' },
    { id: 'iq3', q: 'What happens if you call m[key] on a C++ std::map for a key that is not present?', answerMd: 'It inserts key with a value-initialised value (0 for int, empty string, …) and returns a reference to it. This silently grows the map and changes size(); use find or count to test membership.' },
    { id: 'iq4', q: 'Why does `Integer a = 1000, b = 1000; a == b` print false?', answerMd: '== compares references for objects. Integer.valueOf caches −128..127, so small values share objects and == happens to be true; 1000 creates two distinct objects. Use equals or compare primitives.' },
    { id: 'iq5', q: 'How do you remove elements from a list while iterating in Java?', answerMd: 'Use an explicit Iterator and call it.remove(), or list.removeIf(predicate). Removing through the list inside a for-each loop throws ConcurrentModificationException because the iterator detects the structural change (fail-fast).' },
    { id: 'iq6', q: 'How do you get a multiset in Java?', answerMd: 'Use TreeMap<Integer, Integer> from value to count: add with merge(x, 1, Integer::sum), remove one copy by decrementing and deleting the key at 0, and use firstKey/lastKey/floorKey/ceilingKey for ordered queries. Guava has TreeMultiset, but it is not available on LeetCode.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- vector/ArrayList: O(1) amortised append; middle insert O(n).
- unordered_map/HashMap O(1) avg; map/TreeMap O(log n) + order + floor/ceiling.
- C++ lower_bound ≥, upper_bound >; floor = prev(upper_bound). Java ceiling/floor/higher/lower → null if none.
- priority_queue max-heap (C++), PriorityQueue min-heap (Java).
- Traps: m[k] inserts; multiset.erase(v) erases all; Integer == ; CME; remove(int) vs remove(Object); unsigned size()−1.`,
    flashcards: [
      { id: 'f1', front: 'C++: first element > x in a std::set?', backMd: '`s.upper_bound(x)`.' },
      { id: 'f2', front: 'Java: largest key ≤ x in a TreeMap?', backMd: '`floorKey(x)` (or `floorEntry(x)`), null if none.' },
      { id: 'f3', front: 'How do you erase one copy of x from a C++ multiset?', backMd: '`ms.erase(ms.find(x))` after checking find != end.' },
      { id: 'f4', front: 'Range of the Java Integer cache?', backMd: '−128 to 127.' },
      { id: 'f5', front: 'Side effect of map[key] on a missing key in C++?', backMd: 'It inserts the key with a default value.' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 12, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 1, retentionDays: 7 },
  resources: [
    { title: 'Containers library (cppreference)', url: 'https://en.cppreference.com/w/cpp/container', kind: 'official-docs' },
    { title: 'Collections Framework overview (Java SE 21)', url: 'https://docs.oracle.com/en/java/javase/21/core/java-collections-framework.html', kind: 'official-docs' },
    { title: 'TreeSet (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeSet.html', kind: 'official-docs' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.stl.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <map>
using namespace std;
int main() {
    map<string, int> m;
    m["a"] = 1;
    if (m["b"] == 0) cout << "zero ";
    cout << m.size() << " " << m.count("c") << " " << m.size() << endl;
    return 0;
}`, 'C++', 'zero 2 0 2'),
    options: ['zero 2 0 2', ['zero 1 0 1', 'm["b"] inserted "b" with value 0.'], ['zero 2 0 3', 'count does not insert.'], ['2 0 2', 'm["b"] is 0, so "zero " is printed.']],
    answer: 0,
    explanation: 'operator[] inserts "b" → 0, so size becomes 2. count("c") only checks.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.stl.q2', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Integer a = 127, b = 127, c = 128, d = 128;
        List<Integer> list = new ArrayList<>(List.of(5, 1, 7, 1));
        list.remove(1);
        list.remove(Integer.valueOf(1));
        System.out.println((a == b) + " " + (c == d) + " " + c.equals(d) + " " + list);
    }
}`, 'Java', 'true false true [5, 7]'),
    options: ['true false true [5, 7]', ['true true true [5, 7]', '128 is outside the Integer cache, so c and d are different objects.'], ['true false true [7, 1]', 'remove(1) removes index 1 (the first 1), then remove(Integer.valueOf(1)) removes the value 1.'], ['false false true [5, 7]', '127 is cached.']],
    answer: 0,
    explanation: 'Boxed values in −128..127 share cached objects. remove(int) removes by index; remove(Object) removes the first matching value.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.stl.q3', type: 'which-method', difficulty: 'medium',
    stem: 'In C++, which expression gives the largest element ≤ x in a non-empty `std::set<int> s`, when such an element exists?',
    options: ['*prev(s.upper_bound(x))', ['*s.lower_bound(x)', 'That is the smallest element ≥ x.'], ['*s.upper_bound(x)', 'That is the smallest element > x.'], ['*prev(s.lower_bound(x))', 'That is the largest element < x, which misses x itself.']],
    answer: 0,
    explanation: 'upper_bound(x) points just past every element ≤ x; stepping back gives the floor. Check upper_bound(x) != s.begin() first.',
  }),
  mcq({
    ...base, id: 'dsa.stl.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <set>
using namespace std;
int main() {
    multiset<int> ms = {3, 1, 3, 3, 2};
    ms.erase(ms.find(3));
    cout << ms.count(3) << " ";
    ms.erase(3);
    cout << ms.count(3) << " " << ms.size() << endl;
    return 0;
}`, 'C++', '2 0 2'),
    options: ['2 0 2', ['2 1 3', 'erase(value) removes every copy.'], ['0 0 2', 'erase(iterator) removes only one copy.'], ['2 0 4', 'Five elements minus three 3s leaves 2.']],
    answer: 0,
    explanation: 'erase(find(3)) removes one of the three 3s; erase(3) removes the remaining two. {1, 2} remain.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.stl.q5', type: 'concept', difficulty: 'easy',
    stem: 'Which Java collection gives O(log n) floor and ceiling lookups on a changing set of numbers?',
    options: ['TreeSet', ['HashSet', 'No ordering.'], ['ArrayList kept sorted', 'Insertion is O(n).'], ['PriorityQueue', 'Only the minimum is cheap.']],
    answer: 0,
    explanation: 'TreeSet is a red-black tree: floor, ceiling, higher and lower are O(log n), and inserts and deletes are O(log n) too.',
  }),
  mcq({
    ...base, id: 'dsa.stl.q6', type: 'debug', difficulty: 'medium',
    stem: 'This Java loop throws an exception. Which fix is correct?\n\n```\nfor (Integer x : list) if (x < 0) list.remove(x);\n```',
    options: ['Use `list.removeIf(x -> x < 0)` or an Iterator with `it.remove()`', ['Catch ConcurrentModificationException and continue', 'Iteration state is already corrupted.'], ['Use list.remove((int) x)', 'Still modifies the list during for-each.'], ['Wrap the list with Collections.synchronizedList', 'Synchronisation is unrelated to single-threaded fail-fast iterators.']],
    answer: 0,
    explanation: 'Structural modification through the list (not the iterator) during iteration trips the fail-fast check.',
  }),
  mcq({
    ...base, id: 'dsa.stl.q7', type: 'complexity', difficulty: 'medium',
    stem: 'Appending n elements one by one to a std::vector without reserve() costs how much in total?',
    options: ['O(n): reallocations copy a geometric series of elements', ['O(n²): every reallocation copies everything', 'Reallocations are rare because capacity grows geometrically.'], ['O(n log n)', 'The copy total is linear.'], ['O(1)', 'n elements must be written.']],
    answer: 0,
    explanation: 'With doubling, copies total n/2 + n/4 + … < n, so the amortised cost per push_back is O(1).',
  }),
  mcq({
    ...base, id: 'dsa.stl.q8', type: 'edge-case', difficulty: 'hard',
    stem: 'In C++, `for (int i = 0; i < v.size() - 1; ++i)` runs over adjacent pairs. What happens when v is empty?',
    options: ['v.size() − 1 wraps to a huge unsigned value, so the loop reads out of bounds', ['The loop does not run', 'size() is unsigned: 0 − 1 is not −1.'], ['Compile error', 'It compiles, perhaps with a sign-comparison warning.'], ['It runs exactly once', 'It runs until it crashes.']],
    answer: 0,
    explanation: 'size_t arithmetic is modular: 0 − 1 = 2⁶⁴ − 1. Write `i + 1 < v.size()` instead.',
  }),
];
