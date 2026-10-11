import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.complexity';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Complexity Analysis',
  summary: 'Big-O, Θ, Ω, amortised cost, and reading constraints to pick a target complexity.',
  level: 'foundation',
  status: 'complete',
  estMinutes: 60,
  prerequisites: [],
  related: ['dsa.stl-collections', 'dsa.recursion'],
  subtopics: ['Big-O, Θ and Ω', 'Constraints to target complexity', 'Loop analysis', 'Recurrences', 'Amortised analysis', 'Space complexity'],
  objectives: [
    'Read an OA constraint (for example n ≤ 2·10⁵) and name the slowest complexity that will pass.',
    'Derive the time complexity of nested, logarithmic and harmonic loops without guessing.',
    'Solve common recurrences such as T(n) = 2T(n/2) + n.',
    'Explain amortised O(1) for dynamic arrays and why a monotonic stack is O(n) overall.',
    'Count space correctly, including the recursion stack.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'What complexity measures',
      bodyMd: `Complexity describes **how the work grows as the input grows**, not how many milliseconds a program takes. We count basic steps (comparisons, assignments, array accesses) as a function of the input size *n* and keep only the fastest-growing term.

- **Big-O, O(f(n))**: an *upper bound*. The algorithm does at most about c·f(n) steps for large n. This is what interviewers usually mean by "the complexity".
- **Big-Ω, Ω(f(n))**: a *lower bound*. At least about c·f(n) steps for large n.
- **Big-Θ, Θ(f(n))**: a *tight bound*. Both O(f(n)) and Ω(f(n)).

Constants and lower-order terms are dropped: 3n² + 10n + 7 is O(n²). Drop them because for large n the n² term dominates, and constant factors depend on the machine and compiler.

**Best, average and worst case are different questions from O, Ω and Θ.** Linear search is Θ(1) in the best case (target at index 0) and Θ(n) in the worst case. Saying "linear search is O(n)" is a statement about the worst case.

| Growth | Name | n = 10⁵ (approximate steps) |
|---|---|---|
| O(1) | constant | 1 |
| O(log n) | logarithmic | 17 |
| O(n) | linear | 10⁵ |
| O(n log n) | linearithmic | 1.7 · 10⁶ |
| O(n²) | quadratic | 10¹⁰ (too slow) |
| O(2ⁿ) | exponential | astronomically large |`,
    },
    {
      id: 'constraints',
      kind: 'intuition',
      title: 'Reading constraints: the most useful OA skill',
      bodyMd: `A typical judge executes roughly **10⁸ simple operations per second** in C++ (Java is a bit slower). With a 1–2 second limit, the constraint on *n* tells you which complexity the setter expects. Use this table **before** you think about the algorithm. It narrows the search to a few patterns.

| Constraint | Target complexity | Patterns that fit |
|---|---|---|
| n ≤ 10–12 | O(n!) or O(n · 2ⁿ) | permutations, brute-force backtracking |
| n ≤ 20–25 | O(2ⁿ) | subsets, bitmask DP, meet in the middle (n ≤ 40) |
| n ≤ 500 | O(n³) | 3 nested loops, interval DP, Floyd-Warshall |
| n ≤ 5,000 | O(n²) | 2-D DP, all pairs |
| n ≤ 2·10⁵ | O(n log n) | sorting, heaps, binary search, segment trees |
| n ≤ 10⁶–10⁷ | O(n) | two pointers, sliding window, prefix sums, hashing |
| n ≥ 10⁹ | O(log n) or O(√n) | binary search on the answer, math |

> **Habit:** write the target complexity at the top of your scratchpad as soon as you read the constraints. If your idea is slower than the target, it is the wrong idea. Find the bottleneck before writing code.`,
    },
    {
      id: 'loops',
      kind: 'dry-run',
      title: 'Analysing loops step by step',
      bodyMd: `**1. Nested loops over the same range**: the inner loop runs n, n−1, …, 1 times: n(n+1)/2 = **Θ(n²)**.

**2. Multiplying or dividing the loop variable**: \`for (i = 1; i < n; i *= 2)\` visits 1, 2, 4, …, so it runs about log₂ n times: **Θ(log n)**.

**3. The harmonic pattern**: the inner loop steps by i.
- For i = 1 it runs n times, for i = 2 it runs n/2 times, …, and for i = n it runs once.
- Total = n(1 + 1/2 + 1/3 + … + 1/n) ≈ n ln n = **Θ(n log n)**. This appears in sieve-style code and "for every divisor" loops.

**4. Two pointers that only move forward**: even though there is a loop inside a loop, each pointer moves at most n times in total, so the work is **Θ(n)**. Count *total pointer movements*, not loop nesting.

**5. Sequential blocks add, nested blocks multiply**: O(n log n) sorting followed by an O(n) scan is O(n log n).`,
      code: [
        cpp(`
// Harmonic loop: total work is about n * H(n) = O(n log n)
long long harmonic(int n) {
    long long ops = 0;
    for (int i = 1; i <= n; ++i)
        for (int j = i; j <= n; j += i)
            ++ops;               // runs n/i times for this i
    return ops;
}`, 'C++'),
        java(`
// Harmonic loop: total work is about n * H(n) = O(n log n)
static long harmonic(int n) {
    long ops = 0;
    for (int i = 1; i <= n; i++)
        for (int j = i; j <= n; j += i)
            ops++;               // runs n/i times for this i
    return ops;
}`, 'Java'),
      ],
    },
    {
      id: 'recurrences',
      kind: 'complexity',
      title: 'Recurrences for recursive code',
      bodyMd: `Write the cost of a call in terms of smaller calls, then solve.

| Recurrence | Example | Solution |
|---|---|---|
| T(n) = T(n−1) + O(1) | recursive sum of a list | O(n) |
| T(n) = T(n−1) + O(n) | naive selection-style recursion | O(n²) |
| T(n) = T(n/2) + O(1) | binary search | O(log n) |
| T(n) = 2T(n/2) + O(n) | merge sort | O(n log n) |
| T(n) = 2T(n/2) + O(1) | full traversal of a balanced tree | O(n) |
| T(n) = 2T(n−1) + O(1) | naive Fibonacci (roughly) | O(2ⁿ) |

**Master theorem shortcut** for T(n) = a·T(n/b) + O(nᵈ): compare d with log_b a.
- If d > log_b a, the result is O(nᵈ).
- If d = log_b a, it is O(nᵈ log n).
- If d < log_b a, it is O(n^(log_b a)).

**Recursion-tree intuition:** total work = (work per level) × (number of levels). Merge sort does O(n) work on each of log n levels.`,
    },
    {
      id: 'amortised',
      kind: 'concept',
      title: 'Amortised analysis',
      bodyMd: `Some operations are occasionally expensive but cheap *on average over a sequence*.

- **Dynamic arrays** (\`vector::push_back\`, \`ArrayList.add\`): when full, the array doubles and copies everything. A resize costs O(n), but the copies across n pushes total at most 1 + 2 + 4 + … + n < 2n, so each push is **amortised O(1)**.
- **Monotonic stack:** every element is pushed once and popped at most once, so the total over the whole loop is O(n), even though one iteration may pop many elements.
- **Sliding window:** the left pointer only moves forward, so all the shrinking steps together cost O(n).

Amortised is not the same as average-case. Amortised is a *guarantee* over any sequence of operations. Average-case depends on the input distribution, as with hash tables.`,
    },
    {
      id: 'space',
      kind: 'concept',
      title: 'Space complexity',
      bodyMd: `Count the **extra** memory your algorithm uses as n grows. Many interviewers expect *auxiliary* space (excluding the input and the required output); say which one you mean.

- A hash map storing up to n keys: O(n).
- Recursion depth d uses an O(d) call stack. DFS on a skewed tree (a linked-list shape) is O(n) stack, and that is also how a recursive solution crashes with a stack overflow for n = 10⁵.
- In-place two pointers: O(1).
- A 2-D DP table of n × m: O(n·m), often reducible to O(m) by keeping only the previous row.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes (and hidden costs)',
      bodyMd: `1. **Counting loops instead of work.** Two nested loops can be O(n) (two pointers), and one loop can be O(n²) when the body hides linear work.
2. **Hidden linear operations inside a loop:**
   - Java \`s = s + c\` in a loop copies the string every time, giving O(n²). Use \`StringBuilder\`.
   - C++ \`s.substr()\`, \`find\` on a vector, \`erase\` from the front of a vector, and Java \`list.remove(0)\` are all O(n).
   - Sorting inside a loop adds an extra n log n factor.
3. **Treating hash maps as always O(1).** Average O(1) but worst case O(n) per operation with adversarial collisions (relevant in Codeforces hacks, rarely in interviews). \`std::map\` and \`TreeMap\` are O(log n).
4. **Ignoring the recursion stack** when stating space complexity.
5. **Forgetting the size of numbers.** Products of two values up to 10⁹ overflow 32-bit ints; use \`long long\` or \`long\`.
6. **Saying O(n + m) when you mean O(n · m)**, or the reverse. Two separate loops add; nested loops multiply.`,
    },
  ],
  recognition: {
    signals: [
      'The problem gives explicit bounds such as 1 ≤ n ≤ 10⁵. That is a direct hint about the expected complexity.',
      'Your brute force is O(n²) but n is up to 10⁵: you need an O(n log n) or O(n) idea.',
      'n ≤ 20: exponential search over subsets is acceptable.',
    ],
    antiSignals: [
      'Do not optimise below the target. If n ≤ 1000, a clean O(n²) solution is better than a buggy O(n log n) one in an OA.',
    ],
    decisionQuestions: [
      'What is the largest n? Which complexity fits in about 10⁸ operations?',
      'What exactly is the bottleneck in my brute force: a repeated search, a repeated sum, or a repeated scan?',
      'Can I precompute (prefix sums, hashing, sorting) to remove the repeated work?',
    ],
  },
  mcqIds: [],
  interviewQuestions: [
    {
      id: 'iq1',
      q: 'What is the difference between Big-O, Big-Ω and Big-Θ?',
      answerMd: 'Big-O is an upper bound on growth, Big-Ω a lower bound, and Big-Θ a tight bound (both). For example, insertion sort is O(n²) and Ω(n), so it is not Θ of a single function overall, but its worst case is Θ(n²) and its best case (sorted input) is Θ(n).',
      followUps: ['Is O(n) also O(n²)? (Yes: Big-O is only an upper bound.)'],
    },
    {
      id: 'iq2',
      q: 'Why is appending to a dynamic array O(1) amortised?',
      answerMd: 'Capacity doubles on overflow. Over n appends the total copying is at most 1 + 2 + 4 + … + n < 2n element copies, so the average cost per append is constant. A single append can still cost O(n).',
      followUps: ['What happens if capacity grows by +10 instead of ×2? (Total copying becomes O(n²), so each append is amortised O(n).)'],
    },
    {
      id: 'iq3',
      q: 'Your solution is O(n²) and n can be 10⁵. What do you do?',
      answerMd: 'Estimate: 10¹⁰ operations is far too slow. Identify the bottleneck (usually an inner loop that searches, sums or scans), then remove it with a precomputation or a better structure: a hash map for lookups, prefix sums for range sums, sorting plus two pointers or binary search, or a heap for repeated min/max.',
    },
    {
      id: 'iq4',
      q: 'What is the space complexity of recursive DFS on a binary tree?',
      answerMd: 'O(h), where h is the height: O(log n) for a balanced tree and O(n) for a skewed one. The call stack holds one frame per level of the current path.',
    },
    {
      id: 'iq5',
      q: 'Is a hash map lookup always O(1)?',
      answerMd: 'Average O(1) assuming a good hash function and load factor. Worst case O(n) when many keys collide. Java 8+ HashMap converts long collision chains to balanced trees, giving O(log n) worst case for comparable keys. Ordered maps (std::map, TreeMap) are O(log n).',
    },
  ],
  problemIds: [],
  revision: {
    notesMd: `- About 10⁸ simple operations per second. Map n to a target: 10⁵ → n log n, 10⁴ → n², 20 → 2ⁿ, 10 → n!.
- Nested loops multiply, sequential blocks add, and \`i *= 2\` gives log n.
- The harmonic loop (\`j += i\`) is n log n.
- Merge-sort recurrence 2T(n/2) + n = n log n; binary search T(n/2) + 1 = log n.
- Amortised: dynamic array push O(1); each element pushed and popped once, so O(n) total.
- Space includes the recursion stack; a skewed tree means O(n).
- Hidden O(n): string concatenation in a Java loop, substr, vector erase at the front, list.remove(0).`,
    flashcards: [
      { id: 'f1', front: 'n ≤ 2·10⁵: what is the target complexity?', backMd: 'O(n log n) or better (sorting, heaps, binary search).' },
      { id: 'f2', front: 'Complexity of `for (i=1;i<=n;i++) for (j=i;j<=n;j+=i)`?', backMd: 'O(n log n): the harmonic series n(1 + 1/2 + … + 1/n).' },
      { id: 'f3', front: 'Solve T(n) = 2T(n/2) + O(n).', backMd: 'O(n log n): log n levels with O(n) work each.' },
      { id: 'f4', front: 'Why is a monotonic-stack loop O(n)?', backMd: 'Each element is pushed once and popped at most once, so there are at most 2n stack operations in total.' },
      { id: 'f5', front: 'Space of recursive DFS on a skewed tree?', backMd: 'O(n): the call stack has one frame per node on the path.' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 10, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 },
  resources: [
    { title: 'Big O notation (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Big_O_notation', kind: 'article' },
    { title: 'Time Complexity (USACO Guide)', url: 'https://usaco.guide/bronze/time-comp', kind: 'article' },
    { title: 'Master theorem (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Master_theorem_(analysis_of_algorithms)', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.complexity.q1', type: 'complexity', difficulty: 'easy',
    stem: 'What is the time complexity of this loop?',
    code: cpp(`for (int i = 1; i < n; i *= 2) {\n    sum += i;\n}`),
    options: [['O(n)', 'The loop variable doubles each time; it does not increase by 1.'], 'O(log n)', ['O(n log n)', 'There is only one loop with O(1) work per iteration.'], ['O(√n)', 'That would need i·i < n as the condition.']],
    answer: 1,
    explanation: 'i takes the values 1, 2, 4, …, 2ᵏ < n, so the loop runs about log₂ n times.',
  }),
  mcq({
    ...base, id: 'dsa.complexity.q2', type: 'complexity', difficulty: 'medium',
    stem: 'What is the time complexity of this code?',
    code: cpp(`for (int i = 1; i <= n; ++i)\n    for (int j = i; j <= n; j += i)\n        ++cnt;`),
    options: [['O(n²)', 'The inner loop does not run n times for every i; it runs n/i times.'], ['O(n)', 'Even i = 1 alone contributes n iterations, and the other values of i add more.'], 'O(n log n)', ['O(n √n)', 'There is no square-root structure here.']],
    answer: 2,
    explanation: 'For each i the inner loop runs about n/i times. The total is n(1 + 1/2 + … + 1/n) = n·Hₙ ≈ n ln n, which is O(n log n).',
    misconceptions: 'Students often see two nested loops and answer O(n²). Always sum the actual iteration counts.',
  }),
  mcq({
    ...base, id: 'dsa.complexity.q3', type: 'complexity', difficulty: 'easy',
    stem: 'An OA problem states 1 ≤ n ≤ 2·10⁵ with a 1-second limit. Which complexity should you target?',
    options: [['O(n²)', '4·10¹⁰ operations is far beyond about 10⁸ per second.'], 'O(n log n)', ['O(2ⁿ)', 'Only feasible for n around 20.'], ['O(n³)', 'Only feasible for n around 500.']],
    answer: 1,
    explanation: 'n log n ≈ 2·10⁵ × 18 ≈ 3.6·10⁶ operations, comfortably inside the limit. O(n) also passes, but O(n log n) is the slowest safe target.',
  }),
  mcq({
    ...base, id: 'dsa.complexity.q4', type: 'complexity', difficulty: 'medium',
    stem: 'Solve the recurrence T(n) = 2T(n/2) + O(n).',
    options: [['O(n)', 'That is the solution of 2T(n/2) + O(1).'], 'O(n log n)', ['O(n²)', 'That needs the per-level work to grow, which it does not here.'], ['O(log n)', 'That is T(n/2) + O(1) (binary search).']],
    answer: 1,
    explanation: 'The recursion tree has log₂ n levels and each level does O(n) total work, as in merge sort. By the master theorem a = 2, b = 2, d = 1 = log₂ 2, which gives O(n log n).',
  }),
  mcq({
    ...base, id: 'dsa.complexity.q5', type: 'complexity', difficulty: 'medium',
    stem: 'What is the time complexity of building a string of length n like this in Java?',
    code: java(`String s = "";\nfor (int i = 0; i < n; i++) {\n    s = s + 'a';\n}`),
    options: [['O(n)', 'Each + creates a new String and copies the old one.'], 'O(n²)', ['O(n log n)', 'There is no halving or doubling here.'], ['O(1) amortised', 'Strings are immutable; nothing is amortised.']],
    answer: 1,
    explanation: 'Java Strings are immutable, so each concatenation copies the current contents: 1 + 2 + … + n = O(n²) character copies. StringBuilder.append is amortised O(1), giving O(n) overall.',
    misconceptions: 'Modern JVMs optimise single expressions, but not repeated concatenation across loop iterations.',
  }),
  mcq({
    ...base, id: 'dsa.complexity.q6', type: 'concept', difficulty: 'medium',
    stem: 'A dynamic array doubles its capacity whenever it is full. What is the cost of n consecutive appends?',
    options: ['O(n) total, so O(1) amortised per append', ['O(n²) total', 'True only if capacity grows by a constant amount, not by doubling.'], ['O(n log n) total', 'There are log n resizes, but their copy costs form a geometric series that sums to less than 2n.'], ['O(1) worst case per append', 'A single append that triggers a resize costs O(n).']],
    answer: 0,
    explanation: 'The copy costs are 1 + 2 + 4 + … + n < 2n, plus n writes, giving O(n) total and O(1) amortised per append.',
  }),
  mcq({
    ...base, id: 'dsa.complexity.q7', type: 'concept', difficulty: 'medium',
    stem: 'What is the auxiliary space complexity of recursive DFS on a binary tree with n nodes, in the worst case?',
    options: [['O(1)', 'The call stack is extra memory and must be counted.'], ['O(log n)', 'Only for a balanced tree.'], 'O(n)', ['O(n log n)', 'The stack holds one frame per level, not per node per level.']],
    answer: 2,
    explanation: 'The stack depth equals the height of the tree. A skewed tree (every node has one child) has height n, so the space is O(n).',
  }),
  mcq({
    ...base, id: 'dsa.complexity.q8', type: 'complexity', difficulty: 'hard',
    stem: 'Two pointers l and r both start at 0. The outer loop advances r through the array once; an inner while-loop advances l while a condition holds. l never moves backwards. What is the total time complexity?',
    options: [['O(n²)', 'Nesting alone does not decide this; count total pointer movements.'], 'O(n)', ['O(n log n)', 'No sorting or halving is involved.'], ['It depends on the condition and cannot be bounded', 'l can move at most n times in total, whatever the condition.']],
    answer: 1,
    explanation: 'r moves n times and l moves at most n times over the whole run, because it only moves forward and never passes the end. Total work is O(2n) = O(n). This is why sliding window is linear.',
  }),
  mcq({
    ...base, id: 'dsa.complexity.q9', type: 'concept', difficulty: 'easy',
    stem: 'Which statement is correct?',
    options: [['If an algorithm is O(n), it cannot also be O(n²).', 'Big-O is only an upper bound; O(n) functions are also O(n²).'], 'Θ(n) means the running time is bounded above and below by constant multiples of n for large n.', ['Big-O always describes the average case.', 'Big-O is a bound on a function; you choose which case (best, worst or average) that function describes.'], ['3n² + 100n is Θ(n³).', 'It is Θ(n²); it is O(n³) but not Ω(n³).']],
    answer: 1,
    explanation: 'Θ is a tight bound: c₁·n ≤ f(n) ≤ c₂·n for large n. Big-O is only an upper bound, so an O(n) function is also O(n²).',
  }),
  mcq({
    ...base, id: 'dsa.complexity.q10', type: 'complexity', difficulty: 'medium',
    stem: 'You sort an array of n numbers, then for each element binary-search for its complement. What is the total time?',
    options: [['O(n)', 'Sorting alone costs O(n log n) for comparison sorts.'], 'O(n log n)', ['O(n² log n)', 'There is one binary search per element, not per pair.'], ['O(log n)', 'You still have to touch every element.']],
    answer: 1,
    explanation: 'Sorting costs O(n log n), and n binary searches cost O(n log n). Sequential steps add: O(n log n) + O(n log n) = O(n log n).',
  }),
];
