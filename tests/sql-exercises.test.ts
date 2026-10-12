// Executes every SQL exercise's reference solution with the real engine (sql.js) on the
// visible and hidden datasets, and checks that each documented wrong approach fails on at
// least one dataset. This is what backs the "verified-sqlite" label.
import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { createRequire } from 'node:module';
import { datasets } from '@/content/sql/datasets';
import { exercises } from '@/content/sql/exercises';
import { compareResults, type ResultSet } from '@/engine/sqlCompare';
import { execLast } from '@/lib/sqlExec';
import { mcqs as sqlMcqs } from '@/content/sql/pack';

const require = createRequire(import.meta.url);
let SQL: SqlJsStatic;

beforeAll(async () => {
  const wasm = require.resolve('sql.js/dist/sql-wasm.wasm');
  SQL = await initSqlJs({ locateFile: () => wasm });
});

function run(setup: string, query: string): ResultSet {
  const db = new SQL.Database();
  try {
    db.run('PRAGMA foreign_keys = ON;');
    db.exec(setup);
    return execLast(db, query);
  } finally {
    db.close();
  }
}

describe('SQL datasets load', () => {
  for (const d of datasets) {
    it(`${d.id}: schema and all seeds execute with foreign keys on`, () => {
      expect(() => run(`${d.schemaSql}\n${d.seedSql}`, 'SELECT 1')).not.toThrow();
      for (const h of d.hidden) expect(() => run(`${d.schemaSql}\n${h.seedSql}`, 'SELECT 1')).not.toThrow();
    });
  }
});

describe('SQL exercises', () => {
  const ids = new Set<string>();
  for (const ex of exercises) {
    const d = datasets.find((x) => x.id === ex.datasetId)!;
    it(`${ex.id}: unique id, known dataset`, () => {
      expect(ids.has(ex.id)).toBe(false);
      ids.add(ex.id);
      expect(d).toBeDefined();
      expect(ex.hints.length).toBeGreaterThan(0);
    });
    it(`${ex.id}: reference runs on every dataset variant and returns rows on the sample data`, () => {
      const visible = run(`${d.schemaSql}\n${d.seedSql}`, ex.referenceSql);
      expect(visible.columns.length).toBeGreaterThan(0);
      expect(visible.rows.length).toBeGreaterThan(0);
      for (const h of d.hidden) {
        const r = run(`${d.schemaSql}\n${h.seedSql}`, ex.referenceSql);
        expect(r.columns.length).toBe(visible.columns.length);
      }
    });
    for (const [k, w] of (ex.wrongApproaches ?? []).entries()) {
      it(`${ex.id}: wrong approach #${k + 1} fails on at least one dataset`, () => {
        const variants = [d.seedSql, ...d.hidden.map((h) => h.seedSql)];
        const failsSomewhere = variants.some((seed) => {
          const setup = `${d.schemaSql}\n${seed}`;
          let wrong: ResultSet;
          try { wrong = run(setup, w.sql); } catch { return true; }
          return !compareResults(run(setup, ex.referenceSql), wrong, { orderMatters: ex.orderMatters }).equal;
        });
        expect(failsSomewhere).toBe(true);
      });
    }
  }
});

describe('SQL output-prediction MCQs (executed)', () => {
  const fmt = (r: ResultSet) => r.rows.map((row) => row.map((v) => (v === null ? 'NULL' : String(v))).join(' | ')).join('\n');
  for (const m of sqlMcqs.filter((x) => x.code?.lang === 'sql' && x.code.expectedOutput !== undefined)) {
    it(`${m.id}: the stated output is what SQLite actually returns`, () => {
      const db = new SQL.Database();
      try {
        expect(fmt(execLast(db, m.code!.code))).toBe(m.code!.expectedOutput);
      } finally {
        db.close();
      }
    });
  }
});
