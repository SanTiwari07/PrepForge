// Checks DevOps MCQ facts against the real tools where possible (git) or by computation.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const octal = (mode: number) => [6, 3, 0].map((s) => { const b = (mode >> s) & 7; return (b & 4 ? 'r' : '-') + (b & 2 ? 'w' : '-') + (b & 1 ? 'x' : '-'); }).join('');

describe('Linux permission facts', () => {
  it('devops.lx.q1: 754 = rwxr-xr--', () => expect(octal(0o754)).toBe('rwxr-xr--'));
  it('devops.lx.q2: umask 027 → files 640, dirs 750', () => {
    expect((0o666 & ~0o027).toString(8)).toBe('640');
    expect((0o777 & ~0o027).toString(8)).toBe('750');
  });
  it('umask 022 → files 644, dirs 755', () => {
    expect((0o666 & ~0o022).toString(8)).toBe('644');
    expect((0o777 & ~0o022).toString(8)).toBe('755');
  });
});

let hasGit = true;
try { execFileSync('git', ['--version']); } catch { hasGit = false; }

describe.skipIf(!hasGit)('Git facts (real git in a temp repo)', () => {
  const repo = () => {
    const dir = mkdtempSync(join(tmpdir(), 'pf-git-'));
    const g = (...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd: dir, encoding: 'utf8' });
    g('init', '-q');
    writeFileSync(join(dir, 'a.txt'), '1\n'); g('add', '.'); g('commit', '-qm', 'one');
    writeFileSync(join(dir, 'a.txt'), '2\n'); g('add', '.'); g('commit', '-qm', 'two');
    return g;
  };
  it('devops.gt.q2: reset --soft keeps changes staged', () => {
    const g = repo();
    g('reset', '--soft', 'HEAD~1');
    expect(g('diff', '--cached', '--name-only').trim()).toBe('a.txt');
    expect(g('diff', '--name-only').trim()).toBe('');
  });
  it('mixed reset (default) keeps changes unstaged', () => {
    const g = repo();
    g('reset', 'HEAD~1');
    expect(g('diff', '--cached', '--name-only').trim()).toBe('');
    expect(g('diff', '--name-only').trim()).toBe('a.txt');
  });
  it('devops.gt.q1: revert adds a new commit instead of rewriting history', () => {
    const g = repo();
    g('revert', '--no-edit', 'HEAD');
    expect(g('rev-list', '--count', 'HEAD').trim()).toBe('3');
  });
  it('devops.gt.q4: reflog finds a commit lost by reset --hard', () => {
    const g = repo();
    const lost = g('rev-parse', 'HEAD').trim();
    g('reset', '--hard', 'HEAD~1');
    expect(g('reflog', '--format=%H')).toContain(lost);
  });
});
