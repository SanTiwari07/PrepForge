import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.implementation';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Implementation and Simulation',
  summary: 'Long OA statements, careful indexing and clean simulation code.',
  level: 'core',
  status: 'complete',
  estMinutes: 70,
  prerequisites: ['dsa.arrays-strings'],
  related: ['dsa.arrays-strings', 'dsa.matrix', 'dsa.stacks-queues', 'dsa.math'],
  subtopics: ['Reading long statements', 'Choosing state and invariants', 'Simulation with a stack or queue', 'String building and parsing', 'Big-number arithmetic on strings', 'Edge-case checklists', 'Testing by hand'],
  objectives: [
    'Read a long OA statement and turn it into inputs, outputs, rules and edge cases before coding.',
    'Model a simulation with explicit state and a loop invariant, choosing the right structure (stack for collisions, queue for rounds).',
    'Implement string arithmetic (add, multiply) and text formatting (text justification) without off-by-one errors.',
    'Decide when a direct simulation is fast enough and when it must be replaced by arithmetic.',
    'Test with a personal edge-case checklist: empty, one element, all equal, maximum values, negative numbers.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Implementation problems are about precision',
      bodyMd: `Many OA questions have no clever algorithm: they test whether you can **follow a specification exactly**. The risks are misreading, off-by-one errors and unhandled cases, not complexity.

**A reading routine (2–3 minutes, saves 20):**
1. Write the input format, output format and constraints in your own words.
2. List every rule as a numbered bullet. Mark the ambiguous ones and check them against the examples.
3. Recompute every sample output by hand with your rules. If one does not match, you misread something.
4. Note the edge cases the statement mentions (empty input, ties, wrap-around, "at most", "strictly").

**Is the simulation fast enough?** Estimate the number of steps. Simulating 10⁵ events with O(log n) each is fine. Simulating "k rounds" with k up to 10⁹ is not: look for a cycle, a formula, or a jump (fast power on transitions, or skipping whole rounds at once).

**State and invariants:** decide what the loop knows at the start of each iteration ("the stack holds the asteroids that survive so far, from left to right"). A precise invariant makes the update rule obvious and the code short.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Typical shapes',
      bodyMd: `| Problem | Model |
|---|---|
| Asteroid Collision | stack of survivors; a left-moving asteroid fights the top while the top moves right |
| Removing Stars, Backspace Compare | stack (or a write pointer) for "delete the previous character" |
| Dota2 Senate, Josephus-style rounds | queue(s) of indices; push survivors back with index + n |
| Game of Life, board updates | encode the next state alongside the old one |
| Spiral Matrix, Text Justification | explicit boundaries or explicit line-building loops |
| Multiply Strings, Add Binary | digit arrays from the right, with a carry |
| Car Pooling, event timelines | difference array or sorted events |

**Multiply Strings:** the product of an m-digit and an n-digit number has at most m + n digits. Digit i of num1 times digit j of num2 contributes to positions i + j and i + j + 1 of the result array (indices from the left). Accumulate, carry, then strip leading zeros.

**Text Justification:** greedily pack words into a line while total length + gaps ≤ width. For a full line that is not the last and has more than one word, spread the spaces evenly, giving the extra spaces to the leftmost gaps. The last line and single-word lines are left-justified and padded on the right.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: Asteroid Collision on [5, 10, −5, −12, 3]',
      bodyMd: 'Positive moves right, negative moves left; equal sizes destroy each other. The stack holds survivors.',
      trace: [
        { note: '5: stack [5]. 10: stack [5, 10].', stack: [5, 10], array: [5, 10, -5, -12, 3], pointers: { i: 1 } },
        { note: '−5 meets 10: 10 wins, −5 is destroyed. Stack [5, 10].', stack: [5, 10], array: [5, 10, -5, -12, 3], pointers: { i: 2 } },
        { note: '−12 meets 10: 12 > 10, pop 10. Meets 5: pop 5. Stack empty: push −12.', stack: [-12], array: [5, 10, -5, -12, 3], pointers: { i: 3 } },
        { note: '3 moves right; −12 moves left and is to its left, so they never meet. Stack [−12, 3].', stack: [-12, 3], array: [5, 10, -5, -12, 3], pointers: { i: 4 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Asteroid Collision, Multiply Strings and Add Binary.',
      code: [
        cpp(`
vector<int> asteroidCollision(const vector<int>& a) {
    vector<int> st;                                  // survivors so far, left to right
    for (int x : a) {
        bool alive = true;
        while (alive && x < 0 && !st.empty() && st.back() > 0) {
            if (st.back() < -x) st.pop_back();           // top explodes, keep checking
            else { if (st.back() == -x) st.pop_back(); alive = false; }
        }
        if (alive) st.push_back(x);
    }
    return st;
}

string multiply(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<int> d(m + n, 0);
    for (int i = m - 1; i >= 0; --i)
        for (int j = n - 1; j >= 0; --j) {
            int sum = (a[i] - '0') * (b[j] - '0') + d[i + j + 1];
            d[i + j + 1] = sum % 10;
            d[i + j] += sum / 10;
        }
    string out;
    for (int x : d) if (!(out.empty() && x == 0)) out += char('0' + x);
    return out.empty() ? "0" : out;
}

string addBinary(const string& a, const string& b) {
    string out;
    int i = a.size() - 1, j = b.size() - 1, carry = 0;
    while (i >= 0 || j >= 0 || carry) {
        int s = carry + (i >= 0 ? a[i--] - '0' : 0) + (j >= 0 ? b[j--] - '0' : 0);
        out += char('0' + s % 2);
        carry = s / 2;
    }
    reverse(out.begin(), out.end());
    return out;
}`, 'C++'),
        java(`
int[] asteroidCollision(int[] a) {
    Deque<Integer> st = new ArrayDeque<>();
    for (int x : a) {
        boolean alive = true;
        while (alive && x < 0 && !st.isEmpty() && st.peek() > 0) {
            if (st.peek() < -x) st.pop();
            else { if (st.peek() == -x) st.pop(); alive = false; }
        }
        if (alive) st.push(x);
    }
    int[] out = new int[st.size()];
    for (int i = out.length - 1; i >= 0; i--) out[i] = st.pop();   // the deque's head is the top
    return out;
}

String multiply(String a, String b) {
    int m = a.length(), n = b.length();
    int[] d = new int[m + n];
    for (int i = m - 1; i >= 0; i--)
        for (int j = n - 1; j >= 0; j--) {
            int sum = (a.charAt(i) - '0') * (b.charAt(j) - '0') + d[i + j + 1];
            d[i + j + 1] = sum % 10;
            d[i + j] += sum / 10;
        }
    StringBuilder out = new StringBuilder();
    for (int x : d) if (!(out.length() == 0 && x == 0)) out.append(x);
    return out.length() == 0 ? "0" : out.toString();
}

String addBinary(String a, String b) {
    StringBuilder out = new StringBuilder();
    int i = a.length() - 1, j = b.length() - 1, carry = 0;
    while (i >= 0 || j >= 0 || carry != 0) {
        int s = carry + (i >= 0 ? a.charAt(i--) - '0' : 0) + (j >= 0 ? b.charAt(j--) - '0' : 0);
        out.append(s % 2);
        carry = s / 2;
    }
    return out.reverse().toString();
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Asteroid Collision: O(n) time; each asteroid is pushed and popped at most once.
- Multiply Strings: O(m · n) time, O(m + n) space.
- Add Binary: O(max(m, n)).
- Text Justification: O(total characters).
- Before simulating, multiply the number of steps by the cost per step and compare with about 10⁸ simple operations per second as a rough budget.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Not re-deriving the sample outputs** before coding, so a misread rule is discovered late.
2. **Off-by-one** in ranges ("between a and b inclusive", 1-indexed input).
3. **Forgetting the final carry** in string arithmetic, or leading zeros in the result ("0" × "123" must be "0").
4. **Asteroids: only checking the top once** instead of looping while collisions continue.
5. **Java Deque as a stack:** \`push\`/\`pop\`/\`peek\` work at the head, so iterating the deque gives the stack from the top down.
6. **Simulating 10⁹ steps** when a cycle or a formula exists.
7. **Hard-coding sample sizes** (array dimensions, number of test cases) instead of reading them.`,
    },
  ],
  recognition: {
    signals: ['A long statement with many rules and little algorithmic structure', 'A process described step by step (rounds, collisions, edits, formatting)', 'Arithmetic on numbers too large for 64-bit integers', 'Grid or board updates by rules'],
    antiSignals: ['The step count is huge: find a cycle or a formula', 'A rule hides a classic pattern (monotonic stack, sliding window): use that pattern'],
    decisionQuestions: ['Can I restate every rule precisely and reproduce the samples by hand?', 'What exactly is my state after each step?', 'How many steps will the simulation take in the worst case?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you approach a long OA problem statement?', answerMd: 'Restate inputs, outputs and constraints; list every rule; recompute the sample outputs by hand; write down edge cases (empty, single, ties, limits). Then estimate whether direct simulation fits the time limit before coding.' },
    { id: 'iq2', q: 'Explain the Asteroid Collision solution.', answerMd: 'Keep a stack of survivors. A right-moving asteroid is pushed. A left-moving one repeatedly fights the top while the top moves right: if the top is smaller, pop it and continue; if equal, pop it and the new one also dies; if larger, the new one dies. If it survives, push it. Each asteroid is pushed and popped at most once: O(n).' },
    { id: 'iq3', q: 'Multiply two numbers given as strings.', answerMd: 'Allocate m + n digits. For each pair of digits (from the right), add their product to position i + j + 1, keep the units there and carry the tens into i + j. Strip leading zeros (return "0" if nothing remains). O(mn).' },
    { id: 'iq4', q: 'A simulation would need 10⁹ rounds. What do you do?', answerMd: 'Look for structure: the state space may be small, so the process becomes periodic (detect the cycle and use the remainder); rounds may be skippable in bulk (process whole blocks); or there may be a closed form. As a last resort, model transitions as a matrix and use fast exponentiation.' },
    { id: 'iq5', q: 'What is your edge-case checklist?', answerMd: 'Empty input; one element; all elements equal; already sorted and reverse sorted; maximum sizes and values (overflow); negative numbers and zero; duplicates and ties; boundary positions (first/last row, wrap-around).' },
    { id: 'iq6', q: 'How do you distribute spaces in Text Justification?', answerMd: 'For a line with k words and total word length L, the gaps are k − 1 and the spaces S = width − L. Each gap gets S / (k − 1) spaces, and the first S % (k − 1) gaps get one extra. Single-word lines and the last line are left-justified and padded on the right.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Read: restate I/O, number the rules, reproduce samples by hand, list edge cases.
- Estimate steps × cost; huge step counts → cycles or formulas.
- Define the loop invariant before writing the update.
- Stacks for "fight the previous one" (asteroids, stars); queues for rounds.
- String arithmetic: from the right, carry, strip leading zeros.
- Checklist: empty, one, equal, sorted, max values, negatives, ties, boundaries.`,
    flashcards: [
      { id: 'f1', front: 'Asteroid Collision structure?', backMd: 'A stack of survivors; a left-mover fights the top while the top moves right.' },
      { id: 'f2', front: 'Multiply Strings: where does a[i]·b[j] go?', backMd: 'Positions i + j + 1 (units) and i + j (carry) of an (m + n)-digit array.' },
      { id: 'f3', front: 'Text Justification extra spaces go where?', backMd: 'To the leftmost gaps: the first S % (k − 1) gaps get one more.' },
      { id: 'f4', front: 'What should you do before coding a long OA statement?', backMd: 'Reproduce every sample output by hand using your restated rules.' },
      { id: 'f5', front: 'Simulation with 10⁹ steps?', backMd: 'Look for a cycle, a formula, bulk skipping or matrix exponentiation.' },
    ],
  },
  mastery: { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Asteroid Collision (LeetCode 735)', url: 'https://leetcode.com/problems/asteroid-collision/', kind: 'practice' },
    { title: 'Text Justification (LeetCode 68)', url: 'https://leetcode.com/problems/text-justification/', kind: 'practice' },
    { title: 'Multiplication algorithm: long multiplication (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Multiplication_algorithm', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.impl.q1', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {10, 2, -5}, st;
    for (int x : a) {
        bool alive = true;
        while (alive && x < 0 && !st.empty() && st.back() > 0) {
            if (st.back() < -x) st.pop_back();
            else { if (st.back() == -x) st.pop_back(); alive = false; }
        }
        if (alive) st.push_back(x);
    }
    for (int v : st) cout << v << " ";
    cout << endl;
    return 0;
}`, 'C++', '10'),
    options: ['10', ['10 2', '2 is destroyed by −5.'], ['-5', '10 is larger than 5.'], ['10 -5', '−5 explodes against 10.']],
    answer: 0,
    explanation: '−5 destroys 2 (5 > 2), then meets 10 and is destroyed (10 > 5). Only 10 survives.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.impl.q2', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    static String multiply(String a, String b) {
        int m = a.length(), n = b.length();
        int[] d = new int[m + n];
        for (int i = m - 1; i >= 0; i--)
            for (int j = n - 1; j >= 0; j--) {
                int sum = (a.charAt(i) - '0') * (b.charAt(j) - '0') + d[i + j + 1];
                d[i + j + 1] = sum % 10;
                d[i + j] += sum / 10;
            }
        StringBuilder out = new StringBuilder();
        for (int x : d) if (!(out.length() == 0 && x == 0)) out.append(x);
        return out.length() == 0 ? "0" : out.toString();
    }
    public static void main(String[] args) {
        System.out.println(multiply("123", "456") + " " + multiply("0", "52") + " " + multiply("99", "99"));
    }
}`, 'Java', '56088 0 9801'),
    options: ['56088 0 9801', ['056088 0 9801', 'Leading zeros are stripped.'], ['56088 00 9801', 'An all-zero result becomes "0".'], ['56088 0 9081', '99 × 99 = 9801.']],
    answer: 0,
    explanation: '123 × 456 = 56088; 0 × 52 = 0 (the empty builder becomes "0"); 99 × 99 = 9801.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.impl.q3', type: 'concept', difficulty: 'easy',
    stem: 'What is the most effective first step for a long OA statement with several rules?',
    options: ['Restate the rules and reproduce the sample outputs by hand', ['Start coding immediately to save time', 'Misreads found late cost more time.'], ['Search for a matching LeetCode problem', 'Not possible during an OA, and often misleading.'], ['Write the most general solution possible', 'Precision beats generality here.']],
    answer: 0,
    explanation: 'If your restated rules reproduce every sample, you have probably read the statement correctly.',
  }),
  mcq({
    ...base, id: 'dsa.impl.q4', type: 'complexity', difficulty: 'medium',
    stem: 'A process changes a state of 10 bits per step and you must report the state after 10⁹ steps. What makes this fast?',
    options: ['There are at most 1024 states, so the sequence becomes periodic: find the cycle and use the remainder', ['Simulate all 10⁹ steps', 'Roughly 10⁹ operations, too slow in many judges.'], ['Binary search on the step number', 'The state is not monotone.'], ['Use a heap', 'Nothing needs ordering.']],
    answer: 0,
    explanation: 'By the pigeonhole principle, a state repeats within 1025 steps. Record when each state was first seen, compute the cycle length, and jump ahead.',
  }),
  mcq({
    ...base, id: 'dsa.impl.q5', type: 'debug', difficulty: 'medium',
    stem: 'An Add Binary loop is `while (i >= 0 || j >= 0)`. For "1" + "1" it returns "0". What is missing?',
    options: ['The final carry: the loop must also continue while carry != 0', ['The strings must be reversed first', 'Reading from the right handles that.'], ['It should use base 10', 'The inputs are binary.'], ['i and j should start at 0', 'They must start at the last digit.']],
    answer: 0,
    explanation: '1 + 1 = 10₂: the loop writes 0 and exits with carry 1 unprocessed. Add `|| carry` to the condition.',
  }),
  mcq({
    ...base, id: 'dsa.impl.q6', type: 'edge-case', difficulty: 'easy',
    stem: 'Which input is most likely to break a Multiply Strings implementation that does not handle leading zeros?',
    options: ['"0" and "9133"', ['"2" and "3"', 'A plain one-digit product.'], ['"123" and "456"', 'The standard example.'], ['"99" and "99"', 'Fills all four digits.']],
    answer: 0,
    explanation: 'The digit array is all zeros; stripping leading zeros leaves nothing, so the code must return "0" explicitly.',
  }),
  mcq({
    ...base, id: 'dsa.impl.q7', type: 'concept', difficulty: 'medium',
    stem: 'Text Justification: a line holds the words "This", "is", "an" (8 letters) and the width is 16. How are the 8 spaces distributed?',
    options: ['4 and 4', ['5 and 3', 'With 2 gaps and 8 spaces the split is even.'], ['3 and 5', 'Extra spaces go to the left gaps, and here there are none.'], ['1 and 1, then 6 at the end', 'Only the last line is left-justified.']],
    answer: 0,
    explanation: 'Gaps = 3 − 1 = 2; spaces = 16 − 8 = 8; 8 / 2 = 4 each with remainder 0. With 9 spaces it would be 5 and 4.',
  }),
  mcq({
    ...base, id: 'dsa.impl.q8', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Deque<Integer> st = new ArrayDeque<>();
        st.push(1); st.push(2); st.push(3);
        System.out.println(st + " " + st.peek() + " " + st.peekLast());
    }
}`, 'Java', '[3, 2, 1] 3 1'),
    options: ['[3, 2, 1] 3 1', ['[1, 2, 3] 3 1', 'push adds at the head, and iteration starts at the head.'], ['[3, 2, 1] 1 3', 'peek reads the head (the top of the stack).'], ['[1, 2, 3] 1 3', 'ArrayDeque used as a stack keeps the top at the head.']],
    answer: 0,
    explanation: 'push = addFirst, so the deque is 3, 2, 1 from head to tail. peek is the head (3); peekLast is the tail (1). When you turn the stack into an output array, remember that the head is the top.',
    verified: 'compiled',
  }),
];
