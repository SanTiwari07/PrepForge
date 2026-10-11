import type { CoachWalkthrough } from '../schema';
import { cpp, java } from '../helpers';

// Original PrepForge walkthroughs. Problem statements are NOT copied; read the official
// statement via the link on the problem page. Keys are LeetCode slugs.
export const walkthroughs: Record<string, CoachWalkthrough> = {
  'two-sum': {
    understandMd: 'Given an array and a target, return the indices of two different positions whose values add up to the target. Exactly one valid pair exists.',
    ioConstraintsMd: 'Input: integer array (n up to 10⁴ on LeetCode, but aim for linear), target. Output: two indices in any order. Values and target can be negative.',
    edgeCases: ['The pair uses the same value twice, e.g. [3, 3] with target 6', 'Negative numbers', 'The answer includes index 0'],
    bruteForceMd: 'Check every pair (i, j) with i < j and return the first pair whose sum equals the target.',
    bruteComplexity: 'O(n²) time, O(1) space.',
    bottleneckMd: 'For each i, the inner loop searches for one specific value, target − nums[i]. Searching linearly for a known value is the waste.',
    hints: [
      'For a fixed element x, what exact value must its partner have?',
      'You are repeatedly asking "have I seen value v before, and where?". Which data structure answers that in O(1)?',
      'Scan once. Before storing the current value, look up target − x among the values already stored (value → index).',
      'map = {}; for i, x in nums: if (target − x) in map: return [map[target − x], i]; map[x] = i',
    ],
    optimalMd: 'Keep a hash map from value to index for elements to the left of i. For each x, if target − x is in the map we have found the pair. Insert x after the check so an element never pairs with itself.',
    code: [
      cpp(`
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        auto it = seen.find(target - nums[i]);
        if (it != seen.end()) return {it->second, i};
        seen[nums[i]] = i;
    }
    return {};
}`, 'C++'),
      java(`
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        Integer j = seen.get(target - nums[i]);
        if (j != null) return new int[]{j, i};
        seen.put(nums[i], i);
    }
    return new int[0];
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time on average, O(n) space.',
    testCases: [
      { input: '[2, 7, 11, 15], target 9', expected: '[0, 1]', why: 'Basic case' },
      { input: '[3, 3], target 6', expected: '[0, 1]', why: 'Same value twice: tests query-before-insert' },
      { input: '[−1, −2, −3, −4, −5], target −8', expected: '[2, 4]', why: 'Negatives' },
    ],
    takeawaysMd: 'When the inner loop searches for a value you can compute, replace it with a hash lookup. For pairs, query before inserting.',
  },

  'contains-duplicate': {
    understandMd: 'Decide whether any value appears at least twice in the array.',
    ioConstraintsMd: 'Input: integer array, n up to 10⁵. Output: true or false.',
    edgeCases: ['Single element', 'Duplicates far apart', 'Large negative values'],
    bruteForceMd: 'Compare every pair of elements.',
    bruteComplexity: 'O(n²) time, O(1) space.',
    bottleneckMd: 'For each element we scan the rest to see whether its value occurred, which is a membership question asked n times.',
    hints: [
      'You only need to know whether a value was seen before, not where.',
      'Membership checks in O(1) suggest a hash set. Alternatively, think about what sorting does to equal values.',
      'Insert values into a set while scanning; if a value is already present, you are done.',
      'seen = set(); for x in nums: if x in seen: return true; add x; return false',
    ],
    optimalMd: 'Use a hash set. Alternatively sort (O(n log n), O(1) extra space) and compare neighbours, because equal values become adjacent.',
    code: [
      cpp(`
bool containsDuplicate(vector<int>& nums) {
    unordered_set<int> seen;
    for (int x : nums) {
        if (seen.count(x)) return true;
        seen.insert(x);
    }
    return false;
}`, 'C++'),
      java(`
public boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int x : nums) if (!seen.add(x)) return true;   // add returns false if present
    return false;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) average time, O(n) space; or O(n log n) time and O(1) extra space with sorting.',
    testCases: [
      { input: '[1, 2, 3, 1]', expected: 'true', why: 'Duplicate at the ends' },
      { input: '[1, 2, 3, 4]', expected: 'false', why: 'All distinct' },
      { input: '[7]', expected: 'false', why: 'Single element' },
    ],
    takeawaysMd: 'There is a time–space trade-off: hashing gives O(n) time with O(n) memory; sorting gives O(n log n) time with O(1) memory. Mention both.',
  },

  'valid-anagram': {
    understandMd: 'Decide whether two strings contain exactly the same characters with the same counts, in any order.',
    ioConstraintsMd: 'Strings of lowercase English letters, length up to 5·10⁴. Output: true or false.',
    edgeCases: ['Different lengths', 'Same letters with different counts ("aab" vs "abb")', 'Empty strings'],
    bruteForceMd: 'Sort both strings and compare them.',
    bruteComplexity: 'O(n log n) time.',
    bottleneckMd: 'Sorting does more work than needed: we only need counts, not an order.',
    hints: [
      'What property must be identical for two anagrams?',
      'The alphabet is fixed at 26 letters. Can you count instead of sort?',
      'Increment counts for s and decrement for t; all counts must end at zero.',
      'if len differ: false; cnt[26]; for i: cnt[s[i]]++, cnt[t[i]]--; return all zero',
    ],
    optimalMd: 'If the lengths differ, return false. Otherwise count with one array of 26 integers: +1 for s and −1 for t. All counts must be zero.',
    code: [
      cpp(`
bool isAnagram(string s, string t) {
    if (s.size() != t.size()) return false;
    int cnt[26] = {0};
    for (size_t i = 0; i < s.size(); ++i) { cnt[s[i] - 'a']++; cnt[t[i] - 'a']--; }
    for (int c : cnt) if (c != 0) return false;
    return true;
}`, 'C++'),
      java(`
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] cnt = new int[26];
    for (int i = 0; i < s.length(); i++) { cnt[s.charAt(i) - 'a']++; cnt[t.charAt(i) - 'a']--; }
    for (int c : cnt) if (c != 0) return false;
    return true;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space (26 counters).',
    testCases: [
      { input: 's = "anagram", t = "nagaram"', expected: 'true', why: 'Basic' },
      { input: 's = "rat", t = "car"', expected: 'false', why: 'Different letters' },
      { input: 's = "ab", t = "a"', expected: 'false', why: 'Length check' },
    ],
    takeawaysMd: 'For a small fixed alphabet, a count array beats both sorting and hash maps. For Unicode, use a hash map.',
  },

  'group-anagrams': {
    understandMd: 'Partition a list of words into groups where every word in a group is an anagram of the others.',
    ioConstraintsMd: 'Up to 10⁴ words, each up to 100 lowercase letters. Output: groups in any order.',
    edgeCases: ['Empty string words', 'A single word', 'All words identical'],
    bruteForceMd: 'Compare every pair of words with an anagram check and union them into groups.',
    bruteComplexity: 'O(n² · L) time.',
    bottleneckMd: 'Pairwise comparison. Anagram-equality should map every word to the same identifier so grouping is a single pass.',
    hints: [
      'Two words are anagrams exactly when some normalised form of them is equal. What could that form be?',
      'Use that normalised form as a hash-map key.',
      'Key = the sorted word, or better, the 26-letter count signature.',
      'groups = map<key, list>; for w: groups[key(w)].append(w); return groups.values()',
    ],
    optimalMd: 'Build a canonical key per word (a count signature in O(L)) and group in a hash map.',
    code: [
      cpp(`
vector<vector<string>> groupAnagrams(vector<string>& strs) {
    unordered_map<string, vector<string>> g;
    for (auto& s : strs) {
        string key(26, 0);
        for (char c : s) key[c - 'a']++;
        g[key].push_back(s);
    }
    vector<vector<string>> res;
    for (auto& kv : g) res.push_back(kv.second);
    return res;
}`, 'C++'),
      java(`
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> g = new HashMap<>();
    for (String s : strs) {
        char[] cnt = new char[26];
        for (char c : s.toCharArray()) cnt[c - 'a']++;
        g.computeIfAbsent(new String(cnt), k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(g.values());
}`, 'Java'),
    ],
    finalComplexity: 'O(n · L) time with count keys (O(n · L log L) with sorted keys); O(n · L) space.',
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expected: '[["eat","tea","ate"],["tan","nat"],["bat"]]', why: 'Basic' },
      { input: '[""]', expected: '[[""]]', why: 'Empty word' },
    ],
    takeawaysMd: 'Grouping by an equivalence relation means finding a canonical key, then using a hash map of lists.',
  },

  'top-k-frequent-elements': {
    understandMd: 'Return the k values that occur most often in the array.',
    ioConstraintsMd: 'n up to 10⁵, 1 ≤ k ≤ number of distinct values. The answer is unique. Aim better than O(n log n).',
    edgeCases: ['k equals the number of distinct values', 'All elements equal', 'Negative values'],
    bruteForceMd: 'Count frequencies, sort distinct values by frequency, and take the first k.',
    bruteComplexity: 'O(n log n) time.',
    bottleneckMd: 'A full sort orders all distinct values, but we only need the top k. Frequencies are also bounded by n.',
    hints: [
      'First compute how often each value occurs.',
      'You need only the top k. Think of a heap of size k, or of the fact that a frequency is an integer between 1 and n.',
      'Bucket sort: bucket[f] holds values with frequency f. Walk buckets from n down to 1.',
      'cnt = counts; buckets[0..n]; for (v, f) in cnt: buckets[f].add(v); collect from high f until k values',
    ],
    optimalMd: 'Count with a hash map, place values into buckets indexed by frequency, then read the buckets from the highest frequency down. A min-heap of size k (O(n log k)) is also acceptable.',
    code: [
      cpp(`
vector<int> topKFrequent(vector<int>& nums, int k) {
    unordered_map<int, int> cnt;
    for (int x : nums) cnt[x]++;
    vector<vector<int>> bucket(nums.size() + 1);
    for (auto& kv : cnt) bucket[kv.second].push_back(kv.first);
    vector<int> res;
    for (int f = nums.size(); f >= 1 && (int)res.size() < k; --f)
        for (int v : bucket[f]) { res.push_back(v); if ((int)res.size() == k) break; }
    return res;
}`, 'C++'),
      java(`
public int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> cnt = new HashMap<>();
    for (int x : nums) cnt.merge(x, 1, Integer::sum);
    List<Integer>[] bucket = new List[nums.length + 1];
    for (var e : cnt.entrySet()) {
        if (bucket[e.getValue()] == null) bucket[e.getValue()] = new ArrayList<>();
        bucket[e.getValue()].add(e.getKey());
    }
    int[] res = new int[k]; int idx = 0;
    for (int f = nums.length; f >= 1 && idx < k; f--)
        if (bucket[f] != null) for (int v : bucket[f]) { if (idx == k) break; res[idx++] = v; }
    return res;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time and O(n) space with buckets; O(n log k) with a size-k heap.',
    testCases: [
      { input: '[1,1,1,2,2,3], k = 2', expected: '[1, 2]', why: 'Basic' },
      { input: '[4], k = 1', expected: '[4]', why: 'Single element' },
    ],
    takeawaysMd: 'When a sort key is a small integer bounded by n, bucket sort gives linear time. A heap of size k is the general top-k tool.',
  },

  'product-of-array-except-self': {
    understandMd: 'For each position, output the product of all other elements, without using division.',
    ioConstraintsMd: 'n up to 10⁵; values may be zero or negative; products fit in 32 bits. Required: O(n), no division.',
    edgeCases: ['One zero in the array', 'Two or more zeros', 'Negative values'],
    bruteForceMd: 'For each i, multiply every element except a[i].',
    bruteComplexity: 'O(n²) time.',
    bottleneckMd: 'The same partial products (everything to the left, everything to the right) are recomputed for every i.',
    hints: [
      'answer[i] = (product of everything left of i) × (product of everything right of i).',
      'Can you precompute the left products for every i in one pass? And the right ones?',
      'Store prefix products in the output array, then multiply by a running suffix product from the right.',
      'out[0] = 1; for i in 1..n-1: out[i] = out[i-1]*a[i-1]; suf = 1; for i from n-1 down: out[i] *= suf; suf *= a[i]',
    ],
    optimalMd: 'Two passes: the first writes prefix products into the output; the second multiplies by a running suffix product. No division, so zeros need no special handling.',
    code: [
      cpp(`
vector<int> productExceptSelf(vector<int>& a) {
    int n = a.size();
    vector<int> out(n, 1);
    for (int i = 1; i < n; ++i) out[i] = out[i - 1] * a[i - 1];
    int suf = 1;
    for (int i = n - 1; i >= 0; --i) { out[i] *= suf; suf *= a[i]; }
    return out;
}`, 'C++'),
      java(`
public int[] productExceptSelf(int[] a) {
    int n = a.length;
    int[] out = new int[n];
    out[0] = 1;
    for (int i = 1; i < n; i++) out[i] = out[i - 1] * a[i - 1];
    int suf = 1;
    for (int i = n - 1; i >= 0; i--) { out[i] *= suf; suf *= a[i]; }
    return out;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) extra space (the output array does not count).',
    testCases: [
      { input: '[1, 2, 3, 4]', expected: '[24, 12, 8, 6]', why: 'Basic' },
      { input: '[−1, 1, 0, −3, 3]', expected: '[0, 0, 9, 0, 0]', why: 'Contains a zero' },
    ],
    takeawaysMd: 'This is a prefix/suffix decomposition: "everything except i" equals the left part times the right part. The same idea gives "max of everything except i", trapping rain water, and more.',
  },

  'valid-palindrome': {
    understandMd: 'After lowercasing and keeping only letters and digits, decide whether the string reads the same forwards and backwards.',
    ioConstraintsMd: 'Length up to 2·10⁵, printable ASCII. Output: true or false.',
    edgeCases: ['A string with no alphanumerics (counts as a palindrome)', 'Mixed case', 'Digits mixed with letters ("0P")'],
    bruteForceMd: 'Build a filtered lowercase copy, then compare it with its reverse.',
    bruteComplexity: 'O(n) time, O(n) extra space.',
    bottleneckMd: 'Not time but memory: the copy is avoidable.',
    hints: [
      'A palindrome check compares mirrored positions.',
      'Use two indices from the two ends that move inward.',
      'Skip non-alphanumeric characters on each side before comparing lowercase characters.',
      'l = 0, r = n-1; while l < r: skip junk; if lower(s[l]) != lower(s[r]) return false; l++, r--',
    ],
    optimalMd: 'Converging two pointers, skipping characters that are not letters or digits, comparing case-insensitively.',
    code: [
      cpp(`
bool isPalindrome(string s) {
    int l = 0, r = (int)s.size() - 1;
    while (l < r) {
        while (l < r && !isalnum((unsigned char)s[l])) ++l;
        while (l < r && !isalnum((unsigned char)s[r])) --r;
        if (tolower((unsigned char)s[l]) != tolower((unsigned char)s[r])) return false;
        ++l; --r;
    }
    return true;
}`, 'C++'),
      java(`
public boolean isPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
        while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
        if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
        l++; r--;
    }
    return true;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space.',
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expected: 'true', why: 'Classic' },
      { input: '"race a car"', expected: 'false', why: 'Mismatch' },
      { input: '" "', expected: 'true', why: 'No alphanumerics' },
      { input: '"0P"', expected: 'false', why: 'Digit vs letter' },
    ],
    takeawaysMd: 'For symmetric checks, use converging pointers. Keep the `l < r` guard inside the skip loops.',
  },

  '3sum': {
    understandMd: 'Find every distinct triplet of values (from three different positions) that sums to zero, with no duplicate triplets in the output.',
    ioConstraintsMd: 'n up to 3000, values in [−10⁵, 10⁵]. Output: list of unique triplets in any order. n = 3000 allows O(n²) but not O(n³).',
    edgeCases: ['All zeros [0, 0, 0, 0]', 'Many duplicates', 'No triplet exists'],
    bruteForceMd: 'Three nested loops, with a set of sorted triplets to remove duplicates.',
    bruteComplexity: 'O(n³) time, too slow at n = 3000 (2.7·10¹⁰).',
    bottleneckMd: 'After fixing the first element, the remaining job is a Two Sum on the rest. Doing that with a double loop is the waste.',
    hints: [
      'Fix one element a[i]. What problem remains for the other two?',
      'It becomes "two numbers summing to −a[i]". If the array were sorted, which technique solves that in O(n)?',
      'Sort, fix i, run converging pointers on (i, n). To avoid duplicates, skip equal anchors and skip equal values after recording a triplet.',
      'sort; for i: skip dup; l = i+1, r = n-1; while l < r: s = sum; s < 0: l++; s > 0: r--; else record, l++, r--, skip dup l',
    ],
    optimalMd: 'Sort the array. For each anchor i (skipping repeats), use two pointers on the suffix to find pairs summing to −a[i]. Skip repeated values at both levels to keep triplets unique without a set.',
    code: [
      cpp(`
vector<vector<int>> threeSum(vector<int>& a) {
    sort(a.begin(), a.end());
    vector<vector<int>> res;
    int n = a.size();
    for (int i = 0; i + 2 < n; ++i) {
        if (i && a[i] == a[i - 1]) continue;
        int l = i + 1, r = n - 1;
        while (l < r) {
            int s = a[i] + a[l] + a[r];
            if (s < 0) ++l;
            else if (s > 0) --r;
            else {
                res.push_back({a[i], a[l], a[r]});
                ++l; --r;
                while (l < r && a[l] == a[l - 1]) ++l;
            }
        }
    }
    return res;
}`, 'C++'),
      java(`
public List<List<Integer>> threeSum(int[] a) {
    Arrays.sort(a);
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i + 2 < a.length; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;
        int l = i + 1, r = a.length - 1;
        while (l < r) {
            int s = a[i] + a[l] + a[r];
            if (s < 0) l++;
            else if (s > 0) r--;
            else {
                res.add(List.of(a[i], a[l], a[r]));
                l++; r--;
                while (l < r && a[l] == a[l - 1]) l++;
            }
        }
    }
    return res;
}`, 'Java'),
    ],
    finalComplexity: 'O(n²) time, O(1) extra space apart from sorting and the output.',
    testCases: [
      { input: '[−1, 0, 1, 2, −1, −4]', expected: '[[−1, −1, 2], [−1, 0, 1]]', why: 'Duplicates in the input' },
      { input: '[0, 0, 0, 0]', expected: '[[0, 0, 0]]', why: 'Only one unique triplet' },
      { input: '[1, 2, −2, −1]', expected: '[]', why: 'No answer' },
    ],
    takeawaysMd: 'k-Sum reduces to (k−1)-Sum by fixing an element. Sorting makes both the two-pointer scan and duplicate skipping possible.',
  },

  'container-with-most-water': {
    understandMd: 'Choose two vertical lines so that, together with the x-axis, they hold the most water. The area is the width between them times the shorter line.',
    ioConstraintsMd: 'n up to 10⁵, heights up to 10⁴. Output: the maximum area. O(n²) is too slow.',
    edgeCases: ['Two lines only', 'All equal heights', 'Strictly increasing heights'],
    bruteForceMd: 'Try every pair (i, j) and compute min(h[i], h[j]) × (j − i).',
    bruteComplexity: 'O(n²) time.',
    bottleneckMd: 'Most pairs can be ruled out without being evaluated: once the shorter side is fixed, moving the taller side inward can only hurt.',
    hints: [
      'Start with the widest container (the two ends). How can you possibly do better from there?',
      'The area is limited by the shorter line. What happens if you move the taller line inward?',
      'Moving the taller line can never increase the area, so always move the shorter one.',
      'l = 0, r = n-1; best = 0; while l < r: best = max(best, min(h[l], h[r]) * (r − l)); move the shorter side',
    ],
    optimalMd: 'Converging pointers: compute the area, then move the pointer at the shorter line. Every pair discarded this way has an area no larger than one already considered.',
    code: [
      cpp(`
int maxArea(vector<int>& h) {
    int l = 0, r = (int)h.size() - 1, best = 0;
    while (l < r) {
        best = max(best, min(h[l], h[r]) * (r - l));
        if (h[l] < h[r]) ++l; else --r;
    }
    return best;
}`, 'C++'),
      java(`
public int maxArea(int[] h) {
    int l = 0, r = h.length - 1, best = 0;
    while (l < r) {
        best = Math.max(best, Math.min(h[l], h[r]) * (r - l));
        if (h[l] < h[r]) l++; else r--;
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space.',
    testCases: [
      { input: '[1, 8, 6, 2, 5, 4, 8, 3, 7]', expected: '49', why: 'Classic' },
      { input: '[1, 1]', expected: '1', why: 'Minimum size' },
    ],
    takeawaysMd: 'Two pointers is justified by an elimination argument. If you can say which candidates a move discards and why they cannot win, the greedy move is safe.',
  },

  'best-time-to-buy-and-sell-stock': {
    understandMd: 'Pick one day to buy and a later day to sell to maximise profit; return 0 if no profit is possible.',
    ioConstraintsMd: 'n up to 10⁵ prices. Output: the maximum profit.',
    edgeCases: ['Strictly decreasing prices (answer 0)', 'A single day', 'The minimum occurs after the maximum'],
    bruteForceMd: 'For every buy day i, check every sell day j > i.',
    bruteComplexity: 'O(n²) time.',
    bottleneckMd: 'For a fixed sell day, only the cheapest earlier price matters, and it can be maintained while scanning.',
    hints: [
      'If you sell on day j, which buy day is best?',
      'Track the minimum price seen so far.',
      'At each day, profit = price − minSoFar; keep the best.',
      'mn = inf; best = 0; for p in prices: mn = min(mn, p); best = max(best, p − mn)',
    ],
    optimalMd: 'A single pass keeping the running minimum and the best profit.',
    code: [
      cpp(`
int maxProfit(vector<int>& prices) {
    int mn = INT_MAX, best = 0;
    for (int p : prices) { mn = min(mn, p); best = max(best, p - mn); }
    return best;
}`, 'C++'),
      java(`
public int maxProfit(int[] prices) {
    int mn = Integer.MAX_VALUE, best = 0;
    for (int p : prices) { mn = Math.min(mn, p); best = Math.max(best, p - mn); }
    return best;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(1) space.',
    testCases: [
      { input: '[7, 1, 5, 3, 6, 4]', expected: '5', why: 'Buy at 1, sell at 6' },
      { input: '[7, 6, 4, 3, 1]', expected: '0', why: 'No profit' },
    ],
    takeawaysMd: 'If an optimal pair depends only on the best element seen earlier, maintain that best incrementally. This prefix-minimum idea reappears often.',
  },

  'longest-substring-without-repeating-characters': {
    understandMd: 'Find the length of the longest contiguous substring in which no character repeats.',
    ioConstraintsMd: 'Length up to 5·10⁴; letters, digits, symbols and spaces. Output: a length.',
    edgeCases: ['Empty string', 'All the same character', 'Spaces count as characters'],
    bruteForceMd: 'For every start, extend while characters stay unique (tracking with a set).',
    bruteComplexity: 'O(n²) time (O(n³) if each substring is re-checked from scratch).',
    bottleneckMd: 'When a repeat appears, restarting from the next start index throws away knowledge: the window between the two occurrences is still unique.',
    hints: [
      'This is a contiguous substring with a constraint ("no repeats"). Which pattern fits?',
      'If a window is valid, is every window inside it valid? That monotonicity is what you need.',
      'Expand r; while s[r] occurs twice in the window, move l forward and decrement counts; record r − l + 1.',
      'cnt[256]; for r: cnt[s[r]]++; while cnt[s[r]] > 1: cnt[s[l++]]--; best = max(best, r − l + 1)',
    ],
    optimalMd: 'A variable sliding window with character counts (or a map of last index, to jump l directly past the previous occurrence).',
    code: [
      cpp(`
int lengthOfLongestSubstring(string s) {
    vector<int> last(256, -1);
    int best = 0, l = 0;
    for (int r = 0; r < (int)s.size(); ++r) {
        unsigned char c = s[r];
        if (last[c] >= l) l = last[c] + 1;   // jump past the previous occurrence
        last[c] = r;
        best = max(best, r - l + 1);
    }
    return best;
}`, 'C++'),
      java(`
public int lengthOfLongestSubstring(String s) {
    int[] last = new int[256];
    Arrays.fill(last, -1);
    int best = 0, l = 0;
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        if (last[c] >= l) l = last[c] + 1;
        last[c] = r;
        best = Math.max(best, r - l + 1);
    }
    return best;
}`, 'Java'),
    ],
    finalComplexity: 'O(n) time, O(σ) space for the alphabet table.',
    testCases: [
      { input: '"abcabcbb"', expected: '3', why: 'Classic' },
      { input: '"bbbbb"', expected: '1', why: 'All the same' },
      { input: '"pwwkew"', expected: '3', why: '"pwke" is a subsequence, not a substring' },
      { input: '""', expected: '0', why: 'Empty' },
      { input: '"abba"', expected: '2', why: 'l must never move backwards (the `last[c] >= l` check)' },
    ],
    takeawaysMd: 'With the last-index variant, guard against moving l backwards: only jump if the previous occurrence is inside the current window.',
  },

  'binary-search': {
    understandMd: 'Return the index of a target in a sorted array of distinct integers, or −1 if it is absent, in O(log n).',
    ioConstraintsMd: 'n up to 10⁴, sorted ascending, distinct values.',
    edgeCases: ['Target smaller than every element', 'Target larger than every element', 'Single element'],
    bruteForceMd: 'Scan linearly.',
    bruteComplexity: 'O(n) time.',
    bottleneckMd: 'A linear scan ignores sortedness: each comparison can discard half the remaining range.',
    hints: [
      'Compare the target with the middle element. What does each outcome tell you?',
      'Keep an interval that must contain the target if it exists, and halve it each step.',
      'Use the half-open "first index with a[i] ≥ target" template, then check equality.',
      'lo = 0, hi = n; while lo < hi: mid; if a[mid] >= t: hi = mid else lo = mid + 1; return lo < n && a[lo] == t ? lo : −1',
    ],
    optimalMd: 'Find the lower bound of the target with the half-open template and verify it equals the target.',
    code: [
      cpp(`
int search(vector<int>& a, int target) {
    int lo = 0, hi = a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= target) hi = mid; else lo = mid + 1;
    }
    return (lo < (int)a.size() && a[lo] == target) ? lo : -1;
}`, 'C++'),
      java(`
public int search(int[] a, int target) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= target) hi = mid; else lo = mid + 1;
    }
    return (lo < a.length && a[lo] == target) ? lo : -1;
}`, 'Java'),
    ],
    finalComplexity: 'O(log n) time, O(1) space.',
    testCases: [
      { input: '[−1, 0, 3, 5, 9, 12], target 9', expected: '4', why: 'Present' },
      { input: '[−1, 0, 3, 5, 9, 12], target 2', expected: '−1', why: 'Absent; lo lands between elements' },
      { input: '[5], target 5', expected: '0', why: 'Single element' },
    ],
    takeawaysMd: 'Learn one invariant-based template and reuse it everywhere. The lower bound plus an equality check covers exact search.',
  },

  'find-minimum-in-rotated-sorted-array': {
    understandMd: 'A sorted array of distinct values was rotated at an unknown pivot. Return its minimum in O(log n).',
    ioConstraintsMd: 'n up to 5000, distinct values; O(log n) required.',
    edgeCases: ['Not rotated at all', 'Rotated by n − 1', 'Two elements'],
    bruteForceMd: 'Scan for the minimum.',
    bruteComplexity: 'O(n) time.',
    bottleneckMd: 'The array has two sorted runs, and comparing with the last element tells you which run an index is in.',
    hints: [
      'Draw the rotated array as two increasing segments. Where is the minimum?',
      'Compare a[mid] with the last element. What does a[mid] > a[last] imply about the minimum\'s position?',
      'Predicate: a[i] ≤ a[n − 1] is false on the left run and true from the minimum onward. Find the first true.',
      'lo = 0, hi = n-1; while lo < hi: mid; if a[mid] > a[hi]: lo = mid + 1 else hi = mid; return a[lo]',
    ],
    optimalMd: 'Binary search with the predicate a[mid] ≤ a[hi] (or ≤ the last element). If a[mid] > a[hi], the minimum is to the right of mid; otherwise it is at mid or to its left.',
    code: [
      cpp(`
int findMin(vector<int>& a) {
    int lo = 0, hi = a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1;
        else hi = mid;
    }
    return a[lo];
}`, 'C++'),
      java(`
public int findMin(int[] a) {
    int lo = 0, hi = a.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1;
        else hi = mid;
    }
    return a[lo];
}`, 'Java'),
    ],
    finalComplexity: 'O(log n) time, O(1) space.',
    testCases: [
      { input: '[3, 4, 5, 1, 2]', expected: '1', why: 'Rotated' },
      { input: '[11, 13, 15, 17]', expected: '11', why: 'Not rotated' },
      { input: '[2, 1]', expected: '1', why: 'Two elements' },
    ],
    takeawaysMd: 'Rotated arrays become binary-searchable once you find a predicate that is monotonic over the indices. Comparing with an endpoint usually provides one.',
  },

  'koko-eating-bananas': {
    understandMd: 'Find the smallest integer eating speed k such that all piles are finished within h hours, where each hour you eat up to k bananas from one pile.',
    ioConstraintsMd: 'Up to 10⁴ piles, pile sizes up to 10⁹, h ≥ number of piles. Output: minimum k.',
    edgeCases: ['h equals the number of piles (k = max pile)', 'Very large h (k = 1)', 'A single pile'],
    bruteForceMd: 'Try k = 1, 2, 3, … and simulate the hours for each until it fits.',
    bruteComplexity: 'O(max pile × n) time, up to 10¹³: too slow.',
    bottleneckMd: 'We try speeds one by one, yet feasibility is monotonic: if speed k works, every faster speed also works.',
    hints: [
      'Given a speed k, how many hours are needed? Is that quick to compute?',
      'As k increases, hours never increase. What does that monotonicity allow?',
      'Binary-search k in [1, max(piles)] for the first k where hours(k) ≤ h. hours(k) = Σ ceil(p / k).',
      'lo = 1, hi = max + 1; while lo < hi: mid; if hours(mid) <= h: hi = mid else lo = mid + 1; return lo',
    ],
    optimalMd: 'Binary search on the answer: the feasibility check sums ceil(p / k) with a 64-bit accumulator.',
    code: [
      cpp(`
int minEatingSpeed(vector<int>& piles, int h) {
    int lo = 1, hi = *max_element(piles.begin(), piles.end());
    while (lo < hi) {
        int k = lo + (hi - lo) / 2;
        long long hours = 0;
        for (int p : piles) hours += (p + (long long)k - 1) / k;
        if (hours <= h) hi = k; else lo = k + 1;
    }
    return lo;
}`, 'C++'),
      java(`
public int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = 0;
    for (int p : piles) hi = Math.max(hi, p);
    while (lo < hi) {
        int k = lo + (hi - lo) / 2;
        long hours = 0;
        for (int p : piles) hours += (p + (long) k - 1) / k;
        if (hours <= h) hi = k; else lo = k + 1;
    }
    return lo;
}`, 'Java'),
    ],
    finalComplexity: 'O(n log max) time, O(1) space.',
    testCases: [
      { input: 'piles [3, 6, 7, 11], h 8', expected: '4', why: 'Classic' },
      { input: 'piles [30, 11, 23, 4, 20], h 5', expected: '30', why: 'h equals the pile count' },
      { input: 'piles [1000000000], h 2', expected: '500000000', why: 'Overflow check on p + k − 1' },
    ],
    takeawaysMd: '"Minimum X such that it is possible" plus a monotonic check gives binary search on the answer. Write the check first, then wrap it in the template.',
  },
};
