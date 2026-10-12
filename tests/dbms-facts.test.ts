// Cross-checks the FD and normal-form facts stated in DBMS MCQs with the FD toolkit.
import { describe, expect, it } from 'vitest';
import { candidateKeys, closure, countSuperkeys, isLosslessBinary, normalForm, parseAttributes, parseFDs } from '@/engine/tools/fd';
import type { FD } from '@/engine/tools/fd';
import { isConflictSerialisable, parseSchedule, recoverability, serialOrder, viewSerialOrder, type Op } from '@/engine/tools/schedule';

const parse = (a: string, f: string) => {
  const attrs = parseAttributes(a);
  const fds = parseFDs(f, attrs) as FD[];
  return { attrs, fds };
};

describe('DBMS MCQ facts', () => {
  const R = parse('A B C D E', 'A -> B\nB C -> D\nD -> A');
  it('dbms.fd.q1: (AC)+ = {A, B, C, D}', () => expect(closure(['A', 'C'], R.fds).result.sort()).toEqual(['A', 'B', 'C', 'D']));
  it('dbms.fd.q2: keys ACE, BCE, CDE', () => expect(candidateKeys(R.attrs, R.fds).map((k) => k.join('')).sort()).toEqual(['ACE', 'BCE', 'CDE']));
  it('dbms.fd.q3: 7 superkeys', () => expect(countSuperkeys(R.attrs, candidateKeys(R.attrs, R.fds))).toBe(7));
  it('dbms.nf.q3: highest NF is 3NF', () => expect(normalForm(R.attrs, R.fds).highest).toBe('3NF'));
  it('dbms.nf.q1: SC -> G, S -> N is 1NF', () => { const r = parse('S C N G', 'S C -> G\nS -> N'); expect(normalForm(r.attrs, r.fds).highest).toBe('1NF'); });
  it('dbms.nf.q2: A -> B, B -> C is 2NF', () => { const r = parse('A B C', 'A -> B\nB -> C'); expect(normalForm(r.attrs, r.fds).highest).toBe('2NF'); });
  it('dbms.nf.q4: (A, C) + (B, C) is lossy', () => { const r = parse('A B C', 'A -> B\nB -> C'); expect(isLosslessBinary(['A', 'C'], ['B', 'C'], r.attrs, r.fds)).toBe(false); });
  it('dbms.kc.q4: one key {A, B} in R(A, B, C) gives 2 superkeys', () => expect(countSuperkeys(['A', 'B', 'C'], [['A', 'B']])).toBe(2));
  it('3NF-not-BCNF interview example (Student, Course, Teacher)', () => {
    const r = parse('S C T', 'S C -> T\nT -> C');
    expect(candidateKeys(r.attrs, r.fds).map((k) => k.join('')).sort()).toEqual(['SC', 'ST']);
    expect(normalForm(r.attrs, r.fds).highest).toBe('3NF');
  });
});

describe('DBMS schedule MCQ facts (schedule analyser)', () => {
  const P = (s: string) => parseSchedule(s) as Op[];
  it('dbms.sr.q2: lost update is not conflict serialisable', () => expect(isConflictSerialisable(P('R1(A) R2(A) W1(A) W2(A)'))).toBe(false));
  it('dbms.sr.q3: serial order T1 -> T2', () => expect(serialOrder(P('R1(A) W1(A) R2(A) W2(A) R1(B) W1(B) R2(B) W2(B)'))).toEqual(['1', '2']));
  it('dbms.sr.q4: blind writes are view- but not conflict-serialisable', () => {
    const s = P('R1(A) W2(A) W1(A) W3(A)');
    expect(isConflictSerialisable(s)).toBe(false);
    expect(viewSerialOrder(s)).toEqual(['1', '2', '3']);
  });
  it('dbms.sr.q5: W1(A) R2(A) C2 C1 is not recoverable', () => expect(recoverability(P('W1(A) R2(A) C2 C1')).recoverable).toBe(false));
  it('dbms.sr.q6 / iq5: W1(A) R2(A) C1 C2 is recoverable but not cascadeless', () => {
    const r = recoverability(P('W1(A) R2(A) C1 C2'));
    expect([r.recoverable, r.cascadeless]).toEqual([true, false]);
  });
});

import { MCQ_BY_ID } from '@/content/all';
const answerOf = (id: string): string => {
  const m = MCQ_BY_ID.get(id);
  if (!m) throw new Error(`no MCQ ${id}`);
  return m.options.find((o) => o.id === m.correct[0])!.textMd;
};

describe('Extra DBMS MCQ facts (dbms.xm.*)', () => {
  it('dbms.xm.q1: A → B, B → C, C → D: one key {A}; {B}+ = {B, C, D}', () => {
    const r = parse('A B C D', 'A -> B\nB -> C\nC -> D');
    expect(candidateKeys(r.attrs, r.fds).map((k) => k.join(''))).toEqual(['A']);
    expect(closure(['B'], r.fds).result.sort()).toEqual(['B', 'C', 'D']);
    expect(answerOf('dbms.xm.q1')).toContain('One candidate key');
  });
  it('dbms.xm.q2: AB → C, C → D, D → A: keys AB, BC, BD', () => {
    const r = parse('A B C D', 'A B -> C\nC -> D\nD -> A');
    const keys = candidateKeys(r.attrs, r.fds).map((k) => k.join('')).sort();
    expect(keys).toEqual(['AB', 'BC', 'BD']);
    expect(answerOf('dbms.xm.q2')).toContain('3');
  });
  it('dbms.xm.q3: AB → C, C → D is in 2NF but not 3NF', () => {
    const r = parse('A B C D', 'A B -> C\nC -> D');
    expect(candidateKeys(r.attrs, r.fds).map((k) => k.join(''))).toEqual(['AB']);
    expect(normalForm(r.attrs, r.fds).highest).toBe('2NF');
  });
  it('dbms.xm.q4: (A, B) + (A, C) is lossless when A → B', () => {
    const r = parse('A B C', 'A -> B');
    expect(isLosslessBinary(['A', 'B'], ['A', 'C'], r.attrs, r.fds)).toBe(true);
  });
  it('dbms.xm.q5: |R × S| = 4,000', () => {
    expect(100 * 40).toBe(4000);
    expect(answerOf('dbms.xm.q5')).toContain('4,000');
  });
  it('dbms.xm.q6: 10^6 keys with fan-out 100 → 3 levels; 10^6 / 100 rows per page = 10,000 pages', () => {
    let levels = 0;
    for (let reach = 1; reach < 1e6; reach *= 100) levels++;
    expect(levels).toBe(3);
    expect(1e6 / 100).toBe(10000);
    expect(answerOf('dbms.xm.q6')).toContain('About 4');
  });
  it('dbms.xm.q10: T1 → T2 → T3 → T1 is a cycle in the wait-for graph', () => {
    const edges: Record<string, string[]> = { T1: ['T2'], T2: ['T3'], T3: ['T1'] };
    const hasCycle = (start: string) => { const seen = new Set<string>(); let cur = start; while (edges[cur]) { if (seen.has(cur)) return true; seen.add(cur); cur = edges[cur][0]; } return false; };
    expect(hasCycle('T1')).toBe(true);
  });
  it('dbms.xm.q12: 4 transactions have 4! = 24 serial schedules', () => {
    expect([1, 2, 3, 4].reduce((a, b) => a * b, 1)).toBe(24);
    expect(answerOf('dbms.xm.q12')).toBe('24');
  });
});
