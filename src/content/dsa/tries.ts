import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.tries';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Tries',
  summary: 'Prefix trees for word search, autocomplete and XOR maximisation.',
  level: 'core',
  status: 'complete',
  estMinutes: 75,
  prerequisites: ['dsa.binary-trees', 'dsa.hashing'],
  related: ['dsa.hashing', 'dsa.backtracking', 'dsa.bit-manipulation', 'dsa.string-matching'],
  subtopics: ['Node structure: children + end flag', 'insert, search and startsWith', 'Wildcard search with DFS', 'Trie + grid backtracking (Word Search II)', 'Autocomplete / search suggestions', 'Binary trie for maximum XOR'],
  objectives: [
    'Implement a trie with insert, search and startsWith in O(L) per operation, where L is the word length.',
    'Explain when a trie beats a hash set (prefix queries, shared prefixes, pruning a search) and when it does not.',
    'Combine a trie with DFS for wildcard matching and with grid backtracking for Word Search II.',
    'Build a binary trie over the bits of integers to find the maximum XOR pair in O(n · 32).',
    'Estimate the memory cost of array-based vs map-based children.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'A tree of characters',
      bodyMd: `A **trie** (prefix tree) stores strings character by character. Each node has up to Σ children (Σ = alphabet size, 26 for lowercase letters) and a flag saying "a word ends here".

- **insert(word):** walk from the root, creating missing child nodes, then set the end flag on the last node.
- **search(word):** walk; fail on a missing child; succeed only if the final node's end flag is set.
- **startsWith(prefix):** walk; succeed if every character exists (the end flag does not matter).

All three cost **O(L)** for a word of length L, independent of how many words are stored. Words that share a prefix share nodes, so "apple", "app" and "apply" use 6 nodes for the shared "appl…" path plus their endings.

**Why not a hash set?** A hash set answers "is this exact word present?" in O(L) average too. A trie wins when you need **prefixes**: all words starting with "ca", the longest stored prefix of a query, or **stopping a search early** as soon as no stored word continues the current prefix (Word Search II).`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Patterns built on a trie',
      bodyMd: `**Wildcard search** (Design Add and Search Words): on '.', try every existing child recursively; on a letter, follow that child. Worst case O(26^dots · L), but real inputs prune quickly.

**Word Search II** (find many words in a grid): insert all words into a trie, then DFS from every cell, moving down the trie as you move across the grid. Stop as soon as the current path is not a prefix of any word. Store the complete word at its end node so you can report it, and clear it after reporting so it is not reported twice. One DFS handles all words at once; searching each word separately repeats the same grid work.

**Search suggestions / autocomplete:** walk to the prefix's node, then DFS in alphabetical order collecting up to 3 words. (Sorting the words and using binary search for the prefix is a simpler alternative for this problem.)

**Binary trie for XOR:** insert each number's bits from the most significant down (bit 30 for non-negative 32-bit ints). To maximise x XOR y for a given x, walk down choosing the **opposite** bit whenever that child exists: a 1 in a higher bit outweighs all lower bits together. O(32) per query, O(32n) total for the maximum XOR pair.

**Memory:** an array of 26 pointers per node is fast but uses 26 × 8 = 208 bytes per node on 64-bit systems. A hash map of children is smaller for sparse alphabets but slower. For 10⁵ words of length 10 (up to 10⁶ nodes), arrays may need around 200 MB; that is why real systems compress tries (radix trees).`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: insert "car", "cat", "cart"; then query',
      bodyMd: 'Each step lists the trie paths that exist (a * marks an end-of-word node).',
      trace: [
        { note: 'insert "car": create c → a → r, mark r.', array: ['c', 'a', 'r*'], vars: { nodes: 3 } },
        { note: 'insert "cat": c and a exist; create t under a, mark it.', array: ['c', 'a', 'r*', 't*'], highlight: [3], vars: { nodes: 4 } },
        { note: 'insert "cart": c, a, r exist; create t under r, mark it.', array: ['c', 'a', 'r*', 't*', 'r→t*'], highlight: [4], vars: { nodes: 5 } },
        { note: 'search("ca"): the path exists, but a is not marked → false. startsWith("ca") → true.', array: ['c', 'a', 'r*', 't*', 'r→t*'], highlight: [0, 1], vars: { search: 'false', startsWith: 'true' } },
        { note: 'search("cart") → true. search("care"): no child e under r → false after 4 steps.', array: ['c', 'a', 'r*', 't*', 'r→t*'], highlight: [0, 1, 2, 4], vars: { cart: 'true', care: 'false' } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'A lowercase trie, wildcard search, and a binary trie for the maximum XOR of two numbers.',
      code: [
        cpp(`
struct TrieNode {
    TrieNode* child[26] = {};
    bool end = false;
};

class Trie {
    TrieNode* root = new TrieNode();
    TrieNode* walk(const string& s) const {
        TrieNode* cur = root;
        for (char ch : s) {
            cur = cur->child[ch - 'a'];
            if (!cur) return nullptr;
        }
        return cur;
    }
public:
    void insert(const string& w) {
        TrieNode* cur = root;
        for (char ch : w) {
            int k = ch - 'a';
            if (!cur->child[k]) cur->child[k] = new TrieNode();
            cur = cur->child[k];
        }
        cur->end = true;
    }
    bool search(const string& w) const { TrieNode* n = walk(w); return n && n->end; }
    bool startsWith(const string& p) const { return walk(p) != nullptr; }

    // '.' matches any letter.
    bool searchWild(const string& w, int i = 0, TrieNode* n = nullptr) const {
        if (!n) n = root;
        if (i == (int)w.size()) return n->end;
        if (w[i] != '.') { TrieNode* c = n->child[w[i] - 'a']; return c && searchWild(w, i + 1, c); }
        for (TrieNode* c : n->child) if (c && searchWild(w, i + 1, c)) return true;
        return false;
    }
};

int findMaximumXOR(const vector<int>& nums) {
    struct Node { Node* kid[2] = {nullptr, nullptr}; };
    Node* root = new Node();
    int best = 0;
    for (int x : nums) {
        Node *ins = root, *q = root;
        int cur = 0;
        for (int b = 30; b >= 0; --b) {                 // values are non-negative ints
            int bit = (x >> b) & 1;
            if (!ins->kid[bit]) ins->kid[bit] = new Node();
            ins = ins->kid[bit];
            if (q->kid[bit ^ 1]) { cur |= 1 << b; q = q->kid[bit ^ 1]; }   // prefer the opposite bit
            else q = q->kid[bit];
        }
        best = max(best, cur);
    }
    return best;
}`, 'C++'),
        java(`
static class TrieNode {
    TrieNode[] child = new TrieNode[26];
    boolean end;
}

static class Trie {
    private final TrieNode root = new TrieNode();
    private TrieNode walk(String s) {
        TrieNode cur = root;
        for (int i = 0; i < s.length() && cur != null; i++) cur = cur.child[s.charAt(i) - 'a'];
        return cur;
    }
    void insert(String w) {
        TrieNode cur = root;
        for (int i = 0; i < w.length(); i++) {
            int k = w.charAt(i) - 'a';
            if (cur.child[k] == null) cur.child[k] = new TrieNode();
            cur = cur.child[k];
        }
        cur.end = true;
    }
    boolean search(String w) { TrieNode n = walk(w); return n != null && n.end; }
    boolean startsWith(String p) { return walk(p) != null; }

    boolean searchWild(String w) { return wild(w, 0, root); }
    private boolean wild(String w, int i, TrieNode n) {
        if (i == w.length()) return n.end;
        char ch = w.charAt(i);
        if (ch != '.') { TrieNode c = n.child[ch - 'a']; return c != null && wild(w, i + 1, c); }
        for (TrieNode c : n.child) if (c != null && wild(w, i + 1, c)) return true;
        return false;
    }
}

int findMaximumXOR(int[] nums) {
    int[][] kid = new int[nums.length * 31 + 1][2];   // node 0 is the root; 0 also means "no child"
    int count = 1, best = 0;
    for (int x : nums) {
        int ins = 0, q = 0, cur = 0;
        for (int b = 30; b >= 0; b--) {                 // values are non-negative ints
            int bit = (x >>> b) & 1;
            if (kid[ins][bit] == 0) kid[ins][bit] = count++;
            ins = kid[ins][bit];
            if (kid[q][bit ^ 1] != 0) { cur |= 1 << b; q = kid[q][bit ^ 1]; }
            else q = kid[q][bit];
        }
        best = Math.max(best, cur);
    }
    return best;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- insert / search / startsWith: **O(L)** time per word.
- Building a trie of N words with total length S: O(S) time, up to O(S · Σ) space with array children (O(S) nodes).
- Wildcard search: O(L) without dots; worst case O(Σ^d · L) with d dots.
- Word Search II: O(R · C · 4 · 3^(L−1)) in the worst case for maximum word length L, but trie pruning (and removing found words) makes it fast in practice.
- Maximum XOR pair: O(32n) time and O(32n) nodes.
- Inserting each number before querying it (as in the template) is fine because x XOR x = 0 never beats a real pair.`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **search returning true for prefixes** because it ignores the end flag ("app" found after inserting only "apple").
2. **Reporting a word twice** in Word Search II when it can be formed along two paths: clear the stored word after reporting it.
3. **Not restoring the grid cell** after marking it visited in the DFS.
4. **Using a trie when a hash set suffices** (only exact lookups): more code and memory for no gain.
5. **Signed shifts in Java:** use \`>>>\` (or mask with & 1) when reading bits of possibly negative numbers.
6. **Memory blow-up** with 26-pointer arrays for very large inputs; consider map children or sorting + binary search.
7. **Recursion depth** in DFS over a trie equals the longest word length, which is usually fine.`,
    },
  ],
  recognition: {
    signals: ['Many words with prefix queries (startsWith, autocomplete, suggestions)', 'Search many dictionary words in a grid or text at once', 'Wildcards in word queries', 'Maximise XOR of pairs or with a query value', 'Longest common prefix or "word built one character at a time"'],
    antiSignals: ['Only exact membership: hash set', 'One pattern in one text: KMP / Z / built-in find', 'Ordering or range queries on numbers: balanced BST or sorting'],
    decisionQuestions: ['Do I need prefixes, or only exact matches?', 'Can one trie replace many separate searches?', 'For integers: does choosing bits from the top greedily decide the answer?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: 'Implement a trie. What are the complexities?', answerMd: 'Each node has an array (or map) of children and an end flag. insert walks and creates nodes; search walks and checks the end flag; startsWith walks only. Each is O(L) time; total space O(total characters × alphabet) with arrays.' },
    { id: 'iq2', q: 'Why use a trie in Word Search II instead of searching each word separately?', answerMd: 'Searching each of W words separately repeats the grid DFS W times. With all words in a trie, one DFS from each cell follows the trie and explores only paths that are prefixes of some word, finding all words at once and pruning dead paths immediately. Removing found words (or pruning empty branches) speeds it up further.' },
    { id: 'iq3', q: 'Trie vs hash set for a dictionary?', answerMd: 'Hash set: O(L) average exact lookups, compact, simple. Trie: O(L) exact lookups plus prefix queries, ordered traversal and early termination, at a higher memory cost. Choose the trie only when prefixes matter.' },
    { id: 'iq4', q: 'Find the maximum XOR of two numbers in an array.', answerMd: 'Insert every number into a binary trie from the highest bit down (bit 30 for non-negative ints). For each number, walk the trie choosing the opposite bit when possible; each successful choice sets that bit in the XOR. A set high bit beats any combination of lower bits, so the greedy walk is optimal. O(32n).' },
    { id: 'iq5', q: 'How would you implement autocomplete returning the top 3 suggestions?', answerMd: 'Walk to the prefix node, then DFS children in alphabetical order and stop after 3 complete words; or store the top 3 words at each node during insertion. For ranking by popularity, store counts and keep a small heap per node. The simple alternative: sort words and binary-search the prefix range.' },
    { id: 'iq6', q: 'How much memory can a trie use, and how can you reduce it?', answerMd: 'Up to one node per character inserted; with 26 child pointers per node (208 bytes on 64-bit), 10⁶ nodes is ~200 MB. Reduce it with hash-map children, a compressed (radix) trie that merges single-child chains, or a flat array-based pool of nodes with int indices.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- Node = children[Σ] + end flag. insert/search/startsWith O(L).
- search checks the end flag; startsWith does not.
- Wildcard '.': DFS over all children.
- Word Search II: trie of words + grid DFS; prune; clear found words.
- Binary trie (bits 30→0 for non-negative ints): choose the opposite bit to maximise XOR.
- Prefer a hash set for exact lookups only.`,
    flashcards: [
      { id: 'f1', front: 'Time of trie insert/search for a word of length L?', backMd: 'O(L), independent of the number of stored words.' },
      { id: 'f2', front: 'Difference between search and startsWith?', backMd: 'search requires the end-of-word flag on the last node; startsWith only needs the path to exist.' },
      { id: 'f3', front: 'Why does a trie help Word Search II?', backMd: 'One grid DFS follows the trie for all words and stops when the path is not a prefix of any word.' },
      { id: 'f4', front: 'Maximum XOR pair technique?', backMd: 'Binary trie from the most significant bit; greedily follow the opposite bit.' },
      { id: 'f5', front: 'When is a trie the wrong choice?', backMd: 'When only exact membership is needed: a hash set is simpler and smaller.' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 2, retentionDays: 7 },
  resources: [
    { title: 'Trie (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Trie', kind: 'article' },
    { title: 'Implement Trie (LeetCode 208)', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/', kind: 'practice' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.tries.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
#include <string>
using namespace std;
struct Node { Node* c[26] = {}; bool end = false; };
Node root;
void insert(const string& w) {
    Node* n = &root;
    for (char ch : w) { if (!n->c[ch - 'a']) n->c[ch - 'a'] = new Node(); n = n->c[ch - 'a']; }
    n->end = true;
}
Node* walk(const string& s) {
    Node* n = &root;
    for (char ch : s) { n = n->c[ch - 'a']; if (!n) return nullptr; }
    return n;
}
int main() {
    insert("apple");
    insert("apply");
    Node* a = walk("app");
    Node* b = walk("apple");
    cout << (a != nullptr) << (a && a->end) << (b && b->end) << (walk("apt") != nullptr) << endl;
    return 0;
}`, 'C++', '1010'),
    options: ['1010', ['1110', '"app" was never inserted as a word, so its end flag is false.'], ['1011', 'There is no t under "ap".'], ['0010', 'The prefix "app" exists.']],
    answer: 0,
    explanation: 'startsWith("app") is true, search("app") is false, search("apple") is true, and "apt" does not exist.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.tries.q2', type: 'complexity', difficulty: 'easy',
    stem: 'A trie holds 10⁵ words. What is the cost of startsWith for a prefix of length 6?',
    options: ['O(6)', ['O(10⁵)', 'The number of stored words does not matter.'], ['O(6 · 10⁵)', 'Only one path is walked.'], ['O(log 10⁵)', 'A trie is not searched by comparisons.']],
    answer: 0,
    explanation: 'Walk six nodes, one per character.',
  }),
  mcq({
    ...base, id: 'dsa.tries.q3', type: 'pattern', difficulty: 'medium',
    stem: 'Which task gains the most from a trie over a hash set of words?',
    options: ['Find all words in a grid of letters, given a dictionary of 3·10⁴ words', ['Check whether a single word is in the dictionary', 'A hash set is simpler.'], ['Count distinct words in a text', 'A hash set suffices.'], ['Sort the words', 'Sorting does not need a trie.']],
    answer: 0,
    explanation: 'The grid DFS can stop the moment the path is not a prefix of any word, which a hash set of full words cannot tell you.',
  }),
  mcq({
    ...base, id: 'dsa.tries.q4', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    static int[][] kid = new int[200][2];
    static int count = 1;
    public static void main(String[] args) {
        int[] nums = {3, 10, 5, 25, 2, 8};
        int best = 0;
        for (int x : nums) {
            int ins = 0, q = 0, cur = 0;
            for (int b = 4; b >= 0; b--) {
                int bit = (x >>> b) & 1;
                if (kid[ins][bit] == 0) kid[ins][bit] = count++;
                ins = kid[ins][bit];
                if (kid[q][bit ^ 1] != 0) { cur |= 1 << b; q = kid[q][bit ^ 1]; }
                else q = kid[q][bit];
            }
            best = Math.max(best, cur);
        }
        System.out.println(best);
    }
}`, 'Java', '28'),
    options: ['28', ['31', 'No pair XORs to 31.'], ['25', 'That is the maximum value, not the maximum XOR.'], ['27', '25 XOR 3 = 26, 25 XOR 5 = 28.']],
    answer: 0,
    explanation: '5 XOR 25 = 00101 XOR 11001 = 11100 = 28, the maximum pair (LeetCode 421 example). Five bits suffice because every value is below 32.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.tries.q5', type: 'debug', difficulty: 'easy',
    stem: 'After inserting only "apple", `search("app")` returns true. What is the bug?',
    options: ['search does not check the end-of-word flag', ['insert does not create nodes', 'Then search("apple") would also fail.'], ['The alphabet size is wrong', 'Unrelated.'], ['search should start from the last character', 'Tries are walked from the first character.']],
    answer: 0,
    explanation: 'The nodes for a, p, p exist because they are a prefix of "apple"; only the end flag distinguishes stored words from prefixes.',
  }),
  mcq({
    ...base, id: 'dsa.tries.q6', type: 'concept', difficulty: 'medium',
    stem: 'Why does the maximum-XOR trie walk choose the opposite bit greedily from the most significant bit?',
    options: ['A 1 in bit k is worth more than all lower bits combined (2^k > 2^k − 1)', ['Because XOR is commutative', 'True but irrelevant to the greedy choice.'], ['Because numbers are stored in sorted order', 'The trie is ordered by bits, but the argument is about bit weights.'], ['Because the lower bits are always zero', 'They are not.']],
    answer: 0,
    explanation: 'Getting a 1 at the highest possible position dominates every choice below it, so a locally best choice at each level is globally best.',
  }),
  mcq({
    ...base, id: 'dsa.tries.q7', type: 'edge-case', difficulty: 'medium',
    stem: 'In Word Search II the word "oa" can be formed along two different paths in the grid. How do you avoid returning it twice?',
    options: ['Clear the word stored at its trie end node after the first report', ['Sort the output and remove duplicates', 'It works, but it hides the issue and wastes work.'], ['Mark grid cells permanently visited', 'Other words may need those cells.'], ['Search each word separately', 'Much slower.']],
    answer: 0,
    explanation: 'Setting the end node\'s word to empty after reporting stops later paths from reporting it again; pruning empty branches speeds up the search further.',
  }),
  mcq({
    ...base, id: 'dsa.tries.q8', type: 'complexity', difficulty: 'hard',
    stem: 'A trie with 26-pointer arrays stores 10⁶ nodes on a 64-bit machine. Roughly how much memory do the child arrays take?',
    options: ['About 200 MB', ['About 26 MB', 'Each pointer is 8 bytes: 26 × 8 = 208 bytes per node.'], ['About 2 GB', 'That would be ten times more nodes.'], ['About 1 MB', 'Far too small.']],
    answer: 0,
    explanation: '10⁶ × 26 × 8 bytes ≈ 208 MB. That is why large tries use map children, compressed paths, or int indices into a node pool.',
  }),
];
