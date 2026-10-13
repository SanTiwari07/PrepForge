import type { CoachWalkthrough } from '../schema';
import { cpp, java } from '../helpers';

// Original PrepForge walkthroughs, batch 5 (the remaining Top Interview 150 and LeetCode 75
// problems). Problem statements are NOT copied; read the official statement via the link on the
// problem page. Every solution was compiled and run against its listed test cases in both C++ and
// Java before it was added, with randomised brute-force checks where the logic is subtle
// (scripts/verify-code.ts re-checks that the snippets still compile). Keys are LeetCode slugs.
export const walkthroughs5: Record<string, CoachWalkthrough> = {
  "zigzag-conversion": {
    understandMd: "Write a string diagonally down and up across a fixed number of rows (like a zigzag), then read it row by row from top to bottom. Return the resulting string.",
    ioConstraintsMd: "Input: a string of up to 1,000 characters and a row count between 1 and 1,000. Output: the rows concatenated.",
    edgeCases: ["One row (the zigzag degenerates to a line)", "More rows than characters", "Two rows (strict alternation)", "Single character"],
    bruteForceMd: "Build the whole 2D grid of the zigzag, place each character at its cell, then read the non-empty cells row by row.",
    bruteComplexity: "O(rows × cols) time and space, where cols can be about n.",
    bottleneckMd: "The grid is mostly empty. You only ever need to know which row each character lands in, and that follows a simple bounce between row 0 and the last row.",
    hints: [
      "Do you need the columns at all, or only the row index of each character?", "The row index goes 0, 1, …, rows−1, then back down to 1, 0, and so on. What flips the direction?", "Keep one string per row. Append each character to its row, then move the row index by +1 or −1.", "Flip the direction when the index reaches 0 or rows−1. Handle rows == 1 separately, because the index can never move.",
    ],
    optimalMd: "Keep a buffer per row and a current row index with a direction. For each character append it to the current row, then flip the direction when the row is the top or bottom and step. Concatenate the rows at the end. If there is a single row return the input unchanged (otherwise the bounce logic would step out of range).",
    code: [
      cpp(`
string convert(string s, int numRows) {
    if (numRows == 1 || (int)s.size() <= numRows) return s;
    vector<string> rows(numRows);
    int r = 0, dir = 1;
    for (char c : s) {
        rows[r] += c;
        if (r == 0) dir = 1;                      // bounce at the top
        else if (r == numRows - 1) dir = -1;      // bounce at the bottom
        r += dir;
    }
    string out;
    for (const string& row : rows) out += row;
    return out;
}`, 'C++'),
      java(`
public String convert(String s, int numRows) {
    if (numRows == 1 || s.length() <= numRows) return s;
    StringBuilder[] rows = new StringBuilder[numRows];
    for (int i = 0; i < numRows; i++) rows[i] = new StringBuilder();
    int r = 0, dir = 1;
    for (char c : s.toCharArray()) {
        rows[r].append(c);
        if (r == 0) dir = 1;                      // bounce at the top
        else if (r == numRows - 1) dir = -1;      // bounce at the bottom
        r += dir;
    }
    StringBuilder out = new StringBuilder();
    for (StringBuilder row : rows) out.append(row);
    return out.toString();
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space for the output.",
    testCases: [
      { input: "\"PAYPALISHIRING\", rows = 3", expected: "\"PAHNAPLSIIGYIR\"", why: "Standard example" },
      { input: "\"PAYPALISHIRING\", rows = 4", expected: "\"PINALSIGYAHRPI\"", why: "Four rows" },
      { input: "\"A\", rows = 1", expected: "\"A\"", why: "Single row" },
      { input: "\"ABCDE\", rows = 2", expected: "\"ACEBD\"", why: "Strict alternation" },
    ],
    takeawaysMd: "When a picture is only a way to describe an index sequence, compute the index directly instead of building the picture. A bouncing counter is the standard way to generate a zigzag.",
  },

  "palindrome-number": {
    understandMd: "Decide whether an integer reads the same forwards and backwards. Negative numbers are never palindromes because of the minus sign.",
    ioConstraintsMd: "Input: a 32-bit signed integer. Output: true or false. The follow-up asks you to avoid converting to a string.",
    edgeCases: ["Negative numbers", "Zero", "Numbers ending in 0 (such as 10 or 100)", "Single-digit numbers", "Odd and even digit counts"],
    bruteForceMd: "Convert the number to a string and compare it with its reverse.",
    bruteComplexity: "O(d) time and space, where d is the number of digits.",
    bottleneckMd: "The string works but uses extra memory. Reversing the whole number can overflow a 32-bit integer, so reverse only half of it.",
    hints: [
      "Which numbers can you reject immediately without any arithmetic?", "Peel digits off the right with % 10 and / 10 and build a reversed number. What goes wrong if you reverse all of it?", "You only need to reverse half. How do you know you have reached the middle?", "Stop when the reversed half is at least the remaining half. For an odd number of digits drop the middle digit with rev / 10.",
    ],
    optimalMd: "Reject negatives and any positive number ending in 0. Then move digits from the right of x onto a reversed number rev while x is still greater than rev. When the loop stops, x holds the first half and rev holds the second half reversed (with one extra middle digit if the length is odd). The number is a palindrome when x == rev or x == rev / 10. Only half the digits are processed, so overflow cannot happen.",
    code: [
      cpp(`
bool isPalindrome(int x) {
    if (x < 0 || (x % 10 == 0 && x != 0)) return false;   // minus sign, or trailing zero with no leading zero to match
    int rev = 0;
    while (x > rev) {                                     // move digits across until we reach the middle
        rev = rev * 10 + x % 10;
        x /= 10;
    }
    return x == rev || x == rev / 10;                     // even length, or odd length (drop the middle digit)
}`, 'C++'),
      java(`
public boolean isPalindrome(int x) {
    if (x < 0 || (x % 10 == 0 && x != 0)) return false;   // minus sign, or trailing zero with no leading zero to match
    int rev = 0;
    while (x > rev) {                                     // move digits across until we reach the middle
        rev = rev * 10 + x % 10;
        x /= 10;
    }
    return x == rev || x == rev / 10;                     // even length, or odd length (drop the middle digit)
}`, 'Java'),
    ],
    finalComplexity: "O(log₁₀ x) time (half the digits), O(1) space.",
    testCases: [
      { input: "121", expected: "true", why: "Odd length" },
      { input: "-121", expected: "false", why: "Negative" },
      { input: "10", expected: "false", why: "Trailing zero" },
      { input: "1221", expected: "true", why: "Even length" },
      { input: "0", expected: "true", why: "Zero is a palindrome" },
    ],
    takeawaysMd: "Reversing only half of a sequence avoids overflow and halves the work. Whenever a check is symmetric, ask whether the first half alone can carry the information.",
  },

  "integer-to-roman": {
    understandMd: "Convert an integer from 1 to 3999 into a Roman numeral. Roman numerals add symbol values, except that six specific pairs (IV, IX, XL, XC, CD, CM) subtract.",
    ioConstraintsMd: "Input: an integer from 1 to 3999. Output: the Roman numeral string.",
    edgeCases: ["Subtractive forms such as 4, 9, 40, 90, 400, 900", "The largest value 3999", "A single symbol such as 1 or 1000", "Values with zeros such as 1004"],
    bruteForceMd: "Handle each decimal place separately with a long if/else chain for ones, tens, hundreds and thousands.",
    bruteComplexity: "O(1) time, but the code is long and easy to get wrong.",
    bottleneckMd: "The only difficulty is the subtractive cases. If you list them as if they were symbols of their own, the problem becomes plain greedy change-making.",
    hints: [
      "How would you write 3 or 30 or 300? Where does the trouble start?", "Treat IV, IX, XL, XC, CD and CM as extra symbols with values 4, 9, 40, 90, 400 and 900.", "Order all 13 symbols from largest to smallest value. Why does taking the largest symbol that still fits always work?", "For each symbol in order, while num >= value append the symbol and subtract. Stop when num reaches 0.",
    ],
    optimalMd: "Store the 13 (value, symbol) pairs in descending order: 1000 M, 900 CM, 500 D, 400 CD, 100 C, 90 XC, 50 L, 40 XL, 10 X, 9 IX, 5 V, 4 IV, 1 I. Walk through them; while the remaining number is at least the value, append the symbol and subtract the value. Because the list includes the subtractive pairs, this greedy choice is always the correct one. The loop appends at most a handful of symbols, so the work is constant.",
    code: [
      cpp(`
string intToRoman(int num) {
    const int val[] = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};
    const char* sym[] = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};
    string out;
    for (int i = 0; i < 13; ++i) {
        while (num >= val[i]) { out += sym[i]; num -= val[i]; }   // greedy: largest symbol that still fits
    }
    return out;
}`, 'C++'),
      java(`
public String intToRoman(int num) {
    int[] val = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};
    String[] sym = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < val.length; i++) {
        while (num >= val[i]) { out.append(sym[i]); num -= val[i]; }   // greedy: largest symbol that still fits
    }
    return out.toString();
}`, 'Java'),
    ],
    finalComplexity: "O(1) time and space (at most 15 symbols are produced; the input is bounded by 3999).",
    testCases: [
      { input: "3749", expected: "\"MMMDCCXLIX\"", why: "Several thousands, hundreds and a subtractive tens" },
      { input: "58", expected: "\"LVIII\"", why: "No subtractive form" },
      { input: "1994", expected: "\"MCMXCIV\"", why: "Three subtractive pairs" },
      { input: "4", expected: "\"IV\"", why: "Smallest subtractive form" },
    ],
    takeawaysMd: "When special cases look like exceptions, try adding them to the alphabet. Once subtractive pairs are symbols, a greedy scan over a descending table is both short and obviously correct.",
  },

  "roman-to-integer": {
    understandMd: "Convert a Roman numeral (guaranteed valid, value 1 to 3999) to an integer. A symbol that is smaller than the symbol after it is subtracted instead of added.",
    ioConstraintsMd: "Input: a valid Roman numeral string of up to 15 characters. Output: its integer value.",
    edgeCases: ["A single symbol", "Subtractive pairs at the end of the string", "Several subtractive pairs, as in MCMXCIV", "Repeated symbols such as III"],
    bruteForceMd: "Check for each of the six two-letter subtractive pairs first, then fall back to single symbols, using string matching at each position.",
    bruteComplexity: "O(n) time but with fiddly look-ahead branches.",
    bottleneckMd: "The subtractive pairs seem to need special handling, but a single rule covers all of them: a smaller value before a larger one is subtracted.",
    hints: [
      "Look at IV, IX, XL, XC, CD, CM. What do they all have in common?", "In each pair the first symbol is smaller than the second. Does that ever happen in a non-subtractive numeral?", "Scan left to right, comparing each symbol with the next one.", "If value[i] < value[i+1] subtract it, otherwise add it. The last symbol is always added.",
    ],
    optimalMd: "Map each symbol to its value. Scan left to right: if the current value is smaller than the next symbol's value, subtract it from the total; otherwise add it. The last symbol has no successor, so it is added. This single comparison reproduces all six subtractive cases, and the scan is one pass.",
    code: [
      cpp(`
int romanToInt(string s) {
    auto value = [](char c) {
        switch (c) {
            case 'I': return 1;   case 'V': return 5;   case 'X': return 10;  case 'L': return 50;
            case 'C': return 100; case 'D': return 500; default:  return 1000;
        }
    };
    int total = 0;
    for (size_t i = 0; i < s.size(); ++i) {
        if (i + 1 < s.size() && value(s[i]) < value(s[i + 1])) total -= value(s[i]);   // subtractive pair
        else total += value(s[i]);
    }
    return total;
}`, 'C++'),
      java(`
public int romanToInt(String s) {
    int total = 0;
    for (int i = 0; i < s.length(); i++) {
        int v = value(s.charAt(i));
        if (i + 1 < s.length() && v < value(s.charAt(i + 1))) total -= v;   // subtractive pair
        else total += v;
    }
    return total;
}

private int value(char c) {
    switch (c) {
        case 'I': return 1;   case 'V': return 5;   case 'X': return 10;  case 'L': return 50;
        case 'C': return 100; case 'D': return 500; default:  return 1000;
    }
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "\"III\"", expected: "3", why: "Repeated symbol" },
      { input: "\"LVIII\"", expected: "58", why: "Mixed, additive" },
      { input: "\"MCMXCIV\"", expected: "1994", why: "Three subtractive pairs" },
      { input: "\"IV\"", expected: "4", why: "Single subtractive pair" },
    ],
    takeawaysMd: "A look-ahead comparison can replace a list of special cases. Ask what property all the exceptions share and test for that property.",
  },

  "longest-common-prefix": {
    understandMd: "Given a list of strings, return the longest string that is a prefix of every one of them, or the empty string if there is none.",
    ioConstraintsMd: "Input: 1 to 200 strings, each up to 200 lowercase letters (possibly empty). Output: the common prefix.",
    edgeCases: ["A single string (the answer is the string itself)", "An empty string in the list", "No common first letter", "One string is a prefix of all others", "All strings identical"],
    bruteForceMd: "Take the first string and test every one of its prefixes, longest first, against all the other strings.",
    bruteComplexity: "O(n · m²) time, where n is the number of strings and m the length of the shortest.",
    bottleneckMd: "Re-testing whole prefixes repeats comparisons. Comparing column by column stops at the first mismatch and touches each character at most once.",
    hints: [
      "If the prefix has length k, what must be true of the character at position k−1 in every string?", "Compare position 0 in all strings, then position 1, and so on. When do you stop?", "Stop at the first position where some string is too short or has a different character.", "Use the first string as the reference. For each index i and each other string, check i < length and the characters match; otherwise return the first i characters.",
    ],
    optimalMd: "Scan columns (vertical scanning). For index i from 0 to the length of the first string, take c = first[i]; if any other string is shorter than i + 1 or has a different character at i, return the first string up to i. If the loop finishes, the whole first string is the prefix. Each character is compared at most once, so the cost is bounded by the total number of characters.",
    code: [
      cpp(`
string longestCommonPrefix(vector<string>& strs) {
    for (size_t i = 0; i < strs[0].size(); ++i) {
        char c = strs[0][i];
        for (size_t j = 1; j < strs.size(); ++j) {
            if (i >= strs[j].size() || strs[j][i] != c)      // shorter string or mismatch ends the prefix
                return strs[0].substr(0, i);
        }
    }
    return strs[0];                                          // the first string is a prefix of all
}`, 'C++'),
      java(`
public String longestCommonPrefix(String[] strs) {
    for (int i = 0; i < strs[0].length(); i++) {
        char c = strs[0].charAt(i);
        for (int j = 1; j < strs.length; j++) {
            if (i >= strs[j].length() || strs[j].charAt(i) != c)   // shorter string or mismatch ends the prefix
                return strs[0].substring(0, i);
        }
    }
    return strs[0];                                                // the first string is a prefix of all
}`, 'Java'),
    ],
    finalComplexity: "O(S) time where S is the total number of characters, O(1) extra space.",
    testCases: [
      { input: "[\"flower\",\"flow\",\"flight\"]", expected: "\"fl\"", why: "Normal case" },
      { input: "[\"dog\",\"racecar\",\"car\"]", expected: "\"\"", why: "No common prefix" },
      { input: "[\"a\"]", expected: "\"a\"", why: "Single string" },
      { input: "[\"abc\",\"ab\"]", expected: "\"ab\"", why: "Shorter string ends the scan" },
    ],
    takeawaysMd: "Scanning column by column and stopping at the first disagreement does the minimum possible work. Guard the index against the shortest string before indexing.",
  },

  "remove-duplicates-from-sorted-array": {
    understandMd: "Given a sorted array, remove duplicates in place so each value appears once, keeping the order. Return the number k of unique values; the first k slots must hold them.",
    ioConstraintsMd: "Input: a non-decreasing integer array of length 1 to 30,000. Output: k, with nums[0..k-1] holding the unique values. Extra space must be O(1).",
    edgeCases: ["Single element", "All elements equal", "No duplicates", "Duplicates only at the end"],
    bruteForceMd: "Copy the unique values into a new array (or a set) and copy them back.",
    bruteComplexity: "O(n) time but O(n) extra space, which the problem forbids.",
    bottleneckMd: "The array is sorted, so duplicates are adjacent. You can detect a new value just by comparing with the last value kept, with no extra storage.",
    hints: [
      "Because the array is sorted, where do equal values sit relative to each other?", "Keep a write position for the next unique value and a read position scanning ahead.", "When nums[read] differs from the last value written, it is new.", "Write it at nums[write] and advance write. The answer is write when the scan ends.",
    ],
    optimalMd: "Use two pointers. The first element is always kept, so write starts at 1. Scan read from 1 to n − 1: if nums[read] != nums[write − 1], it is a new value, so copy it to nums[write] and increment write. Return write. Each element is read once and the array is modified in place.",
    code: [
      cpp(`
int removeDuplicates(vector<int>& nums) {
    int write = 1;                                   // nums[0] is always kept
    for (size_t read = 1; read < nums.size(); ++read) {
        if (nums[read] != nums[write - 1]) nums[write++] = nums[read];   // a new value
    }
    return write;
}`, 'C++'),
      java(`
public int removeDuplicates(int[] nums) {
    int write = 1;                                   // nums[0] is always kept
    for (int read = 1; read < nums.length; read++) {
        if (nums[read] != nums[write - 1]) nums[write++] = nums[read];   // a new value
    }
    return write;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,1,2]", expected: "2, array starts [1,2]", why: "Simple duplicate" },
      { input: "[0,0,1,1,1,2,2,3,3,4]", expected: "5, array starts [0,1,2,3,4]", why: "Runs of duplicates" },
      { input: "[5,5,5,5]", expected: "1", why: "All equal" },
      { input: "[1,2,3]", expected: "3", why: "Already unique" },
    ],
    takeawaysMd: "A read pointer that scans and a write pointer that trails is the in-place filtering pattern. Sortedness lets you compare with the last kept value instead of remembering a set.",
  },

  "remove-element": {
    understandMd: "Remove every occurrence of a given value from an array in place and return the count of remaining elements. The first k slots must hold the remaining elements; their order does not matter and nothing beyond k is checked.",
    ioConstraintsMd: "Input: an integer array of length 0 to 100 and a value. Output: k, with the kept elements in nums[0..k-1]. O(1) extra space.",
    edgeCases: ["Empty array", "The value never occurs", "The array consists only of the value", "The value occurs at the very start or end"],
    bruteForceMd: "Build a new list of the elements that differ from the value and copy it back.",
    bruteComplexity: "O(n) time and O(n) extra space.",
    bottleneckMd: "Extra space is the only cost. A second index that trails the scanning index can overwrite removed slots in the same array.",
    hints: [
      "Do you need to preserve the positions of the removed elements?", "Keep a write index for the next slot to fill with a kept element.", "Scan with a read index; copy only elements that are not equal to the value.", "Return the write index. If removals are rare, you can instead swap the last element in, which makes fewer writes.",
    ],
    optimalMd: "Scan with a read index and keep a write index starting at 0. Whenever nums[read] != val, copy it to nums[write] and advance write. When the scan ends the first write elements are exactly the kept ones. If the order may change and the value is rare, an alternative is to overwrite a matching slot with the last element and shrink the length, doing fewer writes.",
    code: [
      cpp(`
int removeElement(vector<int>& nums, int val) {
    int write = 0;
    for (size_t read = 0; read < nums.size(); ++read) {
        if (nums[read] != val) nums[write++] = nums[read];   // keep it
    }
    return write;
}`, 'C++'),
      java(`
public int removeElement(int[] nums, int val) {
    int write = 0;
    for (int read = 0; read < nums.length; read++) {
        if (nums[read] != val) nums[write++] = nums[read];   // keep it
    }
    return write;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[3,2,2,3], val = 3", expected: "2, array starts [2,2]", why: "Typical" },
      { input: "[0,1,2,2,3,0,4,2], val = 2", expected: "5, kept {0,0,1,3,4}", why: "Order of the kept elements is free" },
      { input: "[4,4], val = 4", expected: "0", why: "Everything removed" },
      { input: "[], val = 1", expected: "0", why: "Empty input" },
    ],
    takeawaysMd: "In-place filtering is a copy with a skip condition: read everything, write only what survives. Return the write index as the new length.",
  },

  "find-the-index-of-the-first-occurrence-in-a-string": {
    understandMd: "Find the first position at which the string needle occurs inside the string haystack, or return -1 if it never occurs.",
    ioConstraintsMd: "Input: two non-empty lowercase strings, each up to 10,000 characters. Output: the starting index of the first match, or -1.",
    edgeCases: ["Needle longer than the haystack", "Needle equal to the haystack", "Match at the very end", "Overlapping partial matches such as needle \"aab\" in \"aaab\"", "Needle of length 1"],
    bruteForceMd: "Try every starting position in the haystack and compare the needle character by character.",
    bruteComplexity: "O(n · m) time, O(1) space.",
    bottleneckMd: "After a mismatch the brute force restarts one position later and re-reads characters it has already matched. KMP uses the structure of the needle to avoid that.",
    hints: [
      "When a partial match fails at position j of the needle, what do you already know about the haystack characters you just read?", "The matched part equals needle[0..j-1]. If a shorter prefix of the needle is also a suffix of that part, you can resume from it.", "Precompute for each prefix of the needle the length of its longest proper prefix that is also a suffix (the LPS or failure table).", "On a mismatch set j = lps[j-1] instead of restarting; never move the haystack index backwards.",
    ],
    optimalMd: "Build the LPS table of the needle: lps[i] is the length of the longest proper prefix of needle[0..i] that is also its suffix. Then scan the haystack once with an index j into the needle: on a match advance both, on a mismatch fall back j = lps[j-1] while j > 0, and when j reaches the needle length the match starts at i - m + 1. The haystack index never goes backwards, so the total work is O(n + m). For a typical interview the O(n·m) scan is acceptable; KMP is the upgrade.",
    code: [
      cpp(`
int strStr(string haystack, string needle) {
    int n = haystack.size(), m = needle.size();
    vector<int> lps(m, 0);                            // lps[i]: longest proper prefix of needle[0..i] that is also a suffix
    for (int i = 1, len = 0; i < m; ) {
        if (needle[i] == needle[len]) lps[i++] = ++len;
        else if (len > 0) len = lps[len - 1];
        else lps[i++] = 0;
    }
    for (int i = 0, j = 0; i < n; ) {
        if (haystack[i] == needle[j]) {
            ++i; ++j;
            if (j == m) return i - m;                 // full match
        } else if (j > 0) j = lps[j - 1];             // reuse the matched prefix
        else ++i;
    }
    return -1;
}`, 'C++'),
      java(`
public int strStr(String haystack, String needle) {
    int n = haystack.length(), m = needle.length();
    int[] lps = new int[m];                           // lps[i]: longest proper prefix of needle[0..i] that is also a suffix
    for (int i = 1, len = 0; i < m; ) {
        if (needle.charAt(i) == needle.charAt(len)) lps[i++] = ++len;
        else if (len > 0) len = lps[len - 1];
        else lps[i++] = 0;
    }
    for (int i = 0, j = 0; i < n; ) {
        if (haystack.charAt(i) == needle.charAt(j)) {
            i++; j++;
            if (j == m) return i - m;                 // full match
        } else if (j > 0) j = lps[j - 1];             // reuse the matched prefix
        else i++;
    }
    return -1;
}`, 'Java'),
    ],
    finalComplexity: "O(n + m) time, O(m) space for the failure table.",
    testCases: [
      { input: "\"sadbutsad\", \"sad\"", expected: "0", why: "Match at the start" },
      { input: "\"leetcode\", \"leeto\"", expected: "-1", why: "Partial match then failure" },
      { input: "\"aaab\", \"aab\"", expected: "1", why: "Overlapping prefixes force a fallback" },
      { input: "\"mississippi\", \"issip\"", expected: "4", why: "Second occurrence of the prefix" },
    ],
    takeawaysMd: "Never throw away what a partial match taught you. The failure table of the pattern says how far to fall back, and keeps the text pointer moving only forward.",
  },

  "length-of-last-word": {
    understandMd: "Return the length of the last word in a string of words separated by spaces. The string may have trailing (or leading) spaces.",
    ioConstraintsMd: "Input: a string of up to 10,000 letters and spaces that contains at least one word. Output: the length of the final word.",
    edgeCases: ["Trailing spaces", "A single word with no spaces", "Leading spaces", "Many spaces between words", "One-letter last word"],
    bruteForceMd: "Split the string on spaces, drop empty pieces, and take the length of the last piece.",
    bruteComplexity: "O(n) time, O(n) space for the pieces.",
    bottleneckMd: "Only the last word matters, so splitting the whole string wastes work and memory. Scanning from the end finds it directly.",
    hints: [
      "Which end of the string do you actually need to look at?", "Start from the last character. What should you do with trailing spaces?", "Skip spaces from the right until you hit a letter, then count letters until the next space or the start.", "Two loops from the back: one skips spaces, the other counts non-space characters.",
    ],
    optimalMd: "Start at the last index and move left while the character is a space. Then count characters while they are not spaces and the index is still valid. The count is the answer. Only the final word (plus any trailing spaces) is read.",
    code: [
      cpp(`
int lengthOfLastWord(string s) {
    int i = (int)s.size() - 1;
    while (i >= 0 && s[i] == ' ') --i;           // skip trailing spaces
    int len = 0;
    while (i >= 0 && s[i] != ' ') { ++len; --i; }
    return len;
}`, 'C++'),
      java(`
public int lengthOfLastWord(String s) {
    int i = s.length() - 1;
    while (i >= 0 && s.charAt(i) == ' ') i--;    // skip trailing spaces
    int len = 0;
    while (i >= 0 && s.charAt(i) != ' ') { len++; i--; }
    return len;
}`, 'Java'),
    ],
    finalComplexity: "O(n) worst case (but only the tail is read), O(1) space.",
    testCases: [
      { input: "\"Hello World\"", expected: "5", why: "Plain" },
      { input: "\"   fly me   to   the moon  \"", expected: "4", why: "Trailing spaces and gaps" },
      { input: "\"a\"", expected: "1", why: "One letter" },
      { input: "\"word   \"", expected: "4", why: "Only trailing spaces" },
    ],
    takeawaysMd: "When only one end of the input matters, scan from that end. Two small loops (skip, then count) are clearer than a flag.",
  },

  "merge-sorted-array": {
    understandMd: "Two sorted arrays are given. nums1 has room for all elements: its first m slots hold values and the last n slots are zero placeholders. Merge nums2 into nums1 in place so nums1 ends up sorted.",
    ioConstraintsMd: "Input: nums1 of length m + n, nums2 of length n, both parts sorted, with m and n up to 200. Output: nums1 is modified in place.",
    edgeCases: ["n = 0 (nothing to merge)", "m = 0 (copy nums2)", "All of nums2 is smaller than nums1", "All of nums2 is larger", "Duplicates across the arrays"],
    bruteForceMd: "Copy nums2 into the tail of nums1 and sort the whole array.",
    bruteComplexity: "O((m + n) log(m + n)) time.",
    bottleneckMd: "Merging from the front would overwrite unread values of nums1. The free space is at the back, so fill from the back with the largest values.",
    hints: [
      "Where is the unused space in nums1?", "If you write from the front you destroy unread elements. What if you wrote from the back instead?", "The largest remaining element is at the end of one of the two arrays. Compare those two and place the larger at the last free slot.", "Use three indices: i = m − 1, j = n − 1, k = m + n − 1. When nums2 runs out you are done; leftover nums1 elements are already in place.",
    ],
    optimalMd: "Keep pointers i (last unread value of nums1), j (last of nums2) and k (next write position, from the back). While j >= 0: if i >= 0 and nums1[i] > nums2[j] write nums1[i--] at k, otherwise write nums2[j--]; decrement k. When j goes below 0 every element of nums2 has been placed, and any remaining nums1 elements are already in their correct positions.",
    code: [
      cpp(`
void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
    int i = m - 1, j = n - 1, k = m + n - 1;       // fill from the back so unread values are never overwritten
    while (j >= 0) {
        if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
        else nums1[k--] = nums2[j--];
    }
}`, 'C++'),
      java(`
public void merge(int[] nums1, int m, int[] nums2, int n) {
    int i = m - 1, j = n - 1, k = m + n - 1;       // fill from the back so unread values are never overwritten
    while (j >= 0) {
        if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
        else nums1[k--] = nums2[j--];
    }
}`, 'Java'),
    ],
    finalComplexity: "O(m + n) time, O(1) space.",
    testCases: [
      { input: "[1,2,3,0,0,0], m = 3, [2,5,6], n = 3", expected: "[1,2,2,3,5,6]", why: "Interleaved" },
      { input: "[1], m = 1, [], n = 0", expected: "[1]", why: "Nothing to merge" },
      { input: "[0], m = 0, [1], n = 1", expected: "[1]", why: "First array is only space" },
      { input: "[4,5,6,0,0,0], m = 3, [1,2,3], n = 3", expected: "[1,2,3,4,5,6]", why: "All of nums2 is smaller" },
    ],
    takeawaysMd: "If the free space is at the end, fill from the end. Choosing the write direction so you never overwrite unread data is a recurring in-place trick.",
  },

  "remove-duplicates-from-sorted-array-ii": {
    understandMd: "Given a sorted array, remove duplicates in place so that each value appears at most twice. Return the new length; the first k slots must hold the result.",
    ioConstraintsMd: "Input: a non-decreasing integer array of length 1 to 30,000. Output: k, with the kept values in nums[0..k-1]. O(1) extra space.",
    edgeCases: ["Fewer than three elements", "A value that occurs exactly twice", "A long run of one value", "All values distinct"],
    bruteForceMd: "Count occurrences with a map and rebuild the array, or repeatedly shift the array left whenever a third copy appears.",
    bruteComplexity: "O(n) time with O(n) space for the map, or O(n²) time with shifting.",
    bottleneckMd: "Shifting is wasteful and a map ignores the sorted order. Because equal values are adjacent, a value is a third copy exactly when it equals the element two places behind the write position.",
    hints: [
      "Which kept element do you compare the current value with to know it would be a third copy?", "Keep a write index. The first two elements can always be kept.", "For later elements, compare nums[read] with nums[write − 2].", "If they differ the value may be kept; copy it to nums[write] and advance. If they are equal you would have three in a row, so skip it.",
    ],
    optimalMd: "Keep a write index w. For every element x: if w < 2 or x != nums[w − 2] then nums[w++] = x. The check against nums[w − 2] is enough because the array is sorted: if x equals the value two slots back in the kept prefix, then the value two back and the one in between are both x, so x would be a third copy. This generalises to at most k copies by comparing with nums[w − k].",
    code: [
      cpp(`
int removeDuplicates(vector<int>& nums) {
    int w = 0;
    for (int x : nums) {
        if (w < 2 || x != nums[w - 2]) nums[w++] = x;   // keep unless it would be a third copy
    }
    return w;
}`, 'C++'),
      java(`
public int removeDuplicates(int[] nums) {
    int w = 0;
    for (int x : nums) {
        if (w < 2 || x != nums[w - 2]) nums[w++] = x;   // keep unless it would be a third copy
    }
    return w;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,1,1,2,2,3]", expected: "5, array starts [1,1,2,2,3]", why: "A triple is cut to a pair" },
      { input: "[0,0,1,1,1,1,2,3,3]", expected: "7, array starts [0,0,1,1,2,3,3]", why: "A run of four" },
      { input: "[5]", expected: "1", why: "Single element" },
    ],
    takeawaysMd: "To allow at most k copies in a sorted array, compare the candidate with the element k places behind the write index. The same two-pointer filter handles any k.",
  },

  "majority-element": {
    understandMd: "An array of n integers has a value that appears more than n / 2 times (it is guaranteed to exist). Return that value.",
    ioConstraintsMd: "Input: an integer array of length 1 to 50,000 with a guaranteed majority element. Output: the majority value. The follow-up asks for O(n) time and O(1) space.",
    edgeCases: ["Single element", "Majority is exactly n/2 + 1 of the elements", "Majority values clustered at the start or the end", "All elements equal", "Negative numbers"],
    bruteForceMd: "Count occurrences with a hash map and return the value whose count exceeds n / 2 (or sort and return the middle element).",
    bruteComplexity: "O(n) time and O(n) space with a map, or O(n log n) time with sorting.",
    bottleneckMd: "A map spends memory just to find one winner. Since the majority element outnumbers everything else combined, pairing off different elements can never eliminate it.",
    hints: [
      "If you removed two different elements at a time, what could never be removed completely?", "Imagine a running candidate and a counter that goes up for the candidate and down for anything else.", "When the counter reaches zero, the prefix seen so far has no majority, so you may start over with a new candidate.", "This is the Boyer-Moore voting algorithm: if count == 0 set candidate = x, then count += (x == candidate) ? 1 : -1. The guarantee makes a verification pass unnecessary.",
    ],
    optimalMd: "Boyer-Moore voting. Keep a candidate and a count. For each x: if count is 0 adopt x as the candidate; then add 1 if x equals the candidate, otherwise subtract 1. Every decrement cancels one majority vote against one non-majority vote. Since the majority element has more than half of all votes, it cannot be fully cancelled and is the candidate at the end. If a majority were not guaranteed, a second pass would be needed to verify it.",
    code: [
      cpp(`
int majorityElement(vector<int>& nums) {
    int candidate = 0, count = 0;
    for (int x : nums) {
        if (count == 0) candidate = x;            // the prefix so far has cancelled out; start fresh
        count += (x == candidate) ? 1 : -1;
    }
    return candidate;
}`, 'C++'),
      java(`
public int majorityElement(int[] nums) {
    int candidate = 0, count = 0;
    for (int x : nums) {
        if (count == 0) candidate = x;            // the prefix so far has cancelled out; start fresh
        count += (x == candidate) ? 1 : -1;
    }
    return candidate;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[3,2,3]", expected: "3", why: "Small" },
      { input: "[2,2,1,1,1,2,2]", expected: "2", why: "Candidate changes mid-way" },
      { input: "[7]", expected: "7", why: "Single element" },
      { input: "[-1,-1,5,5,-1]", expected: "-1", why: "Negative values" },
    ],
    takeawaysMd: "Voting by cancellation: pairing off different elements cannot remove a strict majority. It is a clean example of trading a hash map for a counter by exploiting a guarantee.",
  },

  "rotate-array": {
    understandMd: "Rotate an array to the right by k steps in place: the last k elements move to the front, keeping their order.",
    ioConstraintsMd: "Input: an integer array of length 1 to 100,000 and a non-negative k (possibly larger than the length). Output: the array modified in place; aim for O(1) extra space.",
    edgeCases: ["k = 0", "k equal to the length (a full turn changes nothing)", "k larger than the length", "Single element", "k = 1"],
    bruteForceMd: "Rotate by one position k times, shifting every element each time; or copy into a second array at index (i + k) % n.",
    bruteComplexity: "O(n · k) time with repeated shifting, or O(n) time and O(n) space with a copy.",
    bottleneckMd: "The extra array is only needed to avoid overwriting values. Three reversals produce the same permutation without any extra storage.",
    hints: [
      "First reduce k: rotating by n is the identity, so only k mod n matters.", "After rotating, the last k elements come first and the first n − k come last. What operation turns a block around?", "Reversing the whole array puts the last k elements at the front, but in reverse order.", "Reverse the whole array, then reverse the first k elements, then reverse the remaining n − k.",
    ],
    optimalMd: "Let k = k mod n. Reverse the entire array: the last k elements are now at the front, in reverse order, followed by the first n − k in reverse order. Reverse the first k elements and then the last n − k elements to restore each block's internal order. Three in-place reversals touch each element a constant number of times.",
    code: [
      cpp(`
void rotate(vector<int>& nums, int k) {
    int n = nums.size();
    k %= n;                                          // a full turn changes nothing
    reverse(nums.begin(), nums.end());               // [4,5,6,7,1,2,3] for k = 3 on 1..7
    reverse(nums.begin(), nums.begin() + k);         // restore the order of the front block
    reverse(nums.begin() + k, nums.end());           // restore the order of the back block
}`, 'C++'),
      java(`
public void rotate(int[] nums, int k) {
    int n = nums.length;
    k %= n;                                          // a full turn changes nothing
    reverse(nums, 0, n - 1);                         // [7,6,5,4,3,2,1] for k = 3 on 1..7
    reverse(nums, 0, k - 1);                         // restore the order of the front block
    reverse(nums, k, n - 1);                         // restore the order of the back block
}

private void reverse(int[] a, int i, int j) {
    while (i < j) { int t = a[i]; a[i++] = a[j]; a[j--] = t; }
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,2,3,4,5,6,7], k = 3", expected: "[5,6,7,1,2,3,4]", why: "Standard" },
      { input: "[-1,-100,3,99], k = 2", expected: "[3,99,-1,-100]", why: "Half turn" },
      { input: "[1,2], k = 3", expected: "[2,1]", why: "k larger than n" },
      { input: "[1,2,3], k = 0", expected: "[1,2,3]", why: "No rotation" },
    ],
    takeawaysMd: "A rotation is \"reverse everything, then reverse each block\". Reversal composes well and needs no spare buffer. Always reduce k modulo the length first.",
  },

  "reverse-words-in-a-string": {
    understandMd: "Reverse the order of the words in a string. A word is a maximal run of non-space characters. The result has the words separated by a single space, with no leading or trailing spaces.",
    ioConstraintsMd: "Input: a string of up to 10,000 letters, digits and spaces with at least one word. Output: the words in reverse order joined by single spaces.",
    edgeCases: ["Leading and trailing spaces", "Several spaces between words", "A single word", "Words of different lengths"],
    bruteForceMd: "Split on spaces, discard empty strings, reverse the list and join with single spaces.",
    bruteComplexity: "O(n) time, O(n) space.",
    bottleneckMd: "Nothing is asymptotically slow. The interesting follow-up is doing it in place (for a mutable string) with O(1) extra space.",
    hints: [
      "If you reverse the entire string, what happens to the order of the words and to the letters inside each word?", "The words are now in the right order but each one is backwards. How do you fix that?", "Reverse each word again. While doing so you can also squeeze out the extra spaces by writing to a compact position.", "Alternatively, scan from the back, copy each word as you meet it, and put one space between words.",
    ],
    optimalMd: "In C++ (mutable strings) reverse the whole string, then walk through it with a read index and a write index. Skip spaces; for every word insert a single space before it (except for the first word), copy the word to the write position and reverse it back in place. Finally resize to the write index. In Java, where strings are immutable, scan from the back: skip spaces, mark the end of a word, move left to its start, and append it with a separating space.",
    code: [
      cpp(`
string reverseWords(string s) {
    reverse(s.begin(), s.end());                      // words are now in the right order but spelled backwards
    int n = s.size(), w = 0;
    for (int i = 0; i < n; ) {
        while (i < n && s[i] == ' ') ++i;             // skip spaces between words
        if (i == n) break;
        if (w > 0) s[w++] = ' ';                      // single separator
        int start = w;
        while (i < n && s[i] != ' ') s[w++] = s[i++]; // compact the word towards the front
        reverse(s.begin() + start, s.begin() + w);    // spell it the right way round
    }
    s.resize(w);
    return s;
}`, 'C++'),
      java(`
public String reverseWords(String s) {
    StringBuilder out = new StringBuilder();
    int i = s.length() - 1;
    while (i >= 0) {
        while (i >= 0 && s.charAt(i) == ' ') i--;     // skip spaces
        if (i < 0) break;
        int end = i;
        while (i >= 0 && s.charAt(i) != ' ') i--;     // i stops just before the word
        if (out.length() > 0) out.append(' ');
        out.append(s, i + 1, end + 1);
    }
    return out.toString();
}`, 'Java'),
    ],
    finalComplexity: "O(n) time. O(1) extra space in C++ (in place), O(n) for the Java output builder.",
    testCases: [
      { input: "\"the sky is blue\"", expected: "\"blue is sky the\"", why: "Plain" },
      { input: "\"  hello world  \"", expected: "\"world hello\"", why: "Outer spaces trimmed" },
      { input: "\"a good   example\"", expected: "\"example good a\"", why: "Inner gap collapsed" },
      { input: "\"word\"", expected: "\"word\"", why: "One word" },
    ],
    takeawaysMd: "Reverse the whole thing, then reverse the pieces: a pattern shared with array rotation. Cleaning up separators can be folded into the same pass with a write index.",
  },

  "h-index": {
    understandMd: "Given the citation counts of a researcher's papers, return the h-index: the largest h such that at least h papers have at least h citations each.",
    ioConstraintsMd: "Input: an array of n non-negative integers (n up to 5,000, each up to 1,000). Output: the h-index.",
    edgeCases: ["All zeros (h = 0)", "A single paper", "All papers have huge counts (h = n)", "Counts larger than n", "Duplicates"],
    bruteForceMd: "For every candidate h from n down to 0 count the papers with at least h citations and return the first h that has at least h of them.",
    bruteComplexity: "O(n²) time, O(1) space.",
    bottleneckMd: "Counting for every h repeats work. Sorting makes the count a position, and bucketing by min(citation, n) removes the sort entirely because h can never exceed n.",
    hints: [
      "What is the largest value h could possibly have, whatever the citation counts are?", "Any citation count above n behaves like n. How does that let you avoid sorting?", "Count how many papers fall in each bucket 0..n, where bucket n means \"n or more\".", "Walk h from n down to 0, keeping a running total of papers with at least h citations; return the first h where total ≥ h.",
    ],
    optimalMd: "Create n + 1 buckets and count each paper in bucket min(citations, n). Then scan h from n down to 0 while accumulating the number of papers with at least h citations (the sum of the buckets h..n). The first h whose running total is at least h is the answer. Sorting plus a scan is the O(n log n) alternative.",
    code: [
      cpp(`
int hIndex(vector<int>& citations) {
    int n = citations.size();
    vector<int> bucket(n + 1, 0);
    for (int c : citations) ++bucket[min(c, n)];     // h can never exceed n, so cap the counts
    int papers = 0;                                   // papers with at least h citations
    for (int h = n; h >= 0; --h) {
        papers += bucket[h];
        if (papers >= h) return h;
    }
    return 0;
}`, 'C++'),
      java(`
public int hIndex(int[] citations) {
    int n = citations.length;
    int[] bucket = new int[n + 1];
    for (int c : citations) bucket[Math.min(c, n)]++;   // h can never exceed n, so cap the counts
    int papers = 0;                                      // papers with at least h citations
    for (int h = n; h >= 0; h--) {
        papers += bucket[h];
        if (papers >= h) return h;
    }
    return 0;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "[3,0,6,1,5]", expected: "3", why: "Three papers with at least 3 citations" },
      { input: "[1,3,1]", expected: "1", why: "All three papers have at least 1 citation, but only one has at least 2, so h = 1" },
      { input: "[0]", expected: "0", why: "No citations" },
      { input: "[100]", expected: "1", why: "One paper cannot give more than h = 1" },
    ],
    takeawaysMd: "When the answer is bounded by the input size, bucket by min(value, n) and avoid sorting. Counting buckets from the top turns \"at least h\" into a running sum.",
  },

  "candy": {
    understandMd: "Children stand in a line, each with a rating. Give every child at least one candy, and give a child strictly more candy than an adjacent neighbour with a lower rating. Return the minimum total number of candies.",
    ioConstraintsMd: "Input: an array of n ratings (n up to 20,000). Output: the minimum total candies.",
    edgeCases: ["Single child", "All ratings equal (everyone gets 1)", "Strictly increasing and strictly decreasing ratings", "A valley or a peak", "Equal neighbours (no constraint between them)"],
    bruteForceMd: "Start everyone at 1 and keep scanning, raising a child whenever a lower-rated neighbour has at least as much candy, until nothing changes.",
    bruteComplexity: "O(n²) time in the worst case (a decreasing run can need many passes).",
    bottleneckMd: "Each child has two constraints, one from the left neighbour and one from the right. Handling both in one pass is awkward, but handling each direction in its own pass is simple and the answers combine with a max.",
    hints: [
      "Split the rule into \"compare with the left neighbour\" and \"compare with the right neighbour\".", "If you only had the left rule, how would one left-to-right pass assign candies?", "Do the same right-to-left for the right rule.", "A child must satisfy both rules, so the final candy count is the maximum of the two passes; sum those.",
    ],
    optimalMd: "Two passes. Left to right: left[i] = left[i − 1] + 1 if rating[i] > rating[i − 1], else 1. Right to left: right[i] = right[i + 1] + 1 if rating[i] > rating[i + 1], else 1. Child i needs max(left[i], right[i]) candies, which satisfies both neighbours and is the smallest value that can. Sum the maxima. (A one-pass O(1)-space version tracks rising and falling run lengths.)",
    code: [
      cpp(`
int candy(vector<int>& ratings) {
    int n = ratings.size();
    vector<int> give(n, 1);
    for (int i = 1; i < n; ++i)                       // satisfy the left neighbour
        if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1;
    for (int i = n - 2; i >= 0; --i)                  // satisfy the right neighbour without breaking the left rule
        if (ratings[i] > ratings[i + 1]) give[i] = max(give[i], give[i + 1] + 1);
    return accumulate(give.begin(), give.end(), 0);
}`, 'C++'),
      java(`
public int candy(int[] ratings) {
    int n = ratings.length;
    int[] give = new int[n];
    Arrays.fill(give, 1);
    for (int i = 1; i < n; i++)                       // satisfy the left neighbour
        if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1;
    for (int i = n - 2; i >= 0; i--)                  // satisfy the right neighbour without breaking the left rule
        if (ratings[i] > ratings[i + 1]) give[i] = Math.max(give[i], give[i + 1] + 1);
    int total = 0;
    for (int g : give) total += g;
    return total;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "[1,0,2]", expected: "5", why: "Candies 2,1,2" },
      { input: "[1,2,2]", expected: "4", why: "Equal neighbours impose no constraint: 1,2,1" },
      { input: "[1,2,3,4]", expected: "10", why: "Strictly increasing: 1+2+3+4" },
      { input: "[1,3,2,2,1]", expected: "7", why: "1,2,1,2,1" },
    ],
    takeawaysMd: "When each element is constrained by both neighbours, satisfy one direction per pass and take the maximum. Two simple sweeps beat one complicated one.",
  },

  "text-justification": {
    understandMd: "Format a list of words into lines of exactly maxWidth characters. Pack as many words as fit on each line, distribute extra spaces as evenly as possible between words (extra spaces go to the left gaps first), left-justify the last line and any line with a single word.",
    ioConstraintsMd: "Input: an array of words (each at most maxWidth long) and maxWidth up to 100. Output: the list of fully padded lines.",
    edgeCases: ["A line holding a single word (left-justified, padded with spaces)", "The last line (words separated by single spaces, padded on the right)", "Spaces that do not divide evenly between gaps", "A word exactly maxWidth long", "Exactly one word in total"],
    bruteForceMd: "There is no simpler method: this is a careful simulation. A common slip is to compute line widths without counting the mandatory single space between words.",
    bruteComplexity: "O(total characters).",
    bottleneckMd: "The difficulty is bookkeeping rather than algorithmic. Split it into two steps: greedily choose which words go on a line, then build the line with the correct spacing.",
    hints: [
      "How do you decide greedily how many words fit on the current line? Remember each pair of words needs at least one space.", "For a line with g gaps and S total spaces to place, how many spaces does each gap get, and who receives the remainder?", "Each gap gets S / g spaces; the leftmost S mod g gaps get one more.", "Special cases: the last line and lines with one word are left-justified with single spaces and padded on the right.",
    ],
    optimalMd: "Scan with an index i. Starting at i, extend j while the words from i to j plus one space between each still fit within maxWidth, tracking the total letters. The number of gaps is j − i − 1. If this is the last line or there are no gaps, join the words with single spaces and pad with spaces on the right. Otherwise let spaces = maxWidth − letters, each gap gets spaces / gaps and the first spaces % gaps gaps get one extra. Append the line and continue from j.",
    code: [
      cpp(`
vector<string> fullJustify(vector<string>& words, int maxWidth) {
    vector<string> lines;
    int n = words.size();
    for (int i = 0; i < n; ) {
        int j = i, letters = 0;
        while (j < n && letters + (int)words[j].size() + (j - i) <= maxWidth) letters += words[j++].size();
        int gaps = j - i - 1;
        string line = words[i];
        if (j == n || gaps == 0) {                                   // last line or a lone word: left-justify
            for (int k = i + 1; k < j; ++k) line += " " + words[k];
            line += string(maxWidth - line.size(), ' ');
        } else {
            int spaces = maxWidth - letters, each = spaces / gaps, extra = spaces % gaps;
            for (int k = i + 1; k < j; ++k)                          // the leftmost gaps get the remainder
                line += string(each + (k - i <= extra ? 1 : 0), ' ') + words[k];
        }
        lines.push_back(line);
        i = j;
    }
    return lines;
}`, 'C++'),
      java(`
public List<String> fullJustify(String[] words, int maxWidth) {
    List<String> lines = new ArrayList<>();
    int n = words.length;
    for (int i = 0; i < n; ) {
        int j = i, letters = 0;
        while (j < n && letters + words[j].length() + (j - i) <= maxWidth) letters += words[j++].length();
        int gaps = j - i - 1;
        StringBuilder line = new StringBuilder(words[i]);
        if (j == n || gaps == 0) {                                   // last line or a lone word: left-justify
            for (int k = i + 1; k < j; k++) line.append(' ').append(words[k]);
            while (line.length() < maxWidth) line.append(' ');
        } else {
            int spaces = maxWidth - letters, each = spaces / gaps, extra = spaces % gaps;
            for (int k = i + 1; k < j; k++) {                        // the leftmost gaps get the remainder
                int count = each + (k - i <= extra ? 1 : 0);
                for (int s = 0; s < count; s++) line.append(' ');
                line.append(words[k]);
            }
        }
        lines.add(line.toString());
        i = j;
    }
    return lines;
}`, 'Java'),
    ],
    finalComplexity: "O(total characters) time, O(total characters) space for the output.",
    testCases: [
      { input: "[\"This\",\"is\",\"an\",\"example\",\"of\",\"text\",\"justification.\"], 16", expected: "[\"This    is    an\",\"example  of text\",\"justification.  \"]", why: "Remainder spaces go left; last line left-justified" },
      { input: "[\"What\",\"must\",\"be\",\"acknowledgment\",\"shall\",\"be\"], 16", expected: "[\"What   must   be\",\"acknowledgment  \",\"shall be        \"]", why: "A lone word is left-justified" },
      { input: "[\"a\"], 3", expected: "[\"a  \"]", why: "Single word" },
      { input: "[\"abc\",\"de\"], 3", expected: "[\"abc\",\"de \"]", why: "Each word exactly fills or pads its own line" },
    ],
    takeawaysMd: "For simulation problems, separate the decision (which words go together) from the rendering (how to space them). Write the special cases first, then the general formula.",
  },

  "best-time-to-buy-and-sell-stock-ii": {
    understandMd: "Given the price of a stock on each day, you may buy and sell as many times as you like but hold at most one share at a time. Return the maximum total profit.",
    ioConstraintsMd: "Input: an array of up to 30,000 non-negative prices. Output: the maximum profit (0 if prices only fall).",
    edgeCases: ["Prices only fall (profit 0)", "A single day", "Prices only rise", "Equal consecutive prices", "A zig-zag series"],
    bruteForceMd: "Recursively try, for each day, to buy or sell or skip, and take the best outcome.",
    bruteComplexity: "Exponential time without memoisation.",
    bottleneckMd: "Because there is no limit on the number of trades and no fee, a rise from day i to day i + 1 can always be captured on its own. Any long profitable stretch is just the sum of its daily rises.",
    hints: [
      "Is there any benefit to holding through a falling day?", "A profit from day a to day b equals the sum of the daily changes between them.", "Which daily changes can a profitable plan include?", "Add every positive day-to-day difference and ignore the negative ones.",
    ],
    optimalMd: "Sum max(0, prices[i] − prices[i − 1]) for every i from 1. Each positive step corresponds to buying the day before and selling that day; consecutive positive steps are equivalent to one long hold, and negative steps are skipped by not holding. This is optimal because any strategy's profit is a sum of daily changes over the days it holds, which is at most the sum of the positive changes.",
    code: [
      cpp(`
int maxProfit(vector<int>& prices) {
    int profit = 0;
    for (size_t i = 1; i < prices.size(); ++i)
        profit += max(0, prices[i] - prices[i - 1]);      // capture every upward step
    return profit;
}`, 'C++'),
      java(`
public int maxProfit(int[] prices) {
    int profit = 0;
    for (int i = 1; i < prices.length; i++)
        profit += Math.max(0, prices[i] - prices[i - 1]);   // capture every upward step
    return profit;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[7,1,5,3,6,4]", expected: "7", why: "Buy 1 sell 5, buy 3 sell 6: 4 + 3" },
      { input: "[1,2,3,4,5]", expected: "4", why: "One long hold equals the sum of the steps" },
      { input: "[7,6,4,3,1]", expected: "0", why: "Never profitable" },
      { input: "[5]", expected: "0", why: "One day" },
    ],
    takeawaysMd: "With unlimited transactions and no fees, profit decomposes into independent daily steps. Check whether a problem decomposes before reaching for a DP table.",
  },

  "insert-delete-getrandom-o1": {
    understandMd: "Design a set of integers that supports insert, remove and getRandom, each in average O(1) time. getRandom must return each current element with equal probability.",
    ioConstraintsMd: "Operations: insert(val) returns true if val was absent; remove(val) returns true if val was present; getRandom() returns a uniformly random element (only called when the set is non-empty). Up to 200,000 operations.",
    edgeCases: ["Inserting a duplicate (returns false)", "Removing a value that is not present", "Removing the last element in the array", "Removing the only element", "getRandom with one element"],
    bruteForceMd: "A hash set gives O(1) insert and remove, but picking a random element requires walking to a random position, which is O(n). A plain array gives O(1) random access but O(n) removal and lookup.",
    bruteComplexity: "O(n) for either getRandom (hash set) or remove (array).",
    bottleneckMd: "You need random access by index and lookup by value at the same time. Keep both an array of the values and a map from value to its array index.",
    hints: [
      "Which structure picks a uniform random element in O(1), and which structure finds an element in O(1)?", "Use an array for the values and a hash map from value to index.", "Removing from the middle of an array is O(n). Is there a position you can remove in O(1)?", "Overwrite the removed slot with the last element, update that element's index in the map, then pop the end.",
    ],
    optimalMd: "Store the elements in a vector and keep a hash map from each value to its index in the vector. insert appends and records the index. remove looks up the index of the value, copies the last element into that slot, updates the map entry of the moved element, pops the last position and erases the removed value from the map (in that order, so removing the last element itself still works). getRandom picks a random index into the vector.",
    code: [
      cpp(`
class RandomizedSet {
    vector<int> items;
    unordered_map<int, int> where;                   // value -> index in items
public:
    bool insert(int val) {
        if (where.count(val)) return false;
        where[val] = items.size();
        items.push_back(val);
        return true;
    }
    bool remove(int val) {
        auto it = where.find(val);
        if (it == where.end()) return false;
        int idx = it->second, last = items.back();
        items[idx] = last;                           // move the last element into the hole
        where[last] = idx;
        items.pop_back();
        where.erase(val);                            // erase after the update so val == last still works
        return true;
    }
    int getRandom() { return items[rand() % items.size()]; }
};`, 'C++'),
      java(`
class RandomizedSet {
    private final List<Integer> items = new ArrayList<>();
    private final Map<Integer, Integer> where = new HashMap<>();   // value -> index in items
    private final Random rng = new Random();

    public boolean insert(int val) {
        if (where.containsKey(val)) return false;
        where.put(val, items.size());
        items.add(val);
        return true;
    }

    public boolean remove(int val) {
        Integer idx = where.get(val);
        if (idx == null) return false;
        int last = items.get(items.size() - 1);
        items.set(idx, last);                        // move the last element into the hole
        where.put(last, idx);
        items.remove(items.size() - 1);
        where.remove(val);                           // remove after the update so val == last still works
        return true;
    }

    public int getRandom() { return items.get(rng.nextInt(items.size())); }
}`, 'Java'),
    ],
    finalComplexity: "O(1) average time per operation, O(n) space.",
    testCases: [
      { input: "insert(1), remove(2), insert(2), getRandom()", expected: "true, false, true, 1 or 2", why: "Basic flow" },
      { input: "remove(1), insert(2), getRandom()", expected: "true, false, 2", why: "After removal only 2 remains" },
      { input: "insert then remove the same value twice", expected: "true, true, false", why: "Second removal reports absence" },
      { input: "400 getRandom calls on {0,1,2,3}", expected: "every value appears", why: "Uniform choice reaches all elements" },
    ],
    takeawaysMd: "Combine two structures to get the strengths of both. The delete-by-swapping-with-last trick turns an O(n) array removal into O(1) when order does not matter.",
  },

  "summary-ranges": {
    understandMd: "Given a sorted array of distinct integers, return the smallest list of ranges that covers exactly the same numbers. A range of one number is written \"a\"; a longer range is written \"a->b\".",
    ioConstraintsMd: "Input: a sorted array of up to 20 distinct integers (possibly empty). Output: the list of range strings.",
    edgeCases: ["Empty array", "A single element", "No consecutive numbers", "All numbers consecutive", "Values near the 32-bit limits (watch overflow when adding 1)"],
    bruteForceMd: "For each element check whether it extends the previous range, building strings as you go.",
    bruteComplexity: "O(n) time. The scan is already optimal; the work is in the bookkeeping.",
    bottleneckMd: "The only pitfall is the boundary handling: closing the final range after the loop, and adding 1 to a value that could be the maximum integer.",
    hints: [
      "A range ends where the next number is not exactly one more.", "Remember where the current range started.", "Walk with an index i; extend j while nums[j + 1] == nums[j] + 1.", "After the inner loop, output either \"a\" (start equals end) or \"a->b\". Use 64-bit arithmetic to compare, to avoid overflow.",
    ],
    optimalMd: "Walk through the array with an outer index i. Set j = i and advance j while the next element equals nums[j] + 1 (compared using 64-bit integers). Then emit nums[i] alone if i == j, otherwise \"nums[i]->nums[j]\", and continue from j + 1. Every element is visited exactly once.",
    code: [
      cpp(`
vector<string> summaryRanges(vector<int>& nums) {
    vector<string> out;
    int n = nums.size();
    for (int i = 0; i < n; ) {
        int j = i;
        while (j + 1 < n && (long long)nums[j + 1] == (long long)nums[j] + 1) ++j;   // extend the run
        out.push_back(i == j ? to_string(nums[i]) : to_string(nums[i]) + "->" + to_string(nums[j]));
        i = j + 1;
    }
    return out;
}`, 'C++'),
      java(`
public List<String> summaryRanges(int[] nums) {
    List<String> out = new ArrayList<>();
    int n = nums.length;
    for (int i = 0; i < n; ) {
        int j = i;
        while (j + 1 < n && (long) nums[j + 1] == (long) nums[j] + 1) j++;           // extend the run
        out.add(i == j ? String.valueOf(nums[i]) : nums[i] + "->" + nums[j]);
        i = j + 1;
    }
    return out;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) extra space besides the output.",
    testCases: [
      { input: "[0,1,2,4,5,7]", expected: "[\"0->2\",\"4->5\",\"7\"]", why: "Mixed ranges" },
      { input: "[0,2,3,4,6,8,9]", expected: "[\"0\",\"2->4\",\"6\",\"8->9\"]", why: "Single values and runs" },
      { input: "[]", expected: "[]", why: "Empty" },
      { input: "[2147483646, 2147483647]", expected: "[\"2147483646->2147483647\"]", why: "Needs 64-bit comparison" },
    ],
    takeawaysMd: "Run-length style scanning: find the end of the current run, emit, jump past it. Compare with a wider integer type whenever you add to a value near the type limit.",
  },

  "game-of-life": {
    understandMd: "A grid of cells is alive (1) or dead (0). In one step, every cell simultaneously updates using its eight neighbours: a live cell with fewer than 2 or more than 3 live neighbours dies, a live cell with 2 or 3 survives, and a dead cell with exactly 3 live neighbours becomes alive. Compute the next state in place.",
    ioConstraintsMd: "Input: an m by n grid of 0s and 1s (m, n up to 25). Output: the board modified in place to the next state.",
    edgeCases: ["A single cell", "Cells on the edges and corners (fewer neighbours)", "A grid that never changes (a block)", "An oscillator (blinker)", "A completely dead grid"],
    bruteForceMd: "Copy the board, compute each new cell from the copy and write it back.",
    bruteComplexity: "O(m · n) time and O(m · n) extra space.",
    bottleneckMd: "The updates must be simultaneous, so you cannot overwrite a cell before its neighbours have read it. Encode both the old and the new state in the same integer to avoid the copy.",
    hints: [
      "Why can't you simply update cells one by one in place?", "Each cell holds a 0 or 1. Which other bit of the same integer could hold the next state?", "Use bit 0 for the current state and bit 1 for the next state; read neighbours with & 1.", "After computing all next states into bit 1, shift every cell right by one bit.",
    ],
    optimalMd: "Two passes. First pass: for every cell count live neighbours using (board[r][c] & 1), which is the current state even if bit 1 has been written. Set bit 1 (value |= 2) when the next state is alive: a cell with 3 live neighbours, or a live cell with 2. Second pass: shift every cell right by one bit, so the next state replaces the current one. This needs O(1) extra space.",
    code: [
      cpp(`
void gameOfLife(vector<vector<int>>& board) {
    int m = board.size(), n = board[0].size();
    for (int r = 0; r < m; ++r) {
        for (int c = 0; c < n; ++c) {
            int live = 0;
            for (int dr = -1; dr <= 1; ++dr)
                for (int dc = -1; dc <= 1; ++dc) {
                    if (dr == 0 && dc == 0) continue;
                    int rr = r + dr, cc = c + dc;
                    if (rr >= 0 && rr < m && cc >= 0 && cc < n) live += board[rr][cc] & 1;   // bit 0 is the old state
                }
            if (live == 3 || (board[r][c] == 1 && live == 2)) board[r][c] |= 2;              // bit 1 is the new state
        }
    }
    for (auto& row : board) for (int& cell : row) cell >>= 1;
}`, 'C++'),
      java(`
public void gameOfLife(int[][] board) {
    int m = board.length, n = board[0].length;
    for (int r = 0; r < m; r++) {
        for (int c = 0; c < n; c++) {
            int live = 0;
            for (int dr = -1; dr <= 1; dr++)
                for (int dc = -1; dc <= 1; dc++) {
                    if (dr == 0 && dc == 0) continue;
                    int rr = r + dr, cc = c + dc;
                    if (rr >= 0 && rr < m && cc >= 0 && cc < n) live += board[rr][cc] & 1;   // bit 0 is the old state
                }
            if (live == 3 || (board[r][c] == 1 && live == 2)) board[r][c] |= 2;              // bit 1 is the new state
        }
    }
    for (int[] row : board) for (int c = 0; c < n; c++) row[c] >>= 1;
}`, 'Java'),
    ],
    finalComplexity: "O(m · n) time, O(1) extra space.",
    testCases: [
      { input: "[[0,1,0],[0,0,1],[1,1,1],[0,0,0]]", expected: "[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]", why: "A glider step" },
      { input: "[[1,1],[1,0]]", expected: "[[1,1],[1,1]]", why: "Dead corner with exactly 3 neighbours is born" },
      { input: "[[1]]", expected: "[[0]]", why: "Lone cell dies" },
      { input: "[[0,1,0],[0,1,0],[0,1,0]]", expected: "[[0,0,0],[1,1,1],[0,0,0]]", why: "Blinker flips" },
    ],
    takeawaysMd: "To update a structure \"simultaneously\" in place, store old and new state in different bits of the same cell. Two passes (compute, then shift) replace a full copy.",
  },

  "max-points-on-a-line": {
    understandMd: "Given points on a 2D plane, return the largest number of points that lie on the same straight line.",
    ioConstraintsMd: "Input: an array of 1 to 300 distinct integer points with coordinates in [-10,000, 10,000]. Output: the maximum count of collinear points.",
    edgeCases: ["One or two points (always collinear)", "Vertical lines (infinite slope)", "Horizontal lines", "Negative slopes", "Slopes that look different as fractions but are equal (such as 1/2 and 2/4)"],
    bruteForceMd: "For every pair of points define a line and count all points on it with a cross-product test.",
    bruteComplexity: "O(n³) time, O(1) space.",
    bottleneckMd: "Counting all points per pair repeats work. Fix one anchor point and group the other points by the direction from the anchor: points with the same direction are on one line through the anchor.",
    hints: [
      "If you fix a point, how can you recognise two other points that are on a line through it?", "They have the same direction from the anchor. How would you represent a direction without floating-point error?", "Reduce the vector (dx, dy) by the gcd of |dx| and |dy| and normalise the sign.", "For each anchor, count directions in a hash map; the best line through that anchor has (largest count + 1) points.",
    ],
    optimalMd: "For each anchor point i, build a hash map from normalised direction to count over the points j > i (earlier pairs were already handled by earlier anchors). The direction (dx, dy) is divided by gcd(|dx|, |dy|) and its sign is normalised so that dx > 0, or dx == 0 and dy > 0. The largest count for the anchor plus one (the anchor) is the best line through it. Use integers instead of slopes to avoid floating-point equality errors and the vertical-line special case.",
    code: [
      cpp(`
int maxPoints(vector<vector<int>>& pts) {
    int n = pts.size();
    if (n <= 2) return n;
    int best = 2;
    for (int i = 0; i < n; ++i) {
        map<pair<int, int>, int> dir;                          // reduced direction -> number of points that way
        int local = 0;
        for (int j = i + 1; j < n; ++j) {
            int dx = pts[j][0] - pts[i][0], dy = pts[j][1] - pts[i][1];
            int g = __gcd(abs(dx), abs(dy));                   // points are distinct, so g > 0
            dx /= g; dy /= g;
            if (dx < 0 || (dx == 0 && dy < 0)) { dx = -dx; dy = -dy; }   // one representative per line
            local = max(local, ++dir[{dx, dy}]);
        }
        best = max(best, local + 1);                           // plus the anchor itself
    }
    return best;
}`, 'C++'),
      java(`
public int maxPoints(int[][] pts) {
    int n = pts.length;
    if (n <= 2) return n;
    int best = 2;
    for (int i = 0; i < n; i++) {
        Map<Long, Integer> dir = new HashMap<>();                   // reduced direction -> number of points that way
        int local = 0;
        for (int j = i + 1; j < n; j++) {
            int dx = pts[j][0] - pts[i][0], dy = pts[j][1] - pts[i][1];
            int g = gcd(Math.abs(dx), Math.abs(dy));                // points are distinct, so g > 0
            dx /= g; dy /= g;
            if (dx < 0 || (dx == 0 && dy < 0)) { dx = -dx; dy = -dy; }   // one representative per line
            long key = dx * 100_003L + dy;
            int c = dir.merge(key, 1, Integer::sum);
            local = Math.max(local, c);
        }
        best = Math.max(best, local + 1);                           // plus the anchor itself
    }
    return best;
}

private int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }`, 'Java'),
    ],
    finalComplexity: "O(n² log n) time with a tree map (O(n²) expected with a hash map), O(n) space.",
    testCases: [
      { input: "[[1,1],[2,2],[3,3]]", expected: "3", why: "All collinear" },
      { input: "[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]", expected: "4", why: "Best line has four points" },
      { input: "[[0,0],[0,5],[0,9],[3,3]]", expected: "3", why: "Vertical line" },
      { input: "[[0,0]]", expected: "1", why: "Single point" },
    ],
    takeawaysMd: "Represent a line through an anchor by a reduced integer direction, not a floating-point slope. Fixing an anchor turns a three-point condition into a counting problem.",
  },

  "move-zeroes": {
    understandMd: "Move every 0 in an array to the end while keeping the relative order of the non-zero elements. Do it in place, without making a copy of the array.",
    ioConstraintsMd: "Input: an integer array of length 1 to 10,000. Output: the array rearranged in place (nothing is returned).",
    edgeCases: ["No zeros", "All zeros", "Zeros already at the end", "Single element", "Zero at the very start"],
    bruteForceMd: "Copy the non-zero elements into a new array, then pad with zeros and copy back.",
    bruteComplexity: "O(n) time and O(n) extra space.",
    bottleneckMd: "The copy is only there to avoid overwriting data. Two pointers over the same array can do the same job: one scans, one marks where the next non-zero belongs.",
    hints: [
      "Which elements do you need to preserve the order of?", "Keep a position w where the next non-zero element should go.", "Scan with r. When nums[r] is non-zero, put it at position w.", "Swapping nums[w] and nums[r] (instead of copying) leaves the zeros behind automatically and touches each element once.",
    ],
    optimalMd: "Maintain a write index w, the boundary between the finished non-zero prefix and the rest. For each r from left to right, if nums[r] != 0 swap nums[w] with nums[r] and advance w. Everything before w is non-zero in the original order; everything between w and r is zero. Swapping when w == r is harmless.",
    code: [
      cpp(`
void moveZeroes(vector<int>& nums) {
    int w = 0;                                       // next slot for a non-zero value
    for (size_t r = 0; r < nums.size(); ++r) {
        if (nums[r] != 0) swap(nums[w++], nums[r]);
    }
}`, 'C++'),
      java(`
public void moveZeroes(int[] nums) {
    int w = 0;                                       // next slot for a non-zero value
    for (int r = 0; r < nums.length; r++) {
        if (nums[r] != 0) { int t = nums[w]; nums[w++] = nums[r]; nums[r] = t; }
    }
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space, one pass.",
    testCases: [
      { input: "[0,1,0,3,12]", expected: "[1,3,12,0,0]", why: "Typical" },
      { input: "[0]", expected: "[0]", why: "Single zero" },
      { input: "[1,2,3]", expected: "[1,2,3]", why: "No zeros" },
      { input: "[0,0,5]", expected: "[5,0,0]", why: "Leading zeros" },
    ],
    takeawaysMd: "Partition in place with a write pointer: everything before w is finished, everything from w to r is the \"skipped\" kind. Swapping instead of copying keeps both kinds.",
  },

  "is-subsequence": {
    understandMd: "Decide whether string s is a subsequence of string t: s can be obtained from t by deleting zero or more characters without reordering the rest.",
    ioConstraintsMd: "Input: strings s (length 0 to 100) and t (length 0 to 10,000). Output: true or false.",
    edgeCases: ["Empty s (always true)", "s longer than t (false)", "Both empty", "s equals t", "Characters of s present in t but in the wrong order"],
    bruteForceMd: "Generate every subsequence of t and compare it with s.",
    bruteComplexity: "O(2^|t|) time.",
    bottleneckMd: "Matching greedily is enough: taking the earliest possible occurrence of each character of s never prevents a later match.",
    hints: [
      "Do you need to try different ways of matching, or is one pass enough?", "Walk through t once and keep a pointer into s for the next character you still need.", "When the current character of t equals s[i], advance i.", "After the scan, s is a subsequence exactly when i has reached the end of s.",
    ],
    optimalMd: "Two pointers. Scan t from left to right; whenever t[j] equals s[i], increment i. Taking the earliest match is always safe because any later match would leave fewer characters of t for the rest of s. s is a subsequence of t exactly when i == |s| at the end. For many queries against the same t, precompute next-occurrence tables or use binary search over per-letter position lists.",
    code: [
      cpp(`
bool isSubsequence(string s, string t) {
    size_t i = 0;                                    // next character of s that still needs a match
    for (char c : t) {
        if (i < s.size() && s[i] == c) ++i;
    }
    return i == s.size();
}`, 'C++'),
      java(`
public boolean isSubsequence(String s, String t) {
    int i = 0;                                       // next character of s that still needs a match
    for (int j = 0; j < t.length() && i < s.length(); j++) {
        if (s.charAt(i) == t.charAt(j)) i++;
    }
    return i == s.length();
}`, 'Java'),
    ],
    finalComplexity: "O(|t|) time, O(1) space.",
    testCases: [
      { input: "s = \"abc\", t = \"ahbgdc\"", expected: "true", why: "Characters appear in order with gaps" },
      { input: "s = \"axc\", t = \"ahbgdc\"", expected: "false", why: "x is missing" },
      { input: "s = \"\", t = \"abc\"", expected: "true", why: "Empty is a subsequence of anything" },
      { input: "s = \"ba\", t = \"ab\"", expected: "false", why: "Right letters, wrong order" },
    ],
    takeawaysMd: "Greedy earliest matching works for subsequence tests: each character of the pattern needs only the first occurrence after the previous match. A single forward scan with a pattern pointer is the template.",
  },

  "kids-with-the-greatest-number-of-candies": {
    understandMd: "Each kid has some candies and you have extraCandies to give to exactly one kid. For every kid, report whether giving them all the extra candies would leave them with at least as many candies as any other kid.",
    ioConstraintsMd: "Input: an array of 2 to 100 candy counts and an extra count. Output: an array of booleans, one per kid.",
    edgeCases: ["Several kids tied for the maximum", "extraCandies = 0 (only current maximum holders are true)", "Extra candies large enough to make everyone true", "Two kids"],
    bruteForceMd: "For every kid add the extra candies and compare with every other kid.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "The comparison against \"every other kid\" is really a comparison against the maximum, which can be computed once.",
    hints: [
      "What single number does a kid have to reach or beat?", "Find the current maximum once.", "A kid can reach the top exactly when candies[i] + extra >= max.", "Compare against the original maximum, not a changing one: only one kid receives the extras.",
    ],
    optimalMd: "Compute the maximum candy count once. Kid i qualifies exactly when candies[i] + extraCandies >= max, because the extras go only to this kid and every other kid keeps their original count (which is at most max). One pass for the maximum and one pass for the answers.",
    code: [
      cpp(`
vector<bool> kidsWithCandies(vector<int>& candies, int extraCandies) {
    int top = *max_element(candies.begin(), candies.end());
    vector<bool> ans;
    for (int c : candies) ans.push_back(c + extraCandies >= top);   // would this kid reach the maximum?
    return ans;
}`, 'C++'),
      java(`
public List<Boolean> kidsWithCandies(int[] candies, int extraCandies) {
    int top = 0;
    for (int c : candies) top = Math.max(top, c);
    List<Boolean> ans = new ArrayList<>();
    for (int c : candies) ans.add(c + extraCandies >= top);         // would this kid reach the maximum?
    return ans;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) extra space besides the output.",
    testCases: [
      { input: "[2,3,5,1,3], extra = 3", expected: "[true,true,true,false,true]", why: "Kid with 1 candy cannot reach 5" },
      { input: "[4,2,1,1,2], extra = 1", expected: "[true,false,false,false,false]", why: "Small extra" },
      { input: "[12,1,12], extra = 10", expected: "[true,false,true]", why: "Ties for the maximum" },
      { input: "[5,5], extra = 0", expected: "[true,true]", why: "No extras, both already at the maximum" },
    ],
    takeawaysMd: "Replace \"compare with everyone else\" by \"compare with the maximum\". Precompute an aggregate once and each element needs only O(1) work.",
  },

  "can-place-flowers": {
    understandMd: "A flowerbed is an array of 0 (empty) and 1 (planted). Flowers cannot be planted in adjacent plots. Decide whether n new flowers can be planted without breaking that rule.",
    ioConstraintsMd: "Input: a 0/1 array of length 1 to 20,000 (already valid, with no adjacent 1s) and an integer n ≥ 0. Output: true or false.",
    edgeCases: ["n = 0 (always true)", "Single plot", "Empty plot at either end of the bed", "Alternating beds such as 1,0,1,0,1", "Long run of empty plots"],
    bruteForceMd: "Try every way to plant n flowers (backtracking) and check validity.",
    bruteComplexity: "Exponential time.",
    bottleneckMd: "Planting in the leftmost possible empty plot never hurts: it leaves the most room on the right. A single greedy scan therefore counts the maximum number of flowers that fit.",
    hints: [
      "Is it ever better to skip a plot where you can legally plant?", "Planting as early as possible leaves the most space for the rest. Scan from left to right.", "A plot i is plantable if it is empty and both neighbours are empty (or out of range).", "Count placements and stop early once you have placed n.",
    ],
    optimalMd: "Scan left to right. Plant at plot i whenever plot i is 0 and the plots on both sides are 0 or outside the bed; mark it as 1 so the next plot sees it, and decrement the remaining count. Return true as soon as the remaining count reaches 0. Greedy is optimal by an exchange argument: if some optimal solution skips a plantable leftmost plot, moving its first flower there keeps it valid.",
    code: [
      cpp(`
bool canPlaceFlowers(vector<int>& flowerbed, int n) {
    int len = flowerbed.size();
    for (int i = 0; i < len && n > 0; ++i) {
        bool leftFree = (i == 0) || flowerbed[i - 1] == 0;
        bool rightFree = (i == len - 1) || flowerbed[i + 1] == 0;
        if (flowerbed[i] == 0 && leftFree && rightFree) {
            flowerbed[i] = 1;                         // plant as far left as possible
            --n;
        }
    }
    return n <= 0;
}`, 'C++'),
      java(`
public boolean canPlaceFlowers(int[] flowerbed, int n) {
    int len = flowerbed.length;
    for (int i = 0; i < len && n > 0; i++) {
        boolean leftFree = (i == 0) || flowerbed[i - 1] == 0;
        boolean rightFree = (i == len - 1) || flowerbed[i + 1] == 0;
        if (flowerbed[i] == 0 && leftFree && rightFree) {
            flowerbed[i] = 1;                         // plant as far left as possible
            n--;
        }
    }
    return n <= 0;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) extra space (the input array is modified; copy it if that is not acceptable).",
    testCases: [
      { input: "[1,0,0,0,1], n = 1", expected: "true", why: "Plant in the middle" },
      { input: "[1,0,0,0,1], n = 2", expected: "false", why: "Only one plot is legal" },
      { input: "[0], n = 1", expected: "true", why: "Single empty plot" },
      { input: "[0,0,0,0,0], n = 3", expected: "true", why: "Plant at 0, 2, 4" },
    ],
    takeawaysMd: "When a placement rule only forbids neighbours, take the leftmost legal spot: it never reduces what fits to its right. Greedy plus an exchange argument is the standard justification.",
  },

  "reverse-vowels-of-a-string": {
    understandMd: "Reverse only the vowels (a, e, i, o, u in either case) of a string and leave every other character in its place.",
    ioConstraintsMd: "Input: a string of up to 300,000 printable ASCII characters. Output: the string with its vowels reversed.",
    edgeCases: ["No vowels", "A single vowel", "Mixed upper and lower case vowels", "Vowels adjacent to each other", "Empty string"],
    bruteForceMd: "Collect the vowels into a list, reverse the list, then walk through the string and substitute vowels from the reversed list.",
    bruteComplexity: "O(n) time, O(n) extra space.",
    bottleneckMd: "The extra list is not necessary: swapping the first and last vowels, then the next pair inward, achieves the same result in place.",
    hints: [
      "Which two vowels end up swapped with each other?", "The first vowel and the last vowel, then the second and second-to-last, and so on.", "Use a left and a right pointer; move each to the next vowel in its direction.", "When both point at vowels swap them and move both inward; stop when they meet.",
    ],
    optimalMd: "Use two pointers l and r. Advance l while it is not on a vowel and retreat r while it is not on a vowel. If l < r, swap the two characters and move both inward. Repeat until the pointers cross. Treat upper-case vowels as vowels too.",
    code: [
      cpp(`
string reverseVowels(string s) {
    auto isVowel = [](char c) { return string("aeiouAEIOU").find(c) != string::npos; };
    int l = 0, r = (int)s.size() - 1;
    while (l < r) {
        while (l < r && !isVowel(s[l])) ++l;         // next vowel from the left
        while (l < r && !isVowel(s[r])) --r;         // next vowel from the right
        if (l < r) swap(s[l++], s[r--]);
    }
    return s;
}`, 'C++'),
      java(`
public String reverseVowels(String s) {
    char[] a = s.toCharArray();
    int l = 0, r = a.length - 1;
    while (l < r) {
        while (l < r && !isVowel(a[l])) l++;         // next vowel from the left
        while (l < r && !isVowel(a[r])) r--;         // next vowel from the right
        if (l < r) { char t = a[l]; a[l++] = a[r]; a[r--] = t; }
    }
    return new String(a);
}

private boolean isVowel(char c) { return "aeiouAEIOU".indexOf(c) >= 0; }`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) extra space in C++ (O(n) in Java for the character array).",
    testCases: [
      { input: "\"hello\"", expected: "\"holle\"", why: "Two vowels swap" },
      { input: "\"leetcode\"", expected: "\"leotcede\"", why: "Four vowels reverse in order" },
      { input: "\"bcd\"", expected: "\"bcd\"", why: "No vowels" },
      { input: "\"aA\"", expected: "\"Aa\"", why: "Case is preserved per character" },
    ],
    takeawaysMd: "Two pointers that each skip \"uninteresting\" characters let you reverse a subsequence in place. Remember that vowels come in both cases.",
  },

  "string-compression": {
    understandMd: "Compress an array of characters in place: replace each run of repeated characters with the character followed by the run length (omit the length when it is 1; lengths of 10 or more are written digit by digit). Return the new length of the array.",
    ioConstraintsMd: "Input: a character array of length 1 to 2,000. Output: the compressed length, with the compressed form stored in the start of the array. Extra space must be O(1).",
    edgeCases: ["A single character", "A run of length 1 (no count written)", "A run of 10 or more (multi-digit count)", "All characters different", "One long run of the same character"],
    bruteForceMd: "Build the compressed string in a new buffer and copy it back to the array.",
    bruteComplexity: "O(n) time, O(n) extra space.",
    bottleneckMd: "The compressed form is never longer than the original, so the write position never overtakes the read position and you can compress in place.",
    hints: [
      "Why can you safely write the output over the input as you go?", "Use a read index to find the end of the current run and a write index for the output.", "Write the character, then the count only when it is greater than 1.", "A count such as 12 must be written as two characters. Convert it to a string and copy its digits.",
    ],
    optimalMd: "Keep a read index i and a write index w. For each run starting at i, find its end j. Write chars[i] at w, then, if the run length is greater than 1, write each digit of the length. Move i to j. Because a run of length L is replaced by at most 1 + digits(L) ≤ L characters (for L ≥ 2), the write index never passes the read index. The final w is the new length.",
    code: [
      cpp(`
int compress(vector<char>& chars) {
    int n = chars.size(), w = 0;
    for (int i = 0; i < n; ) {
        int j = i;
        while (j < n && chars[j] == chars[i]) ++j;         // [i, j) is one run
        chars[w++] = chars[i];
        if (j - i > 1)
            for (char d : to_string(j - i)) chars[w++] = d;   // multi-digit counts are written digit by digit
        i = j;
    }
    return w;
}`, 'C++'),
      java(`
public int compress(char[] chars) {
    int n = chars.length, w = 0;
    for (int i = 0; i < n; ) {
        int j = i;
        while (j < n && chars[j] == chars[i]) j++;         // [i, j) is one run
        chars[w++] = chars[i];
        if (j - i > 1)
            for (char d : Integer.toString(j - i).toCharArray()) chars[w++] = d;   // multi-digit counts, digit by digit
        i = j;
    }
    return w;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) extra space.",
    testCases: [
      { input: "[\"a\",\"a\",\"b\",\"b\",\"c\",\"c\",\"c\"]", expected: "6, array starts \"a2b2c3\"", why: "Several runs" },
      { input: "[\"a\"]", expected: "1, \"a\"", why: "A run of one writes no count" },
      { input: "[\"a\",\"b\",\"b\",…12 b's in total]", expected: "4, \"ab12\"", why: "Two-digit count" },
      { input: "[\"a\",\"b\",\"c\"]", expected: "3, \"abc\"", why: "No compression possible" },
    ],
    takeawaysMd: "In-place rewriting is safe when the output can never outrun the input. Prove that bound (here, a run of L ≥ 2 shrinks to at most 1 + digits(L) ≤ L) before relying on it.",
  },

  "increasing-triplet-subsequence": {
    understandMd: "Decide whether the array contains three indices i < j < k with nums[i] < nums[j] < nums[k].",
    ioConstraintsMd: "Input: an integer array of length 1 to 500,000. Output: true if such a triplet exists. Aim for O(n) time and O(1) space.",
    edgeCases: ["Fewer than three elements", "Strictly decreasing array", "Equal values (not strictly increasing)", "The triplet is not contiguous", "The smallest value appears after the middle one (a new minimum that does not break an older candidate pair)"],
    bruteForceMd: "Try every triple of indices.",
    bruteComplexity: "O(n³) time.",
    bottleneckMd: "You do not need the whole triplet, only the best way to extend it. Keep the smallest possible first element and the smallest possible second element of an increasing pair; the third element just has to beat the second.",
    hints: [
      "If you could track the best partial progress so far, what would it be?", "Keep the smallest value seen (first) and the smallest value that has a smaller one before it (second).", "For each x: if x ≤ first update first; else if x ≤ second update second.", "If x is greater than both, an increasing triplet exists. Note that first may later be replaced while second stays valid.",
    ],
    optimalMd: "Maintain first = smallest value seen so far and second = smallest second element of any increasing pair seen so far (both initially infinity). For each x: if x ≤ first, set first = x; else if x ≤ second, set second = x; otherwise x > second, which means some earlier value smaller than second precedes it, so a triplet exists. When first is replaced by a smaller value after second was set, second still certifies that a pair existed earlier, so the answer remains correct.",
    code: [
      cpp(`
bool increasingTriplet(vector<int>& nums) {
    long long first = LLONG_MAX, second = LLONG_MAX;     // best (smallest) ends of increasing runs of length 1 and 2
    for (int x : nums) {
        if (x <= first) first = x;                       // a smaller start
        else if (x <= second) second = x;                // a smaller end for a pair
        else return true;                                // x beats a pair
    }
    return false;
}`, 'C++'),
      java(`
public boolean increasingTriplet(int[] nums) {
    long first = Long.MAX_VALUE, second = Long.MAX_VALUE;   // best (smallest) ends of increasing runs of length 1 and 2
    for (int x : nums) {
        if (x <= first) first = x;                          // a smaller start
        else if (x <= second) second = x;                   // a smaller end for a pair
        else return true;                                   // x beats a pair
    }
    return false;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,2,3,4,5]", expected: "true", why: "Obvious" },
      { input: "[5,4,3,2,1]", expected: "false", why: "Decreasing" },
      { input: "[2,1,5,0,4,6]", expected: "true", why: "2, 4, 6 although a smaller start (0) appears later" },
      { input: "[20,100,10,12,5,13]", expected: "true", why: "10, 12, 13" },
    ],
    takeawaysMd: "Longest-increasing-subsequence thinking with tiny state: keep the smallest tail for each length up to 3. Replacing an earlier, larger tail by a smaller one never invalidates what has already been found.",
  },

  "greatest-common-divisor-of-strings": {
    understandMd: "A string t divides a string s if s is t repeated one or more times. Given two strings, return the longest string that divides both, or the empty string if none does.",
    ioConstraintsMd: "Input: two non-empty strings of up to 1,000 uppercase letters. Output: the largest common divisor string.",
    edgeCases: ["No common divisor", "One string is a repeat of the other", "Both strings equal", "Strings built from the same unit but with lengths that are not multiples of one another", "Single-character strings"],
    bruteForceMd: "Try every prefix of the shorter string, longest first, and test whether it divides both strings.",
    bruteComplexity: "O(min(n, m) · (n + m)) time.",
    bottleneckMd: "A divisor can only have a length that divides both lengths, and in fact the best candidate has length gcd(n, m). A quick test tells whether any common divisor exists at all.",
    hints: [
      "If a common divisor string exists, what do s + t and t + s look like?", "Both are built from repeats of the same unit, so s + t equals t + s. Is the converse true?", "If s + t != t + s no common divisor exists. Otherwise, how long is the longest unit?", "Its length is gcd(|s|, |t|); return that prefix of s.",
    ],
    optimalMd: "If s + t != t + s, the strings are not powers of a common unit, so return \"\". Otherwise the answer is the prefix of s whose length is gcd(|s|, |t|). The concatenation test works because both strings are repeats of a common unit u exactly when they commute under concatenation, and the longest such unit has length equal to the gcd of the two lengths.",
    code: [
      cpp(`
string gcdOfStrings(string str1, string str2) {
    if (str1 + str2 != str2 + str1) return "";           // not powers of one common unit
    return str1.substr(0, __gcd(str1.size(), str2.size()));
}`, 'C++'),
      java(`
public String gcdOfStrings(String str1, String str2) {
    if (!(str1 + str2).equals(str2 + str1)) return "";   // not powers of one common unit
    return str1.substring(0, gcd(str1.length(), str2.length()));
}

private int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }`, 'Java'),
    ],
    finalComplexity: "O(n + m) time, O(n + m) space for the concatenations.",
    testCases: [
      { input: "\"ABCABC\", \"ABC\"", expected: "\"ABC\"", why: "One is a repeat of the other" },
      { input: "\"ABABAB\", \"ABAB\"", expected: "\"AB\"", why: "Common unit shorter than both" },
      { input: "\"LEET\", \"CODE\"", expected: "\"\"", why: "No common unit" },
      { input: "\"AB\", \"BA\"", expected: "\"\"", why: "Same letters, concatenation does not commute" },
    ],
    takeawaysMd: "Strings that are powers of a common word commute under concatenation. This turns a search over prefixes into one comparison plus a gcd of the lengths.",
  },

  "merge-strings-alternately": {
    understandMd: "Merge two strings by taking characters alternately, starting with the first string. When one string runs out, append the rest of the other.",
    ioConstraintsMd: "Input: two strings of 1 to 100 lowercase letters. Output: the merged string.",
    edgeCases: ["Equal lengths", "First string longer", "Second string longer", "Single-character strings"],
    bruteForceMd: "There is no simpler method: walk both strings with an index.",
    bruteComplexity: "O(n + m) time and O(n + m) space for the output.",
    bottleneckMd: "Nothing is slow here. The only care needed is to stop reading a string at its end and to append the tail of the longer one.",
    hints: [
      "What happens at position i when both strings have a character?", "Take word1[i] then word2[i].", "What if one string is shorter?", "Loop while either index is in range, adding a character only from strings that still have one.",
    ],
    optimalMd: "For i from 0 to max(|a|, |b|) − 1, append a[i] if i < |a|, then append b[i] if i < |b|. This produces the alternating prefix and then the remaining tail of the longer string automatically.",
    code: [
      cpp(`
string mergeAlternately(string word1, string word2) {
    string out;
    for (size_t i = 0; i < word1.size() || i < word2.size(); ++i) {
        if (i < word1.size()) out += word1[i];
        if (i < word2.size()) out += word2[i];
    }
    return out;
}`, 'C++'),
      java(`
public String mergeAlternately(String word1, String word2) {
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < word1.length() || i < word2.length(); i++) {
        if (i < word1.length()) out.append(word1.charAt(i));
        if (i < word2.length()) out.append(word2.charAt(i));
    }
    return out.toString();
}`, 'Java'),
    ],
    finalComplexity: "O(n + m) time, O(n + m) space.",
    testCases: [
      { input: "\"abc\", \"pqr\"", expected: "\"apbqcr\"", why: "Equal lengths" },
      { input: "\"ab\", \"pqrs\"", expected: "\"apbqrs\"", why: "Second is longer" },
      { input: "\"abcd\", \"pq\"", expected: "\"apbqcd\"", why: "First is longer" },
      { input: "\"a\", \"b\"", expected: "\"ab\"", why: "Minimal" },
    ],
    takeawaysMd: "Looping to the maximum length with per-string bounds checks handles unequal lengths without separate tail code.",
  },

  "find-pivot-index": {
    understandMd: "Find the leftmost index where the sum of all elements strictly to its left equals the sum of all elements strictly to its right. An empty side counts as a sum of 0. Return -1 if there is no such index.",
    ioConstraintsMd: "Input: an integer array of length 1 to 10,000 (values may be negative). Output: the pivot index or -1.",
    edgeCases: ["Pivot at index 0 (left sum is 0)", "Pivot at the last index", "Negative numbers", "No pivot", "Several pivots (return the leftmost)"],
    bruteForceMd: "For every index compute the left sum and the right sum with two inner loops.",
    bruteComplexity: "O(n²) time, O(1) space.",
    bottleneckMd: "Both sums are recomputed from scratch for every index. The left sum can be maintained as a running total, and the right sum follows from the total.",
    hints: [
      "Can the right sum be derived from the left sum and something computed once?", "Compute the total of the whole array first.", "At index i, right = total − left − nums[i].", "Scan once, keeping left as a running sum; return i when left == total − left − nums[i].",
    ],
    optimalMd: "Compute the total sum. Scan left to right keeping left, the sum of elements before i. The right sum is total − left − nums[i]. If left equals it, i is a pivot; return the first one. Otherwise add nums[i] to left and continue. Two passes, constant extra space.",
    code: [
      cpp(`
int pivotIndex(vector<int>& nums) {
    int total = accumulate(nums.begin(), nums.end(), 0), left = 0;
    for (size_t i = 0; i < nums.size(); ++i) {
        if (left == total - left - nums[i]) return i;     // left sum equals right sum
        left += nums[i];
    }
    return -1;
}`, 'C++'),
      java(`
public int pivotIndex(int[] nums) {
    int total = 0;
    for (int x : nums) total += x;
    int left = 0;
    for (int i = 0; i < nums.length; i++) {
        if (left == total - left - nums[i]) return i;     // left sum equals right sum
        left += nums[i];
    }
    return -1;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,7,3,6,5,6]", expected: "3", why: "Left 11, right 11" },
      { input: "[1,2,3]", expected: "-1", why: "No balance point" },
      { input: "[2,1,-1]", expected: "0", why: "Left side is empty (sum 0)" },
      { input: "[-1,-1,0,1,1,0]", expected: "5", why: "Leftmost pivot with negatives, right side empty" },
    ],
    takeawaysMd: "Left sum plus the element plus the right sum equals the total, so the right sum never needs its own loop. Running totals plus one precomputed aggregate replace nested loops.",
  },

  "find-the-highest-altitude": {
    understandMd: "A biker starts at altitude 0. The array gives the net altitude change between consecutive points. Return the highest altitude reached at any point.",
    ioConstraintsMd: "Input: an array of n integers (n up to 100) giving the gain between point i and point i + 1. Output: the maximum altitude over all n + 1 points.",
    edgeCases: ["All gains negative (answer 0, the start)", "All gains positive", "Gains that return to zero", "Single gain"],
    bruteForceMd: "Build the full array of altitudes (prefix sums) and take its maximum.",
    bruteComplexity: "O(n) time, O(n) space.",
    bottleneckMd: "The altitude array is not needed: only the running altitude and the maximum seen so far matter.",
    hints: [
      "What is the altitude after the first leg?", "The altitude after leg i is the sum of the first i gains.", "Do you need to store every altitude or only the best?", "Keep a running sum and a running maximum, starting both at 0 (the starting point counts).",
    ],
    optimalMd: "Walk through the gains, adding each to a running altitude and updating the best altitude. Initialise the best to 0 because the start itself is a valid point. A single pass with constant memory.",
    code: [
      cpp(`
int largestAltitude(vector<int>& gain) {
    int altitude = 0, best = 0;                       // the starting point has altitude 0
    for (int g : gain) {
        altitude += g;
        best = max(best, altitude);
    }
    return best;
}`, 'C++'),
      java(`
public int largestAltitude(int[] gain) {
    int altitude = 0, best = 0;                       // the starting point has altitude 0
    for (int g : gain) {
        altitude += g;
        best = Math.max(best, altitude);
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[-5,1,5,0,-7]", expected: "1", why: "Altitudes 0,-5,-4,1,1,-6" },
      { input: "[-4,-3,-2,-1,4,3,2]", expected: "0", why: "Never above the start" },
      { input: "[1,2,3]", expected: "6", why: "Always climbing" },
      { input: "[-1]", expected: "0", why: "Start is the maximum" },
    ],
    takeawaysMd: "Prefix sums often need only a running value. Remember to include the initial state (the empty prefix) as a candidate.",
  },

  "maximum-average-subarray-i": {
    understandMd: "Find the contiguous subarray of exactly k elements that has the largest average, and return that average.",
    ioConstraintsMd: "Input: an integer array of length n (1 to 100,000, values between −10,000 and 10,000) and k with 1 ≤ k ≤ n. Output: the maximum average as a floating-point number.",
    edgeCases: ["k = n (the whole array)", "k = 1 (the maximum element)", "All values negative", "Large sums (use a 64-bit sum to be safe)"],
    bruteForceMd: "Compute the sum of every window of length k from scratch and keep the largest.",
    bruteComplexity: "O(n · k) time.",
    bottleneckMd: "Neighbouring windows share k − 1 elements, so recomputing every sum repeats nearly all the additions.",
    hints: [
      "Maximising the average of a fixed-length window is the same as maximising what?", "The sum. How does the sum change when the window slides by one position?", "Subtract the element that leaves, add the element that enters.", "Track the best sum and divide by k only once at the end.",
    ],
    optimalMd: "A fixed-size sliding window. Compute the sum of the first k elements, then slide: add nums[i] and subtract nums[i − k], keeping the maximum sum. Divide the best sum by k at the end. Using integer sums avoids accumulating floating-point error.",
    code: [
      cpp(`
double findMaxAverage(vector<int>& nums, int k) {
    long long window = 0;
    for (int i = 0; i < k; ++i) window += nums[i];
    long long best = window;
    for (size_t i = k; i < nums.size(); ++i) {
        window += nums[i] - nums[i - k];                 // slide: add the entering, drop the leaving
        best = max(best, window);
    }
    return (double)best / k;
}`, 'C++'),
      java(`
public double findMaxAverage(int[] nums, int k) {
    long window = 0;
    for (int i = 0; i < k; i++) window += nums[i];
    long best = window;
    for (int i = k; i < nums.length; i++) {
        window += nums[i] - nums[i - k];                 // slide: add the entering, drop the leaving
        best = Math.max(best, window);
    }
    return (double) best / k;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,12,-5,-6,50,3], k = 4", expected: "12.75", why: "Window [12,-5,-6,50]" },
      { input: "[5], k = 1", expected: "5.0", why: "Single element" },
      { input: "[-1,-2,-3], k = 2", expected: "-1.5", why: "All negative" },
      { input: "[0,4,0,3,2], k = 1", expected: "4.0", why: "k = 1 is the maximum" },
    ],
    takeawaysMd: "For a fixed window length, the maximum average is the maximum sum. Slide by adding the entering element and subtracting the leaving one; divide once at the end.",
  },

  "maximum-number-of-vowels-in-a-substring-of-given-length": {
    understandMd: "Return the maximum number of vowels (a, e, i, o, u) in any substring of s that has length exactly k.",
    ioConstraintsMd: "Input: a lowercase string of length up to 100,000 and an integer k with 1 ≤ k ≤ |s|. Output: the maximum vowel count over all windows of length k.",
    edgeCases: ["k equals the string length", "k = 1", "No vowels in the string", "All characters are vowels", "Vowels clustered at the end"],
    bruteForceMd: "For every window count the vowels from scratch.",
    bruteComplexity: "O(n · k) time.",
    bottleneckMd: "Consecutive windows overlap in k − 1 characters, so the count can be updated by looking only at the character entering and the one leaving.",
    hints: [
      "How does the vowel count change when the window moves one step right?", "Only two characters change: one enters and one leaves.", "Count vowels in the first window, then update the count in O(1) per step.", "Track the maximum seen; you can stop early if it reaches k.",
    ],
    optimalMd: "Fixed-size sliding window. Count the vowels in the first k characters, then for each next position add 1 if the entering character is a vowel and subtract 1 if the leaving character is a vowel. Keep the maximum. The count is updated in constant time per step.",
    code: [
      cpp(`
int maxVowels(string s, int k) {
    auto vowel = [](char c) { return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; };
    int cnt = 0, best = 0;
    for (int i = 0; i < (int)s.size(); ++i) {
        cnt += vowel(s[i]);                               // character entering the window
        if (i >= k) cnt -= vowel(s[i - k]);               // character leaving the window
        if (i >= k - 1) best = max(best, cnt);
    }
    return best;
}`, 'C++'),
      java(`
public int maxVowels(String s, int k) {
    int cnt = 0, best = 0;
    for (int i = 0; i < s.length(); i++) {
        if (isVowel(s.charAt(i))) cnt++;                  // character entering the window
        if (i >= k && isVowel(s.charAt(i - k))) cnt--;    // character leaving the window
        if (i >= k - 1) best = Math.max(best, cnt);
    }
    return best;
}

private boolean isVowel(char c) { return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'; }`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "\"abciiidef\", k = 3", expected: "3", why: "Window \"iii\"" },
      { input: "\"aeiou\", k = 2", expected: "2", why: "Any window is all vowels" },
      { input: "\"leetcode\", k = 3", expected: "2", why: "Windows \"lee\" or \"ode\"" },
      { input: "\"rhythm\", k = 2", expected: "0", why: "No vowels" },
    ],
    takeawaysMd: "A fixed window with a countable property is the simplest sliding-window shape: add the entering element, remove the leaving one, record the best.",
  },

  "max-consecutive-ones-iii": {
    understandMd: "Given a binary array and an integer k, return the length of the longest contiguous subarray that contains only 1s after flipping at most k zeros to ones.",
    ioConstraintsMd: "Input: a 0/1 array of length up to 100,000 and k with 0 ≤ k ≤ n. Output: the maximum length.",
    edgeCases: ["k = 0 (longest existing run of ones)", "k at least the number of zeros (the whole array)", "All zeros", "All ones", "Single element"],
    bruteForceMd: "For every start index extend the end while the number of zeros in the range stays within k.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "The brute force restarts the scan at each start. When the zero budget is exceeded you only need to move the start forward until a zero leaves the window, which is what a sliding window does.",
    hints: [
      "Rephrase it: find the longest subarray with at most k zeros.", "Grow the right end one element at a time and count the zeros in the window.", "What should you do when the count exceeds k?", "Advance the left end (reducing the count when you pass a zero) until the window is valid again, and record the window length each step.",
    ],
    optimalMd: "Variable-size sliding window. Move the right end across the array, incrementing a zero counter when it passes a zero. While the counter exceeds k, move the left end rightwards, decrementing the counter when a zero leaves. The window [left, right] always contains at most k zeros, so its length is a candidate answer; keep the maximum. Each index is added and removed at most once.",
    code: [
      cpp(`
int longestOnes(vector<int>& nums, int k) {
    int left = 0, zeros = 0, best = 0;
    for (int right = 0; right < (int)nums.size(); ++right) {
        if (nums[right] == 0) ++zeros;
        while (zeros > k) {                               // too many flips needed: shrink from the left
            if (nums[left] == 0) --zeros;
            ++left;
        }
        best = max(best, right - left + 1);
    }
    return best;
}`, 'C++'),
      java(`
public int longestOnes(int[] nums, int k) {
    int left = 0, zeros = 0, best = 0;
    for (int right = 0; right < nums.length; right++) {
        if (nums[right] == 0) zeros++;
        while (zeros > k) {                               // too many flips needed: shrink from the left
            if (nums[left] == 0) zeros--;
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,1,1,0,0,0,1,1,1,1,0], k = 2", expected: "6", why: "Flip the two zeros before the run of four ones" },
      { input: "[0,0,0], k = 0", expected: "0", why: "No ones and no flips" },
      { input: "[1,1,1], k = 0", expected: "3", why: "Already all ones" },
      { input: "[0], k = 1", expected: "1", why: "One flip fixes it" },
    ],
    takeawaysMd: "\"Longest range with at most k bad elements\" is the canonical variable sliding window: expand the right end, shrink the left only when the budget is exceeded.",
  },

  "longest-subarray-of-1s-after-deleting-one-element": {
    understandMd: "Given a binary array, you must delete exactly one element. Return the length of the longest non-empty subarray that contains only 1s in the resulting array, or 0 if there is none.",
    ioConstraintsMd: "Input: a 0/1 array of length 1 to 100,000. Output: the length of the longest run of 1s after deleting one element.",
    edgeCases: ["All ones (you must still delete one, so the answer is n − 1)", "All zeros (answer 0)", "Single element", "One zero in the middle (the two runs join)", "A zero at either end"],
    bruteForceMd: "Try deleting each element and scan for the longest run of ones in what remains.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "Deleting one element is like allowing one zero inside a window of ones (the deleted element). The best window with at most one zero, minus the forced deletion, is the answer.",
    hints: [
      "What does a window containing exactly one zero look like after deleting that zero?", "Find the longest window that has at most one zero.", "Because one element must be deleted, subtract 1 from the window length.", "Keep a zero counter and shrink from the left when it goes above one.",
    ],
    optimalMd: "Sliding window with at most one zero. Expand the right end, counting zeros; while there are two zeros, advance the left end (decrementing the count when a zero leaves). The window length minus one (the element that must be deleted, which is the zero if there is one) is a candidate. For an all-ones array the window is the whole array and the answer is n − 1.",
    code: [
      cpp(`
int longestSubarray(vector<int>& nums) {
    int left = 0, zeros = 0, best = 0;
    for (int right = 0; right < (int)nums.size(); ++right) {
        if (nums[right] == 0) ++zeros;
        while (zeros > 1) {                               // at most one zero (the one we delete)
            if (nums[left] == 0) --zeros;
            ++left;
        }
        best = max(best, right - left);                   // window length minus the deleted element
    }
    return best;
}`, 'C++'),
      java(`
public int longestSubarray(int[] nums) {
    int left = 0, zeros = 0, best = 0;
    for (int right = 0; right < nums.length; right++) {
        if (nums[right] == 0) zeros++;
        while (zeros > 1) {                               // at most one zero (the one we delete)
            if (nums[left] == 0) zeros--;
            left++;
        }
        best = Math.max(best, right - left);              // window length minus the deleted element
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,1,0,1]", expected: "3", why: "Delete the zero: 1,1,1" },
      { input: "[0,1,1,1,0,1,1,0,1]", expected: "5", why: "Delete the middle zero to join 1,1 and 1,1,1" },
      { input: "[1,1,1]", expected: "2", why: "You must delete one element" },
      { input: "[0,0,0]", expected: "0", why: "No ones" },
    ],
    takeawaysMd: "Forced deletion of one element equals \"window with at most one zero, minus one\". Reduce deletion problems to a window with a bounded number of bad elements.",
  },

  "max-number-of-k-sum-pairs": {
    understandMd: "In one operation you pick two elements whose sum is k and remove them from the array. Return the maximum number of operations you can perform.",
    ioConstraintsMd: "Input: an integer array of length up to 100,000 and an integer k. Output: the maximum number of disjoint pairs summing to k.",
    edgeCases: ["A value paired with itself (k = 2x) needs two copies", "No valid pair", "Many duplicates", "A single element", "Each element can be used in only one pair"],
    bruteForceMd: "Repeatedly search the array for any pair that sums to k, remove it and repeat.",
    bruteComplexity: "O(n³) time in the worst case.",
    bottleneckMd: "Searching for a partner is O(n). A hash map of counts finds the partner in O(1), and counting prevents reusing an element twice.",
    hints: [
      "For an element x, which value would it pair with?", "k − x. How can you check quickly whether an unused k − x exists?", "Keep a count of unused elements seen so far.", "For each x: if cnt[k − x] > 0, consume one and add an operation; otherwise record x. (Sorting and two pointers is the alternative.)",
    ],
    optimalMd: "Scan the array with a map from value to the number of unused earlier occurrences. For x, look up its complement k − x: if an unused complement exists, use it (decrement its count) and count one operation; otherwise store x for later partners. When x equals k − x the lookup naturally requires a second copy because x has not been stored yet. Greedy pairing is optimal since any element can only pair with its complement.",
    code: [
      cpp(`
int maxOperations(vector<int>& nums, int k) {
    unordered_map<int, int> unused;                       // value -> how many are waiting for a partner
    int ops = 0;
    for (int x : nums) {
        auto it = unused.find(k - x);
        if (it != unused.end() && it->second > 0) { --it->second; ++ops; }   // pair x with a waiting complement
        else ++unused[x];
    }
    return ops;
}`, 'C++'),
      java(`
public int maxOperations(int[] nums, int k) {
    Map<Integer, Integer> unused = new HashMap<>();       // value -> how many are waiting for a partner
    int ops = 0;
    for (int x : nums) {
        int need = k - x;
        if (unused.getOrDefault(need, 0) > 0) { unused.merge(need, -1, Integer::sum); ops++; }   // pair x with a waiting complement
        else unused.merge(x, 1, Integer::sum);
    }
    return ops;
}`, 'Java'),
    ],
    finalComplexity: "O(n) expected time, O(n) space.",
    testCases: [
      { input: "[1,2,3,4], k = 5", expected: "2", why: "Pairs (1,4) and (2,3)" },
      { input: "[3,1,3,4,3], k = 6", expected: "1", why: "Only (3,3) is a pair; 1 and 4 have no partner" },
      { input: "[2,2,2], k = 4", expected: "1", why: "A value pairing with itself needs two copies" },
      { input: "[1], k = 2", expected: "0", why: "Single element" },
    ],
    takeawaysMd: "Pair-counting with a hash map: check the complement before inserting the current element, so an element is never paired with itself.",
  },

  "minimum-size-subarray-sum": {
    understandMd: "Given an array of positive integers and a target, return the minimal length of a contiguous subarray whose sum is at least the target, or 0 if no such subarray exists.",
    ioConstraintsMd: "Input: a target (up to 10^9) and an array of positive integers of length up to 100,000. Output: the minimal length or 0.",
    edgeCases: ["The target is larger than the total sum (answer 0)", "A single element already meets the target", "The whole array is needed", "Target equal to the total sum", "Large values (watch for overflow in sums)"],
    bruteForceMd: "Try every start and extend until the sum reaches the target.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "All numbers are positive, so adding an element only increases the sum and removing one only decreases it. That monotonicity lets the left end move only forwards.",
    hints: [
      "Because every number is positive, what happens to the window sum as you extend or shrink it?", "Grow the window to the right until the sum reaches the target.", "Then try to shrink from the left while the sum stays at least the target, recording the length each time.", "Each element enters and leaves the window once, so the whole scan is linear.",
    ],
    optimalMd: "Variable-size sliding window using positivity. Add elements on the right; whenever the window sum is at least the target, record the length and shrink from the left, subtracting the leaving elements while the sum stays at least the target. If the record never changed, return 0. Each index moves forward only, giving O(n) time. (For arrays with negative numbers this fails and prefix sums with a monotonic structure are needed.)",
    code: [
      cpp(`
int minSubArrayLen(int target, vector<int>& nums) {
    int left = 0, best = INT_MAX;
    long long sum = 0;
    for (int right = 0; right < (int)nums.size(); ++right) {
        sum += nums[right];
        while (sum >= target) {                           // valid window: try to shrink it
            best = min(best, right - left + 1);
            sum -= nums[left++];
        }
    }
    return best == INT_MAX ? 0 : best;
}`, 'C++'),
      java(`
public int minSubArrayLen(int target, int[] nums) {
    int left = 0, best = Integer.MAX_VALUE;
    long sum = 0;
    for (int right = 0; right < nums.length; right++) {
        sum += nums[right];
        while (sum >= target) {                           // valid window: try to shrink it
            best = Math.min(best, right - left + 1);
            sum -= nums[left++];
        }
    }
    return best == Integer.MAX_VALUE ? 0 : best;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "target = 7, [2,3,1,2,4,3]", expected: "2", why: "Subarray [4,3]" },
      { input: "target = 4, [1,4,4]", expected: "1", why: "A single element suffices" },
      { input: "target = 11, [1,1,1,1,1,1,1,1]", expected: "0", why: "Total is only 8" },
      { input: "target = 6, [1,2,3]", expected: "3", why: "Whole array needed" },
    ],
    takeawaysMd: "Positive numbers make window sums monotonic, which is what allows a two-pointer scan. If negatives are allowed, this pattern no longer applies and prefix sums with other structures are needed.",
  },

  "substring-with-concatenation-of-all-words": {
    understandMd: "Given a string s and a list of words that all have the same length, return every starting index in s where a substring is a concatenation of all the words, each exactly once, in any order and with no extra characters between them.",
    ioConstraintsMd: "Input: a string s (up to 10,000 characters) and 1 to 5,000 words of equal length (up to 30). Output: the list of start indices, in any order.",
    edgeCases: ["Words with duplicates (a word may be needed twice)", "No valid substring", "Overlapping valid substrings (consecutive starts)", "The string is shorter than the total length of the words", "A single word"],
    bruteForceMd: "For every start index, cut the next W · L characters into words and compare their multiset with the word list.",
    bruteComplexity: "O(n · W · L) time.",
    bottleneckMd: "Neighbouring starts that are L apart share almost all of their words. A sliding window over word-sized steps (one run per starting offset) reuses the counts instead of rebuilding them.",
    hints: [
      "Because all words have the same length L, in how many different alignments can a match start modulo L?", "For each offset 0..L−1, slide a window across the string in steps of L words.", "Keep a count of words inside the window and compare with the required counts.", "If a word is not in the list reset the window; if a word has too many copies, move the left end until it fits; when the window holds exactly W words record the left index.",
    ],
    optimalMd: "Count the required words in a map. For each offset from 0 to L − 1, run a sliding window over the string in steps of L, treating each L-length slice as one token. Maintain a map of tokens in the window and the number of tokens. A token that is not in the word list resets the window. If a token appears more often than required, advance the left end one word at a time until it does not. When the window holds exactly W tokens (all counts within the required counts), record the left index and then drop the leftmost token to continue. Each token enters and leaves each of the L passes once, so the total is O(n · L).",
    code: [
      cpp(`
vector<int> findSubstring(string s, vector<string>& words) {
    vector<int> res;
    int n = s.size(), W = words.size(), L = words[0].size();
    unordered_map<string, int> need;
    for (auto& w : words) ++need[w];
    for (int off = 0; off < L; ++off) {                      // each alignment of word boundaries
        unordered_map<string, int> seen;
        int left = off, count = 0;
        for (int right = off; right + L <= n; right += L) {
            string w = s.substr(right, L);
            if (!need.count(w)) { seen.clear(); count = 0; left = right + L; continue; }   // not a word: restart after it
            ++seen[w]; ++count;
            while (seen[w] > need[w]) { --seen[s.substr(left, L)]; left += L; --count; }  // too many copies: shrink
            if (count == W) {                                 // exactly all the words
                res.push_back(left);
                --seen[s.substr(left, L)]; left += L; --count;
            }
        }
    }
    return res;
}`, 'C++'),
      java(`
public List<Integer> findSubstring(String s, String[] words) {
    List<Integer> res = new ArrayList<>();
    int n = s.length(), W = words.length, L = words[0].length();
    Map<String, Integer> need = new HashMap<>();
    for (String w : words) need.merge(w, 1, Integer::sum);
    for (int off = 0; off < L; off++) {                      // each alignment of word boundaries
        Map<String, Integer> seen = new HashMap<>();
        int left = off, count = 0;
        for (int right = off; right + L <= n; right += L) {
            String w = s.substring(right, right + L);
            if (!need.containsKey(w)) { seen.clear(); count = 0; left = right + L; continue; }   // not a word: restart after it
            seen.merge(w, 1, Integer::sum); count++;
            while (seen.get(w) > need.get(w)) { seen.merge(s.substring(left, left + L), -1, Integer::sum); left += L; count--; }   // too many copies
            if (count == W) {                                 // exactly all the words
                res.add(left);
                seen.merge(s.substring(left, left + L), -1, Integer::sum); left += L; count--;
            }
        }
    }
    return res;
}`, 'Java'),
    ],
    finalComplexity: "O(n · L) time (L passes, each O(n / L) tokens costing O(L) to slice), O(W · L) space.",
    testCases: [
      { input: "s = \"barfoothefoobarman\", words = [\"foo\",\"bar\"]", expected: "[0, 9]", why: "Two matches" },
      { input: "s = \"wordgoodgoodgoodbestword\", words = [\"word\",\"good\",\"best\",\"word\"]", expected: "[]", why: "Needs two \"word\" tokens next to the others" },
      { input: "s = \"barfoofoobarthefoobarman\", words = [\"bar\",\"foo\",\"the\"]", expected: "[6, 9, 12]", why: "Overlapping matches" },
      { input: "s = \"aaa\", words = [\"a\"]", expected: "[0, 1, 2]", why: "Single word, every position" },
    ],
    takeawaysMd: "When tokens have a fixed length, run one word-step sliding window per alignment. Compare counts incrementally instead of rebuilding a multiset for each start.",
  },

  "contains-duplicate-ii": {
    understandMd: "Decide whether the array has two different indices i and j with nums[i] == nums[j] and |i − j| ≤ k.",
    ioConstraintsMd: "Input: an integer array of length up to 100,000 and an integer k ≥ 0. Output: true or false.",
    edgeCases: ["k = 0 (never true, since the indices must differ)", "Duplicates farther apart than k", "Duplicate exactly k apart", "Three copies of a value (only the closest pair matters)", "No duplicates"],
    bruteForceMd: "Compare every element with the next k elements.",
    bruteComplexity: "O(n · k) time.",
    bottleneckMd: "For each value you only need the index of its most recent occurrence: if the nearest earlier copy is too far away, every older copy is farther still.",
    hints: [
      "For a repeated value, which earlier copy is the most likely to be within distance k?", "The most recent one.", "Keep a map from value to its last seen index.", "At index i, if the value is in the map and i − last ≤ k return true; then update the map with i.",
    ],
    optimalMd: "Scan left to right with a hash map from value to the last index where it occurred. When the current value was seen before, compare i with that last index: if the gap is at most k return true. Always overwrite the stored index with the current one, because later elements are closer to it than to any older copy. (A sliding window hash set of size k is an equivalent formulation.)",
    code: [
      cpp(`
bool containsNearbyDuplicate(vector<int>& nums, int k) {
    unordered_map<int, int> last;                         // value -> most recent index
    for (int i = 0; i < (int)nums.size(); ++i) {
        auto it = last.find(nums[i]);
        if (it != last.end() && i - it->second <= k) return true;
        last[nums[i]] = i;
    }
    return false;
}`, 'C++'),
      java(`
public boolean containsNearbyDuplicate(int[] nums, int k) {
    Map<Integer, Integer> last = new HashMap<>();         // value -> most recent index
    for (int i = 0; i < nums.length; i++) {
        Integer j = last.get(nums[i]);
        if (j != null && i - j <= k) return true;
        last.put(nums[i], i);
    }
    return false;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space (or O(k) with a sliding-window set).",
    testCases: [
      { input: "[1,2,3,1], k = 3", expected: "true", why: "The two 1s are 3 apart" },
      { input: "[1,0,1,1], k = 1", expected: "true", why: "Adjacent 1s" },
      { input: "[1,2,3,1,2,3], k = 2", expected: "false", why: "Every repeat is 3 apart" },
      { input: "[1,1], k = 0", expected: "false", why: "Distinct indices at distance 1 exceed 0" },
    ],
    takeawaysMd: "When only the nearest earlier occurrence can matter, store just that index. Overwriting the map entry as you go keeps it correct for the next lookup.",
  },

  "isomorphic-strings": {
    understandMd: "Two strings are isomorphic if the characters of the first can be replaced to get the second, where every occurrence of a character is replaced by the same character, no two different characters map to the same one, and order is preserved.",
    ioConstraintsMd: "Input: two strings of equal length (up to 50,000) over ASCII characters. Output: true or false.",
    edgeCases: ["A character mapping to two different characters (e.g. \"aa\" to \"ab\")", "Two different characters mapping to one (e.g. \"ab\" to \"aa\")", "A character mapping to itself", "Single character", "Strings with no repeated characters"],
    bruteForceMd: "Try to build the mapping s→t and then verify it is injective, using a map from s characters to t characters and a set of used t characters.",
    bruteComplexity: "O(n) time, O(1) space for a fixed alphabet.",
    bottleneckMd: "The mapping has to be one-to-one in both directions. Checking only one direction accepts \"ab\" → \"aa\". Recording the last position where each pair was seen checks both directions at once.",
    hints: [
      "What two conditions must hold for a valid one-to-one replacement?", "Each source character always maps to the same target, and each target comes from only one source.", "Instead of two maps, store for each character the index of its previous occurrence.", "Two characters at the same index must have had the same previous occurrence in their own strings; compare lastSeen[s[i]] with lastSeen[t[i]].",
    ],
    optimalMd: "Keep two arrays lastS and lastT of size 256, initialised to 0, holding the 1-based position of each character's previous occurrence. For each index i, if lastS[s[i]] != lastT[t[i]] the pattern of repeats differs, so return false. Otherwise set both entries to i + 1. This verifies the forward and backward mappings at the same time because both characters must have been first seen at the same step and every repeat must refer to the same earlier index.",
    code: [
      cpp(`
bool isIsomorphic(string s, string t) {
    int lastS[256] = {0}, lastT[256] = {0};              // 1-based index of each character's previous occurrence
    for (int i = 0; i < (int)s.size(); ++i) {
        unsigned char a = s[i], b = t[i];
        if (lastS[a] != lastT[b]) return false;           // the two strings repeat at different places
        lastS[a] = lastT[b] = i + 1;
    }
    return true;
}`, 'C++'),
      java(`
public boolean isIsomorphic(String s, String t) {
    int[] lastS = new int[256], lastT = new int[256];     // 1-based index of each character's previous occurrence
    for (int i = 0; i < s.length(); i++) {
        char a = s.charAt(i), b = t.charAt(i);
        if (lastS[a] != lastT[b]) return false;           // the two strings repeat at different places
        lastS[a] = lastT[b] = i + 1;
    }
    return true;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space (fixed 256-entry tables).",
    testCases: [
      { input: "\"egg\", \"add\"", expected: "true", why: "e→a, g→d" },
      { input: "\"foo\", \"bar\"", expected: "false", why: "o would map to both a and r" },
      { input: "\"ab\", \"aa\"", expected: "false", why: "Two characters cannot share a target" },
      { input: "\"paper\", \"title\"", expected: "true", why: "Repeated p and e map consistently" },
    ],
    takeawaysMd: "A bijection between alphabets can be checked with two directional maps, or with \"last seen index\" tables compared position by position. Both directions must be enforced.",
  },

  "word-pattern": {
    understandMd: "Given a pattern of letters and a string of space-separated words, decide whether the words follow the pattern: each letter maps to exactly one word, and each word maps back to exactly one letter (a bijection).",
    ioConstraintsMd: "Input: a lowercase pattern of up to 300 letters and a string s of lowercase words separated by single spaces. Output: true or false.",
    edgeCases: ["Different counts of letters and words", "One letter mapped to two words", "Two letters mapped to the same word", "Single letter and single word", "All letters the same (all words must be equal)"],
    bruteForceMd: "Build a letter-to-word map, then check the reverse direction separately.",
    bruteComplexity: "O(n) time, O(n) space.",
    bottleneckMd: "As with isomorphic strings, one direction is not enough. Mapping both a letter to its word and a word to its letter catches every violation in a single pass.",
    hints: [
      "Split the string into words. When can you reject immediately?", "If the number of words differs from the pattern length.", "Keep a map letter → word and another word → letter.", "For each position, if either side has been mapped to something other than the current partner, return false; otherwise record the pair.",
    ],
    optimalMd: "Split the sentence into words and require the count to equal the pattern length. Walk both sequences together keeping two hash maps, one from letter to word and one from word to letter. If a letter already maps to a different word, or a word already maps to a different letter, return false; otherwise store the pair. Reaching the end means the correspondence is a bijection.",
    code: [
      cpp(`
bool wordPattern(string pattern, string s) {
    vector<string> words;
    istringstream in(s);
    for (string w; in >> w; ) words.push_back(w);
    if (words.size() != pattern.size()) return false;
    unordered_map<char, string> toWord;
    unordered_map<string, char> toLetter;
    for (size_t i = 0; i < pattern.size(); ++i) {
        auto a = toWord.find(pattern[i]);
        auto b = toLetter.find(words[i]);
        if (a != toWord.end() && a->second != words[i]) return false;      // letter already means another word
        if (b != toLetter.end() && b->second != pattern[i]) return false;   // word already belongs to another letter
        toWord[pattern[i]] = words[i];
        toLetter[words[i]] = pattern[i];
    }
    return true;
}`, 'C++'),
      java(`
public boolean wordPattern(String pattern, String s) {
    String[] words = s.split(" ");
    if (words.length != pattern.length()) return false;
    Map<Character, String> toWord = new HashMap<>();
    Map<String, Character> toLetter = new HashMap<>();
    for (int i = 0; i < pattern.length(); i++) {
        char c = pattern.charAt(i);
        if (toWord.containsKey(c) && !toWord.get(c).equals(words[i])) return false;     // letter already means another word
        if (toLetter.containsKey(words[i]) && toLetter.get(words[i]) != c) return false; // word already belongs to another letter
        toWord.put(c, words[i]);
        toLetter.put(words[i], c);
    }
    return true;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "\"abba\", \"dog cat cat dog\"", expected: "true", why: "a→dog, b→cat" },
      { input: "\"abba\", \"dog cat cat fish\"", expected: "false", why: "a would map to dog and fish" },
      { input: "\"abba\", \"dog dog dog dog\"", expected: "false", why: "Different letters share one word" },
      { input: "\"ab\", \"x\"", expected: "false", why: "Word count differs" },
    ],
    takeawaysMd: "Bijections need two maps (or two directional checks). Validate lengths first so that indexing the second sequence is safe.",
  },

  "ransom-note": {
    understandMd: "Decide whether the string ransomNote can be built using letters taken from the string magazine, where each letter in the magazine can be used at most once.",
    ioConstraintsMd: "Input: two strings of 1 to 100,000 lowercase letters. Output: true or false.",
    edgeCases: ["The note is longer than the magazine", "The note needs two copies of a letter that appears once", "Identical strings", "Letters in the magazine that are not needed", "Single letters"],
    bruteForceMd: "For each letter of the note, search the magazine for an unused copy and cross it out.",
    bruteComplexity: "O(n · m) time.",
    bottleneckMd: "Searching and crossing out repeats work. Only the number of available copies per letter matters, which a 26-entry count table records.",
    hints: [
      "Does the order of the letters in the magazine matter?", "No: only how many of each letter are available.", "Count the letters of the magazine.", "Subtract the letters needed by the note; if any count goes negative, return false.",
    ],
    optimalMd: "Count each letter of the magazine in a 26-element array. Then for each letter of the note decrement its count; if a count becomes negative the magazine lacks that letter, so return false. If the loop finishes the note can be built. The table has constant size, so the extra space is O(1).",
    code: [
      cpp(`
bool canConstruct(string ransomNote, string magazine) {
    int count[26] = {0};
    for (char c : magazine) ++count[c - 'a'];             // letters available
    for (char c : ransomNote)
        if (--count[c - 'a'] < 0) return false;           // needed more than available
    return true;
}`, 'C++'),
      java(`
public boolean canConstruct(String ransomNote, String magazine) {
    int[] count = new int[26];
    for (char c : magazine.toCharArray()) count[c - 'a']++;   // letters available
    for (char c : ransomNote.toCharArray())
        if (--count[c - 'a'] < 0) return false;               // needed more than available
    return true;
}`, 'Java'),
    ],
    finalComplexity: "O(n + m) time, O(1) space.",
    testCases: [
      { input: "\"a\", \"b\"", expected: "false", why: "Letter missing" },
      { input: "\"aa\", \"ab\"", expected: "false", why: "Only one a available" },
      { input: "\"aa\", \"aab\"", expected: "true", why: "Two as available" },
      { input: "\"abc\", \"ab\"", expected: "false", why: "Note longer than magazine" },
    ],
    takeawaysMd: "Multiset containment is a frequency-table problem. Count the supply once, then spend from it, and fail fast when a count goes negative.",
  },

  "unique-number-of-occurrences": {
    understandMd: "Return true if the number of occurrences of each distinct value in the array is unique, meaning no two different values occur the same number of times.",
    ioConstraintsMd: "Input: an integer array of length 1 to 1,000 with values from −1,000 to 1,000. Output: true or false.",
    edgeCases: ["A single element", "All elements distinct (every value occurs once, so the counts clash unless there is only one value)", "Two values with equal counts", "Negative numbers"],
    bruteForceMd: "Count each value's occurrences and compare every pair of counts.",
    bruteComplexity: "O(d²) time for d distinct values.",
    bottleneckMd: "Comparing all pairs of counts is slow; putting the counts in a set reveals a repeat in constant time per insert.",
    hints: [
      "First, how would you find how many times each value occurs?", "A frequency map: value → count.", "What property of the multiset of counts are you checking?", "That no count appears twice. Insert each count into a set and fail if the insert reports a duplicate.",
    ],
    optimalMd: "Build a frequency map of the values. Then insert each frequency into a hash set; if any frequency is already in the set, two values share the same number of occurrences, so return false. Otherwise return true. Equivalently, the number of distinct frequencies must equal the number of distinct values.",
    code: [
      cpp(`
bool uniqueOccurrences(vector<int>& arr) {
    unordered_map<int, int> freq;
    for (int x : arr) ++freq[x];
    unordered_set<int> seen;
    for (auto& kv : freq)
        if (!seen.insert(kv.second).second) return false;   // this count was already used by another value
    return true;
}`, 'C++'),
      java(`
public boolean uniqueOccurrences(int[] arr) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int x : arr) freq.merge(x, 1, Integer::sum);
    Set<Integer> seen = new HashSet<>();
    for (int count : freq.values())
        if (!seen.add(count)) return false;                  // this count was already used by another value
    return true;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "[1,2,2,1,1,3]", expected: "true", why: "Counts 3, 2, 1" },
      { input: "[1,2]", expected: "false", why: "Both occur once" },
      { input: "[-3,0,1,-3,1,1,1,-3,10,0]", expected: "true", why: "Counts 3, 2, 4, 1" },
      { input: "[1,1,2,2]", expected: "false", why: "Both occur twice" },
    ],
    takeawaysMd: "Two-level counting: count the values, then check the counts for uniqueness with a set. \"Are all of these distinct?\" is a set-insert check.",
  },

  "find-the-difference-of-two-arrays": {
    understandMd: "Given two integer arrays, return two lists: the distinct values that appear in the first array but not in the second, and the distinct values that appear in the second but not in the first.",
    ioConstraintsMd: "Input: two integer arrays of length 1 to 1,000 with values from −1,000 to 1,000. Output: a list of two lists of distinct integers (any order is accepted; the code below returns them sorted).",
    edgeCases: ["Identical arrays (both lists empty)", "Disjoint arrays", "Duplicates inside one array (each value reported once)", "Negative values"],
    bruteForceMd: "For each value of one array scan the other array for it, and avoid reporting duplicates with another scan.",
    bruteComplexity: "O(n · m) time.",
    bottleneckMd: "Membership tests against an array are linear. Hash sets answer membership in O(1) and also remove duplicates automatically.",
    hints: [
      "Which data structure removes duplicates and tests membership quickly?", "Turn each array into a set.", "The answer lists are set differences.", "For each element of set1 check that it is not in set2, and the reverse.",
    ],
    optimalMd: "Build a set from each array, which removes duplicates. The first answer list is every element of the first set that is missing from the second set; the second list is the reverse. Using ordered sets also yields sorted output, which makes the result deterministic. Each membership check is O(1) (O(log n) for ordered sets).",
    code: [
      cpp(`
vector<vector<int>> findDifference(vector<int>& nums1, vector<int>& nums2) {
    set<int> a(nums1.begin(), nums1.end()), b(nums2.begin(), nums2.end());
    vector<int> onlyA, onlyB;
    for (int x : a) if (!b.count(x)) onlyA.push_back(x);
    for (int x : b) if (!a.count(x)) onlyB.push_back(x);
    return {onlyA, onlyB};
}`, 'C++'),
      java(`
public List<List<Integer>> findDifference(int[] nums1, int[] nums2) {
    Set<Integer> a = new TreeSet<>(), b = new TreeSet<>();
    for (int x : nums1) a.add(x);
    for (int x : nums2) b.add(x);
    List<Integer> onlyA = new ArrayList<>(), onlyB = new ArrayList<>();
    for (int x : a) if (!b.contains(x)) onlyA.add(x);
    for (int x : b) if (!a.contains(x)) onlyB.add(x);
    return Arrays.asList(onlyA, onlyB);
}`, 'Java'),
    ],
    finalComplexity: "O(n log n + m log m) with ordered sets (O(n + m) with hash sets, unordered output), O(n + m) space.",
    testCases: [
      { input: "[1,2,3], [2,4,6]", expected: "[[1,3],[4,6]]", why: "Overlap only on 2" },
      { input: "[1,2,3,3], [1,1,2,2]", expected: "[[3],[]]", why: "Duplicates reported once" },
      { input: "[5], [5]", expected: "[[],[]]", why: "Identical" },
      { input: "[-1,-2], [3]", expected: "[[-2,-1],[3]]", why: "Disjoint with negatives" },
    ],
    takeawaysMd: "Set difference is the direct translation of \"in one but not the other\". Converting arrays to sets handles duplicates and gives fast membership in one step.",
  },

  "determine-if-two-strings-are-close": {
    understandMd: "Two strings are close if one can be turned into the other using these operations any number of times: (1) swap any two characters; (2) pick two distinct letters that both occur and transform every occurrence of one into the other and every occurrence of the other into the first. Decide whether the strings are close.",
    ioConstraintsMd: "Input: two lowercase strings of up to 100,000 characters. Output: true or false.",
    edgeCases: ["Different lengths (never close)", "Same letters but different frequency patterns", "Same frequency multiset but different letter sets", "Identical strings", "Single character strings"],
    bruteForceMd: "Search over all strings reachable by the two operations (a breadth-first search) until the target is found.",
    bruteComplexity: "Exponential in the length.",
    bottleneckMd: "Operation 1 lets you reorder arbitrarily, so order is irrelevant. Operation 2 lets you permute which letter owns which frequency. So only the letter set and the multiset of frequencies matter.",
    hints: [
      "What does the first operation say about the order of characters?", "Order never matters. Only the counts of each letter matter.", "What does the second operation do to the counts?", "It swaps the counts of two letters that both exist. So the strings are close exactly when they use the same set of letters and their sorted frequency lists are equal.",
    ],
    optimalMd: "Reject if the lengths differ. Count the letters in each string. The two strings must use exactly the same set of letters, because the operations can never introduce a new letter or remove one. Sort each frequency array and compare: frequencies can be permuted among the existing letters, so the sorted lists must be identical. These two conditions are necessary and sufficient.",
    code: [
      cpp(`
bool closeStrings(string word1, string word2) {
    if (word1.size() != word2.size()) return false;
    vector<int> a(26, 0), b(26, 0);
    for (char c : word1) ++a[c - 'a'];
    for (char c : word2) ++b[c - 'a'];
    for (int i = 0; i < 26; ++i)
        if ((a[i] == 0) != (b[i] == 0)) return false;     // the same letters must appear in both
    sort(a.begin(), a.end());
    sort(b.begin(), b.end());
    return a == b;                                         // frequencies can be shuffled among the letters
}`, 'C++'),
      java(`
public boolean closeStrings(String word1, String word2) {
    if (word1.length() != word2.length()) return false;
    int[] a = new int[26], b = new int[26];
    for (char c : word1.toCharArray()) a[c - 'a']++;
    for (char c : word2.toCharArray()) b[c - 'a']++;
    for (int i = 0; i < 26; i++)
        if ((a[i] == 0) != (b[i] == 0)) return false;     // the same letters must appear in both
    Arrays.sort(a);
    Arrays.sort(b);
    return Arrays.equals(a, b);                            // frequencies can be shuffled among the letters
}`, 'Java'),
    ],
    finalComplexity: "O(n + 26 log 26) time, O(1) space.",
    testCases: [
      { input: "\"abc\", \"bca\"", expected: "true", why: "Only reordering is needed" },
      { input: "\"a\", \"aa\"", expected: "false", why: "Different lengths" },
      { input: "\"cabbba\", \"abbccc\"", expected: "true", why: "Frequencies {1,2,3} on both sides" },
      { input: "\"cabbba\", \"aabbss\"", expected: "false", why: "Letter sets differ (c vs s)" },
    ],
    takeawaysMd: "When operations let you reorder things freely, ask what is invariant. Here it is the set of letters and the multiset of frequencies, which turns a search problem into two cheap comparisons.",
  },

  "equal-row-and-column-pairs": {
    understandMd: "In an n by n grid count the pairs (row i, column j) where row i and column j contain the same elements in the same order.",
    ioConstraintsMd: "Input: an n by n integer grid with n up to 200. Output: the number of equal (row, column) pairs.",
    edgeCases: ["n = 1 (always one pair)", "Duplicate rows or columns (each combination is counted)", "A symmetric matrix (row i equals column i for every i)", "No matching pairs", "A row equal to several columns"],
    bruteForceMd: "For every row and every column compare the n elements one by one.",
    bruteComplexity: "O(n³) time.",
    bottleneckMd: "Comparing each row with each column repeats work. If every row and column is turned into a hashable key, each comparison becomes a lookup.",
    hints: [
      "How many (row, column) combinations are there, and how long is each comparison?", "Make each row hashable (for instance a vector or a joined string) and count how many times each row occurs.", "Then look up each column in that table.", "Add the number of rows equal to that column; the sum over all columns is the answer.",
    ],
    optimalMd: "Put every row into a hash map from the row contents (a vector or a string key) to how many rows have exactly that content. Then build each column in turn and add the stored count for that column's key. Duplicate rows are counted separately because the map stores multiplicities. The cost is O(n²) to build keys plus hashing of n keys of length n each.",
    code: [
      cpp(`
int equalPairs(vector<vector<int>>& grid) {
    int n = grid.size(), pairs = 0;
    map<vector<int>, int> rows;                           // row contents -> how many rows look like that
    for (auto& row : grid) ++rows[row];
    for (int c = 0; c < n; ++c) {
        vector<int> col(n);
        for (int r = 0; r < n; ++r) col[r] = grid[r][c];
        auto it = rows.find(col);
        if (it != rows.end()) pairs += it->second;
    }
    return pairs;
}`, 'C++'),
      java(`
public int equalPairs(int[][] grid) {
    int n = grid.length, pairs = 0;
    Map<List<Integer>, Integer> rows = new HashMap<>();   // row contents -> how many rows look like that
    for (int[] row : grid) {
        List<Integer> key = new ArrayList<>();
        for (int x : row) key.add(x);
        rows.merge(key, 1, Integer::sum);
    }
    for (int c = 0; c < n; c++) {
        List<Integer> col = new ArrayList<>();
        for (int r = 0; r < n; r++) col.add(grid[r][c]);
        pairs += rows.getOrDefault(col, 0);
    }
    return pairs;
}`, 'Java'),
    ],
    finalComplexity: "O(n² log n) with an ordered map (O(n²) expected with hashing), O(n²) space.",
    testCases: [
      { input: "[[3,2,1],[1,7,6],[2,7,7]]", expected: "1", why: "Row 2 equals column 1" },
      { input: "[[3,1,2,2],[1,4,4,5],[2,4,2,2],[2,4,2,2]]", expected: "3", why: "Two identical rows both match a column" },
      { input: "[[5]]", expected: "1", why: "Single cell" },
      { input: "[[1,2],[2,1]]", expected: "2", why: "Symmetric grid" },
    ],
    takeawaysMd: "Turn the objects you want to compare into hashable keys. Storing multiplicities in the map makes duplicate rows count correctly without double loops.",
  },

  "rotate-list": {
    understandMd: "Rotate a singly linked list to the right by k places: the last k nodes move to the front, keeping their order.",
    ioConstraintsMd: "Input: the head of a list with 0 to 500 nodes and a non-negative k up to 2·10^9. Output: the head of the rotated list.",
    edgeCases: ["Empty list or single node", "k = 0", "k equal to a multiple of the length (no change)", "k larger than the length", "Two nodes"],
    bruteForceMd: "Move the last node to the front k times, each time walking to the tail.",
    bruteComplexity: "O(n · k) time, which is far too slow for a huge k.",
    bottleneckMd: "Only k mod n matters, and the rotation is one cut and one splice: break the list at the right place and attach the old tail to the old head.",
    hints: [
      "Rotating by the list length leaves the list unchanged. What does that say about large k?", "Compute the length n and replace k by k mod n.", "After the rotation the new tail is the node at position n − k − 1 and the new head is the next node.", "Link the old tail to the old head, then cut after the new tail.",
    ],
    optimalMd: "Walk to the tail while counting the length n. Replace k by k mod n; if it is 0 return the head. The new tail is the node n − k − 1 steps from the head, and the new head is the node after it. Set the old tail's next to the old head, set the new tail's next to null, and return the new head. It is one pass to measure and one partial pass to find the cut.",
    code: [
      cpp(`
ListNode* rotateRight(ListNode* head, int k) {
    if (!head || !head->next || k == 0) return head;
    int n = 1;
    ListNode* tail = head;
    while (tail->next) { tail = tail->next; ++n; }
    k %= n;
    if (k == 0) return head;
    ListNode* newTail = head;
    for (int i = 0; i < n - k - 1; ++i) newTail = newTail->next;   // last node that stays at the back
    ListNode* newHead = newTail->next;
    newTail->next = nullptr;
    tail->next = head;                                              // close the ring, cut after newTail
    return newHead;
}`, 'C++'),
      java(`
public ListNode rotateRight(ListNode head, int k) {
    if (head == null || head.next == null || k == 0) return head;
    int n = 1;
    ListNode tail = head;
    while (tail.next != null) { tail = tail.next; n++; }
    k %= n;
    if (k == 0) return head;
    ListNode newTail = head;
    for (int i = 0; i < n - k - 1; i++) newTail = newTail.next;     // last node that stays at the back
    ListNode newHead = newTail.next;
    newTail.next = null;
    tail.next = head;                                                // close the ring, cut after newTail
    return newHead;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,2,3,4,5], k = 2", expected: "[4,5,1,2,3]", why: "Standard" },
      { input: "[0,1,2], k = 4", expected: "[2,0,1]", why: "k larger than the length (4 mod 3 = 1)" },
      { input: "[1,2], k = 2", expected: "[1,2]", why: "Full turn" },
      { input: "[], k = 3", expected: "[]", why: "Empty list" },
    ],
    takeawaysMd: "Reduce k modulo the length first. A list rotation is \"make it circular, then cut at the right node\": measure once, find the cut, rewire two pointers.",
  },

  "remove-duplicates-from-sorted-list-ii": {
    understandMd: "In a sorted linked list, delete every node whose value appears more than once, so that only values that occurred exactly once remain. Return the resulting sorted list.",
    ioConstraintsMd: "Input: the head of a sorted list with 0 to 300 nodes. Output: the head of the list after removing all duplicated values entirely.",
    edgeCases: ["Duplicates at the head (the head itself must be removed)", "Duplicates at the tail", "All values equal (empty result)", "No duplicates", "Empty list"],
    bruteForceMd: "Count the frequency of each value with a map, then rebuild a list from the values that occurred once.",
    bruteComplexity: "O(n) time, O(n) space.",
    bottleneckMd: "The list is sorted, so duplicates are adjacent and can be skipped in place. The only awkward case is that the head may be deleted, which a dummy node solves.",
    hints: [
      "In a sorted list where do the copies of a value sit?", "Next to each other. So you can detect a duplicate run by comparing a node with its successor.", "Keep a pointer prev to the last node known to stay in the list, starting at a dummy before the head.", "If the current node starts a duplicate run, skip the whole run and link prev to the node after it; otherwise advance prev.",
    ],
    optimalMd: "Create a dummy node before the head, with prev pointing to it. Let cur walk the list. If cur and cur.next have equal values, remember the value and advance cur past every node with that value, then set prev.next to cur (removing the whole run); do not advance prev, since the node after the run may also start a run. Otherwise advance prev to cur and cur to its next. Return dummy.next.",
    code: [
      cpp(`
ListNode* deleteDuplicates(ListNode* head) {
    ListNode dummy(0, head);
    ListNode* prev = &dummy;                              // last node that is definitely kept
    ListNode* cur = head;
    while (cur) {
        if (cur->next && cur->val == cur->next->val) {
            int dup = cur->val;
            while (cur && cur->val == dup) cur = cur->next;   // skip the whole run
            prev->next = cur;
        } else {
            prev = cur;
            cur = cur->next;
        }
    }
    return dummy.next;
}`, 'C++'),
      java(`
public ListNode deleteDuplicates(ListNode head) {
    ListNode dummy = new ListNode(0, head);
    ListNode prev = dummy;                                // last node that is definitely kept
    ListNode cur = head;
    while (cur != null) {
        if (cur.next != null && cur.val == cur.next.val) {
            int dup = cur.val;
            while (cur != null && cur.val == dup) cur = cur.next;   // skip the whole run
            prev.next = cur;
        } else {
            prev = cur;
            cur = cur.next;
        }
    }
    return dummy.next;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,2,3,3,4,4,5]", expected: "[1,2,5]", why: "Two duplicated values removed entirely" },
      { input: "[1,1,1,2,3]", expected: "[2,3]", why: "Duplicates at the head" },
      { input: "[2,2,2]", expected: "[]", why: "Everything is a duplicate" },
      { input: "[1,2,2]", expected: "[1]", why: "Duplicates at the tail" },
    ],
    takeawaysMd: "Use a dummy head whenever the first node might be deleted. Do not advance the trailing pointer after skipping a run: the node that follows may begin another run.",
  },

  "partition-list": {
    understandMd: "Rearrange a linked list so that all nodes with values less than x come before all nodes with values greater than or equal to x, keeping the original relative order within each group.",
    ioConstraintsMd: "Input: the head of a list with 0 to 200 nodes and an integer x. Output: the head of the partitioned list.",
    edgeCases: ["Empty list", "All values less than x", "All values at least x", "x equal to some values (they go to the second group)", "Already partitioned"],
    bruteForceMd: "Copy the values into two arrays, concatenate them and rebuild a list.",
    bruteComplexity: "O(n) time, O(n) extra space.",
    bottleneckMd: "You can relink the existing nodes into two chains instead of copying values: one chain for small nodes, one for the rest, then join them.",
    hints: [
      "If you could build two separate lists as you walk, what would you do at the end?", "Join them: all small nodes, then all large nodes.", "Use a dummy head for each chain so appending needs no special case for an empty chain.", "Remember to terminate the second chain with null, or the last large node may still point into the old list and create a cycle.",
    ],
    optimalMd: "Create two dummy-headed chains, small and large, with tail pointers. Walk the original list once and append each node to the small chain when its value is less than x, otherwise to the large chain. Finally set large's tail next to null (essential to avoid a cycle), link the small tail to the large chain's first node, and return the small chain's first node. Stability holds because nodes are appended in their original order.",
    code: [
      cpp(`
ListNode* partition(ListNode* head, int x) {
    ListNode smallHead, largeHead;                       // dummy heads for the two chains
    ListNode *small = &smallHead, *large = &largeHead;
    for (ListNode* cur = head; cur; cur = cur->next) {
        if (cur->val < x) { small->next = cur; small = cur; }
        else              { large->next = cur; large = cur; }
    }
    large->next = nullptr;                                // otherwise the old tail may still point into the list
    small->next = largeHead.next;
    return smallHead.next;
}`, 'C++'),
      java(`
public ListNode partition(ListNode head, int x) {
    ListNode smallHead = new ListNode(0), largeHead = new ListNode(0);   // dummy heads for the two chains
    ListNode small = smallHead, large = largeHead;
    for (ListNode cur = head; cur != null; cur = cur.next) {
        if (cur.val < x) { small.next = cur; small = cur; }
        else             { large.next = cur; large = cur; }
    }
    large.next = null;                                    // otherwise the old tail may still point into the list
    small.next = largeHead.next;
    return smallHead.next;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) extra space (nodes are relinked, not copied).",
    testCases: [
      { input: "[1,4,3,2,5,2], x = 3", expected: "[1,2,2,4,3,5]", why: "Stable within both groups" },
      { input: "[2,1], x = 2", expected: "[1,2]", why: "Values equal to x go to the second group" },
      { input: "[], x = 1", expected: "[]", why: "Empty" },
      { input: "[1,2,3], x = 10", expected: "[1,2,3]", why: "Everything is small" },
    ],
    takeawaysMd: "Build two chains with dummy heads and join them. Always terminate the last chain with null: a stale next pointer from the original list is a classic cause of cycles.",
  },

  "reverse-linked-list-ii": {
    understandMd: "Reverse the nodes of a singly linked list from position left to position right (1-based, inclusive) and return the updated list.",
    ioConstraintsMd: "Input: the head of a list with n nodes (1 ≤ n ≤ 500) and positions 1 ≤ left ≤ right ≤ n. Output: the head of the list with that section reversed. Aim for one pass.",
    edgeCases: ["left = 1 (the head changes)", "left = right (nothing to do)", "right = n (the tail section)", "Reversing the whole list", "A single node"],
    bruteForceMd: "Copy the section into an array, reverse it, and write the values back.",
    bruteComplexity: "O(n) time, O(n) space.",
    bottleneckMd: "The values can be moved by relinking nodes in place. Repeatedly moving the node after the section start to the front of the section reverses it without extra storage.",
    hints: [
      "Which node do you need to hold on to so you can reconnect the reversed section?", "The node just before position left. A dummy head makes that always exist.", "Let cur be the first node of the section. Repeat right − left times: take the node after cur and insert it directly after prev.", "Each step moves one node to the front of the section, growing the reversed prefix.",
    ],
    optimalMd: "Put a dummy node before the head and walk prev to the node at position left − 1. Let cur = prev.next (the first node of the section). Repeat right − left times: detach the node after cur (nxt = cur.next; cur.next = nxt.next), then insert it right after prev (nxt.next = prev.next; prev.next = nxt). The first section node drifts to the end of the reversed part automatically. Return dummy.next.",
    code: [
      cpp(`
ListNode* reverseBetween(ListNode* head, int left, int right) {
    ListNode dummy(0, head);
    ListNode* prev = &dummy;
    for (int i = 1; i < left; ++i) prev = prev->next;     // node just before the section
    ListNode* cur = prev->next;                           // first node of the section; it ends up last
    for (int i = 0; i < right - left; ++i) {
        ListNode* nxt = cur->next;                        // node to move to the front of the section
        cur->next = nxt->next;
        nxt->next = prev->next;
        prev->next = nxt;
    }
    return dummy.next;
}`, 'C++'),
      java(`
public ListNode reverseBetween(ListNode head, int left, int right) {
    ListNode dummy = new ListNode(0, head);
    ListNode prev = dummy;
    for (int i = 1; i < left; i++) prev = prev.next;      // node just before the section
    ListNode cur = prev.next;                             // first node of the section; it ends up last
    for (int i = 0; i < right - left; i++) {
        ListNode nxt = cur.next;                          // node to move to the front of the section
        cur.next = nxt.next;
        nxt.next = prev.next;
        prev.next = nxt;
    }
    return dummy.next;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time in one pass, O(1) space.",
    testCases: [
      { input: "[1,2,3,4,5], left = 2, right = 4", expected: "[1,4,3,2,5]", why: "Middle section" },
      { input: "[5], left = 1, right = 1", expected: "[5]", why: "Single node" },
      { input: "[1,2,3], left = 1, right = 3", expected: "[3,2,1]", why: "Whole list: the head changes" },
      { input: "[1,2,3,4], left = 3, right = 4", expected: "[1,2,4,3]", why: "Tail section" },
    ],
    takeawaysMd: "Head insertion reverses a section in one pass: keep prev fixed and keep moving the next node to just after prev. A dummy head handles the case where the reversal starts at position 1.",
  },

  "sort-list": {
    understandMd: "Sort a singly linked list in ascending order and return the head of the sorted list.",
    ioConstraintsMd: "Input: the head of a list with 0 to 50,000 nodes. Output: the head of the sorted list. The follow-up asks for O(n log n) time and O(1) extra space.",
    edgeCases: ["Empty list or one node", "Already sorted or reverse sorted", "Many duplicate values", "Two nodes", "Negative values"],
    bruteForceMd: "Copy the values into an array, sort it and write the values back (or repeatedly insert nodes into a sorted list).",
    bruteComplexity: "O(n log n) time with O(n) space for the array; insertion sort on the list is O(n²).",
    bottleneckMd: "Quick sort and heap sort need random access, which a list lacks. Merge sort only needs sequential access, and merging two sorted lists needs no extra memory.",
    hints: [
      "Which classic O(n log n) sort works well on linked lists?", "Merge sort: split in half, sort the halves, merge.", "How do you find the middle of a list to split it?", "Fast and slow pointers. Cut the list at the middle (set the previous node's next to null), recurse on both halves and merge them with the standard two-list merge.",
    ],
    optimalMd: "Top-down merge sort. If the list has fewer than two nodes return it. Use slow and fast pointers to find the node before the middle, cut the list there, recursively sort each half, and merge the two sorted halves with a dummy-headed merge that relinks nodes. The recursion depth is O(log n), so the extra space is O(log n) for the call stack (a bottom-up version reaches O(1)).",
    code: [
      cpp(`
ListNode* mergeTwo(ListNode* a, ListNode* b) {
    ListNode dummy, *tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) { tail->next = a; a = a->next; }   // <= keeps equal values in their original order
        else                  { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}

ListNode* sortList(ListNode* head) {
    if (!head || !head->next) return head;
    ListNode *slow = head, *fast = head->next;                    // fast starts one ahead so slow stops before the middle
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    ListNode* second = slow->next;
    slow->next = nullptr;                                         // cut the list in two
    return mergeTwo(sortList(head), sortList(second));
}`, 'C++'),
      java(`
public ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode slow = head, fast = head.next;                       // fast starts one ahead so slow stops before the middle
    while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
    ListNode second = slow.next;
    slow.next = null;                                             // cut the list in two
    return mergeTwo(sortList(head), sortList(second));
}

private ListNode mergeTwo(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }        // <= keeps equal values in their original order
        else                { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;
    return dummy.next;
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time, O(log n) stack space (bottom-up merge sort reaches O(1)).",
    testCases: [
      { input: "[4,2,1,3]", expected: "[1,2,3,4]", why: "Standard" },
      { input: "[-1,5,3,4,0]", expected: "[-1,0,3,4,5]", why: "Negative value" },
      { input: "[]", expected: "[]", why: "Empty" },
      { input: "[2,1]", expected: "[1,2]", why: "Two nodes: slow stops at the first node" },
    ],
    takeawaysMd: "Merge sort is the natural sort for linked lists: splitting needs only fast/slow pointers and merging relinks nodes without extra memory. Start fast one node ahead so that the split point is before the middle and a two-node list still splits.",
  },

  "odd-even-linked-list": {
    understandMd: "Group all nodes at odd positions (1st, 3rd, 5th, …) together, followed by all nodes at even positions, keeping the relative order within each group. Positions are by index, not by value.",
    ioConstraintsMd: "Input: the head of a list with 0 to 10,000 nodes. Output: the head of the regrouped list. O(1) extra space and O(n) time are required.",
    edgeCases: ["Empty list", "One or two nodes", "Odd versus even length", "All values equal (position, not value, decides)"],
    bruteForceMd: "Copy values at odd and even positions into two arrays and rewrite the list.",
    bruteComplexity: "O(n) time, O(n) extra space.",
    bottleneckMd: "You can thread two chains through the existing nodes in one pass: an odd chain and an even chain, each skipping every other node, and finally link them.",
    hints: [
      "Which pointers do you need to keep to be able to join the groups at the end?", "The start of the even chain, and the end of the odd chain.", "Let odd and even walk the list together, each linking to the node two steps ahead.", "Stop when even or even.next is null; then set odd.next to the saved head of the even chain.",
    ],
    optimalMd: "Set odd = head, even = head.next and save evenHead = even. While even and even.next exist, link odd.next = even.next and advance odd, then link even.next = odd.next and advance even. When the loop ends, odd is the last odd-position node; set odd.next = evenHead to attach the even chain. Every node is relinked once.",
    code: [
      cpp(`
ListNode* oddEvenList(ListNode* head) {
    if (!head || !head->next) return head;
    ListNode *odd = head, *even = head->next, *evenHead = even;
    while (even && even->next) {
        odd->next = even->next;                           // skip over one even node
        odd = odd->next;
        even->next = odd->next;                           // skip over one odd node
        even = even->next;
    }
    odd->next = evenHead;                                 // odd chain first, then even chain
    return head;
}`, 'C++'),
      java(`
public ListNode oddEvenList(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode odd = head, even = head.next, evenHead = even;
    while (even != null && even.next != null) {
        odd.next = even.next;                             // skip over one even node
        odd = odd.next;
        even.next = odd.next;                             // skip over one odd node
        even = even.next;
    }
    odd.next = evenHead;                                  // odd chain first, then even chain
    return head;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,2,3,4,5]", expected: "[1,3,5,2,4]", why: "Odd length" },
      { input: "[2,1,3,5,6,4,7]", expected: "[2,3,6,7,1,5,4]", why: "Positions, not values, decide" },
      { input: "[1,2]", expected: "[1,2]", why: "Two nodes unchanged" },
      { input: "[]", expected: "[]", why: "Empty" },
    ],
    takeawaysMd: "Two interleaved chains can be unzipped in place with two walkers. Save the head of the second chain and the tail of the first so the join is a single assignment.",
  },

  "delete-the-middle-node-of-a-linked-list": {
    understandMd: "Delete the middle node of a singly linked list (the node at 0-based index floor(n / 2)) and return the head of the modified list.",
    ioConstraintsMd: "Input: the head of a list with 1 to 100,000 nodes. Output: the head after removing the middle node (an empty list if there was a single node).",
    edgeCases: ["Single node (result is empty)", "Two nodes (the second one is removed)", "Odd length (exact middle)", "Even length (the second of the two central nodes is the middle)"],
    bruteForceMd: "Walk once to count the nodes, then walk again to the node before the middle and unlink its successor.",
    bruteComplexity: "O(n) time in two passes, O(1) space.",
    bottleneckMd: "The two passes can be merged: a fast pointer moving twice as quickly tells you when the slow pointer is just before the middle.",
    hints: [
      "Which node must you stand on to unlink the middle node?", "The node just before it.", "Fast and slow pointers find the middle in one pass; how do you make slow stop one node early?", "Start fast two nodes ahead of slow (fast = head.next.next). When fast reaches the end, slow.next is the middle; skip it.",
    ],
    optimalMd: "If the list has one node return null. Otherwise let slow = head and fast = head.next.next. While fast and fast.next exist, move slow by one and fast by two. At the end slow is the node immediately before the middle node, so set slow.next = slow.next.next. Starting fast two steps ahead compensates for the need to stop one node early, so no dummy node is required.",
    code: [
      cpp(`
ListNode* deleteMiddle(ListNode* head) {
    if (!head->next) return nullptr;                      // a single node: the middle is the head
    ListNode *slow = head, *fast = head->next->next;      // fast starts two ahead so slow stops before the middle
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    slow->next = slow->next->next;                        // unlink the middle node
    return head;
}`, 'C++'),
      java(`
public ListNode deleteMiddle(ListNode head) {
    if (head.next == null) return null;                   // a single node: the middle is the head
    ListNode slow = head, fast = head.next.next;          // fast starts two ahead so slow stops before the middle
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    slow.next = slow.next.next;                           // unlink the middle node
    return head;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time in one pass, O(1) space.",
    testCases: [
      { input: "[1,3,4,7,1,2,6]", expected: "[1,3,4,1,2,6]", why: "Remove 7 at index 3" },
      { input: "[1,2,3,4]", expected: "[1,2,4]", why: "Even length: index 2 is the middle" },
      { input: "[2,1]", expected: "[2]", why: "Two nodes" },
      { input: "[5]", expected: "[]", why: "Single node" },
    ],
    takeawaysMd: "Offsetting the fast pointer at the start makes slow stop one node before the target, which avoids a trailing \"previous\" pointer or dummy node.",
  },

  "maximum-twin-sum-of-a-linked-list": {
    understandMd: "In a linked list of even length n, the twin of the node at index i is the node at index n − 1 − i. The twin sum is the sum of a node's value and its twin's value. Return the maximum twin sum.",
    ioConstraintsMd: "Input: the head of a list with an even number of nodes, 2 to 100,000. Output: the largest twin sum.",
    edgeCases: ["Two nodes (a single twin pair)", "The largest pair is in the middle", "The largest pair is at the ends", "All values equal", "Large values (sums up to 10^5 + 10^5 fit in int)"],
    bruteForceMd: "Copy the values into an array and pair index i with n − 1 − i.",
    bruteComplexity: "O(n) time, O(n) space.",
    bottleneckMd: "Pairing node i with node n − 1 − i needs backward access. Reversing the second half of the list gives forward access to the twins using no extra memory.",
    hints: [
      "How can you reach the twin of the first node without random access?", "If the second half were reversed, you could walk both halves forward together.", "Find the middle with fast and slow pointers.", "Reverse the half that starts at the middle, then walk the first half and the reversed half in lockstep, tracking the maximum sum.",
    ],
    optimalMd: "Find the start of the second half with slow and fast pointers (slow ends at index n / 2 when fast reaches the end). Reverse the list starting at slow in place. Then walk one pointer from the head and one from the new head of the reversed half simultaneously; each pair is a twin pair, so keep the maximum of their sums. (If the original list must be preserved, reverse the half back afterwards.)",
    code: [
      cpp(`
int pairSum(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }   // slow is at index n / 2
    ListNode* prev = nullptr;                             // reverse the second half in place
    while (slow) { ListNode* nxt = slow->next; slow->next = prev; prev = slow; slow = nxt; }
    int best = 0;
    for (ListNode *a = head, *b = prev; b; a = a->next, b = b->next)   // twins are visited together
        best = max(best, a->val + b->val);
    return best;
}`, 'C++'),
      java(`
public int pairSum(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }   // slow is at index n / 2
    ListNode prev = null;                                 // reverse the second half in place
    while (slow != null) { ListNode nxt = slow.next; slow.next = prev; prev = slow; slow = nxt; }
    int best = 0;
    for (ListNode a = head, b = prev; b != null; a = a.next, b = b.next)   // twins are visited together
        best = Math.max(best, a.val + b.val);
    return best;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) extra space.",
    testCases: [
      { input: "[5,4,2,1]", expected: "6", why: "Pairs (5,1) and (4,2): 6 and 6" },
      { input: "[4,2,2,3]", expected: "7", why: "Pairs (4,3) and (2,2)" },
      { input: "[1,100000]", expected: "100001", why: "Single pair" },
      { input: "[3,3,3,3,3,3]", expected: "6", why: "All equal" },
    ],
    takeawaysMd: "Reversing the second half turns \"pair the ends inward\" into a forward lockstep walk. Combine middle-finding, in-place reversal and a two-pointer pass.",
  },

  "symmetric-tree": {
    understandMd: "Decide whether a binary tree is a mirror image of itself: the left subtree must be the mirror of the right subtree, comparing both the values and the shape.",
    ioConstraintsMd: "Input: the root of a binary tree with 1 to 1,000 nodes. Output: true if the tree is symmetric around its centre, otherwise false.",
    edgeCases: ["Single node (symmetric)", "Left and right subtrees have the same shape but the values are in the wrong places", "Only one child at some mirrored position", "Equal values but different structure", "Empty subtrees on both sides"],
    bruteForceMd: "Produce a level-order listing including null markers for each level and check that each level is a palindrome.",
    bruteComplexity: "O(n) time, O(n) space for the lists.",
    bottleneckMd: "Comparing a tree with itself needs a paired traversal, not two independent ones: you walk the left subtree and the right subtree in mirrored directions at the same time.",
    hints: [
      "What must be true of the roots of the left and right subtrees?", "They must have equal values. What about their children?", "The left child of one must mirror the right child of the other, and vice versa.", "Write a helper mirror(a, b): both null is true, exactly one null is false, values must match, and then mirror(a.left, b.right) and mirror(a.right, b.left).",
    ],
    optimalMd: "Define mirror(a, b): if both are null return true; if exactly one is null or the values differ return false; otherwise recurse on the outer pair (a.left, b.right) and the inner pair (a.right, b.left). The tree is symmetric when mirror(root.left, root.right) holds. Each node is visited once; the recursion depth equals the tree height. An iterative version uses a queue of pairs.",
    code: [
      cpp(`
bool mirror(TreeNode* a, TreeNode* b) {
    if (!a && !b) return true;
    if (!a || !b || a->val != b->val) return false;
    return mirror(a->left, b->right) && mirror(a->right, b->left);   // outer pair, then inner pair
}

bool isSymmetric(TreeNode* root) {
    return !root || mirror(root->left, root->right);
}`, 'C++'),
      java(`
public boolean isSymmetric(TreeNode root) {
    return root == null || mirror(root.left, root.right);
}

private boolean mirror(TreeNode a, TreeNode b) {
    if (a == null && b == null) return true;
    if (a == null || b == null || a.val != b.val) return false;
    return mirror(a.left, b.right) && mirror(a.right, b.left);       // outer pair, then inner pair
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(h) space for the recursion (h is the tree height).",
    testCases: [
      { input: "[1,2,2,3,4,4,3]", expected: "true", why: "Perfect mirror" },
      { input: "[1,2,2,null,3,null,3]", expected: "false", why: "Both children are on the same side" },
      { input: "[1]", expected: "true", why: "Single node" },
      { input: "[1,2,3]", expected: "false", why: "Values differ" },
    ],
    takeawaysMd: "To compare two subtrees that must mirror each other, recurse on a pair of nodes and cross the children: outer with outer, inner with inner. The base cases (both null, one null, values differ) are the whole proof of correctness.",
  },

  "binary-tree-zigzag-level-order-traversal": {
    understandMd: "Traverse a binary tree level by level, but alternate the direction: the first level is read left to right, the second right to left, the third left to right again, and so on. Return the values level by level.",
    ioConstraintsMd: "Input: the root of a binary tree with 0 to 2,000 nodes. Output: a list of lists of node values, one list per level.",
    edgeCases: ["Empty tree", "Single node", "A skewed tree (one node per level)", "A level with a missing child", "Many levels (direction must keep alternating)"],
    bruteForceMd: "Do a normal level-order traversal, then reverse every odd-numbered level of the result.",
    bruteComplexity: "O(n) time, O(n) space.",
    bottleneckMd: "There is nothing asymptotically slower than this; the improvement is only to avoid the second pass by writing each level in the correct order directly, using the level's size and a direction flag.",
    hints: [
      "What traversal gives you the nodes one level at a time?", "Breadth-first search with a queue, processing exactly the number of nodes that are in the queue at the start of each round.", "How do you place a node in the right slot of its level if the level is read backwards?", "Allocate the level vector with the right size and write node i at index i (left to right) or size − 1 − i (right to left), flipping a flag after each level.",
    ],
    optimalMd: "Standard BFS with a queue. For each level record its size, create a result vector of that size and fill it: if the direction is left to right the i-th dequeued node goes to position i, otherwise to size − 1 − i. Push the children left then right as usual, because the queue order stays fixed; only the placement in the output changes. Toggle the direction after each level.",
    code: [
      cpp(`
vector<vector<int>> zigzagLevelOrder(TreeNode* root) {
    vector<vector<int>> out;
    if (!root) return out;
    queue<TreeNode*> q;
    q.push(root);
    bool leftToRight = true;
    while (!q.empty()) {
        int size = q.size();
        vector<int> level(size);
        for (int i = 0; i < size; ++i) {
            TreeNode* node = q.front(); q.pop();
            level[leftToRight ? i : size - 1 - i] = node->val;   // place directly in the right slot
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        out.push_back(level);
        leftToRight = !leftToRight;
    }
    return out;
}`, 'C++'),
      java(`
public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.add(root);
    boolean leftToRight = true;
    while (!q.isEmpty()) {
        int size = q.size();
        Integer[] level = new Integer[size];
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll();
            level[leftToRight ? i : size - 1 - i] = node.val;    // place directly in the right slot
            if (node.left != null) q.add(node.left);
            if (node.right != null) q.add(node.right);
        }
        out.add(Arrays.asList(level));
        leftToRight = !leftToRight;
    }
    return out;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(w) space where w is the maximum width of the tree.",
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expected: "[[3],[20,9],[15,7]]", why: "Second level reversed" },
      { input: "[1]", expected: "[[1]]", why: "Single node" },
      { input: "[]", expected: "[]", why: "Empty tree" },
      { input: "[1,2,3,4,null,null,5]", expected: "[[1],[3,2],[4,5]]", why: "A missing child inside a level" },
    ],
    takeawaysMd: "The traversal order never changes; only where you write each value does. Using the level size and a direction flag avoids a second reversing pass.",
  },

  "construct-binary-tree-from-inorder-and-postorder-traversal": {
    understandMd: "Given the inorder and postorder traversals of a binary tree with distinct values, reconstruct and return the tree.",
    ioConstraintsMd: "Input: two integer arrays of equal length n (1 to 3,000) containing the same distinct values. Output: the root of the reconstructed tree.",
    edgeCases: ["Single node", "A tree that only has left children", "A tree that only has right children", "The root is the first or last element of the inorder list", "Distinct values are guaranteed"],
    bruteForceMd: "For each root, scan the inorder array linearly to find its position and split the arrays into new copies.",
    bruteComplexity: "O(n²) time in the worst case (skewed tree) and extra O(n) per level for copies.",
    bottleneckMd: "Two costs repeat: finding the root's position in inorder (linear) and copying subarrays. A hash map gives the position in O(1), and index ranges avoid copying.",
    hints: [
      "In a postorder list, which element is the root of the whole tree?", "The last one. Once you know the root, where does it sit in the inorder list and what does that split?", "Everything left of it in inorder is the left subtree, everything right of it is the right subtree.", "Postorder is left, right, root, so consuming it from the end gives root, then the right subtree's root, then the left's. Build the right subtree before the left.",
    ],
    optimalMd: "Store the index of every value in the inorder array in a hash map. Keep a pointer into the postorder array starting at its last element and a recursive build(lo, hi) over a range of the inorder array. Take the next postorder element as the root, look up its inorder index mid, build the right subtree from (mid + 1, hi) first and then the left subtree from (lo, mid − 1), because postorder consumed from the back yields root, right, left. The ranges avoid copying and the map gives O(1) splits, so it is O(n) overall.",
    code: [
      cpp(`
TreeNode* buildTree(vector<int>& inorder, vector<int>& postorder) {
    unordered_map<int, int> pos;                          // value -> index in inorder
    for (int i = 0; i < (int)inorder.size(); ++i) pos[inorder[i]] = i;
    int next = (int)postorder.size() - 1;                 // postorder read from the back: root, right, left
    function<TreeNode*(int, int)> build = [&](int lo, int hi) -> TreeNode* {
        if (lo > hi) return nullptr;
        TreeNode* node = new TreeNode(postorder[next--]);
        int mid = pos[node->val];
        node->right = build(mid + 1, hi);                 // the right subtree comes first when reading backwards
        node->left = build(lo, mid - 1);
        return node;
    };
    return build(0, (int)inorder.size() - 1);
}`, 'C++'),
      java(`
public TreeNode buildTree(int[] inorder, int[] postorder) {
    Map<Integer, Integer> pos = new HashMap<>();          // value -> index in inorder
    for (int i = 0; i < inorder.length; i++) pos.put(inorder[i], i);
    return build(postorder, pos, new int[]{postorder.length - 1}, 0, inorder.length - 1);
}

private TreeNode build(int[] postorder, Map<Integer, Integer> pos, int[] next, int lo, int hi) {
    if (lo > hi) return null;
    TreeNode node = new TreeNode(postorder[next[0]--]);   // postorder read from the back: root, right, left
    int mid = pos.get(node.val);
    node.right = build(postorder, pos, next, mid + 1, hi);   // the right subtree comes first when reading backwards
    node.left = build(postorder, pos, next, lo, mid - 1);
    return node;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space for the map and the recursion.",
    testCases: [
      { input: "inorder [9,3,15,20,7], postorder [9,15,7,20,3]", expected: "[3,9,20,null,null,15,7]", why: "Standard" },
      { input: "inorder [-1], postorder [-1]", expected: "[-1]", why: "Single node" },
      { input: "inorder [1,2,3], postorder [3,2,1]", expected: "[1,null,2,null,3]", why: "Right-skewed tree" },
      { input: "inorder [1,2,3], postorder [1,2,3]", expected: "[3,2,null,1]", why: "Left-skewed tree" },
    ],
    takeawaysMd: "Traversal reconstruction: one order tells you the root, the other tells you how to split. Reading postorder backwards means building the right subtree before the left. Use an index map and index ranges instead of searching and copying.",
  },

  "convert-sorted-array-to-binary-search-tree": {
    understandMd: "Convert a sorted array into a height-balanced binary search tree: the depths of the two subtrees of every node differ by at most one.",
    ioConstraintsMd: "Input: a strictly increasing integer array of length 1 to 10,000. Output: the root of a height-balanced BST containing the same values (any valid answer is accepted).",
    edgeCases: ["Single element", "Two elements (one becomes a child)", "Even and odd lengths", "Negative values", "Arrays that are already tiny"],
    bruteForceMd: "Insert the values one by one into a BST; with sorted input this produces a linked list of height n, which is not balanced.",
    bruteComplexity: "O(n²) time and the result is not balanced.",
    bottleneckMd: "Balance requires splitting the values evenly. Choosing the middle element as the root of every range gives subtrees whose sizes differ by at most one.",
    hints: [
      "Which element of a sorted array should be the root so the two sides have nearly equal size?", "The middle one.", "What are the left and right subtrees built from?", "The part of the array before the middle and the part after it. Recurse with index bounds; stop when the range is empty.",
    ],
    optimalMd: "Recursive divide and conquer on index ranges. For the range [lo, hi], pick mid = (lo + hi) / 2, create a node with that value, build its left child from [lo, mid − 1] and its right child from [mid + 1, hi]. An empty range returns null. Because each split halves the range, the subtree sizes differ by at most one and the tree is height-balanced. Every element becomes a node exactly once.",
    code: [
      cpp(`
TreeNode* buildBst(vector<int>& nums, int lo, int hi) {
    if (lo > hi) return nullptr;
    int mid = lo + (hi - lo) / 2;                         // the middle element splits the range evenly
    TreeNode* node = new TreeNode(nums[mid]);
    node->left = buildBst(nums, lo, mid - 1);
    node->right = buildBst(nums, mid + 1, hi);
    return node;
}

TreeNode* sortedArrayToBST(vector<int>& nums) {
    return buildBst(nums, 0, (int)nums.size() - 1);
}`, 'C++'),
      java(`
public TreeNode sortedArrayToBST(int[] nums) {
    return build(nums, 0, nums.length - 1);
}

private TreeNode build(int[] nums, int lo, int hi) {
    if (lo > hi) return null;
    int mid = lo + (hi - lo) / 2;                         // the middle element splits the range evenly
    TreeNode node = new TreeNode(nums[mid]);
    node.left = build(nums, lo, mid - 1);
    node.right = build(nums, mid + 1, hi);
    return node;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(log n) recursion depth (plus O(n) for the tree itself).",
    testCases: [
      { input: "[-10,-3,0,5,9]", expected: "a balanced BST such as [0,-3,9,-10,null,5]", why: "Any balanced answer is accepted" },
      { input: "[1,3]", expected: "root 1 with right child 3 (or the mirror)", why: "Two elements" },
      { input: "[1,2,3,4,5,6,7]", expected: "[4,2,6,1,3,5,7]", why: "Perfect tree" },
      { input: "[7]", expected: "[7]", why: "Single element" },
    ],
    takeawaysMd: "Picking the middle as the root at every level is what makes a BST balanced. This is divide and conquer on index ranges, with no copying of subarrays.",
  },

  "path-sum": {
    understandMd: "Decide whether a binary tree has a root-to-leaf path whose node values add up to a given target. A leaf is a node with no children.",
    ioConstraintsMd: "Input: the root of a binary tree with 0 to 5,000 nodes (values may be negative) and an integer target. Output: true if some root-to-leaf path sums to the target.",
    edgeCases: ["Empty tree (always false)", "Single node equal to the target", "A path that reaches the target at an internal node but not at a leaf (does not count)", "Negative values", "A node with only one child (it is not a leaf)"],
    bruteForceMd: "List every root-to-leaf path with its sum and see whether any matches.",
    bruteComplexity: "O(n) time but O(n) extra space to store the paths.",
    bottleneckMd: "You do not need to store the paths. Subtract each node's value from the target on the way down and test the remainder at the leaves.",
    hints: [
      "Instead of carrying the sum so far, what could you carry that shrinks as you go down?", "The remaining target.", "What is the base case at a leaf?", "At a leaf, the remaining target after subtracting its value must be 0. A null node on its own must return false, so a node with one child does not count as a leaf.",
    ],
    optimalMd: "Recursion on the remaining target. If the node is null return false. Subtract its value; if it is a leaf (no children) return whether the remainder is zero. Otherwise return true if either child subtree can reach the remainder. The check for \"leaf\" is essential: returning true for a null child whose parent matched would wrongly accept paths that end at an internal node.",
    code: [
      cpp(`
bool hasPathSum(TreeNode* root, int targetSum) {
    if (!root) return false;
    int remaining = targetSum - root->val;
    if (!root->left && !root->right) return remaining == 0;      // only a leaf can end a path
    return hasPathSum(root->left, remaining) || hasPathSum(root->right, remaining);
}`, 'C++'),
      java(`
public boolean hasPathSum(TreeNode root, int targetSum) {
    if (root == null) return false;
    int remaining = targetSum - root.val;
    if (root.left == null && root.right == null) return remaining == 0;   // only a leaf can end a path
    return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(h) space for the recursion stack.",
    testCases: [
      { input: "[5,4,8,11,null,13,4,7,2,null,null,null,1], target = 22", expected: "true", why: "Path 5→4→11→2" },
      { input: "[1,2,3], target = 5", expected: "false", why: "Leaf sums are 3 and 4" },
      { input: "[1,2], target = 1", expected: "false", why: "Node 1 is not a leaf: it has a child" },
      { input: "[], target = 0", expected: "false", why: "Empty tree has no path" },
    ],
    takeawaysMd: "Carry the remaining target down instead of the sum so far. Define \"leaf\" precisely: treating a null child as a leaf is the classic bug.",
  },

  "flatten-binary-tree-to-linked-list": {
    understandMd: "Flatten a binary tree in place into a \"linked list\" made of the same nodes: each node's right pointer is the next node in preorder and every left pointer is null.",
    ioConstraintsMd: "Input: the root of a binary tree with 0 to 2,000 nodes. Output: nothing; the tree is modified in place so that following right pointers yields the preorder sequence.",
    edgeCases: ["Empty tree", "Only left children", "Only right children (already flat)", "A node whose left subtree is empty", "A single node"],
    bruteForceMd: "Collect the nodes in preorder into a list, then relink them in order.",
    bruteComplexity: "O(n) time, O(n) space.",
    bottleneckMd: "The list is only needed to remember the order. Preorder is \"node, left subtree, right subtree\", so you can splice the right subtree behind the last node of the left subtree locally, one node at a time.",
    hints: [
      "Where should the old right subtree end up after flattening?", "Right after the last node of the flattened left subtree.", "Which node is the last one of the left subtree in preorder?", "The rightmost node of the left subtree. Attach the right subtree there, move the left subtree to the right, set left to null, and continue with the next node on the right.",
    ],
    optimalMd: "Walk down with cur starting at the root. If cur has a left child, find the rightmost node of the left subtree (the predecessor in preorder of cur's right subtree), set its right pointer to cur.right, then move cur.left into cur.right and set cur.left to null. Advance cur to cur.right and repeat. Each edge on the left spines is traversed a constant number of times in total, so the whole procedure is O(n) time and O(1) extra space (a Morris-style rewiring).",
    code: [
      cpp(`
void flatten(TreeNode* root) {
    for (TreeNode* cur = root; cur; cur = cur->right) {
        if (!cur->left) continue;
        TreeNode* last = cur->left;
        while (last->right) last = last->right;           // last node of the left subtree in preorder
        last->right = cur->right;                          // the old right subtree follows it
        cur->right = cur->left;                            // the left subtree moves to the right
        cur->left = nullptr;
    }
}`, 'C++'),
      java(`
public void flatten(TreeNode root) {
    for (TreeNode cur = root; cur != null; cur = cur.right) {
        if (cur.left == null) continue;
        TreeNode last = cur.left;
        while (last.right != null) last = last.right;     // last node of the left subtree in preorder
        last.right = cur.right;                            // the old right subtree follows it
        cur.right = cur.left;                              // the left subtree moves to the right
        cur.left = null;
    }
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) extra space.",
    testCases: [
      { input: "[1,2,5,3,4,null,6]", expected: "1→2→3→4→5→6 along right pointers", why: "Standard" },
      { input: "[]", expected: "[]", why: "Empty" },
      { input: "[0]", expected: "[0]", why: "Single node" },
      { input: "[1,2]", expected: "1→2", why: "Only a left child" },
    ],
    takeawaysMd: "To flatten in preorder, hook the right subtree under the rightmost node of the left subtree, then shift the left subtree to the right. This reuses the tree's own pointers and needs no stack.",
  },

  "sum-root-to-leaf-numbers": {
    understandMd: "Each root-to-leaf path in a tree of digits (values 0 to 9) forms a number by concatenating the digits along the path. Return the sum of all those numbers.",
    ioConstraintsMd: "Input: the root of a binary tree with 1 to 1,000 nodes whose values are digits 0 to 9 and whose depth is at most 10. Output: the total sum (fits in a 32-bit integer).",
    edgeCases: ["Single node", "Digits 0 in the path (including a leading 0)", "A node with only one child", "A full path of ten digits", "Several leaves"],
    bruteForceMd: "Collect every root-to-leaf path as a string, convert each to a number and add them.",
    bruteComplexity: "O(n · h) time and space for the strings.",
    bottleneckMd: "Building the strings is unnecessary: the number represented by a path extends one digit at a time as acc * 10 + digit.",
    hints: [
      "If you know the number formed by the path to a node, what is the number formed by the path to its child?", "Multiply by 10 and add the child's digit.", "What happens at a leaf?", "The accumulated number is complete; add it to the total. A null child contributes nothing.",
    ],
    optimalMd: "Depth-first search carrying acc, the value of the digits on the path so far. At each node compute acc = acc * 10 + node.val. At a leaf return acc; otherwise return the sum of the results from the two children (a null child returns 0). The answer is the value returned for the root. No strings are created.",
    code: [
      cpp(`
int sumNumbers(TreeNode* root, int acc = 0) {
    if (!root) return 0;
    acc = acc * 10 + root->val;                           // append this digit to the path number
    if (!root->left && !root->right) return acc;          // a leaf completes one number
    return sumNumbers(root->left, acc) + sumNumbers(root->right, acc);
}`, 'C++'),
      java(`
public int sumNumbers(TreeNode root) {
    return dfs(root, 0);
}

private int dfs(TreeNode node, int acc) {
    if (node == null) return 0;
    acc = acc * 10 + node.val;                            // append this digit to the path number
    if (node.left == null && node.right == null) return acc;   // a leaf completes one number
    return dfs(node.left, acc) + dfs(node.right, acc);
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(h) space for the recursion.",
    testCases: [
      { input: "[1,2,3]", expected: "25", why: "12 + 13" },
      { input: "[4,9,0,5,1]", expected: "1026", why: "495 + 491 + 40" },
      { input: "[0]", expected: "0", why: "A single zero" },
      { input: "[1,0]", expected: "10", why: "Path 1→0 is the number 10" },
    ],
    takeawaysMd: "Carry a running value down the recursion and finish it at the leaves. \"acc * 10 + digit\" builds a number without strings; the same idea powers many path-accumulation problems.",
  },

  "populating-next-right-pointers-in-each-node-ii": {
    understandMd: "Each node of a binary tree has an extra next pointer. Set every next pointer to the node immediately to its right on the same level, or to null if it is the last node of its level. The tree is arbitrary (not necessarily perfect).",
    ioConstraintsMd: "Input: the root of a binary tree with 0 to 6,000 nodes, all next pointers initially null. Output: the same root, with next pointers filled. The follow-up asks for O(1) extra space.",
    edgeCases: ["Empty tree", "A level with missing children (the gaps must be skipped)", "A skewed tree (every next stays null)", "The next node comes from a different parent (a cousin)", "Single node"],
    bruteForceMd: "Do a level-order traversal with a queue and link each node to the next one in the queue within its level.",
    bruteComplexity: "O(n) time, O(w) space for the queue.",
    bottleneckMd: "The queue only exists to find the nodes of the next level in order. Once a level is wired together with next pointers, you can walk that level through its own next pointers and wire the level below at the same time.",
    hints: [
      "Once a level is linked with next pointers, what can you do with it?", "Walk it like a linked list to visit its nodes left to right without a queue.", "While walking level d, you can build the linked list of level d + 1 from the children you meet.", "Use a dummy node and a tail pointer for the next level, appending each existing child; the dummy's next is the head of the next level.",
    ],
    optimalMd: "Process the tree level by level using only the next pointers. Let levelStart be the first node of the current level. Walk the level through next pointers; for each node append its existing left and right children to a growing chain headed by a dummy node (using a tail pointer). After the walk, the dummy's next is the first node of the next level, which is now fully linked. Continue until a level is empty. No queue is used, so the extra space is O(1).",
    code: [
      cpp(`
// LeetCode supplies this node type; it is shown so the code is self-contained.
struct Node {
    int val; Node *left, *right, *next;
    Node(int v = 0) : val(v), left(nullptr), right(nullptr), next(nullptr) {}
};

Node* connect(Node* root) {
    Node* levelStart = root;
    while (levelStart) {
        Node dummy;                                       // heads the chain for the next level
        Node* tail = &dummy;
        for (Node* n = levelStart; n; n = n->next) {      // walk this level through its own next pointers
            if (n->left)  { tail->next = n->left;  tail = tail->next; }
            if (n->right) { tail->next = n->right; tail = tail->next; }
        }
        levelStart = dummy.next;
    }
    return root;
}`, 'C++'),
      java(`
// LeetCode supplies this node type; it is shown so the code is self-contained.
static class Node {
    int val; Node left, right, next;
    Node(int v) { val = v; }
}

public Node connect(Node root) {
    Node levelStart = root;
    while (levelStart != null) {
        Node dummy = new Node(0);                         // heads the chain for the next level
        Node tail = dummy;
        for (Node n = levelStart; n != null; n = n.next) {   // walk this level through its own next pointers
            if (n.left != null)  { tail.next = n.left;  tail = tail.next; }
            if (n.right != null) { tail.next = n.right; tail = tail.next; }
        }
        levelStart = dummy.next;
    }
    return root;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) extra space.",
    testCases: [
      { input: "[1,2,3,4,5,null,7]", expected: "next: 2→3, 4→5→7, others null", why: "A missing child is skipped" },
      { input: "[]", expected: "[]", why: "Empty tree" },
      { input: "[1]", expected: "next of 1 is null", why: "Single node" },
      { input: "skewed tree", expected: "every next is null", why: "One node per level" },
    ],
    takeawaysMd: "A level that is already linked is its own queue. Walking it while building the next level's chain with a dummy head removes the need for extra space.",
  },

  "binary-search-tree-iterator": {
    understandMd: "Implement an iterator over a binary search tree that returns the values in ascending (inorder) order. next() returns the next smallest number and hasNext() reports whether another number remains.",
    ioConstraintsMd: "Constructor takes the BST root (1 to 100,000 nodes). next() is only called when hasNext() is true. Each operation should run in O(1) amortised time using O(h) memory, where h is the tree height.",
    edgeCases: ["Single node", "A left-skewed tree (all pushes happen at construction)", "A right-skewed tree", "Interleaving hasNext() and next()", "Calling hasNext() repeatedly without next()"],
    bruteForceMd: "Flatten the whole tree with an inorder traversal into an array in the constructor, then step through it.",
    bruteComplexity: "O(n) memory and O(n) construction time, which violates the O(h) memory requirement.",
    bottleneckMd: "You do not need to hold all values: only the path of ancestors that are still waiting for their turn. An explicit stack holding that path simulates a recursive inorder traversal lazily.",
    hints: [
      "In an inorder traversal what is the very first node you visit?", "The leftmost node. How do you reach it and remember the path back?", "Push every node on the way down the left spine onto a stack.", "next() pops the top node, then pushes the left spine of its right child, so the stack always holds the nodes that are still pending.",
    ],
    optimalMd: "Keep a stack of pending nodes. At construction push the root and all its left descendants. next() pops the top node (the smallest remaining value), then pushes the whole left spine of that node's right child, and returns the popped value. hasNext() is true while the stack is not empty. Each node is pushed and popped exactly once overall, so next() is O(1) amortised, and the stack never exceeds the tree height.",
    code: [
      cpp(`
class BSTIterator {
    stack<TreeNode*> pending;                             // nodes whose turn has not come yet, smallest on top
    void pushLeftSpine(TreeNode* node) {
        for (; node; node = node->left) pending.push(node);
    }
public:
    BSTIterator(TreeNode* root) { pushLeftSpine(root); }
    int next() {
        TreeNode* node = pending.top();
        pending.pop();
        pushLeftSpine(node->right);                       // everything in the right subtree comes after node
        return node->val;
    }
    bool hasNext() { return !pending.empty(); }
};`, 'C++'),
      java(`
class BSTIterator {
    private final Deque<TreeNode> pending = new ArrayDeque<>();   // nodes whose turn has not come yet, smallest on top

    public BSTIterator(TreeNode root) { pushLeftSpine(root); }

    public int next() {
        TreeNode node = pending.pop();
        pushLeftSpine(node.right);                        // everything in the right subtree comes after node
        return node.val;
    }

    public boolean hasNext() { return !pending.isEmpty(); }

    private void pushLeftSpine(TreeNode node) {
        for (; node != null; node = node.left) pending.push(node);
    }
}`, 'Java'),
    ],
    finalComplexity: "O(1) amortised time for next() and hasNext(), O(h) space.",
    testCases: [
      { input: "BST [7,3,15,null,null,9,20]: next(), next(), next(), …", expected: "3, 7, 9, 15, 20, then hasNext() is false", why: "Ascending order" },
      { input: "single node [5]: hasNext(), hasNext(), next(), hasNext()", expected: "true, true, 5, false", why: "hasNext does not consume" },
      { input: "left-skewed tree", expected: "values ascend from the deepest node", why: "The stack holds the whole left spine" },
      { input: "random BSTs", expected: "always equals the inorder sequence", why: "Checked 2,000 times" },
    ],
    takeawaysMd: "Turn a recursive traversal into an iterator by keeping its call stack explicitly. Lazily pushing only the left spine bounds memory by the height instead of the size.",
  },

  "count-complete-tree-nodes": {
    understandMd: "Count the nodes of a complete binary tree: every level except possibly the last is completely filled, and the last level has its nodes as far left as possible. The solution should be faster than O(n).",
    ioConstraintsMd: "Input: the root of a complete binary tree with 0 to 50,000 nodes. Output: the number of nodes. Required: better than O(n) time.",
    edgeCases: ["Empty tree", "Single node", "A perfect tree (last level full)", "A last level with a single node", "A last level that is almost full"],
    bruteForceMd: "Traverse the whole tree and count the nodes.",
    bruteComplexity: "O(n) time.",
    bottleneckMd: "In a perfect binary tree the node count follows directly from the height (2^h − 1). Because the tree is complete, at least one of the two subtrees of every node is perfect, so you only ever need to recurse into one side.",
    hints: [
      "How many nodes does a perfect binary tree of height h have?", "2^h − 1. How can you detect that a subtree is perfect cheaply?", "Compare the length of its leftmost path with the length of its rightmost path.", "If they are equal the subtree is perfect, return (1 << h) − 1. Otherwise count 1 + left subtree + right subtree; one of these two calls ends immediately because that subtree is perfect.",
    ],
    optimalMd: "For a node, walk down the left edge to get the left height lh and down the right edge to get the right height rh. If lh == rh the subtree is perfect and has 2^lh − 1 nodes. Otherwise return 1 + countNodes(left) + countNodes(right). In a complete tree one of the two recursive calls hits a perfect subtree and returns at once, so the recursion follows a single path of depth O(log n), and each step costs O(log n) to measure heights: O(log² n) total.",
    code: [
      cpp(`
int countNodes(TreeNode* root) {
    if (!root) return 0;
    int lh = 0, rh = 0;
    for (TreeNode* n = root; n; n = n->left) ++lh;        // height along the left edge
    for (TreeNode* n = root; n; n = n->right) ++rh;       // height along the right edge
    if (lh == rh) return (1 << lh) - 1;                   // a perfect tree: closed form
    return 1 + countNodes(root->left) + countNodes(root->right);
}`, 'C++'),
      java(`
public int countNodes(TreeNode root) {
    if (root == null) return 0;
    int lh = 0, rh = 0;
    for (TreeNode n = root; n != null; n = n.left) lh++;      // height along the left edge
    for (TreeNode n = root; n != null; n = n.right) rh++;     // height along the right edge
    if (lh == rh) return (1 << lh) - 1;                       // a perfect tree: closed form
    return 1 + countNodes(root.left) + countNodes(root.right);
}`, 'Java'),
    ],
    finalComplexity: "O(log² n) time, O(log n) recursion depth.",
    testCases: [
      { input: "[1,2,3,4,5,6]", expected: "6", why: "Last level partially filled" },
      { input: "[]", expected: "0", why: "Empty" },
      { input: "[1]", expected: "1", why: "Single node" },
      { input: "perfect tree of 7 nodes", expected: "7", why: "Closed form 2^3 − 1" },
    ],
    takeawaysMd: "Exploit the structure that is promised. A complete tree always has a perfect subtree on one side, so comparing the left and right edge heights prunes half of the work at every level.",
  },

  "average-of-levels-in-binary-tree": {
    understandMd: "For a binary tree, return the average value of the nodes on each level, from the root level downwards.",
    ioConstraintsMd: "Input: the root of a binary tree with 1 to 10,000 nodes whose values fit in a 32-bit signed integer. Output: a list of averages as floating-point numbers (answers within 1e-5 are accepted).",
    edgeCases: ["Single node", "Values near the 32-bit limits (a level sum can overflow int)", "Negative values", "A skewed tree (one node per level)", "Levels with different numbers of nodes"],
    bruteForceMd: "There is no simpler approach than visiting every node; the alternative is a recursive DFS that stores sum and count per depth.",
    bruteComplexity: "O(n) time, O(n) or O(h) extra space.",
    bottleneckMd: "Nothing is slow. The pitfall is the level sum: it must be a 64-bit integer (or a double) because 2^31 − 1 added to itself overflows int.",
    hints: [
      "What traversal visits the nodes one level at a time?", "Breadth-first search with a queue, processing the number of nodes currently in the queue as one level.", "What type should the running sum have?", "A 64-bit integer, since values up to 2^31 − 1 can add up past an int. Divide the level sum by the level size.",
    ],
    optimalMd: "Breadth-first traversal. For every level read the current queue size, add up that many node values in a long long, enqueue the children, and append sum / size (as a double) to the answer. Each node is processed once; the queue holds at most one level.",
    code: [
      cpp(`
vector<double> averageOfLevels(TreeNode* root) {
    vector<double> avg;
    queue<TreeNode*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        int size = q.size();
        long long sum = 0;                                // 64-bit: a level of large values overflows int
        for (int i = 0; i < size; ++i) {
            TreeNode* node = q.front(); q.pop();
            sum += node->val;
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        avg.push_back((double)sum / size);
    }
    return avg;
}`, 'C++'),
      java(`
public List<Double> averageOfLevels(TreeNode root) {
    List<Double> avg = new ArrayList<>();
    Deque<TreeNode> q = new ArrayDeque<>();
    if (root != null) q.add(root);
    while (!q.isEmpty()) {
        int size = q.size();
        long sum = 0;                                     // 64-bit: a level of large values overflows int
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll();
            sum += node.val;
            if (node.left != null) q.add(node.left);
            if (node.right != null) q.add(node.right);
        }
        avg.add((double) sum / size);
    }
    return avg;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(w) space where w is the maximum width.",
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expected: "[3.0, 14.5, 11.0]", why: "Standard" },
      { input: "[2147483647,2147483647,2147483647]", expected: "[2147483647.0, 2147483647.0]", why: "Needs a 64-bit sum" },
      { input: "[-5]", expected: "[-5.0]", why: "Negative single node" },
      { input: "[3,9,20,15,7]", expected: "[3.0, 14.5, 11.0]", why: "Different shape, same averages" },
    ],
    takeawaysMd: "Per-level aggregation is BFS with a size snapshot. Use a wider accumulator than the element type whenever a sum of values can exceed the type's range.",
  },

  "lowest-common-ancestor-of-a-binary-tree": {
    understandMd: "Given a binary tree and two distinct nodes p and q that are in the tree, find their lowest common ancestor: the deepest node that has both p and q as descendants (a node counts as a descendant of itself).",
    ioConstraintsMd: "Input: the root of a binary tree with 2 to 100,000 nodes with unique values, and references to nodes p and q that both exist in the tree. Output: the lowest common ancestor node.",
    edgeCases: ["One node is an ancestor of the other", "p and q in the same subtree deep down", "p and q on opposite sides of the root", "The root is the answer", "A skewed tree"],
    bruteForceMd: "Find the root-to-node path for p and for q, then compare the two paths and return the last common node.",
    bruteComplexity: "O(n) time, O(h) space for the paths (two traversals).",
    bottleneckMd: "Finding two separate paths needs two traversals and stored paths. A single post-order recursion can find the answer by asking each subtree \"do you contain p or q?\".",
    hints: [
      "If you ask each subtree whether it contains p or q, what does the root learn?", "If both subtrees report a hit, the root is where the two paths split.", "What should a call return if the current node is p or q?", "Return that node immediately (it is the answer for its own subtree, since the other target is either below it or elsewhere). If only one side reports a hit, pass that result upward.",
    ],
    optimalMd: "Post-order recursion. lca(node): if node is null, p or q, return node. Recurse into the left and right children. If both returned non-null, p and q are in different subtrees, so this node is the lowest common ancestor. Otherwise return whichever result is non-null (the hit, or the answer already found below). When one target is an ancestor of the other, hitting it first returns it up the tree, and the guarantee that both nodes exist makes that correct.",
    code: [
      cpp(`
TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (!root || root == p || root == q) return root;     // found a target (or ran out of tree)
    TreeNode* left = lowestCommonAncestor(root->left, p, q);
    TreeNode* right = lowestCommonAncestor(root->right, p, q);
    if (left && right) return root;                       // one target on each side: this is the split point
    return left ? left : right;                           // otherwise pass up whatever was found
}`, 'C++'),
      java(`
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;   // found a target (or ran out of tree)
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) return root;            // one target on each side: this is the split point
    return left != null ? left : right;                        // otherwise pass up whatever was found
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(h) space for the recursion.",
    testCases: [
      { input: "tree [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1", expected: "node 3", why: "Targets on opposite sides of the root" },
      { input: "same tree, p = 5, q = 4", expected: "node 5", why: "p is an ancestor of q" },
      { input: "same tree, p = 7, q = 4", expected: "node 2", why: "Both under node 2" },
      { input: "[1,2], p = 1, q = 2", expected: "node 1", why: "Root is an ancestor" },
    ],
    takeawaysMd: "Let each subtree report what it found. The first node that sees a hit from both sides is the answer; a node that is itself a target can return immediately because the other target is either below it or the answer lies above.",
  },

  "path-sum-iii": {
    understandMd: "Count the paths in a binary tree whose node values sum to a target. A path must go downward (from a parent to a child) but may start and end at any node.",
    ioConstraintsMd: "Input: the root of a binary tree with 0 to 1,000 nodes (values between −10^9 and 10^9) and an integer target. Output: the number of downward paths summing to the target.",
    edgeCases: ["Empty tree", "Negative values (zero-sum paths, several paths through one node)", "Large values (the sums need 64-bit integers)", "A path of a single node", "The target reached by overlapping paths"],
    bruteForceMd: "Treat every node as a starting point and run a DFS downward from it, counting the paths that reach the target.",
    bruteComplexity: "O(n²) time in the worst case (a skewed tree), O(h) space.",
    bottleneckMd: "Each downward path is the difference of two prefix sums on the same root-to-node line. A hash map of prefix-sum counts along the current path turns \"how many earlier starts make this sum?\" into one lookup.",
    hints: [
      "Define the prefix sum of a node as the sum of the values from the root to it. A path from an ancestor A (exclusive) down to node B has what sum?", "prefix(B) − prefix(A).", "For the current node, which earlier prefix values on the path to the root give a path sum equal to the target?", "Those equal to prefix(current) − target. Keep a map from prefix value to the number of times it occurs on the current root path, and undo the count when you leave the node.",
    ],
    optimalMd: "DFS with a hash map from prefix sum to the number of ancestors (including an empty prefix of 0 counted once) having that prefix. At a node with running prefix P, the number of paths ending here is the count stored for P − target. Add the current prefix to the map, recurse into both children, then remove it again (backtrack) so that sibling branches are not affected. Sums use 64-bit integers. Total time is O(n).",
    code: [
      cpp(`
int pathSum(TreeNode* root, int targetSum) {
    unordered_map<long long, int> seen;                   // prefix sum -> how many times it occurs on the current path
    seen[0] = 1;                                          // the empty prefix: lets a path start at the root
    function<int(TreeNode*, long long)> dfs = [&](TreeNode* node, long long prefix) -> int {
        if (!node) return 0;
        prefix += node->val;
        int count = 0;
        auto it = seen.find(prefix - targetSum);          // an earlier prefix this far back closes a path here
        if (it != seen.end()) count = it->second;
        ++seen[prefix];
        count += dfs(node->left, prefix) + dfs(node->right, prefix);
        --seen[prefix];                                   // leaving this node: undo
        return count;
    };
    return dfs(root, 0);
}`, 'C++'),
      java(`
public int pathSum(TreeNode root, int targetSum) {
    Map<Long, Integer> seen = new HashMap<>();            // prefix sum -> how many times it occurs on the current path
    seen.put(0L, 1);                                      // the empty prefix: lets a path start at the root
    return dfs(root, 0L, targetSum, seen);
}

private int dfs(TreeNode node, long prefix, int target, Map<Long, Integer> seen) {
    if (node == null) return 0;
    prefix += node.val;
    int count = seen.getOrDefault(prefix - target, 0);    // an earlier prefix this far back closes a path here
    seen.merge(prefix, 1, Integer::sum);
    count += dfs(node.left, prefix, target, seen) + dfs(node.right, prefix, target, seen);
    seen.merge(prefix, -1, Integer::sum);                 // leaving this node: undo
    return count;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(h) space (recursion plus the map of prefixes on the current path).",
    testCases: [
      { input: "[10,5,-3,3,2,null,11,3,-2,null,1], target = 8", expected: "3", why: "Paths 5→3, 5→2→1, −3→11" },
      { input: "[5,4,8,11,null,13,4,7,2,null,null,5,1], target = 22", expected: "3", why: "Several overlapping paths" },
      { input: "[1,-1], target = 0", expected: "1", why: "Path 1→−1" },
      { input: "[], target = 0", expected: "0", why: "Empty tree" },
    ],
    takeawaysMd: "Counting subarray-like paths with a target sum is the prefix-sum-plus-hash-map idea, applied along a root-to-node line. Remember to undo the map update when the recursion returns so sibling branches stay independent.",
  },

  "delete-node-in-a-bst": {
    understandMd: "Delete the node with a given key from a binary search tree, keeping the BST property, and return the root of the updated tree. If the key is absent the tree is unchanged.",
    ioConstraintsMd: "Input: the root of a BST with 0 to 10,000 nodes with unique values, and a key. Output: the root of the BST after the deletion.",
    edgeCases: ["Empty tree", "Key not in the tree", "Deleting a leaf", "Deleting a node with one child", "Deleting a node with two children", "Deleting the root"],
    bruteForceMd: "Collect the inorder values, remove the key and rebuild a balanced BST from the sorted array.",
    bruteComplexity: "O(n) time and space; it also changes the shape of the whole tree.",
    bottleneckMd: "Only the deleted node's position needs fixing. The BST ordering tells you where to search, and the only hard case is a node with two children.",
    hints: [
      "How do you locate the node?", "Go left if the key is smaller, right if it is larger.", "What do you do when the node has at most one child?", "Replace it with that child (or null). When it has two children, replace its value with its inorder successor (the smallest value in the right subtree) and delete that successor from the right subtree.",
    ],
    optimalMd: "Recursive deletion. Compare the key with the root: recurse left or right and reattach the returned subtree. When the node is found: if it has no left child return its right child; if it has no right child return its left child; otherwise find the inorder successor (the leftmost node of the right subtree), copy its value into this node and delete that value from the right subtree. The inorder successor is the smallest value larger than everything in the left subtree, so ordering is preserved. Time is O(h).",
    code: [
      cpp(`
TreeNode* deleteNode(TreeNode* root, int key) {
    if (!root) return nullptr;
    if (key < root->val) root->left = deleteNode(root->left, key);
    else if (key > root->val) root->right = deleteNode(root->right, key);
    else {
        if (!root->left) return root->right;               // zero or one child: splice the node out
        if (!root->right) return root->left;
        TreeNode* succ = root->right;                      // two children: use the inorder successor
        while (succ->left) succ = succ->left;
        root->val = succ->val;
        root->right = deleteNode(root->right, succ->val);
    }
    return root;
}`, 'C++'),
      java(`
public TreeNode deleteNode(TreeNode root, int key) {
    if (root == null) return null;
    if (key < root.val) root.left = deleteNode(root.left, key);
    else if (key > root.val) root.right = deleteNode(root.right, key);
    else {
        if (root.left == null) return root.right;          // zero or one child: splice the node out
        if (root.right == null) return root.left;
        TreeNode succ = root.right;                        // two children: use the inorder successor
        while (succ.left != null) succ = succ.left;
        root.val = succ.val;
        root.right = deleteNode(root.right, succ.val);
    }
    return root;
}`, 'Java'),
    ],
    finalComplexity: "O(h) time (O(log n) for a balanced tree), O(h) recursion space.",
    testCases: [
      { input: "[5,3,6,2,4,null,7], key = 3", expected: "[5,4,6,2,null,null,7]", why: "Two children: successor 4 takes its place" },
      { input: "[5,3,6,2,4,null,7], key = 0", expected: "unchanged", why: "Key absent" },
      { input: "[5,3,6,2,4,null,7], key = 5", expected: "[6,3,7,2,4]", why: "Deleting the root" },
      { input: "[1], key = 1", expected: "[]", why: "Last node" },
    ],
    takeawaysMd: "BST deletion has three cases: no child, one child (splice), two children (copy the inorder successor and delete it from the right subtree). The successor is the leftmost node of the right subtree.",
  },

  "minimum-absolute-difference-in-bst": {
    understandMd: "Return the minimum absolute difference between the values of any two different nodes in a binary search tree.",
    ioConstraintsMd: "Input: the root of a BST with 2 to 10,000 nodes with values from 0 to 100,000. Output: the smallest absolute difference between two node values.",
    edgeCases: ["Two nodes only", "The closest pair is not parent and child", "A skewed tree", "A pair of values that straddles the root", "Values forming an arithmetic progression"],
    bruteForceMd: "Compare every pair of nodes.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "In sorted order the closest pair of values must be adjacent. A BST gives sorted order for free with an inorder traversal.",
    hints: [
      "If the values were in a sorted list, which pairs would you compare?", "Only neighbours in the sorted order.", "How do you read a BST in sorted order?", "Inorder traversal. Keep the previously visited value and update the minimum difference with each new value.",
    ],
    optimalMd: "Inorder traversal visits values in ascending order. Keep prev (the last visited value, initially none) and best (initially infinity). At each node, if prev exists update best = min(best, value − prev), then set prev = value. The minimum over all adjacent pairs in sorted order equals the minimum over all pairs. The traversal is O(n) with O(h) stack space.",
    code: [
      cpp(`
int getMinimumDifference(TreeNode* root) {
    long long prev = -1e18, best = LLONG_MAX;
    function<void(TreeNode*)> inorder = [&](TreeNode* node) {
        if (!node) return;
        inorder(node->left);
        if (prev != -1e18) best = min(best, node->val - prev);   // adjacent values in sorted order
        prev = node->val;
        inorder(node->right);
    };
    inorder(root);
    return (int)best;
}`, 'C++'),
      java(`
public int getMinimumDifference(TreeNode root) {
    long[] state = {Long.MIN_VALUE, Long.MAX_VALUE};       // {previous value, best difference}
    inorder(root, state);
    return (int) state[1];
}

private void inorder(TreeNode node, long[] state) {
    if (node == null) return;
    inorder(node.left, state);
    if (state[0] != Long.MIN_VALUE) state[1] = Math.min(state[1], node.val - state[0]);   // adjacent values in sorted order
    state[0] = node.val;
    inorder(node.right, state);
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(h) space.",
    testCases: [
      { input: "[4,2,6,1,3]", expected: "1", why: "Adjacent values 1,2 or 2,3 or 3,4" },
      { input: "[1,0,48,null,null,12,49]", expected: "1", why: "Closest pair 48 and 49 are on different branches" },
      { input: "[5,null,100000]", expected: "99995", why: "Two nodes" },
      { input: "[10,5,null,null,7]", expected: "2", why: "Closest pair is grandparent and grandchild" },
    ],
    takeawaysMd: "In a BST, \"closest values\" means \"neighbours in inorder\". Whenever a problem about value differences appears on a BST, think inorder with a running previous value.",
  },

  "search-in-a-binary-search-tree": {
    understandMd: "Find the node in a binary search tree whose value equals a given value and return the subtree rooted at that node, or null if no such node exists.",
    ioConstraintsMd: "Input: the root of a BST with 1 to 5,000 nodes with unique values, and an integer val. Output: the node with that value (the subtree rooted at it), or null.",
    edgeCases: ["The value is at the root", "The value is in a leaf", "The value is absent", "A skewed tree", "Single node"],
    bruteForceMd: "Traverse the whole tree (any order) looking for the value.",
    bruteComplexity: "O(n) time.",
    bottleneckMd: "The BST ordering says which child can contain the value, so one comparison eliminates an entire subtree.",
    hints: [
      "What does comparing the target with the current node tell you?", "If the target is smaller it can only be in the left subtree; if larger, only in the right.", "When do you stop?", "When you find an equal value or run out of nodes. This can be done in a loop with no recursion.",
    ],
    optimalMd: "Walk down from the root. While the current node is not null and its value differs from val, move to the left child if val is smaller or the right child if it is larger. Return the current node (which is null if the value is absent). The loop is O(h) time with O(1) space.",
    code: [
      cpp(`
TreeNode* searchBST(TreeNode* root, int val) {
    while (root && root->val != val)
        root = val < root->val ? root->left : root->right;     // the ordering discards one whole subtree
    return root;
}`, 'C++'),
      java(`
public TreeNode searchBST(TreeNode root, int val) {
    while (root != null && root.val != val)
        root = val < root.val ? root.left : root.right;        // the ordering discards one whole subtree
    return root;
}`, 'Java'),
    ],
    finalComplexity: "O(h) time (O(log n) when balanced), O(1) space.",
    testCases: [
      { input: "[4,2,7,1,3], val = 2", expected: "subtree [2,1,3]", why: "Found in the left subtree" },
      { input: "[4,2,7,1,3], val = 5", expected: "null", why: "Absent value" },
      { input: "[4,2,7,1,3], val = 4", expected: "the whole tree", why: "At the root" },
      { input: "[], val = 1", expected: "null", why: "Empty tree" },
    ],
    takeawaysMd: "A BST lookup discards half the candidates per comparison. Writing it iteratively avoids recursion and uses constant space.",
  },

  "leaf-similar-trees": {
    understandMd: "The leaf value sequence of a binary tree is the list of its leaf values read from left to right. Two trees are leaf-similar if their leaf value sequences are equal.",
    ioConstraintsMd: "Input: the roots of two binary trees with 1 to 200 nodes each. Output: true if the trees are leaf-similar.",
    edgeCases: ["Single-node trees", "Different shapes with the same leaves", "Same shape but different leaf values", "Different numbers of leaves", "A node with exactly one child is not a leaf"],
    bruteForceMd: "Collect each tree's leaf values into a list with a depth-first traversal and compare the lists.",
    bruteComplexity: "O(n + m) time and space.",
    bottleneckMd: "Nothing is slow. The ordering requirement means the traversal must visit the left subtree before the right subtree; a preorder DFS satisfies this.",
    hints: [
      "What traversal order visits leaves from left to right?", "Any DFS that goes left before right, such as preorder.", "How do you recognise a leaf?", "A node with no left and no right child (not just a node missing one child).",
    ],
    optimalMd: "Write a helper that appends the value of every leaf, found by DFS visiting left before right, to a list. Call it on both trees and compare the two lists for equality. Each node is visited once.",
    code: [
      cpp(`
void collectLeaves(TreeNode* node, vector<int>& leaves) {
    if (!node) return;
    if (!node->left && !node->right) { leaves.push_back(node->val); return; }   // a real leaf has no children at all
    collectLeaves(node->left, leaves);                                          // left before right keeps the order
    collectLeaves(node->right, leaves);
}

bool leafSimilar(TreeNode* root1, TreeNode* root2) {
    vector<int> a, b;
    collectLeaves(root1, a);
    collectLeaves(root2, b);
    return a == b;
}`, 'C++'),
      java(`
public boolean leafSimilar(TreeNode root1, TreeNode root2) {
    List<Integer> a = new ArrayList<>(), b = new ArrayList<>();
    collectLeaves(root1, a);
    collectLeaves(root2, b);
    return a.equals(b);
}

private void collectLeaves(TreeNode node, List<Integer> leaves) {
    if (node == null) return;
    if (node.left == null && node.right == null) { leaves.add(node.val); return; }   // a real leaf has no children at all
    collectLeaves(node.left, leaves);                                               // left before right keeps the order
    collectLeaves(node.right, leaves);
}`, 'Java'),
    ],
    finalComplexity: "O(n + m) time, O(n + m) space for the two lists (O(h) if compared lazily).",
    testCases: [
      { input: "the two example trees with leaves 6,7,4,9,8", expected: "true", why: "Different shapes, same leaf sequence" },
      { input: "[1,2,3] and [1,3,2]", expected: "false", why: "Leaves 2,3 versus 3,2: order matters" },
      { input: "[1] and [1]", expected: "true", why: "The root is its own leaf" },
      { input: "[1,2] and [1,null,2]", expected: "true", why: "Both have the single leaf 2" },
    ],
    takeawaysMd: "A leaf has no children at all; a node with a single child is internal. Compare leaf sequences from a left-first DFS and the problem becomes list equality.",
  },

  "maximum-level-sum-of-a-binary-tree": {
    understandMd: "Levels of a binary tree are numbered from 1 at the root. Return the smallest level number whose node values have the maximum sum.",
    ioConstraintsMd: "Input: the root of a binary tree with 1 to 10,000 nodes whose values lie between −100,000 and 100,000. Output: the level (1-based) with the largest sum; on ties the smallest level.",
    edgeCases: ["Single node (level 1)", "All values negative", "Ties between levels (choose the smallest)", "A skewed tree", "A deep level with the largest sum"],
    bruteForceMd: "Compute the sum of every level separately by running a DFS for each depth.",
    bruteComplexity: "O(n · h) time.",
    bottleneckMd: "One breadth-first traversal visits every level exactly once, so each level's sum can be computed as it is processed.",
    hints: [
      "Which traversal naturally groups nodes by level?", "BFS with a queue; process one level per round using the queue size.", "How do you handle ties?", "Only update the best when the new sum is strictly larger, so the first (smallest) level wins. Start the best sum at negative infinity because every sum may be negative.",
    ],
    optimalMd: "BFS by levels. Track the current level number (starting at 1), the best sum so far (initialised to the smallest possible value) and the level at which it occurred. For each level add up its node values, enqueue the children, and if the sum is strictly greater than the best, record it and the level number. Return the best level. Using a strict comparison ensures the smallest level is chosen in a tie.",
    code: [
      cpp(`
int maxLevelSum(TreeNode* root) {
    queue<TreeNode*> q;
    q.push(root);
    long long bestSum = LLONG_MIN;
    int bestLevel = 1, level = 1;
    while (!q.empty()) {
        int size = q.size();
        long long sum = 0;
        for (int i = 0; i < size; ++i) {
            TreeNode* node = q.front(); q.pop();
            sum += node->val;
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        if (sum > bestSum) { bestSum = sum; bestLevel = level; }   // strict: ties keep the smaller level
        ++level;
    }
    return bestLevel;
}`, 'C++'),
      java(`
public int maxLevelSum(TreeNode root) {
    Deque<TreeNode> q = new ArrayDeque<>();
    q.add(root);
    long bestSum = Long.MIN_VALUE;
    int bestLevel = 1, level = 1;
    while (!q.isEmpty()) {
        int size = q.size();
        long sum = 0;
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll();
            sum += node.val;
            if (node.left != null) q.add(node.left);
            if (node.right != null) q.add(node.right);
        }
        if (sum > bestSum) { bestSum = sum; bestLevel = level; }   // strict: ties keep the smaller level
        level++;
    }
    return bestLevel;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(w) space for the queue.",
    testCases: [
      { input: "[1,7,0,7,-8,null,null]", expected: "2", why: "Level sums 1, 7, −1" },
      { input: "[989,null,10250,98693,-89388,null,null,null,-32127]", expected: "2", why: "Level sums 989, 10250, 9305, −32127" },
      { input: "[5]", expected: "1", why: "Single node" },
      { input: "[-3,-1,-2]", expected: "1", why: "Both levels sum to −3; a tie keeps the smaller level" },
    ],
    takeawaysMd: "Per-level statistics come from BFS with a size snapshot. To get the smallest level on ties, compare strictly; initialise the running maximum to the lowest possible value, not 0.",
  },

  "longest-zigzag-path-in-a-binary-tree": {
    understandMd: "A zigzag path alternates direction at every step: go left, then right, then left, and so on (or starting with right). Its length is the number of nodes visited minus one (the number of edges). Find the length of the longest zigzag path anywhere in the tree; a path may start at any node.",
    ioConstraintsMd: "Input: the root of a binary tree with 1 to 50,000 nodes. Output: the number of edges on the longest zigzag path.",
    edgeCases: ["Single node (length 0)", "A straight chain of left children (zigzag length 1 at best)", "A perfect zigzag chain", "A zigzag path that starts deep inside the tree", "Large skewed trees (recursion depth)"],
    bruteForceMd: "For every node and for each starting direction, simulate the zigzag walk and measure its length.",
    bruteComplexity: "O(n · h) time, O(1) extra space.",
    bottleneckMd: "The brute force re-walks the same path from every node. A single DFS can pass down the length of the zigzag that ends at each node, separately for \"arrived by going left\" and \"arrived by going right\".",
    hints: [
      "If you are at a node that you reached by moving left, what move continues the zigzag?", "A move to the right child extends the path by one; a move left starts a new path.", "Carry two numbers into each node: the zigzag length ending here whose last step was left, and the one whose last step was right.", "Going to the left child: new leftLen = rightLen + 1, new rightLen = 0. Going to the right child: new rightLen = leftLen + 1, new leftLen = 0. Track the maximum seen.",
    ],
    optimalMd: "DFS passing (l, r): l is the length of the best zigzag ending at the current node whose last step went left, r the same for a last step to the right. At a node update the global best with max(l, r). Moving to the left child, the path can continue only if the previous step was a right move, so the left child receives (r + 1, 0); moving to the right child gives (0, l + 1). Starting the root with (0, 0) covers paths that begin at the root, and restarting the counts at 0 or 1 on the other side covers paths that begin at any other node. Each node is visited once.",
    code: [
      cpp(`
int longestZigZag(TreeNode* root) {
    int best = 0;
    // l: length of the zigzag ending here whose last step went left; r: same for a right step
    function<void(TreeNode*, int, int)> dfs = [&](TreeNode* node, int l, int r) {
        if (!node) return;
        best = max(best, max(l, r));
        dfs(node->left, r + 1, 0);                        // going left continues a path that arrived by going right
        dfs(node->right, 0, l + 1);                       // going right continues a path that arrived by going left
    };
    dfs(root, 0, 0);
    return best;
}`, 'C++'),
      java(`
public int longestZigZag(TreeNode root) {
    int[] best = {0};
    dfs(root, 0, 0, best);
    return best[0];
}

// l: length of the zigzag ending here whose last step went left; r: same for a right step
private void dfs(TreeNode node, int l, int r, int[] best) {
    if (node == null) return;
    best[0] = Math.max(best[0], Math.max(l, r));
    dfs(node.left, r + 1, 0, best);                       // going left continues a path that arrived by going right
    dfs(node.right, 0, l + 1, best);                      // going right continues a path that arrived by going left
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(h) space for the recursion.",
    testCases: [
      { input: "[1,null,1,1,1,null,null,1,1,null,1,null,null,null,1]", expected: "3", why: "Right, left, right" },
      { input: "[1,1,1,null,1,null,null,1,1,null,1]", expected: "4", why: "Left, right, left, right" },
      { input: "[1]", expected: "0", why: "No edges" },
      { input: "[1,2,null,3]", expected: "1", why: "A chain of left children zigzags for one edge only" },
    ],
    takeawaysMd: "Carry state down the recursion that depends on how you arrived: here two counters, one per last direction. Starting counters at 0 on the \"wrong\" side makes new paths begin at every node automatically.",
  },

  "find-first-and-last-position-of-element-in-sorted-array": {
    understandMd: "In a sorted array (duplicates allowed), find the index of the first and the last occurrence of a target value. Return [-1, -1] if the value is absent. The required running time is O(log n).",
    ioConstraintsMd: "Input: a non-decreasing integer array of length 0 to 100,000 and a target. Output: the pair [first, last] of indices, or [-1, -1].",
    edgeCases: ["Empty array", "Target absent (smaller than all, larger than all, or in a gap)", "Target occurs once", "Target fills the whole array", "Target at the first or last index", "Target equal to INT_MAX (do not compute target + 1)"],
    bruteForceMd: "Scan the array from the left for the first match and from the right for the last match.",
    bruteComplexity: "O(n) time.",
    bottleneckMd: "The array is sorted, so both positions can be found with binary search. A plain binary search finds some occurrence, not a boundary, so you need two boundary searches (lower and upper bound).",
    hints: [
      "What does a standard binary search return when the value occurs many times?", "Any one of them. You need a variant that keeps searching after a hit.", "Define lowerBound as the first index whose value is at least the target, and upperBound as the first index whose value is greater than the target.", "First = lowerBound if it points at the target; last = upperBound − 1. If lowerBound does not point at the target the value is absent.",
    ],
    optimalMd: "Write one helper that returns the first index i with nums[i] >= target (lower bound) or nums[i] > target (upper bound) using binary search on the half-open range [0, n]. The first occurrence is the lower bound when it is in range and holds the target; otherwise return [-1, -1]. The last occurrence is the upper bound minus one. Using the \"greater than\" comparison for the upper bound avoids computing target + 1, which could overflow.",
    code: [
      cpp(`
// first index whose value is >= target (or > target when strict is true)
int bound(vector<int>& nums, int target, bool strict) {
    int lo = 0, hi = nums.size();                         // answer lies in [lo, hi]
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < target || (strict && nums[mid] == target)) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

vector<int> searchRange(vector<int>& nums, int target) {
    int first = bound(nums, target, false);
    if (first == (int)nums.size() || nums[first] != target) return {-1, -1};
    return {first, bound(nums, target, true) - 1};
}`, 'C++'),
      java(`
// first index whose value is >= target (or > target when strict is true)
private int bound(int[] nums, int target, boolean strict) {
    int lo = 0, hi = nums.length;                         // answer lies in [lo, hi]
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < target || (strict && nums[mid] == target)) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

public int[] searchRange(int[] nums, int target) {
    int first = bound(nums, target, false);
    if (first == nums.length || nums[first] != target) return new int[]{-1, -1};
    return new int[]{first, bound(nums, target, true) - 1};
}`, 'Java'),
    ],
    finalComplexity: "O(log n) time, O(1) space.",
    testCases: [
      { input: "[5,7,7,8,8,10], target = 8", expected: "[3,4]", why: "Run of two" },
      { input: "[5,7,7,8,8,10], target = 6", expected: "[-1,-1]", why: "Absent value inside the range" },
      { input: "[], target = 0", expected: "[-1,-1]", why: "Empty array" },
      { input: "[2,2,2,2], target = 2", expected: "[0,3]", why: "Whole array" },
    ],
    takeawaysMd: "Boundary binary searches (\"first index with property P\") are the workhorse. Use a half-open range [lo, hi) with hi = n so \"not found\" is naturally the index n, and compare with \">\" rather than adding 1 to avoid overflow.",
  },

  "search-insert-position": {
    understandMd: "In a sorted array of distinct integers, return the index of a target if it is present; otherwise return the index where it would be inserted to keep the array sorted. Required: O(log n).",
    ioConstraintsMd: "Input: a strictly increasing array of 1 to 10,000 integers and a target. Output: the index of the target or its insertion point (between 0 and n).",
    edgeCases: ["Target smaller than every element (index 0)", "Target larger than every element (index n)", "Target equal to the first or last element", "Target between two elements", "Single-element array"],
    bruteForceMd: "Scan from the left until you reach an element that is not smaller than the target.",
    bruteComplexity: "O(n) time.",
    bottleneckMd: "The array is sorted, and \"first index whose value is at least the target\" is exactly the answer in both cases (found or not). That is a lower-bound binary search.",
    hints: [
      "If the target is present, what index do you return? And if not?", "In both cases the first index whose value is not smaller than the target.", "Which binary search finds the first position satisfying a monotone condition?", "Search the half-open range [0, n]: if nums[mid] < target move lo to mid + 1, otherwise move hi to mid.",
    ],
    optimalMd: "Lower-bound binary search on [lo, hi) = [0, n). While lo < hi: take mid; if nums[mid] < target the answer is to the right, so lo = mid + 1; otherwise nums[mid] >= target and mid could be the answer, so hi = mid. When the loop ends lo is the first index with nums[lo] >= target, or n if none. This single answer covers both the \"found\" and the \"insert here\" cases.",
    code: [
      cpp(`
int searchInsert(vector<int>& nums, int target) {
    int lo = 0, hi = nums.size();                         // answer is in [0, n]
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < target) lo = mid + 1;             // everything up to mid is too small
        else hi = mid;                                    // mid might be the answer
    }
    return lo;
}`, 'C++'),
      java(`
public int searchInsert(int[] nums, int target) {
    int lo = 0, hi = nums.length;                         // answer is in [0, n]
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < target) lo = mid + 1;             // everything up to mid is too small
        else hi = mid;                                    // mid might be the answer
    }
    return lo;
}`, 'Java'),
    ],
    finalComplexity: "O(log n) time, O(1) space.",
    testCases: [
      { input: "[1,3,5,6], target = 5", expected: "2", why: "Present" },
      { input: "[1,3,5,6], target = 2", expected: "1", why: "Between 1 and 3" },
      { input: "[1,3,5,6], target = 7", expected: "4", why: "Beyond the end" },
      { input: "[1,3,5,6], target = 0", expected: "0", why: "Before the start" },
    ],
    takeawaysMd: "Lower bound is the single primitive behind \"search\", \"insert position\" and \"first at least\". Memorise its loop: while (lo < hi) with hi = n and the two branches lo = mid + 1 and hi = mid.",
  },

  "find-peak-element": {
    understandMd: "A peak is an element strictly greater than its neighbours (treat the positions before the first and after the last element as negative infinity). Return the index of any peak. Adjacent elements are never equal. Required: O(log n).",
    ioConstraintsMd: "Input: an integer array of length 1 to 1,000 where nums[i] != nums[i + 1] for all valid i. Output: the index of any peak.",
    edgeCases: ["Single element (it is a peak)", "Strictly increasing (the last element is a peak)", "Strictly decreasing (the first element is a peak)", "Several peaks (any one is fine)", "Two elements"],
    bruteForceMd: "Scan the array and return the first index that is greater than its neighbours.",
    bruteComplexity: "O(n) time.",
    bottleneckMd: "The array is not sorted, but you can still halve it. If the slope at mid goes up to the right, a peak must exist on the right side, because the array has to come down eventually (the boundary is negative infinity).",
    hints: [
      "Compare nums[mid] with nums[mid + 1]. What does it say about where a peak must be?", "If nums[mid] < nums[mid + 1] the sequence is rising to the right.", "A rising slope must end in a peak (the right boundary is −∞), so a peak exists in (mid, hi].", "Otherwise nums[mid] > nums[mid + 1]: a peak exists in [lo, mid]. Keep mid in that range since it might be the peak itself.",
    ],
    optimalMd: "Binary search on [lo, hi]. While lo < hi, let mid be the midpoint. If nums[mid] < nums[mid + 1] the slope is rising, so some peak lies strictly to the right: set lo = mid + 1. Otherwise nums[mid] > nums[mid + 1] (they are never equal), so a peak lies at mid or to its left: set hi = mid. When lo == hi it is a peak. The invariant is that the current range always contains a peak because its left neighbour is smaller or the boundary and its right neighbour is smaller or the boundary.",
    code: [
      cpp(`
int findPeakElement(vector<int>& nums) {
    int lo = 0, hi = nums.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;      // rising: a peak must lie to the right
        else hi = mid;                                    // falling: mid itself or something on its left is a peak
    }
    return lo;
}`, 'C++'),
      java(`
public int findPeakElement(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;      // rising: a peak must lie to the right
        else hi = mid;                                    // falling: mid itself or something on its left is a peak
    }
    return lo;
}`, 'Java'),
    ],
    finalComplexity: "O(log n) time, O(1) space.",
    testCases: [
      { input: "[1,2,3,1]", expected: "2", why: "Single peak" },
      { input: "[1,2,1,3,5,6,4]", expected: "1 or 5", why: "Either peak is accepted" },
      { input: "[1,2,3,4]", expected: "3", why: "Increasing: the last element is a peak" },
      { input: "[7]", expected: "0", why: "Single element" },
    ],
    takeawaysMd: "Binary search does not need a sorted array, only a rule that discards half the candidates while keeping at least one answer. Compare with a neighbour to see which direction must contain a peak.",
  },

  "guess-number-higher-or-lower": {
    understandMd: "A number between 1 and n has been picked. You may call a judge function guess(num) that returns -1 if the picked number is lower than num, 1 if it is higher, and 0 if num is correct. Return the picked number.",
    ioConstraintsMd: "Input: n up to 2^31 − 1 and access to guess(). Output: the picked number.",
    edgeCases: ["n = 1", "The pick is 1 or n", "Large n (the midpoint must not overflow)", "The pick is in the middle"],
    bruteForceMd: "Call guess for 1, 2, 3, … until it returns 0.",
    bruteComplexity: "O(n) calls.",
    bottleneckMd: "Each answer from guess() tells you whether to look below or above, so one query eliminates half of the remaining numbers.",
    hints: [
      "What does a result of −1 or +1 let you rule out?", "Everything on the wrong side of your guess.", "Maintain a range [lo, hi] that still contains the pick and probe its middle.", "Compute the midpoint as lo + (hi − lo) / 2 so that large n does not overflow.",
    ],
    optimalMd: "Binary search on the range [1, n]. Probe mid = lo + (hi − lo) / 2. If guess(mid) is 0 return mid; if it is −1 the pick is lower, so set hi = mid − 1; otherwise set lo = mid + 1. The range halves with every call, so at most about 31 calls are needed.",
    code: [
      cpp(`
// Stand-in for the judge's API so this snippet is self-contained: -1 if the pick is lower than num, 1 if higher, 0 if equal.
int pick = 6;
int guess(int num) { return (pick > num) - (pick < num); }

int guessNumber(int n) {
    int lo = 1, hi = n;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;                     // avoids overflow for n near INT_MAX
        int r = guess(mid);
        if (r == 0) return mid;
        if (r < 0) hi = mid - 1;                          // the pick is lower
        else lo = mid + 1;                                // the pick is higher
    }
    return -1;                                            // not reached when the pick is in [1, n]
}`, 'C++'),
      java(`
// Stand-in for the judge's API so this snippet is self-contained: -1 if the pick is lower than num, 1 if higher, 0 if equal.
int pick = 6;
int guess(int num) { return Integer.compare(pick, num); }

public int guessNumber(int n) {
    int lo = 1, hi = n;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;                     // avoids overflow for n near Integer.MAX_VALUE
        int r = guess(mid);
        if (r == 0) return mid;
        if (r < 0) hi = mid - 1;                          // the pick is lower
        else lo = mid + 1;                                // the pick is higher
    }
    return -1;                                            // not reached when the pick is in [1, n]
}`, 'Java'),
    ],
    finalComplexity: "O(log n) calls to guess, O(1) space.",
    testCases: [
      { input: "n = 10, pick = 6", expected: "6", why: "Mid-range" },
      { input: "n = 1, pick = 1", expected: "1", why: "Smallest case" },
      { input: "n = 2147483647, pick = 2147483647", expected: "2147483647", why: "Needs an overflow-safe midpoint" },
      { input: "n = 2, pick = 1", expected: "1", why: "Lower end" },
    ],
    takeawaysMd: "Any oracle that answers \"too high or too low\" is a binary search. Write the midpoint as lo + (hi − lo) / 2 whenever the bounds can approach the integer limit.",
  },

  "successful-pairs-of-spells-and-potions": {
    understandMd: "Given an array of spell strengths and an array of potion strengths, a spell and a potion form a successful pair if the product of their strengths is at least a given success value. For each spell, return how many potions would make a successful pair.",
    ioConstraintsMd: "Input: spells (n values) and potions (m values), both up to 100,000 elements with values up to 100,000, and success up to 10^10. Output: an array of n counts.",
    edgeCases: ["No potion works (count 0)", "Every potion works (count m)", "The product exactly equals success", "Large products (use 64-bit arithmetic)", "Duplicate potion strengths"],
    bruteForceMd: "For each spell compare it with every potion and count the successes.",
    bruteComplexity: "O(n · m) time.",
    bottleneckMd: "For a fixed spell the potions that work are exactly those at or above some threshold. If the potions are sorted, that is a suffix, and its start can be found by binary search.",
    hints: [
      "For one spell, which potions succeed: the weak ones or the strong ones?", "The strong ones: a stronger potion gives a larger product.", "If you sort the potions, the successful ones form a suffix. How do you find where it starts?", "Binary search for the first potion with spell × potion ≥ success (use long long for the product). The count is m minus that index.",
    ],
    optimalMd: "Sort the potions once. For each spell binary-search the smallest index idx such that spell × potions[idx] >= success, computing the product in 64 bits. Every potion from idx onward also works because they are at least as large, so the count is m − idx. Sorting costs O(m log m) and each of the n queries costs O(log m).",
    code: [
      cpp(`
vector<int> successfulPairs(vector<int>& spells, vector<int>& potions, long long success) {
    sort(potions.begin(), potions.end());
    int m = potions.size();
    vector<int> out;
    for (int s : spells) {
        int lo = 0, hi = m;                               // first potion index that succeeds, or m
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if ((long long)s * potions[mid] >= success) hi = mid;
            else lo = mid + 1;
        }
        out.push_back(m - lo);                            // the whole suffix succeeds
    }
    return out;
}`, 'C++'),
      java(`
public int[] successfulPairs(int[] spells, int[] potions, long success) {
    Arrays.sort(potions);
    int m = potions.length;
    int[] out = new int[spells.length];
    for (int i = 0; i < spells.length; i++) {
        int lo = 0, hi = m;                               // first potion index that succeeds, or m
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if ((long) spells[i] * potions[mid] >= success) hi = mid;
            else lo = mid + 1;
        }
        out[i] = m - lo;                                  // the whole suffix succeeds
    }
    return out;
}`, 'Java'),
    ],
    finalComplexity: "O((n + m) log m) time, O(1) extra space besides the output (sorting in place).",
    testCases: [
      { input: "spells [5,1,3], potions [1,2,3,4,5], success 7", expected: "[4,0,3]", why: "Thresholds 2, 7 and 3" },
      { input: "spells [3,1,2], potions [8,5,8], success 16", expected: "[2,0,2]", why: "Duplicates in potions" },
      { input: "spells [100000], potions [100000,100000], success 10^10", expected: "[2]", why: "Exact product, 64-bit arithmetic" },
      { input: "spells [1], potions [1], success 2", expected: "[0]", why: "Nothing succeeds" },
    ],
    takeawaysMd: "When a monotone predicate holds for a suffix after sorting, binary search finds its start. Sorting one side once and querying with binary search is the standard speed-up for \"count pairs with a product/sum condition\".",
  },

  "sqrtx": {
    understandMd: "Compute the integer square root of a non-negative integer x: the largest integer r with r × r ≤ x. Built-in power or square-root functions may not be used.",
    ioConstraintsMd: "Input: an integer x from 0 to 2^31 − 1. Output: floor(sqrt(x)).",
    edgeCases: ["x = 0 and x = 1", "Perfect squares", "One below a perfect square", "x = INT_MAX (the product mid × mid overflows 32 bits)", "Small values like 2, 3"],
    bruteForceMd: "Try r = 0, 1, 2, … until (r + 1)² exceeds x.",
    bruteComplexity: "O(√x) time, about 46,000 steps for the largest input.",
    bottleneckMd: "The predicate r × r ≤ x is monotone in r, so binary search over the possible answers is enough, with 64-bit arithmetic to avoid overflow.",
    hints: [
      "Which values can the answer take, and is the condition r² ≤ x monotone in r?", "Yes: if r² ≤ x then every smaller r also satisfies it. Search the range [0, x] (or [0, 46340]).", "You are looking for the largest r that still satisfies the condition.", "Use a 64-bit product so mid × mid cannot overflow, and keep the best valid mid.",
    ],
    optimalMd: "Binary search for the largest r with r × r ≤ x on the range [0, min(x, 46340)] (or simply [0, x] with 64-bit products). If mid × mid ≤ x, record mid as a candidate and search higher; otherwise search lower. The product is computed in a long long to avoid overflow for mid close to 46,341. About 16 iterations are needed for any int input.",
    code: [
      cpp(`
int mySqrt(int x) {
    long long lo = 0, hi = x, ans = 0;
    while (lo <= hi) {
        long long mid = lo + (hi - lo) / 2;
        if (mid * mid <= x) { ans = mid; lo = mid + 1; }  // mid works: try something larger
        else hi = mid - 1;
    }
    return (int)ans;
}`, 'C++'),
      java(`
public int mySqrt(int x) {
    long lo = 0, hi = x, ans = 0;
    while (lo <= hi) {
        long mid = lo + (hi - lo) / 2;
        if (mid * mid <= x) { ans = mid; lo = mid + 1; }  // mid works: try something larger
        else hi = mid - 1;
    }
    return (int) ans;
}`, 'Java'),
    ],
    finalComplexity: "O(log x) time, O(1) space.",
    testCases: [
      { input: "4", expected: "2", why: "Perfect square" },
      { input: "8", expected: "2", why: "Rounds down" },
      { input: "2147483647", expected: "46340", why: "Largest int, needs 64-bit products" },
      { input: "0", expected: "0", why: "Zero" },
    ],
    takeawaysMd: "Binary search over the answer space works whenever the feasibility check is monotone. Compute products in a wider type: mid × mid overflows an int long before mid reaches x.",
  },

  "factorial-trailing-zeroes": {
    understandMd: "Return the number of trailing zeroes in n! (n factorial). The factorial itself is far too large to compute for the input range.",
    ioConstraintsMd: "Input: an integer n from 0 to 10,000. Output: the number of trailing zeroes of n!. Aim for O(log n) time.",
    edgeCases: ["n = 0 and n = 1 (0! = 1! = 1, no zeroes)", "n just below a power of 5", "n = 25, 125 (extra factors of 5)", "Large n"],
    bruteForceMd: "Compute n! with big integers and count the zeroes at the end.",
    bruteComplexity: "Heavy: the number has thousands of digits.",
    bottleneckMd: "A trailing zero is a factor of 10 = 2 × 5. There are always more factors of 2 than of 5 in n!, so only the factors of 5 matter, and they can be counted directly.",
    hints: [
      "What produces a trailing zero in a product?", "A factor of 10, that is a pair of factors 2 and 5.", "Which of the two is scarcer in n!?", "The factors of 5. Count them: multiples of 5 give one each, multiples of 25 give an extra one, multiples of 125 another, and so on.",
    ],
    optimalMd: "The count of trailing zeroes equals the exponent of 5 in n!, which is floor(n/5) + floor(n/25) + floor(n/125) + … (Legendre's formula). Compute it by repeatedly dividing n by 5 and summing the quotients until the quotient is 0. This takes about log₅ n iterations.",
    code: [
      cpp(`
int trailingZeroes(int n) {
    int zeros = 0;
    while (n > 0) {
        n /= 5;                                           // multiples of 5, then of 25, then of 125, ...
        zeros += n;
    }
    return zeros;
}`, 'C++'),
      java(`
public int trailingZeroes(int n) {
    int zeros = 0;
    while (n > 0) {
        n /= 5;                                           // multiples of 5, then of 25, then of 125, ...
        zeros += n;
    }
    return zeros;
}`, 'Java'),
    ],
    finalComplexity: "O(log n) time, O(1) space.",
    testCases: [
      { input: "3", expected: "0", why: "3! = 6" },
      { input: "5", expected: "1", why: "5! = 120" },
      { input: "25", expected: "6", why: "Multiples 5,10,15,20 give 4 and 25 gives 2" },
      { input: "100", expected: "24", why: "20 + 4" },
    ],
    takeawaysMd: "Count the scarce prime factor instead of building the huge number. Legendre's formula (sum of n / p^k) gives the exponent of a prime p in n! in logarithmic time.",
  },

  "add-binary": {
    understandMd: "Add two binary numbers given as strings and return their sum as a binary string.",
    ioConstraintsMd: "Input: two non-empty strings of 0s and 1s with no leading zeros except for the number zero itself, each up to 10,000 characters. Output: their sum as a binary string.",
    edgeCases: ["Strings of different lengths", "A carry that creates a new leading digit (e.g. \"1\" + \"1\" = \"10\")", "Both strings \"0\"", "Very long strings (too large for a 64-bit integer)", "A carry that ripples through many digits"],
    bruteForceMd: "Convert both strings to integers, add them and convert the sum back to binary.",
    bruteComplexity: "Works only for short strings: the values overflow integer types for long inputs.",
    bottleneckMd: "The numbers can be thousands of bits long, so the addition must be done digit by digit, exactly like schoolbook addition, with a carry.",
    hints: [
      "How do you add decimal numbers by hand?", "Digit by digit from the right with a carry.", "What if one string is shorter?", "Treat missing digits as 0, and keep going while there are digits left or a carry remains. Build the result backwards and reverse it at the end.",
    ],
    optimalMd: "Use two indices starting at the last characters and a carry. While either index is valid or the carry is non-zero, add the available digits and the carry to get sum; append sum % 2 to the answer and set carry = sum / 2. Move both indices left. The answer is built from least to most significant digit, so reverse it at the end.",
    code: [
      cpp(`
string addBinary(string a, string b) {
    string out;
    int i = (int)a.size() - 1, j = (int)b.size() - 1, carry = 0;
    while (i >= 0 || j >= 0 || carry) {
        int sum = carry;
        if (i >= 0) sum += a[i--] - '0';
        if (j >= 0) sum += b[j--] - '0';
        out += char('0' + sum % 2);                       // digit for this position
        carry = sum / 2;
    }
    reverse(out.begin(), out.end());                      // we produced the least significant digit first
    return out;
}`, 'C++'),
      java(`
public String addBinary(String a, String b) {
    StringBuilder out = new StringBuilder();
    int i = a.length() - 1, j = b.length() - 1, carry = 0;
    while (i >= 0 || j >= 0 || carry != 0) {
        int sum = carry;
        if (i >= 0) sum += a.charAt(i--) - '0';
        if (j >= 0) sum += b.charAt(j--) - '0';
        out.append(sum % 2);                              // digit for this position
        carry = sum / 2;
    }
    return out.reverse().toString();                      // we produced the least significant digit first
}`, 'Java'),
    ],
    finalComplexity: "O(max(n, m)) time, O(max(n, m)) space for the result.",
    testCases: [
      { input: "\"11\", \"1\"", expected: "\"100\"", why: "Carry ripples to a new digit" },
      { input: "\"1010\", \"1011\"", expected: "\"10101\"", why: "Standard" },
      { input: "\"0\", \"0\"", expected: "\"0\"", why: "Zero plus zero" },
      { input: "5,000 ones plus \"1\"", expected: "a 1 followed by 5,000 zeros", why: "Long ripple carry" },
    ],
    takeawaysMd: "Schoolbook addition with a carry works for numbers of any length. Loop while any input digit or the carry remains, so unequal lengths and the final carry need no special code.",
  },

  "single-number-ii": {
    understandMd: "Every element of an integer array appears exactly three times except for one element that appears exactly once. Find that single element in linear time using constant extra space.",
    ioConstraintsMd: "Input: an integer array of length 1 to 30,000 (values may be negative) where all values but one occur three times. Output: the value that occurs once.",
    edgeCases: ["A single element", "Negative numbers (the sign bit is a bit like any other)", "The single value is 0", "The unique element appears first or last", "Values near INT_MIN / INT_MAX"],
    bruteForceMd: "Count occurrences with a hash map and return the value with count 1 (or sort and compare groups of three).",
    bruteComplexity: "O(n) time and O(n) space with a map, or O(n log n) time with sorting.",
    bottleneckMd: "XOR cancels pairs, not triples. Instead count, for each bit position, how many numbers have that bit set: the counts from the triple elements are multiples of 3, so the remainder modulo 3 is the single number's bit.",
    hints: [
      "Why does XOR of all elements (which solves Single Number I) fail here?", "Because triples do not cancel under XOR.", "Think per bit position: if a bit appears in a triple group it contributes 0, 3, 6, … to the count of that bit.", "The count modulo 3 for each bit equals the bit of the unique number. Keep two bit-masks \"ones\" and \"twos\" that hold the bits seen once and twice modulo 3, updated with XOR and masks.",
    ],
    optimalMd: "Maintain two integers: ones holds the bits that have appeared 1 time (mod 3) and twos holds those that have appeared 2 times. For each number x: ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones. A bit seen three times is cleared from both (it returns to count 0 mod 3). After processing all numbers, ones contains exactly the bits of the number that appeared once. This is a bit-parallel version of counting modulo 3 and uses O(1) space.",
    code: [
      cpp(`
int singleNumber(vector<int>& nums) {
    int ones = 0, twos = 0;                               // bits seen 1 time / 2 times (mod 3)
    for (int x : nums) {
        ones = (ones ^ x) & ~twos;                        // add x to "seen once" unless the bit is already in "seen twice"
        twos = (twos ^ x) & ~ones;                        // likewise for "seen twice"; a third sighting clears both
    }
    return ones;
}`, 'C++'),
      java(`
public int singleNumber(int[] nums) {
    int ones = 0, twos = 0;                               // bits seen 1 time / 2 times (mod 3)
    for (int x : nums) {
        ones = (ones ^ x) & ~twos;                        // add x to "seen once" unless the bit is already in "seen twice"
        twos = (twos ^ x) & ~ones;                        // likewise for "seen twice"; a third sighting clears both
    }
    return ones;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[2,2,3,2]", expected: "3", why: "Basic" },
      { input: "[0,1,0,1,0,1,99]", expected: "99", why: "Single value at the end" },
      { input: "[-2,-2,1,1,4,1,4,4,-4,-2]", expected: "-4", why: "Negative single value" },
      { input: "[7]", expected: "7", why: "One element" },
    ],
    takeawaysMd: "Counting bits modulo k generalises XOR (which is counting modulo 2). With k = 3 two accumulators suffice, because the counts 0, 1, 2 need two bits of state per bit position.",
  },

  "bitwise-and-of-numbers-range": {
    understandMd: "Given two integers left and right with left ≤ right, return the bitwise AND of all the numbers in the inclusive range [left, right].",
    ioConstraintsMd: "Input: 0 ≤ left ≤ right ≤ 2^31 − 1. Output: the AND of every integer from left to right.",
    edgeCases: ["left == right (the answer is that number)", "A range that crosses a power of two (the answer is 0)", "A huge range such as [0, 2^31 − 1]", "left = 0", "Adjacent numbers differing in many low bits"],
    bruteForceMd: "Loop from left to right and AND the numbers together.",
    bruteComplexity: "O(right − left) time, which is up to 2 billion steps.",
    bottleneckMd: "A bit survives the AND only if it is 1 in every number of the range. Counting up from left to right flips the low bits back and forth, so only the common high-order prefix of left and right can survive.",
    hints: [
      "Look at the binary forms of left and right. Which bits can possibly stay 1 across the whole range?", "Once a bit position changes somewhere in the range, every lower bit takes both values 0 and 1 and so becomes 0 in the AND.", "So the answer is the common binary prefix of left and right, followed by zeros.", "Shift both numbers right until they are equal, counting the shifts, then shift the common value back left by that count.",
    ],
    optimalMd: "Find the longest common binary prefix of left and right. Shift both numbers right by one bit repeatedly until they become equal, counting the number of shifts k. At that point the shared value is the common prefix; shifting it left by k restores its position and fills the lower bits with zeros. All bits below the first differing bit are 0 in at least one number of the range, so they vanish; the prefix bits are identical in every number of the range, so they stay. The loop runs at most 31 times.",
    code: [
      cpp(`
int rangeBitwiseAnd(int left, int right) {
    int shift = 0;
    while (left != right) {                               // strip bits until only the common prefix remains
        left >>= 1;
        right >>= 1;
        ++shift;
    }
    return left << shift;                                 // put the prefix back, with zeros below it
}`, 'C++'),
      java(`
public int rangeBitwiseAnd(int left, int right) {
    int shift = 0;
    while (left != right) {                               // strip bits until only the common prefix remains
        left >>= 1;
        right >>= 1;
        shift++;
    }
    return left << shift;                                 // put the prefix back, with zeros below it
}`, 'Java'),
    ],
    finalComplexity: "O(log n) time (at most 31 iterations), O(1) space.",
    testCases: [
      { input: "5, 7", expected: "4", why: "101 & 110 & 111 = 100" },
      { input: "0, 0", expected: "0", why: "Single number" },
      { input: "1, 2147483647", expected: "0", why: "Range crosses every power of two" },
      { input: "2147483646, 2147483647", expected: "2147483646", why: "Only the lowest bit differs" },
    ],
    takeawaysMd: "The AND of a range is the common binary prefix of its endpoints. When a loop over a huge range is hopeless, ask which bits can possibly survive and compute them directly.",
  },

  "minimum-flips-to-make-a-or-b-equal-to-c": {
    understandMd: "Given three positive integers a, b and c, find the minimum number of bit flips in a and/or b so that (a OR b) equals c. A flip changes a single bit in the binary representation of a or b from 0 to 1 or from 1 to 0.",
    ioConstraintsMd: "Input: three positive integers up to 10^9. Output: the minimum number of flips.",
    edgeCases: ["a OR b already equals c (0 flips)", "A bit of c is 0 while both a and b have 1s there (two flips)", "A bit of c is 1 while both a and b have 0 (one flip)", "Different bit lengths", "a, b, c equal"],
    bruteForceMd: "Try flipping subsets of bits in a and b and check whether the OR equals c.",
    bruteComplexity: "Exponential in the number of bits.",
    bottleneckMd: "Bits are independent in an OR. The cost at each bit position depends only on the three bits there, so you can add up the cost position by position.",
    hints: [
      "Does the choice at one bit position affect any other position?", "No: OR works bit by bit.", "If the bit of c is 0, what must a and b look like at that bit?", "Both must be 0, costing one flip for each of them that is 1. If the bit of c is 1, at least one of them must be 1: no flips if one already is, otherwise one flip.",
    ],
    optimalMd: "Process the 31 low bit positions independently. For each position take the bits x of a, y of b and z of c. If z is 0, both x and y must become 0, costing x + y flips. If z is 1, the OR must be 1: if x and y are both 0 one flip is needed, otherwise none. The sum over all positions is the minimum because positions do not interact and each position's cost is minimal.",
    code: [
      cpp(`
int minFlips(int a, int b, int c) {
    int flips = 0;
    for (int i = 0; i < 31; ++i) {
        int x = (a >> i) & 1, y = (b >> i) & 1, z = (c >> i) & 1;
        if (z == 0) flips += x + y;                       // both must be cleared
        else if (x == 0 && y == 0) flips += 1;            // one of them must be set
    }
    return flips;
}`, 'C++'),
      java(`
public int minFlips(int a, int b, int c) {
    int flips = 0;
    for (int i = 0; i < 31; i++) {
        int x = (a >> i) & 1, y = (b >> i) & 1, z = (c >> i) & 1;
        if (z == 0) flips += x + y;                       // both must be cleared
        else if (x == 0 && y == 0) flips += 1;            // one of them must be set
    }
    return flips;
}`, 'Java'),
    ],
    finalComplexity: "O(log max(a, b, c)) time (31 iterations), O(1) space.",
    testCases: [
      { input: "a = 2, b = 6, c = 5", expected: "3", why: "Bits: 010 | 110 vs 101" },
      { input: "a = 4, b = 2, c = 7", expected: "1", why: "Set the missing low bit" },
      { input: "a = 1, b = 2, c = 3", expected: "0", why: "Already equal" },
      { input: "a = 7, b = 7, c = 0", expected: "6", why: "Clear all six set bits" },
    ],
    takeawaysMd: "Bitwise operators act position by position, so many bit problems split into independent per-bit cases. Enumerate the (x, y, z) combinations and add up the minimal cost for each.",
  },

  "n-queens-ii": {
    understandMd: "Count the number of distinct ways to place n queens on an n × n chessboard so that no two queens attack each other (no two share a row, column or diagonal).",
    ioConstraintsMd: "Input: an integer n from 1 to 9. Output: the number of valid placements.",
    edgeCases: ["n = 1 (one way)", "n = 2 and n = 3 (no solutions)", "n = 4 (two solutions)", "The largest n (performance of the backtracking)", "Symmetric placements are counted separately"],
    bruteForceMd: "Place queens on every combination of n cells of the board and test each arrangement.",
    bruteComplexity: "C(n², n) arrangements, hopelessly many.",
    bottleneckMd: "Most arrangements are invalid after the first few queens. Placing one queen per row and pruning as soon as a conflict appears shrinks the search dramatically; bit masks make the conflict test O(1).",
    hints: [
      "How many queens can be in one row?", "Exactly one, so decide the column for row 0, then row 1, and so on.", "Which squares are forbidden in the next row?", "Columns already used, plus the two diagonals running through earlier queens. Keep them as three bit masks. Shift the diagonal masks by one bit per row (one left, one right) and iterate over the free bits with avail & −avail.",
    ],
    optimalMd: "Backtracking row by row with three bit masks: columns used, \"\\\" diagonals and \"/\" diagonals that are attacked in the current row. For each row compute the available columns as the bits not in any mask. For each available bit place a queen: add it to the column mask, and pass the diagonal masks on shifted by one (one shifted left and one right, trimmed to n bits) for the next row. When all columns are filled (every row has a queen) count one solution. Pruning keeps the search tiny for n ≤ 9.",
    code: [
      cpp(`
int totalNQueens(int n) {
    int full = (1 << n) - 1;
    function<int(int, int, int)> place = [&](int cols, int diag1, int diag2) -> int {
        if (cols == full) return 1;                       // every row has a queen
        int free = full & ~(cols | diag1 | diag2);        // squares in this row that are not attacked
        int count = 0;
        while (free) {
            int bit = free & -free;                       // lowest free square
            free -= bit;
            count += place(cols | bit, ((diag1 | bit) << 1) & full, (diag2 | bit) >> 1);
        }
        return count;
    };
    return place(0, 0, 0);
}`, 'C++'),
      java(`
public int totalNQueens(int n) {
    return place(0, 0, 0, (1 << n) - 1);
}

private int place(int cols, int diag1, int diag2, int full) {
    if (cols == full) return 1;                           // every row has a queen
    int free = full & ~(cols | diag1 | diag2);            // squares in this row that are not attacked
    int count = 0;
    while (free != 0) {
        int bit = free & -free;                           // lowest free square
        free -= bit;
        count += place(cols | bit, ((diag1 | bit) << 1) & full, (diag2 | bit) >> 1, full);
    }
    return count;
}`, 'Java'),
    ],
    finalComplexity: "About O(n!) in the worst case, but heavy pruning makes n ≤ 9 instantaneous. O(n) space for the recursion.",
    testCases: [
      { input: "n = 4", expected: "2", why: "The two mirror-image solutions" },
      { input: "n = 1", expected: "1", why: "One queen on one square" },
      { input: "n = 3", expected: "0", why: "No solution" },
      { input: "n = 8", expected: "92", why: "The classic 8-queens count" },
    ],
    takeawaysMd: "Backtracking by rows plus three conflict masks (columns and both diagonals) is the standard way to count n-queens. A bit mask makes \"is this square attacked?\" and \"which squares are free?\" single machine operations.",
  },

  "combinations": {
    understandMd: "Given n and k, return all combinations of k distinct numbers chosen from the range 1 to n. The order of the combinations (and of the numbers within one combination) does not matter.",
    ioConstraintsMd: "Input: integers 1 ≤ k ≤ n ≤ 20. Output: a list of all C(n, k) combinations, each as a list of k numbers.",
    edgeCases: ["k = n (a single combination)", "k = 1 (n singletons)", "n = 1", "Making sure the same set is not produced twice in a different order"],
    bruteForceMd: "Generate all permutations or all subsets and filter those of size k, removing duplicates.",
    bruteComplexity: "O(2^n) subsets examined even though only C(n, k) are wanted.",
    bottleneckMd: "Duplicates arise only because the same set can be built in different orders. Forcing the numbers to be added in increasing order removes duplicates by construction, and a bound on the remaining count prunes dead branches early.",
    hints: [
      "How can you make sure each set is built in only one order?", "Only choose numbers larger than the last chosen one.", "The recursion needs a \"start\" value; when you pick x the next pick starts at x + 1.", "Stop when the current combination has k numbers. You can also stop early when fewer than the needed numbers remain.",
    ],
    optimalMd: "Depth-first search with a start index and a path. At each call, if the path has k numbers record a copy. Otherwise try every number x from start to n (bounded above by n − (k − path size) + 1 so that enough numbers remain to finish), push x, recurse with start = x + 1, and pop it. Increasing order guarantees each subset is generated exactly once, in lexicographic order.",
    code: [
      cpp(`
vector<vector<int>> combine(int n, int k) {
    vector<vector<int>> out;
    vector<int> path;
    function<void(int)> dfs = [&](int start) {
        if ((int)path.size() == k) { out.push_back(path); return; }
        int need = k - (int)path.size();
        for (int x = start; x <= n - need + 1; ++x) {     // stop early when too few numbers remain
            path.push_back(x);
            dfs(x + 1);                                   // only larger numbers: no duplicates
            path.pop_back();
        }
    };
    dfs(1);
    return out;
}`, 'C++'),
      java(`
public List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> out = new ArrayList<>();
    dfs(1, n, k, new ArrayList<>(), out);
    return out;
}

private void dfs(int start, int n, int k, List<Integer> path, List<List<Integer>> out) {
    if (path.size() == k) { out.add(new ArrayList<>(path)); return; }
    int need = k - path.size();
    for (int x = start; x <= n - need + 1; x++) {         // stop early when too few numbers remain
        path.add(x);
        dfs(x + 1, n, k, path, out);                      // only larger numbers: no duplicates
        path.remove(path.size() - 1);
    }
}`, 'Java'),
    ],
    finalComplexity: "O(k · C(n, k)) time (each combination is copied), O(k) recursion depth.",
    testCases: [
      { input: "n = 4, k = 2", expected: "[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]", why: "Six combinations" },
      { input: "n = 3, k = 3", expected: "[[1,2,3]]", why: "Everything chosen" },
      { input: "n = 3, k = 1", expected: "[[1],[2],[3]]", why: "Singletons" },
      { input: "n = 1, k = 1", expected: "[[1]]", why: "Smallest case" },
    ],
    takeawaysMd: "To enumerate subsets without duplicates, impose an order: only extend a partial answer with larger elements. Bounding the loop by the number of elements still needed prunes useless branches.",
  },

  "combination-sum-iii": {
    understandMd: "Find all valid combinations of k distinct numbers, each from 1 to 9, that add up to n. Each number may be used at most once. Return every such combination (in any order).",
    ioConstraintsMd: "Input: integers k (2 to 9) and n (1 to 60). Output: a list of combinations, each a list of k distinct digits summing to n.",
    edgeCases: ["No combination exists (n too small or too large for k numbers)", "The unique combination 1..k (smallest sum)", "The largest sum 9 + 8 + …", "k = 9 (only n = 45 works)", "Making sure no digit is reused"],
    bruteForceMd: "Try all subsets of {1,…,9} (512 of them) and keep those with exactly k elements summing to n.",
    bruteComplexity: "O(2^9 · 9) work, which is tiny but does not scale and ignores pruning.",
    bottleneckMd: "Backtracking with an increasing order avoids duplicates, and pruning when the remaining sum becomes negative (or too many digits are used) removes hopeless branches early.",
    hints: [
      "What kind of search enumerates subsets without repeats?", "Choose digits in increasing order with a start value.", "What can you prune?", "Stop when the remaining sum drops below 0, or when you have k digits but the remaining sum is not 0. Record a path when it has exactly k digits and the remaining sum is exactly 0.",
    ],
    optimalMd: "DFS with parameters (start digit, digits still needed, remaining sum, path). If no digits remain to be chosen, record the path when the remaining sum is 0. Otherwise try each digit d from start to 9: stop the loop as soon as d exceeds the remaining sum, push d, recurse with start = d + 1, one fewer digit needed and the sum reduced by d, then pop. Increasing order means each set appears exactly once.",
    code: [
      cpp(`
vector<vector<int>> combinationSum3(int k, int n) {
    vector<vector<int>> out;
    vector<int> path;
    function<void(int, int, int)> dfs = [&](int start, int left, int remaining) {
        if (left == 0) { if (remaining == 0) out.push_back(path); return; }
        for (int d = start; d <= 9 && d <= remaining; ++d) {   // digits only grow, and cannot exceed what is left
            path.push_back(d);
            dfs(d + 1, left - 1, remaining - d);
            path.pop_back();
        }
    };
    dfs(1, k, n);
    return out;
}`, 'C++'),
      java(`
public List<List<Integer>> combinationSum3(int k, int n) {
    List<List<Integer>> out = new ArrayList<>();
    dfs(1, k, n, new ArrayList<>(), out);
    return out;
}

private void dfs(int start, int left, int remaining, List<Integer> path, List<List<Integer>> out) {
    if (left == 0) { if (remaining == 0) out.add(new ArrayList<>(path)); return; }
    for (int d = start; d <= 9 && d <= remaining; d++) {  // digits only grow, and cannot exceed what is left
        path.add(d);
        dfs(d + 1, left - 1, remaining - d, path, out);
        path.remove(path.size() - 1);
    }
}`, 'Java'),
    ],
    finalComplexity: "O(C(9, k) · k) time in the worst case, O(k) recursion depth.",
    testCases: [
      { input: "k = 3, n = 7", expected: "[[1,2,4]]", why: "The only way" },
      { input: "k = 3, n = 9", expected: "[[1,2,6],[1,3,5],[2,3,4]]", why: "Three combinations" },
      { input: "k = 4, n = 1", expected: "[]", why: "Four distinct digits sum to at least 10" },
      { input: "k = 9, n = 45", expected: "[[1,2,3,4,5,6,7,8,9]]", why: "All digits" },
    ],
    takeawaysMd: "Subset-sum style enumeration over a tiny alphabet is backtracking with start-index ordering and a prune on the remaining sum. Passing \"digits left\" instead of checking path length keeps the base case simple.",
  },

  "unique-paths-ii": {
    understandMd: "A robot starts at the top-left cell of a grid and wants to reach the bottom-right cell, moving only right or down. Some cells contain obstacles (1) that cannot be entered. Count the distinct paths.",
    ioConstraintsMd: "Input: an m × n grid of 0 (free) and 1 (obstacle) with 1 ≤ m, n ≤ 100. Output: the number of paths (fits in a 32-bit integer for the given tests).",
    edgeCases: ["The start or the end cell is an obstacle (0 paths)", "A single cell", "A full row or column blocked", "Obstacles in the first row or first column (they cut off everything after them)", "No obstacles (the binomial coefficient)"],
    bruteForceMd: "Recursive DFS from the start trying right and down, counting arrivals at the end.",
    bruteComplexity: "Exponential time without memoisation.",
    bottleneckMd: "Many different routes share the same prefix, so the number of ways to reach a cell is the sum of the ways to reach the cell above and the cell to its left. Dynamic programming computes each cell once.",
    hints: [
      "How can you reach a cell?", "From the cell above or from the cell to the left.", "What if the cell is an obstacle?", "It cannot be reached, so its count is 0. You only need the previous row, so one array of length n is enough.",
    ],
    optimalMd: "DP over the grid with a single row array ways[j]. Initialise ways[0] = 1 if the start is free (0 otherwise). For each row and each column: if the cell is an obstacle set ways[j] = 0; otherwise (for j > 0) add the value from the left, ways[j] += ways[j − 1], where ways[j] already holds the value from the row above. The answer is ways[n − 1]. Each cell is processed once with O(n) memory.",
    code: [
      cpp(`
int uniquePathsWithObstacles(vector<vector<int>>& grid) {
    int m = grid.size(), n = grid[0].size();
    vector<long long> ways(n, 0);                         // ways[j]: paths to the current row's cell in column j
    ways[0] = grid[0][0] == 0 ? 1 : 0;
    for (int i = 0; i < m; ++i) {
        for (int j = 0; j < n; ++j) {
            if (grid[i][j] == 1) ways[j] = 0;             // blocked: unreachable
            else if (j > 0) ways[j] += ways[j - 1];       // from above (already in ways[j]) plus from the left
        }
    }
    return (int)ways[n - 1];
}`, 'C++'),
      java(`
public int uniquePathsWithObstacles(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    long[] ways = new long[n];                            // ways[j]: paths to the current row's cell in column j
    ways[0] = grid[0][0] == 0 ? 1 : 0;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 1) ways[j] = 0;             // blocked: unreachable
            else if (j > 0) ways[j] += ways[j - 1];       // from above (already in ways[j]) plus from the left
        }
    }
    return (int) ways[n - 1];
}`, 'Java'),
    ],
    finalComplexity: "O(m · n) time, O(n) space.",
    testCases: [
      { input: "[[0,0,0],[0,1,0],[0,0,0]]", expected: "2", why: "Go around the obstacle" },
      { input: "[[0,1],[0,0]]", expected: "1", why: "Only down then right" },
      { input: "[[1]]", expected: "0", why: "Start blocked" },
      { input: "5 × 5 empty grid", expected: "70", why: "C(8, 4) paths" },
    ],
    takeawaysMd: "Grid path counting is \"paths to a cell = paths from above + paths from the left\". An obstacle simply sets that cell to 0. Reuse one row array and update it in place.",
  },

  "minimum-path-sum": {
    understandMd: "Given a grid of non-negative numbers, find a path from the top-left cell to the bottom-right cell, moving only right or down, that minimises the sum of the numbers along the path. Return that minimum sum.",
    ioConstraintsMd: "Input: an m × n grid of non-negative integers with 1 ≤ m, n ≤ 200. Output: the minimum path sum.",
    edgeCases: ["A single cell", "A single row or column (only one path)", "All zeros", "The first row and column have only one way to arrive", "Large values"],
    bruteForceMd: "Recursively try right and down from every cell and take the cheaper option.",
    bruteComplexity: "Exponential time without memoisation (C(m + n − 2, m − 1) paths).",
    bottleneckMd: "The best cost to reach a cell depends only on the best costs of the cell above and the cell to the left. Many paths share these subproblems, so DP solves each cell once.",
    hints: [
      "What is the cheapest way into a cell?", "The cell value plus the smaller of the cost into the cell above and the cost into the cell to the left.", "What about the cells in the first row and first column?", "They have only one neighbour to come from. A single array holding the previous row suffices.",
    ],
    optimalMd: "DP with cost[j] holding the minimum path sum into column j of the current row. For the first row the cost accumulates from the left. For later rows, cost[j] = grid[i][j] + min(cost[j] (from above, the old value), cost[j − 1] (from the left, already updated)); for j = 0 only the above neighbour exists. The answer is cost[n − 1]. Time O(m · n), memory O(n).",
    code: [
      cpp(`
int minPathSum(vector<vector<int>>& grid) {
    int m = grid.size(), n = grid[0].size();
    vector<int> cost(n, INT_MAX);                         // cost[j]: cheapest path into column j of the current row
    cost[0] = 0;
    for (int i = 0; i < m; ++i) {
        for (int j = 0; j < n; ++j) {
            int best = cost[j];                           // from above (INT_MAX on the first row except column 0)
            if (j > 0) best = min(best, cost[j - 1]);     // or from the left
            cost[j] = best + grid[i][j];
        }
    }
    return cost[n - 1];
}`, 'C++'),
      java(`
public int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[] cost = new int[n];                              // cost[j]: cheapest path into column j of the current row
    Arrays.fill(cost, Integer.MAX_VALUE);
    cost[0] = 0;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            int best = cost[j];                           // from above (MAX_VALUE on the first row except column 0)
            if (j > 0) best = Math.min(best, cost[j - 1]);   // or from the left
            cost[j] = best + grid[i][j];
        }
    }
    return cost[n - 1];
}`, 'Java'),
    ],
    finalComplexity: "O(m · n) time, O(n) space.",
    testCases: [
      { input: "[[1,3,1],[1,5,1],[4,2,1]]", expected: "7", why: "Path 1→3→1→1→1" },
      { input: "[[1,2,3],[4,5,6]]", expected: "12", why: "Path 1→2→3→6" },
      { input: "[[5]]", expected: "5", why: "Single cell" },
      { input: "[[1,2,3,4]]", expected: "10", why: "Single row" },
    ],
    takeawaysMd: "The same recurrence shape as unique paths, with min and + instead of +. Initialise unreachable cells to infinity (or handle the first row and column separately) so the single formula works everywhere.",
  },

  "triangle": {
    understandMd: "Given a triangle of numbers, find the minimum path sum from the top to the bottom. At each step you may move to one of the two adjacent numbers in the row below (same index or index + 1).",
    ioConstraintsMd: "Input: a triangle array with n rows (1 ≤ n ≤ 200), where row i has i + 1 integers (values may be negative). Output: the minimum top-to-bottom sum. Aim for O(n) extra space.",
    edgeCases: ["A single row", "Negative numbers", "Moving along the left edge or the right edge", "The minimum path zig-zags between positions", "Two rows"],
    bruteForceMd: "Recursively explore both adjacent choices from the top.",
    bruteComplexity: "O(2^n) time.",
    bottleneckMd: "Many paths pass through the same number, and the best completion from a number does not depend on how you got there. Computing from the bottom up avoids the exponential branching.",
    hints: [
      "Define best(i, j) as the minimum sum of a path starting at row i, column j and going to the bottom. What does it equal?", "triangle[i][j] + min(best(i + 1, j), best(i + 1, j + 1)).", "Which direction should you fill the table so every dependency is ready?", "From the bottom row upwards. You only ever need the row below, so one array of size n is enough.",
    ],
    optimalMd: "Bottom-up DP in place on a copy of the last row. Let dp be the bottom row. For each row above, from the second-to-last up to the first, update dp[j] = triangle[i][j] + min(dp[j], dp[j + 1]) for j from 0 to i. After processing the top row dp[0] is the answer. Overwriting dp[j] is safe because dp[j + 1] has not been changed yet in the same row when j is processed in increasing order, and it is only read, not written, before it is needed for j + 1.",
    code: [
      cpp(`
int minimumTotal(vector<vector<int>>& triangle) {
    int n = triangle.size();
    vector<int> dp(triangle[n - 1]);                      // best sums starting from the bottom row
    for (int i = n - 2; i >= 0; --i)
        for (int j = 0; j <= i; ++j)
            dp[j] = triangle[i][j] + min(dp[j], dp[j + 1]); // pick the cheaper of the two cells below
    return dp[0];
}`, 'C++'),
      java(`
public int minimumTotal(List<List<Integer>> triangle) {
    int n = triangle.size();
    int[] dp = new int[n];                                // best sums starting from the bottom row
    for (int j = 0; j < n; j++) dp[j] = triangle.get(n - 1).get(j);
    for (int i = n - 2; i >= 0; i--)
        for (int j = 0; j <= i; j++)
            dp[j] = triangle.get(i).get(j) + Math.min(dp[j], dp[j + 1]);   // pick the cheaper of the two cells below
    return dp[0];
}`, 'Java'),
    ],
    finalComplexity: "O(n²) time (every number is visited once), O(n) space.",
    testCases: [
      { input: "[[2],[3,4],[6,5,7],[4,1,8,3]]", expected: "11", why: "Path 2→3→5→1" },
      { input: "[[-10]]", expected: "-10", why: "Single row" },
      { input: "[[1],[2,3]]", expected: "3", why: "Two rows" },
      { input: "[[-1],[-2,-3],[-4,-5,-6]]", expected: "-10", why: "All negative: take the smallest at every step" },
    ],
    takeawaysMd: "When a DP flows from the end to the start of a structure, fill it bottom-up so each cell has what it needs. Updating a single array in place keeps the space linear in the number of rows.",
  },

  "maximal-square": {
    understandMd: "In a binary matrix of characters '0' and '1', find the largest square that contains only '1' and return its area.",
    ioConstraintsMd: "Input: an m × n matrix of characters '0' and '1' with 1 ≤ m, n ≤ 300. Output: the area (side × side) of the largest all-ones square.",
    edgeCases: ["No ones at all (area 0)", "The whole matrix is ones", "A single row or column", "Several equal-sized squares", "A single '1'"],
    bruteForceMd: "For every cell treat it as the top-left corner and grow the square while all the cells are ones.",
    bruteComplexity: "O(m · n · min(m, n)²) time.",
    bottleneckMd: "Whether a square of side s ends at a cell depends only on the three neighbours above-left, above and left. A DP that stores the side of the largest square ending at each cell reuses these results.",
    hints: [
      "If a cell is the bottom-right corner of a square of side s, what must be true of three neighbouring cells?", "The cells above, left and above-left must each be the corner of a square of side at least s − 1.", "So the largest square ending here is 1 + the minimum of those three.", "If the cell is 0 the value is 0. Track the best side seen and square it at the end.",
    ],
    optimalMd: "Let dp[i][j] be the side of the largest all-ones square whose bottom-right corner is (i, j). If the cell is '0' then dp = 0; otherwise dp[i][j] = 1 + min(dp[i − 1][j], dp[i][j − 1], dp[i − 1][j − 1]) (with out-of-range neighbours counted as 0). The answer is the square of the maximum dp value. Two rows (or one row plus a saved diagonal value) are enough, giving O(n) memory.",
    code: [
      cpp(`
int maximalSquare(vector<vector<char>>& matrix) {
    int m = matrix.size(), n = matrix[0].size(), best = 0;
    vector<int> dp(n + 1, 0);                             // dp[j + 1]: side of the largest square ending at the current row, column j
    for (int i = 0; i < m; ++i) {
        int diag = 0;                                     // dp value of the cell above-left
        for (int j = 0; j < n; ++j) {
            int above = dp[j + 1];
            if (matrix[i][j] == '1') {
                dp[j + 1] = 1 + min({above, dp[j], diag});   // above, left and above-left
                best = max(best, dp[j + 1]);
            } else dp[j + 1] = 0;
            diag = above;
        }
    }
    return best * best;
}`, 'C++'),
      java(`
public int maximalSquare(char[][] matrix) {
    int m = matrix.length, n = matrix[0].length, best = 0;
    int[] dp = new int[n + 1];                            // dp[j + 1]: side of the largest square ending at the current row, column j
    for (int i = 0; i < m; i++) {
        int diag = 0;                                     // dp value of the cell above-left
        for (int j = 0; j < n; j++) {
            int above = dp[j + 1];
            if (matrix[i][j] == '1') {
                dp[j + 1] = 1 + Math.min(Math.min(above, dp[j]), diag);   // above, left and above-left
                best = Math.max(best, dp[j + 1]);
            } else dp[j + 1] = 0;
            diag = above;
        }
    }
    return best * best;
}`, 'Java'),
    ],
    finalComplexity: "O(m · n) time, O(n) space.",
    testCases: [
      { input: "the 4 × 5 example grid", expected: "4", why: "A 2 × 2 square of ones" },
      { input: "[[\"0\",\"1\"],[\"1\",\"0\"]]", expected: "1", why: "Isolated ones" },
      { input: "[[\"0\"]]", expected: "0", why: "No ones" },
      { input: "[[\"1\",\"1\"],[\"1\",\"1\"]]", expected: "4", why: "The whole matrix" },
    ],
    takeawaysMd: "\"Largest square ending here\" is 1 + min(three neighbours). The min of three captures that the square must be supported on all sides. Keep the previous diagonal in a variable to save a full row.",
  },

  "domino-and-tromino-tiling": {
    understandMd: "Count the ways to tile a 2 × n board completely using 2 × 1 dominoes (placed either way) and L-shaped trominoes (any rotation). Two tilings differ if some pair of cells is covered by the same tile in one and by different tiles in the other. Return the count modulo 10^9 + 7.",
    ioConstraintsMd: "Input: an integer n from 1 to 1,000. Output: the number of tilings modulo 1,000,000,007.",
    edgeCases: ["n = 1 (one vertical domino)", "n = 2 (two tilings with dominoes only)", "n = 3 (the first n with a tromino pair)", "Large n (needs the modulus)", "Tilings that use trominoes in pairs"],
    bruteForceMd: "Exhaustive search that places a tile on the first empty cell in every possible way.",
    bruteComplexity: "Exponential time (every tile placement is tried).",
    bottleneckMd: "The brute force is exponential. The structure of 2 × n tilings is repetitive: a tiling is built from simple blocks, and trominoes always appear as interlocking pairs spanning at least two columns, which leads to a short linear recurrence.",
    hints: [
      "Look at the left end of the board. What blocks can cover the first column?", "A vertical domino (leaves 2 × (n − 1)), two horizontal dominoes (leaves 2 × (n − 2)), or a pair of interlocking L-trominoes.", "A pair of trominoes opens up a \"jagged\" edge that must be closed by more trominoes or dominoes. How long can that chain be?", "Any length ≥ 3, and each chain length has exactly two mirror shapes. Working this out gives f(n) = 2 · f(n − 1) + f(n − 3).",
    ],
    optimalMd: "Let f(n) be the number of tilings of a 2 × n board with f(0) = 1, f(1) = 1, f(2) = 2. The recurrence is f(n) = 2 · f(n − 1) + f(n − 3). Derivation sketch: f(n − 1) (with a vertical domino) and f(n − 2) (two horizontal dominoes) account for the simple endings, and the tromino chains add 2 · (f(n − 3) + f(n − 4) + …) which telescopes to the recurrence above when subtracting f(n − 1). Compute it iteratively keeping the last three values, taking the result modulo 10^9 + 7 at each step.",
    code: [
      cpp(`
int numTilings(int n) {
    const int MOD = 1'000'000'007;
    if (n <= 2) return n;                                 // f(1) = 1, f(2) = 2
    long long a = 1, b = 1, c = 2;                        // f(n-3), f(n-2), f(n-1) starting with f(0), f(1), f(2)
    for (int i = 3; i <= n; ++i) {
        long long next = (2 * c + a) % MOD;               // f(n) = 2 f(n-1) + f(n-3)
        a = b; b = c; c = next;
    }
    return (int)c;
}`, 'C++'),
      java(`
public int numTilings(int n) {
    final int MOD = 1_000_000_007;
    if (n <= 2) return n;                                 // f(1) = 1, f(2) = 2
    long a = 1, b = 1, c = 2;                             // f(n-3), f(n-2), f(n-1) starting with f(0), f(1), f(2)
    for (int i = 3; i <= n; i++) {
        long next = (2 * c + a) % MOD;                    // f(n) = 2 f(n-1) + f(n-3)
        a = b; b = c; c = next;
    }
    return (int) c;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "n = 3", expected: "5", why: "Includes the two L-tromino tilings" },
      { input: "n = 4", expected: "11", why: "f(4) = 2·5 + 1" },
      { input: "n = 5", expected: "24", why: "f(5) = 2·11 + 2" },
      { input: "n = 30", expected: "312342182", why: "Modular result" },
    ],
    takeawaysMd: "When counting tilings, find the small set of \"building blocks\" at one end and a recurrence follows. Verifying a derived recurrence against an exhaustive counter for small n is the safest way to be sure it is right.",
  },

  "n-th-tribonacci-number": {
    understandMd: "The Tribonacci sequence is defined by T0 = 0, T1 = 1, T2 = 1 and T(n + 3) = T(n) + T(n + 1) + T(n + 2). Return T(n).",
    ioConstraintsMd: "Input: an integer n from 0 to 37 (the result fits in a 32-bit integer). Output: the n-th Tribonacci number.",
    edgeCases: ["n = 0, 1, 2 (base cases)", "n = 3 (first computed value)", "n = 37 (largest input, near the int limit)", "Avoiding exponential recursion"],
    bruteForceMd: "Direct recursion T(n) = T(n − 1) + T(n − 2) + T(n − 3).",
    bruteComplexity: "Exponential time (roughly 1.84^n calls).",
    bottleneckMd: "The recursion recomputes the same values repeatedly. Each term only needs the previous three, so keep just those.",
    hints: [
      "Which earlier values does T(n) depend on?", "Only the three before it.", "Do you need to store the whole sequence?", "No: keep a sliding window of three variables and update them in a loop.",
    ],
    optimalMd: "Iterate from 3 to n, holding the last three terms a, b, c. At each step the new term is a + b + c; shift the window by assigning a = b, b = c, c = new term. Handle n < 3 directly. This uses O(n) time and O(1) space. (For huge n, matrix exponentiation gives O(log n).)",
    code: [
      cpp(`
int tribonacci(int n) {
    if (n == 0) return 0;
    if (n <= 2) return 1;
    int a = 0, b = 1, c = 1;                              // T(i-3), T(i-2), T(i-1)
    for (int i = 3; i <= n; ++i) {
        int next = a + b + c;
        a = b; b = c; c = next;
    }
    return c;
}`, 'C++'),
      java(`
public int tribonacci(int n) {
    if (n == 0) return 0;
    if (n <= 2) return 1;
    int a = 0, b = 1, c = 1;                              // T(i-3), T(i-2), T(i-1)
    for (int i = 3; i <= n; i++) {
        int next = a + b + c;
        a = b; b = c; c = next;
    }
    return c;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "n = 4", expected: "4", why: "0, 1, 1, 2, 4" },
      { input: "n = 25", expected: "1389537", why: "Mid-range value" },
      { input: "n = 37", expected: "2082876103", why: "Largest input" },
      { input: "n = 0", expected: "0", why: "Base case" },
    ],
    takeawaysMd: "A linear recurrence of order k needs only the last k values. Rolling variables replace the table and bring the space to O(1).",
  },

  "best-time-to-buy-and-sell-stock-iii": {
    understandMd: "Given the price of a stock on each day, you may complete at most two transactions (a buy followed by a sell), and you may not hold more than one share at a time. Return the maximum profit.",
    ioConstraintsMd: "Input: an array of 1 to 100,000 non-negative prices. Output: the maximum profit using at most two transactions (0 if no profit is possible).",
    edgeCases: ["Prices only fall (0)", "A single day", "One transaction is enough (the second adds nothing)", "Two separate rises with a drop between them", "Equal prices"],
    bruteForceMd: "Try every split point and take the best single transaction before it plus the best single transaction after it.",
    bruteComplexity: "O(n²) time (or O(n) with prefix and suffix arrays).",
    bottleneckMd: "The profit of the plan depends on four decisions in order: first buy, first sell, second buy, second sell. A small state machine tracks the best value of each stage as the days pass.",
    hints: [
      "How many different \"stages\" can you be in at the end of a day?", "Before any buy, holding after the first buy, after the first sell, holding after the second buy, after the second sell.", "For each stage keep the best profit achievable so far.", "The first buy stage is −price; the first sell is buy1 + price; the second buy is sell1 − price; the second sell is buy2 + price. Update all four per day.",
    ],
    optimalMd: "Keep four values: buy1 (best balance after buying once, initially −∞), sell1 (after selling once), buy2 and sell2. For each price p: buy1 = max(buy1, −p); sell1 = max(sell1, buy1 + p); buy2 = max(buy2, sell1 − p); sell2 = max(sell2, buy2 + p). Because each stage reads the previous stage's already-updated value, same-day buy and sell (profit 0) are also covered. The answer is sell2. One pass, O(1) space.",
    code: [
      cpp(`
int maxProfit(vector<int>& prices) {
    int buy1 = INT_MIN / 2, sell1 = 0, buy2 = INT_MIN / 2, sell2 = 0;   // best balance in each stage
    for (int p : prices) {
        buy1 = max(buy1, -p);                             // first purchase
        sell1 = max(sell1, buy1 + p);                     // first sale
        buy2 = max(buy2, sell1 - p);                      // second purchase, funded by the first profit
        sell2 = max(sell2, buy2 + p);                     // second sale
    }
    return sell2;
}`, 'C++'),
      java(`
public int maxProfit(int[] prices) {
    int buy1 = Integer.MIN_VALUE / 2, sell1 = 0, buy2 = Integer.MIN_VALUE / 2, sell2 = 0;   // best balance in each stage
    for (int p : prices) {
        buy1 = Math.max(buy1, -p);                        // first purchase
        sell1 = Math.max(sell1, buy1 + p);                // first sale
        buy2 = Math.max(buy2, sell1 - p);                 // second purchase, funded by the first profit
        sell2 = Math.max(sell2, buy2 + p);                // second sale
    }
    return sell2;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[3,3,5,0,0,3,1,4]", expected: "6", why: "Buy 0 sell 3, buy 1 sell 4" },
      { input: "[1,2,3,4,5]", expected: "4", why: "One long hold" },
      { input: "[7,6,4,3,1]", expected: "0", why: "Never profitable" },
      { input: "[1]", expected: "0", why: "One day" },
    ],
    takeawaysMd: "A fixed number of transactions is a small state machine with one variable per stage. Updating the stages in order within a day lets each one build on the previous stage's best value.",
  },

  "best-time-to-buy-and-sell-stock-iv": {
    understandMd: "Given the price of a stock on each day and an integer k, you may complete at most k transactions (each a buy followed by a sell), holding at most one share at a time. Return the maximum profit.",
    ioConstraintsMd: "Input: k (0 to 100) and an array of 1 to 1,000 prices. Output: the maximum profit.",
    edgeCases: ["k = 0 (no profit)", "k at least n / 2 (effectively unlimited transactions)", "Prices only fall", "A single day", "k = 1 (the classic single transaction)"],
    bruteForceMd: "Recursively decide each day whether to buy, sell or skip, tracking the transactions left.",
    bruteComplexity: "Exponential time without memoisation.",
    bottleneckMd: "The state space is small: the day, whether you hold a share, and the transactions used. A table over (transaction number) with rolling updates handles it in O(n · k). When k is huge the constraint disappears, and the unlimited-transactions greedy applies.",
    hints: [
      "Generalise the two-transaction solution: how many stages does a k-transaction plan have?", "2k stages: buy1, sell1, …, buyk, sellk.", "Keep arrays buy[1..k] and sell[1..k] updated each day, each reading the previous stage.", "If k ≥ n / 2 you can never use more than n / 2 transactions, so sum all upward steps instead (saves memory and time).",
    ],
    optimalMd: "If k ≥ n / 2 the limit is irrelevant, so return the sum of all positive daily differences. Otherwise keep buy[j] (best balance holding after j buys, initially −∞) and sell[j] (best balance after j sales, initially 0) for j = 1..k. For each price p and for j from 1 to k: buy[j] = max(buy[j], sell[j − 1] − p); sell[j] = max(sell[j], buy[j] + p). The answer is sell[k]. Time is O(n · k) and space O(k).",
    code: [
      cpp(`
int maxProfit(int k, vector<int>& prices) {
    int n = prices.size();
    if (n < 2 || k == 0) return 0;
    if (k >= n / 2) {                                     // transactions are effectively unlimited
        int profit = 0;
        for (int i = 1; i < n; ++i) profit += max(0, prices[i] - prices[i - 1]);
        return profit;
    }
    vector<int> buy(k + 1, INT_MIN / 2), sell(k + 1, 0);  // best balance after j purchases / j sales
    for (int p : prices) {
        for (int j = 1; j <= k; ++j) {
            buy[j] = max(buy[j], sell[j - 1] - p);        // j-th purchase, funded by the profit of j-1 sales
            sell[j] = max(sell[j], buy[j] + p);           // j-th sale
        }
    }
    return sell[k];
}`, 'C++'),
      java(`
public int maxProfit(int k, int[] prices) {
    int n = prices.length;
    if (n < 2 || k == 0) return 0;
    if (k >= n / 2) {                                     // transactions are effectively unlimited
        int profit = 0;
        for (int i = 1; i < n; i++) profit += Math.max(0, prices[i] - prices[i - 1]);
        return profit;
    }
    int[] buy = new int[k + 1], sell = new int[k + 1];    // best balance after j purchases / j sales
    Arrays.fill(buy, Integer.MIN_VALUE / 2);
    for (int p : prices) {
        for (int j = 1; j <= k; j++) {
            buy[j] = Math.max(buy[j], sell[j - 1] - p);   // j-th purchase, funded by the profit of j-1 sales
            sell[j] = Math.max(sell[j], buy[j] + p);      // j-th sale
        }
    }
    return sell[k];
}`, 'Java'),
    ],
    finalComplexity: "O(n · min(k, n / 2)) time, O(k) space.",
    testCases: [
      { input: "k = 2, [2,4,1]", expected: "2", why: "One profitable rise" },
      { input: "k = 2, [3,2,6,5,0,3]", expected: "7", why: "Buy 2 sell 6, buy 0 sell 3" },
      { input: "k = 0, [1,2,3,4,5]", expected: "0", why: "No transactions allowed" },
      { input: "k = 100, [1,2,3,4,5]", expected: "4", why: "Unlimited shortcut" },
    ],
    takeawaysMd: "Generalise the stage-per-transaction state machine to k stages. When k exceeds half the number of days the limit is slack, so special-case it for both speed and memory.",
  },

  "best-time-to-buy-and-sell-stock-with-transaction-fee": {
    understandMd: "Given the price of a stock on each day and an integer fee, you may buy and sell as many times as you like but hold at most one share, paying the fee once for each transaction (charged when you sell). Return the maximum profit.",
    ioConstraintsMd: "Input: an array of up to 50,000 prices and a non-negative fee. Output: the maximum profit.",
    edgeCases: ["A fee larger than any possible gain (profit 0)", "Fee 0 (the unlimited-transactions problem)", "A single day", "Prices that rise slowly (fees make many small trades unprofitable)", "Strictly decreasing prices"],
    bruteForceMd: "Recursively choose to buy, sell or wait each day.",
    bruteComplexity: "Exponential time without memoisation.",
    bottleneckMd: "Only two states matter at the end of a day: holding a share or not. The best balance in each state can be updated in constant time from the previous day.",
    hints: [
      "What are the possible states at the end of a day?", "Holding a share, or holding cash.", "What are the transitions into \"holding\"?", "Keep holding, or buy today from the cash state: hold = max(hold, cash − price). And into \"cash\"? Keep cash, or sell today and pay the fee: cash = max(cash, hold + price − fee).",
    ],
    optimalMd: "Two-state DP with cash (best balance not holding a share, initially 0) and hold (best balance holding a share, initially −∞). For each price p: newCash = max(cash, hold + p − fee) and newHold = max(hold, cash − p), computed from the previous values. The fee is charged at the sale. The answer is cash after the last day. This runs in O(n) time with O(1) space.",
    code: [
      cpp(`
int maxProfit(vector<int>& prices, int fee) {
    long long cash = 0, hold = LLONG_MIN / 2;             // best balance without / with a share in hand
    for (int p : prices) {
        long long newCash = max(cash, hold + p - fee);    // sell today (pay the fee) or keep waiting
        long long newHold = max(hold, cash - p);          // buy today or keep holding
        cash = newCash; hold = newHold;
    }
    return (int)cash;
}`, 'C++'),
      java(`
public int maxProfit(int[] prices, int fee) {
    long cash = 0, hold = Long.MIN_VALUE / 2;             // best balance without / with a share in hand
    for (int p : prices) {
        long newCash = Math.max(cash, hold + p - fee);    // sell today (pay the fee) or keep waiting
        long newHold = Math.max(hold, cash - p);          // buy today or keep holding
        cash = newCash; hold = newHold;
    }
    return (int) cash;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,3,2,8,4,9], fee = 2", expected: "8", why: "Buy 1 sell 8, buy 4 sell 9" },
      { input: "[1,3,7,5,10,3], fee = 3", expected: "6", why: "Buy 1 sell 10 once" },
      { input: "[1,2,3,4], fee = 10", expected: "0", why: "The fee exceeds any gain" },
      { input: "[5], fee = 1", expected: "0", why: "Single day" },
    ],
    takeawaysMd: "Two states (cash and holding) with transitions that include the cost of the action capture \"unlimited transactions with a fee\". Charge the fee on one side of the transaction only.",
  },

  "maximum-sum-circular-subarray": {
    understandMd: "In a circular array (the last element is adjacent to the first), find the maximum possible sum of a non-empty subarray. A subarray may wrap around the end, but it may not use any element more than once.",
    ioConstraintsMd: "Input: an integer array of length 1 to 30,000 with values between −30,000 and 30,000. Output: the maximum circular subarray sum.",
    edgeCases: ["All elements negative (the answer is the largest single element, not 0)", "A single element", "The best subarray wraps around the end", "The best subarray is the whole array", "The best subarray does not wrap"],
    bruteForceMd: "For every start index and every length up to n, compute the sum of the circular range.",
    bruteComplexity: "O(n²) time.",
    bottleneckMd: "A wrapping subarray is the complement of a non-wrapping one: it equals the total sum minus a contiguous block in the middle. Maximising the wrapping sum is the same as minimising that middle block, and both extremes can be found with Kadane's algorithm.",
    hints: [
      "What does a wrapping subarray look like in terms of the elements it leaves out?", "It leaves out a contiguous block in the middle.", "So its sum is the total minus that block's sum. To maximise it, which block should you remove?", "The one with the minimum sum, found with a minimum-subarray version of Kadane. Watch out: if every element is negative the \"remove the minimum block\" idea would remove everything; in that case use the plain maximum.",
    ],
    optimalMd: "Run Kadane twice in one pass: maxSub for the largest non-wrapping subarray and minSub for the smallest non-wrapping subarray, and also compute the total sum. The best wrapping subarray has sum total − minSub. The answer is max(maxSub, total − minSub), except when maxSub < 0 (all elements negative), where total − minSub would correspond to the empty subarray, so return maxSub. Time O(n), space O(1).",
    code: [
      cpp(`
int maxSubarraySumCircular(vector<int>& nums) {
    int total = 0, curMax = 0, curMin = 0, best = nums[0], worst = nums[0];
    for (int x : nums) {
        total += x;
        curMax = max(curMax + x, x);                      // Kadane for the largest subarray
        best = max(best, curMax);
        curMin = min(curMin + x, x);                      // Kadane for the smallest subarray
        worst = min(worst, curMin);
    }
    if (best < 0) return best;                            // every element is negative: do not use the empty complement
    return max(best, total - worst);                      // either no wrap, or the total minus the weakest middle block
}`, 'C++'),
      java(`
public int maxSubarraySumCircular(int[] nums) {
    int total = 0, curMax = 0, curMin = 0, best = nums[0], worst = nums[0];
    for (int x : nums) {
        total += x;
        curMax = Math.max(curMax + x, x);                 // Kadane for the largest subarray
        best = Math.max(best, curMax);
        curMin = Math.min(curMin + x, x);                 // Kadane for the smallest subarray
        worst = Math.min(worst, curMin);
    }
    if (best < 0) return best;                            // every element is negative: do not use the empty complement
    return Math.max(best, total - worst);                 // either no wrap, or the total minus the weakest middle block
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(1) space.",
    testCases: [
      { input: "[1,-2,3,-2]", expected: "3", why: "No wrap needed" },
      { input: "[5,-3,5]", expected: "10", why: "Wrapping subarray 5 + 5" },
      { input: "[-3,-2,-3]", expected: "-2", why: "All negative: the best single element" },
      { input: "[3,-1,2,-1]", expected: "4", why: "Wrapping 2 + (−1) + 3" },
    ],
    takeawaysMd: "A circular maximum is either a normal subarray or \"total minus a minimum middle block\". Remember the all-negative special case, where the complement would be empty.",
  },

  "simplify-path": {
    understandMd: "Convert an absolute Unix-style file path to its canonical form: it starts with a single slash, components are separated by single slashes, there is no trailing slash, \".\" means the current directory (ignored), \"..\" means go up one directory (ignored at the root), and runs of slashes count as one.",
    ioConstraintsMd: "Input: an absolute path string of up to 3,000 characters containing letters, digits, '.', '/' and '_'. Output: the simplified canonical path.",
    edgeCases: ["Root only (\"/\" or \"/../\")", "Multiple consecutive slashes", "A component that is three or more dots (it is an ordinary name such as \"...\")", "\"..\" at the root (stays at the root)", "Trailing slash"],
    bruteForceMd: "Repeatedly search and replace patterns like \"//\", \"/./\" and \"/x/../\" until the path stops changing.",
    bruteComplexity: "O(n²) time and fragile to edge cases.",
    bottleneckMd: "The path behaves like a stack of directory names: \"..\" pops, a normal name pushes, and \".\" or empty components do nothing. Splitting on \"/\" gives the components directly.",
    hints: [
      "What data structure models \"going into\" and \"going back out of\" directories?", "A stack of directory names.", "Split the path on \"/\" and look at each component. What do empty, \".\", \"..\" and ordinary names mean?", "Empty and \".\" are skipped, \"..\" pops if the stack is not empty, anything else (including \"...\") is pushed. Join with \"/\" at the end.",
    ],
    optimalMd: "Split the path on \"/\" into components. For each component: ignore it if it is empty or \".\", pop the stack if it is \"..\" and the stack is not empty (at the root \"..\" does nothing), otherwise push it. The result is \"/\" followed by the components joined by \"/\", or just \"/\" if the stack is empty. This is one pass over the path.",
    code: [
      cpp(`
string simplifyPath(string path) {
    vector<string> dirs;                                  // the directories we are currently inside
    stringstream in(path);
    string part;
    while (getline(in, part, '/')) {
        if (part.empty() || part == ".") continue;        // "//" and "." change nothing
        if (part == "..") { if (!dirs.empty()) dirs.pop_back(); }   // go up, but never above the root
        else dirs.push_back(part);                        // an ordinary name (even "..." is a name)
    }
    string out;
    for (const string& d : dirs) out += "/" + d;
    return out.empty() ? "/" : out;
}`, 'C++'),
      java(`
public String simplifyPath(String path) {
    Deque<String> dirs = new ArrayDeque<>();              // the directories we are currently inside
    for (String part : path.split("/")) {
        if (part.isEmpty() || part.equals(".")) continue; // "//" and "." change nothing
        if (part.equals("..")) { if (!dirs.isEmpty()) dirs.removeLast(); }   // go up, but never above the root
        else dirs.addLast(part);                          // an ordinary name (even "..." is a name)
    }
    StringBuilder out = new StringBuilder();
    for (String d : dirs) out.append('/').append(d);
    return out.length() == 0 ? "/" : out.toString();
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "\"/home//foo/\"", expected: "\"/home/foo\"", why: "Double and trailing slashes" },
      { input: "\"/../\"", expected: "\"/\"", why: ".. at the root" },
      { input: "\"/.../a/../b/c/../d/./\"", expected: "\"/.../b/d\"", why: "\"...\" is an ordinary name" },
      { input: "\"/a/./b/../../c/\"", expected: "\"/c\"", why: "Pops back to the root and descends again" },
    ],
    takeawaysMd: "Path normalisation is a stack: names push, \"..\" pops, \".\" and empty parts are ignored. Check for the literal \"..\" exactly; names such as \"...\" or \"..hidden\" are valid directory names.",
  },

  "basic-calculator": {
    understandMd: "Evaluate an arithmetic expression string containing non-negative integers, the operators + and −, parentheses, and spaces. A minus sign can also be a unary negation in front of a parenthesised group or at the start of the expression. Return the value. The use of eval-like built-ins is not allowed.",
    ioConstraintsMd: "Input: a valid expression string of up to 300,000 characters. Output: its integer value (intermediate and final results fit in a 32-bit signed integer).",
    edgeCases: ["Leading unary minus such as \"-(2+3)\"", "Nested parentheses", "Spaces everywhere", "A negative number inside parentheses \"(-2)\"", "A minus before a parenthesis that itself contains minus signs"],
    bruteForceMd: "Repeatedly find an innermost pair of parentheses, evaluate it left to right, and substitute the result back into the string.",
    bruteComplexity: "O(n²) time because of the repeated string rewriting.",
    bottleneckMd: "Only + and − exist, so the sign applied to a group simply multiplies everything inside it. A single left-to-right pass with a stack for the context at each \"(\" evaluates everything.",
    hints: [
      "With only + and −, what does a minus sign in front of a parenthesis do to the terms inside?", "It flips the sign of every term inside.", "Keep a running result for the current level and the sign of the next number. What must be remembered when you enter a \"(\"?", "The result so far and the sign in front of the parenthesis; push them on a stack, start a fresh result inside, and when you meet \")\" combine: inner × saved sign + saved result.",
    ],
    optimalMd: "Scan left to right with: result (value of the current parenthesis level so far), sign (+1 or −1 for the next number) and num (the number being read). Digits extend num. On + or −: add sign · num to result, reset num and set the new sign. On \"(\": push result and sign onto a stack, reset result to 0 and sign to 1. On \")\": add sign · num to result, reset num, then pop the saved sign and multiply the inner result by it and add the saved result. After the loop add the final pending term. Each character is handled once.",
    code: [
      cpp(`
int calculate(string s) {
    long long result = 0, num = 0;
    int sign = 1;
    vector<long long> stack;                              // saved (result, sign) pairs for the enclosing levels
    for (char c : s) {
        if (isdigit(c)) {
            num = num * 10 + (c - '0');
        } else if (c == '+' || c == '-') {
            result += sign * num; num = 0;                // finish the previous term
            sign = (c == '+') ? 1 : -1;
        } else if (c == '(') {
            stack.push_back(result); stack.push_back(sign);   // remember the outer level
            result = 0; sign = 1;
        } else if (c == ')') {
            result += sign * num; num = 0;
            result *= stack.back(); stack.pop_back();     // the sign in front of the parenthesis
            result += stack.back(); stack.pop_back();     // plus what we had before it
        }                                                 // spaces are ignored
    }
    return (int)(result + sign * num);
}`, 'C++'),
      java(`
public int calculate(String s) {
    long result = 0, num = 0;
    int sign = 1;
    Deque<Long> stack = new ArrayDeque<>();               // saved (result, sign) pairs for the enclosing levels
    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) {
            num = num * 10 + (c - '0');
        } else if (c == '+' || c == '-') {
            result += sign * num; num = 0;                // finish the previous term
            sign = (c == '+') ? 1 : -1;
        } else if (c == '(') {
            stack.push(result); stack.push((long) sign);  // remember the outer level
            result = 0; sign = 1;
        } else if (c == ')') {
            result += sign * num; num = 0;
            result *= stack.pop();                        // the sign in front of the parenthesis
            result += stack.pop();                        // plus what we had before it
        }                                                 // spaces are ignored
    }
    return (int) (result + sign * num);
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space for the stack (the nesting depth).",
    testCases: [
      { input: "\"1 + 1\"", expected: "2", why: "Simple" },
      { input: "\"(1+(4+5+2)-3)+(6+8)\"", expected: "23", why: "Nested groups" },
      { input: "\"-(2+3)\"", expected: "-5", why: "Unary minus before a group" },
      { input: "\"1-(     -2)\"", expected: "3", why: "Spaces and a negative inside parentheses" },
    ],
    takeawaysMd: "With only + and −, a parenthesis is \"result so far, sign in front\". Push both on entry and combine on exit. This single-pass idea extends to * and / with a second stack or by evaluating terms on the fly.",
  },

  "decode-string": {
    understandMd: "Decode a string encoded as k[encoded_string], which means the encoded string inside the brackets is repeated exactly k times. Encodings can be nested, and k is a positive integer. Letters outside any brackets stay as they are.",
    ioConstraintsMd: "Input: a valid encoded string of up to 30 characters containing lowercase letters, digits, \"[\" and \"]\" (digits only appear as repeat counts, which are up to 300). Output: the decoded string.",
    edgeCases: ["No brackets at all", "Nested encodings such as 3[a2[c]]", "Multi-digit counts like 10[a]", "Letters before and after a bracket group", "A group followed by another group"],
    bruteForceMd: "Repeatedly find the innermost bracket pair, expand it in the string, and substitute until no brackets remain.",
    bruteComplexity: "O(n · L) time where L is the length of the expanded result, with many string copies.",
    bottleneckMd: "Nested structure means you need to remember the context when you enter a bracket: the string built so far and the repeat count. A stack of such contexts handles any depth in one pass.",
    hints: [
      "What must you remember when you see \"[\"?", "The count that was just read and the text built before the bracket.", "What happens when you see \"]\"?", "Take the text built inside the brackets, repeat it count times, and append it to the saved outer text. Digits can have several characters, so accumulate them until you reach \"[\".",
    ],
    optimalMd: "Single pass with two stacks (or one stack of pairs). Keep cur (the text of the current level) and num (the repeat count being read). A digit extends num. On \"[\" push (cur, num) and reset cur to empty and num to 0. On \"]\" pop (prevText, k) and set cur = prevText + cur repeated k times. Any letter is appended to cur. At the end cur is the decoded string. The work is proportional to the length of the output.",
    code: [
      cpp(`
string decodeString(string s) {
    vector<pair<string, int>> stack;                      // (text before the "[", repeat count)
    string cur;
    int num = 0;
    for (char c : s) {
        if (isdigit(c)) {
            num = num * 10 + (c - '0');
        } else if (c == '[') {
            stack.push_back({cur, num});                  // save the outer context
            cur.clear(); num = 0;
        } else if (c == ']') {
            string inner = cur;
            cur = stack.back().first;
            for (int i = 0; i < stack.back().second; ++i) cur += inner;   // repeat the bracketed text
            stack.pop_back();
        } else {
            cur += c;
        }
    }
    return cur;
}`, 'C++'),
      java(`
public String decodeString(String s) {
    Deque<String> texts = new ArrayDeque<>();             // text before each open "["
    Deque<Integer> counts = new ArrayDeque<>();           // repeat count for each open "["
    StringBuilder cur = new StringBuilder();
    int num = 0;
    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) {
            num = num * 10 + (c - '0');
        } else if (c == '[') {
            texts.push(cur.toString()); counts.push(num); // save the outer context
            cur = new StringBuilder(); num = 0;
        } else if (c == ']') {
            String inner = cur.toString();
            cur = new StringBuilder(texts.pop());
            for (int i = counts.pop(); i > 0; i--) cur.append(inner);   // repeat the bracketed text
        } else {
            cur.append(c);
        }
    }
    return cur.toString();
}`, 'Java'),
    ],
    finalComplexity: "O(L) time where L is the length of the decoded string, O(L) space.",
    testCases: [
      { input: "\"3[a]2[bc]\"", expected: "\"aaabcbc\"", why: "Two groups" },
      { input: "\"3[a2[c]]\"", expected: "\"accaccacc\"", why: "Nested" },
      { input: "\"2[abc]3[cd]ef\"", expected: "\"abcabccdcdcdef\"", why: "Groups followed by plain letters" },
      { input: "\"10[a]\"", expected: "\"aaaaaaaaaa\"", why: "Multi-digit count" },
    ],
    takeawaysMd: "Nested repeats call for a stack of contexts: save (text so far, count) at \"[\" and rebuild at \"]\". Accumulate digits one at a time so counts above 9 work.",
  },

  "removing-stars-from-a-string": {
    understandMd: "A string contains lowercase letters and stars (*). In one operation a star removes itself together with the nearest non-star character to its left. Apply all the removals and return the resulting string.",
    ioConstraintsMd: "Input: a string of up to 100,000 characters made of letters and stars, constructed so that every star has a character to its left to remove. Output: the string after all stars (and the characters they removed) are gone.",
    edgeCases: ["No stars", "Stars that remove a freshly added letter immediately", "Consecutive stars removing several letters in turn", "All characters removed (empty result)", "A star right after another star removes the next letter to the left"],
    bruteForceMd: "Repeatedly find the first star, delete it and the character before it, and rescan.",
    bruteComplexity: "O(n²) time because of the repeated string edits.",
    bottleneckMd: "Each star always cancels the most recently kept letter, which is the last-in-first-out behaviour of a stack.",
    hints: [
      "Which letter does a star remove: the oldest or the newest among the letters still kept?", "The newest one before it.", "What structure gives you the most recent element in O(1)?", "A stack. Push every letter and pop on every star. A string used as a stack works in both languages.",
    ],
    optimalMd: "Scan the string once, maintaining the answer as a stack (a string or character buffer). If the character is a star, pop the last character; otherwise push it. Because every star is guaranteed to have a letter to its left, the pop is always valid. The stack at the end is the result. This is linear time and uses the output buffer as the stack.",
    code: [
      cpp(`
string removeStars(string s) {
    string kept;                                          // acts as the stack of surviving letters
    for (char c : s) {
        if (c == '*') kept.pop_back();                    // the star removes the nearest letter on its left
        else kept.push_back(c);
    }
    return kept;
}`, 'C++'),
      java(`
public String removeStars(String s) {
    StringBuilder kept = new StringBuilder();             // acts as the stack of surviving letters
    for (char c : s.toCharArray()) {
        if (c == '*') kept.setLength(kept.length() - 1);  // the star removes the nearest letter on its left
        else kept.append(c);
    }
    return kept.toString();
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "\"leet**cod*e\"", expected: "\"lecoe\"", why: "Stars remove t, e and d" },
      { input: "\"erase*****\"", expected: "\"\"", why: "Everything removed" },
      { input: "\"abc\"", expected: "\"abc\"", why: "No stars" },
      { input: "\"ab**cd*\"", expected: "\"c\"", why: "Consecutive stars" },
    ],
    takeawaysMd: "\"Remove the nearest earlier thing\" is a stack. Using the output buffer itself as the stack avoids a second structure.",
  },

  "dota2-senate": {
    understandMd: "A senate has Radiant (R) and Dire (D) senators in a line. The process runs in rounds; in each round every remaining senator, in order, may either ban one senator of the other party (who then loses all rights, including the right to act in this and future rounds) or announce victory if all remaining senators are from their own party. Both parties play optimally: each senator bans the next opposing senator who would otherwise act soonest. Return the winning party.",
    ioConstraintsMd: "Input: a string of R and D characters of length up to 10,000. Output: \"Radiant\" or \"Dire\".",
    edgeCases: ["A single senator", "Equal numbers of R and D", "One party at the start of the line has an early advantage", "Many rounds needed before one party disappears", "All senators from one party"],
    bruteForceMd: "Simulate the rounds directly: repeatedly walk the circle, letting each active senator ban the next active opponent.",
    bruteComplexity: "O(n²) time in the worst case.",
    bottleneckMd: "Each senator's best move is to ban the next opponent in turn order. The turn order after a round is just the survivors, each re-queued behind the senators who have yet to act. Two queues of positions model this precisely.",
    hints: [
      "Who is the most dangerous opponent for a senator?", "The next opposing senator in line, because they would act before any other opponent.", "Represent the line by the positions of the R senators and the D senators in two queues.", "Compare the front of each queue: the earlier position acts first and bans the other. The winner is re-queued at position + n (it acts again in the next round); the loser is dropped.",
    ],
    optimalMd: "Keep two queues with the indices of the Radiant and the Dire senators. While both queues are non-empty compare their fronts: the senator with the smaller index acts first, bans the other (that one is popped for good) and is pushed to the back of its own queue with index + n so it acts again in the next round after everyone currently in line. The party whose queue is not empty at the end wins. Each iteration removes one senator, so there are at most n − 1 iterations.",
    code: [
      cpp(`
string predictPartyVictory(string senate) {
    int n = senate.size();
    queue<int> radiant, dire;                             // positions of the senators who are still active
    for (int i = 0; i < n; ++i) (senate[i] == 'R' ? radiant : dire).push(i);
    while (!radiant.empty() && !dire.empty()) {
        int r = radiant.front(), d = dire.front();
        radiant.pop(); dire.pop();
        if (r < d) radiant.push(r + n);                   // R acts first: bans D and acts again next round
        else dire.push(d + n);                            // D acts first: bans R and acts again next round
    }
    return radiant.empty() ? "Dire" : "Radiant";
}`, 'C++'),
      java(`
public String predictPartyVictory(String senate) {
    int n = senate.length();
    Queue<Integer> radiant = new ArrayDeque<>(), dire = new ArrayDeque<>();   // positions of the senators who are still active
    for (int i = 0; i < n; i++) (senate.charAt(i) == 'R' ? radiant : dire).add(i);
    while (!radiant.isEmpty() && !dire.isEmpty()) {
        int r = radiant.poll(), d = dire.poll();
        if (r < d) radiant.add(r + n);                    // R acts first: bans D and acts again next round
        else dire.add(d + n);                             // D acts first: bans R and acts again next round
    }
    return radiant.isEmpty() ? "Dire" : "Radiant";
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "\"RD\"", expected: "\"Radiant\"", why: "R acts first and bans D" },
      { input: "\"RDD\"", expected: "\"Dire\"", why: "D bans R before R can act again" },
      { input: "\"DDRRR\"", expected: "\"Dire\"", why: "Early advantage carries over" },
      { input: "\"R\"", expected: "\"Radiant\"", why: "Single senator" },
    ],
    takeawaysMd: "A circular round-based game can be modelled with queues of positions; re-queueing a survivor at index + n puts it correctly behind everyone still waiting in the current round. Greedy \"ban the next opponent\" is the optimal move for both sides.",
  },

  "number-of-recent-calls": {
    understandMd: "Implement a RecentCounter class that counts recent requests. ping(t) records a new request at time t (in milliseconds) and returns the number of requests that happened in the inclusive range [t − 3000, t]. Calls to ping use strictly increasing values of t.",
    ioConstraintsMd: "ping(t) is called up to 10,000 times with strictly increasing t between 1 and 10^9. Output: for each call, the count of requests within the last 3,000 ms (including this one).",
    edgeCases: ["The first call returns 1", "A request exactly 3,000 ms old still counts (inclusive range)", "A request 3,001 ms old does not count", "A long gap between calls (everything before it expires)", "Many calls within one window"],
    bruteForceMd: "Store all request times in a list and, on each ping, count the ones within the window.",
    bruteComplexity: "O(n) per ping, O(n²) overall.",
    bottleneckMd: "Times only increase, so old requests expire in the order they arrived. A queue lets you drop expired ones from the front and keep the size equal to the answer.",
    hints: [
      "Which requests can never matter again once you have seen time t?", "Those older than t − 3000, because future times are larger.", "In which order do requests expire?", "In arrival order, so a queue fits: add t at the back, remove from the front while the front is older than t − 3000. The size of the queue is the answer.",
    ],
    optimalMd: "Keep a queue of the request times that are still inside the window. On ping(t), push t, then pop from the front while the front is smaller than t − 3000. Return the queue size. Because t strictly increases, each time is pushed once and popped at most once, so ping is O(1) amortised.",
    code: [
      cpp(`
class RecentCounter {
    queue<int> window;                                    // request times that may still count
public:
    RecentCounter() {}
    int ping(int t) {
        window.push(t);
        while (window.front() < t - 3000) window.pop();   // expired: older than 3000 ms
        return window.size();
    }
};`, 'C++'),
      java(`
class RecentCounter {
    private final Deque<Integer> window = new ArrayDeque<>();   // request times that may still count

    public RecentCounter() {}

    public int ping(int t) {
        window.addLast(t);
        while (window.peekFirst() < t - 3000) window.pollFirst();   // expired: older than 3000 ms
        return window.size();
    }
}`, 'Java'),
    ],
    finalComplexity: "O(1) amortised time per ping, O(W) space where W is the maximum number of requests in a window.",
    testCases: [
      { input: "ping(1), ping(100), ping(3001), ping(3002)", expected: "1, 2, 3, 3", why: "Range [1, 3001] still includes time 1" },
      { input: "ping(3000), ping(6000), ping(6001)", expected: "1, 2, 2", why: "A request exactly 3000 ms old counts" },
      { input: "ping(9002) after the above", expected: "1", why: "Everything before has expired" },
      { input: "ping(1) on a fresh counter", expected: "1", why: "First call" },
    ],
    takeawaysMd: "A sliding time window over monotonically increasing timestamps is a queue: push new times at the back, pop expired times from the front, and read the size.",
  },

  "online-stock-span": {
    understandMd: "Design a StockSpanner. next(price) is called once per day with that day's price and returns the span of the stock's price for the current day: the maximum number of consecutive days (starting from today and going backwards) for which the price was less than or equal to today's price.",
    ioConstraintsMd: "next(price) is called up to 10,000 times with prices between 1 and 100,000. Output: the span for each call.",
    edgeCases: ["The first day (span 1)", "Equal prices (they count as \"less than or equal\")", "A price greater than everything before (span equals the number of days so far)", "Strictly decreasing prices (every span is 1)", "A small price after a large one"],
    bruteForceMd: "For each call walk backwards over all stored prices while they are at most today's price.",
    bruteComplexity: "O(n) per call, O(n²) overall in the worst case (increasing prices).",
    bottleneckMd: "A day with a larger price swallows the spans of all the smaller days before it, so those days never need to be examined again. A monotonic stack that stores (price, span) pairs merges them.",
    hints: [
      "If today's price is at least yesterday's, what do you know about yesterday's span?", "Today's span includes all of yesterday's span plus one for yesterday itself.", "Keep a stack of (price, span) in decreasing price order.", "Pop entries whose price is ≤ the new price, adding their spans to today's span, then push (price, span).",
    ],
    optimalMd: "Maintain a stack of (price, span) pairs whose prices are strictly decreasing from bottom to top. For next(price): start with span = 1; while the stack is not empty and the top price is ≤ price, pop it and add its span; push (price, span) and return span. Each price is pushed once and popped at most once, so the amortised cost per call is O(1).",
    code: [
      cpp(`
class StockSpanner {
    vector<pair<int, int>> st;                            // (price, span), prices strictly decreasing
public:
    StockSpanner() {}
    int next(int price) {
        int span = 1;
        while (!st.empty() && st.back().first <= price) { // those days are covered by today's span
            span += st.back().second;
            st.pop_back();
        }
        st.push_back({price, span});
        return span;
    }
};`, 'C++'),
      java(`
class StockSpanner {
    private final Deque<int[]> st = new ArrayDeque<>();   // {price, span}, prices strictly decreasing

    public StockSpanner() {}

    public int next(int price) {
        int span = 1;
        while (!st.isEmpty() && st.peek()[0] <= price) {  // those days are covered by today's span
            span += st.pop()[1];
        }
        st.push(new int[]{price, span});
        return span;
    }
}`, 'Java'),
    ],
    finalComplexity: "O(1) amortised time per call, O(n) space in the worst case.",
    testCases: [
      { input: "100, 80, 60, 70, 60, 75, 85", expected: "1, 1, 1, 2, 1, 4, 6", why: "The classic example" },
      { input: "5, 5, 5, 4, 6", expected: "1, 2, 3, 1, 5", why: "Equal prices extend the span" },
      { input: "strictly decreasing prices", expected: "all 1s", why: "Nothing to merge" },
      { input: "strictly increasing prices", expected: "1, 2, 3, …", why: "Each call merges the whole stack" },
    ],
    takeawaysMd: "A monotonic stack that stores (value, accumulated count) turns \"how far back is the previous greater element\" into amortised O(1). Merge counts as you pop so nothing is rescanned.",
  },

  "minimum-number-of-arrows-to-burst-balloons": {
    understandMd: "Balloons are horizontal intervals [xstart, xend] on the x-axis. An arrow shot vertically at position x bursts every balloon whose interval contains x (including its endpoints). Find the minimum number of arrows needed to burst all balloons.",
    ioConstraintsMd: "Input: an array of up to 100,000 intervals with integer endpoints in the 32-bit signed range (so subtracting endpoints can overflow). Output: the minimum number of arrows.",
    edgeCases: ["Empty list (0 arrows)", "Intervals that only touch at an endpoint (one arrow bursts both)", "Disjoint intervals (one arrow each)", "Identical intervals", "Extreme endpoints near INT_MIN / INT_MAX (do not subtract them when sorting)"],
    bruteForceMd: "Try placing arrows at every endpoint and search for the smallest set that hits every interval.",
    bruteComplexity: "Exponential in the number of intervals.",
    bottleneckMd: "The earliest-ending balloon must be hit by some arrow, and the best place for that arrow is exactly at that end, because that position is inside as many other balloons as possible. This is the interval-scheduling greedy.",
    hints: [
      "Take the balloon that ends first. Where should an arrow that bursts it be placed to burst as many other balloons as possible?", "At its right end: any balloon that starts at or before it and ends later is also hit.", "Sort by right end.", "Shoot at the first end, skip all balloons that start at or before that point, and shoot again at the next balloon's end.",
    ],
    optimalMd: "Sort the balloons by their right endpoint (comparing, never subtracting, to avoid overflow). Place the first arrow at the right end of the first balloon. For each following balloon, if its start is greater than the position of the last arrow, it is not hit: place a new arrow at its right end and count it. Otherwise it was already burst. Greedily choosing the earliest possible ends is optimal by an exchange argument. The cost is dominated by sorting, O(n log n).",
    code: [
      cpp(`
int findMinArrowShots(vector<vector<int>>& points) {
    if (points.empty()) return 0;
    sort(points.begin(), points.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });   // by right end; never subtract (overflow)
    int arrows = 1;
    long long lastShot = points[0][1];                    // shoot at the first balloon's right end
    for (size_t i = 1; i < points.size(); ++i) {
        if (points[i][0] > lastShot) {                    // starts after the last arrow: not burst yet
            ++arrows;
            lastShot = points[i][1];
        }
    }
    return arrows;
}`, 'C++'),
      java(`
public int findMinArrowShots(int[][] points) {
    if (points.length == 0) return 0;
    Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));   // by right end; never subtract (overflow)
    int arrows = 1;
    long lastShot = points[0][1];                         // shoot at the first balloon's right end
    for (int i = 1; i < points.length; i++) {
        if (points[i][0] > lastShot) {                    // starts after the last arrow: not burst yet
            arrows++;
            lastShot = points[i][1];
        }
    }
    return arrows;
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time for the sort, O(1) extra space.",
    testCases: [
      { input: "[[10,16],[2,8],[1,6],[7,12]]", expected: "2", why: "Shoot at 6 and at 12" },
      { input: "[[1,2],[3,4],[5,6],[7,8]]", expected: "4", why: "All disjoint" },
      { input: "[[1,2],[2,3],[3,4],[4,5]]", expected: "2", why: "Touching endpoints share an arrow" },
      { input: "[]", expected: "0", why: "No balloons" },
    ],
    takeawaysMd: "Minimum points that stab all intervals: sort by right end and shoot at each uncovered interval's right end. Compare endpoints instead of subtracting them, because extreme integers overflow.",
  },

  "evaluate-division": {
    understandMd: "You are given equations of the form A / B = value between variables (strings). For each query C / D, return the value if it can be determined from the equations, otherwise −1.0. A variable that never appears in any equation is unknown, even as C / C.",
    ioConstraintsMd: "Input: up to 20 equations with positive real values, and up to 20 queries over variable names. Output: one floating-point answer per query; unanswerable queries give −1.0.",
    edgeCases: ["A query about a variable that appears in no equation (−1, even for x / x)", "Two variables in different, disconnected groups", "A variable divided by itself (1.0 when it is known)", "Reverse direction (b / a is 1 / (a / b))", "A long chain of equations"],
    bruteForceMd: "For each query search all chains of equations one by one, multiplying values along the way.",
    bruteComplexity: "Repeated search from scratch for every query.",
    bottleneckMd: "The equations define a graph: each variable is a node and A / B = v gives an edge A → B of weight v and an edge B → A of weight 1 / v. A query is the product of the weights along any path, which a graph search finds.",
    hints: [
      "What does a chain such as a / b = 2 and b / c = 3 let you conclude about a / c?", "Multiply along the chain: a / c = 6.", "Model variables as nodes and equations as weighted edges. What is the weight of the reverse edge?", "1 / v. A query then asks for the product of weights on a path between two nodes, if one exists. Run a DFS or BFS from the numerator; if you reach the denominator return the accumulated product.",
    ],
    optimalMd: "Build an adjacency map where each equation A / B = v adds A → B with weight v and B → A with weight 1 / v. For each query: if either variable is not in the graph answer −1. If they are equal answer 1. Otherwise run a DFS from the numerator with a visited set, carrying the product of weights so far; when the denominator is reached return the product. If the search ends without reaching it, answer −1. With at most 20 equations each search is tiny; a weighted union-find gives near-constant time per query for large inputs.",
    code: [
      cpp(`
vector<double> calcEquation(vector<vector<string>>& equations, vector<double>& values, vector<vector<string>>& queries) {
    unordered_map<string, vector<pair<string, double>>> graph;
    for (size_t i = 0; i < equations.size(); ++i) {
        graph[equations[i][0]].push_back({equations[i][1], values[i]});          // a / b = v
        graph[equations[i][1]].push_back({equations[i][0], 1.0 / values[i]});    // b / a = 1 / v
    }
    auto solve = [&](const string& from, const string& to) -> double {
        if (!graph.count(from) || !graph.count(to)) return -1.0;
        unordered_set<string> seen;
        function<double(const string&, double)> dfs = [&](const string& cur, double acc) -> double {
            if (cur == to) return acc;
            seen.insert(cur);
            for (auto& edge : graph[cur]) {
                const string& next = edge.first; double w = edge.second;
                if (seen.count(next)) continue;
                double r = dfs(next, acc * w);                                   // multiply the ratios along the path
                if (r >= 0) return r;
            }
            return -1.0;
        };
        return dfs(from, 1.0);
    };
    vector<double> out;
    for (auto& q : queries) out.push_back(solve(q[0], q[1]));
    return out;
}`, 'C++'),
      java(`
public double[] calcEquation(List<List<String>> equations, double[] values, List<List<String>> queries) {
    Map<String, Map<String, Double>> graph = new HashMap<>();
    for (int i = 0; i < equations.size(); i++) {
        String a = equations.get(i).get(0), b = equations.get(i).get(1);
        graph.computeIfAbsent(a, k -> new HashMap<>()).put(b, values[i]);          // a / b = v
        graph.computeIfAbsent(b, k -> new HashMap<>()).put(a, 1.0 / values[i]);    // b / a = 1 / v
    }
    double[] out = new double[queries.size()];
    for (int i = 0; i < out.length; i++) {
        String from = queries.get(i).get(0), to = queries.get(i).get(1);
        out[i] = (graph.containsKey(from) && graph.containsKey(to)) ? dfs(graph, from, to, 1.0, new HashSet<>()) : -1.0;
    }
    return out;
}

private double dfs(Map<String, Map<String, Double>> graph, String cur, String to, double acc, Set<String> seen) {
    if (cur.equals(to)) return acc;
    seen.add(cur);
    for (Map.Entry<String, Double> e : graph.get(cur).entrySet()) {
        if (seen.contains(e.getKey())) continue;
        double r = dfs(graph, e.getKey(), to, acc * e.getValue(), seen);      // multiply the ratios along the path
        if (r >= 0) return r;
    }
    return -1.0;
}`, 'Java'),
    ],
    finalComplexity: "O(Q · (V + E)) time for Q queries on a graph with V variables and E equations, O(V + E) space.",
    testCases: [
      { input: "a/b = 2, b/c = 3; queries a/c, b/a, a/e, a/a, x/x", expected: "[6.0, 0.5, −1.0, 1.0, −1.0]", why: "Chain, reverse, unknown variables" },
      { input: "a/b = 1.5, b/c = 2.5, bc/cd = 5; queries a/c, c/b, bc/cd, cd/bc", expected: "[3.75, 0.4, 5.0, 0.2]", why: "Two separate groups" },
      { input: "a/b = 0.5; queries a/b, b/a, a/c, c/c", expected: "[0.5, 2.0, −1.0, −1.0]", why: "Unknown variable c" },
      { input: "inconsistent cycles", expected: "any consistent path product", why: "The input is guaranteed consistent" },
    ],
    takeawaysMd: "Ratios compose by multiplication, so a system of equations A / B = v is a weighted graph where reverse edges carry 1 / v. A query is a path product; no path means the answer is unknown.",
  },

  "minimum-genetic-mutation": {
    understandMd: "A gene is a string of 8 characters from A, C, G, T. One mutation changes exactly one character. Given a start gene, an end gene and a bank of valid genes, return the minimum number of mutations needed to turn the start into the end, where every intermediate gene must be in the bank (the start gene need not be). Return −1 if it is impossible.",
    ioConstraintsMd: "Input: start and end strings of length 8, and a bank of up to 10 gene strings of length 8. Output: the minimum number of mutations or −1.",
    edgeCases: ["Start equals end (0 mutations)", "End gene not in the bank (−1)", "Empty bank", "Several routes of different lengths (need the shortest)", "A start gene that is not in the bank"],
    bruteForceMd: "Try all mutation sequences recursively (depth-first search) and keep the shortest valid one.",
    bruteComplexity: "Exponential in the number of bank genes without pruning.",
    bottleneckMd: "Each gene is a node and a single-character change is an edge. Shortest paths in an unweighted graph are found by breadth-first search, which visits nodes in order of distance.",
    hints: [
      "Which graph has genes as nodes and mutations as edges?", "Connect two genes if they differ in exactly one position and the target is in the bank.", "The weight of every edge is one mutation. Which search finds the shortest path in an unweighted graph?", "Breadth-first search from the start gene. For each gene try changing each of the 8 positions to each of the other 3 letters and keep those that are in the bank and not yet visited.",
    ],
    optimalMd: "BFS over genes. Keep a queue holding (gene, distance), a set of bank genes for O(1) membership and a visited set. For each dequeued gene, generate every single-character mutation (8 positions × 3 other letters); if the mutation equals the end gene return distance + 1; if it is in the bank and unvisited, mark it and enqueue it with distance + 1. If the queue empties, the answer is −1. The state space is at most the bank size plus one, and each state does 24 constant-time mutations.",
    code: [
      cpp(`
int minMutation(string startGene, string endGene, vector<string>& bank) {
    if (startGene == endGene) return 0;
    unordered_set<string> valid(bank.begin(), bank.end());
    if (!valid.count(endGene)) return -1;                 // the target must itself be a valid gene
    queue<pair<string, int>> q;
    unordered_set<string> seen = {startGene};
    q.push({startGene, 0});
    const char letters[] = {'A', 'C', 'G', 'T'};
    while (!q.empty()) {
        string gene = q.front().first; int dist = q.front().second; q.pop();
        for (size_t i = 0; i < gene.size(); ++i) {
            char original = gene[i];
            for (char c : letters) {
                if (c == original) continue;
                gene[i] = c;                              // one mutation
                if (gene == endGene) return dist + 1;
                if (valid.count(gene) && !seen.count(gene)) { seen.insert(gene); q.push({gene, dist + 1}); }
            }
            gene[i] = original;                           // restore before changing the next position
        }
    }
    return -1;
}`, 'C++'),
      java(`
public int minMutation(String startGene, String endGene, String[] bank) {
    if (startGene.equals(endGene)) return 0;
    Set<String> valid = new HashSet<>(Arrays.asList(bank));
    if (!valid.contains(endGene)) return -1;              // the target must itself be a valid gene
    Queue<String> q = new ArrayDeque<>();
    Set<String> seen = new HashSet<>();
    q.add(startGene); seen.add(startGene);
    char[] letters = {'A', 'C', 'G', 'T'};
    int dist = 0;
    while (!q.isEmpty()) {
        dist++;
        for (int size = q.size(); size > 0; size--) {     // process one BFS layer at a time
            char[] gene = q.poll().toCharArray();
            for (int i = 0; i < gene.length; i++) {
                char original = gene[i];
                for (char c : letters) {
                    if (c == original) continue;
                    gene[i] = c;                          // one mutation
                    String next = new String(gene);
                    if (next.equals(endGene)) return dist;
                    if (valid.contains(next) && seen.add(next)) q.add(next);
                }
                gene[i] = original;                       // restore before changing the next position
            }
        }
    }
    return -1;
}`, 'Java'),
    ],
    finalComplexity: "O(B · L · 4) time for a bank of B genes of length L (here L = 8), O(B) space.",
    testCases: [
      { input: "start AACCGGTT, end AACCGGTA, bank [AACCGGTA]", expected: "1", why: "One direct mutation" },
      { input: "start AACCGGTT, end AAACGGTA, bank [AACCGGTA, AACCGCTA, AAACGGTA]", expected: "2", why: "Through AACCGGTA" },
      { input: "start AAAAACCC, end AACCCCCC, bank of three", expected: "3", why: "A chain of three mutations" },
      { input: "end gene not in the bank", expected: "-1", why: "Unreachable target" },
    ],
    takeawaysMd: "Shortest sequence of single changes through a word list is BFS on an implicit graph: generate neighbours by mutating one position and filter by membership in the set.",
  },

  "number-of-provinces": {
    understandMd: "There are n cities and an n × n matrix isConnected where isConnected[i][j] = 1 means city i and city j are directly connected (and 0 otherwise). A province is a group of cities that are directly or indirectly connected and not connected to any city outside the group. Return the number of provinces.",
    ioConstraintsMd: "Input: a symmetric n × n 0/1 matrix with 1s on the diagonal, 1 ≤ n ≤ 200. Output: the number of connected components.",
    edgeCases: ["A single city", "No connections between different cities (n provinces)", "All cities connected (1 province)", "Indirect connections through a chain", "Symmetric matrix with isolated nodes"],
    bruteForceMd: "Repeatedly merge sets of cities by scanning the matrix until nothing changes.",
    bruteComplexity: "O(n³) time.",
    bottleneckMd: "This is counting connected components. A union-find structure merges two cities per edge and tracks the number of remaining groups; a DFS from each unvisited city does the same.",
    hints: [
      "What graph concept does \"province\" correspond to?", "A connected component.", "Which structure merges groups as edges arrive and tells you how many groups are left?", "Union-find (disjoint set): start with n groups, decrement the count each time a union actually merges two different groups. A DFS that marks every city reachable from an unvisited city works too.",
    ],
    optimalMd: "Use disjoint sets with path compression. Initialise each city as its own parent and the province count to n. For every pair i < j with isConnected[i][j] == 1, find the roots of i and j; if they differ, link them and decrement the count. After scanning the upper triangle the count equals the number of connected components. Each union and find is near constant time, so the cost is O(n²) for scanning the matrix.",
    code: [
      cpp(`
int findCircleNum(vector<vector<int>>& isConnected) {
    int n = isConnected.size(), provinces = n;
    vector<int> parent(n);
    iota(parent.begin(), parent.end(), 0);
    function<int(int)> find = [&](int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); };   // path compression
    for (int i = 0; i < n; ++i)
        for (int j = i + 1; j < n; ++j)
            if (isConnected[i][j]) {
                int a = find(i), b = find(j);
                if (a != b) { parent[a] = b; --provinces; }                                  // two groups became one
            }
    return provinces;
}`, 'C++'),
      java(`
public int findCircleNum(int[][] isConnected) {
    int n = isConnected.length, provinces = n;
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (isConnected[i][j] == 1) {
                int a = find(parent, i), b = find(parent, j);
                if (a != b) { parent[a] = b; provinces--; }                                   // two groups became one
            }
    return provinces;
}

private int find(int[] parent, int x) {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }                  // path halving
    return x;
}`, 'Java'),
    ],
    finalComplexity: "O(n² · α(n)) time, O(n) space.",
    testCases: [
      { input: "[[1,1,0],[1,1,0],[0,0,1]]", expected: "2", why: "Cities 0 and 1 are connected; city 2 is alone" },
      { input: "identity matrix of size 3", expected: "3", why: "No connections" },
      { input: "[[1]]", expected: "1", why: "One city" },
      { input: "[[1,1,0,0],[1,1,1,0],[0,1,1,0],[0,0,0,1]]", expected: "2", why: "Indirect connection 0–1–2" },
    ],
    takeawaysMd: "Counting connected components: union-find starts with n components and loses one per successful union. Use path compression so finds stay almost constant time.",
  },

  "keys-and-rooms": {
    understandMd: "There are n rooms numbered 0 to n − 1. All rooms are locked except room 0. Each room contains a set of keys, each key opens one specific room. You start in room 0. Decide whether you can visit every room.",
    ioConstraintsMd: "Input: rooms[i] is the list of keys (room numbers) found in room i; 2 ≤ n ≤ 1,000 and the total number of keys is at most 3,000. Output: true if all rooms can be visited.",
    edgeCases: ["Keys that point back to visited rooms", "A room that no key opens (unreachable)", "A chain of rooms each holding the key to the next", "Empty key lists", "Rooms that hold keys to themselves"],
    bruteForceMd: "Repeat passes over all rooms, opening any room whose key you hold, until no new room opens.",
    bruteComplexity: "O(n · (n + K)) time in the worst case, where K is the total number of keys.",
    bottleneckMd: "This is reachability in a directed graph from node 0. A single DFS or BFS with a visited array does it in O(n + K).",
    hints: [
      "If rooms are nodes and keys are directed edges, what are you computing?", "Which nodes are reachable from node 0.", "How do you avoid visiting a room twice?", "A visited array. Stop the search when the stack or queue is empty. All rooms are visitable exactly when the number of visited rooms equals n.",
    ],
    optimalMd: "Depth-first search (or BFS) from room 0 over the key graph. Mark room 0 as visited and push it onto a stack; pop a room, and for every key it contains whose room is not yet visited, mark that room and push it. When the stack empties, check whether every room was visited. An iterative stack avoids deep recursion. Each room and key is processed once: O(n + K).",
    code: [
      cpp(`
bool canVisitAllRooms(vector<vector<int>>& rooms) {
    int n = rooms.size(), visited = 1;
    vector<bool> seen(n, false);
    vector<int> stack = {0};
    seen[0] = true;                                       // room 0 is unlocked
    while (!stack.empty()) {
        int room = stack.back(); stack.pop_back();
        for (int key : rooms[room]) {
            if (!seen[key]) { seen[key] = true; ++visited; stack.push_back(key); }   // a new room to explore
        }
    }
    return visited == n;
}`, 'C++'),
      java(`
public boolean canVisitAllRooms(List<List<Integer>> rooms) {
    int n = rooms.size(), visited = 1;
    boolean[] seen = new boolean[n];
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(0);
    seen[0] = true;                                       // room 0 is unlocked
    while (!stack.isEmpty()) {
        int room = stack.pop();
        for (int key : rooms.get(room)) {
            if (!seen[key]) { seen[key] = true; visited++; stack.push(key); }   // a new room to explore
        }
    }
    return visited == n;
}`, 'Java'),
    ],
    finalComplexity: "O(n + K) time and O(n) space, where K is the total number of keys.",
    testCases: [
      { input: "[[1],[2],[3],[]]", expected: "true", why: "Each room holds the next key" },
      { input: "[[1,3],[3,0,1],[2],[0]]", expected: "false", why: "Nobody holds the key to room 2" },
      { input: "[[],[]]", expected: "false", why: "Room 0 has no keys" },
      { input: "[[1,2],[],[]]", expected: "true", why: "Room 0 holds both keys" },
    ],
    takeawaysMd: "\"Can I reach everything from here?\" is a graph traversal. Mark nodes when you push them (not when you pop) so each is queued once.",
  },

  "snakes-and-ladders": {
    understandMd: "An n × n board is numbered from 1 to n² in a boustrophedon (zig-zag) order starting at the bottom-left and alternating direction each row. Starting on square 1, each move you roll a six-sided die and move to any square from 1 to 6 ahead (as if choosing the die result). If the landing square has a snake or ladder (a value other than −1), you must take it and move to the square it points to (only one jump per move). Return the minimum number of moves to reach square n², or −1 if it is impossible.",
    ioConstraintsMd: "Input: an n × n integer board (2 ≤ n ≤ 20) where board[r][c] is −1 or the destination of a snake or ladder. Squares 1 and n² have no snake or ladder. Output: the least number of moves or −1.",
    edgeCases: ["A ladder that reaches the final square directly", "A snake that sends you back to an earlier square (BFS must not loop forever)", "The boustrophedon numbering reverses direction on every other row", "A board with no snakes or ladders (steps of 6)", "Unreachable final square"],
    bruteForceMd: "Depth-first search over all die sequences, tracking the minimum number of moves.",
    bruteComplexity: "Exponential time without memoisation, and it can loop forever on snakes.",
    bottleneckMd: "Each square is a node with up to six outgoing edges of equal cost (one move). The minimum number of moves is a shortest path in an unweighted graph, found by BFS. The only fiddly part is converting a square number into board coordinates.",
    hints: [
      "What graph does the game define, and what are its edge weights?", "Nodes are squares 1..n², edges go to squares s + 1 … s + 6 (after applying any snake or ladder), each edge costing one move.", "Which algorithm gives the shortest path in an unweighted graph?", "BFS from square 1, tracking the number of moves, with a visited array. To read the board for square s: row r = (s − 1) / n from the bottom, column c = (s − 1) % n, flipped when r is odd.",
    ],
    optimalMd: "BFS over squares. Write a helper that maps a square number s to its board cell: with r = (s − 1) / n counted from the bottom, the board row is n − 1 − r and the column is (s − 1) % n when r is even and n − 1 − ((s − 1) % n) when r is odd. From the queue, for each die roll d from 1 to 6 compute t = s + d (stay within n²); if the cell has a value other than −1, jump: t = that value. If t has not been visited, record dist[t] = dist[s] + 1 and enqueue it; return as soon as n² is reached. If BFS ends without reaching it, return −1.",
    code: [
      cpp(`
int snakesAndLadders(vector<vector<int>>& board) {
    int n = board.size(), last = n * n;
    auto cellValue = [&](int s) {                         // board entry for square s (1-based, zig-zag numbering)
        int r = (s - 1) / n, c = (s - 1) % n;
        int row = n - 1 - r, col = (r % 2 == 0) ? c : n - 1 - c;
        return board[row][col];
    };
    vector<int> dist(last + 1, -1);
    queue<int> q;
    dist[1] = 0; q.push(1);
    while (!q.empty()) {
        int s = q.front(); q.pop();
        for (int d = 1; d <= 6 && s + d <= last; ++d) {
            int t = s + d;
            int jump = cellValue(t);
            if (jump != -1) t = jump;                     // forced snake or ladder
            if (dist[t] == -1) {
                dist[t] = dist[s] + 1;
                if (t == last) return dist[t];
                q.push(t);
            }
        }
    }
    return dist[last];
}`, 'C++'),
      java(`
public int snakesAndLadders(int[][] board) {
    int n = board.length, last = n * n;
    int[] dist = new int[last + 1];
    Arrays.fill(dist, -1);
    Queue<Integer> q = new ArrayDeque<>();
    dist[1] = 0; q.add(1);
    while (!q.isEmpty()) {
        int s = q.poll();
        for (int d = 1; d <= 6 && s + d <= last; d++) {
            int t = s + d;
            int jump = cellValue(board, n, t);
            if (jump != -1) t = jump;                     // forced snake or ladder
            if (dist[t] == -1) {
                dist[t] = dist[s] + 1;
                if (t == last) return dist[t];
                q.add(t);
            }
        }
    }
    return dist[last];
}

// board entry for square s (1-based, zig-zag numbering starting at the bottom-left)
private int cellValue(int[][] board, int n, int s) {
    int r = (s - 1) / n, c = (s - 1) % n;
    int row = n - 1 - r, col = (r % 2 == 0) ? c : n - 1 - c;
    return board[row][col];
}`, 'Java'),
    ],
    finalComplexity: "O(n²) time, O(n²) space.",
    testCases: [
      { input: "the 6 × 6 example board", expected: "4", why: "Ladders 15 and 13 help" },
      { input: "[[-1,-1],[-1,3]]", expected: "1", why: "Ladder from 3 to 3 is a no-op: the die gets you to 4 directly" },
      { input: "3 × 3 empty board", expected: "2", why: "Steps of up to 6 squares each" },
      { input: "[[1,1,-1],[1,1,1],[-1,1,1]]", expected: "-1", why: "Every reachable square is sent back to square 1" },
    ],
    takeawaysMd: "Board games with dice are shortest-path problems on an implicit graph. Isolate the awkward coordinate mapping into a small helper, apply forced jumps before the visited check, and use BFS because every move costs one.",
  },

  "reorder-routes-to-make-all-paths-lead-to-the-city-zero": {
    understandMd: "There are n cities numbered 0 to n − 1 connected by n − 1 one-way roads so that, ignoring directions, there is exactly one route between any two cities (the cities form a tree). Reorient (reverse) the minimum number of roads so that every city can reach city 0. Return that minimum number.",
    ioConstraintsMd: "Input: n (2 to 50,000) and a list of n − 1 directed roads [a, b] meaning a road from a to b. Output: the minimum number of roads to reverse.",
    edgeCases: ["A road already pointing toward 0 (no change)", "A star centred at 0 pointing outward (all must be reversed)", "A long chain (deep recursion if done naively)", "Mixed directions along one path", "Two cities"],
    bruteForceMd: "Try all subsets of roads to reverse and test whether every city can reach 0.",
    bruteComplexity: "Exponential in the number of roads.",
    bottleneckMd: "Because the cities form a tree, the path from each city to 0 is unique. Each road needs to be reversed exactly when it points away from 0. Walking the tree outward from 0 and checking each road's original direction counts them directly.",
    hints: [
      "Why is the answer determined by each road independently?", "In a tree there is only one path from any city to 0, so a road either lies on a path toward 0 in the right direction or not.", "Root the tree at 0. Which roads must be reversed?", "Those that point from a parent towards a child (away from 0). Store each road twice in an undirected adjacency list with a flag that says whether it is the original direction. A BFS from 0 sums the flags it crosses.",
    ],
    optimalMd: "Build an undirected adjacency list: for every road a → b store (b, 1) at a (traversing from a to b follows the original direction, which points away from the root when we come from a) and (a, 0) at b (traversing b to a goes against the original direction). BFS from city 0 and for every edge traversed to an unvisited neighbour add its flag to the answer: a flag of 1 means the road goes from the already-reached city outward and must be reversed. An iterative BFS avoids stack overflow on chains of 50,000 nodes. Time O(n).",
    code: [
      cpp(`
int minReorder(int n, vector<vector<int>>& connections) {
    vector<vector<pair<int, int>>> adj(n);                // (neighbour, 1 if the road originally points from here to the neighbour)
    for (auto& c : connections) {
        adj[c[0]].push_back({c[1], 1});
        adj[c[1]].push_back({c[0], 0});
    }
    vector<bool> seen(n, false);
    queue<int> q;
    q.push(0); seen[0] = true;
    int changes = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (auto& e : adj[u]) {
            int v = e.first, outward = e.second;
            if (seen[v]) continue;
            seen[v] = true;
            changes += outward;                           // a road pointing away from 0 must be reversed
            q.push(v);
        }
    }
    return changes;
}`, 'C++'),
      java(`
public int minReorder(int n, int[][] connections) {
    List<int[]>[] adj = new List[n];                      // {neighbour, 1 if the road originally points from here to the neighbour}
    for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
    for (int[] c : connections) {
        adj[c[0]].add(new int[]{c[1], 1});
        adj[c[1]].add(new int[]{c[0], 0});
    }
    boolean[] seen = new boolean[n];
    Queue<Integer> q = new ArrayDeque<>();
    q.add(0); seen[0] = true;
    int changes = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        for (int[] e : adj[u]) {
            if (seen[e[0]]) continue;
            seen[e[0]] = true;
            changes += e[1];                              // a road pointing away from 0 must be reversed
            q.add(e[0]);
        }
    }
    return changes;
}`, 'Java'),
    ],
    finalComplexity: "O(n) time, O(n) space.",
    testCases: [
      { input: "n = 6, [[0,1],[1,3],[2,3],[4,0],[4,5]]", expected: "3", why: "Roads 0→1, 1→3 and 4→5 point away from 0" },
      { input: "n = 5, [[1,0],[1,2],[3,2],[3,4]]", expected: "2", why: "Roads 1→2 and 3→4" },
      { input: "n = 3, [[1,0],[2,0]]", expected: "0", why: "Already all toward 0" },
      { input: "a chain 0→1→…→49999", expected: "49999", why: "Deep tree: BFS avoids deep recursion" },
    ],
    takeawaysMd: "In a tree, \"make everything reach the root\" is decided edge by edge: reverse exactly the edges that point away from the root. Store each edge in both directions with a flag and BFS outward from the root.",
  },

  "nearest-exit-from-entrance-in-maze": {
    understandMd: "A maze is a grid of empty cells ('.') and walls ('+'). You start at the entrance cell and can move up, down, left or right into empty cells. An exit is any empty cell on the border of the maze other than the entrance. Return the number of steps in the shortest path from the entrance to the nearest exit, or −1 if there is none.",
    ioConstraintsMd: "Input: an m × n maze (1 ≤ m, n ≤ 100) and the entrance coordinates (an empty cell). Output: the minimum number of steps to any exit, or −1.",
    edgeCases: ["The entrance is on the border (it is not an exit itself)", "No exit reachable", "An exit adjacent to the entrance", "A maze where the shortest exit is far from the nearest border cell in straight-line terms", "A single row or column"],
    bruteForceMd: "Depth-first search for all paths from the entrance to every exit, keeping the shortest.",
    bruteComplexity: "Exponential in the worst case without visited tracking.",
    bottleneckMd: "All moves cost one step, so the nearest exit is found by breadth-first search, which explores cells in increasing order of distance and stops at the first exit it meets.",
    hints: [
      "What kind of search finds the closest target in an unweighted grid?", "BFS from the entrance.", "How do you recognise an exit?", "An empty border cell that is not the entrance. Mark cells as visited when you enqueue them (for example by turning them into walls) so each is processed once.",
    ],
    optimalMd: "BFS from the entrance with a queue of (row, col) and a step counter processed layer by layer. Mark the entrance visited. For each cell in the current layer look at its four neighbours: if a neighbour is an unvisited empty cell, mark it visited; if it lies on the border it is an exit, so return steps + 1; otherwise enqueue it. If the queue empties, return −1. Marking at enqueue time guarantees each cell enters the queue once, so the total work is O(m · n).",
    code: [
      cpp(`
int nearestExit(vector<vector<char>>& maze, vector<int>& entrance) {
    int m = maze.size(), n = maze[0].size();
    queue<pair<int, int>> q;
    q.push({entrance[0], entrance[1]});
    maze[entrance[0]][entrance[1]] = '+';                 // mark visited by turning it into a wall
    int steps = 0;
    const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        ++steps;
        for (int size = q.size(); size > 0; --size) {     // one BFS layer per step
            int r = q.front().first, c = q.front().second; q.pop();
            for (int k = 0; k < 4; ++k) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr][nc] == '+') continue;
                if (nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1) return steps;   // a border cell is an exit
                maze[nr][nc] = '+';
                q.push({nr, nc});
            }
        }
    }
    return -1;
}`, 'C++'),
      java(`
public int nearestExit(char[][] maze, int[] entrance) {
    int m = maze.length, n = maze[0].length;
    Queue<int[]> q = new ArrayDeque<>();
    q.add(new int[]{entrance[0], entrance[1]});
    maze[entrance[0]][entrance[1]] = '+';                 // mark visited by turning it into a wall
    int steps = 0;
    int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
    while (!q.isEmpty()) {
        steps++;
        for (int size = q.size(); size > 0; size--) {     // one BFS layer per step
            int[] cur = q.poll();
            for (int k = 0; k < 4; k++) {
                int nr = cur[0] + dr[k], nc = cur[1] + dc[k];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n || maze[nr][nc] == '+') continue;
                if (nr == 0 || nr == m - 1 || nc == 0 || nc == n - 1) return steps;   // a border cell is an exit
                maze[nr][nc] = '+';
                q.add(new int[]{nr, nc});
            }
        }
    }
    return -1;
}`, 'Java'),
    ],
    finalComplexity: "O(m · n) time, O(m · n) space for the queue (the maze itself is reused as the visited set).",
    testCases: [
      { input: "[[\"+\",\"+\",\".\",\"+\"],[\".\",\".\",\".\",\"+\"],[\"+\",\"+\",\"+\",\".\"]], entrance [1,2]", expected: "1", why: "The cell above the entrance is on the border" },
      { input: "[[\"+\",\"+\",\"+\"],[\".\",\".\",\".\"],[\"+\",\"+\",\"+\"]], entrance [1,0]", expected: "2", why: "Entrance on the border is not an exit" },
      { input: "[[\".\",\"+\"]], entrance [0,0]", expected: "-1", why: "Boxed in" },
      { input: "[[\".\",\".\"]], entrance [0,0]", expected: "1", why: "Neighbouring border cell" },
    ],
    takeawaysMd: "Nearest target in a grid is BFS by layers; the step counter is the layer number. Mark cells visited when enqueued, and remember the entrance itself never counts as an exit.",
  },

  "find-k-pairs-with-smallest-sums": {
    understandMd: "Given two arrays sorted in non-decreasing order and an integer k, return the k pairs (u, v) with the smallest sums, where u comes from the first array and v from the second. Different index pairs count as different pairs even if they have equal values.",
    ioConstraintsMd: "Input: two sorted integer arrays of length up to 100,000 each and k up to 10,000. Output: up to k pairs ordered by increasing sum (fewer if there are fewer than k pairs in total).",
    edgeCases: ["k larger than the number of pairs (return all pairs)", "Duplicate values in either array", "Arrays of different lengths", "Negative values", "Sums near the 32-bit limit (use 64-bit sums)"],
    bruteForceMd: "Form all n × m pairs, sort them by sum and take the first k.",
    bruteComplexity: "O(n · m · log(n · m)) time and O(n · m) space.",
    bottleneckMd: "Only k pairs are needed, and both arrays are sorted, so for each element of the first array the pairs with the second array come out in increasing order already. A min-heap that always holds the next candidate of each \"row\" produces the pairs in sorted order lazily.",
    hints: [
      "If you fix an element u of the first array, in what order do the sums u + v appear as v moves along the second array?", "Increasing, since the second array is sorted.", "So each element of the first array is like a sorted list. Which structure merges sorted lists lazily?", "A min-heap holding the current smallest unused pair of each list. Start with the pairs (i, 0) for the first k values of i (larger i cannot matter more than the first k). Pop the smallest, and push the successor (i, j + 1).",
    ],
    optimalMd: "Treat each index i of the first array as a sorted list of pairs (i, 0), (i, 1), … by increasing sum. Push (nums1[i] + nums2[0], i, 0) for i from 0 to min(k, n) − 1 into a min-heap. Repeat up to k times: pop the smallest pair (sum, i, j), record (nums1[i], nums2[j]) and, if j + 1 < m, push (nums1[i] + nums2[j + 1], i, j + 1). This is a k-way merge. The heap never holds more than min(k, n) entries, so the time is O(k log min(k, n)).",
    code: [
      cpp(`
vector<vector<int>> kSmallestPairs(vector<int>& nums1, vector<int>& nums2, int k) {
    typedef tuple<long long, int, int> Item;               // (sum, i, j)
    priority_queue<Item, vector<Item>, greater<Item>> heap;
    int n = nums1.size(), m = nums2.size();
    for (int i = 0; i < n && i < k; ++i) heap.push(Item((long long)nums1[i] + nums2[0], i, 0));   // first pair of each row
    vector<vector<int>> out;
    while (!heap.empty() && (int)out.size() < k) {
        Item top = heap.top(); heap.pop();
        int i = get<1>(top), j = get<2>(top);
        out.push_back({nums1[i], nums2[j]});
        if (j + 1 < m) heap.push(Item((long long)nums1[i] + nums2[j + 1], i, j + 1));             // the next pair in this row
    }
    return out;
}`, 'C++'),
      java(`
public List<List<Integer>> kSmallestPairs(int[] nums1, int[] nums2, int k) {
    PriorityQueue<long[]> heap = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));   // {sum, i, j}
    int n = nums1.length, m = nums2.length;
    for (int i = 0; i < n && i < k; i++) heap.add(new long[]{(long) nums1[i] + nums2[0], i, 0});   // first pair of each row
    List<List<Integer>> out = new ArrayList<>();
    while (!heap.isEmpty() && out.size() < k) {
        long[] top = heap.poll();
        int i = (int) top[1], j = (int) top[2];
        out.add(Arrays.asList(nums1[i], nums2[j]));
        if (j + 1 < m) heap.add(new long[]{(long) nums1[i] + nums2[j + 1], i, j + 1});             // the next pair in this row
    }
    return out;
}`, 'Java'),
    ],
    finalComplexity: "O(k log min(k, n)) time, O(min(k, n)) space for the heap.",
    testCases: [
      { input: "[1,7,11], [2,4,6], k = 3", expected: "[[1,2],[1,4],[1,6]]", why: "The first row supplies all three" },
      { input: "[1,1,2], [1,2,3], k = 2", expected: "[[1,1],[1,1]]", why: "Equal values at different indices are different pairs" },
      { input: "[1,2], [3], k = 3", expected: "[[1,3],[2,3]]", why: "Fewer than k pairs exist" },
      { input: "[2147483647], [2147483647], k = 1", expected: "[[2147483647,2147483647]]", why: "Sum needs 64-bit arithmetic" },
    ],
    takeawaysMd: "When you need the k smallest results of a product of two sorted lists, treat it as a merge of sorted rows and use a heap seeded with the first element of each row. Each pop pushes only its successor, so the heap stays small.",
  },

  "ipo": {
    understandMd: "You can complete at most k distinct projects before an IPO. Project i needs at least capital[i] to start and adds profits[i] to your capital when finished (the capital needed is not consumed). You start with w capital. Choose at most k projects to maximise the final capital and return it.",
    ioConstraintsMd: "Input: k (up to 10^5), initial capital w (up to 10^9), and arrays profits and capital of length up to 100,000 with values up to 10^4 and non-negative. Output: the maximum final capital.",
    edgeCases: ["No project is affordable at first (the answer is w)", "Doing a project unlocks more expensive ones", "k larger than the number of projects", "Zero-profit projects", "Ties in capital requirements"],
    bruteForceMd: "Try every order of choosing up to k affordable projects and keep the best result.",
    bruteComplexity: "Exponential in the number of projects.",
    bottleneckMd: "At every step the best choice is the most profitable project among those you can currently afford: more capital never hurts, and finishing a project cannot make an affordable project unaffordable. Finding that project quickly needs the affordable ones in a max-heap and the others sorted by required capital.",
    hints: [
      "At each step which affordable project should you do?", "The one with the largest profit: it gives the most capital and so unlocks the most future choices.", "How do you keep track of which projects are affordable as capital grows?", "Sort projects by required capital and use a pointer; whenever capital increases, move every newly affordable project into a max-heap by profit. Repeat up to k times, stopping early if the heap is empty.",
    ],
    optimalMd: "Sort project indices by required capital. Maintain a max-heap of profits of the projects you can afford and a pointer into the sorted list. Repeat up to k times: move every project with capital ≤ w from the sorted list into the heap, then if the heap is empty stop; otherwise pop the largest profit and add it to w. The greedy choice is optimal because a larger capital never reduces the set of affordable projects. The cost is O(n log n).",
    code: [
      cpp(`
int findMaximizedCapital(int k, int w, vector<int>& profits, vector<int>& capital) {
    int n = profits.size();
    vector<int> order(n);
    iota(order.begin(), order.end(), 0);
    sort(order.begin(), order.end(), [&](int a, int b) { return capital[a] < capital[b]; });   // cheapest requirement first
    priority_queue<int> affordable;                       // profits of projects we can start now
    int next = 0;
    for (int round = 0; round < k; ++round) {
        while (next < n && capital[order[next]] <= w) affordable.push(profits[order[next++]]);
        if (affordable.empty()) break;                    // nothing we can afford
        w += affordable.top();                            // do the most profitable one
        affordable.pop();
    }
    return w;
}`, 'C++'),
      java(`
public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
    int n = profits.length;
    Integer[] order = new Integer[n];
    for (int i = 0; i < n; i++) order[i] = i;
    Arrays.sort(order, (a, b) -> Integer.compare(capital[a], capital[b]));   // cheapest requirement first
    PriorityQueue<Integer> affordable = new PriorityQueue<>(Collections.reverseOrder());   // profits of projects we can start now
    int next = 0;
    for (int round = 0; round < k; round++) {
        while (next < n && capital[order[next]] <= w) affordable.add(profits[order[next++]]);
        if (affordable.isEmpty()) break;                  // nothing we can afford
        w += affordable.poll();                           // do the most profitable one
    }
    return w;
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time, O(n) space.",
    testCases: [
      { input: "k = 2, w = 0, profits [1,2,3], capital [0,1,1]", expected: "4", why: "Do project 0, then the profit-3 project" },
      { input: "k = 3, w = 0, profits [1,2,3], capital [0,1,2]", expected: "6", why: "Each project unlocks the next" },
      { input: "k = 1, w = 3, profits [5], capital [10]", expected: "3", why: "Nothing affordable" },
      { input: "k = 10 with only 3 projects", expected: "6", why: "k larger than the number of projects" },
    ],
    takeawaysMd: "Greedy with a max-heap of currently available options is the pattern for \"pick the best affordable thing, which unlocks more things\". Sorting by the unlocking requirement plus a pointer feeds the heap exactly when options become available.",
  },

  "smallest-number-in-infinite-set": {
    understandMd: "Implement a SmallestInfiniteSet that initially contains all positive integers 1, 2, 3, …. popSmallest() removes and returns the smallest integer in the set. addBack(num) inserts num back into the set if it is not already present.",
    ioConstraintsMd: "Up to 1,000 calls in total with 1 ≤ num ≤ 1,000. popSmallest() is always called on a non-empty set (the set is infinite unless numbers have been removed, so it is never empty).",
    edgeCases: ["addBack of a number that is still in the set (no effect)", "addBack of a number larger than everything popped so far (no effect)", "Adding back several numbers and popping them in sorted order", "Adding the same removed number twice", "popSmallest after addBack of a number smaller than the next fresh number"],
    bruteForceMd: "Maintain an explicit boolean array of size 1,000 (or more) and scan for the first present number on every pop.",
    bruteComplexity: "O(n) per pop, and it does not model an unbounded set.",
    bottleneckMd: "The set is a contiguous infinite tail {next, next + 1, …} plus a few small numbers that were added back after being popped. You only need to store the tail start and the added-back numbers.",
    hints: [
      "After popping 1, 2, …, t − 1 in order, what does the set look like?", "It is everything from t upward.", "Which numbers can be added back, and which additions actually change the set?", "Only numbers smaller than t (already popped). Others are already in the infinite tail. Which structure keeps those added-back numbers in sorted order without duplicates? A sorted set (or a min-heap plus a membership set).",
    ],
    optimalMd: "Store next (the smallest number of the infinite tail, initially 1) and an ordered set of numbers that were popped and then added back. popSmallest: if the ordered set is non-empty remove and return its smallest element; otherwise return next and increment it. addBack(num): if num < next (it was popped earlier) insert it into the ordered set (inserting an existing element has no effect); otherwise do nothing. Each operation costs O(log m) where m is the number of added-back values.",
    code: [
      cpp(`
class SmallestInfiniteSet {
    int next = 1;                                         // everything >= next is still in the set
    set<int> returned;                                    // popped numbers that were added back (all < next)
public:
    SmallestInfiniteSet() {}
    int popSmallest() {
        if (!returned.empty()) {
            int smallest = *returned.begin();
            returned.erase(returned.begin());
            return smallest;
        }
        return next++;
    }
    void addBack(int num) {
        if (num < next) returned.insert(num);             // otherwise it never left the set
    }
};`, 'C++'),
      java(`
class SmallestInfiniteSet {
    private int next = 1;                                 // everything >= next is still in the set
    private final TreeSet<Integer> returned = new TreeSet<>();   // popped numbers that were added back (all < next)

    public SmallestInfiniteSet() {}

    public int popSmallest() {
        if (!returned.isEmpty()) return returned.pollFirst();
        return next++;
    }

    public void addBack(int num) {
        if (num < next) returned.add(num);                // otherwise it never left the set
    }
}`, 'Java'),
    ],
    finalComplexity: "O(log m) per operation where m is the number of numbers currently added back, O(m) space.",
    testCases: [
      { input: "addBack(2), then popSmallest() three times", expected: "1, 2, 3", why: "Adding back 2 does nothing while it is still present" },
      { input: "then addBack(1), popSmallest(), popSmallest(), popSmallest()", expected: "1, 4, 5", why: "The returned 1 is smallest again" },
      { input: "after popping 1..5: addBack(3), addBack(3), addBack(1), addBack(100)", expected: "next pops are 1, 3, 6", why: "Duplicates ignored; 100 was never removed" },
      { input: "random mix of 200 operations against a reference set", expected: "identical results", why: "Checked 300 times" },
    ],
    takeawaysMd: "Represent an infinite structure by its description: a boundary (next) plus a small exception set. Operations that touch only the finite part stay logarithmic.",
  },

  "total-cost-to-hire-k-workers": {
    understandMd: "You must hire exactly k workers. In each of k rounds, look at the first candidates and the last candidates workers still remaining in the list (if fewer than 2 × candidates remain, all of them are visible) and hire the one with the lowest cost, breaking ties by the smaller index. Return the total cost of hiring the k workers.",
    ioConstraintsMd: "Input: an array costs of up to 100,000 positive integers, the number of workers k to hire and the candidates count (all between 1 and n). Output: the total hiring cost (can exceed 32 bits).",
    edgeCases: ["candidates large enough that all workers are always visible", "Ties between the left and right groups (the lower index wins)", "The front and back windows meeting in the middle", "k equal to the number of workers", "Duplicate costs inside one window"],
    bruteForceMd: "In each round scan the first candidates and the last candidates remaining workers for the minimum and remove it.",
    bruteComplexity: "O(k · candidates + n) time with a list that supports removals.",
    bottleneckMd: "Each round needs the minimum of two sliding groups. Two min-heaps (one per side) give the minimum in O(log candidates), and after each hire only one new worker enters from the middle.",
    hints: [
      "What structure gives the cheapest worker among a group quickly?", "A min-heap, keyed by (cost, index) so ties go to the smaller index.", "You have two groups: the front window and the back window. What happens after hiring from one of them?", "The hired worker leaves, and the next unseen worker from the middle (if any) joins that same heap. Keep two pointers for the next unseen worker from the left and from the right, and stop pulling workers when the pointers cross.",
    ],
    optimalMd: "Use two min-heaps of (cost, index) pairs: left for the first candidates workers and right for the last candidates workers, with pointers i (next unseen from the left) and j (next unseen from the right) so that no worker is put in both heaps. Each round compare the two tops (cost first, then index): hire the cheaper, add its cost to the total, and refill that heap with the next unseen worker from its side if i ≤ j. Repeat k times. Each round costs O(log candidates).",
    code: [
      cpp(`
long long totalCost(vector<int>& costs, int k, int candidates) {
    typedef pair<int, int> Worker;                        // (cost, index): ties go to the smaller index automatically
    priority_queue<Worker, vector<Worker>, greater<Worker>> left, right;
    int n = costs.size(), i = 0, j = n - 1;               // i, j: next unseen worker from each end
    while (i < candidates && i <= j) { left.push({costs[i], i}); ++i; }
    while (j >= n - candidates && j >= i) { right.push({costs[j], j}); --j; }
    long long total = 0;
    for (int round = 0; round < k; ++round) {
        bool takeLeft = !left.empty() && (right.empty() || left.top() < right.top());
        if (takeLeft) {
            total += left.top().first; left.pop();
            if (i <= j) { left.push({costs[i], i}); ++i; }          // someone new becomes visible on the left
        } else {
            total += right.top().first; right.pop();
            if (i <= j) { right.push({costs[j], j}); --j; }         // someone new becomes visible on the right
        }
    }
    return total;
}`, 'C++'),
      java(`
public long totalCost(int[] costs, int k, int candidates) {
    Comparator<int[]> byCostThenIndex = (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]);
    PriorityQueue<int[]> left = new PriorityQueue<>(byCostThenIndex), right = new PriorityQueue<>(byCostThenIndex);
    int n = costs.length, i = 0, j = n - 1;               // i, j: next unseen worker from each end
    while (i < candidates && i <= j) { left.add(new int[]{costs[i], i}); i++; }
    while (j >= n - candidates && j >= i) { right.add(new int[]{costs[j], j}); j--; }
    long total = 0;
    for (int round = 0; round < k; round++) {
        boolean takeLeft = !left.isEmpty() && (right.isEmpty() || byCostThenIndex.compare(left.peek(), right.peek()) < 0);
        if (takeLeft) {
            total += left.poll()[0];
            if (i <= j) { left.add(new int[]{costs[i], i}); i++; }          // someone new becomes visible on the left
        } else {
            total += right.poll()[0];
            if (i <= j) { right.add(new int[]{costs[j], j}); j--; }         // someone new becomes visible on the right
        }
    }
    return total;
}`, 'Java'),
    ],
    finalComplexity: "O((candidates + k) log candidates) time, O(candidates) space.",
    testCases: [
      { input: "[17,12,10,2,7,2,11,20,8], k = 3, candidates = 4", expected: "11", why: "Hire costs 2, 2 and 7" },
      { input: "[1,2,4,1], k = 3, candidates = 3", expected: "4", why: "Hire 1, 1 and 2" },
      { input: "[10,10,10], k = 3, candidates = 1", expected: "30", why: "Equal costs" },
      { input: "[5], k = 1, candidates = 1", expected: "5", why: "Single worker" },
    ],
    takeawaysMd: "Two sliding \"visible\" windows with a minimum query is a two-heap problem. Keep unseen-worker pointers so no worker enters both heaps, and break ties through the (cost, index) key.",
  },

  "maximum-subsequence-score": {
    understandMd: "Given two integer arrays nums1 and nums2 of the same length and an integer k, choose a subsequence of k indices. Its score is (the sum of the chosen nums1 values) multiplied by (the minimum of the chosen nums2 values). Return the maximum possible score.",
    ioConstraintsMd: "Input: arrays of length up to 100,000 with values from 0 to 100,000, and 1 ≤ k ≤ n. Output: the maximum score (can exceed 32 bits).",
    edgeCases: ["k = 1 (the best single product)", "k = n (the whole array)", "Zeros in nums2 (score 0 for any selection that includes one)", "Large sums (use 64-bit arithmetic)", "Several indices with the same nums2 value"],
    bruteForceMd: "Try every subset of k indices and evaluate its score.",
    bruteComplexity: "O(C(n, k) · k) time.",
    bottleneckMd: "The score has two coupled parts: the sum (wants large nums1) and the minimum nums2. Fixing the minimum nums2 value turns it into \"choose the k largest nums1 among indices whose nums2 is at least that value\".",
    hints: [
      "If you decide which nums2 value is the minimum, which indices are allowed?", "Those with nums2 at least that value.", "Among them how do you maximise the sum of nums1?", "Take the k largest. Process indices in decreasing order of nums2 so the current index is always the smallest nums2 allowed so far. Maintain the k largest nums1 values seen so far in a min-heap and their running sum.",
    ],
    optimalMd: "Sort the indices by nums2 in descending order. Walk through them keeping a min-heap of the chosen nums1 values and their sum. For each index add its nums1 value to the heap and the sum; if the heap size exceeds k, pop the smallest value and subtract it. When the heap has exactly k elements, the current index has the smallest nums2 among those considered, so a candidate score is sum × nums2[index]; track the maximum. Every optimal answer arises for its minimum-nums2 index, so this finds it. The cost is O(n log n).",
    code: [
      cpp(`
long long maxScore(vector<int>& nums1, vector<int>& nums2, int k) {
    int n = nums1.size();
    vector<int> order(n);
    iota(order.begin(), order.end(), 0);
    sort(order.begin(), order.end(), [&](int a, int b) { return nums2[a] > nums2[b]; });   // largest nums2 first
    priority_queue<int, vector<int>, greater<int>> chosen;  // the k largest nums1 values so far
    long long sum = 0, best = 0;
    for (int idx : order) {
        chosen.push(nums1[idx]);
        sum += nums1[idx];
        if ((int)chosen.size() > k) { sum -= chosen.top(); chosen.pop(); }
        if ((int)chosen.size() == k) best = max(best, sum * nums2[idx]);   // nums2[idx] is the minimum of the chosen set
    }
    return best;
}`, 'C++'),
      java(`
public long maxScore(int[] nums1, int[] nums2, int k) {
    int n = nums1.length;
    Integer[] order = new Integer[n];
    for (int i = 0; i < n; i++) order[i] = i;
    Arrays.sort(order, (a, b) -> Integer.compare(nums2[b], nums2[a]));   // largest nums2 first
    PriorityQueue<Integer> chosen = new PriorityQueue<>();               // the k largest nums1 values so far
    long sum = 0, best = 0;
    for (int idx : order) {
        chosen.add(nums1[idx]);
        sum += nums1[idx];
        if (chosen.size() > k) sum -= chosen.poll();
        if (chosen.size() == k) best = Math.max(best, sum * nums2[idx]);   // nums2[idx] is the minimum of the chosen set
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: "O(n log n) time, O(n) space.",
    testCases: [
      { input: "nums1 [1,3,3,2], nums2 [2,1,3,4], k = 3", expected: "12", why: "Indices 0, 2, 3: (1 + 3 + 2) × 2" },
      { input: "nums1 [4,2,3,1,1], nums2 [7,5,10,9,6], k = 1", expected: "30", why: "Best single product 3 × 10" },
      { input: "k = n with equal values", expected: "3 × 10^5 × 10^5 = 3·10^10", why: "Needs 64-bit arithmetic" },
      { input: "single element", expected: "its product", why: "Smallest case" },
    ],
    takeawaysMd: "To maximise sum × min, iterate in order of the \"min\" quantity and keep the best k of the \"sum\" quantity in a heap. The current element is the minimum by construction.",
  },

  "search-suggestions-system": {
    understandMd: "Given a list of product names and a search word, simulate typing the word one character at a time. After each character, suggest up to three products (in lexicographic order) that have the typed prefix. Return the list of suggestions for every prefix.",
    ioConstraintsMd: "Input: up to 1,000 lowercase product names (length up to 3,000, total up to 20,000 characters) and a search word of up to 1,000 lowercase letters. Output: for each prefix of the search word, a list of up to three suggested products.",
    edgeCases: ["No product matches a prefix (empty list from then on)", "More than three matches (only the first three alphabetically)", "Duplicate product names", "The search word is longer than every product", "A product equal to the typed prefix"],
    bruteForceMd: "For each prefix, filter all products by prefix, sort the matches and take the first three.",
    bruteComplexity: "O(L · n · m) time for L prefixes and n products of length m.",
    bottleneckMd: "Filtering and sorting for every prefix repeats work. If the products are sorted once, all products with a given prefix form a contiguous block, and its start can be found by binary search; the three smallest are the first three in the block.",
    hints: [
      "If the products are sorted alphabetically, where are the products with a given prefix?", "They are contiguous.", "How do you find the start of that block quickly?", "Binary search for the first product that is not smaller than the prefix (lower bound). Then look at up to three products from there, keeping only those that really start with the prefix. (A trie is the alternative: store the top three at each node.)",
    ],
    optimalMd: "Sort the products. For each prefix of the search word, find with a binary search (lower bound) the first product that is lexicographically ≥ the prefix. Then take up to three products starting at that position, keeping each one only while it has the prefix (the block of matches is contiguous, so stop at the first non-match). The searches can also start from the previous block because the matching block only shrinks. The total cost is O(n log n) for sorting plus O(L log n + 3L · m) for the lookups.",
    code: [
      cpp(`
vector<vector<string>> suggestedProducts(vector<string>& products, string searchWord) {
    sort(products.begin(), products.end());
    vector<vector<string>> out;
    string prefix;
    auto start = products.begin();
    for (char c : searchWord) {
        prefix += c;
        start = lower_bound(start, products.end(), prefix);          // first product >= prefix (the block only shrinks)
        vector<string> suggestions;
        for (auto it = start; it != products.end() && suggestions.size() < 3 && it->compare(0, prefix.size(), prefix) == 0; ++it)
            suggestions.push_back(*it);                              // at most three, and only real prefix matches
        out.push_back(suggestions);
    }
    return out;
}`, 'C++'),
      java(`
public List<List<String>> suggestedProducts(String[] products, String searchWord) {
    Arrays.sort(products);
    List<List<String>> out = new ArrayList<>();
    String prefix = "";
    int start = 0;
    for (char c : searchWord.toCharArray()) {
        prefix += c;
        int lo = start, hi = products.length;                        // first product >= prefix (the block only shrinks)
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (products[mid].compareTo(prefix) < 0) lo = mid + 1;
            else hi = mid;
        }
        start = lo;
        List<String> suggestions = new ArrayList<>();
        for (int i = start; i < products.length && suggestions.size() < 3 && products[i].startsWith(prefix); i++)
            suggestions.add(products[i]);                            // at most three, and only real prefix matches
        out.add(suggestions);
    }
    return out;
}`, 'Java'),
    ],
    finalComplexity: "O(n log n · m) to sort plus O(L · (log n · m + 3 · m)) for the lookups; O(1) extra space besides the output.",
    testCases: [
      { input: "products [mobile, mouse, moneypot, monitor, mousepad], word \"mouse\"", expected: "[[mobile,moneypot,monitor] ×2, [mouse,mousepad] ×3]", why: "More than three matches are cut at three" },
      { input: "products [havana], word \"havana\"", expected: "six lists, each [havana]", why: "A single product matches every prefix" },
      { input: "products [bags, baggage, banner, box, cloths], word \"bags\"", expected: "[[baggage,bags,banner],[baggage,bags,banner],[baggage,bags],[bags]]", why: "The block shrinks as the prefix grows" },
      { input: "products [abc], word \"x\"", expected: "[[]]", why: "No match at all" },
    ],
    takeawaysMd: "Prefix queries on a sorted list are binary searches: all matches form one contiguous block starting at the lower bound of the prefix. A trie that stores the top three suggestions per node is the alternative when queries are many.",
  },

  "construct-quad-tree": {
    understandMd: "A quad-tree represents an n × n grid of 0s and 1s (n is a power of two). Each node has a boolean val and a boolean isLeaf. A leaf represents a block whose cells are all the same value; a non-leaf node has four children for the top-left, top-right, bottom-left and bottom-right quadrants. Build the quad-tree of the given grid, using as few nodes as possible (a block of equal values must be a single leaf).",
    ioConstraintsMd: "Input: an n × n binary grid with n = 2^x, 0 ≤ x ≤ 6 (so n up to 64). Output: the root of the quad-tree.",
    edgeCases: ["A 1 × 1 grid (a single leaf)", "A grid that is uniformly 0 or 1 (a single leaf)", "A grid where only one quadrant differs", "Quadrants that are internally uniform but different from each other", "Making sure a node whose four children are identical leaves is not created"],
    bruteForceMd: "Always split into four quadrants until reaching single cells and then merge equal leaves upwards.",
    bruteComplexity: "O(n² log n) time, but it creates and then collapses many unnecessary nodes.",
    bottleneckMd: "The recursion naturally decides at each block whether it is uniform. Checking uniformity before splitting avoids building and then collapsing needless subtrees.",
    hints: [
      "When is a block a leaf?", "When every cell in it has the same value.", "What do you do otherwise?", "Split it into four equal quadrants and recurse; the node is internal (isLeaf = false) and its val may be anything. Pass the block as (top row, left column, side length); a side of 1 is always uniform.",
    ],
    optimalMd: "Recursive divide and conquer on blocks described by (row, col, length). Scan the block: if all cells equal the first cell, return a leaf node with val = that cell. Otherwise create an internal node and build its four children from the four half-size blocks (top-left, top-right, bottom-left, bottom-right). Because a uniform block is always returned as a leaf before any splitting, no internal node ends up with four identical leaf children, so the tree has the minimum number of nodes. Scanning each level costs O(n²), and there are log n levels.",
    code: [
      cpp(`
// LeetCode supplies this node type; it is shown so the code is self-contained.
struct Node {
    bool val, isLeaf;
    Node *topLeft, *topRight, *bottomLeft, *bottomRight;
    Node(bool v = false, bool leaf = false) : val(v), isLeaf(leaf), topLeft(nullptr), topRight(nullptr), bottomLeft(nullptr), bottomRight(nullptr) {}
};

Node* build(vector<vector<int>>& grid, int row, int col, int len) {
    bool uniform = true;
    for (int r = row; r < row + len && uniform; ++r)
        for (int c = col; c < col + len; ++c)
            if (grid[r][c] != grid[row][col]) { uniform = false; break; }
    if (uniform) return new Node(grid[row][col] == 1, true);       // one value: a leaf
    int half = len / 2;
    Node* node = new Node(true, false);                            // internal node (val is irrelevant)
    node->topLeft = build(grid, row, col, half);
    node->topRight = build(grid, row, col + half, half);
    node->bottomLeft = build(grid, row + half, col, half);
    node->bottomRight = build(grid, row + half, col + half, half);
    return node;
}

Node* construct(vector<vector<int>>& grid) {
    return build(grid, 0, 0, grid.size());
}`, 'C++'),
      java(`
// LeetCode supplies this node type; it is shown so the code is self-contained.
static class Node {
    boolean val, isLeaf;
    Node topLeft, topRight, bottomLeft, bottomRight;
    Node(boolean val, boolean isLeaf) { this.val = val; this.isLeaf = isLeaf; }
}

public Node construct(int[][] grid) {
    return build(grid, 0, 0, grid.length);
}

private Node build(int[][] grid, int row, int col, int len) {
    boolean uniform = true;
    for (int r = row; r < row + len && uniform; r++)
        for (int c = col; c < col + len; c++)
            if (grid[r][c] != grid[row][col]) { uniform = false; break; }
    if (uniform) return new Node(grid[row][col] == 1, true);       // one value: a leaf
    int half = len / 2;
    Node node = new Node(true, false);                             // internal node (val is irrelevant)
    node.topLeft = build(grid, row, col, half);
    node.topRight = build(grid, row, col + half, half);
    node.bottomLeft = build(grid, row + half, col, half);
    node.bottomRight = build(grid, row + half, col + half, half);
    return node;
}`, 'Java'),
    ],
    finalComplexity: "O(n² log n) time (each of the log n levels scans the whole grid once), O(log n) recursion depth plus the output tree.",
    testCases: [
      { input: "[[0,1],[1,0]]", expected: "an internal node with four leaves 0, 1, 1, 0", why: "All four quadrants differ" },
      { input: "[[1,1],[1,1]]", expected: "a single leaf with val = 1", why: "Uniform block" },
      { input: "[[0]]", expected: "a single leaf with val = 0", why: "1 × 1 grid" },
      { input: "random grids up to 8 × 8", expected: "the tree repaints exactly the grid and is minimal", why: "Checked 3,000 times" },
    ],
    takeawaysMd: "Quad-tree construction is divide and conquer with an early exit: test for uniformity before splitting. That single ordering decision is what makes the tree minimal.",
  },

};
