import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.topological-sort';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Topological Sort',
  summary: "Ordering a DAG with Kahn's algorithm or DFS; course-schedule problems.",
  level: 'core',
  status: 'complete',
  estMinutes: 70,
  prerequisites: ['dsa.graphs'],
  related: ['dsa.graphs', 'dsa.dp-1d', 'dsa.shortest-paths', 'dsa.advanced-graphs'],
  subtopics: ['DAGs and dependency edges', "Kahn's algorithm (BFS on in-degrees)", 'DFS post-order', 'Cycle detection in directed graphs', 'Lexicographically smallest order', 'DP on a DAG'],
  objectives: [
    'Explain what a topological order is and why it exists exactly when a directed graph has no cycle.',
    "Implement Kahn's algorithm and use it to detect a cycle (fewer than V vertices output).",
    'Implement DFS with three colours, return the reverse post-order, and detect back edges.',
    'Model prerequisite problems with the correct edge direction.',
    'Run DP over a DAG in topological order (longest path, number of paths, earliest finish times).',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Orders that respect every arrow',
      bodyMd: `A **topological order** of a directed graph lists the vertices so that for every edge u → v, u comes before v. Think "u must happen before v": course prerequisites, build dependencies, task pipelines.

- It exists **if and only if** the graph is a **DAG** (directed acyclic graph). A cycle a → b → c → a would need a before b before c before a.
- It is usually **not unique**: in a graph with edges a → c and b → c, both a, b, c and b, a, c are valid.

**Edge direction matters.** "To take course 1 you must first take course 0" is the pair [1, 0] on LeetCode, and the edge is **0 → 1** (prerequisite → course). Reversing it gives a valid order of the reversed graph, which is the wrong answer.

Two standard algorithms, both O(V + E):

| Kahn's algorithm (BFS) | DFS post-order |
|---|---|
| Repeatedly remove a vertex with in-degree 0 | Finish a vertex after all its descendants |
| Cycle ⇔ fewer than V vertices removed | Cycle ⇔ an edge to a vertex that is still "in progress" (grey) |
| Easy to get the lexicographically smallest order (use a min-heap) | Natural for recursion; reverse the finishing order |`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Why each algorithm works',
      bodyMd: `**Kahn:** a vertex with in-degree 0 has no unfinished prerequisites, so it can go next. Removing it lowers the in-degree of its successors. If the queue empties while vertices remain, every remaining vertex has an incoming edge from another remaining vertex; follow those edges backwards and you must revisit a vertex, which is a cycle.

**DFS:** when DFS finishes a vertex u (all its outgoing edges explored), every vertex reachable from u is already finished. So listing vertices in **decreasing finish time** puts u before everything it points to. Colours: white = unvisited, grey = on the current recursion path, black = finished. An edge to a grey vertex goes back up the current path: a cycle. An edge to a black vertex is fine (a cross or forward edge).

**Undirected graphs are different:** "topological sort" does not apply, and cycle detection there uses the parent check or union-find.

**DP on a DAG:** once you have an order, process vertices in it; each vertex's value depends only on its predecessors, which are already final. Examples: longest path (critical path of a project), number of ways to reach each vertex, and Longest Increasing Path in a Matrix (cells are vertices, edges go to larger neighbours).`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: "Dry run: Kahn's algorithm on 4 courses",
      bodyMd: 'Edges 0 → 1, 0 → 2, 1 → 3, 2 → 3. In-degrees: [0, 1, 1, 2].',
      trace: [
        { note: 'Queue all vertices with in-degree 0: [0].', array: [0, 1, 1, 2], vars: { queue: '[0]', order: '[]' } },
        { note: 'Pop 0. Decrease 1 and 2: both reach 0, enqueue them.', array: [0, 0, 0, 2], highlight: [1, 2], vars: { queue: '[1, 2]', order: '[0]' } },
        { note: 'Pop 1. Decrease 3: in-degree 1.', array: [0, 0, 0, 1], highlight: [3], vars: { queue: '[2]', order: '[0, 1]' } },
        { note: 'Pop 2. Decrease 3: in-degree 0, enqueue it.', array: [0, 0, 0, 0], highlight: [3], vars: { queue: '[3]', order: '[0, 1, 2]' } },
        { note: 'Pop 3. Order [0, 1, 2, 3] has all 4 vertices, so there is no cycle. ([0, 2, 1, 3] is also valid.)', array: [0, 0, 0, 0], vars: { queue: '[]', order: '[0, 1, 2, 3]' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: "Kahn's algorithm for Course Schedule II, and DFS with three colours.",
      code: [
        cpp(`
// prerequisites[i] = {course, prereq}: edge prereq -> course.
vector<int> findOrder(int n, const vector<vector<int>>& prerequisites) {
    vector<vector<int>> g(n);
    vector<int> indeg(n, 0);
    for (auto& p : prerequisites) { g[p[1]].push_back(p[0]); ++indeg[p[0]]; }
    queue<int> q;
    for (int v = 0; v < n; ++v) if (indeg[v] == 0) q.push(v);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : g[u]) if (--indeg[v] == 0) q.push(v);
    }
    if ((int)order.size() < n) return {};            // a cycle blocks some courses
    return order;
}

// DFS: colour 0 = white, 1 = grey (on the path), 2 = black (finished).
bool dfs(int u, const vector<vector<int>>& g, vector<int>& colour, vector<int>& post) {
    colour[u] = 1;
    for (int v : g[u]) {
        if (colour[v] == 1) return false;              // back edge: cycle
        if (colour[v] == 0 && !dfs(v, g, colour, post)) return false;
    }
    colour[u] = 2;
    post.push_back(u);
    return true;
}
vector<int> topoDfs(const vector<vector<int>>& g) {
    int n = g.size();
    vector<int> colour(n, 0), post;
    for (int u = 0; u < n; ++u)
        if (colour[u] == 0 && !dfs(u, g, colour, post)) return {};
    reverse(post.begin(), post.end());                  // decreasing finish time
    return post;
}`, 'C++'),
        java(`
int[] findOrder(int n, int[][] prerequisites) {
    List<List<Integer>> g = new ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new ArrayList<>());
    int[] indeg = new int[n];
    for (int[] p : prerequisites) { g.get(p[1]).add(p[0]); indeg[p[0]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int v = 0; v < n; v++) if (indeg[v] == 0) q.add(v);
    int[] order = new int[n];
    int k = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        order[k++] = u;
        for (int v : g.get(u)) if (--indeg[v] == 0) q.add(v);
    }
    return k == n ? order : new int[0];
}

boolean dfs(int u, List<List<Integer>> g, int[] colour, List<Integer> post) {
    colour[u] = 1;
    for (int v : g.get(u)) {
        if (colour[v] == 1) return false;
        if (colour[v] == 0 && !dfs(v, g, colour, post)) return false;
    }
    colour[u] = 2;
    post.add(u);
    return true;
}
List<Integer> topoDfs(List<List<Integer>> g) {
    int n = g.size();
    int[] colour = new int[n];
    List<Integer> post = new ArrayList<>();
    for (int u = 0; u < n; u++)
        if (colour[u] == 0 && !dfs(u, g, colour, post)) return List.of();
    Collections.reverse(post);
    return post;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Both algorithms: **O(V + E) time**, O(V + E) space for the adjacency list, plus O(V) for in-degrees or colours.
- Kahn with a min-heap instead of a queue gives the lexicographically smallest order in O((V + E) log V).
- Recursive DFS uses O(V) stack in the worst case (a long chain); with 10⁵ vertices prefer Kahn or an explicit stack.
- DP on a DAG after sorting: O(V + E).`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Reversed edges** for prerequisite pairs. Write down one example pair and the direction before coding.
2. **Two-colour DFS** (visited / not visited) for directed cycle detection: an edge to an already-finished vertex is not a cycle, but a plain visited flag reports it as one. You need the grey state.
3. **Forgetting disconnected vertices**: start DFS from every unvisited vertex; in Kahn, enqueue every vertex with in-degree 0, including isolated ones.
4. **Not checking the output size** in Kahn: an order with fewer than V vertices means a cycle; returning it as an answer is wrong.
5. **Duplicate edges** counted twice in in-degree but not in the adjacency list (or vice versa): keep both consistent.
6. **Alien Dictionary pitfall:** a word followed by its own proper prefix ("abc" before "ab") makes the order invalid.`,
    },
  ],
  recognition: {
    signals: ['Prerequisites, dependencies, "must happen before"', 'Order tasks or detect whether an order is possible', 'Detect a cycle in a directed graph', 'Derive an order of letters or items from pairwise comparisons', 'DP where states form a DAG'],
    antiSignals: ['Undirected graphs: components or union-find', 'Shortest paths with weights: Dijkstra or Bellman-Ford (unless the graph is a DAG)', 'Cycles are allowed and you need strongly connected components: Tarjan/Kosaraju'],
    decisionQuestions: ['What is a vertex and what does an edge u → v mean?', 'Do I need any valid order, the lexicographically smallest, or just a yes/no?', 'Can there be cycles, and what should I return then?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you detect a cycle in a directed graph?', answerMd: 'Kahn: if fewer than V vertices are removed, the rest contain a cycle. DFS: three colours; an edge to a grey vertex (one on the current recursion path) is a back edge, which means a cycle. Both O(V + E). Note that a visited-only flag is not enough in directed graphs.' },
    { id: 'iq2', q: 'Why does reverse DFS post-order give a topological order?', answerMd: 'For an edge u → v in a DAG, v is finished before u: either DFS reaches v from u (v finishes first), or v was already finished. It cannot be grey, because that would be a cycle. So sorting by decreasing finish time places u before v for every edge.' },
    { id: 'iq3', q: 'Course Schedule: can all courses be finished?', answerMd: 'Build edges prereq → course, run Kahn, and check that the number of processed courses equals n. A cycle in the prerequisites makes it impossible. O(V + E).' },
    { id: 'iq4', q: 'How do you get the lexicographically smallest topological order?', answerMd: 'Use Kahn with a min-priority queue instead of a FIFO queue, so among the currently available vertices the smallest is always taken next. O((V + E) log V). DFS does not give this easily.' },
    { id: 'iq5', q: 'Find the longest path in a DAG.', answerMd: 'Topologically sort, then relax edges in that order: dist[v] = max(dist[v], dist[u] + w(u, v)). Each vertex is final when processed. O(V + E). Longest path in a general graph with cycles is NP-hard, so the DAG property is essential.' },
    { id: 'iq6', q: 'Alien Dictionary: how do you derive the letter order?', answerMd: 'Compare each pair of adjacent words; the first differing character gives an edge (earlier letter → later letter). If no character differs and the first word is longer, the input is invalid. Then topologically sort the letters (including letters with no edges); a cycle means invalid. O(total characters).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Topological order exists ⇔ DAG.
- Prerequisite pair [course, pre] → edge pre → course.
- Kahn: queue in-degree-0 vertices; output size < V ⇒ cycle. Min-heap ⇒ smallest order.
- DFS: white/grey/black; grey neighbour ⇒ cycle; reverse post-order.
- DP on DAGs (longest path, path counts) in topological order.`,
    flashcards: [
      { id: 'f1', front: 'When does a topological order exist?', backMd: 'Exactly when the directed graph has no cycle (it is a DAG).' },
      { id: 'f2', front: 'How does Kahn\'s algorithm detect a cycle?', backMd: 'It outputs fewer than V vertices.' },
      { id: 'f3', front: 'Why three colours in DFS cycle detection?', backMd: 'Only an edge to a grey (in-progress) vertex is a back edge; edges to black (finished) vertices are not cycles.' },
      { id: 'f4', front: 'Edge direction for LeetCode prerequisite [1, 0]?', backMd: '0 → 1: take 0 before 1.' },
      { id: 'f5', front: 'Lexicographically smallest topological order?', backMd: 'Kahn with a min-heap.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Topological sorting (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Topological_sorting', kind: 'article' },
    { title: 'Course Schedule II (LeetCode 210)', url: 'https://leetcode.com/problems/course-schedule-ii/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.topo.q1', type: 'code-output', difficulty: 'easy',
    stem: "What order does this Kahn's algorithm print?",
    code: cpp(`#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main() {
    int n = 5;
    vector<pair<int, int>> edges = {{0, 2}, {1, 2}, {2, 3}, {1, 4}, {4, 3}};
    vector<vector<int>> g(n);
    vector<int> indeg(n, 0);
    for (auto& e : edges) { g[e.first].push_back(e.second); ++indeg[e.second]; }
    queue<int> q;
    for (int v = 0; v < n; ++v) if (indeg[v] == 0) q.push(v);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        cout << u << " ";
        for (int v : g[u]) if (--indeg[v] == 0) q.push(v);
    }
    cout << endl;
    return 0;
}`, 'C++', '0 1 2 4 3'),
    options: ['0 1 2 4 3', ['0 1 4 2 3', '2 is enqueued (when 1 is popped) before 4.'], ['0 2 1 4 3', '2 still has in-degree 1 after popping 0.'], ['1 0 4 2 3', 'The initial queue holds 0 then 1.']],
    answer: 0,
    explanation: 'Start: queue [0, 1]. Pop 0: indeg(2) = 1. Pop 1: indeg(2) = 0 → enqueue 2; indeg(4) = 0 → enqueue 4. Pop 2: indeg(3) = 1. Pop 4: indeg(3) = 0 → enqueue 3. Pop 3.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.topo.q2', type: 'concept', difficulty: 'easy',
    stem: 'Kahn\'s algorithm on a graph with 6 vertices outputs only 4. What does that mean?',
    options: ['The graph contains a cycle', ['The graph is disconnected', 'Isolated vertices have in-degree 0 and are output.'], ['Two vertices have the same in-degree', 'That is normal.'], ['The order is not unique', 'Uniqueness is unrelated to the count.']],
    answer: 0,
    explanation: 'The two remaining vertices each still have an incoming edge from a remaining vertex, which forces a cycle among them.',
  }),
  mcq({
    ...base, id: 'dsa.topo.q3', type: 'debug', difficulty: 'medium',
    stem: 'A directed-cycle check uses DFS with a single `visited` array and reports a cycle whenever it sees a visited neighbour. On edges 0 → 1, 0 → 2, 1 → 2, what happens?',
    options: ['It reports a cycle that does not exist', ['It correctly reports no cycle', 'Visiting 2 again from 0 triggers the check.'], ['It loops forever', 'The visited array prevents that.'], ['It crashes', 'Nothing is out of bounds.']],
    answer: 0,
    explanation: 'DFS from 0 visits 1, then 2 (finished). Back at 0, the edge 0 → 2 sees a visited vertex. It is black (finished), not grey, so it is not a cycle. You need the in-progress state.',
  }),
  mcq({
    ...base, id: 'dsa.topo.q4', type: 'concept', difficulty: 'medium',
    stem: 'LeetCode gives prerequisites as [a, b] meaning "to take a you must first take b". Which edge do you add for Kahn\'s algorithm?',
    options: ['b → a, and increment the in-degree of a', ['a → b, and increment the in-degree of b', 'That orders the courses backwards.'], ['Both directions', 'That creates a cycle for every pair.'], ['It does not matter', 'The direction defines the order.']],
    answer: 0,
    explanation: 'Edges go from "before" to "after". b must come first, so b → a.',
  }),
  mcq({
    ...base, id: 'dsa.topo.q5', type: 'complexity', difficulty: 'easy',
    stem: "What is the time complexity of Kahn's algorithm with an adjacency list?",
    options: ['O(V + E)', ['O(V²)', 'That is for an adjacency matrix.'], ['O(E log V)', 'Only with a heap (lexicographic order).'], ['O(V · E)', 'Each edge is processed once.']],
    answer: 0,
    explanation: 'Each vertex is enqueued and dequeued once; each edge decrements one in-degree once.',
  }),
  mcq({
    ...base, id: 'dsa.topo.q6', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    static List<List<Integer>> g = new ArrayList<>();
    static int[] colour;
    static List<Integer> post = new ArrayList<>();
    static boolean dfs(int u) {
        colour[u] = 1;
        for (int v : g.get(u)) {
            if (colour[v] == 1) return false;
            if (colour[v] == 0 && !dfs(v)) return false;
        }
        colour[u] = 2;
        post.add(u);
        return true;
    }
    public static void main(String[] args) {
        int n = 4;
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        g.get(0).add(1); g.get(1).add(2); g.get(2).add(3); g.get(3).add(1);
        colour = new int[n];
        boolean ok = dfs(0);
        System.out.println(ok + " " + post);
    }
}`, 'Java', 'false []'),
    options: ['false []', ['true [3, 2, 1, 0]', '3 → 1 is an edge back to a grey vertex.'], ['false [3]', 'The return happens before 3 is finished.'], ['true [0, 1, 2, 3]', 'There is a cycle 1 → 2 → 3 → 1.']],
    answer: 0,
    explanation: 'DFS goes 0 → 1 → 2 → 3, all grey. The edge 3 → 1 reaches a grey vertex, so false propagates up before any vertex finishes; post stays empty.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.topo.q7', type: 'pattern', difficulty: 'medium',
    stem: 'Longest Increasing Path in a Matrix: why is topological ordering (or memoised DFS) valid?',
    options: ['Edges go from a cell to a strictly larger neighbour, so the graph has no cycles', ['Because the matrix is square', 'Shape is irrelevant.'], ['Because BFS visits cells level by level', 'The key fact is acyclicity.'], ['Because all values are distinct', 'Equal neighbours simply have no edge.']],
    answer: 0,
    explanation: 'Strictly increasing values cannot cycle back. A DAG allows DP: longest(cell) = 1 + max over larger neighbours, computed in topological order or by memoised DFS. O(mn).',
  }),
  mcq({
    ...base, id: 'dsa.topo.q8', type: 'edge-case', difficulty: 'hard',
    stem: 'Alien Dictionary: the sorted word list is ["abc", "ab"]. What should the algorithm return?',
    options: ['An invalid result (no valid order), because a word cannot come before its own prefix', ['"abc"', 'No edge is derived, but the input itself is inconsistent.'], ['"cba"', 'There is no information about c relative to others.'], ['Any permutation of a, b, c', 'A prefix appearing after the longer word is a contradiction.']],
    answer: 0,
    explanation: 'In any lexicographic order, "ab" comes before "abc". Since no differing character exists, there is no edge to explain it; check this case explicitly and return "".',
  }),
];
