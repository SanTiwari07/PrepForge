import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.backtracking';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Backtracking',
  summary: 'Systematic search over choices with pruning: subsets, permutations, N-Queens.',
  level: 'core',
  status: 'complete',
  estMinutes: 100,
  prerequisites: ['dsa.recursion'],
  related: ['dsa.dp-1d', 'dsa.graphs', 'dsa.bit-manipulation'],
  subtopics: ['Choose / explore / un-choose', 'Subsets and combinations (start index)', 'Permutations (used array)', 'Handling duplicates', 'Pruning', 'Grid search (word search)', 'Constraint problems (N-Queens, Sudoku)'],
  objectives: [
    'Write the choose–explore–un-choose template and explain what the recursion tree looks like.',
    'Generate subsets, combinations and permutations, with and without duplicate inputs.',
    'Prune branches early (sorted input, remaining sum, constraint checks).',
    'Estimate the output-sensitive complexity (2ⁿ subsets, n! permutations) and check it against constraints.',
    'Decide between backtracking (enumerate all) and DP (count or optimise).',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Explore a decision tree, undo, try the next branch',
      bodyMd: `Backtracking builds a solution step by step. At each step it **chooses** an option, **explores** recursively, and then **un-chooses** (undoes) the option to try the next one. It is DFS over the tree of partial solutions.

\`\`\`text
backtrack(state):
    if state is a complete solution: record it; return
    for each choice available in state:
        if choice is invalid: continue          # prune
        apply choice
        backtrack(state)
        undo choice                            # restore for the next sibling
\`\`\`

Three variants cover most interview questions:
- **Subsets / combinations:** pass a \`start\` index so each element is only considered after earlier ones (no reordering, so no duplicates).
- **Permutations:** use a \`used[]\` array; every unused element can go next.
- **Grid search:** mark a cell as visited before recursing and unmark it afterwards.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Recognising backtracking',
      bodyMd: `- "Return **all** possible …" (subsets, combinations, permutations, partitions, valid parentheses, IP addresses).
- Constraint satisfaction: place queens, fill Sudoku, word search on a board.
- Small constraints: n ≤ 10–20. Output-size limits like n! or 2ⁿ are only feasible for small n, and that is the hint.

If the question only asks **how many** or for the **best** one, and subproblems repeat, DP is usually better: backtracking enumerates, DP counts or optimises.

**Duplicates in the input** (for example [1, 2, 2]): sort first, then skip a value if it equals the previous value **at the same depth** (\`i > start && a[i] == a[i−1]\`).`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: subsets of [1, 2, 3]',
      bodyMd: 'Every call records the current path, then extends it with elements at index ≥ start.',
      trace: [
        { note: 'start = 0, path []: record []. Choose 1.', stack: [], vars: { recorded: '[]' } },
        { note: 'path [1]: record. Choose 2, giving path [1, 2]: record. Choose 3, giving [1, 2, 3]: record. Undo 3, undo 2.', stack: [1, 2, 3], vars: { recorded: '[] [1] [1,2] [1,2,3]' } },
        { note: 'Back at [1]: choose 3, giving [1, 3]: record. Undo, undo 1.', stack: [1, 3], vars: { recorded: '… [1,3]' } },
        { note: 'Back at []: choose 2, giving [2], [2, 3]; then choose 3, giving [3]. Total 2³ = 8 subsets.', stack: [2, 3], vars: { recorded: '… [2] [2,3] [3]' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Subsets with duplicates, permutations, and combination sum with pruning.',
      code: [
        cpp(`
// All unique subsets when the input may contain duplicates.
void subsetsDup(vector<int>& a, int start, vector<int>& path, vector<vector<int>>& out) {
    out.push_back(path);
    for (int i = start; i < (int)a.size(); ++i) {
        if (i > start && a[i] == a[i - 1]) continue;     // skip duplicates at the same depth
        path.push_back(a[i]);
        subsetsDup(a, i + 1, path, out);
        path.pop_back();                                 // undo
    }
}
vector<vector<int>> subsetsWithDup(vector<int> a) {
    sort(a.begin(), a.end());
    vector<vector<int>> out; vector<int> path;
    subsetsDup(a, 0, path, out);
    return out;
}

void permute(const vector<int>& a, vector<bool>& used, vector<int>& path, vector<vector<int>>& out) {
    if (path.size() == a.size()) { out.push_back(path); return; }
    for (int i = 0; i < (int)a.size(); ++i) {
        if (used[i]) continue;
        used[i] = true; path.push_back(a[i]);
        permute(a, used, path, out);
        path.pop_back(); used[i] = false;
    }
}

// Combinations (reuse allowed) summing to target; candidates sorted for pruning.
void combo(const vector<int>& c, int start, int remain, vector<int>& path, vector<vector<int>>& out) {
    if (remain == 0) { out.push_back(path); return; }
    for (int i = start; i < (int)c.size(); ++i) {
        if (c[i] > remain) break;                        // sorted, so no later candidate fits
        path.push_back(c[i]);
        combo(c, i, remain - c[i], path, out);           // i, not i + 1: reuse allowed
        path.pop_back();
    }
}`, 'C++'),
        java(`
List<List<Integer>> subsetsWithDup(int[] a) {
    Arrays.sort(a);
    List<List<Integer>> out = new ArrayList<>();
    dfsSubsets(a, 0, new ArrayList<>(), out);
    return out;
}
void dfsSubsets(int[] a, int start, List<Integer> path, List<List<Integer>> out) {
    out.add(new ArrayList<>(path));                      // copy! path keeps changing
    for (int i = start; i < a.length; i++) {
        if (i > start && a[i] == a[i - 1]) continue;
        path.add(a[i]);
        dfsSubsets(a, i + 1, path, out);
        path.remove(path.size() - 1);
    }
}

void permute(int[] a, boolean[] used, List<Integer> path, List<List<Integer>> out) {
    if (path.size() == a.length) { out.add(new ArrayList<>(path)); return; }
    for (int i = 0; i < a.length; i++) {
        if (used[i]) continue;
        used[i] = true; path.add(a[i]);
        permute(a, used, path, out);
        path.remove(path.size() - 1); used[i] = false;
    }
}

void combo(int[] c, int start, int remain, List<Integer> path, List<List<Integer>> out) {
    if (remain == 0) { out.add(new ArrayList<>(path)); return; }
    for (int i = start; i < c.length; i++) {
        if (c[i] > remain) break;
        path.add(c[i]);
        combo(c, i, remain - c[i], path, out);
        path.remove(path.size() - 1);
    }
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `Backtracking is exponential, and the output size often dominates:
- Subsets: 2ⁿ subsets × O(n) to copy each: **O(n · 2ⁿ)**.
- Permutations: n! permutations × O(n): **O(n · n!)**. Only feasible for n ≤ 8–10.
- Combination sum: bounded by the number of valid combinations times their length; pruning helps a lot in practice.
- N-Queens: far below n^n thanks to pruning, but still exponential.

Space: O(n) recursion depth plus the output. Always compare the worst-case output size with the constraints before choosing backtracking.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Not undoing the choice** (forgetting \`pop_back\` or resetting \`used[i]\` or the visited cell), which corrupts sibling branches.
2. **Java: adding \`path\` itself instead of a copy.** All results end up pointing to the same (finally empty) list. Use \`new ArrayList<>(path)\`.
3. **Duplicate results** from duplicate inputs: sort, then skip with \`i > start && a[i] == a[i−1]\`. Using \`i > 0\` instead of \`i > start\` wrongly skips valid choices at deeper levels.
4. **\`i\` vs \`i + 1\` in the recursive call:** \`i\` allows reusing an element, \`i + 1\` does not.
5. **Pruning with \`continue\` when \`break\` is valid** (sorted candidates): it misses an easy speed-up.
6. **Word search:** forgetting to restore the cell after exploring, or not checking bounds before reading.`,
    },
  ],
  recognition: {
    signals: ['Return ALL solutions or configurations', 'n ≤ ~20 (exponential output is acceptable)', 'Constraint satisfaction (queens, Sudoku, word search)', 'Building strings or partitions piece by piece'],
    antiSignals: ['Only a count or an optimum is asked and subproblems repeat: DP', 'n up to 10⁵: backtracking is impossible'],
    decisionQuestions: ['What is the choice at each level, and when is a solution complete?', 'Does order matter (permutations) or not (combinations with a start index)?', 'What can I prune early?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Backtracking vs DP: how do you decide?', answerMd: 'If you must list every solution, backtrack (the output is exponential anyway). If you need a count or an optimum and the same subproblem recurs, use DP: it computes each state once. Some problems use both (for example, palindrome partitioning with a precomputed DP table of palindromes).' },
    { id: 'iq2', q: 'How do you avoid duplicate subsets when the input has duplicates?', answerMd: 'Sort the input; in the loop at a given depth, skip a[i] if i > start and a[i] == a[i − 1]. That stops the same value from starting two identical branches at the same level, while still allowing equal values deeper in a path.' },
    { id: 'iq3', q: 'What is the complexity of generating all permutations?', answerMd: 'There are n! permutations and copying each costs O(n), so O(n · n!) time; recursion depth O(n). For n = 10 that is about 3.6·10⁷ operations, which is near the practical limit.' },
    { id: 'iq4', q: 'How does pruning work in N-Queens?', answerMd: 'Place one queen per row. Before placing at (r, c), check that column c and both diagonals (r − c and r + c) are free using sets or boolean arrays, giving O(1) per check. Invalid partial boards are abandoned immediately instead of being completed.' },
    { id: 'iq5', q: 'Why must you copy the path when recording a result in Java?', answerMd: 'path is a single mutable list reused across the whole recursion. Adding the reference stores the same object many times; after backtracking it ends up empty. Add new ArrayList<>(path) instead.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Template: choose, recurse, **undo**.
- Subsets/combinations: \`start\` index; recurse with \`i + 1\` (or \`i\` for reuse).
- Permutations: \`used[]\`; recurse over all unused.
- Duplicates: sort + \`if (i > start && a[i] == a[i−1]) continue\`.
- Prune with \`break\` on sorted candidates.
- Java: record \`new ArrayList<>(path)\`.
- Complexity: subsets O(n·2ⁿ), permutations O(n·n!).`,
    flashcards: [
      { id: 'f1', front: 'Backtracking template in three words?', backMd: 'Choose, explore, un-choose.' },
      { id: 'f2', front: 'Skip-duplicates condition?', backMd: 'Sort first; `i > start && a[i] == a[i−1]` means skip.' },
      { id: 'f3', front: 'Combination sum: recurse with i or i + 1?', backMd: 'i when reuse is allowed, i + 1 when each element can be used once.' },
      { id: 'f4', front: 'Java bug: all results are empty lists?', backMd: 'You added `path` instead of `new ArrayList<>(path)`.' },
      { id: 'f5', front: 'Complexity of all subsets?', backMd: 'O(n · 2ⁿ).' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 12, passPct: 80, minIndependentSolves: 4, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Backtracking (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Backtracking', kind: 'article' },
    { title: 'NeetCode practice: Backtracking', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.backtracking.q1', type: 'complexity', difficulty: 'easy',
    stem: 'How many subsets does a set of n distinct elements have?',
    options: [['n!', 'That is the number of permutations.'], '2ⁿ', ['n²', 'Far too few.'], ['n(n−1)/2', 'That counts pairs only.']],
    answer: 1,
    explanation: 'Each element is either in or out: 2 choices, n times.',
  }),
  mcq({
    ...base, id: 'dsa.backtracking.q2', type: 'debug', difficulty: 'medium',
    stem: 'A Java subsets solution does `out.add(path)` and every result in the output is `[]`. Why?',
    options: ['It stores the same mutable list reference every time; after backtracking it is empty', ['The recursion never adds elements', 'Elements are added, then removed.'], ['ArrayList cannot store lists', 'It can.'], ['Java passes lists by value', 'The reference is copied, not the list.']],
    answer: 0,
    explanation: 'Record a snapshot: `out.add(new ArrayList<>(path))`.',
  }),
  mcq({
    ...base, id: 'dsa.backtracking.q3', type: 'code-output', difficulty: 'medium',
    stem: 'How many lines does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int lines = 0;
void go(vector<int>& a, int start) {
    ++lines;                                   // one subset recorded per call
    for (int i = start; i < (int)a.size(); ++i) {
        if (i > start && a[i] == a[i - 1]) continue;
        go(a, i + 1);
    }
}
int main() {
    vector<int> a = {2, 1, 2};
    sort(a.begin(), a.end());
    go(a, 0);
    cout << lines << endl;
    return 0;
}`, 'C++', '6'),
    options: [['8', 'That counts subsets of 3 distinct elements; here 2 appears twice.'], '6', ['4', 'Too few: [], [1], [2], [1,2], [2,2], [1,2,2].'], ['7', 'The duplicate skip removes exactly two subsets.']],
    answer: 1,
    explanation: 'Unique subsets of {1, 2, 2}: [], [1], [1,2], [1,2,2], [2], [2,2], which is 6. The skip rule removes the duplicate [2] and [1,2].',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.backtracking.q4', type: 'concept', difficulty: 'medium',
    stem: 'In combination sum (each candidate can be reused), why is the recursive call made with index `i` rather than `i + 1`?',
    options: ['Passing i allows the same candidate to be chosen again; i + 1 would forbid reuse', ['i + 1 causes infinite recursion', 'i + 1 terminates; it just forbids reuse.'], ['It avoids duplicate permutations', 'The start index does that, whether it is i or i + 1.'], ['It does not matter', 'It changes which combinations are generated.']],
    answer: 0,
    explanation: 'Starting at i keeps the current candidate available. Starting from i (not 0) still prevents reordered duplicates.',
  }),
  mcq({
    ...base, id: 'dsa.backtracking.q5', type: 'pattern', difficulty: 'medium',
    stem: 'Count the number of ways to climb n = 10⁵ stairs with 1 or 2 steps. Backtracking or DP?',
    options: ['DP: only a count is needed and the subproblems overlap', ['Backtracking: enumerate every path', 'There are about 1.6^(10⁵) paths.'], ['Either; both are fast', 'Backtracking is exponential.'], ['Greedy', 'There is no choice to optimise.']],
    answer: 0,
    explanation: 'Enumeration is exponential; ways[i] = ways[i−1] + ways[i−2] is O(n).',
  }),
  mcq({
    ...base, id: 'dsa.backtracking.q6', type: 'edge-case', difficulty: 'hard',
    stem: 'A duplicate-skipping condition is written as `if (i > 0 && a[i] == a[i-1]) continue;` instead of `i > start`. For a = [1, 2, 2] (sorted), which valid subset is lost?',
    options: ['[2, 2] (and [1, 2, 2])', ['[1]', '1 has no duplicate.'], ['[] (empty)', 'The empty subset is recorded at the root.'], ['Nothing is lost', 'Deeper levels wrongly skip the second 2.']],
    answer: 0,
    explanation: 'After choosing the first 2 (index 1), the next level starts at index 2, where a[2] == a[1] and i > 0, so it skips. Using i > start allows the second 2 when it is the first option at its level.',
  }),
  mcq({
    ...base, id: 'dsa.backtracking.q7', type: 'concept', difficulty: 'medium',
    stem: 'In N-Queens with one queen per row, which O(1) checks prune invalid placements at (r, c)?',
    options: ['Column c, diagonal r − c and anti-diagonal r + c are all unused', ['Row r and column c only', 'Diagonal attacks would be missed.'], ['Distance to the nearest queen ≥ 2', 'Queens attack along full lines.'], ['Only the previous row', 'Attacks come from any earlier row.']],
    answer: 0,
    explanation: 'Cells on the same diagonal share r − c, and those on the same anti-diagonal share r + c. Boolean arrays for columns and both diagonals make each check O(1).',
  }),
];
