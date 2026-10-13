import { describe, expect, it } from 'vitest';
import { PATTERN_DRILLS } from '../src/content/drills/pattern-drills';
import { TOPIC_META } from '../src/content/index.generated';

const DSA = new Set(TOPIC_META.filter((t) => t.id.startsWith('dsa.')).map((t) => t.id));

describe('pattern recognition drills', () => {
  it('has at least 100 drills with unique ids and unique scenarios', () => {
    expect(PATTERN_DRILLS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(PATTERN_DRILLS.map((d) => d.id)).size).toBe(PATTERN_DRILLS.length);
    expect(new Set(PATTERN_DRILLS.map((d) => d.scenario)).size).toBe(PATTERN_DRILLS.length);
  });
  it('every drill has four distinct DSA topic options including the answer, and a reason', () => {
    for (const d of PATTERN_DRILLS) {
      expect(d.options, d.id).toHaveLength(4);
      expect(new Set(d.options).size, d.id).toBe(4);
      expect(d.options, d.id).toContain(d.answer);
      for (const o of d.options) expect(DSA.has(o), `${d.id}: ${o}`).toBe(true);
      expect(d.why.length, d.id).toBeGreaterThan(10);
    }
  });
  it('covers at least 25 distinct patterns', () => {
    expect(new Set(PATTERN_DRILLS.map((d) => d.answer)).size).toBeGreaterThanOrEqual(25);
  });
});
