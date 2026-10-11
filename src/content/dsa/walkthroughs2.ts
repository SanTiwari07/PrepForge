import type { CoachWalkthrough } from '../schema';
import { cpp, java } from '../helpers';

// Original PrepForge walkthroughs (batch 2). Statements are not copied; read the official one.
export const walkthroughs2: Record<string, CoachWalkthrough> = {
  'valid-parentheses': {
    understandMd: 'Decide whether a string of the six bracket characters is properly nested and closed: every closer must match the most recent unmatched opener.',
    ioConstraintsMd: 'Length up to 10⁴, only ()[]{} characters. Output: true or false.',
    edgeCases: ['Starts with a closer, e.g. "]"', 'Only openers, e.g. "(("', 'Interleaved, e.g. "([)]"', 'Odd length (always false)'],
    bruteForceMd: 'Repeatedly delete adjacent pairs "()", "[]" and "{}" until no more can be removed; valid iff the string becomes empty.',
    bruteComplexity: 'O(n²): up to n/2 passes, each O(n).',
    bottleneckMd: 'Rescanning the whole string after each deletion. The only pair that can close next is the most recent opener, so we only need to remember openers in order.',
    hints: [
      'When you see a closer, which opener must it match?',
      'You need the most recent unmatched opener, quickly. Which structure gives "most recent" in O(1)?',
      'Push openers on a stack; on a closer, the top must be its partner. At the end the stack must be empty.',
      'for c in s: if opener push; else if stack empty or top != partner(c) return false; else pop. return stack.empty()',
    ],
    optimalMd: 'A stack of openers. Each closer pops and must match. Leftover openers or a closer with an empty stack make the string invalid.',
    code: [
      cpp(`
bool isValid(string s) {
    vector<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') st.push_back(c);
        else {
            if (st.empty()) return false;
            char o = st.back(); st.pop_back();
            if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) return false;
        }
    }
    return st.empty();
}`, 'C++'),
      java(`
public boolean isValid(String s) {
    Deque<Character> st = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') st.push(c);
        else {
            if (st.isEmpty()) return false;
            char o = st.pop();
            if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) return false;
        }
    }
    return st.isEmpty();
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(n) space.',
    testCases: [
      { input: '"()[]{}"', expected: 'true', why: 'Sequential pairs' },
      { input: '"([)]"', expected: 'false', why: 'Interleaving is invalid' },
      { input: '"]"', expected: 'false', why: 'Closer with an empty stack' },
      { input: '"(("', expected: 'false', why: 'Unclosed openers' },
    ],
    takeawaysMd: 'Nesting means LIFO. Check both failure modes: an empty stack on a closer, and a non-empty stack at the end.',
  },

  'min-stack': {
    understandMd: 'Design a stack that supports push, pop, top and getMin, all in O(1).',
    ioConstraintsMd: 'Up to 3·10⁴ calls; pop/top/getMin are only called on a non-empty stack.',
    edgeCases: ['Pushing a value equal to the current minimum, then popping it', 'Negative values', 'Pop until one element remains'],
    bruteForceMd: 'Use a normal stack; getMin scans every element.',
    bruteComplexity: 'getMin O(n).',
    bottleneckMd: 'The minimum is recomputed from scratch, even though it only changes when elements are pushed or popped.',
    hints: [
      'When you pop the current minimum, how would you know the previous minimum?',
      'Store extra information alongside each element at push time.',
      'Store the minimum of the stack at that moment together with each value.',
      'push(x): st.push((x, min(x, st.top.min))); getMin: st.top.min',
    ],
    optimalMd: 'Each stack entry stores (value, minimum so far). Popping restores the previous minimum automatically, because it is stored in the entry below.',
    code: [
      cpp(`
class MinStack {
    vector<pair<int, int>> st;
public:
    void push(int x) { st.push_back({x, st.empty() ? x : min(x, st.back().second)}); }
    void pop() { st.pop_back(); }
    int top() { return st.back().first; }
    int getMin() { return st.back().second; }
};`, 'C++'),
      java(`
class MinStack {
    private final Deque<int[]> st = new ArrayDeque<>();
    public void push(int x) { st.push(new int[]{x, st.isEmpty() ? x : Math.min(x, st.peek()[1])}); }
    public void pop() { st.pop(); }
    public int top() { return st.peek()[0]; }
    public int getMin() { return st.peek()[1]; }
}`, 'Java'),
    ],
    finalComplexity: 'O(1) per operation, O(n) space.',
    testCases: [
      { input: 'push −2, push 0, push −3, getMin, pop, top, getMin', expected: '−3, 0, −2', why: 'Popping the minimum restores the previous one' },
      { input: 'push 1, push 1, pop, getMin', expected: '1', why: 'Duplicate minimum values' },
    ],
    takeawaysMd: 'To support an aggregate query on a stack in O(1), store the aggregate at each level.',
  },

  'daily-temperatures': {
    understandMd: 'For each day, report how many days you must wait for a strictly warmer temperature, or 0 if none comes.',
    ioConstraintsMd: 'Up to 10⁵ days, temperatures 30–100. O(n²) is too slow in the worst case.',
    edgeCases: ['Strictly decreasing temperatures (all 0)', 'Equal temperatures (equal is not warmer)', 'A single day'],
    bruteForceMd: 'For each day, scan forward until a warmer day is found.',
    bruteComplexity: 'O(n²) in the worst case.',
    bottleneckMd: 'Colder days are re-scanned by many earlier days. Once a warmer day appears, it answers every waiting colder day at once.',
    hints: [
      'Process days left to right. Which past days are still waiting for an answer?',
      'The waiting days, read from most recent, have non-increasing temperatures. That is a monotonic stack.',
      'Keep a stack of indices. When today is warmer than the top, the top has found its answer: today − top.',
      'for i: while st and T[st.top] < T[i]: ans[st.top] = i − st.top; pop. push i',
    ],
    optimalMd: 'A monotonic decreasing stack of indices. Each index is pushed and popped at most once.',
    code: [
      cpp(`
vector<int> dailyTemperatures(vector<int>& t) {
    vector<int> ans(t.size(), 0), st;
    for (int i = 0; i < (int)t.size(); ++i) {
        while (!st.empty() && t[st.back()] < t[i]) { ans[st.back()] = i - st.back(); st.pop_back(); }
        st.push_back(i);
    }
    return ans;
}`, 'C++'),
      java(`
public int[] dailyTemperatures(int[] t) {
    int[] ans = new int[t.length];
    Deque<Integer> st = new ArrayDeque<>();
    for (int i = 0; i < t.length; i++) {
        while (!st.isEmpty() && t[st.peek()] < t[i]) { int j = st.pop(); ans[j] = i - j; }
        st.push(i);
    }
    return ans;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(n) space.',
    testCases: [
      { input: '[73, 74, 75, 71, 69, 72, 76, 73]', expected: '[1, 1, 4, 2, 1, 1, 0, 0]', why: 'Classic' },
      { input: '[30, 30, 30]', expected: '[0, 0, 0]', why: 'Equal is not warmer' },
    ],
    takeawaysMd: '"Next greater element" is a monotonic stack. Store indices to get distances.',
  },

  'reverse-linked-list': {
    understandMd: 'Reverse the direction of every next pointer and return the new head.',
    ioConstraintsMd: 'Up to 5000 nodes. Do it iteratively with O(1) extra space (recursion is a follow-up).',
    edgeCases: ['Empty list', 'Single node', 'Two nodes'],
    bruteForceMd: 'Copy the values into an array, then rebuild or rewrite the list in reverse order.',
    bruteComplexity: 'O(n) time, O(n) extra space.',
    bottleneckMd: 'The extra array is unnecessary: nodes can be relinked in place if we never lose the rest of the list.',
    hints: [
      'Draw three nodes. After reversal, what should the first node point to?',
      'Walk the list, flipping one pointer at a time. Which pointers must you remember?',
      'Keep prev (the reversed part) and cur; save cur.next before overwriting it.',
      'prev = null; while cur: nxt = cur.next; cur.next = prev; prev = cur; cur = nxt. return prev',
    ],
    optimalMd: 'Iterative three-pointer reversal. The reversed prefix grows one node at a time.',
    code: [
      cpp(`
ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    while (head) {
        ListNode* nxt = head->next;
        head->next = prev;
        prev = head;
        head = nxt;
    }
    return prev;
}`, 'C++'),
      java(`
public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    while (head != null) {
        ListNode nxt = head.next;
        head.next = prev;
        prev = head;
        head = nxt;
    }
    return prev;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space.',
    testCases: [
      { input: '[1, 2, 3, 4, 5]', expected: '[5, 4, 3, 2, 1]', why: 'Basic' },
      { input: '[]', expected: '[]', why: 'Empty list returns null' },
    ],
    takeawaysMd: 'Before overwriting a pointer, save what it points to. This three-pointer loop is a building block for many list problems.',
  },

  'merge-two-sorted-lists': {
    understandMd: 'Splice two sorted linked lists into one sorted list and return its head.',
    ioConstraintsMd: 'Each list has up to 50 nodes; either can be empty.',
    edgeCases: ['One list empty', 'Both empty', 'Equal values across lists'],
    bruteForceMd: 'Collect all values, sort them, build a new list.',
    bruteComplexity: 'O((n + m) log(n + m)) time, O(n + m) space.',
    bottleneckMd: 'Sorting ignores that both inputs are already sorted: comparing the two current heads always yields the next node.',
    hints: [
      'Which node comes first in the merged list?',
      'Compare the heads; the smaller one is next. Repeat. How do you avoid special-casing the very first node?',
      'Use a dummy node and a tail pointer; attach the smaller head; when one list ends, attach the rest of the other.',
      'dummy; tail = dummy; while a and b: attach the smaller, advance; tail.next = a or b; return dummy.next',
    ],
    optimalMd: 'A two-pointer merge with a dummy head, relinking existing nodes.',
    code: [
      cpp(`
ListNode* mergeTwoLists(ListNode* a, ListNode* b) {
    ListNode dummy(0);
    ListNode* tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) { tail->next = a; a = a->next; }
        else { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}`, 'C++'),
      java(`
public ListNode mergeTwoLists(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;
    return dummy.next;
}`, 'Java'),
    ],
    finalComplexity: 'O(n + m) time, O(1) extra space.',
    testCases: [
      { input: '[1, 2, 4] and [1, 3, 4]', expected: '[1, 1, 2, 3, 4, 4]', why: 'Basic' },
      { input: '[] and [0]', expected: '[0]', why: 'One empty list' },
    ],
    takeawaysMd: 'A dummy head plus a tail pointer is the standard way to build an output list without head special cases.',
  },

  'linked-list-cycle': {
    understandMd: 'Decide whether following next pointers from the head ever revisits a node.',
    ioConstraintsMd: 'Up to 10⁴ nodes. Follow-up: O(1) memory.',
    edgeCases: ['Empty list', 'Single node pointing to itself', 'Cycle back to the head'],
    bruteForceMd: 'Store visited node addresses in a hash set; a repeat means a cycle.',
    bruteComplexity: 'O(n) time, O(n) space.',
    bottleneckMd: 'Memory: the set stores every node. In a cycle, two pointers moving at different speeds must eventually meet.',
    hints: [
      'If there is a cycle, a pointer walking the list never reaches null. How can you detect looping without remembering every node?',
      'Think of two runners on a circular track at different speeds.',
      'Move slow by 1 and fast by 2. They meet if and only if there is a cycle.',
      'slow = fast = head; while fast and fast.next: slow = slow.next; fast = fast.next.next; if slow == fast return true. return false',
    ],
    optimalMd: "Floyd's tortoise and hare. Inside a cycle the gap between fast and slow shrinks by 1 each step, so they must meet.",
    code: [
      cpp(`
bool hasCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}`, 'C++'),
      java(`
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space.',
    testCases: [
      { input: '[3, 2, 0, −4], tail connects to index 1', expected: 'true', why: 'Cycle in the middle' },
      { input: '[1], no cycle', expected: 'false', why: 'Single node' },
    ],
    takeawaysMd: 'Fast/slow pointers detect cycles, find the middle, and (with a reset) find the cycle start, all in O(1) space.',
  },

  'invert-binary-tree': {
    understandMd: 'Mirror the tree: swap the left and right child of every node.',
    ioConstraintsMd: 'Up to 100 nodes. Return the root.',
    edgeCases: ['Empty tree', 'Single node', 'Skewed tree'],
    bruteForceMd: 'This problem is already linear; the "brute force" is the solution. The challenge is writing the recursion cleanly.',
    bruteComplexity: 'O(n).',
    bottleneckMd: 'None. Focus on a correct base case and the order of operations.',
    hints: [
      'What does inverting an empty tree return?',
      'If both subtrees are already inverted, what is left to do at the root?',
      'Swap the children, then recurse (or recurse, then swap): pre-order or post-order both work.',
      'invert(n): if null return null; swap(n.left, n.right); invert(n.left); invert(n.right); return n',
    ],
    optimalMd: 'Recursive DFS swapping children at every node (or BFS with a queue).',
    code: [
      cpp(`
TreeNode* invertTree(TreeNode* root) {
    if (!root) return nullptr;
    swap(root->left, root->right);
    invertTree(root->left);
    invertTree(root->right);
    return root;
}`, 'C++'),
      java(`
public TreeNode invertTree(TreeNode root) {
    if (root == null) return null;
    TreeNode tmp = root.left;
    root.left = invertTree(root.right);
    root.right = invertTree(tmp);
    return root;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(h) space.',
    testCases: [
      { input: '[4, 2, 7, 1, 3, 6, 9]', expected: '[4, 7, 2, 9, 6, 3, 1]', why: 'Perfect tree' },
      { input: '[]', expected: '[]', why: 'Empty tree' },
    ],
    takeawaysMd: 'Trust the recursion: assume the subtrees are handled and only decide what to do at the current node.',
  },

  'maximum-depth-of-binary-tree': {
    understandMd: 'Return the number of nodes on the longest root-to-leaf path.',
    ioConstraintsMd: 'Up to 10⁴ nodes.',
    edgeCases: ['Empty tree (depth 0)', 'Skewed tree (depth n)'],
    bruteForceMd: 'Enumerate every root-to-leaf path and take the longest.',
    bruteComplexity: 'O(n) anyway, but with unnecessary path bookkeeping.',
    bottleneckMd: 'You do not need the paths, only their lengths. Each subtree\'s depth can be returned upward.',
    hints: [
      'What is the depth of an empty tree?',
      'How does a node\'s depth relate to its children\'s depths?',
      'depth(node) = 1 + max(depth(left), depth(right)).',
      'if null return 0; return 1 + max(depth(left), depth(right))',
    ],
    optimalMd: 'Post-order recursion returning the depth (or BFS counting levels).',
    code: [
      cpp(`
int maxDepth(TreeNode* root) {
    if (!root) return 0;
    return 1 + max(maxDepth(root->left), maxDepth(root->right));
}`, 'C++'),
      java(`
public int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(h) space.',
    testCases: [
      { input: '[3, 9, 20, null, null, 15, 7]', expected: '3', why: 'Basic' },
      { input: '[1, null, 2]', expected: '2', why: 'One-sided' },
    ],
    takeawaysMd: 'When a node\'s answer depends on its children\'s answers, use post-order recursion that returns values upward.',
  },

  'diameter-of-binary-tree': {
    understandMd: 'Return the number of edges on the longest path between any two nodes; the path need not pass through the root.',
    ioConstraintsMd: 'Up to 10⁴ nodes.',
    edgeCases: ['A single node (diameter 0)', 'The longest path lies entirely in one subtree', 'Skewed tree'],
    bruteForceMd: 'For every node, compute the left and right heights separately and take the max of left + right.',
    bruteComplexity: 'O(n²) on skewed trees (height recomputed repeatedly).',
    bottleneckMd: 'Heights are recomputed for the same subtrees over and over; one bottom-up pass can produce every height once.',
    hints: [
      'Any path has a highest node where it "bends". What is the longest path bending at a given node?',
      'It is height(left) + height(right) in edges. You need heights for all nodes.',
      'One post-order pass: return the height and, on the side, update a global best with left + right.',
      'h(n): if null return 0; l = h(left); r = h(right); best = max(best, l + r); return 1 + max(l, r)',
    ],
    optimalMd: 'Post-order DFS returning height, with a global maximum of left + right.',
    code: [
      cpp(`
class Solution {
    int best = 0;
    int height(TreeNode* n) {
        if (!n) return 0;
        int l = height(n->left), r = height(n->right);
        best = max(best, l + r);
        return 1 + max(l, r);
    }
public:
    int diameterOfBinaryTree(TreeNode* root) { best = 0; height(root); return best; }
};`, 'C++'),
      java(`
class Solution {
    private int best;
    private int height(TreeNode n) {
        if (n == null) return 0;
        int l = height(n.left), r = height(n.right);
        best = Math.max(best, l + r);
        return 1 + Math.max(l, r);
    }
    public int diameterOfBinaryTree(TreeNode root) { best = 0; height(root); return best; }
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(h) space.',
    testCases: [
      { input: '[1, 2, 3, 4, 5]', expected: '3', why: 'Path 4–2–1–3' },
      { input: '[1, 2]', expected: '1', why: 'Two nodes' },
    ],
    takeawaysMd: 'Return one thing (the height) and record another (the bend). The same shape solves Binary Tree Maximum Path Sum.',
  },

  'binary-tree-level-order-traversal': {
    understandMd: 'Return node values grouped by depth, from left to right within each level.',
    ioConstraintsMd: 'Up to 2000 nodes.',
    edgeCases: ['Empty tree', 'Unbalanced tree'],
    bruteForceMd: 'DFS recording each node with its depth, then group by depth.',
    bruteComplexity: 'O(n): also fine (DFS with a depth parameter is an accepted alternative).',
    bottleneckMd: 'None; BFS is just the most direct way to keep levels separate.',
    hints: [
      'Which traversal naturally visits nodes level by level?',
      'BFS with a queue. How do you know where one level ends and the next begins?',
      'At the start of each level, read the queue size; process exactly that many nodes.',
      'q = [root]; while q: size = len(q); level = []; repeat size times: pop, record, push children; add level',
    ],
    optimalMd: 'BFS, capturing the queue size at the start of each level.',
    code: [
      cpp(`
vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> res;
    if (!root) return res;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int sz = q.size();
        res.emplace_back();
        while (sz--) {
            TreeNode* n = q.front(); q.pop();
            res.back().push_back(n->val);
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
    }
    return res;
}`, 'C++'),
      java(`
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int sz = q.size();
        List<Integer> level = new ArrayList<>();
        while (sz-- > 0) {
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        res.add(level);
    }
    return res;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(width) space.',
    testCases: [
      { input: '[3, 9, 20, null, null, 15, 7]', expected: '[[3], [9, 20], [15, 7]]', why: 'Basic' },
      { input: '[]', expected: '[]', why: 'Empty tree' },
    ],
    takeawaysMd: 'Per-level BFS: freeze the queue size before processing the level.',
  },

  'kth-largest-element-in-an-array': {
    understandMd: 'Return the element that would be at position k from the end if the array were sorted (duplicates count separately).',
    ioConstraintsMd: 'n up to 10⁵, values in [−10⁴, 10⁴]. Sorting passes; the question invites better.',
    edgeCases: ['k = 1 (maximum)', 'k = n (minimum)', 'Duplicates'],
    bruteForceMd: 'Sort descending and take index k − 1.',
    bruteComplexity: 'O(n log n).',
    bottleneckMd: 'Sorting orders everything, but only the top k (or one position) matters.',
    hints: [
      'Do you need the whole array sorted?',
      'Keep only the k largest seen so far. Which of them do you need to compare against new values?',
      'A min-heap of size k: its top is the k-th largest.',
      'heap = min-heap; for x: push x; if size > k: pop. return heap.top',
    ],
    optimalMd: 'A min-heap capped at size k gives O(n log k). Quickselect gives O(n) average.',
    code: [
      cpp(`
int findKthLargest(vector<int>& a, int k) {
    priority_queue<int, vector<int>, greater<int>> h;
    for (int x : a) { h.push(x); if ((int)h.size() > k) h.pop(); }
    return h.top();
}`, 'C++'),
      java(`
public int findKthLargest(int[] a, int k) {
    PriorityQueue<Integer> h = new PriorityQueue<>();
    for (int x : a) { h.offer(x); if (h.size() > k) h.poll(); }
    return h.peek();
}`, 'Java'),
    ],
    finalComplexity: 'O(n log k) time, O(k) space; quickselect O(n) average.',
    testCases: [
      { input: '[3, 2, 1, 5, 6, 4], k = 2', expected: '5', why: 'Basic' },
      { input: '[3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4', expected: '4', why: 'Duplicates count' },
    ],
    takeawaysMd: 'Top-k means a size-k heap of the opposite kind (a min-heap for the k largest).',
  },

  'number-of-islands': {
    understandMd: 'Count groups of "1" cells connected horizontally or vertically in a grid.',
    ioConstraintsMd: 'Grid up to 300 × 300.',
    edgeCases: ['All water', 'All land (one island)', 'Diagonal neighbours do not connect'],
    bruteForceMd: 'For each land cell, run a search that also checks which earlier island it belongs to (comparing with all islands found).',
    bruteComplexity: 'Up to O((R·C)²).',
    bottleneckMd: 'Re-examining cells already assigned to an island. Mark cells as visited when an island is discovered.',
    hints: [
      'Model the grid as a graph: what are the nodes and edges?',
      'Each time you find unvisited land, you have discovered a new island.',
      'Flood-fill (DFS/BFS) the whole island and mark it visited, so it is counted once.',
      'for each cell: if land and unvisited: count++; dfs(cell) marking all connected land',
    ],
    optimalMd: 'Scan the grid; every unvisited land cell starts a new island; DFS/BFS sinks it. (Union-find also works.)',
    code: [
      cpp(`
int numIslands(vector<vector<char>>& g) {
    int R = g.size(), C = g[0].size(), count = 0;
    function<void(int, int)> sink = [&](int r, int c) {
        if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] != '1') return;
        g[r][c] = '0';
        sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
    };
    for (int r = 0; r < R; ++r)
        for (int c = 0; c < C; ++c)
            if (g[r][c] == '1') { ++count; sink(r, c); }
    return count;
}`, 'C++'),
      java(`
public int numIslands(char[][] g) {
    int count = 0;
    for (int r = 0; r < g.length; r++)
        for (int c = 0; c < g[0].length; c++)
            if (g[r][c] == '1') { count++; sink(g, r, c); }
    return count;
}
private void sink(char[][] g, int r, int c) {
    if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;
    g[r][c] = '0';
    sink(g, r + 1, c); sink(g, r - 1, c); sink(g, r, c + 1); sink(g, r, c - 1);
}`, 'Java'),
    ],
    finalComplexity: 'O(R·C) time; O(R·C) worst-case recursion depth (use BFS for huge grids).',
    testCases: [
      { input: '["11000","11000","00100","00011"]', expected: '3', why: 'Basic' },
      { input: '["101","010","101"]', expected: '5', why: 'Diagonals do not connect' },
    ],
    takeawaysMd: 'Counting connected regions means one traversal per unvisited start node. Grids are graphs.',
  },

  'course-schedule': {
    understandMd: 'Given courses and prerequisite pairs, decide whether every course can be finished, which means the prerequisite graph has no cycle.',
    ioConstraintsMd: 'Up to 2000 courses and 5000 prerequisite pairs.',
    edgeCases: ['No prerequisites', 'A self-loop or 2-cycle', 'Disconnected groups of courses'],
    bruteForceMd: 'Repeatedly scan for a course whose prerequisites are all taken; take it; repeat until stuck.',
    bruteComplexity: 'O(V·(V + E)).',
    bottleneckMd: 'Re-scanning all courses each round. Tracking how many prerequisites remain (in-degree) tells you immediately which courses become available.',
    hints: [
      'Model courses as nodes and "a requires b" as an edge b → a. When is finishing impossible?',
      'Exactly when the directed graph has a cycle.',
      'Kahn\'s algorithm: start with courses of in-degree 0; taking one lowers its dependents\' in-degree. If you take all V courses, there is no cycle.',
      'build adj, indeg; queue all indeg 0; while q: u = pop; taken++; for v in adj[u]: if --indeg[v] == 0: push v. return taken == V',
    ],
    optimalMd: "Topological sort (Kahn's BFS) or three-colour DFS cycle detection.",
    code: [
      cpp(`
bool canFinish(int n, vector<vector<int>>& pre) {
    vector<vector<int>> adj(n);
    vector<int> indeg(n, 0);
    for (auto& p : pre) { adj[p[1]].push_back(p[0]); indeg[p[0]]++; }
    queue<int> q;
    for (int i = 0; i < n; ++i) if (indeg[i] == 0) q.push(i);
    int taken = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop(); ++taken;
        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
    }
    return taken == n;
}`, 'C++'),
      java(`
public boolean canFinish(int n, int[][] pre) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    int[] indeg = new int[n];
    for (int[] p : pre) { adj.get(p[1]).add(p[0]); indeg[p[0]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);
    int taken = 0;
    while (!q.isEmpty()) {
        int u = q.poll(); taken++;
        for (int v : adj.get(u)) if (--indeg[v] == 0) q.offer(v);
    }
    return taken == n;
}`, 'Java'),
    ],
    finalComplexity: 'O(V + E) time and space.',
    testCases: [
      { input: 'n = 2, [[1, 0]]', expected: 'true', why: 'Take 0, then 1' },
      { input: 'n = 2, [[1, 0], [0, 1]]', expected: 'false', why: '2-cycle' },
    ],
    takeawaysMd: '"Dependencies" means a directed graph. "Possible to order" means no cycle, which topological sort tests.',
  },

  'climbing-stairs': {
    understandMd: 'Count the distinct sequences of 1-step and 2-step moves that reach exactly step n.',
    ioConstraintsMd: '1 ≤ n ≤ 45 (the answer fits in a 32-bit int).',
    edgeCases: ['n = 1', 'n = 2'],
    bruteForceMd: 'Recursively try a 1-step and a 2-step at each point.',
    bruteComplexity: 'O(2ⁿ).',
    bottleneckMd: 'ways(k) is recomputed many times by different branches.',
    hints: [
      'What was your last move to reach step n?',
      'Either a 1-step from n − 1 or a 2-step from n − 2. So ways(n) = ?',
      'ways(n) = ways(n − 1) + ways(n − 2), with ways(0) = 1 and ways(1) = 1.',
      'a, b = 1, 1; repeat n − 1 times: a, b = b, a + b; return b',
    ],
    optimalMd: 'A Fibonacci-style DP with two variables.',
    code: [
      cpp(`
int climbStairs(int n) {
    int a = 1, b = 1;                 // ways(i-1), ways(i)
    for (int i = 2; i <= n; ++i) { int c = a + b; a = b; b = c; }
    return b;
}`, 'C++'),
      java(`
public int climbStairs(int n) {
    int a = 1, b = 1;
    for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; }
    return b;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space.',
    testCases: [
      { input: 'n = 2', expected: '2', why: '1+1 or 2' },
      { input: 'n = 5', expected: '8', why: 'Fibonacci growth' },
    ],
    takeawaysMd: 'Ask "what was the last move?"; the transition follows directly. Many counting DPs start this way.',
  },

  'house-robber': {
    understandMd: 'Choose a subset of houses with no two adjacent to maximise the total money.',
    ioConstraintsMd: 'Up to 100 houses, values 0–400.',
    edgeCases: ['One house', 'Two houses', 'Best plan skips two houses in a row'],
    bruteForceMd: 'Try every subset with no two adjacent houses.',
    bruteComplexity: 'O(2ⁿ).',
    bottleneckMd: 'The best total for houses 0..i is recomputed by many subsets.',
    hints: [
      'For the last house, what are your two choices?',
      'Rob it (then you could not rob i − 1) or skip it. What do you need to know about smaller prefixes?',
      'dp[i] = max(dp[i − 1], dp[i − 2] + a[i]).',
      'prev2 = prev1 = 0; for x: cur = max(prev1, prev2 + x); prev2 = prev1; prev1 = cur; return prev1',
    ],
    optimalMd: 'A 1-D DP over prefixes, reduced to two variables.',
    code: [
      cpp(`
int rob(vector<int>& a) {
    int prev2 = 0, prev1 = 0;
    for (int x : a) { int cur = max(prev1, prev2 + x); prev2 = prev1; prev1 = cur; }
    return prev1;
}`, 'C++'),
      java(`
public int rob(int[] a) {
    int prev2 = 0, prev1 = 0;
    for (int x : a) { int cur = Math.max(prev1, prev2 + x); prev2 = prev1; prev1 = cur; }
    return prev1;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space.',
    testCases: [
      { input: '[2, 7, 9, 3, 1]', expected: '12', why: '2 + 9 + 1' },
      { input: '[2, 1, 1, 2]', expected: '4', why: 'Skips two houses in a row' },
    ],
    takeawaysMd: 'Take-or-skip with an adjacency restriction gives dp[i] = max(skip, take + dp[i − 2]).',
  },

  'coin-change': {
    understandMd: 'Find the fewest coins (unlimited supply of each denomination) that sum to the amount, or −1 if impossible.',
    ioConstraintsMd: 'Up to 12 coin types, amount up to 10⁴.',
    edgeCases: ['Amount 0 (answer 0)', 'Impossible amounts', 'Greedy fails, e.g. coins [1, 3, 4] for amount 6'],
    bruteForceMd: 'Recursively try every coin at every step.',
    bruteComplexity: 'Exponential.',
    bottleneckMd: 'The minimum for a smaller amount is recomputed along many paths. The amount itself is the state.',
    hints: [
      'Does always taking the largest coin work? Try coins [1, 3, 4] and amount 6.',
      'If the last coin used is c, what subproblem remains?',
      'dp[v] = min over coins c ≤ v of dp[v − c] + 1, with dp[0] = 0.',
      'dp[0..amount] = INF; dp[0] = 0; for v in 1..amount: for c in coins: if c ≤ v: dp[v] = min(dp[v], dp[v − c] + 1)',
    ],
    optimalMd: 'An unbounded-knapsack style DP over amounts. (BFS over amounts also works, because each coin is a step of cost 1.)',
    code: [
      cpp(`
int coinChange(vector<int>& coins, int amount) {
    const int INF = INT_MAX / 2;
    vector<int> dp(amount + 1, INF);
    dp[0] = 0;
    for (int v = 1; v <= amount; ++v)
        for (int c : coins) if (c <= v) dp[v] = min(dp[v], dp[v - c] + 1);
    return dp[amount] >= INF ? -1 : dp[amount];
}`, 'C++'),
      java(`
public int coinChange(int[] coins, int amount) {
    int INF = Integer.MAX_VALUE / 2;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, INF);
    dp[0] = 0;
    for (int v = 1; v <= amount; v++)
        for (int c : coins) if (c <= v) dp[v] = Math.min(dp[v], dp[v - c] + 1);
    return dp[amount] >= INF ? -1 : dp[amount];
}`, 'Java'),
    ],
    finalComplexity: 'O(amount · k) time, O(amount) space.',
    testCases: [
      { input: 'coins [1, 2, 5], amount 11', expected: '3', why: '5 + 5 + 1' },
      { input: 'coins [2], amount 3', expected: '−1', why: 'Impossible' },
      { input: 'coins [1], amount 0', expected: '0', why: 'Base case' },
    ],
    takeawaysMd: 'When greedy has a counter-example and the remaining target defines the subproblem, DP over the target works.',
  },

  'maximum-subarray': {
    understandMd: 'Find the largest possible sum of a non-empty contiguous subarray.',
    ioConstraintsMd: 'n up to 10⁵, values in [−10⁴, 10⁴].',
    edgeCases: ['All negative (the answer is the largest single element)', 'A single element'],
    bruteForceMd: 'Try every (i, j) pair, maintaining a running sum.',
    bruteComplexity: 'O(n²).',
    bottleneckMd: 'For each end j, only the best subarray ending at j − 1 matters for extending.',
    hints: [
      'Think about the best subarray that ends exactly at index j.',
      'It either extends the best subarray ending at j − 1, or starts fresh at j.',
      'cur = max(a[j], cur + a[j]); best = max(best, cur). (Kadane\'s algorithm.)',
      'cur = best = a[0]; for j from 1: cur = max(a[j], cur + a[j]); best = max(best, cur)',
    ],
    optimalMd: "Kadane's algorithm: a DP where the state is the best sum ending at the current index.",
    code: [
      cpp(`
int maxSubArray(vector<int>& a) {
    int cur = a[0], best = a[0];
    for (size_t j = 1; j < a.size(); ++j) {
        cur = max(a[j], cur + a[j]);
        best = max(best, cur);
    }
    return best;
}`, 'C++'),
      java(`
public int maxSubArray(int[] a) {
    int cur = a[0], best = a[0];
    for (int j = 1; j < a.length; j++) {
        cur = Math.max(a[j], cur + a[j]);
        best = Math.max(best, cur);
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space.',
    testCases: [
      { input: '[−2, 1, −3, 4, −1, 2, 1, −5, 4]', expected: '6', why: '[4, −1, 2, 1]' },
      { input: '[−3, −1, −2]', expected: '−1', why: 'All negative; initialising with 0 would wrongly return 0' },
    ],
    takeawaysMd: '"Best ending here" states turn O(n²) subarray searches into O(n). Initialise with the first element, not 0.',
  },

  'subarray-sum-equals-k': {
    understandMd: 'Count contiguous subarrays whose elements sum to exactly k (values may be negative).',
    ioConstraintsMd: 'n up to 2·10⁴, values in [−1000, 1000], k in [−10⁷, 10⁷].',
    edgeCases: ['k = 0', 'Negative values', 'Many overlapping answers, e.g. all zeros with k = 0'],
    bruteForceMd: 'For each start i, extend j and maintain the running sum, counting matches.',
    bruteComplexity: 'O(n²).',
    bottleneckMd: 'For each end j we search for starts with a specific prefix value, which is a lookup that can be counted in a map.',
    hints: [
      'Can a sliding window work? What do negative numbers do to it?',
      'Express sum(i+1..j) using prefix sums.',
      'sum = pre[j] − pre[i] = k, so for each j count earlier prefixes equal to pre[j] − k.',
      'cnt = {0: 1}; pre = 0; for x: pre += x; ans += cnt[pre − k]; cnt[pre]++',
    ],
    optimalMd: 'Prefix sums with a hash map of prefix counts, seeded with {0: 1}.',
    code: [
      cpp(`
int subarraySum(vector<int>& a, int k) {
    unordered_map<long long, int> cnt{{0, 1}};
    long long pre = 0; int ans = 0;
    for (int x : a) {
        pre += x;
        auto it = cnt.find(pre - k);
        if (it != cnt.end()) ans += it->second;
        cnt[pre]++;
    }
    return ans;
}`, 'C++'),
      java(`
public int subarraySum(int[] a, int k) {
    Map<Long, Integer> cnt = new HashMap<>();
    cnt.put(0L, 1);
    long pre = 0; int ans = 0;
    for (int x : a) {
        pre += x;
        ans += cnt.getOrDefault(pre - k, 0);
        cnt.merge(pre, 1, Integer::sum);
    }
    return ans;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(n) space.',
    testCases: [
      { input: '[1, 1, 1], k = 2', expected: '2', why: 'Overlapping subarrays' },
      { input: '[1, −1, 0], k = 0', expected: '3', why: 'Negatives and zeros' },
    ],
    takeawaysMd: 'Negatives break sliding windows; prefix differences plus a hash map handle any sign.',
  },

  'merge-intervals': {
    understandMd: 'Combine all overlapping intervals and return the resulting disjoint intervals.',
    ioConstraintsMd: 'Up to 10⁴ intervals; intervals that touch (end == start) count as overlapping.',
    edgeCases: ['Touching intervals [1, 4], [4, 5]', 'An interval contained in another', 'Unsorted input'],
    bruteForceMd: 'Repeatedly find any overlapping pair and merge them until none remain.',
    bruteComplexity: 'O(n²) or worse.',
    bottleneckMd: 'Overlap checks between arbitrary pairs. After sorting by start, only the last merged interval can overlap the next one.',
    hints: [
      'What order makes overlaps easy to see?',
      'Sort by start. When does the next interval overlap the last merged one?',
      'If next.start ≤ last.end, extend last.end = max(last.end, next.end); otherwise start a new interval.',
      'sort by start; out = []; for iv: if out and iv.start <= out.last.end: out.last.end = max(...) else out.append(iv)',
    ],
    optimalMd: 'Sort by start, then a single linear sweep merging into the last output interval.',
    code: [
      cpp(`
vector<vector<int>> merge(vector<vector<int>>& iv) {
    sort(iv.begin(), iv.end());
    vector<vector<int>> out;
    for (auto& x : iv) {
        if (!out.empty() && x[0] <= out.back()[1]) out.back()[1] = max(out.back()[1], x[1]);
        else out.push_back(x);
    }
    return out;
}`, 'C++'),
      java(`
public int[][] merge(int[][] iv) {
    Arrays.sort(iv, (a, b) -> Integer.compare(a[0], b[0]));
    List<int[]> out = new ArrayList<>();
    for (int[] x : iv) {
        if (!out.isEmpty() && x[0] <= out.get(out.size() - 1)[1])
            out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], x[1]);
        else out.add(x);
    }
    return out.toArray(new int[0][]);
}`, 'Java'),
    ],
    finalComplexity: 'O(n log n) time (sorting), O(n) output.',
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expected: '[[1,6],[8,10],[15,18]]', why: 'Basic' },
      { input: '[[1,4],[4,5]]', expected: '[[1,5]]', why: 'Touching intervals merge' },
      { input: '[[1,10],[2,3]]', expected: '[[1,10]]', why: 'Containment: use max for the end' },
    ],
    takeawaysMd: 'Interval problems usually start with "sort by start" (or by end for greedy selection).',
  },

  subsets: {
    understandMd: 'Return every subset (the power set) of an array of distinct integers.',
    ioConstraintsMd: 'n ≤ 10, so 2¹⁰ = 1024 subsets.',
    edgeCases: ['A single element', 'Include the empty subset'],
    bruteForceMd: 'Bitmask enumeration: each number from 0 to 2ⁿ − 1 selects a subset. This is already optimal for the output size.',
    bruteComplexity: 'O(n · 2ⁿ).',
    bottleneckMd: 'None: the output itself has n · 2ⁿ elements. The goal is a clean, general template.',
    hints: [
      'For each element, what are the two possibilities?',
      'Build subsets incrementally; record the current subset at every step.',
      'Backtracking with a start index: record path, then for i ≥ start: add a[i], recurse with i + 1, remove.',
      'dfs(start): out.add(copy(path)); for i in start..n−1: path.add(a[i]); dfs(i + 1); path.removeLast()',
    ],
    optimalMd: 'Backtracking with a start index (or bitmasks). Each subset is produced exactly once.',
    code: [
      cpp(`
class Solution {
    vector<vector<int>> out; vector<int> path;
    void dfs(const vector<int>& a, int start) {
        out.push_back(path);
        for (int i = start; i < (int)a.size(); ++i) {
            path.push_back(a[i]);
            dfs(a, i + 1);
            path.pop_back();
        }
    }
public:
    vector<vector<int>> subsets(vector<int>& a) { out.clear(); path.clear(); dfs(a, 0); return out; }
};`, 'C++'),
      java(`
class Solution {
    public List<List<Integer>> subsets(int[] a) {
        List<List<Integer>> out = new ArrayList<>();
        dfs(a, 0, new ArrayList<>(), out);
        return out;
    }
    private void dfs(int[] a, int start, List<Integer> path, List<List<Integer>> out) {
        out.add(new ArrayList<>(path));
        for (int i = start; i < a.length; i++) {
            path.add(a[i]);
            dfs(a, i + 1, path, out);
            path.remove(path.size() - 1);
        }
    }
}`, 'Java'),
    ],
    finalComplexity: 'O(n · 2ⁿ) time, O(n) recursion depth.',
    testCases: [
      { input: '[1, 2, 3]', expected: '8 subsets including []', why: 'Basic' },
      { input: '[0]', expected: '[[], [0]]', why: 'Single element' },
    ],
    takeawaysMd: 'A start index prevents reordered duplicates. Copy the path when recording (Java).',
  },
};
