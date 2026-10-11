import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.binary-trees';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Binary Trees',
  summary: 'DFS and BFS traversals, height and diameter, path problems and construction.',
  level: 'core',
  status: 'complete',
  estMinutes: 100,
  prerequisites: ['dsa.recursion', 'dsa.stacks-queues'],
  related: ['dsa.bst', 'dsa.heaps', 'dsa.graphs', 'dsa.backtracking', 'dsa.dp-1d'],
  subtopics: ['Pre-, in- and post-order DFS', 'Level-order BFS', 'Height, depth and diameter', 'Return values vs global answers', 'Path sums', 'Construction from traversals', 'Lowest common ancestor'],
  objectives: [
    'Write recursive DFS by deciding what each call returns and what it needs from its children.',
    'Choose pre-, in- or post-order depending on whether information flows down or up.',
    'Use BFS with a queue for level-by-level questions (right side view, level averages).',
    'Solve "diameter"-style problems where the answer combines both children while the return value uses one.',
    'Analyse time O(n) and space O(h), and recognise the skewed-tree worst case.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Think in subproblems: what does each call return?',
      bodyMd: `A binary tree is recursive: a node plus a left subtree plus a right subtree. Almost every tree solution follows one recipe:

1. **Base case:** what is the answer for a null node? (Height 0, sum 0, "is balanced" true…)
2. **Recursive case:** get answers from the left and right subtrees, combine them with the current node, and return.

Traversal orders differ only in *when* you process the node:
- **Pre-order** (node, left, right): information flows **down** (pass depth, path sum or bounds to children).
- **In-order** (left, node, right): on a BST, this visits values in **sorted order**.
- **Post-order** (left, right, node): information flows **up** (height, size, subtree sums). Most "compute something about the subtree" questions are post-order.

**BFS / level order** uses a queue and processes the tree level by level. Reach for it when the question mentions levels, the "nearest" node, or views from a side.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'The diameter pattern: return one thing, update another',
      bodyMd: `Some answers combine **both** children at a node (a path that bends through it), but a path that continues to the parent can only use **one** child. So:

- the function **returns** the best "downward" value (one side + the node),
- and **updates a global answer** with the "bend here" value (left + right + node).

This exact shape solves diameter of a tree, maximum path sum, longest univalue path, and many more. Recognising it is a big part of being able to handle unfamiliar tree questions.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: height and diameter',
      bodyMd: 'Tree (level order): [1, 2, 3, 4, 5]. Node 1 has children 2 and 3; node 2 has children 4 and 5. height(null) = 0. The diameter is measured in edges.',
      trace: [
        { note: 'Leaves 4 and 5: left = right = 0, height = 1, bend = 0 + 0 = 0.', vars: { 'h(4)': 1, 'h(5)': 1, best: 0 } },
        { note: 'Node 2: left = h(4) = 1, right = h(5) = 1, bend = 2 (path 4–2–5), height = 2.', vars: { 'h(2)': 2, best: 2 } },
        { note: 'Node 3 (a leaf): height = 1.', vars: { 'h(3)': 1, best: 2 } },
        { note: 'Root 1: left = 2, right = 1, bend = 3 (path 4–2–1–3). best = 3. Returned height = 3 (not used further).', vars: { 'h(1)': 3, best: 3 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Post-order with a global answer (diameter), BFS by levels, and lowest common ancestor.',
      code: [
        cpp(`
struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

// Returns height; updates best with the longest path (in edges) bending at each node.
int height(TreeNode* node, int& best) {
    if (!node) return 0;
    int l = height(node->left, best);
    int r = height(node->right, best);
    best = max(best, l + r);
    return 1 + max(l, r);
}
int diameterOfBinaryTree(TreeNode* root) { int best = 0; height(root, best); return best; }

vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> res;
    if (!root) return res;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int sz = q.size();                       // nodes on the current level
        res.emplace_back();
        for (int i = 0; i < sz; ++i) {
            TreeNode* n = q.front(); q.pop();
            res.back().push_back(n->val);
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
    }
    return res;
}

TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (!root || root == p || root == q) return root;
    TreeNode* l = lowestCommonAncestor(root->left, p, q);
    TreeNode* r = lowestCommonAncestor(root->right, p, q);
    if (l && r) return root;                     // p and q are on different sides
    return l ? l : r;
}`, 'C++'),
        java(`
class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

int best;
int height(TreeNode node) {
    if (node == null) return 0;
    int l = height(node.left), r = height(node.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
}
int diameterOfBinaryTree(TreeNode root) { best = 0; height(root); return best; }

List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int sz = q.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < sz; i++) {
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        res.add(level);
    }
    return res;
}

TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode l = lowestCommonAncestor(root.left, p, q);
    TreeNode r = lowestCommonAncestor(root.right, p, q);
    if (l != null && r != null) return root;
    return l != null ? l : r;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Every DFS/BFS above visits each node once: **O(n) time**.
- DFS space is the recursion depth **O(h)**: O(log n) for a balanced tree, but **O(n) for a skewed tree**. With n = 10⁵ in a skewed tree, recursion may overflow the stack in some environments; an iterative version with an explicit stack avoids that.
- BFS space is the maximum width of a level: up to about n/2 for a complete tree.
- Computing height separately at every node (calling height() inside a recursion over all nodes) is O(n²) on skewed trees. Compute it bottom-up once instead (for example in "is balanced").`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **No null base case**, or checking \`node->left->val\` without checking \`node->left\`.
2. **Mixing up what to return and what to record:** in diameter or max path sum, returning \`l + r + node\` instead of \`max(l, r) + node\`.
3. **Negative values in max path sum:** clamp a child's contribution at 0 (\`max(0, gain)\`) so negative branches are dropped.
4. **Recomputing heights repeatedly**, which is O(n²); combine "height" and "balanced" in one post-order pass.
5. **Using a global variable without resetting it** between calls (a Java field persists across test cases on LeetCode).
6. **BFS without capturing the level size first:** \`q.size()\` changes as you push children, so store it before the inner loop.
7. **Leaf-only conditions:** "root-to-leaf path sum" must only check at leaves (both children null), not at nodes with one child.`,
    },
  ],
  recognition: {
    signals: ['Input is a TreeNode root', 'Something about subtrees (height, size, sum, balanced): post-order', 'Something passed from the root down (depth, bounds, running path): pre-order', 'Levels, views, nearest, minimum depth: BFS'],
    antiSignals: ['The tree is a BST and you need order or search: use the BST property', 'General graph with cycles: graph BFS/DFS with a visited set'],
    decisionQuestions: ['What should a call return to its parent?', 'Does the answer bend through a node (use a global) or flow straight up (just return)?', 'Is the information flowing up or down?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'When do you use pre-, in- and post-order traversal?', answerMd: 'Pre-order when information flows from the root down (copying a tree, passing bounds or depth). In-order for sorted output on a BST. Post-order when a node needs results from its children (height, subtree sums, deleting a tree).' },
    { id: 'iq2', q: 'How do you compute the diameter of a binary tree in O(n)?', answerMd: 'One post-order pass: each call returns its height; at each node update best = max(best, leftHeight + rightHeight). The answer is best (in edges).' },
    { id: 'iq3', q: 'What is the space complexity of recursive tree DFS?', answerMd: 'O(h), the height: O(log n) for balanced trees, O(n) for skewed ones (the call stack). An iterative traversal with an explicit stack has the same bound but avoids stack overflow.' },
    { id: 'iq4', q: 'How do you find the lowest common ancestor in a binary tree (not a BST)?', answerMd: 'Recursively search both subtrees. If the current node is p or q, return it. If both sides return non-null, the current node is the LCA; otherwise return whichever side is non-null. O(n).' },
    { id: 'iq5', q: 'How do you serialise and deserialise a binary tree?', answerMd: 'Pre-order with explicit null markers (for example "1,2,#,#,3,#,#"), or BFS with nulls. Deserialise by reading tokens in the same order recursively (or with a queue). Null markers make the structure unambiguous.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Recipe: base case for null; combine left and right; return.
- Down-flow is pre-order; up-flow is post-order; sorted BST order is in-order.
- "Bends through a node" means return one side and update a global with both sides (diameter, max path sum).
- BFS: capture \`q.size()\` before processing a level.
- Max path sum: clamp negative gains at 0.
- Time O(n); space O(h), and a skewed tree means O(n).`,
    flashcards: [
      { id: 'f1', front: 'Diameter: what does the recursive call return, and what does it record?', backMd: 'Returns 1 + max(l, r) (height); records l + r (path bending at the node).' },
      { id: 'f2', front: 'Which traversal gives sorted order on a BST?', backMd: 'In-order (left, node, right).' },
      { id: 'f3', front: 'Level-order: why store q.size() first?', backMd: 'Children are pushed during the loop; the stored size marks where the current level ends.' },
      { id: 'f4', front: 'LCA in a binary tree: return rule?', backMd: 'If the node is null, p or q, return it; if both sides are non-null, return the node; else return the non-null side.' },
      { id: 'f5', front: 'Space of recursive DFS on a skewed tree of n nodes?', backMd: 'O(n) call stack.' },
    ],
  },
  mastery: { testSize: 8, testMinutes: 12, passPct: 80, minIndependentSolves: 5, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Tree traversal (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Tree_traversal', kind: 'article' },
    { title: 'NeetCode practice: Trees', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.binary-trees.q1', type: 'concept', difficulty: 'easy',
    stem: 'Which traversal should you use to compute the height of every subtree in one pass?',
    options: [['Pre-order', 'A node needs its children\'s heights first.'], ['In-order', 'Order is irrelevant here; the node needs both children\'s results.'], 'Post-order', ['Level-order', 'BFS processes top-down, before the children are known.']],
    answer: 2,
    explanation: 'Height depends on the children\'s heights, so the children must be processed before the node: post-order.',
  }),
  mcq({
    ...base, id: 'dsa.binary-trees.q2', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print (pre, in and post-order of the same tree)?',
    code: cpp(`#include <iostream>
#include <string>
using namespace std;
struct N { char v; N *l, *r; };
string pre(N* n)  { return n ? string(1, n->v) + pre(n->l) + pre(n->r) : ""; }
string in(N* n)   { return n ? in(n->l) + string(1, n->v) + in(n->r) : ""; }
string post(N* n) { return n ? post(n->l) + post(n->r) + string(1, n->v) : ""; }
int main() {
    N d{'D', nullptr, nullptr}, e{'E', nullptr, nullptr}, c{'C', nullptr, nullptr};
    N b{'B', &d, &e}, a{'A', &b, &c};
    cout << pre(&a) << " " << in(&a) << " " << post(&a) << endl;
    return 0;
}`, 'C++', 'ABDEC DBEAC DEBCA'),
    options: ['ABDEC DBEAC DEBCA', ['ABCDE DBEAC DEBCA', 'ABCDE is level order, not pre-order.'], ['ABDEC DBEAC DEBAC', 'In post-order the root A comes last.'], ['ABDEC BDEAC DEBCA', 'In-order visits the left subtree (D, B, E) before A.']],
    answer: 0,
    explanation: 'A has children B (with D, E) and C. Pre: A B D E C. In: D B E A C. Post: D E B C A.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.binary-trees.q3', type: 'pattern', difficulty: 'medium',
    stem: 'Return the values visible when looking at a binary tree from the right side (the last node of each level). Most direct approach?',
    options: ['BFS level by level, recording the last node of each level', ['In-order traversal', 'In-order mixes levels.'], ['Follow right pointers from the root', 'A left subtree can be deeper and visible at lower levels.'], ['Sort values by depth', 'Sorting by depth alone loses left-to-right order within a level.']],
    answer: 0,
    explanation: 'Level-order processes each level fully; the last node dequeued per level is the rightmost visible node. (A DFS that visits right first and records the first node at each depth also works.)',
  }),
  mcq({
    ...base, id: 'dsa.binary-trees.q4', type: 'debug', difficulty: 'hard',
    stem: 'A maximum-path-sum solution returns `node.val + left + right` from each call. Why is that wrong?',
    options: ['A path that continues to the parent can only extend through one child; returning both sides creates a path that forks', ['It should return only node.val', 'The parent needs the best downward path.'], ['It overflows', 'Overflow is not the logical bug.'], ['It should use BFS', 'DFS is right; the return value is the bug.']],
    answer: 0,
    explanation: 'Return node.val + max(left, right, 0) to the parent, and update the global answer with node.val + max(left, 0) + max(right, 0), the bend at this node.',
  }),
  mcq({
    ...base, id: 'dsa.binary-trees.q5', type: 'complexity', difficulty: 'medium',
    stem: 'An "is balanced" check calls an O(size) `height()` function at every node. What is the worst-case time?',
    options: [['O(n)', 'Only if heights are computed once bottom-up.'], ['O(n log n) always', 'That is the balanced-tree case; a skewed tree is worse.'], 'O(n²) for a skewed tree', ['O(h)', 'Every node must be visited.']],
    answer: 2,
    explanation: 'On a chain, height(root) is n, height(child) is n − 1, and so on: the sum is O(n²). A single post-order pass that returns −1 on imbalance is O(n).',
  }),
  mcq({
    ...base, id: 'dsa.binary-trees.q6', type: 'edge-case', difficulty: 'medium',
    stem: '"Root-to-leaf path sum equals target": a solution returns true whenever the running sum equals target at **any** node. Which tree breaks it?',
    options: ['Root 1 with only a left child 2, target 1: it returns true at the root, which is not a leaf', ['A single node 5, target 5', 'That node is a leaf, so true is correct.'], ['An empty tree, target 0', 'That is usually false and unaffected.'], ['A perfect tree', 'The bug appears when an internal node matches.']],
    answer: 0,
    explanation: 'The root has a child, so it is not a leaf; the only root-to-leaf path is 1 → 2 with sum 3. Check the sum only when both children are null.',
  }),
  mcq({
    ...base, id: 'dsa.binary-trees.q7', type: 'concept', difficulty: 'easy',
    stem: 'What is the maximum number of nodes in a binary tree of height h (counting levels, so a single node has height 1)?',
    options: [['2h', 'Growth is exponential, not linear.'], '2^h − 1', ['2^(h+1)', 'Off by one level.'], ['h²', 'Growth is exponential.']],
    answer: 1,
    explanation: 'Level i holds at most 2^(i−1) nodes, and the sum over h levels is 2^h − 1 (a perfect binary tree).',
  }),
  mcq({
    ...base, id: 'dsa.binary-trees.q8', type: 'pattern', difficulty: 'medium',
    stem: 'Check whether a binary tree is symmetric (a mirror of itself). Which recursion is correct?',
    options: ['mirror(a, b) = both null, or both non-null with a.val == b.val, mirror(a.left, b.right) and mirror(a.right, b.left)', ['Compare in-order traversal with its reverse', 'Different shapes can share the same in-order sequence.'], ['Check left == right recursively', 'Mirroring compares outer with outer and inner with inner.'], ['Compare heights of the two subtrees', 'Equal heights do not imply symmetry.']],
    answer: 0,
    explanation: 'Mirror pairs are (left.left, right.right) and (left.right, right.left). Comparing traversal sequences fails because they do not encode structure.',
  }),
];
