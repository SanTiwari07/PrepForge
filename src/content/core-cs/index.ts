import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';
import * as more from './more';

const MASTERY = { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
const cTopic = (t: TopicInput): Topic => ({ moduleId: 'core-cs', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
const q = (topic: string) => ({ topics: [topic], module: 'core-cs' as const });

// ---------------------------------------------------------------------------------------
const DR = 'core.data-representation';
const dataRep = cTopic({
  id: DR, title: 'Data Representation', level: 'foundation', estMinutes: 45, prerequisites: [],
  summary: "Two's complement, floating point, endianness and encodings.",
  objectives: ['Convert between decimal, binary and hex; compute two\'s complement.', 'Predict overflow behaviour in C++ (unsigned wraps, signed overflow is UB) and Java (wraps).', 'Explain why 0.1 + 0.2 != 0.3 and how to compare floats.', 'Explain endianness and UTF-8 at interview depth.'],
  sections: [
    { id: 'ints', kind: 'concept', title: 'Integers and two\'s complement', bodyMd: `To negate in **two's complement**: invert all bits and add 1. In 8 bits, 5 = \`00000101\`, so −5 = \`11111010\` + 1 = **\`11111011\`** (0xFB).

An n-bit signed range is **−2ⁿ⁻¹ … 2ⁿ⁻¹ − 1** (8-bit: −128…127; 32-bit: −2,147,483,648…2,147,483,647).

**Overflow:**
- C++ **unsigned** arithmetic wraps modulo 2ⁿ (well defined): \`0u - 1\` = 4294967295 for 32-bit unsigned.
- C++ **signed** overflow is **undefined behaviour**: the compiler may assume it never happens. Use wider types (\`long long\`) or check before adding.
- Java \`int\` overflow is defined and wraps: \`Integer.MAX_VALUE + 1\` = −2147483648.

Integer division truncates toward zero in both languages: \`-7 / 2\` = −3 and \`-7 % 2\` = −1.` },
    { id: 'floats', kind: 'concept', title: 'Floating point', bodyMd: `IEEE 754 doubles store sign, exponent and a 52-bit fraction. Most decimal fractions (0.1, 0.2) have **no exact binary representation**, so \`0.1 + 0.2\` is 0.30000000000000004.

- Never compare floats with \`==\` after arithmetic; use a tolerance: \`fabs(a - b) < 1e-9\` (or a relative tolerance).
- **Never store money in floating point**; use integer cents or a decimal type (\`BigDecimal\` in Java).
- Doubles represent integers exactly up to 2⁵³.` },
    { id: 'code', kind: 'code', title: 'See it run', bodyMd: 'These outputs were produced by compiling and running the code (g++ and the JDK):', code: [cpp(`#include <bitset>
#include <iostream>
using namespace std;
int main() {
    unsigned int u = 0;
    u = u - 1;                                   // unsigned wraps: well defined
    cout << u << "\\n";                          // 4294967295
    cout << bitset<8>(-5) << "\\n";              // 11111011 (two's complement pattern)
    cout << (0.1 + 0.2 == 0.3) << "\\n";         // 0
    cout << -7 / 2 << " " << -7 % 2 << "\\n";    // -3 -1
    return 0;
}`, 'C++', '4294967295\n11111011\n0\n-3 -1')] },
    { id: 'endian', kind: 'concept', title: 'Endianness and text encodings', bodyMd: `- **Little-endian** (x86, most ARM configurations) stores the least significant byte first; **big-endian** stores the most significant byte first. Network protocols use big-endian ("network byte order"), hence \`htonl\`/\`ntohl\`. 0x12345678 in little-endian memory is \`78 56 34 12\`.
- **ASCII** is 7-bit. **UTF-8** encodes Unicode in 1–4 bytes, is backward compatible with ASCII, and is the web default. String "length" in characters is not the byte count (\`"é"\` is 2 bytes in UTF-8).` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. \`int mid = (lo + hi) / 2\` overflowing for large indices (use \`lo + (hi - lo) / 2\`).
2. Multiplying two ints into a long long without casting first (\`(long long)a * b\`).
3. Comparing doubles with \`==\`.
4. Using \`size_t\` in a loop counting down (\`for (size_t i = n - 1; i >= 0; i--)\` never ends).
5. Treating C++ signed overflow as "wraps like Java".` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How are negative integers represented?', answerMd: 'In two\'s complement: invert the bits of the positive value and add one. It gives a single zero, makes addition and subtraction use the same hardware, and the range is −2ⁿ⁻¹ to 2ⁿ⁻¹ − 1.' },
    { id: 'iq2', q: 'Why is 0.1 + 0.2 not equal to 0.3?', answerMd: 'Binary floating point cannot represent 0.1 or 0.2 exactly, so the stored values are tiny approximations whose sum rounds to 0.30000000000000004. Compare with a tolerance, and use integers or decimal types for money.' },
    { id: 'iq3', q: 'What happens on integer overflow in C++ vs Java?', answerMd: 'Unsigned integers in C++ wrap modulo 2ⁿ. Signed overflow in C++ is undefined behaviour, so the optimiser may produce surprising code. Java defines int and long overflow to wrap in two\'s complement.' },
    { id: 'iq4', q: 'What is endianness and where does it matter?', answerMd: 'The byte order of multi-byte values in memory. It matters when serialising binary data, in network protocols (big-endian byte order) and when reading binary file formats across machines.' },
  ],
  revision: { notesMd: `- −x = ~x + 1. 8-bit −5 = 11111011.
- int range ≈ ±2.1 × 10⁹; long long ≈ ±9.2 × 10¹⁸.
- C++ unsigned wraps; signed overflow is UB. Java wraps.
- Division truncates toward 0: −7/2 = −3, −7%2 = −1.
- Floats: tolerance compare; no money in doubles.
- Little-endian stores the low byte first; network order is big-endian.`, flashcards: [
    { id: 'f1', front: '8-bit two\'s complement of −1?', backMd: '11111111.' },
    { id: 'f2', front: 'Java: Integer.MAX_VALUE + 1?', backMd: '−2147483648 (wraps).' },
    { id: 'f3', front: 'C++ signed overflow?', backMd: 'Undefined behaviour.' },
    { id: 'f4', front: 'Overflow-safe midpoint?', backMd: '`lo + (hi - lo) / 2`.' },
    { id: 'f5', front: 'Network byte order?', backMd: 'Big-endian.' },
  ] },
  resources: [{ title: 'The Floating-Point Guide', url: 'https://floating-point-gui.de/', kind: 'article' }, { title: 'cppreference: Arithmetic operators (overflow and division rules)', url: 'https://en.cppreference.com/w/cpp/language/operator_arithmetic', kind: 'official-docs' }],
});

const drMcqs: MCQ[] = [
  mcq({ ...q(DR), id: 'core.dr.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this Java program print?', code: java(`public class Main {
    public static void main(String[] args) {
        System.out.println(Integer.MAX_VALUE + 1);
        System.out.println((byte) 200);
        System.out.println(-7 / 2 + " " + (-7 % 2));
    }
}`, 'Java', '-2147483648\n-56\n-3 -1'), options: ['-2147483648 / -56 / -3 -1', ['2147483648 / 200 / -4 1', 'Java int wraps, byte is signed, and division truncates toward zero.'], ['An ArithmeticException', 'Integer overflow does not throw in Java.'], ['-2147483648 / 200 / -3 -1', '(byte)200 keeps the low 8 bits, interpreted as signed: 200 − 256 = −56.']], answer: 0, explanation: 'Java defines wrapping overflow, byte is a signed 8-bit type, and integer division truncates toward zero.', verified: 'compiled' }),
  mcq({ ...q(DR), id: 'core.dr.q2', type: 'code-output', difficulty: 'easy', stem: 'What does this C++ program print?', code: cpp(`#include <iostream>
using namespace std;
int main() {
    double a = 0.1 + 0.2;
    cout << (a == 0.3) << " " << (a - 0.3 < 1e-9) << "\\n";
    return 0;
}`, 'C++', '0 1'), options: ['0 1', ['1 1', '0.1 + 0.2 is not exactly 0.3.'], ['1 0', 'Reversed.'], ['0 0', 'The difference is about 5.5e-17, below the tolerance.']], answer: 0, explanation: 'Exact comparison fails; a tolerance comparison succeeds.', verified: 'compiled' }),
  mcq({ ...q(DR), id: 'core.dr.q3', type: 'concept', difficulty: 'easy', stem: 'What is the 8-bit two\'s complement representation of −5?', options: ['11111011', ['10000101', 'That is sign-magnitude.'], ['11111010', 'That is one\'s complement (forgot +1).'], ['00000101', 'That is +5.']], answer: 0, explanation: 'Invert 00000101 to get 11111010, then add 1.' }),
  mcq({ ...q(DR), id: 'core.dr.q4', type: 'code-output', difficulty: 'medium', stem: 'What does this C++ program print?', code: cpp(`#include <iostream>
using namespace std;
int main() {
    unsigned int u = 3;
    int count = 0;
    while (u - 5 > 0 && count < 3) count++;
    cout << count << "\\n";
    return 0;
}`, 'C++', '3'), options: ['3', ['0', '`u - 5` is unsigned and wraps to a huge positive number, so the condition is true.'], ['Infinite loop', 'The `count < 3` check stops it.'], ['Compile error', 'It compiles.']], answer: 0, explanation: 'Unsigned arithmetic never goes negative: 3u − 5 wraps to 4294967294, which is > 0.', verified: 'compiled' }),
  mcq({ ...q(DR), id: 'core.dr.q5', type: 'concept', difficulty: 'medium', stem: 'In C++, `int a = 50000, b = 50000; long long p = a * b;` gives a wrong result. Why, and what is the fix?', options: ['`a * b` is computed in int and overflows (UB) before conversion; write `(long long)a * b`', ['long long cannot hold 2.5 × 10⁹', 'It can (up to ~9.2 × 10¹⁸).'], ['The compiler rounds the result', 'No rounding is involved.'], ['You must use double', 'Not needed.']], answer: 0, explanation: 'The multiplication type is decided by the operands, not the destination.' }),
  mcq({ ...q(DR), id: 'core.dr.q6', type: 'concept', difficulty: 'easy', stem: 'How should a payments service store monetary amounts?', options: ['As integers in the smallest unit (paise or cents) or a decimal type', ['As double', 'Rounding errors accumulate.'], ['As float for speed', 'Even less precise.'], ['As strings and parse each time', 'Awkward and error-prone for arithmetic.']], answer: 0, explanation: 'Binary floating point cannot represent most decimal amounts exactly.' }),
];

// ---------------------------------------------------------------------------------------
const PE = 'core.program-execution';
const progExec = cTopic({
  id: PE, title: 'How Programs Run', level: 'foundation', estMinutes: 40, prerequisites: [],
  summary: 'Compilation vs interpretation, linking, loading and memory layout.',
  objectives: ['Describe the C++ build pipeline (preprocess, compile, assemble, link).', 'Compare compiled, interpreted and JIT-compiled execution (C++, Python, Java).', 'Sketch a process\'s memory layout and say where variables live.', 'Distinguish static and dynamic linking and common linker errors.'],
  sections: [
    { id: 'pipeline', kind: 'concept', title: 'From source to running process', bodyMd: `**C++:** preprocessor (expands \`#include\`, macros) → compiler (to assembly) → assembler (object files \`.o\`) → **linker** (resolves symbols across object files and libraries into an executable) → **loader** (the OS maps it into memory and starts it).

- "undefined reference to …" is a **linker** error: something is declared but its definition was not compiled or linked.
- **Static linking** copies library code into the executable (bigger, self-contained). **Dynamic linking** loads shared libraries (.so/.dll) at run time (smaller, shared, can be updated separately).

**Java:** \`javac\` compiles to **bytecode**; the **JVM** interprets it and **JIT-compiles** hot methods to native code at run time. **Python** (CPython) compiles to bytecode and interprets it.` },
    { id: 'layout', kind: 'visual', title: 'Process memory layout', bodyMd: `From low to high addresses (typical):

| Segment | Contains |
|---|---|
| Text | machine code (read-only) |
| Data | initialised globals and statics |
| BSS | zero-initialised globals and statics |
| Heap ↑ | \`new\`/\`malloc\` allocations; grows upward |
| … | free space, memory-mapped regions (shared libraries) |
| Stack ↓ | function frames: locals, arguments, return addresses; grows downward |

Each thread has its own stack (typically a few MB). Deep recursion overflows it: **stack overflow**. In Java, objects live on the heap and are garbage-collected; local primitives and references live in stack frames.` },
    { id: 'code', kind: 'code', title: 'Where does each variable live?', bodyMd: 'Annotated example:', code: [cpp(`#include <iostream>
int counter = 5;          // data segment (initialised global)
int table[1000];          // BSS (zero-initialised global)
int main() {
    int local = 42;                   // stack
    static int calls = 0;             // data/BSS: one copy for the program's lifetime
    int* p = new int[10];             // p on the stack; the 10 ints on the heap
    ++calls;
    std::cout << counter + local + table[0] + calls << "\\n";
    delete[] p;                       // heap memory must be freed (or use std::vector)
    return 0;
}`, 'C++', '48')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Calling "undefined reference" a compile error (it is the linker).
2. Saying Java is purely interpreted (hot code is JIT-compiled).
3. Returning a pointer or reference to a local variable (its stack frame is gone).
4. Allocating huge arrays as locals (stack overflow); make them global, static or heap-allocated.
5. Thinking \`static\` locals are re-initialised on each call.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What happens when you compile and run a C++ program?', answerMd: 'Preprocessing expands includes and macros; the compiler translates each translation unit to assembly and object code; the linker combines object files and libraries, resolving symbols into an executable; at run time the loader maps it into a process (text, data, BSS, heap, stack) and jumps to the entry point, which calls main.' },
    { id: 'iq2', q: 'Stack vs heap?', answerMd: 'The stack holds function frames with automatic lifetime: very fast allocation, limited size, freed on return. The heap holds dynamically allocated memory with manual (C++) or GC-managed (Java) lifetime: flexible size, slower allocation, risk of leaks and fragmentation.' },
    { id: 'iq3', q: 'Compiled vs interpreted vs JIT?', answerMd: 'Ahead-of-time compiled languages (C++) produce native code before running. Interpreters execute source or bytecode directly (CPython). JIT compilers (the JVM) start by interpreting bytecode, then compile hot paths to optimised native code using runtime information.' },
    { id: 'iq4', q: 'Static vs dynamic linking?', answerMd: 'Static linking embeds library code into the binary: bigger, no runtime dependency issues. Dynamic linking references shared libraries loaded at run time: smaller binaries, shared memory across processes, and libraries can be patched independently, but missing or mismatched versions can break programs.' },
  ],
  revision: { notesMd: `- Preprocess → compile → assemble → link → load.
- "undefined reference" = linker error.
- Layout: text, data, BSS, heap ↑, stack ↓.
- Java: bytecode + JVM interpreter + JIT.
- Static linking: self-contained. Dynamic: shared .so/.dll.`, flashcards: [
    { id: 'f1', front: 'Where do initialised globals live?', backMd: 'The data segment.' },
    { id: 'f2', front: 'Where do zero-initialised globals live?', backMd: 'BSS.' },
    { id: 'f3', front: '"undefined reference to f()" comes from?', backMd: 'The linker.' },
    { id: 'f4', front: 'What does the JIT do?', backMd: 'Compiles hot bytecode to native code at run time.' },
    { id: 'f5', front: 'Danger of returning a reference to a local?', backMd: 'Dangling reference: the frame is gone (UB).' },
  ] },
  resources: [{ title: 'cppreference: Phases of translation', url: 'https://en.cppreference.com/w/cpp/language/translation_phases', kind: 'official-docs' }, { title: 'Computer Systems: A Programmer\'s Perspective (book site)', url: 'https://csapp.cs.cmu.edu/', kind: 'book' }],
});

const peMcqs: MCQ[] = [
  mcq({ ...q(PE), id: 'core.pe.q1', type: 'concept', difficulty: 'easy', stem: 'You declared `void helper();` and called it, but never defined it. Building fails with "undefined reference to helper()". Which stage reports this?', options: ['The linker', ['The preprocessor', 'It only expands includes and macros.'], ['The compiler', 'The declaration satisfies the compiler.'], ['The loader at run time', 'The build fails before that.']], answer: 0, explanation: 'Each file compiles; resolving the missing definition fails at link time.' }),
  mcq({ ...q(PE), id: 'core.pe.q2', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
int next() {
    static int n = 0;
    return ++n;
}
int main() {
    next(); next();
    cout << next() << "\\n";
    return 0;
}`, 'C++', '3'), options: ['3', ['1', 'A static local is initialised once and keeps its value.'], ['0', 'Pre-increment returns the new value.'], ['Compile error', 'It compiles.']], answer: 0, explanation: 'The static local persists across calls: 1, 2, 3.', verified: 'compiled' }),
  mcq({ ...q(PE), id: 'core.pe.q3', type: 'concept', difficulty: 'medium', stem: 'A recursive DFS on a path-shaped graph with 10⁶ nodes crashes in C++, though the same code works for 10³ nodes. Most likely cause?', options: ['Stack overflow from recursion depth', ['Heap exhaustion', 'Recursion frames use the stack.'], ['Integer overflow', 'Not indicated.'], ['A linker error', 'It compiled and ran.']], answer: 0, explanation: 'Each call uses a stack frame; convert to an explicit stack (iterative DFS).' }),
  mcq({ ...q(PE), id: 'core.pe.q4', type: 'concept', difficulty: 'easy', stem: 'Where is memory from `new int[100]` allocated?', options: ['The heap', ['The stack', 'Only the pointer variable is on the stack.'], ['The text segment', 'That holds code.'], ['BSS', 'That holds zero-initialised globals.']], answer: 0, explanation: 'It persists until delete[] (or use std::vector).' }),
  mcq({ ...q(PE), id: 'core.pe.q5', type: 'concept', difficulty: 'medium', stem: 'How does the JVM typically run Java code?', options: ['It interprets bytecode and JIT-compiles frequently executed methods to native code', ['It interprets Java source directly', 'javac compiles to bytecode first.'], ['It only executes ahead-of-time compiled native code', 'Not the default model.'], ['It translates Java to C++', 'No.']], answer: 0, explanation: 'Hot spots get optimised native code using runtime profiling.' }),
  mcq({ ...q(PE), id: 'core.pe.q6', type: 'concept', difficulty: 'medium', stem: 'What is a key advantage of dynamic linking?', options: ['Shared libraries can be updated (e.g. security fixes) without relinking every program, and are shared in memory', ['Programs never fail to start', 'Missing libraries make them fail.'], ['Binaries contain all library code', 'That is static linking.'], ['It removes the linker', 'Linking still happens (partly at load time).']], answer: 0, explanation: 'The trade-off is runtime dependency management.' }),
];

// ---------------------------------------------------------------------------------------
const SF = 'core.security-fundamentals';
const security = cTopic({
  id: SF, title: 'Security Fundamentals', level: 'core', estMinutes: 50, prerequisites: [],
  summary: 'Hashing vs encryption, PKI, OWASP basics and zero trust.',
  objectives: ['Distinguish encoding, hashing, encryption and signing.', 'Store passwords correctly (salted, slow hashes).', 'Prevent SQL injection, XSS and CSRF.', 'Apply least privilege and secret management.'],
  sections: [
    { id: 'primitives', kind: 'comparison', title: 'Encoding vs hashing vs encryption vs signing', bodyMd: `| | Reversible? | Key? | Purpose | Example |
|---|---|---|---|---|
| Encoding | yes, by anyone | no | data format | Base64, URL encoding |
| Hashing | no (one-way) | no | integrity, fingerprints | SHA-256 |
| Symmetric encryption | yes, with the key | one shared key | confidentiality | AES-GCM |
| Asymmetric encryption | yes, with the private key | public/private pair | key exchange, small secrets | RSA, ECDH |
| Digital signature | verify with the public key | private key signs | authenticity + integrity | ECDSA, Ed25519 |

Base64 is **not** encryption.` },
    { id: 'passwords', kind: 'concept', title: 'Storing passwords', bodyMd: `Never store passwords in plain text or with fast hashes (MD5, SHA-1, plain SHA-256). Use a **slow, salted password hash**: **Argon2id**, **scrypt** or **bcrypt**.

- A unique random **salt** per user means identical passwords have different hashes and precomputed (rainbow) tables are useless.
- A **work factor** makes each guess expensive, slowing brute force after a breach.
- Verify by hashing the attempt with the stored salt and parameters and comparing in constant time.` },
    { id: 'web', kind: 'concept', title: 'Top web vulnerabilities', bodyMd: `- **SQL injection:** user input concatenated into SQL (\`"... WHERE name = '" + name + "'"\`). Fix: **parameterised queries** / prepared statements; least-privilege DB users.
- **XSS:** attacker script runs in other users' browsers because output was not escaped. Fix: context-aware output encoding (templating engines do it by default), Content Security Policy, HttpOnly cookies.
- **CSRF:** a malicious site makes the victim's browser send an authenticated request. Fix: **SameSite** cookies, CSRF tokens, re-authentication for sensitive actions.
- **Broken access control:** the server trusts IDs from the client (\`/orders/123\` without checking the owner). Fix: authorise every request server-side.
- **Secrets:** never in code or images; use a secret manager and rotate on leaks.

**Least privilege** and **zero trust**: every component gets only the access it needs, and every request is authenticated and authorised, even inside the network.` },
    { id: 'code', kind: 'code', title: 'Parameterised query', bodyMd: 'The driver sends the SQL and the value separately, so input can never change the query structure:', code: [java(`import java.sql.*;
class UserDao {
    static ResultSet findUser(Connection conn, String email) throws SQLException {
        PreparedStatement ps = conn.prepareStatement("SELECT id, name FROM users WHERE email = ?");
        ps.setString(1, email);          // safe even if email is "' OR '1'='1"
        return ps.executeQuery();
    }
}`, 'Java')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Calling Base64 "encryption".
2. Hashing passwords with SHA-256 and no salt.
3. Escaping SQL by hand instead of using parameters.
4. Hiding a button in the UI and calling that authorisation.
5. Logging secrets, tokens or passwords.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Hashing vs encryption?', answerMd: 'Hashing is a one-way function producing a fixed-size digest, used for integrity and password verification; it cannot be reversed. Encryption is reversible with a key and is used for confidentiality.' },
    { id: 'iq2', q: 'How should passwords be stored?', answerMd: 'With a slow, salted, adaptive password hashing function (Argon2id, scrypt or bcrypt) with a unique random salt per user and a tuned work factor. Never plain text, reversible encryption or fast hashes such as MD5 or SHA-256.' },
    { id: 'iq3', q: 'How do you prevent SQL injection?', answerMd: 'Use parameterised queries or prepared statements (or an ORM that uses them) so data never becomes code; validate input; and run the database user with least privilege.' },
    { id: 'iq4', q: 'What is XSS and how is it prevented?', answerMd: 'Cross-site scripting injects attacker-controlled script into pages viewed by other users. Prevent it with context-aware output encoding, avoiding raw HTML insertion (innerHTML) of untrusted data, a Content Security Policy, and HttpOnly cookies to limit damage.' },
  ],
  revision: { notesMd: `- Encoding ≠ encryption. Hash = one-way. Signature = private key signs, public verifies.
- Passwords: Argon2id/scrypt/bcrypt + per-user salt.
- SQLi → parameterised queries. XSS → output encoding + CSP. CSRF → SameSite + tokens.
- Authorise every request server-side.
- Least privilege; secrets in a manager; rotate on leaks.`, flashcards: [
    { id: 'f1', front: 'Is Base64 encryption?', backMd: 'No, it is reversible encoding with no key.' },
    { id: 'f2', front: 'Purpose of a salt?', backMd: 'Unique hashes for identical passwords; defeats precomputed tables.' },
    { id: 'f3', front: 'Fix for SQL injection?', backMd: 'Parameterised queries.' },
    { id: 'f4', front: 'Cookie attribute that mitigates CSRF?', backMd: 'SameSite (Lax or Strict).' },
    { id: 'f5', front: 'Signature: which key signs?', backMd: 'The private key (verified with the public key).' },
  ] },
  resources: [{ title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/', kind: 'official-docs' }, { title: 'OWASP Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', kind: 'official-docs' }],
});

const sfMcqs: MCQ[] = [
  mcq({ ...q(SF), id: 'core.sf.q1', type: 'concept', difficulty: 'easy', stem: 'Which is the right way to store user passwords?', options: ['Argon2id/bcrypt/scrypt with a unique salt per user', ['AES-encrypt them with a server key', 'Reversible: a leaked key exposes every password.'], ['SHA-256 without salt', 'Fast and unsalted; easy to crack.'], ['Base64-encode them', 'Not protection at all.']], answer: 0, explanation: 'Slow, salted hashes make offline guessing expensive.' }),
  mcq({ ...q(SF), id: 'core.sf.q2', type: 'debug', difficulty: 'medium', stem: 'Code builds `"SELECT * FROM users WHERE name = \'" + name + "\'"`. A user enters `x\' OR \'1\'=\'1`. What happens, and what is the fix?', options: ['The condition becomes always true and returns every user; use a parameterised query', ['Nothing; the database escapes it automatically', 'Concatenated strings are parsed as SQL.'], ['A syntax error, so it is safe', 'This input is valid SQL.'], ['Only the user named x is returned', 'The OR makes the condition always true.']], answer: 0, explanation: 'Parameters keep data separate from the SQL text.' }),
  mcq({ ...q(SF), id: 'core.sf.q3', type: 'concept', difficulty: 'medium', stem: 'With digital signatures, which key creates the signature?', options: ['The signer\'s private key', ['The signer\'s public key', 'Anyone has it; it is used to verify.'], ['The recipient\'s public key', 'That is for encrypting to them.'], ['A shared symmetric key', 'That would be a MAC.']], answer: 0, explanation: 'Anyone with the public key can verify that only the private key holder signed.' }),
  mcq({ ...q(SF), id: 'core.sf.q4', type: 'scenario', difficulty: 'medium', stem: 'Changing `/api/orders/1001` to `/api/orders/1002` shows another customer\'s order. Which vulnerability is this?', options: ['Broken access control (IDOR)', ['XSS', 'No script injection.'], ['SQL injection', 'No query manipulation.'], ['CSRF', 'The attacker uses their own session.']], answer: 0, explanation: 'The server must check that the order belongs to the authenticated user.' }),
  mcq({ ...q(SF), id: 'core.sf.q5', type: 'concept', difficulty: 'medium', stem: 'Which measure most directly prevents stored XSS when rendering user comments?', options: ['Context-aware output encoding (escape HTML when rendering)', ['Hashing comments', 'They must be displayed.'], ['HTTPS', 'Encrypts transport only.'], ['Rate limiting', 'Unrelated.']], answer: 0, explanation: 'Escaped text renders as text, not markup; add CSP as defence in depth.' }),
  mcq({ ...q(SF), id: 'core.sf.q6', type: 'concept', difficulty: 'easy', stem: 'What does a salt protect against?', options: ['Precomputed (rainbow table) attacks and identical passwords sharing a hash', ['Network sniffing', 'That is TLS.'], ['SQL injection', 'Unrelated.'], ['Weak passwords being guessed online', 'That needs rate limiting and lockout.']], answer: 0, explanation: 'Each user\'s hash must be attacked separately.' }),
];

export const topics: Topic[] = [dataRep, progExec, security, ...more.topics];
export const mcqs: MCQ[] = [...drMcqs, ...peMcqs, ...sfMcqs, ...more.mcqs];
