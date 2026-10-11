// Verifies C++ and Java code in the content with real compilers.
//  1. Complete programs with expectedOutput (code-output MCQs): compile, run, compare stdout.
//  2. Every other C++/Java snippet (lessons, walkthroughs, templates): syntax/type check by
//     wrapping it with standard headers (C++) or in a class with imports (Java).
// Usage: npm run verify:code   (needs g++ and javac on PATH)
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MCQS, TOPICS, WALKTHROUGHS } from '../src/content/registry';
import type { CodeSample } from '../src/content/schema';

const work = mkdtempSync(join(tmpdir(), 'prepforge-verify-'));
const CPP_STD = process.env.CPP_STD ?? 'c++14';
let failures = 0;
let checked = 0;

function version(cmd: string, args: string[]): string {
  try { return execFileSync(cmd, args, { encoding: 'utf8' }).split('\n')[0].trim(); } catch { return 'not found'; }
}
console.log(`g++: ${version('g++', ['--version'])}`);
console.log(`javac: ${version('javac', ['-version'])}`);

// Some toolchains (e.g. MinGW g++ with the win32 thread model) lack <mutex>/<thread> or POSIX
// headers. Probe once; samples needing a missing capability are reported as SKIP, not passed.
let skipped = 0;
function compiles(src: string): boolean {
  const f = join(work, `probe${Math.random().toString(36).slice(2)}.cpp`);
  writeFileSync(f, src);
  return spawnSync('g++', [`-std=${CPP_STD}`, '-fsyntax-only', f], { encoding: 'utf8' }).status === 0;
}
const CAPS = {
  threads: compiles('#include <mutex>\n#include <condition_variable>\nstd::mutex m; std::condition_variable cv;\n'),
  posix: compiles('#include <unistd.h>\n#include <sys/wait.h>\nint f() { return fork(); }\n'),
};
console.log(`toolchain: std threads ${CAPS.threads ? 'yes' : 'NO'}, POSIX headers ${CAPS.posix ? 'yes' : 'NO'}`);
function needsCap(s: CodeSample): string | null {
  if (s.lang !== 'cpp') return null;
  if (!CAPS.threads && /#include\s*<(mutex|thread|condition_variable|shared_mutex|future)>|std::(mutex|thread|condition_variable)/.test(s.code)) return 'std threading';
  if (!CAPS.posix && /#include\s*<(unistd\.h|sys\/\w+\.h|pthread\.h)>/.test(s.code)) return 'POSIX headers';
  return null;
}

// Fallback for samples the local toolchain cannot build: a Linux g++ inside WSL (Windows).
// Windows paths are translated to /mnt/<drive>/... for the WSL side.
const WSL = process.platform === 'win32' && spawnSync('wsl', ['-e', 'g++', '--version'], { encoding: 'utf8' }).status === 0;
if (WSL) console.log(`fallback for missing capabilities: WSL ${version('wsl', ['-e', 'g++', '--version'])}`);
let viaWsl = 0;
const toWsl = (p: string) => p.replace(/^([A-Za-z]):/, (_, d: string) => `/mnt/${d.toLowerCase()}`).replace(/\\/g, '/');
const viaWslFor = (s: CodeSample) => WSL && needsCap(s) !== null;
/** Run g++ locally, or in WSL (with -pthread) when the sample needs a capability the local g++ lacks. */
function gxx(s: CodeSample, args: string[]) {
  if (!viaWslFor(s)) return spawnSync('g++', args, { encoding: 'utf8' });
  viaWsl += 1;
  return spawnSync('wsl', ['-e', 'g++', '-pthread', ...args.map((a) => (/^[A-Za-z]:[\\/]/.test(a) ? toWsl(a) : a))], { encoding: 'utf8' });
}
function runExe(s: CodeSample, exe: string) {
  if (viaWslFor(s)) return spawnSync('wsl', ['-e', toWsl(exe)], { encoding: 'utf8', timeout: 5000 });
  return spawnSync(exe, { encoding: 'utf8', timeout: 5000 });
}
/** A capability that neither the local toolchain nor the WSL fallback provides (reported as SKIP). */
const missingCap = (s: CodeSample) => (WSL ? null : needsCap(s));

const norm = (s: string) => s.replace(/\r\n/g, '\n').trim();

function fail(where: string, msg: string) {
  failures += 1;
  console.error(`FAIL ${where}\n${msg.split('\n').slice(0, 12).join('\n')}\n`);
}

function runProgram(where: string, s: CodeSample) {
  const cap = missingCap(s);
  if (cap) { skipped += 1; console.warn(`SKIP ${where}: this toolchain lacks ${cap}`); return; }
  checked += 1;
  const dir = join(work, `p${checked}`);
  mkdirSync(dir);
  if (s.lang === 'cpp') {
    writeFileSync(join(dir, 'main.cpp'), s.code);
    const exe = join(dir, 'main.exe');
    const c = gxx(s, [`-std=${CPP_STD}`, '-O0', '-o', exe, join(dir, 'main.cpp')]);
    if (c.status !== 0) return fail(where, c.stderr);
    const r = runExe(s, exe);
    if (norm(r.stdout) !== norm(s.expectedOutput!)) fail(where, `expected:\n${s.expectedOutput}\nactual:\n${r.stdout}`);
  } else {
    const cls = s.code.match(/public\s+class\s+(\w+)/)?.[1] ?? 'Main';
    writeFileSync(join(dir, `${cls}.java`), s.code);
    const c = spawnSync('javac', ['-d', dir, join(dir, `${cls}.java`)], { encoding: 'utf8' });
    if (c.status !== 0) return fail(where, c.stderr);
    const r = spawnSync('java', ['-cp', dir, cls], { encoding: 'utf8', timeout: 10000 });
    if (norm(r.stdout) !== norm(s.expectedOutput!)) fail(where, `expected:\n${s.expectedOutput}\nactual:\n${r.stdout}`);
  }
}

const CPP_PRELUDE = '#include <bits/stdc++.h>\nusing namespace std;\n';
const JAVA_IMPORTS = 'import java.util.*;\nimport java.util.function.*;\nimport java.util.stream.*;\n';

// Statement-level fragments (e.g. a bare loop in an MCQ stem) are compiled inside a function
// body with the free variables these snippets use declared up front.
const isFragment = (code: string) => {
  const first = code.split('\n').find((l) => l.trim()) ?? '';
  // A loop/if, or a variable declaration such as "int x = …" or "ListNode* prev = …".
  return /^\s*(for|while|if|do)\b/.test(first) || /^\s*[\w:<>]+[\s*&]+\w+\s*(=|;|,)/.test(first);
};
// Free names used by fragments in MCQ stems are declared here so the fragment itself is checked.
const CPP_FRAGMENT = (c: string) => `${CPP_PRELUDE}struct ListNode { int val; ListNode* next; };\nvoid process(int, int) {}\nvoid snippet_() {\n  int n = 8, cnt = 0, target = 0; long long sum = 0; vector<int> a(8), v(8);\n  ListNode* cur = nullptr;\n  (void)n; (void)cnt; (void)target; (void)sum; (void)cur;\n${c}\n}\n`;
const JAVA_FRAGMENT = (c: string) => `${JAVA_IMPORTS}class Snippet {\n  void snippet_() {\n    int n = 8, cnt = 0, target = 0; long sum = 0; int[] a = new int[8];\n${c}\n  }\n}\n`;

// LeetCode provides ListNode/TreeNode; supply equivalent definitions when a snippet uses
// them without defining them, so solutions are checked exactly as written for LeetCode.
function cppLeetCodeTypes(code: string): string {
  let out = '';
  if (/\bListNode\b/.test(code) && !/struct\s+ListNode\b/.test(code)) {
    out += 'struct ListNode { int val; ListNode* next; ListNode(int x = 0, ListNode* n = nullptr) : val(x), next(n) {} };\n';
  }
  if (/\bTreeNode\b/.test(code) && !/struct\s+TreeNode\b/.test(code)) {
    out += 'struct TreeNode { int val; TreeNode *left, *right; TreeNode(int x = 0) : val(x), left(nullptr), right(nullptr) {} };\n';
  }
  return out;
}
function javaLeetCodeTypes(code: string): string {
  let out = '';
  if (/\bListNode\b/.test(code) && !/class\s+ListNode\b/.test(code)) {
    out += 'static class ListNode { int val; ListNode next; ListNode() {} ListNode(int v) { val = v; } ListNode(int v, ListNode n) { val = v; next = n; } }\n';
  }
  if (/\bTreeNode\b/.test(code) && !/class\s+TreeNode\b/.test(code)) {
    out += 'static class TreeNode { int val; TreeNode left, right; TreeNode() {} TreeNode(int v) { val = v; } }\n';
  }
  return out;
}

function syntaxCheck(where: string, s: CodeSample) {
  const cap = missingCap(s);
  if (cap) { skipped += 1; console.warn(`SKIP ${where}: this toolchain lacks ${cap}`); return; }
  checked += 1;
  const dir = join(work, `s${checked}`);
  mkdirSync(dir);
  if ((s.lang === 'cpp' || s.lang === 'java') && isFragment(s.code)) {
    const file = join(dir, s.lang === 'cpp' ? 'x.cpp' : 'Snippet.java');
    writeFileSync(file, s.lang === 'cpp' ? CPP_FRAGMENT(s.code) : JAVA_FRAGMENT(s.code));
    const c = s.lang === 'cpp'
      ? gxx(s, [`-std=${CPP_STD}`, '-fsyntax-only', file])
      : spawnSync('javac', ['-Xlint:none', '-d', dir, file], { encoding: 'utf8' });
    if (c.status !== 0) fail(where, c.stderr);
    return;
  }
  if (s.lang === 'cpp') {
    const hasMain = /\bint\s+main\s*\(/.test(s.code);
    writeFileSync(join(dir, 'x.cpp'), (s.code.includes('#include') ? '' : CPP_PRELUDE + cppLeetCodeTypes(s.code)) + s.code + (hasMain ? '' : '\n'));
    const c = gxx(s, [`-std=${CPP_STD}`, '-fsyntax-only', join(dir, 'x.cpp')]);
    if (c.status !== 0) fail(where, c.stderr);
  } else if (s.lang === 'java') {
    // A complete compilation unit has imports or a public top-level class; anything else
    // (methods, helper classes, fields) is wrapped in a class so it compiles as members.
    const isFullClass = /^\s*import\s/m.test(s.code) || /^public\s+class\s+\w+/m.test(s.code);
    const src = isFullClass ? s.code : `${JAVA_IMPORTS}@SuppressWarnings({"unchecked", "rawtypes"})\nclass Snippet {\n${javaLeetCodeTypes(s.code)}${s.code}\n}\n`;
    const cls = isFullClass ? (s.code.match(/public\s+class\s+(\w+)/)?.[1] ?? 'Snippet') : 'Snippet';
    writeFileSync(join(dir, `${cls}.java`), src);
    const c = spawnSync('javac', ['-Xlint:none', '-d', dir, join(dir, `${cls}.java`)], { encoding: 'utf8' });
    if (c.status !== 0) fail(where, c.stderr);
  }
}

// Compile-error questions: compilation must fail, and the first error must be on the line
// marked "// here" (so the question points at the real problem).
function expectFailure(where: string, s: CodeSample) {
  checked += 1;
  const dir = join(work, `e${checked}`);
  mkdirSync(dir);
  const marked = s.code.split('\n').findIndex((l) => l.includes('// here'));
  let file: string, prefixLines: number, res;
  if (s.lang === 'cpp') {
    const prefix = s.code.includes('#include') ? '' : CPP_PRELUDE;
    prefixLines = prefix.split('\n').length - 1;
    file = join(dir, 'x.cpp');
    writeFileSync(file, prefix + s.code + '\n');
    res = gxx(s, [`-std=${CPP_STD}`, '-fsyntax-only', file]);
  } else {
    const full = /^\s*import\s/m.test(s.code) || /^public\s+class\s+\w+/m.test(s.code);
    const cls = full ? (s.code.match(/public\s+class\s+(\w+)/)?.[1] ?? 'Snippet') : 'Snippet';
    const prefix = full ? '' : `${JAVA_IMPORTS}class Snippet {\n`;
    prefixLines = prefix.split('\n').length - 1;
    file = join(dir, `${cls}.java`);
    writeFileSync(file, prefix + s.code + (full ? '\n' : '\n}\n'));
    res = spawnSync('javac', ['-Xlint:none', '-d', dir, file], { encoding: 'utf8' });
  }
  if (res.status === 0) return fail(where, 'Expected a compile error, but the code compiled.');
  if (marked >= 0) {
    const m = res.stderr.match(/:(\d+)(?::\d+)?:\s*error/);
    const line = m ? Number(m[1]) - prefixLines - 1 : -1;
    if (line !== marked) fail(where, `First error is on snippet line ${line + 1}, expected the "// here" line ${marked + 1}.\n${res.stderr}`);
  }
}

for (const q of MCQS) {
  if (!q.code || (q.code.lang !== 'cpp' && q.code.lang !== 'java')) continue;
  if (q.code.expectCompileError) { expectFailure(`MCQ ${q.id}`, q.code); continue; }
  if (q.code.expectedOutput !== undefined) runProgram(`MCQ ${q.id}`, q.code);
  else syntaxCheck(`MCQ ${q.id}`, q.code);
  if (q.verified === 'compiled' && q.code.expectedOutput === undefined) fail(`MCQ ${q.id}`, 'Marked "compiled" but has no expectedOutput to verify.');
}
for (const t of TOPICS) {
  for (const sec of t.sections) for (const c of sec.code ?? []) {
    if (c.expectedOutput !== undefined && (c.lang === 'cpp' || c.lang === 'java')) runProgram(`${t.id} › ${sec.id} (${c.lang})`, c);
    else syntaxCheck(`${t.id} › ${sec.id} (${c.lang})`, c);
  }
  for (const c of t.revision.templates ?? []) syntaxCheck(`${t.id} › template (${c.lang})`, c);
}
for (const [slug, w] of Object.entries(WALKTHROUGHS)) for (const c of w.code) syntaxCheck(`walkthrough ${slug} (${c.lang})`, c);

console.log(`\nChecked ${checked} code samples with C++ standard ${CPP_STD} (${viaWsl} via WSL g++): ${failures} failure(s), ${skipped} skipped (toolchain capability)`);
process.exit(failures ? 1 : 0);
