import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Trash2 } from 'lucide-react';
import { MCQS, MODULES, SQL_EXERCISES } from '@/content/registry';
import type { ModuleId } from '@/content/schema';
import { useStore } from '@/store/store';
import { useEvidenceState, useMasteryMap } from '@/hooks/useDerived';
import { Badge, Callout, EmptyState, PageHeader } from '@/components/ui';
import { Sparkline } from '@/components/Charts';
import { buildAssessment, PRESETS, type BuildSpec } from './buildAssessment';

export default function OaCentre() {
  const s = useEvidenceState();
  const mastery = useMasteryMap();
  const start = useStore((x) => x.startAssessment);
  const del = useStore((x) => x.deleteAssessment);
  const navigate = useNavigate();
  const [custom, setCustom] = useState<BuildSpec>({ preset: 'custom', title: 'Custom assessment', durationMin: 30, modules: ['dsa'], difficulty: 'mixed', mcqCount: 10, sqlCount: 0, codingCount: 0 });

  const available = (spec: BuildSpec) => {
    const m = MCQS.filter((q) => spec.modules.includes(q.moduleId)).length;
    const sq = spec.modules.includes('sql') ? SQL_EXERCISES.length : 0;
    return { mcq: m, sql: sq, ok: (spec.mcqCount === 0 || m > 0) && (spec.sqlCount === 0 || sq > 0) && spec.mcqCount + spec.sqlCount + spec.codingCount > 0 };
  };

  const launch = (spec: BuildSpec) => {
    const a = buildAssessment(spec, s, mastery);
    if (!a.items.length) return;
    start(a);
    navigate(`/oa/run/${a.id}`);
  };

  const inProgress = s.assessments.filter((a) => !a.submittedAt && Date.parse(a.endsAt) > Date.now());
  const done = s.assessments.filter((a) => a.result).sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Practice" title="Online Assessment centre" lead="Timed, auto-saved assessments with question navigation, mark-for-review and detailed results. Generated sets are practice simulations, not real company assessments." />

      {inProgress.length > 0 && (
        <Callout tone="warning" title="You have an assessment in progress">
          {inProgress.map((a) => <Link key={a.id} to={`/oa/run/${a.id}`} className="btn btn--primary btn--sm mt-2">Resume “{a.config.title}”</Link>)}
        </Callout>
      )}

      <section aria-labelledby="presets-h">
        <h2 id="presets-h" className="mb-4" style={{ fontSize: 'var(--fs-lg)' }}>Presets</h2>
        <div className="grid grid-auto">
          {PRESETS.map((p) => {
            const av = available(p);
            return (
              <div key={p.preset} className="card stack-sm">
                <h3 className="card__title">{p.title}</h3>
                <p className="small muted" style={{ minHeight: 48 }}>{p.description}</p>
                <p className="xsmall row" style={{ gap: 6 }}><Clock size={12} aria-hidden /> {p.durationMin} min · {[p.mcqCount && `${p.mcqCount} MCQ`, p.sqlCount && `${p.sqlCount} SQL`, p.codingCount && `${p.codingCount} coding`].filter(Boolean).join(' · ')}</p>
                {!av.ok ? <p className="xsmall muted">Not enough questions in these subjects yet.</p> : av.mcq < p.mcqCount && p.mcqCount > 0 ? <p className="xsmall muted">Only {av.mcq} MCQs available so far; the set will be shorter.</p> : null}
                <button className="btn btn--primary btn--sm" disabled={!av.ok} onClick={() => launch(p)}>Start</button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card" aria-labelledby="custom-h">
        <h2 id="custom-h" className="card__title mb-4">Custom assessment</h2>
        <div className="grid grid-3">
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0, gridColumn: '1 / -1' }}>
            <legend className="label mb-2">Subjects</legend>
            <div className="row" style={{ gap: 6 }}>
              {MODULES.map((m) => (
                <label key={m.id} className="check chip-check">
                  <input type="checkbox" checked={custom.modules.includes(m.id)} onChange={(e) => setCustom({ ...custom, modules: e.target.checked ? [...custom.modules, m.id] : custom.modules.filter((x) => x !== m.id) as ModuleId[] })} />
                  {m.shortTitle}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field"><span className="label">Duration (minutes)</span><input className="input" type="number" min={5} max={180} value={custom.durationMin} onChange={(e) => setCustom({ ...custom, durationMin: Math.max(5, Math.min(180, Number(e.target.value) || 5)) })} /></label>
          <label className="field"><span className="label">Difficulty</span>
            <select className="select" value={custom.difficulty} onChange={(e) => setCustom({ ...custom, difficulty: e.target.value as BuildSpec['difficulty'] })}>
              <option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </label>
          <label className="field"><span className="label">MCQs</span><input className="input" type="number" min={0} max={60} value={custom.mcqCount} onChange={(e) => setCustom({ ...custom, mcqCount: Math.max(0, Math.min(60, Number(e.target.value) || 0)) })} /></label>
          <label className="field"><span className="label">SQL queries (needs SQL subject)</span><input className="input" type="number" min={0} max={10} value={custom.sqlCount} onChange={(e) => setCustom({ ...custom, sqlCount: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })} /></label>
          <label className="field"><span className="label">Coding problems (self-reported)</span><input className="input" type="number" min={0} max={4} value={custom.codingCount} onChange={(e) => setCustom({ ...custom, codingCount: Math.max(0, Math.min(4, Number(e.target.value) || 0)) })} /></label>
          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn--primary" disabled={!available(custom).ok} onClick={() => launch(custom)}>Start custom assessment</button>
          </div>
        </div>
        <p className="xsmall muted mt-4">Selection is adaptive: about 20% previously incorrect items, 60% from your weak topics, and the rest unseen. Coding items are solved on LeetCode and self-reported; they are excluded from the auto-score.</p>
      </section>

      <section className="card" aria-labelledby="hist-h">
        <div className="row-between mb-4">
          <h2 id="hist-h" className="card__title">History</h2>
          {done.length > 1 && <Sparkline values={[...done].reverse().map((a) => a.result!.accuracyPct)} label="Accuracy trend" />}
        </div>
        {done.length === 0 ? <EmptyState title="No completed assessments yet">Take a preset above. Results, topic breakdowns and recommendations appear here.</EmptyState> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Assessment</th><th>Date</th><th>Score</th><th>Accuracy</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {done.map((a) => (
                  <tr key={a.id}>
                    <td><Link to={`/oa/results/${a.id}`}>{a.config.title}</Link></td>
                    <td className="small">{new Date(a.startedAt).toLocaleString()}</td>
                    <td className="small">{a.result!.score}/{a.result!.autoTotal}{a.result!.selfReported.total ? ` · coding ${a.result!.selfReported.solved}/${a.result!.selfReported.total} (self-reported)` : ''}</td>
                    <td><Badge tone={a.result!.accuracyPct >= 70 ? 'success' : a.result!.accuracyPct >= 40 ? 'warning' : 'danger'}>{a.result!.accuracyPct}%</Badge></td>
                    <td><button className="icon-btn" aria-label="Delete this attempt" onClick={() => { if (window.confirm('Delete this assessment from history?')) del(a.id); }}><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
