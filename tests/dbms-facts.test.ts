// Cross-checks the FD and normal-form facts stated in DBMS MCQs with the FD toolkit.
import { describe, expect, it } from 'vitest';
import { candidateKeys, closure, countSuperkeys, isLosslessBinary, normalForm, parseAttributes, parseFDs } from '@/engine/tools/fd';
import type { FD } from '@/engine/tools/fd';

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
