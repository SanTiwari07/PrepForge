import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.linked-lists';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Linked Lists',
  summary: 'Pointer manipulation, dummy nodes, reversal and merging.',
  level: 'foundation',
  status: 'complete',
  estMinutes: 80,
  prerequisites: ['dsa.complexity'],
  related: ['dsa.fast-slow-pointers', 'dsa.design-ds', 'dsa.recursion', 'dsa.heaps'],
  subtopics: ['Traversal and length', 'Dummy (sentinel) head', 'Iterative reversal', 'Merging sorted lists', 'Removing the nth node from the end', 'Reordering and splitting'],
  objectives: [
    'Reverse a list (whole or a sub-range) iteratively with three pointers, without losing nodes.',
    'Use a dummy head to remove special cases at the head of the list.',
    'Merge two sorted lists in O(n + m) time and O(1) extra space.',
    'Combine primitives (find middle, reverse, merge) to solve reorder and palindrome problems.',
    'Draw pointer diagrams to debug, and handle empty lists and single nodes.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Nodes and pointers',
      bodyMd: `A singly linked list is a chain of nodes, each holding a value and a pointer to the next node; the last points to null. There is no indexing: reaching the k-th node takes O(k).

**Strength:** given a pointer to a node, inserting or deleting after it is O(1) because nothing shifts. That is why LRU caches pair a hash map with a doubly linked list.

**The golden rule of pointer surgery:** before you overwrite a \`next\` pointer, save whatever it pointed to if you still need it. Almost every linked-list bug is a lost reference.

**Dummy head:** create a fake node before the real head. Operations that may change the head (deleting the first node, merging, partitioning) become uniform, and you return \`dummy.next\`.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'A small toolbox solves most problems',
      bodyMd: `Most linked-list interview problems are combinations of four primitives:
1. **Reverse** (all or part of the list).
2. **Find the middle** with fast/slow pointers.
3. **Merge** two sorted lists.
4. **Two pointers with a gap** (the nth node from the end: move \`fast\` n steps ahead first).

For example, *reorder list* (L0 → Ln → L1 → Ln−1 …) is find middle + reverse the second half + interleave, and *palindrome list* is find middle + reverse the second half + compare.

If a problem says "O(1) extra space", you cannot copy the list into an array. Use these primitives in place.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: iterative reversal',
      bodyMd: 'Reverse 1 → 2 → 3 → null. Keep prev, cur and next; at each step point cur back to prev.',
      trace: [
        { note: 'prev = null, cur = 1. Save next = 2, then point 1 → null.', array: ['1', '2', '3'], pointers: { cur: 0 }, vars: { prev: 'null', next: '2' } },
        { note: 'Move: prev = 1, cur = 2. Save next = 3, then point 2 → 1.', array: ['1', '2', '3'], pointers: { prev: 0, cur: 1 }, vars: { next: '3', links: '2→1→null' } },
        { note: 'Move: prev = 2, cur = 3. Save next = null, then point 3 → 2.', array: ['1', '2', '3'], pointers: { prev: 1, cur: 2 }, vars: { links: '3→2→1→null' } },
        { note: 'cur = null, so stop. The new head is prev = 3.', array: ['3', '2', '1'], vars: { head: '3' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Reversal, merging with a dummy head, and removing the nth node from the end in one pass.',
      code: [
        cpp(`
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int v, ListNode* n = nullptr) : val(v), next(n) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    while (head) {
        ListNode* nxt = head->next;   // save before overwriting
        head->next = prev;
        prev = head;
        head = nxt;
    }
    return prev;
}

ListNode* mergeTwoLists(ListNode* a, ListNode* b) {
    ListNode dummy(0);
    ListNode* tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) { tail->next = a; a = a->next; }
        else { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;           // attach the remainder
    return dummy.next;
}

ListNode* removeNthFromEnd(ListNode* head, int n) {
    ListNode dummy(0, head);
    ListNode *fast = &dummy, *slow = &dummy;
    for (int i = 0; i < n; ++i) fast = fast->next;    // gap of n nodes
    while (fast->next) { fast = fast->next; slow = slow->next; }
    ListNode* del = slow->next;
    slow->next = del->next;
    delete del;
    return dummy.next;
}`, 'C++'),
        java(`
class ListNode {
    int val; ListNode next;
    ListNode(int v) { val = v; }
    ListNode(int v, ListNode n) { val = v; next = n; }
}

ListNode reverseList(ListNode head) {
    ListNode prev = null;
    while (head != null) {
        ListNode nxt = head.next;
        head.next = prev;
        prev = head;
        head = nxt;
    }
    return prev;
}

ListNode mergeTwoLists(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;
    return dummy.next;
}

ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0, head), fast = dummy, slow = dummy;
    for (int i = 0; i < n; i++) fast = fast.next;
    while (fast.next != null) { fast = fast.next; slow = slow.next; }
    slow.next = slow.next.next;
    return dummy.next;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Reversal: O(n) time, **O(1) space** iteratively. The recursive version uses O(n) stack space and can overflow for long lists.
- Merge two sorted lists: O(n + m) time, O(1) extra (we relink existing nodes).
- Remove the nth node from the end: **one pass**, O(n) time, O(1) space.
- Accessing the k-th node: O(k). There is no random access.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Losing the rest of the list:** writing \`cur->next = prev\` before saving \`cur->next\`.
2. **Null dereference:** check \`node\` (and often \`node->next\`) before accessing; empty lists and single nodes are standard test cases.
3. **Not handling head changes:** deleting the first node or merging without a dummy head leads to special cases and bugs.
4. **Forgetting to terminate:** when splitting a list (for example at the middle), set \`slow->next = null\`, or you create cycles or duplicated tails.
5. **Off-by-one in the gap method:** with a dummy head, advance \`fast\` exactly n steps, then move both until \`fast->next\` is null; \`slow\` then sits *before* the node to delete.
6. **Memory in C++:** relinking does not free nodes. In interviews, mention \`delete\` for removed nodes (or ownership with smart pointers).`,
    },
  ],
  recognition: {
    signals: ['The input is a ListNode head', 'O(1) extra space is required on a list', 'Operations near the head that may change it', 'Need the middle, the k-th from the end, or a cycle'],
    antiSignals: ['Many random accesses by index: copy to an array if space allows', 'Need ordered access to the minimum of many lists: a heap (merge k lists)'],
    decisionQuestions: ['Which primitives (reverse, middle, merge, gap) compose into this problem?', 'Can the head change? Then use a dummy head.', 'Which pointers must I save before relinking?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Reverse a linked list iteratively and recursively. Compare them.', answerMd: 'Iterative: three pointers (prev, cur, next), O(n) time, O(1) space. Recursive: reverse the rest, then set head.next.next = head and head.next = null; O(n) time but O(n) stack, which risks stack overflow on long lists. Prefer the iterative version.' },
    { id: 'iq2', q: 'What is a dummy node and why use it?', answerMd: 'A placeholder node before the head. It removes special cases when the head may be deleted or replaced (merging, removing elements, partitioning). You build after it and return dummy.next.' },
    { id: 'iq3', q: 'Remove the nth node from the end in one pass.', answerMd: 'Use two pointers from a dummy: advance fast n steps, then move both until fast.next is null. slow is just before the target; set slow.next = slow.next.next. O(n) time, O(1) space.' },
    { id: 'iq4', q: 'How do you check whether a linked list is a palindrome in O(1) space?', answerMd: 'Find the middle with slow/fast pointers, reverse the second half, compare the halves node by node, then (optionally) reverse back to restore the list. O(n) time.' },
    { id: 'iq5', q: 'How would you merge k sorted lists efficiently?', answerMd: 'Use a min-heap holding the current head of each list: pop the smallest, append it, push its next. O(N log k) for N total nodes. Alternatively, merge pairwise in rounds (divide and conquer), also O(N log k).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Save \`next\` before relinking.
- Dummy head whenever the head may change; return \`dummy.next\`.
- Reverse: prev = null; while cur: nxt = cur.next; cur.next = prev; prev = cur; cur = nxt.
- Merge: tail pointer from a dummy; attach the remainder at the end.
- nth from end: a gap of n between fast and slow (from the dummy).
- Middle: slow/fast; split with \`slow.next = null\`.
- Reorder/palindrome = middle + reverse + merge/compare.`,
    flashcards: [
      { id: 'f1', front: 'Iterative reversal loop body?', backMd: 'nxt = cur.next; cur.next = prev; prev = cur; cur = nxt. Return prev.' },
      { id: 'f2', front: 'Why a dummy head?', backMd: 'It removes special cases when the head can change; return dummy.next.' },
      { id: 'f3', front: 'Remove the nth from the end in one pass?', backMd: 'From a dummy, move fast n steps; move both until fast.next is null; delete slow.next.' },
      { id: 'f4', front: 'Reorder list in O(1) space?', backMd: 'Find the middle, reverse the second half, interleave the two halves.' },
      { id: 'f5', front: 'Merge k sorted lists complexity with a heap?', backMd: 'O(N log k).' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 12, passPct: 80, minIndependentSolves: 4, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Linked list (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Linked_list', kind: 'article' },
    { title: 'std::forward_list (cppreference)', url: 'https://en.cppreference.com/w/cpp/container/forward_list', kind: 'official-docs' },
    { title: 'NeetCode practice: Linked List', url: 'https://neetcode.io/practice', kind: 'practice', httpVerifiable: false },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.linked-lists.q1', type: 'debug', difficulty: 'easy',
    stem: 'What is wrong with this reversal loop?',
    code: cpp(`ListNode* prev = nullptr;
while (cur) {
    cur->next = prev;
    prev = cur;
    cur = cur->next;
}`),
    options: ['`cur->next` is overwritten before it is saved, so after the first iteration `cur` becomes null and the rest of the list is lost', ['prev should start at cur', 'prev must start as null: the old head becomes the tail.'], ['The loop condition should be cur->next', 'That would skip the last node.'], ['Nothing is wrong', 'The list is cut after the first node.']],
    answer: 0,
    explanation: 'After `cur->next = prev` (null), `cur = cur->next` reads the new value (null), ending the loop after one node. Save `nxt = cur->next` first.',
  }),
  mcq({
    ...base, id: 'dsa.linked-lists.q2', type: 'complexity', difficulty: 'easy',
    stem: 'Given only the head of a singly linked list with n nodes, what does accessing the k-th node cost?',
    options: [['O(1)', 'Linked lists have no index arithmetic.'], 'O(k)', ['O(log n)', 'There is no structure to binary-search.'], ['O(n²)', 'A single walk suffices.']],
    answer: 1,
    explanation: 'You must follow k next pointers from the head.',
  }),
  mcq({
    ...base, id: 'dsa.linked-lists.q3', type: 'concept', difficulty: 'medium',
    stem: 'Why does "remove the nth node from the end" usually start both pointers at a **dummy** node?',
    options: ['So that removing the actual head (n equals the length) needs no special case', ['To make it run faster', 'The complexity is the same.'], ['Because the last node cannot be removed otherwise', 'The issue is the first node.'], ['To avoid cycles', 'There are no cycles here.']],
    answer: 0,
    explanation: 'If n equals the list length, the node before the target is "before the head", which is exactly the dummy. Without it you would special-case head removal.',
  }),
  mcq({
    ...base, id: 'dsa.linked-lists.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
using namespace std;
struct Node { int v; Node* next; };
int main() {
    Node c{3, nullptr}, b{2, &c}, a{1, &b};
    Node* prev = nullptr;
    Node* cur = &a;
    int steps = 0;
    while (cur && steps < 2) {
        Node* nxt = cur->next;
        cur->next = prev;
        prev = cur;
        cur = nxt;
        ++steps;
    }
    a.next = cur;
    for (Node* p = prev; p; p = p->next) cout << p->v << " ";
    cout << endl;
    return 0;
}`, 'C++', '2 1 3'),
    options: ['2 1 3', ['3 2 1', 'Only the first two nodes were reversed.'], ['1 2 3', 'The first two nodes were reversed.'], ['2 1', 'a.next = cur reattaches node 3.']],
    answer: 0,
    explanation: 'Two iterations reverse 1→2 into 2→1; `cur` now points to 3, and `a.next = cur` (a is the old head, now the tail of the reversed part) reconnects it: 2 → 1 → 3. This is the core of "reverse a sub-list".',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.linked-lists.q5', type: 'pattern', difficulty: 'medium',
    stem: 'Reorder L0→L1→…→Ln into L0→Ln→L1→Ln−1→… using O(1) extra space. Which combination works?',
    options: ['Find the middle, reverse the second half, then interleave the two halves', ['Copy to an array and rebuild', 'That uses O(n) space.'], ['Sort the nodes', 'The order is positional, not by value.'], ['Recursively swap the first and last nodes', 'Finding the last node repeatedly is O(n²) and uses stack space.']],
    answer: 0,
    explanation: 'Each step is O(n) time and O(1) space; together they produce the required order.',
  }),
  mcq({
    ...base, id: 'dsa.linked-lists.q6', type: 'complexity', difficulty: 'medium',
    stem: 'Merging k sorted lists (N nodes in total) using a min-heap of size k costs:',
    options: [['O(N · k)', 'That is repeated linear scanning of k heads.'], 'O(N log k)', ['O(N log N)', 'The heap never holds more than k nodes.'], ['O(k log N)', 'Every node must be processed.']],
    answer: 1,
    explanation: 'Each of the N nodes is pushed and popped once on a heap of size at most k: O(log k) each.',
  }),
  mcq({
    ...base, id: 'dsa.linked-lists.q7', type: 'edge-case', difficulty: 'easy',
    stem: 'Which input most often breaks a careless linked-list solution?',
    options: ['An empty list (head is null) or a single node', ['A list of 1000 nodes', 'Long lists only matter for recursion depth.'], ['A list with even length', 'Even lengths matter for middle-finding but are less often the crash.'], ['A sorted list', 'Sortedness rarely breaks pointer logic.']],
    answer: 0,
    explanation: 'Null head and single-node lists trigger null dereferences in code that assumes `head->next` exists. Always test them.',
  }),
];
