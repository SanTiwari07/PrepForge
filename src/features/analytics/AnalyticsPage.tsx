import { Link } from 'react-router-dom';
import { useReadiness } from '@/hooks/useDerived';
import { useStore } from '@/store/store';
import { COMPANIES } from '@/content/companies';
import { weightedReadiness } from '@/engine/readiness';
import { Badge, Callout, ConfidenceNote, PageHeader, Progress } from '@/components/ui';

export default function AnalyticsPage() {
  const dims = useReadiness();
  const targets = useStore((s) => s.profile.targetCompanies);
  const companies = COMPANIES.filter((c) => targets.includes(c.id));

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Track" title="Placement readiness" lead="A transparent model: each dimension is computed from observable evidence (first attempts on unseen questions, timed results, independence from hints, delayed recall). Every number shows its evidence." />
      <Callout tone="info" title="What this is and is not">This score summarises your preparation evidence. It does not predict hiring outcomes, offers or compensation.</Callout>

      <div className="grid grid-2">
        {dims.map((d) => (
          <section key={d.id} className="card stack-sm" aria-labelledby={`dim-${d.id}`}>
            <div className="row-between">
              <h2 id={`dim-${d.id}`} className="card__title" style={{ fontSize: 'var(--fs-md)' }}>{d.title}</h2>
              <span className="stat__value" style={{ fontSize: '1.4rem' }}>{d.score === null ? '—' : `${d.score}%`}</span>
            </div>
            <Progress value={d.score ?? 0} tone="mastery" label={d.title} />
            <div className="row" style={{ gap: 6 }}><ConfidenceNote c={d.confidence} />{d.selfAssessed && <Badge tone="warning">Self-assessed</Badge>}</div>
            {d.score === null && <p className="xsmall muted">Insufficient evidence: at least 5 data points are needed before a score is shown.</p>}
            <h3 className="eyebrow mt-2">Evidence</h3>
            <ul className="list-plain small">{d.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
            <h3 className="eyebrow mt-2">To improve</h3>
            <ul className="list-plain small">{d.improve.map((e) => <li key={e}>→ {e}</li>)}</ul>
          </section>
        ))}
      </div>

      <section className="card">
        <h2 className="card__title mb-4">By target company</h2>
        <p className="small muted mb-4">Dimensions weighted by each company's emphasis. Weights are PrepForge's preparation recommendation, not company data. Coverage shows how much of the weighting has enough evidence.</p>
        {companies.length === 0 ? <p className="small">Choose target companies in <Link to="/settings">Settings</Link>.</p> : (
          <div className="stack">
            {companies.map((c) => {
              const w = weightedReadiness(dims, c.weights);
              return (
                <div key={c.id} className="meter-row">
                  <Link to={`/companies/${c.id}`} className="strong small">{c.name}</Link>
                  <Progress value={w.score ?? 0} tone="mastery" label={`${c.name} readiness`} />
                  <span className="small strong" style={{ textAlign: 'right' }}>{w.score === null ? '—' : `${w.score}%`}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
