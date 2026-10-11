import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, RotateCcw } from 'lucide-react';
import { SQL_DATASETS, SQL_EXERCISES, TOPIC_BY_ID } from '@/content/registry';
import { runSql, preloadSql } from '@/lib/sqlRunner';
import type { SqlResponse } from '@/workers/sql.worker';
import { Badge, Callout, DifficultyBadge, PageHeader } from '@/components/ui';
import { ResultTable, SchemaBrowser, SqlEditor } from './SqlParts';
import { useStore } from '@/store/store';

const HISTORY_KEY = 'prepforge:sql-history';

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); } catch { return []; }
}

export default function SqlLabPage() {
  const [params, setParams] = useSearchParams();
  const datasetId = params.get('dataset') ?? SQL_DATASETS[0].id;
  const ds = SQL_DATASETS.find((d) => d.id === datasetId) ?? SQL_DATASETS[0];
  const [sql, setSql] = useState('SELECT * FROM ' + (ds.schemaSql.match(/CREATE TABLE (\w+)/)?.[1] ?? 'sqlite_master') + ' LIMIT 10;');
  const [res, setRes] = useState<SqlResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>(loadHistory);
  const attempts = useStore((s) => s.sqlAttempts);

  useEffect(() => { preloadSql(); }, []);

  const execute = async () => {
    if (!sql.trim()) return;
    setBusy(true);
    setRes(await runSql(`${ds.schemaSql}\n${ds.seedSql}`, sql));
    setBusy(false);
    const next = [sql, ...history.filter((h) => h !== sql)].slice(0, 15);
    setHistory(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Practice"
        title="SQL lab"
        lead="A real SQL engine (SQLite, compiled to WebAssembly) running in your browser. Each run starts from a fresh copy of the dataset, so you cannot break anything."
      />
      <Callout tone="info" title="Dialect note">
        This lab runs SQLite. LeetCode and most OAs default to MySQL; exercises show a MySQL version wherever the syntax differs (date functions, for example).
      </Callout>
      <div className="sql-layout">
        <div className="stack">
          <section className="card stack-sm">
            <div className="row-between">
              <label className="row small" style={{ gap: 8 }}>
                <span className="label">Dataset</span>
                <select className="select" style={{ width: 'auto' }} value={ds.id} onChange={(e) => setParams({ dataset: e.target.value })}>
                  {SQL_DATASETS.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </label>
              <span className="xsmall muted">{ds.description}</span>
            </div>
            <SqlEditor value={sql} onChange={setSql} onRun={execute} />
            <div className="row">
              <button className="btn btn--primary" onClick={execute} disabled={busy}><Play /> Run <kbd style={{ background: 'transparent', color: '#fff', borderColor: '#555' }}>Ctrl Enter</kbd></button>
              <button className="btn btn--secondary" onClick={() => { setSql(''); setRes(null); }}><RotateCcw /> Clear</button>
            </div>
          </section>
          {res && (
            <section className="card stack-sm" aria-live="polite">
              {res.ok && res.result ? (
                <>
                  <ResultTable columns={res.result.columns} rows={res.result.rows} />
                  <p className="xsmall muted">{res.result.rows.length} row(s) · {Math.round(res.ms)} ms{res.error ? ` · ${res.error}` : ''}</p>
                </>
              ) : <Callout tone="danger" title="SQL error">{res.error}</Callout>}
            </section>
          )}
          <section className="card">
            <h2 className="card__title mb-4">Exercises ({SQL_EXERCISES.length})</h2>
            <div className="topic-list">
              {SQL_EXERCISES.map((e) => {
                const passed = attempts.some((a) => a.exerciseId === e.id && a.passedAll);
                return (
                  <Link key={e.id} to={`/sql/exercises/${e.id}`} className="topic-row">
                    <span className="grow">
                      <span className="topic-row__title">{e.title}</span>
                      <span className="xsmall muted">{e.topicIds.map((t) => TOPIC_BY_ID.get(t)?.title ?? t).join(' · ')} · {e.datasetId}</span>
                    </span>
                    <span className="topic-row__meta">{passed && <Badge tone="success">Passed</Badge>}<DifficultyBadge d={e.difficulty} /></span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
        <aside className="stack">
          <section className="card card--compact stack-sm">
            <h2 className="eyebrow">Schema</h2>
            <SchemaBrowser dataset={ds} />
          </section>
          {history.length > 0 && (
            <section className="card card--compact stack-sm">
              <h2 className="eyebrow">Recent queries</h2>
              <ul className="list-plain stack-sm">
                {history.map((h) => <li key={h}><button className="history-item mono xsmall" onClick={() => setSql(h)}>{h.slice(0, 120)}</button></li>)}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
