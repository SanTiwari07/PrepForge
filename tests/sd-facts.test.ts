// Cross-checks numeric claims in System Design MCQs.
import { describe, expect, it } from 'vitest';

describe('System Design MCQ facts', () => {
  it('sd.es.q1: 1e9/day ≈ 11,574 QPS', () => expect(Math.round(1e9 / 86400)).toBe(11574));
  it('sd.es.q2: 100M × 500 B × 60 months = 3 TB', () => expect((1e8 * 500 * 60) / 1e12).toBe(3));
  it('sd.es.q3: 62^7 ≈ 3.52e12', () => expect(62 ** 7).toBe(3521614606208));
  it('sd.es.q6: 900 GB × 3 = 2.7 TB', () => expect(900 * 3).toBe(2700));
  it('sd.ur: 1e8 writes per month ≈ 39 writes/s', () => expect(Math.round(1e8 / (30 * 86400))).toBe(39));
  it('sd.rs.q1: only W=2,R=2 satisfies R+W>N for N=3', () => {
    const ok = ([w, r]: number[]) => w + r > 3;
    expect([[2, 2], [1, 1], [1, 2], [2, 1]].map(ok)).toEqual([true, false, false, false]);
  });
  it('sd.rs.q2: hash%10 → hash%11 moves ~90% of keys', () => {
    let moved = 0;
    for (let h = 0; h < 110000; h++) if (h % 10 !== h % 11) moved++;
    expect(moved / 110000).toBeCloseTo(10 / 11, 6);
  });
  it('sd.rl.q1: token bucket (cap 10, 1/s) allows 10 of 15 after idling', () => {
    // Mirrors the TokenBucket in the Rate Limiting lesson.
    let tokens = 10, last = 0;
    const allow = (now: number) => { tokens = Math.min(10, tokens + (now - last) * 1); last = now; if (tokens >= 1) { tokens -= 1; return true; } return false; };
    let allowed = 0;
    for (let i = 0; i < 15; i++) if (allow(60)) allowed++;
    expect(allowed).toBe(10);
  });
});

import { MCQ_BY_ID } from '@/content/all';
const answerOf = (id: string): string => {
  const m = MCQ_BY_ID.get(id);
  if (!m) throw new Error(`no MCQ ${id}`);
  return m.options.find((o) => o.id === m.correct[0])!.textMd;
};

describe('System Design foundations: availability, latency and distributed systems facts', () => {
  const YEAR_H = 8760;
  it('sd.lt: downtime per year for the nines', () => {
    expect(YEAR_H * 0.001).toBeCloseTo(8.76, 2);
    expect(YEAR_H * 60 * 0.0001).toBeCloseTo(52.56, 2);
    expect(YEAR_H * 60 * 0.00001).toBeCloseTo(5.256, 3);
    expect(30 * 24 * 60 * 0.001).toBeCloseTo(43.2, 6);
    expect(answerOf('sd.lt.q1')).toBe('About 8.76 hours');
  });
  it('sd.lt.q2/q7: series multiplies, parallel improves', () => {
    expect(0.999 * 0.999).toBeCloseTo(0.998001, 6);
    expect(1 - 0.001 ** 2).toBeCloseTo(0.999999, 9);
    expect(0.999 ** 10).toBeCloseTo(0.99, 2);
  });
  it('sd.lt.q3: Little’s law 2000 req/s × 50 ms = 100', () => {
    expect(2000 * 0.05).toBe(100);
    expect(1000 * 0.2).toBe(200);
    expect(answerOf('sd.lt.q3')).toBe('100');
  });
  it('sd.lt.q5: 100 parallel calls at 1% slow each → ~63%', () => {
    expect(1 - 0.99 ** 100).toBeCloseTo(0.634, 3);
    expect(answerOf('sd.lt.q5')).toBe('About 63%');
  });
  it('sd.au.q6: 62^8 ≈ 2.2e14 and ~6 hours at 1e10 guesses/s', () => {
    expect(62 ** 8).toBeCloseTo(2.18e14, -12);
    expect(62 ** 8 / 1e10 / 3600).toBeCloseTo(6.06, 1);
  });
  it('sd.ob.q3: burn rate 1% / 0.1% = 10x; 720 h / 10 = 72 h; 14.4x burns 2% of the budget per hour', () => {
    expect(0.01 / (1 - 0.999)).toBeCloseTo(10, 6);
    expect(720 / 10).toBe(72);
    expect((14.4 / 720) * 100).toBeCloseTo(2, 6);
  });
  it('sd.ft.q2: retry amplification 3 layers × 3 attempts = 27', () => {
    expect(3 ** 3).toBe(27);
    expect(answerOf('sd.ft.q2')).toBe('27');
  });
  it('sd.df: majority quorums and Lamport receive rule', () => {
    const majority = (n: number) => Math.floor(n / 2) + 1;
    const tolerated = (n: number) => n - majority(n);
    expect([3, 4, 5, 7].map(tolerated)).toEqual([1, 1, 2, 3]);
    expect(answerOf('sd.df.q1')).toBe('2');
    expect(Math.max(2, 5) + 1).toBe(6);
    expect(answerOf('sd.df.q3')).toBe('6');
  });
  it('sd.ms.q4: 6 partitions, 8 consumers → 6 active', () => expect(Math.min(6, 8)).toBe(6));
});

describe('System Design case study facts', () => {
  it('sd.crl.q1: sliding window counter 80 × 0.75 + 30 = 90', () => {
    expect(80 * (1 - 0.25) + 30).toBe(90);
    expect(answerOf('sd.crl.q1')).toBe('90');
  });
  it('sd.pb: 1M × 10 KB/day ≈ 18.25 TB over 5 years; 12 writes/s, ~58 reads/s; 62^8', () => {
    expect((1e6 * 10e3 * 365 * 5) / 1e12).toBeCloseTo(18.25, 2);
    expect(1e6 / 86400).toBeCloseTo(11.57, 2);
    expect((5 * 1e6) / 86400).toBeCloseTo(57.9, 1);
    expect(answerOf('sd.pb.q1')).toBe('About 18 TB');
  });
  it('sd.nt.q1: 50M in 10 minutes ≈ 83k/s; 100M/day ≈ 1.16k/s', () => {
    expect(Math.round(50e6 / 600)).toBe(83333);
    expect(Math.round(100e6 / 86400)).toBe(1157);
  });
  it('sd.fsv: 1 GB / 4 MB = 256 chunks; 256 × 32 B = 8 KB of hashes', () => {
    expect(1024 / 4).toBe(256);
    expect(256 * 32).toBe(8192);
    expect(answerOf('sd.fsv.q1')).toBe('256');
  });
  it('sd.ch: 2e9 msgs/day ≈ 23k/s; 200 GB/day ≈ 73 TB/yr; 10M / 50k = 200 gateways', () => {
    expect(Math.round((50e6 * 40) / 86400)).toBe(23148);
    expect((2e9 * 100) / 1e9).toBe(200);
    expect((200 * 365) / 1000).toBeCloseTo(73, 0);
    expect(1e7 / 5e4).toBe(200);
    expect(answerOf('sd.ch.q2')).toBe('200');
  });
  it('sd.nf: 17k feed reads/s, 231k timeline inserts/s, 500 s for a 50M-follower post at 100k/s', () => {
    expect(Math.round((300e6 * 5) / 86400)).toBe(17361);
    expect(Math.round((100e6 * 200) / 86400)).toBe(231481);
    expect(50e6 / 100e3).toBe(500);
    expect(answerOf('sd.nf.q3')).toBe('About 500 seconds (over 8 minutes)');
    expect((300e6 * 800 * 8) / 1e12).toBeCloseTo(1.92, 2);
  });
  it('sd.ag.q2: 99.99% × 99.9% ≈ 99.89%', () => expect(0.9999 * 0.999).toBeCloseTo(0.9989, 4));
  it('sd.lg: 1e6 lines/s × 300 B ≈ 26 TB/day', () => {
    expect((1e6 * 300 * 86400) / 1e12).toBeCloseTo(25.92, 2);
    expect(answerOf('sd.lg.q1')).toBe('About 26 TB');
  });
  it('sd.vd: 5 Mbit/s ≈ 2.25 GB/hour; 1M viewers = 5 Tbit/s; 10 min / 4 s = 150 segments', () => {
    expect(((5e6 / 8) * 3600) / 1e9).toBeCloseTo(2.25, 2);
    expect(1e6 * 5e6).toBe(5e12);
    expect(600 / 4).toBe(150);
    expect(answerOf('sd.vd.q1')).toBe('5 Tbit/s');
  });
});
