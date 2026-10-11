/// <reference lib="webworker" />
import initSqlJs, { type SqlJsStatic } from 'sql.js';

export interface SqlRequest {
  id: number;
  setupSql: string;
  query: string;
}
export interface SqlResultSet { columns: string[]; rows: (string | number | null)[][] }
export interface SqlResponse {
  id: number;
  ok: boolean;
  result?: SqlResultSet;   // result of the LAST statement that returned rows
  error?: string;
  ms: number;
}

let SQL: Promise<SqlJsStatic> | null = null;
function load(): Promise<SqlJsStatic> {
  SQL ??= initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
  return SQL;
}

self.onmessage = async (e: MessageEvent<SqlRequest>) => {
  const { id, setupSql, query } = e.data;
  const t0 = performance.now();
  try {
    const sql = await load();
    const db = new sql.Database();
    try {
      db.run('PRAGMA foreign_keys = ON;');
      if (setupSql) db.exec(setupSql);
      const results = db.exec(query);
      const last = results.at(-1);
      const result: SqlResultSet = last
        ? { columns: last.columns, rows: last.values.map((r) => r.map((v) => (v instanceof Uint8Array ? '[blob]' : (v as string | number | null)))) }
        : { columns: [], rows: [] };
      (self as unknown as Worker).postMessage({ id, ok: true, result, ms: performance.now() - t0 } satisfies SqlResponse);
    } finally {
      db.close();
    }
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err), ms: performance.now() - t0 } satisfies SqlResponse);
  }
};
