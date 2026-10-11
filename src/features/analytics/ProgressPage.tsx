import { Link } from 'react-router-dom';
import { MODULES, topicsOf } from '@/content/registry';
import { useEvidenceState, useMasteryMap } from '@/hooks/useDerived';
import { ActivityHeatmap } from '@/components/Charts';
import { LevelBadge, PageHeader, Progress, Stat, StatusBadge } from '@/components/ui';
import { currentStreak, longestStreak, solveStats } from '@/engine/stats';

export default function ProgressPage() {
  const s = useEvidenceState();
  const mastery = useMasteryMap();
  const st = solveStats(s);
  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Track" title="Progress" lead="Completion (what you have read) and mastery (what your evidence shows) for every topic, side by side." />
      <div className="grid grid-4">
        <div className="card card--compact"><Stat label="Current streak" value={currentStreak(s)} unit="days" /></div>
        <div className="card card--compact"><Stat label="Longest streak" value={longestStreak(s)} unit="days" /></div>
        <div className="card card--compact"><Stat label="Problem attempts" value={st.independent + st.withHints + st.afterSolution + st.gaveUp} /></div>
        <div className="card card--compact"><Stat label="MCQ answers" value={s.mcqAttempts.length} /></div>
      </div>
      <section className="card"><ActivityHeatmap activity={s.activity} weeks={26} /></section>
      {MODULES.map((m) => (
        <section key={m.id} className="card">
          <h2 className="card__title mb-4"><Link to={`/learn/${m.id}`} style={{ color: 'inherit' }}>{m.title}</Link></h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Topic</th><th>Content</th><th style={{ minWidth: 120 }}>Read</th><th style={{ minWidth: 120 }}>Mastery</th><th>Level</th></tr></thead>
              <tbody>
                {topicsOf(m.id).map((t) => {
                  const mm = mastery.get(t.id)!;
                  return (
                    <tr key={t.id}>
                      <td><Link to={`/learn/${m.id}/${t.id}`}>{t.title}</Link></td>
                      <td><StatusBadge status={t.status} /></td>
                      <td><Progress value={mm.completionPct} label={`${t.title} completion`} /></td>
                      <td>{mm.masteryPct === null ? <span className="xsmall muted">Not enough evidence</span> : <Progress value={mm.masteryPct} tone="mastery" label={`${t.title} mastery`} />}</td>
                      <td><LevelBadge level={mm.level} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
