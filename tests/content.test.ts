// Content integrity validator (what_to_do.md Section 11). Runs in `npm test`.
import { describe, expect, it } from 'vitest';
import { MCQS, PROBLEMS, PROBLEM_BY_SLUG, TOPICS, TOPIC_BY_ID, WALKTHROUGHS, SQL_EXERCISES } from '@/content/all';
import { CATALOG } from '@/content/catalog';
import { COMPANIES } from '@/content/companies';

describe('topics', () => {
  it('have unique ids and valid prerequisites', () => {
    const ids = Object.values(CATALOG).flat().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TOPICS) for (const p of t.prerequisites) expect(TOPIC_BY_ID.has(p), `${t.id} → ${p}`).toBe(true);
  });
  it('marked complete meet the minimum content standard', () => {
    for (const t of TOPICS.filter((x) => x.status === 'complete')) {
      expect(t.objectives.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.sections.length, t.id).toBeGreaterThanOrEqual(4);
      expect(t.mcqIds.length, `${t.id} MCQs`).toBeGreaterThanOrEqual(6);
      expect(t.interviewQuestions.length, `${t.id} interview Qs`).toBeGreaterThanOrEqual(4);
      expect(t.revision.flashcards.length, `${t.id} flashcards`).toBeGreaterThanOrEqual(5);
      expect(t.revision.notesMd.length, t.id).toBeGreaterThan(50);
      expect(t.resources.length, `${t.id} resources`).toBeGreaterThanOrEqual(2);
      if (t.moduleId === 'dsa' && t.id !== 'dsa.complexity') expect(t.problemIds.length, `${t.id} problems`).toBeGreaterThanOrEqual(6);
      const sectionIds = t.sections.map((s) => s.id);
      expect(new Set(sectionIds).size, t.id).toBe(sectionIds.length);
    }
  });
  it('planned topics are not presented with lesson content', () => {
    for (const t of TOPICS.filter((x) => x.status === 'planned')) expect(t.sections.length, t.id).toBe(0);
  });
});

describe('MCQs', () => {
  it('have unique ids, valid answers, explanations and existing topics', () => {
    const ids = MCQS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MCQS) {
      const opts = m.options.map((o) => o.id);
      expect(m.options.length, m.id).toBeGreaterThanOrEqual(2);
      expect(m.correct.length, m.id).toBeGreaterThanOrEqual(1);
      for (const c of m.correct) expect(opts, m.id).toContain(c);
      expect(m.explanationMd.length, m.id).toBeGreaterThan(20);
      for (const t of m.topicIds) expect(TOPIC_BY_ID.has(t), `${m.id} → ${t}`).toBe(true);
    }
  });
  it('code-output questions marked "compiled" include code', () => {
    for (const m of MCQS.filter((x) => x.verified === 'compiled')) expect(m.code, m.id).toBeDefined();
  });
});

describe('problems and walkthroughs', () => {
  it('are canonical (one record per slug) with valid topics', () => {
    expect(new Set(PROBLEMS.map((p) => p.slug)).size).toBe(PROBLEMS.length);
    for (const p of PROBLEMS) {
      expect(p.url).toBe(`https://leetcode.com/problems/${p.slug}/`);
      for (const t of p.topicIds) expect(TOPIC_BY_ID.has(t), `${p.slug} → ${t}`).toBe(true);
    }
  });
  it('walkthroughs refer to bank problems and have 4 hints and code in both languages', () => {
    for (const [slug, w] of Object.entries(WALKTHROUGHS)) {
      expect(PROBLEM_BY_SLUG.has(slug), slug).toBe(true);
      expect(w.hints.length).toBe(4);
      expect(w.code.map((c) => c.lang).sort(), slug).toEqual(['cpp', 'java']);
      expect(w.testCases.length, slug).toBeGreaterThanOrEqual(2);
    }
  });
  it('SQL exercises map to existing SQL topics', () => {
    for (const e of SQL_EXERCISES) for (const t of e.topicIds) expect(TOPIC_BY_ID.get(t)?.moduleId, `${e.id} → ${t}`).toBe('sql');
  });
});

describe('companies', () => {
  it('state facts only with a source URL and verification date', () => {
    for (const c of COMPANIES) {
      for (const f of c.facts) {
        expect(f.url, c.id).toMatch(/^https:\/\//);
        expect(f.verifiedOn, c.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      for (const t of c.recommendation.focusTopics) expect(TOPIC_BY_ID.has(t), `${c.id} → ${t}`).toBe(true);
    }
  });
  it('never claim compensation or question frequency', () => {
    const text = JSON.stringify(COMPANIES).toLowerCase();
    for (const banned of ['lpa', 'salary of', 'frequently asked at', 'asked at google', 'guarantee']) expect(text).not.toContain(banned);
  });
});
