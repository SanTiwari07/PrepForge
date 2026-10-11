import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.string-matching';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'String Matching',
  summary: 'KMP, Z-algorithm and Rabin-Karp rolling hashes.',
  level: 'advanced',
  status: 'complete',
  estMinutes: 100,
  prerequisites: ['dsa.arrays-strings', 'dsa.hashing'],
  related: ['dsa.arrays-strings', 'dsa.hashing', 'dsa.tries', 'dsa.binary-search'],
  subtopics: ['Naive matching and its worst case', 'Prefix function (KMP failure function)', 'KMP search', 'Z-function', 'Rabin-Karp rolling hash', 'Periodicity and repeated patterns', 'Binary search + hashing'],
  objectives: [
    'Explain why naive matching is O(n · m) in the worst case and how KMP avoids re-scanning the text.',
    'Compute the prefix function (longest proper prefix that is also a suffix) in O(m) and use it for KMP search in O(n + m).',
    'Compute the Z-function and use the "pattern + separator + text" trick.',
    'Implement a Rabin-Karp rolling hash with a modulus, and explain collisions and how to handle them.',
    'Solve periodicity problems (Repeated Substring Pattern, Shortest Palindrome, Longest Happy Prefix) with the prefix function.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'Why naive matching is slow, and what KMP remembers',
      bodyMd: `**Naive matching** tries every start position i and compares the pattern P (length m) with T[i..i+m). Worst case O(n · m), for example T = "aaaa…a", P = "aaa…ab": each position matches m − 1 characters before failing.

**KMP (Knuth-Morris-Pratt)** never moves backwards in the text. When a mismatch happens after matching j characters, it already knows those j characters equal P[0..j). So it shifts the pattern to the longest **proper prefix of P[0..j) that is also its suffix** and continues comparing from there. That length is precomputed in the **prefix function**:

\`pi[i]\` = length of the longest proper prefix of P[0..i] that is also a suffix of P[0..i].

Example P = "ababaca": pi = [0, 0, 1, 2, 3, 0, 1].

KMP runs in **O(n + m)**: the text index only moves forward, and the pattern index can fall back at most as many times as it advanced.

**Built-ins:** \`string::find\` (C++) and \`String.indexOf\` (Java) are fine in interviews for a single search; their worst case is implementation-dependent (often O(n · m)). Know KMP when the interviewer asks for a guaranteed linear time or for the prefix function itself.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Z-function, rolling hashes and periodicity',
      bodyMd: `**Z-function:** z[i] = length of the longest substring starting at i that is also a prefix of the string. Computed in O(n) with a window [l, r) of the rightmost match found so far. To find P in T, compute z of **P + '#' + T** (with a separator not in either string): every position with z[i] = m is a match.

**Rabin-Karp:** hash each window of length m with a polynomial hash h = Σ s[k] · B^(m−1−k) mod M. Sliding one step: remove the leftmost character's contribution, multiply by B, add the new one, all in O(1). Compare hashes, and on equality verify the characters (or use two moduli) because **different strings can collide**. Expected O(n + m). Hashing shines when combined with binary search: "longest duplicate substring" binary-searches the length L and checks with a hash set of all length-L window hashes, O(n log n) expected.

**Periodicity with the prefix function:**
- The longest proper prefix of s that is also a suffix (the "happy prefix") is pi[n − 1].
- s is made of a repeated block iff p = n − pi[n − 1] divides n and p < n; the block is s[0..p).
- Shortest Palindrome: compute pi of s + '#' + reverse(s); the last value is the length of the longest palindromic prefix of s; prepend the reversed remaining suffix.

**Rotations:** B is a rotation of A iff |A| = |B| and B occurs in A + A (search with KMP or find).`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: prefix function of "aabaaab"',
      bodyMd: 'k is the length of the current matching prefix; on a mismatch, fall back with k = pi[k − 1].',
      trace: [
        { note: 'i = 0: pi[0] = 0 by definition.', array: ['a', 'a', 'b', 'a', 'a', 'a', 'b'], pointers: { i: 0 }, vars: { pi: '[0]' } },
        { note: 'i = 1: s[1] = a = s[0] → k = 1. i = 2: b ≠ s[1] = a → fall back to pi[0] = 0; b ≠ s[0] → 0.', array: ['a', 'a', 'b', 'a', 'a', 'a', 'b'], pointers: { i: 2 }, vars: { pi: '[0, 1, 0]' } },
        { note: 'i = 3: a = s[0] → 1. i = 4: a = s[1] → 2.', array: ['a', 'a', 'b', 'a', 'a', 'a', 'b'], pointers: { i: 4 }, vars: { pi: '[0, 1, 0, 1, 2]' } },
        { note: 'i = 5: a ≠ s[2] = b → k = pi[1] = 1; a = s[1] → k = 2. pi[5] = 2.', array: ['a', 'a', 'b', 'a', 'a', 'a', 'b'], pointers: { i: 5 }, vars: { pi: '[0, 1, 0, 1, 2, 2]' } },
        { note: 'i = 6: b = s[2] → k = 3. pi = [0, 1, 0, 1, 2, 2, 3]: the prefix "aab" is also a suffix.', array: ['a', 'a', 'b', 'a', 'a', 'a', 'b'], pointers: { i: 6 }, vars: { pi: '[0, 1, 0, 1, 2, 2, 3]' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'Prefix function and KMP search, the Z-function, and a Rabin-Karp search.',
      code: [
        cpp(`
vector<int> prefixFunction(const string& s) {
    int n = s.size();
    vector<int> pi(n, 0);
    for (int i = 1; i < n; ++i) {
        int k = pi[i - 1];
        while (k > 0 && s[i] != s[k]) k = pi[k - 1];
        if (s[i] == s[k]) ++k;
        pi[i] = k;
    }
    return pi;
}

vector<int> kmpSearch(const string& text, const string& pat) {   // all match positions
    vector<int> pi = prefixFunction(pat), out;
    int k = 0;
    for (int i = 0; i < (int)text.size(); ++i) {
        while (k > 0 && text[i] != pat[k]) k = pi[k - 1];
        if (text[i] == pat[k]) ++k;
        if (k == (int)pat.size()) { out.push_back(i - k + 1); k = pi[k - 1]; }
    }
    return out;
}

vector<int> zFunction(const string& s) {
    int n = s.size();
    vector<int> z(n, 0);
    for (int i = 1, l = 0, r = 0; i < n; ++i) {
        if (i < r) z[i] = min(r - i, z[i - l]);
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) ++z[i];
        if (i + z[i] > r) { l = i; r = i + z[i]; }
    }
    return z;
}

int rabinKarp(const string& t, const string& p) {               // first match or -1
    const long long B = 131, M = 1000000007LL;
    int n = t.size(), m = p.size();
    if (m > n) return -1;
    long long hp = 0, ht = 0, pw = 1;
    for (int i = 0; i < m; ++i) {
        hp = (hp * B + p[i]) % M;
        ht = (ht * B + t[i]) % M;
        if (i) pw = pw * B % M;                                   // B^(m-1)
    }
    for (int i = 0; ; ++i) {
        if (hp == ht && t.compare(i, m, p) == 0) return i;        // verify on hash equality
        if (i + m >= n) return -1;
        ht = (ht - t[i] * pw % M + M) % M;                        // remove the left character
        ht = (ht * B + t[i + m]) % M;                             // add the right character
    }
}`, 'C++'),
        java(`
int[] prefixFunction(String s) {
    int n = s.length();
    int[] pi = new int[n];
    for (int i = 1; i < n; i++) {
        int k = pi[i - 1];
        while (k > 0 && s.charAt(i) != s.charAt(k)) k = pi[k - 1];
        if (s.charAt(i) == s.charAt(k)) k++;
        pi[i] = k;
    }
    return pi;
}

List<Integer> kmpSearch(String text, String pat) {
    int[] pi = prefixFunction(pat);
    List<Integer> out = new ArrayList<>();
    int k = 0;
    for (int i = 0; i < text.length(); i++) {
        while (k > 0 && text.charAt(i) != pat.charAt(k)) k = pi[k - 1];
        if (text.charAt(i) == pat.charAt(k)) k++;
        if (k == pat.length()) { out.add(i - k + 1); k = pi[k - 1]; }
    }
    return out;
}

int[] zFunction(String s) {
    int n = s.length();
    int[] z = new int[n];
    for (int i = 1, l = 0, r = 0; i < n; i++) {
        if (i < r) z[i] = Math.min(r - i, z[i - l]);
        while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
        if (i + z[i] > r) { l = i; r = i + z[i]; }
    }
    return z;
}

boolean repeatedSubstringPattern(String s) {
    int n = s.length();
    int p = n - prefixFunction(s)[n - 1];
    return p < n && n % p == 0;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `| Method | Preprocess | Search | Notes |
|---|---|---|---|
| Naive | none | O(n · m) worst | fine for short patterns |
| KMP | O(m) | O(n) | deterministic |
| Z-function | O(n + m) on P#T | included | deterministic |
| Rabin-Karp | O(m) | O(n) expected | collisions: verify or double-hash |
| Binary search + rolling hash (longest repeat) | | O(n log n) expected | |
| Trie / Aho-Corasick (many patterns) | O(total pattern length) | O(n + matches) | beyond most interviews |

Space is O(m) for KMP's table, O(n + m) for the Z array of P#T.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Using "proper" incorrectly:** pi[i] must be shorter than i + 1, otherwise every string trivially matches itself.
2. **Falling back with k = pi[k] instead of pi[k − 1].**
3. **Not resetting k after a full match** (k = pi[k − 1]), which misses overlapping matches such as "aa" in "aaa".
4. **Z-function without a separator** in P + T, letting matches run across the boundary.
5. **Rabin-Karp: negative intermediate values** after subtracting; add M before taking the modulus.
6. **Trusting a single hash equality** without verifying (or without a second modulus) in an exact-answer problem.
7. **Using natural overflow (mod 2⁶⁴) with base 2**-like patterns; adversarial inputs (Thue-Morse strings) break it.`,
    },
  ],
  recognition: {
    signals: ['Find a pattern in a text with a linear-time guarantee', 'Longest prefix that is also a suffix; repeated blocks; periods', 'Is B a rotation of A?', 'Longest duplicate substring, or comparing many substrings quickly', 'Shortest palindrome by adding characters in front'],
    antiSignals: ['Many patterns, one text: trie / Aho-Corasick', 'Edit-distance-style approximate matching: DP', 'One search with tiny inputs: built-in find is enough'],
    decisionQuestions: ['Single pattern or many?', 'Do I need all occurrences, the prefix function itself, or just yes/no?', 'Is a probabilistic (hash) answer acceptable, or must it be exact?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the KMP prefix function and why search is linear.', answerMd: 'pi[i] is the length of the longest proper prefix of P[0..i] that is also its suffix. During the search, the text index never moves backwards; on a mismatch, the pattern index k falls back to pi[k − 1], reusing the characters already matched. k increases at most n times in total, so it can decrease at most n times: O(n + m).' },
    { id: 'iq2', q: 'How do you check whether a string is built from a repeated substring?', answerMd: 'Let p = n − pi[n − 1]. The string is periodic with period p, and it is an exact repetition iff p < n and n % p == 0. Alternative: s is repeated iff s occurs in (s + s) with the first and last characters removed.' },
    { id: 'iq3', q: 'What is the Z-function, and how do you match with it?', answerMd: 'z[i] is the length of the longest common prefix of s and s[i..]. It is computed in O(n) by reusing the rightmost match window [l, r). To find P in T, compute z on P + "#" + T; positions with z[i] = |P| are matches.' },
    { id: 'iq4', q: 'How does Rabin-Karp handle collisions?', answerMd: 'Equal hashes do not guarantee equal strings. Either verify the characters whenever hashes match (still expected O(n + m)), or use two independent moduli so a false positive is extremely unlikely, accepting a tiny error probability.' },
    { id: 'iq5', q: 'Find the longest substring that occurs at least twice.', answerMd: 'Binary search on the length L: if a repeat of length L exists, one of length L − 1 does too. For each L, slide a rolling hash over all windows and look for a repeated hash (verify on collision). O(n log n) expected. A suffix array with LCP gives O(n log n) deterministically.' },
    { id: 'iq6', q: 'Shortest Palindrome: how does KMP help?', answerMd: 'The answer prepends the reverse of the part after the longest palindromic prefix. Compute the prefix function of s + "#" + reverse(s): its last value is the length of the longest prefix of s that equals a suffix of reverse(s), i.e. the longest palindromic prefix. O(n).' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Naive O(nm) worst; KMP and Z are O(n + m); Rabin-Karp O(n + m) expected.
- pi[i]: longest proper prefix of P[0..i] that is a suffix. Fall back k = pi[k − 1].
- After a full match, k = pi[k − 1] to keep overlapping matches.
- Z on P#T: z[i] = |P| marks a match.
- Rolling hash: remove left·B^(m−1), multiply by B, add right; mod with + M; verify on equal hash.
- Period p = n − pi[n − 1]; repeated iff p < n and n % p == 0. Rotation: B in A + A.`,
    flashcards: [
      { id: 'f1', front: 'Prefix function of "ababaca"?', backMd: '[0, 0, 1, 2, 3, 0, 1].' },
      { id: 'f2', front: 'KMP fallback rule on a mismatch?', backMd: 'k = pi[k − 1] (repeat while mismatching and k > 0).' },
      { id: 'f3', front: 'Z-function matching trick?', backMd: 'Compute z on P + "#" + T; positions with z = |P| are matches.' },
      { id: 'f4', front: 'Test for a repeated-block string with pi?', backMd: 'p = n − pi[n − 1]; true iff p < n and n % p == 0.' },
      { id: 'f5', front: 'Why verify on equal Rabin-Karp hashes?', backMd: 'Different strings can share a hash (collision).' },
    ],
  },
  mastery: { testSize: 6, testMinutes: 12, passPct: 75, minIndependentSolves: 2, minMediumIndependent: 1, retentionDays: 10 },
  resources: [
    { title: 'Knuth-Morris-Pratt algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm', kind: 'article' },
    { title: 'Rabin-Karp algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Rabin%E2%80%93Karp_algorithm', kind: 'article' },
    { title: 'Find the Index of the First Occurrence in a String (LeetCode 28)', url: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.strmatch.q1', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    string s = "ababaca";
    vector<int> pi(s.size(), 0);
    for (size_t i = 1; i < s.size(); ++i) {
        int k = pi[i - 1];
        while (k > 0 && s[i] != s[k]) k = pi[k - 1];
        if (s[i] == s[k]) ++k;
        pi[i] = k;
    }
    for (int x : pi) cout << x;
    cout << endl;
    return 0;
}`, 'C++', '0012301'),
    options: ['0012301', ['0012300', '"a" at the end matches the prefix "a".'], ['0123401', 'pi[1] is 0: "ab" has no proper prefix equal to a suffix.'], ['0012311', 'At "c" no prefix matches.']],
    answer: 0,
    explanation: 'pi = [0, 0, 1, 2, 3, 0, 1]: "aba" → 1, "abab" → 2 ("ab"), "ababa" → 3 ("aba"), "ababac" → 0, "ababaca" → 1.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.strmatch.q2', type: 'complexity', difficulty: 'easy',
    stem: 'What is the worst-case time of naive substring search for a pattern of length m in a text of length n?',
    options: ['O(n · m)', ['O(n + m)', 'That is KMP.'], ['O(n log m)', 'No logarithm appears.'], ['O(m²)', 'Depends on n too.']],
    answer: 0,
    explanation: 'Text "aaaa…a" and pattern "aa…ab": every start position compares m characters before failing.',
  }),
  mcq({
    ...base, id: 'dsa.strmatch.q3', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        String s = "aabxaab";
        int n = s.length();
        int[] z = new int[n];
        for (int i = 1, l = 0, r = 0; i < n; i++) {
            if (i < r) z[i] = Math.min(r - i, z[i - l]);
            while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
            if (i + z[i] > r) { l = i; r = i + z[i]; }
        }
        System.out.println(Arrays.toString(z));
    }
}`, 'Java', '[0, 1, 0, 0, 3, 1, 0]'),
    options: ['[0, 1, 0, 0, 3, 1, 0]', ['[7, 1, 0, 0, 3, 1, 0]', 'This implementation leaves z[0] = 0 by convention.'], ['[0, 1, 0, 0, 2, 1, 0]', '"aab" at index 4 matches the prefix "aab" fully.'], ['[0, 0, 0, 0, 3, 0, 0]', 'Index 1 starts with "a", matching one character.']],
    answer: 0,
    explanation: 'At i = 4, "aab" equals the prefix "aab" (length 3); at i = 1 and i = 5, only "a" matches.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.strmatch.q4', type: 'concept', difficulty: 'medium',
    stem: 'n = 12 and pi[n − 1] = 8 for a string s. What can you conclude?',
    options: ['s has period 4 and is the 4-character block repeated 3 times', ['s has period 8', 'The period is n − pi[n − 1] = 4.'], ['s is not periodic', '4 divides 12.'], ['s is a palindrome', 'Prefix-suffix overlap does not imply a palindrome.']],
    answer: 0,
    explanation: 'p = 12 − 8 = 4, and 12 % 4 = 0, so s = (s[0..4))³.',
  }),
  mcq({
    ...base, id: 'dsa.strmatch.q5', type: 'debug', difficulty: 'medium',
    stem: 'A KMP search finds "aa" in "aaaa" only at positions 0 and 2. What is wrong?',
    options: ['After a full match it resets k = 0 instead of k = pi[k − 1]', ['The prefix function is wrong for "aa"', 'pi("aa") = [0, 1] is correct.'], ['It should compare from the end', 'That is Boyer-Moore, not needed.'], ['Nothing; matches cannot overlap', 'Positions 0, 1 and 2 are all matches.']],
    answer: 0,
    explanation: 'With k = pi[1] = 1 after the first match, the next character completes another match at position 1.',
  }),
  mcq({
    ...base, id: 'dsa.strmatch.q6', type: 'pattern', difficulty: 'easy',
    stem: 'How can you check in O(n) whether "cdeab" is a rotation of "abcde"?',
    options: ['Check equal lengths, then search for "cdeab" in "abcdeabcde" with KMP', ['Sort both strings and compare', 'That checks anagrams, not rotations.'], ['Compare character counts', 'Also only anagrams.'], ['Try all n rotations explicitly', 'O(n²).']],
    answer: 0,
    explanation: 'Every rotation of A is a substring of A + A, and vice versa (for strings of the same length).',
  }),
  mcq({
    ...base, id: 'dsa.strmatch.q7', type: 'concept', difficulty: 'medium',
    stem: 'Why does Rabin-Karp compare characters when two hashes are equal?',
    options: ['Different windows can have the same hash value (a collision)', ['Hashes are computed approximately', 'Modular arithmetic is exact.'], ['To update the rolling hash', 'The update uses arithmetic only.'], ['Because the hash ignores the first character', 'Every character contributes.']],
    answer: 0,
    explanation: 'With modulus M, many strings map to each value. Verifying keeps the answer exact; double hashing makes collisions astronomically unlikely instead.',
  }),
  mcq({
    ...base, id: 'dsa.strmatch.q8', type: 'pattern', difficulty: 'hard',
    stem: 'Longest Duplicate Substring with n up to 3·10⁴. Which approach is expected?',
    options: ['Binary search on the length + rolling hash of all windows, O(n log n) expected', ['Compare all pairs of substrings', 'O(n³).'], ['KMP of each suffix against the string', 'O(n²).'], ['Sort all substrings', 'There are O(n²) substrings.']],
    answer: 0,
    explanation: 'If a duplicate of length L exists, one of length L − 1 exists too (monotone), so binary search applies; each check hashes all n − L + 1 windows in O(n).',
  }),
];
