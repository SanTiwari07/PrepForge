import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.hashing';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Hash Maps and Sets',
  summary: 'Trade memory for time: complement lookups, frequency counts and grouping by key.',
  level: 'foundation',
  status: 'complete',
  estMinutes: 75,
  prerequisites: ['dsa.arrays-strings'],
  related: ['dsa.prefix-sums', 'dsa.sliding-window', 'dsa.two-pointers'],
  subtopics: ['Complement lookup', 'Frequency counting', 'Grouping by canonical key', 'Seen-set and duplicates', 'Hashing with prefix sums'],
  objectives: [
    'Replace an inner search loop with an O(1) average hash lookup.',
    'Choose between a set, a map of counts, and a map of index or list.',
    'Design a canonical key (sorted string, count signature, tuple) to group equivalent items.',
    'State the time and space cost and the worst case of hashing.',
    'Use the right container in C++ and Java and avoid their common traps.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'The idea: remember what you have seen',
      bodyMd: `A hash map stores key → value pairs, and a hash set stores keys. Insert, erase and lookup are **O(1) on average** because a hash function sends each key to a bucket directly, instead of scanning.

The pattern behind most hashing problems is: **"While scanning left to right, I need to know something about the elements I have already seen."** Store that information in a map so you can ask about it in O(1).

| Question you keep asking | Store |
|---|---|
| Have I seen value x before? | \`set\` of values |
| How many times has x appeared? | \`map<value, count>\` |
| Where did I last see x? | \`map<value, index>\` |
| Which items are "equivalent" to this one? | \`map<canonicalKey, list>\` |
| Has a prefix sum equal to s appeared? | \`map<prefixSum, count or first index>\` |`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Spotting it in an unfamiliar question',
      bodyMd: `Your brute force has the shape *for each i, search all j for something related to a[i]*. The inner search is the bottleneck, so ask: **can the thing I am searching for be computed directly and looked up?**

- Two Sum: for a[i] we want **target − a[i]**. That value is known, so look it up instead of scanning.
- Anagrams: "same letters" means **same sorted string** or **same 26-count signature**. That becomes a key.
- Duplicates within distance k: we need the **last index** of each value.

If the order of elements matters (pairs i < j), insert *after* querying, so an element never pairs with itself.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: Two Sum with a complement map',
      bodyMd: 'nums = [3, 8, 11, 5, 2], target = 13. At each index, check whether the complement is already in the map, then store the current value. The map holds value → index for elements to the left.',
      trace: [
        { note: 'i = 0, value 3. Need 13 − 3 = 10. The map is empty, so store 3 → 0.', array: [3, 8, 11, 5, 2], pointers: { i: 0 }, vars: { need: 10, map: '{3:0}' } },
        { note: 'i = 1, value 8. Need 5. Not seen yet. Store 8 → 1.', array: [3, 8, 11, 5, 2], pointers: { i: 1 }, vars: { need: 5, map: '{3:0, 8:1}' } },
        { note: 'i = 2, value 11. Need 2. Not seen. Store 11 → 2.', array: [3, 8, 11, 5, 2], pointers: { i: 2 }, vars: { need: 2, map: '{3:0, 8:1, 11:2}' } },
        { note: 'i = 3, value 5. Need 8, and 8 is in the map at index 1. Answer: [1, 3].', array: [3, 8, 11, 5, 2], pointers: { i: 3 }, highlight: [1, 3], vars: { need: 8, found: 'index 1' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Complement lookup (Two Sum) and grouping by canonical key (Group Anagrams). Note the query-then-insert order in the first template.',
      code: [
        cpp(`
vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> seen;            // value -> index
    for (int i = 0; i < (int)nums.size(); ++i) {
        auto it = seen.find(target - nums[i]);
        if (it != seen.end()) return {it->second, i};
        seen[nums[i]] = i;                   // insert AFTER querying
    }
    return {};
}

vector<vector<string>> groupAnagrams(const vector<string>& strs) {
    unordered_map<string, vector<string>> groups;
    for (const string& s : strs) {
        string key(26, 0);                   // count signature, O(L) per word
        for (char c : s) key[c - 'a']++;
        groups[key].push_back(s);
    }
    vector<vector<string>> out;
    for (auto& kv : groups) out.push_back(move(kv.second));
    return out;
}`, 'C++'),
        java(`
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();   // value -> index
    for (int i = 0; i < nums.length; i++) {
        Integer j = seen.get(target - nums[i]);
        if (j != null) return new int[]{j, i};
        seen.put(nums[i], i);                        // insert AFTER querying
    }
    return new int[0];
}

List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String s : strs) {
        int[] cnt = new int[26];
        for (char c : s.toCharArray()) cnt[c - 'a']++;
        String key = Arrays.toString(cnt);           // count signature as key
        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity and why it holds',
      bodyMd: `- Two Sum with a map: n iterations × O(1) average lookup and insert = **O(n) time, O(n) space**.
- Group Anagrams with a count signature: O(L) per word to build the key, so **O(total characters)** time. With sorted-string keys it is O(Σ L log L).
- **Worst case:** with many collisions a lookup degrades to O(n). Java 8+ \`HashMap\` turns long chains into red-black trees (O(log n)). In interviews, state "average O(1)" and mention the worst case if asked.
- **Ordered maps** (\`std::map\`, \`TreeMap\`) are O(log n) but keep keys sorted. Use them when you need floor, ceiling or ordered iteration.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes and how to debug them',
      bodyMd: `1. **Inserting before querying** in pair problems, which makes an element pair with itself (for example target = 6 with nums[i] = 3).
2. **C++ \`map[key]\` inserts a default value** when the key is missing. Use \`find\` or \`count\` for pure lookups, especially while iterating.
3. **Java \`Integer\` comparison with \`==\`**: values outside −128…127 are not cached, so \`map.get(a) == map.get(b)\` can be false for equal numbers. Use \`.equals\` or unbox to \`int\`.
4. **Mutable or unhashable keys:** C++ has no default hash for \`pair\` or \`vector\` in \`unordered_map\`; use \`map\`, encode to a string or long, or write a hash. In Java, arrays use identity hashing, so use \`Arrays.toString\`, a \`String\`, or a \`List\` as the key.
5. **Overflow in keys:** prefix sums can exceed 32 bits; use \`long long\` or \`long\`.
6. **Choosing a map when a fixed array works:** for 26 lowercase letters, an \`int[26]\` is faster and simpler.`,
    },
  ],
  recognition: {
    signals: [
      'The brute force is "for each element, scan the others for a related value".',
      'You need to detect duplicates, count frequencies, or check membership quickly.',
      'Items are equal under some transformation (anagram, same pattern, same digits) and must be grouped.',
      'A subarray sum or difference condition: combine a prefix sum with a hash map.',
    ],
    antiSignals: [
      'The input is sorted and you need pairs: two pointers gives O(1) extra space.',
      'You need order-based queries (next larger key, ranges): use an ordered map or set, or sorting.',
      'A contiguous window with a constraint: sliding window, possibly with a map inside it.',
    ],
    decisionQuestions: [
      'What exactly does my inner loop search for? Can I compute it from the current element?',
      'What must I remember about the past: existence, count, index, or a list?',
      'What canonical key makes equivalent items identical?',
    ],
  },
  mcqIds: [],
  interviewQuestions: [
    {
      id: 'iq1',
      q: 'How does a hash map achieve O(1) average lookup, and when does it degrade?',
      answerMd: 'A hash function maps the key to a bucket index, so lookup jumps to one bucket instead of scanning. With a good hash and a bounded load factor (the map resizes when it is exceeded), buckets stay short. It degrades to O(n) when many keys collide in one bucket (a bad hash or adversarial input). Java 8+ treeifies long chains to O(log n).',
    },
    {
      id: 'iq2',
      q: 'unordered_map vs map in C++ (HashMap vs TreeMap in Java): when would you choose each?',
      answerMd: 'Hash-based maps give average O(1) operations with no ordering. Tree-based maps give O(log n) operations but keep keys sorted, so you get ordered iteration and floor, ceiling and lower_bound queries. Use a tree map when you need order or range queries, or when worst-case guarantees matter.',
    },
    {
      id: 'iq3',
      q: 'How would you group anagrams, and what is the complexity?',
      answerMd: 'Map each word to a canonical key: its sorted letters (O(L log L)) or its 26-letter count signature (O(L)). Group words by key in a hash map. The total is O(Σ L) with count signatures and O(n·k) space for the keys and output.',
    },
    {
      id: 'iq4',
      q: 'Why must you query before inserting in Two Sum?',
      answerMd: 'If you insert nums[i] first, a lookup of target − nums[i] can find the same element when target = 2·nums[i], so it pairs an index with itself. Querying first guarantees that any match has a smaller index.',
    },
    {
      id: 'iq5',
      q: 'What makes a good key for a hash map in Java?',
      answerMd: 'An immutable object with consistent equals and hashCode: String, Integer, records, or a List you never mutate afterwards. Arrays use identity equality, so two arrays with the same contents are different keys. Convert them to a String or List.',
    },
  ],
  problemIds: [],
  revision: {
    notesMd: `- The pattern: replace "scan for related element" with "look up a computed key" in O(1) average.
- Store existence (set), counts, the last index, or a list, depending on the question.
- Pairs: **query, then insert**.
- Canonical key: sorted string, a count signature (\`int[26]\`), or a tuple encoded as a string.
- Prefix sum + map: count subarrays with sum k, using \`count[prefix − k]\`.
- C++: \`map[key]\` inserts silently; for \`pair\` keys, encode them or use \`map\`.
- Java: don't compare \`Integer\` with \`==\`, and arrays are bad keys.
- Average O(1), worst O(n); ordered maps O(log n) with order queries.`,
    templates: [
      cpp(`
// Count subarrays with sum == k (works with negatives)
int subarraySum(const vector<int>& a, int k) {
    unordered_map<long long, int> cnt{{0, 1}};
    long long pre = 0; int ans = 0;
    for (int x : a) {
        pre += x;
        auto it = cnt.find(pre - k);
        if (it != cnt.end()) ans += it->second;
        cnt[pre]++;
    }
    return ans;
}`, 'Prefix sum + hash map (C++)'),
    ],
    flashcards: [
      { id: 'f1', front: 'Two Sum in O(n): what do you store?', backMd: 'A map value → index of elements already seen. For each x, look up target − x **before** inserting x.' },
      { id: 'f2', front: 'Best key for grouping anagrams?', backMd: 'The 26-count signature (O(L)) or the sorted word (O(L log L)).' },
      { id: 'f3', front: 'Why does `map[key]` in a lookup cause bugs in C++?', backMd: '`operator[]` inserts a default value for a missing key, which changes the map size and can break iteration. Use `find` or `count`.' },
      { id: 'f4', front: 'Count subarrays with sum k (with negatives)?', backMd: 'A running prefix sum and a map of prefix counts; add `cnt[pre − k]` at each step; seed `cnt[0] = 1`.' },
      { id: 'f5', front: 'Hash map worst-case lookup?', backMd: 'O(n) with collisions; O(log n) in Java 8+ treeified buckets.' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 12, passPct: 80, minIndependentSolves: 4, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'NeetCode practice: Arrays & Hashing', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
    { title: 'std::unordered_map (cppreference)', url: 'https://en.cppreference.com/w/cpp/container/unordered_map', kind: 'official-docs' },
    { title: 'HashMap (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html', kind: 'official-docs' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.hashing.q1', type: 'pattern', difficulty: 'easy',
    stem: 'You must find two indices whose values sum to a target in an **unsorted** array of 10⁵ integers. Which approach is O(n) time?',
    options: [['Check every pair', 'That is O(n²): about 5·10⁹ pairs.'], ['Sort, then binary-search each complement', 'Correct but O(n log n), and sorting loses the original indices unless you store them.'], 'One pass with a hash map from value to index', ['Two pointers from both ends', 'Two pointers needs sorted input.']],
    answer: 2,
    explanation: 'For each element look up target − x in a map of already-seen values (average O(1)), then insert x. One pass gives O(n) time and O(n) space.',
  }),
  mcq({
    ...base, id: 'dsa.hashing.q2', type: 'edge-case', difficulty: 'medium',
    stem: 'In Two Sum, you insert `nums[i]` into the map **before** checking for `target - nums[i]`. For which input does this return a wrong answer?',
    options: [['nums = [2, 7, 11], target = 9', 'This still works: 7 finds 2 at index 0.'], 'nums = [3, 5], target = 6', ['nums = [1, 2, 3], target = 100', 'There is no pair here, and none is reported either way.'], ['nums = [−1, 4], target = 3', 'This works: 4 finds −1.']],
    answer: 1,
    explanation: 'With target 6 and value 3, inserting first means the lookup of 6 − 3 = 3 finds index 0 itself and returns [0, 0]. No valid pair exists. Query first, then insert.',
  }),
  mcq({
    ...base, id: 'dsa.hashing.q3', type: 'code-output', difficulty: 'medium',
    stem: 'What does this C++ program print?',
    code: cpp(`#include <iostream>
#include <unordered_map>
using namespace std;
int main() {
    unordered_map<int, int> m;
    m[1] = 10;
    if (m[2] == 0) cout << "zero ";
    cout << m.size() << endl;
    return 0;
}`),
    options: [['zero 1', 'operator[] inserted key 2 when it was read.'], 'zero 2', ['1', 'm[2] is 0 (value-initialised), so "zero " is printed.'], ['Runtime error', 'Reading a missing key with operator[] is legal; it inserts.']],
    answer: 1,
    explanation: '`m[2]` on a missing key inserts {2, 0} and returns a reference to 0, so "zero " prints, and the map now has 2 entries.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.hashing.q4', type: 'code-output', difficulty: 'hard',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;
public class Main {
    public static void main(String[] args) {
        Map<String, Integer> m = new HashMap<>();
        m.put("a", 1000);
        m.put("b", 1000);
        System.out.println(m.get("a") == m.get("b"));
        System.out.println(m.get("a").equals(m.get("b")));
    }
}`),
    options: [['Prints true, then true', '== compares references; 1000 is outside the Integer cache (−128…127).'], 'Prints false, then true', ['Prints true, then false', 'equals compares values, which are equal.'], ['Compilation error', 'The code compiles fine.']],
    answer: 1,
    explanation: 'Autoboxing 1000 creates two distinct Integer objects (only −128…127 are cached by default), so `==` compares references and is false, while `equals` compares values and is true.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.hashing.q5', type: 'pattern', difficulty: 'medium',
    stem: 'Count the subarrays whose sum equals k. The array **contains negative numbers**. Which approach is correct and O(n)?',
    options: [['Sliding window with two pointers', 'Negative numbers break the "growing the window increases the sum" property.'], 'Prefix sums with a hash map of prefix-sum counts', ['Sort, then two pointers', 'Sorting destroys contiguity.'], ['Binary search on prefix sums', 'Prefix sums are not monotonic when negatives exist.']],
    answer: 1,
    explanation: 'sum(i+1..j) = pre[j] − pre[i]. For each j, add the number of earlier prefixes equal to pre[j] − k, read from a map seeded with {0: 1}. This is O(n) and handles negatives.',
    misconceptions: 'Sliding window only works for non-negative arrays, where the sum is monotonic in window size.',
  }),
  mcq({
    ...base, id: 'dsa.hashing.q6', type: 'complexity', difficulty: 'medium',
    stem: 'n words of length up to L are grouped as anagrams by using the **sorted** word as the key. What is the time complexity?',
    options: [['O(n · L)', 'That is the cost with a 26-count signature, not with sorting.'], 'O(n · L log L)', ['O(n log n)', 'You sort letters inside each word, not the list of words.'], ['O(n² · L)', 'No pairwise comparison is needed.']],
    answer: 1,
    explanation: 'Each word is sorted in O(L log L), and the hash insertion costs O(L) for the string key. The total is O(n·L log L). A count-signature key reduces this to O(n·L).',
  }),
  mcq({
    ...base, id: 'dsa.hashing.q7', type: 'concept', difficulty: 'easy',
    stem: 'You need the smallest key strictly greater than x among the keys inserted so far, with up to 10⁵ inserts and queries. Which structure fits best?',
    options: [['unordered_map / HashMap', 'Hash maps have no order, so finding the next greater key would need a full scan.'], 'std::map / TreeMap (or set / TreeSet)', ['A sorted array with insertion', 'Each insertion costs O(n), which gives O(n²) total.'], ['A stack', 'A stack only gives the most recent element.']],
    answer: 1,
    explanation: 'Balanced-tree maps keep keys ordered, so `upper_bound(x)` / `higherKey(x)` runs in O(log n).',
  }),
  mcq({
    ...base, id: 'dsa.hashing.q8', type: 'debug', difficulty: 'medium',
    stem: 'A Java solution uses `Map<int[], Integer>` to count identical rows of a matrix, but every count comes out as 1. Why?',
    options: ['Arrays use identity-based equals and hashCode, so equal-content arrays are different keys', ['HashMap cannot store arrays', 'It can store them; they just compare by reference.'], ['The counts overflow', 'The counts are small integers.'], ['HashMap is unordered', 'Order is irrelevant to counting.']],
    answer: 0,
    explanation: 'Arrays inherit Object.equals and hashCode (identity), so each row is a new key. Use `Arrays.toString(row)`, `List<Integer>`, or a custom string encoding as the key.',
  }),
];
