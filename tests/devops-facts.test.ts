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

import { subnetInfo, type SubnetInfo } from '@/engine/tools/subnet';
import { MCQ_BY_ID } from '@/content/all';
const answerOf = (id: string): string => {
  const m = MCQ_BY_ID.get(id);
  if (!m) throw new Error(`no MCQ ${id}`);
  return m.options.find((o) => o.id === m.correct[0])!.textMd;
};

describe('DevOps batch 2 facts', () => {
  it('devops.aw.q1: a /24 has 256 addresses; AWS reserves 5 → 251; a /16 holds 256 /24s', () => {
    const s = subnetInfo('10.0.1.0/24') as SubnetInfo;
    expect(s.network).toBe('10.0.1.0');
    expect(2 ** (32 - 24)).toBe(256);
    expect(2 ** (32 - 24) - 5).toBe(251);
    expect(2 ** (24 - 16)).toBe(256);
    expect(answerOf('devops.aw.q1')).toBe('251');
    expect(answerOf('devops.tf.q7')).toBe('256');
  });
  it('devops.ln: Docker default bridge 172.17.0.0/16 is a private range with 65,534 usable hosts', () => {
    const s = subnetInfo('172.17.0.0/16') as SubnetInfo;
    expect(s.isPrivate).toBe(true);
    expect(s.usableHosts).toBe(65534);
    // the 10.0.1.0/24 subnet contains 10.0.1.77 but not 8.8.8.8
    const inNet = (ip: string, cidr: string) => {
      const n = (a: string) => a.split('.').reduce((acc, o) => acc * 256 + Number(o), 0);
      const [net, len] = cidr.split('/');
      return Math.floor(n(ip) / 2 ** (32 - Number(len))) === Math.floor(n(net) / 2 ** (32 - Number(len)));
    };
    expect(inNet('10.0.1.77', '10.0.1.0/24')).toBe(true);
    expect(inNet('8.8.8.8', '10.0.1.0/24')).toBe(false);
  });
  it('devops.ci.q2: matrix of 3 × 2 = 6 jobs', () => {
    expect([18, 20, 22].flatMap((n) => ['ubuntu', 'windows'].map((o) => `${n}-${o}`)).length).toBe(6);
    expect(answerOf('devops.ci.q2')).toBe('6');
  });
  it('devops.ci.q4 / devops.ka.q6: rolling update rounding (surge up, unavailable down)', () => {
    const replicas = 10;
    const surge = Math.ceil(replicas * 0.25);
    const unavailable = Math.floor(replicas * 0.25);
    expect([surge, unavailable]).toEqual([3, 2]);
    expect([replicas + surge, replicas - unavailable]).toEqual([13, 8]);
    expect(answerOf('devops.ci.q4')).toBe('13 pods at most; at least 8 available');
    expect(answerOf('devops.ka.q6')).toBe('13 and 8');
  });
  it('devops.ka.q1: HPA desired replicas = ceil(4 × 80 / 50) = 7', () => {
    expect(Math.ceil((4 * 80) / 50)).toBe(7);
    expect(answerOf('devops.ka.q1')).toBe('7');
  });
  it('devops.ob.q1: rate of a counter going 1000 → 1600 over 300 s is 2/s', () => {
    expect((1600 - 1000) / 300).toBe(2);
    expect(answerOf('devops.ob.q1')).toBe('2 requests per second');
  });
  it('devops.aw.q7: 11 nines of durability on 10 million objects ≈ 1e-4 losses per year (one per 10,000 years)', () => {
    expect(1e7 * 1e-11).toBeCloseTo(1e-4, 12);
    expect(1 / (1e7 * 1e-11)).toBeCloseTo(10000, 6);
  });
  it('devops.cs: an AWS access key id has the AKIA + 16 characters shape (secret-scanning pattern)', () => {
    const re = /\bAKIA[0-9A-Z]{16}\b/;
    expect(re.test('AKIAIOSFODNN7EXAMPLE')).toBe(true);   // the example id from AWS documentation
    expect(re.test('not-a-key')).toBe(false);
  });
  it('devops.cicd: DORA lists exactly four metrics (lesson claim)', () => {
    expect(['deployment frequency', 'lead time for changes', 'change failure rate', 'time to restore service']).toHaveLength(4);
  });
});
