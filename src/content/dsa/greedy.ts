import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.greedy';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Greedy Algorithms',
  summary: 'Locally optimal choices with an exchange argument; knowing when greedy fails.',
  level: 'core',
  status: 'complete',
  estMinutes: 85,
  prerequisites: ['dsa.sorting'],
  related: ['dsa.intervals', 'dsa.heaps', 'dsa.dp-1d', 'dsa.mst', 'dsa.shortest-paths'],
  subtopics: ['Greedy choice property', 'Exchange arguments', 'Sort then scan', 'Greedy with a heap', 'Reachability (jump game)', 'Two-pass greedy (candy)', 'When greedy fails: coin change'],
  objectives: [
    'Describe a greedy algorithm as "make the best local choice, never revisit it" and say what must be true for that to be optimal.',
    'Justify a greedy choice with an exchange argument, or break it with a small counterexample.',
    'Apply the main greedy shapes: sort-then-scan, farthest reach, two passes from both ends, and best-available-choice with a heap.',
    'Recognise problems where greedy fails (general coin change, 0/1 knapsack) and switch to DP.',
    'Write greedy solutions in O(n) or O(n log n) and state the invariant each step maintains.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'What makes a greedy algorithm correct',
      bodyMd: `A greedy algorithm builds the answer one decision at a time, always taking the choice that looks best right now, and never undoing it. It is correct only when two properties hold:

1. **Greedy-choice property:** some optimal solution starts with the greedy choice.
2. **Optimal substructure:** after making that choice, the rest of the problem is a smaller instance of the same problem.

**The exchange argument** is how you prove property 1. Take any optimal solution. If it does not begin with the greedy choice, swap its first choice for the greedy one and show the solution stays valid and is no worse. Example (activity selection): the interval with the earliest end can replace the first interval of any optimal schedule, because it ends no later, so everything after it still fits.

**The counterexample habit** is how you disprove a greedy idea quickly. Coins {1, 3, 4} and amount 6: "take the largest coin" gives 4 + 1 + 1 (3 coins), but 3 + 3 uses 2. So minimum coins needs DP unless the coin system is canonical (like 1, 2, 5, 10, …).`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Common greedy shapes',
      bodyMd: `| Shape | Example problems | Key idea |
|---|---|---|
| **Sort, then scan** | Assign Cookies, Non-overlapping Intervals, Minimum Arrows | sort so the most constrained item is handled first |
| **Farthest reach** | Jump Game, Jump Game II | track the farthest index reachable; a BFS by levels in disguise |
| **Running balance** | Gas Station, Best Time to Buy and Sell II | if a running sum drops below zero, no start in the failed stretch can work |
| **Two passes** | Candy, Trapping Rain Water (prefix/suffix max) | satisfy the left neighbour constraint, then the right one, take the max |
| **Best available with a heap** | IPO, Task Scheduler, Minimum Cost to Connect Sticks | always use the currently best option; a heap supplies it in O(log n) |
| **Partition by last occurrence** | Partition Labels | extend the current part to the last occurrence of every character in it |

**Jump Game II as BFS:** indices reachable with k jumps form a contiguous window. Scan it, compute the farthest index reachable with k + 1 jumps, and that becomes the next window. Each index is scanned once: O(n).

**Gas Station:** if the total gas is at least the total cost, a solution exists. Scan with a running tank; whenever it goes negative at i, no station between the current start and i can be the start (each would arrive at i with even less gas), so restart at i + 1.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: Jump Game II on [2, 3, 1, 1, 4]',
      bodyMd: '`end` is the last index reachable with the current number of jumps; `far` is the farthest reachable with one more jump.',
      trace: [
        { note: 'i = 0: far = max(0, 0 + 2) = 2. i == end (0): jump. jumps = 1, end = 2.', array: [2, 3, 1, 1, 4], pointers: { i: 0 }, window: [1, 2], vars: { jumps: 1, end: 2, far: 2 } },
        { note: 'i = 1: far = max(2, 1 + 3) = 4.', array: [2, 3, 1, 1, 4], pointers: { i: 1 }, window: [1, 2], vars: { jumps: 1, end: 2, far: 4 } },
        { note: 'i = 2: far = max(4, 3) = 4. i == end: jump. jumps = 2, end = 4.', array: [2, 3, 1, 1, 4], pointers: { i: 2 }, window: [3, 4], vars: { jumps: 2, end: 4, far: 4 } },
        { note: 'i = 3: far stays 4. The loop stops before the last index (it runs to n − 2). Answer: 2 jumps (0 → 1 → 4).', array: [2, 3, 1, 1, 4], pointers: { i: 3 }, window: [3, 4], vars: { jumps: 2, end: 4, far: 4 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Jump Game II, Gas Station, Candy (two passes) and Partition Labels.',
      code: [
        cpp(`
int jump(const vector<int>& a) {
    int jumps = 0, end = 0, far = 0;
    for (int i = 0; i + 1 < (int)a.size(); ++i) {   // never jump from the last index
        far = max(far, i + a[i]);
        if (i == end) { ++jumps; end = far; }
    }
    return jumps;
}

int canCompleteCircuit(const vector<int>& gas, const vector<int>& cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < (int)gas.size(); ++i) {
        int d = gas[i] - cost[i];
        total += d; tank += d;
        if (tank < 0) { start = i + 1; tank = 0; }   // no start in [start, i] works
    }
    return total >= 0 ? start : -1;
}

int candy(const vector<int>& r) {
    int n = r.size();
    vector<int> c(n, 1);
    for (int i = 1; i < n; ++i) if (r[i] > r[i - 1]) c[i] = c[i - 1] + 1;           // left rule
    for (int i = n - 2; i >= 0; --i) if (r[i] > r[i + 1]) c[i] = max(c[i], c[i + 1] + 1); // right rule
    return accumulate(c.begin(), c.end(), 0);
}

vector<int> partitionLabels(const string& s) {
    int last[26] = {0};
    for (int i = 0; i < (int)s.size(); ++i) last[s[i] - 'a'] = i;
    vector<int> sizes;
    int start = 0, end = 0;
    for (int i = 0; i < (int)s.size(); ++i) {
        end = max(end, last[s[i] - 'a']);
        if (i == end) { sizes.push_back(end - start + 1); start = i + 1; }
    }
    return sizes;
}`, 'C++'),
        java(`
int jump(int[] a) {
    int jumps = 0, end = 0, far = 0;
    for (int i = 0; i + 1 < a.length; i++) {
        far = Math.max(far, i + a[i]);
        if (i == end) { jumps++; end = far; }
    }
    return jumps;
}

int canCompleteCircuit(int[] gas, int[] cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < gas.length; i++) {
        int d = gas[i] - cost[i];
        total += d; tank += d;
        if (tank < 0) { start = i + 1; tank = 0; }
    }
    return total >= 0 ? start : -1;
}

int candy(int[] r) {
    int n = r.length;
    int[] c = new int[n];
    Arrays.fill(c, 1);
    for (int i = 1; i < n; i++) if (r[i] > r[i - 1]) c[i] = c[i - 1] + 1;
    for (int i = n - 2; i >= 0; i--) if (r[i] > r[i + 1]) c[i] = Math.max(c[i], c[i + 1] + 1);
    int sum = 0;
    for (int x : c) sum += x;
    return sum;
}

List<Integer> partitionLabels(String s) {
    int[] last = new int[26];
    for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
    List<Integer> sizes = new ArrayList<>();
    int start = 0, end = 0;
    for (int i = 0; i < s.length(); i++) {
        end = Math.max(end, last[s.charAt(i) - 'a']);
        if (i == end) { sizes.add(end - start + 1); start = i + 1; }
    }
    return sizes;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Single-scan greedies (Jump Game, Gas Station, Partition Labels, Stock II): **O(n) time, O(1) space** (Partition Labels uses a 26-entry table).
- Sort-then-scan greedies: **O(n log n)** for the sort.
- Two-pass greedies (Candy): O(n) time, O(n) space for the array (an O(1)-space slope-counting version exists but is rarely expected).
- Heap greedies (IPO, Task Scheduler, connecting sticks): O(n log n).
- The usual DP alternative is slower: Jump Game II via DP over all jumps is O(n²). Greedy wins when it is provably correct.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **No proof, no counterexample search.** Before coding, try two or three tiny inputs that might break the rule (the coin {1, 3, 4} trick).
2. **Sorting by the wrong key** (start instead of end for activity selection; ratio vs weight in knapsack variants).
3. **Using greedy for 0/1 knapsack.** Best value-per-weight works only for the *fractional* knapsack.
4. **Candy with one pass.** Satisfying the left neighbour can violate the right one; the second pass must take max(current, right + 1), not overwrite.
5. **Jump Game II iterating to the last index**, which can count one extra jump when \`end\` happens to equal the last index.
6. **Gas Station: restarting at i instead of i + 1.** Station i itself caused the deficit.
7. **Greedy on strings without considering the future,** for example removing digits to make the smallest number needs a monotonic stack, not "remove the largest digit".`,
    },
  ],
  recognition: {
    signals: ['"Minimum number of …" or "maximum number of …" with a natural order (by deadline, end time, size)', 'Each decision can be made by looking at the current best option', 'An exchange argument is easy to state', 'Constraints up to 10⁵–10⁶ that rule out O(n²) DP'],
    antiSignals: ['Choices interact in complex ways (0/1 knapsack, general coin change): DP', 'You can construct a small counterexample to the local rule', 'Need all solutions or the count of solutions: backtracking or DP'],
    decisionQuestions: ['What is the obvious local rule, and can I break it with a 3-element example?', 'Can I swap the first choice of an optimal solution for the greedy choice without making it worse?', 'Does sorting make the decision trivial at each step?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you know whether a greedy approach is correct?', answerMd: 'Show the greedy-choice property with an exchange argument (an optimal solution can be transformed to start with the greedy choice without getting worse) plus optimal substructure (the remainder is the same problem). In an interview, also test the rule on small adversarial inputs; one counterexample means switching to DP.' },
    { id: 'iq2', q: 'Why does greedy fail for coin change, and when does it work?', answerMd: 'With coins {1, 3, 4} and amount 6, largest-first gives 4 + 1 + 1 (3 coins) while 3 + 3 uses 2. Greedy is optimal for canonical coin systems such as {1, 2, 5, 10, 20, 50, 100}, but in general minimum coins needs DP: O(amount × coins).' },
    { id: 'iq3', q: 'Explain the Gas Station solution.', answerMd: 'If total gas < total cost, return −1. Otherwise scan with a running tank; when it drops below zero at i, every start between the current start and i also fails at or before i (they arrive with no more gas), so set start = i + 1 and reset the tank. The final start is the answer because a valid start must exist and all earlier ones are ruled out. O(n), O(1).' },
    { id: 'iq4', q: 'Jump Game II: why is the greedy O(n) and correct?', answerMd: 'It is BFS by levels: the indices reachable with exactly k jumps form a contiguous range [start, end]. Scanning that range gives the farthest index reachable with k + 1 jumps. Each index is scanned once. The answer is the number of levels needed to cover the last index.' },
    { id: 'iq5', q: 'Fractional vs 0/1 knapsack: which one is greedy?', answerMd: 'Fractional: sort by value/weight and take items greedily, splitting the last one; optimal. 0/1: items are indivisible, and the best-ratio item can block a better combination (capacity 10, items (w=6, v=7), (w=5, v=5), (w=5, v=5): greedy takes the first for 7, optimal takes the two others for 10). Use DP.' },
    { id: 'iq6', q: 'Task Scheduler: compute the minimum time with cooldown n.', answerMd: 'Let maxCount be the highest frequency and k the number of tasks with that frequency. The most frequent tasks form (maxCount − 1) blocks of length n + 1 plus a final block of k tasks: answer = max(len(tasks), (maxCount − 1)(n + 1) + k). A heap-based simulation gives the same result in O(N log 26).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Greedy = local best choice, never revisited; prove with an exchange argument or break it with a tiny counterexample.
- Shapes: sort-then-scan; farthest reach; running balance; two passes; best-available heap; last-occurrence partitions.
- Jump Game II: BFS levels via (end, far), loop to n − 2.
- Gas Station: total ≥ 0 means a start exists; restart at i + 1 on deficit.
- Candy: left pass, right pass with max.
- Fails on: general coin change, 0/1 knapsack → DP.`,
    flashcards: [
      { id: 'f1', front: 'What two properties make greedy optimal?', backMd: 'The greedy-choice property (an optimal solution can start with the greedy choice) and optimal substructure.' },
      { id: 'f2', front: 'Counterexample to largest-coin-first?', backMd: 'Coins {1, 3, 4}, amount 6: greedy 4+1+1 (3), optimal 3+3 (2).' },
      { id: 'f3', front: 'Gas Station: where do you restart after the tank goes negative at i?', backMd: 'At i + 1; no start in [start, i] can work.' },
      { id: 'f4', front: 'Why two passes in Candy?', backMd: 'One pass satisfies only the left-neighbour rule; the right pass fixes the other side using max.' },
      { id: 'f5', front: 'Which knapsack is solved greedily?', backMd: 'The fractional knapsack (by value/weight). 0/1 needs DP.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 12, passPct: 80, minIndependentSolves: 4, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Greedy algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Greedy_algorithm', kind: 'article' },
    { title: 'Activity selection problem (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Activity_selection_problem', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.greedy.q1', type: 'concept', difficulty: 'easy',
    stem: 'With coins {1, 3, 4}, what does "always take the largest coin that fits" use for amount 6, and what is optimal?',
    options: ['Greedy uses 3 coins; optimal is 2', ['Both use 2 coins', 'Greedy takes 4 first, then needs 1 + 1.'], ['Greedy uses 2 coins; optimal is 3', 'The reverse.'], ['Both use 3 coins', '3 + 3 = 6 uses 2.']],
    answer: 0,
    explanation: 'Greedy: 4 + 1 + 1. Optimal: 3 + 3. This is why minimum coin change is a DP problem for arbitrary coin sets.',
  }),
  mcq({
    ...base, id: 'dsa.greedy.q2', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int jump(const vector<int>& a) {
    int jumps = 0, end = 0, far = 0;
    for (int i = 0; i + 1 < (int)a.size(); ++i) {
        far = max(far, i + a[i]);
        if (i == end) { ++jumps; end = far; }
    }
    return jumps;
}
int main() {
    cout << jump({2, 3, 1, 1, 4}) << " " << jump({1, 1, 1, 1}) << " " << jump({5}) << endl;
    return 0;
}`, 'C++', '2 3 0'),
    options: ['2 3 0', ['2 4 1', 'From index 0 of [1,1,1,1] you need 3 jumps; a single element needs 0.'], ['1 3 0', 'Index 0 reaches at most index 2, not 4.'], ['2 3 1', 'The loop does not run for a single element.']],
    answer: 0,
    explanation: '[2,3,1,1,4]: 0 → 1 → 4. [1,1,1,1]: three single steps. [5]: already at the last index, 0 jumps.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.greedy.q3', type: 'pattern', difficulty: 'medium',
    stem: 'Which problem is NOT solvable by a simple greedy rule?',
    options: ['0/1 knapsack', ['Fractional knapsack', 'Greedy by value/weight is optimal.'], ['Activity selection', 'Earliest end time is optimal.'], ['Minimum platforms for trains', 'Sweep or sort, greedy.']],
    answer: 0,
    explanation: 'Indivisible items mean the best ratio can block a better combination; 0/1 knapsack needs DP (O(n·W)).',
  }),
  mcq({
    ...base, id: 'dsa.greedy.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    public static void main(String[] args) {
        int[] gas = {1, 2, 3, 4, 5};
        int[] cost = {3, 4, 5, 1, 2};
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            int d = gas[i] - cost[i];
            total += d; tank += d;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        System.out.println(total >= 0 ? start : -1);
    }
}`, 'Java', '3'),
    options: ['3', ['4', 'The deficits end at index 2, so the scan restarts at 3.'], ['0', 'Starting at 0 the tank goes negative immediately.'], ['-1', 'Total gas 15 equals total cost 15.']],
    answer: 0,
    explanation: 'Differences: −2, −2, −2, 3, 3. The tank goes negative at indices 0, 1 and 2, so start moves to 3. Total is 0, so the circuit is possible.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.greedy.q5', type: 'concept', difficulty: 'medium',
    stem: 'What does an exchange argument show?',
    options: ['That an optimal solution can be changed to include the greedy choice without becoming worse', ['That the greedy algorithm runs in O(n log n)', 'It is about correctness, not speed.'], ['That every greedy algorithm is optimal', 'Many are not.'], ['That DP and greedy always give the same answer', 'Not in general.']],
    answer: 0,
    explanation: 'Swap the optimal solution\'s first decision for the greedy one, check validity and value; repeat by induction on the remaining problem.',
  }),
  mcq({
    ...base, id: 'dsa.greedy.q6', type: 'debug', difficulty: 'medium',
    stem: 'A Candy solution does a left-to-right pass and then, right-to-left, sets `c[i] = c[i+1] + 1` when `r[i] > r[i+1]`. For ratings [1, 3, 4, 5, 2], what goes wrong?',
    options: ['Overwriting breaks the left rule: the child rated 5 gets 2 candies but needs at least 4', ['Nothing; it is correct', 'The overwrite can lower a value set by the left pass.'], ['The left pass is unnecessary', 'It handles increasing runs.'], ['It gives too many candies', 'It gives too few at the peak.']],
    answer: 0,
    explanation: 'Left pass: [1, 2, 3, 4, 1]. Right pass at index 3 (5 > 2): 2 instead of max(4, 2) = 4, so rating 5 gets fewer than rating 4 next to it. Use max(c[i], c[i+1] + 1).',
  }),
  mcq({
    ...base, id: 'dsa.greedy.q7', type: 'complexity', difficulty: 'easy',
    stem: 'Assign Cookies: sort children by greed and cookies by size, then match with two pointers. Overall time?',
    options: ['O(n log n + m log m)', ['O(n · m)', 'Two pointers make the matching linear.'], ['O(n + m)', 'The sorts dominate.'], ['O(2ⁿ)', 'No search over subsets.']],
    answer: 0,
    explanation: 'Sorting both lists dominates; the matching scan is O(n + m).',
  }),
  mcq({
    ...base, id: 'dsa.greedy.q8', type: 'pattern', difficulty: 'hard',
    stem: 'You have capital w and projects (capital needed, profit); you may finish at most k projects. Which strategy maximises final capital?',
    options: ['Sort by capital; repeatedly push all affordable projects into a max-heap by profit and take the top', ['Take the k most profitable projects', 'You may not afford them.'], ['Take the k cheapest projects', 'Cheap projects may have tiny profits.'], ['Try every subset of k projects', 'Exponential, and unnecessary.']],
    answer: 0,
    explanation: 'Capital only grows, so the set of affordable projects only grows; at each step the best choice is the most profitable affordable project. A pointer over the capital-sorted list plus a max-heap makes it O(n log n).',
  }),
];
