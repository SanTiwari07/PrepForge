import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.dsu';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Disjoint Set Union',
  summary: 'Union-find with path compression and union by rank for connectivity.',
  level: 'core',
  status: 'complete',
  estMinutes: 70,
  prerequisites: ['dsa.graphs'],
  related: ['dsa.graphs', 'dsa.mst', 'dsa.advanced-graphs'],
  subtopics: ['find and union', 'Path compression', 'Union by rank or size', 'Counting components', 'Cycle detection in undirected graphs', 'Mapping non-integer keys', 'Offline connectivity'],
  objectives: [
    'Implement union-find with path compression and union by size/rank, and state its near-constant amortised cost.',
    'Count connected components and detect a cycle in an undirected graph while edges arrive one by one.',
    'Map strings, coordinates or grid cells to integer ids for a DSU.',
    'Choose between DSU, BFS/DFS and topological sort for a connectivity question.',
    'Recognise problems that become easy when processed offline in sorted order with a DSU (Kruskal, minimax paths).',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Two operations on a partition',
      bodyMd: `A **disjoint set union** (union-find) maintains a partition of n elements into groups and supports:

- \`find(x)\`: the representative (root) of x's group. Two elements are connected iff they have the same root.
- \`union(a, b)\`: merge the groups of a and b. Returns false if they were already in the same group.

Each group is stored as a tree through a \`parent\` array; the root is its own parent.

Two optimisations make it fast:
1. **Path compression:** during \`find\`, point every visited node directly at the root.
2. **Union by size (or rank):** attach the smaller tree under the larger one, so trees stay shallow.

With both, a sequence of m operations takes **O(m · α(n))**, where α is the inverse Ackermann function, which is at most 4 for any input size you will ever see. In practice: constant time per operation.

DSU only **merges**. It cannot split groups or delete edges (that needs other techniques, or processing deletions backwards as additions).`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'When to choose DSU over BFS/DFS',
      bodyMd: `| Situation | Better tool |
|---|---|
| Static graph, one question "how many components?" | BFS/DFS or DSU, both O(V + E) |
| Edges arrive one at a time, answer after each | **DSU**: no re-traversal |
| "Which edge creates the first cycle?" (Redundant Connection) | **DSU**: union returns false |
| Kruskal's MST, or "minimum maximum edge on a path" | **DSU** over edges sorted by weight |
| Need the actual path, distances or shortest path | BFS / Dijkstra |
| Directed graph cycles or orderings | DFS colours / topological sort |

**Modelling tricks:**
- Grid cells: id = r · cols + c.
- Strings or emails (Accounts Merge): a hash map from key to id, assigned on first sight.
- "Same row or same column" (Most Stones Removed): union each stone's row with its column, using different id ranges for rows and columns.
- Weighted DSU (Evaluate Division): store the ratio from each node to its parent and combine ratios during find.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: edges (0,1), (2,3), (1,3), (0,2) on 4 vertices',
      bodyMd: 'parent starts as [0, 1, 2, 3]; components = 4. Union by size; the larger root wins (ties: the first root).',
      trace: [
        { note: 'union(0,1): roots 0 and 1 differ. parent[1] = 0. components = 3.', array: [0, 0, 2, 3], highlight: [1], vars: { components: 3 } },
        { note: 'union(2,3): parent[3] = 2. components = 2.', array: [0, 0, 2, 2], highlight: [3], vars: { components: 2 } },
        { note: 'union(1,3): find(1) = 0, find(3) = 2. Sizes 2 and 2: parent[2] = 0. components = 1.', array: [0, 0, 0, 2], highlight: [2], vars: { components: 1 } },
        { note: 'union(0,2): find(0) = 0, find(2) = 0. Same root: this edge closes a cycle (0-1-3-2-0). union returns false.', array: [0, 0, 0, 2], vars: { components: 1, cycleEdge: '(0,2)' } },
        { note: 'A later find(3) walks 3 → 2 → 0 and compresses: parent[3] = 0.', array: [0, 0, 0, 0], highlight: [3], vars: { components: 1 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Template',
      bodyMd: 'A reusable DSU with path compression (iterative, so deep chains cannot overflow the stack), union by size and a component counter.',
      code: [
        cpp(`
struct DSU {
    vector<int> parent, sz;
    int components;
    DSU(int n) : parent(n), sz(n, 1), components(n) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) {
        int root = x;
        while (parent[root] != root) root = parent[root];
        while (parent[x] != root) { int nxt = parent[x]; parent[x] = root; x = nxt; }   // compress
        return root;
    }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;                     // already connected: this edge is a cycle
        if (sz[a] < sz[b]) swap(a, b);
        parent[b] = a; sz[a] += sz[b];
        --components;
        return true;
    }
};

vector<int> findRedundantConnection(const vector<vector<int>>& edges) {
    DSU d(edges.size() + 1);                           // vertices are 1..n
    for (auto& e : edges) if (!d.unite(e[0], e[1])) return e;
    return {};
}`, 'C++'),
        java(`
static class DSU {
    int[] parent, size;
    int components;
    DSU(int n) {
        parent = new int[n]; size = new int[n]; components = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }
    int find(int x) {
        int root = x;
        while (parent[root] != root) root = parent[root];
        while (parent[x] != root) { int nxt = parent[x]; parent[x] = root; x = nxt; }
        return root;
    }
    boolean union(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (size[a] < size[b]) { int t = a; a = b; b = t; }
        parent[b] = a; size[a] += size[b];
        components--;
        return true;
    }
}

int[] findRedundantConnection(int[][] edges) {
    DSU d = new DSU(edges.length + 1);
    for (int[] e : edges) if (!d.union(e[0], e[1])) return e;
    return new int[0];
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- With path compression **and** union by size/rank: O(α(n)) amortised per operation; m operations cost O(m α(n)), effectively linear.
- Either optimisation alone: O(log n) amortised per operation.
- Neither: a chain can form, and find becomes O(n).
- Space: O(n) for the arrays.
- Counting components of a static graph: O(V + E α(V)), the same order as BFS/DFS.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Uniting the elements instead of their roots:** \`parent[b] = a\` without calling find on both first corrupts the trees.
2. **Comparing \`parent[a] == parent[b]\`** to test connectivity. Parents are not necessarily roots; compare \`find(a) == find(b)\`.
3. **Off-by-one ids** when vertices are 1-indexed (allocate n + 1).
4. **Recursive find on huge inputs** without union by size can recurse deeply before compression kicks in; the iterative version avoids it.
5. **Using DSU for directed graphs.** It ignores direction, so it cannot detect directed cycles or reachability.
6. **Forgetting to count components** as n minus the number of successful unions.`,
    },
  ],
  recognition: {
    signals: ['"Are a and b connected?" with many merges', 'Number of groups or provinces after merging', 'The edge that creates a cycle', 'Equivalence relations: same account, same row/column, synonyms', 'Process edges in sorted order (Kruskal, minimax path, "earliest time everyone is connected")'],
    antiSignals: ['Directed reachability or ordering: DFS/topological sort', 'Shortest path lengths: BFS/Dijkstra', 'Edges are removed over time (unless you can reverse time)'],
    decisionQuestions: ['Are relations symmetric and transitive (an equivalence)?', 'Do queries interleave with merges?', 'What integer id does each element get?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain path compression and union by rank, and the resulting complexity.', answerMd: 'Path compression makes every node on a find path point directly to the root. Union by rank (or size) attaches the shallower/smaller tree under the other root, so height grows only logarithmically. Together, m operations take O(m α(n)), where α (inverse Ackermann) is ≤ 4 for all practical n.' },
    { id: 'iq2', q: 'How do you detect a cycle in an undirected graph with DSU?', answerMd: 'Process edges one by one. If both endpoints already have the same root, the edge connects two vertices that are already connected, so it closes a cycle. Otherwise unite them. O(E α(V)).' },
    { id: 'iq3', q: 'Number of Provinces: BFS or DSU?', answerMd: 'Both are O(n²) on the adjacency matrix. DFS is the simplest; DSU is equally fine: unite i and j for every 1 in the matrix and return the component count. DSU shines when edges arrive online.' },
    { id: 'iq4', q: 'Accounts Merge: how would you group accounts that share any email?', answerMd: 'Give every email an id via a hash map; for each account, unite its first email with each of its other emails. Then group emails by root, sort each group, and attach the owner name (stored per email). O(N α(N) + N log N) where N is the total number of emails.' },
    { id: 'iq5', q: 'Can DSU handle deleting an edge?', answerMd: 'Not directly; unions cannot be undone with path compression. Options: process the operations in reverse so deletions become additions (offline), use a DSU with rollback (union by rank without path compression, keeping a history stack), or use a dynamic-connectivity structure, which is beyond interview scope.' },
    { id: 'iq6', q: 'Swim in Rising Water: describe a DSU solution.', answerMd: 'Sort cells by elevation. Add them one by one in that order, uniting each with already-added neighbours. The answer is the elevation at which the top-left and bottom-right cells first share a root. O(n² log n) for the sort. Dijkstra with max instead of sum or binary search + BFS also work.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- find with path compression; union by size; components = n − successful unions.
- O(α(n)) amortised ≈ constant.
- Connectivity: find(a) == find(b), never parent[a] == parent[b].
- Undirected cycle: union returns false.
- Ids: r·cols + c for grids; hash map for strings.
- Offline sorted processing: Kruskal, minimax paths, earliest full connection.
- Not for directed graphs or deletions.`,
    flashcards: [
      { id: 'f1', front: 'Amortised cost of DSU with both optimisations?', backMd: 'O(α(n)), the inverse Ackermann function: effectively constant.' },
      { id: 'f2', front: 'How do you test whether a and b are connected?', backMd: '`find(a) == find(b)`.' },
      { id: 'f3', front: 'How does DSU detect an undirected cycle?', backMd: 'An edge whose endpoints already share a root closes a cycle.' },
      { id: 'f4', front: 'Union by size: which root becomes the parent?', backMd: 'The root of the larger tree.' },
      { id: 'f5', front: 'Why not DSU for directed cycle detection?', backMd: 'DSU ignores direction; a → b and c → b would look connected even though no directed cycle exists.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Disjoint-set data structure (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Disjoint-set_data_structure', kind: 'article' },
    { title: 'Redundant Connection (LeetCode 684)', url: 'https://leetcode.com/problems/redundant-connection/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.dsu.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <numeric>
using namespace std;
vector<int> parent;
int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
int main() {
    int n = 6, components = 6;
    parent.resize(n);
    iota(parent.begin(), parent.end(), 0);
    int edges[][2] = {{0, 1}, {1, 2}, {3, 4}, {2, 0}};
    for (auto& e : edges) {
        int a = find(e[0]), b = find(e[1]);
        if (a != b) { parent[b] = a; --components; }
        else cout << "cycle at " << e[0] << "-" << e[1] << " ";
    }
    cout << components << endl;
    return 0;
}`, 'C++', 'cycle at 2-0 3'),
    options: ['cycle at 2-0 3', ['cycle at 2-0 2', 'Vertex 5 is isolated, so groups are {0,1,2}, {3,4}, {5}.'], ['3', 'Edge 2-0 joins two vertices that are already connected.'], ['cycle at 1-2 3', '1 and 2 are in different groups when that edge arrives.']],
    answer: 0,
    explanation: 'Three successful unions take 6 components to 3. The edge (2, 0) finds both in the group of 0, so it closes the triangle 0-1-2.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.dsu.q2', type: 'debug', difficulty: 'medium',
    stem: 'A DSU checks connectivity with `parent[a] == parent[b]`. Why is that wrong?',
    options: ['Parents are not always roots; two connected nodes can have different parents', ['It is correct after path compression', 'Compression only happens on nodes that were found.'], ['It is too slow', 'Speed is not the problem.'], ['It is wrong only for 1-indexed vertices', 'Indexing does not matter.']],
    answer: 0,
    explanation: 'In the tree 0 ← 1 ← 2, parent[2] = 1 but parent[1] = 0, although all three are connected. Compare find(a) and find(b).',
  }),
  mcq({
    ...base, id: 'dsa.dsu.q3', type: 'complexity', difficulty: 'medium',
    stem: 'What is the amortised cost per operation of DSU with path compression and union by rank?',
    options: ['O(α(n)), the inverse Ackermann function', ['O(log n)', 'That is with only one of the two optimisations.'], ['O(1) worst case', 'A single find can still be O(log n); the bound is amortised.'], ['O(n)', 'That is the worst case without optimisations.']],
    answer: 0,
    explanation: 'α(n) ≤ 4 for any realistic n, so it is constant in practice, but strictly it is amortised and slowly growing.',
  }),
  mcq({
    ...base, id: 'dsa.dsu.q4', type: 'pattern', difficulty: 'medium',
    stem: 'Which problem is a poor fit for union-find?',
    options: ['Detect a cycle in a directed graph of course prerequisites', ['Count provinces in an adjacency matrix', 'Union-find counts components.'], ['Find the edge that creates a cycle in an undirected graph', 'Classic union-find.'], ['Merge accounts that share an email', 'An equivalence relation.']],
    answer: 0,
    explanation: 'Union-find ignores edge direction. Directed cycles need DFS colouring or Kahn\'s algorithm.',
  }),
  mcq({
    ...base, id: 'dsa.dsu.q5', type: 'concept', difficulty: 'easy',
    stem: 'A grid has R rows and C columns. Which id is a standard way to put cell (r, c) into a DSU?',
    options: ['r · C + c', ['r · R + c', 'Use the number of columns as the stride.'], ['r + c', 'Different cells collide, e.g. (0,1) and (1,0).'], ['r · c', 'Many collisions, e.g. every cell in row 0 maps to 0.']],
    answer: 0,
    explanation: 'Row-major numbering gives each cell a unique id in [0, R·C).',
  }),
  mcq({
    ...base, id: 'dsa.dsu.q6', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    static int[] parent = new int[5], size = new int[5];
    static int find(int x) { while (parent[x] != x) x = parent[x]; return x; }
    static void union(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return;
        if (size[a] < size[b]) { int t = a; a = b; b = t; }
        parent[b] = a; size[a] += size[b];
    }
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) { parent[i] = i; size[i] = 1; }
        union(3, 4); union(2, 3); union(0, 1); union(1, 4);
        System.out.println(find(0) + " " + size[find(0)]);
    }
}`, 'Java', '3 5'),
    options: ['3 5', ['0 5', 'The group of 3 (size 3) is larger than the group of 0 (size 2).'], ['3 3', 'After the last union all five are together.'], ['4 5', 'union(3, 4) makes 3 the root (equal sizes, first wins).']],
    answer: 0,
    explanation: 'union(3,4): root 3, size 2. union(2,3): roots 2 (size 1) and 3 (size 2) → 3 wins, size 3. union(0,1): root 0, size 2. union(1,4): roots 0 (size 2) and 3 (size 3) → 3 wins, size 5.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.dsu.q7', type: 'edge-case', difficulty: 'easy',
    stem: 'Redundant Connection labels vertices 1..n and gives n edges. How large should the parent array be?',
    options: ['n + 1', ['n', 'Index n would be out of bounds.'], ['n − 1', 'Too small for 1-indexed labels.'], ['2n', 'Wasteful, and not the reason it works.']],
    answer: 0,
    explanation: 'Allocate n + 1 so that index n exists; index 0 is simply unused.',
  }),
  mcq({
    ...base, id: 'dsa.dsu.q8', type: 'scenario', difficulty: 'hard',
    stem: 'Friends join groups over time (log of "a and b became friends at time t"). You need the earliest time when everyone is connected. Best approach?',
    options: ['Sort the log by time, union in order, and return the time when the component count reaches 1', ['BFS after every log entry', 'O(E · (V + E)) total.'], ['Topological sort on the log', 'Friendship is undirected and has no ordering constraint.'], ['Dijkstra from person 0', 'It measures path costs, not the time of full connectivity.']],
    answer: 0,
    explanation: 'Each union is near O(1), so the whole run is O(E log E) for the sort. If the count never reaches 1, return −1.',
  }),
];
