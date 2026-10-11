import { Link } from 'react-router-dom';
import { MODULES, topicsOf } from '@/content/registry';
import { useMasteryMap } from '@/hooks/useDerived';
import { PageHeader, Progress } from '@/components/ui';

export default function LearnIndex() {
  const mastery = useMasteryMap();
  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Learn" title="Subjects" lead="Every subject has a navigable curriculum. Topics marked “Planned” do not have full lessons yet, but link to verified practice." />
      <div className="grid grid-auto">
        {MODULES.map((m) => {
          const ts = topicsOf(m.id);
          const ready = ts.filter((t) => t.status !== 'planned');
          const comp = ready.length ? Math.round(ready.reduce((a, t) => a + (mastery.get(t.id)?.completionPct ?? 0), 0) / ready.length) : 0;
          const ms = ts.map((t) => mastery.get(t.id)?.masteryPct).filter((v): v is number => v != null);
          const avg = ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null;
          return (
            <Link key={m.id} to={`/learn/${m.id}`} className="card card--link subject-rule" style={{ ['--rule' as string]: `var(${m.color})` }}>
              <h2 className="card__title">{m.title}</h2>
              <p className="small muted mt-2" style={{ minHeight: 44 }}>{m.description}</p>
              <div className="stack-sm mt-4">
                <div className="row-between xsmall"><span>{ready.length}/{ts.length} topics with full content</span><span>{comp}% read</span></div>
                <Progress value={comp} label={`${m.title} completion`} />
                <div className="row-between xsmall"><span>Mastery (evidence)</span><span>{avg === null ? 'No evidence yet' : `${avg}%`}</span></div>
                <Progress value={avg ?? 0} tone="mastery" label={`${m.title} mastery`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
