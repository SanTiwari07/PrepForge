import type { SqlRequest, SqlResponse } from '@/workers/sql.worker';

// Runs SQL in a sandboxed Web Worker (SQLite via sql.js). A fresh in-memory database is
// created for every run, so the learner cannot corrupt datasets. Runaway queries (for
// example an infinite recursive CTE) are stopped by terminating the worker.
const TIMEOUT_MS = 3000;
const MAX_ROWS = 2000;

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (r: SqlResponse) => void; timer: ReturnType<typeof setTimeout> }>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../workers/sql.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<SqlResponse>) => {
    const p = pending.get(e.data.id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.delete(e.data.id);
    const r = e.data;
    if (r.result && r.result.rows.length > MAX_ROWS) {
      r.result = { columns: r.result.columns, rows: r.result.rows.slice(0, MAX_ROWS) };
      r.error = `Output truncated to ${MAX_ROWS} rows.`;
    }
    p.resolve(r);
  };
  worker.onerror = (e) => {
    for (const [id, p] of pending) {
      clearTimeout(p.timer);
      p.resolve({ id, ok: false, error: `SQL engine failed to load: ${e.message || 'unknown error'}`, ms: 0 });
    }
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

export function runSql(setupSql: string, query: string): Promise<SqlResponse> {
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      worker?.terminate();
      worker = null;
      resolve({ id, ok: false, error: `Query stopped after ${TIMEOUT_MS / 1000} seconds (possible infinite loop or very slow query).`, ms: TIMEOUT_MS });
    }, TIMEOUT_MS);
    pending.set(id, { resolve, timer });
    const msg: SqlRequest = { id, setupSql, query };
    getWorker().postMessage(msg);
  });
}

/** Warm up the engine (download and compile the WASM) without blocking the UI. */
export function preloadSql(): void {
  void runSql('', 'SELECT 1');
}
