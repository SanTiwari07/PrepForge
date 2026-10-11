// The app's eager content registry: curriculum metadata, MCQ tags, the problem bank and SQL
// exercises. Full lessons, MCQ bodies and walkthroughs load per module (./loader).
import type { McqMeta, Module, ModuleId, Problem, SqlDataset, SqlExercise, TopicMeta } from './schema';
import { MODULES } from './catalog';
import { PROBLEMS } from './problems/bank.generated';
import { MCQ_META, TOPIC_META, WALKTHROUGH_SLUGS } from './index.generated';
import { datasets } from './sql/datasets';
import { exercises } from './sql/exercises';
import { assembleTopics, stubFields } from './assemble';

export { DEFAULT_MASTERY } from './assemble';

export const MCQS: McqMeta[] = MCQ_META;
export const MCQ_BY_ID = new Map(MCQS.map((m) => [m.id, m]));

/** Problems that have an authored coach walkthrough (bodies load with the DSA pack). */
export const WALKTHROUGH_SET = new Set(WALKTHROUGH_SLUGS);

export const PROBLEM_BY_SLUG = new Map<string, Problem>(PROBLEMS.map((p) => [p.slug, p]));
export { PROBLEMS };

export const SQL_DATASETS: SqlDataset[] = datasets;
export const SQL_EXERCISES: SqlExercise[] = exercises;
export const SQL_EXERCISE_BY_ID = new Map(SQL_EXERCISES.map((e) => [e.id, e]));
export const SQL_DATASET_BY_ID = new Map(SQL_DATASETS.map((d) => [d.id, d]));

export const TOPICS: TopicMeta[] = assembleTopics<TopicMeta>(
  new Map(TOPIC_META.map((t) => [t.id, t])),
  (m, e) => ({ ...stubFields(m, e), sectionIds: [], counts: { interviewQuestions: 0, flashcards: 0 } }),
  MCQS, PROBLEMS, SQL_EXERCISES,
);
export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

export function topicsOf(moduleId: ModuleId): TopicMeta[] {
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

/** The modules whose packs hold these MCQs. */
export function modulesOfMcqs(ids: Iterable<string>): ModuleId[] {
  const out = new Set<ModuleId>();
  for (const id of ids) { const m = MCQ_BY_ID.get(id); if (m) out.add(m.moduleId); }
  return [...out];
}
