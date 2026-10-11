import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Lightbulb, Play, XCircle } from 'lucide-react';
import { SQL_DATASET_BY_ID, SQL_EXERCISE_BY_ID, TOPIC_BY_ID } from '@/content/registry';
import { useStore } from '@/store/store';
import type { SqlErrorCategory } from '@/store/types';
import { runSql, preloadSql } from '@/lib/sqlRunner';
import type { SqlResponse } from '@/workers/sql.worker';
import { Markdown } from '@/components/Markdown';
import { CodeBlock } from '@/components/CodeBlock';
import { Badge, Callout, DifficultyBadge, PageHeader } from '@/components/ui';
import { ResultTable, SchemaBrowser, SqlEditor } from './SqlParts';
import { gradeSql, type GradeResult } from './grade';
import { SQL_ERROR_CATEGORIES } from '@/features/coach/errorCategories';
import NotFound from '@/features/NotFound';

export default function SqlExercisePage() {
  const { id = '' } = useParams();
  const ex = SQL_EXERCISE_BY_ID.get(id);
  const ds = ex ? SQL_DATASET_BY_ID.get(ex.datasetId) : undefined;
  const recordSql = useStore((s) => s.recordSql);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const prior = useStore((s) => s.sqlAttempts.filter((a) => a.exerciseId === id));
  const [sql, setSql] = useState('');
  const [run, setRun] = useState<SqlResponse | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [hints, setHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [cats, setCats] = useState<SqlErrorCategory[]>([]);
  const started = useRef(Date.now());

  useEffect(() => { preloadSql(); setSql(''); setRun(null); setGrade(null); setHints(0); setShowSolution(false); started.current = Date.now(); }, [id]);
  if (!ex || !ds) return <NotFound />;

  const execute = async () => {
    setBusy(true);
    setGrade(null);
    setRun(await runSql(`${ds.schemaSql}\n${ds.seedSql}`, sql));
    setBusy(false);
  };
  const check = async () => {
    if (!sql.trim()) return;
    setBusy(true);
    const g = await gradeSql(ex, sql);
    setGrade(g);
    setRun(null);
    setBusy(false);
    recordSql({
      exerciseId: ex.id, sql, passedVisible: g.passedVisible, passedAll: g.passedAll,
      failedHidden: g.results.filter((r) => !r.passed).map((r) => r.datasetId), hintsUsed: showSolution ? 3 : hints,
      durationSec: Math.round((Date.now() - started.current) / 1000), errorCategories: g.passedAll ? [] : cats, timed: false,
    }, ex.topicIds[0]);
  };

  const solvedBefore = prior.some((a) => a.passedAll);

  return (
    <div className="stack-lg">
      <PageHeader
        crumbs={[{ to: '/sql/lab', label: 'SQL lab' }, ...ex.topicIds.slice(0, 1).map((t) => ({ to: `/learn/sql/${t}`, label: TOPIC_BY_ID.get(t)?.title ?? t }))]}
        eyebrow={`SQL exercise · ${ds.title} dataset`}
        title={ex.title}
        actions={<><DifficultyBadge d={ex.difficulty} />{solvedBefore && <Badge tone="success">Solved before</Badge>}<button className="btn btn--ghost btn--sm" onClick={() => toggleBookmark({ refType: 'sql', refId: ex.id, title: ex.title })}>Bookmark</button></>}
      />
      <div className="sql-layout">
        <div className="stack">
          <section className="card">
            <Markdown md={ex.promptMd} />
            <p className="xsmall muted mt-4">Target time: about {ex.targetMinutes} min. Your query is checked on the sample data <strong>and</strong> {ds.hidden.length} hidden edge-case dataset{ds.hidden.length === 1 ? '' : 's'}.</p>
          </section>
          <section className="card stack-sm">
            <label className="label" htmlFor="sql-ed">Your query (SQLite; Ctrl+Enter runs it)</label>
            <SqlEditor value={sql} onChange={setSql} onRun={execute} />
            <div className="row">
              <button className="btn btn--secondary" onClick={execute} disabled={busy || !sql.trim()}><Play /> Run on sample data</button>
              <button className="btn btn--primary" onClick={check} disabled={busy || !sql.trim()}>Check answer</button>
              {busy && <span className="small muted">Running…</span>}
            </div>
          </section>

          {run && (
            <section className="card stack-sm" aria-live="polite">
              <h2 className="eyebrow">Result on sample data</h2>
              {run.ok && run.result ? <ResultTable columns={run.result.columns} rows={run.result.rows} /> : <Callout tone="danger" title="SQL error">{run.error}</Callout>}
              {run.ok && run.error && <p className="xsmall muted">{run.error}</p>}
              <p className="xsmall muted">Executed in your browser (SQLite) in {Math.round(run.ms)} ms. Running is not checking: use “Check answer”.</p>
            </section>
          )}

          {grade && (
            <section className="card stack" aria-live="polite">
              {grade.passedAll ? (
                <Callout tone="success" title="Correct on every dataset">Your result matches the reference on the sample data and all hidden edge cases.</Callout>
              ) : (
                <Callout tone="danger" title={grade.passedVisible ? 'Correct on the sample data, but wrong on a hidden edge case' : 'Not correct yet'}>
                  Compare your output with the expected output below.
                </Callout>
              )}
              {grade.results.map((r) => (
                <details key={r.datasetId} className="ref" open={!r.passed}>
                  <summary className="row" style={{ gap: 6 }}>
                    {r.passed ? <CheckCircle2 size={16} className="icon-success" aria-hidden /> : <XCircle size={16} className="icon-danger" aria-hidden />}
                    <span className="small strong">{r.datasetId === 'visible' ? 'Sample data' : `Hidden test: ${r.purpose}`}</span>
                  </summary>
                  <div className="stack-sm mt-2">
                    {r.error && <Callout tone="danger">{r.error}</Callout>}
                    {r.compare && !r.compare.equal && <p className="small">{r.compare.reason}</p>}
                    {!r.passed && r.expected && (
                      <div className="grid grid-2">
                        <div><p className="xsmall muted mb-2">Expected</p><ResultTable columns={r.expected.columns} rows={r.expected.rows} /></div>
                        {r.actual && <div><p className="xsmall muted mb-2">Yours</p><ResultTable columns={r.actual.columns} rows={r.actual.rows} /></div>}
                      </div>
                    )}
                  </div>
                </details>
              ))}
              {!grade.passedAll && (
                <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="label mb-2">What went wrong? (tick before your next check; saved with the attempt)</legend>
                  <div className="row">
                    {SQL_ERROR_CATEGORIES.map((c) => (
                      <label key={c.id} className="check chip-check"><input type="checkbox" checked={cats.includes(c.id)} onChange={(e) => setCats((x) => (e.target.checked ? [...x, c.id] : x.filter((y) => y !== c.id)))} />{c.label}</label>
                    ))}
                  </div>
                </fieldset>
              )}
              {grade.passedAll && <Markdown md={ex.explanationMd} />}
            </section>
          )}
        </div>

        <aside className="stack">
          <section className="card card--compact stack-sm">
            <h2 className="eyebrow">Schema: {ds.title}</h2>
            <SchemaBrowser dataset={ds} />
            <Link to={`/sql/lab?dataset=${ds.id}`} className="xsmall">Explore this dataset in the SQL lab →</Link>
          </section>
          <section className="card card--compact stack-sm">
            <h2 className="eyebrow">Hints</h2>
            {ex.hints.slice(0, hints).map((h, i) => <p key={i} className="small"><Lightbulb size={13} aria-hidden style={{ display: 'inline', verticalAlign: '-2px' }} /> {h}</p>)}
            {hints < ex.hints.length ? <button className="btn btn--secondary btn--sm" onClick={() => setHints(hints + 1)}>Reveal hint {hints + 1} of {ex.hints.length}</button> : <span className="xsmall muted">No more hints.</span>}
            {!showSolution ? (
              <button className="btn btn--danger btn--sm" onClick={() => { if (window.confirm('Show the reference solution? Later checks will count as "after solution".')) setShowSolution(true); }}>Show solution</button>
            ) : (
              <div className="stack-sm">
                <CodeBlock samples={[{ lang: 'sql', code: ex.referenceSql, label: 'Reference (SQLite)' }, ...(ex.referenceMysql ? [{ lang: 'sql' as const, code: ex.referenceMysql, label: 'MySQL' }] : [])]} />
                <Markdown md={ex.explanationMd} />
                {ex.wrongApproaches?.map((w, i) => (
                  <div key={i} className="card card--muted card--compact">
                    <p className="xsmall strong mb-2">Common wrong approach</p>
                    <CodeBlock samples={[{ lang: 'sql', code: w.sql }]} />
                    <Markdown md={w.whyMd} />
                  </div>
                ))}
              </div>
            )}
          </section>
          {ex.similarTo && ex.similarTo.length > 0 && (
            <section className="card card--compact stack-sm">
              <h2 className="eyebrow">Similar external practice</h2>
              {ex.similarTo.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="small">{s.title} <ExternalLink size={12} aria-hidden style={{ display: 'inline' }} /></a>)}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
