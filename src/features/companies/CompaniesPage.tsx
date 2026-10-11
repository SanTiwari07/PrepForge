import { Link } from 'react-router-dom';
import { COMPANIES } from '@/content/companies';
import { Badge, PageHeader } from '@/components/ui';
import { useStore } from '@/store/store';

export default function CompaniesPage() {
  const targets = useStore((s) => s.profile.targetCompanies);
  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Track" title="Company preparation" lead="Only facts with an official source and a verification date are shown as facts. Everything else is labelled as a recommendation or as unverified." />
      <div className="grid grid-auto">
        {COMPANIES.map((c) => (
          <Link key={c.id} to={`/companies/${c.id}`} className="card card--link stack-sm">
            <div className="row-between"><h2 className="card__title">{c.name}</h2>{targets.includes(c.id) && <Badge tone="dark">Target</Badge>}</div>
            <p className="small muted">{c.summary}</p>
            <p className="xsmall">{c.facts.length ? <Badge tone="success">{c.facts.length} verified facts</Badge> : <Badge tone="warning">Process not yet verified</Badge>}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
