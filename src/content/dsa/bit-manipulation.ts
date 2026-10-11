import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.bit-manipulation';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Bit Manipulation',
  summary: 'XOR tricks, masks and counting bits.',
  level: 'core',
  status: 'complete',
  estMinutes: 70,
  prerequisites: ['dsa.complexity'],
  related: ['dsa.math', 'dsa.backtracking', 'dsa.tries', 'dsa.dp-advanced'],
  subtopics: ['Bitwise operators and shifts', 'Test, set, clear and toggle a bit', 'x & (x − 1) and x & −x', 'XOR properties', 'Counting set bits', 'Subsets as bitmasks', "Two's complement and signed shifts"],
  objectives: [
    'Use &, |, ^, ~, << and >> to test, set, clear and toggle bits, and know the precedence trap with ==.',
    'Apply x & (x − 1) (drop the lowest set bit) and x & −x (isolate it) to count bits and test powers of two.',
    'Use XOR cancellation (a ^ a = 0, a ^ 0 = a) for Single Number and Missing Number.',
    'Enumerate all subsets of n ≤ 20 items with bitmasks, and recognise when a bitmask is a DP state.',
    "Handle negative numbers correctly: two's complement, arithmetic vs logical right shift (>> vs >>> in Java), and overflow in shifts.",
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Operators and the essential idioms',
      bodyMd: `| Goal | Expression |
|---|---|
| Is bit k set? | \`(x >> k) & 1\` |
| Set bit k | \`x \\| (1 << k)\` |
| Clear bit k | \`x & ~(1 << k)\` |
| Toggle bit k | \`x ^ (1 << k)\` |
| Drop the lowest set bit | \`x & (x − 1)\` |
| Keep only the lowest set bit | \`x & −x\` |
| Is x a power of two (x > 0)? | \`(x & (x − 1)) == 0\` |
| All k low bits set | \`(1 << k) − 1\` |

**XOR facts:** a ^ a = 0, a ^ 0 = a, XOR is commutative and associative. So XOR-ing a list in which every value appears twice except one leaves exactly that one.

**Two's complement:** −x = ~x + 1. That is why x & −x isolates the lowest set bit: the bits below it are 0 in x and stay 0; the bit itself is 1 in both; the bits above are complemented.

**Precedence trap:** in C++ and Java, \`==\` binds tighter than \`&\`. \`x & 1 == 0\` parses as \`x & (1 == 0)\`. Always parenthesise: \`(x & 1) == 0\`.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Where bits show up in interviews',
      bodyMd: `- **Counting set bits:** Brian Kernighan's loop \`while (x) { x &= x − 1; ++count; }\` runs once per set bit. Built-ins: \`__builtin_popcount\` (GCC), \`Integer.bitCount\` (Java). Counting Bits for 0..n in O(n): \`bits[i] = bits[i >> 1] + (i & 1)\`.
- **Single Number variants:** all others twice → XOR everything. All others three times → count each bit position mod 3. Two singles → XOR all to get a ^ b, split numbers by any set bit of it (e.g. the lowest), and XOR each group.
- **Missing Number** in 0..n: XOR all indices and values, or use the sum formula n(n + 1)/2 − sum.
- **Subsets as masks:** for n items, masks 0 … 2ⁿ − 1 represent all subsets; bit i says whether item i is in. Feasible for n ≤ 20 (about 10⁶ masks). Iterating the submasks of a mask: \`for (s = m; s; s = (s − 1) & m)\`.
- **Bitmask DP:** the mask is the set of visited items (Shortest Path Visiting All Nodes, travelling salesman on ≤ 16 cities), giving O(2ⁿ · n) states.
- **Sum of Two Integers without +:** sum without carry = a ^ b, carry = (a & b) << 1; repeat until the carry is 0.
- **Reverse Bits / Number of 1 Bits** on unsigned 32-bit values: in Java use \`>>>\` so the sign bit is not copied.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: two numbers that appear once in [1, 2, 1, 3, 2, 5]',
      bodyMd: 'Everything else appears twice. The answer is {3, 5}.',
      trace: [
        { note: 'XOR all values: 1^2^1^3^2^5 = 3 ^ 5 = 6 (binary 110).', array: [1, 2, 1, 3, 2, 5], vars: { xorAll: '110 (6)' } },
        { note: 'Lowest set bit of 6: 6 & −6 = 2 (binary 010). 3 and 5 differ in this bit.', array: [1, 2, 1, 3, 2, 5], vars: { split: '010 (2)' } },
        { note: 'Group A (bit 1 set): 2, 3, 2. XOR = 3.', array: [1, 2, 1, 3, 2, 5], highlight: [1, 3, 4], vars: { groupA: 3 } },
        { note: 'Group B (bit 1 clear): 1, 1, 5. XOR = 5. Pairs cancel inside each group.', array: [1, 2, 1, 3, 2, 5], highlight: [0, 2, 5], vars: { groupA: 3, groupB: 5 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Bit counting, single numbers, subset enumeration and addition without +.',
      code: [
        cpp(`
int popcount(unsigned x) { int c = 0; while (x) { x &= x - 1; ++c; } return c; }

vector<int> countBits(int n) {
    vector<int> b(n + 1, 0);
    for (int i = 1; i <= n; ++i) b[i] = b[i >> 1] + (i & 1);
    return b;
}

int singleNumber(const vector<int>& a) { int x = 0; for (int v : a) x ^= v; return x; }

// Every number appears three times except one: count each bit mod 3.
int singleNumberII(const vector<int>& a) {
    int result = 0;
    for (int b = 0; b < 32; ++b) {
        int cnt = 0;
        for (int v : a) cnt += (v >> b) & 1;
        if (cnt % 3) result |= (int)(1u << b);         // 1u: avoid shifting into the sign bit of int
    }
    return result;
}

vector<int> singleNumberIII(const vector<int>& a) {
    unsigned all = 0;
    for (int v : a) all ^= (unsigned)v;
    unsigned low = all & (~all + 1);                   // lowest set bit, on unsigned to avoid overflow
    int x = 0, y = 0;
    for (int v : a) ((unsigned)v & low ? x : y) ^= v;
    return {x, y};
}

vector<vector<int>> subsets(const vector<int>& a) {
    int n = a.size();
    vector<vector<int>> out;
    for (int m = 0; m < (1 << n); ++m) {
        vector<int> s;
        for (int i = 0; i < n; ++i) if (m >> i & 1) s.push_back(a[i]);
        out.push_back(s);
    }
    return out;
}

int getSum(int a, int b) {                             // add without + or -
    unsigned x = a, y = b;
    while (y) { unsigned carry = (x & y) << 1; x ^= y; y = carry; }
    return (int)x;
}`, 'C++'),
        java(`
int popcount(int x) { int c = 0; while (x != 0) { x &= x - 1; c++; } return c; }   // or Integer.bitCount(x)

int[] countBits(int n) {
    int[] b = new int[n + 1];
    for (int i = 1; i <= n; i++) b[i] = b[i >> 1] + (i & 1);
    return b;
}

int singleNumber(int[] a) { int x = 0; for (int v : a) x ^= v; return x; }

int singleNumberII(int[] a) {
    int result = 0;
    for (int b = 0; b < 32; b++) {
        int cnt = 0;
        for (int v : a) cnt += (v >>> b) & 1;
        if (cnt % 3 != 0) result |= 1 << b;          // Java: 1 << 31 is defined (Integer.MIN_VALUE)
    }
    return result;
}

int[] singleNumberIII(int[] a) {
    int all = 0;
    for (int v : a) all ^= v;
    int low = all & -all;                             // Java ints wrap, so this is safe
    int x = 0, y = 0;
    for (int v : a) { if ((v & low) != 0) x ^= v; else y ^= v; }
    return new int[] {x, y};
}

List<List<Integer>> subsets(int[] a) {
    int n = a.length;
    List<List<Integer>> out = new ArrayList<>();
    for (int m = 0; m < (1 << n); m++) {
        List<Integer> s = new ArrayList<>();
        for (int i = 0; i < n; i++) if ((m >> i & 1) == 1) s.add(a[i]);
        out.add(s);
    }
    return out;
}

int getSum(int a, int b) {
    while (b != 0) { int carry = (a & b) << 1; a ^= b; b = carry; }
    return a;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Bitwise operations are O(1) on fixed-width integers.
- Kernighan popcount: O(number of set bits) ≤ 32 iterations; built-ins compile to a single instruction on modern CPUs.
- Counting Bits 0..n: O(n).
- Single Number II by bit counting: O(32n).
- Enumerating all subsets: O(2ⁿ · n) (each subset takes O(n) to build). All submasks of all masks: O(3ⁿ).
- Bitmask DP: O(2ⁿ · n) or O(2ⁿ · n²) states × transitions, so n ≤ 16–20.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Precedence:** \`if (x & 1 == 0)\` is wrong; write \`if ((x & 1) == 0)\`.
2. **Shifting by ≥ the width or into the sign bit:** in C++, \`1 << 31\` on int is undefined behaviour before C++20 and \`1 << 32\` is always undefined; use \`1u\`, \`1LL\` or \`1ULL\`. In Java, shift counts are taken mod 32 (mod 64 for long), so \`1 << 32 == 1\`.
3. **Right-shifting negative numbers:** \`>>\` copies the sign bit (arithmetic). In Java use \`>>>\` for a logical shift; in C++ cast to unsigned.
4. **x & −x on INT_MIN** in C++ overflows (−INT_MIN); use unsigned arithmetic.
5. **Infinite loop in Kernighan's popcount on negative numbers in C++** with a right-shift approach; \`x &= x − 1\` terminates, but \`x >>= 1\` on a negative int never reaches 0.
6. **Using masks for n > 30** in an int: overflow; use 64-bit, or rethink (2⁴⁰ subsets is too many anyway).`,
    },
  ],
  recognition: {
    signals: ['Every element appears k times except one', 'Constant extra space with integer inputs', 'Power of two, count bits, reverse bits', 'n ≤ 20 and you must consider subsets', 'Add, multiply or divide without the usual operators'],
    antiSignals: ['Large n with subsets: DP or greedy, not 2ⁿ masks', 'Frequencies of arbitrary values: hash map', 'Floating-point values: bit tricks do not apply'],
    decisionQuestions: ['Can XOR cancellation remove the pairs?', 'Is n small enough (≤ 20) to enumerate masks?', 'Are negative numbers involved, and which shift should I use?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Check whether an integer is a power of two.', answerMd: 'x > 0 && (x & (x − 1)) == 0. A power of two has exactly one set bit; x − 1 turns that bit off and sets all lower bits, so the AND is zero. Zero and negatives must be excluded explicitly.' },
    { id: 'iq2', q: 'Every number appears twice except two. Find both in O(n) time and O(1) space.', answerMd: 'XOR everything to get a ^ b (non-zero because a ≠ b). Pick any set bit of it, e.g. the lowest (x & −x): a and b differ there. Split all numbers by that bit and XOR each group; pairs cancel within groups, leaving a and b.' },
    { id: 'iq3', q: 'Count the set bits of every number from 0 to n in O(n).', answerMd: 'bits[i] = bits[i >> 1] + (i & 1): i has the same bits as i/2 plus its lowest bit. Alternatively bits[i] = bits[i & (i − 1)] + 1.' },
    { id: 'iq4', q: 'Why is `(x & 1) == 0` different from `x & 1 == 0`?', answerMd: 'Equality has higher precedence than bitwise AND, so the second parses as x & (1 == 0) = x & 0 = 0 (false), regardless of x. Always parenthesise bit expressions in comparisons.' },
    { id: 'iq5', q: 'Add two integers without using + or −.', answerMd: 'a ^ b is the sum without carries; (a & b) << 1 is the carry. Repeat with (sum, carry) until the carry is zero (at most 32 iterations). In C++ use unsigned to avoid undefined behaviour when the carry shifts into the sign bit; Java ints wrap, so it works directly.' },
    { id: 'iq6', q: 'When is a bitmask DP appropriate?', answerMd: 'When the state must remember which subset of a small set (n ≤ ~20) has been used or visited: dp[mask][last] for visiting all nodes or travelling salesman, dp[mask] for assigning tasks to people. States are 2ⁿ (· n), so n must be small.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Test (x>>k)&1; set |=1<<k; clear &=~(1<<k); toggle ^=1<<k.
- x&(x−1) drops the lowest set bit; x&−x isolates it; power of two: x>0 && !(x&(x−1)).
- XOR: a^a=0, a^0=a → Single Number; two singles: split by a set bit of a^b.
- Three times: count bits mod 3.
- Subsets: masks 0..2ⁿ−1 for n ≤ 20; submasks via s=(s−1)&m.
- Parenthesise; 1u/1LL for high shifts in C++; >>> in Java.`,
    flashcards: [
      { id: 'f1', front: 'What does x & (x − 1) do?', backMd: 'Clears the lowest set bit.' },
      { id: 'f2', front: 'What does x & −x give?', backMd: 'Only the lowest set bit of x.' },
      { id: 'f3', front: 'Counting Bits recurrence?', backMd: 'bits[i] = bits[i >> 1] + (i & 1).' },
      { id: 'f4', front: 'Java right shift that does not copy the sign bit?', backMd: '`>>>` (logical shift).' },
      { id: 'f5', front: 'Why is `1 << 31` risky in C++?', backMd: 'It shifts into the sign bit of a signed int: undefined before C++20. Use 1u << 31.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 1, retentionDays: 7 },
  resources: [
    { title: 'Bitwise operation (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Bitwise_operation', kind: 'article' },
    { title: "Two's complement (Wikipedia)", url: 'https://en.wikipedia.org/wiki/Two%27s_complement', kind: 'article' },
    { title: 'Integer.bitCount and bit methods (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html', kind: 'official-docs' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.bits.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
using namespace std;
int main() {
    int x = 12;                          // binary 1100
    cout << (x & (x - 1)) << " " << (x & -x) << " " << (x | 3) << " " << (x ^ 10) << endl;
    return 0;
}`, 'C++', '8 4 15 6'),
    options: ['8 4 15 6', ['4 8 15 6', 'x & (x − 1) clears the lowest set bit (4), leaving 8.'], ['8 4 13 6', '1100 | 0011 = 1111 = 15.'], ['8 4 15 2', '1100 ^ 1010 = 0110 = 6.']],
    answer: 0,
    explanation: '1100 & 1011 = 1000 (8); 1100 & 0100 = 0100 (4); 1100 | 0011 = 1111 (15); 1100 ^ 1010 = 0110 (6).',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.bits.q2', type: 'debug', difficulty: 'easy',
    stem: '`if (n & 1 == 0) evens++;` never counts any even numbers. Why?',
    options: ['== binds tighter than &, so it computes n & (1 == 0), which is always 0', ['& does not work on ints', 'It does.'], ['It should be n | 1', 'That tests nothing useful.'], ['1 == 0 throws an error', 'In C++ it is simply false (0); in Java this line does not even compile.']],
    answer: 0,
    explanation: 'Write `(n & 1) == 0`. In Java the unparenthesised version is a compile error (int & boolean), which at least catches it.',
  }),
  mcq({
    ...base, id: 'dsa.bits.q3', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    public static void main(String[] args) {
        int x = -8;
        System.out.println((x >> 1) + " " + (x >>> 28) + " " + Integer.bitCount(x) + " " + (1 << 32));
    }
}`, 'Java', '-4 15 29 1'),
    options: ['-4 15 29 1', ['-4 15 29 0', 'Java masks int shift counts to 5 bits, so 1 << 32 is 1 << 0.'], ['2147483644 15 29 1', '>> is the arithmetic shift; >>> is the logical one.'], ['-4 0 3 1', '−8 is 11111111111111111111111111111000: 29 ones, and its top 4 bits are 1111 = 15.']],
    answer: 0,
    explanation: '−8 >> 1 = −4 (sign bit copied); −8 >>> 28 keeps the top four bits, 1111 = 15; −8 has 29 set bits in two\'s complement; shift counts are taken mod 32.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.bits.q4', type: 'concept', difficulty: 'medium',
    stem: 'Every number in an array appears exactly three times except one, which appears once. Why does XOR-ing everything not work?',
    options: ['a ^ a ^ a = a, so the triples do not cancel', ['XOR is not associative', 'It is.'], ['The array is too large', 'Size is not the issue.'], ['It works; the answer is the XOR', 'Values appearing three times survive the XOR.']],
    answer: 0,
    explanation: 'XOR cancels pairs only. For triples, count how many numbers have each bit set; positions where the count is not a multiple of 3 belong to the single number.',
  }),
  mcq({
    ...base, id: 'dsa.bits.q5', type: 'complexity', difficulty: 'easy',
    stem: 'Enumerating all subsets of n items with bitmasks and building each subset takes how long?',
    options: ['O(2ⁿ · n)', ['O(n²)', 'There are 2ⁿ subsets.'], ['O(2ⁿ)', 'Building each subset scans n bits.'], ['O(n!)', 'That is the number of permutations.']],
    answer: 0,
    explanation: '2ⁿ masks, each examined bit by bit. That is why it is practical only for n up to about 20.',
  }),
  mcq({
    ...base, id: 'dsa.bits.q6', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> b(9, 0);
    for (int i = 1; i <= 8; ++i) b[i] = b[i >> 1] + (i & 1);
    for (int v : b) cout << v;
    cout << endl;
    return 0;
}`, 'C++', '011212231'),
    options: ['011212231', ['012233441', 'Those are not bit counts; 8 = 1000 has one set bit.'], ['011212232', '7 = 111 has 3 set bits and 8 has 1.'], ['001112231', '1 has one set bit.']],
    answer: 0,
    explanation: 'Set-bit counts of 0..8: 0, 1, 1, 2, 1, 2, 2, 3, 1.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.bits.q7', type: 'pattern', difficulty: 'medium',
    stem: 'Visit all nodes of a graph with n ≤ 12 vertices with the fewest edge traversals (revisits allowed). Which state works?',
    options: ['(mask of visited nodes, current node) explored by BFS', ['Just the current node', 'Then you cannot tell which nodes remain.'], ['A sorted list of visited nodes', 'Equivalent to a mask but much slower.'], ['The number of visited nodes', 'Two different sets of the same size are not interchangeable.']],
    answer: 0,
    explanation: 'There are 2¹² × 12 ≈ 49 000 states; BFS from all (1 << i, i) finds the first state whose mask is full. O(2ⁿ · n²).',
  }),
  mcq({
    ...base, id: 'dsa.bits.q8', type: 'edge-case', difficulty: 'hard',
    stem: 'In C++, which expression has undefined behaviour for `int x`?',
    options: ['`1 << 31` (shifting into the sign bit of a signed int, before C++20)', ['`1u << 31`', 'Unsigned shifts below the width are well defined.'], ['`x & (x - 1)` for x = 5', 'Ordinary arithmetic.'], ['`x ^ x`', 'Always 0.']],
    answer: 0,
    explanation: 'Before C++20, left-shifting a 1 into the sign bit of a signed int is undefined. C++20 defines it, but interview code is usually compiled as C++17 or earlier: use 1u or 1LL.',
  }),
];
