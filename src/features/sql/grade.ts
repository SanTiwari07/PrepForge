import type { SqlExercise } from '@/content/schema';
import { SQL_DATASET_BY_ID } from '@/content/registry';
import { runSql } from '@/lib/sqlRunner';
import { compareResults, type CompareResult, type ResultSet } from '@/engine/sqlCompare';

export interface DatasetGrade {
  datasetId: string;          // 'visible' or a hidden variant id
  purpose: string;
  passed: boolean;
  error?: string;
  compare?: CompareResult;
  expected?: ResultSet;
  actual?: ResultSet;
}

export interface GradeResult { passedVisible: boolean; passedAll: boolean; results: DatasetGrade[] }

/** Grades a learner query by REAL execution against the reference on every dataset variant. */
export async function gradeSql(ex: SqlExercise, userSql: string): Promise<GradeResult> {
  const ds = SQL_DATASET_BY_ID.get(ex.datasetId);
  if (!ds) throw new Error(`Unknown dataset ${ex.datasetId}`);
  const variants = [{ id: 'visible', purpose: 'Sample data', seedSql: ds.seedSql }, ...ds.hidden];
  const results: DatasetGrade[] = [];
  for (const v of variants) {
    const setup = `${ds.schemaSql}\n${v.seedSql}`;
    const [exp, act] = await Promise.all([runSql(setup, ex.referenceSql), runSql(setup, userSql)]);
    if (!exp.ok || !exp.result) {
      results.push({ datasetId: v.id, purpose: v.purpose, passed: false, error: `Reference solution failed (content bug): ${exp.error}` });
      continue;
    }
    if (!act.ok || !act.result) {
      results.push({ datasetId: v.id, purpose: v.purpose, passed: false, error: act.error, expected: exp.result });
      continue;
    }
    const compare = compareResults(exp.result, act.result, { orderMatters: ex.orderMatters });
    results.push({ datasetId: v.id, purpose: v.purpose, passed: compare.equal, compare, expected: exp.result, actual: act.result });
  }
  return { passedVisible: results[0]?.passed ?? false, passedAll: results.every((r) => r.passed), results };
}
