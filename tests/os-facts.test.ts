// Cross-checks numeric claims in OS MCQs with the scheduling and paging simulators.
import { describe, expect, it } from 'vitest';
import { schedule } from '@/engine/tools/scheduling';
import { simulatePaging } from '@/engine/tools/paging';

describe('OS MCQ facts', () => {
  const three = [{ id: 'P1', arrival: 0, burst: 24 }, { id: 'P2', arrival: 0, burst: 3 }, { id: 'P3', arrival: 0, burst: 3 }];
  it('os.cs.q1: FCFS average waiting 17', () => expect(schedule(three, 'fcfs').avgWaiting).toBe(17));
  it('os.cs.q2: RR q=4 average waiting ≈ 5.67', () => expect(schedule(three, 'rr', 4).avgWaiting).toBeCloseTo(5.67, 2));
  const four = [{ id: 'P1', arrival: 0, burst: 8 }, { id: 'P2', arrival: 1, burst: 4 }, { id: 'P3', arrival: 2, burst: 9 }, { id: 'P4', arrival: 3, burst: 5 }];
  it('os.cs.q3: SRTF 6.5, SJF 7.75, FCFS 8.75 (distractors)', () => {
    expect(schedule(four, 'srtf').avgWaiting).toBe(6.5);
    expect(schedule(four, 'sjf').avgWaiting).toBe(7.75);
    expect(schedule(four, 'fcfs').avgWaiting).toBe(8.75);
  });
  const ref = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
  it('os.pr.q1: LRU 12 (FIFO 15, OPT 9)', () => {
    expect(simulatePaging(ref, 3, 'lru').faults).toBe(12);
    expect(simulatePaging(ref, 3, 'fifo').faults).toBe(15);
    expect(simulatePaging(ref, 3, 'optimal').faults).toBe(9);
  });
  it('os.pr.q4: FIFO 1 2 3 1 4 5 with 3 frames = 5 faults', () => expect(simulatePaging([1, 2, 3, 1, 4, 5], 3, 'fifo').faults).toBe(5));
  it("os.pr.q6: Belady 9 vs 10", () => {
    const b = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
    expect(simulatePaging(b, 3, 'fifo').faults).toBe(9);
    expect(simulatePaging(b, 4, 'fifo').faults).toBe(10);
  });
  it('os.vm.q2: EAT = 120 ns', () => expect(0.9 * (10 + 100) + 0.1 * (10 + 200)).toBeCloseTo(120, 6));
  it('os.vm.q5: 4 MB page table', () => expect((2 ** 32 / 2 ** 12) * 4).toBe(4 * 1024 * 1024));
});
