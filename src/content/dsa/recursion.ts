import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.recursion';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Recursion',
  summary: 'Base cases, the call stack, recursion trees and converting to iteration.',
  level: 'foundation',
  status: 'complete',
  estMinutes: 75,
  prerequisites: ['dsa.complexity'],
  related: ['dsa.backtracking', 'dsa.binary-trees', 'dsa.dp-1d', 'dsa.divide-conquer'],
  subtopics: ['Base case and progress', 'The call stack', 'Recursion trees and complexity', 'Recursion on lists and strings', 'Fast exponentiation', 'Recursive parsing', 'Converting to iteration'],
  objectives: [
    'Write a recursive function by stating what it returns, a base case and a smaller subproblem, then trusting the recursive call.',
    'Trace the call stack for a small input and predict the output order of code before and after the recursive call.',
    'Derive time and space complexity from the recursion tree (calls × work per call; depth for stack space).',
    'Recognise exponential recursion with overlapping subproblems and fix it with memoisation.',
    'Know when recursion depth can overflow the stack and how to rewrite the function with an explicit stack or a loop.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'The three-part recipe',
      bodyMd: `A recursive function is correct when three things hold:

1. **Contract:** a one-sentence statement of what \`f(input)\` returns. Write it before the code.
2. **Base case(s):** the smallest inputs, answered directly.
3. **Progress + combination:** each call works on a strictly smaller input and combines the results of the recursive calls, **assuming they already satisfy the contract** (the "leap of faith", which is just induction).

Example: reverse a linked list. Contract: \`reverse(head)\` returns the head of the reversed list. Base: empty or one node, return it. Step: reverse the rest, then make the second node point back to \`head\` and cut \`head->next\`.

**What happens in memory:** each call gets a stack frame holding its parameters, locals and return address. Calls are pushed and popped in LIFO order, so code **before** the recursive call runs on the way down, and code **after** it runs on the way back up, in reverse order.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Reading complexity from the recursion tree',
      bodyMd: `Draw the calls as a tree: each node is a call, its children are the calls it makes.

- **Time** = (number of calls) × (work per call, excluding the children). Equivalently, sum the work level by level.
- **Space** = maximum **depth** of the tree × space per frame (plus any heap data you build).

| Recurrence | Shape | Time | Stack depth |
|---|---|---|---|
| f(n) = f(n−1) + O(1) (factorial, list length) | a chain | O(n) | O(n) |
| f(n) = f(n/2) + O(1) (fast power, binary search) | a chain of log n | O(log n) | O(log n) |
| f(n) = 2f(n/2) + O(n) (merge sort) | balanced binary tree | O(n log n) | O(log n) |
| f(n) = f(n−1) + f(n−2) (naive Fibonacci) | binary tree of depth n | O(φⁿ) ≈ O(1.618ⁿ) | O(n) |
| f(n) = 2f(n−1) + O(1) (Tower of Hanoi, subsets) | full binary tree | O(2ⁿ) | O(n) |

When the same arguments appear in many tree nodes (Fibonacci computes fib(n−2) twice, fib(n−3) three times, …), you have **overlapping subproblems**: cache results (memoisation) and the time drops to (number of distinct states) × (work per state). That is the bridge to dynamic programming.

**Stack limits:** typical default stacks are about 1 MB (Windows) to 8 MB (Linux main thread), and the JVM default thread stack is commonly 512 KB to 1 MB. Recursion depth of 10⁵ on a linked list or a skewed tree can overflow; depth of 10⁴ is usually fine. Interviewers often ask how you would make it iterative.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: fast power pow(3, 5)',
      bodyMd: 'pow(x, n) = pow(x, n/2)² · (x if n is odd). The stack grows to depth ⌊log₂ 5⌋ + 2 = 4 frames.',
      trace: [
        { note: 'Call pow(3, 5): n is odd, needs pow(3, 2).', stack: ['pow(3,5)'] },
        { note: 'Call pow(3, 2): needs pow(3, 1).', stack: ['pow(3,5)', 'pow(3,2)'] },
        { note: 'Call pow(3, 1): needs pow(3, 0).', stack: ['pow(3,5)', 'pow(3,2)', 'pow(3,1)'] },
        { note: 'pow(3, 0) = 1 (base case). Pop.', stack: ['pow(3,5)', 'pow(3,2)', 'pow(3,1)', 'pow(3,0)=1'] },
        { note: 'pow(3, 1) = 1² · 3 = 3. pow(3, 2) = 3² = 9.', stack: ['pow(3,5)', 'pow(3,2)=9'] },
        { note: 'pow(3, 5) = 9² · 3 = 243. The depth grows with log₂ n: for n = 10⁹ it is about 31 levels, instead of 10⁹ sequential multiplications.', stack: ['pow(3,5)=243'] },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Fast power (with negative exponents), recursive list reversal, recursive descent for nested expressions, and the same list reversal written iteratively.',
      code: [
        cpp(`
// x^n for any 32-bit n. Convert to long long first: -INT_MIN overflows int.
double myPow(double x, int n) {
    long long e = n;
    if (e < 0) { x = 1 / x; e = -e; }
    double result = 1;
    while (e > 0) {                      // iterative form of pow(x, e/2)^2 * (x if odd)
        if (e & 1) result *= x;
        x *= x;
        e >>= 1;
    }
    return result;
}

ListNode* reverseList(ListNode* head) {
    if (!head || !head->next) return head;          // base case
    ListNode* newHead = reverseList(head->next);   // trust: rest is reversed
    head->next->next = head;                         // second node points back
    head->next = nullptr;
    return newHead;
}

// Decode strings like "3[a2[c]]" -> "accaccacc". Each call parses until ']' or the end.
string decode(const string& s, int& i) {
    string out;
    while (i < (int)s.size() && s[i] != ']') {
        if (isdigit(s[i])) {
            int k = 0;
            while (isdigit(s[i])) k = k * 10 + (s[i++] - '0');
            ++i;                                         // skip '['
            string inner = decode(s, i);
            ++i;                                         // skip ']'
            while (k--) out += inner;
        } else {
            out += s[i++];
        }
    }
    return out;
}

ListNode* reverseIterative(ListNode* head) {        // O(1) stack: no depth limit
    ListNode* prev = nullptr;
    while (head) { ListNode* nxt = head->next; head->next = prev; prev = head; head = nxt; }
    return prev;
}`, 'C++'),
        java(`
double myPow(double x, int n) {
    long e = n;                                     // -Integer.MIN_VALUE overflows int
    if (e < 0) { x = 1 / x; e = -e; }
    double result = 1;
    while (e > 0) {
        if ((e & 1) == 1) result *= x;
        x *= x;
        e >>= 1;
    }
    return result;
}

ListNode reverseList(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode newHead = reverseList(head.next);
    head.next.next = head;
    head.next = null;
    return newHead;
}

private int pos;
String decodeString(String s) { pos = 0; return decode(s); }
private String decode(String s) {
    StringBuilder out = new StringBuilder();
    while (pos < s.length() && s.charAt(pos) != ']') {
        char c = s.charAt(pos);
        if (Character.isDigit(c)) {
            int k = 0;
            while (Character.isDigit(s.charAt(pos))) k = k * 10 + (s.charAt(pos++) - '0');
            pos++;                                       // '['
            String inner = decode(s);
            pos++;                                       // ']'
            out.append(inner.repeat(k));
        } else {
            out.append(c); pos++;
        }
    }
    return out.toString();
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity of the templates',
      bodyMd: `- Fast power: O(log n) multiplications; the recursive version uses O(log n) stack, the loop O(1).
- Recursive list reversal: O(n) time and **O(n) stack**. On LeetCode lists of up to 5000 nodes this is fine; for 10⁶ nodes, use the iterative version.
- Decode string: O(output length) time; stack depth equals the nesting depth of brackets.
- Naive Fibonacci: O(φⁿ) time. With a memo array: O(n) time and O(n) space; bottom-up with two variables: O(1) space.
- Generating all subsets or permutations is inherently exponential (2ⁿ or n!) because the output itself is that large.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Missing or unreachable base case**, for example \`fib(n)\` with only \`n == 0\` handled, which recurses forever on n = 1 → −1 → …
2. **No progress:** calling with the same argument (or the wrong half in binary search) causes infinite recursion and a stack overflow.
3. **Recomputing overlapping subproblems** (naive Fibonacci, naive grid paths): exponential time where a memo gives polynomial.
4. **Passing large objects by value** in C++ (\`vector<int> v\` instead of \`const vector<int>& v\`): every call copies, turning O(n) into O(n²) time and memory.
5. **Integer overflow in the "negate n" step** of power functions: \`-INT_MIN\` does not fit in an int.
6. **Shared mutable state across calls** (a global index, a single string buffer) that is not restored when a call returns. This is the core discipline of backtracking.
7. **Ignoring stack depth** for linear recursion over 10⁵+ elements.`,
    },
  ],
  recognition: {
    signals: ['The input is recursive: trees, nested brackets, expressions, linked lists', 'The problem says "for each choice, solve the rest"', 'A divide step that splits the input into independent smaller parts', 'Halving an exponent or a range (fast power, binary search)'],
    antiSignals: ['A plain loop over an array is clearer and has no depth risk', 'Overlapping subproblems with large state spaces: memoise or tabulate (DP)', 'Depth can reach 10⁵–10⁶: prefer iteration or an explicit stack'],
    decisionQuestions: ['What exactly does my function return for a given input?', 'What is the smallest input I can answer directly?', 'Does each call make the input strictly smaller?', 'Do calls repeat the same arguments? If yes, memoise.'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'What is the space complexity of a recursive DFS on a binary tree with n nodes?', answerMd: 'O(h), where h is the height: one stack frame per level on the current path. That is O(log n) for a balanced tree and O(n) for a skewed one (a "linked list" tree).' },
    { id: 'iq2', q: 'Why is naive recursive Fibonacci exponential, and how do you fix it?', answerMd: 'fib(n) calls fib(n−1) and fib(n−2), which recompute the same values: the call tree has about φⁿ nodes. Memoising fib(k) for each k makes it O(n) time; computing bottom-up with two variables makes it O(n) time and O(1) space; matrix exponentiation gives O(log n).' },
    { id: 'iq3', q: 'How do you convert a recursive function to an iterative one?', answerMd: 'Simulate the call stack: push the initial state, then loop: pop a state, process it, push the states the recursive calls would handle (in reverse order if the order matters). For post-order work, push a marker or a (node, visited) pair. Tail-recursive functions become a simple loop.' },
    { id: 'iq4', q: 'What is tail recursion, and does C++ or Java optimise it?', answerMd: 'A call is a tail call when nothing remains to be done after it returns, so the frame could be reused. C++ compilers often perform tail-call optimisation at higher optimisation levels, but the standard does not require it. The JVM does not perform it. Do not rely on it in interviews; write a loop.' },
    { id: 'iq5', q: 'Implement pow(x, n) efficiently, including negative n.', answerMd: 'Use exponentiation by squaring: x^n = (x^(n/2))² · (x if n is odd). For negative n compute (1/x)^(−n), converting n to a 64-bit type first because −(−2³¹) overflows a 32-bit int. O(log n) time.' },
    { id: 'iq6', q: 'Trace what `void f(int n) { if (n == 0) return; f(n - 1); print(n); }` prints for f(3).', answerMd: '1 2 3. The prints happen after the recursive call returns, so they run on the way back up: f(1) prints first, f(3) last. Moving print before the call would give 3 2 1.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Recipe: contract → base case → smaller subproblem → combine, trusting the recursive call.
- Code before the call runs going down; code after runs coming back up (reverse order).
- Time = calls × work per call; space = max depth × frame size.
- Overlapping subproblems → memoise (→ DP).
- Pass containers by reference in C++; restore shared state on return.
- Fast power: square the half; handle negative n with a 64-bit exponent.
- Deep linear recursion (10⁵+) → iterate or use an explicit stack.`,
    flashcards: [
      { id: 'f1', front: 'What are the three parts of a correct recursive function?', backMd: 'A contract (what it returns), base case(s), and progress on a strictly smaller input combined with the recursive results.' },
      { id: 'f2', front: 'Stack space of recursive DFS on a tree?', backMd: 'O(h), the height: O(log n) balanced, O(n) skewed.' },
      { id: 'f3', front: 'Time of naive fib(n)?', backMd: 'O(φⁿ) ≈ O(1.618ⁿ); memoised O(n).' },
      { id: 'f4', front: 'Why convert n to long in myPow?', backMd: 'Negating INT_MIN (−2³¹) overflows a 32-bit int.' },
      { id: 'f5', front: 'f(n): if n==0 return; f(n−1); print(n). Output of f(3)?', backMd: '1 2 3 (prints run while unwinding).' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 12, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 1, retentionDays: 7 },
  resources: [
    { title: 'Recursion (computer science) (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Recursion_(computer_science)', kind: 'article' },
    { title: 'Exponentiation by squaring (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Exponentiation_by_squaring', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.recursion.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
using namespace std;
void f(int n) {
    if (n == 0) return;
    cout << n << " ";
    f(n - 1);
    cout << n << " ";
}
int main() {
    f(3);
    cout << endl;
    return 0;
}`, 'C++', '3 2 1 1 2 3'),
    options: ['3 2 1 1 2 3', ['3 2 1 3 2 1', 'The second print of each call runs while unwinding, in reverse order.'], ['1 2 3 3 2 1', 'The first print runs on the way down, starting with 3.'], ['3 2 1', 'Each call prints twice.']],
    answer: 0,
    explanation: 'Prints before the call happen going down (3, 2, 1); prints after the call happen coming back up (1, 2, 3).',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.recursion.q2', type: 'complexity', difficulty: 'medium',
    stem: 'What is the time complexity of `int f(int n) { if (n <= 1) return 1; return f(n - 1) + f(n - 1); }`?',
    options: ['O(2ⁿ)', ['O(n)', 'Each call makes two calls, so the call tree doubles per level.'], ['O(n²)', 'The number of calls is 2ⁿ − 1, not n².'], ['O(log n)', 'n decreases by 1, not by half.']],
    answer: 0,
    explanation: 'The recursion tree is a full binary tree of depth n − 1, with about 2ⁿ calls. Computing `f(n - 1)` once and doubling it would make it O(n).',
  }),
  mcq({
    ...base, id: 'dsa.recursion.q3', type: 'complexity', difficulty: 'medium',
    stem: 'A recursive function processes a linked list of n nodes, making one recursive call per node and doing O(1) work. What are its time and stack space?',
    options: ['O(n) time, O(n) stack', ['O(n) time, O(1) stack', 'Every pending call keeps a frame until the end of the list.'], ['O(n log n) time, O(log n) stack', 'The list is not halved.'], ['O(n²) time, O(n) stack', 'Each node is visited once.']],
    answer: 0,
    explanation: 'n frames are live at the deepest point. For very long lists (10⁶ nodes) this can overflow the stack, which is why the iterative version is preferred there.',
  }),
  mcq({
    ...base, id: 'dsa.recursion.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    static int calls = 0;
    static long fib(int n) {
        calls++;
        if (n < 2) return n;
        return fib(n - 1) + fib(n - 2);
    }
    public static void main(String[] args) {
        long v = fib(6);
        System.out.println(v + " " + calls);
    }
}`, 'Java', '8 25'),
    options: ['8 25', ['8 7', 'That would be the call count with memoisation (fib(0)..fib(6)).'], ['13 25', 'fib(6) = 8 with fib(0) = 0, fib(1) = 1.'], ['8 15', 'Count the calls: C(n) = C(n−1) + C(n−2) + 1 with C(0) = C(1) = 1.']],
    answer: 0,
    explanation: 'C(0) = C(1) = 1, C(2) = 3, C(3) = 5, C(4) = 9, C(5) = 15, C(6) = 25. The value is fib(6) = 8. The gap between 25 calls and 7 distinct states is what memoisation removes.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.recursion.q5', type: 'debug', difficulty: 'easy',
    stem: '`int sumDigits(int n) { return n % 10 + sumDigits(n / 10); }` never returns. What is missing?',
    options: ['A base case such as `if (n == 0) return 0;`', ['The call should be sumDigits(n - 1)', 'That would not sum digits.'], ['n should be a long', 'Type size is not the issue.'], ['The modulo should be n / 10', 'n % 10 is the last digit, correctly.']],
    answer: 0,
    explanation: 'Once n reaches 0, the function keeps calling sumDigits(0) forever until the stack overflows.',
  }),
  mcq({
    ...base, id: 'dsa.recursion.q6', type: 'edge-case', difficulty: 'medium',
    stem: 'A myPow(x, n) implementation does `if (n < 0) { x = 1 / x; n = -n; }` with `int n`. Which input breaks it?',
    options: ['n = −2147483648 (INT_MIN)', ['n = −1', '−(−1) = 1 is fine.'], ['x = 0, n = 0', '0⁰ is defined as 1 by the problem.'], ['n = 2147483647', 'It is positive, so no negation happens.']],
    answer: 0,
    explanation: '−INT_MIN does not fit in a 32-bit int (it overflows back to INT_MIN in practice; in C++ it is undefined behaviour). Widen n to 64 bits before negating.',
  }),
  mcq({
    ...base, id: 'dsa.recursion.q7', type: 'concept', difficulty: 'medium',
    stem: 'In C++, why can `void dfs(vector<int> path, int i)` be much slower than `void dfs(vector<int>& path, int i)`?',
    options: ['The first copies the whole vector on every call', ['References are slower than values', 'Passing by reference avoids the copy.'], ['The first cannot be recursive', 'It can.'], ['The second leaks memory', 'References do not allocate.']],
    answer: 0,
    explanation: 'Pass-by-value copies O(len) elements per call. With deep or wide recursion this multiplies the running time and memory; pass by reference and undo changes when returning.',
  }),
  mcq({
    ...base, id: 'dsa.recursion.q8', type: 'pattern', difficulty: 'easy',
    stem: 'Which problem is most naturally solved by recursion on the structure of the input?',
    options: ['Decode an encoded string like "3[a2[c]]"', ['Find the maximum of an array', 'A loop is simpler.'], ['Two Sum', 'A hash map, no recursion.'], ['Count vowels in a string', 'A loop is simpler.']],
    answer: 0,
    explanation: 'Brackets nest, so each "k[...]" is a smaller instance of the same problem: parse the inside recursively, repeat it k times.',
  }),
];
