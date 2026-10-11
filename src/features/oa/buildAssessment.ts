import type { ModuleId } from '@/content/schema';
import { MCQS, PROBLEMS, SQL_EXERCISES } from '@/content/registry';
import type { AssessmentAttempt, AssessmentConfig, AssessmentItem, PersistedState } from '@/store/types';
import type { TopicMastery } from '@/engine/mastery';

export interface BuildSpec {
  title: string;
  preset: string;
  durationMin: number;
  modules: ModuleId[];
  difficulty: 'mixed' | 'easy' | 'medium' | 'hard';
  mcqCount: number;
  sqlCount: number;
  codingCount: number;
}

function shuffle<T>(a: T[], rnd: () => number = Math.random): T[] {
  return a.map((x) => [rnd(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
}

/**
 * Smart selection: about 20% previously incorrect, 60% from weak topics, and the rest unseen.
 * Falls back to any remaining items so the requested count is met when possible.
 */
function pick<T extends { id: string; topic: string }>(pool: T[], count: number, wrong: Set<string>, seen: Set<string>, weakTopics: Set<string>): T[] {
  if (count <= 0 || pool.length === 0) return [];
  const chosen = new Map<string, T>();
  const take = (arr: T[], n: number) => { for (const x of shuffle(arr)) { if (chosen.size >= count || n <= 0) break; if (!chosen.has(x.id)) { chosen.set(x.id, x); n--; } } };
  take(pool.filter((x) => wrong.has(x.id)), Math.round(count * 0.2));
  take(pool.filter((x) => weakTopics.has(x.topic)), Math.round(count * 0.6));
  take(pool.filter((x) => !seen.has(x.id)), count);
  take(pool, count);
  return [...chosen.values()];
}

export function buildAssessment(spec: BuildSpec, s: PersistedState, mastery: Map<string, TopicMastery>): AssessmentAttempt {
  const weakTopics = new Set([...mastery].filter(([, m]) => m.studiedButCannotApply || (m.masteryPct !== null && m.masteryPct < 60)).map(([id]) => id));
  const lastCorrect = new Map<string, boolean>();
  for (const a of s.mcqAttempts) lastCorrect.set(a.mcqId, a.correct);
  for (const a of s.sqlAttempts) lastCorrect.set(a.exerciseId, a.passedAll);
  const wrong = new Set([...lastCorrect].filter(([, c]) => !c).map(([id]) => id));
  const seen = new Set([...lastCorrect.keys(), ...Object.keys(s.problemProgress).filter((k) => s.problemProgress[k].attempts.length)]);
  const diffOk = (d: string) => spec.difficulty === 'mixed' || d === spec.difficulty;

  const mcqPool = MCQS.filter((q) => spec.modules.includes(q.moduleId) && diffOk(q.difficulty)).map((q) => ({ id: q.id, topic: q.topicIds[0], difficulty: q.difficulty }));
  const sqlPool = spec.modules.includes('sql') ? SQL_EXERCISES.filter((e) => diffOk(e.difficulty)).map((e) => ({ id: e.id, topic: e.topicIds[0], difficulty: e.difficulty })) : [];
  // Mixed coding rounds use medium/hard problems, like real OAs; an explicit difficulty is respected.
  const codingPool = PROBLEMS
    .filter((p) => !p.premium && (spec.difficulty === 'mixed' ? p.difficulty !== 'easy' : p.difficulty === spec.difficulty))
    .map((p) => ({ id: p.slug, topic: p.primaryTopicId, difficulty: p.difficulty }));

  const items: AssessmentItem[] = [
    ...pick(mcqPool, spec.mcqCount, wrong, seen, weakTopics).map((x, i) => ({ id: `m${i}`, kind: 'mcq' as const, refId: x.id, topicId: x.topic, difficulty: x.difficulty })),
    ...pick(sqlPool, spec.sqlCount, wrong, seen, weakTopics).map((x, i) => ({ id: `s${i}`, kind: 'sql' as const, refId: x.id, topicId: x.topic, difficulty: x.difficulty })),
    ...pick(codingPool.filter((x) => !seen.has(x.id)).length >= spec.codingCount ? codingPool.filter((x) => !seen.has(x.id)) : codingPool, spec.codingCount, new Set(), new Set(), weakTopics)
      .map((x, i) => ({ id: `c${i}`, kind: 'coding' as const, refId: x.id, topicId: x.topic, difficulty: x.difficulty })),
  ];

  const now = new Date();
  const config: AssessmentConfig = { title: spec.title, preset: spec.preset, durationMin: spec.durationMin, modules: spec.modules, topicIds: [], difficulty: spec.difficulty, count: items.length };
  return {
    id: `oa-${now.getTime().toString(36)}`,
    config,
    items,
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + spec.durationMin * 60_000).toISOString(),
    answers: {},
    marked: [],
    timePerItem: {},
    current: 0,
  };
}

export const PRESETS: (BuildSpec & { description: string })[] = [
  { preset: 'dsa-mcq', title: 'DSA concepts sprint', description: 'Complexity, pattern recognition, code output and edge cases.', durationMin: 20, modules: ['dsa'], difficulty: 'mixed', mcqCount: 15, sqlCount: 0, codingCount: 0 },
  { preset: 'sql-set', title: 'Timed SQL set', description: 'Four auto-graded SQL queries, checked by real execution on hidden data.', durationMin: 40, modules: ['sql'], difficulty: 'mixed', mcqCount: 0, sqlCount: 4, codingCount: 0 },
  { preset: 'mixed', title: 'Mixed OA', description: 'MCQs, SQL queries and one coding problem, like a typical mixed online assessment.', durationMin: 60, modules: ['dsa', 'sql', 'dbms', 'oop-cpp', 'oop-java', 'cn', 'os'], difficulty: 'mixed', mcqCount: 10, sqlCount: 2, codingCount: 1 },
  { preset: 'coding-2', title: 'Two-problem coding round (practice simulation)', description: 'Two unseen medium/hard problems in 70 minutes, solved on LeetCode and self-reported. Practice format only, not a real company assessment.', durationMin: 70, modules: ['dsa'], difficulty: 'mixed', mcqCount: 0, sqlCount: 0, codingCount: 2 },
  { preset: 'core-cs', title: 'Core CS MCQs', description: 'OOP, DBMS, OS and networks fundamentals.', durationMin: 20, modules: ['oop-cpp', 'oop-java', 'dbms', 'os', 'cn', 'core-cs', 'system-design', 'devops'], difficulty: 'mixed', mcqCount: 15, sqlCount: 0, codingCount: 0 },
];
