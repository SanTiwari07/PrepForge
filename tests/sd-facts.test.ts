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
