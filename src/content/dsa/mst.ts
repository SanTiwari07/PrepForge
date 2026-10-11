import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.mst';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Minimum Spanning Trees',
  summary: "Kruskal's and Prim's algorithms and the cut property.",
  level: 'core',
  status: 'complete',
  estMinutes: 65,
  prerequisites: ['dsa.dsu', 'dsa.heaps'],
  related: ['dsa.dsu', 'dsa.shortest-paths', 'dsa.greedy', 'dsa.graphs'],
  subtopics: ['Spanning trees', 'The cut property', "Kruskal's algorithm (sort + DSU)", "Prim's algorithm (heap or O(V²))", 'MST vs shortest-path tree', 'Minimax paths'],
  objectives: [
    'Define a minimum spanning tree and state the cut property that makes greedy choices safe.',
    "Implement Kruskal's algorithm with sorting and union-find, and Prim's algorithm with a heap and with an O(V²) scan for dense graphs.",
    'Explain why an MST is not a shortest-path tree, with a counterexample.',
    'Use MST ideas for "minimise the maximum edge" (bottleneck) problems.',
    'Model problems such as connecting points or wells as MSTs, including a virtual source vertex.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Connect everything at minimum total cost',
      bodyMd: `A **spanning tree** of a connected, undirected, weighted graph is a subset of edges that connects all V vertices without cycles; it has exactly **V − 1 edges**. A **minimum spanning tree** (MST) has the smallest total weight among all spanning trees. If the graph is disconnected, you get a minimum spanning **forest**, and "connect everything" is impossible.

**Cut property.** Split the vertices into any two non-empty groups. The lightest edge crossing between the groups belongs to some MST (to every MST if it is the unique lightest). Both classic algorithms are just ways of repeatedly applying this safe greedy choice:

- **Kruskal:** sort all edges by weight; add an edge if it joins two different components (checked with a DSU). Stop after V − 1 edges.
- **Prim:** grow one tree from a start vertex; repeatedly add the cheapest edge leaving the tree (a min-heap of candidate edges).

**Cycle property** (the mirror image): the heaviest edge on any cycle is not needed (unless ties); Kruskal effectively skips such edges because their endpoints are already connected.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'MST vs shortest paths, and when to choose which algorithm',
      bodyMd: `**Not the same tree.** Triangle A–B 1, B–C 1, A–C 1.5. The MST is {A–B, B–C} (total 2). The shortest path from A to C is the direct edge, 1.5, which the MST does not contain (A → B → C costs 2 in the tree). The MST minimises the **total** cost of connecting everyone; Dijkstra minimises each **individual** route from a source.

**Kruskal or Prim?**
| | Kruskal | Prim (binary heap) | Prim (array, O(V²)) |
|---|---|---|---|
| Best for | sparse graphs, edge lists | adjacency lists | dense / complete graphs |
| Time | O(E log E) | O(E log V) | O(V²) |

Min Cost to Connect All Points has V ≤ 1000 points and an implicit complete graph (E ≈ 500 000): the O(V²) Prim without building any edge list is the cleanest.

**Minimax (bottleneck) paths.** In an MST, the path between two vertices minimises the **largest** edge on it among all paths. So "the smallest possible maximum effort/height/time to get from s to t" can be answered by adding edges in increasing weight order (Kruskal with a DSU) until s and t connect. Swim in Rising Water and Path With Minimum Effort both work this way.

**Virtual vertex trick** (Optimize Water Distribution): "build a well in house i for cost w[i]" becomes an edge from a new vertex 0 to house i with weight w[i]; then run a normal MST.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: "Dry run: Kruskal on 5 edges",
      bodyMd: 'Vertices 0–3. Edges sorted by weight: (0-1, 1), (1-2, 2), (0-2, 3), (2-3, 4), (1-3, 5).',
      trace: [
        { note: 'Take 0-1 (1): different components. Total 1.', array: ['0-1:1', '1-2:2', '0-2:3', '2-3:4', '1-3:5'], pointers: { e: 0 }, highlight: [0], vars: { total: 1, edges: 1 } },
        { note: 'Take 1-2 (2): joins {0,1} with {2}. Total 3.', array: ['0-1:1', '1-2:2', '0-2:3', '2-3:4', '1-3:5'], pointers: { e: 1 }, highlight: [0, 1], vars: { total: 3, edges: 2 } },
        { note: 'Skip 0-2 (3): 0 and 2 are already connected (it would close a cycle).', array: ['0-1:1', '1-2:2', '0-2:3', '2-3:4', '1-3:5'], pointers: { e: 2 }, highlight: [0, 1], vars: { total: 3, edges: 2 } },
        { note: 'Take 2-3 (4). Total 7. We have V − 1 = 3 edges: stop. 1-3 (5) is never examined.', array: ['0-1:1', '1-2:2', '0-2:3', '2-3:4', '1-3:5'], pointers: { e: 3 }, highlight: [0, 1, 3], vars: { total: 7, edges: 3 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Kruskal with a DSU, and O(V²) Prim for complete graphs (Min Cost to Connect All Points).',
      code: [
        cpp(`
// edges[i] = {w, u, v}; returns the MST weight, or -1 if the graph is disconnected.
long long kruskal(int n, vector<array<int, 3>> edges) {
    sort(edges.begin(), edges.end());
    vector<int> parent(n);
    iota(parent.begin(), parent.end(), 0);
    function<int(int)> find = [&](int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); };
    long long total = 0;
    int used = 0;
    for (auto& e : edges) {
        int a = find(e[1]), b = find(e[2]);
        if (a == b) continue;                       // would close a cycle
        parent[a] = b;
        total += e[0];
        if (++used == n - 1) break;
    }
    return used == n - 1 ? total : -1;
}

// Prim in O(V^2): best[v] = cheapest edge from the tree to v.
int minCostConnectPoints(const vector<vector<int>>& p) {
    int n = p.size();
    vector<int> best(n, INT_MAX);
    vector<bool> inTree(n, false);
    best[0] = 0;
    int total = 0;
    for (int it = 0; it < n; ++it) {
        int u = -1;
        for (int v = 0; v < n; ++v) if (!inTree[v] && (u == -1 || best[v] < best[u])) u = v;
        inTree[u] = true;
        total += best[u];
        for (int v = 0; v < n; ++v) {
            if (inTree[v]) continue;
            int d = abs(p[u][0] - p[v][0]) + abs(p[u][1] - p[v][1]);
            best[v] = min(best[v], d);
        }
    }
    return total;
}`, 'C++'),
        java(`
int[] parent;
int find(int x) { return parent[x] == x ? x : (parent[x] = find(parent[x])); }

// edges[i] = {w, u, v}
long kruskal(int n, int[][] edges) {
    Arrays.sort(edges, (a, b) -> Integer.compare(a[0], b[0]));
    parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    long total = 0;
    int used = 0;
    for (int[] e : edges) {
        int a = find(e[1]), b = find(e[2]);
        if (a == b) continue;
        parent[a] = b;
        total += e[0];
        if (++used == n - 1) break;
    }
    return used == n - 1 ? total : -1;
}

int minCostConnectPoints(int[][] p) {
    int n = p.length;
    int[] best = new int[n];
    Arrays.fill(best, Integer.MAX_VALUE);
    boolean[] inTree = new boolean[n];
    best[0] = 0;
    int total = 0;
    for (int it = 0; it < n; it++) {
        int u = -1;
        for (int v = 0; v < n; v++) if (!inTree[v] && (u == -1 || best[v] < best[u])) u = v;
        inTree[u] = true;
        total += best[u];
        for (int v = 0; v < n; v++) {
            if (inTree[v]) continue;
            int d = Math.abs(p[u][0] - p[v][0]) + Math.abs(p[u][1] - p[v][1]);
            best[v] = Math.min(best[v], d);
        }
    }
    return total;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Kruskal: O(E log E) for the sort (= O(E log V)), plus O(E α(V)) for the DSU.
- Prim with a binary heap: O(E log V).
- Prim with an array scan: O(V²), no edge list needed, best for complete graphs.
- Space: O(V + E) for Kruskal's edge list; O(V) for the array Prim.
- An MST always has exactly V − 1 edges; if Kruskal finishes with fewer, the graph is disconnected.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Confusing MST with shortest paths.** Dijkstra from one vertex does not minimise the total cost of connecting everyone, and an MST does not give shortest routes.
2. **Building all O(V²) edges and sorting** for a 1000-point complete graph: about 500 000 edges, which passes, but the O(V²) Prim is simpler and uses O(V) memory.
3. **Forgetting the connectivity check:** fewer than V − 1 accepted edges means no spanning tree.
4. **Using MST on directed graphs.** The directed version (minimum arborescence) needs a different algorithm (Chu-Liu/Edmonds).
5. **Overflow** in the total for large weights; use 64-bit.
6. **Prim with lazy heap entries but no "already in tree" check**, which adds a vertex twice.`,
    },
  ],
  recognition: {
    signals: ['Connect all points/cities/computers with minimum total cost', 'Each connection is undirected and has a cost', 'Minimise the maximum edge used on a path (bottleneck)', 'Optional "build here" costs that can become edges from a virtual source'],
    antiSignals: ['Cheapest route from one place to another: shortest paths', 'Directed dependencies: topological sort', 'Just whether everything is connected: BFS/DSU without weights'],
    decisionQuestions: ['Does the objective sum over all chosen edges (MST) or over one route (shortest path)?', 'Is the graph given as edges (Kruskal) or implicit and dense (O(V²) Prim)?', 'Can a "self-build" cost become an edge from a virtual vertex?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'State the cut property and explain why Kruskal is correct.', answerMd: 'For any partition of the vertices, the lightest edge crossing it is in some MST. When Kruskal accepts edge (u, v), u and v are in different components; take the cut separating u\'s component from the rest. No lighter edge crosses it (lighter edges were already processed and either accepted or found to be internal), so (u, v) is the lightest crossing edge and is safe.' },
    { id: 'iq2', q: 'Kruskal or Prim for Min Cost to Connect All Points with 1000 points?', answerMd: 'The graph is complete (≈ 500 000 edges). O(V²) Prim with a best-distance array needs no edge list and runs in about 10⁶ operations. Kruskal works too (O(E log E) after generating all edges) but uses more memory and time.' },
    { id: 'iq3', q: 'Is the MST unique?', answerMd: 'It is unique if all edge weights are distinct. With ties there can be several MSTs, but they all have the same total weight (and the same multiset of edge weights).' },
    { id: 'iq4', q: 'Show that an MST does not give shortest paths.', answerMd: 'Triangle A–B 1, B–C 1, A–C 1.5: the MST is A–B, B–C (total 2), but the shortest A–C distance is 1.5 via the direct edge, which the MST excludes.' },
    { id: 'iq5', q: 'How would you minimise the maximum edge weight on a path from s to t?', answerMd: 'Sort edges by weight and add them with a DSU until s and t are connected; the last added weight is the answer (this is the MST path\'s maximum edge). Alternatives: Dijkstra with max as the combine operation, or binary search on the threshold plus BFS.' },
    { id: 'iq6', q: 'Optimize Water Distribution: wells cost w[i] per house, pipes have costs. How do you model it?', answerMd: 'Add a virtual vertex 0 with an edge 0–i of weight w[i] for every house (building a well = connecting to the water source). Then the minimum cost to supply every house is the MST of the extended graph. O((V + E) log(V + E)).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- MST: V − 1 edges, minimum total weight, undirected and connected.
- Cut property: the lightest crossing edge is safe.
- Kruskal: sort edges + DSU, O(E log E). Prim: heap O(E log V) or array O(V²) for dense graphs.
- MST ≠ shortest-path tree (triangle 1, 1, 1.5).
- Bottleneck paths: add edges in increasing order until connected.
- Virtual source vertex for "build here" costs.`,
    flashcards: [
      { id: 'f1', front: 'How many edges does a spanning tree of V vertices have?', backMd: 'V − 1.' },
      { id: 'f2', front: 'Kruskal in one line?', backMd: 'Sort edges by weight; add each edge that joins two different DSU components.' },
      { id: 'f3', front: 'Best MST algorithm for a complete graph of 1000 points?', backMd: "O(V²) Prim with a best-distance array." },
      { id: 'f4', front: 'Is the MST unique?', backMd: 'Yes if edge weights are distinct; otherwise several MSTs may share the minimum total.' },
      { id: 'f5', front: 'Minimise the largest edge on an s–t path?', backMd: 'Add edges in increasing order with a DSU until s and t connect (minimax path = MST path).' },
    ],
  },
  mastery: { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 2, minMediumIndependent: 1, retentionDays: 7 },
  resources: [
    { title: 'Minimum spanning tree (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Minimum_spanning_tree', kind: 'article' },
    { title: "Kruskal's algorithm (Wikipedia)", url: 'https://en.wikipedia.org/wiki/Kruskal%27s_algorithm', kind: 'article' },
    { title: 'Min Cost to Connect All Points (LeetCode 1584)', url: 'https://leetcode.com/problems/min-cost-to-connect-all-points/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.mst.q1', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Kruskal program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <array>
#include <algorithm>
#include <numeric>
using namespace std;
vector<int> parent;
int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
int main() {
    int n = 4;
    vector<array<int, 3>> edges = {{5, 1, 3}, {1, 0, 1}, {3, 0, 2}, {2, 1, 2}, {4, 2, 3}};
    sort(edges.begin(), edges.end());
    parent.resize(n);
    iota(parent.begin(), parent.end(), 0);
    int total = 0;
    for (auto& e : edges) {
        int a = find(e[1]), b = find(e[2]);
        if (a == b) continue;
        parent[a] = b;
        total += e[0];
        cout << e[1] << "-" << e[2] << " ";
    }
    cout << total << endl;
    return 0;
}`, 'C++', '0-1 1-2 2-3 7'),
    options: ['0-1 1-2 2-3 7', ['0-1 0-2 2-3 8', 'After 0-1 and 1-2, the edge 0-2 closes a cycle.'], ['0-1 1-2 1-3 8', '2-3 (4) is lighter than 1-3 (5).'], ['0-1 1-2 0-2 2-3 10', 'An MST has V − 1 = 3 edges.']],
    answer: 0,
    explanation: 'Sorted weights 1, 2, 3, 4, 5. Accept 0-1 (1) and 1-2 (2), skip 0-2 (3, cycle), accept 2-3 (4), skip 1-3 (5). Total 7.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.mst.q2', type: 'concept', difficulty: 'easy',
    stem: 'A connected graph has 10 vertices and 25 edges. How many edges does its MST have?',
    options: ['9', ['10', 'A tree on V vertices has V − 1 edges.'], ['25', 'Most edges are dropped.'], ['It depends on the weights', 'The count is always V − 1; only which edges depends on weights.']],
    answer: 0,
    explanation: 'Every spanning tree of 10 vertices has exactly 9 edges.',
  }),
  mcq({
    ...base, id: 'dsa.mst.q3', type: 'concept', difficulty: 'medium',
    stem: 'Triangle with edges A–B 1, B–C 1, A–C 1.5. Which statement is true?',
    options: ['The MST excludes A–C, but the shortest A-to-C path uses it', ['The MST includes A–C', 'It is the heaviest edge on the cycle.'], ['The MST gives the shortest path from A to C', 'In the MST, A to C costs 2.'], ['There are two different MSTs', 'Weights are distinct except A–B and B–C, which are both needed.']],
    answer: 0,
    explanation: 'MST = {A–B, B–C}, total 2. Shortest A–C = 1.5 directly. MSTs minimise the total, not individual routes.',
  }),
  mcq({
    ...base, id: 'dsa.mst.q4', type: 'complexity', difficulty: 'medium',
    stem: 'For a complete graph on V vertices (E ≈ V²/2), which MST approach has the best time bound?',
    options: ['Prim with an array scan, O(V²)', ['Kruskal, O(E log E)', 'With E ≈ V², that is O(V² log V).'], ['Prim with a binary heap, O(E log V)', 'Also O(V² log V) here.'], ['Bellman-Ford', 'A shortest-path algorithm, and slower.']],
    answer: 0,
    explanation: 'The array version does V rounds of O(V) work and never materialises the edges.',
  }),
  mcq({
    ...base, id: 'dsa.mst.q5', type: 'pattern', difficulty: 'medium',
    stem: 'Each house can either dig its own well (cost w[i]) or connect to another house by a pipe (given costs). Minimum total cost to supply all houses?',
    options: ['Add a virtual vertex connected to each house with weight w[i], then compute an MST', ['Dijkstra from the cheapest well', 'This minimises routes, not the total.'], ['Build every well', 'Pipes may be cheaper.'], ['Topological sort of the pipes', 'Pipes are undirected and the goal is a total cost.']],
    answer: 0,
    explanation: 'Connecting to the virtual vertex means "has its own well". Any spanning tree of the extended graph supplies every house; the MST is the cheapest.',
  }),
  mcq({
    ...base, id: 'dsa.mst.q6', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    public static void main(String[] args) {
        int[][] p = {{0, 0}, {2, 2}, {3, 10}, {5, 2}, {7, 0}};
        int n = p.length, total = 0;
        int[] best = new int[n];
        java.util.Arrays.fill(best, Integer.MAX_VALUE);
        boolean[] in = new boolean[n];
        best[0] = 0;
        for (int it = 0; it < n; it++) {
            int u = -1;
            for (int v = 0; v < n; v++) if (!in[v] && (u == -1 || best[v] < best[u])) u = v;
            in[u] = true;
            total += best[u];
            for (int v = 0; v < n; v++)
                if (!in[v]) best[v] = Math.min(best[v], Math.abs(p[u][0] - p[v][0]) + Math.abs(p[u][1] - p[v][1]));
        }
        System.out.println(total);
    }
}`, 'Java', '20'),
    options: ['20', ['18', 'Recompute: (3,10) costs 9 from (2,2) or (5,2).'], ['21', 'Recount: the edges added cost 4, 3, 4 and 9.'], ['16', 'Too small: (3,10) alone costs at least 9.']],
    answer: 0,
    explanation: 'Prim adds (2,2) at 4, then (5,2) at 3, then (7,0) at 4, then (3,10) at 9. Total 4 + 3 + 4 + 9 = 20 (the LeetCode 1584 example).',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.mst.q7', type: 'edge-case', difficulty: 'easy',
    stem: 'Kruskal finishes after scanning all edges with only V − 3 accepted edges. What does that tell you?',
    options: ['The graph has 3 connected components, so no spanning tree exists', ['The MST has V − 3 edges', 'A spanning tree always has V − 1.'], ['There is a negative edge', 'Negative weights do not prevent an MST.'], ['The DSU is buggy', 'Not necessarily.']],
    answer: 0,
    explanation: 'Each accepted edge reduces the component count by one: V − (V − 3) = 3 components remain, so you have a minimum spanning forest.',
  }),
  mcq({
    ...base, id: 'dsa.mst.q8', type: 'pattern', difficulty: 'hard',
    stem: 'Swim in Rising Water: the cost of a path is the highest cell elevation on it. Which approach is NOT correct?',
    options: ['BFS counting the number of steps', ['Add cells in increasing elevation with a DSU until the corners connect', 'Correct: a minimax path.'], ['Dijkstra with max instead of sum', 'Correct.'], ['Binary search on the time and BFS through cells ≤ time', 'Correct.']],
    answer: 0,
    explanation: 'The number of steps is irrelevant; the objective is the bottleneck elevation. The three other approaches all minimise the maximum.',
  }),
];
