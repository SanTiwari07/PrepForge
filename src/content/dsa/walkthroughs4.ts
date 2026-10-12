import type { CoachWalkthrough } from '../schema';
import { cpp, java } from '../helpers';

// Original PrepForge walkthroughs, batch 4 (the remaining Blind 75 problems). Problem statements
// are NOT copied; read the official statement via the link on the problem page. Every solution
// was compiled and run against its listed test cases in both C++ and Java before it was added
// (scripts/verify-code.ts re-checks that the snippets still compile). Keys are LeetCode slugs.
export const walkthroughs4: Record<string, CoachWalkthrough> = {
  "longest-palindromic-substring": {
    understandMd: "Return the longest contiguous piece of the string that reads the same forwards and backwards. If several have the maximum length, any one is accepted.",
    ioConstraintsMd: "Input: a string of up to about 1,000 letters or digits. Output: the substring itself (not its length).",
    edgeCases: ["Single character", "All characters equal", "Even-length palindrome such as \"bb\"", "The answer starts at index 0 or ends at the last index"],
    bruteForceMd: "Try every substring (O(n²) of them) and test each for being a palindrome in O(n).",
    bruteComplexity: "O(n³) time, O(1) space.",
    bottleneckMd: "Almost every palindrome check repeats work: if s[i..j] is a palindrome, then s[i+1..j-1] must be one too, so the checks overlap heavily.",
    hints: [
      "Every palindrome has a centre. Where can the centre be for odd and for even lengths?", "Instead of testing substrings, grow outwards from a centre while the two ends match. How many centres are there?", "Use 2n − 1 centres: a character for odd palindromes, and the gap between two characters for even ones. Expanding is O(n) per centre.", "For each centre expand while s[l] == s[r]; the length is r − l − 1 after the loop stops. Keep the best start and length.",
    ],
    optimalMd: "Expand around every centre. For centre c run two expansions, one starting at (c, c) and one at (c, c + 1). When the loop ends the palindrome is s[l+1 .. r-1], whose length is r − l − 1. Track the longest. There are O(n) centres and each expansion costs O(n), so the total is O(n²) with O(1) extra space.",
    code: [
      cpp(`
string longestPalindrome(string s) {
    int start = 0, best = 0, n = s.size();
    for (int c = 0; c < n; ++c) {
        for (int w = 0; w < 2; ++w) {                       // w = 0: odd length, w = 1: even length
            int l = c, r = c + w;
            while (l >= 0 && r < n && s[l] == s[r]) { --l; ++r; }
            int len = r - l - 1;
            if (len > best) { best = len; start = l + 1; }
        }
    }
    return s.substr(start, best);
}`, 'C++'),
      java(`
public String longestPalindrome(String s) {
    int start = 0, best = 0;
    for (int c = 0; c < s.length(); c++) {
        for (int w = 0; w < 2; w++) {                   // w = 0: odd length, w = 1: even length
            int l = c, r = c + w;
            while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
            int len = r - l - 1;
            if (len > best) { best = len; start = l + 1; }
        }
    }
    return s.substring(start, start + best);
}`, 'Java'),
    ],
    finalComplexity: "O(n²) time, O(1) space. (Manacher's algorithm achieves O(n) but is rarely expected.)",
    testCases: [
      { input: "\"babad\"", expected: "\"bab\" (or \"aba\")", why: "Odd centre with a tie" },
      { input: "\"cbbd\"", expected: "\"bb\"", why: "Even-length centre between two equal characters" },
      { input: "\"a\"", expected: "\"a\"", why: "Single character" },
      { input: "\"forgeeksskeegfor\"", expected: "\"geeksskeeg\"", why: "Long even palindrome in the middle" },
    ],
    takeawaysMd: "When a structure is symmetric, enumerate its centre and expand. Remember both odd and even centres; forgetting the even case is the classic bug.",
  },

  "remove-nth-node-from-end-of-list": {
    understandMd: "Delete the n-th node counted from the end of a singly linked list and return the head of the resulting list.",
    ioConstraintsMd: "Input: head of a list with 1 to 30 nodes and an integer n with 1 ≤ n ≤ length. Output: the new head (which changes when the first node is removed).",
    edgeCases: ["Single-node list (result is empty)", "Removing the head (n equals the length)", "Removing the last node (n = 1)", "Two-node list"],
    bruteForceMd: "First pass: count the nodes to get the length L. Second pass: walk to the node at position L − n − 1 and unlink its successor.",
    bruteComplexity: "O(L) time, O(1) space, but two passes.",
    bottleneckMd: "Nothing is slow here; the interview follow-up is to do it in a single pass, which needs a way to know where \"n from the end\" is without knowing L.",
    hints: [
      "If you knew the node just before the target, you could unlink it. How is that node positioned relative to the end?", "Keep two pointers a fixed distance apart. What distance, and where should the second one stop?", "Move the fast pointer n steps first, then advance both until fast reaches the last node: slow ends up just before the target.", "Put a dummy node in front of the head so removing the first node is not a special case.",
    ],
    optimalMd: "Create a dummy node pointing at the head. Advance a fast pointer n nodes from the dummy, then move fast and slow together until fast.next is null. Now slow.next is the node to delete: set slow.next = slow.next.next. Return dummy.next. One pass, and the dummy removes the special case for deleting the head.",
    code: [
      cpp(`
ListNode* removeNthFromEnd(ListNode* head, int n) {
    ListNode dummy(0, head);
    ListNode *fast = &dummy, *slow = &dummy;
    for (int i = 0; i < n; ++i) fast = fast->next;          // fast is n nodes ahead of slow
    while (fast->next) { fast = fast->next; slow = slow->next; }
    ListNode* doomed = slow->next;                          // slow stands just before the node to delete
    slow->next = doomed->next;
    delete doomed;
    return dummy.next;
}`, 'C++'),
      java(`
public ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0, head), fast = dummy, slow = dummy;
    for (int i = 0; i < n; i++) fast = fast.next;       // fast is n nodes ahead of slow
    while (fast.next != null) { fast = fast.next; slow = slow.next; }
    slow.next = slow.next.next;                         // slow stands just before the node to delete
    return dummy.next;
}`, 'Java'),
    ],
    finalComplexity: "O(L) time in a single pass, O(1) space.",
    testCases: [
      { input: "[1,2,3,4,5], n = 2", expected: "[1,2,3,5]", why: "Normal case" },
      { input: "[1], n = 1", expected: "[]", why: "Removing the only node" },
      { input: "[1,2], n = 1", expected: "[1]", why: "Remove the tail" },
      { input: "[1,2], n = 2", expected: "[2]", why: "Remove the head: needs the dummy" },
    ],
    takeawaysMd: "A fixed gap between two pointers measures distance from the end in one pass. A dummy head removes the \"delete the first node\" special case.",
  },

  "search-in-rotated-sorted-array": {
    understandMd: "A sorted array of distinct values was rotated at an unknown pivot (for example [0,1,2,4,5,6,7] became [4,5,6,7,0,1,2]). Find the index of a target value, or −1 if it is absent.",
    ioConstraintsMd: "Input: rotated array of distinct integers (length up to 5,000) and a target. Required: O(log n) time. Output: index or −1.",
    edgeCases: ["Array of length 1", "Not actually rotated (already sorted)", "Target is the pivot element or the first element", "Target missing"],
    bruteForceMd: "Scan the array linearly and compare each value with the target.",
    bruteComplexity: "O(n) time, O(1) space.",
    bottleneckMd: "The array is almost sorted, but a plain binary search fails because one side of the midpoint may be in the wrong order. The key observation is that one half is always sorted.",
    hints: [
      "After splitting at mid, is it possible that both halves are unsorted?", "At least one half is always sorted. How can you tell which one by comparing nums[lo] and nums[mid]?", "If the sorted half contains the target (check its two ends), search it; otherwise search the other half.", "if nums[lo] <= nums[mid]: left is sorted; go left iff nums[lo] <= target < nums[mid]. Else the right half is sorted; go right iff nums[mid] < target <= nums[hi].",
    ],
    optimalMd: "Run a binary search. At each step one of the two halves around mid is sorted. If the left half is sorted (nums[lo] ≤ nums[mid]) and the target lies inside it, discard the right half; otherwise discard the left half. Mirror the logic when the right half is sorted. Every step halves the range, giving O(log n).",
    code: [
      cpp(`
int search(vector<int>& nums, int target) {
    int lo = 0, hi = (int)nums.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {                        // the left half is sorted
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
        } else {                                            // the right half is sorted
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
        }
    }
    return -1;
}`, 'C++'),
      java(`
public int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {                    // the left half is sorted
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
        } else {                                        // the right half is sorted
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
        }
    }
    return -1;
}`, 'Java'),
    ],
    finalComplexity: "O(log n) time, O(1) space.",
    testCases: [
      { input: "[4,5,6,7,0,1,2], target 0", expected: "4", why: "Target in the rotated (right) part" },
      { input: "[4,5,6,7,0,1,2], target 3", expected: "-1", why: "Absent" },
      { input: "[1], target 0", expected: "-1", why: "Single element, absent" },
      { input: "[3,1], target 1", expected: "1", why: "Two elements with the pivot between them" },
    ],
    takeawaysMd: "In a rotated sorted array, one half around the midpoint is always sorted. Decide which one, then use ordinary range checks to choose a side.",
  },

  "combination-sum": {
    understandMd: "Given distinct positive integers and a target, list every unique combination of those numbers (each may be used any number of times) that sums to the target. The order of numbers inside a combination does not matter.",
    ioConstraintsMd: "Input: array of 1 to 30 distinct integers (each 2 to 40) and a target up to 40. Output: all combinations; the order of the combinations is free.",
    edgeCases: ["No combination exists", "Target equals a single candidate", "Candidate larger than the target", "Avoiding duplicate combinations like [2,3] and [3,2]"],
    bruteForceMd: "Generate every sequence of candidates with sum at most the target and filter out duplicates after sorting each one.",
    bruteComplexity: "Exponential, with heavy duplicate work.",
    bottleneckMd: "Permutations of the same multiset are produced repeatedly. Choosing candidates in non-decreasing index order removes the duplicates before they are generated.",
    hints: [
      "Think of building the answer one number at a time. At each step, what are your choices?", "To avoid [2,3] and [3,2], only allow choosing candidates from the current index onwards. Reuse of the same number is allowed.", "Backtrack: add candidate i, recurse with remaining − c[i] and start index i (not i + 1), then remove it.", "Sort the candidates so you can stop the loop as soon as c[i] > remaining. Record the path when remaining == 0.",
    ],
    optimalMd: "Sort the candidates and run a depth-first search with (start index, remaining). For i from start while c[i] ≤ remaining, push c[i] and recurse with the same index i (reuse allowed), then pop. When remaining hits 0 save a copy of the path. Because the next choice never moves backwards in the array, every combination is built in exactly one order.",
    code: [
      cpp(`
void collect(vector<int>& c, int remain, int start, vector<int>& path, vector<vector<int>>& res) {
    if (remain == 0) { res.push_back(path); return; }
    for (int i = start; i < (int)c.size() && c[i] <= remain; ++i) {
        path.push_back(c[i]);
        collect(c, remain - c[i], i, path, res);            // i, not i + 1: a number may be reused
        path.pop_back();
    }
}
vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
    vector<vector<int>> res;
    vector<int> path;
    sort(candidates.begin(), candidates.end());
    collect(candidates, target, 0, path, res);
    return res;
}`, 'C++'),
      java(`
public List<List<Integer>> combinationSum(int[] candidates, int target) {
    List<List<Integer>> res = new ArrayList<>();
    Arrays.sort(candidates);
    collect(candidates, target, 0, new ArrayList<>(), res);
    return res;
}
private void collect(int[] c, int remain, int start, List<Integer> path, List<List<Integer>> res) {
    if (remain == 0) { res.add(new ArrayList<>(path)); return; }
    for (int i = start; i < c.length && c[i] <= remain; i++) {
        path.add(c[i]);
        collect(c, remain - c[i], i, path, res);        // i, not i + 1: a number may be reused
        path.remove(path.size() - 1);
    }
}`, 'Java'),
    ],
    finalComplexity: "Time is exponential in the worst case (bounded by the number of combinations times their length); O(target / min(candidate)) recursion depth.",
    testCases: [
      { input: "[2,3,6,7], target 7", expected: "[[2,2,3],[7]]", why: "Reuse of 2 and a single-element answer" },
      { input: "[2,3,5], target 8", expected: "[[2,2,2,2],[2,3,3],[3,5]]", why: "Several combinations" },
      { input: "[2], target 1", expected: "[]", why: "No solution" },
    ],
    takeawaysMd: "For \"choose with repetition, order irrelevant\", recurse with a start index that never moves backwards. Pass the same index to allow reuse and index + 1 to forbid it.",
  },

  "spiral-matrix": {
    understandMd: "Return all elements of an m × n matrix in clockwise spiral order, starting at the top-left corner.",
    ioConstraintsMd: "Input: matrix with 1 to 10 rows and columns. Output: list of m × n values.",
    edgeCases: ["Single cell", "Single row or single column", "Non-square matrix", "Matrix where the last ring has one row or one column"],
    bruteForceMd: "Simulate the walk with a visited matrix, turning right whenever the next cell is outside or already visited.",
    bruteComplexity: "O(m·n) time, O(m·n) space for the visited array.",
    bottleneckMd: "The visited matrix is only there to know where to turn. Four shrinking boundaries tell you the same thing without extra memory.",
    hints: [
      "After walking along the top row, which row becomes the new top boundary?", "Maintain top, bottom, left, right. Walk one side, then move that boundary inward.", "After the top row and the right column, check that the remaining rectangle is still non-empty before walking the bottom row and left column.", "Loop while top <= bottom and left <= right; guard the third and fourth sides with their own condition checks.",
    ],
    optimalMd: "Keep four boundaries. Each round: left → right along the top, then top++; top → bottom along the right, then right−−; if rows remain, right → left along the bottom, then bottom−−; if columns remain, bottom → top along the left, then left++. The guards on the last two sides stop the walk from repeating cells when only one row or column is left.",
    code: [
      cpp(`
vector<int> spiralOrder(vector<vector<int>>& m) {
    vector<int> out;
    int top = 0, bottom = (int)m.size() - 1, left = 0, right = (int)m[0].size() - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; ++c) out.push_back(m[top][c]);
        ++top;
        for (int r = top; r <= bottom; ++r) out.push_back(m[r][right]);
        --right;
        if (top <= bottom) { for (int c = right; c >= left; --c) out.push_back(m[bottom][c]); --bottom; }
        if (left <= right) { for (int r = bottom; r >= top; --r) out.push_back(m[r][left]); ++left; }
    }
    return out;
}`, 'C++'),
      java(`
public List<Integer> spiralOrder(int[][] m) {
    List<Integer> out = new ArrayList<>();
    int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.add(m[top][c]);
        top++;
        for (int r = top; r <= bottom; r++) out.add(m[r][right]);
        right--;
        if (top <= bottom) { for (int c = right; c >= left; c--) out.add(m[bottom][c]); bottom--; }
        if (left <= right) { for (int r = bottom; r >= top; r--) out.add(m[r][left]); left++; }
    }
    return out;
}`, 'Java'),
    ],
    finalComplexity: "O(m·n) time, O(1) extra space.",
    testCases: [
      { input: "[[1,2,3],[4,5,6],[7,8,9]]", expected: "[1,2,3,6,9,8,7,4,5]", why: "3 × 3" },
      { input: "[[1,2,3,4],[5,6,7,8],[9,10,11,12]]", expected: "[1,2,3,4,8,12,11,10,9,5,6,7]", why: "Non-square" },
      { input: "[[1],[2],[3]]", expected: "[1,2,3]", why: "Single column: the guards matter" },
      { input: "[[7]]", expected: "[7]", why: "Single cell" },
    ],
    takeawaysMd: "Boundary-shrinking simulations need a non-empty check before each of the last two sides. Test single-row and single-column inputs.",
  },

  "jump-game": {
    understandMd: "Each array value is the maximum jump length from that position. Starting at index 0, decide whether the last index can be reached.",
    ioConstraintsMd: "Input: array of non-negative integers, length up to 10⁴. Output: true or false.",
    edgeCases: ["Single element (already at the end)", "A zero at the start with more elements after it", "A zero that can be jumped over", "A zero that is a trap"],
    bruteForceMd: "Recursion or DP: from each position try every jump length and see whether any leads to the end.",
    bruteComplexity: "O(n²) time with memoisation (O(2ⁿ) without).",
    bottleneckMd: "You do not need to know every reachable cell, only how far the frontier of reachable cells extends. The reachable set is always a prefix of the array.",
    hints: [
      "If you can reach index i, which indices before i can you also reach?", "The reachable positions form a contiguous prefix. What single number describes it?", "Track the farthest reachable index. If the loop index ever exceeds it, you are stuck.", "reach = 0; for i in range(n): if i > reach: return false; reach = max(reach, i + nums[i]); return true",
    ],
    optimalMd: "Greedy scan with the farthest reachable index. Visit positions from left to right; if the current index is beyond the farthest reach we can never get here, so return false. Otherwise extend reach with i + nums[i]. If the scan finishes, the last index was reachable.",
    code: [
      cpp(`
bool canJump(vector<int>& nums) {
    int reach = 0;                                          // farthest index reachable so far
    for (int i = 0; i < (int)nums.size(); ++i) {
        if (i > reach) return false;                        // stuck before reaching i
        reach = max(reach, i + nums[i]);
    }
    return true;
}`, 'C++'),
      java(`
public boolean canJump(int[] nums) {
    int reach = 0;                                      // farthest index reachable so far
    for (int i = 0; i < nums.length; i++) {
        if (i > reach) return false;                    // stuck before reaching i
        reach = Math.max(reach, i + nums[i]);
    }
    return true;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[2,3,1,1,4]", expected: "true", why: "Reachable with several routes" },
      { input: "[3,2,1,0,4]", expected: "false", why: "Every route ends on the 0" },
      { input: "[0]", expected: "true", why: "Already at the end" },
      { input: "[0,1]", expected: "false", why: "Zero at the start blocks everything" },
    ],
    takeawaysMd: "When reachability is monotone (a reachable prefix), track the frontier with one variable instead of a DP table.",
  },

  "unique-paths": {
    understandMd: "A robot starts at the top-left corner of an m × n grid and may only move right or down. Count the distinct paths to the bottom-right corner.",
    ioConstraintsMd: "Input: m and n, each 1 to 100. Output: number of paths (fits in a 32-bit integer for the given limits).",
    edgeCases: ["1 × 1 grid (one path)", "Single row or column (one path)", "Large grid (overflow if you use the factorial formula with 32-bit ints)"],
    bruteForceMd: "Recursively count paths from (r, c) as the sum of the paths from (r+1, c) and (r, c+1).",
    bruteComplexity: "O(2^(m+n)) time.",
    bottleneckMd: "The same cell is reached by many routes, so the recursion recomputes the same sub-problems; that overlap is what dynamic programming removes.",
    hints: [
      "How many ways can the robot arrive at a cell? From which neighbours?", "paths(r, c) = paths(r−1, c) + paths(r, c−1). What are the values on the first row and first column?", "Fill a table row by row. Do you need the whole table, or only the previous row?", "dp[c] starts as 1 for all columns; for each further row, dp[c] += dp[c − 1].",
    ],
    optimalMd: "Let dp[r][c] be the number of ways to reach (r, c). The first row and column are all 1; every other cell is the sum of the cell above and the cell to the left. Because a row only needs the previous row, one array suffices: dp[c] (still holding the value from above) += dp[c − 1] (the new value on the left). The answer is dp[n − 1]. (Combinatorially it is C(m + n − 2, m − 1).)",
    code: [
      cpp(`
int uniquePaths(int m, int n) {
    vector<int> dp(n, 1);                                   // dp[c] = paths to the current row's column c; row 0 is all 1
    for (int r = 1; r < m; ++r)
        for (int c = 1; c < n; ++c) dp[c] += dp[c - 1];     // from above (old dp[c]) + from the left
    return dp[n - 1];
}`, 'C++'),
      java(`
public int uniquePaths(int m, int n) {
    int[] dp = new int[n];                              // dp[c] = paths to the current row's column c
    Arrays.fill(dp, 1);                                 // first row: one way to reach each cell
    for (int r = 1; r < m; r++)
        for (int c = 1; c < n; c++) dp[c] += dp[c - 1]; // from above (old dp[c]) + from the left
    return dp[n - 1];
}`, 'Java'),
    ],
    finalComplexity: "O(m·n) time, O(n) space.",
    testCases: [
      { input: "m = 3, n = 7", expected: "28", why: "Typical" },
      { input: "m = 3, n = 2", expected: "3", why: "Small" },
      { input: "m = 1, n = 1", expected: "1", why: "Start equals end" },
      { input: "m = 7, n = 3", expected: "28", why: "Symmetry check" },
    ],
    takeawaysMd: "Grid-path counting is a two-term recurrence; compress the table to a single row when each row depends only on the previous one.",
  },

  "set-matrix-zeroes": {
    understandMd: "If a cell of an m × n matrix is 0, set its entire row and column to 0. Do it in place.",
    ioConstraintsMd: "Input: matrix up to 200 × 200 of integers. Output: the matrix modified in place. A follow-up asks for O(1) extra space.",
    edgeCases: ["Zero in the first row or first column", "Several zeros in the same row", "No zeros at all", "A 1 × n or m × 1 matrix"],
    bruteForceMd: "Copy the matrix; for every zero in the copy zero out its row and column in the original.",
    bruteComplexity: "O(m·n) time and O(m·n) space.",
    bottleneckMd: "Zeroing as you scan would turn later cells into false zeros, so you must record the original zeros first. Two boolean arrays (rows and columns) do it in O(m + n) space, and the matrix itself can store those marks.",
    hints: [
      "Why can't you simply zero a row the moment you find a zero?", "Record which rows and columns must be cleared, then clear them in a second pass. Where could those records live?", "Use the first row and first column of the matrix as the marker arrays. What extra state do you need for the first row and column themselves?", "Remember with two booleans whether row 0 / column 0 had a zero originally; mark, apply the marks to the inner cells, then clear row 0 / column 0 if flagged.",
    ],
    optimalMd: "Scan row 0 and column 0 and remember with two booleans whether they contain a zero. For the inner cells, whenever a[r][c] == 0 set a[r][0] and a[0][c] to 0 as markers. Then zero every inner cell whose row marker or column marker is 0. Finally clear row 0 and column 0 if their flags are set. This uses O(1) extra space.",
    code: [
      cpp(`
void setZeroes(vector<vector<int>>& a) {
    int m = a.size(), n = a[0].size();
    bool firstRow = false, firstCol = false;
    for (int c = 0; c < n; ++c) if (a[0][c] == 0) firstRow = true;
    for (int r = 0; r < m; ++r) if (a[r][0] == 0) firstCol = true;
    for (int r = 1; r < m; ++r)                             // use row 0 and column 0 as the marker arrays
        for (int c = 1; c < n; ++c)
            if (a[r][c] == 0) { a[r][0] = 0; a[0][c] = 0; }
    for (int r = 1; r < m; ++r)
        for (int c = 1; c < n; ++c)
            if (a[r][0] == 0 || a[0][c] == 0) a[r][c] = 0;
    if (firstRow) for (int c = 0; c < n; ++c) a[0][c] = 0;
    if (firstCol) for (int r = 0; r < m; ++r) a[r][0] = 0;
}`, 'C++'),
      java(`
public void setZeroes(int[][] a) {
    int m = a.length, n = a[0].length;
    boolean firstRow = false, firstCol = false;
    for (int c = 0; c < n; c++) if (a[0][c] == 0) firstRow = true;
    for (int r = 0; r < m; r++) if (a[r][0] == 0) firstCol = true;
    for (int r = 1; r < m; r++)                         // use row 0 and column 0 as the marker arrays
        for (int c = 1; c < n; c++)
            if (a[r][c] == 0) { a[r][0] = 0; a[0][c] = 0; }
    for (int r = 1; r < m; r++)
        for (int c = 1; c < n; c++)
            if (a[r][0] == 0 || a[0][c] == 0) a[r][c] = 0;
    if (firstRow) for (int c = 0; c < n; c++) a[0][c] = 0;
    if (firstCol) for (int r = 0; r < m; r++) a[r][0] = 0;
}`, 'Java'),
    ],
    finalComplexity: "O(m·n) time, O(1) extra space.",
    testCases: [
      { input: "[[1,1,1],[1,0,1],[1,1,1]]", expected: "[[1,0,1],[0,0,0],[1,0,1]]", why: "Single zero in the middle" },
      { input: "[[0,1,2,0],[3,4,5,2],[1,3,1,5]]", expected: "[[0,0,0,0],[0,4,5,0],[0,3,1,0]]", why: "Zeros in the first row" },
      { input: "[[1,0]]", expected: "[[0,0]]", why: "Single row" },
    ],
    takeawaysMd: "Use the data structure itself as scratch space: reserve the first row and column for markers, and keep separate flags for them.",
  },

  "minimum-window-substring": {
    understandMd: "Given strings s and t, find the shortest substring of s that contains every character of t (with multiplicity). Return an empty string if none exists.",
    ioConstraintsMd: "Input: strings of length up to 10⁵ of letters. Output: the window itself; if several of the same minimum length exist, the problem guarantees a unique answer.",
    edgeCases: ["t longer than s", "t has repeated characters, so counts matter", "The whole string is the answer", "No valid window"],
    bruteForceMd: "Check every substring of s for containing t using a character count comparison.",
    bruteComplexity: "O(n² · |t|) time or worse.",
    bottleneckMd: "Substring checks repeat work. A window that is valid stays valid when you extend it to the right, so a sliding window can find the minimum by expanding and shrinking.",
    hints: [
      "If a window already contains all of t, what happens when you extend it? And when you shrink it from the left?", "Maintain counts of the characters still needed, and a counter of how many required characters are missing.", "Expand right until nothing is missing; then shrink from the left as long as the window stays valid, recording the best.", "need[ch]-- on entering; if it was positive, missing--. On leaving: need[ch]++; if it becomes positive, missing++.",
    ],
    optimalMd: "Count the characters of t in need[]. Move the right end across s: decrement need for the new character and, if it was still needed (count was positive), decrease missing. While missing == 0 the window is valid: record it if it is the shortest so far, then drop the left character (increment its count; if the count turns positive the window loses a required character, so missing++) and advance left. Each index enters and leaves at most once, so the scan is linear.",
    code: [
      cpp(`
string minWindow(string s, string t) {
    vector<int> need(128, 0);
    for (char ch : t) ++need[(int)ch];
    int missing = t.size(), best = INT_MAX, start = 0, left = 0;
    for (int right = 0; right < (int)s.size(); ++right) {
        if (need[(int)s[right]]-- > 0) --missing;           // a negative count means surplus characters
        while (missing == 0) {                              // window is valid: try to shrink it
            if (right - left + 1 < best) { best = right - left + 1; start = left; }
            if (++need[(int)s[left++]] > 0) ++missing;
        }
    }
    return best == INT_MAX ? "" : s.substr(start, best);
}`, 'C++'),
      java(`
public String minWindow(String s, String t) {
    int[] need = new int[128];
    for (char ch : t.toCharArray()) need[ch]++;
    int missing = t.length(), best = Integer.MAX_VALUE, start = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        if (need[s.charAt(right)]-- > 0) missing--;     // a negative count means surplus characters
        while (missing == 0) {                          // window is valid: try to shrink it
            if (right - left + 1 < best) { best = right - left + 1; start = left; }
            if (++need[s.charAt(left++)] > 0) missing++;
        }
    }
    return best == Integer.MAX_VALUE ? "" : s.substring(start, start + best);
}`, 'Java'),
    ],
    finalComplexity: "O(|s| + |t|) time, O(1) space for a fixed alphabet.",
    testCases: [
      { input: "s = \"ADOBECODEBANC\", t = \"ABC\"", expected: "\"BANC\"", why: "Classic" },
      { input: "s = \"a\", t = \"a\"", expected: "\"a\"", why: "Exact match" },
      { input: "s = \"a\", t = \"aa\"", expected: "\"\"", why: "Not enough characters" },
      { input: "s = \"aa\", t = \"aa\"", expected: "\"aa\"", why: "Counts matter" },
    ],
    takeawaysMd: "For \"smallest window satisfying a count condition\", use a variable window with a \"missing\" counter so the validity check is O(1).",
  },

  "word-search": {
    understandMd: "Given a grid of letters and a word, decide whether the word can be traced through horizontally or vertically adjacent cells without using the same cell twice.",
    ioConstraintsMd: "Input: board up to 6 × 6, word up to 15 letters. Output: true or false.",
    edgeCases: ["Word longer than the number of cells", "Same letter repeated (must not reuse the cell)", "Word of length 1", "Several starting cells but only one works"],
    bruteForceMd: "Try every starting cell and every possible path of the word's length with a depth-first search (this is already the backtracking solution; the cost is exponential in the worst case).",
    bruteComplexity: "O(m·n·4^L) time in the worst case, O(L) recursion depth.",
    bottleneckMd: "Revisiting a cell on the same path is forbidden, so you need a \"used\" marker that is undone on backtracking; reusing a global visited set without undoing it wrongly blocks other paths.",
    hints: [
      "What are the choices at each step of tracing the word, and when can you stop early?", "Run DFS from every cell, matching one character per step. When a character does not match, return immediately (prune).", "Mark the current cell as used while exploring its neighbours, then restore it before returning.", "search(r, c, k): if k == len(word) return true; check bounds and board[r][c] == word[k]; mark; try 4 directions; unmark.",
    ],
    optimalMd: "Loop over all cells as a starting point and call a recursive DFS that matches word[k] at (r, c). If k reaches the word length we found it. Out-of-bounds cells and cells with a different letter fail at once. Temporarily overwrite the cell with a sentinel while exploring the four neighbours so it cannot be reused, and restore the letter on the way back. Overwriting the board avoids a separate visited matrix.",
    code: [
      cpp(`
bool search(vector<vector<char>>& b, const string& w, int k, int r, int c) {
    if (k == (int)w.size()) return true;
    if (r < 0 || c < 0 || r >= (int)b.size() || c >= (int)b[0].size() || b[r][c] != w[k]) return false;
    char saved = b[r][c];
    b[r][c] = '#';                                          // mark the cell as used on this path
    bool found = search(b, w, k + 1, r + 1, c) || search(b, w, k + 1, r - 1, c)
              || search(b, w, k + 1, r, c + 1) || search(b, w, k + 1, r, c - 1);
    b[r][c] = saved;                                        // backtrack
    return found;
}
bool exist(vector<vector<char>>& board, string word) {
    for (int r = 0; r < (int)board.size(); ++r)
        for (int c = 0; c < (int)board[0].size(); ++c)
            if (search(board, word, 0, r, c)) return true;
    return false;
}`, 'C++'),
      java(`
public boolean exist(char[][] board, String word) {
    for (int r = 0; r < board.length; r++)
        for (int c = 0; c < board[0].length; c++)
            if (search(board, word, 0, r, c)) return true;
    return false;
}
private boolean search(char[][] b, String w, int k, int r, int c) {
    if (k == w.length()) return true;
    if (r < 0 || c < 0 || r >= b.length || c >= b[0].length || b[r][c] != w.charAt(k)) return false;
    char saved = b[r][c];
    b[r][c] = '#';                                      // mark the cell as used on this path
    boolean found = search(b, w, k + 1, r + 1, c) || search(b, w, k + 1, r - 1, c)
                 || search(b, w, k + 1, r, c + 1) || search(b, w, k + 1, r, c - 1);
    b[r][c] = saved;                                    // backtrack
    return found;
}`, 'Java'),
    ],
    finalComplexity: "O(m·n·3^L) typical (each step has at most 3 new directions), O(L) space.",
    testCases: [
      { input: "ABCE / SFCS / ADEE, \"ABCCED\"", expected: "true", why: "Path that turns" },
      { input: "same board, \"SEE\"", expected: "true", why: "Path along the right side" },
      { input: "same board, \"ABCB\"", expected: "false", why: "Would need to reuse the B" },
    ],
    takeawaysMd: "Grid backtracking: mark on the way in, unmark on the way out, and prune the moment a character mismatches.",
  },

  "decode-ways": {
    understandMd: "A string of digits encodes a message where \"1\" maps to A, \"2\" to B, …, \"26\" to Z. Count the number of ways the digit string can be decoded back into letters.",
    ioConstraintsMd: "Input: digit string of length up to 100 (may contain zeros). Output: number of decodings (fits in 32 bits).",
    edgeCases: ["Leading zero (\"06\") gives 0", "\"10\" and \"20\" can only be read as one letter", "\"27\" cannot be split as one two-digit code", "A zero that follows something other than 1 or 2 makes the string undecodable"],
    bruteForceMd: "Recursively try to decode one digit and, when valid, two digits, counting complete decodings.",
    bruteComplexity: "O(2ⁿ) time.",
    bottleneckMd: "The recursion decodes the same suffix again and again: ways(i) only depends on the next two positions, so it is a Fibonacci-like recurrence in disguise.",
    hints: [
      "What are the two possible last steps when decoding a prefix?", "Let ways(i) be the number of decodings of s[i:]. When is a single digit valid, and when is a pair valid?", "ways(i) = (s[i] != \"0\" ? ways(i+1) : 0) + (s[i..i+1] in 10..26 ? ways(i+2) : 0), with ways(n) = 1.", "Only the last two values are needed, so scan from the right with two variables.",
    ],
    optimalMd: "Define ways(i) for the suffix starting at i, with ways(n) = 1. A leading \"0\" has no decoding. Otherwise a single digit contributes ways(i+1), and if s[i..i+1] is between 10 and 26 the pair contributes ways(i+2). Because only two previous values are needed, iterate from the end keeping them in two variables.",
    code: [
      cpp(`
int numDecodings(string s) {
    int n = s.size();
    int next = 1, nextNext = 0;                             // ways(i + 1) and ways(i + 2); ways(n) = 1
    for (int i = n - 1; i >= 0; --i) {
        int cur = 0;
        if (s[i] != '0') {
            cur = next;                                     // decode one digit
            if (i + 1 < n && (s[i] == '1' || (s[i] == '2' && s[i + 1] <= '6')))
                cur += nextNext;                            // or decode two digits (10 to 26)
        }
        nextNext = next;
        next = cur;
    }
    return next;
}`, 'C++'),
      java(`
public int numDecodings(String s) {
    int n = s.length();
    int next = 1, nextNext = 0;                         // ways(i + 1) and ways(i + 2); ways(n) = 1
    for (int i = n - 1; i >= 0; i--) {
        int cur = 0;
        if (s.charAt(i) != '0') {
            cur = next;                                 // decode one digit
            if (i + 1 < n && (s.charAt(i) == '1' || (s.charAt(i) == '2' && s.charAt(i + 1) <= '6')))
                cur += nextNext;                        // or decode two digits (10 to 26)
        }
        nextNext = next;
        next = cur;
    }
    return next;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "\"12\"", expected: "2", why: "\"AB\" or \"L\"" },
      { input: "\"226\"", expected: "3", why: "\"BZ\", \"VF\", \"BBF\"" },
      { input: "\"06\"", expected: "0", why: "Leading zero" },
      { input: "\"10\"", expected: "1", why: "Only \"J\"" },
      { input: "\"2101\"", expected: "1", why: "Zero handled twice" },
    ],
    takeawaysMd: "Counting-decodings DP is a two-step recurrence guarded by validity checks; handle zero and the 10..26 range explicitly.",
  },

  "same-tree": {
    understandMd: "Decide whether two binary trees are identical: same shape and the same value at every position.",
    ioConstraintsMd: "Input: the roots of two trees (each up to 100 nodes, possibly empty). Output: true or false.",
    edgeCases: ["Both trees empty", "One empty and one not", "Same values but different shapes", "Same shape but one differing value deep inside"],
    bruteForceMd: "Serialise both trees (for example preorder with null markers) and compare the two strings.",
    bruteComplexity: "O(n) time and O(n) space for the strings.",
    bottleneckMd: "Serialising works, but you build two full strings just to compare them. A simultaneous traversal can stop at the first difference and needs only stack space.",
    hints: [
      "Two trees are equal exactly when their roots match and their subtrees match. Does that sound recursive?", "What should you return when both nodes are null? When only one is?", "Compare the two current nodes, then recurse on the left pair and the right pair.", "if both null: true; if one null or values differ: false; return same(p.left, q.left) and same(p.right, q.right).",
    ],
    optimalMd: "Walk both trees in lock step. Two null nodes are equal; a null against a non-null node, or two nodes with different values, are not. Otherwise the trees are equal only if both pairs of children are equal. The recursion stops at the first mismatch.",
    code: [
      cpp(`
bool isSameTree(TreeNode* p, TreeNode* q) {
    if (!p && !q) return true;                              // both empty: equal
    if (!p || !q || p->val != q->val) return false;
    return isSameTree(p->left, q->left) && isSameTree(p->right, q->right);
}`, 'C++'),
      java(`
public boolean isSameTree(TreeNode p, TreeNode q) {
    if (p == null && q == null) return true;            // both empty: equal
    if (p == null || q == null || p.val != q.val) return false;
    return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}`, 'Java'),
    ],
    finalComplexity: "O(n) time (n = smaller tree size), O(h) space for the recursion.",
    testCases: [
      { input: "[1,2,3] vs [1,2,3]", expected: "true", why: "Identical" },
      { input: "[1,2] vs [1,null,2]", expected: "false", why: "Same values, different shape" },
      { input: "[1,2,1] vs [1,1,2]", expected: "false", why: "Same shape, values swapped" },
      { input: "[] vs []", expected: "true", why: "Both empty" },
    ],
    takeawaysMd: "Parallel recursion over two structures: define the base cases for (null, null) and (null, non-null) first, then recurse on both children.",
  },

  "construct-binary-tree-from-preorder-and-inorder-traversal": {
    understandMd: "You are given the preorder and inorder traversals of a binary tree with distinct values. Rebuild the tree and return its root.",
    ioConstraintsMd: "Input: two arrays of the same length (up to 3,000), all values unique. Output: the reconstructed tree.",
    edgeCases: ["Single node", "Tree that is a straight line to the left or to the right", "Negative values", "Empty subtrees on one side only"],
    bruteForceMd: "For each root, search the inorder array linearly to find where the left subtree ends, slicing arrays at every level.",
    bruteComplexity: "O(n²) time and extra O(n²) memory when slicing.",
    bottleneckMd: "Two costs hide here: the linear search for the root in the inorder array, and the copying of array slices. A hash map from value to inorder index and index ranges instead of slices remove both.",
    hints: [
      "In preorder, what is always the first value of any subtree? What does inorder tell you about that value?", "The root splits the inorder range into a left part and a right part. How many nodes are in each?", "Consume preorder values from left to right: build the left subtree before the right one, because preorder visits left first.", "Precompute value → inorder index. build(lo, hi): root = pre[next++]; mid = index[root]; left = build(lo, mid−1); right = build(mid+1, hi).",
    ],
    optimalMd: "Store each value's inorder position in a hash map. Keep a global pointer into the preorder array. A recursive function builds the subtree for an inorder range [lo, hi]: if the range is empty return null, take the next preorder value as the root, find its inorder index, then build the left range and then the right range (the order matters because preorder lists the left subtree first).",
    code: [
      cpp(`
TreeNode* build(vector<int>& pre, int& preIdx, unordered_map<int, int>& inPos, int lo, int hi) {   // subtree with inorder range [lo, hi]
    if (lo > hi) return nullptr;
    TreeNode* root = new TreeNode(pre[preIdx++]);           // the next preorder value is this subtree's root
    int mid = inPos[root->val];
    root->left = build(pre, preIdx, inPos, lo, mid - 1);    // left subtree first (preorder order)
    root->right = build(pre, preIdx, inPos, mid + 1, hi);
    return root;
}
TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
    unordered_map<int, int> inPos;                          // value -> index in inorder
    for (int i = 0; i < (int)inorder.size(); ++i) inPos[inorder[i]] = i;
    int preIdx = 0;
    return build(preorder, preIdx, inPos, 0, (int)inorder.size() - 1);
}`, 'C++'),
      java(`
private int preIdx;
private Map<Integer, Integer> inPos;
public TreeNode buildTree(int[] preorder, int[] inorder) {
    preIdx = 0;
    inPos = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) inPos.put(inorder[i], i);   // value -> index in inorder
    return build(preorder, 0, inorder.length - 1);
}
private TreeNode build(int[] pre, int lo, int hi) {     // builds the subtree whose inorder range is [lo, hi]
    if (lo > hi) return null;
    TreeNode root = new TreeNode(pre[preIdx++]);        // the next preorder value is this subtree's root
    int mid = inPos.get(root.val);
    root.left = build(pre, lo, mid - 1);                // left subtree first (preorder order)
    root.right = build(pre, mid + 1, hi);
    return root;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "pre [3,9,20,15,7], in [9,3,15,20,7]", expected: "[3,9,20,null,null,15,7]", why: "Classic" },
      { input: "pre [-1], in [-1]", expected: "[-1]", why: "Single node" },
      { input: "pre [1,2,3], in [3,2,1]", expected: "[1,2,null,3]", why: "Left-leaning chain" },
      { input: "pre [1,2,3], in [1,2,3]", expected: "[1,null,2,null,3]", why: "Right-leaning chain" },
    ],
    takeawaysMd: "Traversal reconstruction: the first preorder value is the root, inorder splits the sides, and a value→index map avoids searching.",
  },

  "binary-tree-maximum-path-sum": {
    understandMd: "Find the maximum sum over all paths in a binary tree, where a path is any chain of connected nodes (it may start and end anywhere and does not need to pass through the root).",
    ioConstraintsMd: "Input: tree with 1 to 30,000 nodes, values between −1,000 and 1,000. Output: the maximum path sum (a single node is a valid path, so the answer can be negative).",
    edgeCases: ["All values negative: the answer is the largest single node", "A path that bends at a node and uses both children", "A path that skips the root entirely", "Single node"],
    bruteForceMd: "For every node as the top of the path, compute the best downward path in each child with a separate traversal and combine them.",
    bruteComplexity: "O(n²) time in the worst case.",
    bottleneckMd: "Recomputing the best downward path for the same node over and over is the waste. A post-order traversal can compute it once per node and use it both for the node's own best bend and for its parent.",
    hints: [
      "A path has a highest node where it \"bends\". What two quantities do you need at that node?", "For each child, you want the best path that starts at the child and goes downwards. Negative contributions should be dropped. Why?", "Return to the parent the best path that goes down one side only (parent can extend only one branch); update the global answer with node + left + right.", "gain(node) = node.val + max(0, gain(left), gain(right)); answer = max over nodes of node.val + max(0, gain(left)) + max(0, gain(right)).",
    ],
    optimalMd: "Use post-order recursion. gain(node) returns the best sum of a path that starts at node and descends into at most one child. For each node compute left = max(0, gain(left child)) and right = max(0, gain(right child)); the best path that bends at this node has sum node + left + right, so update a global maximum with it. Return node + max(left, right) to the parent. Clamping with 0 means a harmful branch is simply not used.",
    code: [
      cpp(`
int gain(TreeNode* node, int& best) {                       // best path that starts at node and goes down
    if (!node) return 0;
    int left = max(0, gain(node->left, best)), right = max(0, gain(node->right, best));   // drop negative branches
    best = max(best, node->val + left + right);             // a path that bends at this node
    return node->val + max(left, right);                    // a parent can extend only one side
}
int maxPathSum(TreeNode* root) {
    int best = INT_MIN;
    gain(root, best);
    return best;
}`, 'C++'),
      java(`
private int best;
public int maxPathSum(TreeNode root) {
    best = Integer.MIN_VALUE;
    gain(root);
    return best;
}
private int gain(TreeNode node) {                       // best path that starts at node and goes down
    if (node == null) return 0;
    int left = Math.max(0, gain(node.left)), right = Math.max(0, gain(node.right));   // drop negative branches
    best = Math.max(best, node.val + left + right);     // a path that bends at this node
    return node.val + Math.max(left, right);            // a parent can extend only one side
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(h) space.",
    testCases: [
      { input: "[1,2,3]", expected: "6", why: "Bend at the root" },
      { input: "[-10,9,20,null,null,15,7]", expected: "42", why: "Path 15 → 20 → 7 skips the root" },
      { input: "[-3]", expected: "-3", why: "Single negative node" },
      { input: "[2,-1]", expected: "2", why: "Dropping a negative child" },
    ],
    takeawaysMd: "For \"best path through any node\" problems, return one-sided gain to the parent and update the global answer with the two-sided value at each node.",
  },

  "longest-consecutive-sequence": {
    understandMd: "Given an unsorted array of integers, find the length of the longest run of consecutive values (for example 1, 2, 3, 4), regardless of their order in the array.",
    ioConstraintsMd: "Input: up to 10⁵ integers, possibly duplicated and negative. Required: O(n) time. Output: the length.",
    edgeCases: ["Empty array", "Duplicates", "Negative numbers and zero", "Several separate runs"],
    bruteForceMd: "Sort the array and scan for the longest run, skipping duplicates.",
    bruteComplexity: "O(n log n) time.",
    bottleneckMd: "Sorting orders everything, but you only need to know, for a number x, whether x + 1 exists. A hash set answers that in O(1), if you avoid counting the same run from every element.",
    hints: [
      "What fast data structure answers \"does the value v exist?\"", "A run has a unique smallest element. How can you recognise that x starts a run?", "Only start counting from numbers whose predecessor x − 1 is missing; then walk x + 1, x + 2, … while present.", "for x in set: if x − 1 not in set: len = 1; while x + len in set: len++; best = max(best, len)",
    ],
    optimalMd: "Put every number into a hash set. For each x that has no predecessor (x − 1 is absent) it is the start of a run, so count upwards while x + 1, x + 2, … are present. Elements that are not run starts are skipped, so every element is visited a constant number of times overall and the algorithm is O(n).",
    code: [
      cpp(`
int longestConsecutive(vector<int>& nums) {
    unordered_set<int> set(nums.begin(), nums.end());
    int best = 0;
    for (int x : set) {
        if (set.count(x - 1)) continue;                     // x is not the start of a run
        int len = 1;
        while (set.count(x + len)) ++len;
        best = max(best, len);
    }
    return best;
}`, 'C++'),
      java(`
public int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int x : nums) set.add(x);
    int best = 0;
    for (int x : set) {
        if (set.contains(x - 1)) continue;              // x is not the start of a run
        int len = 1;
        while (set.contains(x + len)) len++;
        best = Math.max(best, len);
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "[100,4,200,1,3,2]", expected: "4", why: "Run 1,2,3,4" },
      { input: "[0,3,7,2,5,8,4,6,0,1]", expected: "9", why: "Duplicates, run 0 to 8" },
      { input: "[]", expected: "0", why: "Empty input" },
      { input: "[1,2,0,1]", expected: "3", why: "Duplicate and a run out of order" },
    ],
    takeawaysMd: "To turn a sort-based idea into O(n), use a hash set and count only from elements that start a run.",
  },

  "clone-graph": {
    understandMd: "Given a reference to a node of a connected undirected graph, return a deep copy of the whole graph: new node objects with the same values and the same neighbour structure.",
    ioConstraintsMd: "Input: a node (or null) of a graph with up to 100 nodes whose values are 1..n; each node has a list of neighbours. Output: the corresponding node in the cloned graph.",
    edgeCases: ["Null input", "Single node with no neighbours", "Cycles (a node reachable through several paths)", "A self-referencing structure like two nodes linked to each other"],
    bruteForceMd: "Copy a node and recursively copy each neighbour without remembering what was already copied. (This loops forever on cycles.)",
    bruteComplexity: "Does not terminate on graphs with cycles.",
    bottleneckMd: "The graph can contain cycles and shared neighbours. You need a lookup from original node to its clone, which serves both as the visited set and as the way to wire edges to existing clones.",
    hints: [
      "If you copy a node twice you break the structure. How can you remember what you have already cloned?", "Keep a map from original node to clone. Create the clone when you first discover a node.", "Traverse with BFS or DFS; for each neighbour, create its clone if missing and add the neighbour's clone to the current clone's neighbour list.", "copy[node] = new Node(node.val); queue.add(node); while queue: cur = pop; for nb in cur.neighbors: if nb not in copy: create + enqueue; copy[cur].neighbors.add(copy[nb])",
    ],
    optimalMd: "Use a hash map from original node to clone. Start by cloning the entry node and pushing it onto a queue. Pop a node, and for every neighbour create the clone if it does not exist yet (and enqueue the neighbour), then append the neighbour's clone to the current node's clone. The map doubles as the visited set, so cycles are handled and every node and edge is processed once.",
    code: [
      cpp(`
struct Node {                                               // provided by LeetCode
    int val;
    vector<Node*> neighbors;
    Node(int v = 0) : val(v) {}
};
Node* cloneGraph(Node* node) {
    if (!node) return nullptr;
    unordered_map<Node*, Node*> copy;                       // original -> clone
    copy[node] = new Node(node->val);
    queue<Node*> q;
    q.push(node);
    while (!q.empty()) {
        Node* cur = q.front(); q.pop();
        for (Node* nb : cur->neighbors) {
            if (!copy.count(nb)) { copy[nb] = new Node(nb->val); q.push(nb); }
            copy[cur]->neighbors.push_back(copy[nb]);
        }
    }
    return copy[node];
}`, 'C++'),
      java(`
class Node {                                     // provided by LeetCode
    public int val;
    public List<Node> neighbors = new ArrayList<>();
    Node(int v) { val = v; }
}
public Node cloneGraph(Node node) {
    if (node == null) return null;
    Map<Node, Node> copy = new HashMap<>();             // original -> clone
    copy.put(node, new Node(node.val));
    Deque<Node> queue = new ArrayDeque<>();
    queue.add(node);
    while (!queue.isEmpty()) {
        Node cur = queue.poll();
        for (Node nb : cur.neighbors) {
            if (!copy.containsKey(nb)) { copy.put(nb, new Node(nb.val)); queue.add(nb); }
            copy.get(cur).neighbors.add(copy.get(nb));
        }
    }
    return copy.get(node);
}`, 'Java'),
    ],
    finalComplexity: "O(V + E) time, O(V) space.",
    testCases: [
      { input: "adjacency [[2,4],[1,3],[2,4],[1,3]]", expected: "same structure, all nodes new", why: "Cycle of four nodes" },
      { input: "null", expected: "null", why: "Empty graph" },
      { input: "single node 1 with no neighbours", expected: "a new node 1", why: "Isolated node" },
    ],
    takeawaysMd: "Deep copy of a graph or a structure with shared references: map original → copy, and create copies on discovery.",
  },

  "word-break": {
    understandMd: "Given a string and a dictionary of words, decide whether the string can be split into a sequence of dictionary words (words may be reused).",
    ioConstraintsMd: "Input: string up to 300 characters, dictionary up to 1,000 words of length up to 20. Output: true or false.",
    edgeCases: ["Dictionary words that are prefixes of each other", "The string cannot be completed even though the prefix can", "Whole string is one dictionary word", "Reuse of the same word several times"],
    bruteForceMd: "Backtrack: try every dictionary word as a prefix and recurse on the rest.",
    bruteComplexity: "Exponential in the worst case (for example \"aaaa…ab\" with dictionary {\"a\", \"aa\", …}).",
    bottleneckMd: "The recursion solves the same suffix over and over. Whether a given prefix length can be segmented is a yes/no fact worth storing once.",
    hints: [
      "For a prefix of length i to be breakable, what must be true about some shorter prefix and the remaining piece?", "Let dp[i] mean \"the first i characters can be segmented\". What is dp[0]?", "dp[i] is true if some j < i has dp[j] true and s[j..i) is a word.", "Limit j to the last maxWordLength positions: each check is a hash lookup of a short substring.",
    ],
    optimalMd: "dp[i] says whether the first i characters can be segmented, with dp[0] = true for the empty prefix. For each i look back at positions j (only as far as the longest dictionary word); if dp[j] is true and the substring s[j..i) is in the dictionary, set dp[i] to true. The answer is dp[n]. Putting the words in a hash set makes each membership test O(L).",
    code: [
      cpp(`
bool wordBreak(string s, vector<string>& wordDict) {
    unordered_set<string> words(wordDict.begin(), wordDict.end());
    int maxLen = 0;
    for (auto& w : wordDict) maxLen = max(maxLen, (int)w.size());
    int n = s.size();
    vector<bool> dp(n + 1, false);                          // dp[i]: the first i characters can be segmented
    dp[0] = true;
    for (int i = 1; i <= n; ++i)
        for (int j = max(0, i - maxLen); j < i && !dp[i]; ++j)
            if (dp[j] && words.count(s.substr(j, i - j))) dp[i] = true;
    return dp[n];
}`, 'C++'),
      java(`
public boolean wordBreak(String s, List<String> wordDict) {
    Set<String> words = new HashSet<>(wordDict);
    int maxLen = 0;
    for (String w : wordDict) maxLen = Math.max(maxLen, w.length());
    boolean[] dp = new boolean[s.length() + 1];         // dp[i]: the first i characters can be segmented
    dp[0] = true;
    for (int i = 1; i <= s.length(); i++)
        for (int j = Math.max(0, i - maxLen); j < i && !dp[i]; j++)
            if (dp[j] && words.contains(s.substring(j, i))) dp[i] = true;
    return dp[s.length()];
}`, 'Java'),
    ],
    finalComplexity: "O(n · L²) time with L the maximum word length (substring creation included), O(n + dictionary) space.",
    testCases: [
      { input: "\"leetcode\", [\"leet\",\"code\"]", expected: "true", why: "Two words" },
      { input: "\"applepenapple\", [\"apple\",\"pen\"]", expected: "true", why: "Word reused" },
      { input: "\"catsandog\", [\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]", expected: "false", why: "Almost works but \"og\" is left" },
      { input: "\"aaaaaaa\", [\"aaaa\",\"aaa\"]", expected: "true", why: "Needs 4 + 3" },
    ],
    takeawaysMd: "\"Can this prefix be formed?\" is a boolean DP over prefix length; bound the look-back by the longest word.",
  },

  "reorder-list": {
    understandMd: "Reorder a singly linked list L0 → L1 → … → Ln−1 → Ln into L0 → Ln → L1 → Ln−1 → L2 → Ln−2 → … in place, without changing node values.",
    ioConstraintsMd: "Input: head of a list with 1 to 50,000 nodes. Output: nothing (the list is modified in place); O(1) extra space is the usual goal.",
    edgeCases: ["One or two nodes (nothing to do)", "Odd versus even length", "Three nodes", "Long list (recursion depth would overflow)"],
    bruteForceMd: "Copy the nodes into an array and rewire them using two indices from both ends.",
    bruteComplexity: "O(n) time, O(n) space.",
    bottleneckMd: "The array is only used to reach the nodes from the end. You can get \"the list from the end\" by reversing the second half in place, which needs O(1) extra space.",
    hints: [
      "The result alternates between the front of the list and the back of the list. How can you walk the list backwards without extra memory?", "Split the list in the middle with slow and fast pointers, and reverse the second half.", "Now interleave the first half with the reversed second half one node at a time.", "slow/fast to find the middle; cut it; reverse the tail; while second: a.next = second; second.next = nextA; advance both.",
    ],
    optimalMd: "Three steps. (1) Find the middle with slow and fast pointers (stop fast when fast.next.next is null so that the first half is the longer one). (2) Cut the list after the middle and reverse the second half in place. (3) Merge by alternately taking a node from the first half and one from the reversed second half. All steps are linear and use constant extra memory.",
    code: [
      cpp(`
void reorderList(ListNode* head) {
    if (!head || !head->next) return;
    ListNode *slow = head, *fast = head;
    while (fast->next && fast->next->next) { slow = slow->next; fast = fast->next->next; }
    ListNode* second = slow->next;                          // second half starts after the middle
    slow->next = nullptr;
    ListNode* prev = nullptr;
    while (second) { ListNode* nx = second->next; second->next = prev; prev = second; second = nx; }   // reverse it
    ListNode *a = head, *b = prev;
    while (b) {                                             // interleave: first, last, second, second-last, ...
        ListNode *an = a->next, *bn = b->next;
        a->next = b; b->next = an;
        a = an; b = bn;
    }
}`, 'C++'),
      java(`
public void reorderList(ListNode head) {
    if (head == null || head.next == null) return;
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) { slow = slow.next; fast = fast.next.next; }
    ListNode second = slow.next;                        // second half starts after the middle
    slow.next = null;
    ListNode prev = null;
    while (second != null) { ListNode nx = second.next; second.next = prev; prev = second; second = nx; }   // reverse it
    ListNode a = head, b = prev;
    while (b != null) {                                 // interleave: first, last, second, second-last, ...
        ListNode an = a.next, bn = b.next;
        a.next = b; b.next = an;
        a = an; b = bn;
    }
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,2,3,4]", expected: "[1,4,2,3]", why: "Even length" },
      { input: "[1,2,3,4,5]", expected: "[1,5,2,4,3]", why: "Odd length" },
      { input: "[1,2,3]", expected: "[1,3,2]", why: "Three nodes" },
      { input: "[1]", expected: "[1]", why: "Single node" },
    ],
    takeawaysMd: "A list problem that needs \"from the end\" access is often \"find the middle, reverse the second half, merge\".",
  },

  "reverse-bits": {
    understandMd: "Reverse the order of the 32 bits of an unsigned 32-bit integer and return the result as an unsigned integer.",
    ioConstraintsMd: "Input: a 32-bit value (treated as unsigned). Output: the value with bit i moved to bit 31 − i.",
    edgeCases: ["All zeros", "Only the lowest bit set (becomes the highest)", "Highest bit set (negative in a signed type)", "Languages with signed ints need unsigned shifts or masks"],
    bruteForceMd: "Convert to a binary string, reverse it, and convert back.",
    bruteComplexity: "O(32) time with string allocation.",
    bottleneckMd: "String conversion is clumsy. A fixed 32-step loop that moves one bit at a time is simple, branch-free and O(1) space.",
    hints: [
      "What should happen to the lowest bit of the input in the result?", "Build the answer by shifting it left and appending the input's lowest bit, then shift the input right.", "Repeat exactly 32 times, even when the input becomes 0 early (the answer still needs its leading zeros shifted).", "for i in 0..31: result = (result << 1) | (n & 1); n >>= 1  (use an unsigned or logical shift)",
    ],
    optimalMd: "Loop 32 times. Each iteration shifts the result one place to the left, ORs in the lowest bit of n, and shifts n one place to the right (an unsigned shift so the sign bit is not propagated). After 32 rounds the bits appear in reverse order.",
    code: [
      cpp(`
uint32_t reverseBits(uint32_t n) {
    uint32_t result = 0;
    for (int i = 0; i < 32; ++i) {
        result = (result << 1) | (n & 1);                   // append the lowest bit of n
        n >>= 1;
    }
    return result;
}`, 'C++'),
      java(`
public int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1);               // append the lowest bit of n
        n >>>= 1;                                       // unsigned shift so the sign bit is not copied
    }
    return result;
}`, 'Java'),
    ],
    finalComplexity: "O(1) time (32 iterations), O(1) space.",
    testCases: [
      { input: "43261596 (00000010100101000001111010011100)", expected: "964176192", why: "Typical" },
      { input: "4294967293 (…11111101)", expected: "3221225471", why: "High bits set" },
      { input: "0", expected: "0", why: "Zero" },
      { input: "1", expected: "2147483648", why: "Lowest bit moves to the top" },
    ],
    takeawaysMd: "Bit reversal is a fixed-length shift loop; mind unsigned shifts in languages whose int type is signed.",
  },

  "number-of-1-bits": {
    understandMd: "Count the number of set bits (1s) in the binary representation of an unsigned 32-bit integer (its Hamming weight).",
    ioConstraintsMd: "Input: a 32-bit integer treated as unsigned. Output: a count from 0 to 32.",
    edgeCases: ["Zero", "All 32 bits set", "Only the sign bit set (negative in signed languages)", "Powers of two have exactly one set bit"],
    bruteForceMd: "Test each of the 32 bits with a shift and mask and count.",
    bruteComplexity: "O(32) = O(1) time.",
    bottleneckMd: "The loop always runs 32 times even when few bits are set. Brian Kernighan's trick jumps from one set bit to the next.",
    hints: [
      "What does n & (n − 1) do to the binary representation of n?", "It clears the lowest set bit. How many times can you do that before n becomes 0?", "Loop while n != 0, counting each clear; the number of iterations equals the number of set bits.", "while n: n &= n − 1; count++",
    ],
    optimalMd: "Repeatedly apply n &= n − 1, which removes the lowest set bit, and count how many times it takes to reach zero. The loop runs once per set bit instead of once per bit position, and it works with signed types too because it terminates when the value is zero.",
    code: [
      cpp(`
int hammingWeight(uint32_t n) {
    int count = 0;
    while (n) {
        n &= n - 1;                                         // clears the lowest set bit
        ++count;
    }
    return count;
}`, 'C++'),
      java(`
public int hammingWeight(int n) {
    int count = 0;
    while (n != 0) {
        n &= n - 1;                                     // clears the lowest set bit
        count++;
    }
    return count;
}`, 'Java'),
    ],
    finalComplexity: "O(k) time for k set bits (at most 32), O(1) space.",
    testCases: [
      { input: "11 (1011)", expected: "3", why: "Typical" },
      { input: "128", expected: "1", why: "Power of two" },
      { input: "4294967293 (…11111101)", expected: "31", why: "Almost all bits set" },
      { input: "0", expected: "0", why: "No bits" },
    ],
    takeawaysMd: "n & (n − 1) clears the lowest set bit: the key bit trick for counting bits and testing powers of two.",
  },

  "implement-trie-prefix-tree": {
    understandMd: "Implement a trie (prefix tree) that supports inserting a word, checking whether a whole word was inserted, and checking whether any inserted word starts with a given prefix.",
    ioConstraintsMd: "Input: up to 3 × 10⁴ operations on lowercase words up to 2,000 characters. Output: boolean results for search and startsWith.",
    edgeCases: ["search for a prefix that is not a complete word", "Inserting a word that is a prefix of another (and the reverse order)", "Empty prefix", "Repeated inserts of the same word"],
    bruteForceMd: "Store all words in a set; for a prefix query scan every word and test startsWith.",
    bruteComplexity: "insert/search O(L); startsWith O(N · L) over N stored words.",
    bottleneckMd: "A flat set answers whole-word queries but not prefix queries efficiently. Sharing common prefixes in a tree lets every operation cost O(L) in the length of the query only.",
    hints: [
      "What structure lets words that start the same share storage?", "Each node represents a prefix; each edge a character. How do you tell a complete word from a mere prefix?", "Store a boolean \"word ends here\" flag on a node; search requires the flag, startsWith does not.", "insert: walk/create children for each character, set end = true. find(s): walk children; return the final node or null.",
    ],
    optimalMd: "Each node holds up to 26 child pointers and an end-of-word flag. insert walks the word character by character, creating missing children, and marks the last node. search and startsWith share a helper that follows the characters and returns the node reached (or null); search additionally requires the end flag. All three operations take O(L).",
    code: [
      cpp(`
class Trie {
    Trie* next[26] = {};
    bool end = false;
    Trie* find(const string& s) {
        Trie* cur = this;
        for (char ch : s) {
            cur = cur->next[ch - 'a'];
            if (!cur) return nullptr;
        }
        return cur;
    }
public:
    void insert(string word) {
        Trie* cur = this;
        for (char ch : word) {
            if (!cur->next[ch - 'a']) cur->next[ch - 'a'] = new Trie();
            cur = cur->next[ch - 'a'];
        }
        cur->end = true;                                    // a complete word ends here
    }
    bool search(string word) { Trie* t = find(word); return t && t->end; }
    bool startsWith(string prefix) { return find(prefix) != nullptr; }
};`, 'C++'),
      java(`
class Trie {
    private final Trie[] next = new Trie[26];
    private boolean end;

    public Trie() {}
    public void insert(String word) {
        Trie cur = this;
        for (char ch : word.toCharArray()) {
            if (cur.next[ch - 'a'] == null) cur.next[ch - 'a'] = new Trie();
            cur = cur.next[ch - 'a'];
        }
        cur.end = true;                                 // a complete word ends here
    }
    public boolean search(String word) { Trie t = find(word); return t != null && t.end; }
    public boolean startsWith(String prefix) { return find(prefix) != null; }
    private Trie find(String s) {
        Trie cur = this;
        for (char ch : s.toCharArray()) {
            cur = cur.next[ch - 'a'];
            if (cur == null) return null;
        }
        return cur;
    }
}`, 'Java'),
    ],
    finalComplexity: "O(L) time per operation, O(total characters) space.",
    testCases: [
      { input: "insert \"apple\"; search \"apple\"", expected: "true", why: "Exact word" },
      { input: "search \"app\"", expected: "false", why: "Prefix only, not a word" },
      { input: "startsWith \"app\"", expected: "true", why: "Prefix exists" },
      { input: "insert \"app\"; search \"app\"", expected: "true", why: "Flag set after the longer word" },
    ],
    takeawaysMd: "Tries trade memory for O(length) prefix queries; the end-of-word flag separates \"prefix\" from \"word\".",
  },

  "design-add-and-search-words-data-structure": {
    understandMd: "Design a dictionary that supports adding words and searching for a pattern where \".\" matches any single letter.",
    ioConstraintsMd: "Input: up to 10⁴ operations; words of up to 25 lowercase letters; search patterns contain letters and at most 2 dots. Output: boolean for each search.",
    edgeCases: ["Pattern with a dot at the start, middle or end", "Pattern longer or shorter than every stored word", "Only dots", "A prefix of a stored word (must not match)"],
    bruteForceMd: "Store words in a list and test every word against the pattern character by character.",
    bruteComplexity: "O(N · L) per search.",
    bottleneckMd: "Scanning all words ignores shared structure. A trie narrows the candidates by character, and a dot simply means \"try every child at this level\".",
    hints: [
      "Which data structure from the previous problem finds words by prefix?", "A normal letter follows one child. What should a dot do?", "For \".\", recurse into every existing child; return true if any branch matches.", "dfs(node, i): if i == len: return node.end; if pattern[i] == \".\": any(dfs(child, i+1)) else dfs(child[pattern[i]], i+1)",
    ],
    optimalMd: "Store words in a trie. A search is a depth-first recursion over the pattern: at a letter, follow the single matching child (or fail); at a dot, try every non-null child. When the pattern is exhausted the current node must be marked as the end of a word. Because patterns have few dots the branching stays small.",
    code: [
      cpp(`
class WordDictionary {
    WordDictionary* next[26] = {};
    bool end = false;
    bool dfs(const string& w, int i) {
        if (i == (int)w.size()) return end;
        char ch = w[i];
        if (ch != '.') {
            WordDictionary* child = next[ch - 'a'];
            return child && child->dfs(w, i + 1);
        }
        for (WordDictionary* child : next)                  // '.' matches any letter: try every branch
            if (child && child->dfs(w, i + 1)) return true;
        return false;
    }
public:
    void addWord(string word) {
        WordDictionary* cur = this;
        for (char ch : word) {
            if (!cur->next[ch - 'a']) cur->next[ch - 'a'] = new WordDictionary();
            cur = cur->next[ch - 'a'];
        }
        cur->end = true;
    }
    bool search(string word) { return dfs(word, 0); }
};`, 'C++'),
      java(`
class WordDictionary {
    private final WordDictionary[] next = new WordDictionary[26];
    private boolean end;

    public WordDictionary() {}
    public void addWord(String word) {
        WordDictionary cur = this;
        for (char ch : word.toCharArray()) {
            if (cur.next[ch - 'a'] == null) cur.next[ch - 'a'] = new WordDictionary();
            cur = cur.next[ch - 'a'];
        }
        cur.end = true;
    }
    public boolean search(String word) { return dfs(word, 0); }
    private boolean dfs(String w, int i) {
        if (i == w.length()) return end;
        char ch = w.charAt(i);
        if (ch != '.') {
            WordDictionary child = next[ch - 'a'];
            return child != null && child.dfs(w, i + 1);
        }
        for (WordDictionary child : next)               // '.' matches any letter: try every branch
            if (child != null && child.dfs(w, i + 1)) return true;
        return false;
    }
}`, 'Java'),
    ],
    finalComplexity: "O(L) for add; search is O(L) without dots and O(26^d · L) in the worst case with d dots.",
    testCases: [
      { input: "add bad, dad, mad; search \"pad\"", expected: "false", why: "No such word" },
      { input: "search \".ad\"", expected: "true", why: "Dot at the start" },
      { input: "search \"b..\"", expected: "true", why: "Dots at the end" },
      { input: "search \"b.\"", expected: "false", why: "Length mismatch" },
      { input: "search \"...\"", expected: "true", why: "Only dots" },
    ],
    takeawaysMd: "Wildcard matching over a set of words is a DFS on a trie where a wildcard branches into all children.",
  },

  "house-robber-ii": {
    understandMd: "Houses are arranged in a circle, so the first and last houses are neighbours. You cannot rob two adjacent houses; maximise the total amount stolen.",
    ioConstraintsMd: "Input: array of non-negative amounts, length 1 to 100. Output: the maximum total.",
    edgeCases: ["Single house", "Two houses (take the larger one)", "Three houses: all pairwise adjacent", "Large value at one end"],
    bruteForceMd: "Try every subset of houses with no two adjacent (and not both first and last).",
    bruteComplexity: "O(2ⁿ) time.",
    bottleneckMd: "The circle only adds one constraint compared with the straight-line version: the first and last houses are not both allowed. That splits the problem into two ordinary line problems.",
    hints: [
      "Recall the straight-line House Robber DP. What changes when house 0 and house n−1 are adjacent?", "You can never rob both the first and the last house. So either the first is excluded or the last is excluded.", "Solve the line problem twice: on houses 0..n−2 and on houses 1..n−1, and take the maximum.", "Handle n == 1 separately; the line DP keeps two numbers: best with and without the current house.",
    ],
    optimalMd: "Because the first and last houses cannot both be robbed, the best answer is the larger of two linear problems: rob from houses [0, n−2], or from houses [1, n−1]. Each linear problem is solved with the usual constant-space DP (take = skip + value, skip = max(previous skip, previous take)). A single house is a special case that the split would miss.",
    code: [
      cpp(`
int robLine(vector<int>& a, int lo, int hi) {
    int take = 0, skip = 0;                                 // best total with / without robbing the current house
    for (int i = lo; i <= hi; ++i) {
        int newTake = skip + a[i];
        skip = max(skip, take);
        take = newTake;
    }
    return max(take, skip);
}
int rob(vector<int>& nums) {
    int n = nums.size();
    if (n == 1) return nums[0];
    return max(robLine(nums, 0, n - 2), robLine(nums, 1, n - 1));   // skip the last house, or skip the first
}`, 'C++'),
      java(`
public int rob(int[] nums) {
    int n = nums.length;
    if (n == 1) return nums[0];
    return Math.max(robLine(nums, 0, n - 2), robLine(nums, 1, n - 1));   // skip the last house, or skip the first
}
private int robLine(int[] a, int lo, int hi) {
    int take = 0, skip = 0;                             // best total with / without robbing the current house
    for (int i = lo; i <= hi; i++) {
        int newTake = skip + a[i];
        skip = Math.max(skip, take);
        take = newTake;
    }
    return Math.max(take, skip);
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[2,3,2]", expected: "3", why: "Cannot take both 2s" },
      { input: "[1,2,3,1]", expected: "4", why: "1 + 3" },
      { input: "[5]", expected: "5", why: "Single house" },
      { input: "[200,3,140,20,10]", expected: "340", why: "First and third house" },
    ],
    takeawaysMd: "A circular constraint can often be broken by trying \"exclude the first\" and \"exclude the last\" and reusing the linear solution.",
  },

  "kth-smallest-element-in-a-bst": {
    understandMd: "Given the root of a binary search tree and an integer k, return the k-th smallest value (1-indexed).",
    ioConstraintsMd: "Input: BST with up to 10⁴ nodes and 1 ≤ k ≤ n. Output: the value.",
    edgeCases: ["k = 1 (the leftmost node)", "k = n (the largest value)", "Tree that is a single chain", "Very deep tree (use an explicit stack to avoid recursion limits)"],
    bruteForceMd: "Collect all values with any traversal, sort them, and pick the k-th.",
    bruteComplexity: "O(n log n) time, O(n) space.",
    bottleneckMd: "A BST already keeps its values ordered: an inorder traversal visits them in ascending order, so sorting is unnecessary and you can stop after k visits.",
    hints: [
      "Which traversal of a BST yields the values in increasing order?", "You only need k nodes, not the whole tree. How can you stop early?", "Do an iterative inorder traversal with a stack and count visited nodes.", "push all left children; pop a node; if --k == 0 return its value; then move to its right child.",
    ],
    optimalMd: "Run an iterative inorder traversal. Push nodes while going left, pop the next node (the next smallest value), decrement k and return when it reaches zero, otherwise continue with the popped node's right subtree. The traversal stops as soon as the answer is found, so it costs O(h + k).",
    code: [
      cpp(`
int kthSmallest(TreeNode* root, int k) {
    stack<TreeNode*> st;
    TreeNode* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }      // go as far left as possible
        cur = st.top(); st.pop();
        if (--k == 0) return cur->val;                      // inorder traversal of a BST is sorted
        cur = cur->right;
    }
    return -1;                                              // k is larger than the number of nodes
}`, 'C++'),
      java(`
public int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) { stack.push(cur); cur = cur.left; }   // go as far left as possible
        cur = stack.pop();
        if (--k == 0) return cur.val;                   // inorder traversal of a BST is sorted
        cur = cur.right;
    }
    return -1;                                          // k is larger than the number of nodes
}`, 'Java'),
    ],
    finalComplexity: "O(h + k) time, O(h) space (h = tree height).",
    testCases: [
      { input: "[3,1,4,null,2], k = 1", expected: "1", why: "Leftmost value" },
      { input: "[5,3,6,2,4,null,null,1], k = 3", expected: "3", why: "Needs the climb back from the left side" },
      { input: "[3,1,4,null,2], k = 4", expected: "4", why: "Largest value" },
      { input: "[1], k = 1", expected: "1", why: "Single node" },
    ],
    takeawaysMd: "Inorder on a BST is sorted order; use an explicit stack so you can stop after k nodes.",
  },

  "lowest-common-ancestor-of-a-binary-search-tree": {
    understandMd: "Given a BST and two of its nodes p and q, find their lowest common ancestor: the deepest node that has both p and q in its subtree (a node counts as its own descendant).",
    ioConstraintsMd: "Input: BST (2 to 10⁵ nodes, unique values) and two distinct nodes known to be in it. Output: the LCA node.",
    edgeCases: ["One node is an ancestor of the other", "p and q are in different subtrees of the root", "p and q are siblings", "Skewed tree"],
    bruteForceMd: "Find the root-to-node paths for p and q and compare them to find the last common node.",
    bruteComplexity: "O(n) time and O(n) space for the paths.",
    bottleneckMd: "The BST ordering already tells you which subtree contains each node: you can decide at every step without searching for the paths.",
    hints: [
      "At the root, if both values are smaller than the root, where must the LCA be?", "If both are larger? And if one is smaller and the other larger (or equal)?", "The first node where the two values \"split\" (or one equals the node) is the LCA.", "while cur: if p < cur and q < cur: go left; elif p > cur and q > cur: go right; else return cur",
    ],
    optimalMd: "Start at the root and walk down. If both targets are smaller than the current value the LCA is in the left subtree; if both are larger it is in the right subtree; otherwise the current node is the point where the paths diverge (or equals one of the nodes), so it is the answer. No recursion or extra space is needed.",
    code: [
      cpp(`
TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    TreeNode* cur = root;
    while (cur) {
        if (p->val < cur->val && q->val < cur->val) cur = cur->left;         // both targets are in the left subtree
        else if (p->val > cur->val && q->val > cur->val) cur = cur->right;  // both are in the right subtree
        else return cur;                                    // they split here, or one of them is cur
    }
    return nullptr;
}`, 'C++'),
      java(`
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    TreeNode cur = root;
    while (cur != null) {
        if (p.val < cur.val && q.val < cur.val) cur = cur.left;        // both targets are in the left subtree
        else if (p.val > cur.val && q.val > cur.val) cur = cur.right; // both are in the right subtree
        else return cur;                                // they split here, or one of them is cur
    }
    return null;
}`, 'Java'),
    ],
    finalComplexity: "O(h) time, O(1) space.",
    testCases: [
      { input: "BST [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8", expected: "6", why: "Split at the root" },
      { input: "p = 2, q = 4", expected: "2", why: "p is an ancestor of q" },
      { input: "p = 3, q = 5", expected: "4", why: "Siblings under 4" },
      { input: "p = 7, q = 9", expected: "8", why: "Siblings under 8" },
    ],
    takeawaysMd: "On a BST, compare the target values with the current node to choose a side; the first split point is the answer.",
  },

  "meeting-rooms": {
    understandMd: "Given a list of meeting time intervals [start, end), decide whether one person can attend all of them (no two overlap).",
    ioConstraintsMd: "Input: up to 10⁴ intervals with 0 ≤ start < end. Output: true or false. Intervals that merely touch ([1,2] and [2,3]) do not overlap.",
    edgeCases: ["Empty list or a single meeting", "Touching intervals (end equals the next start)", "One meeting fully inside another", "Unsorted input"],
    bruteForceMd: "Compare every pair of meetings for overlap.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "Overlapping meetings become neighbours after sorting by start time, so only adjacent pairs need to be compared.",
    hints: [
      "If the meetings were sorted by start time, which pairs could possibly overlap?", "Sort by start time and compare each meeting only with the previous one.", "Meeting i overlaps the previous one if its start is earlier than the previous end.", "sort by start; for i in 1..n-1: if start[i] < end[i-1]: return false; return true",
    ],
    optimalMd: "Sort the intervals by start time. After sorting, any overlap must involve neighbours, because a meeting that starts after the previous one ends cannot overlap anything earlier either. Return false if some meeting starts before the previous one ends (strictly less, so touching is allowed).",
    code: [
      cpp(`
bool canAttendMeetings(vector<vector<int>>& intervals) {
    sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });
    for (size_t i = 1; i < intervals.size(); ++i)
        if (intervals[i][0] < intervals[i - 1][1]) return false;   // starts before the previous one ends
    return true;
}`, 'C++'),
      java(`
public boolean canAttendMeetings(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    for (int i = 1; i < intervals.length; i++)
        if (intervals[i][0] < intervals[i - 1][1]) return false;   // starts before the previous one ends
    return true;
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time, O(1) extra space besides the sort.",
    testCases: [
      { input: "[[0,30],[5,10],[15,20]]", expected: "false", why: "5 < 30" },
      { input: "[[7,10],[2,4]]", expected: "true", why: "Needs sorting first" },
      { input: "[[1,2],[2,3]]", expected: "true", why: "Touching is allowed" },
      { input: "[]", expected: "true", why: "No meetings" },
    ],
    takeawaysMd: "Interval problems usually start with a sort by start time; then only neighbours matter.",
  },

  "meeting-rooms-ii": {
    understandMd: "Given meeting time intervals, find the minimum number of conference rooms needed so that no two overlapping meetings share a room.",
    ioConstraintsMd: "Input: up to 10⁴ intervals [start, end). Output: the smallest number of rooms.",
    edgeCases: ["No meetings", "Back-to-back meetings that can share a room", "All meetings overlapping at one instant", "Same start time for several meetings"],
    bruteForceMd: "For every moment (or every start time) count how many meetings are active and take the maximum.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "Counting the active meetings from scratch at each start repeats work. Sorting by start and tracking only the earliest finishing room keeps the active set small and cheap to update.",
    hints: [
      "The answer is the largest number of meetings running at the same time. How can you track \"currently running\" as you sweep through the starts?", "Sort by start time and keep a min-heap of end times for rooms in use.", "When a meeting starts, if the earliest end is not after its start, that room is free: reuse it (pop), otherwise a new room is needed.", "for meeting in sorted: if heap non-empty and heap.top <= start: pop; push end; answer = heap size",
    ],
    optimalMd: "Sort the meetings by start time and maintain a min-heap of end times for the rooms currently occupied. For each meeting, if the room that frees up first has already ended by this start time, reuse it; then push the new end time. The heap size at the end equals the maximum number of simultaneous meetings. (An equivalent solution sorts starts and ends separately and sweeps.)",
    code: [
      cpp(`
int minMeetingRooms(vector<vector<int>>& intervals) {
    sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });
    priority_queue<int, vector<int>, greater<int>> ends;    // end times of the rooms currently in use
    for (auto& iv : intervals) {
        if (!ends.empty() && ends.top() <= iv[0]) ends.pop();   // the earliest-ending room is free: reuse it
        ends.push(iv[1]);
    }
    return ends.size();
}`, 'C++'),
      java(`
public int minMeetingRooms(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    PriorityQueue<Integer> ends = new PriorityQueue<>();            // end times of the rooms currently in use
    for (int[] iv : intervals) {
        if (!ends.isEmpty() && ends.peek() <= iv[0]) ends.poll();   // the earliest-ending room is free: reuse it
        ends.add(iv[1]);
    }
    return ends.size();
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time, O(n) space.",
    testCases: [
      { input: "[[0,30],[5,10],[15,20]]", expected: "2", why: "30 overlaps the other two, which do not overlap each other" },
      { input: "[[7,10],[2,4]]", expected: "1", why: "One room is reused" },
      { input: "[[1,5],[2,6],[3,7]]", expected: "3", why: "All overlap" },
      { input: "[[1,2],[2,3]]", expected: "1", why: "Touching meetings share a room" },
    ],
    takeawaysMd: "The minimum resources for overlapping intervals equals the maximum simultaneous overlap; a min-heap of end times computes it while sweeping by start.",
  },

  "graph-valid-tree": {
    understandMd: "Given n nodes labelled 0..n−1 and a list of undirected edges, decide whether the edges form a valid tree: connected and without cycles.",
    ioConstraintsMd: "Input: n (up to 2,000) and an edge list. Output: true or false.",
    edgeCases: ["n = 1 with no edges (a valid tree)", "Wrong number of edges", "Right number of edges but a cycle with an isolated node", "Disconnected components"],
    bruteForceMd: "Run a DFS from node 0 tracking the parent to detect cycles, then check that every node was visited.",
    bruteComplexity: "O(V + E) time and space, with careful parent handling.",
    bottleneckMd: "You can avoid the traversal: a tree on n nodes has exactly n − 1 edges, and with that count a cycle and a disconnected component always come together. Detecting a cycle with union-find is enough.",
    hints: [
      "How many edges must a tree with n nodes have?", "If there are n − 1 edges, which single property do you still have to check: connectivity or acyclicity?", "With n − 1 edges, \"no cycle\" implies \"connected\". How does union-find detect a cycle?", "if edges != n−1: false; for each edge: if find(a) == find(b): false else union; return true",
    ],
    optimalMd: "First reject any edge count other than n − 1. Then process each edge with a union-find structure: if both endpoints already have the same root the edge closes a cycle, so return false; otherwise merge the two sets. With exactly n − 1 edges and no cycle the graph must be connected, so the answer is true.",
    code: [
      cpp(`
int find(vector<int>& parent, int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
    return x;
}
bool validTree(int n, vector<vector<int>>& edges) {
    if ((int)edges.size() != n - 1) return false;           // a tree on n nodes has exactly n - 1 edges
    vector<int> parent(n);
    iota(parent.begin(), parent.end(), 0);
    for (auto& e : edges) {
        int a = find(parent, e[0]), b = find(parent, e[1]);
        if (a == b) return false;                           // this edge would close a cycle
        parent[a] = b;
    }
    return true;                                            // n - 1 edges and no cycle means connected
}`, 'C++'),
      java(`
public boolean validTree(int n, int[][] edges) {
    if (edges.length != n - 1) return false;            // a tree on n nodes has exactly n - 1 edges
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    for (int[] e : edges) {
        int a = find(parent, e[0]), b = find(parent, e[1]);
        if (a == b) return false;                       // this edge would close a cycle
        parent[a] = b;
    }
    return true;                                        // n - 1 edges and no cycle means connected
}
private int find(int[] parent, int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
    return x;
}`, 'Java'),
    ],
    finalComplexity: "O(n · α(n)) time, O(n) space.",
    testCases: [
      { input: "n = 5, [[0,1],[0,2],[0,3],[1,4]]", expected: "true", why: "A tree" },
      { input: "n = 5, [[0,1],[1,2],[2,3],[1,3],[1,4]]", expected: "false", why: "Too many edges: contains a cycle" },
      { input: "n = 4, [[0,1],[2,3]]", expected: "false", why: "Two components" },
      { input: "n = 4, [[0,1],[1,2],[0,2]]", expected: "false", why: "Correct count but a cycle and an isolated node" },
    ],
    takeawaysMd: "A graph is a tree iff it has n − 1 edges and no cycle (or n − 1 edges and is connected); union-find checks it in near-linear time.",
  },

  "missing-number": {
    understandMd: "An array contains n distinct numbers taken from the range 0..n. Find the one number in the range that is missing.",
    ioConstraintsMd: "Input: array of length n (up to 10⁴) with distinct values in 0..n. Output: the missing value. A follow-up asks for O(1) space and O(n) time.",
    edgeCases: ["Missing 0", "Missing n (the last value)", "Single element array", "Unsorted input"],
    bruteForceMd: "Sort the array and find the first index whose value differs from the index, or use a hash set of all numbers.",
    bruteComplexity: "O(n log n) time (sort) or O(n) extra space (set).",
    bottleneckMd: "Both approaches use extra work or memory for what is really an arithmetic fact: the full range has a known sum (or XOR), and the missing value is the difference from what is present.",
    hints: [
      "If no number were missing, what would the sum of 0..n be?", "The difference between that sum and the actual sum is the missing number. What could go wrong with the sum for large n?", "XOR has the property a ^ a = 0. XOR all indices and all values together with n.", "x = n; for i: x ^= i ^ nums[i]; return x",
    ],
    optimalMd: "XOR every index 0..n−1 and every array value, starting from n. Each present value cancels with its matching index (or n), because a ^ a = 0, so only the missing number remains. This is O(n) time, O(1) space and cannot overflow (the sum formula n(n+1)/2 − sum is also fine for the given limits).",
    code: [
      cpp(`
int missingNumber(vector<int>& nums) {
    int x = nums.size();
    for (int i = 0; i < (int)nums.size(); ++i) x ^= i ^ nums[i];   // every present value cancels with its index
    return x;                                               // only the missing value is left
}`, 'C++'),
      java(`
public int missingNumber(int[] nums) {
    int xor = nums.length;
    for (int i = 0; i < nums.length; i++) xor ^= i ^ nums[i];   // every present value cancels with its index
    return xor;                                         // only the missing value is left
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[3,0,1]", expected: "2", why: "Missing in the middle" },
      { input: "[0,1]", expected: "2", why: "Missing n" },
      { input: "[9,6,4,2,3,5,7,0,1]", expected: "8", why: "Larger example" },
      { input: "[1]", expected: "0", why: "Missing 0" },
    ],
    takeawaysMd: "To find the one unmatched element in a known range, cancel matching pairs with XOR (or use a sum formula).",
  },

  "alien-dictionary": {
    understandMd: "You are given a list of words sorted according to the rules of an unknown alphabet. Deduce an ordering of the letters that is consistent with the list, or return an empty string if none exists.",
    ioConstraintsMd: "Input: up to 100 words of lowercase letters. Output: any valid letter order (all letters that appear), or \"\" if the input is contradictory.",
    edgeCases: ["A longer word before its own prefix (\"abc\" before \"ab\"): invalid", "Words that share a long common prefix", "Letters that appear but are unconstrained", "Contradictory pairs that form a cycle", "A single word"],
    bruteForceMd: "Try all permutations of the letters and check each against the word list.",
    bruteComplexity: "O(k! · n · L) time.",
    bottleneckMd: "Only the first differing letter of each adjacent pair of words carries information. Those facts form a directed graph of \"a comes before b\", and a valid alphabet is a topological order of that graph.",
    hints: [
      "Which two words give you real ordering information? What do you learn from them?", "Compare adjacent words; the first position where they differ gives an edge letter₁ → letter₂. Mind the prefix case.", "Build a graph over all letters that appear, then topologically sort it with Kahn's algorithm (in-degree counts).", "If the sorted output has fewer letters than the graph, there is a cycle: return \"\".",
    ],
    optimalMd: "Create a node for every letter that appears. For each pair of adjacent words, find the first differing position and add an edge from the earlier word's letter to the later one (counting each edge once); if the longer word comes first and the shorter is its prefix the input is invalid. Run Kahn's algorithm: repeatedly remove letters with in-degree 0 and append them to the answer. If not all letters were output, the constraints contain a cycle and no valid order exists.",
    code: [
      cpp(`
string alienOrder(vector<string>& words) {
    map<char, set<char>> next;
    map<char, int> indeg;
    for (auto& w : words) for (char c : w) { next[c]; indeg.emplace(c, 0); }
    for (size_t i = 0; i + 1 < words.size(); ++i) {
        const string &a = words[i], &b = words[i + 1];
        if (a.size() > b.size() && a.compare(0, b.size(), b) == 0) return "";   // "abc" before "ab" cannot be sorted
        for (size_t j = 0; j < min(a.size(), b.size()); ++j) {
            if (a[j] != b[j]) {                             // the first difference gives an order a[j] < b[j]
                if (next[a[j]].insert(b[j]).second) ++indeg[b[j]];
                break;
            }
        }
    }
    queue<char> q;
    for (auto& kv : indeg) if (kv.second == 0) q.push(kv.first);
    string out;
    while (!q.empty()) {                                    // Kahn's topological sort
        char c = q.front(); q.pop();
        out += c;
        for (char d : next[c]) if (--indeg[d] == 0) q.push(d);
    }
    return out.size() == indeg.size() ? out : "";           // letters left over mean a cycle
}`, 'C++'),
      java(`
public String alienOrder(String[] words) {
    Map<Character, Set<Character>> next = new HashMap<>();
    Map<Character, Integer> indeg = new HashMap<>();
    for (String w : words)
        for (char c : w.toCharArray()) { next.putIfAbsent(c, new HashSet<>()); indeg.putIfAbsent(c, 0); }
    for (int i = 0; i + 1 < words.length; i++) {
        String a = words[i], b = words[i + 1];
        if (a.length() > b.length() && a.startsWith(b)) return "";   // "abc" before "ab" cannot be sorted
        for (int j = 0; j < Math.min(a.length(), b.length()); j++) {
            if (a.charAt(j) != b.charAt(j)) {           // the first difference gives an order a[j] < b[j]
                if (next.get(a.charAt(j)).add(b.charAt(j))) indeg.merge(b.charAt(j), 1, Integer::sum);
                break;
            }
        }
    }
    Deque<Character> queue = new ArrayDeque<>();
    for (Map.Entry<Character, Integer> e : indeg.entrySet()) if (e.getValue() == 0) queue.add(e.getKey());
    StringBuilder out = new StringBuilder();
    while (!queue.isEmpty()) {                          // Kahn's topological sort
        char c = queue.poll();
        out.append(c);
        for (char d : next.get(c)) if (indeg.merge(d, -1, Integer::sum) == 0) queue.add(d);
    }
    return out.length() == indeg.size() ? out.toString() : "";   // letters left over mean a cycle
}`, 'Java'),
    ],
    finalComplexity: "O(total characters + edges) time, O(unique letters + edges) space.",
    testCases: [
      { input: "[\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]", expected: "\"wertf\"", why: "Unique valid order" },
      { input: "[\"z\",\"x\"]", expected: "\"zx\"", why: "Single constraint" },
      { input: "[\"z\",\"x\",\"z\"]", expected: "\"\"", why: "Cycle z → x → z" },
      { input: "[\"abc\",\"ab\"]", expected: "\"\"", why: "Prefix in the wrong order" },
      { input: "[\"ab\",\"ac\"]", expected: "any order with b before c", why: "Unconstrained letter a can go anywhere" },
    ],
    takeawaysMd: "Ordering constraints deduced from data are a directed graph; use topological sort, and treat a leftover node as proof of a cycle.",
  },

  "encode-and-decode-strings": {
    understandMd: "Design an encoding that turns a list of strings into a single string and a decoder that restores the original list exactly. The strings may contain any characters.",
    ioConstraintsMd: "Input: a list of up to 200 strings (possibly empty strings) of arbitrary characters. Output: encode returns one string; decode returns the original list.",
    edgeCases: ["Empty list", "A list containing an empty string", "Strings containing the delimiter or digits", "Strings containing commas or \"#\""],
    bruteForceMd: "Join the strings with a chosen delimiter such as \",\" and split on it when decoding.",
    bruteComplexity: "O(total length), but incorrect when a string contains the delimiter.",
    bottleneckMd: "Any single-character delimiter can appear inside the data, so splitting becomes ambiguous. Prefixing each string with its length makes the format unambiguous without escaping.",
    hints: [
      "What can go wrong if a string itself contains your delimiter?", "Instead of marking where strings end, record how long each one is.", "Write \"<length>#<string>\" for every string. On decoding, read digits up to the first \"#\", then take exactly that many characters.", "Since the length tells you how many characters follow, the content can contain \"#\" or digits safely.",
    ],
    optimalMd: "Encode each string as its length, a separator character, and the string itself, then concatenate. To decode, repeatedly find the next separator, parse the number before it as the length, take exactly that many following characters as the next string, and continue after them. The decoder never interprets the content, so any characters (including the separator) are safe.",
    code: [
      cpp(`
class Codec {
public:
    string encode(vector<string>& strs) {
        string out;
        for (auto& s : strs) out += to_string(s.size()) + "#" + s;   // e.g. "4#abcd"
        return out;
    }
    vector<string> decode(string s) {
        vector<string> out;
        size_t i = 0;
        while (i < s.size()) {
            size_t hash = s.find('#', i);                   // the first '#' after i ends the length field
            int len = stoi(s.substr(i, hash - i));
            out.push_back(s.substr(hash + 1, len));         // take exactly len characters, whatever they are
            i = hash + 1 + len;
        }
        return out;
    }
};`, 'C++'),
      java(`
class Codec {
    public String encode(List<String> strs) {
        StringBuilder sb = new StringBuilder();
        for (String s : strs) sb.append(s.length()).append('#').append(s);   // e.g. "4#abcd"
        return sb.toString();
    }
    public List<String> decode(String s) {
        List<String> out = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            int hash = s.indexOf('#', i);               // the first '#' after i ends the length field
            int len = Integer.parseInt(s.substring(i, hash));
            out.add(s.substring(hash + 1, hash + 1 + len));   // take exactly len characters, whatever they are
            i = hash + 1 + len;
        }
        return out;
    }
}`, 'Java'),
    ],
    finalComplexity: "O(total length) time and space.",
    testCases: [
      { input: "[\"Hello\",\"World\"]", expected: "round-trips", why: "Basic case" },
      { input: "[\"\"]", expected: "round-trips", why: "Empty string inside the list" },
      { input: "[]", expected: "round-trips", why: "Empty list" },
      { input: "[\"4#ab\",\"#\",\"12#\",\"\",\"a,b\"]", expected: "round-trips", why: "Data that looks like the format" },
    ],
    takeawaysMd: "Length-prefixing is the standard way to serialise arbitrary data without escaping.",
  },

  "find-median-from-data-stream": {
    understandMd: "Design a structure that supports adding integers one at a time and returning the median of all numbers added so far.",
    ioConstraintsMd: "Input: up to 5 × 10⁴ operations (addNum and findMedian). Output: the median as a floating-point value (the mean of the two middle values when the count is even).",
    edgeCases: ["Only one number", "Even and odd counts", "Negative numbers and duplicates", "Many calls to findMedian between additions"],
    bruteForceMd: "Keep an array, sort it whenever the median is requested, and read the middle element(s).",
    bruteComplexity: "O(n log n) per query, or O(n) per insertion with insertion sort.",
    bottleneckMd: "Sorting everything repeatedly is wasteful: the median only depends on the boundary between the smaller half and the larger half of the data.",
    hints: [
      "The median splits the data into a lower half and an upper half. Which element of each half do you need to know?", "Keep the lower half in a max-heap and the upper half in a min-heap. What invariant on their sizes do you maintain?", "On insertion, push into one heap, move the top across, and rebalance so the sizes differ by at most one.", "Median = top of the larger heap, or the average of both tops if the sizes are equal.",
    ],
    optimalMd: "Maintain two heaps: a max-heap holding the smaller half and a min-heap holding the larger half, with the max-heap allowed to have one extra element. To add x, push it to the max-heap, move that heap's maximum to the min-heap, and if the min-heap becomes larger move its minimum back. The median is the top of the max-heap when it holds more elements, otherwise the average of the two tops. Insertion is O(log n) and the median query is O(1).",
    code: [
      cpp(`
class MedianFinder {
    priority_queue<int> low;                                // max-heap: the smaller half
    priority_queue<int, vector<int>, greater<int>> high;    // min-heap: the larger half
public:
    void addNum(int num) {
        low.push(num);
        high.push(low.top()); low.pop();                    // the largest of the small half moves to the large half
        if (high.size() > low.size()) { low.push(high.top()); high.pop(); }   // keep low the same size or one larger
    }
    double findMedian() {
        return low.size() > high.size() ? low.top() : (low.top() + (double)high.top()) / 2.0;
    }
};`, 'C++'),
      java(`
class MedianFinder {
    private final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());   // max-heap: smaller half
    private final PriorityQueue<Integer> high = new PriorityQueue<>();                             // min-heap: larger half

    public MedianFinder() {}
    public void addNum(int num) {
        low.add(num);
        high.add(low.poll());                           // the largest of the small half moves to the large half
        if (high.size() > low.size()) low.add(high.poll());   // keep low the same size or one larger
    }
    public double findMedian() {
        return low.size() > high.size() ? low.peek() : (low.peek() + (double) high.peek()) / 2.0;
    }
}`, 'Java'),
    ],
    finalComplexity: "O(log n) per addNum, O(1) per findMedian, O(n) space.",
    testCases: [
      { input: "add 1", expected: "median 1.0", why: "One element" },
      { input: "add 2", expected: "median 1.5", why: "Even count: mean of the middle two" },
      { input: "add 3", expected: "median 2.0", why: "Odd count again" },
      { input: "add −1, −5", expected: "median 1.5 then 1.0", why: "Negative values rebalance the heaps" },
    ],
    takeawaysMd: "A running median is two heaps around the middle; keep their sizes balanced and read the tops.",
  },

  "serialize-and-deserialize-binary-tree": {
    understandMd: "Design an algorithm to convert a binary tree to a string and back so that the original tree (shape and values) is restored exactly.",
    ioConstraintsMd: "Input: tree with up to 10⁴ nodes and values in a limited range (negative values allowed). Output: serialize returns a string; deserialize returns the tree root.",
    edgeCases: ["Empty tree", "Single node", "Skewed trees (all left or all right children)", "Negative values and multi-digit numbers", "Trees with missing children at different levels"],
    bruteForceMd: "Record only the inorder traversal values and rebuild from them. (This loses the shape: many trees share an inorder sequence.)",
    bruteComplexity: "Incorrect: one traversal alone does not identify a tree.",
    bottleneckMd: "A single traversal of values is ambiguous. Recording the null children as well fixes this: a preorder traversal with explicit null markers is a complete description of the tree.",
    hints: [
      "Why is one traversal order alone not enough to rebuild a tree uniquely?", "What if you also write down where the missing children are?", "Serialise in preorder, writing a marker such as \"#\" for every null child; values are separated by commas.", "Deserialise by consuming tokens in the same order: a marker returns null, otherwise create a node and read its left then its right subtree.",
    ],
    optimalMd: "Serialize with a preorder traversal that writes each value followed by a comma, and writes \"#,\" for every null child. Deserialise by splitting the string into tokens and rebuilding recursively in the same preorder: take the next token; if it is the null marker return null; otherwise create a node and set its left child, then its right child, from the following tokens. The null markers make the structure unambiguous.",
    code: [
      cpp(`
class Codec {
    void write(TreeNode* node, string& out) {
        if (!node) { out += "#,"; return; }                 // '#' marks a missing child
        out += to_string(node->val) + ",";
        write(node->left, out);
        write(node->right, out);
    }
    TreeNode* read(istringstream& in) {
        string tok;
        getline(in, tok, ',');
        if (tok == "#") return nullptr;
        TreeNode* node = new TreeNode(stoi(tok));
        node->left = read(in);                              // same preorder as serialization
        node->right = read(in);
        return node;
    }
public:
    string serialize(TreeNode* root) { string out; write(root, out); return out; }
    TreeNode* deserialize(string data) { istringstream in(data); return read(in); }
};`, 'C++'),
      java(`
class Codec {
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        write(root, sb);
        return sb.toString();
    }
    private void write(TreeNode node, StringBuilder sb) {
        if (node == null) { sb.append("#,"); return; }  // '#' marks a missing child
        sb.append(node.val).append(',');
        write(node.left, sb);
        write(node.right, sb);
    }
    public TreeNode deserialize(String data) {
        Deque<String> tokens = new ArrayDeque<>(Arrays.asList(data.split(",")));
        return read(tokens);
    }
    private TreeNode read(Deque<String> tokens) {
        String t = tokens.poll();
        if (t.equals("#")) return null;
        TreeNode node = new TreeNode(Integer.parseInt(t));
        node.left = read(tokens);                       // same preorder as serialization
        node.right = read(tokens);
        return node;
    }
}`, 'Java'),
    ],
    finalComplexity: "O(n) time and space for both operations.",
    testCases: [
      { input: "[1,2,3,null,null,4,5]", expected: "\"1,2,#,#,3,4,#,#,5,#,#,\" and back to the same tree", why: "Mixed shape" },
      { input: "[]", expected: "round-trips to an empty tree", why: "Empty tree" },
      { input: "[-1,-2,null,-3]", expected: "round-trips", why: "Negative values and a left chain" },
      { input: "[1]", expected: "round-trips", why: "Single node" },
    ],
    takeawaysMd: "To serialise a tree unambiguously include the null children; preorder plus markers mirrors the recursive deserializer.",
  },

  "longest-increasing-subsequence": {
    understandMd: "Find the length of the longest strictly increasing subsequence of an array. A subsequence keeps the original order but may skip elements.",
    ioConstraintsMd: "Input: array of up to 2,500 integers (negative allowed). Output: the length. A follow-up asks for O(n log n).",
    edgeCases: ["All elements equal (answer 1)", "Strictly decreasing array (answer 1)", "Duplicates must not both be counted", "Single element"],
    bruteForceMd: "Try every subsequence and keep the longest increasing one.",
    bruteComplexity: "O(2ⁿ · n) time.",
    bottleneckMd: "The classic DP, dp[i] = 1 + max dp[j] over earlier smaller values, is O(n²) because each element scans all earlier ones. Keeping only the best tail for each length lets you replace that scan by a binary search.",
    hints: [
      "Let dp[i] be the best length ending at i. What does each element need to look at in the O(n²) solution?", "For each possible length, only the smallest possible last value matters. Why is a smaller tail always at least as good?", "Maintain tails[len] and note that it is sorted, so a binary search finds where the new value belongs.", "For x: find the first tail ≥ x; replace it with x; if none exists, append x. The array length is the answer.",
    ],
    optimalMd: "Keep an array tails where tails[i] is the smallest possible last element of an increasing subsequence of length i + 1. The array is always sorted, so for each new value x binary-search the first tail that is ≥ x and overwrite it (x gives a better tail for that length); if x is larger than every tail, append it and the subsequence length grows. The final size of tails is the LIS length (tails itself is not necessarily a valid subsequence).",
    code: [
      cpp(`
int lengthOfLIS(vector<int>& nums) {
    vector<int> tails;                                      // tails[i] = smallest tail of any increasing subsequence of length i + 1
    for (int x : nums) {
        auto it = lower_bound(tails.begin(), tails.end(), x);   // first tail >= x
        if (it == tails.end()) tails.push_back(x);          // x extends the longest subsequence
        else *it = x;                                       // x improves an existing tail
    }
    return tails.size();
}`, 'C++'),
      java(`
public int lengthOfLIS(int[] nums) {
    int[] tails = new int[nums.length];                 // tails[i] = smallest tail of any increasing subsequence of length i + 1
    int size = 0;
    for (int x : nums) {
        int lo = 0, hi = size;
        while (lo < hi) {                               // binary search for the first tail >= x
            int mid = (lo + hi) >>> 1;
            if (tails[mid] < x) lo = mid + 1; else hi = mid;
        }
        tails[lo] = x;                                  // x extends a subsequence or improves a tail
        if (lo == size) size++;
    }
    return size;
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time, O(n) space.",
    testCases: [
      { input: "[10,9,2,5,3,7,101,18]", expected: "4", why: "e.g. 2,3,7,18" },
      { input: "[0,1,0,3,2,3]", expected: "4", why: "0,1,2,3" },
      { input: "[7,7,7,7]", expected: "1", why: "Strictly increasing: duplicates do not count" },
      { input: "[4,10,4,3,8,9]", expected: "3", why: "4,8,9" },
    ],
    takeawaysMd: "LIS in O(n log n): maintain the smallest tail for every length and binary-search the position of each new element.",
  },

  "number-of-connected-components-in-an-undirected-graph": {
    understandMd: "Given n nodes and a list of undirected edges, count the connected components of the graph.",
    ioConstraintsMd: "Input: n up to 2,000 and up to 5,000 edges. Output: the number of components (isolated nodes count as components).",
    edgeCases: ["No edges (every node is its own component)", "Duplicate or repeated edges", "A single node", "Everything connected"],
    bruteForceMd: "Run a DFS or BFS from every unvisited node and count how many searches were started.",
    bruteComplexity: "O(V + E) time, O(V + E) space for the adjacency lists.",
    bottleneckMd: "Nothing is slow about the traversal, but building adjacency lists is unnecessary when all you need is to merge sets as the edges arrive, which is exactly union-find.",
    hints: [
      "Start by assuming each node is its own component. What happens to the count when an edge connects two different components?", "You need a structure that merges groups and tells you whether two nodes are already in the same group.", "Union-find: find the roots of both endpoints; if they differ, link them and subtract one from the count.", "components = n; for each edge: if find(a) != find(b): union; components−−",
    ],
    optimalMd: "Initialise a union-find structure with n singleton sets and components = n. For each edge find the roots of its endpoints; if they are different the edge joins two components, so merge them and decrement the counter. Edges inside an existing component change nothing. Path compression (here path halving) keeps the finds almost constant time.",
    code: [
      cpp(`
int find(vector<int>& parent, int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
    return x;
}
int countComponents(int n, vector<vector<int>>& edges) {
    vector<int> parent(n);
    iota(parent.begin(), parent.end(), 0);
    int components = n;
    for (auto& e : edges) {
        int a = find(parent, e[0]), b = find(parent, e[1]);
        if (a != b) { parent[a] = b; --components; }        // every successful merge removes one component
    }
    return components;
}`, 'C++'),
      java(`
public int countComponents(int n, int[][] edges) {
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    int components = n;
    for (int[] e : edges) {
        int a = find(parent, e[0]), b = find(parent, e[1]);
        if (a != b) { parent[a] = b; components--; }    // every successful merge removes one component
    }
    return components;
}
private int find(int[] parent, int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
    return x;
}`, 'Java'),
    ],
    finalComplexity: "O((V + E) · α(V)) time, O(V) space.",
    testCases: [
      { input: "n = 5, [[0,1],[1,2],[3,4]]", expected: "2", why: "Two groups" },
      { input: "n = 5, a path through all nodes", expected: "1", why: "One component" },
      { input: "n = 4, no edges", expected: "4", why: "All isolated" },
      { input: "n = 4, [[0,1],[1,0],[2,2]]", expected: "3", why: "Repeated and self edges" },
    ],
    takeawaysMd: "Counting components while edges arrive is a union-find problem: start with n and decrement on every successful merge.",
  },

  "counting-bits": {
    understandMd: "For every integer from 0 to n, compute the number of 1 bits in its binary representation and return the results as an array.",
    ioConstraintsMd: "Input: n up to 10⁵. Output: array of length n + 1 where element i is popcount(i). Aim for O(n) total.",
    edgeCases: ["n = 0", "Powers of two (exactly one bit)", "Numbers with all bits set such as 7 and 15", "Large n"],
    bruteForceMd: "For each i count its bits with a loop over its binary digits (or Kernighan's trick).",
    bruteComplexity: "O(n log n) time.",
    bottleneckMd: "Each count starts from scratch, although i and i / 2 have almost the same bits: dropping the last bit of i gives a smaller number whose answer is already computed.",
    hints: [
      "Compare the binary forms of 6 (110) and 3 (11). How are their bit counts related?", "i >> 1 removes the last bit of i. What is the relationship between popcount(i) and popcount(i >> 1)?", "popcount(i) = popcount(i >> 1) + (i & 1). Fill the table from 1 up to n.", "bits[i] = bits[i >> 1] + (i & 1)",
    ],
    optimalMd: "Use dynamic programming over the numbers themselves. A number i is the number i >> 1 with one more bit appended at the end; that last bit is i & 1. Therefore bits[i] = bits[i >> 1] + (i & 1), computed in increasing order of i, giving O(1) work per number.",
    code: [
      cpp(`
vector<int> countBits(int n) {
    vector<int> bits(n + 1, 0);
    for (int i = 1; i <= n; ++i) bits[i] = bits[i >> 1] + (i & 1);   // i without its last bit, plus that bit
    return bits;
}`, 'C++'),
      java(`
public int[] countBits(int n) {
    int[] bits = new int[n + 1];
    for (int i = 1; i <= n; i++) bits[i] = bits[i >> 1] + (i & 1);   // i without its last bit, plus that bit
    return bits;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space for the output.",
    testCases: [
      { input: "n = 2", expected: "[0,1,1]", why: "Small" },
      { input: "n = 5", expected: "[0,1,1,2,1,2]", why: "Typical" },
      { input: "n = 0", expected: "[0]", why: "Only zero" },
      { input: "n = 8", expected: "[0,1,1,2,1,2,2,3,1]", why: "A new power of two resets the count" },
    ],
    takeawaysMd: "When a value is a small change of an earlier value (shift, parity), a one-line DP over the value range replaces repeated bit counting.",
  },

  "sum-of-two-integers": {
    understandMd: "Compute the sum of two integers without using the + or − operators.",
    ioConstraintsMd: "Input: two integers in the 32-bit signed range (about −1000 to 1000 on LeetCode, possibly negative). Output: their sum.",
    edgeCases: ["One or both numbers negative", "Zero as an operand", "Opposite numbers (sum 0)", "Languages with different integer widths"],
    bruteForceMd: "Loop adding 1 repeatedly (increment is not allowed either; this is only a thought experiment).",
    bruteComplexity: "Not applicable (and linear in the magnitude).",
    bottleneckMd: "Binary addition already has two parts: the sum of the bits without carrying (XOR) and the carries (AND, shifted left). Repeating until no carry remains is the whole algorithm.",
    hints: [
      "Add 5 + 3 in binary on paper. Which positions produce a carry?", "XOR gives the sum without carries; (a & b) << 1 gives the carries. How do you combine them?", "Treat the carry as the new second operand and repeat until the carry is zero.", "while b != 0: carry = (a & b) << 1; a = a ^ b; b = carry; return a",
    ],
    optimalMd: "Binary addition is a ^ b for the digit sums without carry plus (a & b) << 1 for the carries. Add the two parts together by repeating the same step with the carry as the new second operand until the carry becomes zero (at most 32 iterations). Two's complement makes this work for negative numbers as well; in C++ use unsigned arithmetic for the shifts to avoid undefined behaviour.",
    code: [
      cpp(`
int getSum(int a, int b) {
    unsigned x = a, y = b;                                  // unsigned avoids undefined behaviour when shifting negatives
    while (y) {
        unsigned carry = (x & y) << 1;                      // positions where both bits are 1 produce a carry
        x ^= y;                                             // addition without the carries
        y = carry;                                          // add the carries in the next round
    }
    return (int)x;
}`, 'C++'),
      java(`
public int getSum(int a, int b) {
    while (b != 0) {
        int carry = (a & b) << 1;                       // positions where both bits are 1 produce a carry
        a = a ^ b;                                      // addition without the carries
        b = carry;                                      // add the carries in the next round
    }
    return a;
}`, 'Java'),
    ],
    finalComplexity: "O(1) time (at most 32 iterations), O(1) space.",
    testCases: [
      { input: "1 + 2", expected: "3", why: "Simple" },
      { input: "2 + 3", expected: "5", why: "A carry ripples" },
      { input: "−1 + 1", expected: "0", why: "Carry through all 32 bits" },
      { input: "−2 + −3", expected: "−5", why: "Both negative" },
    ],
    takeawaysMd: "Addition = XOR (sum without carry) + AND shifted (carry); iterate until the carry vanishes.",
  },

  "pacific-atlantic-water-flow": {
    understandMd: "A grid of heights is bordered by the Pacific Ocean (top and left edges) and the Atlantic Ocean (bottom and right edges). Water flows from a cell to an adjacent cell of equal or lower height. List all cells from which water can reach both oceans.",
    ioConstraintsMd: "Input: grid up to 200 × 200 of non-negative heights. Output: list of [row, column] coordinates (any order is accepted).",
    edgeCases: ["1 × 1 grid (a corner touches both oceans)", "Flat grid where every cell reaches both oceans", "Single row or column", "Large grids that would overflow a recursive DFS"],
    bruteForceMd: "From every cell run a DFS to see whether it can reach each ocean.",
    bruteComplexity: "O((m·n)²) time.",
    bottleneckMd: "Starting from every cell repeats almost the same searches. Reverse the problem: start at the ocean edges and move uphill, so each ocean needs one multi-source traversal.",
    hints: [
      "Instead of asking \"where does water from this cell go\", ask \"which cells can reach this ocean\"?", "Water flows downhill, so going backwards from the ocean means moving to neighbours of equal or greater height.", "Run a flood fill from all Pacific border cells and another from all Atlantic border cells, marking reached cells.", "Answer = cells marked in both grids. Use an explicit stack or queue to avoid deep recursion.",
    ],
    optimalMd: "Do two reverse flood fills. From every cell on the Pacific border, move to neighbours that are at least as high and mark everything reached; do the same from the Atlantic border. A cell that is marked by both searches can drain to both oceans. Each search visits every cell at most once, and an explicit stack avoids recursion depth problems on 200 × 200 grids.",
    code: [
      cpp(`
void flood(vector<vector<int>>& h, vector<vector<char>>& seen, int sr, int sc) {   // everything that can flow DOWN to this ocean cell
    if (seen[sr][sc]) return;
    seen[sr][sc] = 1;
    stack<pair<int, int>> st;
    st.push({sr, sc});
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!st.empty()) {
        auto cur = st.top(); st.pop();
        for (int k = 0; k < 4; ++k) {
            int nr = cur.first + dr[k], nc = cur.second + dc[k];
            if (nr >= 0 && nc >= 0 && nr < (int)h.size() && nc < (int)h[0].size() && !seen[nr][nc] && h[nr][nc] >= h[cur.first][cur.second]) {
                seen[nr][nc] = 1;                           // walk uphill (or level): water flows the other way
                st.push({nr, nc});
            }
        }
    }
}
vector<vector<int>> pacificAtlantic(vector<vector<int>>& h) {
    int m = h.size(), n = h[0].size();
    vector<vector<char>> pac(m, vector<char>(n, 0)), atl(m, vector<char>(n, 0));
    for (int r = 0; r < m; ++r) { flood(h, pac, r, 0); flood(h, atl, r, n - 1); }
    for (int c = 0; c < n; ++c) { flood(h, pac, 0, c); flood(h, atl, m - 1, c); }
    vector<vector<int>> out;
    for (int r = 0; r < m; ++r)
        for (int c = 0; c < n; ++c)
            if (pac[r][c] && atl[r][c]) out.push_back({r, c});
    return out;
}`, 'C++'),
      java(`
public List<List<Integer>> pacificAtlantic(int[][] h) {
    int m = h.length, n = h[0].length;
    boolean[][] pac = new boolean[m][n], atl = new boolean[m][n];
    for (int r = 0; r < m; r++) { flood(h, pac, r, 0); flood(h, atl, r, n - 1); }
    for (int c = 0; c < n; c++) { flood(h, pac, 0, c); flood(h, atl, m - 1, c); }
    List<List<Integer>> out = new ArrayList<>();
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (pac[r][c] && atl[r][c]) out.add(Arrays.asList(r, c));
    return out;
}
private void flood(int[][] h, boolean[][] seen, int sr, int sc) {   // everything that can flow DOWN to this ocean cell
    if (seen[sr][sc]) return;
    seen[sr][sc] = true;
    Deque<int[]> stack = new ArrayDeque<>();
    stack.push(new int[]{sr, sc});
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!stack.isEmpty()) {
        int[] cur = stack.pop();
        for (int[] d : dirs) {
            int nr = cur[0] + d[0], nc = cur[1] + d[1];
            if (nr >= 0 && nc >= 0 && nr < h.length && nc < h[0].length && !seen[nr][nc] && h[nr][nc] >= h[cur[0]][cur[1]]) {
                seen[nr][nc] = true;                    // walk uphill (or level): water flows the other way
                stack.push(new int[]{nr, nc});
            }
        }
    }
}`, 'Java'),
    ],
    finalComplexity: "O(m·n) time, O(m·n) space.",
    testCases: [
      { input: "5 × 5 sample grid", expected: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]", why: "Classic" },
      { input: "[[1]]", expected: "[[0,0]]", why: "Single cell touches both" },
      { input: "[[2,1],[1,2]]", expected: "all four cells", why: "Every cell reaches both oceans" },
    ],
    takeawaysMd: "When a forward search from every source repeats work, search backwards from the targets (here the two oceans) and intersect.",
  },

  "longest-repeating-character-replacement": {
    understandMd: "You may replace up to k characters of an uppercase string with any letters. Find the length of the longest substring that can be made of a single repeated letter.",
    ioConstraintsMd: "Input: string of up to 10⁵ capital letters and an integer k. Output: the maximum length.",
    edgeCases: ["k = 0 (longest run of one letter)", "k at least the string length", "All letters different", "The best window is at the very end"],
    bruteForceMd: "Check every substring: count letter frequencies and see whether length − maxFrequency ≤ k.",
    bruteComplexity: "O(n²) time or worse.",
    bottleneckMd: "A window is valid when (window length − count of its most frequent letter) ≤ k. Validity only breaks when you extend to the right, so a sliding window can maintain it incrementally.",
    hints: [
      "For a fixed window, how many replacements are needed to make it uniform?", "It is the window length minus the frequency of its most common letter. When is the window valid?", "Expand the right end; if the window needs more than k replacements, move the left end forward.", "Track the best frequency seen; you never need to shrink it, because only a larger frequency can improve the answer.",
    ],
    optimalMd: "Slide a window [left, right]. Maintain letter counts and the highest frequency maxFreq seen in a window so far. After adding the character at right, if (window length − maxFreq) exceeds k, the window needs too many replacements, so move left forward by one. The best answer is the maximum window length. Using a stale (never decreased) maxFreq is safe because the window can only grow when a genuinely larger frequency appears.",
    code: [
      cpp(`
int characterReplacement(string s, int k) {
    int count[26] = {0};
    int left = 0, maxFreq = 0, best = 0;
    for (int right = 0; right < (int)s.size(); ++right) {
        maxFreq = max(maxFreq, ++count[s[right] - 'A']);    // highest frequency seen in a window so far
        while (right - left + 1 - maxFreq > k)              // more than k characters would need replacing
            --count[s[left++] - 'A'];
        best = max(best, right - left + 1);
    }
    return best;
}`, 'C++'),
      java(`
public int characterReplacement(String s, int k) {
    int[] count = new int[26];
    int left = 0, maxFreq = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        maxFreq = Math.max(maxFreq, ++count[s.charAt(right) - 'A']);   // highest frequency seen in a window so far
        while (right - left + 1 - maxFreq > k)          // more than k characters would need replacing
            count[s.charAt(left++) - 'A']--;
        best = Math.max(best, right - left + 1);
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space (26 counters).",
    testCases: [
      { input: "\"ABAB\", k = 2", expected: "4", why: "Replace both B or both A" },
      { input: "\"AABABBA\", k = 1", expected: "4", why: "Window \"AABA\" or \"ABBB\"" },
      { input: "\"A\", k = 0", expected: "1", why: "Single letter" },
      { input: "\"ABCDE\", k = 1", expected: "2", why: "One replacement joins two letters" },
    ],
    takeawaysMd: "For \"make a window uniform with at most k edits\", the cost is length − max frequency, and that condition slides cleanly.",
  },

  "non-overlapping-intervals": {
    understandMd: "Given a collection of intervals, find the minimum number to remove so that the remaining intervals do not overlap (touching endpoints is fine).",
    ioConstraintsMd: "Input: up to 10⁵ intervals with start < end, possibly negative. Output: the minimum number of removals.",
    edgeCases: ["Identical intervals", "Touching intervals such as [1,2] and [2,3]", "One long interval covering many small ones", "Already non-overlapping"],
    bruteForceMd: "Try every subset of intervals and keep the largest non-overlapping subset.",
    bruteComplexity: "O(2ⁿ · n) time.",
    bottleneckMd: "Removing the minimum is the same as keeping the maximum number of compatible intervals: the interval scheduling problem, which a greedy choice solves after sorting by finishing time.",
    hints: [
      "Minimising removals is equivalent to maximising what? How are the two numbers related?", "Among intervals that fit together, which one should you take first to leave the most room afterwards?", "Sort by end time and take an interval whenever it starts at or after the end of the last one you took.", "kept = 0; lastEnd = −∞; for interval sorted by end: if start >= lastEnd: kept++; lastEnd = end. Answer = n − kept.",
    ],
    optimalMd: "Sort the intervals by their end points. Walk through them, keeping an interval whenever its start is at least the end of the last kept interval, which means it does not overlap; otherwise skip (that is one removal). Choosing the interval that finishes earliest always leaves the largest remaining room, so the greedy choice is optimal (an exchange argument). The answer is the total number minus the kept ones.",
    code: [
      cpp(`
int eraseOverlapIntervals(vector<vector<int>>& intervals) {
    sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });   // earliest finish first
    int kept = 0, lastEnd = INT_MIN;
    for (auto& iv : intervals) {
        if (iv[0] >= lastEnd) { ++kept; lastEnd = iv[1]; }  // compatible with everything kept so far
    }
    return (int)intervals.size() - kept;
}`, 'C++'),
      java(`
public int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));   // earliest finish first
    int kept = 0, lastEnd = Integer.MIN_VALUE;
    for (int[] iv : intervals) {
        if (iv[0] >= lastEnd) { kept++; lastEnd = iv[1]; }   // compatible with everything kept so far
    }
    return intervals.length - kept;
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time, O(1) extra space.",
    testCases: [
      { input: "[[1,2],[2,3],[3,4],[1,3]]", expected: "1", why: "Remove [1,3]" },
      { input: "[[1,2],[1,2],[1,2]]", expected: "2", why: "Keep one copy" },
      { input: "[[1,2],[2,3]]", expected: "0", why: "Touching is fine" },
      { input: "[[1,100],[11,22],[1,11],[2,12]]", expected: "2", why: "Keep [1,11] and [11,22]" },
    ],
    takeawaysMd: "Interval scheduling: sort by end time and greedily keep what fits; the answer for \"minimum removals\" is n minus the kept count.",
  },

  "subtree-of-another-tree": {
    understandMd: "Given two binary trees root and subRoot, decide whether root contains a subtree that is identical to subRoot (same structure and values, and including all descendants).",
    ioConstraintsMd: "Input: root with up to 2,000 nodes and subRoot with up to 1,000 nodes. Output: true or false.",
    edgeCases: ["subRoot equals the whole tree", "Matching values but a deeper subtree below (must also match completely)", "A leaf-level match that has extra children in root", "Single-node trees"],
    bruteForceMd: "Serialise both trees and test whether one string occurs inside the other (a valid approach when null markers are included).",
    bruteComplexity: "O(n·m) time with naive search (O(n + m) with KMP).",
    bottleneckMd: "The direct recursive approach is simple: try every node of root as a potential match and compare in lock step; the cost is paid only where values match the root of subRoot.",
    hints: [
      "Use the \"same tree\" check from earlier. At which nodes of root should you call it?", "Every node of root is a candidate for the match; check the current node, then the left and right subtrees.", "Return true as soon as one candidate matches; an empty root can never contain a non-empty subtree.", "isSubtree(root, sub) = same(root, sub) or isSubtree(root.left, sub) or isSubtree(root.right, sub)",
    ],
    optimalMd: "At each node of root, test whether the subtree rooted there is identical to subRoot using the Same Tree comparison; if not, recursively look in the left and right subtrees. A node match is only accepted if all descendants match too, so a larger tree with extra nodes below does not count.",
    code: [
      cpp(`
bool sameTree(TreeNode* a, TreeNode* b) {
    if (!a && !b) return true;
    if (!a || !b || a->val != b->val) return false;
    return sameTree(a->left, b->left) && sameTree(a->right, b->right);
}
bool isSubtree(TreeNode* root, TreeNode* subRoot) {
    if (!root) return false;
    return sameTree(root, subRoot) || isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
}`, 'C++'),
      java(`
public boolean isSubtree(TreeNode root, TreeNode subRoot) {
    if (root == null) return false;
    return sameTree(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}
private boolean sameTree(TreeNode a, TreeNode b) {
    if (a == null && b == null) return true;
    if (a == null || b == null || a.val != b.val) return false;
    return sameTree(a.left, b.left) && sameTree(a.right, b.right);
}`, 'Java'),
    ],
    finalComplexity: "O(n·m) worst case time, O(h) space (h = height of root).",
    testCases: [
      { input: "root [3,4,5,1,2], sub [4,1,2]", expected: "true", why: "Left subtree" },
      { input: "root [3,4,5,1,2,null,null,null,null,0], sub [4,1,2]", expected: "false", why: "Extra node 0 below breaks the match" },
      { input: "root [1], sub [1]", expected: "true", why: "Same tree" },
      { input: "root [1,2], sub [1]", expected: "false", why: "Root has an extra child" },
    ],
    takeawaysMd: "Combine a simple equality check with a traversal of candidate roots; a match must cover every descendant.",
  },

  "palindromic-substrings": {
    understandMd: "Count how many substrings of a string are palindromes. Substrings at different positions are counted separately even if their text is the same.",
    ioConstraintsMd: "Input: string of up to 1,000 lowercase letters. Output: the number of palindromic substrings.",
    edgeCases: ["Single character", "All characters equal (n(n+1)/2 palindromes)", "Even-length palindromes such as \"abba\"", "No palindrome longer than 1"],
    bruteForceMd: "Check every one of the O(n²) substrings for being a palindrome.",
    bruteComplexity: "O(n³) time.",
    bottleneckMd: "Palindromes are symmetric around a centre, and every palindrome contains a smaller palindrome with the same centre. Expanding from each centre counts all palindromes with that centre in a single sweep.",
    hints: [
      "Every palindrome has a centre. How many possible centres does a string of length n have?", "Grow outwards from a centre while the two ends match; every successful step is one more palindrome.", "Do it for odd centres (one character) and even centres (between two characters).", "for c in 0..n-1: for w in 0..1: l = c, r = c + w; while l >= 0 and r < n and s[l] == s[r]: count++; l−−; r++",
    ],
    optimalMd: "For each of the 2n − 1 centres expand outwards while the characters at both ends are equal; each successful expansion corresponds to one palindromic substring, so increment the counter every time. The total work is O(n²) in the worst case (for example a string of identical letters) and O(1) extra space.",
    code: [
      cpp(`
int countSubstrings(string s) {
    int count = 0, n = s.size();
    for (int c = 0; c < n; ++c) {
        for (int w = 0; w < 2; ++w) {                       // w = 0: odd centre, w = 1: even centre
            int l = c, r = c + w;
            while (l >= 0 && r < n && s[l] == s[r]) { ++count; --l; ++r; }
        }
    }
    return count;
}`, 'C++'),
      java(`
public int countSubstrings(String s) {
    int count = 0;
    for (int c = 0; c < s.length(); c++) {
        for (int w = 0; w < 2; w++) {                   // w = 0: odd centre, w = 1: even centre
            int l = c, r = c + w;
            while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { count++; l--; r++; }
        }
    }
    return count;
}`, 'Java'),
    ],
    finalComplexity: "O(n²) time, O(1) space.",
    testCases: [
      { input: "\"abc\"", expected: "3", why: "Only single letters" },
      { input: "\"aaa\"", expected: "6", why: "a, a, a, aa, aa, aaa" },
      { input: "\"abba\"", expected: "6", why: "Includes the even palindromes \"bb\" and \"abba\"" },
      { input: "\"a\"", expected: "1", why: "Single character" },
    ],
    takeawaysMd: "Counting palindromic substrings is centre expansion again; each successful expansion is one more palindrome.",
  },

  "longest-common-subsequence": {
    understandMd: "Given two strings, find the length of their longest common subsequence: the longest sequence of characters that appears in both strings in the same order (not necessarily contiguously).",
    ioConstraintsMd: "Input: two strings of up to 1,000 lowercase letters. Output: the length of the LCS.",
    edgeCases: ["One string empty (answer 0)", "No common characters", "Identical strings", "Repeated characters that could be matched in several ways"],
    bruteForceMd: "Recursively compare the first characters: if they match take them, otherwise try dropping one from either string.",
    bruteComplexity: "O(2^(n+m)) time without memoisation.",
    bottleneckMd: "The recursion on prefixes recomputes the same pairs (i, j) many times. There are only n·m distinct pairs, so storing them turns exponential time into O(n·m).",
    hints: [
      "Define lcs(i, j) for the first i characters of a and the first j characters of b. What happens if a[i−1] == b[j−1]?", "If the last characters match, they can be part of the answer: 1 + lcs(i−1, j−1).", "If they differ, one of them is not used: take the better of lcs(i−1, j) and lcs(i, j−1).", "Fill a (n+1) × (m+1) table, with row 0 and column 0 equal to 0.",
    ],
    optimalMd: "Let dp[i][j] be the LCS length of the first i characters of a and the first j characters of b. When the last characters are equal, dp[i][j] = dp[i−1][j−1] + 1. Otherwise dp[i][j] = max(dp[i−1][j], dp[i][j−1]). The first row and column are zero (an empty prefix). The answer is dp[n][m]. Only the previous row is needed if memory matters.",
    code: [
      cpp(`
int longestCommonSubsequence(string a, string b) {
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));   // dp[i][j] = LCS length of a[0..i) and b[0..j)
    for (int i = 1; i <= n; ++i)
        for (int j = 1; j <= m; ++j)
            dp[i][j] = a[i - 1] == b[j - 1]
                           ? dp[i - 1][j - 1] + 1           // matching characters extend the LCS
                           : max(dp[i - 1][j], dp[i][j - 1]);
    return dp[n][m];
}`, 'C++'),
      java(`
public int longestCommonSubsequence(String a, String b) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];                 // dp[i][j] = LCS length of a[0..i) and b[0..j)
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                    ? dp[i - 1][j - 1] + 1              // matching characters extend the LCS
                    : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[n][m];
}`, 'Java'),
    ],
    finalComplexity: "O(n·m) time, O(n·m) space (O(min(n, m)) with two rows).",
    testCases: [
      { input: "\"abcde\", \"ace\"", expected: "3", why: "\"ace\"" },
      { input: "\"abc\", \"abc\"", expected: "3", why: "Identical" },
      { input: "\"abc\", \"def\"", expected: "0", why: "Nothing in common" },
      { input: "\"oxcpqrsvwf\", \"shmtulqrypy\"", expected: "2", why: "\"qr\"" },
    ],
    takeawaysMd: "Two-sequence DP: match on equal last characters, otherwise drop one of them; the table is indexed by prefix lengths.",
  },

  "add-two-numbers": {
    understandMd: "Two non-negative integers are stored as linked lists with the digits in reverse order (the least significant digit first). Return their sum as a list in the same format.",
    ioConstraintsMd: "Input: two non-empty lists of up to 100 digits each, no leading zeros except the number 0 itself. Output: the head of the sum list.",
    edgeCases: ["Lists of different lengths", "A final carry that adds a new digit (5 + 5 = 10)", "Both numbers 0", "Very long lists (cannot convert to a built-in integer)"],
    bruteForceMd: "Convert each list to an integer, add them, and rebuild a list. (This overflows for long lists.)",
    bruteComplexity: "O(n) time but incorrect beyond 64-bit values.",
    bottleneckMd: "Reverse order is a gift: the least significant digits are at the head, which is exactly the order of grade-school addition, so you can add digit by digit with a carry.",
    hints: [
      "Add 342 + 465 by hand starting from the right. What do you carry along?", "The lists already start with the least significant digit. What state do you need while walking both lists?", "At each step add the two digits (treat a missing digit as 0) and the carry; the new digit is sum % 10 and the new carry is sum / 10.", "Loop while either list has nodes or the carry is non-zero, appending to a dummy-headed result.",
    ],
    optimalMd: "Walk both lists together. At each position add the two digits (0 for a list that has ended) plus the carry from the previous position, append sum % 10 as a new node and keep sum / 10 as the next carry. Continue until both lists are exhausted and no carry remains; the last condition produces the extra leading digit for sums like 5 + 5. A dummy head simplifies appending.",
    code: [
      cpp(`
ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
    ListNode dummy, *tail = &dummy;
    int carry = 0;
    while (l1 || l2 || carry) {
        int sum = carry + (l1 ? l1->val : 0) + (l2 ? l2->val : 0);
        tail->next = new ListNode(sum % 10);
        tail = tail->next;
        carry = sum / 10;                                   // 0 or 1
        if (l1) l1 = l1->next;
        if (l2) l2 = l2->next;
    }
    return dummy.next;
}`, 'C++'),
      java(`
public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(), tail = dummy;
    int carry = 0;
    while (l1 != null || l2 != null || carry != 0) {
        int sum = carry + (l1 != null ? l1.val : 0) + (l2 != null ? l2.val : 0);
        tail.next = new ListNode(sum % 10);
        tail = tail.next;
        carry = sum / 10;                               // 0 or 1
        if (l1 != null) l1 = l1.next;
        if (l2 != null) l2 = l2.next;
    }
    return dummy.next;
}`, 'Java'),
    ],
    finalComplexity: "O(max(m, n)) time, O(max(m, n)) space for the result.",
    testCases: [
      { input: "[2,4,3] + [5,6,4]", expected: "[7,0,8]", why: "342 + 465 = 807" },
      { input: "[0] + [0]", expected: "[0]", why: "Zero" },
      { input: "[9,9,9,9,9,9,9] + [9,9,9,9]", expected: "[8,9,9,9,0,0,0,1]", why: "Different lengths and a final carry" },
      { input: "[5] + [5]", expected: "[0,1]", why: "Carry creates a new digit" },
    ],
    takeawaysMd: "Digit-by-digit arithmetic on linked lists is a loop with a carry; keep going while a list or the carry remains.",
  },

  "median-of-two-sorted-arrays": {
    understandMd: "Given two sorted arrays, find the median of the combined data without merging them. The overall time should be O(log(m + n)).",
    ioConstraintsMd: "Input: two sorted arrays with m and n elements (0 ≤ m, n ≤ 1,000 and m + n ≥ 1). Output: the median as a double.",
    edgeCases: ["One array empty", "Total length even versus odd", "All elements of one array smaller than the other", "Duplicates across the arrays"],
    bruteForceMd: "Merge the two arrays and pick the middle element(s).",
    bruteComplexity: "O(m + n) time and space.",
    bottleneckMd: "The median only needs a partition of the combined data into two halves of the right size where everything on the left is no larger than everything on the right. You can search for that partition in the shorter array with binary search, never touching most elements.",
    hints: [
      "What property must a left half and a right half of the combined data satisfy for the median to be at their boundary?", "Choose i elements from the first array and j = half − i from the second as the left half. Which four values must you compare?", "The partition is valid when a[i−1] ≤ b[j] and b[j−1] ≤ a[i]. If a[i−1] is too big, move i left; otherwise move it right.", "Binary search i over the shorter array; use ±∞ sentinels at the boundaries.",
    ],
    optimalMd: "Binary search how many elements i of the shorter array belong to the left half; the left half then has j = (m + n + 1) / 2 − i elements from the other array. Compare the boundary values aLeft, aRight, bLeft, bRight (with ±∞ when a side is empty). If aLeft > bRight the left half took too many from a, so search lower; if bLeft > aRight, search higher; otherwise the partition is correct. The median is max(aLeft, bLeft) for an odd total, or the mean of that and min(aRight, bRight) for an even total.",
    code: [
      cpp(`
double findMedianSortedArrays(vector<int>& a, vector<int>& b) {
    if (a.size() > b.size()) return findMedianSortedArrays(b, a);   // binary search on the shorter array
    int m = a.size(), n = b.size(), half = (m + n + 1) / 2;
    int lo = 0, hi = m;
    while (lo <= hi) {
        int i = (lo + hi) / 2, j = half - i;                // i items from a and j from b form the left half
        int aLeft = i == 0 ? INT_MIN : a[i - 1], aRight = i == m ? INT_MAX : a[i];
        int bLeft = j == 0 ? INT_MIN : b[j - 1], bRight = j == n ? INT_MAX : b[j];
        if (aLeft > bRight) hi = i - 1;                     // took too many from a
        else if (bLeft > aRight) lo = i + 1;                // took too few from a
        else {                                              // a valid partition: every left item <= every right item
            int leftMax = max(aLeft, bLeft);
            if ((m + n) % 2 == 1) return leftMax;
            return (leftMax + (double)min(aRight, bRight)) / 2.0;
        }
    }
    return 0.0;                                             // unreachable for sorted input
}`, 'C++'),
      java(`
public double findMedianSortedArrays(int[] a, int[] b) {
    if (a.length > b.length) return findMedianSortedArrays(b, a);   // binary search on the shorter array
    int m = a.length, n = b.length, half = (m + n + 1) / 2;
    int lo = 0, hi = m;
    while (lo <= hi) {
        int i = (lo + hi) / 2, j = half - i;            // i items from a and j from b form the left half
        int aLeft = i == 0 ? Integer.MIN_VALUE : a[i - 1], aRight = i == m ? Integer.MAX_VALUE : a[i];
        int bLeft = j == 0 ? Integer.MIN_VALUE : b[j - 1], bRight = j == n ? Integer.MAX_VALUE : b[j];
        if (aLeft > bRight) hi = i - 1;                 // took too many from a
        else if (bLeft > aRight) lo = i + 1;            // took too few from a
        else {                                          // a valid partition: every left item <= every right item
            int leftMax = Math.max(aLeft, bLeft);
            if ((m + n) % 2 == 1) return leftMax;
            return (leftMax + (double) Math.min(aRight, bRight)) / 2.0;
        }
    }
    return 0.0;                                         // unreachable for sorted input
}`, 'Java'),
    ],
    finalComplexity: "O(log(min(m, n))) time, O(1) space.",
    testCases: [
      { input: "[1,3] and [2]", expected: "2.0", why: "Odd total" },
      { input: "[1,2] and [3,4]", expected: "2.5", why: "Even total, no interleaving" },
      { input: "[] and [1]", expected: "1.0", why: "One array empty" },
      { input: "[0,0] and [0,0]", expected: "0.0", why: "All equal" },
    ],
    takeawaysMd: "To find a rank in two sorted arrays, binary-search the partition point in the shorter array and validate it with the four boundary values.",
  },

  "reverse-integer": {
    understandMd: "Reverse the digits of a signed 32-bit integer. If the reversed value does not fit in a signed 32-bit integer, return 0.",
    ioConstraintsMd: "Input: an integer in [−2³¹, 2³¹ − 1]. Output: the reversed integer or 0 on overflow. You may not use 64-bit integers.",
    edgeCases: ["Trailing zeros (120 becomes 21)", "Negative numbers", "Overflow in either direction", "The minimum value −2³¹ (its absolute value does not fit)"],
    bruteForceMd: "Convert to a string, reverse it and parse it back, catching the overflow.",
    bruteComplexity: "O(digits) time but relies on exceptions or wider types.",
    bottleneckMd: "The only tricky part is detecting overflow before it happens, because the multiplication by 10 and the addition of a digit can exceed the 32-bit range.",
    hints: [
      "Pop the last digit with % 10 and push it onto the result with * 10 + digit. When can this overflow?", "Before multiplying, compare the current result with INT_MAX / 10.", "If rev > INT_MAX / 10 it overflows; if rev == INT_MAX / 10 the new digit must be ≤ 7 (the last digit of INT_MAX). Mirror the check for negatives with −8.", "x % 10 keeps the sign in most languages, so the same loop handles negatives.",
    ],
    optimalMd: "Repeatedly take the last digit (x % 10, which keeps the sign for negative numbers) and append it to the result. Before each append, check whether result * 10 + digit would leave the 32-bit range by comparing result with INT_MAX / 10 (and INT_MIN / 10), including the final-digit limits 7 and −8; return 0 if it would. No wider type is needed.",
    code: [
      cpp(`
int reverse(int x) {
    int rev = 0;
    while (x != 0) {
        int digit = x % 10;
        x /= 10;
        if (rev > INT_MAX / 10 || (rev == INT_MAX / 10 && digit > 7)) return 0;    // would overflow
        if (rev < INT_MIN / 10 || (rev == INT_MIN / 10 && digit < -8)) return 0;
        rev = rev * 10 + digit;
    }
    return rev;
}`, 'C++'),
      java(`
public int reverse(int x) {
    int rev = 0;
    while (x != 0) {
        int digit = x % 10;
        x /= 10;
        if (rev > Integer.MAX_VALUE / 10 || (rev == Integer.MAX_VALUE / 10 && digit > 7)) return 0;    // would overflow
        if (rev < Integer.MIN_VALUE / 10 || (rev == Integer.MIN_VALUE / 10 && digit < -8)) return 0;
        rev = rev * 10 + digit;
    }
    return rev;
}`, 'Java'),
    ],
    finalComplexity: "O(log₁₀ |x|) time, O(1) space.",
    testCases: [
      { input: "123", expected: "321", why: "Basic" },
      { input: "−123", expected: "−321", why: "Sign preserved" },
      { input: "120", expected: "21", why: "Trailing zero disappears" },
      { input: "1534236469", expected: "0", why: "Reverse overflows" },
      { input: "−2147483648", expected: "0", why: "Reverse overflows" },
    ],
    takeawaysMd: "Check for overflow before the multiply-add step, using INT_MAX / 10 and the allowed last digit.",
  },

  "regular-expression-matching": {
    understandMd: "Implement matching of a string against a pattern that supports \".\" (any single character) and \"*\" (zero or more of the preceding element). The match must cover the entire string.",
    ioConstraintsMd: "Input: string s (up to 20 characters) and pattern p (up to 20 characters, each \"*\" follows a valid character). Output: true if the whole string matches.",
    edgeCases: ["Empty string with a pattern like \"a*\"", "\".*\" matches everything", "\"*\" that must match zero copies", "Pattern longer than the string"],
    bruteForceMd: "Recursive matching that tries every way to expand each \"*\".",
    bruteComplexity: "Exponential in the worst case.",
    bottleneckMd: "The recursion revisits the same (string position, pattern position) pairs. A table indexed by those two positions turns it into O(n·m).",
    hints: [
      "Define dp[i][j] as \"the first i characters of s match the first j characters of p\". What is dp[0][0]?", "If p[j−1] is a normal character or \".\", it must match s[i−1] and the earlier prefixes must match.", "If p[j−1] is \"*\", it either stands for zero copies of the previous element (look at dp[i][j−2]) or for one more copy (needs the previous element to match s[i−1] and dp[i−1][j]).", "Initialise row 0: a pattern like \"a*b*\" can match the empty string.",
    ],
    optimalMd: "Let dp[i][j] be true when s[0..i) matches p[0..j). The empty pattern matches the empty string, and a pattern made only of \"x*\" groups matches it too. For a normal character or \".\", dp[i][j] = dp[i−1][j−1] when the characters are compatible. For \"*\", the element before it may be used zero times (dp[i][j−2]) or one more time (dp[i−1][j], allowed only if that element matches s[i−1]). The answer is dp[n][m].",
    code: [
      cpp(`
bool isMatch(string s, string p) {
    int n = s.size(), m = p.size();
    vector<vector<char>> dp(n + 1, vector<char>(m + 1, 0));         // dp[i][j]: s[0..i) matches p[0..j)
    dp[0][0] = 1;
    for (int j = 2; j <= m; ++j)
        if (p[j - 1] == '*') dp[0][j] = dp[0][j - 2];       // "x*" can match the empty string
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            char pc = p[j - 1];
            if (pc == '*') {
                dp[i][j] = dp[i][j - 2];                    // zero copies of the preceding element
                char prev = p[j - 2];
                if (prev == '.' || prev == s[i - 1]) dp[i][j] |= dp[i - 1][j];   // one more copy
            } else if (pc == '.' || pc == s[i - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            }
        }
    }
    return dp[n][m];
}`, 'C++'),
      java(`
public boolean isMatch(String s, String p) {
    int n = s.length(), m = p.length();
    boolean[][] dp = new boolean[n + 1][m + 1];         // dp[i][j]: s[0..i) matches p[0..j)
    dp[0][0] = true;
    for (int j = 2; j <= m; j++)
        if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];       // "x*" can match the empty string
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            char pc = p.charAt(j - 1);
            if (pc == '*') {
                dp[i][j] = dp[i][j - 2];                // zero copies of the preceding element
                char prev = p.charAt(j - 2);
                if (prev == '.' || prev == s.charAt(i - 1)) dp[i][j] |= dp[i - 1][j];   // one more copy
            } else if (pc == '.' || pc == s.charAt(i - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            }
        }
    }
    return dp[n][m];
}`, 'Java'),
    ],
    finalComplexity: "O(n·m) time, O(n·m) space.",
    testCases: [
      { input: "\"aa\", \"a\"", expected: "false", why: "Pattern too short" },
      { input: "\"aa\", \"a*\"", expected: "true", why: "Star repeats" },
      { input: "\"ab\", \".*\"", expected: "true", why: "Dot-star matches anything" },
      { input: "\"aab\", \"c*a*b\"", expected: "true", why: "First star used zero times" },
      { input: "\"mississippi\", \"mis*is*p*.\"", expected: "false", why: "Trailing dot needs one more character" },
    ],
    takeawaysMd: "Pattern matching with \".\" and \"*\" is a prefix DP; the star either consumes zero copies or one more copy of the preceding element.",
  },

  "letter-combinations-of-a-phone-number": {
    understandMd: "Given a string of digits 2 to 9, return every letter combination that the digits could represent on a classic phone keypad (2 = abc, 3 = def, …, 9 = wxyz).",
    ioConstraintsMd: "Input: string of 0 to 4 digits. Output: all combinations in any order; an empty input gives an empty list.",
    edgeCases: ["Empty input (return an empty list, not [\"\"])", "A single digit", "Digits 7 and 9 have four letters", "Maximum length 4 (at most 256 combinations)"],
    bruteForceMd: "Nested loops, one per digit. This only works for a fixed number of digits.",
    bruteComplexity: "Not general.",
    bottleneckMd: "The number of digits varies, so the nesting depth varies. Recursion (backtracking) provides a loop of variable depth.",
    hints: [
      "How many choices does each digit give, and are the choices of different digits independent?", "Build the answer one position at a time: for the current digit try each of its letters.", "When the built string is as long as the input, add it to the result; then undo the last letter and try the next one.", "build(i): if i == len: save; for ch in letters[digit[i]]: append; build(i+1); remove",
    ],
    optimalMd: "Map each digit to its letters and run a depth-first search over positions. At position i, append each possible letter in turn, recurse to position i + 1, and remove the letter again (backtrack). When all positions are filled save the current string. Handle the empty input explicitly because the recursion would otherwise return a single empty string.",
    code: [
      cpp(`
const char* KEYS[] = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
void build(const string& d, int i, string& cur, vector<string>& out) {
    if (i == (int)d.size()) { out.push_back(cur); return; }
    for (const char* p = KEYS[d[i] - '0']; *p; ++p) {
        cur.push_back(*p);
        build(d, i + 1, cur, out);
        cur.pop_back();                                     // backtrack
    }
}
vector<string> letterCombinations(string digits) {
    vector<string> out;
    if (digits.empty()) return out;
    string cur;
    build(digits, 0, cur, out);
    return out;
}`, 'C++'),
      java(`
private static final String[] KEYS = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
public List<String> letterCombinations(String digits) {
    List<String> out = new ArrayList<>();
    if (digits.isEmpty()) return out;
    build(digits, 0, new StringBuilder(), out);
    return out;
}
private void build(String d, int i, StringBuilder cur, List<String> out) {
    if (i == d.length()) { out.add(cur.toString()); return; }
    for (char ch : KEYS[d.charAt(i) - '0'].toCharArray()) {
        cur.append(ch);
        build(d, i + 1, cur, out);
        cur.deleteCharAt(cur.length() - 1);             // backtrack
    }
}`, 'Java'),
    ],
    finalComplexity: "O(4ⁿ · n) time for n digits (the output size), O(n) recursion depth.",
    testCases: [
      { input: "\"23\"", expected: "[ad,ae,af,bd,be,bf,cd,ce,cf]", why: "Two digits" },
      { input: "\"\"", expected: "[]", why: "Empty input" },
      { input: "\"2\"", expected: "[a,b,c]", why: "One digit" },
      { input: "\"79\"", expected: "16 combinations", why: "Four letters each" },
    ],
    takeawaysMd: "Variable-depth \"one choice per position\" problems are backtracking over the positions.",
  },

  "generate-parentheses": {
    understandMd: "Given n pairs of parentheses, generate every well-formed (balanced) combination.",
    ioConstraintsMd: "Input: n between 1 and 8. Output: all balanced strings of length 2n, in any order. The count is the n-th Catalan number.",
    edgeCases: ["n = 1", "Strings that must start with \"(\" ", "Not producing unbalanced prefixes like \"())(\"", "Duplicates must not appear"],
    bruteForceMd: "Generate all 2^(2n) strings of brackets and keep the balanced ones.",
    bruteComplexity: "O(2^(2n) · n) time.",
    bottleneckMd: "Most strings are invalid, and an invalid prefix can never become valid, so you should only extend prefixes that are still promising.",
    hints: [
      "What makes a prefix of a balanced string valid? How many closing brackets may it contain compared with opening ones?", "Track how many \"(\" and \")\" you have used. When may you add \"(\"? When may you add \")\"?", "Add \"(\" while open < n; add \")\" only while close < open.", "Stop when the string has length 2n and record it; backtrack after each choice.",
    ],
    optimalMd: "Build the string character by character, tracking the numbers of opening and closing brackets used. You may add an opening bracket while fewer than n have been used, and a closing bracket only while there are more opening than closing brackets so far. Every string built this way is balanced and every balanced string is built exactly once, so no filtering is needed.",
    code: [
      cpp(`
void build(int n, int open, int close, string& cur, vector<string>& out) {
    if ((int)cur.size() == 2 * n) { out.push_back(cur); return; }
    if (open < n) {                                         // we may still open a bracket
        cur.push_back('('); build(n, open + 1, close, cur, out); cur.pop_back();
    }
    if (close < open) {                                     // we may close only an already opened bracket
        cur.push_back(')'); build(n, open, close + 1, cur, out); cur.pop_back();
    }
}
vector<string> generateParenthesis(int n) {
    vector<string> out;
    string cur;
    build(n, 0, 0, cur, out);
    return out;
}`, 'C++'),
      java(`
public List<String> generateParenthesis(int n) {
    List<String> out = new ArrayList<>();
    build(n, 0, 0, new StringBuilder(), out);
    return out;
}
private void build(int n, int open, int close, StringBuilder cur, List<String> out) {
    if (cur.length() == 2 * n) { out.add(cur.toString()); return; }
    if (open < n) {                                     // we may still open a bracket
        cur.append('('); build(n, open + 1, close, cur, out); cur.deleteCharAt(cur.length() - 1);
    }
    if (close < open) {                                 // we may close only an already opened bracket
        cur.append(')'); build(n, open, close + 1, cur, out); cur.deleteCharAt(cur.length() - 1);
    }
}`, 'Java'),
    ],
    finalComplexity: "O(Cₙ · n) time where Cₙ is the n-th Catalan number (≈ 4ⁿ / (n^1.5)), O(n) recursion depth.",
    testCases: [
      { input: "n = 3", expected: "[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]", why: "Five combinations" },
      { input: "n = 1", expected: "[\"()\"]", why: "Smallest case" },
      { input: "n = 5", expected: "42 strings", why: "Catalan number C₅" },
    ],
    takeawaysMd: "For constructive problems with a validity rule, extend only prefixes that can still be completed (here close < open and open < n).",
  },

  "reverse-nodes-in-k-group": {
    understandMd: "Reverse the nodes of a linked list k at a time and return the modified list. If the number of nodes is not a multiple of k, the final group of fewer than k nodes stays in its original order. Only node links may change, not values.",
    ioConstraintsMd: "Input: head of a list with up to 5,000 nodes and 1 ≤ k ≤ length. Output: the new head. Aim for O(1) extra space.",
    edgeCases: ["k = 1 (no change)", "k equals the list length", "Length not divisible by k (leftover group stays unreversed)", "Single node"],
    bruteForceMd: "Store the nodes in an array, reverse each block of k in the array and relink.",
    bruteComplexity: "O(n) time, O(n) space.",
    bottleneckMd: "The array only helps to reverse in place; you can reverse each group directly in the list if you can find the group end first and reconnect the neighbours correctly.",
    hints: [
      "For each group you need to know whether k nodes are available. How do you check without modifying anything?", "Keep a pointer groupPrev to the node just before the group, and find the k-th node of the group.", "Reverse the k nodes by the usual three-pointer loop, but make the first reversed node point to the node after the group.", "Reconnect groupPrev to the new group head and move groupPrev to the old first node (now the tail).",
    ],
    optimalMd: "Use a dummy head and a pointer groupPrev to the node before the current group. For each group, walk k steps from groupPrev to find its last node; if fewer than k nodes remain, stop. Otherwise reverse the k nodes in place using a loop whose starting \"previous\" is the node after the group (so the old first node ends up linked to the next group). Then link groupPrev to the old last node, which is now the group head, and advance groupPrev to the old first node, which is now the tail.",
    code: [
      cpp(`
ListNode* reverseKGroup(ListNode* head, int k) {
    ListNode dummy(0, head);
    ListNode* groupPrev = &dummy;
    while (true) {
        ListNode* kth = groupPrev;
        for (int i = 0; i < k && kth; ++i) kth = kth->next;
        if (!kth) break;                                    // fewer than k nodes remain: leave them as they are
        ListNode *groupNext = kth->next, *prev = groupNext, *cur = groupPrev->next;
        while (cur != groupNext) {                          // reverse the group and link its end to the next group
            ListNode* nx = cur->next;
            cur->next = prev;
            prev = cur;
            cur = nx;
        }
        ListNode* oldFirst = groupPrev->next;               // after reversing it is the tail of the group
        groupPrev->next = kth;                              // kth is the new head of the group
        groupPrev = oldFirst;
    }
    return dummy.next;
}`, 'C++'),
      java(`
public ListNode reverseKGroup(ListNode head, int k) {
    ListNode dummy = new ListNode(0, head), groupPrev = dummy;
    while (true) {
        ListNode kth = groupPrev;
        for (int i = 0; i < k && kth != null; i++) kth = kth.next;
        if (kth == null) break;                         // fewer than k nodes remain: leave them as they are
        ListNode groupNext = kth.next, prev = groupNext, cur = groupPrev.next;
        while (cur != groupNext) {                      // reverse the group and link its end to the next group
            ListNode nx = cur.next;
            cur.next = prev;
            prev = cur;
            cur = nx;
        }
        ListNode oldFirst = groupPrev.next;             // after reversing it is the tail of the group
        groupPrev.next = kth;                           // kth is the new head of the group
        groupPrev = oldFirst;
    }
    return dummy.next;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,2,3,4,5], k = 2", expected: "[2,1,4,3,5]", why: "Leftover single node stays" },
      { input: "[1,2,3,4,5], k = 3", expected: "[3,2,1,4,5]", why: "Leftover pair stays" },
      { input: "[1,2,3,4], k = 4", expected: "[4,3,2,1]", why: "Whole list one group" },
      { input: "[1], k = 1", expected: "[1]", why: "Single node" },
    ],
    takeawaysMd: "In-place group reversal needs three things: a dummy head, a pointer to the node before the group, and a pre-check that k nodes exist.",
  },

  "valid-sudoku": {
    understandMd: "Determine whether a partially filled 9 × 9 Sudoku board is valid: no digit repeats within a row, a column or any of the nine 3 × 3 boxes. Only filled cells are checked; the board need not be solvable.",
    ioConstraintsMd: "Input: 9 × 9 grid of characters \"1\"..\"9\" or \".\". Output: true or false.",
    edgeCases: ["Duplicate only inside a box (not in any row or column)", "Empty board", "The same digit in different rows but the same column", "A board that is valid but unsolvable (still true)"],
    bruteForceMd: "For every cell, scan its row, column and box for the same digit.",
    bruteComplexity: "O(81 · 27) time, which is fine for a fixed board but repeats work.",
    bottleneckMd: "Scanning repeats comparisons. Remembering which digits already appeared in each row, column and box gives O(1) membership checks.",
    hints: [
      "What three groups of cells must not contain the same digit twice?", "Keep a \"seen\" table for every row, every column and every box. How do you compute the box number of (r, c)?", "Box index = (r / 3) × 3 + c / 3.", "For each filled cell check the three tables, then mark the digit in all three.",
    ],
    optimalMd: "Scan the board once. For each filled cell compute its digit index and its box index (r / 3) × 3 + c / 3. If the digit is already marked in its row, column or box, the board is invalid; otherwise mark it in all three tables. Because the board is a fixed 9 × 9, the algorithm is constant time.",
    code: [
      cpp(`
bool isValidSudoku(vector<vector<char>>& board) {
    bool rows[9][9] = {}, cols[9][9] = {}, boxes[9][9] = {};
    for (int r = 0; r < 9; ++r) {
        for (int c = 0; c < 9; ++c) {
            char ch = board[r][c];
            if (ch == '.') continue;
            int d = ch - '1', b = (r / 3) * 3 + c / 3;      // digit index and 3x3 box index
            if (rows[r][d] || cols[c][d] || boxes[b][d]) return false;
            rows[r][d] = cols[c][d] = boxes[b][d] = true;
        }
    }
    return true;
}`, 'C++'),
      java(`
public boolean isValidSudoku(char[][] board) {
    boolean[][] rows = new boolean[9][9], cols = new boolean[9][9], boxes = new boolean[9][9];
    for (int r = 0; r < 9; r++) {
        for (int c = 0; c < 9; c++) {
            char ch = board[r][c];
            if (ch == '.') continue;
            int d = ch - '1', b = (r / 3) * 3 + c / 3;  // digit index and 3x3 box index
            if (rows[r][d] || cols[c][d] || boxes[b][d]) return false;
            rows[r][d] = cols[c][d] = boxes[b][d] = true;
        }
    }
    return true;
}`, 'Java'),
    ],
    finalComplexity: "O(1) time for the fixed 9 × 9 size (O(n²) for an n × n board), O(1) space.",
    testCases: [
      { input: "The standard valid sample board", expected: "true", why: "No duplicates anywhere" },
      { input: "Same board with the first cell changed to 8", expected: "false", why: "Duplicate 8 in the first column and box" },
      { input: "First row becomes 5 3 3", expected: "false", why: "Duplicate 3 in a row" },
    ],
    takeawaysMd: "Validity checks for rows, columns and boxes are three \"seen\" tables indexed by group number.",
  },

  "combination-sum-ii": {
    understandMd: "Given candidate numbers that may contain duplicates and a target, list all unique combinations that sum to the target where each candidate element may be used at most once.",
    ioConstraintsMd: "Input: up to 100 candidates (values 1 to 50) and a target up to 30. Output: unique combinations in any order; no duplicate combinations.",
    edgeCases: ["Duplicate values in the input (must not give duplicate combinations)", "No combination exists", "Candidate larger than the target", "All candidates equal"],
    bruteForceMd: "Generate all subsets, keep those with the target sum, and de-duplicate with a set.",
    bruteComplexity: "O(2ⁿ · n) time plus de-duplication overhead.",
    bottleneckMd: "Choosing among equal values in different orders produces identical combinations. Sorting the candidates and skipping a value that equals the previous one at the same recursion depth removes the duplicates while keeping combinations that use the repeated value more than once.",
    hints: [
      "How is this different from Combination Sum? Which two rules change?", "Each element can be used once: recurse on i + 1. The input has duplicates: how can you stop two equal values from starting the same branch twice?", "Sort the array. In the loop at one depth, skip c[i] if i > start and c[i] == c[i−1].", "Stop the loop when c[i] > remaining, because the array is sorted.",
    ],
    optimalMd: "Sort the candidates and backtrack with (start index, remaining sum). In the loop, skip an element equal to its predecessor unless it is the first choice at this depth; this prevents starting two identical branches. Take c[i] and recurse from i + 1 because each element may be used only once; stop the loop as soon as c[i] exceeds the remaining sum. Save the path when the remaining sum reaches zero.",
    code: [
      cpp(`
void collect(vector<int>& c, int remain, int start, vector<int>& path, vector<vector<int>>& out) {
    if (remain == 0) { out.push_back(path); return; }
    for (int i = start; i < (int)c.size() && c[i] <= remain; ++i) {
        if (i > start && c[i] == c[i - 1]) continue;        // skip a duplicate value at the same depth
        path.push_back(c[i]);
        collect(c, remain - c[i], i + 1, path, out);        // i + 1: each element is used at most once
        path.pop_back();
    }
}
vector<vector<int>> combinationSum2(vector<int>& candidates, int target) {
    vector<vector<int>> out;
    vector<int> path;
    sort(candidates.begin(), candidates.end());
    collect(candidates, target, 0, path, out);
    return out;
}`, 'C++'),
      java(`
public List<List<Integer>> combinationSum2(int[] candidates, int target) {
    List<List<Integer>> out = new ArrayList<>();
    Arrays.sort(candidates);
    collect(candidates, target, 0, new ArrayList<>(), out);
    return out;
}
private void collect(int[] c, int remain, int start, List<Integer> path, List<List<Integer>> out) {
    if (remain == 0) { out.add(new ArrayList<>(path)); return; }
    for (int i = start; i < c.length && c[i] <= remain; i++) {
        if (i > start && c[i] == c[i - 1]) continue;    // skip a duplicate value at the same depth
        path.add(c[i]);
        collect(c, remain - c[i], i + 1, path, out);    // i + 1: each element is used at most once
        path.remove(path.size() - 1);
    }
}`, 'Java'),
    ],
    finalComplexity: "Exponential in the worst case (bounded by the number of distinct subsets), O(n) recursion depth.",
    testCases: [
      { input: "[10,1,2,7,6,1,5], target 8", expected: "[[1,1,6],[1,2,5],[1,7],[2,6]]", why: "Duplicate 1s allowed within one combination only" },
      { input: "[2,5,2,1,2], target 5", expected: "[[1,2,2],[5]]", why: "Three 2s, no duplicate answers" },
      { input: "[1], target 2", expected: "[]", why: "No solution" },
    ],
    takeawaysMd: "For subsets with duplicates: sort, then skip a value equal to the previous one at the same depth (i > start).",
  },

  "trapping-rain-water": {
    understandMd: "An elevation map is given as an array of non-negative bar heights, each of width 1. Compute how much water is trapped between the bars after raining.",
    ioConstraintsMd: "Input: array of up to 20,000 heights (0 to 10⁵). Output: the total trapped water as an integer.",
    edgeCases: ["Fewer than three bars (no water)", "Strictly increasing or decreasing heights", "A deep valley between two tall walls", "Plateau of equal heights"],
    bruteForceMd: "For each bar compute the tallest bar to its left and to its right; the water above it is min(leftMax, rightMax) − height.",
    bruteComplexity: "O(n²) time with rescanning, or O(n) time and O(n) space with prefix/suffix maxima arrays.",
    bottleneckMd: "The water above a bar is limited by the lower of the two surrounding maxima. Two pointers can track the left and right maxima on the fly, always resolving the side with the lower wall.",
    hints: [
      "What determines how much water sits above one bar?", "Precompute the maximum height to the left and to the right of every bar. Can you avoid the two extra arrays?", "Move two pointers inward. The side with the smaller current height is limited by its own running maximum, because the other side already has a wall at least as high.", "if h[l] < h[r]: leftMax = max(leftMax, h[l]); water += leftMax − h[l]; l++ else mirror on the right.",
    ],
    optimalMd: "Keep pointers at both ends with running maxima leftMax and rightMax. At each step process the side whose bar is lower: its water level is determined by its own side's maximum, since the opposite side already has a bar at least that tall. Add max − height to the answer and advance that pointer. Every bar is processed exactly once.",
    code: [
      cpp(`
int trap(vector<int>& height) {
    int left = 0, right = (int)height.size() - 1, leftMax = 0, rightMax = 0, water = 0;
    while (left < right) {
        if (height[left] < height[right]) {                 // the right wall is higher, so only leftMax limits the water here
            leftMax = max(leftMax, height[left]);
            water += leftMax - height[left++];
        } else {
            rightMax = max(rightMax, height[right]);
            water += rightMax - height[right--];
        }
    }
    return water;
}`, 'C++'),
      java(`
public int trap(int[] height) {
    int left = 0, right = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
    while (left < right) {
        if (height[left] < height[right]) {             // the right wall is higher, so only leftMax limits the water here
            leftMax = Math.max(leftMax, height[left]);
            water += leftMax - height[left++];
        } else {
            rightMax = Math.max(rightMax, height[right]);
            water += rightMax - height[right--];
        }
    }
    return water;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expected: "6", why: "Classic" },
      { input: "[4,2,0,3,2,5]", expected: "9", why: "Large basin" },
      { input: "[2,0,2]", expected: "2", why: "Single valley" },
      { input: "[3]", expected: "0", why: "Single bar" },
    ],
    takeawaysMd: "When the answer at each index is min(maxLeft, maxRight) − h, two pointers with running maxima do it in one pass and constant space.",
  },

  "multiply-strings": {
    understandMd: "Multiply two non-negative integers given as decimal strings and return the product as a string, without converting the whole numbers to integers or using big-integer libraries.",
    ioConstraintsMd: "Input: two strings of up to 200 digits without leading zeros (except \"0\"). Output: the product as a string.",
    edgeCases: ["One of the numbers is \"0\"", "Carries that propagate through several digits (999 × 999)", "Result with fewer digits than the sum of lengths (leading zero to strip)", "Different lengths"],
    bruteForceMd: "Add the first number to itself as many times as the second number says. (Too slow for large values.)",
    bruteComplexity: "Exponential in the number of digits.",
    bottleneckMd: "Schoolbook multiplication is O(n·m) and needs only a digit array: the product of digit i and digit j contributes to positions i + j and i + j + 1.",
    hints: [
      "How do you multiply 123 by 456 on paper? Where does each partial digit product land?", "The product of a[i] and b[j] affects positions i + j (carry) and i + j + 1 (units). Use an array of length n + m.", "Add the product to what is already at position i + j + 1, keep the last digit there and add the carry to position i + j.", "Finally skip leading zeros when building the output string.",
    ],
    optimalMd: "Allocate an integer array of length n + m. For each digit pair (from the right) multiply them, add the existing value at position i + j + 1, store sum % 10 there and add sum / 10 to position i + j. When all pairs are processed the array holds the digits of the product (possibly with one leading zero). Convert it to a string skipping leading zeros, with a special case for a zero operand.",
    code: [
      cpp(`
string multiply(string a, string b) {
    if (a == "0" || b == "0") return "0";
    vector<int> prod(a.size() + b.size(), 0);               // digit i of a times digit j of b lands at positions i + j, i + j + 1
    for (int i = (int)a.size() - 1; i >= 0; --i) {
        for (int j = (int)b.size() - 1; j >= 0; --j) {
            int sum = (a[i] - '0') * (b[j] - '0') + prod[i + j + 1];
            prod[i + j + 1] = sum % 10;
            prod[i + j] += sum / 10;                        // carry into the next more significant position
        }
    }
    string out;
    for (int d : prod) if (!(out.empty() && d == 0)) out += char('0' + d);   // skip leading zeros
    return out;
}`, 'C++'),
      java(`
public String multiply(String a, String b) {
    if (a.equals("0") || b.equals("0")) return "0";
    int[] prod = new int[a.length() + b.length()];      // digit i of a times digit j of b lands at positions i + j, i + j + 1
    for (int i = a.length() - 1; i >= 0; i--) {
        for (int j = b.length() - 1; j >= 0; j--) {
            int sum = (a.charAt(i) - '0') * (b.charAt(j) - '0') + prod[i + j + 1];
            prod[i + j + 1] = sum % 10;
            prod[i + j] += sum / 10;                    // carry into the next more significant position
        }
    }
    StringBuilder sb = new StringBuilder();
    for (int d : prod) if (!(sb.length() == 0 && d == 0)) sb.append(d);   // skip leading zeros
    return sb.toString();
}`, 'Java'),
    ],
    finalComplexity: "O(n·m) time, O(n + m) space.",
    testCases: [
      { input: "\"2\" × \"3\"", expected: "\"6\"", why: "Single digits" },
      { input: "\"123\" × \"456\"", expected: "\"56088\"", why: "Classic" },
      { input: "\"999\" × \"999\"", expected: "\"998001\"", why: "Carry chain" },
      { input: "\"0\" × \"123\"", expected: "\"0\"", why: "Zero special case" },
    ],
    takeawaysMd: "Digit-array multiplication: product digit (i, j) lands at i + j + 1 with its carry at i + j.",
  },

  "permutations": {
    understandMd: "Given an array of distinct integers, return every possible ordering (permutation) of its elements.",
    ioConstraintsMd: "Input: 1 to 6 distinct integers. Output: all n! permutations in any order.",
    edgeCases: ["Single element", "Two elements", "Negative numbers and zero", "Ensuring no permutation is produced twice"],
    bruteForceMd: "Generate all n-digit index sequences and keep those without repeated indices.",
    bruteComplexity: "O(nⁿ) time.",
    bottleneckMd: "Most index sequences repeat an element. Marking elements as used while building the permutation prunes those branches immediately.",
    hints: [
      "How many choices do you have for the first position? For the second?", "Build the permutation one position at a time. How do you avoid picking an element twice?", "Keep a used[] array: take an unused element, recurse, then free it again (backtrack).", "When the partial permutation has length n, record a copy.",
    ],
    optimalMd: "Backtracking over positions: at each position try every element that is not yet used, mark it, recurse for the next position, and unmark on return. When the current permutation has all n elements, add a copy to the answer. The recursion tree has n!/(n−k)! nodes at depth k, so each permutation is generated exactly once.",
    code: [
      cpp(`
void build(vector<int>& a, vector<bool>& used, vector<int>& cur, vector<vector<int>>& out) {
    if (cur.size() == a.size()) { out.push_back(cur); return; }
    for (size_t i = 0; i < a.size(); ++i) {
        if (used[i]) continue;                              // each element appears once per permutation
        used[i] = true; cur.push_back(a[i]);
        build(a, used, cur, out);
        cur.pop_back(); used[i] = false;                    // backtrack
    }
}
vector<vector<int>> permute(vector<int>& nums) {
    vector<vector<int>> out;
    vector<bool> used(nums.size(), false);
    vector<int> cur;
    build(nums, used, cur, out);
    return out;
}`, 'C++'),
      java(`
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> out = new ArrayList<>();
    build(nums, new boolean[nums.length], new ArrayList<>(), out);
    return out;
}
private void build(int[] a, boolean[] used, List<Integer> cur, List<List<Integer>> out) {
    if (cur.size() == a.length) { out.add(new ArrayList<>(cur)); return; }
    for (int i = 0; i < a.length; i++) {
        if (used[i]) continue;                          // each element appears once per permutation
        used[i] = true; cur.add(a[i]);
        build(a, used, cur, out);
        cur.remove(cur.size() - 1); used[i] = false;    // backtrack
    }
}`, 'Java'),
    ],
    finalComplexity: "O(n · n!) time (n! permutations, each copied in O(n)), O(n) extra space.",
    testCases: [
      { input: "[1,2,3]", expected: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]", why: "Six orderings" },
      { input: "[0,1]", expected: "[[0,1],[1,0]]", why: "Two elements" },
      { input: "[1]", expected: "[[1]]", why: "Single element" },
      { input: "[1,2,3,4,5]", expected: "120 distinct permutations", why: "Count check (5!)" },
    ],
    takeawaysMd: "Permutations = backtracking with a used[] array; every complete path of length n is one answer.",
  },

  "n-queens": {
    understandMd: "Place n queens on an n × n chessboard so that no two attack each other (no shared row, column or diagonal). Return all distinct board configurations.",
    ioConstraintsMd: "Input: n between 1 and 9. Output: every solution as a list of strings where \"Q\" is a queen and \".\" is empty.",
    edgeCases: ["n = 1 (a single queen)", "n = 2 and n = 3 have no solutions", "Two queens on the same diagonal in either direction", "Efficient conflict checks"],
    bruteForceMd: "Place queens anywhere on n² squares and test each of the C(n², n) placements.",
    bruteComplexity: "Astronomical (C(n², n) boards).",
    bottleneckMd: "A valid solution has exactly one queen per row, so you can place queens row by row and only choose a column. The only work left is a constant-time test for column and diagonal conflicts.",
    hints: [
      "How many queens can a single row contain in a solution? So what can you decide per row?", "Process rows top to bottom and choose a column for each. What must be remembered to detect attacks?", "Track used columns and the two diagonals: row + col is constant on one diagonal direction, row − col on the other.", "If the row has no safe column, return (dead end); when all rows are placed, draw the board.",
    ],
    optimalMd: "Backtrack row by row, choosing a column for each row. Three boolean arrays record occupied columns, occupied \"/\" diagonals (row + col) and occupied \"\\\" diagonals (row − col + n). A square is safe when none of its three markers is set. Mark, recurse to the next row, unmark. When row n is reached, build the board from the chosen columns. The pruning keeps the search tiny compared with brute force.",
    code: [
      cpp(`
void place(int n, int row, vector<int>& colOf, vector<bool>& cols, vector<bool>& diag1, vector<bool>& diag2, vector<vector<string>>& out) {
    if (row == n) {                                         // all rows filled: draw the board
        vector<string> board(n, string(n, '.'));
        for (int r = 0; r < n; ++r) board[r][colOf[r]] = 'Q';
        out.push_back(board);
        return;
    }
    for (int c = 0; c < n; ++c) {
        int d1 = row + c, d2 = row - c + n;                 // indices of the two diagonals through (row, c)
        if (cols[c] || diag1[d1] || diag2[d2]) continue;
        cols[c] = diag1[d1] = diag2[d2] = true;
        colOf[row] = c;
        place(n, row + 1, colOf, cols, diag1, diag2, out);
        cols[c] = diag1[d1] = diag2[d2] = false;            // backtrack
    }
}
vector<vector<string>> solveNQueens(int n) {
    vector<vector<string>> out;
    vector<int> colOf(n);
    vector<bool> cols(n, false), diag1(2 * n, false), diag2(2 * n, false);
    place(n, 0, colOf, cols, diag1, diag2, out);
    return out;
}`, 'C++'),
      java(`
public List<List<String>> solveNQueens(int n) {
    List<List<String>> out = new ArrayList<>();
    place(n, 0, new int[n], new boolean[n], new boolean[2 * n], new boolean[2 * n], out);
    return out;
}
private void place(int n, int row, int[] colOf, boolean[] cols, boolean[] diag1, boolean[] diag2, List<List<String>> out) {
    if (row == n) {                                     // all rows filled: draw the board
        List<String> board = new ArrayList<>();
        for (int r = 0; r < n; r++) {
            char[] line = new char[n];
            Arrays.fill(line, '.');
            line[colOf[r]] = 'Q';
            board.add(new String(line));
        }
        out.add(board);
        return;
    }
    for (int c = 0; c < n; c++) {
        int d1 = row + c, d2 = row - c + n;             // indices of the two diagonals through (row, c)
        if (cols[c] || diag1[d1] || diag2[d2]) continue;
        cols[c] = diag1[d1] = diag2[d2] = true;
        colOf[row] = c;
        place(n, row + 1, colOf, cols, diag1, diag2, out);
        cols[c] = diag1[d1] = diag2[d2] = false;        // backtrack
    }
}`, 'Java'),
    ],
    finalComplexity: "O(n!) time in the worst case (much less in practice thanks to pruning), O(n) space.",
    testCases: [
      { input: "n = 4", expected: "[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]", why: "Two solutions" },
      { input: "n = 1", expected: "[[\"Q\"]]", why: "Trivial" },
      { input: "n = 5, 6, 8", expected: "10, 4 and 92 solutions", why: "Known counts" },
      { input: "n = 2 or 3", expected: "[]", why: "No solution" },
    ],
    takeawaysMd: "Constraint search: place one item per row, keep O(1) conflict markers (columns and both diagonals) and backtrack.",
  },

  "plus-one": {
    understandMd: "A non-negative integer is stored as an array of its decimal digits (most significant first). Add one to it and return the digits of the result.",
    ioConstraintsMd: "Input: array of 1 to 100 digits without leading zeros. Output: the digits of the number plus one.",
    edgeCases: ["Trailing nines (1,9,9 becomes 2,0,0)", "All nines (9,9,9 becomes 1,0,0,0 and the array grows)", "Single digit 9", "Digit 0 is only the number zero"],
    bruteForceMd: "Convert the digits to an integer, add one and convert back. (Overflows for long inputs.)",
    bruteComplexity: "O(n) time but incorrect for big numbers.",
    bottleneckMd: "Addition by one is just a carry chain: only trailing nines change, so a single pass from the right either stops at the first digit below 9 or turns every digit into 0.",
    hints: [
      "Which digits change when you add one to 1299? To 1999? To 999?", "Start from the last digit. If it is less than 9, what happens?", "A 9 becomes 0 and the carry moves one step left.", "If you run off the left end, every digit was 9: return 1 followed by zeros.",
    ],
    optimalMd: "Scan from the last digit to the first. If a digit is below 9, increment it and return immediately (no carry). Otherwise set it to 0 and continue with the carry. If the loop finishes, the number was all nines, so return an array with a leading 1 and n zeros. Only the carry chain is touched.",
    code: [
      cpp(`
vector<int> plusOne(vector<int>& digits) {
    for (int i = (int)digits.size() - 1; i >= 0; --i) {
        if (digits[i] < 9) { ++digits[i]; return digits; }  // no carry needed: done
        digits[i] = 0;                                      // 9 becomes 0 and the carry moves left
    }
    digits.insert(digits.begin(), 1);                       // all nines: 999 becomes 1000
    return digits;
}`, 'C++'),
      java(`
public int[] plusOne(int[] digits) {
    for (int i = digits.length - 1; i >= 0; i--) {
        if (digits[i] < 9) { digits[i]++; return digits; }   // no carry needed: done
        digits[i] = 0;                                  // 9 becomes 0 and the carry moves left
    }
    int[] out = new int[digits.length + 1];             // all nines: 999 becomes 1000
    out[0] = 1;
    return out;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time (O(1) amortised), O(1) extra space except for the all-nines case.",
    testCases: [
      { input: "[1,2,3]", expected: "[1,2,4]", why: "No carry" },
      { input: "[1,9,9]", expected: "[2,0,0]", why: "Carry chain" },
      { input: "[9]", expected: "[1,0]", why: "Single nine" },
      { input: "[9,9,9]", expected: "[1,0,0,0]", why: "All nines grows the array" },
    ],
    takeawaysMd: "Big-number increments are carry loops from the right; return early at the first non-9 digit.",
  },

  "search-a-2d-matrix": {
    understandMd: "A matrix has rows sorted left to right, and the first element of each row is greater than the last element of the previous row. Decide whether a target value exists in it, in O(log(m·n)) time.",
    ioConstraintsMd: "Input: m × n integer matrix (up to 100 × 100) and a target. Output: true or false.",
    edgeCases: ["Single row or single column", "Target smaller than the first or larger than the last element", "Target in the first or last cell", "1 × 1 matrix"],
    bruteForceMd: "Scan every cell, or run a binary search per row.",
    bruteComplexity: "O(m·n) or O(m log n) time.",
    bottleneckMd: "The row-to-row ordering means that reading the matrix row by row yields one globally sorted sequence. One binary search over m·n virtual positions is enough.",
    hints: [
      "If you wrote all rows one after another, what would the sequence look like?", "You can binary search that sequence without copying it. How do you convert a flat index into (row, column)?", "row = index / n and column = index % n.", "Standard binary search with lo = 0 and hi = m·n − 1.",
    ],
    optimalMd: "Treat the matrix as a sorted array of m·n values and binary search over the flat indices. For the middle index mid, the value is matrix[mid / n][mid % n]. Compare with the target and move lo or hi accordingly. Each step halves the search space.",
    code: [
      cpp(`
bool searchMatrix(vector<vector<int>>& matrix, int target) {
    int m = matrix.size(), n = matrix[0].size();
    int lo = 0, hi = m * n - 1;                             // view the matrix as one sorted array of m * n values
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2, v = matrix[mid / n][mid % n];
        if (v == target) return true;
        if (v < target) lo = mid + 1; else hi = mid - 1;
    }
    return false;
}`, 'C++'),
      java(`
public boolean searchMatrix(int[][] matrix, int target) {
    int m = matrix.length, n = matrix[0].length;
    int lo = 0, hi = m * n - 1;                         // view the matrix as one sorted array of m * n values
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2, v = matrix[mid / n][mid % n];
        if (v == target) return true;
        if (v < target) lo = mid + 1; else hi = mid - 1;
    }
    return false;
}`, 'Java'),
    ],
    finalComplexity: "O(log(m·n)) time, O(1) space.",
    testCases: [
      { input: "[[1,3,5,7],[10,11,16,20],[23,30,34,60]], target 3", expected: "true", why: "In the first row" },
      { input: "same matrix, target 13", expected: "false", why: "Between two values" },
      { input: "[[1]], target 1", expected: "true", why: "Single cell" },
      { input: "[[1,3]], target 3", expected: "true", why: "Single row" },
    ],
    takeawaysMd: "A matrix with a row-major sorted order is a sorted array in disguise: binary search with index / n and index % n.",
  },

  "largest-rectangle-in-histogram": {
    understandMd: "Given the heights of bars in a histogram (each of width 1), find the area of the largest rectangle that fits entirely within the histogram.",
    ioConstraintsMd: "Input: up to 10⁵ bar heights (0 to 10⁴). Output: the maximum rectangle area (fits in 32 bits).",
    edgeCases: ["Single bar", "All bars equal (the whole width)", "Strictly increasing or decreasing heights", "A bar of height 0 splitting the histogram"],
    bruteForceMd: "For every pair of bars compute the minimum height between them and the resulting area, or expand from each bar to both sides.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "For each bar you need the nearest shorter bar to its left and to its right: that is exactly what a monotonic stack of increasing heights provides in amortised constant time.",
    hints: [
      "The tallest rectangle that uses bar i as its limiting height extends as far as the bars stay at least as tall. What two positions do you need?", "Those are the nearest strictly shorter bars on each side. Which data structure finds \"nearest smaller\" fast?", "Keep a stack of indices with increasing heights. When a shorter bar arrives, pop taller bars and compute their rectangles.", "width = i − stack.top − 1 after popping (or i if the stack is empty); add a sentinel bar of height 0 at the end.",
    ],
    optimalMd: "Scan left to right with a stack of indices whose bars have increasing heights. When the current bar is not taller than the top, the top bar cannot extend further right: pop it, take its height, and compute its width as the distance between the current index and the new stack top (the nearest shorter bar to its left), minus one. Update the best area. A sentinel height 0 at the end flushes all remaining bars. Each bar is pushed and popped once.",
    code: [
      cpp(`
int largestRectangleArea(vector<int>& heights) {
    stack<int> st;                                          // indices of bars with increasing heights
    int best = 0, n = heights.size();
    for (int i = 0; i <= n; ++i) {
        int h = i == n ? 0 : heights[i];                    // a final bar of height 0 flushes the stack
        while (!st.empty() && heights[st.top()] >= h) {
            int height = heights[st.top()]; st.pop();       // this bar can no longer extend to the right
            int left = st.empty() ? -1 : st.top();          // nearest shorter bar on the left
            best = max(best, height * (i - left - 1));
        }
        st.push(i);
    }
    return best;
}`, 'C++'),
      java(`
public int largestRectangleArea(int[] heights) {
    Deque<Integer> stack = new ArrayDeque<>();          // indices of bars with increasing heights
    int best = 0, n = heights.length;
    for (int i = 0; i <= n; i++) {
        int h = i == n ? 0 : heights[i];                // a final bar of height 0 flushes the stack
        while (!stack.isEmpty() && heights[stack.peek()] >= h) {
            int height = heights[stack.pop()];          // this bar can no longer extend to the right
            int left = stack.isEmpty() ? -1 : stack.peek();   // nearest shorter bar on the left
            best = Math.max(best, height * (i - left - 1));
        }
        stack.push(i);
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "[2,1,5,6,2,3]", expected: "10", why: "Bars 5 and 6 with width 2" },
      { input: "[2,4]", expected: "4", why: "Increasing bars" },
      { input: "[1,1,1,1]", expected: "4", why: "Whole histogram" },
      { input: "[2,1,2]", expected: "3", why: "The low middle bar spans everything" },
    ],
    takeawaysMd: "Nearest-smaller problems on both sides are a monotonic stack; pop when the current element breaks the order and settle the popped element's answer.",
  },

  "subsets-ii": {
    understandMd: "Given an integer array that may contain duplicates, return all possible subsets (the power set) without duplicate subsets.",
    ioConstraintsMd: "Input: up to 10 integers in [−10, 10]. Output: all unique subsets in any order.",
    edgeCases: ["Empty subset must be included", "All elements equal", "Duplicates that would create the same subset in different orders", "Single element"],
    bruteForceMd: "Generate all 2ⁿ subsets, sort each one, and remove duplicates with a set.",
    bruteComplexity: "O(2ⁿ · n log n) time plus memory for the set.",
    bottleneckMd: "Duplicates arise when equal values are chosen as the \"first element\" of a subset more than once at the same depth. Sorting groups equal values so that the second and later copies can be skipped at that depth.",
    hints: [
      "What is the difference between Subsets (distinct values) and this problem?", "Sort the array so equal values are adjacent. Where does the same subset get generated twice?", "At a given recursion depth, if you already tried value x as the next element, trying an equal value again repeats the work.", "In the loop: if i > start and a[i] == a[i−1], skip.",
    ],
    optimalMd: "Sort the array and build subsets with a recursion over (start index, current subset): every node of the recursion tree is a valid subset and is recorded when first reached. In the loop over the next element, skip a value equal to the previous one unless it is the first candidate at this depth (i > start). This allows two equal elements in one subset (through deeper recursion) but never two identical branches at the same level.",
    code: [
      cpp(`
void build(vector<int>& a, int start, vector<int>& cur, vector<vector<int>>& out) {
    out.push_back(cur);                                     // every node of the recursion tree is a subset
    for (int i = start; i < (int)a.size(); ++i) {
        if (i > start && a[i] == a[i - 1]) continue;        // skip a duplicate value at the same depth
        cur.push_back(a[i]);
        build(a, i + 1, cur, out);
        cur.pop_back();
    }
}
vector<vector<int>> subsetsWithDup(vector<int>& nums) {
    vector<vector<int>> out;
    vector<int> cur;
    sort(nums.begin(), nums.end());
    build(nums, 0, cur, out);
    return out;
}`, 'C++'),
      java(`
public List<List<Integer>> subsetsWithDup(int[] nums) {
    List<List<Integer>> out = new ArrayList<>();
    Arrays.sort(nums);
    build(nums, 0, new ArrayList<>(), out);
    return out;
}
private void build(int[] a, int start, List<Integer> cur, List<List<Integer>> out) {
    out.add(new ArrayList<>(cur));                      // every node of the recursion tree is a subset
    for (int i = start; i < a.length; i++) {
        if (i > start && a[i] == a[i - 1]) continue;    // skip a duplicate value at the same depth
        cur.add(a[i]);
        build(a, i + 1, cur, out);
        cur.remove(cur.size() - 1);
    }
}`, 'Java'),
    ],
    finalComplexity: "O(n · 2ⁿ) time, O(n) recursion depth.",
    testCases: [
      { input: "[1,2,2]", expected: "[[],[1],[1,2],[1,2,2],[2],[2,2]]", why: "Duplicated 2" },
      { input: "[0]", expected: "[[],[0]]", why: "Single element" },
      { input: "[4,4,4,1,4]", expected: "10 subsets", why: "Four 4s and a 1: 2 × 5 choices" },
    ],
    takeawaysMd: "Power set with duplicates: sort, then skip an element equal to the previous one at the same depth.",
  },

  "interleaving-string": {
    understandMd: "Given strings s1, s2 and s3, decide whether s3 can be formed by interleaving s1 and s2: both are split into substrings that alternate, with the order of characters within each string preserved.",
    ioConstraintsMd: "Input: strings up to 100 and 200 characters. Output: true or false.",
    edgeCases: ["Lengths that do not add up (immediately false)", "One string empty", "Both empty", "Same characters in both strings that make greedy choices unreliable"],
    bruteForceMd: "Recursively try to take the next character of s3 from s1 or from s2.",
    bruteComplexity: "O(2^(n+m)) time.",
    bottleneckMd: "Whether the first i + j characters of s3 can be formed from the first i characters of s1 and the first j of s2 depends only on (i, j); many paths reach the same pair, so memoising them gives O(n·m).",
    hints: [
      "If s3 is an interleaving, from which string does its last character come?", "Let dp[i][j] mean s3[0..i+j) is an interleaving of s1[0..i) and s2[0..j). What are the two ways to reach (i, j)?", "From (i−1, j) if s1[i−1] equals s3[i+j−1], or from (i, j−1) if s2[j−1] equals s3[i+j−1].", "Check the length first; dp[0][0] = true.",
    ],
    optimalMd: "First check that |s1| + |s2| = |s3|. Let dp[i][j] be true when the first i + j characters of s3 can be formed by interleaving the first i characters of s1 with the first j of s2. The last character s3[i+j−1] must come from s1 (if it equals s1[i−1] and dp[i−1][j] holds) or from s2 (if it equals s2[j−1] and dp[i][j−1] holds). The answer is dp[|s1|][|s2|].",
    code: [
      cpp(`
bool isInterleave(string s1, string s2, string s3) {
    int n = s1.size(), m = s2.size();
    if (n + m != (int)s3.size()) return false;
    vector<vector<char>> dp(n + 1, vector<char>(m + 1, 0));     // dp[i][j]: s3[0..i+j) interleaves s1[0..i) and s2[0..j)
    dp[0][0] = 1;
    for (int i = 0; i <= n; ++i) {
        for (int j = 0; j <= m; ++j) {
            if (i > 0 && s1[i - 1] == s3[i + j - 1] && dp[i - 1][j]) dp[i][j] = 1;   // last char from s1
            if (j > 0 && s2[j - 1] == s3[i + j - 1] && dp[i][j - 1]) dp[i][j] = 1;   // last char from s2
        }
    }
    return dp[n][m];
}`, 'C++'),
      java(`
public boolean isInterleave(String s1, String s2, String s3) {
    int n = s1.length(), m = s2.length();
    if (n + m != s3.length()) return false;
    boolean[][] dp = new boolean[n + 1][m + 1];         // dp[i][j]: s3[0..i+j) interleaves s1[0..i) and s2[0..j)
    dp[0][0] = true;
    for (int i = 0; i <= n; i++) {
        for (int j = 0; j <= m; j++) {
            if (i > 0 && s1.charAt(i - 1) == s3.charAt(i + j - 1) && dp[i - 1][j]) dp[i][j] = true;   // last char from s1
            if (j > 0 && s2.charAt(j - 1) == s3.charAt(i + j - 1) && dp[i][j - 1]) dp[i][j] = true;   // last char from s2
        }
    }
    return dp[n][m];
}`, 'Java'),
    ],
    finalComplexity: "O(n·m) time, O(n·m) space (O(m) with a rolling row).",
    testCases: [
      { input: "\"aabcc\", \"dbbca\", \"aadbbcbcac\"", expected: "true", why: "Classic interleaving" },
      { input: "\"aabcc\", \"dbbca\", \"aadbbbaccc\"", expected: "false", why: "Not possible" },
      { input: "\"\", \"\", \"\"", expected: "true", why: "All empty" },
      { input: "\"a\", \"b\", \"ba\"", expected: "true", why: "Order between strings is free" },
    ],
    takeawaysMd: "A prefix-pair DP: the last character of the target must come from the last unused character of one of the sources.",
  },

  "balanced-binary-tree": {
    understandMd: "Decide whether a binary tree is height-balanced: for every node, the heights of its left and right subtrees differ by at most one.",
    ioConstraintsMd: "Input: root of a tree with up to 5,000 nodes. Output: true or false.",
    edgeCases: ["Empty tree (balanced)", "Single node", "A balanced root with an unbalanced deeper subtree", "A long chain"],
    bruteForceMd: "For each node compute the heights of both subtrees by separate traversals and compare them.",
    bruteComplexity: "O(n²) time in the worst case because heights are recomputed.",
    bottleneckMd: "Computing the height afresh at every node repeats work. A post-order traversal that returns the height and a failure signal together does it in a single pass.",
    hints: [
      "What must be true at every node of a balanced tree?", "Computing the height from scratch for each node is slow. Can the recursion return the height and still detect imbalance?", "Return −1 as soon as a subtree is unbalanced; otherwise return its height.", "height(node): l = height(left); if l < 0 return −1; r = height(right); if r < 0 or |l − r| > 1 return −1; return 1 + max(l, r)",
    ],
    optimalMd: "Use one post-order recursion that returns the subtree height, or −1 if any node below is unbalanced. At a node, get the heights of both children (propagating −1 immediately), check that they differ by at most one, and return 1 + max. The tree is balanced exactly when the root call does not return −1. Each node is visited once.",
    code: [
      cpp(`
int height(TreeNode* node) {                                // returns -1 as soon as some subtree is unbalanced
    if (!node) return 0;
    int l = height(node->left);
    if (l < 0) return -1;
    int r = height(node->right);
    if (r < 0 || abs(l - r) > 1) return -1;
    return 1 + max(l, r);
}
bool isBalanced(TreeNode* root) {
    return height(root) >= 0;
}`, 'C++'),
      java(`
public boolean isBalanced(TreeNode root) {
    return height(root) >= 0;
}
private int height(TreeNode node) {                     // returns -1 as soon as some subtree is unbalanced
    if (node == null) return 0;
    int l = height(node.left);
    if (l < 0) return -1;
    int r = height(node.right);
    if (r < 0 || Math.abs(l - r) > 1) return -1;
    return 1 + Math.max(l, r);
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(h) space.",
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expected: "true", why: "Balanced" },
      { input: "[1,2,2,3,3,null,null,4,4]", expected: "false", why: "Left side too deep" },
      { input: "[]", expected: "true", why: "Empty tree" },
      { input: "[1,2,null,3]", expected: "false", why: "Left chain of length 2 against an empty right side" },
    ],
    takeawaysMd: "Return a sentinel (−1) along with the height so a single post-order pass both measures and validates.",
  },

  "distinct-subsequences": {
    understandMd: "Count the number of distinct subsequences of string s that equal string t. Different choices of positions count as different subsequences even if they spell the same word.",
    ioConstraintsMd: "Input: strings s (up to 1,000) and t (up to 1,000). Output: the count (fits in a 32-bit integer).",
    edgeCases: ["t longer than s (answer 0)", "Empty t (answer 1)", "Many repeated characters (counts grow quickly)", "No matching characters"],
    bruteForceMd: "Enumerate all subsequences of s and compare each with t, or recurse on the two strings.",
    bruteComplexity: "O(2^n).",
    bottleneckMd: "The recursion on suffixes visits the same pair (position in s, position in t) many times. There are only n·m such pairs, and each depends on the two neighbouring pairs.",
    hints: [
      "Define ways(i, j): the number of ways to form the first j characters of t from the first i characters of s. What is ways(i, 0)?", "If s[i−1] != t[j−1], the last character of s cannot be used: ways(i, j) = ways(i−1, j).", "If they are equal, you can either use it or skip it: ways(i−1, j−1) + ways(i−1, j).", "The table only needs one row if you update j from right to left.",
    ],
    optimalMd: "Let dp[j] be the number of ways to build the first j characters of t using the characters of s processed so far; dp[0] = 1 because the empty string can always be formed once. For each character of s, update j from high to low: if s[i−1] equals t[j−1], the character can extend all ways that built t[0..j−1), so dp[j] += dp[j−1]. Iterating j downwards ensures each character of s is used at most once per way. The answer is dp[|t|]. (Intermediate values can exceed the 32-bit range even when the final answer fits; unsigned wrap-around still gives the right final answer.)",
    code: [
      cpp(`
int numDistinct(string s, string t) {
    int n = s.size(), m = t.size();
    vector<unsigned> dp(m + 1, 0);                          // dp[j]: ways to form t[0..j) from the processed part of s
    dp[0] = 1;                                              // the empty string can be formed one way
    for (int i = 1; i <= n; ++i)
        for (int j = min(i, m); j >= 1; --j)                // right to left so s[i-1] is used at most once per way
            if (s[i - 1] == t[j - 1]) dp[j] += dp[j - 1];   // unsigned: intermediate counts may wrap, the final one fits
    return (int)dp[m];
}`, 'C++'),
      java(`
public int numDistinct(String s, String t) {
    int n = s.length(), m = t.length();
    int[] dp = new int[m + 1];                          // dp[j]: ways to form t[0..j) from the processed part of s
    dp[0] = 1;                                          // the empty string can be formed one way
    for (int i = 1; i <= n; i++)
        for (int j = Math.min(i, m); j >= 1; j--)       // right to left so s[i-1] is used at most once per way
            if (s.charAt(i - 1) == t.charAt(j - 1)) dp[j] += dp[j - 1];
    return dp[m];
}`, 'Java'),
    ],
    finalComplexity: "O(n·m) time, O(m) space.",
    testCases: [
      { input: "\"rabbbit\", \"rabbit\"", expected: "3", why: "Three choices for the doubled b" },
      { input: "\"babgbag\", \"bag\"", expected: "5", why: "Five position sets" },
      { input: "\"a\", \"b\"", expected: "0", why: "No match" },
      { input: "\"aaa\", \"aa\"", expected: "3", why: "Choose 2 of 3 positions" },
    ],
    takeawaysMd: "Subsequence counting is a prefix DP; iterate the shorter dimension in reverse to use a single row.",
  },

  "word-ladder": {
    understandMd: "Transform beginWord into endWord by changing one letter at a time, where every intermediate word must be in the given word list. Return the number of words in the shortest transformation sequence, or 0 if none exists.",
    ioConstraintsMd: "Input: beginWord, endWord and a list of up to 5,000 words of equal length (up to 10 letters). Output: the length of the shortest sequence including both ends, or 0.",
    edgeCases: ["endWord not in the list (answer 0)", "beginWord is not in the list (that is allowed)", "No path between the words", "Words that differ in exactly one letter from many others"],
    bruteForceMd: "DFS through all possible transformation sequences and keep the shortest.",
    bruteComplexity: "Exponential.",
    bottleneckMd: "Shortest path in an unweighted graph of words is exactly what BFS computes. The only design question is how to find the neighbours of a word quickly.",
    hints: [
      "Think of words as nodes and an edge between words that differ in one letter. Which algorithm gives the shortest path?", "BFS from beginWord, level by level; the level number is the answer.", "For each word, generate neighbours by replacing each position with a to z and checking membership in a set.", "Remove a word from the set when you enqueue it so it is never visited twice.",
    ],
    optimalMd: "Run a breadth-first search starting from beginWord, processing one level at a time and counting levels. For the current word, try replacing each letter by every other letter; if the new word is still in the unvisited set, remove it (marking it visited) and enqueue it. Return the level count when endWord is dequeued. If the queue empties, no sequence exists. Checking endWord membership up front handles the impossible case quickly.",
    code: [
      cpp(`
int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
    unordered_set<string> words(wordList.begin(), wordList.end());
    if (!words.count(endWord)) return 0;
    queue<string> q;
    q.push(beginWord);
    words.erase(beginWord);
    int steps = 1;                                          // number of words in the sequence so far
    while (!q.empty()) {
        for (int size = q.size(); size > 0; --size) {       // process one BFS level at a time
            string cur = q.front(); q.pop();
            if (cur == endWord) return steps;
            for (size_t i = 0; i < cur.size(); ++i) {
                char orig = cur[i];
                for (char ch = 'a'; ch <= 'z'; ++ch) {
                    if (ch == orig) continue;
                    cur[i] = ch;
                    if (words.erase(cur)) q.push(cur);      // erasing from the set doubles as "visited"
                }
                cur[i] = orig;
            }
        }
        ++steps;
    }
    return 0;
}`, 'C++'),
      java(`
public int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    if (!words.contains(endWord)) return 0;
    Deque<String> queue = new ArrayDeque<>();
    queue.add(beginWord);
    words.remove(beginWord);
    int steps = 1;                                      // number of words in the sequence so far
    while (!queue.isEmpty()) {
        for (int size = queue.size(); size > 0; size--) {   // process one BFS level at a time
            String cur = queue.poll();
            if (cur.equals(endWord)) return steps;
            char[] arr = cur.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char orig = arr[i];
                for (char ch = 'a'; ch <= 'z'; ch++) {
                    if (ch == orig) continue;
                    arr[i] = ch;
                    String next = new String(arr);
                    if (words.remove(next)) queue.add(next);   // removing from the set doubles as "visited"
                }
                arr[i] = orig;
            }
        }
        steps++;
    }
    return 0;
}`, 'Java'),
    ],
    finalComplexity: "O(N · L² · 26) time for N words of length L (string building dominates), O(N · L) space.",
    testCases: [
      { input: "\"hit\" → \"cog\", [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]", expected: "5", why: "hit, hot, dot, dog, cog" },
      { input: "same but \"cog\" missing from the list", expected: "0", why: "Target unreachable" },
      { input: "\"a\" → \"c\", [\"a\",\"b\",\"c\"]", expected: "2", why: "Single-letter words" },
      { input: "\"hot\" → \"dog\", [\"hot\",\"dog\"]", expected: "0", why: "Two letters differ and no intermediate word" },
    ],
    takeawaysMd: "Shortest transformation sequences are BFS on an implicit graph; mark visited when you enqueue.",
  },

  "surrounded-regions": {
    understandMd: "In a grid of \"X\" and \"O\", capture every region of \"O\" cells that is completely surrounded by \"X\" (not connected to the border) by flipping them to \"X\". Regions touching the border stay.",
    ioConstraintsMd: "Input: board up to 200 × 200 of \"X\" and \"O\". Output: the board modified in place.",
    edgeCases: ["Entire border made of O (nothing captured)", "1 × 1 board", "O regions touching the border only at a corner", "Large board (avoid recursion depth problems)"],
    bruteForceMd: "For every O region run a search to see whether it reaches the border, then flip it if not.",
    bruteComplexity: "O(m·n) time overall but needs careful bookkeeping of regions.",
    bottleneckMd: "Instead of finding captured regions, find the safe ones: any O connected to a border O. Mark those first, then flip everything else.",
    hints: [
      "Which O cells can never be captured?", "Start from every O on the border and mark all O cells connected to it with a temporary symbol.", "After marking, the remaining O cells are not reachable from the border: capture them.", "Finally turn the temporary symbol back into O. Use an explicit stack to avoid deep recursion.",
    ],
    optimalMd: "Do a flood fill from every border cell that holds an O, turning the reached cells into a temporary marker such as \"#\". Afterwards scan the board once: any remaining \"O\" is surrounded, so change it to \"X\"; each \"#\" is safe, so change it back to \"O\". The flood fill visits each cell at most once, and an explicit stack avoids stack overflow on large regions.",
    code: [
      cpp(`
void mark(vector<vector<char>>& b, int sr, int sc) {        // flood fill from a border cell, turning 'O' into '#'
    if (b[sr][sc] != 'O') return;
    stack<pair<int, int>> st;
    b[sr][sc] = '#';
    st.push({sr, sc});
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!st.empty()) {
        auto cur = st.top(); st.pop();
        for (int k = 0; k < 4; ++k) {
            int nr = cur.first + dr[k], nc = cur.second + dc[k];
            if (nr >= 0 && nc >= 0 && nr < (int)b.size() && nc < (int)b[0].size() && b[nr][nc] == 'O') {
                b[nr][nc] = '#';
                st.push({nr, nc});
            }
        }
    }
}
void solve(vector<vector<char>>& board) {
    int m = board.size(), n = board[0].size();
    for (int r = 0; r < m; ++r) { mark(board, r, 0); mark(board, r, n - 1); }
    for (int c = 0; c < n; ++c) { mark(board, 0, c); mark(board, m - 1, c); }
    for (int r = 0; r < m; ++r)
        for (int c = 0; c < n; ++c) {
            if (board[r][c] == 'O') board[r][c] = 'X';          // not connected to the border: captured
            else if (board[r][c] == '#') board[r][c] = 'O';     // connected to the border: restore
        }
}`, 'C++'),
      java(`
public void solve(char[][] board) {
    int m = board.length, n = board[0].length;
    for (int r = 0; r < m; r++) { mark(board, r, 0); mark(board, r, n - 1); }
    for (int c = 0; c < n; c++) { mark(board, 0, c); mark(board, m - 1, c); }
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++) {
            if (board[r][c] == 'O') board[r][c] = 'X';      // not connected to the border: captured
            else if (board[r][c] == '#') board[r][c] = 'O'; // connected to the border: restore
        }
}
private void mark(char[][] b, int sr, int sc) {         // flood fill from a border cell, turning 'O' into '#'
    if (b[sr][sc] != 'O') return;
    Deque<int[]> stack = new ArrayDeque<>();
    b[sr][sc] = '#';
    stack.push(new int[]{sr, sc});
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!stack.isEmpty()) {
        int[] cur = stack.pop();
        for (int[] d : dirs) {
            int nr = cur[0] + d[0], nc = cur[1] + d[1];
            if (nr >= 0 && nc >= 0 && nr < b.length && nc < b[0].length && b[nr][nc] == 'O') {
                b[nr][nc] = '#';
                stack.push(new int[]{nr, nc});
            }
        }
    }
}`, 'Java'),
    ],
    finalComplexity: "O(m·n) time, O(m·n) space in the worst case for the stack.",
    testCases: [
      { input: "XXXX / XOOX / XXOX / XOXX", expected: "XXXX / XXXX / XXXX / XOXX", why: "Only the O on the bottom border survives" },
      { input: "[[\"X\"]]", expected: "[[\"X\"]]", why: "Single X" },
      { input: "[[\"O\"]]", expected: "[[\"O\"]]", why: "Single border O" },
      { input: "OOO / OXO / OOO", expected: "unchanged", why: "Border ring of O" },
    ],
    takeawaysMd: "For \"enclosed regions\" problems, mark the cells connected to the border first; everything unmarked is enclosed.",
  },

  "palindrome-partitioning": {
    understandMd: "Split a string into pieces so that every piece is a palindrome, and return all possible ways to do so.",
    ioConstraintsMd: "Input: string of up to 16 lowercase letters. Output: every partition as a list of palindromic substrings.",
    edgeCases: ["Single character", "All characters equal (many partitions)", "No palindromes longer than 1 (only one partition)", "Palindromes of even and odd length"],
    bruteForceMd: "Try every way to cut the string (2ⁿ⁻¹ cut sets) and keep those where all pieces are palindromes.",
    bruteComplexity: "O(2ⁿ · n) time.",
    bottleneckMd: "Most cut sets fail on the first non-palindromic piece. Backtracking can cut off only palindromic prefixes, and a precomputed palindrome table makes each test O(1).",
    hints: [
      "Think of choosing the first piece of the partition. Which prefixes are allowed?", "After choosing a palindromic prefix, the rest of the string is the same problem again. What is the base case?", "Precompute pal[i][j] so each check is O(1): s[i] == s[j] and the inside is a palindrome (or very short).", "split(start): if start == n: record; for end in start..n−1: if pal[start][end]: add piece, split(end + 1), remove piece.",
    ],
    optimalMd: "Precompute a table pal[i][j] telling whether s[i..j] is a palindrome (compare the ends and look up the inner substring). Then backtrack: at position start, try every end such that s[start..end] is a palindrome, add that piece, recurse on end + 1, and remove it. When start reaches the end of the string, the current list is a complete partition.",
    code: [
      cpp(`
void split(const string& s, int start, vector<vector<char>>& pal, vector<string>& cur, vector<vector<string>>& out) {
    if (start == (int)s.size()) { out.push_back(cur); return; }
    for (int end = start; end < (int)s.size(); ++end) {
        if (!pal[start][end]) continue;                     // only cut off palindromic prefixes
        cur.push_back(s.substr(start, end - start + 1));
        split(s, end + 1, pal, cur, out);
        cur.pop_back();                                     // backtrack
    }
}
vector<vector<string>> partition(string s) {
    int n = s.size();
    vector<vector<char>> pal(n, vector<char>(n, 0));        // pal[i][j]: s[i..j] is a palindrome
    for (int i = n - 1; i >= 0; --i)
        for (int j = i; j < n; ++j)
            pal[i][j] = s[i] == s[j] && (j - i < 2 || pal[i + 1][j - 1]);
    vector<vector<string>> out;
    vector<string> cur;
    split(s, 0, pal, cur, out);
    return out;
}`, 'C++'),
      java(`
public List<List<String>> partition(String s) {
    int n = s.length();
    boolean[][] pal = new boolean[n][n];                // pal[i][j]: s[i..j] is a palindrome
    for (int i = n - 1; i >= 0; i--)
        for (int j = i; j < n; j++)
            pal[i][j] = s.charAt(i) == s.charAt(j) && (j - i < 2 || pal[i + 1][j - 1]);
    List<List<String>> out = new ArrayList<>();
    split(s, 0, pal, new ArrayList<>(), out);
    return out;
}
private void split(String s, int start, boolean[][] pal, List<String> cur, List<List<String>> out) {
    if (start == s.length()) { out.add(new ArrayList<>(cur)); return; }
    for (int end = start; end < s.length(); end++) {
        if (!pal[start][end]) continue;                 // only cut off palindromic prefixes
        cur.add(s.substring(start, end + 1));
        split(s, end + 1, pal, cur, out);
        cur.remove(cur.size() - 1);                     // backtrack
    }
}`, 'Java'),
    ],
    finalComplexity: "O(n · 2ⁿ) time, O(n²) space for the table.",
    testCases: [
      { input: "\"aab\"", expected: "[[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]", why: "Two partitions" },
      { input: "\"a\"", expected: "[[\"a\"]]", why: "Single character" },
      { input: "\"aaa\"", expected: "4 partitions", why: "a|a|a, a|aa, aa|a, aaa" },
      { input: "\"abc\"", expected: "[[\"a\",\"b\",\"c\"]]", why: "No longer palindromes" },
    ],
    takeawaysMd: "Partitioning a string into valid pieces is backtracking over the next cut; precompute the validity table with DP.",
  },

  "gas-station": {
    understandMd: "There are gas stations on a circular route. Station i provides gas[i] units and the trip to the next station costs cost[i]. Find the index of the station from which you can complete one full lap starting with an empty tank, or return −1. The solution is unique when it exists.",
    ioConstraintsMd: "Input: two arrays of length up to 10⁵. Output: starting index or −1.",
    edgeCases: ["Total gas less than total cost (impossible)", "Single station", "The start is the last station", "Equal totals (a start exists)"],
    bruteForceMd: "Try each station as a start and simulate a full lap.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "Simulating from every start repeats work. If you fail at station j when starting from i, none of the stations between i and j can work either, so the next candidate is j + 1, and one pass suffices.",
    hints: [
      "If the total gas is less than the total cost, can any start work?", "Suppose you start at i and run out of gas before reaching j + 1. Could starting at any station between i and j help?", "No: reaching them with a non-negative tank only makes things worse than starting there with an empty tank. So skip to j + 1.", "Keep total (for the global check) and tank (for the current candidate); reset the candidate when the tank becomes negative.",
    ],
    optimalMd: "Walk through the stations once, adding gas[i] − cost[i] to both a running tank and a global total. When the tank becomes negative, the current candidate start (and every station between it and here) cannot work, so reset the tank and make the next station the new candidate. If the global total is non-negative, the last candidate is the answer; otherwise no start exists.",
    code: [
      cpp(`
int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < (int)gas.size(); ++i) {
        int gain = gas[i] - cost[i];
        total += gain;
        tank += gain;
        if (tank < 0) { start = i + 1; tank = 0; }          // no station in [start, i] can reach i + 1
    }
    return total >= 0 ? start : -1;                         // a solution exists iff the total is non-negative
}`, 'C++'),
      java(`
public int canCompleteCircuit(int[] gas, int[] cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < gas.length; i++) {
        int gain = gas[i] - cost[i];
        total += gain;
        tank += gain;
        if (tank < 0) { start = i + 1; tank = 0; }      // no station in [start, i] can reach i + 1
    }
    return total >= 0 ? start : -1;                     // a solution exists iff the total is non-negative
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "gas [1,2,3,4,5], cost [3,4,5,1,2]", expected: "3", why: "Classic" },
      { input: "gas [2,3,4], cost [3,4,3]", expected: "-1", why: "Total gas 9 < total cost 10" },
      { input: "gas [5], cost [4]", expected: "0", why: "Single station" },
      { input: "gas [5,1,2,3,4], cost [4,4,1,5,1]", expected: "4", why: "Start at the last station" },
    ],
    takeawaysMd: "A greedy reset works because a failure at j rules out every start in the failed segment; the global sum decides whether any start exists.",
  },

  "copy-list-with-random-pointer": {
    understandMd: "A linked list has nodes with two pointers: next and an extra random pointer that can point to any node or to null. Create a deep copy of the list: new nodes with the same values, and next/random pointers wired to the corresponding new nodes.",
    ioConstraintsMd: "Input: head of a list with up to 1,000 nodes. Output: head of the deep copy; no pointer of the copy may point into the original.",
    edgeCases: ["Empty list", "Random pointer to itself", "Random pointer to null", "Random pointers that point forward and backward"],
    bruteForceMd: "Copy the nodes in order and then search the list for the target of every random pointer.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "Wiring random pointers needs a way to find \"the clone of node X\" in O(1). A hash map from original to clone provides it (an interleaving trick can do it in O(1) extra space).",
    hints: [
      "Why can't you set the random pointer of a clone while creating the nodes in one pass?", "You need the clone of an arbitrary node, possibly created later. What lookup structure helps?", "First pass: create a clone for every node and store original → clone. Second pass: set next and random through the map.", "Mapping null to null makes the second pass uniform. For O(1) space, interleave clones after each original node.",
    ],
    optimalMd: "Use two passes. In the first pass, create a copy of every node and record original → copy in a hash map. In the second pass, for every original node set copy.next = map[original.next] and copy.random = map[original.random]; looking up null yields null. The head of the copy is map[head]. The alternative O(1)-space method inserts each clone right after its original, sets random pointers using original.random.next, and then separates the lists.",
    code: [
      cpp(`
struct Node {                                               // provided by LeetCode
    int val;
    Node *next, *random;
    Node(int v) : val(v), next(nullptr), random(nullptr) {}
};
Node* copyRandomList(Node* head) {
    unordered_map<Node*, Node*> copy;                       // original -> clone
    copy[nullptr] = nullptr;                                // so that null next/random pointers map to null
    for (Node* cur = head; cur; cur = cur->next) copy[cur] = new Node(cur->val);   // pass 1: clone every node
    for (Node* cur = head; cur; cur = cur->next) {                                  // pass 2: wire next and random
        copy[cur]->next = copy[cur->next];
        copy[cur]->random = copy[cur->random];
    }
    return copy[head];
}`, 'C++'),
      java(`
class Node {                                     // provided by LeetCode
    int val; Node next, random;
    Node(int val) { this.val = val; }
}
public Node copyRandomList(Node head) {
    Map<Node, Node> copy = new HashMap<>();             // original -> clone
    for (Node cur = head; cur != null; cur = cur.next) copy.put(cur, new Node(cur.val));   // pass 1: clone every node
    for (Node cur = head; cur != null; cur = cur.next) {                                    // pass 2: wire next and random
        copy.get(cur).next = copy.get(cur.next);        // get(null) is null, which is exactly what we want
        copy.get(cur).random = copy.get(cur.random);
    }
    return copy.get(head);
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space (O(1) with interleaving).",
    testCases: [
      { input: "[[7,null],[13,0],[11,4],[10,2],[1,0]]", expected: "same structure, new nodes", why: "Random pointers forward and backward" },
      { input: "null", expected: "null", why: "Empty list" },
      { input: "single node whose random points to itself", expected: "clone whose random points to the clone", why: "Self-reference" },
    ],
    takeawaysMd: "Deep copying structures with extra pointers: map original → clone first, then wire all pointers in a second pass.",
  },

  "evaluate-reverse-polish-notation": {
    understandMd: "Evaluate an arithmetic expression given in reverse Polish notation (postfix), where operators follow their operands. Division truncates toward zero.",
    ioConstraintsMd: "Input: array of tokens (integers or + − * /) forming a valid expression. Output: its integer value.",
    edgeCases: ["Single number", "Negative numbers (the token \"-11\" is a number, \"-\" is an operator)", "Subtraction and division operand order", "Division of negative numbers truncating toward zero"],
    bruteForceMd: "Convert the expression to infix with parentheses and evaluate it with a parser (more work than needed).",
    bruteComplexity: "O(n) time but unnecessarily complicated.",
    bottleneckMd: "Postfix notation is designed for a stack: operands are pushed, and an operator consumes the top two values and pushes the result. No precedence or parentheses handling is needed.",
    hints: [
      "In \"3 4 +\", what has been read when the operator arrives?", "Use a stack. Push every number; what should an operator do with the top two elements?", "Pop b first, then a; compute a op b (the order matters for − and /).", "After all tokens, the stack holds one value: the answer.",
    ],
    optimalMd: "Scan the tokens left to right. A number is pushed onto a stack. An operator pops two values (the first pop is the right operand b, the second is the left operand a), computes a op b and pushes the result. Integer division in Java and C++ truncates toward zero, which matches the requirement. At the end the single remaining stack value is the result.",
    code: [
      cpp(`
int evalRPN(vector<string>& tokens) {
    stack<int> st;
    for (auto& t : tokens) {
        if (t == "+" || t == "-" || t == "*" || t == "/") {
            int b = st.top(); st.pop();
            int a = st.top(); st.pop();                     // a is the left operand, so the order matters
            if (t == "+") st.push(a + b);
            else if (t == "-") st.push(a - b);
            else if (t == "*") st.push(a * b);
            else st.push(a / b);                            // truncates toward zero
        } else {
            st.push(stoi(t));
        }
    }
    return st.top();
}`, 'C++'),
      java(`
public int evalRPN(String[] tokens) {
    Deque<Integer> stack = new ArrayDeque<>();
    for (String t : tokens) {
        switch (t) {
            case "+": stack.push(stack.pop() + stack.pop()); break;
            case "*": stack.push(stack.pop() * stack.pop()); break;
            case "-": { int b = stack.pop(), a = stack.pop(); stack.push(a - b); break; }   // order matters
            case "/": { int b = stack.pop(), a = stack.pop(); stack.push(a / b); break; }   // truncates toward zero
            default: stack.push(Integer.parseInt(t));
        }
    }
    return stack.pop();
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "[\"2\",\"1\",\"+\",\"3\",\"*\"]", expected: "9", why: "(2 + 1) × 3" },
      { input: "[\"4\",\"13\",\"5\",\"/\",\"+\"]", expected: "6", why: "4 + (13 / 5)" },
      { input: "[\"-7\",\"2\",\"/\"]", expected: "-3", why: "Truncates toward zero" },
      { input: "[\"3\",\"4\",\"-\"]", expected: "-1", why: "Operand order matters" },
    ],
    takeawaysMd: "Postfix evaluation is a stack machine: push operands, pop two for each operator, mind the operand order.",
  },

  "two-sum-ii-input-array-is-sorted": {
    understandMd: "Given a sorted array (ascending), find two different positions whose values sum to a target and return their 1-based indices. Exactly one solution exists. Use only constant extra space.",
    ioConstraintsMd: "Input: sorted array of 2 to 3 × 10⁴ integers (negatives allowed) and a target. Output: the two 1-based indices in increasing order.",
    edgeCases: ["The pair at the two ends", "Negative numbers and zero", "Duplicate values", "Two elements only"],
    bruteForceMd: "Check every pair, or use a hash map as in the unsorted version (extra space).",
    bruteComplexity: "O(n²) time, or O(n) time and O(n) space.",
    bottleneckMd: "Sortedness gives direction: if the current sum is too small only a larger left element helps, and if it is too large only a smaller right element helps, so a pair of pointers can converge in one pass.",
    hints: [
      "What information does sorting give you that the unsorted Two Sum problem lacks?", "Put one pointer at each end. If the sum is too big, which pointer should move, and which way?", "Moving the right pointer left lowers the sum; moving the left pointer right raises it.", "while l < r: s = a[l] + a[r]; if s == target: answer; elif s < target: l++ else r−−",
    ],
    optimalMd: "Use two pointers starting at both ends of the array. If the sum equals the target, return the 1-based positions. If it is smaller, move the left pointer right to increase the sum; if it is larger, move the right pointer left to decrease it. Each move discards an element that cannot be part of any answer, so the scan is linear and uses constant space.",
    code: [
      cpp(`
vector<int> twoSum(vector<int>& numbers, int target) {
    int l = 0, r = (int)numbers.size() - 1;
    while (l < r) {
        int sum = numbers[l] + numbers[r];
        if (sum == target) return {l + 1, r + 1};           // the answer is 1-indexed
        if (sum < target) ++l; else --r;                    // the sum is too small: raise it, otherwise lower it
    }
    return {};
}`, 'C++'),
      java(`
public int[] twoSum(int[] numbers, int target) {
    int l = 0, r = numbers.length - 1;
    while (l < r) {
        int sum = numbers[l] + numbers[r];
        if (sum == target) return new int[]{l + 1, r + 1};   // the answer is 1-indexed
        if (sum < target) l++; else r--;                // the sum is too small: raise it, otherwise lower it
    }
    return new int[0];
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[2,7,11,15], target 9", expected: "[1,2]", why: "Ends of the array" },
      { input: "[2,3,4], target 6", expected: "[1,3]", why: "Pair spans the array" },
      { input: "[-1,0], target -1", expected: "[1,2]", why: "Negative values" },
      { input: "[5,25,75], target 100", expected: "[2,3]", why: "Last two" },
    ],
    takeawaysMd: "In a sorted array, a converging pair of pointers replaces a hash map for pair-sum searches.",
  },

  "binary-tree-right-side-view": {
    understandMd: "Imagine standing on the right side of a binary tree: return the values of the nodes you can see, from top to bottom (the rightmost node on each level).",
    ioConstraintsMd: "Input: root of a tree with up to 100 nodes. Output: list with one value per level.",
    edgeCases: ["Empty tree", "A left child that is visible because the right side is missing on that level", "Left-only chain", "Single node"],
    bruteForceMd: "Collect every level with a full level-order traversal and then take the last element of each level.",
    bruteComplexity: "O(n) time, O(n) space for all levels.",
    bottleneckMd: "You do not need to store whole levels: during a level-order traversal you only need to notice which node is the last one processed on its level.",
    hints: [
      "Which node of each level is visible from the right?", "A breadth-first traversal visits the levels in order. How can you tell that the current node is the last on its level?", "Process the queue one level at a time using the queue size at the start of the level.", "if i == size − 1: append node.val; enqueue left then right children.",
    ],
    optimalMd: "Do a breadth-first search, handling one level per outer iteration with the queue size fixed at the start of the level. The last node dequeued in that iteration is the rightmost node of the level, so append its value to the answer. Enqueue left then right children as usual. (A DFS visiting right children first and recording the first node seen at each depth is an equivalent approach.)",
    code: [
      cpp(`
vector<int> rightSideView(TreeNode* root) {
    vector<int> out;
    if (!root) return out;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int size = q.size();                                // nodes on the current level
        for (int i = 0; i < size; ++i) {
            TreeNode* node = q.front(); q.pop();
            if (i == size - 1) out.push_back(node->val);    // the last node of a level is visible from the right
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
    }
    return out;
}`, 'C++'),
      java(`
public List<Integer> rightSideView(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> queue = new ArrayDeque<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        int size = queue.size();                        // nodes on the current level
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            if (i == size - 1) out.add(node.val);       // the last node of a level is visible from the right
            if (node.left != null) queue.add(node.left);
            if (node.right != null) queue.add(node.right);
        }
    }
    return out;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(w) space (w = maximum width of the tree).",
    testCases: [
      { input: "[1,2,3,null,5,null,4]", expected: "[1,3,4]", why: "Classic" },
      { input: "[1,null,3]", expected: "[1,3]", why: "Right chain" },
      { input: "[1,2,3,4]", expected: "[1,3,4]", why: "Left child visible on the last level" },
      { input: "[]", expected: "[]", why: "Empty tree" },
    ],
    takeawaysMd: "Level-order traversal with a per-level loop gives access to \"the last node of each level\".",
  },

  "happy-number": {
    understandMd: "Repeatedly replace a number by the sum of the squares of its digits. The number is \"happy\" if this process reaches 1; otherwise it loops forever in a cycle that does not contain 1. Decide whether n is happy.",
    ioConstraintsMd: "Input: a positive integer up to 2³¹ − 1. Output: true or false.",
    edgeCases: ["n = 1 (already happy)", "Numbers that enter the cycle 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4", "Large inputs shrink quickly", "Avoid an infinite loop"],
    bruteForceMd: "Simulate until the value repeats, storing every value seen in a hash set.",
    bruteComplexity: "O(log n) steps with O(log n) extra space.",
    bottleneckMd: "The set only exists to detect a cycle. The sequence is a linked-list-like chain of next values, so Floyd's slow/fast pointers detect the cycle in constant space.",
    hints: [
      "What are the only two possible endings of the sequence?", "You need to detect a cycle. What data structure can do it, and what constant-space method exists for linked lists?", "Treat next(x) as a successor function; run a slow pointer one step and a fast pointer two steps at a time.", "Stop when fast reaches 1 (happy) or when slow meets fast (cycle without 1).",
    ],
    optimalMd: "Define next(x) as the sum of the squares of the digits. Apply Floyd's cycle detection: advance slow by one next-step and fast by two. If fast reaches 1 the number is happy; if slow and fast meet at a value other than 1, the sequence has entered a cycle that never reaches 1. The sequence becomes small quickly (every value stays below about 1,000 after one step), so the loop is very short.",
    code: [
      cpp(`
int next(int x) {
    int sum = 0;
    while (x > 0) { int d = x % 10; sum += d * d; x /= 10; }
    return sum;
}
bool isHappy(int n) {
    int slow = n, fast = next(n);
    while (fast != 1 && slow != fast) {                     // Floyd cycle detection on the digit-square sequence
        slow = next(slow);
        fast = next(next(fast));
    }
    return fast == 1;
}`, 'C++'),
      java(`
public boolean isHappy(int n) {
    int slow = n, fast = next(n);
    while (fast != 1 && slow != fast) {                 // Floyd cycle detection on the digit-square sequence
        slow = next(slow);
        fast = next(next(fast));
    }
    return fast == 1;
}
private int next(int x) {
    int sum = 0;
    while (x > 0) { int d = x % 10; sum += d * d; x /= 10; }
    return sum;
}`, 'Java'),
    ],
    finalComplexity: "O(log n) time, O(1) space.",
    testCases: [
      { input: "19", expected: "true", why: "19 → 82 → 68 → 100 → 1" },
      { input: "2", expected: "false", why: "Enters the 4 → … → 4 cycle" },
      { input: "1", expected: "true", why: "Already 1" },
      { input: "7", expected: "true", why: "7 → 49 → 97 → 130 → 10 → 1" },
    ],
    takeawaysMd: "Whenever a repeated function application may loop, think of the sequence as a linked list and use slow/fast pointers.",
  },

  "sliding-window-maximum": {
    understandMd: "Given an array and a window size k, return the maximum of every window of k consecutive elements as the window slides from left to right.",
    ioConstraintsMd: "Input: array of up to 10⁵ integers and 1 ≤ k ≤ n. Output: array of n − k + 1 maxima.",
    edgeCases: ["k = 1 (the array itself)", "k = n (a single window)", "Decreasing or increasing arrays", "Equal values (ties)"],
    bruteForceMd: "For every window scan its k elements for the maximum.",
    bruteComplexity: "O(n·k) time.",
    bottleneckMd: "Consecutive windows share k − 1 elements, but the scan starts over each time. A deque that keeps only candidates for the maximum, in decreasing order, can answer each window in amortised O(1).",
    hints: [
      "When a new element arrives, which earlier elements in the window can never be the maximum again?", "Anything smaller than or equal to the new element, since it leaves the window earlier. Keep candidates in decreasing order of value.", "Store indices in a deque: pop from the back while the back value is ≤ the new value; pop from the front when its index leaves the window.", "The front of the deque is the current window maximum.",
    ],
    optimalMd: "Maintain a deque of indices whose values are in decreasing order. For each new index i: remove the front if it has fallen out of the window (index ≤ i − k); remove from the back all indices whose values are ≤ nums[i] (they can never be a maximum while i is in the window); push i at the back. Once i ≥ k − 1, the value at the front is the maximum of the current window. Each index is pushed and popped at most once.",
    code: [
      cpp(`
vector<int> maxSlidingWindow(vector<int>& nums, int k) {
    int n = nums.size();
    vector<int> out;
    deque<int> dq;                                          // indices whose values decrease from front to back
    for (int i = 0; i < n; ++i) {
        while (!dq.empty() && dq.front() <= i - k) dq.pop_front();           // the front left the window
        while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();     // smaller values can never be the maximum
        dq.push_back(i);
        if (i >= k - 1) out.push_back(nums[dq.front()]);
    }
    return out;
}`, 'C++'),
      java(`
public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] out = new int[n - k + 1];
    Deque<Integer> dq = new ArrayDeque<>();             // indices whose values decrease from front to back
    for (int i = 0; i < n; i++) {
        while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();            // the front left the window
        while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();      // smaller values can never be the maximum
        dq.addLast(i);
        if (i >= k - 1) out[i - k + 1] = nums[dq.peekFirst()];
    }
    return out;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(k) space.",
    testCases: [
      { input: "[1,3,-1,-3,5,3,6,7], k = 3", expected: "[3,3,5,5,6,7]", why: "Classic" },
      { input: "[1], k = 1", expected: "[1]", why: "Single element" },
      { input: "[1,-1], k = 1", expected: "[1,-1]", why: "k = 1" },
      { input: "[9,11], k = 2", expected: "[11]", why: "Single window" },
    ],
    takeawaysMd: "A monotonic deque keeps only elements that can still become the window maximum; it gives O(1) amortised sliding extremes.",
  },

  "walls-and-gates": {
    understandMd: "A grid of rooms contains walls (−1), gates (0) and empty rooms (a very large value INF). Fill every empty room with the number of steps to its nearest gate (moving up, down, left or right, not through walls). Rooms that cannot reach a gate stay INF.",
    ioConstraintsMd: "Input: grid up to 250 × 250 with values −1, 0 or INF = 2³¹ − 1. Output: the grid modified in place.",
    edgeCases: ["No gates (everything stays INF)", "A room walled off from every gate", "Several gates competing for a room (take the nearest)", "Single cell"],
    bruteForceMd: "Run a BFS from each empty room to find its nearest gate.",
    bruteComplexity: "O((m·n)²) time.",
    bottleneckMd: "Running a search per room repeats work. Reverse the direction: start one BFS from all gates simultaneously, so every room is first reached by its nearest gate.",
    hints: [
      "Which is cheaper: a search from each room, or searches from the gates?", "Put all gates in the queue at distance 0 and expand outwards level by level (a multi-source BFS).", "The first time a room is reached, that is the shortest distance; only unvisited rooms (still INF) should be updated.", "rooms[nr][nc] = rooms[r][c] + 1 for INF neighbours, then enqueue.",
    ],
    optimalMd: "Multi-source breadth-first search: enqueue every gate, then repeatedly pop a cell and look at its four neighbours. A neighbour that is still INF is an unvisited empty room; set it to the current distance plus one and enqueue it. Because BFS expands in increasing distance order, the first assignment is the shortest. Walls and already-set cells are ignored, and unreachable rooms keep INF.",
    code: [
      cpp(`
void wallsAndGates(vector<vector<int>>& rooms) {
    const int INF = INT_MAX;                                // an empty room that no gate has reached yet
    int m = rooms.size(), n = rooms[0].size();
    queue<pair<int, int>> q;
    for (int r = 0; r < m; ++r)
        for (int c = 0; c < n; ++c)
            if (rooms[r][c] == 0) q.push({r, c});           // start BFS from all gates at once
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto cur = q.front(); q.pop();
        for (int k = 0; k < 4; ++k) {
            int nr = cur.first + dr[k], nc = cur.second + dc[k];
            if (nr >= 0 && nc >= 0 && nr < m && nc < n && rooms[nr][nc] == INF) {
                rooms[nr][nc] = rooms[cur.first][cur.second] + 1;   // the first visit is the shortest distance
                q.push({nr, nc});
            }
        }
    }
}`, 'C++'),
      java(`
public void wallsAndGates(int[][] rooms) {
    final int INF = Integer.MAX_VALUE;                  // an empty room that no gate has reached yet
    int m = rooms.length, n = rooms[0].length;
    Deque<int[]> queue = new ArrayDeque<>();
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (rooms[r][c] == 0) queue.add(new int[]{r, c});   // start BFS from all gates at once
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!queue.isEmpty()) {
        int[] cur = queue.poll();
        for (int[] d : dirs) {
            int nr = cur[0] + d[0], nc = cur[1] + d[1];
            if (nr >= 0 && nc >= 0 && nr < m && nc < n && rooms[nr][nc] == INF) {
                rooms[nr][nc] = rooms[cur[0]][cur[1]] + 1;      // the first visit is the shortest distance
                queue.add(new int[]{nr, nc});
            }
        }
    }
}`, 'Java'),
    ],
    finalComplexity: "O(m·n) time, O(m·n) space.",
    testCases: [
      { input: "4 × 4 sample grid", expected: "[[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]", why: "Classic" },
      { input: "[[-1]]", expected: "unchanged", why: "Only a wall" },
      { input: "[[INF]]", expected: "unchanged", why: "No gate" },
      { input: "[[0,INF,INF]]", expected: "[[0,1,2]]", why: "Distances along a row" },
    ],
    takeawaysMd: "When many targets share one question (\"nearest gate\"), run one BFS seeded with all targets.",
  },

  "best-time-to-buy-and-sell-stock-with-cooldown": {
    understandMd: "Given daily stock prices, find the maximum profit from any number of buy/sell transactions with one rule: after selling you must wait one day (cooldown) before buying again, and you can hold at most one share.",
    ioConstraintsMd: "Input: array of up to 5,000 prices. Output: the maximum profit.",
    edgeCases: ["Single day or decreasing prices (profit 0)", "Selling today and wanting to buy tomorrow (not allowed)", "Rising prices (hold until the end)", "Alternating prices"],
    bruteForceMd: "Recursively try buying, selling or skipping on every day.",
    bruteComplexity: "O(3ⁿ) time.",
    bottleneckMd: "The decision on day i depends only on the state (holding, just sold, free) and the day, so there are only 3n sub-problems and a three-state DP replaces the recursion.",
    hints: [
      "What states can you be in at the end of a day?", "Define hold (own a share), sold (sold today, so tomorrow is cooldown) and rest (no share and free to buy). How does each state arise?", "sold = hold + price; hold = max(hold, rest − price); rest = max(rest, previous sold).", "The answer is max(sold, rest) after the last day; keep the three values in variables.",
    ],
    optimalMd: "Track three best profits per day: hold (currently holding a share), sold (sold today) and rest (no share, able to buy). Selling today comes from holding yesterday: sold = hold + price. Holding comes from holding before or from buying today out of the rest state: hold = max(hold, rest − price). Rest comes from resting before or from yesterday's sold state (cooldown ends): rest = max(rest, prevSold). The best final profit is max(sold, rest). Constant space.",
    code: [
      cpp(`
int maxProfit(vector<int>& prices) {
    int hold = INT_MIN / 2, sold = 0, rest = 0;             // best profit: holding a stock / sold today / free to buy
    for (int p : prices) {
        int prevSold = sold;
        sold = hold + p;                                    // sell today
        hold = max(hold, rest - p);                         // keep holding, or buy today (only from the free state)
        rest = max(rest, prevSold);                         // stay idle, or finish yesterday's cooldown
    }
    return max(sold, rest);
}`, 'C++'),
      java(`
public int maxProfit(int[] prices) {
    int hold = Integer.MIN_VALUE / 2, sold = 0, rest = 0;   // best profit: holding a stock / sold today / free to buy
    for (int p : prices) {
        int prevSold = sold;
        sold = hold + p;                                // sell today
        hold = Math.max(hold, rest - p);                // keep holding, or buy today (only from the free state)
        rest = Math.max(rest, prevSold);                // stay idle, or finish yesterday's cooldown
    }
    return Math.max(sold, rest);
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,2,3,0,2]", expected: "3", why: "buy 1, sell 3, cooldown, buy 0, sell 2" },
      { input: "[1]", expected: "0", why: "Single day" },
      { input: "[2,1]", expected: "0", why: "Falling prices" },
      { input: "[1,2,4]", expected: "3", why: "Buy once and sell at the top" },
    ],
    takeawaysMd: "Stock problems are small state machines; write each state's recurrence from the states that can lead into it.",
  },

  "longest-increasing-path-in-a-matrix": {
    understandMd: "In an integer matrix, find the length of the longest strictly increasing path where each step moves to an adjacent cell (up, down, left or right; no diagonals, no wrap-around).",
    ioConstraintsMd: "Input: matrix up to 200 × 200. Output: the number of cells in the longest increasing path.",
    edgeCases: ["Single cell", "All values equal (answer 1)", "A long snake-like increasing path (deep recursion)", "Several equally long paths"],
    bruteForceMd: "DFS from every cell exploring all increasing paths.",
    bruteComplexity: "O(4^(m·n)) in the worst case.",
    bottleneckMd: "The best path starting from a cell is the same whenever you reach that cell. Because the path must strictly increase, the graph of moves is acyclic, so each cell can be settled once, either by memoised DFS or by a topological (layer-peeling) traversal.",
    hints: [
      "Is there a cycle in the \"move to a larger neighbour\" graph? What does that imply for ordering?", "Cells with no larger neighbour end a path. Think of peeling those off first.", "Count for each cell how many larger neighbours it has (out-degree) and run Kahn's topological sort starting from the cells with out-degree 0.", "Each BFS layer is one more step of the path; the number of layers is the answer. (Memoised DFS also works; beware deep recursion.)",
    ],
    optimalMd: "Treat each cell as a node with edges to strictly larger neighbours; the graph is a DAG. Compute each cell's out-degree (number of larger neighbours) and start a BFS from the cells with out-degree 0 (the local maxima). Process layer by layer: when a smaller neighbour's out-degree drops to 0 it joins the next layer. The number of layers processed equals the length of the longest path. This avoids recursion depth issues on 200 × 200 inputs; the memoised DFS alternative stores the best length for every start cell.",
    code: [
      cpp(`
int longestIncreasingPath(vector<vector<int>>& a) {
    int m = a.size(), n = a[0].size();
    vector<vector<int>> outdeg(m, vector<int>(n, 0));       // how many strictly larger neighbours a cell has
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int r = 0; r < m; ++r)
        for (int c = 0; c < n; ++c)
            for (int k = 0; k < 4; ++k) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nc >= 0 && nr < m && nc < n && a[nr][nc] > a[r][c]) ++outdeg[r][c];
            }
    queue<pair<int, int>> q;
    for (int r = 0; r < m; ++r)
        for (int c = 0; c < n; ++c)
            if (outdeg[r][c] == 0) q.push({r, c});          // local maxima end every path
    int layers = 0;
    while (!q.empty()) {                                    // peel the grid layer by layer, from the largest values down
        ++layers;
        for (int size = q.size(); size > 0; --size) {
            auto cur = q.front(); q.pop();
            for (int k = 0; k < 4; ++k) {
                int nr = cur.first + dr[k], nc = cur.second + dc[k];
                if (nr >= 0 && nc >= 0 && nr < m && nc < n && a[nr][nc] < a[cur.first][cur.second] && --outdeg[nr][nc] == 0)
                    q.push({nr, nc});
            }
        }
    }
    return layers;                                          // the number of layers equals the longest path length
}`, 'C++'),
      java(`
public int longestIncreasingPath(int[][] a) {
    int m = a.length, n = a[0].length;
    int[][] outdeg = new int[m][n];                     // how many strictly larger neighbours a cell has
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nc >= 0 && nr < m && nc < n && a[nr][nc] > a[r][c]) outdeg[r][c]++;
            }
    Deque<int[]> queue = new ArrayDeque<>();
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (outdeg[r][c] == 0) queue.add(new int[]{r, c});      // local maxima end every path
    int layers = 0;
    while (!queue.isEmpty()) {                          // peel the grid layer by layer, from the largest values down
        layers++;
        for (int size = queue.size(); size > 0; size--) {
            int[] cur = queue.poll();
            for (int[] d : dirs) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr >= 0 && nc >= 0 && nr < m && nc < n && a[nr][nc] < a[cur[0]][cur[1]] && --outdeg[nr][nc] == 0)
                    queue.add(new int[]{nr, nc});
            }
        }
    }
    return layers;                                      // the number of layers equals the longest path length
}`, 'Java'),
    ],
    finalComplexity: "O(m·n) time, O(m·n) space.",
    testCases: [
      { input: "[[9,9,4],[6,6,8],[2,1,1]]", expected: "4", why: "1 → 2 → 6 → 9" },
      { input: "[[3,4,5],[3,2,6],[2,2,1]]", expected: "4", why: "3 → 4 → 5 → 6" },
      { input: "[[1]]", expected: "1", why: "Single cell" },
      { input: "[[1,2]]", expected: "2", why: "Single row" },
    ],
    takeawaysMd: "Longest path in a DAG can be found by topological layering; \"strictly increasing\" guarantees there are no cycles.",
  },

  "reconstruct-itinerary": {
    understandMd: "Given airline tickets as [from, to] pairs, rebuild an itinerary that starts at \"JFK\" and uses every ticket exactly once. If several valid itineraries exist, return the one that is smallest in lexical order.",
    ioConstraintsMd: "Input: up to 300 tickets with 3-letter airport codes; a valid itinerary is guaranteed to exist. Output: the list of airports in visiting order.",
    edgeCases: ["Multiple tickets from the same airport (choose the smallest destination first, but not into a dead end)", "Cycles that return to JFK", "A dead-end airport that must be visited last", "Single ticket"],
    bruteForceMd: "Backtracking: try destinations in lexical order and undo when you get stuck.",
    bruteComplexity: "Exponential in the worst case.",
    bottleneckMd: "The problem asks for an Eulerian path (using every edge exactly once). Hierholzer's algorithm finds one in linear time: follow edges greedily, and when you hit a dead end, add that airport to the answer (in reverse).",
    hints: [
      "You must use every ticket exactly once. What kind of path in a graph is that?", "Greedily taking the smallest destination can strand you at a dead end before using all tickets. How can you fix the order afterwards?", "Hierholzer: do a DFS that always takes the smallest unused edge; when a node has no more outgoing edges, push it to the result.", "The result is built in reverse: reverse it (or insert at the front) at the end.",
    ],
    optimalMd: "Store the destinations of every airport in a sorted structure (a min-heap or multiset). Run an iterative DFS from JFK: while the current airport has unused tickets, push its smallest destination; when it has none, pop it and put it at the front of the route. Dead ends are therefore placed last, and the leftover cycles are spliced in correctly. The final route uses each ticket once and is lexically smallest because the smallest edges are taken first.",
    code: [
      cpp(`
vector<string> findItinerary(vector<vector<string>>& tickets) {
    map<string, multiset<string>> graph;                    // multiset keeps destinations in lexical order
    for (auto& t : tickets) graph[t[0]].insert(t[1]);
    vector<string> route;
    stack<string> st;
    st.push("JFK");
    while (!st.empty()) {                                   // Hierholzer's algorithm for an Eulerian path
        string from = st.top();
        auto& next = graph[from];
        if (!next.empty()) {                                // use the smallest unused ticket
            st.push(*next.begin());
            next.erase(next.begin());
        } else {                                            // dead end: this airport belongs at the end of the route
            route.push_back(from);
            st.pop();
        }
    }
    reverse(route.begin(), route.end());
    return route;
}`, 'C++'),
      java(`
public List<String> findItinerary(List<List<String>> tickets) {
    Map<String, PriorityQueue<String>> graph = new HashMap<>();
    for (List<String> t : tickets) graph.computeIfAbsent(t.get(0), k -> new PriorityQueue<>()).add(t.get(1));
    LinkedList<String> route = new LinkedList<>();
    Deque<String> stack = new ArrayDeque<>();
    stack.push("JFK");
    while (!stack.isEmpty()) {                          // Hierholzer's algorithm for an Eulerian path
        String from = stack.peek();
        PriorityQueue<String> next = graph.get(from);
        if (next != null && !next.isEmpty()) stack.push(next.poll());   // use the smallest unused ticket
        else route.addFirst(stack.pop());               // dead end: this airport belongs at the end of the route
    }
    return route;
}`, 'Java'),
    ],
    finalComplexity: "O(E log E) time, O(E) space.",
    testCases: [
      { input: "[[\"MUC\",\"LHR\"],[\"JFK\",\"MUC\"],[\"SFO\",\"SJC\"],[\"LHR\",\"SFO\"]]", expected: "[\"JFK\",\"MUC\",\"LHR\",\"SFO\",\"SJC\"]", why: "Single path" },
      { input: "[[\"JFK\",\"SFO\"],[\"JFK\",\"ATL\"],[\"SFO\",\"ATL\"],[\"ATL\",\"JFK\"],[\"ATL\",\"SFO\"]]", expected: "[\"JFK\",\"ATL\",\"JFK\",\"SFO\",\"ATL\",\"SFO\"]", why: "Smallest destination first, with a cycle" },
      { input: "[[\"JFK\",\"KUL\"],[\"JFK\",\"NRT\"],[\"NRT\",\"JFK\"]]", expected: "[\"JFK\",\"NRT\",\"JFK\",\"KUL\"]", why: "Dead end KUL must come last" },
      { input: "[[\"JFK\",\"AAA\"]]", expected: "[\"JFK\",\"AAA\"]", why: "One ticket" },
    ],
    takeawaysMd: "Using every edge once is an Eulerian path: Hierholzer's algorithm with edges taken in sorted order and the result reversed.",
  },

  "design-twitter": {
    understandMd: "Design a simplified Twitter supporting postTweet, follow, unfollow and getNewsFeed, where the news feed returns the 10 most recent tweet ids from the user and the people they follow, newest first.",
    ioConstraintsMd: "Input: a sequence of up to 3 × 10⁴ operations on small user and tweet ids. Output: results of getNewsFeed calls.",
    edgeCases: ["A user following nobody (own tweets only)", "Following and unfollowing the same user repeatedly", "Fewer than 10 tweets available", "A user following themselves (ignored)"],
    bruteForceMd: "On every getNewsFeed, collect all tweets of all followed users, sort by time and take 10.",
    bruteComplexity: "O(T log T) per feed request (T = total tweets).",
    bottleneckMd: "Each user's tweets are already stored in time order, so the feed is a merge of already-sorted lists. A heap keeps only each user's newest unmerged tweet and stops after 10.",
    hints: [
      "What is the order of each user's own tweet list, and what does that mean for the news feed?", "The feed is a merge of several sorted lists. Which structure merges k sorted lists lazily?", "Seed a max-heap with the newest tweet of each followed user (and the user). Pop the newest, then push the previous tweet of the same user.", "Stop after 10 tweets; follow and unfollow are set operations.",
    ],
    optimalMd: "Give every tweet a global timestamp and store each user's tweets in a list (oldest to newest). A user's followees are kept in a set. For the news feed, build a max-heap keyed by time that initially contains the newest tweet of the user and of each followee; repeatedly pop the newest tweet, add it to the feed, and push the next older tweet of the same author, until 10 tweets have been collected or the heap is empty. Post, follow and unfollow are O(1).",
    code: [
      cpp(`
class Twitter {
    int time = 0;
    unordered_map<int, vector<pair<int, int>>> tweets;      // user -> list of (time, tweetId)
    unordered_map<int, unordered_set<int>> following;
public:
    void postTweet(int userId, int tweetId) { tweets[userId].push_back({time++, tweetId}); }
    vector<int> getNewsFeed(int userId) {
        // heap entries: (time, tweetId, user, index of the tweet in that user's list)
        priority_queue<tuple<int, int, int, int>> heap;     // largest time (newest) first
        vector<int> users(following[userId].begin(), following[userId].end());
        users.push_back(userId);                            // a user sees their own tweets too
        for (int u : users) {
            auto it = tweets.find(u);
            if (it != tweets.end() && !it->second.empty()) {    // seed the heap with each user's newest tweet
                int last = it->second.size() - 1;
                heap.push(make_tuple(it->second[last].first, it->second[last].second, u, last));
            }
        }
        vector<int> feed;
        while (!heap.empty() && feed.size() < 10) {         // k-way merge of the users' tweet lists
            auto top = heap.top(); heap.pop();
            feed.push_back(get<1>(top));
            int u = get<2>(top), idx = get<3>(top) - 1;
            if (idx >= 0) heap.push(make_tuple(tweets[u][idx].first, tweets[u][idx].second, u, idx));
        }
        return feed;
    }
    void follow(int followerId, int followeeId) { if (followerId != followeeId) following[followerId].insert(followeeId); }
    void unfollow(int followerId, int followeeId) { following[followerId].erase(followeeId); }
};`, 'C++'),
      java(`
class Twitter {
    private int time = 0;
    private final Map<Integer, List<int[]>> tweets = new HashMap<>();   // user -> list of {time, tweetId}
    private final Map<Integer, Set<Integer>> following = new HashMap<>();

    public Twitter() {}
    public void postTweet(int userId, int tweetId) {
        tweets.computeIfAbsent(userId, k -> new ArrayList<>()).add(new int[]{time++, tweetId});
    }
    public List<Integer> getNewsFeed(int userId) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(b[0], a[0]));   // newest first
        List<Integer> users = new ArrayList<>(following.getOrDefault(userId, new HashSet<>()));
        users.add(userId);                              // a user sees their own tweets too
        for (int u : users) {
            List<int[]> list = tweets.get(u);
            if (list != null && !list.isEmpty()) {      // seed the heap with each user's newest tweet
                int last = list.size() - 1;
                heap.add(new int[]{list.get(last)[0], list.get(last)[1], u, last});
            }
        }
        List<Integer> feed = new ArrayList<>();
        while (!heap.isEmpty() && feed.size() < 10) {   // k-way merge of the users' tweet lists
            int[] top = heap.poll();
            feed.add(top[1]);
            int idx = top[3] - 1;
            if (idx >= 0) { int[] t = tweets.get(top[2]).get(idx); heap.add(new int[]{t[0], t[1], top[2], idx}); }
        }
        return feed;
    }
    public void follow(int followerId, int followeeId) {
        if (followerId != followeeId) following.computeIfAbsent(followerId, k -> new HashSet<>()).add(followeeId);
    }
    public void unfollow(int followerId, int followeeId) {
        Set<Integer> s = following.get(followerId);
        if (s != null) s.remove(followeeId);
    }
}`, 'Java'),
    ],
    finalComplexity: "postTweet, follow, unfollow O(1); getNewsFeed O(f + 10 log f) for f followed users.",
    testCases: [
      { input: "post(1,5); feed(1)", expected: "[5]", why: "Own tweet" },
      { input: "follow(1,2); post(2,6); feed(1)", expected: "[6,5]", why: "Followee tweet is newer" },
      { input: "unfollow(1,2); feed(1)", expected: "[5]", why: "Unfollow removes it" },
      { input: "15 posts by one user", expected: "the 10 newest", why: "Feed cap" },
    ],
    takeawaysMd: "A \"latest k\" feed across users is a lazy k-way merge of time-ordered lists using a heap.",
  },

  "partition-equal-subset-sum": {
    understandMd: "Decide whether an array of positive integers can be split into two subsets with equal sums.",
    ioConstraintsMd: "Input: up to 200 integers in [1, 100]. Output: true or false.",
    edgeCases: ["Odd total sum (impossible)", "Single element", "One element larger than half the total", "Many small numbers"],
    bruteForceMd: "Try every subset and compare its sum with half of the total.",
    bruteComplexity: "O(2ⁿ) time.",
    bottleneckMd: "The question is whether some subset sums to total / 2, which is the classic 0/1 subset-sum problem solvable with a reachable-sums table over the (small) target range.",
    hints: [
      "If the two subsets have equal sums, what must each of them add up to?", "If the total is odd, what is the answer immediately?", "Reduce to: is there a subset with sum exactly total / 2? Which DP answers this?", "dp[s] = can some subset reach sum s. Process each number once, updating s from high to low so it is not reused.",
    ],
    optimalMd: "If the total is odd the answer is false. Otherwise look for a subset summing to target = total / 2. Keep a boolean array dp[0..target] with dp[0] = true; for each number x update dp[s] |= dp[s − x] for s from target down to x. Iterating downwards ensures each number is used at most once per subset. The answer is dp[target].",
    code: [
      cpp(`
bool canPartition(vector<int>& nums) {
    int sum = accumulate(nums.begin(), nums.end(), 0);
    if (sum % 2 != 0) return false;                         // an odd total cannot be split evenly
    int target = sum / 2;
    vector<char> dp(target + 1, 0);                         // dp[s]: some subset of the numbers sums to s
    dp[0] = 1;
    for (int x : nums)
        for (int s = target; s >= x; --s)                   // go downwards so each number is used at most once
            dp[s] |= dp[s - x];
    return dp[target];
}`, 'C++'),
      java(`
public boolean canPartition(int[] nums) {
    int sum = 0;
    for (int x : nums) sum += x;
    if (sum % 2 != 0) return false;                     // an odd total cannot be split evenly
    int target = sum / 2;
    boolean[] dp = new boolean[target + 1];             // dp[s]: some subset of the numbers sums to s
    dp[0] = true;
    for (int x : nums)
        for (int s = target; s >= x; s--)               // go downwards so each number is used at most once
            dp[s] |= dp[s - x];
    return dp[target];
}`, 'Java'),
    ],
    finalComplexity: "O(n · target) time, O(target) space.",
    testCases: [
      { input: "[1,5,11,5]", expected: "true", why: "11 and 1 + 5 + 5" },
      { input: "[1,2,3,5]", expected: "false", why: "Total 11 is odd" },
      { input: "[1,1]", expected: "true", why: "Two equal numbers" },
      { input: "[2]", expected: "false", why: "A single number cannot be split" },
    ],
    takeawaysMd: "\"Two groups with equal sums\" reduces to subset sum to half the total; iterate sums downwards for 0/1 usage.",
  },

  "target-sum": {
    understandMd: "Assign a plus or minus sign to every number of the array so that the signed sum equals the target, and count how many assignments achieve it.",
    ioConstraintsMd: "Input: up to 20 non-negative integers (sum at most 1,000) and a target in [−1000, 1000]. Output: the number of sign assignments.",
    edgeCases: ["Zeros (each zero doubles the count because +0 and −0 differ)", "Target larger than the total sum", "Odd/even parity mismatch", "Single number"],
    bruteForceMd: "Try every one of the 2ⁿ sign assignments (or recurse with memoisation on (index, sum)).",
    bruteComplexity: "O(2ⁿ) time.",
    bottleneckMd: "Splitting the numbers into a plus group P and a minus group N gives P − N = target and P + N = total, so P = (total + target) / 2. Counting sign assignments becomes counting subsets with that sum.",
    hints: [
      "Let P be the sum of numbers with a plus sign and N the sum of those with a minus sign. What two equations do you have?", "Solve for P. When is that impossible?", "The count equals the number of subsets whose sum is P: a counting version of subset sum.", "dp[s] += dp[s − x] for each number x, iterating s downwards; dp[0] = 1.",
    ],
    optimalMd: "From P − N = target and P + N = sum you get P = (sum + target) / 2. If |target| > sum or the parity is wrong the answer is 0. Otherwise count the subsets of the numbers whose sum is P with a 0/1 knapsack counting DP: dp[0] = 1 and, for each x, dp[s] += dp[s − x] for s from P down to x. Zeros are handled naturally because they double every count.",
    code: [
      cpp(`
int findTargetSumWays(vector<int>& nums, int target) {
    int sum = accumulate(nums.begin(), nums.end(), 0);
    if (abs(target) > sum || (sum + target) % 2 != 0) return 0;
    int need = (sum + target) / 2;                          // P - N = target and P + N = sum, so P = (sum + target) / 2
    vector<int> dp(need + 1, 0);                            // dp[s]: ways to pick numbers (the "+" group) that add up to s
    dp[0] = 1;
    for (int x : nums)
        for (int s = need; s >= x; --s) dp[s] += dp[s - x];
    return dp[need];
}`, 'C++'),
      java(`
public int findTargetSumWays(int[] nums, int target) {
    int sum = 0;
    for (int x : nums) sum += x;
    if (Math.abs(target) > sum || (sum + target) % 2 != 0) return 0;
    int need = (sum + target) / 2;                      // P - N = target and P + N = sum, so P = (sum + target) / 2
    int[] dp = new int[need + 1];                       // dp[s]: ways to pick numbers (the "+" group) that add up to s
    dp[0] = 1;
    for (int x : nums)
        for (int s = need; s >= x; s--) dp[s] += dp[s - x];
    return dp[need];
}`, 'Java'),
    ],
    finalComplexity: "O(n · P) time, O(P) space.",
    testCases: [
      { input: "[1,1,1,1,1], target 3", expected: "5", why: "Choose which one number is negative" },
      { input: "[1], target 1", expected: "1", why: "Single +1" },
      { input: "[1], target 2", expected: "0", why: "Impossible" },
      { input: "[0,0,0,0,0,0,0,0,1], target 1", expected: "256", why: "Each zero can have either sign" },
    ],
    takeawaysMd: "Sign-assignment counting becomes subset-sum counting by algebra: P = (sum + target) / 2.",
  },

  "coin-change-ii": {
    understandMd: "Given coin denominations (unlimited supply of each) and an amount, count the number of different combinations that make exactly that amount. Order does not matter.",
    ioConstraintsMd: "Input: up to 300 distinct coins and an amount up to 5,000. Output: the number of combinations (fits in 32 bits).",
    edgeCases: ["Amount 0 (one combination: use no coins)", "Amount smaller than every coin", "Single coin", "Large amounts (overflow in intermediate values for adversarial inputs)"],
    bruteForceMd: "Recursively choose, for each coin, how many copies to use.",
    bruteComplexity: "Exponential.",
    bottleneckMd: "Counting combinations rather than ordered sequences needs the coin loop on the outside, so each combination is built in one canonical order; the table over amounts is then a simple unbounded knapsack count.",
    hints: [
      "How is counting combinations different from counting sequences of coins?", "Process one denomination at a time. When you add a coin type, how do ways to reach amount a change?", "ways[a] += ways[a − coin] for a from coin to amount (increasing order allows reuse).", "Put the coins in the OUTER loop; swapping the loops would count permutations.",
    ],
    optimalMd: "Let dp[a] be the number of combinations that make amount a, with dp[0] = 1. For each coin c in turn, for a from c up to the amount, add dp[a − c] to dp[a]: this counts the combinations that use at least one more copy of c, after having considered only earlier coin types. Because the coins form the outer loop, each multiset of coins is counted exactly once.",
    code: [
      cpp(`
int change(int amount, vector<int>& coins) {
    vector<unsigned> dp(amount + 1, 0);                     // dp[a]: number of coin combinations that make a
    dp[0] = 1;
    for (int c : coins)                                     // coins in the OUTER loop count combinations, not orderings
        for (int a = c; a <= amount; ++a) dp[a] += dp[a - c];
    return (int)dp[amount];
}`, 'C++'),
      java(`
public int change(int amount, int[] coins) {
    int[] dp = new int[amount + 1];                     // dp[a]: number of coin combinations that make a
    dp[0] = 1;
    for (int c : coins)                                 // coins in the OUTER loop count combinations, not orderings
        for (int a = c; a <= amount; a++) dp[a] += dp[a - c];
    return dp[amount];
}`, 'Java'),
    ],
    finalComplexity: "O(n · amount) time, O(amount) space.",
    testCases: [
      { input: "amount 5, coins [1,2,5]", expected: "4", why: "5, 2+2+1, 2+1+1+1, 1×5" },
      { input: "amount 3, coins [2]", expected: "0", why: "Cannot make 3" },
      { input: "amount 10, coins [10]", expected: "1", why: "One coin" },
      { input: "amount 0, coins [7]", expected: "1", why: "Empty combination" },
    ],
    takeawaysMd: "Combinations vs permutations in coin DP is decided by loop order: coins outside gives combinations.",
  },

  "permutation-in-string": {
    understandMd: "Decide whether the second string contains a substring that is a permutation of the first string (same letters with the same counts, in any order).",
    ioConstraintsMd: "Input: two lowercase strings, up to 10⁴ characters each. Output: true or false.",
    edgeCases: ["s1 longer than s2", "Repeated letters in s1 (counts matter)", "Permutation at the very start or end", "Single-character strings"],
    bruteForceMd: "Sort every window of s2 of length |s1| and compare it with the sorted s1.",
    bruteComplexity: "O(m · n log n) time.",
    bottleneckMd: "Comparing sorted windows repeats work. A window only changes by one character at a time, so letter counts can be updated incrementally in O(1).",
    hints: [
      "What identifies a permutation of s1: what should two strings have in common?", "Slide a fixed-size window over s2 and keep letter counts. How much changes per step?", "Add the new character and remove the old one; compare the two 26-entry count arrays.", "To avoid comparing 26 counts each time, maintain how many letters currently have equal counts and test it against 26.",
    ],
    optimalMd: "Count the letters of s1. Maintain the letter counts of the current window of the same length in s2 and the number of letters whose window count equals the needed count. Sliding the window by one adds the new character and removes the old one; adjust the \"matches\" counter whenever a letter becomes equal or stops being equal. If matches reaches 26 the window is a permutation. Each slide costs O(1).",
    code: [
      cpp(`
bool checkInclusion(string s1, string s2) {
    int n = s1.size(), m = s2.size();
    if (n > m) return false;
    int need[26] = {0}, window[26] = {0};
    for (int i = 0; i < n; ++i) { ++need[s1[i] - 'a']; ++window[s2[i] - 'a']; }
    int matches = 0;                                        // how many of the 26 letters have equal counts
    for (int i = 0; i < 26; ++i) if (need[i] == window[i]) ++matches;
    for (int right = n; right < m; ++right) {
        if (matches == 26) return true;
        int add = s2[right] - 'a', drop = s2[right - n] - 'a';
        ++window[add];                                      // slide the window by one character
        if (window[add] == need[add]) ++matches; else if (window[add] == need[add] + 1) --matches;
        --window[drop];
        if (window[drop] == need[drop]) ++matches; else if (window[drop] == need[drop] - 1) --matches;
    }
    return matches == 26;
}`, 'C++'),
      java(`
public boolean checkInclusion(String s1, String s2) {
    int n = s1.length(), m = s2.length();
    if (n > m) return false;
    int[] need = new int[26], window = new int[26];
    for (int i = 0; i < n; i++) { need[s1.charAt(i) - 'a']++; window[s2.charAt(i) - 'a']++; }
    int matches = 0;                                    // how many of the 26 letters have equal counts
    for (int i = 0; i < 26; i++) if (need[i] == window[i]) matches++;
    for (int right = n; right < m; right++) {
        if (matches == 26) return true;
        int add = s2.charAt(right) - 'a', drop = s2.charAt(right - n) - 'a';
        window[add]++;                                  // slide the window by one character
        if (window[add] == need[add]) matches++; else if (window[add] == need[add] + 1) matches--;
        window[drop]--;
        if (window[drop] == need[drop]) matches++; else if (window[drop] == need[drop] - 1) matches--;
    }
    return matches == 26;
}`, 'Java'),
    ],
    finalComplexity: "O(|s1| + |s2|) time, O(1) space.",
    testCases: [
      { input: "\"ab\", \"eidbaooo\"", expected: "true", why: "Window \"ba\"" },
      { input: "\"ab\", \"eidboaoo\"", expected: "false", why: "No adjacent pair" },
      { input: "\"a\", \"a\"", expected: "true", why: "Single letters" },
      { input: "\"abc\", \"ab\"", expected: "false", why: "Pattern longer than text" },
    ],
    takeawaysMd: "Fixed-size window + count arrays + a \"matches\" counter makes anagram detection O(1) per slide.",
  },

  "task-scheduler": {
    understandMd: "You have tasks labelled A to Z, each taking one unit of time, and the CPU may do one task or stay idle each unit. The same task type must be separated by at least n units of cooldown. Find the minimum time needed to finish all tasks.",
    ioConstraintsMd: "Input: up to 10⁴ tasks and 0 ≤ n ≤ 100. Output: the minimum number of time units (including idle slots).",
    edgeCases: ["n = 0 (no idle time needed)", "One dominant task type", "Several task types tied for the maximum frequency", "Enough variety that no idle slots are needed"],
    bruteForceMd: "Simulate with a max-heap of remaining counts and a cooldown queue (this works and runs in O(T log 26)).",
    bruteComplexity: "O(T log 26) time.",
    bottleneckMd: "A closed formula exists: the most frequent task forces a frame of (maxFreq − 1) groups of length n + 1 plus a final group; other tasks fill the gaps, and idle time appears only if there are too few of them.",
    hints: [
      "Which task type determines how long the schedule must be at least?", "If A appears maxFreq times, the A's need maxFreq − 1 gaps of n other slots between them. What is the frame length?", "Tasks that tie for the maximum frequency all occupy the last row. How does that change the formula?", "answer = max(number of tasks, (maxFreq − 1) × (n + 1) + numberWithMaxFreq).",
    ],
    optimalMd: "Let maxFreq be the highest task count and numMax the number of task types having that count. The schedule must contain maxFreq − 1 full blocks of n + 1 slots (the most frequent task followed by n slots) and a final partial block holding the numMax tied tasks, giving (maxFreq − 1) × (n + 1) + numMax slots. If there are more tasks than that, they fill the gaps without idle time, so the answer is the larger of the task count and the frame length.",
    code: [
      cpp(`
int leastInterval(vector<char>& tasks, int n) {
    int count[26] = {0};
    for (char t : tasks) ++count[t - 'A'];
    int maxFreq = 0, numMax = 0;
    for (int c : count) {
        if (c > maxFreq) { maxFreq = c; numMax = 1; }
        else if (c == maxFreq) ++numMax;                    // how many tasks share the highest frequency
    }
    int frame = (maxFreq - 1) * (n + 1) + numMax;           // the most frequent task dictates the layout
    return max((int)tasks.size(), frame);                   // idle slots are only needed when the frame is longer
}`, 'C++'),
      java(`
public int leastInterval(char[] tasks, int n) {
    int[] count = new int[26];
    for (char t : tasks) count[t - 'A']++;
    int maxFreq = 0, numMax = 0;
    for (int c : count) {
        if (c > maxFreq) { maxFreq = c; numMax = 1; }
        else if (c == maxFreq) numMax++;                // how many tasks share the highest frequency
    }
    int frame = (maxFreq - 1) * (n + 1) + numMax;       // the most frequent task dictates the layout
    return Math.max(tasks.length, frame);               // idle slots are only needed when the frame is longer
}`, 'Java'),
    ],
    finalComplexity: "O(T) time, O(1) space.",
    testCases: [
      { input: "A,A,A,B,B,B with n = 2", expected: "8", why: "A B _ A B _ A B" },
      { input: "same with n = 0", expected: "6", why: "No cooldown" },
      { input: "A×6, B, C, D, E, F, G with n = 2", expected: "16", why: "Frame determined by A" },
      { input: "[\"A\"] with n = 5", expected: "1", why: "Single task" },
    ],
    takeawaysMd: "Scheduling with cooldown: the most frequent task creates a frame; extra tasks fill gaps, so the answer is max(tasks, frame).",
  },

  "valid-parenthesis-string": {
    understandMd: "A string contains \"(\", \")\" and \"*\", where \"*\" can be treated as \"(\", \")\" or an empty string. Decide whether the string can be made a valid balanced parenthesis sequence.",
    ioConstraintsMd: "Input: string of up to 100 characters. Output: true or false.",
    edgeCases: ["Only stars", "A star at the start that cannot close anything", "Closing brackets before any opening bracket", "Many stars after opening brackets"],
    bruteForceMd: "Try all three interpretations of every star (3^k combinations) and check balance.",
    bruteComplexity: "O(3^k · n) time.",
    bottleneckMd: "Instead of choosing a meaning for each star, track the whole range of possible open-bracket counts: a star widens the range by one on each side. The string is valid if 0 stays reachable at the end.",
    hints: [
      "For a fixed interpretation you only need the number of unmatched \"(\". With stars, there are many possible values: what describes them?", "Keep the minimum and maximum possible number of open brackets. What does each character do to them?", "\"(\" adds one to both; \")\" subtracts one from both; \"*\" subtracts one from the minimum and adds one to the maximum.", "If the maximum ever drops below 0, fail. Clamp the minimum at 0. At the end the string is valid iff the minimum is 0.",
    ],
    optimalMd: "Maintain lo and hi: the smallest and largest possible number of unmatched \"(\" over all interpretations seen so far. \"(\" increments both; \")\" decrements both; \"*\" decrements lo (as \")\") and increments hi (as \"(\"). If hi becomes negative there are too many \")\" for any interpretation, so return false. A negative lo only means some interpretation would be invalid, so clamp it to 0. After the last character the string can be balanced exactly when lo == 0.",
    code: [
      cpp(`
bool checkValidString(string s) {
    int lo = 0, hi = 0;                                     // the range of possible counts of unmatched '('
    for (char ch : s) {
        if (ch == '(') { ++lo; ++hi; }
        else if (ch == ')') { --lo; --hi; }
        else { --lo; ++hi; }                                // '*' can be ')', empty or '('
        if (hi < 0) return false;                           // too many ')' even if every '*' were '('
        lo = max(lo, 0);                                    // the count of unmatched '(' cannot be negative
    }
    return lo == 0;
}`, 'C++'),
      java(`
public boolean checkValidString(String s) {
    int lo = 0, hi = 0;                                 // the range of possible counts of unmatched '('
    for (char ch : s.toCharArray()) {
        if (ch == '(') { lo++; hi++; }
        else if (ch == ')') { lo--; hi--; }
        else { lo--; hi++; }                            // '*' can be ')', empty or '('
        if (hi < 0) return false;                       // too many ')' even if every '*' were '('
        lo = Math.max(lo, 0);                           // the count of unmatched '(' cannot be negative
    }
    return lo == 0;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "\"()\"", expected: "true", why: "Plain" },
      { input: "\"(*)\"", expected: "true", why: "Star as empty" },
      { input: "\"(*))\"", expected: "true", why: "Star as \"(\"" },
      { input: "\")(\"", expected: "false", why: "Closes before opening" },
      { input: "\"*(\"", expected: "false", why: "Open bracket never closed" },
    ],
    takeawaysMd: "When many wildcard interpretations exist, track the interval of reachable counts instead of enumerating choices.",
  },

  "max-area-of-island": {
    understandMd: "In a binary grid, an island is a group of 1 cells connected horizontally or vertically. Return the area (cell count) of the largest island, or 0 if there is none.",
    ioConstraintsMd: "Input: grid up to 50 × 50 of 0s and 1s. Output: the maximum island area.",
    edgeCases: ["No land at all", "Single cell", "Diagonal neighbours do not connect", "The whole grid is one island"],
    bruteForceMd: "For every land cell, search for its connected cells again, counting duplicates.",
    bruteComplexity: "O((m·n)²) time without a visited mark.",
    bottleneckMd: "Each land cell belongs to exactly one island, so you only need to explore each island once: a flood fill that marks cells as visited counts each island in a single traversal.",
    hints: [
      "How do you avoid counting the same island repeatedly?", "When you find an unvisited land cell, explore everything connected to it and mark it visited.", "The area is the number of cells visited by that exploration. Keep the maximum.", "Sinking cells (setting them to 0) works as a visited mark; use an explicit stack to avoid deep recursion.",
    ],
    optimalMd: "Scan the grid. At each land cell start a flood fill (DFS or BFS), marking cells as visited by turning them into 0, and count how many cells it visits. The count is the island area; update the maximum. Every cell is visited at most once, so the total work is linear in the grid size.",
    code: [
      cpp(`
int maxAreaOfIsland(vector<vector<int>>& grid) {
    int m = grid.size(), n = grid[0].size(), best = 0;
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int r = 0; r < m; ++r) {
        for (int c = 0; c < n; ++c) {
            if (grid[r][c] != 1) continue;
            int area = 0;
            stack<pair<int, int>> st;
            grid[r][c] = 0;                                 // sink cells as they are discovered (acts as "visited")
            st.push({r, c});
            while (!st.empty()) {
                auto cur = st.top(); st.pop();
                ++area;
                for (int k = 0; k < 4; ++k) {
                    int nr = cur.first + dr[k], nc = cur.second + dc[k];
                    if (nr >= 0 && nc >= 0 && nr < m && nc < n && grid[nr][nc] == 1) { grid[nr][nc] = 0; st.push({nr, nc}); }
                }
            }
            best = max(best, area);
        }
    }
    return best;
}`, 'C++'),
      java(`
public int maxAreaOfIsland(int[][] grid) {
    int m = grid.length, n = grid[0].length, best = 0;
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    for (int r = 0; r < m; r++) {
        for (int c = 0; c < n; c++) {
            if (grid[r][c] != 1) continue;
            int area = 0;
            Deque<int[]> stack = new ArrayDeque<>();
            grid[r][c] = 0;                             // sink cells as they are discovered (acts as "visited")
            stack.push(new int[]{r, c});
            while (!stack.isEmpty()) {
                int[] cur = stack.pop();
                area++;
                for (int[] d : dirs) {
                    int nr = cur[0] + d[0], nc = cur[1] + d[1];
                    if (nr >= 0 && nc >= 0 && nr < m && nc < n && grid[nr][nc] == 1) { grid[nr][nc] = 0; stack.push(new int[]{nr, nc}); }
                }
            }
            best = Math.max(best, area);
        }
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: "O(m·n) time, O(m·n) space in the worst case for the stack.",
    testCases: [
      { input: "The 8 × 13 sample grid", expected: "6", why: "Largest island has six cells" },
      { input: "[[0,0,0,0,0,0,0,0]]", expected: "0", why: "No land" },
      { input: "[[1,1],[1,1]]", expected: "4", why: "Whole grid" },
      { input: "[[1,0,1],[0,1,0],[1,0,1]]", expected: "1", why: "Diagonals do not connect" },
    ],
    takeawaysMd: "Island problems are flood fills: mark cells as you visit them so each island is counted once.",
  },

  "kth-largest-element-in-a-stream": {
    understandMd: "Design a class that is created with an integer k and an initial list of numbers and supports add(val), which inserts a number into the stream and returns the k-th largest element so far.",
    ioConstraintsMd: "Input: k, initial array (possibly empty) and up to 10⁴ add calls; there are always at least k elements after an add. Output: the k-th largest after each add.",
    edgeCases: ["Initial array shorter than k", "k = 1 (the maximum)", "Duplicate values", "Negative numbers"],
    bruteForceMd: "Keep all numbers in a sorted list and index the k-th largest on every add.",
    bruteComplexity: "O(n) per insertion (shifting) or O(n log n) per query when sorting.",
    bottleneckMd: "You only ever need the k largest values and, among them, the smallest. A min-heap of size k keeps exactly that, with its top being the answer.",
    hints: [
      "Which elements can ever be the k-th largest? Do you need to remember the rest?", "Keep only the k largest values. Which element of that set do you need to read quickly?", "A min-heap of size k: its smallest element is the k-th largest overall.", "On add: push, and if the size exceeds k, pop the smallest. Return the top.",
    ],
    optimalMd: "Keep a min-heap that holds the k largest values seen so far. On add(val), push the value; if the heap now has more than k elements, pop the smallest, because it cannot be among the k largest. The top of the heap is then the k-th largest element. Constructing from the initial array is just repeated add calls.",
    code: [
      cpp(`
class KthLargest {
    priority_queue<int, vector<int>, greater<int>> heap;    // the k largest values so far, smallest on top
    int k;
public:
    KthLargest(int k, vector<int>& nums) : k(k) {
        for (int x : nums) add(x);
    }
    int add(int val) {
        heap.push(val);
        if ((int)heap.size() > k) heap.pop();               // drop the smallest: it is not among the k largest
        return heap.top();                                  // the k-th largest overall
    }
};`, 'C++'),
      java(`
class KthLargest {
    private final PriorityQueue<Integer> heap = new PriorityQueue<>();   // the k largest values so far, smallest on top
    private final int k;

    public KthLargest(int k, int[] nums) {
        this.k = k;
        for (int x : nums) add(x);
    }
    public int add(int val) {
        heap.add(val);
        if (heap.size() > k) heap.poll();               // drop the smallest: it is not among the k largest
        return heap.peek();                             // the k-th largest overall
    }
}`, 'Java'),
    ],
    finalComplexity: "O(log k) per add, O(k) space.",
    testCases: [
      { input: "k = 3, [4,5,8,2], add 3, 5, 10, 9, 4", expected: "4, 5, 5, 8, 8", why: "Classic" },
      { input: "k = 1, [], add −3, −2, −4, 0, 4", expected: "−3, −2, −2, 0, 4", why: "Maximum tracking" },
    ],
    takeawaysMd: "Streaming k-th largest = a size-k min-heap; the heap root is the answer.",
  },

  "min-cost-climbing-stairs": {
    understandMd: "Each stair has a cost to step on it. You may start from step 0 or step 1 and may climb one or two steps at a time. Find the minimum cost to reach the top (one position past the last stair).",
    ioConstraintsMd: "Input: array of 2 to 1,000 non-negative costs. Output: the minimum cost.",
    edgeCases: ["Two stairs only", "All costs zero", "A very expensive stair in the middle that can be skipped", "Costs at the end that decide between the last two stairs"],
    bruteForceMd: "Recursively try climbing one or two steps from each position.",
    bruteComplexity: "O(2ⁿ) time.",
    bottleneckMd: "The cheapest way to stand on a step depends only on the two previous steps, so a two-variable DP replaces the recursion.",
    hints: [
      "To arrive at step i, from which steps could you have come?", "Let best[i] be the minimum cost to reach step i (before paying its cost). What is the recurrence?", "best[i] = min(best[i−1] + cost[i−1], best[i−2] + cost[i−2]); start with best[0] = best[1] = 0.", "The top is index n, so the answer is best[n]. Only the last two values are needed.",
    ],
    optimalMd: "Define best[i] as the cheapest cost to be standing at position i without having paid for i itself yet; best[0] = best[1] = 0 because you can start on either step for free. To arrive at i you either leave step i − 1 (paying cost[i − 1]) or step i − 2 (paying cost[i − 2]), so best[i] = min(best[i − 1] + cost[i − 1], best[i − 2] + cost[i − 2]). The answer is best[n] where n is the number of stairs, kept in two variables.",
    code: [
      cpp(`
int minCostClimbingStairs(vector<int>& cost) {
    int a = 0, b = 0;                                       // cheapest cost to stand on step i - 2 and step i - 1 (start is free)
    for (int i = 2; i <= (int)cost.size(); ++i) {
        int c = min(b + cost[i - 1], a + cost[i - 2]);      // reach step i from i - 1 or from i - 2
        a = b;
        b = c;
    }
    return b;                                               // the top is one step past the last stair
}`, 'C++'),
      java(`
public int minCostClimbingStairs(int[] cost) {
    int a = 0, b = 0;                                   // cheapest cost to stand on step i - 2 and step i - 1 (start is free)
    for (int i = 2; i <= cost.length; i++) {
        int c = Math.min(b + cost[i - 1], a + cost[i - 2]);   // reach step i from i - 1 or from i - 2
        a = b;
        b = c;
    }
    return b;                                           // the top is one step past the last stair
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[10,15,20]", expected: "15", why: "Start at index 1 and jump to the top" },
      { input: "[1,100,1,1,1,100,1,1,100,1]", expected: "6", why: "Skip the expensive stairs" },
      { input: "[0,0]", expected: "0", why: "All free" },
      { input: "[5,10]", expected: "5", why: "Start on the cheaper stair" },
    ],
    takeawaysMd: "Stair-climbing DPs depend on the previous one or two states: roll them into variables.",
  },

  "partition-labels": {
    understandMd: "Split a string into as many parts as possible so that each letter appears in at most one part. Return the sizes of the parts in order.",
    ioConstraintsMd: "Input: string of up to 500 lowercase letters. Output: the sizes of the parts.",
    edgeCases: ["A single character", "All distinct letters (every character is its own part)", "One letter that spans the whole string", "Overlapping spans that chain together"],
    bruteForceMd: "Try every set of cut positions and check the \"letters in one part only\" rule.",
    bruteComplexity: "O(2ⁿ · n) time.",
    bottleneckMd: "A cut is only allowed where no letter of the left side appears on the right side. Knowing the last occurrence of every letter turns that check into a running maximum.",
    hints: [
      "If a part starts with the letter \"a\", where must it at least end?", "Precompute the last index of each letter. As you extend the part, what happens to the required end?", "Keep end = the maximum last index of all letters seen in the current part.", "When the scan index reaches end, no letter in the part occurs later: cut there and start a new part.",
    ],
    optimalMd: "Record the last position of every letter. Scan left to right keeping end, the farthest last occurrence of any letter in the current part. When the current index equals end, every letter seen so far in this part has its last occurrence inside the part, so cut here, record the length and start the next part. Greedy cutting at the earliest possible position maximises the number of parts.",
    code: [
      cpp(`
vector<int> partitionLabels(string s) {
    int last[26] = {0};
    for (int i = 0; i < (int)s.size(); ++i) last[s[i] - 'a'] = i;       // last occurrence of every letter
    vector<int> sizes;
    int start = 0, end = 0;
    for (int i = 0; i < (int)s.size(); ++i) {
        end = max(end, last[s[i] - 'a']);                   // the part must extend to the last occurrence of each letter inside it
        if (i == end) { sizes.push_back(end - start + 1); start = i + 1; }   // no letter of this part appears later: cut here
    }
    return sizes;
}`, 'C++'),
      java(`
public List<Integer> partitionLabels(String s) {
    int[] last = new int[26];
    for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;       // last occurrence of every letter
    List<Integer> sizes = new ArrayList<>();
    int start = 0, end = 0;
    for (int i = 0; i < s.length(); i++) {
        end = Math.max(end, last[s.charAt(i) - 'a']);   // the part must extend to the last occurrence of each letter inside it
        if (i == end) { sizes.add(end - start + 1); start = i + 1; }   // no letter of this part appears later: cut here
    }
    return sizes;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space (26 letters).",
    testCases: [
      { input: "\"ababcbacadefegdehijhklij\"", expected: "[9,7,8]", why: "Classic" },
      { input: "\"eccbbbbdec\"", expected: "[10]", why: "One letter spans everything" },
      { input: "\"abc\"", expected: "[1,1,1]", why: "All distinct" },
      { input: "\"a\"", expected: "[1]", why: "Single character" },
    ],
    takeawaysMd: "Greedy partitioning with last occurrences: extend the current part to the farthest last index, cut when you reach it.",
  },

  "swim-in-rising-water": {
    understandMd: "In an n × n grid of distinct elevations, the water level at time t equals t. You can swim between adjacent cells when both elevations are at most t. Starting at the top-left cell, find the minimum time at which you can reach the bottom-right cell.",
    ioConstraintsMd: "Input: grid with values 0 to n² − 1, all distinct, n up to 50. Output: the least time t.",
    edgeCases: ["n = 1", "The destination has the highest elevation (answer is its value)", "A path that must climb a ridge", "Time can only be as low as max(start, end)"],
    bruteForceMd: "For each time t, test connectivity with BFS and increase t until the target is reachable (or binary search on t).",
    bruteComplexity: "O(n² · n²) with a linear scan of times, or O(n² log n) with binary search.",
    bottleneckMd: "The time needed for a path is the highest cell on it, so you want the path whose maximum is smallest: a minimax path, which Dijkstra's algorithm solves if the cost of a path is the maximum instead of the sum.",
    hints: [
      "What is the cost of a path in this problem: its sum or something else?", "It is the maximum elevation along it. Which shortest-path algorithm can minimise a maximum?", "Use Dijkstra with a min-heap keyed by the current path cost; moving to a neighbour costs max(current, neighbour elevation).", "The first time the bottom-right cell leaves the heap its cost is the answer.",
    ],
    optimalMd: "Run Dijkstra from the top-left cell with a heap ordered by the time required so far. When moving to a neighbour, the time required is the larger of the current time and the neighbour's elevation. Mark cells when they are popped; the first pop of the target cell yields the minimum possible time. (Alternatives: binary search on the time with a flood fill, or union-find adding cells in increasing elevation order.)",
    code: [
      cpp(`
int swimInWater(vector<vector<int>>& grid) {
    int n = grid.size();
    vector<vector<char>> seen(n, vector<char>(n, 0));
    typedef tuple<int, int, int> State;                     // {time needed, row, col}
    priority_queue<State, vector<State>, greater<State>> heap;
    heap.push(State(grid[0][0], 0, 0));
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!heap.empty()) {
        State cur = heap.top(); heap.pop();
        int t = get<0>(cur), r = get<1>(cur), c = get<2>(cur);
        if (seen[r][c]) continue;
        seen[r][c] = 1;
        if (r == n - 1 && c == n - 1) return t;             // the first arrival at the target is the minimum possible time
        for (int k = 0; k < 4; ++k) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr >= 0 && nc >= 0 && nr < n && nc < n && !seen[nr][nc])
                heap.push(State(max(t, grid[nr][nc]), nr, nc));     // the time of a path is its highest cell
        }
    }
    return -1;
}`, 'C++'),
      java(`
public int swimInWater(int[][] grid) {
    int n = grid.length;
    boolean[][] seen = new boolean[n][n];
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));   // {time needed, row, col}
    heap.add(new int[]{grid[0][0], 0, 0});
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!heap.isEmpty()) {
        int[] cur = heap.poll();
        int t = cur[0], r = cur[1], c = cur[2];
        if (seen[r][c]) continue;
        seen[r][c] = true;
        if (r == n - 1 && c == n - 1) return t;         // the first arrival at the target is the minimum possible time
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nc >= 0 && nr < n && nc < n && !seen[nr][nc])
                heap.add(new int[]{Math.max(t, grid[nr][nc]), nr, nc});   // the time of a path is its highest cell
        }
    }
    return -1;
}`, 'Java'),
    ],
    finalComplexity: "O(n² log n) time, O(n²) space.",
    testCases: [
      { input: "[[0,2],[1,3]]", expected: "3", why: "Must wait for the 3" },
      { input: "The 5 × 5 spiral sample", expected: "16", why: "Path along the ring" },
      { input: "[[0]]", expected: "0", why: "Single cell" },
    ],
    takeawaysMd: "Minimising the maximum along a path is Dijkstra with max instead of +, or a binary search on the threshold.",
  },

  "cheapest-flights-within-k-stops": {
    understandMd: "Given flights as directed (from, to, price) edges, find the cheapest price from a source to a destination using at most k stops (that is, at most k + 1 flights). Return −1 if impossible.",
    ioConstraintsMd: "Input: n up to 100 cities, up to n(n−1)/2 flights, and 0 ≤ k < n. Output: the cheapest price or −1.",
    edgeCases: ["k = 0 (a direct flight only)", "A cheaper route that needs too many stops", "No route at all", "Cycles in the flight graph"],
    bruteForceMd: "DFS over all paths with at most k + 1 edges, tracking the cost.",
    bruteComplexity: "Exponential.",
    bottleneckMd: "Plain Dijkstra ignores the edge-count limit, and the cheapest path may use too many stops. Bellman-Ford naturally limits the number of edges: after i rounds it knows the cheapest cost using at most i flights.",
    hints: [
      "Why can ordinary Dijkstra give a wrong answer when the number of stops is limited?", "Which algorithm computes the best cost using at most i edges after i rounds?", "Run k + 1 rounds of Bellman-Ford; in each round relax every flight using the costs from the previous round only.", "Copy the cost array each round so a single round cannot use two new flights.",
    ],
    optimalMd: "Initialise the cost to every city as infinity except the source (0). Repeat k + 1 times: copy the array, then for each flight (u, v, w) with a finite cost[u] set next[v] = min(next[v], cost[u] + w), and adopt the copy. After k + 1 rounds cost[dst] is the cheapest price using at most k + 1 flights; infinity means −1. Using the old array inside a round prevents a route from silently taking more flights than allowed.",
    code: [
      cpp(`
int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {
    const int INF = INT_MAX / 2;
    vector<int> cost(n, INF);
    cost[src] = 0;
    for (int round = 0; round <= k; ++round) {              // at most k + 1 flights, i.e. k stops in between
        vector<int> next = cost;                            // relax using the previous round's costs only
        for (auto& f : flights)
            if (cost[f[0]] < INF && cost[f[0]] + f[2] < next[f[1]]) next[f[1]] = cost[f[0]] + f[2];
        cost = next;
    }
    return cost[dst] >= INF ? -1 : cost[dst];
}`, 'C++'),
      java(`
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    final int INF = Integer.MAX_VALUE / 2;
    int[] cost = new int[n];
    Arrays.fill(cost, INF);
    cost[src] = 0;
    for (int round = 0; round <= k; round++) {          // at most k + 1 flights, i.e. k stops in between
        int[] next = cost.clone();                      // relax using the previous round's costs only
        for (int[] f : flights)
            if (cost[f[0]] < INF && cost[f[0]] + f[2] < next[f[1]]) next[f[1]] = cost[f[0]] + f[2];
        cost = next;
    }
    return cost[dst] >= INF ? -1 : cost[dst];
}`, 'Java'),
    ],
    finalComplexity: "O((k + 1) · E) time, O(n) space.",
    testCases: [
      { input: "n = 4, flights 0→1:100, 1→2:100, 2→0:100, 1→3:600, 2→3:200, from 0 to 3, k = 1", expected: "700", why: "Route 0 → 1 → 3" },
      { input: "n = 3, flights 0→1:100, 1→2:100, 0→2:500, 0 to 2, k = 1", expected: "200", why: "One stop is cheaper" },
      { input: "same graph with k = 0", expected: "500", why: "Direct flight only" },
      { input: "destination not reachable", expected: "-1", why: "No route" },
    ],
    takeawaysMd: "Shortest path with an edge-count limit is k + 1 rounds of Bellman-Ford with a copied distance array.",
  },

  "hand-of-straights": {
    understandMd: "Given a hand of cards (integers) and a group size, decide whether the hand can be rearranged into groups of that size where each group consists of consecutive card values.",
    ioConstraintsMd: "Input: up to 10⁴ cards with values up to 10⁹ and a group size. Output: true or false.",
    edgeCases: ["Number of cards not divisible by the group size", "Group size 1 (always true)", "Duplicates that need several groups", "A gap in values that breaks a run"],
    bruteForceMd: "Try all ways to split the cards into groups (exponential), or backtrack on group choices.",
    bruteComplexity: "Exponential.",
    bottleneckMd: "The smallest remaining card can only be the start of a group (nothing smaller is left to precede it), so the grouping is forced: always start a run at the smallest card.",
    hints: [
      "Which card must start a group if you look at the smallest remaining one?", "The smallest card cannot be the second or later element of a run. What does that force?", "Count the cards, take the smallest value m, and remove one each of m, m+1, …, m+k−1.", "If any needed value is missing, return false; repeat until nothing is left.",
    ],
    optimalMd: "Check that the number of cards is a multiple of the group size. Count the cards in an ordered map. Repeatedly take the smallest remaining value m: it must begin a group, so consume one card of each of m, m + 1, …, m + groupSize − 1, removing entries whose count reaches zero. If any value in the run is missing the hand cannot be arranged. When the map is empty all groups were formed.",
    code: [
      cpp(`
bool isNStraightHand(vector<int>& hand, int groupSize) {
    if (hand.size() % groupSize != 0) return false;
    map<int, int> count;
    for (int x : hand) ++count[x];
    while (!count.empty()) {
        int first = count.begin()->first;                   // the smallest remaining card must start a group
        for (int card = first; card < first + groupSize; ++card) {
            auto it = count.find(card);
            if (it == count.end()) return false;            // the run first, first + 1, ... cannot be completed
            if (--it->second == 0) count.erase(it);
        }
    }
    return true;
}`, 'C++'),
      java(`
public boolean isNStraightHand(int[] hand, int groupSize) {
    if (hand.length % groupSize != 0) return false;
    TreeMap<Integer, Integer> count = new TreeMap<>();
    for (int x : hand) count.merge(x, 1, Integer::sum);
    while (!count.isEmpty()) {
        int first = count.firstKey();                   // the smallest remaining card must start a group
        for (int card = first; card < first + groupSize; card++) {
            Integer c = count.get(card);
            if (c == null) return false;                // the run first, first + 1, ... cannot be completed
            if (c == 1) count.remove(card); else count.put(card, c - 1);
        }
    }
    return true;
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time, O(n) space.",
    testCases: [
      { input: "[1,2,3,6,2,3,4,7,8], groupSize 3", expected: "true", why: "[1,2,3], [2,3,4], [6,7,8]" },
      { input: "[1,2,3,4,5], groupSize 4", expected: "false", why: "Length not divisible" },
      { input: "[1,2,4], groupSize 3", expected: "false", why: "Missing 3" },
      { input: "[1,1,2,2,3,3], groupSize 3", expected: "true", why: "Two runs" },
    ],
    takeawaysMd: "When the smallest element must start a group, a greedy pass with an ordered count map settles feasibility.",
  },

  "car-fleet": {
    understandMd: "Cars drive toward a target on a one-lane road at different speeds and cannot pass; a faster car catching a slower one slows down and they travel together as a fleet. Count how many fleets arrive at the target.",
    ioConstraintsMd: "Input: target distance, car positions (distinct) and speeds, up to 10⁵ cars. Output: the number of fleets.",
    edgeCases: ["Single car", "A fast car behind a slow car that it catches before the target", "Catching exactly at the target (still one fleet)", "A fast car behind that arrives later than the car ahead (separate fleets)"],
    bruteForceMd: "Simulate the movement in time steps and merge cars as they meet.",
    bruteComplexity: "Depends on the step size; imprecise.",
    bottleneckMd: "Only the time each car would take to reach the target matters. Process cars from the one nearest the target backwards: a car whose arrival time is not larger than the fleet ahead merges with it.",
    hints: [
      "If a car would reach the target sooner than the car ahead of it, what actually happens?", "Compute each car's time to the target as if it were alone. Sort by position starting nearest the target.", "A car joins the fleet ahead if its time is less than or equal to that fleet's time; otherwise it forms a new fleet.", "Keep the time of the slowest fleet seen so far; count each time a larger time appears.",
    ],
    optimalMd: "Sort the cars by position from the target backwards and compute each car's solo arrival time (target − position) / speed. Walk through them keeping the arrival time of the fleet ahead: if the current car's time is greater, it can never catch that fleet, so it starts a new fleet (increment the count and update the time); otherwise it merges and adopts the fleet's speed, leaving the fleet time unchanged.",
    code: [
      cpp(`
int carFleet(int target, vector<int>& position, vector<int>& speed) {
    int n = position.size();
    vector<int> idx(n);
    iota(idx.begin(), idx.end(), 0);
    sort(idx.begin(), idx.end(), [&](int a, int b) { return position[a] > position[b]; });   // the car closest to the target first
    int fleets = 0;
    double slowest = 0;                                     // arrival time of the fleet directly ahead
    for (int i : idx) {
        double time = (double)(target - position[i]) / speed[i];
        if (time > slowest) { ++fleets; slowest = time; }   // it cannot catch the fleet ahead: a new fleet
    }
    return fleets;
}`, 'C++'),
      java(`
public int carFleet(int target, int[] position, int[] speed) {
    int n = position.length;
    Integer[] idx = new Integer[n];
    for (int i = 0; i < n; i++) idx[i] = i;
    Arrays.sort(idx, (a, b) -> Integer.compare(position[b], position[a]));   // the car closest to the target first
    int fleets = 0;
    double slowest = 0;                                 // arrival time of the fleet directly ahead
    for (int i : idx) {
        double time = (double) (target - position[i]) / speed[i];
        if (time > slowest) { fleets++; slowest = time; }   // it cannot catch the fleet ahead: a new fleet
    }
    return fleets;
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time, O(n) space.",
    testCases: [
      { input: "target 12, positions [10,8,0,5,3], speeds [2,4,1,1,3]", expected: "3", why: "Classic" },
      { input: "target 100, positions [0,2,4], speeds [4,2,1]", expected: "1", why: "All merge" },
      { input: "target 10, positions [6,8], speeds [3,2]", expected: "2", why: "The rear car arrives later" },
      { input: "target 10, position [3], speed [3]", expected: "1", why: "Single car" },
    ],
    takeawaysMd: "For \"who catches whom\" problems on a line, reduce each object to its arrival time and sweep from the front.",
  },

  "k-closest-points-to-origin": {
    understandMd: "Given points on a plane, return the k points closest to the origin (Euclidean distance). The answer may be in any order.",
    ioConstraintsMd: "Input: up to 10⁴ points with coordinates in [−10⁴, 10⁴] and 1 ≤ k ≤ n. Output: k points.",
    edgeCases: ["k = n (return everything)", "Points with equal distances", "Negative coordinates", "Avoid square roots (compare squared distances)"],
    bruteForceMd: "Sort all points by distance and take the first k.",
    bruteComplexity: "O(n log n) time.",
    bottleneckMd: "Sorting orders all points although only the k smallest are needed. A max-heap of size k keeps the best k candidates and discards the rest, costing O(n log k).",
    hints: [
      "Do you need the points sorted, or only the k nearest?", "Keep the k best points seen so far. Which one do you need to be able to remove quickly?", "The farthest of the current k: use a max-heap ordered by squared distance.", "Push each point; if the heap has more than k points, pop the farthest.",
    ],
    optimalMd: "Maintain a max-heap, ordered by squared distance, holding the k closest points seen so far. For each point push it; if the heap then contains k + 1 points, pop the farthest. After processing all points the heap contains exactly the k closest. Squared distances are compared so no square root is needed. (Quickselect gives O(n) average time.)",
    code: [
      cpp(`
vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
    auto dist = [](const vector<int>& p) { return p[0] * p[0] + p[1] * p[1]; };   // squared distance: no square root needed
    auto farther = [&](const vector<int>& a, const vector<int>& b) { return dist(a) < dist(b); };
    priority_queue<vector<int>, vector<vector<int>>, decltype(farther)> heap(farther);   // max-heap by distance
    for (auto& p : points) {
        heap.push(p);
        if ((int)heap.size() > k) heap.pop();               // drop the farthest of the k + 1 candidates
    }
    vector<vector<int>> out;
    while (!heap.empty()) { out.push_back(heap.top()); heap.pop(); }
    return out;
}`, 'C++'),
      java(`
public int[][] kClosest(int[][] points, int k) {
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(dist(b), dist(a)));   // max-heap by distance
    for (int[] p : points) {
        heap.add(p);
        if (heap.size() > k) heap.poll();               // drop the farthest of the k + 1 candidates
    }
    return heap.toArray(new int[0][]);
}
private int dist(int[] p) { return p[0] * p[0] + p[1] * p[1]; }   // squared distance: no square root needed`, 'Java'),
    ],
    finalComplexity: "O(n log k) time, O(k) space.",
    testCases: [
      { input: "[[1,3],[-2,2]], k = 1", expected: "[[-2,2]]", why: "Distances √10 and √8" },
      { input: "[[3,3],[5,-1],[-2,4]], k = 2", expected: "[[3,3],[-2,4]] in any order", why: "Drop the farthest" },
      { input: "k = n", expected: "all points", why: "Nothing to discard" },
    ],
    takeawaysMd: "Top-k of n with k small: a size-k heap whose root is the worst of the current best.",
  },

  "rotting-oranges": {
    understandMd: "A grid has empty cells (0), fresh oranges (1) and rotten oranges (2). Each minute every fresh orange adjacent (up, down, left, right) to a rotten one becomes rotten. Return the minutes until no fresh orange remains, or −1 if that never happens.",
    ioConstraintsMd: "Input: grid up to 10 × 10. Output: the number of minutes or −1.",
    edgeCases: ["No fresh oranges (answer 0)", "No rotten oranges but some fresh (answer −1)", "A fresh orange cut off by empty cells", "Several rotten oranges spreading at the same time"],
    bruteForceMd: "Simulate minute by minute scanning the whole grid each time.",
    bruteComplexity: "O((m·n)²) time.",
    bottleneckMd: "Rotting spreads in waves from all rotten oranges simultaneously, which is a multi-source BFS: the BFS depth is the elapsed time, and a fresh counter tells whether everything was reached.",
    hints: [
      "What kind of search spreads outward from many sources at once?", "Put all initially rotten oranges in the queue; each level of the BFS is one minute.", "Count the fresh oranges at the start and decrement the counter whenever one rots.", "After the BFS, if fresh oranges remain, return −1; otherwise return the number of levels processed.",
    ],
    optimalMd: "Count the fresh oranges and enqueue all rotten ones. Process the queue level by level: each level represents one minute in which every queued rotten orange infects its fresh neighbours (mark them rotten, decrement the fresh count, enqueue them). Stop when the queue is empty or no fresh oranges remain. The answer is the number of levels needed, or −1 if some fresh orange is unreachable.",
    code: [
      cpp(`
int orangesRotting(vector<vector<int>>& grid) {
    int m = grid.size(), n = grid[0].size(), fresh = 0;
    queue<pair<int, int>> q;
    for (int r = 0; r < m; ++r)
        for (int c = 0; c < n; ++c) {
            if (grid[r][c] == 2) q.push({r, c});            // every rotten orange starts spreading at minute 0
            else if (grid[r][c] == 1) ++fresh;
        }
    int minutes = 0;
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty() && fresh > 0) {
        ++minutes;                                          // one BFS level equals one minute
        for (int size = q.size(); size > 0; --size) {
            auto cur = q.front(); q.pop();
            for (int k = 0; k < 4; ++k) {
                int nr = cur.first + dr[k], nc = cur.second + dc[k];
                if (nr >= 0 && nc >= 0 && nr < m && nc < n && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    --fresh;
                    q.push({nr, nc});
                }
            }
        }
    }
    return fresh == 0 ? minutes : -1;                       // fresh oranges left over can never rot
}`, 'C++'),
      java(`
public int orangesRotting(int[][] grid) {
    int m = grid.length, n = grid[0].length, fresh = 0;
    Deque<int[]> queue = new ArrayDeque<>();
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++) {
            if (grid[r][c] == 2) queue.add(new int[]{r, c});    // every rotten orange starts spreading at minute 0
            else if (grid[r][c] == 1) fresh++;
        }
    int minutes = 0;
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!queue.isEmpty() && fresh > 0) {
        minutes++;                                      // one BFS level equals one minute
        for (int size = queue.size(); size > 0; size--) {
            int[] cur = queue.poll();
            for (int[] d : dirs) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr >= 0 && nc >= 0 && nr < m && nc < n && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    fresh--;
                    queue.add(new int[]{nr, nc});
                }
            }
        }
    }
    return fresh == 0 ? minutes : -1;                   // fresh oranges left over can never rot
}`, 'Java'),
    ],
    finalComplexity: "O(m·n) time, O(m·n) space.",
    testCases: [
      { input: "[[2,1,1],[1,1,0],[0,1,1]]", expected: "4", why: "Classic" },
      { input: "[[2,1,1],[0,1,1],[1,0,1]]", expected: "-1", why: "The bottom-left orange is isolated" },
      { input: "[[0,2]]", expected: "0", why: "Nothing fresh" },
      { input: "[[1]]", expected: "-1", why: "A fresh orange with no rotten one" },
    ],
    takeawaysMd: "Simultaneous spreading is multi-source BFS; track a counter of unreached targets.",
  },

  "last-stone-weight": {
    understandMd: "Repeatedly smash the two heaviest stones together: if they are equal both vanish, otherwise the heavier one keeps the difference. Return the weight of the last remaining stone, or 0 if none remains.",
    ioConstraintsMd: "Input: 1 to 30 stones with weights 1 to 1000. Output: the final weight.",
    edgeCases: ["Single stone", "Two equal stones (both vanish)", "Many equal stones", "All stones removed"],
    bruteForceMd: "Sort the array and repeat after every smash (re-sorting each time).",
    bruteComplexity: "O(n² log n) time.",
    bottleneckMd: "Each step needs the two largest elements of a changing collection, which is exactly what a max-heap provides in O(log n) per operation.",
    hints: [
      "What do you need from the collection at every step?", "The two largest values, then to insert a new value. Which data structure supports that efficiently?", "Use a max-heap: pop two, push their difference if it is non-zero.", "Stop when at most one stone remains; return it or 0.",
    ],
    optimalMd: "Put all weights into a max-heap. While the heap has at least two stones, pop the two heaviest; if their weights differ, push the difference back. When the loop ends the heap contains zero or one stone; return its weight or 0. Each operation costs O(log n) and there are at most n smashes.",
    code: [
      cpp(`
int lastStoneWeight(vector<int>& stones) {
    priority_queue<int> heap(stones.begin(), stones.end());
    while (heap.size() > 1) {
        int a = heap.top(); heap.pop();
        int b = heap.top(); heap.pop();                     // the two heaviest stones
        if (a != b) heap.push(a - b);                       // the survivor keeps the difference
    }
    return heap.empty() ? 0 : heap.top();
}`, 'C++'),
      java(`
public int lastStoneWeight(int[] stones) {
    PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
    for (int s : stones) heap.add(s);
    while (heap.size() > 1) {
        int a = heap.poll(), b = heap.poll();           // the two heaviest stones
        if (a != b) heap.add(a - b);                    // the survivor keeps the difference
    }
    return heap.isEmpty() ? 0 : heap.peek();
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time, O(n) space.",
    testCases: [
      { input: "[2,7,4,1,8,1]", expected: "1", why: "8 and 7 → 1, then 4 and 2 → 2, …" },
      { input: "[1]", expected: "1", why: "Single stone" },
      { input: "[2,2]", expected: "0", why: "Both vanish" },
      { input: "[3,7,2]", expected: "2", why: "7 and 3 → 4, then 4 and 2 → 2" },
    ],
    takeawaysMd: "Repeatedly taking the largest elements of a changing set is a max-heap loop.",
  },

  "count-good-nodes-in-binary-tree": {
    understandMd: "In a binary tree, a node is good if no node on the path from the root to it has a larger value. Count the good nodes.",
    ioConstraintsMd: "Input: tree with up to 10⁵ nodes and values in [−10⁴, 10⁴]. Output: the number of good nodes.",
    edgeCases: ["The root is always good", "Negative values", "A node equal to the current maximum is good", "A deep chain (recursion depth)"],
    bruteForceMd: "For every node walk up to the root (or down from the root) checking the path maximum.",
    bruteComplexity: "O(n·h) time.",
    bottleneckMd: "The maximum on a path can be carried down as a parameter, so each node is checked in O(1) while the traversal visits it once.",
    hints: [
      "What do you need to know at a node to decide whether it is good?", "The maximum value on the path from the root to its parent. Can you pass it down?", "DFS with an extra parameter maxSoFar; a node is good if its value is at least maxSoFar.", "Recurse on both children with the updated maximum and add the counts.",
    ],
    optimalMd: "Run a depth-first traversal that carries the maximum value seen on the path so far. At each node, count it if node.val ≥ maxSoFar, then recurse into both children with max(maxSoFar, node.val). The total is the number of good nodes. Every node is visited once.",
    code: [
      cpp(`
int count(TreeNode* node, int maxSoFar) {
    if (!node) return 0;
    int good = node->val >= maxSoFar ? 1 : 0;               // no node on the path from the root is larger
    int next = max(maxSoFar, node->val);
    return good + count(node->left, next) + count(node->right, next);
}
int goodNodes(TreeNode* root) {
    return count(root, INT_MIN);
}`, 'C++'),
      java(`
public int goodNodes(TreeNode root) {
    return count(root, Integer.MIN_VALUE);
}
private int count(TreeNode node, int maxSoFar) {
    if (node == null) return 0;
    int good = node.val >= maxSoFar ? 1 : 0;            // no node on the path from the root is larger
    int next = Math.max(maxSoFar, node.val);
    return good + count(node.left, next) + count(node.right, next);
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(h) space.",
    testCases: [
      { input: "[3,1,4,3,null,1,5]", expected: "4", why: "Nodes 3, 4, 3 and 5" },
      { input: "[3,3,null,4,2]", expected: "3", why: "Both 3 and 4 are good" },
      { input: "[1]", expected: "1", why: "Root only" },
      { input: "[2,null,4,10,8,null,null,4]", expected: "4", why: "2, 4, 10, 8" },
    ],
    takeawaysMd: "Path-dependent properties of tree nodes are DFS with the accumulated state passed as a parameter.",
  },

  "minimum-interval-to-include-each-query": {
    understandMd: "Given intervals [left, right] and a list of query points, find for each query the size (right − left + 1) of the smallest interval containing it, or −1 if no interval contains it.",
    ioConstraintsMd: "Input: up to 10⁵ intervals and queries. Output: one answer per query, in the original order.",
    edgeCases: ["A query outside all intervals", "Queries given out of order", "Several intervals containing the same query", "Intervals that start and end on the query"],
    bruteForceMd: "For each query scan all intervals and keep the smallest that contains it.",
    bruteComplexity: "O(n·q) time.",
    bottleneckMd: "Rescanning all intervals for each query repeats work. If both intervals and queries are processed in increasing order, each interval is added to a heap once and discarded once.",
    hints: [
      "Which intervals can contain a query q? Think in terms of start and end.", "Process the queries in increasing order; add all intervals with start ≤ q to a min-heap keyed by size.", "Intervals whose end is before q can never help again for larger queries, so pop them from the top.", "The smallest interval left on top (if any) answers the query; store results by the original query index.",
    ],
    optimalMd: "Sort the intervals by start and the queries by value (remembering their original positions). Sweep the queries in increasing order: push every interval whose start is at most the query into a min-heap ordered by size (storing its end as well), then pop intervals from the top whose end is smaller than the query, since they cannot contain this or any later query. The top of the heap is the smallest containing interval. Each interval enters and leaves the heap at most once.",
    code: [
      cpp(`
vector<int> minInterval(vector<vector<int>>& intervals, vector<int>& queries) {
    sort(intervals.begin(), intervals.end());
    vector<int> order(queries.size());
    iota(order.begin(), order.end(), 0);
    sort(order.begin(), order.end(), [&](int a, int b) { return queries[a] < queries[b]; });   // answer the queries from small to large
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> heap;      // {size, end}, smallest size first
    vector<int> ans(queries.size(), -1);
    size_t i = 0;
    for (int qi : order) {
        int q = queries[qi];
        while (i < intervals.size() && intervals[i][0] <= q) {  // add every interval that has started by q
            heap.push({intervals[i][1] - intervals[i][0] + 1, intervals[i][1]});
            ++i;
        }
        while (!heap.empty() && heap.top().second < q) heap.pop();   // discard intervals that ended before q
        ans[qi] = heap.empty() ? -1 : heap.top().first;
    }
    return ans;
}`, 'C++'),
      java(`
public int[] minInterval(int[][] intervals, int[] queries) {
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    Integer[] order = new Integer[queries.length];
    for (int i = 0; i < order.length; i++) order[i] = i;
    Arrays.sort(order, (a, b) -> Integer.compare(queries[a], queries[b]));   // answer the queries from small to large
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));   // {size, end}, smallest size first
    int[] ans = new int[queries.length];
    int i = 0;
    for (int qi : order) {
        int q = queries[qi];
        while (i < intervals.length && intervals[i][0] <= q) {   // add every interval that has started by q
            heap.add(new int[]{intervals[i][1] - intervals[i][0] + 1, intervals[i][1]});
            i++;
        }
        while (!heap.isEmpty() && heap.peek()[1] < q) heap.poll();   // discard intervals that ended before q
        ans[qi] = heap.isEmpty() ? -1 : heap.peek()[0];
    }
    return ans;
}`, 'Java'),
    ],
    finalComplexity: "O((n + q) log(n + q)) time, O(n + q) space.",
    testCases: [
      { input: "[[1,4],[2,4],[3,6],[4,4]], queries [2,3,4,5]", expected: "[3,3,1,4]", why: "Classic" },
      { input: "[[2,3],[2,5],[1,8],[20,25]], queries [2,19,5,22]", expected: "[2,-1,4,6]", why: "One query contained in no interval" },
    ],
    takeawaysMd: "Offline queries: sort them, sweep once, and use a heap with lazy deletion for the \"best active interval\".",
  },

  "merge-triplets-to-form-target-triplet": {
    understandMd: "You may merge triplets by taking the element-wise maximum of two (or more) of them. Decide whether you can obtain exactly the target triplet.",
    ioConstraintsMd: "Input: up to 10⁵ triplets with values up to 1,000 and a target triplet. Output: true or false.",
    edgeCases: ["A triplet that exceeds the target in some coordinate (it can never be used)", "The target needs several triplets, one per coordinate", "The target already exists as a triplet", "No triplet supplies one of the coordinates"],
    bruteForceMd: "Try every subset of triplets and compute their element-wise maximum.",
    bruteComplexity: "O(2ⁿ) time.",
    bottleneckMd: "A triplet that is larger than the target in any coordinate would push the maximum above the target, so it can be ignored. Among the usable triplets, the target is reachable exactly when each coordinate is matched by some usable triplet.",
    hints: [
      "Taking the maximum can only increase values. Which triplets can never be part of a solution?", "Discard any triplet with a coordinate larger than the target's.", "Among the remaining triplets, which ones can supply each target coordinate exactly?", "You need at least one usable triplet matching the target in coordinate 0, one in coordinate 1 and one in coordinate 2.",
    ],
    optimalMd: "Ignore every triplet that exceeds the target in any coordinate, because merging it would overshoot. For the remaining triplets, record for each of the three coordinates whether some triplet equals the target value there. Because merging is a maximum, merging all usable triplets gives a triplet that is at most the target in every coordinate and equal to it in the coordinates that were found; the target is reachable exactly when all three coordinates are found.",
    code: [
      cpp(`
bool mergeTriplets(vector<vector<int>>& triplets, vector<int>& target) {
    bool found[3] = {false, false, false};
    for (auto& t : triplets) {
        if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue;   // merging it would overshoot the target
        for (int i = 0; i < 3; ++i) if (t[i] == target[i]) found[i] = true;      // it can supply this coordinate exactly
    }
    return found[0] && found[1] && found[2];
}`, 'C++'),
      java(`
public boolean mergeTriplets(int[][] triplets, int[] target) {
    boolean[] found = new boolean[3];
    for (int[] t : triplets) {
        if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue;   // merging it would overshoot the target
        for (int i = 0; i < 3; i++) if (t[i] == target[i]) found[i] = true;      // it can supply this coordinate exactly
    }
    return found[0] && found[1] && found[2];
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[[2,5,3],[1,8,4],[1,7,5]], target [2,7,5]", expected: "true", why: "First and third triplets" },
      { input: "[[3,4,5],[4,5,6]], target [3,2,5]", expected: "false", why: "No triplet supplies 2 without overshooting" },
      { input: "[[2,5,3],[2,3,4],[1,2,5],[5,2,3]], target [5,5,5]", expected: "true", why: "Combine three of them" },
    ],
    takeawaysMd: "When the operation only increases values, discard anything that overshoots, then check that each coordinate can be matched.",
  },

  "detect-squares": {
    understandMd: "Design a structure that supports adding points to a multiset and, given a query point, counting the number of ways to choose three stored points that form an axis-aligned square with positive area together with the query point.",
    ioConstraintsMd: "Input: up to 3,000 operations on integer points in [0, 1000]. Output: the count for each query.",
    edgeCases: ["Duplicate points (each copy counts separately)", "Query point with no points in its column", "Squares extending to the left and to the right", "Zero-area squares must not be counted"],
    bruteForceMd: "For every triple of stored points check whether they form a square with the query point.",
    bruteComplexity: "O(n³) per query.",
    bottleneckMd: "An axis-aligned square is determined by two corners on the same vertical line; the other two corners are then fixed (to the left or right). Counting per coordinate with a nested hash map reduces each query to one pass over the points in the query's column.",
    hints: [
      "If the query is one corner, which other corner is on the same vertical line, and what does its distance tell you?", "That vertical distance is the side length. Where must the other two corners be?", "They are at x ± side, with y equal to the query's y and the other corner's y.", "Store counts per point (x → y → count) and multiply the counts of the three corners for each candidate.",
    ],
    optimalMd: "Store the count of every point in a map keyed by x and then y. For a query (x, y), iterate over all stored points (x, y2) in the same column with y2 ≠ y; the side length is |y2 − y|. The remaining corners are (x ± side, y) and (x ± side, y2) for the square to the right or left. Multiply the counts of the three existing corners and add to the total (duplicates multiply the number of squares). Each query costs O(number of distinct y values in its column).",
    code: [
      cpp(`
class DetectSquares {
    unordered_map<int, unordered_map<int, int>> cnt;        // x -> (y -> how many points)
public:
    void add(vector<int> point) { ++cnt[point[0]][point[1]]; }
    int count(vector<int> point) {
        int x = point[0], y = point[1], total = 0;
        auto col = cnt.find(x);
        if (col == cnt.end()) return 0;
        for (auto& e : col->second) {                       // every point on the same vertical line is a candidate corner
            int y2 = e.first;
            if (y2 == y) continue;                          // squares must have a positive side length
            int side = y2 - y;
            for (int x2 : {x + side, x - side}) {           // the square can extend to the right or to the left
                auto other = cnt.find(x2);
                if (other == cnt.end()) continue;
                auto a = other->second.find(y), b = other->second.find(y2);
                if (a != other->second.end() && b != other->second.end()) total += e.second * a->second * b->second;
            }
        }
        return total;
    }
};`, 'C++'),
      java(`
class DetectSquares {
    private final Map<Integer, Map<Integer, Integer>> count = new HashMap<>();   // x -> (y -> how many points)

    public DetectSquares() {}
    public void add(int[] point) {
        count.computeIfAbsent(point[0], k -> new HashMap<>()).merge(point[1], 1, Integer::sum);
    }
    public int count(int[] point) {
        int x = point[0], y = point[1], total = 0;
        Map<Integer, Integer> column = count.get(x);
        if (column == null) return 0;
        for (Map.Entry<Integer, Integer> e : column.entrySet()) {   // every point on the same vertical line is a candidate corner
            int y2 = e.getKey();
            if (y2 == y) continue;                      // squares must have a positive side length
            int side = y2 - y;
            for (int x2 : new int[]{x + side, x - side}) {          // the square can extend to the right or to the left
                Map<Integer, Integer> other = count.get(x2);
                if (other == null) continue;
                total += e.getValue() * other.getOrDefault(y, 0) * other.getOrDefault(y2, 0);
            }
        }
        return total;
    }
}`, 'Java'),
    ],
    finalComplexity: "add O(1); count O(m) where m is the number of distinct points in the query's column.",
    testCases: [
      { input: "add (3,10), (11,2), (3,2); count (11,10)", expected: "1", why: "The square with side 8" },
      { input: "count (14,8)", expected: "0", why: "No points nearby" },
      { input: "add (11,2) again; count (11,10)", expected: "2", why: "The duplicate corner doubles the count" },
    ],
    takeawaysMd: "Counting geometric shapes with duplicates: index points in a hash map and multiply the multiplicities of the required corners.",
  },
};
