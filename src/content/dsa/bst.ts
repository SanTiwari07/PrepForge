import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.bst';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Binary Search Trees',
  summary: 'Ordered trees: validation, inorder properties, kth smallest and LCA.',
  level: 'core',
  status: 'complete',
  estMinutes: 80,
  prerequisites: ['dsa.binary-trees'],
  related: ['dsa.binary-search', 'dsa.stl-collections', 'dsa.design-ds', 'dsa.heaps'],
  subtopics: ['The BST invariant', 'Search, insert and delete', 'Inorder traversal is sorted', 'Validation with bounds', 'k-th smallest', 'LCA in a BST', 'Balanced trees in the standard library'],
  objectives: [
    'State the BST invariant precisely (every node in the left subtree is smaller, every node in the right subtree is larger) and why checking only children is wrong.',
    'Search, insert and delete in O(h), including the two-children delete case.',
    'Use the fact that an inorder traversal visits keys in sorted order to solve validation, k-th smallest and recovery problems.',
    'Find the lowest common ancestor in a BST by comparing values, without searching both subtrees.',
    'Explain why h can be O(n), and when to reach for std::set/map or TreeSet/TreeMap instead of writing a tree.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'The invariant and what it buys you',
      bodyMd: `A **binary search tree** stores keys so that for every node v:

- every key in v's **left subtree** is < v.key, and
- every key in v's **right subtree** is > v.key

(LeetCode's BST problems use strict inequalities; some definitions allow duplicates on one side.)

The invariant is about **whole subtrees**, not just children. The tree \`5 → left 3 → right 6\` satisfies "each child is on the correct side of its parent", yet 6 sits in the left subtree of 5, so it is **not** a BST.

Operations follow one root-to-leaf path, so they cost **O(h)**, where h is the height:

| Operation | How |
|---|---|
| Search | go left if key < node, right if key > node |
| Insert | search until a null child, attach there |
| Delete, 0 or 1 child | splice the node out |
| Delete, 2 children | replace the key with the inorder successor (the minimum of the right subtree), then delete that successor from the right subtree |
| Min / max | leftmost / rightmost node |

A balanced tree has h = O(log n); inserting sorted keys into a plain BST produces a chain with h = n. Self-balancing trees (red-black, AVL) keep h = O(log n); \`std::set\`/\`std::map\` and Java's \`TreeSet\`/\`TreeMap\` are red-black trees.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Two lenses: bounds and inorder order',
      bodyMd: `**Lens 1: every node has an allowed range.** The root may be anything; going left tightens the upper bound to the parent's key, going right tightens the lower bound. Validation passes \`(low, high)\` down and checks \`low < key < high\`. Using \`long\` (or nullable) bounds avoids failing on keys equal to INT_MIN/INT_MAX.

**Lens 2: inorder traversal is sorted.** Left, node, right visits keys in increasing order. So:
- *Validate:* the inorder sequence must be strictly increasing (compare with the previous key).
- *k-th smallest:* stop at the k-th visited node, O(h + k).
- *Recover a BST with two swapped nodes:* find the one or two places where the inorder sequence decreases.
- *Minimum difference between any two keys:* only consecutive inorder keys can achieve it.
- *Convert a sorted array to a balanced BST:* pick the middle as the root, recurse on both halves (the reverse direction).

**LCA in a BST:** if both values are smaller than the current node, the LCA is in the left subtree; if both are larger, it is in the right; otherwise the current node splits them and *is* the LCA. That is O(h), with no need to search both sides as in a general binary tree.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: deleting 5 (two children) from the BST 5, 3, 8, 7, 9, 6',
      bodyMd: 'Inorder order is 3, 5, 6, 7, 8, 9. The inorder successor of 5 is 6, the minimum of its right subtree.',
      trace: [
        { note: 'Find 5: it is the root, and it has two children (3 and 8).', array: [3, 5, 6, 7, 8, 9], highlight: [1] },
        { note: 'Successor: go right once (8), then left as far as possible: 7, then 6.', array: [3, 5, 6, 7, 8, 9], highlight: [2], pointers: { succ: 2 } },
        { note: 'Copy 6 into the root. The tree temporarily holds 6 twice.', array: [3, 6, 6, 7, 8, 9], highlight: [1, 2] },
        { note: 'Delete 6 from the right subtree. It has no left child (it is a minimum), so it has at most one child: splice it out.', array: [3, 6, 7, 8, 9], highlight: [1] },
        { note: 'Inorder is still sorted: 3, 6, 7, 8, 9. The invariant holds.', array: [3, 6, 7, 8, 9] },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Validation with bounds, iterative k-th smallest, BST LCA, and delete.',
      code: [
        cpp(`
bool valid(TreeNode* n, long long lo, long long hi) {
    if (!n) return true;
    if (n->val <= lo || n->val >= hi) return false;
    return valid(n->left, lo, n->val) && valid(n->right, n->val, hi);
}
bool isValidBST(TreeNode* root) { return valid(root, LLONG_MIN, LLONG_MAX); }

int kthSmallest(TreeNode* root, int k) {          // iterative inorder, stops early
    vector<TreeNode*> st;
    TreeNode* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push_back(cur); cur = cur->left; }
        cur = st.back(); st.pop_back();
        if (--k == 0) return cur->val;
        cur = cur->right;
    }
    return -1;
}

TreeNode* lcaBST(TreeNode* root, TreeNode* p, TreeNode* q) {
    while (root) {
        if (p->val < root->val && q->val < root->val) root = root->left;
        else if (p->val > root->val && q->val > root->val) root = root->right;
        else return root;                             // they split here (or one equals root)
    }
    return nullptr;
}

TreeNode* deleteNode(TreeNode* root, int key) {
    if (!root) return nullptr;
    if (key < root->val) root->left = deleteNode(root->left, key);
    else if (key > root->val) root->right = deleteNode(root->right, key);
    else {
        if (!root->left) return root->right;          // 0 or 1 child
        if (!root->right) return root->left;
        TreeNode* s = root->right;                    // two children: inorder successor
        while (s->left) s = s->left;
        root->val = s->val;
        root->right = deleteNode(root->right, s->val);
    }
    return root;
}`, 'C++'),
        java(`
boolean isValidBST(TreeNode root) { return valid(root, Long.MIN_VALUE, Long.MAX_VALUE); }
boolean valid(TreeNode n, long lo, long hi) {
    if (n == null) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return valid(n.left, lo, n.val) && valid(n.right, n.val, hi);
}

int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> st = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !st.isEmpty()) {
        while (cur != null) { st.push(cur); cur = cur.left; }
        cur = st.pop();
        if (--k == 0) return cur.val;
        cur = cur.right;
    }
    return -1;
}

TreeNode lcaBST(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val < root.val && q.val < root.val) root = root.left;
        else if (p.val > root.val && q.val > root.val) root = root.right;
        else return root;
    }
    return null;
}

TreeNode deleteNode(TreeNode root, int key) {
    if (root == null) return null;
    if (key < root.val) root.left = deleteNode(root.left, key);
    else if (key > root.val) root.right = deleteNode(root.right, key);
    else {
        if (root.left == null) return root.right;
        if (root.right == null) return root.left;
        TreeNode s = root.right;
        while (s.left != null) s = s.left;
        root.val = s.val;
        root.right = deleteNode(root.right, s.val);
    }
    return root;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Search, insert, delete, LCA: **O(h)** time; recursive versions use O(h) stack.
- h is O(log n) for balanced trees and up to n for skewed ones (insert 1, 2, 3, … in order). Interview answers should say "O(h), which is O(log n) if balanced".
- Validation and full inorder traversal: O(n) time, O(h) space.
- k-th smallest with early stopping: O(h + k). If the tree changes often and k-th queries are frequent, store subtree sizes in each node for O(h) queries (an order-statistic tree).
- Building a balanced BST from a sorted array: O(n).
- \`std::set\`, \`std::map\`, \`TreeSet\`, \`TreeMap\`: O(log n) guaranteed for insert, erase, find, lower_bound/ceiling and floor.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Validating only against children.** \`left.val < node.val < right.val\` at every node accepts invalid trees. Pass bounds down, or check the inorder sequence.
2. **Using int bounds** initialised to INT_MIN/INT_MAX: a tree containing INT_MAX as a key fails. Use 64-bit or nullable bounds.
3. **Allowing equal keys** when the problem demands strictly increasing order (\`<=\` vs \`<\`).
4. **Delete with two children: forgetting to delete the successor** from the right subtree, which leaves a duplicate.
5. **Searching both subtrees for the LCA** in a BST: correct but ignores the ordering, O(n) instead of O(h).
6. **Assuming O(log n)** without balance. A plain BST built from sorted input is a linked list.
7. **Recursion depth** on skewed trees with 10⁴–10⁵ nodes: prefer the iterative inorder.`,
    },
  ],
  recognition: {
    signals: ['The input is stated to be a BST', 'Sorted order matters: k-th smallest, successor, closest value, range sums', 'Validate or repair ordering in a tree', 'Need floor/ceiling or ordered iteration on a dynamic set'],
    antiSignals: ['A general binary tree without ordering: use tree DFS/BFS', 'Only min/max is needed repeatedly: a heap is simpler', 'Only membership: a hash set is O(1) average'],
    decisionQuestions: ['Can I use the ordering to discard a whole subtree?', 'Is the inorder sequence what I actually need?', 'Is the tree balanced, or should I state O(h)?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you validate a BST?', answerMd: 'Recursively pass an allowed open interval (lo, hi): the root has (−∞, +∞); a left child gets (lo, parent), a right child gets (parent, hi). Each key must lie strictly inside. Alternatively do an inorder traversal and check that each key is greater than the previous one. Both are O(n) time, O(h) space. Use 64-bit or nullable bounds.' },
    { id: 'iq2', q: 'Delete a node with two children from a BST.', answerMd: 'Find the inorder successor (the leftmost node of the right subtree; it has no left child). Copy its key into the node, then delete the successor from the right subtree, which is the easy 0-or-1-child case. The predecessor (rightmost of the left subtree) works symmetrically.' },
    { id: 'iq3', q: 'Find the lowest common ancestor of two nodes in a BST.', answerMd: 'From the root: if both keys are smaller, go left; if both are larger, go right; otherwise the current node is where their paths split (or one of them is the current node), so return it. O(h) time, O(1) space iteratively.' },
    { id: 'iq4', q: 'Two nodes of a BST were swapped by mistake. How do you fix it?', answerMd: 'Do an inorder traversal and find the positions where prev > cur. If there is one such place, the two nodes are adjacent: swap prev and cur. If there are two, swap the first prev with the second cur. O(n) time; O(h) with recursion or O(1) with Morris traversal.' },
    { id: 'iq5', q: 'Why use a TreeMap or std::map instead of a hash map?', answerMd: 'Ordered operations: iteration in key order, floor/ceiling (lower_bound/upper_bound), range queries, first/last key, all in O(log n) guaranteed. A hash map gives O(1) average lookups but no order. Example: a calendar booking system that checks the nearest existing booking.' },
    { id: 'iq6', q: 'What is the time complexity of inserting n sorted keys into an unbalanced BST?', answerMd: 'O(n²): each insert walks the whole chain built so far (1 + 2 + … + n). The tree degenerates into a linked list of height n. Balanced trees keep each insert O(log n), for O(n log n) total.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Invariant: left subtree < node < right subtree (whole subtrees, not only children).
- Ops are O(h); h = O(log n) only if balanced.
- Validate with (lo, hi) bounds in 64-bit, or check inorder is strictly increasing.
- Inorder = sorted: k-th smallest, min diff, recover swapped nodes.
- Delete with two children: copy the successor, delete it from the right subtree.
- LCA in BST: both smaller → left, both larger → right, else here.
- Ordered set/map for floor/ceiling: std::set/map, TreeSet/TreeMap.`,
    flashcards: [
      { id: 'f1', front: 'Why is checking each node against its children not enough to validate a BST?', backMd: 'The invariant covers whole subtrees: 5 → left 3 → right 6 passes the child check but 6 > 5 sits in the left subtree.' },
      { id: 'f2', front: 'Inorder successor of a node with a right child?', backMd: 'The leftmost node of its right subtree.' },
      { id: 'f3', front: 'LCA in a BST in O(h)?', backMd: 'Walk down: both keys smaller → left, both larger → right, otherwise the current node.' },
      { id: 'f4', front: 'k-th smallest in a BST?', backMd: 'Iterative inorder traversal; return the k-th visited node. O(h + k).' },
      { id: 'f5', front: 'Which Java/C++ containers are balanced BSTs?', backMd: 'TreeMap/TreeSet; std::map/std::set (red-black trees).' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 12, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Binary search tree (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Binary_search_tree', kind: 'article' },
    { title: 'TreeMap (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html', kind: 'official-docs' },
    { title: 'std::map (cppreference)', url: 'https://en.cppreference.com/w/cpp/container/map', kind: 'official-docs' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.bst.q1', type: 'code-output', difficulty: 'easy',
    stem: 'Keys are inserted into an empty, unbalanced BST in this order. What does the inorder traversal print?',
    code: cpp(`#include <iostream>
using namespace std;
struct Node { int v; Node *l = nullptr, *r = nullptr; Node(int x) : v(x) {} };
Node* insert(Node* n, int x) {
    if (!n) return new Node(x);
    if (x < n->v) n->l = insert(n->l, x); else n->r = insert(n->r, x);
    return n;
}
void inorder(Node* n) { if (!n) return; inorder(n->l); cout << n->v << " "; inorder(n->r); }
int main() {
    Node* root = nullptr;
    for (int x : {50, 30, 70, 20, 40, 60, 80}) root = insert(root, x);
    inorder(root);
    cout << endl;
    return 0;
}`, 'C++', '20 30 40 50 60 70 80'),
    options: ['20 30 40 50 60 70 80', ['50 30 20 40 70 60 80', 'That is the preorder traversal.'], ['20 40 30 60 80 70 50', 'That is the postorder traversal.'], ['50 30 70 20 40 60 80', 'That is the level order (and the insertion order).']],
    answer: 0,
    explanation: 'Inorder traversal of any BST visits keys in sorted order, whatever the insertion order.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.bst.q2', type: 'edge-case', difficulty: 'medium',
    stem: 'A validator checks `node.left.val < node.val < node.right.val` at every node. Which tree does it wrongly accept?',
    options: ['Root 10, left child 5, and 5 has a right child 15', ['Root 10, left 5, right 15', 'That is a valid BST, correctly accepted.'], ['Root 10, left 15', 'The child check rejects it.'], ['A single node', 'A single node is a valid BST.']],
    answer: 0,
    explanation: '15 is a right child of 5, so the local check passes, but 15 is in the left subtree of 10 and must be smaller than 10. Bounds (lo, hi) catch it: 15 must lie in (5, 10).',
  }),
  mcq({
    ...base, id: 'dsa.bst.q3', type: 'complexity', difficulty: 'easy',
    stem: 'What is the worst-case time to search an unbalanced BST with n nodes?',
    options: ['O(n)', ['O(log n)', 'Only when the tree is balanced.'], ['O(1)', 'You must walk down a path.'], ['O(n log n)', 'A search follows one path.']],
    answer: 0,
    explanation: 'Inserting sorted keys gives a chain of height n; a search for the largest key walks all of it.',
  }),
  mcq({
    ...base, id: 'dsa.bst.q4', type: 'concept', difficulty: 'medium',
    stem: 'When deleting a node with two children, why is its inorder successor easy to remove from the right subtree?',
    options: ['It is the minimum of that subtree, so it has no left child', ['It is always a leaf', 'It may have a right child.'], ['It is always the right child', 'Only when the right child has no left child.'], ['It has the same key as the deleted node', 'Keys are distinct.']],
    answer: 0,
    explanation: 'The leftmost node of a subtree cannot have a left child, so removing it is the 0-or-1-child case: replace it with its right child.',
  }),
  mcq({
    ...base, id: 'dsa.bst.q5', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        TreeSet<Integer> s = new TreeSet<>(List.of(10, 20, 30, 40));
        System.out.println(s.floor(25) + " " + s.ceiling(25) + " " + s.higher(40) + " " + s.lower(10));
    }
}`, 'Java', '20 30 null null'),
    options: ['20 30 null null', ['30 20 null null', 'floor is the largest key ≤ 25.'], ['20 30 40 10', 'higher is strictly greater; nothing exceeds 40.'], ['It throws NoSuchElementException', 'floor/ceiling/higher/lower return null when there is no such key.']],
    answer: 0,
    explanation: 'floor(25) = 20 (≤), ceiling(25) = 30 (≥), higher(40) = none (>), lower(10) = none (<). These navigation methods return null rather than throwing.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.bst.q6', type: 'pattern', difficulty: 'medium',
    stem: 'You need the k-th smallest key of a BST many times while keys are inserted and deleted. What keeps each query O(h)?',
    options: ['Store the size of each subtree in its node', ['Re-run a full inorder traversal each time', 'O(n) per query.'], ['Keep a max-heap of size k', 'A different k per query breaks it, and deletions are hard.'], ['Cache the inorder array', 'Every update invalidates it in O(n).']],
    answer: 0,
    explanation: 'With subtree sizes, compare k with size(left) + 1 at each node and go left or right: an order-statistic tree. Updates adjust sizes along the path, also O(h).',
  }),
  mcq({
    ...base, id: 'dsa.bst.q7', type: 'concept', difficulty: 'easy',
    stem: 'In a BST, p = 2 and q = 8, and the root is 6. Where is their lowest common ancestor?',
    options: ['The root, 6', ['In the left subtree', 'q = 8 is larger than 6.'], ['In the right subtree', 'p = 2 is smaller than 6.'], ['It depends on the shape of the tree', 'The split at 6 decides it.']],
    answer: 0,
    explanation: 'The keys fall on different sides of 6, so their paths diverge at 6. That makes 6 the LCA.',
  }),
  mcq({
    ...base, id: 'dsa.bst.q8', type: 'debug', difficulty: 'medium',
    stem: 'A validator uses `boolean valid(TreeNode n, int lo, int hi)` called as `valid(root, Integer.MIN_VALUE, Integer.MAX_VALUE)` with strict checks `lo < n.val < hi`. Which input is wrongly rejected?',
    options: ['A single node with value 2147483647', ['A single node with value 0', '0 lies strictly between the bounds.'], ['An empty tree', 'null returns true.'], ['Root 2, left 1, right 3', 'All keys are strictly inside.']],
    answer: 0,
    explanation: 'Integer.MAX_VALUE is not strictly less than hi = Integer.MAX_VALUE. Use long bounds or nullable Integer bounds.',
  }),
];
