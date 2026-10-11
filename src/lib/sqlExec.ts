import type { Database } from 'sql.js';

export interface ExecResult { columns: string[]; rows: (string | number | null)[][] }

/**
 * Executes a (possibly multi-statement) script and returns the result of the LAST statement
 * that produces a result set. Unlike Database.exec(), this keeps column names when a query
 * returns zero rows, which matters for grading empty results.
 */
export function execLast(db: Database, sql: string): ExecResult {
  let last: ExecResult | null = null;
  for (const stmt of db.iterateStatements(sql)) {
    try {
      const columns = stmt.getColumnNames();
      const rows: ExecResult['rows'] = [];
      while (stmt.step()) {
        rows.push(stmt.get().map((v) => (v instanceof Uint8Array ? '[blob]' : (v as string | number | null))));
      }
      if (columns.length) last = { columns, rows };
    } finally {
      stmt.free();
    }
  }
  return last ?? { columns: [], rows: [] };
}
