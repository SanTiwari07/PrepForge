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

const norm = (s: string) => s.replace(/\r\n/g, '\n').trim();

function fail(where: string, msg: string) {
  failures += 1;
  console.error(`FAIL ${where}\n${msg.split('\n').slice(0, 12).join('\n')}\n`);
}

function runProgram(where: string, s: CodeSample) {
  checked += 1;
  const dir = join(work, `p${checked}`);
  mkdirSync(dir);
  if (s.lang === 'cpp') {
    writeFileSync(join(dir, 'main.cpp'), s.code);
    const exe = join(dir, 'main.exe');
    const c = spawnSync('g++', [`-std=${CPP_STD}`, '-O0', '-o', exe, join(dir, 'main.cpp')], { encoding: 'utf8' });
    if (c.status !== 0) return fail(where, c.stderr);
    const r = spawnSync(exe, { encoding: 'utf8', timeout: 5000 });
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
  return /^\s*(for|while|if|do)\b/.test(first) || /^\s*(int|long|String|auto|double|var)\s+\w+\s*(=|;|,)/.test(first);
};
const CPP_FRAGMENT = (c: string) => `${CPP_PRELUDE}void snippet_() {\n  int n = 8, cnt = 0, target = 0; long long sum = 0; vector<int> a(8);\n  (void)n; (void)cnt; (void)target; (void)sum;\n${c}\n}\n`;
const JAVA_FRAGMENT = (c: string) => `${JAVA_IMPORTS}class Snippet {\n  void snippet_() {\n    int n = 8, cnt = 0, target = 0; long sum = 0; int[] a = new int[8];\n${c}\n  }\n}\n`;

function syntaxCheck(where: string, s: CodeSample) {
  checked += 1;
  const dir = join(work, `s${checked}`);
  mkdirSync(dir);
  if ((s.lang === 'cpp' || s.lang === 'java') && isFragment(s.code)) {
    const file = join(dir, s.lang === 'cpp' ? 'x.cpp' : 'Snippet.java');
    writeFileSync(file, s.lang === 'cpp' ? CPP_FRAGMENT(s.code) : JAVA_FRAGMENT(s.code));
    const c = s.lang === 'cpp'
      ? spawnSync('g++', [`-std=${CPP_STD}`, '-fsyntax-only', file], { encoding: 'utf8' })
      : spawnSync('javac', ['-Xlint:none', '-d', dir, file], { encoding: 'utf8' });
    if (c.status !== 0) fail(where, c.stderr);
    return;
  }
  if (s.lang === 'cpp') {
    const hasMain = /\bint\s+main\s*\(/.test(s.code);
    writeFileSync(join(dir, 'x.cpp'), (s.code.includes('#include') ? '' : CPP_PRELUDE) + s.code + (hasMain ? '' : '\n'));
    const c = spawnSync('g++', [`-std=${CPP_STD}`, '-fsyntax-only', join(dir, 'x.cpp')], { encoding: 'utf8' });
    if (c.status !== 0) fail(where, c.stderr);
  } else if (s.lang === 'java') {
    const isFullClass = /^\s*(import|public\s+class|class)\b/m.test(s.code) && /class\s+\w+/.test(s.code) && !/^\s*(public\s+|static\s+|private\s+)?[\w<>[\], ]+\s+\w+\s*\([^)]*\)\s*\{/m.test(s.code.split('\n')[0]);
    const src = isFullClass ? s.code : `${JAVA_IMPORTS}@SuppressWarnings({"unchecked", "rawtypes"})\nclass Snippet {\n${s.code}\n}\n`;
    const cls = isFullClass ? (s.code.match(/public\s+class\s+(\w+)/)?.[1] ?? 'Snippet') : 'Snippet';
    writeFileSync(join(dir, `${cls}.java`), src);
    const c = spawnSync('javac', ['-Xlint:none', '-d', dir, join(dir, `${cls}.java`)], { encoding: 'utf8' });
    if (c.status !== 0) fail(where, c.stderr);
  }
}

for (const q of MCQS) {
  if (!q.code || (q.code.lang !== 'cpp' && q.code.lang !== 'java')) continue;
  if (q.code.expectedOutput !== undefined) runProgram(`MCQ ${q.id}`, q.code);
  else syntaxCheck(`MCQ ${q.id}`, q.code);
  if (q.verified === 'compiled' && q.code.expectedOutput === undefined) fail(`MCQ ${q.id}`, 'Marked "compiled" but has no expectedOutput to verify.');
}
for (const t of TOPICS) {
  for (const sec of t.sections) for (const c of sec.code ?? []) syntaxCheck(`${t.id} › ${sec.id} (${c.lang})`, c);
  for (const c of t.revision.templates ?? []) syntaxCheck(`${t.id} › template (${c.lang})`, c);
}
for (const [slug, w] of Object.entries(WALKTHROUGHS)) for (const c of w.code) syntaxCheck(`walkthrough ${slug} (${c.lang})`, c);

console.log(`\nChecked ${checked} code samples with C++ standard ${CPP_STD}: ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
