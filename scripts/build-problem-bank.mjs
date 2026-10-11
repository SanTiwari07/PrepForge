// Generates src/content/problems/bank.generated.ts from research/dsa-problems.verified.json.
// Topic precedence: NeetCode pattern -> Top Interview 150 group -> LeetCode 75 group
// -> Striver A2Z category -> LeetCode tags. Prints a review report.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(resolve(root, 'research/dsa-problems.verified.json'), 'utf8'));

const NC = {
  'Arrays & Hashing': 'dsa.hashing', 'Two Pointers': 'dsa.two-pointers', 'Sliding Window': 'dsa.sliding-window',
  Stack: 'dsa.stacks-queues', 'Binary Search': 'dsa.binary-search', 'Linked List': 'dsa.linked-lists',
  Trees: 'dsa.binary-trees', Tries: 'dsa.tries', 'Heap / Priority Queue': 'dsa.heaps', Backtracking: 'dsa.backtracking',
  Graphs: 'dsa.graphs', 'Advanced Graphs': 'dsa.advanced-graphs', '1-D Dynamic Programming': 'dsa.dp-1d',
  '2-D Dynamic Programming': 'dsa.dp-2d', Greedy: 'dsa.greedy', Intervals: 'dsa.intervals',
  'Math & Geometry': 'dsa.math', 'Bit Manipulation': 'dsa.bit-manipulation',
};
const TI = {
  'Array / String': 'dsa.arrays-strings', 'Two Pointers': 'dsa.two-pointers', 'Sliding Window': 'dsa.sliding-window',
  Matrix: 'dsa.matrix', Hashmap: 'dsa.hashing', Intervals: 'dsa.intervals', Stack: 'dsa.stacks-queues',
  'Linked List': 'dsa.linked-lists', 'Binary Tree General': 'dsa.binary-trees', 'Binary Tree BFS': 'dsa.binary-trees',
  'Binary Search Tree': 'dsa.bst', 'Graph General': 'dsa.graphs', 'Graph BFS': 'dsa.graphs', Trie: 'dsa.tries',
  Backtracking: 'dsa.backtracking', 'Divide & Conquer': 'dsa.divide-conquer', "Kadane's Algorithm": 'dsa.kadane',
  'Binary Search': 'dsa.binary-search', Heap: 'dsa.heaps', 'Bit Manipulation': 'dsa.bit-manipulation', Math: 'dsa.math',
  '1D DP': 'dsa.dp-1d', 'Multidimensional DP': 'dsa.dp-2d',
};
const L75 = {
  'Array / String': 'dsa.arrays-strings', 'Two Pointers': 'dsa.two-pointers', 'Sliding Window': 'dsa.sliding-window',
  'Prefix Sum': 'dsa.prefix-sums', 'Hash Map / Set': 'dsa.hashing', Stack: 'dsa.stacks-queues', Queue: 'dsa.stacks-queues',
  'Linked List': 'dsa.linked-lists', 'Binary Tree - DFS': 'dsa.binary-trees', 'Binary Tree - BFS': 'dsa.binary-trees',
  'Binary Search Tree': 'dsa.bst', 'Graphs - DFS': 'dsa.graphs', 'Graphs - BFS': 'dsa.graphs', 'Binary Search': 'dsa.binary-search',
  'Heap / Priority Queue': 'dsa.heaps', Backtracking: 'dsa.backtracking', 'DP - 1D': 'dsa.dp-1d',
  'DP - Multidimensional': 'dsa.dp-2d', 'Bit Manipulation': 'dsa.bit-manipulation', Trie: 'dsa.tries',
  Intervals: 'dsa.intervals', 'Monotonic Stack': 'dsa.monotonic-stack-queue',
};
const A2Z = {
  'basic-maths': 'dsa.math', 'basic-hashing': 'dsa.hashing', 'basic-strings': 'dsa.arrays-strings', 'basic-recursion': 'dsa.recursion',
  'logic-building': 'dsa.arrays-strings', 'on-answers': 'dsa.binary-search', '2d-arrays': 'dsa.matrix', parentheses: 'dsa.stacks-queues',
  'string-conversions': 'dsa.arrays-strings', 'substring-problems': 'dsa.sliding-window', 'implementation-problems': 'dsa.implementation',
  'fundamentals-single-ll': 'dsa.linked-lists', 'fundamentals-doubly-ll': 'dsa.linked-lists', 'bit-fundamentals': 'dsa.bit-manipulation',
  'scheduling-and-interval-problems': 'dsa.greedy', 'constant-window': 'dsa.sliding-window',
  'longest-and-smallest-window-problems': 'dsa.sliding-window', 'counting-subarrays-and-substrings-problems': 'dsa.sliding-window',
  'monotonic-stack': 'dsa.monotonic-stack-queue', 'theory-and-traversals': 'dsa.binary-trees', 'construction-problems': 'dsa.binary-trees',
  'traversal-problems': 'dsa.graphs', cycles: 'dsa.graphs', 'shortest-path-algorithms': 'dsa.shortest-paths',
  'minimum-spanning-tree': 'dsa.mst', '1d-dp': 'dsa.dp-1d', 'dp-on-grids': 'dsa.dp-2d', 'dp-on-stocks': 'dsa.dp-2d',
  'dp-on-subsequences': 'dsa.dp-2d', 'lis-dp': 'dsa.dp-1d', 'dp-on-strings': 'dsa.dp-2d', 'mcm-dp': 'dsa.dp-advanced', triessubc: 'dsa.tries',
};
// Ordered: first matching tag wins as a fallback primary topic.
const TAG_PRIMARY = [
  ['union-find', 'dsa.dsu'], ['topological-sort', 'dsa.topological-sort'], ['shortest-path', 'dsa.shortest-paths'],
  ['minimum-spanning-tree', 'dsa.mst'], ['segment-tree', 'dsa.fenwick-segment'], ['binary-indexed-tree', 'dsa.fenwick-segment'],
  ['trie', 'dsa.tries'], ['dynamic-programming', 'dsa.dp-1d'], ['backtracking', 'dsa.backtracking'],
  ['sliding-window', 'dsa.sliding-window'], ['monotonic-stack', 'dsa.monotonic-stack-queue'], ['monotonic-queue', 'dsa.monotonic-stack-queue'],
  ['heap-priority-queue', 'dsa.heaps'], ['binary-search-tree', 'dsa.bst'], ['binary-tree', 'dsa.binary-trees'], ['tree', 'dsa.binary-trees'],
  ['graph', 'dsa.graphs'], ['breadth-first-search', 'dsa.graphs'], ['depth-first-search', 'dsa.graphs'], ['linked-list', 'dsa.linked-lists'],
  ['binary-search', 'dsa.binary-search'], ['two-pointers', 'dsa.two-pointers'], ['bit-manipulation', 'dsa.bit-manipulation'],
  ['prefix-sum', 'dsa.prefix-sums'], ['greedy', 'dsa.greedy'], ['stack', 'dsa.stacks-queues'], ['queue', 'dsa.stacks-queues'],
  ['matrix', 'dsa.matrix'], ['string-matching', 'dsa.string-matching'], ['divide-and-conquer', 'dsa.divide-conquer'],
  ['math', 'dsa.math'], ['hash-table', 'dsa.hashing'], ['sorting', 'dsa.sorting'], ['simulation', 'dsa.implementation'],
  ['string', 'dsa.arrays-strings'], ['array', 'dsa.arrays-strings'],
];
// Secondary topics added from tags.
const TAG_SECONDARY = {
  'union-find': 'dsa.dsu', 'prefix-sum': 'dsa.prefix-sums', 'monotonic-stack': 'dsa.monotonic-stack-queue',
  'monotonic-queue': 'dsa.monotonic-stack-queue', 'segment-tree': 'dsa.fenwick-segment', 'binary-indexed-tree': 'dsa.fenwick-segment',
  'string-matching': 'dsa.string-matching', 'rolling-hash': 'dsa.string-matching', 'divide-and-conquer': 'dsa.divide-conquer',
  design: 'dsa.design-ds', simulation: 'dsa.implementation', matrix: 'dsa.matrix', 'topological-sort': 'dsa.topological-sort',
  'shortest-path': 'dsa.shortest-paths', 'binary-search': 'dsa.binary-search', 'sliding-window': 'dsa.sliding-window',
  'two-pointers': 'dsa.two-pointers', 'heap-priority-queue': 'dsa.heaps', trie: 'dsa.tries', backtracking: 'dsa.backtracking',
  'bit-manipulation': 'dsa.bit-manipulation', 'hash-table': 'dsa.hashing', 'linked-list': 'dsa.linked-lists',
  'binary-search-tree': 'dsa.bst', recursion: 'dsa.recursion', sorting: 'dsa.sorting', greedy: 'dsa.greedy',
};
const PATTERN_FROM_TAG = {
  'two-pointers': 'Two pointers', 'sliding-window': 'Sliding window', 'binary-search': 'Binary search', 'prefix-sum': 'Prefix sum',
  'hash-table': 'Hashing', 'monotonic-stack': 'Monotonic stack', 'monotonic-queue': 'Monotonic queue', stack: 'Stack',
  'heap-priority-queue': 'Heap / top-k', 'breadth-first-search': 'BFS', 'depth-first-search': 'DFS', 'union-find': 'Union-find',
  'topological-sort': 'Topological sort', 'shortest-path': 'Shortest path', 'dynamic-programming': 'Dynamic programming',
  memoization: 'Memoisation', backtracking: 'Backtracking', greedy: 'Greedy', 'bit-manipulation': 'Bit manipulation', trie: 'Trie',
  'divide-and-conquer': 'Divide and conquer', sorting: 'Sorting', 'counting': 'Counting', 'linked-list': 'Linked list',
  'segment-tree': 'Segment tree', 'binary-indexed-tree': 'Fenwick tree', 'string-matching': 'String matching',
  design: 'Design', simulation: 'Simulation', matrix: 'Matrix', recursion: 'Recursion', 'bitmask': 'Bitmask',
};

function refineAdvancedGraph(tags) {
  if (tags.includes('shortest-path')) return 'dsa.shortest-paths';
  if (tags.includes('minimum-spanning-tree')) return 'dsa.mst';
  if (tags.includes('topological-sort')) return 'dsa.topological-sort';
  if (tags.includes('union-find')) return 'dsa.dsu';
  return 'dsa.advanced-graphs';
}

const problems = data.map((p) => {
  const tags = p.leetcodeTags || [];
  let primary = p.groups.nc ? NC[p.groups.nc] : undefined;
  if (primary === 'dsa.advanced-graphs') primary = refineAdvancedGraph(tags);
  if (primary === 'dsa.stacks-queues' && tags.includes('monotonic-stack')) primary = 'dsa.monotonic-stack-queue';
  if (primary === 'dsa.binary-trees' && tags.includes('binary-search-tree')) primary = 'dsa.bst';
  if (primary === 'dsa.math' && tags.includes('matrix')) primary = 'dsa.matrix';
  if (primary === 'dsa.dp-1d' && tags.includes('matrix')) primary = 'dsa.dp-2d';
  primary ??= p.groups.ti ? TI[p.groups.ti] : undefined;
  primary ??= p.groups.l75 ? L75[p.groups.l75] : undefined;
  primary ??= p.groups.ncAll ? NC[p.groups.ncAll] : undefined;
  primary ??= p.groups.a2z ? A2Z[p.groups.a2z] : undefined;
  if (!primary) primary = (TAG_PRIMARY.find(([t]) => tags.includes(t)) || [null, 'dsa.arrays-strings'])[1];
  const topicIds = new Set([primary]);
  for (const t of tags) if (TAG_SECONDARY[t]) topicIds.add(TAG_SECONDARY[t]);
  if (tags.includes('dynamic-programming') && !primary.startsWith('dsa.dp')) topicIds.add('dsa.dp-1d');
  const patterns = [...new Set(tags.map((t) => PATTERN_FROM_TAG[t]).filter(Boolean))].slice(0, 4);
  const difficulty = p.difficulty.toLowerCase();
  return {
    slug: p.slug, leetcodeId: p.id, title: p.title, difficulty, premium: p.premium, url: p.url,
    ...(p.freeAlternative ? { freeAlternativeUrl: p.freeAlternative } : {}),
    lists: p.lists, topicIds: [...topicIds], primaryTopicId: primary, patterns,
    estMinutes: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 30 : 45,
    ...(p.neetcodeVideo ? { videoUrl: p.neetcodeVideo } : {}),
  };
});

const out = resolve(root, 'src/content/problems/bank.generated.ts');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  `// GENERATED by scripts/build-problem-bank.mjs from research/dsa-problems.verified.json. Do not edit by hand.\n` +
    `import type { Problem } from '../schema';\n\nexport const PROBLEMS: Problem[] = ${JSON.stringify(problems, null, 0)};\n`,
);
const report = {};
for (const p of problems) report[p.primaryTopicId] = (report[p.primaryTopicId] || 0) + 1;
console.log(`Wrote ${problems.length} problems. Primary topic counts:`);
console.log(Object.entries(report).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join('\n'));
