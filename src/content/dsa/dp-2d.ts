import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.dp-2d';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Dynamic Programming II (2-D)',
  summary: 'Grids, LCS, edit distance, knapsack and stock state machines.',
  level: 'core',
  status: 'complete',
  estMinutes: 110,
  prerequisites: ['dsa.dp-1d'],
  related: ['dsa.dp-1d', 'dsa.dp-advanced', 'dsa.matrix', 'dsa.recursion'],
  subtopics: ['Grid paths', 'Two-string DP (LCS, edit distance)', '0/1 knapsack and subset sum', 'Unbounded knapsack (coin change II)', 'State machines (stocks with cooldown/fee)', 'Rolling arrays for O(n) space', 'Reconstructing the answer'],
  objectives: [
    'Define a 2-D state precisely ("dp[i][j] = answer for the first i characters of A and the first j of B") and derive its transition.',
    'Solve grid path, LCS and edit distance with tables, then reduce space to one or two rows.',
    'Distinguish 0/1 knapsack (iterate capacity downwards) from unbounded knapsack (upwards), and counting combinations from permutations.',
    'Model buy/sell stock variants as a small state machine per day.',
    'Reconstruct an optimal solution by walking the table backwards.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Two indices describe the subproblem',
      bodyMd: `A problem needs 2-D DP when a subproblem is identified by **two** changing quantities. The recipe is the same as in 1-D:

1. **State:** say in words what \`dp[i][j]\` means. Most bugs come from a vague state.
2. **Transition:** how \`dp[i][j]\` is built from smaller states.
3. **Base cases:** usually row 0 and column 0 (empty prefix, zero capacity).
4. **Order:** fill so that every state you read is already computed.
5. **Answer:** which cell (often \`dp[m][n]\`) or the max over a row.

The four families you must know:

| Family | State | Transition |
|---|---|---|
| Grid paths | dp[r][c] = ways (or min cost) to reach (r, c) | from the cell above and the cell to the left |
| Two strings | dp[i][j] for prefixes A[0..i), B[0..j) | compare A[i−1] and B[j−1] |
| Knapsack | dp[i][w] = best using the first i items with capacity w | skip item i, or take it |
| State machine | dp[day][state] (holding, not holding, cooldown) | allowed moves between states |`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'The core transitions, worked out',
      bodyMd: `**Longest common subsequence.** dp[i][j] = LCS length of A[0..i) and B[0..j).
- If A[i−1] == B[j−1]: dp[i][j] = dp[i−1][j−1] + 1 (use both characters).
- Else: dp[i][j] = max(dp[i−1][j], dp[i][j−1]) (drop one of them).

**Edit distance** (insert, delete, replace, each cost 1). dp[i][j] = edits to turn A[0..i) into B[0..j).
- Base: dp[i][0] = i (delete everything), dp[0][j] = j (insert everything).
- If the last characters match: dp[i−1][j−1]. Otherwise 1 + min(dp[i−1][j] (delete), dp[i][j−1] (insert), dp[i−1][j−1] (replace)).

**0/1 knapsack / subset sum.** With a 1-D array over capacity, iterate **capacity downwards** so each item is used at most once: \`for w = W..wt: dp[w] = max(dp[w], dp[w − wt] + val)\`. Iterating upwards would let the same item be reused, which is the **unbounded** knapsack (Coin Change II).

**Combinations vs permutations** (counting ways to make an amount): items in the outer loop and amounts in the inner loop count **combinations** (1+2 and 2+1 are the same); amounts outer and items inner count **permutations** (Combination Sum IV).

**Stocks with cooldown:** three states per day, \`hold\`, \`sold\` (just sold, cooldown tomorrow) and \`rest\`. hold = max(hold, rest − price); sold = hold + price; rest = max(rest, sold). Each variant (fee, at most k transactions) changes only the state set.

**Space:** each row reads only the previous row (and sometimes the current one), so a 2-D table of O(mn) shrinks to O(n). Keep the full table if you need to reconstruct the answer.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: edit distance "horse" → "ros"',
      bodyMd: 'Rows are prefixes of "horse" (0..5), columns prefixes of "ros" (0..3). Each step shows one finished row of the table.',
      trace: [
        { note: 'Row 0 (empty prefix of "horse"): insert j characters → [0, 1, 2, 3].', array: [0, 1, 2, 3], vars: { row: '""' } },
        { note: 'Row "h": no matches → [1, 1, 2, 3] (replace h with r costs 1).', array: [1, 1, 2, 3], vars: { row: '"h"' } },
        { note: 'Row "ho": o matches the o of "ros" at j = 2: dp = dp[1][1] = 1 → [2, 2, 1, 2].', array: [2, 2, 1, 2], highlight: [2], vars: { row: '"ho"' } },
        { note: 'Row "hor": r matches at j = 1: dp[3][1] = dp[2][0] = 2 → [3, 2, 2, 2].', array: [3, 2, 2, 2], highlight: [1], vars: { row: '"hor"' } },
        { note: 'Row "hors": s matches at j = 3: dp[4][3] = dp[3][2] = 2 → [4, 3, 3, 2].', array: [4, 3, 3, 2], highlight: [3], vars: { row: '"hors"' } },
        { note: 'Row "horse": e matches nothing → [5, 4, 4, 3]. Answer dp[5][3] = 3 (replace h→r, delete r, delete e).', array: [5, 4, 4, 3], highlight: [3], vars: { answer: 3 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'LCS (full table), edit distance (one row), 0/1 subset sum and coin change II (1-D), and stocks with cooldown.',
      code: [
        cpp(`
int lcs(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
    for (int i = 1; i <= m; ++i)
        for (int j = 1; j <= n; ++j)
            dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] + 1 : max(dp[i - 1][j], dp[i][j - 1]);
    return dp[m][n];
}

int editDistance(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<int> prev(n + 1), cur(n + 1);
    for (int j = 0; j <= n; ++j) prev[j] = j;
    for (int i = 1; i <= m; ++i) {
        cur[0] = i;
        for (int j = 1; j <= n; ++j)
            cur[j] = a[i - 1] == b[j - 1] ? prev[j - 1] : 1 + min({prev[j], cur[j - 1], prev[j - 1]});
        swap(prev, cur);
    }
    return prev[n];
}

bool canPartition(const vector<int>& nums) {           // 0/1: capacity DOWNWARDS
    int sum = accumulate(nums.begin(), nums.end(), 0);
    if (sum % 2) return false;
    vector<bool> can(sum / 2 + 1, false);
    can[0] = true;
    for (int x : nums)
        for (int w = sum / 2; w >= x; --w) can[w] = can[w] || can[w - x];
    return can[sum / 2];
}

int change(int amount, const vector<int>& coins) {      // unbounded, combinations: coins outer, amount UP
    vector<long long> ways(amount + 1, 0);
    ways[0] = 1;
    for (int c : coins)
        for (int a = c; a <= amount; ++a) ways[a] += ways[a - c];
    return (int)ways[amount];
}

int maxProfitCooldown(const vector<int>& prices) {
    long long hold = LLONG_MIN / 2, sold = 0, rest = 0;
    for (int p : prices) {
        long long prevSold = sold;
        sold = hold + p;                                  // sell today
        hold = max(hold, rest - p);                       // keep holding, or buy after a rest day
        rest = max(rest, prevSold);                       // cooldown ends
    }
    return (int)max(sold, rest);
}`, 'C++'),
        java(`
int lcs(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[m][n];
}

int editDistance(String a, String b) {
    int m = a.length(), n = b.length();
    int[] prev = new int[n + 1], cur = new int[n + 1];
    for (int j = 0; j <= n; j++) prev[j] = j;
    for (int i = 1; i <= m; i++) {
        cur[0] = i;
        for (int j = 1; j <= n; j++)
            cur[j] = a.charAt(i - 1) == b.charAt(j - 1) ? prev[j - 1] : 1 + Math.min(prev[j], Math.min(cur[j - 1], prev[j - 1]));
        int[] t = prev; prev = cur; cur = t;
    }
    return prev[n];
}

boolean canPartition(int[] nums) {
    int sum = 0;
    for (int x : nums) sum += x;
    if (sum % 2 != 0) return false;
    boolean[] can = new boolean[sum / 2 + 1];
    can[0] = true;
    for (int x : nums)
        for (int w = sum / 2; w >= x; w--) can[w] = can[w] || can[w - x];
    return can[sum / 2];
}

int change(int amount, int[] coins) {
    long[] ways = new long[amount + 1];
    ways[0] = 1;
    for (int c : coins)
        for (int a = c; a <= amount; a++) ways[a] += ways[a - c];
    return (int) ways[amount];
}

int maxProfitCooldown(int[] prices) {
    long hold = Long.MIN_VALUE / 2, sold = 0, rest = 0;
    for (int p : prices) {
        long prevSold = sold;
        sold = hold + p;
        hold = Math.max(hold, rest - p);
        rest = Math.max(rest, prevSold);
    }
    return (int) Math.max(sold, rest);
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Time = number of states × work per transition. LCS and edit distance: O(mn); grid paths: O(RC); knapsack: O(n · W); stock state machines: O(n · states).
- Space: O(mn) for the full table, O(min(m, n)) with rolling rows (swap the arguments so the shorter string indexes the columns).
- Knapsack is **pseudo-polynomial**: O(n · W) depends on the numeric value W, not its number of digits. With W up to 10⁹ it is infeasible; look for other structure (meet in the middle, greedy for special cases).
- Top-down memoisation has the same complexity but adds recursion overhead and O(depth) stack.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Off-by-one between prefix length and index:** dp has size (m + 1) × (n + 1), and character i of the prefix is a[i − 1].
2. **Wrong loop direction in 1-D knapsack:** upwards reuses items (unbounded); downwards gives 0/1.
3. **Swapping the loops in coin change II**, which counts permutations instead of combinations.
4. **Rolling arrays that overwrite a value still needed:** edit distance needs prev[j − 1] (the diagonal); with a single array, save it in a temporary before overwriting.
5. **Initialising min-cost tables with 0** instead of infinity (or using INT_MAX and then adding to it, which overflows).
6. **Dropping the full table and then being asked for the actual subsequence.** Keep it, or store choices.
7. **State too small:** stock problems with a cooldown or a transaction limit need an extra state dimension; trying to squeeze them into one number fails on tricky inputs.`,
    },
  ],
  recognition: {
    signals: ['Two strings or two sequences compared position by position', 'Grid with moves only right/down (or similar DAG moves)', 'Choose items under a capacity or reach an exact sum', 'Per-day decisions with a small number of modes (holding, cooldown, transactions left)', '"Minimum operations to transform A into B"'],
    antiSignals: ['Only one index changes: 1-D DP', 'Moves in all four directions with weights: shortest paths, not DP', 'Contiguous subarray optimum: Kadane or sliding window'],
    decisionQuestions: ['What two quantities identify a subproblem?', 'What is dp of the empty prefix or zero capacity?', 'Can each item be used once or many times?', 'Do I need the value only, or the actual solution?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Derive the edit distance recurrence.', answerMd: 'dp[i][j] = minimum edits to turn A[0..i) into B[0..j). Base: dp[i][0] = i, dp[0][j] = j. If A[i−1] == B[j−1], no edit is needed for the last characters: dp[i−1][j−1]. Otherwise the last operation is a delete (dp[i−1][j]), an insert (dp[i][j−1]) or a replace (dp[i−1][j−1]), each plus 1. O(mn) time, O(n) space with two rows.' },
    { id: 'iq2', q: 'How do you print the LCS itself, not just its length?', answerMd: 'Keep the full table. Start at (m, n): if the characters match, they are part of the LCS; move diagonally. Otherwise move towards the larger of dp[i−1][j] and dp[i][j−1]. Collect characters and reverse them. O(m + n) after filling the table.' },
    { id: 'iq3', q: 'Why does 0/1 knapsack iterate capacity downwards in the 1-D version?', answerMd: 'dp[w] must be computed from dp[w − wt] of the previous item\'s row. Going downwards, dp[w − wt] has not been updated for the current item yet, so it still holds the old value. Going upwards, it may already include the current item, letting it be taken again, which is the unbounded variant.' },
    { id: 'iq4', q: 'Coin Change II counts combinations. Why do coins go in the outer loop?', answerMd: 'With coins outer, each coin is introduced once, and amounts are built from coins in a fixed order, so each multiset of coins is counted exactly once. With amounts outer, every ordering of the same coins is counted separately (permutations), which answers Combination Sum IV instead.' },
    { id: 'iq5', q: 'Explain the stock problem with cooldown as a state machine.', answerMd: 'Each day you are in one of three states: holding a share, just sold (must cool down tomorrow), or resting (free to buy). hold = max(hold, rest − price); sold = hold + price; rest = max(rest, previous sold). The answer is max(sold, rest) on the last day. O(n) time, O(1) space.' },
    { id: 'iq6', q: 'Is knapsack polynomial?', answerMd: 'No. O(n·W) is pseudo-polynomial: polynomial in the value W but exponential in the number of bits needed to write W. 0/1 knapsack is NP-hard; the DP is practical only when W is small (say ≤ 10⁵–10⁶).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- State in words first; dp sizes (m+1)×(n+1) for prefixes.
- LCS: match → diag + 1; else max(up, left).
- Edit distance: base i / j; match → diag; else 1 + min(up, left, diag).
- 0/1 knapsack: capacity downwards; unbounded: upwards.
- Combinations: items outer; permutations: amount outer.
- Stocks: small state machine per day.
- Rolling rows for O(n) space; keep the table to reconstruct.`,
    flashcards: [
      { id: 'f1', front: 'LCS transition when characters differ?', backMd: 'max(dp[i−1][j], dp[i][j−1]).' },
      { id: 'f2', front: 'Edit distance base cases?', backMd: 'dp[i][0] = i (delete all), dp[0][j] = j (insert all).' },
      { id: 'f3', front: '1-D 0/1 knapsack loop direction?', backMd: 'Capacity from W down to the item weight.' },
      { id: 'f4', front: 'Coin Change II loop order?', backMd: 'Coins outer, amounts inner (upwards): counts combinations.' },
      { id: 'f5', front: 'Why is knapsack only pseudo-polynomial?', backMd: 'O(n·W) depends on the numeric value of W, which is exponential in its bit length.' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 15, passPct: 80, minIndependentSolves: 4, minMediumIndependent: 3, retentionDays: 7 },
  resources: [
    { title: 'Longest common subsequence (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Longest_common_subsequence', kind: 'article' },
    { title: 'Levenshtein distance (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Levenshtein_distance', kind: 'article' },
    { title: 'Knapsack problem (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Knapsack_problem', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.dp2d.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int R = 3, C = 4;
    vector<vector<int>> dp(R, vector<int>(C, 1));
    for (int r = 1; r < R; ++r)
        for (int c = 1; c < C; ++c)
            dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
    cout << dp[R - 1][C - 1] << endl;
    return 0;
}`, 'C++', '10'),
    options: ['10', ['12', 'That is R × C.'], ['6', 'That is the answer for a 3 × 3 grid.'], ['20', 'That is a 4 × 4 grid.']],
    answer: 0,
    explanation: 'Paths moving only right or down in a 3 × 4 grid: C(5, 2) = 10. The table rows are [1,1,1,1], [1,2,3,4], [1,3,6,10].',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.dp2d.q2', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    static int lcs(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 1; i <= a.length(); i++)
            for (int j = 1; j <= b.length(); j++)
                dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
        return dp[a.length()][b.length()];
    }
    public static void main(String[] args) {
        System.out.println(lcs("abcde", "ace") + " " + lcs("abc", "def") + " " + lcs("AGGTAB", "GXTXAYB"));
    }
}`, 'Java', '3 0 4'),
    options: ['3 0 4', ['3 0 3', '"GTAB" has length 4.'], ['2 0 4', '"ace" is a subsequence of "abcde".'], ['3 1 4', 'No characters are shared by "abc" and "def".']],
    answer: 0,
    explanation: 'LCS("abcde", "ace") = "ace"; no common characters in the second pair; LCS("AGGTAB", "GXTXAYB") = "GTAB".',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.dp2d.q3', type: 'concept', difficulty: 'medium',
    stem: 'In the 1-D knapsack loop `for (w = W; w >= wt; --w) dp[w] = max(dp[w], dp[w - wt] + val)`, what happens if you loop w upwards instead?',
    options: ['Each item can be taken many times (unbounded knapsack)', ['Nothing changes', 'dp[w − wt] would already include the current item.'], ['The answer becomes 0', 'Values still increase.'], ['It becomes O(W²)', 'The complexity stays O(n·W).']],
    answer: 0,
    explanation: 'Upwards, dp[w − wt] may have been updated with the same item during this pass, so the item is reused. That is exactly the unbounded recurrence.',
  }),
  mcq({
    ...base, id: 'dsa.dp2d.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
using namespace std;
long long ways(int amount, const vector<int>& coins, bool coinsOuter) {
    vector<long long> dp(amount + 1, 0);
    dp[0] = 1;
    if (coinsOuter) {
        for (int c : coins) for (int a = c; a <= amount; ++a) dp[a] += dp[a - c];
    } else {
        for (int a = 1; a <= amount; ++a) for (int c : coins) if (c <= a) dp[a] += dp[a - c];
    }
    return dp[amount];
}
int main() {
    cout << ways(4, {1, 2, 3}, true) << " " << ways(4, {1, 2, 3}, false) << endl;
    return 0;
}`, 'C++', '4 7'),
    options: ['4 7', ['7 4', 'Coins outer counts combinations, which is the smaller number.'], ['4 4', 'Amount-outer counts each ordering separately.'], ['7 7', 'The two loop orders answer different questions.']],
    answer: 0,
    explanation: 'Combinations of 4 from {1,2,3}: 1111, 112, 22, 13 → 4. Ordered sequences: 1111, 112, 121, 211, 22, 13, 31 → 7.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.dp2d.q5', type: 'complexity', difficulty: 'easy',
    stem: 'Edit distance between strings of lengths m and n with the standard DP: time and the best space?',
    options: ['O(mn) time, O(min(m, n)) space', ['O(m + n) time, O(1) space', 'Every pair of prefixes is a state.'], ['O(mn) time, O(mn) space at best', 'Two rows are enough for the value.'], ['O(2^(m+n)) time', 'That is the plain recursion without memoisation.']],
    answer: 0,
    explanation: 'mn states, O(1) each. Each row needs only the previous row; use the shorter string for the columns.',
  }),
  mcq({
    ...base, id: 'dsa.dp2d.q6', type: 'debug', difficulty: 'medium',
    stem: 'A one-array edit distance updates `dp[j]` in place: `dp[j] = (a[i-1]==b[j-1]) ? dp[j-1] : 1 + min(dp[j], dp[j-1], dp[j-1])`. What is wrong?',
    options: ['dp[j−1] is already the current row; the diagonal (previous row, j−1) was overwritten and must be saved first', ['The base case should be dp[j] = 0', 'Row 0 is dp[j] = j.'], ['min should be max', 'Edit distance minimises.'], ['Nothing; this is the standard optimisation', 'The diagonal value is lost.']],
    answer: 0,
    explanation: 'Keep `prevDiag` = the old dp[j − 1] before overwriting it: the match case and the replace case both need it. Also dp[0] must be set to i at the start of each row.',
  }),
  mcq({
    ...base, id: 'dsa.dp2d.q7', type: 'pattern', difficulty: 'medium',
    stem: 'Can an array be split into two subsets with equal sums? Which DP is it?',
    options: ['0/1 subset sum to total/2', ['Unbounded knapsack', 'Each element is used at most once.'], ['LCS', 'There is only one sequence.'], ['Kadane', 'Subsets need not be contiguous.']],
    answer: 0,
    explanation: 'If the total is odd, answer false. Otherwise check whether some subset reaches total/2 with a boolean 0/1 knapsack (capacity downwards). O(n · total).',
  }),
  mcq({
    ...base, id: 'dsa.dp2d.q8', type: 'concept', difficulty: 'hard',
    stem: 'For "best time to buy and sell with cooldown", what does the `sold` state represent on day i?',
    options: ['The best profit if you sold on day i, so you cannot buy on day i + 1', ['The best profit if you hold a share on day i', 'That is the hold state.'], ['The total of all sales so far', 'States store the best profit, not sums of sales.'], ['The best profit if you have never traded', 'That is the initial rest state.']],
    answer: 0,
    explanation: 'Separating "just sold" from "resting" encodes the cooldown: buying is only allowed from rest, and rest(i) = max(rest(i−1), sold(i−1)).',
  }),
];
