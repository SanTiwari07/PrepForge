import { Link, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { COMPANY_BY_ID } from '@/content/companies';
import { TOPIC_BY_ID } from '@/content/registry';
import { useMasteryMap, useReadiness } from '@/hooks/useDerived';
import { weightedReadiness } from '@/engine/readiness';
import { Badge, Callout, LevelBadge, PageHeader, Progress } from '@/components/ui';
import { useStore } from '@/store/store';
import NotFound from '@/features/NotFound';

export default function CompanyPage() {
  const { companyId = '' } = useParams();
  const c = COMPANY_BY_ID.get(companyId);
  const mastery = useMasteryMap();
  const dims = useReadiness();
  const targets = useStore((s) => s.profile.targetCompanies);
  const update = useStore((s) => s.updateProfile);
  if (!c) return <NotFound />;
  const w = weightedReadiness(dims, c.weights);
  const isTarget = targets.includes(c.id);

  return (
    <div className="stack-lg">
      <PageHeader
        crumbs={[{ to: '/companies', label: 'Companies' }]}
        eyebrow={`Updated ${c.updatedOn}`}
        title={c.name}
        lead={c.summary}
        actions={<button className={`btn ${isTarget ? 'btn--secondary' : 'btn--primary'}`} onClick={() => update({ targetCompanies: isTarget ? targets.filter((x) => x !== c.id) : [...targets, c.id] })}>{isTarget ? 'Remove from targets' : 'Add to my targets'}</button>}
      />
      <div className="grid-12">
        <section className="card span-7 stack">
          <h2 className="card__title">Verified facts</h2>
          {c.facts.length === 0 ? (
            <Callout tone="warning" title="Hiring process not yet verified">PrepForge has not verified this company's process from an official source. Ask your recruiter, and treat the guidance below as general preparation advice.</Callout>
          ) : (
            <ul className="list-plain stack">
              {c.facts.map((f) => (
                <li key={f.text} className="fact">
                  <p className="small">{f.text}</p>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="xsmall">Source: {f.source} (verified {f.verifiedOn}) <ExternalLink size={11} aria-hidden style={{ display: 'inline' }} /></a>
                </li>
              ))}
            </ul>
          )}
          {c.unverified.length > 0 && (
            <>
              <h3 className="eyebrow">Unverified or changing</h3>
              <ul className="prose small">{c.unverified.map((u) => <li key={u}>{u}</li>)}</ul>
            </>
          )}
          {c.behavioural && (
            <>
              <h3 className="eyebrow">Behavioural preparation</h3>
              <p className="small">{c.behavioural.framework}. Build stories in <Link to="/mock">Mock interviews → STAR stories</Link>.</p>
              {c.behavioural.principles && <div className="row" style={{ gap: 6 }}>{c.behavioural.principles.map((p) => <Badge key={p} tone="outline">{p}</Badge>)}</div>}
              {c.behavioural.url && <a href={c.behavioural.url} target="_blank" rel="noopener noreferrer" className="xsmall">Official list <ExternalLink size={11} aria-hidden style={{ display: 'inline' }} /></a>}
            </>
          )}
        </section>
        <section className="card span-5 stack">
          <h2 className="card__title">Your readiness (weighted)</h2>
          <div className="row-between"><span className="small">Weighted score</span><strong>{w.score === null ? '—' : `${w.score}%`}</strong></div>
          <Progress value={w.score ?? 0} tone="mastery" label="Weighted readiness" />
          <p className="xsmall muted">Evidence coverage: {Math.round(w.coverage * 100)}% of the weighting. Weights are our recommendation, not company data.</p>
          <h3 className="eyebrow mt-2">PrepForge recommendation</h3>
          <ul className="prose small">{c.recommendation.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          <h3 className="eyebrow mt-2">Focus topics</h3>
          <ul className="list-plain stack-sm">
            {c.recommendation.focusTopics.map((id) => {
              const t = TOPIC_BY_ID.get(id);
              if (!t) return null;
              return <li key={id} className="row-between small"><Link to={`/learn/${t.moduleId}/${t.id}`}>{t.title}</Link><LevelBadge level={mastery.get(id)!.level} /></li>;
            })}
          </ul>
          <Link to="/oa" className="btn btn--secondary">Take a practice assessment</Link>
        </section>
      </div>
    </div>
  );
}
