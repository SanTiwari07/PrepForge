import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.stacks-queues';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Stacks and Queues',
  summary: 'LIFO and FIFO structures for matching, evaluation and level-order processing.',
  level: 'foundation',
  status: 'complete',
  estMinutes: 70,
  prerequisites: ['dsa.arrays-strings'],
  related: ['dsa.monotonic-stack-queue', 'dsa.recursion', 'dsa.graphs', 'dsa.design-ds'],
  subtopics: ['Bracket matching', 'Expression evaluation (RPN)', 'Stack with extra state (min stack)', 'Queue via two stacks', 'Deques', 'BFS queues'],
  objectives: [
    'Recognise LIFO problems (most recent unmatched item) and FIFO problems (process in arrival order).',
    'Solve bracket matching, reverse Polish evaluation and "decode string" style nesting with a stack.',
    'Augment a stack with extra state, such as the current minimum in O(1).',
    'Implement a queue with two stacks in amortised O(1) and explain why it is amortised.',
    'Use the right container in C++ (stack, queue, deque) and Java (ArrayDeque, not Stack).',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'LIFO vs FIFO',
      bodyMd: `- **Stack (LIFO):** push and pop at the same end. The top is always the *most recent unfinished* item, which is exactly what nesting needs (brackets, function calls, undo history, DFS).
- **Queue (FIFO):** push at the back, pop from the front. Items are processed *in arrival order* (BFS, task scheduling, buffering).
- **Deque:** push and pop at both ends; it can act as either and powers sliding-window maximum.

| | C++ | Java (recommended) |
|---|---|---|
| Stack | \`stack<T>\` or \`vector<T>\` (push_back/pop_back) | \`ArrayDeque<T>\`: push/pop/peek |
| Queue | \`queue<T>\` | \`ArrayDeque<T>\`: offer/poll/peek |
| Deque | \`deque<T>\` | \`ArrayDeque<T>\`: offerFirst/offerLast/pollFirst/pollLast |

Java's legacy \`Stack\` class extends \`Vector\` (synchronised, slower); prefer \`ArrayDeque\`. Note that \`ArrayDeque\` does not allow \`null\` elements.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'When a stack is the answer',
      bodyMd: `Reach for a stack when **the next decision depends on the most recent unresolved item**:
- An opening bracket waits for its closing partner; the innermost one must close first.
- In an expression, an operator waits for its operands.
- In "decode string" (\`3[a2[c]]\`), an outer repetition waits for inner ones to finish.
- In "remove adjacent duplicates", each new character only interacts with the last kept one.

Reach for a queue when **order of arrival must be preserved**, such as BFS layers, round-robin and streaming windows.

**Stack + extra state:** if you need an aggregate (min, max) of everything in the stack, push the aggregate *as it was at that moment* alongside each value. Popping then restores the previous aggregate automatically.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: are the brackets valid?',
      bodyMd: 's = "{[()]}(". Push openers; on a closer, the top must be its partner.',
      trace: [
        { note: '"{", "[" and "(" are openers: push them.', array: ['{', '[', '(', ')', ']', '}', '('], pointers: { i: 2 }, stack: ['{', '[', '('] },
        { note: '")" matches the top "(": pop.', array: ['{', '[', '(', ')', ']', '}', '('], pointers: { i: 3 }, stack: ['{', '['] },
        { note: '"]" and then "}" each match the top: pop both.', array: ['{', '[', '(', ')', ']', '}', '('], pointers: { i: 5 }, stack: [] },
        { note: '"(" is pushed. End of string, but the stack is not empty, so the string is INVALID.', array: ['{', '[', '(', ')', ']', '}', '('], pointers: { i: 6 }, stack: ['('] },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Bracket validation, a min stack in O(1) per operation, and a queue built from two stacks.',
      code: [
        cpp(`
bool isValid(const string& s) {
    vector<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') { st.push_back(c); continue; }
        if (st.empty()) return false;                       // closer with nothing open
        char o = st.back(); st.pop_back();
        if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) return false;
    }
    return st.empty();                                       // leftovers are unclosed
}

class MinStack {
    vector<pair<int, int>> st;                               // (value, min so far)
public:
    void push(int x) { st.push_back({x, st.empty() ? x : min(x, st.back().second)}); }
    void pop() { st.pop_back(); }
    int top() const { return st.back().first; }
    int getMin() const { return st.back().second; }
};

class MyQueue {                                              // amortised O(1) per operation
    stack<int> in, out;
    void shift() { if (out.empty()) while (!in.empty()) { out.push(in.top()); in.pop(); } }
public:
    void push(int x) { in.push(x); }
    int pop() { shift(); int v = out.top(); out.pop(); return v; }
    int peek() { shift(); return out.top(); }
    bool empty() const { return in.empty() && out.empty(); }
};`, 'C++'),
        java(`
boolean isValid(String s) {
    Deque<Character> st = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') { st.push(c); continue; }
        if (st.isEmpty()) return false;
        char o = st.pop();
        if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) return false;
    }
    return st.isEmpty();
}

class MinStack {
    private final Deque<int[]> st = new ArrayDeque<>();      // {value, min so far}
    public void push(int x) { st.push(new int[]{x, st.isEmpty() ? x : Math.min(x, st.peek()[1])}); }
    public void pop() { st.pop(); }
    public int top() { return st.peek()[0]; }
    public int getMin() { return st.peek()[1]; }
}

class MyQueue {
    private final Deque<Integer> in = new ArrayDeque<>(), out = new ArrayDeque<>();
    private void shift() { if (out.isEmpty()) while (!in.isEmpty()) out.push(in.pop()); }
    public void push(int x) { in.push(x); }
    public int pop() { shift(); return out.pop(); }
    public int peek() { shift(); return out.peek(); }
    public boolean empty() { return in.isEmpty() && out.isEmpty(); }
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Push, pop and peek on a stack or queue: **O(1)**.
- Bracket validation: O(n) time, O(n) space in the worst case (all openers).
- Min stack: O(1) per operation, O(n) space (the pair doubles memory; a second "mins" stack that only stores new minimums can save space).
- Queue via two stacks: a single \`pop\` can cost O(n) when it moves everything, but each element moves from \`in\` to \`out\` **at most once**, so n operations cost O(n) total: **amortised O(1)**.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Popping or peeking an empty stack.** In C++, \`top()\` on an empty \`stack\` is undefined behaviour; in Java, \`pop()\` throws. Check first. This is a classic edge case with a leading closer, as in ")(".
2. **Returning true at the end without checking the stack is empty** ("((" is invalid).
3. **Java \`Stack\` iteration order:** iterating a \`Stack\` goes bottom→top, while iterating an \`ArrayDeque\` used as a stack goes top→bottom. Do not rely on iteration order in solutions.
4. **Using \`deque.push\` in Java when you meant the back:** \`push\` adds at the *front* (stack semantics); use \`offerLast\`/\`addLast\` for queue semantics.
5. **Min stack that stores only one global min**: after popping the min, you no longer know the next min.
6. **Moving elements between stacks on every operation** in the two-stack queue. Only refill \`out\` when it is empty, or the amortised bound breaks.`,
    },
  ],
  recognition: {
    signals: ['Nested structures (brackets, tags, encoded strings)', 'The newest unresolved item decides the next action', 'Undo, backtrack or "previous state" requirements', 'Process strictly in arrival order (queue)'],
    antiSignals: ['Need the next greater or smaller element: a monotonic stack (special case)', 'Need min or max of a sliding window: a monotonic deque', 'Need the smallest item overall at any time: a heap'],
    decisionQuestions: ['Which item am I waiting to resolve, and is it always the most recent one?', 'What extra state must travel with each pushed item?', 'What should happen when the structure is empty?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you design a stack that returns its minimum in O(1)?', answerMd: 'Store with each element the minimum of the stack at the time it was pushed (or keep a second stack of minimums). getMin reads the top\'s stored minimum; popping restores the previous minimum automatically.' },
    { id: 'iq2', q: 'Implement a queue using stacks. What is the cost per operation?', answerMd: 'Use an input stack and an output stack. Push to input. On pop or peek, if output is empty, move everything from input to output (reversing the order). Each element is moved at most once, so operations are amortised O(1); a single pop can be O(n).' },
    { id: 'iq3', q: 'How would you evaluate an expression in Reverse Polish Notation?', answerMd: 'Scan the tokens. Push numbers; on an operator pop b then a (order matters for − and /), push a op b. The final stack holds the result. O(n) time.' },
    { id: 'iq4', q: 'Why prefer ArrayDeque over Stack in Java?', answerMd: 'Stack extends Vector, which is synchronised (slower) and exposes index-based methods that break the abstraction. ArrayDeque is unsynchronised, faster, and offers both stack and queue operations. Note it rejects nulls.' },
    { id: 'iq5', q: 'Where are stacks used implicitly?', answerMd: 'The call stack (recursion: each call frame is pushed and popped), DFS, undo/redo, the browser back button, and expression parsing in compilers.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Stack = the most recent unresolved item; queue = arrival order.
- Brackets: push openers; a closer must match the top; the stack must end empty.
- Min stack: push (x, min(x, currentMin)).
- Two-stack queue: refill \`out\` only when it is empty, giving amortised O(1).
- RPN: pop b, then a; push a op b.
- Java: use \`ArrayDeque\` (\`push/pop/peek\` for a stack, \`offer/poll/peek\` for a queue); no nulls.
- Always guard against empty pops.`,
    flashcards: [
      { id: 'f1', front: 'Valid parentheses: two failure checks besides a mismatch?', backMd: 'A closer arrives when the stack is empty, and the stack is non-empty at the end.' },
      { id: 'f2', front: 'Min stack trick?', backMd: 'Store (value, min-so-far) with each push; getMin = top.min.' },
      { id: 'f3', front: 'Why is the two-stack queue amortised O(1)?', backMd: 'Each element is moved from in to out at most once over its lifetime.' },
      { id: 'f4', front: 'RPN evaluation: operand order for "a b −"?', backMd: 'Pop b first, then a; compute a − b.' },
      { id: 'f5', front: 'Java: preferred stack class?', backMd: 'ArrayDeque (push/pop/peek). Avoid legacy Stack (synchronised, extends Vector).' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 12, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 1, retentionDays: 7 },
  resources: [
    { title: 'std::stack (cppreference)', url: 'https://en.cppreference.com/w/cpp/container/stack', kind: 'official-docs' },
    { title: 'ArrayDeque (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html', kind: 'official-docs' },
    { title: 'NeetCode practice: Stack', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.stacks-queues.q1', type: 'edge-case', difficulty: 'easy',
    stem: 'A bracket checker pushes openers and pops on closers, but returns `true` when the loop ends **without** checking whether the stack is empty. Which input is wrongly accepted?',
    options: [['"()"', 'Balanced: correctly accepted.'], '"(("', ['")("', 'Rejected earlier: the leading closer hits an empty stack.'], ['"([)]"', 'Rejected on the mismatch.']],
    answer: 1,
    explanation: '"((" never triggers a mismatch, but two openers remain unclosed. The final emptiness check is what rejects it.',
  }),
  mcq({
    ...base, id: 'dsa.stacks-queues.q2', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;
public class Main {
    public static void main(String[] args) {
        Deque<Integer> d = new ArrayDeque<>();
        d.push(1);
        d.push(2);
        d.offerLast(3);
        d.push(4);
        System.out.println(d.pop() + " " + d.pollLast() + " " + d.peek());
    }
}`, 'Java', '4 3 2'),
    options: ['4 3 2', ['4 1 2', 'offerLast(3) appended 3 at the back, so pollLast returns 3.'], ['3 1 4', 'push adds at the front (stack top).'], ['1 2 3', 'This is not FIFO from the front.']],
    answer: 0,
    explanation: 'push adds at the front: [2, 1]; offerLast(3): [2, 1, 3]; push(4): [4, 2, 1, 3]. pop() → 4; pollLast() → 3; peek() → 2.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.stacks-queues.q3', type: 'complexity', difficulty: 'medium',
    stem: 'A queue is built from two stacks (in, out); `pop` refills `out` from `in` only when `out` is empty. What is the cost of n pushes followed by n pops?',
    options: [['O(n²)', 'Each element moves between stacks only once.'], 'O(n) total: amortised O(1) per operation', ['O(n log n)', 'There is no sorting or halving.'], ['O(1) total', 'Every element must be touched.']],
    answer: 1,
    explanation: 'Each element is pushed to in, moved once to out, and popped once from out: three O(1) steps per element.',
  }),
  mcq({
    ...base, id: 'dsa.stacks-queues.q4', type: 'concept', difficulty: 'easy',
    stem: 'Evaluating the RPN tokens ["4", "13", "5", "/", "+"] (integer division) gives:',
    options: [['3', 'You may have computed 5 / 13 instead of 13 / 5.'], '6', ['17', 'Division happens before the addition here.'], ['2', 'You may have divided 13 by 5 then subtracted.']],
    answer: 1,
    explanation: '13 / 5 = 2 (the operands pop as b = 5, a = 13), then 4 + 2 = 6.',
  }),
  mcq({
    ...base, id: 'dsa.stacks-queues.q5', type: 'pattern', difficulty: 'medium',
    stem: 'Decode strings like "3[a2[c]]" → "accaccacc". Which approach handles arbitrary nesting cleanly?',
    options: ['A stack that saves (string so far, repeat count) when "[" opens and combines them when "]" closes', ['A queue of characters', 'FIFO order cannot handle nesting.'], ['A regular expression replace in one pass', 'One pass cannot resolve inner groups first.'], ['Sorting characters', 'Order matters.']],
    answer: 0,
    explanation: 'Each "[" starts a new context; the innermost must finish first, which is LIFO. On "]", pop the outer context and append the inner string repeated k times.',
  }),
  mcq({
    ...base, id: 'dsa.stacks-queues.q6', type: 'debug', difficulty: 'medium',
    stem: 'A min stack stores a single variable `curMin`, updated on push. After pushing 5, 2, 7 and popping twice, `getMin()` returns 2 instead of 5. What is the fix?',
    options: ['Store the minimum at each level (pairs or a second stack), so popping restores the previous minimum', ['Recompute the min after every push', 'The bug appears on pop, not push.'], ['Use a queue instead', 'That does not track minimums.'], ['Store the maximum instead', 'That does not help with minimums.']],
    answer: 0,
    explanation: 'After popping 7 and 2, the true min is 5, but a single variable still holds 2. Saving the min with each element lets pop restore it in O(1).',
  }),
  mcq({
    ...base, id: 'dsa.stacks-queues.q7', type: 'concept', difficulty: 'easy',
    stem: 'Which traversal naturally uses a queue?',
    options: [['Depth-first search', 'DFS uses a stack (or recursion).'], 'Breadth-first search', ['In-order traversal', 'That uses a stack.'], ['Backtracking', 'That uses recursion, an implicit stack.']],
    answer: 1,
    explanation: 'BFS processes nodes level by level in discovery order, which is FIFO.',
  }),
  mcq({
    ...base, id: 'dsa.stacks-queues.q8', type: 'edge-case', difficulty: 'medium',
    stem: 'In C++, what happens when you call `s.top()` on an empty `std::stack<int>`?',
    options: ['Undefined behaviour: there is no bounds check', ['It returns 0', 'No default is guaranteed.'], ['It throws std::out_of_range', 'std::stack::top does not throw.'], ['It does not compile', 'It compiles fine.']],
    answer: 0,
    explanation: 'top() calls back() on the underlying container, which is undefined for an empty container. Always check empty() first.',
  }),
];
