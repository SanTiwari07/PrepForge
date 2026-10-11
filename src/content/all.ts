// Full content, loaded eagerly. For tests and scripts only: the app imports the lightweight
// registry and loads module packs on demand (src/content/loader.ts), so never import this from src/.
import type { CoachWalkthrough, ContentPack, MCQ, Topic } from './schema';
import { assembleTopics, stubFields } from './assemble';
import { PROBLEMS } from './problems/bank.generated';
import { exercises } from './sql/exercises';
import * as dsa from './dsa';
import * as sql from './sql/topics';
import * as dbms from './dbms';
import * as oopCpp from './oop-cpp';
import * as oopJava from './oop-java';
import * as cn from './cn';
import * as os from './os';
import * as sd from './system-design';
import * as devops from './devops';
import * as coreCs from './core-cs';

export const PACKS: ContentPack[] = [dsa, sql, dbms, oopCpp, oopJava, cn, os, sd, devops, coreCs];

export const MCQS: MCQ[] = PACKS.flatMap((p) => p.mcqs);
export const MCQ_BY_ID = new Map(MCQS.map((m) => [m.id, m]));
export const WALKTHROUGHS: Record<string, CoachWalkthrough> = Object.assign({}, ...PACKS.map((p) => p.walkthroughs ?? {}));

const authored = new Map<string, Topic>(PACKS.flatMap((p) => p.topics).map((t) => [t.id, t]));
export const TOPICS: Topic[] = assembleTopics<Topic>(
  authored,
  (m, e) => ({ ...stubFields(m, e), sections: [], interviewQuestions: [], revision: { notesMd: '', flashcards: [] }, resources: [] }),
  MCQS, PROBLEMS, exercises,
);
export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

export const PROBLEM_BY_SLUG = new Map(PROBLEMS.map((p) => [p.slug, p]));
export const SQL_EXERCISE_BY_ID = new Map(exercises.map((e) => [e.id, e]));
export { PROBLEMS, exercises as SQL_EXERCISES };
