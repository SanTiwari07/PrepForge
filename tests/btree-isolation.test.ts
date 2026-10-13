import { describe, expect, it } from 'vitest';
import { BPlusTree } from '@/engine/tools/btree';
import { LEVELS, SCENARIOS, parseIsoSchedule, simulate, type IsoOp } from '@/engine/tools/isolation';

// Small deterministic PRNG so failures are reproducible.
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

describe('B+ tree', () => {
  it('keeps a sorted leaf chain for the textbook order-4 example (max 3 keys)', () => {
    const t = new BPlusTree(3);
    [1, 4, 7, 10, 17, 21, 31, 25, 19, 20, 28, 42].forEach((k) => t.insert(k));
    t.check();
    expect(t.leafKeys()).toEqual([1, 4, 7, 10, 17, 19, 20, 21, 25, 28, 31, 42]);
    expect(t.levels().height).toBe(3);
  });

  it('splits a full leaf by copying the first key of the right half up', () => {
    const t = new BPlusTree(3);
    [1, 2, 3].forEach((k) => t.insert(k));
    const r = t.insert(4);
    expect(t.levels().levels).toEqual([[[3]], [[1, 2], [3, 4]]]);
    expect(r.steps.join(' ')).toMatch(/copy 3 up/);
  });

  it('moves the middle key up when an internal node splits', () => {
    const t = new BPlusTree(3);
    for (let k = 1; k <= 10; k++) t.insert(k);
    t.check();
    expect(t.levels().height).toBe(3);
    expect(t.levels().levels[0]).toEqual([[7]]);
  });

  it('rejects duplicates and missing deletes without changing the tree', () => {
    const t = new BPlusTree(4);
    t.insert(5);
    expect(t.insert(5).ok).toBe(false);
    expect(t.delete(9).ok).toBe(false);
    expect(t.leafKeys()).toEqual([5]);
  });

  it('range scan follows the leaf chain', () => {
    const t = new BPlusTree(3);
    for (let k = 1; k <= 30; k++) t.insert(k * 2);
    expect(t.range(11, 25).keys).toEqual([12, 14, 16, 18, 20, 22, 24]);
    expect(t.range(100, 200).keys).toEqual([]);
    expect(t.search(24).found).toBe(true);
    expect(t.search(25).found).toBe(false);
  });

  it.each([3, 4, 5, 6, 8])('keeps every invariant under random inserts and deletes (maxKeys %i)', (m) => {
    const rand = rng(m * 7919);
    const t = new BPlusTree(m);
    const model = new Set<number>();
    for (let i = 0; i < 1500; i++) {
      const k = Math.floor(rand() * 120);
      if (rand() < 0.55) { expect(t.insert(k).ok).toBe(!model.has(k)); model.add(k); }
      else { expect(t.delete(k).ok).toBe(model.has(k)); model.delete(k); }
      t.check();
      if (i % 50 === 0) expect(t.leafKeys()).toEqual([...model].sort((a, b) => a - b));
    }
    expect(t.leafKeys()).toEqual([...model].sort((a, b) => a - b));
    const lo = 30, hi = 70;
    expect(t.range(lo, hi).keys).toEqual([...model].filter((k) => k >= lo && k <= hi).sort((a, b) => a - b));
  });

  it('empties down to a single empty leaf', () => {
    const t = new BPlusTree(3);
    for (let k = 1; k <= 20; k++) t.insert(k);
    for (let k = 1; k <= 20; k++) { t.delete(k); t.check(); }
    expect(t.root.leaf).toBe(true);
    expect(t.leafKeys()).toEqual([]);
  });

  it('height grows logarithmically', () => {
    const t = new BPlusTree(8);
    for (let k = 0; k < 2000; k++) t.insert(k);
    expect(t.levels().height).toBeLessThanOrEqual(5);
    expect(t.levels().height).toBeGreaterThanOrEqual(3);
  });

  it('rejects out-of-range node sizes', () => {
    expect(() => new BPlusTree(2)).toThrow();
    expect(() => new BPlusTree(9)).toThrow();
  });
});

describe('isolation anomaly simulator', () => {
  const run = (id: string) => {
    const sc = SCENARIOS.find((s) => s.id === id)!;
    const ops = parseIsoSchedule(sc.schedule) as IsoOp[];
    return Object.fromEntries(LEVELS.map((l) => [l, simulate(sc.initial, ops, l)])) as Record<(typeof LEVELS)[number], ReturnType<typeof simulate>>;
  };

  it('dirty read happens only at READ UNCOMMITTED', () => {
    const r = run('dirty');
    expect(r['READ UNCOMMITTED'].anomalies).toEqual(['dirty read']);
    expect(r['READ COMMITTED'].anomalies).toEqual([]);
    expect(r['REPEATABLE READ'].anomalies).toEqual([]);
    expect(r.SERIALIZABLE.anomalies).toEqual([]);
    expect(r['READ UNCOMMITTED'].finalState).toEqual({ x: 100 });
  });

  it('non-repeatable read is prevented from REPEATABLE READ upward', () => {
    const r = run('non-repeatable');
    expect(r['READ UNCOMMITTED'].anomalies).toEqual(['non-repeatable read']);
    expect(r['READ COMMITTED'].anomalies).toEqual(['non-repeatable read']);
    expect(r['REPEATABLE READ'].anomalies).toEqual([]);
    expect(r.SERIALIZABLE.anomalies).toEqual([]);
    expect(r.SERIALIZABLE.aborted).toEqual([]);
  });

  it('phantom read is prevented by snapshot reads', () => {
    const r = run('phantom');
    expect(r['READ UNCOMMITTED'].anomalies).toEqual(['phantom read']);
    expect(r['READ COMMITTED'].anomalies).toEqual(['phantom read']);
    expect(r['REPEATABLE READ'].anomalies).toEqual([]);
    expect(r.SERIALIZABLE.anomalies).toEqual([]);
    expect(r['REPEATABLE READ'].finalState).toEqual({ a: 10, b: 20, c: 30 });
  });

  it('lost update: overwritten below REPEATABLE READ, the second writer aborts at or above it', () => {
    const r = run('lost-update');
    expect(r['READ COMMITTED'].anomalies).toEqual(['lost update']);
    expect(r['READ COMMITTED'].finalState).toEqual({ x: 120 });
    expect(r['REPEATABLE READ'].anomalies).toEqual([]);
    expect(r['REPEATABLE READ'].aborted).toEqual([2]);
    expect(r['REPEATABLE READ'].finalState).toEqual({ x: 110 });
    expect(r.SERIALIZABLE.aborted).toEqual([2]);
  });

  it('write skew slips through snapshot isolation and is stopped only by SERIALIZABLE', () => {
    const r = run('write-skew');
    expect(r['READ COMMITTED'].anomalies).toEqual(['write skew']);
    expect(r['REPEATABLE READ'].anomalies).toEqual(['write skew']);
    expect(r['REPEATABLE READ'].finalState).toEqual({ alice: 0, bob: 0 });
    expect(r.SERIALIZABLE.anomalies).toEqual([]);
    expect(r.SERIALIZABLE.aborted).toEqual([2]);
    expect(r.SERIALIZABLE.finalState).toEqual({ alice: 0, bob: 1 });
  });

  it('a second writer waits for the row lock and resumes after the first commits', () => {
    const ops = parseIsoSchedule('T1:W(x,1)\nT2:W(x,2)\nT2:C\nT1:C') as IsoOp[];
    const r = simulate({ x: 0 }, ops, 'READ COMMITTED');
    expect(r.log.some((l) => /blocked/.test(l.note ?? ''))).toBe(true);
    expect(r.log.some((l) => l.text === 'T2 resumes')).toBe(true);
    expect(r.finalState).toEqual({ x: 2 });
    expect(r.aborted).toEqual([]);
  });

  it('a transaction that never finishes is rolled back', () => {
    const r = simulate({ x: 0 }, parseIsoSchedule('T1:W(x,9)') as IsoOp[], 'READ COMMITTED');
    expect(r.finalState).toEqual({ x: 0 });
    expect(r.aborted).toEqual([1]);
  });

  it('parses the supported syntax and reports errors', () => {
    expect(parseIsoSchedule('T1:R(x); T2:W(x,5), T1:Q(>=10)\nT2:I(k,7)\nT1:C\nT2:A')).toHaveLength(6);
    expect(typeof parseIsoSchedule('T1:Z(x)')).toBe('string');
    expect(typeof parseIsoSchedule('')).toBe('string');
  });
});
