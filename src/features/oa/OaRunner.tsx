import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Flag, Play } from 'lucide-react';
import { PROBLEM_BY_SLUG, SQL_DATASET_BY_ID, SQL_EXERCISE_BY_ID, modulesOfMcqs } from '@/content/registry';
import { getMcq, loadedMcqs, useModules } from '@/content/loader';
import { PackStatus } from '@/components/PackStatus';
import { useStore } from '@/store/store';
import type { AssessmentAttempt, AssessmentItem } from '@/store/types';
import { formatClock } from '@/engine/dates';
import { scoreAssessment, isMcqCorrect } from '@/engine/scoring';
import { Markdown } from '@/components/Markdown';
import { Callout, DifficultyBadge, EmptyState } from '@/components/ui';
import { McqView } from '@/features/mcq/McqView';
import { ResultTable, SchemaBrowser, SqlEditor } from '@/features/sql/SqlParts';
import { gradeSql } from '@/features/sql/grade';
import { runSql } from '@/lib/sqlRunner';
import type { SqlResponse } from '@/workers/sql.worker';

export default function OaRunner() {
  const { id = '' } = useParams();
  const attempt = useStore((s) => s.assessments.find((a) => a.id === id));
  const navigate = useNavigate();
  if (!attempt) return <EmptyState title="Assessment not found" action={<Link to="/oa" className="btn btn--primary">Back to OA centre</Link>} />;
  if (attempt.submittedAt) return <EmptyState title="This assessment was already submitted" action={<button className="btn btn--primary" onClick={() => navigate(`/oa/results/${id}`)}>View results</button>} />;
  return <RunnerGate attempt={attempt} />;
}

/** Loads the packs holding the assessment's MCQs before the runner (and its auto-submit) mounts. */
function RunnerGate({ attempt }: { attempt: AssessmentAttempt }) {
  const modules = modulesOfMcqs(attempt.items.filter((it) => it.kind === 'mcq').map((it) => it.refId));
  const state = useModules(modules);
  if (state !== 'ready') return <PackStatus state={state} modules={modules} />;
  return <Runner attempt={attempt} />;
}

function Runner({ attempt }: { attempt: AssessmentAttempt }) {
  const navigate = useNavigate();
  const answer = useStore((s) => s.answerAssessment);
  const toggleMark = useStore((s) => s.toggleMarkAssessment);
  const setCurrent = useStore((s) => s.setAssessmentCurrent);
  const addTime = useStore((s) => s.addAssessmentTime);
  const finish = useStore((s) => s.finishAssessment);
  const recordMcq = useStore((s) => s.recordMcq);
  const [now, setNow] = useState(Date.now());
  const [confirm, setConfirm] = useState(false);
  const i = Math.min(attempt.current, attempt.items.length - 1);
  const item = attempt.items[i];
  const remaining = (Date.parse(attempt.endsAt) - now) / 1000;

  const submit = useCallback(() => {
    const submittedAt = new Date().toISOString();
    const final = { ...useStore.getState().assessments.find((a) => a.id === attempt.id)!, submittedAt };
    // Record first-seen evidence for MCQs answered in the assessment.
    for (const it of final.items) {
      if (it.kind !== 'mcq') continue;
      const q = getMcq(it.refId);
      const sel = final.answers[it.id]?.selected;
      if (q && sel?.length) recordMcq({ mcqId: q.id, selected: sel, correct: isMcqCorrect(q, sel), timeSec: final.timePerItem[it.id] ?? 0, context: 'oa' }, it.topicId);
    }
    finish(attempt.id, { submittedAt, result: scoreAssessment(final, loadedMcqs()) });
    navigate(`/oa/results/${attempt.id}`, { replace: true });
  }, [attempt.id, finish, navigate, recordMcq]);

  // Clock and per-item active time (counted only while the tab is visible).
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
      if (document.visibilityState === 'visible') addTime(attempt.id, item.id, 1);
    }, 1000);
    return () => clearInterval(t);
  }, [attempt.id, item.id, addTime]);

  useEffect(() => { if (remaining <= 0) submit(); }, [remaining, submit]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const go = (k: number) => setCurrent(attempt.id, Math.max(0, Math.min(attempt.items.length - 1, k)));
  const unanswered = attempt.items.filter((it) => !isAnswered(attempt, it));

  return (
    <div className="oa">
      <header className="oa__bar">
        <div className="grow">
          <span className="strong small">{attempt.config.title}</span>
          <span className="xsmall muted" style={{ display: 'block' }}>Practice simulation · answers save automatically</span>
        </div>
        <span className={`clock${remaining < 300 ? ' text-danger' : ''}`} role="timer" aria-label="Time remaining">{formatClock(remaining)}</span>
        <button className="btn btn--primary btn--sm" onClick={() => setConfirm(true)}>Submit</button>
      </header>

      <div className="oa__body">
        <nav className="oa__palette" aria-label="Questions">
          <div className="q-palette">
            {attempt.items.map((it, k) => (
              <button key={it.id} type="button" onClick={() => go(k)} aria-current={k === i}
                className={`q-palette__btn${k === i ? ' is-current' : ''}${isAnswered(attempt, it) ? ' is-answered' : ''}${attempt.marked.includes(it.id) ? ' is-marked' : ''}`}
                aria-label={`Question ${k + 1}${isAnswered(attempt, it) ? ', answered' : ''}${attempt.marked.includes(it.id) ? ', marked for review' : ''}`}>
                {k + 1}
              </button>
            ))}
          </div>
          <ul className="legend-list xsmall muted">
            <li><span className="q-dot is-answered" /> Answered</li>
            <li><span className="q-dot is-marked" /> Marked for review</li>
            <li><span className="q-dot" /> Not answered</li>
          </ul>
        </nav>

        <main className="oa__main" id="main">
          <div className="card">
            <div className="row-between mb-4">
              <span className="xsmall muted">Question {i + 1} of {attempt.items.length} · {item.kind === 'mcq' ? 'Multiple choice' : item.kind === 'sql' ? 'SQL query (auto-graded)' : 'Coding (self-reported)'}</span>
              <button className={`btn btn--sm ${attempt.marked.includes(item.id) ? 'btn--primary' : 'btn--secondary'}`} onClick={() => toggleMark(attempt.id, item.id)} aria-pressed={attempt.marked.includes(item.id)}>
                <Flag /> {attempt.marked.includes(item.id) ? 'Marked' : 'Mark for review'}
              </button>
            </div>
            {item.kind === 'mcq' && <McqItem attempt={attempt} item={item} onAnswer={(sel) => answer(attempt.id, item.id, { selected: sel })} />}
            {item.kind === 'sql' && <SqlItem key={item.id} attempt={attempt} item={item} onAnswer={(sql, passed) => answer(attempt.id, item.id, { sql, sqlPassed: passed })} />}
            {item.kind === 'coding' && <CodingItem attempt={attempt} item={item} onAnswer={(r) => answer(attempt.id, item.id, { selfReport: r })} />}
            <div className="row-between mt-6">
              <button className="btn btn--secondary" onClick={() => go(i - 1)} disabled={i === 0}>Previous</button>
              {i < attempt.items.length - 1 ? <button className="btn btn--primary" onClick={() => go(i + 1)}>Save and next</button> : <button className="btn btn--primary" onClick={() => setConfirm(true)}>Review and submit</button>}
            </div>
          </div>
        </main>
      </div>

      {confirm && (
        <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(false); }}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="sub-h">
            <div className="dialog__head"><h2 id="sub-h" style={{ fontSize: 'var(--fs-lg)' }}>Submit assessment?</h2></div>
            <div className="dialog__body stack-sm">
              <p className="small">{attempt.items.length - unanswered.length} of {attempt.items.length} answered · {formatClock(remaining)} remaining.</p>
              {unanswered.length > 0 && <Callout tone="warning">Unanswered: {unanswered.map((it) => attempt.items.indexOf(it) + 1).join(', ')}</Callout>}
              {attempt.marked.length > 0 && <Callout tone="info">Marked for review: {attempt.marked.map((m) => attempt.items.findIndex((it) => it.id === m) + 1).join(', ')}</Callout>}
            </div>
            <div className="dialog__foot">
              <button className="btn btn--secondary" onClick={() => setConfirm(false)}>Keep working</button>
              <button className="btn btn--primary" onClick={submit}>Submit now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isAnswered(a: AssessmentAttempt, it: AssessmentItem): boolean {
  const ans = a.answers[it.id];
  if (!ans) return false;
  if (it.kind === 'mcq') return !!ans.selected?.length;
  if (it.kind === 'sql') return !!ans.sql?.trim();
  return !!ans.selfReport;
}

function McqItem({ attempt, item, onAnswer }: { attempt: AssessmentAttempt; item: AssessmentItem; onAnswer: (sel: string[]) => void }) {
  const q = getMcq(item.refId);
  if (!q) return <p>Question unavailable.</p>;
  const sel = attempt.answers[item.id]?.selected ?? [];
  return (
    <McqView q={q} selected={sel} revealed={false}
      onToggle={(opt) => onAnswer(q.correct.length > 1 ? (sel.includes(opt) ? sel.filter((x) => x !== opt) : [...sel, opt]) : [opt])} />
  );
}

function SqlItem({ attempt, item, onAnswer }: { attempt: AssessmentAttempt; item: AssessmentItem; onAnswer: (sql: string, passed: boolean) => void }) {
  const ex = SQL_EXERCISE_BY_ID.get(item.refId);
  const ds = ex ? SQL_DATASET_BY_ID.get(ex.datasetId) : undefined;
  const [sql, setSql] = useState(attempt.answers[item.id]?.sql ?? '');
  const [res, setRes] = useState<SqlResponse | null>(null);
  const [saving, setSaving] = useState(false);
  if (!ex || !ds) return <p>Exercise unavailable.</p>;
  const save = async () => {
    setSaving(true);
    const g = await gradeSql(ex, sql);   // graded by real execution; the verdict is hidden until results
    onAnswer(sql, g.passedAll);
    setSaving(false);
  };
  return (
    <div className="stack">
      <div className="row" style={{ gap: 6 }}><strong>{ex.title}</strong><DifficultyBadge d={ex.difficulty} /></div>
      <Markdown md={ex.promptMd} />
      <details className="ref"><summary className="small">Schema ({ds.title})</summary><SchemaBrowser dataset={ds} /></details>
      <SqlEditor value={sql} onChange={setSql} onRun={async () => setRes(await runSql(`${ds.schemaSql}\n${ds.seedSql}`, sql))} />
      <div className="row">
        <button className="btn btn--secondary btn--sm" onClick={async () => setRes(await runSql(`${ds.schemaSql}\n${ds.seedSql}`, sql))}><Play /> Run on sample data</button>
        <button className="btn btn--primary btn--sm" onClick={save} disabled={saving || !sql.trim()}>{saving ? 'Saving…' : 'Save answer'}</button>
        {attempt.answers[item.id]?.sql && <span className="xsmall muted">Saved. It will be checked on hidden data when you submit.</span>}
      </div>
      {res && (res.ok && res.result ? <ResultTable columns={res.result.columns} rows={res.result.rows} /> : <Callout tone="danger">{res.error}</Callout>)}
    </div>
  );
}

function CodingItem({ attempt, item, onAnswer }: { attempt: AssessmentAttempt; item: AssessmentItem; onAnswer: (r: 'solved' | 'partial' | 'not-solved') => void }) {
  const p = PROBLEM_BY_SLUG.get(item.refId);
  if (!p) return <p>Problem unavailable.</p>;
  const cur = attempt.answers[item.id]?.selfReport;
  return (
    <div className="stack">
      <div className="row" style={{ gap: 6 }}><strong>{p.title}</strong><DifficultyBadge d={p.difficulty} /></div>
      <p className="small">Open the problem on LeetCode, solve it there within the time limit, then report the result honestly. PrepForge cannot run your code, so this item is <strong>self-reported</strong> and excluded from the auto-score.</p>
      <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn--secondary" style={{ alignSelf: 'flex-start' }}>Open on LeetCode <ExternalLink /></a>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label mb-2">Result</legend>
        <div className="segmented">
          <button type="button" aria-pressed={cur === 'solved'} onClick={() => onAnswer('solved')}>All tests passed</button>
          <button type="button" aria-pressed={cur === 'partial'} onClick={() => onAnswer('partial')}>Partially</button>
          <button type="button" aria-pressed={cur === 'not-solved'} onClick={() => onAnswer('not-solved')}>Not solved</button>
        </div>
      </fieldset>
    </div>
  );
}
