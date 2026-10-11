import type { MasteryCriteria, ModuleId, Problem, SqlExercise } from './schema';
import { CATALOG, MODULES, type CatalogEntry } from './catalog';

export const DEFAULT_MASTERY: MasteryCriteria = {
  testSize: 8,
  testMinutes: 12,
  passPct: 80,
  minIndependentSolves: 3,
  minMediumIndependent: 1,
  retentionDays: 7,
};

interface Assemblable {
  id: string;
  moduleId: ModuleId;
  mcqIds: string[];
  problemIds: string[];
}

/** The fields every topic has, authored or not (a catalog entry renders as "Planned"). */
export function stubFields(moduleId: ModuleId, entry: CatalogEntry) {
  return {
    id: entry.id,
    moduleId,
    title: entry.title,
    summary: entry.summary,
    level: entry.level,
    status: 'planned' as const,
    estMinutes: 0,
    prerequisites: entry.prerequisites ?? [],
    related: [] as string[],
    objectives: [] as string[],
    mcqIds: [] as string[],
    problemIds: [] as string[],
    mastery: DEFAULT_MASTERY,
  };
}

/**
 * Builds the curriculum in catalog order: authored topics override their stub, MCQs tagged with
 * a topic are attached even if the topic does not list them, DSA topics get every bank problem
 * tagged with them, and SQL topics get their exercises. Shared by the app (metadata) and by
 * tests/scripts (full content) so both see the same topic lists.
 */
export function assembleTopics<T extends Assemblable>(
  authored: Map<string, T>,
  stub: (moduleId: ModuleId, entry: CatalogEntry) => T,
  mcqs: { id: string; topicIds: string[] }[],
  problems: Problem[],
  sqlExercises: SqlExercise[],
): T[] {
  const out: T[] = [];
  for (const m of MODULES) {
    for (const entry of CATALOG[m.id]) {
      const full = authored.get(entry.id);
      const t: T = full ? { ...stub(m.id, entry), ...full } : stub(m.id, entry);
      const tagged = mcqs.filter((q) => q.topicIds.includes(t.id)).map((q) => q.id);
      t.mcqIds = [...new Set([...t.mcqIds, ...tagged])];
      if (m.id === 'dsa') {
        const fromBank = problems.filter((p) => p.topicIds.includes(t.id)).map((p) => p.slug);
        t.problemIds = [...new Set([...t.problemIds, ...fromBank])];
      }
      if (m.id === 'sql') {
        const ex = sqlExercises.filter((e) => e.topicIds.includes(t.id)).map((e) => e.id);
        t.problemIds = [...new Set([...t.problemIds, ...ex])];
      }
      out.push(t);
    }
  }
  return out;
}
