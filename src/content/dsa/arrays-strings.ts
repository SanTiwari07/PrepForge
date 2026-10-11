import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.arrays-strings';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Arrays and Strings',
  summary: 'Traversal, in-place updates, string building and character counting.',
  level: 'foundation',
  status: 'complete',
  estMinutes: 70,
  prerequisites: ['dsa.complexity'],
  related: ['dsa.hashing', 'dsa.two-pointers', 'dsa.prefix-sums', 'dsa.matrix'],
  subtopics: ['Index arithmetic', 'In-place modification', 'Reversal and rotation', 'Counting characters', 'Building strings efficiently', 'Immutability (Java) vs mutability (C++)'],
  objectives: [
    'Manipulate arrays in place with O(1) extra space using index arithmetic.',
    'Rotate and reverse arrays and strings correctly, including the triple-reversal trick.',
    'Count characters with a fixed-size array instead of a map when the alphabet is small.',
    'Build strings in O(n) in both C++ and Java, and know where the hidden O(n²) traps are.',
    'Handle off-by-one boundaries and empty inputs systematically.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'What makes arrays fast (and where they are slow)',
      bodyMd: `An array is a contiguous block of memory, so element \`i\` lives at \`base + i × size\`. That gives **O(1) random access** and excellent cache behaviour: a linear scan over an array is often several times faster in practice than a scan over a linked structure with the same O(n).

| Operation | Cost | Why |
|---|---|---|
| Read or write \`a[i]\` | O(1) | Address arithmetic |
| Append at the end (dynamic array) | O(1) amortised | Occasional doubling (see Complexity) |
| Insert or delete in the middle | O(n) | Everything after it shifts |
| Search unsorted | O(n) | Must look at every element |
| Search sorted | O(log n) | Binary search |

**Strings** are arrays of characters with one important language difference:
- **C++ \`std::string\` is mutable.** \`s[i] = 'x'\` is O(1), and \`s += c\` is amortised O(1).
- **Java \`String\` is immutable.** Every "modification" creates a new string. Use \`StringBuilder\` (mutable) or a \`char[]\` when you build or edit strings in a loop.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Patterns hiding inside "simple" array questions',
      bodyMd: `Most array questions in OAs are one of a few moves:

1. **One pass with running state:** keep a max, min, sum, count or previous value as you scan (best time to buy stock, max consecutive ones).
2. **Read/write pointers:** compact or filter in place (remove element, move zeroes).
3. **Reverse a range:** rotation, reversing words, palindromes.
4. **Index as hash:** when values lie in \`[1, n]\`, use the value as an index, marking a seen value by negating \`a[v−1]\` (find duplicates or missing numbers in O(1) extra space).
5. **Count with a fixed array:** \`int cnt[26]\` for lowercase letters, \`int cnt[128]\` for ASCII.

> **Ask yourself:** "Do I really need extra memory, or can the input array itself store the information?" Interviewers often follow up with "now do it in O(1) space".`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: rotate right by k with three reversals',
      bodyMd: 'Rotate [1, 2, 3, 4, 5, 6, 7] right by k = 3, giving [5, 6, 7, 1, 2, 3, 4]. Reversing the whole array puts the last k elements first (but backwards); reversing each part fixes the order.',
      trace: [
        { note: 'Start. k = 3 (use k % n so that k ≥ n works).', array: [1, 2, 3, 4, 5, 6, 7] },
        { note: 'Reverse the whole array.', array: [7, 6, 5, 4, 3, 2, 1], window: [0, 6] },
        { note: 'Reverse the first k = 3 elements.', array: [5, 6, 7, 4, 3, 2, 1], window: [0, 2] },
        { note: 'Reverse the remaining n − k elements. Done in O(n) time and O(1) space.', array: [5, 6, 7, 1, 2, 3, 4], window: [3, 6] },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates: rotation, index-as-hash, building strings',
      bodyMd: 'Rotation by reversal, finding missing numbers with the index-marking trick, and efficient string building.',
      code: [
        cpp(`
void rotateRight(vector<int>& a, int k) {
    int n = a.size();
    if (n == 0) return;
    k %= n;                                        // k may exceed n
    reverse(a.begin(), a.end());
    reverse(a.begin(), a.begin() + k);
    reverse(a.begin() + k, a.end());
}

// Values are in [1, n]; return the values that never appear. O(n) time, O(1) extra.
vector<int> findDisappeared(vector<int>& a) {
    for (int x : a) {
        int i = abs(x) - 1;
        if (a[i] > 0) a[i] = -a[i];                // mark value i+1 as seen
    }
    vector<int> res;
    for (int i = 0; i < (int)a.size(); ++i)
        if (a[i] > 0) res.push_back(i + 1);
    return res;
}

// Reverse the words of a sentence, collapsing extra spaces.
string reverseWords(const string& s) {
    vector<string> words;
    string w;
    for (char c : s) {
        if (c == ' ') { if (!w.empty()) { words.push_back(w); w.clear(); } }
        else w += c;
    }
    if (!w.empty()) words.push_back(w);
    string out;
    for (int i = (int)words.size() - 1; i >= 0; --i) {
        out += words[i];
        if (i) out += ' ';
    }
    return out;
}`, 'C++'),
        java(`
void rotateRight(int[] a, int k) {
    int n = a.length;
    if (n == 0) return;
    k %= n;
    reverse(a, 0, n - 1);
    reverse(a, 0, k - 1);
    reverse(a, k, n - 1);
}
void reverse(int[] a, int i, int j) {
    while (i < j) { int t = a[i]; a[i++] = a[j]; a[j--] = t; }
}

List<Integer> findDisappeared(int[] a) {
    for (int x : a) {
        int i = Math.abs(x) - 1;
        if (a[i] > 0) a[i] = -a[i];
    }
    List<Integer> res = new ArrayList<>();
    for (int i = 0; i < a.length; i++) if (a[i] > 0) res.add(i + 1);
    return res;
}

String reverseWords(String s) {
    String[] words = s.trim().split("\\\\s+");          // regex: one or more spaces
    StringBuilder sb = new StringBuilder();
    for (int i = words.length - 1; i >= 0; i--) {
        sb.append(words[i]);
        if (i > 0) sb.append(' ');
    }
    return sb.toString();
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Rotation by reversal: each element is swapped at most twice, giving **O(n) time and O(1) space**. Rotating one step at a time k times would be O(n·k).
- Index marking: two passes, **O(n) time and O(1) extra** (it temporarily modifies the input; mention this, and restore signs if the caller needs the array unchanged).
- Reverse words: O(n) time, O(n) space for the output.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Forgetting \`k %= n\`** in rotation, which crashes or does the wrong thing when k ≥ n.
2. **Off-by-one on ranges:** decide whether \`r\` is inclusive or exclusive and stick to it. \`for (i = 0; i <= n; i++)\` reads past the end.
3. **Java string building with \`+\` in a loop** is O(n²). Use \`StringBuilder\`.
4. **Comparing Java strings with \`==\`** compares references; use \`.equals()\`.
5. **\`char\` arithmetic:** \`c - 'a'\` is right for lowercase letters only. Uppercase, digits or Unicode need a bigger table or a map.
6. **Empty input:** \`a.size() - 1\` on an empty C++ vector underflows (size_t is unsigned) to a huge number. Cast to \`int\` first or check emptiness.
7. **Modifying an array while iterating it with a range-for or iterator**, for example erasing from a vector inside the loop.`,
    },
  ],
  recognition: {
    signals: ['In-place / O(1) extra space is demanded', 'Values are bounded by n (index-as-hash)', 'Rotation, reversal or palindrome checks', 'Character counting over a small alphabet'],
    antiSignals: ['Need fast lookups of arbitrary values: hashing', 'Contiguous window with a constraint: sliding window', 'Repeated range sums: prefix sums'],
    decisionQuestions: ['Can the input array itself hold the extra information I need?', 'Is the range inclusive or exclusive at both ends?', 'What happens with an empty input, a single element, or k ≥ n?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you rotate an array by k in O(1) extra space?', answerMd: 'Reverse the whole array, then reverse the first k elements and the remaining n − k. Use k %= n first. O(n) time, O(1) space. (Cyclic replacements also work, but are harder to get right.)' },
    { id: 'iq2', q: 'Why is string concatenation in a Java loop slow, and what do you use instead?', answerMd: 'Strings are immutable, so `s + c` copies all of s each time, giving O(n²) total. `StringBuilder.append` modifies an internal buffer that grows geometrically, giving amortised O(1) per append and O(n) total.' },
    { id: 'iq3', q: 'Find the duplicate number in an array of n + 1 integers in [1, n] without modifying it and with O(1) space.', answerMd: 'Treat i → a[i] as a linked list; a duplicate value means two indices point to the same node, creating a cycle. Floyd\'s cycle detection finds the cycle entrance, which is the duplicate. O(n) time, O(1) space. (If modification is allowed, sign-marking is simpler.)' },
    { id: 'iq4', q: 'Arrays vs linked lists: when would you prefer each?', answerMd: 'Arrays: O(1) indexing, cache-friendly scans, compact memory; inserting in the middle is O(n). Linked lists: O(1) insert/delete given a node pointer, no reallocation; O(n) indexing and poor locality. Most interview problems favour arrays unless you need O(1) splicing (for example, an LRU cache with a hash map).' },
    { id: 'iq5', q: 'How do you check if two strings are rotations of each other?', answerMd: 'They must have the same length, and b must be a substring of a + a. This is O(n) with KMP or Z, or typically O(n²) worst case with naive `find`, but simple to state.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Array indexing O(1); insert or delete in the middle O(n); append amortised O(1).
- Rotation: reverse all, then the first k, then the rest; \`k %= n\` first.
- Values in [1, n]: use the index as a hash (negate a[v − 1] to mark).
- Java: \`StringBuilder\` for building; \`.equals\` for comparing; \`toCharArray()\` to edit.
- C++: \`string\` is mutable; beware \`size() − 1\` on empty containers (unsigned).
- Small alphabet means \`int cnt[26]\` instead of a hash map.`,
    flashcards: [
      { id: 'f1', front: 'Rotate an array right by k in O(1) space?', backMd: 'k %= n; reverse(all); reverse(first k); reverse(rest).' },
      { id: 'f2', front: 'Values in [1, n]: detect seen values without extra memory?', backMd: 'Index-as-hash: for each x, negate a[|x| − 1]. Positive entries mark missing values.' },
      { id: 'f3', front: 'Cost of `s = s + c` in a Java loop of n iterations?', backMd: 'O(n²): each concatenation copies the immutable string. Use StringBuilder.' },
      { id: 'f4', front: 'Strings a and b are rotations of each other iff…?', backMd: 'len(a) == len(b) and b is a substring of a + a.' },
      { id: 'f5', front: 'Danger of `v.size() - 1` in C++?', backMd: 'size() is unsigned; on an empty vector it wraps to a huge value. Cast to int or check empty().' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 12, passPct: 80, minIndependentSolves: 4, minMediumIndependent: 1, retentionDays: 7 },
  resources: [
    { title: 'std::string (cppreference)', url: 'https://en.cppreference.com/w/cpp/string/basic_string', kind: 'official-docs' },
    { title: 'StringBuilder (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuilder.html', kind: 'official-docs' },
    { title: 'NeetCode practice: Arrays & Hashing', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.arrays-strings.q1', type: 'complexity', difficulty: 'easy',
    stem: 'What is the time complexity of inserting an element at index 0 of a dynamic array (`vector`, `ArrayList`) holding n elements?',
    options: [['O(1)', 'Only appending at the end is (amortised) O(1).'], ['O(log n)', 'No halving is involved.'], 'O(n)', ['O(n log n)', 'There is no sorting.']],
    answer: 2,
    explanation: 'All n existing elements shift one position to the right to make room.',
  }),
  mcq({
    ...base, id: 'dsa.arrays-strings.q2', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> a = {1, 2, 3, 4, 5};
    int k = 7 % (int)a.size();
    reverse(a.begin(), a.end());
    reverse(a.begin(), a.begin() + k);
    reverse(a.begin() + k, a.end());
    for (int x : a) cout << x << " ";
    cout << endl;
    return 0;
}`, 'C++', '4 5 1 2 3'),
    options: ['4 5 1 2 3', ['3 4 5 1 2', 'That is a right rotation by 3, not by 7 % 5 = 2.'], ['1 2 3 4 5', '7 % 5 = 2, so the array does change.'], ['5 4 3 2 1', 'The two partial reversals fix the order.']],
    answer: 0,
    explanation: 'k = 7 % 5 = 2, so this is a right rotation by 2: the last two elements (4, 5) move to the front.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.arrays-strings.q3', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    public static void main(String[] args) {
        String a = "hello";
        String b = "hel" + "lo";
        String c = new String("hello");
        System.out.println((a == b) + " " + (a == c) + " " + a.equals(c));
    }
}`, 'Java', 'true false true'),
    options: [['true true true', '`new String` always creates a new object.'], 'true false true', ['false false true', '"hel" + "lo" is a compile-time constant, interned to the same literal.'], ['false false false', '`equals` compares contents.']],
    answer: 1,
    explanation: 'Compile-time constant expressions are folded and interned, so `a == b` is true. `new String(...)` creates a distinct object, so `a == c` is false. `equals` compares characters and is true.',
    misconceptions: 'Never rely on `==` for string equality in real code; this question shows why it is unpredictable.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.arrays-strings.q4', type: 'pattern', difficulty: 'medium',
    stem: 'An array of n integers contains values in [1, n]; some appear twice and others are missing. Find all missing values in O(n) time and **O(1) extra space** (the output does not count). Which idea works?',
    options: [['Sort and scan', 'Sorting is O(n log n).'], ['A hash set of seen values', 'O(n) extra space.'], 'Mark seen values by negating a[value − 1], then collect indices that stay positive', ['A sum formula: n(n+1)/2 minus the sum', 'That works for exactly one missing number only.']],
    answer: 2,
    explanation: 'Because values map to valid indices, the array itself can record "seen" via the sign bit. Indices still positive afterwards correspond to missing values.',
  }),
  mcq({
    ...base, id: 'dsa.arrays-strings.q5', type: 'edge-case', difficulty: 'easy',
    stem: 'A rotation function computes `k %= n` first. Which input would crash or misbehave **without** that line (using the reversal method)?',
    options: [['n = 5, k = 2', 'k < n works without the modulo.'], 'n = 5, k = 12', ['n = 1, k = 0', 'k < n.'], ['n = 5, k = 5', 'Without %, reversing the first 5 then the remaining 0 elements happens to undo the full reversal; awkward, but it does not crash.']],
    answer: 1,
    explanation: 'With k = 12 > n, `a.begin() + k` points past the end, which is undefined behaviour in C++ and an index error in Java.',
  }),
  mcq({
    ...base, id: 'dsa.arrays-strings.q6', type: 'complexity', difficulty: 'medium',
    stem: 'In Java, which way of reversing the words of an n-character sentence is O(n)?',
    options: [['`result = word + " " + result` for each word', 'Each prepend copies the whole result string: O(n²) characters in the worst case.'], 'Split into words, then append them in reverse order to a StringBuilder', ['`result.concat(word)` in a loop', 'concat also copies the immutable string each time.'], ['Recursion that returns `reverse(rest) + " " + first`', 'Each level copies the substring: O(n²).']],
    answer: 1,
    explanation: 'StringBuilder appends are amortised O(1) per character, so the total is linear. Every version based on immutable String concatenation copies repeatedly.',
  }),
  mcq({
    ...base, id: 'dsa.arrays-strings.q7', type: 'debug', difficulty: 'medium',
    stem: 'This C++ loop is meant to visit all pairs (i, i + 1) of a vector `v`, but it crashes on an empty vector. Why?',
    code: cpp(`for (size_t i = 0; i < v.size() - 1; ++i) {
    process(v[i], v[i + 1]);
}`),
    options: ['`v.size() - 1` is unsigned and wraps to a huge number when v is empty', ['`++i` should be `i++`', 'They are equivalent in a for-loop increment.'], ['`size_t` cannot index vectors', 'size_t is the normal index type.'], ['It only fails for odd sizes', 'It fails specifically for size 0.']],
    answer: 0,
    explanation: 'With size 0, `0 - 1` as an unsigned size_t becomes 2^64 − 1, so the loop runs and reads out of bounds. Use `i + 1 < v.size()` instead.',
  }),
  mcq({
    ...base, id: 'dsa.arrays-strings.q8', type: 'concept', difficulty: 'easy',
    stem: 'Why is a linear scan over an array usually faster in practice than over a linked list with the same number of elements?',
    options: ['Contiguous memory gives good CPU cache locality and prefetching', ['Arrays have better asymptotic complexity for scans', 'Both are O(n).'], ['Linked lists cannot be scanned in order', 'They can, just with pointer chasing.'], ['Arrays use less CPU instructions per element in all languages', 'The decisive factor is memory access, not instruction count.']],
    answer: 0,
    explanation: 'Array elements are adjacent, so each cache line brings several elements and the hardware prefetcher predicts the next ones. Linked nodes are scattered, causing cache misses.',
  }),
];
