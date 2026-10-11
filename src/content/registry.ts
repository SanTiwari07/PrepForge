import type { CoachWalkthrough, MCQ, MasteryCriteria, Module, ModuleId, Problem, SqlDataset, SqlExercise, Topic } from './schema';
import { CATALOG, MODULES } from './catalog';
import { PROBLEMS } from './problems/bank.generated';
import * as dsa from './dsa';
import * as sql from './sql';
import * as dbms from './dbms';
import * as oopCpp from './oop-cpp';
import * as oopJava from './oop-java';
import * as cn from './cn';
import * as os from './os';
import * as sd from './system-design';
import * as devops from './devops';
import * as coreCs from './core-cs';

export const DEFAULT_MASTERY: MasteryCriteria = {
  testSize: 8,
  testMinutes: 12,
  passPct: 80,
  minIndependentSolves: 3,
  minMediumIndependent: 1,
  retentionDays: 7,
};

interface ContentPack {
  topics: Topic[];
  mcqs: MCQ[];
  walkthroughs?: Record<string, CoachWalkthrough>;
}

const PACKS: ContentPack[] = [dsa, sql, dbms, oopCpp, oopJava, cn, os, sd, devops, coreCs];

const fullTopics = new Map<string, Topic>();
for (const p of PACKS) for (const t of p.topics) fullTopics.set(t.id, t);

export const MCQS: MCQ[] = PACKS.flatMap((p) => p.mcqs);
export const MCQ_BY_ID = new Map(MCQS.map((m) => [m.id, m]));

export const WALKTHROUGHS: Record<string, CoachWalkthrough> = Object.assign({}, ...PACKS.map((p) => p.walkthroughs ?? {}));

export const PROBLEM_BY_SLUG = new Map<string, Problem>(PROBLEMS.map((p) => [p.slug, p]));
export { PROBLEMS };

export const SQL_DATASETS: SqlDataset[] = sql.datasets;
export const SQL_EXERCISES: SqlExercise[] = sql.exercises;
export const SQL_EXERCISE_BY_ID = new Map(SQL_EXERCISES.map((e) => [e.id, e]));
export const SQL_DATASET_BY_ID = new Map(SQL_DATASETS.map((d) => [d.id, d]));

function stubTopic(moduleId: ModuleId, entry: (typeof CATALOG)[ModuleId][number]): Topic {
  return {
    id: entry.id,
    moduleId,
    title: entry.title,
    summary: entry.summary,
    level: entry.level,
    status: 'planned',
    estMinutes: 0,
    prerequisites: entry.prerequisites ?? [],
    related: [],
    objectives: [],
    sections: [],
    mcqIds: [],
    interviewQuestions: [],
    problemIds: [],
    revision: { notesMd: '', flashcards: [] },
    mastery: DEFAULT_MASTERY,
    resources: [],
  };
}

export const TOPICS: Topic[] = [];
for (const m of MODULES) {
  for (const entry of CATALOG[m.id]) {
    const full = fullTopics.get(entry.id);
    const t = full ? { ...stubTopic(m.id, entry), ...full } : stubTopic(m.id, entry);
    // MCQs tagged with this topic are attached even if the topic file does not list them.
    const tagged = MCQS.filter((q) => q.topicIds.includes(t.id)).map((q) => q.id);
    t.mcqIds = [...new Set([...t.mcqIds, ...tagged])];
    // DSA topics get every bank problem whose topics include them.
    if (m.id === 'dsa') {
      const fromBank = PROBLEMS.filter((p) => p.topicIds.includes(t.id)).map((p) => p.slug);
      t.problemIds = [...new Set([...t.problemIds, ...fromBank])];
    }
    if (m.id === 'sql') {
      const ex = SQL_EXERCISES.filter((e) => e.topicIds.includes(t.id)).map((e) => e.id);
      t.problemIds = [...new Set([...t.problemIds, ...ex])];
    }
    TOPICS.push(t);
  }
}
export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

export function topicsOf(moduleId: ModuleId): Topic[] {
  return TOPICS.filter((t) => t.moduleId === moduleId);
}

export const MODULE_BY_ID = new Map<ModuleId, Module>(MODULES.map((m) => [m.id, m]));
export { MODULES };

export function moduleOfTopic(topicId: string): Module | undefined {
  const t = TOPIC_BY_ID.get(topicId);
  return t ? MODULE_BY_ID.get(t.moduleId) : undefined;
}

export function topicTitle(id: string): string {
  return TOPIC_BY_ID.get(id)?.title ?? id;
}
