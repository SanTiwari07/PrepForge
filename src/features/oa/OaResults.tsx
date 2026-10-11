import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PROBLEM_BY_SLUG, SQL_EXERCISE_BY_ID, TOPIC_BY_ID, modulesOfMcqs, topicTitle } from '@/content/registry';
import { getMcq, useModules } from '@/content/loader';
import { PackStatus } from '@/components/PackStatus';
import { useStore } from '@/store/store';
import { isMcqCorrect } from '@/engine/scoring';
import { formatDuration } from '@/engine/dates';
import { BarList } from '@/components/Charts';
import { Badge, EmptyState, PageHeader, Stat, pct } from '@/components/ui';
import { McqView } from '@/features/mcq/McqView';
import { CodeBlock } from '@/components/CodeBlock';

export default function OaResults() {
  const { id = '' } = useParams();
  const a = useStore((s) => s.assessments.find((x) => x.id === id));
  const history = useStore((s) => s.assessments.filter((x) => x.result && x.config.preset === a?.config.preset && x.id !== id));
  const [filter, setFilter] = useState<'all' | 'wrong'>('wrong');
  const modules = modulesOfMcqs((a?.items ?? []).filter((it) => it.kind === 'mcq').map((it) => it.refId));
  const pack = useModules(modules);
  if (a?.result && pack !== 'ready') return <PackStatus state={pack} modules={modules} />;
  if (!a || !a.result) return <EmptyState title="No results for this assessment" action={<Link to="/oa" className="btn btn--primary">OA centre</Link>} />;
  const r = a.result;
  const prev = history.sort((x, y) => y.startedAt.localeCompare(x.startedAt))[0];
  const weakTopics = Object.entries(r.byTopic).filter(([, v]) => v.total > 0 && v.correct / v.total < 0.6).sort((x, y) => x[1].correct / x[1].total - y[1].correct / y[1].total);
  const totalTime = Object.values(a.timePerItem).reduce((x, y) => x + y, 0);

  const itemCorrect = (itemId: string): boolean | null => {
    const it = a.items.find((x) => x.id === itemId)!;
    const ans = a.answers[it.id];
    if (it.kind === 'coding') return null;
    if (it.kind === 'sql') return ans?.sqlPassed === true;
    const q = getMcq(it.refId);
    return q ? isMcqCorrect(q, ans?.selected) : false;
  };

  return (
    <div className="stack-lg">
      <PageHeader crumbs={[{ to: '/oa', label: 'OA centre' }]} eyebrow={`Results · ${new Date(a.startedAt).toLocaleString()}`} title={a.config.title} lead="Practice simulation results. Wrong answers were added to your revision queue." />
      <div className="grid grid-4">
        <div className="card card--compact"><Stat label="Auto-scored" value={`${r.score}/${r.autoTotal}`} note={prev?.result ? `Previous: ${prev.result.score}/${prev.result.autoTotal}` : undefined} /></div>
        <div className="card card--compact"><Stat label="Accuracy" value={r.accuracyPct} unit="%" note={prev?.result ? `${r.accuracyPct - prev.result.accuracyPct >= 0 ? '+' : ''}${r.accuracyPct - prev.result.accuracyPct} pts vs last time` : 'First attempt of this type'} /></div>
        <div className="card card--compact"><Stat label="Attempted" value={`${r.attempted}/${a.items.length}`} /></div>
        <div className="card card--compact"><Stat label="Time used" value={formatDuration(r.durationSec)} note={`of ${a.config.durationMin} min`} /></div>
      </div>
      {r.selfReported.total > 0 && <p className="small">Coding (self-reported, not auto-scored): {r.selfReported.solved}/{r.selfReported.total} reported as fully solved.</p>}

      <div className="grid-12">
        <section className="card span-6">
          <h2 className="card__title mb-4">By topic</h2>
          <BarList rows={Object.entries(r.byTopic).map(([t, v]) => ({ label: `${topicTitle(t)} (${v.correct}/${v.total})`, value: pct(v.correct, v.total) }))} />
        </section>
        <section className="card span-6">
          <h2 className="card__title mb-4">By difficulty</h2>
          <BarList rows={(['easy', 'medium', 'hard'] as const).filter((d) => r.byDifficulty[d]).map((d) => ({ label: `${d} (${r.byDifficulty[d].correct}/${r.byDifficulty[d].total})`, value: pct(r.byDifficulty[d].correct, r.byDifficulty[d].total) }))} />
          <h3 className="eyebrow mt-6 mb-2">Recommended next</h3>
          {weakTopics.length === 0 ? <p className="small">No topic below 60% in this set. Try a harder or longer assessment.</p> : (
            <ul className="list-plain stack-sm">
              {weakTopics.slice(0, 4).map(([t]) => {
                const topic = TOPIC_BY_ID.get(t);
                return topic ? <li key={t} className="small"><Link to={`/learn/${topic.moduleId}/${t}`}>Revise {topic.title}</Link> and do its practice set</li> : null;
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card stack">
        <div className="row-between">
          <h2 className="card__title">Answer review</h2>
          <div className="segmented">
            <button aria-pressed={filter === 'wrong'} onClick={() => setFilter('wrong')}>Incorrect only</button>
            <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
          </div>
        </div>
        <p className="xsmall muted">Total active time on questions: {formatDuration(totalTime)}.</p>
        {a.items.filter((it) => filter === 'all' || itemCorrect(it.id) === false).map((it) => {
          const k = a.items.indexOf(it);
          const ok = itemCorrect(it.id);
          const ans = a.answers[it.id];
          return (
            <details key={it.id} className="disclosure" open={filter === 'wrong'}>
              <summary>
                <span>Q{k + 1}</span>
                {ok === null ? <Badge tone="outline">Self-reported: {ans?.selfReport ?? 'no answer'}</Badge> : ok ? <Badge tone="success">Correct</Badge> : <Badge tone="danger">{ans ? 'Incorrect' : 'Not answered'}</Badge>}
                <span className="xsmall muted">{formatDuration(a.timePerItem[it.id] ?? 0)}</span>
              </summary>
              <div className="disclosure__body">
                {it.kind === 'mcq' && getMcq(it.refId) && <McqView q={getMcq(it.refId)!} selected={ans?.selected ?? []} onToggle={() => {}} revealed />}
                {it.kind === 'sql' && (() => {
                  const ex = SQL_EXERCISE_BY_ID.get(it.refId)!;
                  return (
                    <div className="stack-sm">
                      <p className="strong small">{ex.title}</p>
                      {ans?.sql ? <CodeBlock samples={[{ lang: 'sql', code: ans.sql, label: 'Your answer' }]} /> : <p className="small muted">No answer submitted.</p>}
                      <Link to={`/sql/exercises/${ex.id}`} className="small">Open the exercise to see the expected output, hints and the reference solution →</Link>
                    </div>
                  );
                })()}
                {it.kind === 'coding' && <Link to={`/problems/${it.refId}`} className="small">Review “{PROBLEM_BY_SLUG.get(it.refId)?.title}” with the coach →</Link>}
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
