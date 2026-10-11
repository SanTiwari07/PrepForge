import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';

const T = 'dsa.math';

export const topic: Topic = {
  id: T,
  moduleId: 'dsa',
  title: 'Math for Interviews',
  summary: 'GCD, primes, modular arithmetic, fast power and overflow.',
  level: 'foundation',
  status: 'complete',
  estMinutes: 75,
  prerequisites: ['dsa.complexity'],
  related: ['dsa.bit-manipulation', 'dsa.recursion', 'dsa.dp-1d', 'dsa.implementation'],
  subtopics: ['GCD and LCM (Euclid)', 'Sieve of Eratosthenes', 'Modular arithmetic and 10⁹ + 7', 'Fast modular power', 'Modular inverse (Fermat)', 'Combinatorics nCr', 'Integer overflow and digit manipulation'],
  objectives: [
    "Compute gcd with Euclid's algorithm in O(log min(a, b)) and lcm without overflow.",
    'Generate primes up to n with the sieve of Eratosthenes in O(n log log n), and test a single number in O(√n).',
    'Apply modular arithmetic rules (add, subtract, multiply) and fast modular exponentiation for answers "modulo 10⁹ + 7".',
    'Compute nCr mod p with precomputed factorials and modular inverses via Fermat\'s little theorem.',
    'Detect and avoid integer overflow in sums, products, abs(INT_MIN) and digit reversal.',
  ],
  sections: [
    {
      id: 'concept',
      kind: 'concept',
      title: 'The toolkit',
      bodyMd: `**GCD (Euclid):** gcd(a, b) = gcd(b, a mod b), gcd(a, 0) = a. It takes O(log min(a, b)) steps. **lcm(a, b) = a / gcd(a, b) · b**: divide first to avoid overflow.

**Primes:**
- Test one number: try divisors up to √n (a composite n has a factor ≤ √n). O(√n).
- All primes ≤ n: **sieve of Eratosthenes**. For each prime p, mark multiples from p² (smaller multiples were marked by smaller primes). O(n log log n) time, O(n) space.

**Modular arithmetic** (results "modulo 10⁹ + 7", a prime that fits in 32 bits with room to add two values):
- (a + b) mod m = ((a mod m) + (b mod m)) mod m
- (a · b) mod m = ((a mod m) · (b mod m)) mod m: the product of two values below 10⁹ + 7 needs **64 bits**.
- (a − b) mod m = ((a − b) mod m + m) mod m: in C++ and Java, % of a negative number is negative.
- Division is not direct: multiply by the **modular inverse**. For a prime m, a⁻¹ ≡ a^(m−2) (mod m) by Fermat's little theorem.

**Fast power:** a^e mod m by squaring in O(log e).

**Combinatorics:** nCr = n! / (r!(n−r)!). Precompute factorials and inverse factorials mod p once in O(n), then each nCr is O(1). For small n without a modulus, Pascal's triangle (C[n][r] = C[n−1][r−1] + C[n−1][r]) avoids division.`,
    },
    {
      id: 'intuition',
      kind: 'intuition',
      title: 'Overflow and number tricks',
      bodyMd: `| Value | Fits in |
|---|---|
| 2³¹ − 1 ≈ 2.1 · 10⁹ | int (32-bit signed) max |
| 9.2 · 10¹⁸ | long long / long (64-bit) max |
| (10⁹ + 7)² ≈ 10¹⁸ | 64-bit, barely |
| 10⁵ · 10⁵ = 10¹⁰ | needs 64-bit |
| 20! ≈ 2.4 · 10¹⁸ | 64-bit; 21! does not fit |

**Common overflow points:** \`a * b\` of two ints (cast first: \`1LL * a * b\`); \`(lo + hi) / 2\` in binary search (use \`lo + (hi − lo) / 2\`); \`abs(INT_MIN)\` and \`-INT_MIN\`; reversing digits (Reverse Integer must check before multiplying by 10).

**Digit manipulation:** last digit \`n % 10\`, drop it with \`n / 10\`; the number of digits is ⌊log₁₀ n⌋ + 1. Palindrome Number without strings: reverse half of the digits and compare.

**Counting tricks:**
- Trailing zeros of n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + … (count factors of 5; factors of 2 are plentiful).
- Sum 1..n = n(n + 1)/2; missing number = expected sum − actual sum (or XOR).
- Number of divisors of n: pair d with n/d up to √n.

**Floating point:** never compare doubles with ==; and prefer integer arithmetic (e.g. compare slopes as cross-multiplied integers, or reduce (dx, dy) by their gcd in Max Points on a Line).`,
    },
    {
      id: 'dry-run',
      kind: 'dry-run',
      title: 'Dry run: gcd(84, 36) and the sieve up to 30',
      bodyMd: 'Euclid first, then the sieve. The array shows the primes found so far.',
      trace: [
        { note: 'gcd(84, 36) → gcd(36, 84 mod 36 = 12) → gcd(12, 0) = 12. lcm = 84 / 12 · 36 = 252.', array: [84, 36, 12, 0], vars: { gcd: 12, lcm: 252 } },
        { note: 'Sieve: p = 2 marks 4, 6, 8, …, 30.', array: [2], vars: { p: 2 } },
        { note: 'p = 3 starts at 9: marks 9, 15, 21, 27 (12, 18, 24, 30 were already marked).', array: [2, 3], vars: { p: 3 } },
        { note: 'p = 5 starts at 25: marks 25 (and 30, already marked). p = 7: 49 > 30, stop.', array: [2, 3, 5], vars: { p: 5 } },
        { note: 'Unmarked numbers are prime: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29.', array: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29], vars: { count: 10 } },
      ],
    },
    {
      id: 'code',
      kind: 'code',
      title: 'Templates',
      bodyMd: 'GCD/LCM, the sieve, modular power, nCr with inverse factorials, and Reverse Integer with overflow checks.',
      code: [
        cpp(`
long long gcdLL(long long a, long long b) { while (b) { long long t = a % b; a = b; b = t; } return a; }
long long lcmLL(long long a, long long b) { return a / gcdLL(a, b) * b; }

vector<int> primesUpTo(int n) {
    vector<bool> composite(n + 1, false);
    vector<int> primes;
    for (int p = 2; p <= n; ++p) {
        if (composite[p]) continue;
        primes.push_back(p);
        for (long long m = 1LL * p * p; m <= n; m += p) composite[m] = true;
    }
    return primes;
}

const long long MOD = 1000000007LL;
long long power(long long a, long long e, long long m = MOD) {
    long long r = 1;
    a %= m;
    while (e > 0) { if (e & 1) r = r * a % m; a = a * a % m; e >>= 1; }
    return r;
}

struct Binomial {
    vector<long long> fact, inv;
    Binomial(int n) : fact(n + 1), inv(n + 1) {
        fact[0] = 1;
        for (int i = 1; i <= n; ++i) fact[i] = fact[i - 1] * i % MOD;
        inv[n] = power(fact[n], MOD - 2);                 // Fermat: a^(p-2) is the inverse mod prime p
        for (int i = n; i > 0; --i) inv[i - 1] = inv[i] * i % MOD;
    }
    long long C(int n, int r) const { return r < 0 || r > n ? 0 : fact[n] * inv[r] % MOD * inv[n - r] % MOD; }
};

int reverseInteger(int x) {
    int r = 0;
    while (x != 0) {
        int d = x % 10;                                     // negative for negative x
        x /= 10;
        if (r > INT_MAX / 10 || (r == INT_MAX / 10 && d > 7)) return 0;
        if (r < INT_MIN / 10 || (r == INT_MIN / 10 && d < -8)) return 0;
        r = r * 10 + d;
    }
    return r;
}`, 'C++'),
        java(`
long gcd(long a, long b) { while (b != 0) { long t = a % b; a = b; b = t; } return a; }
long lcm(long a, long b) { return a / gcd(a, b) * b; }

List<Integer> primesUpTo(int n) {
    boolean[] composite = new boolean[n + 1];
    List<Integer> primes = new ArrayList<>();
    for (int p = 2; p <= n; p++) {
        if (composite[p]) continue;
        primes.add(p);
        for (long m = (long) p * p; m <= n; m += p) composite[(int) m] = true;
    }
    return primes;
}

static final long MOD = 1_000_000_007L;
long power(long a, long e) {
    long r = 1;
    a %= MOD;
    while (e > 0) { if ((e & 1) == 1) r = r * a % MOD; a = a * a % MOD; e >>= 1; }
    return r;
}

long[] fact, invFact;
void initBinomial(int n) {
    fact = new long[n + 1]; invFact = new long[n + 1];
    fact[0] = 1;
    for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;
    invFact[n] = power(fact[n], MOD - 2);
    for (int i = n; i > 0; i--) invFact[i - 1] = invFact[i] * i % MOD;
}
long nCr(int n, int r) { return r < 0 || r > n ? 0 : fact[n] * invFact[r] % MOD * invFact[n - r] % MOD; }

int reverseInteger(int x) {
    int r = 0;
    while (x != 0) {
        int d = x % 10;
        x /= 10;
        if (r > Integer.MAX_VALUE / 10 || (r == Integer.MAX_VALUE / 10 && d > 7)) return 0;
        if (r < Integer.MIN_VALUE / 10 || (r == Integer.MIN_VALUE / 10 && d < -8)) return 0;
        r = r * 10 + d;
    }
    return r;
}`, 'Java'),
      ],
    },
    {
      id: 'complexity',
      kind: 'complexity',
      title: 'Complexity',
      bodyMd: `- gcd: O(log min(a, b)).
- Primality by trial division: O(√n). Sieve up to n: O(n log log n) time, O(n) space; 10⁷ is fine in C++ with a bitset-like vector<bool>.
- Modular power: O(log e) multiplications.
- Factorials and inverse factorials up to n: O(n + log MOD); each nCr afterwards O(1).
- Pascal's triangle up to n: O(n²) time and space.
- Counting trailing zeros of n!: O(log₅ n).`,
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      title: 'Common mistakes',
      bodyMd: `1. **Multiplying two ints before casting:** \`(long long)(a * b)\` overflows first; write \`1LL * a * b\` or \`(long) a * b\`.
2. **Negative remainders:** \`-7 % 3 == -1\` in C++ and Java. Normalise with \`((x % m) + m) % m\`.
3. **Dividing under a modulus** directly: (a / b) mod m ≠ (a mod m) / (b mod m). Multiply by the inverse.
4. **Sieve inner loop starting at 2p** (correct but slower) or using \`p * p\` in int when p is near 46 341 (overflow).
5. **lcm(a, b) = a · b / gcd** overflowing; divide first.
6. **Reverse Integer** checking overflow after the multiplication, when it has already happened.
7. **Comparing floating-point slopes** with == in geometry problems; use gcd-reduced integer pairs.`,
    },
  ],
  recognition: {
    signals: ['"Return the answer modulo 10⁹ + 7"', 'Primes, divisors, gcd/lcm, digits', 'Huge exponents (aⁿ with n up to 10⁹ or 10¹⁸)', 'Counting arrangements: nCr, factorials', 'Overflow-prone arithmetic in constraints near 10⁹'],
    antiSignals: ['Counting with choices that depend on earlier choices: DP (often still mod 10⁹ + 7)', 'Exact large integers: big-integer libraries or string arithmetic (Multiply Strings)'],
    decisionQuestions: ['What is the largest intermediate value, and which type holds it?', 'Is the modulus prime (so Fermat inverses work)?', 'Can I precompute something once (sieve, factorials)?'],
  },
  mcqIds: [],
  interviewQuestions: [
    { id: 'iq1', q: "Explain Euclid's algorithm and its complexity.", answerMd: 'gcd(a, b) = gcd(b, a mod b), ending at gcd(g, 0) = g. Any common divisor of a and b divides a mod b, and vice versa, so the gcd is preserved. Every two steps the larger argument at least halves, so it takes O(log min(a, b)) steps.' },
    { id: 'iq2', q: 'Count the primes below n = 5·10⁶.', answerMd: 'Sieve of Eratosthenes: an array of n booleans; for each p from 2 while p² < n, if p is unmarked, mark p², p² + p, … as composite. Count unmarked entries ≥ 2. O(n log log n) time, O(n) memory (5 MB as bytes).' },
    { id: 'iq3', q: 'Why is 10⁹ + 7 the usual modulus?', answerMd: 'It is prime (so every non-zero value has an inverse via Fermat), it fits in a 32-bit int, the sum of two residues fits in a 32-bit int, and the product of two residues (< 1.0000001 · 10¹⁸) fits in a signed 64-bit integer.' },
    { id: 'iq4', q: 'How do you compute nCr mod 10⁹ + 7 for many queries with n ≤ 10⁶?', answerMd: 'Precompute fact[i] = i! mod p and invFact[i] = (i!)⁻¹ mod p: invFact[n] = fact[n]^(p−2) by fast power, then invFact[i−1] = invFact[i] · i. Each query is fact[n] · invFact[r] · invFact[n−r] mod p, O(1).' },
    { id: 'iq5', q: 'Reverse a 32-bit integer and return 0 on overflow, without using 64-bit types.', answerMd: 'Pop digits with x % 10 and x /= 10. Before r = r·10 + d, check r > INT_MAX/10 (or equal with d > 7) and r < INT_MIN/10 (or equal with d < −8); return 0 in those cases. The checks happen before the operation that could overflow.' },
    { id: 'iq6', q: 'How many trailing zeros does 100! have?', answerMd: 'Each trailing zero needs a factor 10 = 2 · 5, and factors of 5 are the bottleneck: ⌊100/5⌋ + ⌊100/25⌋ = 20 + 4 = 24.' },
  ],
  problemIds: [],
  revision: {
    notesMd: `- gcd(a, b) = gcd(b, a % b); lcm = a / gcd · b.
- Sieve: mark from p², O(n log log n). Single test: divisors up to √n.
- Mod rules: add/mul freely (64-bit for products); normalise negatives; divide via inverse a^(p−2).
- Fast power O(log e). nCr with fact + invFact, O(1) per query.
- Overflow: 1LL * a * b; lo + (hi − lo)/2; abs(INT_MIN); check before r*10.
- Trailing zeros of n!: Σ ⌊n/5^k⌋.`,
    flashcards: [
      { id: 'f1', front: 'Modular inverse of a mod a prime p?', backMd: 'a^(p−2) mod p (Fermat), computed by fast power.' },
      { id: 'f2', front: 'Why start the sieve inner loop at p²?', backMd: 'Smaller multiples k·p with k < p were already marked by the prime factors of k.' },
      { id: 'f3', front: 'What is -7 % 3 in C++/Java?', backMd: '−1. Normalise with ((x % m) + m) % m.' },
      { id: 'f4', front: 'Overflow-safe lcm?', backMd: 'a / gcd(a, b) * b.' },
      { id: 'f5', front: 'Trailing zeros of 100!?', backMd: '24 (20 + 4 factors of 5).' },
    ],
  },
  mastery: { testSize: 7, testMinutes: 10, passPct: 80, minIndependentSolves: 3, minMediumIndependent: 1, retentionDays: 7 },
  resources: [
    { title: 'Euclidean algorithm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Euclidean_algorithm', kind: 'article' },
    { title: 'Sieve of Eratosthenes (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes', kind: 'article' },
    { title: 'Modular multiplicative inverse (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Modular_multiplicative_inverse', kind: 'article' },
  ],
};

const base = { topics: [T], module: 'dsa' as const };

export const mcqs: MCQ[] = [
  mcq({
    ...base, id: 'dsa.math.q1', type: 'code-output', difficulty: 'easy',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
using namespace std;
long long g(long long a, long long b) { return b == 0 ? a : g(b, a % b); }
int main() {
    cout << g(84, 36) << " " << 84 / g(84, 36) * 36 << " " << g(17, 5) << endl;
    return 0;
}`, 'C++', '12 252 1'),
    options: ['12 252 1', ['6 504 1', 'gcd(84, 36) is 12 (84 = 12·7, 36 = 12·3).'], ['12 3024 1', 'That is 84 · 36; lcm divides by the gcd.'], ['12 252 17', '17 and 5 are coprime.']],
    answer: 0,
    explanation: 'gcd(84, 36) = gcd(36, 12) = gcd(12, 0) = 12; lcm = 84 / 12 · 36 = 252; 17 and 5 share no factor.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.math.q2', type: 'code-output', difficulty: 'medium',
    stem: 'What does this Java program print?',
    code: java(`public class Main {
    public static void main(String[] args) {
        int a = 100000, b = 100000;
        long wrong = a * b;
        long right = (long) a * b;
        System.out.println(wrong + " " + right + " " + (-7 % 3) + " " + Math.floorMod(-7, 3));
    }
}`, 'Java', '1410065408 10000000000 -1 2'),
    options: ['1410065408 10000000000 -1 2', ['10000000000 10000000000 -1 2', 'a * b is computed in int and overflows before widening.'], ['1410065408 10000000000 2 2', '% keeps the sign of the dividend in Java.'], ['1410065408 10000000000 -1 -1', 'Math.floorMod returns a result with the sign of the divisor.']],
    answer: 0,
    explanation: '10¹⁰ mod 2³² = 1 410 065 408, which is positive and fits in int, so that is the wrapped value. -7 % 3 = −1; floorMod gives 2.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.math.q3', type: 'complexity', difficulty: 'easy',
    stem: 'What is the time complexity of the sieve of Eratosthenes up to n?',
    options: ['O(n log log n)', ['O(n √n)', 'That is trial division for every number.'], ['O(n²)', 'Far too pessimistic.'], ['O(n log n)', 'Close, but the harmonic sum over primes gives log log n.']],
    answer: 0,
    explanation: 'Marking costs n/2 + n/3 + n/5 + … over primes, and the sum of 1/p over primes up to n grows like log log n.',
  }),
  mcq({
    ...base, id: 'dsa.math.q4', type: 'concept', difficulty: 'medium',
    stem: 'You need (a / b) mod p for a prime p and b not divisible by p. What is correct?',
    options: ['a · b^(p−2) mod p', ['(a mod p) / (b mod p)', 'Integer division does not respect the modulus.'], ['(a / b) computed exactly, then mod p', 'a and b may be huge or already reduced.'], ['a · (p − b) mod p', 'That is unrelated to the inverse.']],
    answer: 0,
    explanation: 'By Fermat, b^(p−1) ≡ 1, so b^(p−2) is the inverse of b mod p. Multiply instead of dividing.',
  }),
  mcq({
    ...base, id: 'dsa.math.q5', type: 'code-output', difficulty: 'medium',
    stem: 'What does this program print?',
    code: cpp(`#include <iostream>
using namespace std;
const long long MOD = 1000000007LL;
long long power(long long a, long long e) {
    long long r = 1; a %= MOD;
    while (e) { if (e & 1) r = r * a % MOD; a = a * a % MOD; e >>= 1; }
    return r;
}
int main() {
    cout << power(2, 10) << " " << power(3, MOD - 1) << " " << power(2, MOD - 2) * 2 % MOD << endl;
    return 0;
}`, 'C++', '1024 1 1'),
    options: ['1024 1 1', ['1024 3 1', "Fermat's little theorem: 3^(p−1) ≡ 1 (mod p)."], ['1024 1 2', 'power(2, p − 2) is the inverse of 2, and 2 · 2⁻¹ ≡ 1.'], ['1023 1 1', '2¹⁰ = 1024.']],
    answer: 0,
    explanation: '2¹⁰ = 1024; a^(p−1) ≡ 1 for a not divisible by the prime p; 2^(p−2) is 2⁻¹, so multiplying by 2 gives 1.',
    verified: 'compiled',
  }),
  mcq({
    ...base, id: 'dsa.math.q6', type: 'edge-case', difficulty: 'medium',
    stem: 'Reverse Integer (32-bit, return 0 on overflow): which input must return 0?',
    options: ['1534236469', ['-123', 'It reverses to −321.'], ['120', 'It reverses to 21.'], ['0', 'It reverses to 0, which is also correct but not because of overflow.']],
    answer: 0,
    explanation: 'Reversed, 1534236469 becomes 9646324351, which exceeds 2³¹ − 1 = 2147483647.',
  }),
  mcq({
    ...base, id: 'dsa.math.q7', type: 'concept', difficulty: 'easy',
    stem: 'How many trailing zeros does 25! have?',
    options: ['6', ['5', '25 contributes two factors of 5.'], ['2', 'Count every multiple of 5.'], ['10', 'Only factors of 5 limit the zeros.']],
    answer: 0,
    explanation: '⌊25/5⌋ + ⌊25/25⌋ = 5 + 1 = 6.',
  }),
  mcq({
    ...base, id: 'dsa.math.q8', type: 'debug', difficulty: 'hard',
    stem: 'A sieve for n = 10⁷ uses `for (int m = p * p; m <= n; m += p)` with `int p`. Why can this misbehave for some p, and what fixes it?',
    options: ['p * p overflows int once p ≥ 46 341; compute it in 64 bits (or loop only while p ≤ n / p)', ['m += p can skip multiples', 'Adding p visits every multiple.'], ['The inner loop should start at 2p', 'Starting at p² is correct and faster.'], ['vector<bool> cannot hold 10⁷ entries', 'It can (about 1.25 MB).']],
    answer: 0,
    explanation: 'For n = 10⁷ the outer loop reaches primes above 46 341, whose square exceeds 2³¹ − 1. The overflowed (negative or small) start index then marks wrong cells. Use long long for m, or skip the inner loop when p > n / p.',
  }),
];
