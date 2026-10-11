import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.shortest-paths';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Shortest Paths',
  summary: 'BFS, 0-1 BFS, Dijkstra, Bellman-Ford and Floyd-Warshall, and when to use each.',
  level: 'core',
  status: 'complete',
  estMinutes: 95,
  prerequisites: ['dsa.graphs', 'dsa.heaps'],
  related: ['dsa.graphs', 'dsa.heaps', 'dsa.topological-sort', 'dsa.mst', 'dsa.dsu'],
  subtopics: ['Unweighted: BFS', 'Multi-source BFS', '0-1 BFS with a deque', 'Dijkstra with a heap and lazy deletion', 'Bellman-Ford and at most k edges', 'Floyd-Warshall for all pairs', 'Path reconstruction'],
  objectives: [
    'Pick the right algorithm from the edge weights: unit (BFS), 0/1 (deque), non-negative (Dijkstra), negative (Bellman-Ford), all pairs on small graphs (Floyd-Warshall).',
    'Implement Dijkstra with a min-heap and lazy deletion, and explain why it fails with negative edges.',
    'Use Bellman-Ford rounds to limit the number of edges (Cheapest Flights Within K Stops) and to detect negative cycles.',
    'Run multi-source BFS for "distance to the nearest X" grids.',
    'Reconstruct a shortest path from a parent array and adapt Dijkstra to other path costs (maximum edge, product of probabilities).',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Choose by edge weights',
      bodyMd: `| Graph | Algorithm | Time |
|---|---|---|
| Unweighted (every edge costs 1) | **BFS** | O(V + E) |
| Weights 0 or 1 | **0-1 BFS** (deque: 0-edges to the front, 1-edges to the back) | O(V + E) |
| Non-negative weights | **Dijkstra** with a binary heap | O((V + E) log V) |
| Negative weights, no negative cycle; or "at most k edges" | **Bellman-Ford** | O(V · E) (or O(k · E)) |
| DAG, any weights | Relax in **topological order** | O(V + E) |
| All pairs, V ≤ ~400 | **Floyd-Warshall** | O(V³) |

**Relaxation** is the shared step: if \`dist[u] + w < dist[v]\`, improve \`dist[v]\` (and record \`parent[v] = u\`). The algorithms differ only in the order in which they relax edges.

**Dijkstra's invariant:** when a vertex is popped from the min-heap with the smallest tentative distance, that distance is final, because every other route must go through a vertex with an equal or larger distance and can only add non-negative weight. A negative edge breaks exactly this argument.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Variants that come up in interviews',
      bodyMd: `- **Multi-source BFS** (Rotting Oranges, 01 Matrix, Walls and Gates): push every source at distance 0, then run one BFS. Each cell gets the distance to its nearest source. O(cells).
- **Lazy deletion in Dijkstra:** standard library heaps cannot decrease a key, so push a new (dist, v) pair on every improvement and **skip popped pairs whose dist is larger than dist[v]**. The heap holds O(E) entries; complexity stays O(E log V).
- **Different path costs.** Dijkstra works whenever extending a path never makes it better:
  - Path With Minimum Effort / Swim in Rising Water: cost of a path = the **maximum** edge on it; relax with \`max(dist[u], w)\`.
  - Path with Maximum Probability: maximise a **product** of probabilities in [0, 1]; use a max-heap.
- **Limited edges** (Cheapest Flights Within K Stops): run k + 1 rounds of Bellman-Ford, relaxing from a **copy** of the previous round's distances so that one round adds at most one edge.
- **Grid with obstacles to remove** (Minimum Obstacle Removal): moving into an obstacle costs 1, into an empty cell 0 → 0-1 BFS.
- **Count the shortest paths** (Number of Ways to Arrive at Destination): in Dijkstra, when you find an equal distance add the ways; when you find a smaller one, replace them.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: Dijkstra from A',
      bodyMd: 'Edges: A→B 4, A→C 1, C→B 2, B→D 1, C→D 5. Distances shown in the order [A, B, C, D].',
      trace: [
        { note: 'dist = [0, ∞, ∞, ∞]; heap {(0, A)}.', array: [0, '∞', '∞', '∞'], vars: { heap: '(0,A)' } },
        { note: 'Pop A. Relax A→B: 4; A→C: 1.', array: [0, 4, 1, '∞'], highlight: [1, 2], vars: { heap: '(1,C) (4,B)' } },
        { note: 'Pop C (1). Relax C→B: 1 + 2 = 3 < 4; C→D: 6.', array: [0, 3, 1, 6], highlight: [1, 3], vars: { heap: '(3,B) (4,B) (6,D)' } },
        { note: 'Pop B (3). Relax B→D: 4 < 6.', array: [0, 3, 1, 4], highlight: [3], vars: { heap: '(4,B) (4,D) (6,D)' } },
        { note: 'Pop (4, B): stale (4 > dist[B] = 3), skip. Pop D (4): final. (6, D) is stale too.', array: [0, 3, 1, 4], vars: { path: 'A → C → B → D' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Dijkstra with lazy deletion (Network Delay Time), Bellman-Ford with k stops, and 0-1 BFS on a grid.',
      code: [
        cpp(`
// times[i] = {u, v, w}, vertices 1..n. Returns the time for all to receive the signal, or -1.
int networkDelayTime(const vector<vector<int>>& times, int n, int src) {
    vector<vector<pair<int, int>>> g(n + 1);
    for (auto& t : times) g[t[0]].push_back({t[1], t[2]});
    const long long INF = LLONG_MAX;
    vector<long long> dist(n + 1, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;
    dist[src] = 0; pq.push({0, src});
    while (!pq.empty()) {
        long long d = pq.top().first; int u = pq.top().second; pq.pop();
        if (d > dist[u]) continue;                       // stale entry
        for (auto& e : g[u]) {
            int v = e.first, w = e.second;
            if (d + w < dist[v]) { dist[v] = d + w; pq.push({dist[v], v}); }
        }
    }
    long long best = 0;
    for (int v = 1; v <= n; ++v) { if (dist[v] == INF) return -1; best = max(best, dist[v]); }
    return (int)best;
}

// At most k stops = at most k + 1 edges: k + 1 rounds, each relaxing from the previous round.
int findCheapestPrice(int n, const vector<vector<int>>& flights, int src, int dst, int k) {
    const int INF = INT_MAX;
    vector<int> dist(n, INF);
    dist[src] = 0;
    for (int round = 0; round <= k; ++round) {
        vector<int> next = dist;
        for (auto& f : flights)
            if (dist[f[0]] != INF && dist[f[0]] + f[2] < next[f[1]]) next[f[1]] = dist[f[0]] + f[2];
        dist = next;
    }
    return dist[dst] == INF ? -1 : dist[dst];
}

// 0-1 BFS: stepping onto an obstacle (1) costs 1, onto an empty cell (0) costs 0.
int minimumObstacles(const vector<vector<int>>& grid) {
    int R = grid.size(), C = grid[0].size();
    vector<vector<int>> dist(R, vector<int>(C, INT_MAX));
    deque<pair<int, int>> dq;
    dist[0][0] = 0; dq.push_back({0, 0});
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!dq.empty()) {
        int r = dq.front().first, c = dq.front().second; dq.pop_front();
        for (int k = 0; k < 4; ++k) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
            int w = grid[nr][nc];
            if (dist[r][c] + w < dist[nr][nc]) {
                dist[nr][nc] = dist[r][c] + w;
                if (w == 0) dq.push_front({nr, nc}); else dq.push_back({nr, nc});
            }
        }
    }
    return dist[R - 1][C - 1];
}`, 'C++'),
        java(`
int networkDelayTime(int[][] times, int n, int src) {
    List<List<int[]>> g = new ArrayList<>();
    for (int i = 0; i <= n; i++) g.add(new ArrayList<>());
    for (int[] t : times) g.get(t[0]).add(new int[] {t[1], t[2]});
    long[] dist = new long[n + 1];
    Arrays.fill(dist, Long.MAX_VALUE);
    PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
    dist[src] = 0; pq.add(new long[] {0, src});
    while (!pq.isEmpty()) {
        long[] top = pq.poll();
        long d = top[0]; int u = (int) top[1];
        if (d > dist[u]) continue;
        for (int[] e : g.get(u)) {
            if (d + e[1] < dist[e[0]]) { dist[e[0]] = d + e[1]; pq.add(new long[] {dist[e[0]], e[0]}); }
        }
    }
    long best = 0;
    for (int v = 1; v <= n; v++) { if (dist[v] == Long.MAX_VALUE) return -1; best = Math.max(best, dist[v]); }
    return (int) best;
}

int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    for (int round = 0; round <= k; round++) {
        int[] next = dist.clone();
        for (int[] f : flights)
            if (dist[f[0]] != Integer.MAX_VALUE && dist[f[0]] + f[2] < next[f[1]]) next[f[1]] = dist[f[0]] + f[2];
        dist = next;
    }
    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}

int minimumObstacles(int[][] grid) {
    int R = grid.length, C = grid[0].length;
    int[][] dist = new int[R][C];
    for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
    Deque<int[]> dq = new ArrayDeque<>();
    dist[0][0] = 0; dq.add(new int[] {0, 0});
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!dq.isEmpty()) {
        int[] cur = dq.pollFirst();
        for (int[] d : dirs) {
            int nr = cur[0] + d[0], nc = cur[1] + d[1];
            if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
            int w = grid[nr][nc];
            if (dist[cur[0]][cur[1]] + w < dist[nr][nc]) {
                dist[nr][nc] = dist[cur[0]][cur[1]] + w;
                if (w == 0) dq.addFirst(new int[] {nr, nc}); else dq.addLast(new int[] {nr, nc});
            }
        }
    }
    return dist[R - 1][C - 1];
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- BFS and 0-1 BFS: O(V + E). On a grid with R × C cells: O(RC).
- Dijkstra with a binary heap and lazy deletion: **O(E log V)** (the heap holds up to E entries, and log E ≤ 2 log V). With a Fibonacci heap O(E + V log V), which is a theory answer only.
- Dijkstra with an O(V²) array scan is better for dense graphs (E ≈ V²), for example Min Cost to Connect All Points style complete graphs.
- Bellman-Ford: O(V · E); with k limited rounds O(k · E). A V-th round that still relaxes something proves a reachable negative cycle.
- Floyd-Warshall: O(V³) time, O(V²) space. Loop order is k (intermediate) outermost.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Dijkstra with negative edges.** It can finalise a vertex too early. Use Bellman-Ford (or a DAG order).
2. **No stale-entry check** with lazy deletion: correct but can be much slower, and some variants (counting paths) become wrong.
3. **Marking visited when pushing** instead of when popping in Dijkstra: a later, cheaper route to that vertex is then ignored.
4. **Bellman-Ford for k stops relaxing in place:** one round can then chain several edges, violating the stop limit. Relax from a copy.
5. **Overflow** when adding to INT_MAX "infinity". Check \`dist[u] != INF\` first or use 64-bit distances.
6. **BFS on weighted graphs.** BFS counts edges, not weights.
7. **Floyd-Warshall with the k loop inside**, which gives wrong results.`,
    },
  ],
  recognition: {
    signals: ['Minimum cost, time, steps or effort from a source', 'Grid with moves of cost 1 (BFS) or 0/1 (deque)', '"Distance to the nearest …" from many sources', 'At most k edges/stops', 'All-pairs distances on a small graph'],
    antiSignals: ['Connect everything at minimum total cost: MST, not shortest paths', 'Longest path in a general graph: NP-hard; only a DAG makes it easy', 'Just reachability: plain BFS/DFS or DSU'],
    decisionQuestions: ['What are the edge weights: 1, 0/1, non-negative, negative?', 'Single source, many sources, or all pairs?', 'Is there a limit on the number of edges?', 'Is the path cost a sum, a maximum or a product?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Why does Dijkstra fail with negative edge weights?', answerMd: 'Dijkstra finalises the vertex with the smallest tentative distance, assuming no later path can be cheaper because weights only add. A negative edge discovered later can lower the distance of an already-finalised vertex. Example: A→B 2, A→C 3, C→B −2: Dijkstra finalises B at 2, but A→C→B costs 1.' },
    { id: 'iq2', q: 'Cheapest Flights Within K Stops: why not plain Dijkstra?', answerMd: 'The cheapest path may use too many stops, and a more expensive path with fewer stops may be the only valid one; Dijkstra keyed only on cost discards it. Use Bellman-Ford with k + 1 rounds relaxing from a copy, O(k · E), or Dijkstra/BFS over states (city, stops used).' },
    { id: 'iq3', q: 'How do you find the distance from every cell to the nearest 0 in a matrix?', answerMd: 'Multi-source BFS: push all 0 cells with distance 0, then BFS. The first time a cell is reached is through its nearest 0. O(R · C). Running a BFS from every 1 would be O((RC)²).' },
    { id: 'iq4', q: 'What is 0-1 BFS?', answerMd: 'For edge weights in {0, 1}: use a deque; when relaxing through a 0-edge push to the front, through a 1-edge push to the back. The deque stays sorted by distance (at most two distinct values), so it behaves like Dijkstra in O(V + E).' },
    { id: 'iq5', q: 'How do you reconstruct the actual shortest path?', answerMd: 'Keep parent[v] = u whenever relaxation improves dist[v]. After the algorithm, walk parent pointers from the target back to the source and reverse the list. If dist[target] is infinite, there is no path.' },
    { id: 'iq6', q: 'When would you use Floyd-Warshall?', answerMd: 'All-pairs shortest paths on small dense graphs (V up to a few hundred), or when you need every distance, for example "the city with the fewest reachable neighbours within a threshold". dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]) with k outermost; O(V³). It handles negative edges; dist[i][i] < 0 reveals a negative cycle.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Unit → BFS; 0/1 → deque; non-negative → Dijkstra; negative / ≤ k edges → Bellman-Ford; DAG → topo order; all pairs small → Floyd-Warshall.
- Dijkstra: min-heap of (dist, v); skip if d > dist[v]; O(E log V).
- Bellman-Ford with k stops: k + 1 rounds from a copy.
- Multi-source BFS for nearest-source distances.
- Path costs as max (effort) or product (probability) still work with Dijkstra.
- Guard INF + w overflow.`,
    flashcards: [
      { id: 'f1', front: 'Shortest path with edge weights 0 and 1?', backMd: '0-1 BFS with a deque: 0-edges to the front, 1-edges to the back. O(V + E).' },
      { id: 'f2', front: 'Lazy deletion in Dijkstra?', backMd: 'Push a new pair on every improvement; when popping, skip pairs with d > dist[v].' },
      { id: 'f3', front: 'Why relax from a copy in Bellman-Ford with k stops?', backMd: 'So each round adds at most one edge to any path.' },
      { id: 'f4', front: 'Floyd-Warshall loop order?', backMd: 'k (intermediate vertex) outermost, then i, then j.' },
      { id: 'f5', front: 'Dijkstra complexity with a binary heap?', backMd: 'O((V + E) log V), usually written O(E log V).' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 14, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: "Dijkstra's algorithm (Wikipedia)", url: 'https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm', kind: 'article' },
    { title: 'Bellman-Ford algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Bellman%E2%80%93Ford_algorithm', kind: 'article' },
    { title: 'Network Delay Time (LeetCode 743)', url: 'https://leetcode.com/problems/network-delay-time/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.sp.q1', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Dijkstra program print (distances from vertex 0)?',
    code: cpp(`#include <iostream>
#include <vector>
#include <queue>
#include <climits>
using namespace std;
int main() {
    int n = 4;
    vector<vector<pair<int, int>>> g(n);
    g[0].push_back({1, 4}); g[0].push_back({2, 1});
    g[2].push_back({1, 2}); g[1].push_back({3, 1}); g[2].push_back({3, 5});
    vector<int> dist(n, INT_MAX);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    dist[0] = 0; pq.push({0, 0});
    while (!pq.empty()) {
        int d = pq.top().first, u = pq.top().second; pq.pop();
        if (d > dist[u]) continue;
        for (auto& e : g[u])
            if (d + e.second < dist[e.first]) { dist[e.first] = d + e.second; pq.push({dist[e.first], e.first}); }
    }
    for (int x : dist) cout << x << " ";
    cout << endl;
    return 0;
}`, 'C++', '0 3 1 4'),
    options: ['0 3 1 4', ['0 4 1 5', 'The route 0 → 2 → 1 (cost 3) beats the direct edge (4).'], ['0 4 1 6', 'Both improvements are missed.'], ['0 3 1 6', 'Once dist[1] = 3, edge 1 → 3 gives 4.']],
    answer: 0,
    explanation: 'dist[2] = 1, dist[1] = min(4, 1 + 2) = 3, dist[3] = min(1 + 5, 3 + 1) = 4.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.sp.q2', type: 'pattern', difficulty: 'easy',
    stem: 'Minimum number of moves for a knight on an empty board from one square to another. Which algorithm?',
    options: ['BFS', ['Dijkstra', 'Works, but every move costs 1, so BFS is simpler and faster.'], ['Bellman-Ford', 'Far too slow for unit weights.'], ['DFS', 'DFS does not find shortest paths.']],
    answer: 0,
    explanation: 'Unweighted moves: the first time BFS reaches the target is along a minimum number of moves.',
  }),
  mcq({
    ...base, id: 'dsa.sp.q3', type: 'concept', difficulty: 'medium',
    stem: 'Edges A→B 2, A→C 3, C→B −2. Dijkstra from A pops B with distance 2 before exploring C. What is the true shortest distance to B?',
    options: ['1, via A → C → B', ['2, Dijkstra is right', 'A → C → B = 3 − 2 = 1.'], ['3', 'That is the distance to C.'], ['−2', 'The path must start at A.']],
    answer: 0,
    explanation: 'Negative edges break the "popped means final" invariant. Bellman-Ford handles this graph.',
  }),
  mcq({
    ...base, id: 'dsa.sp.q4', type: 'debug', difficulty: 'hard',
    stem: 'A K-stops solution runs k + 1 rounds of Bellman-Ford but updates `dist` in place within each round. What can go wrong?',
    options: ['A single round can chain several edges, so a path with too many stops is accepted', ['It becomes O(V³)', 'The complexity does not change.'], ['It cannot find any path', 'It finds paths, sometimes invalid ones.'], ['Nothing; in-place is an optimisation', 'It breaks the edge-count limit.']],
    answer: 0,
    explanation: 'With in-place updates, relaxing A→B and then B→C in the same round builds a two-edge path in one round. Relax from the previous round\'s copy.',
  }),
  mcq({
    ...base, id: 'dsa.sp.q5', type: 'complexity', difficulty: 'easy',
    stem: 'Time complexity of Dijkstra with a binary heap on V vertices and E edges?',
    options: ['O(E log V)', ['O(V + E)', 'That is BFS.'], ['O(V · E)', 'That is Bellman-Ford.'], ['O(V³)', 'That is Floyd-Warshall.']],
    answer: 0,
    explanation: 'Each edge relaxation may push into the heap (O(log V)), and each pop costs O(log V).',
  }),
  mcq({
    ...base, id: 'dsa.sp.q6', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        int n = 4, src = 0, dst = 3;
        int[][] flights = {{0, 1, 100}, {1, 2, 100}, {2, 3, 100}, {0, 3, 500}, {1, 3, 600}};
        for (int k = 0; k <= 2; k++) {
            int[] dist = new int[n];
            Arrays.fill(dist, Integer.MAX_VALUE);
            dist[src] = 0;
            for (int r = 0; r <= k; r++) {
                int[] next = dist.clone();
                for (int[] f : flights)
                    if (dist[f[0]] != Integer.MAX_VALUE && dist[f[0]] + f[2] < next[f[1]]) next[f[1]] = dist[f[0]] + f[2];
                dist = next;
            }
            System.out.print(dist[dst] + " ");
        }
        System.out.println();
    }
}`, 'Java', '500 500 300'),
    options: ['500 500 300', ['500 300 300', 'With 1 stop the options are 0→3 (500) and 0→1→3 (700).'], ['300 300 300', 'The 300 route needs 2 stops.'], ['500 700 300', 'The direct flight (500) is still allowed with 1 stop.']],
    answer: 0,
    explanation: 'k = 0: only direct, 500. k = 1: min(500, 100 + 600) = 500. k = 2: 0→1→2→3 = 300.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.sp.q7', type: 'pattern', difficulty: 'medium',
    stem: 'Path With Minimum Effort defines a path\'s cost as the maximum height difference along it. Which change adapts Dijkstra?',
    options: ['Relax with new = max(dist[u], w) instead of dist[u] + w', ['Use a max-heap', 'We still minimise the cost.'], ['Use BFS', 'Edges have different weights.'], ['Negate all weights', 'The issue is the combine operation, not the sign.']],
    answer: 0,
    explanation: 'Extending a path never lowers its maximum, so the "popped means final" argument still holds with max as the combine operation.',
  }),
  mcq({
    ...base, id: 'dsa.sp.q8', type: 'scenario', difficulty: 'medium',
    stem: 'A grid has fresh and rotten oranges; each minute rot spreads to 4-neighbours. How do you find when the last orange rots?',
    options: ['Multi-source BFS starting from every rotten orange at time 0', ['A BFS from each fresh orange to the nearest rotten one', 'Correct but O((RC)²).'], ['Dijkstra from the top-left cell', 'There are many sources and unit weights.'], ['DFS from each rotten orange', 'DFS does not give minimum times.']],
    answer: 0,
    explanation: 'All rotten oranges spread simultaneously, which is exactly a BFS with many sources. The answer is the last BFS level, or −1 if a fresh orange is never reached.',
  }),
];
