import { describe, expect, it } from 'vitest';
import { gradeCard, newCard, dueCards, gradeFromProblemOutcome } from '@/engine/revision';
import { addDays, daysBetween } from '@/engine/dates';
import { compareResults } from '@/engine/sqlCompare';
import { scoreAssessment, isMcqCorrect } from '@/engine/scoring';
import { computeTopicMastery, type ContentIndex } from '@/engine/mastery';
import { emptyState, emptyProblemProgress } from '@/store/store';
import type { MCQ, Problem, TopicMeta } from '@/content/schema';
import type { AssessmentAttempt } from '@/store/types';
import { currentStreak, longestStreak } from '@/engine/stats';

describe('dates', () => {
  it('adds days across month and leap-year boundaries', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2023-12-31', 1)).toBe('2024-01-01');
    expect(daysBetween('2024-01-01', '2024-03-01')).toBe(60);
  });
});

describe('SM-2 revision', () => {
  const day0 = '2026-01-01';
  it('follows 1 → 6 → interval × ease on successful reviews', () => {
    let c = newCard('mcq', 'q1', 't', day0);
    c = gradeCard(c, 5, day0);
    expect(c.intervalDays).toBe(1);
    c = gradeCard(c, 5, c.due);
    expect(c.intervalDays).toBe(6);
    const ease = c.ease;
    const prev = c.intervalDays;
    c = gradeCard(c, 4, c.due);
    expect(c.intervalDays).toBe(Math.round(prev * c.ease));
    expect(c.ease).toBeCloseTo(ease, 5); // grade 4 leaves ease unchanged
  });
  it('resets on a lapse and never drops ease below 1.3', () => {
    let c = newCard('mcq', 'q2', 't', day0);
    for (let i = 0; i < 10; i++) c = gradeCard(c, 0, day0);
    expect(c.reps).toBe(0);
    expect(c.lapses).toBe(10);
    expect(c.intervalDays).toBe(1);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });
  it('caps the interval at 180 days', () => {
    let c = newCard('mcq', 'q3', 't', day0);
    for (let i = 0; i < 30; i++) c = gradeCard(c, 5, c.due);
    expect(c.intervalDays).toBeLessThanOrEqual(180);
  });
  it('orders due cards by forgetting risk (most overdue first)', () => {
    const a = { ...newCard('mcq', 'a', 't', day0), due: '2026-01-02', intervalDays: 10 };
    const b = { ...newCard('mcq', 'b', 't', day0), due: '2026-01-02', intervalDays: 1 };
    const c = { ...newCard('mcq', 'c', 't', day0), due: '2026-02-01', intervalDays: 1 };
    const due = dueCards([a, b, c], '2026-01-10');
    expect(due.map((x) => x.refId)).toEqual(['b', 'a']); // c is not yet due
  });
  it('maps problem outcomes to grades', () => {
    expect(gradeFromProblemOutcome('independent', 0)).toBe(5);
    expect(gradeFromProblemOutcome('with-hints', 1)).toBe(4);
    expect(gradeFromProblemOutcome('with-hints', 4)).toBe(3);
    expect(gradeFromProblemOutcome('after-solution', 4)).toBe(2);
    expect(gradeFromProblemOutcome('gave-up', 0)).toBe(0);
  });
});

describe('SQL result comparison', () => {
  const exp = { columns: ['a', 'b'], rows: [[1, 'x'], [2, null]] };
  it('ignores row order unless required', () => {
    expect(compareResults(exp, { columns: ['p', 'q'], rows: [[2, null], [1, 'x']] }, { orderMatters: false }).equal).toBe(true);
    const r = compareResults(exp, { columns: ['a', 'b'], rows: [[2, null], [1, 'x']] }, { orderMatters: true });
    expect(r.equal).toBe(false);
    expect(r.reason).toMatch(/wrong order/);
  });
  it('treats duplicates as a multiset', () => {
    expect(compareResults({ columns: ['a'], rows: [[1], [1]] }, { columns: ['a'], rows: [[1]] }, { orderMatters: false }).equal).toBe(false);
  });
  it('distinguishes NULL from 0 and the string "NULL"', () => {
    expect(compareResults({ columns: ['a'], rows: [[null]] }, { columns: ['a'], rows: [[0]] }, { orderMatters: false }).equal).toBe(false);
    expect(compareResults({ columns: ['a'], rows: [[null]] }, { columns: ['a'], rows: [['NULL']] }, { orderMatters: false }).equal).toBe(false);
  });
  it('compares numbers with tolerance and numeric strings as numbers', () => {
    expect(compareResults({ columns: ['a'], rows: [[0.3]] }, { columns: ['a'], rows: [[0.1 + 0.2]] }, { orderMatters: false }).equal).toBe(true);
    expect(compareResults({ columns: ['a'], rows: [[150000]] }, { columns: ['a'], rows: [['150000.0']] }, { orderMatters: false }).equal).toBe(true);
  });
  it('rejects a different column count', () => {
    expect(compareResults(exp, { columns: ['a'], rows: [[1], [2]] }, { orderMatters: false }).equal).toBe(false);
  });
});

const mcq = (id: string, correct: string[], topic = 't1'): MCQ => ({
  id, topicIds: [topic], moduleId: 'dsa', type: 'concept', difficulty: 'easy', stemMd: '', options: ['a', 'b', 'c', 'd'].map((o) => ({ id: o, textMd: o })),
  correct, explanationMd: '', provenance: { kind: 'original' },
});

describe('assessment scoring', () => {
  it('scores single and multi-select exactly and excludes self-reported coding', () => {
    const m = new Map([['q1', mcq('q1', ['a'])], ['q2', mcq('q2', ['a', 'c'])], ['q3', mcq('q3', ['b'])]]);
    expect(isMcqCorrect(m.get('q2')!, ['c', 'a'])).toBe(true);
    expect(isMcqCorrect(m.get('q2')!, ['a'])).toBe(false);
    const attempt: AssessmentAttempt = {
      id: 'x', config: { title: '', preset: '', durationMin: 10, modules: [], topicIds: [], difficulty: 'mixed', count: 5 },
      items: [
        { id: 'i1', kind: 'mcq', refId: 'q1', topicId: 't1', difficulty: 'easy' },
        { id: 'i2', kind: 'mcq', refId: 'q2', topicId: 't1', difficulty: 'medium' },
        { id: 'i3', kind: 'mcq', refId: 'q3', topicId: 't2', difficulty: 'easy' },
        { id: 'i4', kind: 'sql', refId: 's', topicId: 't2', difficulty: 'hard' },
        { id: 'i5', kind: 'coding', refId: 'p', topicId: 't3', difficulty: 'medium' },
      ],
      startedAt: '2026-01-01T00:00:00Z', endsAt: '2026-01-01T00:10:00Z', submittedAt: '2026-01-01T00:05:00Z',
      answers: { i1: { selected: ['a'] }, i2: { selected: ['a'] }, i4: { sql: 'select 1', sqlPassed: true }, i5: { selfReport: 'solved' } },
      marked: [], timePerItem: {}, current: 0,
    };
    const r = scoreAssessment(attempt, m);
    expect(r.score).toBe(2);           // i1 and i4
    expect(r.autoTotal).toBe(4);       // coding excluded
    expect(r.accuracyPct).toBe(50);
    expect(r.attempted).toBe(4);       // i3 unanswered
    expect(r.selfReported).toEqual({ solved: 1, total: 1 });
    expect(r.byTopic.t1).toEqual({ correct: 1, total: 2 });
    expect(r.byDifficulty.hard).toEqual({ correct: 1, total: 1 });
    expect(r.durationSec).toBe(300);
  });
});

describe('mastery', () => {
  const topic: TopicMeta = {
    id: 't1', moduleId: 'dsa', title: 'T', summary: '', level: 'core', status: 'complete', estMinutes: 10, prerequisites: [], related: [], objectives: [],
    sectionIds: ['s1', 's2'], counts: { interviewQuestions: 0, flashcards: 0 },
    mcqIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'], problemIds: ['p1', 'p2'],
    mastery: { testSize: 4, testMinutes: 5, passPct: 80, minIndependentSolves: 1, minMediumIndependent: 1, retentionDays: 7 },
  };
  const prob = (slug: string, d: Problem['difficulty']): Problem => ({ slug, leetcodeId: 1, title: slug, difficulty: d, premium: false, url: '', lists: [], topicIds: ['t1'], primaryTopicId: 't1', patterns: [], estMinutes: 10 });
  const idx: ContentIndex = { mcqById: new Map(), problemBySlug: new Map([['p1', prob('p1', 'easy')], ['p2', prob('p2', 'medium')]]), sqlById: new Map() };

  it('reports no mastery number without enough evidence, even when fully read', () => {
    const s = emptyState();
    s.topicProgress.t1 = { sectionsRead: ['s1', 's2'], masteryTests: [] };
    const m = computeTopicMastery(topic, s, idx);
    expect(m.completionPct).toBe(100);
    expect(m.masteryPct).toBeNull();
    expect(m.level).toBe('learning');
  });

  it('separates completion from mastery and flags "studied but cannot apply"', () => {
    const s = emptyState();
    s.topicProgress.t1 = { sectionsRead: ['s1', 's2'], masteryTests: [] };
    const fail = { at: '2026-01-01T00:00:00Z', durationSec: 600, hintsUsed: 4, solutionViewed: true, outcome: 'after-solution' as const, errorCategories: [], timed: false, firstSeen: true };
    s.problemProgress.p1 = { ...emptyProblemProgress(), attempts: [fail, { ...fail, at: '2026-01-02T00:00:00Z', firstSeen: false }] };
    s.problemProgress.p2 = { ...emptyProblemProgress(), attempts: [{ ...fail, outcome: 'gave-up' }] };
    const m = computeTopicMastery(topic, s, idx);
    expect(m.studiedButCannotApply).toBe(true);
    expect(m.application.score).toBeLessThan(0.4);
  });

  it('weights first-seen MCQs and independent solves into a mastery number', () => {
    const s = emptyState();
    s.mcqAttempts = ['q1', 'q2', 'q3', 'q4'].map((id) => ({ mcqId: id, at: '2026-01-01T00:00:00Z', selected: ['a'], correct: true, timeSec: 10, context: 'practice' as const, firstSeen: true }));
    s.problemProgress.p2 = { ...emptyProblemProgress(), attempts: [{ at: '2026-01-01T00:00:00Z', durationSec: 600, hintsUsed: 0, solutionViewed: false, outcome: 'independent', errorCategories: [], timed: false, firstSeen: true }] };
    const m = computeTopicMastery(topic, s, idx);
    expect(m.evidenceCount).toBe(5);
    expect(m.masteryPct).not.toBeNull();
    expect(m.masteryPct!).toBeGreaterThan(80);
    expect(m.level).toBe('proficient');   // not interview-ready: no mastery test, no retention
  });
});

describe('streaks', () => {
  it('counts consecutive active days ending today or yesterday', () => {
    const s = emptyState();
    s.activity = { '2026-01-01': { actions: 1, minutes: 0 }, '2026-01-02': { actions: 2, minutes: 0 }, '2026-01-04': { actions: 1, minutes: 0 } };
    expect(currentStreak(s, '2026-01-04')).toBe(1);
    expect(currentStreak(s, '2026-01-03')).toBe(2);
    expect(longestStreak(s)).toBe(2);
  });
});
