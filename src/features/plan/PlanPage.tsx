import { useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import { useEvidenceState, useMasteryMap } from '@/hooks/useDerived';
import { buildDailyPlan, DSA_ORDER } from '@/engine/plan';
import { PROBLEM_BY_SLUG, TOPICS, TOPIC_BY_ID } from '@/content/registry';
import { LevelBadge, PageHeader, StatusBadge } from '@/components/ui';
import { PlanList } from './PlanList';
import { Link } from 'react-router-dom';

export default function PlanPage() {
  const s = useEvidenceState();
  const mastery = useMasteryMap();
  const defaultMinutes = useStore((x) => x.profile.dailyMinutes);
  const [minutes, setMinutes] = useState(defaultMinutes);
  const plan = useMemo(() => buildDailyPlan({ state: s, topicById: TOPIC_BY_ID, topics: TOPICS, mastery, problemBySlug: PROBLEM_BY_SLUG, minutes }), [s, mastery, minutes]);
  const total = plan.reduce((a, t) => a + t.minutes, 0);

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Today"
        title="Today's plan"
        lead="Built from your due reviews, weak topics, roadmap position and recent assessments. It changes as your evidence changes."
      />
      <section className="card">
        <div className="row-between mb-4">
          <label className="row small" style={{ gap: 8 }}>
            <span className="label">Time available today</span>
            <select className="select" style={{ width: 'auto' }} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              {[30, 45, 60, 90, 120, 180, 240, 300].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </label>
          <span className="small muted">{total} min planned</span>
        </div>
        <PlanList tasks={plan} />
      </section>

      <section className="card">
        <h2 className="card__title mb-4">DSA roadmap</h2>
        <p className="small muted mb-4">Recommended order. Each topic unlocks when its prerequisites reach at least “Practising”.</p>
        <ol className="roadmap">
          {DSA_ORDER.map((id, i) => {
            const t = TOPIC_BY_ID.get(id);
            if (!t) return null;
            const m = mastery.get(id)!;
            return (
              <li key={id} className="roadmap__item">
                <span className="roadmap__num">{i + 1}</span>
                <Link to={`/learn/dsa/${id}`} className="grow strong small">{t.title}</Link>
                <span className="row" style={{ gap: 6 }}>{t.status !== 'complete' && <StatusBadge status={t.status} />}<LevelBadge level={m.level} /></span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
