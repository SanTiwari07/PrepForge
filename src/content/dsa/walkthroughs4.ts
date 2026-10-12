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
};
