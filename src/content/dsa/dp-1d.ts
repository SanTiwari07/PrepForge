import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.dp-1d';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Dynamic Programming I (1-D)',
  summary: 'State, transition and base case; memoisation to tabulation to O(1) space.',
  level: 'core',
  status: 'complete',
  estMinutes: 120,
  prerequisites: ['dsa.recursion'],
  related: ['dsa.dp-2d', 'dsa.greedy', 'dsa.backtracking', 'dsa.kadane'],
  subtopics: ['Recognising overlapping subproblems', 'Defining the state', 'Transitions and base cases', 'Memoisation (top-down)', 'Tabulation (bottom-up)', 'Space optimisation', 'Classic 1-D families: stairs, robber, coin change, word break, LIS'],
  objectives: [
    'Recognise when a problem has optimal substructure and overlapping subproblems.',
    'Write the DP in four steps: state definition, transition, base case, answer location.',
    'Convert a brute-force recursion into memoisation, then into tabulation, then into O(1) space.',
    'Solve the classic 1-D families (climbing stairs, house robber, coin change, word break, LIS).',
    'Explain why greedy fails on problems such as coin change with arbitrary denominations.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'DP is recursion plus remembering',
      bodyMd: `Dynamic programming applies when:
1. **Optimal substructure:** the best answer for a problem is built from best answers to smaller versions of it.
2. **Overlapping subproblems:** the brute-force recursion solves the same smaller problem many times.

The fix is to compute each subproblem **once** and store it. Two styles:
- **Memoisation (top-down):** write the natural recursion and cache results by state.
- **Tabulation (bottom-up):** fill a table in an order where dependencies are already computed.

**The four-step recipe** works for every DP. Write it down before coding:
1. **State:** \`dp[i]\` = *exactly what?* (for example "max money robbing houses 0..i").
2. **Transition:** how \`dp[i]\` comes from smaller states (for example \`max(dp[i−1], dp[i−2] + a[i])\`).
3. **Base cases:** the smallest states you can answer directly.
4. **Answer:** which state (\`dp[n−1]\`, \`max(dp)\`…) holds the final answer.

Complexity = (number of states) × (work per transition).`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Recognising DP in an unfamiliar question',
      bodyMd: `Strong signals:
- **"Count the number of ways"** to do something.
- **"Minimum / maximum"** cost, profit or length, where each step involves a **choice** (take it or skip it, jump 1 or 2, which coin).
- **"Is it possible"** to reach a target or segment a string.
- Constraints like n ≤ 10³–10⁵ with an obvious exponential brute force.

**Greedy vs DP:** if a locally best choice can be proven safe (an exchange argument), greedy works. If you can build a small counter-example where the greedy choice loses, you need DP. Coin change with coins {1, 3, 4} and amount 6: greedy takes 4 + 1 + 1 (three coins), but 3 + 3 (two coins) is better.

**How to find the state:** ask "after processing the first i items (or reaching position i), what is the *minimum information* I need to decide the rest?" That information is the state.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: house robber',
      bodyMd: 'a = [2, 7, 9, 3, 1]; adjacent houses cannot both be robbed. dp[i] = max(dp[i−1], dp[i−2] + a[i]).',
      trace: [
        { note: 'dp[0] = 2 (rob house 0).', array: [2, 7, 9, 3, 1], pointers: { i: 0 }, vars: { dp: '[2]' } },
        { note: 'dp[1] = max(2, 7) = 7.', array: [2, 7, 9, 3, 1], pointers: { i: 1 }, vars: { dp: '[2, 7]' } },
        { note: 'dp[2] = max(dp[1] = 7, dp[0] + 9 = 11) = 11.', array: [2, 7, 9, 3, 1], pointers: { i: 2 }, vars: { dp: '[2, 7, 11]' } },
        { note: 'dp[3] = max(11, 7 + 3 = 10) = 11.', array: [2, 7, 9, 3, 1], pointers: { i: 3 }, vars: { dp: '[2, 7, 11, 11]' } },
        { note: 'dp[4] = max(11, 11 + 1 = 12) = 12. Answer 12 (houses 0, 2, 4). Only two previous values are needed, so O(1) space.', array: [2, 7, 9, 3, 1], pointers: { i: 4 }, highlight: [0, 2, 4], vars: { dp: '[2, 7, 11, 11, 12]' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'House robber in O(1) space, coin change (minimum coins), and LIS in O(n log n).',
      code: [
        cpp(`
int rob(const vector<int>& a) {
    int prev2 = 0, prev1 = 0;                    // dp[i-2], dp[i-1]
    for (int x : a) {
        int cur = max(prev1, prev2 + x);
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}

// Minimum coins to make amount, or -1. dp[v] = min over coins c of dp[v - c] + 1.
int coinChange(const vector<int>& coins, int amount) {
    const int INF = INT_MAX / 2;
    vector<int> dp(amount + 1, INF);
    dp[0] = 0;
    for (int v = 1; v <= amount; ++v)
        for (int c : coins)
            if (c <= v) dp[v] = min(dp[v], dp[v - c] + 1);
    return dp[amount] >= INF ? -1 : dp[amount];
}

// Length of the longest strictly increasing subsequence in O(n log n).
// tails[k] = smallest possible tail of an increasing subsequence of length k+1.
int lengthOfLIS(const vector<int>& a) {
    vector<int> tails;
    for (int x : a) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return tails.size();
}`, 'C++'),
        java(`
int rob(int[] a) {
    int prev2 = 0, prev1 = 0;
    for (int x : a) {
        int cur = Math.max(prev1, prev2 + x);
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}

int coinChange(int[] coins, int amount) {
    int INF = Integer.MAX_VALUE / 2;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, INF);
    dp[0] = 0;
    for (int v = 1; v <= amount; v++)
        for (int c : coins)
            if (c <= v) dp[v] = Math.min(dp[v], dp[v - c] + 1);
    return dp[amount] >= INF ? -1 : dp[amount];
}

int lengthOfLIS(int[] a) {
    int[] tails = new int[a.length];
    int size = 0;
    for (int x : a) {
        int lo = 0, hi = size;                   // first index with tails[i] >= x
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (tails[mid] >= x) hi = mid; else lo = mid + 1;
        }
        tails[lo] = x;
        if (lo == size) size++;
    }
    return size;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- **States × transition cost.** House robber: n states × O(1) = **O(n)**, O(1) space after optimisation.
- Coin change: (amount + 1) states × k coins = **O(amount · k)** time, O(amount) space.
- Word break with a dictionary set: n states × up to n split points × substring hashing ≈ O(n²·L) in practice; cap the split length at the longest word length.
- LIS: O(n²) with the classic DP, **O(n log n)** with patience sorting (\`tails\` + binary search).
- The un-memoised recursion for Fibonacci-style problems is O(2ⁿ); memoisation makes it O(n).`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **A vague state.** "dp[i] = answer for i" is not enough; say exactly what is included (up to i? ending at i? using i?).
2. **Wrong base cases** (for example \`dp[0]\` for "ways to make amount 0" is 1, not 0).
3. **Wrong iteration order** in tabulation: a state must be computed after everything it depends on.
4. **INF overflow:** \`INT_MAX + 1\` overflows; use \`INT_MAX / 2\` or check before adding.
5. **Counting combinations vs permutations** in coin-change-ways: loop coins *outside* amounts for combinations; amounts outside coins counts orderings.
6. **Assuming greedy works** without proof.
7. **Memoisation key missing a parameter**, so different states share a cache entry.
8. **Reading LIS from \`tails\`:** \`tails\` gives the correct *length*, but it is not itself a valid subsequence.`,
    },
  ],
  recognition: {
    signals: ['Count the ways', 'Min/max with a choice at each step', 'Is it possible to reach or form a target', 'An exponential brute force with repeated subproblems', 'n up to 10³–10⁵ and a sequence/string input'],
    antiSignals: ['A provably safe local choice: greedy', 'Need all solutions explicitly listed: backtracking', 'A shortest path in a graph with unit edges: BFS'],
    decisionQuestions: ['What choice do I make at each step?', 'After the first i elements, what minimal information determines the rest (the state)?', 'What are the base cases, and where is the final answer?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Memoisation vs tabulation: trade-offs?', answerMd: 'Memoisation is the natural recursion plus a cache: it only computes reachable states, but uses the call stack (risking overflow) and has some overhead. Tabulation fills a table iteratively: no recursion limits, easier to space-optimise, but you must choose a valid order and may compute unneeded states.' },
    { id: 'iq2', q: 'Why does greedy fail for coin change, and what do you use instead?', answerMd: 'With coins {1, 3, 4} and amount 6, greedy takes 4 + 1 + 1 (three coins), but 3 + 3 uses two. Use DP: dp[v] = min over coins of dp[v − c] + 1, which is O(amount · k).' },
    { id: 'iq3', q: 'Explain the O(n log n) LIS algorithm.', answerMd: 'Maintain tails[k] = the smallest tail value of an increasing subsequence of length k + 1. For each x, binary-search the first tail ≥ x and replace it (or append if x is larger than all). tails stays sorted; its size is the LIS length.' },
    { id: 'iq4', q: 'How do you reduce DP space?', answerMd: 'If dp[i] depends only on a fixed number of previous states (dp[i−1], dp[i−2]), keep just those variables. For 2-D tables that depend on the previous row, keep one or two rows.' },
    { id: 'iq5', q: 'How do you approach a DP problem you have never seen?', answerMd: 'Write the brute-force recursion with the choices explicit. Identify its parameters (that is the state) and check whether the same arguments repeat. Add memoisation, then convert to tabulation if needed. State the complexity as states × transitions.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Recipe: **state, transition, base, answer**; write it before coding.
- Complexity = #states × cost per transition.
- Robber: dp[i] = max(dp[i−1], dp[i−2] + a[i]); two variables.
- Coin change (min): dp[v] = min(dp[v − c] + 1); dp[0] = 0; INF = INT_MAX / 2.
- Coin change (ways, combinations): loop coins outside amounts.
- LIS: tails + lower_bound gives O(n log n).
- Greedy only with a proof; otherwise try a small counter-example.`,
    flashcards: [
      { id: 'f1', front: 'The 4 steps of any DP?', backMd: 'Define the state; write the transition; set the base cases; locate the answer.' },
      { id: 'f2', front: 'House robber transition?', backMd: 'dp[i] = max(dp[i−1], dp[i−2] + a[i])' },
      { id: 'f3', front: 'Coin change: combinations vs permutations loop order?', backMd: 'Combinations: for coin, for amount. Permutations: for amount, for coin.' },
      { id: 'f4', front: 'LIS in O(n log n)?', backMd: 'tails array + lower_bound (strict increase); replace or append.' },
      { id: 'f5', front: 'Counter-example to greedy coin change?', backMd: 'Coins {1, 3, 4}, amount 6: greedy 4+1+1 (3 coins) vs optimal 3+3 (2 coins).' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 14, passPct: 80, minIndependentSolves: 5, minMediumIndependent: 3, retentionDays: 7 },
  resources: [
    { title: 'Introduction to Dynamic Programming (cp-algorithms)', url: 'https://cp-algorithms.com/dynamic_programming/intro-to-dp.html', kind: 'article' },
    { title: 'Longest increasing subsequence (cp-algorithms)', url: 'https://cp-algorithms.com/sequences/longest_increasing_subsequence.html', kind: 'article' },
    { title: 'NeetCode practice: 1-D Dynamic Programming', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.dp-1d.q1', type: 'concept', difficulty: 'easy',
    stem: 'Which two properties make a problem suitable for dynamic programming?',
    options: ['Optimal substructure and overlapping subproblems', ['Sorted input and a monotonic predicate', 'Those suggest binary search.'], ['A greedy choice property and a matroid structure', 'Those justify greedy algorithms.'], ['A DAG and topological order', 'DP states form a DAG, but this is not the defining criterion.']],
    answer: 0,
    explanation: 'Optimal substructure lets you build answers from sub-answers; overlapping subproblems make caching worthwhile.',
  }),
  mcq({
    ...base, id: 'dsa.dp-1d.q2', type: 'pattern', difficulty: 'medium',
    stem: 'Coins {1, 3, 4}, amount 6. A greedy algorithm (always take the largest coin that fits) returns 3 coins. What is the true minimum, and what technique finds it reliably?',
    options: ['2 coins (3 + 3), with DP over amounts', ['3 coins, and greedy is optimal', '3 + 3 uses only two coins.'], ['1 coin, with BFS', 'No single coin equals 6.'], ['2 coins, with binary search', 'There is no monotonic predicate to search on here.']],
    answer: 0,
    explanation: 'dp[v] = min over c of dp[v − c] + 1 gives dp[6] = dp[3] + 1 = 2. Greedy fails for arbitrary coin systems.',
  }),
  mcq({
    ...base, id: 'dsa.dp-1d.q3', type: 'complexity', difficulty: 'medium',
    stem: 'What is the time complexity of the naive recursive Fibonacci `f(n) = f(n−1) + f(n−2)` **without** memoisation, and with it?',
    options: ['O(2ⁿ) without (more precisely about φⁿ); O(n) with', ['O(n²) without; O(n) with', 'The call tree branches twice per level.'], ['O(n) both ways', 'Without caching, subproblems are recomputed exponentially many times.'], ['O(n log n) without; O(log n) with', 'Memoisation still computes n states.']],
    answer: 0,
    explanation: 'The call tree grows like the Fibonacci numbers themselves (about 1.618ⁿ). Caching computes each of the n states once.',
  }),
  mcq({
    ...base, id: 'dsa.dp-1d.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n = 5;
    vector<long long> ways(n + 1, 0);
    ways[0] = 1;
    for (int i = 1; i <= n; ++i) {
        ways[i] += ways[i - 1];
        if (i >= 2) ways[i] += ways[i - 2];
    }
    cout << ways[n] << endl;
    return 0;
}`, 'C++', '8'),
    options: [['5', 'That is ways[4]; the loop runs one more step to i = 5.'], '8', ['13', 'That would be n = 6.'], ['32', 'That is 2⁵, counting all subsets.']],
    answer: 1,
    explanation: 'This counts the ways to climb 5 stairs taking 1 or 2 steps: ways = 1, 1, 2, 3, 5, 8.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.dp-1d.q5', type: 'concept', difficulty: 'hard',
    stem: 'Counting the ways to make amount 3 with coins {1, 2}: one loop order gives 2 (combinations {1,1,1}, {1,2}) and the other gives 3. Which loop order counts **combinations**?',
    options: ['Outer loop over coins, inner loop over amounts', ['Outer loop over amounts, inner loop over coins', 'That counts ordered sequences (1+2 and 2+1 separately).'], ['Either order gives the same result', 'They differ by whether order matters.'], ['Neither; combinations need a 2-D table', 'A 1-D table suffices with the right order.']],
    answer: 0,
    explanation: 'Processing coins one at a time means each combination is built in a fixed coin order, so it is counted once. Looping amounts outside lets every coin be last at each step, counting permutations.',
  }),
  mcq({
    ...base, id: 'dsa.dp-1d.q6', type: 'debug', difficulty: 'medium',
    stem: 'A min-coins DP initialises `dp` with `INT_MAX` and computes `dp[v] = min(dp[v], dp[v − c] + 1)`. Unreachable amounts produce strange negative answers. Why?',
    options: ['INT_MAX + 1 overflows to a negative number, which then wins the min', ['dp[0] should be INT_MAX', 'dp[0] must be 0.'], ['The coin loop is in the wrong order', 'Order does not cause negatives here.'], ['Vectors cannot hold INT_MAX', 'They can.']],
    answer: 0,
    explanation: 'Use a safe INF such as INT_MAX / 2 (or skip unreachable predecessors), then map INF back to −1.',
  }),
  mcq({
    ...base, id: 'dsa.dp-1d.q7', type: 'pattern', difficulty: 'medium',
    stem: 'Can string s be segmented into words from a dictionary (words reusable)? What is the natural DP state?',
    options: ['dp[i] = true if the prefix s[0..i) can be segmented', ['dp[i] = number of dictionary words containing s[i]', 'That ignores segmentation.'], ['dp[i] = length of the longest word ending at i', 'That cannot express full segmentation.'], ['Sort the dictionary and binary search', 'It cannot handle sequences of words.']],
    answer: 0,
    explanation: 'dp[0] = true; dp[i] = OR over j < i of dp[j] && s[j..i) is in the dictionary. Answer: dp[n].',
  }),
  mcq({
    ...base, id: 'dsa.dp-1d.q8', type: 'complexity', difficulty: 'medium',
    stem: 'What is the complexity of the `tails` + binary search LIS algorithm?',
    options: ['O(n log n)', ['O(n²)', 'That is the classic DP comparing all pairs.'], ['O(n)', 'Each element needs a binary search.'], ['O(2ⁿ)', 'That is brute-force subsequence enumeration.']],
    answer: 0,
    explanation: 'n elements, each with an O(log n) binary search on the sorted tails array.',
  }),
];
