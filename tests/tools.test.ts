import { describe, expect, it } from 'vitest';
import { schedule } from '@/engine/tools/scheduling';
import { simulatePaging } from '@/engine/tools/paging';
import { prefixForHosts, subnetInfo } from '@/engine/tools/subnet';
import { candidateKeys, closure, countSuperkeys, isLosslessBinary, normalForm, parseAttributes, parseFDs, preservedFDs } from '@/engine/tools/fd';

describe('CPU scheduling', () => {
  // Classic example: P1(0,24) P2(0,3) P3(0,3), FCFS → waiting 0, 24, 27 (avg 17).
  it('FCFS', () => {
    const r = schedule([{ id: 'P1', arrival: 0, burst: 24 }, { id: 'P2', arrival: 0, burst: 3 }, { id: 'P3', arrival: 0, burst: 3 }], 'fcfs');
    expect(r.stats.map((s) => s.waiting)).toEqual([0, 24, 27]);
    expect(r.avgWaiting).toBe(17);
  });
  // Same processes with RR q=4 → waiting P1 6, P2 4, P3 7 (avg 5.67).
  it('Round Robin q=4', () => {
    const r = schedule([{ id: 'P1', arrival: 0, burst: 24 }, { id: 'P2', arrival: 0, burst: 3 }, { id: 'P3', arrival: 0, burst: 3 }], 'rr', 4);
    expect(r.stats.map((s) => s.waiting)).toEqual([6, 4, 7]);
    expect(r.avgWaiting).toBeCloseTo(5.67, 2);
  });
  // SRTF: P1(0,8) P2(1,4) P3(2,9) P4(3,5) → avg waiting 6.5.
  it('SRTF', () => {
    const r = schedule([{ id: 'P1', arrival: 0, burst: 8 }, { id: 'P2', arrival: 1, burst: 4 }, { id: 'P3', arrival: 2, burst: 9 }, { id: 'P4', arrival: 3, burst: 5 }], 'srtf');
    expect(r.avgWaiting).toBe(6.5);
    expect(r.gantt.map((g) => g.id)).toEqual(['P1', 'P2', 'P4', 'P1', 'P3']);
  });
  // Non-preemptive SJF, all at 0: P1 6, P2 8, P3 7, P4 3 → order P4 P1 P3 P2, avg waiting 7.
  it('SJF', () => {
    const r = schedule([{ id: 'P1', arrival: 0, burst: 6 }, { id: 'P2', arrival: 0, burst: 8 }, { id: 'P3', arrival: 0, burst: 7 }, { id: 'P4', arrival: 0, burst: 3 }], 'sjf');
    expect(r.avgWaiting).toBe(7);
  });
  it('inserts idle time when the CPU has nothing to run', () => {
    const r = schedule([{ id: 'A', arrival: 2, burst: 1 }, { id: 'B', arrival: 5, burst: 1 }], 'fcfs');
    expect(r.gantt).toEqual([{ id: null, start: 0, end: 2 }, { id: 'A', start: 2, end: 3 }, { id: null, start: 3, end: 5 }, { id: 'B', start: 5, end: 6 }]);
  });
});

describe('page replacement', () => {
  const ref = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
  it('textbook reference string with 3 frames: FIFO 15, LRU 12, Optimal 9', () => {
    expect(simulatePaging(ref, 3, 'fifo').faults).toBe(15);
    expect(simulatePaging(ref, 3, 'lru').faults).toBe(12);
    expect(simulatePaging(ref, 3, 'optimal').faults).toBe(9);
  });
  it("shows Belady's anomaly for FIFO", () => {
    const b = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
    expect(simulatePaging(b, 3, 'fifo').faults).toBe(9);
    expect(simulatePaging(b, 4, 'fifo').faults).toBe(10);
  });
});

describe('subnetting', () => {
  it('computes a /26', () => {
    const s = subnetInfo('192.168.10.77/26');
    expect(typeof s).toBe('object');
    if (typeof s === 'string') return;
    expect(s.network).toBe('192.168.10.64');
    expect(s.broadcast).toBe('192.168.10.127');
    expect(s.firstHost).toBe('192.168.10.65');
    expect(s.lastHost).toBe('192.168.10.126');
    expect(s.mask).toBe('255.255.255.192');
    expect(s.usableHosts).toBe(62);
    expect(s.isPrivate).toBe(true);
  });
  it('handles /31, /32 and /0 and rejects bad input', () => {
    expect((subnetInfo('10.0.0.1/31') as { usableHosts: number }).usableHosts).toBe(2);
    expect((subnetInfo('10.0.0.1/32') as { usableHosts: number }).usableHosts).toBe(1);
    expect((subnetInfo('8.8.8.8/0') as { network: string }).network).toBe('0.0.0.0');
    expect(typeof subnetInfo('300.1.1.1/24')).toBe('string');
    expect(typeof subnetInfo('1.2.3.4')).toBe('string');
  });
  it('finds the smallest prefix for a host count', () => {
    expect(prefixForHosts(50)).toBe(26);
    expect(prefixForHosts(62)).toBe(26);
    expect(prefixForHosts(63)).toBe(25);
    expect(prefixForHosts(2)).toBe(30);
  });
});

describe('FD toolkit', () => {
  const attrs = parseAttributes('A B C D E');
  const fds = parseFDs('A -> B\nB C -> D\nD -> A', attrs);
  it('parses', () => {
    expect(attrs).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(Array.isArray(fds)).toBe(true);
    expect(parseAttributes('ABCD')).toEqual(['A', 'B', 'C', 'D']);
    expect(typeof parseFDs('A -> Z', attrs)).toBe('string');
  });
  if (!Array.isArray(fds)) return;
  it('computes closures', () => {
    expect(closure(['A', 'C'], fds).result.sort()).toEqual(['A', 'B', 'C', 'D']);
  });
  it('finds candidate keys and counts superkeys', () => {
    // C and E never appear on a right-hand side, so they are in every key: ACE, BCE, CDE.
    const keys = candidateKeys(attrs, fds).map((k) => k.join(''));
    expect(keys.sort()).toEqual(['ACE', 'BCE', 'CDE']);
    // Superkeys must contain C and E and at least one of A, B, D: 2^3 − 1 = 7.
    expect(countSuperkeys(attrs, candidateKeys(attrs, fds))).toBe(7);
  });
  it('finds the highest normal form', () => {
    // All of A, B, D are prime; A→B, BC→D, D→A have non-superkey LHS but prime RHS → 3NF, not BCNF.
    expect(normalForm(attrs, fds).highest).toBe('3NF');
    const a2 = parseAttributes('S C N G');
    const f2 = parseFDs('S C -> G\nS -> N', a2);
    expect(Array.isArray(f2) && normalForm(a2, f2).highest).toBe('1NF'); // partial dependency S→N
    const a3 = parseAttributes('A B C');
    const f3 = parseFDs('A -> B\nB -> C', a3);
    expect(Array.isArray(f3) && normalForm(a3, f3).highest).toBe('2NF'); // transitive A→B→C
    const f4 = parseFDs('A -> B C', a3);
    expect(Array.isArray(f4) && normalForm(a3, f4).highest).toBe('BCNF');
  });
  it('checks lossless join and dependency preservation', () => {
    const a = parseAttributes('A B C');
    const f = parseFDs('A -> B\nB -> C', a);
    if (!Array.isArray(f)) throw new Error('parse');
    expect(isLosslessBinary(['A', 'B'], ['B', 'C'], a, f)).toBe(true);   // common B → C
    expect(isLosslessBinary(['A', 'B'], ['A', 'C'], a, f)).toBe(true);   // common A → B
    expect(isLosslessBinary(['A', 'C'], ['B', 'C'], a, f)).toBe(false);  // common C determines nothing
    const pres = preservedFDs([['A', 'B'], ['A', 'C']], f);
    expect(pres.map((p) => p.preserved)).toEqual([true, false]);         // B→C is lost
  });
});
