import { describe, expect, it } from 'vitest';
import { buildDailyPlan } from '@/engine/plan';
import { computeReadiness, weightedReadiness } from '@/engine/readiness';
import { computeTopicMastery } from '@/engine/mastery';
import { emptyState, emptyProblemProgress } from '@/store/store';
import { newCard } from '@/engine/revision';
import { MCQ_BY_ID, PROBLEM_BY_SLUG, SQL_EXERCISE_BY_ID, TOPICS, TOPIC_BY_ID } from '@/content/registry';
import type { PersistedState } from '@/store/types';

const idx = { mcqById: MCQ_BY_ID, problemBySlug: PROBLEM_BY_SLUG, sqlById: SQL_EXERCISE_BY_ID };
const masteryOf = (s: PersistedState) => new Map(TOPICS.map((t) => [t.id, computeTopicMastery(t, s, idx)]));

describe('daily plan', () => {
  it('starts a new learner on the first roadmap topic and suggests a practice problem', () => {
    const s = emptyState();
    const plan = buildDailyPlan({ state: s, topicById: TOPIC_BY_ID, topics: TOPICS, mastery: masteryOf(s), problemBySlug: PROBLEM_BY_SLUG, minutes: 120, now: '2026-10-11' });
    expect(plan[0].kind).toBe('learn');
    expect(plan[0].href).toBe('/learn/dsa/dsa.complexity');
    expect(plan.some((t) => t.kind === 'practice')).toBe(true);
    expect(plan.some((t) => t.kind === 'assessment')).toBe(true);
  });
  it('puts due reviews first and caps them at about 25% of the budget', () => {
    const s = emptyState();
    for (let i = 0; i < 100; i++) {
      const c = newCard('mcq', `dsa.hashing.q${i}`, 'dsa.hashing', '2026-10-01');
      s.reviewCards[c.id] = c;
    }
    const plan = buildDailyPlan({ state: s, topicById: TOPIC_BY_ID, topics: TOPICS, mastery: masteryOf(s), problemBySlug: PROBLEM_BY_SLUG, minutes: 120, now: '2026-10-11' });
    expect(plan[0].kind).toBe('review');
    expect(plan[0].minutes).toBeLessThanOrEqual(30);
  });
  it('targets a weak topic when application evidence is poor', () => {
    const s = emptyState();
    s.topicProgress['dsa.two-pointers'] = { sectionsRead: TOPIC_BY_ID.get('dsa.two-pointers')!.sectionIds, masteryTests: [] };
    const bad = { at: '2026-10-01T00:00:00Z', durationSec: 900, hintsUsed: 4, solutionViewed: true, outcome: 'after-solution' as const, errorCategories: ['pattern-not-identified' as const], timed: false, firstSeen: true };
    for (const slug of ['3sum', 'container-with-most-water', 'valid-palindrome']) s.problemProgress[slug] = { ...emptyProblemProgress(), status: 'solved', attempts: [bad] };
    const plan = buildDailyPlan({ state: s, topicById: TOPIC_BY_ID, topics: TOPICS, mastery: masteryOf(s), problemBySlug: PROBLEM_BY_SLUG, minutes: 120, now: '2026-10-11' });
    const weak = plan.find((t) => t.kind === 'weak');
    expect(weak?.title).toContain('Two Pointers');
    expect(weak?.reason).toMatch(/read this topic/);
  });
});

describe('readiness', () => {
  it('shows "insufficient evidence" (null) for a new learner, never a made-up number', () => {
    const dims = computeReadiness(emptyState(), MCQ_BY_ID, PROBLEM_BY_SLUG);
    expect(dims).toHaveLength(9);
    for (const d of dims) expect(d.score).toBeNull();
    expect(weightedReadiness(dims, { dsa: 1 }).score).toBeNull();
  });
  it('scores DSA from first-attempt outcomes weighted by difficulty', () => {
    const s = emptyState();
    const ok = { at: new Date().toISOString(), durationSec: 600, hintsUsed: 0, solutionViewed: false, outcome: 'independent' as const, errorCategories: [], timed: false, firstSeen: true };
    for (const slug of ['two-sum', 'valid-anagram', '3sum', 'koko-eating-bananas', 'container-with-most-water']) s.problemProgress[slug] = { ...emptyProblemProgress(), status: 'solved', attempts: [ok] };
    const dsa = computeReadiness(s, MCQ_BY_ID, PROBLEM_BY_SLUG).find((d) => d.id === 'dsa')!;
    expect(dsa.score).toBe(100);
    expect(dsa.evidence[0]).toMatch(/5 first-attempt problems/);
    s.problemProgress['two-sum'].attempts[0] = { ...ok, outcome: 'gave-up' };
    const lower = computeReadiness(s, MCQ_BY_ID, PROBLEM_BY_SLUG).find((d) => d.id === 'dsa')!;
    expect(lower.score!).toBeLessThan(100);
  });
  it('labels communication as self-assessed', () => {
    const dims = computeReadiness(emptyState(), MCQ_BY_ID, PROBLEM_BY_SLUG);
    expect(dims.find((d) => d.id === 'communication')?.selfAssessed).toBe(true);
  });
});
