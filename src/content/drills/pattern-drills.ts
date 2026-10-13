// Recognition drills: "which pattern fits?" scenarios. Every scenario is original wording of a
// well-known problem shape (no statement is copied). Each has exactly one best answer; the three
// distractors are patterns a learner plausibly confuses it with, and `why` names the signal.
export interface PatternDrill {
  id: string;
  scenario: string;
  answer: string;       // dsa.* topic id
  options: string[];    // four topic ids including the answer
  why: string;
}

const T = {
  tp: 'dsa.two-pointers', sw: 'dsa.sliding-window', hash: 'dsa.hashing', pre: 'dsa.prefix-sums', bs: 'dsa.binary-search',
  stack: 'dsa.stacks-queues', mono: 'dsa.monotonic-stack-queue', ll: 'dsa.linked-lists', fs: 'dsa.fast-slow-pointers',
  tree: 'dsa.binary-trees', bst: 'dsa.bst', heap: 'dsa.heaps', trie: 'dsa.tries', graph: 'dsa.graphs', topo: 'dsa.topological-sort',
  dsu: 'dsa.dsu', sp: 'dsa.shortest-paths', mst: 'dsa.mst', bt: 'dsa.backtracking', dp1: 'dsa.dp-1d', dp2: 'dsa.dp-2d',
  dpa: 'dsa.dp-advanced', greedy: 'dsa.greedy', iv: 'dsa.intervals', kad: 'dsa.kadane', bit: 'dsa.bit-manipulation',
  mat: 'dsa.matrix', sm: 'dsa.string-matching', seg: 'dsa.fenwick-segment', dc: 'dsa.divide-conquer', math: 'dsa.math',
  sort: 'dsa.sorting', rec: 'dsa.recursion', design: 'dsa.design-ds', arr: 'dsa.arrays-strings', adv: 'dsa.advanced-graphs',
} as const;

type Row = [string, string, [string, string, string], string];

const ROWS: Row[] = [
  // Two pointers
  ['A sorted array of prices and a target. Report whether some pair of prices adds up to exactly the target, using O(1) extra space.', T.tp, [T.hash, T.bs, T.sw], 'Sorted input plus a pair sum: walk one pointer from each end inward.'],
  ['Remove duplicates from a sorted array in place and return the new length.', T.tp, [T.hash, T.sort, T.sw], 'A read pointer and a write pointer over a sorted array.'],
  ['Check whether a string is a palindrome after ignoring everything except letters and digits.', T.tp, [T.rec, T.stack, T.hash], 'Compare from both ends moving toward the middle, skipping ignored characters.'],
  ['Given heights of vertical walls, choose two walls that hold the most water between them.', T.tp, [T.dp1, T.mono, T.sw], 'Start with the widest pair and move the shorter wall inward; the area bound justifies discarding it.'],
  ['Find all unique triples in an array that sum to zero.', T.tp, [T.hash, T.bt, T.sw], 'Sort, fix one element, and run a two-pointer pair search on the rest, skipping duplicates.'],
  ['Move every zero in an array to the end while keeping the order of the other elements, in place.', T.tp, [T.sort, T.hash, T.greedy], 'A write pointer collects non-zeros while a read pointer scans.'],
  ['Merge two sorted arrays into one sorted array, where the first array has spare room at its end to hold the result.', T.tp, [T.sort, T.heap, T.dc], 'Fill from the back with a pointer in each array.'],
  ['Sort an array containing only the values 0, 1 and 2 in a single pass without a counting array.', T.tp, [T.sort, T.hash, T.bit], 'Three-way partition using low, mid and high pointers (Dutch national flag).'],

  // Sliding window
  ['Find the length of the longest substring in which no character repeats.', T.sw, [T.dp1, T.hash, T.tp], 'A contiguous range whose validity changes as it grows; shrink from the left when a repeat appears.'],
  ['Given positive numbers and a target, find the shortest contiguous subarray whose sum is at least the target.', T.sw, [T.pre, T.kad, T.bs], 'All values are positive, so growing the window raises the sum and shrinking lowers it.'],
  ['Find the maximum sum of any k consecutive elements.', T.sw, [T.pre, T.kad, T.dp1], 'A fixed-size window that slides one step at a time.'],
  ['Return the smallest substring of s that contains every character of t (with multiplicity).', T.sw, [T.hash, T.dp2, T.tp], 'Expand until the window is valid, then shrink while it stays valid, tracking character counts.'],
  ['Find the longest run of a letter you could get after replacing at most k characters of the string.', T.sw, [T.dp1, T.greedy, T.hash], 'Window validity is (length minus the most frequent count) at most k.'],
  ['Report every start index where an anagram of p appears inside s.', T.sw, [T.hash, T.sm, T.sort], 'A fixed window of length |p| with a rolling frequency comparison.'],
  ['Find the longest subarray of 0s and 1s containing at most one zero (you may delete one element).', T.sw, [T.dp1, T.pre, T.kad], 'A variable window that tolerates at most one disallowed element.'],

  // Hashing
  ['Given an array and a target, return the indices of two elements that sum to the target (the array is not sorted).', T.hash, [T.tp, T.sort, T.bs], 'Unsorted input: store seen values and look up the complement in O(1).'],
  ['Group words that are anagrams of each other.', T.hash, [T.sort, T.trie, T.tp], 'Use a canonical key (sorted letters or a count signature) to bucket the words.'],
  ['Find whether any value appears at least twice in an array.', T.hash, [T.sort, T.bit, T.tp], 'A set remembers what has been seen.'],
  ['Count the subarrays whose sum equals k (values may be negative).', T.pre, [T.sw, T.kad, T.dp1], 'Negatives break the window, so use prefix sums and a map of how often each prefix occurred.'],
  ['Find the length of the longest consecutive run of integers in an unsorted array in O(n).', T.hash, [T.sort, T.bs, T.dp1], 'Put everything in a set and only start counting from numbers that have no predecessor.'],
  ['Decide whether a ransom note can be built from the letters of a magazine.', T.hash, [T.sort, T.sw, T.greedy], 'Compare letter frequencies.'],
  ['Return the k most frequent words in a text.', T.heap, [T.bs, T.dc, T.trie], 'Count with a map, then pick the top k with a heap (or bucket by frequency).'],
  ['Check whether two strings are isomorphic: characters can be renamed one-to-one to turn one into the other.', T.hash, [T.dp2, T.tp, T.sm], 'Maintain a consistent mapping in both directions.'],

  // Prefix sums
  ['Answer many queries asking for the sum of the elements between indices l and r of a static array.', T.pre, [T.seg, T.sw, T.dp1], 'Static data and many range-sum queries: precompute prefix sums once.'],
  ['For each index, report the product of all the other elements without using division.', T.pre, [T.dp1, T.math, T.hash], 'Combine a prefix product with a suffix product.'],
  ['Find a pivot index where the sum on its left equals the sum on its right.', T.pre, [T.tp, T.sw, T.bs], 'Compare the running prefix with the total minus the prefix.'],
  ['Count subarrays whose sum is divisible by k.', T.pre, [T.sw, T.kad, T.dp1], 'Equal prefix remainders mean the subarray between them is divisible by k.'],
  ['Find the longest subarray with equal numbers of 0s and 1s.', T.pre, [T.sw, T.dp1, T.hash], 'Treat 0 as -1 and look for the earliest repeat of a prefix sum.'],
  ['Many rectangle-sum queries on a fixed grid of numbers.', T.pre, [T.dp2, T.seg, T.mat], 'A 2D prefix sum answers each query in O(1) after one pass.'],

  // Binary search
  ['Find a target in a sorted array in O(log n).', T.bs, [T.tp, T.hash, T.dc], 'Sorted data and a lookup: halve the range each step.'],
  ['A sorted array was rotated at an unknown point. Find the minimum.', T.bs, [T.sort, T.tp, T.dc], 'One half is always sorted, which tells you which side to discard.'],
  ['Find the smallest speed at which a worker can finish all piles within h hours.', T.bs, [T.greedy, T.dp1, T.heap], 'The feasibility check is monotonic in the answer, so binary search the answer itself.'],
  ['Split an array into m contiguous parts to minimise the largest part sum.', T.bs, [T.dp2, T.greedy, T.dpa], 'Binary search on the largest allowed sum with a greedy feasibility check.'],
  ['Find the first and last position of a value in a sorted array with duplicates.', T.bs, [T.tp, T.hash, T.sw], 'Two boundary searches (lower and upper bound).'],
  ['Compute the integer square root of a non-negative integer without using a library function.', T.bs, [T.math, T.rec, T.bit], 'The predicate mid*mid <= x is monotonic, so search the answer range.'],
  ['Search a matrix whose rows are sorted and whose first element of each row exceeds the last element of the previous row.', T.bs, [T.mat, T.dc, T.tp], 'Treat the grid as one flattened sorted array.'],

  // Stacks and monotonic stack
  ['Check whether a string of brackets is balanced.', T.stack, [T.rec, T.tp, T.hash], 'The most recent open bracket must close first: last in, first out.'],
  ['For each day, find how many days until a warmer temperature.', T.mono, [T.stack, T.heap, T.sw], 'The next greater element: keep a stack of unresolved days in decreasing order of temperature.'],
  ['Evaluate an expression written in reverse Polish notation.', T.stack, [T.tree, T.rec, T.dp1], 'Push operands, pop two on each operator.'],
  ['Find the largest rectangle in a histogram.', T.mono, [T.dp1, T.dc, T.sw], 'For every bar, find the nearest smaller bar on each side with an increasing stack.'],
  ['Design a stack that returns its minimum in O(1).', T.design, [T.heap, T.hash, T.bst], 'Store the running minimum alongside each element.'],
  ['Implement a queue using only stacks.', T.stack, [T.ll, T.heap, T.dp1], 'Two stacks reverse the order twice.'],
  ['Find the maximum of every window of size k as it slides across an array.', T.mono, [T.sw, T.heap, T.seg], 'A monotonic deque keeps candidates in decreasing order and expires old indices.'],
  ['Decode a string like "3[a2[c]]" into its expanded form.', T.stack, [T.rec, T.sm, T.dp1], 'Nested structure: push the count and partial string when entering a bracket.'],

  // Linked lists and fast-slow
  ['Detect whether a linked list contains a cycle using O(1) memory.', T.fs, [T.hash, T.ll, T.tp], 'Floyd: a fast pointer eventually laps a slow pointer inside a cycle.'],
  ['Find the middle node of a linked list in one pass.', T.fs, [T.ll, T.tp, T.rec], 'When the fast pointer reaches the end, the slow pointer is at the middle.'],
  ['Reverse a singly linked list in place.', T.ll, [T.rec, T.stack, T.fs], 'Re-point each node backwards while walking forward.'],
  ['Remove the n-th node from the end of a linked list in one pass.', T.fs, [T.ll, T.hash, T.rec], 'Start one pointer n steps ahead, then move both until the lead hits the end.'],
  ['Find the duplicate in an array of n+1 numbers drawn from 1..n without modifying it and in O(1) space.', T.fs, [T.hash, T.bs, T.bit], 'Treat values as next-pointers; the duplicate is the cycle entrance.'],
  ['Merge k sorted linked lists into one.', T.heap, [T.ll, T.hash, T.bt], 'A min-heap of the current heads always yields the next smallest node.'],
  ['Decide whether a linked list reads the same forwards and backwards using O(1) extra space.', T.fs, [T.stack, T.rec, T.hash], 'Find the middle with fast/slow pointers, reverse the second half and compare.'],

  // Trees
  ['Compute the maximum depth of a binary tree.', T.tree, [T.graph, T.dp1, T.bst], 'A direct recursion over left and right subtrees.'],
  ['Print a binary tree level by level.', T.tree, [T.graph, T.heap, T.stack], 'Breadth-first traversal with a queue, one level per round.'],
  ['Validate that a binary tree is a binary search tree.', T.bst, [T.tree, T.graph, T.dc], 'Carry the allowed (min, max) range down, or check that the in-order sequence is increasing.'],
  ['Find the lowest common ancestor of two nodes in a binary search tree.', T.bst, [T.tree, T.graph, T.bs], 'Use the ordering: the first node whose value splits the two targets.'],
  ['Find the k-th smallest element in a binary search tree.', T.bst, [T.heap, T.tree, T.sort], 'In-order traversal visits values in sorted order.'],
  ['Compute the maximum path sum in a binary tree where a path can start and end at any node.', T.tree, [T.dp1, T.graph, T.kad], 'Post-order recursion returning the best downward gain while updating a global best through each node.'],
  ['Rebuild a binary tree from its preorder and inorder traversals.', T.tree, [T.rec, T.dc, T.graph], 'Preorder gives the root, inorder splits left and right; recurse on the pieces.'],
  ['Serialise a binary tree to a string and rebuild it from that string.', T.tree, [T.design, T.graph, T.rec], 'Traverse with null markers so the shape can be reconstructed.'],

  // Heaps and design
  ['Find the k-th largest element in an unsorted array.', T.heap, [T.bs, T.dp1, T.graph], 'A min-heap of size k, or quickselect, avoids a full sort.'],
  ['Maintain the median of a stream of numbers as new ones arrive.', T.heap, [T.sort, T.bst, T.seg], 'Two heaps: a max-heap for the lower half and a min-heap for the upper half.'],
  ['Each child has a greed factor and each cookie has a size; give at most one cookie per child to satisfy as many children as possible.', T.greedy, [T.dp1, T.bt, T.graph], 'Sort both and match the smallest sufficient cookie to the least greedy child.'],
  ['Find the k closest points to the origin.', T.heap, [T.bs, T.dp1, T.graph], 'Keep the k best by distance in a bounded heap.'],
  ['Design a cache that evicts the least recently used item, with O(1) get and put.', T.design, [T.heap, T.hash, T.ll], 'A hash map for lookup combined with a doubly linked list for recency order.'],
  ['Autocomplete: given a prefix, return the words stored that start with it.', T.trie, [T.hash, T.sort, T.bs], 'A trie shares prefixes, so one walk reaches the whole subtree of matches.'],
  ['Design a structure supporting insert, delete and get-random in O(1).', T.design, [T.heap, T.bst, T.ll], 'An array for random access plus a map from value to index, swapping with the last element on delete.'],

  // Graphs, topological, DSU, shortest path, MST
  ['Count the islands in a grid of land and water.', T.graph, [T.dp2, T.mat, T.dsu], 'Flood fill with DFS or BFS over connected components.'],
  ['Find the minimum number of moves to turn one word into another changing one letter at a time through valid words.', T.graph, [T.bt, T.dp2, T.bs], 'Each word is a node; unweighted shortest path means BFS.'],
  ['Given course prerequisites, decide whether you can finish all courses.', T.topo, [T.graph, T.dsu, T.dp1], 'Ordering with dependencies: a cycle means impossible, otherwise a topological order exists.'],
  ['Return one valid order to take courses given their prerequisites.', T.topo, [T.graph, T.bt, T.greedy], 'Kahn’s algorithm or reverse DFS post-order.'],
  ['Find the order of letters in an unknown alphabet from a sorted list of its words.', T.topo, [T.trie, T.graph, T.sort], 'Adjacent words give ordering edges between letters; then order the letters.'],
  ['Decide whether an undirected graph given as edges forms a single tree.', T.dsu, [T.graph, T.topo, T.mst], 'n-1 edges that never join already-connected nodes: union-find detects the redundant edge.'],
  ['Find the edge that, when removed, turns a graph with exactly one cycle back into a tree.', T.dsu, [T.graph, T.mst, T.topo], 'The first edge whose endpoints are already connected closes the cycle.'],
  ['Accounts are lists of emails; merge any two accounts that share at least one email, then report each merged account.', T.dsu, [T.hash, T.graph, T.sort], 'Repeated merging of groups that share an element: union-find on the emails.'],
  ['Find the cheapest path from a source to every other node in a graph with non-negative edge weights.', T.sp, [T.graph, T.mst, T.dp2], 'Dijkstra with a priority queue.'],
  ['Find the cheapest flight from A to B with at most k stops.', T.sp, [T.graph, T.dp2, T.greedy], 'A hop-bounded shortest path: Bellman-Ford with k+1 rounds.'],
  ['Connect every city with the minimum total cable length.', T.mst, [T.sp, T.graph, T.greedy], 'The cheapest set of edges connecting all nodes is a minimum spanning tree (Kruskal or Prim).'],
  ['Find the time for a signal to reach all nodes of a weighted directed network.', T.sp, [T.graph, T.mst, T.topo], 'The answer is the largest shortest-path distance from the source.'],
  ['Clone an undirected graph given a reference to one node.', T.graph, [T.dsu, T.rec, T.tree], 'Traverse with a map from original nodes to their copies.'],
  ['Decide whether a graph can be split into two groups with no edge inside a group.', T.graph, [T.dsu, T.topo, T.mst], 'Two-colouring with BFS or DFS.'],
  ['Find the minimum time for oranges in a grid to rot when rot spreads each minute to neighbours.', T.graph, [T.dp2, T.mat, T.sp], 'Multi-source BFS: all rotten oranges start in the queue together.'],
  ['Find all critical connections (bridges) in a network.', T.adv, [T.graph, T.dsu, T.mst], 'Tarjan’s low-link values on a DFS tree.'],

  // Backtracking
  ['Generate all subsets of a set of distinct numbers.', T.bt, [T.bit, T.dp1, T.rec], 'Include-or-exclude choices explored recursively.'],
  ['Generate all permutations of a list of distinct numbers.', T.bt, [T.rec, T.dp1, T.greedy], 'Choose an unused element, recurse, then undo the choice.'],
  ['Find every combination of candidates (reuse allowed) that sums to a target.', T.bt, [T.dp1, T.greedy, T.rec], 'Enumerate all answers (not just count them), pruning when the remainder goes negative.'],
  ['Place n queens on an n by n board so none attack each other and list all layouts.', T.bt, [T.dp2, T.graph, T.greedy], 'Place row by row, abandoning a partial layout the moment it conflicts.'],
  ['Decide whether a word can be traced through adjacent cells of a letter grid without reusing a cell.', T.bt, [T.graph, T.dp2, T.trie], 'DFS with a visited mark that is undone on the way back.'],
  ['Split a string into every possible partition where each piece is a palindrome.', T.bt, [T.dp2, T.rec, T.tp], 'Try each prefix that is a palindrome and recurse on the rest.'],
  ['Generate all well-formed strings of n pairs of parentheses.', T.bt, [T.stack, T.dp1, T.rec], 'Build character by character while keeping open and close counts valid.'],

  // DP
  ['Count the ways to climb n stairs taking 1 or 2 steps at a time.', T.dp1, [T.rec, T.math, T.greedy], 'The answer for n depends only on n-1 and n-2.'],
  ['Maximum money from robbing houses in a row where adjacent houses cannot both be robbed.', T.dp1, [T.greedy, T.kad, T.dp2], 'At each house choose take-it-plus-two-back or skip-it.'],
  ['Fewest coins needed to make an amount, with unlimited coins of each denomination.', T.dp1, [T.greedy, T.bt, T.bs], 'Unbounded choices with overlapping subproblems; greedy fails for general coin sets.'],
  ['Length of the longest strictly increasing subsequence.', T.dp1, [T.kad, T.sw, T.greedy], 'dp[i] depends on earlier smaller elements (a patience-sorting binary search gives O(n log n)).'],
  ['Count the unique paths from the top-left to the bottom-right of a grid moving only right or down.', T.dp2, [T.graph, T.bt, T.math], 'Each cell is the sum of the cell above and the cell to the left.'],
  ['Length of the longest common subsequence of two strings.', T.dp2, [T.dp1, T.sm, T.hash], 'A table indexed by prefixes of both strings.'],
  ['Minimum number of edits (insert, delete, replace) to turn one word into another.', T.dp2, [T.dp1, T.greedy, T.sm], 'Classic edit distance over prefixes of both words.'],
  ['Can a set of numbers be split into two subsets with equal sum?', T.dp1, [T.greedy, T.bt, T.hash], 'A 0/1 subset-sum feasibility table.'],
  ['Does a string match a pattern containing "." and "*" wildcards, over the entire string?', T.dp2, [T.sm, T.rec, T.stack], 'State is (position in text, position in pattern) with choices at each star.'],
  ['Maximum profit buying and selling a stock with a cooldown day after each sale.', T.dpa, [T.greedy, T.dp1, T.kad], 'A small state machine (holding, sold, resting) carried through the days.'],
  ['Cut a rod into pieces to maximise total value from a price table.', T.dp1, [T.greedy, T.dp2, T.bt], 'Unbounded knapsack over the rod length.'],
  ['Burst balloons in the best order to maximise the coins collected (the neighbours change as you burst).', T.dpa, [T.dp2, T.greedy, T.dc], 'Interval DP: choose which balloon bursts last in each range.'],
  ['Assign each of n tasks to one of n workers, minimising cost, when n is at most 16.', T.dpa, [T.greedy, T.bt, T.graph], 'A bitmask of used workers as the DP state.'],

  // Greedy, intervals, Kadane
  ['Can you reach the last index if each value is the maximum jump from that position?', T.greedy, [T.dp1, T.graph, T.bt], 'Track the farthest reachable index while scanning.'],
  ['Choose the maximum number of non-overlapping activities from a list of start and end times.', T.greedy, [T.dp1, T.heap, T.bs], 'Sort by earliest finish and take whatever still fits.'],
  ['Merge all overlapping intervals.', T.iv, [T.sort, T.dp1, T.hash], 'Sort by start and extend or close the current interval.'],
  ['Insert a new interval into a sorted list of disjoint intervals, merging where needed.', T.iv, [T.bs, T.greedy, T.sort], 'Add the intervals before, merge the overlapping, then add the rest.'],
  ['Find the minimum number of meeting rooms needed for a set of meetings.', T.iv, [T.heap, T.dp1, T.hash], 'Sweep the sorted start and end times, counting concurrent meetings.'],
  ['Find the contiguous subarray with the largest sum (values can be negative).', T.kad, [T.sw, T.pre, T.dp1], 'Keep the best sum ending here, restarting when it goes negative.'],
  ['Find the contiguous subarray with the largest product.', T.kad, [T.dp1, T.sw, T.pre], 'Track both the max and the min product ending here because negatives flip signs.'],
  ['Minimum number of arrows to burst all balloons laid out as intervals on a line.', T.iv, [T.dp1, T.bs, T.hash], 'Sort by end and shoot at each earliest end that still has unburst balloons.'],
  ['Gas stations in a circle: find the starting station that lets a car complete the loop.', T.greedy, [T.pre, T.dp1, T.sw], 'If the total fuel is enough, the start is just after the point where the running deficit is lowest.'],

  // Bit, math, matrix, strings, advanced
  ['Find the single number in an array where every other number appears exactly twice, in O(1) space.', T.bit, [T.hash, T.sort, T.math], 'XOR cancels pairs.'],
  ['Count the 1 bits in an integer.', T.bit, [T.math, T.dp1, T.rec], 'Clear the lowest set bit repeatedly (n & (n-1)).'],
  ['Decide whether an integer is a power of two without loops.', T.bit, [T.math, T.bs, T.rec], 'A power of two has exactly one set bit.'],
  ['Compute x raised to the power n for a very large n in O(log n).', T.math, [T.rec, T.dp1, T.bit], 'Exponentiation by squaring.'],
  ['Count the primes below n.', T.math, [T.dp1, T.hash, T.bs], 'Sieve of Eratosthenes.'],
  ['Rotate an n by n image 90 degrees clockwise in place.', T.mat, [T.dp2, T.tp, T.arr], 'Transpose and reverse each row (or rotate four cells at a time).'],
  ['Return the elements of a matrix in spiral order.', T.mat, [T.graph, T.dp2, T.tp], 'Walk the boundaries layer by layer.'],
  ['If a cell in a matrix is zero, set its whole row and column to zero, in place.', T.mat, [T.hash, T.dp2, T.bit], 'Use the first row and column as markers to avoid extra space.'],
  ['Find every occurrence of a pattern in a long text in O(n + m).', T.sm, [T.hash, T.sw, T.dp2], 'KMP (or Z-function) reuses the matched prefix instead of restarting.'],
  ['Decide whether a string can be split into a sequence of words from a dictionary.', T.dp1, [T.bt, T.trie, T.greedy], 'dp[i] is true if some earlier dp[j] is true and s[j:i] is a word.'],
  ['Many point updates and range-sum queries on a changing array.', T.seg, [T.pre, T.sw, T.heap], 'Prefix sums break under updates; a Fenwick or segment tree gives O(log n) for both.'],
  ['Count the inversions in an array (pairs i<j with a[i] > a[j]).', T.dc, [T.dp1, T.hash, T.greedy], 'Count cross pairs while merging in merge sort.'],
  ['Sort a linked list in O(n log n) time with O(1) extra space for the pointers.', T.dc, [T.heap, T.hash, T.bs], 'Merge sort splits a list naturally.'],
  ['Count how many words in a dictionary start with a given prefix, with many queries.', T.trie, [T.hash, T.bs, T.sort], 'Store counts on trie nodes along each word.'],
];

export const PATTERN_DRILLS: PatternDrill[] = ROWS.map(([scenario, answer, wrong, why], i) => ({
  id: `drill.${String(i + 1).padStart(3, '0')}`,
  scenario,
  answer,
  options: [answer, ...wrong],
  why,
}));
