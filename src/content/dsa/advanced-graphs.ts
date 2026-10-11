import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.advanced-graphs';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Advanced Graphs',
  summary: 'Strongly connected components, bridges, articulation points and Euler paths.',
  level: 'advanced',
  status: 'complete',
  estMinutes: 110,
  prerequisites: ['dsa.graphs'],
  related: ['dsa.graphs', 'dsa.topological-sort', 'dsa.dsu', 'dsa.shortest-paths'],
  subtopics: ['DFS discovery times and low-links', 'Bridges (critical connections)', 'Articulation points', 'Strongly connected components (Tarjan, Kosaraju)', 'Euler paths and circuits (Hierholzer)', 'Eventual safe states'],
  objectives: [
    'Compute DFS discovery times and low-link values, and use them to find bridges and articulation points in O(V + E).',
    'Find strongly connected components with Tarjan or Kosaraju, and explain the condensation DAG.',
    'State the existence conditions for Euler paths and circuits in undirected and directed graphs.',
    "Build an Euler path with Hierholzer's algorithm (Reconstruct Itinerary, Valid Arrangement of Pairs).",
    'Recognise which advanced tool a problem needs from its wording (critical edges, mutual reachability, use every edge once).',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'What each tool finds',
      bodyMd: `| Question | Tool | Time |
|---|---|---|
| Which edges disconnect the graph if removed? (undirected) | **Bridges** via low-links | O(V + E) |
| Which vertices disconnect it? (undirected) | **Articulation points** via low-links | O(V + E) |
| Which groups of vertices can all reach each other? (directed) | **SCC**: Tarjan or Kosaraju | O(V + E) |
| A walk that uses every edge exactly once | **Euler path/circuit**: Hierholzer | O(E) (+ sorting for lexicographic order) |
| Which nodes never reach a cycle? (directed) | reverse graph + Kahn, or DFS colours | O(V + E) |

**Low-link.** Run DFS and record \`tin[v]\`, the time v was discovered. \`low[v]\` is the smallest discovery time reachable from v's DFS subtree using tree edges downwards plus **one** back edge. Then, for a tree edge u → v:
- **(u, v) is a bridge** iff \`low[v] > tin[u]\`: nothing in v's subtree can climb back to u or above without that edge.
- **u is an articulation point** iff \`low[v] ≥ tin[u]\` for some child v (and, for the DFS root, iff it has at least two DFS children).

**SCCs** partition a directed graph into maximal mutually reachable groups. Contracting each SCC to one vertex gives a **DAG** (the condensation), on which topological sorting and DP apply.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Euler paths and the SCC algorithms',
      bodyMd: `**Euler conditions** (for the vertices that have edges, which must be connected):
- Undirected circuit: every vertex has even degree. Undirected path: exactly 0 or 2 vertices of odd degree (start at one of them).
- Directed circuit: in-degree = out-degree everywhere. Directed path: one vertex with out − in = 1 (the start), one with in − out = 1 (the end), all others balanced.

**Hierholzer's algorithm:** from the start vertex, keep following unused edges; when you get stuck, append the vertex to the answer and backtrack. The answer, reversed, is the Euler path. Each edge is used once: O(E). For Reconstruct Itinerary, take outgoing edges in lexicographic order (a min-heap or a sorted list consumed from the front) to get the smallest itinerary.

**Kosaraju:** (1) DFS the graph and record vertices in order of finishing; (2) DFS the **reversed** graph in decreasing finish order; each DFS tree of the second pass is one SCC. Simple to explain, needs the reversed graph.

**Tarjan:** one DFS with a stack; low[v] as above but only through vertices still on the stack; when low[v] == tin[v], pop the stack down to v: that is one SCC. One pass, no reversed graph.

Interviews for new grads rarely require SCC code, but Critical Connections (bridges), Reconstruct Itinerary (Euler path) and Find Eventual Safe States appear in curated lists, and the concepts come up in follow-up questions.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: bridges in a triangle 0-1-2 with a tail 1-3',
      bodyMd: 'Edges: 0-1, 1-2, 2-0, 1-3. DFS from 0. The array shows tin/low as "tin/low" for vertices 0..3.',
      trace: [
        { note: 'Visit 0 (tin 0), go to 1 (tin 1), then to 2 (tin 2).', array: ['0/0', '1/1', '2/2', '-'], pointers: { u: 2 } },
        { note: 'At 2: edge 2-0 is a back edge to tin 0 → low[2] = 0. Return to 1: low[1] = min(1, 0) = 0. Edge 1-2: low[2] = 0 > tin[1] = 1? No → not a bridge.', array: ['0/0', '1/0', '2/0', '-'], pointers: { u: 1 } },
        { note: 'From 1 visit 3 (tin 3). 3 has no other edges: low[3] = 3.', array: ['0/0', '1/0', '2/0', '3/3'], pointers: { u: 3 } },
        { note: 'Back at 1: low[3] = 3 > tin[1] = 1 → 1-3 is a bridge. Also low[3] ≥ tin[1], so 1 is an articulation point.', array: ['0/0', '1/0', '2/0', '3/3'], highlight: [1, 3], vars: { bridge: '1-3', articulation: 1 } },
        { note: 'Back at 0: low[1] = 0 > tin[0] = 0? No, so 0-1 is not a bridge. 0 is the root with one DFS child, so it is not an articulation point.', array: ['0/0', '1/0', '2/0', '3/3'], vars: { bridges: '[1-3]' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Bridges (Critical Connections) and Hierholzer for Reconstruct Itinerary.',
      code: [
        cpp(`
// Critical Connections: all bridges of an undirected graph with vertices 0..n-1.
class Bridges {
    vector<vector<int>> g;
    vector<int> tin, low;
    vector<vector<int>> out;
    int timer = 0;
    void dfs(int u, int parent) {
        tin[u] = low[u] = timer++;
        for (int v : g[u]) {
            if (v == parent) continue;                 // (use edge ids instead if parallel edges exist)
            if (tin[v] != -1) low[u] = min(low[u], tin[v]);      // back edge
            else {
                dfs(v, u);
                low[u] = min(low[u], low[v]);
                if (low[v] > tin[u]) out.push_back({u, v});
            }
        }
    }
public:
    vector<vector<int>> find(int n, const vector<vector<int>>& edges) {
        g.assign(n, {}); tin.assign(n, -1); low.assign(n, 0);
        for (auto& e : edges) { g[e[0]].push_back(e[1]); g[e[1]].push_back(e[0]); }
        for (int v = 0; v < n; ++v) if (tin[v] == -1) dfs(v, -1);
        return out;
    }
};

// Reconstruct Itinerary: lexicographically smallest Euler path from "JFK".
vector<string> findItinerary(const vector<vector<string>>& tickets) {
    unordered_map<string, multiset<string>> g;
    for (auto& t : tickets) g[t[0]].insert(t[1]);
    vector<string> route, st = {"JFK"};
    while (!st.empty()) {
        string u = st.back();
        auto& nexts = g[u];
        if (nexts.empty()) { route.push_back(u); st.pop_back(); }   // stuck: finish u
        else { st.push_back(*nexts.begin()); nexts.erase(nexts.begin()); }
    }
    reverse(route.begin(), route.end());
    return route;
}`, 'C++'),
        java(`
private List<List<Integer>> g;
private int[] tin, low;
private int timer;
private List<List<Integer>> bridges;

List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {
    g = new ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new ArrayList<>());
    for (List<Integer> e : connections) { g.get(e.get(0)).add(e.get(1)); g.get(e.get(1)).add(e.get(0)); }
    tin = new int[n]; low = new int[n];
    Arrays.fill(tin, -1);
    timer = 0;
    bridges = new ArrayList<>();
    for (int v = 0; v < n; v++) if (tin[v] == -1) dfs(v, -1);
    return bridges;
}
private void dfs(int u, int parent) {
    tin[u] = low[u] = timer++;
    for (int v : g.get(u)) {
        if (v == parent) continue;
        if (tin[v] != -1) low[u] = Math.min(low[u], tin[v]);
        else {
            dfs(v, u);
            low[u] = Math.min(low[u], low[v]);
            if (low[v] > tin[u]) bridges.add(List.of(u, v));
        }
    }
}

List<String> findItinerary(List<List<String>> tickets) {
    Map<String, PriorityQueue<String>> adj = new HashMap<>();
    for (List<String> t : tickets) adj.computeIfAbsent(t.get(0), k -> new PriorityQueue<>()).add(t.get(1));
    LinkedList<String> route = new LinkedList<>();
    Deque<String> st = new ArrayDeque<>();
    st.push("JFK");
    while (!st.isEmpty()) {
        PriorityQueue<String> nexts = adj.get(st.peek());
        if (nexts == null || nexts.isEmpty()) route.addFirst(st.pop());
        else st.push(nexts.poll());
    }
    return route;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Bridges, articulation points, Tarjan's SCC, Kosaraju's SCC: **O(V + E)**, one or two DFS passes.
- Recursive DFS depth can reach V (10⁵ in Critical Connections): in C++ this usually fits the default stack on LeetCode; elsewhere convert to an explicit stack.
- Hierholzer: O(E) to traverse, plus O(E log E) when edges must be taken in lexicographic order.
- Eventual safe states: O(V + E) with Kahn on the reversed graph (nodes whose out-degree drops to 0 are safe).`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Using low[v] ≥ tin[u] for bridges** (that is the articulation-point condition). Bridges need a strict >.
2. **Skipping the parent vertex instead of the parent edge** when parallel edges exist: a duplicated edge is never a bridge. Track edge ids in that case.
3. **Treating the DFS root like other vertices** for articulation points; the root is one only with ≥ 2 DFS children.
4. **Greedy itinerary without backtracking:** always taking the smallest next airport can strand you; Hierholzer's post-order fixes it automatically.
5. **Ignoring the Euler conditions** (odd degrees, in/out balance) when the problem asks whether a path exists.
6. **Running Kosaraju's second pass on the original graph** instead of the reversed one.`,
    },
  ],
  recognition: {
    signals: ['"Critical connections", single points of failure, removing one edge or vertex disconnects', 'Groups of mutually reachable nodes in a directed graph', 'Use every edge (ticket, domino, pair) exactly once', 'Nodes that can never enter a cycle'],
    antiSignals: ['Simple connectivity: BFS/DFS/DSU', 'Ordering with dependencies only: topological sort', 'Visit every vertex once (Hamiltonian path): exponential; usually bitmask DP for small n'],
    decisionQuestions: ['Directed or undirected?', 'Is the question about edges (bridges, Euler) or vertices (articulation points, SCCs)?', 'Do the Euler degree conditions hold?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you find all bridges in an undirected graph?', answerMd: 'DFS with discovery times tin and low-links low (the earliest tin reachable from the subtree with one back edge). For a tree edge u → v, after visiting v, set low[u] = min(low[u], low[v]); the edge is a bridge iff low[v] > tin[u]. Back edges update low[u] = min(low[u], tin[v]). O(V + E).' },
    { id: 'iq2', q: 'When does a directed graph have an Euler path?', answerMd: 'All vertices with edges lie in one weakly connected component, and either every vertex has in-degree = out-degree (a circuit), or exactly one vertex has out − in = 1 (start), exactly one has in − out = 1 (end), and all others are balanced.' },
    { id: 'iq3', q: "Explain Hierholzer's algorithm.", answerMd: 'Start at the start vertex and follow unused edges, deleting each as you use it. When the current vertex has no unused edges, add it to the front of the result (post-order) and backtrack. Sub-cycles discovered later are spliced in automatically. O(E).' },
    { id: 'iq4', q: 'What is the condensation of a directed graph?', answerMd: 'Contract each strongly connected component to a single vertex, keeping edges between different components. The result is always a DAG, so problems about reachability or longest paths in graphs with cycles can be solved by SCC + topological DP.' },
    { id: 'iq5', q: 'Compare Kosaraju and Tarjan.', answerMd: 'Both are O(V + E). Kosaraju: DFS for finish order, then DFS on the reversed graph in reverse finish order; each tree is an SCC; easy to reason about, needs the transpose. Tarjan: a single DFS with a stack and low-links; pop an SCC when low[v] == tin[v]; no transpose but trickier to implement.' },
    { id: 'iq6', q: 'Find Eventual Safe States: describe an efficient solution.', answerMd: 'A node is safe if every path from it ends at a terminal node, i.e. it cannot reach a cycle. Reverse the edges and run Kahn from the terminal nodes (out-degree 0 in the original): a node becomes safe when all its original successors are safe. Alternatively, DFS with three colours: nodes on or leading to a grey cycle are unsafe. O(V + E).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- tin = discovery time; low = earliest tin reachable with one back edge.
- Bridge (u, v): low[v] > tin[u]. Articulation u: low[v] ≥ tin[u] for some child (root: ≥ 2 children).
- SCC: Kosaraju (finish order + reversed graph) or Tarjan (stack + low); condensation is a DAG.
- Euler: undirected 0/2 odd vertices; directed in/out balance with one start and one end.
- Hierholzer: follow unused edges, post-order, reverse. Lexicographic: smallest edge first.`,
    flashcards: [
      { id: 'f1', front: 'Bridge condition with low-links?', backMd: 'low[v] > tin[u] for tree edge u → v.' },
      { id: 'f2', front: 'Articulation point condition (non-root)?', backMd: 'Some child v has low[v] ≥ tin[u].' },
      { id: 'f3', front: 'Undirected Euler path exists when…?', backMd: 'The edges are connected and exactly 0 or 2 vertices have odd degree.' },
      { id: 'f4', front: 'What does Hierholzer do when stuck?', backMd: 'Appends the vertex to the answer (post-order) and backtracks; the reversed list is the Euler path.' },
      { id: 'f5', front: 'What graph do you get by contracting SCCs?', backMd: 'A DAG (the condensation).' },
    ],
  },
  mastery: { testSize: 6, testMinutes: 12, passPct: 75, minIndependentSolves: 2, minMediumIndependent: 1, retentionDays: 10 },
  resources: [
    { title: 'Bridge (graph theory) (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Bridge_(graph_theory)', kind: 'article' },
    { title: 'Strongly connected component (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Strongly_connected_component', kind: 'article' },
    { title: 'Eulerian path (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Eulerian_path', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.advg.q1', type: 'code-output', difficulty: 'hard',
    stem: 'What does this program print (the bridges found)?',
    code: cpp(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
vector<vector<int>> g;
vector<int> tin, low;
int timer = 0;
void dfs(int u, int p) {
    tin[u] = low[u] = timer++;
    for (int v : g[u]) {
        if (v == p) continue;
        if (tin[v] != -1) low[u] = min(low[u], tin[v]);
        else {
            dfs(v, u);
            low[u] = min(low[u], low[v]);
            if (low[v] > tin[u]) cout << u << "-" << v << " ";
        }
    }
}
int main() {
    int n = 6;
    int e[][2] = {{0, 1}, {1, 2}, {2, 0}, {1, 3}, {3, 4}, {4, 5}, {5, 3}};
    g.assign(n, {}); tin.assign(n, -1); low.assign(n, 0);
    for (auto& x : e) { g[x[0]].push_back(x[1]); g[x[1]].push_back(x[0]); }
    dfs(0, -1);
    cout << endl;
    return 0;
}`, 'C++', '1-3'),
    options: ['1-3', ['1-3 3-4', '3-4-5 is a cycle, so none of its edges is a bridge.'], ['0-1 1-3', '0-1-2 is a cycle.'], ['(nothing)', 'Removing 1-3 separates the two triangles.']],
    answer: 0,
    explanation: 'Two triangles joined by the edge 1-3. Only that edge is critical: low[3] = tin[3] because the second triangle has no back edge above 3.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.advg.q2', type: 'concept', difficulty: 'medium',
    stem: 'For a tree edge u → v in DFS, which condition means (u, v) is a bridge?',
    options: ['low[v] > tin[u]', ['low[v] ≥ tin[u]', 'That is the articulation-point test.'], ['low[u] > tin[v]', 'Reversed roles.'], ['tin[v] > tin[u]', 'True for every tree edge.']],
    answer: 0,
    explanation: 'If even the best back edge from v\'s subtree cannot reach u or above, removing (u, v) disconnects that subtree.',
  }),
  mcq({
    ...base, id: 'dsa.advg.q3', type: 'concept', difficulty: 'medium',
    stem: 'An undirected connected graph has degrees 2, 3, 3, 2, 4. Does it have an Euler path, circuit or neither?',
    options: ['An Euler path (exactly two odd-degree vertices) but no circuit', ['An Euler circuit', 'A circuit needs every degree even.'], ['Neither', 'Two odd vertices allow a path between them.'], ['Both', 'A circuit is impossible with odd degrees.']],
    answer: 0,
    explanation: 'The path must start at one odd-degree vertex and end at the other.',
  }),
  mcq({
    ...base, id: 'dsa.advg.q4', type: 'code-output', difficulty: 'hard',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[][] tickets = {{"JFK", "KUL"}, {"JFK", "NRT"}, {"NRT", "JFK"}};
        Map<String, PriorityQueue<String>> adj = new HashMap<>();
        for (String[] t : tickets) adj.computeIfAbsent(t[0], k -> new PriorityQueue<>()).add(t[1]);
        LinkedList<String> route = new LinkedList<>();
        Deque<String> st = new ArrayDeque<>();
        st.push("JFK");
        while (!st.isEmpty()) {
            PriorityQueue<String> nx = adj.get(st.peek());
            if (nx == null || nx.isEmpty()) route.addFirst(st.pop());
            else st.push(nx.poll());
        }
        System.out.println(route);
    }
}`, 'Java', '[JFK, NRT, JFK, KUL]'),
    options: ['[JFK, NRT, JFK, KUL]', ['[JFK, KUL, NRT, JFK]', 'KUL is a dead end; flying there first would strand the NRT tickets.'], ['[JFK, KUL]', 'Every ticket must be used.'], ['[KUL, JFK, NRT, JFK]', 'The route starts at JFK.']],
    answer: 0,
    explanation: 'Greedy takes KUL first and gets stuck; Hierholzer records KUL as the last stop, backtracks to JFK, and continues with NRT → JFK. Reversed post-order gives JFK → NRT → JFK → KUL.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.advg.q5', type: 'pattern', difficulty: 'medium',
    stem: 'In a social network (directed "follows"), find groups where everyone can reach everyone else through follows. Which tool?',
    options: ['Strongly connected components', ['Union-find', 'It ignores direction.'], ['Topological sort', 'It fails exactly when such groups exist.'], ['Bridges', 'An undirected-graph concept.']],
    answer: 0,
    explanation: 'Mutual reachability in a directed graph is the definition of an SCC. Tarjan or Kosaraju find all of them in O(V + E).',
  }),
  mcq({
    ...base, id: 'dsa.advg.q6', type: 'edge-case', difficulty: 'hard',
    stem: 'The graph has two parallel edges between u and v (and nothing else connecting them). A bridge finder skips the parent vertex instead of the parent edge. What happens?',
    options: ['It wrongly reports (u, v) as a bridge', ['It correctly reports no bridge', 'Skipping the parent vertex also skips the second parallel edge, the back edge that proves it is not a bridge.'], ['It loops forever', 'tin values prevent revisiting.'], ['It crashes', 'Indices are valid.']],
    answer: 0,
    explanation: 'Removing one of two parallel edges keeps u and v connected, so neither is a bridge. Skip only the edge id you arrived by.',
  }),
  mcq({
    ...base, id: 'dsa.advg.q7', type: 'complexity', difficulty: 'easy',
    stem: "What is the time complexity of Tarjan's SCC algorithm?",
    options: ['O(V + E)', ['O(V · E)', 'One DFS suffices.'], ['O(E log V)', 'No heap is involved.'], ['O(V²)', 'Only with an adjacency matrix.']],
    answer: 0,
    explanation: 'Each vertex is pushed and popped once and each edge is examined once.',
  }),
  mcq({
    ...base, id: 'dsa.advg.q8', type: 'concept', difficulty: 'medium',
    stem: 'After contracting every SCC of a directed graph into a single vertex, what is the resulting graph?',
    options: ['Always a DAG', ['Always a tree', 'It can have several paths between components.'], ['Always strongly connected', 'Only if the original was a single SCC.'], ['Possibly cyclic', 'A cycle between components would merge them into one SCC.']],
    answer: 0,
    explanation: 'If two components lay on a cycle, all their vertices would be mutually reachable, contradicting maximality.',
  }),
];
