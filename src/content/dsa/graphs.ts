import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.graphs';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Graphs: BFS and DFS',
  summary: 'Representations, traversal on grids and graphs, components, cycles and bipartiteness.',
  level: 'core',
  status: 'complete',
  estMinutes: 110,
  prerequisites: ['dsa.stacks-queues', 'dsa.recursion'],
  related: ['dsa.topological-sort', 'dsa.dsu', 'dsa.shortest-paths', 'dsa.binary-trees', 'dsa.matrix'],
  subtopics: ['Adjacency list vs matrix', 'Grids as implicit graphs', 'DFS (recursive and iterative)', 'BFS and shortest paths in unweighted graphs', 'Connected components', 'Cycle detection', 'Bipartite check', 'Multi-source BFS'],
  objectives: [
    'Model a problem as a graph: what are the nodes and what are the edges?',
    'Write BFS and DFS on adjacency lists and on grids, with a correct visited set.',
    'Use BFS for shortest paths in unweighted graphs, including multi-source BFS.',
    'Count components, detect cycles (directed and undirected) and test bipartiteness.',
    'State O(V + E) complexity and choose BFS vs DFS for the question asked.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Graphs, representations and the two traversals',
      bodyMd: `A graph is a set of **vertices** joined by **edges** (directed or undirected, weighted or not). Many interview problems are graphs in disguise: grids (cells are nodes, neighbouring cells are edges), word ladders (words differing by one letter), course prerequisites, friend networks.

| Representation | Space | Check edge (u, v) | Iterate neighbours |
|---|---|---|---|
| Adjacency list | O(V + E) | O(deg u) | O(deg u) |
| Adjacency matrix | O(V²) | O(1) | O(V) |

Use adjacency lists for sparse graphs, which covers most interview inputs.

- **BFS** explores in layers using a queue. In an **unweighted** graph, the first time BFS reaches a node is along a **shortest path**.
- **DFS** goes deep first using recursion or a stack. It is natural for "explore everything reachable", components, cycle detection, topological order and backtracking.

**Mark visited when you enqueue (BFS), not when you dequeue**, or the same node can be queued many times.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Choosing BFS or DFS',
      bodyMd: `- "Minimum number of steps / moves / transformations" with equal-cost moves: **BFS**.
- "Rotting oranges", "walls and gates", "distance to nearest X": **multi-source BFS** (start with all sources in the queue at distance 0).
- "Count islands / connected groups", "can I reach", "flood fill": DFS or BFS (either works; DFS is shorter to write).
- "Is there a cycle?": undirected uses DFS with a parent check (or DSU); directed uses DFS with three colours (unvisited, in progress, done), or Kahn's algorithm.
- "Can we split into two groups with no edge inside a group?": **bipartite** check by 2-colouring with BFS/DFS.
- Weighted edges with different costs: BFS is no longer correct; use Dijkstra (see Shortest Paths).`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: number of islands (DFS flood fill)',
      bodyMd: 'Grid rows: ["110", "110", "001"]. Scan cells; each unvisited "1" starts a new island, and DFS sinks all connected land.',
      trace: [
        { note: '(0,0) is land and unvisited: islands = 1. DFS marks (0,0), (0,1), (1,0), (1,1).', vars: { islands: 1, visited: '(0,0)(0,1)(1,0)(1,1)' } },
        { note: 'Continue scanning: (0,1), (1,0), (1,1) are already visited; skip them.', vars: { islands: 1 } },
        { note: '(2,2) is land and unvisited: islands = 2. DFS finds no land neighbours.', vars: { islands: 2 } },
        { note: 'Done: 2 islands. Each cell is visited once and each of its 4 edges checked once, so O(R·C).', vars: { islands: 2 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Grid DFS (islands), BFS shortest path on a grid, and cycle detection in a directed graph with three colours.',
      code: [
        cpp(`
int numIslands(vector<vector<char>>& g) {
    int R = g.size(), C = g[0].size(), count = 0;
    function<void(int, int)> sink = [&](int r, int c) {
        if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] != '1') return;
        g[r][c] = '0';                                   // mark visited by modifying the grid
        sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
    };
    for (int r = 0; r < R; ++r)
        for (int c = 0; c < C; ++c)
            if (g[r][c] == '1') { ++count; sink(r, c); }
    return count;
}

// Shortest number of steps from (0,0) to (R-1,C-1) through '.' cells (4-directional), or -1.
int shortestPath(const vector<string>& g) {
    int R = g.size(), C = g[0].size();
    if (g[0][0] != '.') return -1;
    vector<vector<int>> dist(R, vector<int>(C, -1));
    queue<pair<int, int>> q;
    q.push({0, 0}); dist[0][0] = 0;                      // mark when enqueuing
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        pair<int, int> cur = q.front(); q.pop();
        int r = cur.first, c = cur.second;
        if (r == R - 1 && c == C - 1) return dist[r][c];
        for (int k = 0; k < 4; ++k) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] != '.' || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;
            q.push({nr, nc});
        }
    }
    return -1;
}

// Directed cycle detection: 0 = unvisited, 1 = on the current path, 2 = finished.
bool hasCycle(int n, const vector<vector<int>>& adj) {
    vector<int> state(n, 0);
    function<bool(int)> dfs = [&](int u) {
        state[u] = 1;
        for (int v : adj[u]) {
            if (state[v] == 1) return true;              // back edge to the current path
            if (state[v] == 0 && dfs(v)) return true;
        }
        state[u] = 2;
        return false;
    };
    for (int u = 0; u < n; ++u) if (state[u] == 0 && dfs(u)) return true;
    return false;
}`, 'C++'),
        java(`
int numIslands(char[][] g) {
    int count = 0;
    for (int r = 0; r < g.length; r++)
        for (int c = 0; c < g[0].length; c++)
            if (g[r][c] == '1') { count++; sink(g, r, c); }
    return count;
}
void sink(char[][] g, int r, int c) {
    if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;
    g[r][c] = '0';
    sink(g, r + 1, c); sink(g, r - 1, c); sink(g, r, c + 1); sink(g, r, c - 1);
}

int shortestPath(String[] g) {
    int R = g.length, C = g[0].length();
    if (g[0].charAt(0) != '.') return -1;
    int[][] dist = new int[R][C];
    for (int[] row : dist) Arrays.fill(row, -1);
    Deque<int[]> q = new ArrayDeque<>();
    q.offer(new int[]{0, 0}); dist[0][0] = 0;
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!q.isEmpty()) {
        int[] cur = q.poll();
        if (cur[0] == R - 1 && cur[1] == C - 1) return dist[cur[0]][cur[1]];
        for (int[] d : dirs) {
            int nr = cur[0] + d[0], nc = cur[1] + d[1];
            if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr].charAt(nc) != '.' || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[cur[0]][cur[1]] + 1;
            q.offer(new int[]{nr, nc});
        }
    }
    return -1;
}

boolean hasCycle(int n, List<List<Integer>> adj) {
    int[] state = new int[n];
    for (int u = 0; u < n; u++) if (state[u] == 0 && dfs(u, adj, state)) return true;
    return false;
}
boolean dfs(int u, List<List<Integer>> adj, int[] state) {
    state[u] = 1;
    for (int v : adj.get(u)) {
        if (state[v] == 1) return true;
        if (state[v] == 0 && dfs(v, adj, state)) return true;
    }
    state[u] = 2;
    return false;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- BFS and DFS visit each vertex once and examine each edge once (twice for undirected graphs): **O(V + E) time**. On an R × C grid, V = R·C and E ≈ 4·R·C, so O(R·C).
- Space: O(V) for visited plus the queue or recursion stack. Recursive DFS on a 1000 × 1000 grid can reach depth 10⁶ and overflow the stack; use iterative DFS or BFS for big grids.
- Building an adjacency list from an edge list: O(V + E).`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Marking visited on dequeue instead of enqueue** in BFS: nodes get queued many times (wrong distances or TLE).
2. **Forgetting disconnected components:** loop over all vertices and start a traversal from each unvisited one.
3. **Undirected cycle detection without a parent check**: every edge looks like a cycle back to the parent.
4. **Directed cycle detection with a single visited flag**: reaching an already-finished node is *not* a cycle. You need the "on current path" state.
5. **Using BFS for weighted shortest paths**: wrong when weights differ (use Dijkstra or 0-1 BFS).
6. **Grid bounds checks in the wrong order:** check \`r\` and \`c\` are in range *before* reading \`g[r][c]\`.
7. **Recursion depth** on large grids: prefer iterative traversal when R·C is large.`,
    },
  ],
  recognition: {
    signals: ['Relations between entities (prerequisites, friendships, flights, word transformations)', 'Grids with moves between neighbouring cells', 'Minimum steps with equal-cost moves: BFS', 'Groups, regions, reachability, cycles'],
    antiSignals: ['Weighted edges with different costs: Dijkstra', 'Ordering with dependencies: topological sort', 'Dynamic connectivity with many union queries: DSU'],
    decisionQuestions: ['What are the nodes, and what are the edges?', 'Do I need the shortest number of steps (BFS) or just reachability or structure (DFS)?', 'Directed or undirected? Weighted or not?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Why does BFS give shortest paths in unweighted graphs?', answerMd: 'BFS processes vertices in non-decreasing distance order: all vertices at distance d are dequeued before any at d + 1. So the first time a vertex is discovered, it is via a path with the fewest edges.' },
    { id: 'iq2', q: 'How do you detect a cycle in a directed graph?', answerMd: 'DFS with three states: unvisited, visiting (on the recursion stack) and done. An edge to a "visiting" node is a back edge, which means a cycle. Alternatively, Kahn\'s topological sort: if not all nodes are output, there is a cycle. O(V + E).' },
    { id: 'iq3', q: 'Adjacency list or matrix?', answerMd: 'A list uses O(V + E) space and iterates neighbours in O(deg); it is best for sparse graphs. A matrix uses O(V²) space but answers "is there an edge" in O(1); it is good for dense graphs or Floyd-Warshall. Interview inputs are usually sparse, so use a list.' },
    { id: 'iq4', q: 'What is multi-source BFS and when is it used?', answerMd: 'Initialise the queue with all source nodes at distance 0, then run normal BFS. Every node gets its distance to the nearest source in one O(V + E) pass. It is used for rotting oranges, walls and gates, and distance to the nearest 0.' },
    { id: 'iq5', q: 'How do you check whether a graph is bipartite?', answerMd: 'Try to 2-colour it with BFS/DFS: colour a start node 0 and neighbours the opposite colour. If an edge ever connects two nodes of the same colour, it is not bipartite. Run it from every uncoloured node to cover all components. O(V + E).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Model first: nodes and edges (grids are implicit graphs).
- BFS = shortest steps in unweighted graphs; mark visited on enqueue.
- Multi-source BFS: push all sources first.
- DFS for components, flood fill, cycles, topological order.
- Directed cycle: 3 colours (on-path means a cycle). Undirected: skip the parent (or DSU).
- Bipartite: 2-colour, and a conflict means not bipartite.
- O(V + E). Watch recursion depth on big grids.`,
    flashcards: [
      { id: 'f1', front: 'When should BFS mark a node as visited?', backMd: 'When it is enqueued, not when dequeued, to prevent duplicates in the queue.' },
      { id: 'f2', front: 'Directed cycle detection with DFS?', backMd: 'Three states; an edge to a node currently on the recursion stack is a cycle.' },
      { id: 'f3', front: 'Distance from every cell to the nearest 0?', backMd: 'Multi-source BFS starting from all 0 cells at distance 0.' },
      { id: 'f4', front: 'Complexity of BFS/DFS?', backMd: 'O(V + E) time, O(V) space.' },
      { id: 'f5', front: 'Bipartite test?', backMd: '2-colour with BFS/DFS; same-colour neighbours mean not bipartite.' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 14, passPct: 80, minIndependentSolves: 4, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Breadth-first search (cp-algorithms)', url: 'https://cp-algorithms.com/graph/breadth-first-search.html', kind: 'article' },
    { title: 'Depth-first search (cp-algorithms)', url: 'https://cp-algorithms.com/graph/depth-first-search.html', kind: 'article' },
    { title: 'Graph Traversal (USACO Guide)', url: 'https://usaco.guide/silver/graph-traversal', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.graphs.q1', type: 'pattern', difficulty: 'easy',
    stem: 'Find the minimum number of moves for a knight to go from one square to another on an 8×8 board. Best traversal?',
    options: ['BFS from the start square', ['DFS from the start square', 'DFS finds a path, not necessarily the shortest one.'], ['Dijkstra', 'Correct but unnecessary: all moves cost 1.'], ['Topological sort', 'The graph is not a DAG and order is irrelevant.']],
    answer: 0,
    explanation: 'Every move costs 1, so BFS layers equal move counts; the first time the target is dequeued gives the minimum.',
  }),
  mcq({
    ...base, id: 'dsa.graphs.q2', type: 'debug', difficulty: 'medium',
    stem: 'A BFS marks a node as visited only when it is **dequeued**. On a dense graph it times out. Why?',
    options: ['The same node can be enqueued many times before it is first dequeued, blowing up the queue', ['BFS should use a stack', 'That would be DFS.'], ['Visited sets are slow', 'Lookups are O(1).'], ['Dense graphs always need Dijkstra', 'Not for unweighted graphs.']],
    answer: 0,
    explanation: 'Each neighbour sees the node as unvisited and enqueues it again. Mark visited (or set its distance) at enqueue time, so each node enters the queue once.',
  }),
  mcq({
    ...base, id: 'dsa.graphs.q3', type: 'concept', difficulty: 'medium',
    stem: 'In a directed graph, DFS reaches a node that is already marked **finished** (not on the current path). What does this mean?',
    options: ['Nothing special: it is a cross or forward edge, not a cycle', ['A cycle exists', 'Only an edge to a node on the current path (in progress) indicates a cycle.'], ['The graph is disconnected', 'Unrelated.'], ['The graph is bipartite', 'Unrelated.']],
    answer: 0,
    explanation: 'Example: edges A→B, A→C, C→B. After finishing B, visiting C finds B finished, with no cycle. That is why directed cycle detection needs three states.',
  }),
  mcq({
    ...base, id: 'dsa.graphs.q4', type: 'complexity', difficulty: 'easy',
    stem: 'What is the time complexity of BFS on a graph stored as an adjacency list?',
    options: ['O(V + E)', ['O(V²)', 'That is with an adjacency matrix.'], ['O(E log V)', 'That is Dijkstra with a heap.'], ['O(V · E)', 'Each edge is examined a constant number of times.']],
    answer: 0,
    explanation: 'Each vertex is enqueued and dequeued once, and each adjacency list is scanned once.',
  }),
  mcq({
    ...base, id: 'dsa.graphs.q5', type: 'pattern', difficulty: 'medium',
    stem: 'In a grid of fresh (1) and rotten (2) oranges, each minute rotten oranges rot their 4 neighbours. Minimum minutes until all are rotten?',
    options: ['Multi-source BFS starting from all rotten oranges simultaneously', ['BFS from each rotten orange separately, taking the minimum', 'Repeating BFS per source is O(k·R·C).'], ['DFS from the first rotten orange', 'DFS does not produce time layers.'], ['Count fresh oranges', 'Counting ignores distances.']],
    answer: 0,
    explanation: 'All rotten oranges spread in parallel, which is exactly BFS with multiple sources at time 0. The answer is the last layer reached (or −1 if fresh oranges remain).',
  }),
  mcq({
    ...base, id: 'dsa.graphs.q6', type: 'edge-case', difficulty: 'medium',
    stem: 'An undirected cycle-detection DFS reports a cycle for the graph with the single edge 0–1. What was forgotten?',
    options: ['Ignoring the edge back to the parent node', ['Marking nodes visited', 'Without marking, it would loop forever.'], ['Using three colours', 'Three colours are for directed graphs.'], ['Sorting the adjacency lists', 'Order does not matter.']],
    answer: 0,
    explanation: 'From 1, the neighbour 0 is visited, but it is just the parent we came from, not a cycle. Pass the parent and skip it (careful with parallel edges).',
  }),
  mcq({
    ...base, id: 'dsa.graphs.q7', type: 'concept', difficulty: 'easy',
    stem: 'Which representation is best for a sparse graph with 10⁵ vertices and 2·10⁵ edges?',
    options: ['Adjacency list', ['Adjacency matrix', '10¹⁰ cells: far too much memory.'], ['Edge list only', 'Finding neighbours would need a full scan.'], ['Incidence matrix', 'V × E entries: far too large.']],
    answer: 0,
    explanation: 'An adjacency list uses O(V + E) memory and gives fast neighbour iteration.',
  }),
  mcq({
    ...base, id: 'dsa.graphs.q8', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print (BFS distances from node 0)?',
    code: cpp(`#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main() {
    int n = 5;
    vector<vector<int>> adj(n);
    int edges[][2] = {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}};
    for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
    vector<int> dist(n, -1);
    queue<int> q; q.push(0); dist[0] = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    for (int d : dist) cout << d << " ";
    cout << endl;
    return 0;
}`, 'C++', '0 1 1 2 3'),
    options: ['0 1 1 2 3', ['0 1 2 3 4', 'Node 2 is adjacent to 0.'], ['0 1 1 3 4', 'Node 3 is two steps away (0–1–3).'], ['0 1 1 2 2', 'Node 4 is only reachable through 3.']],
    answer: 0,
    explanation: 'Distance 1: nodes 1 and 2. Distance 2: node 3 (via 1 or 2). Distance 3: node 4.',
    verified: 'compiled',
  }),
];
