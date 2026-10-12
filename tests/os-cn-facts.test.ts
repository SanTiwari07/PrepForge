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

import { prefixForHosts, subnetInfo, type SubnetInfo } from '@/engine/tools/subnet';
describe('CN subnetting MCQ facts', () => {
  const s = (c: string) => subnetInfo(c) as SubnetInfo;
  it('cn.ip.q1: 192.168.10.77/26 network .64, broadcast .127', () => {
    expect(s('192.168.10.77/26').network).toBe('192.168.10.64');
    expect(s('192.168.10.77/26').broadcast).toBe('192.168.10.127');
  });
  it('cn.ip.q2: /27 has 30 usable hosts', () => expect(s('10.0.0.0/27').usableHosts).toBe(30));
  it('cn.ip.q3: 50 hosts need /26', () => expect(prefixForHosts(50)).toBe(26));
  it('cn.ip.q4: 172.32.1.1 is not private, 172.20.5.5 is', () => {
    expect(s('172.32.1.1/32').isPrivate).toBe(false);
    expect(s('172.20.5.5/32').isPrivate).toBe(true);
  });
  it('cn.ip.q5: /20 mask is 255.255.240.0', () => expect(s('10.0.0.0/20').mask).toBe('255.255.240.0'));
  it('flashcard: 100 hosts need /25', () => expect(prefixForHosts(100)).toBe(25));
});

import { MCQ_BY_ID } from '@/content/all';
/** Text of the option marked correct, so tests check the answer the learner is actually graded on. */
function answerOf(id: string): string {
  const m = MCQ_BY_ID.get(id);
  if (!m) throw new Error(`no MCQ ${id}`);
  return m.options.find((o) => o.id === m.correct[0])!.textMd;
}

describe('CN routing, flow and congestion MCQ facts', () => {
  const ip = (a: string) => a.split('.').reduce((n, o) => n * 256 + Number(o), 0);
  const table: [string, number, string][] = [['10.0.0.0', 8, 'A'], ['10.1.0.0', 16, 'B'], ['10.1.2.0', 24, 'C'], ['0.0.0.0', 0, 'D']];
  /** Longest-prefix match computed independently of the lesson text. */
  const lpm = (dst: string) => table
    .filter(([net, len]) => len === 0 || Math.floor(ip(dst) / 2 ** (32 - len)) === Math.floor(ip(net) / 2 ** (32 - len)))
    .sort((a, b) => b[1] - a[1])[0][2];
  it('cn.rt.q1 / q2 and the worked example', () => {
    expect(lpm('10.1.2.5')).toBe('C');
    expect(answerOf('cn.rt.q1')).toBe('C');
    expect(lpm('10.1.9.9')).toBe('B');
    expect(answerOf('cn.rt.q2')).toBe('B');
    expect(lpm('10.200.0.1')).toBe('A');
    expect(lpm('8.8.8.8')).toBe('D');
  });

  /** Textbook cwnd per round (MSS): slow start doubles up to ssthresh, then +1; a timeout halves ssthresh and resets cwnd to 1. */
  function cwndTrace(rounds: number, ssthresh: number, timeoutAfterRound?: number): number[] {
    const out: number[] = [];
    let cwnd = 1;
    for (let r = 1; r <= rounds; r++) {
      out.push(cwnd);
      if (r === timeoutAfterRound) { ssthresh = Math.floor(cwnd / 2); cwnd = 1; continue; }
      cwnd = cwnd < ssthresh ? Math.min(cwnd * 2, ssthresh) : cwnd + 1;
    }
    return out;
  }
  it('cn.fc.q2: 6th round is 17 MSS; lesson trace with a timeout in round 9', () => {
    expect(cwndTrace(6, 16)[5]).toBe(17);
    expect(answerOf('cn.fc.q2')).toBe('17 MSS');
    expect(cwndTrace(15, 16, 9)).toEqual([1, 2, 4, 8, 16, 17, 18, 19, 20, 1, 2, 4, 8, 10, 11]);
  });
  it('cn.fc.q1: 65,535-byte window / 100 ms ≈ 5.24 Mbit/s', () => {
    expect((65535 * 8) / 0.1 / 1e6).toBeCloseTo(5.24, 2);
    expect(answerOf('cn.fc.q1')).toContain('5.24');
  });
  it('cn.fc.q6: BDP of 1 Gbit/s × 50 ms = 6.25 MB', () => {
    expect((1e9 * 0.05) / 8 / 1e6).toBe(6.25);
    expect(answerOf('cn.fc.q6')).toBe('6.25 MB');
  });
});

describe('CN application-layer MCQ facts', () => {
  it('cn.pl.q4: hash mod 3 → mod 4 keeps 3 of 12 keys (25%); in general 1/(N+1)', () => {
    const stay = (n: number, m: number, keys: number) => Array.from({ length: keys }, (_, k) => k).filter((k) => k % n === k % m).length;
    expect(stay(3, 4, 12)).toBe(3);
    expect(stay(3, 4, 12000) / 12000).toBeCloseTo(0.25, 6);
    expect(stay(9, 10, 90000) / 90000).toBeCloseTo(0.1, 6);
    expect(answerOf('cn.pl.q4')).toBe('3 of 12 (25%)');
  });
  it('cn.tr.q4: differences of cumulative curl timings', () => {
    const t = { dns: 0.012, connect: 0.045, tls: 0.110, ttfb: 2.350, total: 2.400 };
    expect(t.tls - t.connect).toBeCloseTo(0.065, 6);
    expect(t.ttfb - t.tls).toBeCloseTo(2.24, 6);
    expect(t.total - t.ttfb).toBeCloseTo(0.05, 6);
    expect(answerOf('cn.tr.q4')).toContain('2.2 s');
  });
});
