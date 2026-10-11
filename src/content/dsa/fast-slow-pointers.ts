import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.fast-slow-pointers';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Fast and Slow Pointers',
  summary: "Cycle detection and middle-finding with Floyd's tortoise and hare.",
  level: 'core',
  status: 'complete',
  estMinutes: 60,
  prerequisites: ['dsa.linked-lists'],
  related: ['dsa.two-pointers', 'dsa.linked-lists', 'dsa.math'],
  subtopics: ['Middle of a list', 'Cycle detection', 'Finding the cycle start', 'Cycle length', 'Implicit linked lists (functions on numbers or indices)', 'k-th node from the end with a gap'],
  objectives: [
    "Detect a cycle in a linked list in O(n) time and O(1) space with Floyd's algorithm.",
    'Find the node where the cycle begins and explain the distance argument behind it.',
    'Find the middle node (first or second middle for even lengths) and use it to split or fold a list.',
    'Apply the same idea to sequences defined by a function, such as the happy-number process or an array whose values are indices.',
    'Use a fixed gap between two pointers to find the k-th node from the end in one pass.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Two pointers moving at different speeds',
      bodyMd: `Move \`slow\` one step and \`fast\` two steps at a time.

- **No cycle:** \`fast\` reaches the end (null) first. When it does, \`slow\` is at the middle, because it has travelled half as far.
- **Cycle:** once both are inside the cycle, the gap between them shrinks by exactly one node per step (fast gains one step on slow each iteration). So fast cannot jump over slow; they meet within one lap of the cycle.

That gives O(n) time and **O(1) space**, compared with O(n) space for remembering visited nodes in a hash set.

The idea is not limited to linked lists. Any process "x → f(x)" over a finite set of states eventually repeats, which forms a "rho" shape: a tail followed by a cycle. Examples: the digit-square process in Happy Number, or treating \`nums[i]\` as a pointer to index \`nums[i]\` in Find the Duplicate Number.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Why resetting one pointer finds the cycle start',
      bodyMd: `Let the tail (head to cycle start) have length **a**, the cycle length be **c**, and suppose they meet **b** steps into the cycle.

- slow has walked a + b steps.
- fast has walked 2(a + b) steps, which is a + b plus some whole number k of laps: 2(a + b) = a + b + k·c.
- So a + b = k·c, which means **a = k·c − b**.

Now put one pointer back at the head and move both one step at a time. After a steps, the head pointer is at the cycle start. The other pointer, which started b steps into the cycle, has moved a = k·c − b steps, so it is at position b + k·c − b = k·c, which is also the cycle start. They meet exactly there.

**Cycle length:** after the meeting, keep one pointer still and walk the other until it returns; count the steps.

**Middle variants:** with the loop condition \`while (fast && fast->next)\` and both starting at the head, slow ends at the **second** middle of an even-length list (e.g. node 3 of 1→2→3→4). Starting fast at \`head->next\` gives the **first** middle, which is what you want before splitting a list for merge sort.`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: cycle 1→2→3→4→5→3',
      bodyMd: 'Nodes are shown by value; node 5 points back to node 3. Tail length a = 2, cycle length c = 3.',
      trace: [
        { note: 'Start: slow = 1, fast = 1.', array: [1, 2, 3, 4, 5], pointers: { slow: 0, fast: 0 } },
        { note: 'Step 1: slow = 2, fast = 3.', array: [1, 2, 3, 4, 5], pointers: { slow: 1, fast: 2 } },
        { note: 'Step 2: slow = 3, fast = 5.', array: [1, 2, 3, 4, 5], pointers: { slow: 2, fast: 4 } },
        { note: 'Step 3: slow = 4; fast goes 5 → 3 → 4. They meet at 4 (b = 1).', array: [1, 2, 3, 4, 5], pointers: { slow: 3, fast: 3 }, highlight: [3] },
        { note: 'Phase 2: p = head (1), q = meeting node (4). Step: p = 2, q = 5.', array: [1, 2, 3, 4, 5], pointers: { p: 1, q: 4 } },
        { note: 'Step: p = 3, q = 3. They meet at the cycle start, 3 (a = 2 = 1·3 − 1).', array: [1, 2, 3, 4, 5], pointers: { p: 2, q: 2 }, highlight: [2] },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Middle node, cycle start, the duplicate number via an implicit list, and the k-th node from the end.',
      code: [
        cpp(`
struct ListNode { int val; ListNode* next; ListNode(int v) : val(v), next(nullptr) {} };

ListNode* middle(ListNode* head) {            // second middle for even lengths
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    return slow;
}

ListNode* detectCycle(ListNode* head) {       // the node where the cycle starts, or nullptr
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) {
            ListNode* p = head;
            while (p != slow) { p = p->next; slow = slow->next; }
            return p;
        }
    }
    return nullptr;
}

// Values are in 1..n and there are n + 1 of them: index -> nums[index] is a linked list
// whose cycle starts at the duplicate value. O(n) time, O(1) space, array unchanged.
int findDuplicate(const vector<int>& nums) {
    int slow = nums[0], fast = nums[nums[0]];
    while (slow != fast) { slow = nums[slow]; fast = nums[nums[fast]]; }
    slow = 0;
    while (slow != fast) { slow = nums[slow]; fast = nums[fast]; }
    return slow;
}

ListNode* removeNthFromEnd(ListNode* head, int n) {
    ListNode dummy(0); dummy.next = head;
    ListNode *lead = &dummy, *trail = &dummy;
    for (int i = 0; i <= n; ++i) lead = lead->next;     // gap of n + 1 nodes
    while (lead) { lead = lead->next; trail = trail->next; }
    ListNode* gone = trail->next;
    trail->next = gone->next;
    delete gone;
    return dummy.next;
}`, 'C++'),
        java(`
static class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

ListNode middle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
    return slow;
}

ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next; fast = fast.next.next;
        if (slow == fast) {
            ListNode p = head;
            while (p != slow) { p = p.next; slow = slow.next; }
            return p;
        }
    }
    return null;
}

int findDuplicate(int[] nums) {
    int slow = nums[0], fast = nums[nums[0]];
    while (slow != fast) { slow = nums[slow]; fast = nums[nums[fast]]; }
    slow = 0;
    while (slow != fast) { slow = nums[slow]; fast = nums[fast]; }
    return slow;
}

ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0); dummy.next = head;
    ListNode lead = dummy, trail = dummy;
    for (int i = 0; i <= n; i++) lead = lead.next;
    while (lead != null) { lead = lead.next; trail = trail.next; }
    trail.next = trail.next.next;
    return dummy.next;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- Middle, cycle detection and cycle start: **O(n) time, O(1) space**. Before the meeting, slow takes at most a + c steps (it meets fast within its first lap of the cycle); phase 2 takes a steps.
- The hash-set alternative is also O(n) time but O(n) space. Interviewers usually ask for the O(1) follow-up.
- Happy Number: the digit-square sum of any number with up to 10 digits is at most 10·81 = 810, so the process quickly enters a small set of values; Floyd's detects the loop in O(log n) steps per value.
- Find the Duplicate Number: O(n) time, O(1) space, and the array is not modified, which is exactly what rules out sorting or marking by negation.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Wrong loop guard.** \`while (fast->next)\` crashes when fast is null. Check \`fast && fast->next\` in that order.
2. **Comparing values instead of nodes.** Two distinct nodes can hold equal values; compare node identity (pointers/references).
3. **Checking \`slow == fast\` before moving** when both start at the head: they are equal at step 0. Move first, then compare.
4. **First vs second middle confusion.** For splitting before merge sort, you need the first middle, or the halves for a two-node list will not shrink and the recursion never ends.
5. **Find the Duplicate Number: starting the second phase from \`nums[0]\` instead of index 0.** The "head" of the implicit list is index 0.
6. **Off-by-one in the k-th-from-end gap.** To remove the n-th node from the end, the trailing pointer must stop one node before it, hence a gap of n + 1 from a dummy node.`,
    },
  ],
  recognition: {
    signals: ['Detect or locate a cycle using O(1) extra memory', 'Middle of a linked list, or split/fold a list in half', 'A repeated process x → f(x) that may loop (happy number)', 'Array values in 1..n that can be read as next-indices, with a duplicate', 'k-th node from the end in one pass'],
    antiSignals: ['Random access is available and memory is not restricted: an index or a hash set may be simpler', 'Pair search on a sorted array: classic two pointers from both ends', 'Cycle detection in a general directed graph: DFS colours or topological sort'],
    decisionQuestions: ['Is there an implicit "next" function over a finite set of states?', 'Do I need the meeting point, the cycle start, the cycle length, or the middle?', 'Which middle do I need for an even length?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Why are the fast and slow pointers guaranteed to meet if there is a cycle?', answerMd: 'Once both are in the cycle, each iteration fast moves 2 and slow moves 1, so the distance from fast to slow (measured along the cycle) decreases by exactly 1. It cannot skip from 1 to −1; it reaches 0 within c iterations, where c is the cycle length.' },
    { id: 'iq2', q: 'Prove that resetting one pointer to the head finds the start of the cycle.', answerMd: 'With tail length a, meeting point b into a cycle of length c: 2(a + b) = a + b + kc, so a = kc − b. Walking a steps from the head reaches the start; walking a steps from the meeting point reaches b + kc − b ≡ 0 (mod c), also the start. Both pointers move one step at a time, so they meet there.' },
    { id: 'iq3', q: 'Find the duplicate in an array of n + 1 integers in 1..n without modifying it, in O(1) space.', answerMd: 'Treat i → nums[i] as a linked list starting at index 0. Two indices point to the duplicate value, so that value is where a cycle begins. Run Floyd: meet, reset one pointer to 0, advance both by one until they meet. O(n) time, O(1) space. Binary search on the value range is an O(n log n) alternative.' },
    { id: 'iq4', q: 'How do you check if a linked list is a palindrome in O(1) extra space?', answerMd: 'Find the middle with fast/slow, reverse the second half in place, compare the two halves node by node, then (politely) reverse the second half back to restore the list. O(n) time, O(1) space.' },
    { id: 'iq5', q: 'How would you find the length of the cycle?', answerMd: 'After fast and slow meet, keep one fixed and move the other one step at a time, counting until it returns to the meeting node. The count is c.' },
    { id: 'iq6', q: 'Is Happy Number a linked-list problem?', answerMd: 'Implicitly. n → sum of squares of digits defines a next function. The sequence either reaches 1 (a fixed point, 1 → 1) or enters a cycle that does not contain 1. Run fast/slow on the function and check whether the meeting value is 1. A hash set of seen values also works with O(k) space.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- slow += 1, fast += 2; guard with \`fast && fast->next\`.
- No cycle: fast hits null; slow is the middle (second middle for even length; start fast at head->next for the first middle).
- Cycle start: after meeting, reset one to head; move both by 1; they meet at the start (a = kc − b).
- Cycle length: walk from the meeting point back to it.
- Implicit lists: x → f(x) (happy number), i → nums[i] (find duplicate; head is index 0).
- k-th from end: dummy node, gap of n + 1, move together.`,
    flashcards: [
      { id: 'f1', front: 'Safe loop condition for fast/slow on a list?', backMd: '`while (fast && fast->next)` (Java: `fast != null && fast.next != null`).' },
      { id: 'f2', front: 'After the meeting, how do you find the cycle start?', backMd: 'Reset one pointer to the head and move both one step at a time; they meet at the start.' },
      { id: 'f3', front: 'Key equation behind the cycle-start trick?', backMd: '2(a + b) = a + b + kc, so a = kc − b.' },
      { id: 'f4', front: 'Which middle does slow land on for 1→2→3→4 with fast starting at head?', backMd: 'Node 3, the second middle.' },
      { id: 'f5', front: 'Find the Duplicate Number: what is the "linked list"?', backMd: 'Index i points to index nums[i]; start at index 0; the cycle starts at the duplicate value.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Cycle detection: Floyd\'s tortoise and hare (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Cycle_detection', kind: 'article' },
    { title: 'Linked List Cycle II (LeetCode 142)', url: 'https://leetcode.com/problems/linked-list-cycle-ii/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.fast-slow.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
using namespace std;
struct Node { int val; Node* next; };
int main() {
    Node n5{5, nullptr}, n4{4, &n5}, n3{3, &n4}, n2{2, &n3}, n1{1, &n2};
    Node *slow = &n1, *fast = &n1;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    cout << slow->val << " ";
    n5.next = nullptr; n4.next = nullptr;          // now 1->2->3->4
    slow = fast = &n1;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    cout << slow->val << endl;
    return 0;
}`, 'C++', '3 3'),
    options: ['3 3', ['3 2', 'With fast starting at the head, an even-length list gives the second middle.'], ['2 2', 'For 5 nodes the middle is 3.'], ['3 4', 'For 1→2→3→4, slow stops at 3.']],
    answer: 0,
    explanation: '1→2→3→4→5: slow ends at 3. 1→2→3→4: after two steps fast is null (3 → null), slow is at 3, the second middle.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.fast-slow.q2', type: 'concept', difficulty: 'medium',
    stem: 'Once both pointers are inside a cycle of length c, why can fast never "jump over" slow?',
    options: ['The gap between them shrinks by exactly one node per iteration', ['Because fast moves only one step', 'Fast moves two.'], ['Because c is always even', 'It can be any length.'], ['It can; the algorithm restarts when it does', 'There is no restart.']],
    answer: 0,
    explanation: 'Relative speed is 1 node per step, so the distance goes c−1, c−2, …, 1, 0. It must hit 0.',
  }),
  mcq({
    ...base, id: 'dsa.fast-slow.q3', type: 'complexity', difficulty: 'easy',
    stem: 'What extra space does Floyd\'s cycle detection use, compared with a visited hash set?',
    options: ['O(1) vs O(n)', ['O(n) vs O(n)', 'Floyd stores only two pointers.'], ['O(log n) vs O(n)', 'No recursion or stack is involved.'], ['O(1) vs O(1)', 'A hash set grows with the nodes visited.']],
    answer: 0,
    explanation: 'Two pointers regardless of n. The hash set stores every visited node.',
  }),
  mcq({
    ...base, id: 'dsa.fast-slow.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    public static void main(String[] args) {
        int[] nums = {1, 3, 4, 2, 2};
        int slow = nums[0], fast = nums[nums[0]];
        while (slow != fast) { slow = nums[slow]; fast = nums[nums[fast]]; }
        slow = 0;
        while (slow != fast) { slow = nums[slow]; fast = nums[fast]; }
        System.out.println(slow);
    }
}`, 'Java', '2'),
    options: ['2', ['4', 'The meeting point of phase 1 is not necessarily the duplicate.'], ['3', 'Value 3 appears once.'], ['0', 'Index 0 is the head of the implicit list, not a value.']],
    answer: 0,
    explanation: 'The implicit list is 0 → 1 → 3 → 2 → 4 → 2 → 4 …, whose cycle starts at index 2, the value that two indices (3 and 4) point to.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.fast-slow.q5', type: 'debug', difficulty: 'easy',
    stem: 'This cycle check sometimes crashes with a null pointer. Why?\n\n```\nwhile (fast.next != null && fast != null) { slow = slow.next; fast = fast.next.next; ... }\n```',
    options: ['It dereferences fast before checking that fast is not null', ['slow should move first', 'Order of movement does not cause the crash.'], ['It should be fast.next.next != null', 'That still dereferences fast first.'], ['Java does not short-circuit &&', 'It does; the order of the operands is the problem.']],
    answer: 0,
    explanation: 'When fast becomes null (odd-length list), `fast.next` throws before `fast != null` is evaluated. Check `fast != null` first.',
  }),
  mcq({
    ...base, id: 'dsa.fast-slow.q6', type: 'edge-case', difficulty: 'medium',
    stem: 'Merge sort on a linked list splits at the middle found by fast/slow with both starting at the head. What happens for a 2-node list?',
    options: ['slow lands on the second node, so one half is empty and the recursion never shrinks', ['It works: halves of size 1 and 1', 'Only if you use the first middle.'], ['It crashes with a null pointer', 'The guard prevents that.'], ['It sorts in reverse', 'The order is not the issue.']],
    answer: 0,
    explanation: 'Split before slow: left = 2 nodes, right = empty → infinite recursion. Start fast at head->next to get the first middle, so the halves are 1 and 1.',
  }),
  mcq({
    ...base, id: 'dsa.fast-slow.q7', type: 'pattern', difficulty: 'medium',
    stem: 'Which problem is a natural fit for fast and slow pointers?',
    options: ['Decide whether repeatedly replacing n by the sum of the squares of its digits reaches 1', ['Find two numbers in a sorted array that sum to a target', 'Classic opposite-end two pointers.'], ['Longest substring without repeating characters', 'Sliding window.'], ['Detect a cycle in a directed graph with many components', 'DFS colouring or topological sort.']],
    answer: 0,
    explanation: 'The digit-square map is a "next" function over a finite set of values, so the sequence ends in a cycle; fast/slow detects it in O(1) space.',
  }),
  mcq({
    ...base, id: 'dsa.fast-slow.q8', type: 'concept', difficulty: 'hard',
    stem: 'Tail length a = 4, cycle length c = 3. How many steps does the "reset to head" phase take before the pointers meet?',
    options: ['4', ['3', 'That is the cycle length; phase 2 always takes exactly a steps.'], ['1', 'That would be the meeting offset b in some cases.'], ['It depends on where they met', 'a = kc − b, so phase 2 takes a steps wherever they met.']],
    answer: 0,
    explanation: 'The head pointer reaches the cycle start after exactly a steps, and the other pointer arrives there at the same time.',
  }),
];
