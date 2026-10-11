import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.matrix';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Matrix Problems',
  summary: 'Traversal orders, rotation, spiral order and in-place marking.',
  level: 'core',
  status: 'complete',
  estMinutes: 75,
  prerequisites: ['dsa.arrays-strings'],
  related: ['dsa.graphs', 'dsa.dp-2d', 'dsa.binary-search', 'dsa.implementation'],
  subtopics: ['Row-major indexing', 'Direction arrays', 'Spiral order with four boundaries', 'Rotate 90° in place (transpose + reverse)', 'Set Matrix Zeroes with O(1) space', 'Search a sorted matrix', 'Game of Life state encoding'],
  objectives: [
    'Index a matrix safely, convert between (r, c) and r·C + c, and use direction arrays for neighbours.',
    'Produce spiral order with four shrinking boundaries, including non-square matrices.',
    'Rotate an n × n matrix by 90° in place with a transpose followed by a row reversal.',
    'Use the first row and column (or spare bits) as markers to solve in-place problems in O(1) extra space.',
    'Search row- and column-sorted matrices in O(R + C) from a corner, and fully sorted ones in O(log RC).',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Indexing, neighbours and boundaries',
      bodyMd: `A matrix with R rows and C columns stores cell (r, c) at row-major index **r · C + c**; the inverse is r = i / C, c = i % C. This lets you treat a fully sorted matrix as a 1-D sorted array (Search a 2D Matrix) or give each cell an id (union-find, BFS visited arrays).

**Direction arrays** remove copy-paste bugs:

\`\`\`
dr = {-1, 1, 0, 0}, dc = {0, 0, -1, 1}             // 4 neighbours
for k in 0..3: nr = r + dr[k], nc = c + dc[k]; if 0 ≤ nr < R and 0 ≤ nc < C: ...
\`\`\`

Use 8 entries when diagonals count (Game of Life, islands with diagonal adjacency).

**Rectangular is the default.** Many bugs come from assuming R == C. Use \`grid.size()\` for rows and \`grid[0].size()\` for columns, and test with a 1 × n and an n × 1 matrix.

**Traversal orders** worth knowing: row by row, column by column, diagonals (cells with the same r + c, or the same r − c), spiral, and layer by layer (the k-th ring is the cells with min(r, c, R−1−r, C−1−c) = k).`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Classic techniques',
      bodyMd: `**Spiral order:** keep top, bottom, left, right. Walk the top row left to right (then top++), the right column downwards (right−−), the bottom row right to left if top ≤ bottom (bottom−−), the left column upwards if left ≤ right (left++). The two checks stop a single remaining row or column from being printed twice.

**Rotate 90° clockwise in place:** transpose (swap a[i][j] with a[j][i] for j > i), then reverse each row. Counter-clockwise: transpose, then reverse each column (or reverse rows first, then transpose).

**Set Matrix Zeroes in O(1) space:** use row 0 and column 0 as flag storage. First record whether row 0 and column 0 themselves contain a zero (two booleans), then mark: if a[i][j] == 0, set a[i][0] = a[0][j] = 0. Zero the inner cells from the marks, and finally zero row 0 / column 0 if their booleans say so.

**Game of Life in place:** encode the next state in a spare bit (state |= next << 1) or with extra values (2 = alive → dead, 3 = dead → alive), count neighbours using only the old bit, then shift.

**Searching sorted matrices:**
- Every row sorted and each row's first element greater than the previous row's last: binary search on 0 … RC − 1 with the index mapping, O(log RC).
- Rows sorted and columns sorted (Search a 2D Matrix II): start at the top-right corner. If the value is too big, move left; too small, move down. Each step discards a row or a column: O(R + C).`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: rotate [[1,2,3],[4,5,6],[7,8,9]] clockwise',
      bodyMd: 'Rows are shown flattened, row by row.',
      trace: [
        { note: 'Start.', array: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
        { note: 'Transpose: swap (0,1)↔(1,0), (0,2)↔(2,0), (1,2)↔(2,1).', array: [1, 4, 7, 2, 5, 8, 3, 6, 9], highlight: [1, 2, 3, 5, 6, 7] },
        { note: 'Reverse row 0: [7, 4, 1].', array: [7, 4, 1, 2, 5, 8, 3, 6, 9], highlight: [0, 1, 2] },
        { note: 'Reverse rows 1 and 2: [8, 5, 2] and [9, 6, 3]. Result [[7,4,1],[8,5,2],[9,6,3]]: the old first column, read upwards, is now the first row.', array: [7, 4, 1, 8, 5, 2, 9, 6, 3], highlight: [3, 4, 5, 6, 7, 8] },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Spiral order, in-place rotation, Set Matrix Zeroes with O(1) space and the staircase search.',
      code: [
        cpp(`
vector<int> spiralOrder(const vector<vector<int>>& a) {
    vector<int> out;
    if (a.empty()) return out;
    int top = 0, bottom = a.size() - 1, left = 0, right = a[0].size() - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; ++c) out.push_back(a[top][c]);
        ++top;
        for (int r = top; r <= bottom; ++r) out.push_back(a[r][right]);
        --right;
        if (top <= bottom) { for (int c = right; c >= left; --c) out.push_back(a[bottom][c]); --bottom; }
        if (left <= right) { for (int r = bottom; r >= top; --r) out.push_back(a[r][left]); ++left; }
    }
    return out;
}

void rotate(vector<vector<int>>& a) {                 // 90 degrees clockwise, n x n
    int n = a.size();
    for (int i = 0; i < n; ++i)
        for (int j = i + 1; j < n; ++j) swap(a[i][j], a[j][i]);
    for (auto& row : a) reverse(row.begin(), row.end());
}

void setZeroes(vector<vector<int>>& a) {
    int R = a.size(), C = a[0].size();
    bool row0 = false, col0 = false;
    for (int c = 0; c < C; ++c) if (a[0][c] == 0) row0 = true;
    for (int r = 0; r < R; ++r) if (a[r][0] == 0) col0 = true;
    for (int r = 1; r < R; ++r)
        for (int c = 1; c < C; ++c) if (a[r][c] == 0) a[r][0] = a[0][c] = 0;
    for (int r = 1; r < R; ++r)
        for (int c = 1; c < C; ++c) if (a[r][0] == 0 || a[0][c] == 0) a[r][c] = 0;
    if (row0) for (int c = 0; c < C; ++c) a[0][c] = 0;
    if (col0) for (int r = 0; r < R; ++r) a[r][0] = 0;
}

bool searchMatrixII(const vector<vector<int>>& a, int target) {   // rows and columns sorted
    int r = 0, c = a[0].size() - 1;
    while (r < (int)a.size() && c >= 0) {
        if (a[r][c] == target) return true;
        if (a[r][c] > target) --c; else ++r;
    }
    return false;
}`, 'C++'),
        java(`
List<Integer> spiralOrder(int[][] a) {
    List<Integer> out = new ArrayList<>();
    if (a.length == 0) return out;
    int top = 0, bottom = a.length - 1, left = 0, right = a[0].length - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.add(a[top][c]);
        top++;
        for (int r = top; r <= bottom; r++) out.add(a[r][right]);
        right--;
        if (top <= bottom) { for (int c = right; c >= left; c--) out.add(a[bottom][c]); bottom--; }
        if (left <= right) { for (int r = bottom; r >= top; r--) out.add(a[r][left]); left++; }
    }
    return out;
}

void rotate(int[][] a) {
    int n = a.length;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) { int t = a[i][j]; a[i][j] = a[j][i]; a[j][i] = t; }
    for (int[] row : a)
        for (int l = 0, r = n - 1; l < r; l++, r--) { int t = row[l]; row[l] = row[r]; row[r] = t; }
}

void setZeroes(int[][] a) {
    int R = a.length, C = a[0].length;
    boolean row0 = false, col0 = false;
    for (int c = 0; c < C; c++) if (a[0][c] == 0) row0 = true;
    for (int r = 0; r < R; r++) if (a[r][0] == 0) col0 = true;
    for (int r = 1; r < R; r++)
        for (int c = 1; c < C; c++) if (a[r][c] == 0) { a[r][0] = 0; a[0][c] = 0; }
    for (int r = 1; r < R; r++)
        for (int c = 1; c < C; c++) if (a[r][0] == 0 || a[0][c] == 0) a[r][c] = 0;
    if (row0) for (int c = 0; c < C; c++) a[0][c] = 0;
    if (col0) for (int r = 0; r < R; r++) a[r][0] = 0;
}

boolean searchMatrixII(int[][] a, int target) {
    int r = 0, c = a[0].length - 1;
    while (r < a.length && c >= 0) {
        if (a[r][c] == target) return true;
        if (a[r][c] > target) c--; else r++;
    }
    return false;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Spiral, rotation, Set Matrix Zeroes, Game of Life: **O(R · C)** time; the in-place versions use O(1) extra space (spiral's output list aside).
- Staircase search (rows and columns sorted): **O(R + C)**. Binary searching each row is O(R log C), worse when R ≈ C.
- Fully sorted matrix: O(log(R · C)) with the flattened index.
- Counting neighbours with direction arrays: O(1) per cell (4 or 8 checks).
- A copy-based rotation is also O(n²) time but O(n²) extra space; interviewers usually ask for in place.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Mixing up rows and columns** (\`a[c][r]\`, or using R for both bounds); test on a non-square matrix.
2. **Spiral duplicates** for a single remaining row or column: guard the third and fourth walks with top ≤ bottom and left ≤ right.
3. **Transposing the full matrix** (j from 0) swaps every pair twice, which undoes the transpose. Loop j from i + 1.
4. **Set Matrix Zeroes: marking row 0/column 0 first** destroys the information about whether they originally contained zeros. Record that in two booleans before marking.
5. **Game of Life: updating cells in place** and then counting already-updated neighbours. Encode both states.
6. **Neighbour checks without bounds checks** (or checking after the array access).
7. **Empty matrix** inputs where \`grid[0]\` does not exist.`,
    },
  ],
  recognition: {
    signals: ['2-D grid with traversal-order requirements (spiral, diagonal, layer)', 'Rotate, transpose or reflect', 'In-place updates with O(1) extra space', 'Sorted rows and/or columns and a search target', 'Simulation on a board with neighbour rules'],
    antiSignals: ['Connected regions or shortest moves on a grid: BFS/DFS/union-find (Graphs)', 'Counting paths or minimum path sums with right/down moves: 2-D DP', 'Range-sum queries on submatrices: 2-D prefix sums'],
    decisionQuestions: ['Is the matrix square?', 'Do I need the old values while writing new ones, and where can I store them?', 'Which corner gives a monotone decision for searching?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Rotate an n × n image by 90° clockwise in place.', answerMd: 'Transpose (swap a[i][j] and a[j][i] for j > i), then reverse each row. Both steps are in place; O(n²) time, O(1) space. Alternatively rotate four cells at a time layer by layer.' },
    { id: 'iq2', q: 'Set Matrix Zeroes with O(1) extra space.', answerMd: 'Use the first row and first column as markers. First store whether row 0 and column 0 contain a zero in two booleans. For every inner zero, set a[r][0] and a[0][c] to 0. Then zero every inner cell whose row or column marker is 0, and finally zero row 0 and column 0 if the booleans say so. O(RC) time.' },
    { id: 'iq3', q: 'Search a matrix whose rows and columns are each sorted ascending.', answerMd: 'Start at the top-right. If the current value equals the target, done. If it is larger, every value below it in that column is larger too, so move left. If it is smaller, every value to its left in that row is smaller, so move down. O(R + C). (The bottom-left corner works symmetrically.)' },
    { id: 'iq4', q: 'Print a matrix in spiral order. What breaks on non-square inputs?', answerMd: 'Use four boundaries and shrink them after each side. On a 3 × 1 or 1 × 3 matrix, after the first two walks the bottom row and left column overlap the cells already printed, so the third and fourth walks must check top ≤ bottom and left ≤ right before running.' },
    { id: 'iq5', q: 'How do you update the Game of Life board in place?', answerMd: 'Each cell needs the old states of its neighbours. Store the next state in a second bit (cell |= next << 1), counting neighbours with cell & 1; after the pass, shift every cell right by one. Or use sentinel values such as 2 (was alive, now dead) and 3 (was dead, now alive).' },
    { id: 'iq6', q: 'How do you iterate over all anti-diagonals of a matrix?', answerMd: 'Cells on the same anti-diagonal have the same r + c, from 0 to R + C − 2. For each sum s, iterate r from max(0, s − C + 1) to min(R − 1, s) with c = s − r. Main diagonals share r − c instead.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Index r·C + c; rows = grid.size(), cols = grid[0].size().
- Direction arrays for 4/8 neighbours, bounds-check first.
- Spiral: four boundaries; guard the bottom and left walks.
- Rotate clockwise: transpose (j > i) + reverse rows.
- O(1) in place: first row/column as markers; save their own flags first.
- Sorted rows & cols: staircase from the top-right, O(R + C).`,
    flashcards: [
      { id: 'f1', front: 'Rotate an n×n matrix 90° clockwise in place?', backMd: 'Transpose, then reverse each row.' },
      { id: 'f2', front: 'Spiral order guard conditions?', backMd: 'Walk the bottom row only if top ≤ bottom, and the left column only if left ≤ right.' },
      { id: 'f3', front: 'Search a row- and column-sorted matrix?', backMd: 'Start top-right: larger → move left, smaller → move down. O(R + C).' },
      { id: 'f4', front: 'Row-major id of (r, c) in an R×C grid?', backMd: 'r · C + c.' },
      { id: 'f5', front: 'Set Matrix Zeroes O(1) space trick?', backMd: 'Use row 0 and column 0 as marker storage, after saving whether they contain zeros themselves.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Row- and column-major order (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Row-_and_column-major_order', kind: 'article' },
    { title: 'Rotate Image (LeetCode 48)', url: 'https://leetcode.com/problems/rotate-image/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.matrix.q1', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<vector<int>> a = {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}};
    int top = 0, bottom = 2, left = 0, right = 3;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; ++c) cout << a[top][c] << " ";
        ++top;
        for (int r = top; r <= bottom; ++r) cout << a[r][right] << " ";
        --right;
        if (top <= bottom) { for (int c = right; c >= left; --c) cout << a[bottom][c] << " "; --bottom; }
        if (left <= right) { for (int r = bottom; r >= top; --r) cout << a[r][left] << " "; ++left; }
    }
    cout << endl;
    return 0;
}`, 'C++', '1 2 3 4 8 12 11 10 9 5 6 7'),
    options: ['1 2 3 4 8 12 11 10 9 5 6 7', ['1 2 3 4 8 12 11 10 9 5 6 7 6', 'The guards stop the inner row from being revisited.'], ['1 2 3 4 5 6 7 8 9 10 11 12', 'That is row-major order.'], ['1 2 3 4 8 12 11 10 9 5 7 6', 'The inner row is walked left to right.']],
    answer: 0,
    explanation: 'Outer ring: 1 2 3 4 8 12 11 10 9 5. Then top = bottom = 1 and left..right = 1..2: the top walk prints 6 7, the right walk prints nothing, and the guarded walks are skipped.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.matrix.q2', type: 'concept', difficulty: 'easy',
    stem: 'Which two in-place steps rotate a square matrix 90° clockwise?',
    options: ['Transpose, then reverse each row', ['Reverse each row, then transpose', 'That rotates counter-clockwise.'], ['Transpose twice', 'That restores the original.'], ['Reverse each column, then reverse each row', 'That rotates by 180°.']],
    answer: 0,
    explanation: 'After transposing, column j becomes row j; reversing rows puts the old bottom-left element at the top-left, which is a clockwise rotation.',
  }),
  mcq({
    ...base, id: 'dsa.matrix.q3', type: 'debug', difficulty: 'medium',
    stem: 'A transpose loop uses `for i in 0..n−1, for j in 0..n−1: swap(a[i][j], a[j][i])`. What is the result?',
    options: ['The original matrix: every pair is swapped twice', ['A correct transpose', 'Each off-diagonal pair is visited as (i, j) and (j, i).'], ['A rotated matrix', 'No reversal happens.'], ['Undefined behaviour', 'Indices are in range.']],
    answer: 0,
    explanation: 'Start j at i + 1 so each pair is swapped once.',
  }),
  mcq({
    ...base, id: 'dsa.matrix.q4', type: 'complexity', difficulty: 'medium',
    stem: 'A 1000 × 1000 matrix has sorted rows and sorted columns. What is the cost of the top-right staircase search?',
    options: ['O(R + C), about 2000 steps', ['O(log(RC)), about 20 steps', 'Only when the whole matrix is sorted in row-major order.'], ['O(R log C), about 10 000 steps', 'That is binary search per row, which is slower here.'], ['O(RC)', 'Each step removes a row or a column.']],
    answer: 0,
    explanation: 'Each comparison eliminates one row or one column, so at most R + C steps.',
  }),
  mcq({
    ...base, id: 'dsa.matrix.q5', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[][] a = {{0, 1, 2, 0}, {3, 4, 5, 2}, {1, 3, 1, 5}};
        int R = a.length, C = a[0].length;
        boolean row0 = false, col0 = false;
        for (int c = 0; c < C; c++) if (a[0][c] == 0) row0 = true;
        for (int r = 0; r < R; r++) if (a[r][0] == 0) col0 = true;
        for (int r = 1; r < R; r++) for (int c = 1; c < C; c++) if (a[r][c] == 0) { a[r][0] = 0; a[0][c] = 0; }
        for (int r = 1; r < R; r++) for (int c = 1; c < C; c++) if (a[r][0] == 0 || a[0][c] == 0) a[r][c] = 0;
        if (row0) for (int c = 0; c < C; c++) a[0][c] = 0;
        if (col0) for (int r = 0; r < R; r++) a[r][0] = 0;
        System.out.println(Arrays.deepToString(a));
    }
}`, 'Java', '[[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]]'),
    options: ['[[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]]', ['[[0, 0, 0, 0], [3, 4, 5, 2], [1, 3, 1, 5]]', 'Columns 0 and 3 contain zeros, so they are zeroed too.'], ['[[0, 1, 2, 0], [0, 4, 5, 0], [0, 3, 1, 0]]', 'Row 0 contains zeros, so the whole row is zeroed.'], ['[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]', 'Rows 1 and 2 have no zeros of their own.']],
    answer: 0,
    explanation: 'Zeros sit at (0,0) and (0,3): row 0 and columns 0 and 3 become zero. The inner values 4, 5, 3, 1 survive.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.matrix.q6', type: 'edge-case', difficulty: 'easy',
    stem: 'Which input most often exposes spiral-order bugs?',
    options: ['A single column such as [[1],[2],[3]]', ['A 2 × 2 matrix', 'Usually handled correctly.'], ['A 3 × 3 matrix', 'The textbook case.'], ['A matrix of zeros', 'Values do not affect the traversal.']],
    answer: 0,
    explanation: 'With one column, the right-column walk and the left-column walk cover the same cells; without the left ≤ right guard, values are printed twice.',
  }),
  mcq({
    ...base, id: 'dsa.matrix.q7', type: 'concept', difficulty: 'medium',
    stem: 'For the fully sorted matrix (each row sorted and each row starts after the previous row ends), index k of the flattened array corresponds to which cell in an R × C matrix?',
    options: ['(k / C, k % C)', ['(k / R, k % R)', 'Divide by the row length, which is C.'], ['(k % C, k / C)', 'Row and column are swapped.'], ['(k / C, k / R)', 'Not a valid mapping.']],
    answer: 0,
    explanation: 'Row-major order: each row contributes C elements, so the row is k / C and the column is k % C. Then a single binary search over 0..RC−1 works.',
  }),
  mcq({
    ...base, id: 'dsa.matrix.q8', type: 'pattern', difficulty: 'medium',
    stem: 'Game of Life must be updated in place. What is a correct approach?',
    options: ['Store the next state in bit 1 while reading neighbours from bit 0, then shift all cells right by one', ['Update cells row by row in place', 'Later cells would see already-updated neighbours.'], ['Process cells in random order', 'Order does not fix the dependency.'], ['Only update live cells', 'Dead cells can come alive.']],
    answer: 0,
    explanation: 'Every cell keeps its old state in bit 0 until the end of the pass, so neighbour counts use the old generation.',
  }),
];
