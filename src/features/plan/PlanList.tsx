import { Link } from 'react-router-dom';
import { BookOpen, Brain, Clock, Layers, Repeat, Timer, TriangleAlert } from 'lucide-react';
import type { PlanTask } from '@/engine/plan';
import { EmptyState } from '@/components/ui';

const ICON = { review: Repeat, weak: TriangleAlert, learn: BookOpen, practice: Brain, fundamentals: Layers, assessment: Timer };

export function PlanList({ tasks }: { tasks: PlanTask[] }) {
  if (!tasks.length) return <EmptyState title="Nothing planned">Increase your daily study time in Settings to get a plan.</EmptyState>;
  return (
    <ol className="plan-list">
      {tasks.map((t, i) => {
        const Icon = ICON[t.kind];
        return (
          <li key={t.id}>
            <Link to={t.href} className="plan-item">
              <span className="plan-item__num" aria-hidden>{i + 1}</span>
              <span className="grow">
                <span className="plan-item__title"><Icon size={15} aria-hidden /> {t.title}</span>
                <span className="small muted" style={{ display: 'block' }}>{t.detail}</span>
                <span className="xsmall muted" style={{ display: 'block' }}>Why: {t.reason}</span>
              </span>
              <span className="plan-item__time"><Clock size={13} aria-hidden /> {t.minutes} min</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
