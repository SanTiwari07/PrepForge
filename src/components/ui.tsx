import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronRight, Info, XCircle } from 'lucide-react';
import type { ContentStatus, Difficulty } from '@/content/schema';
import type { Confidence, MasteryLevel } from '@/engine/mastery';
import { LEVEL_LABEL } from '@/engine/mastery';

export function PageHeader({ eyebrow, title, lead, actions, crumbs }: {
  eyebrow?: string; title: ReactNode; lead?: ReactNode; actions?: ReactNode; crumbs?: { to: string; label: string }[];
}) {
  return (
    <div>
      {crumbs && crumbs.length > 0 && (
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.to} className="row" style={{ gap: 4 }}>
              {i > 0 && <ChevronRight aria-hidden />}
              <Link to={c.to}>{c.label}</Link>
            </span>
          ))}
        </nav>
      )}
      <header className="page-head">
        <div className="page-head__text">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
        </div>
        {actions && <div className="row">{actions}</div>}
      </header>
    </div>
  );
}

export function Badge({ children, tone, title }: { children: ReactNode; tone?: 'info' | 'success' | 'warning' | 'danger' | 'outline' | 'dark'; title?: string }) {
  return <span className={`badge${tone ? ` badge--${tone}` : ''}`} title={title}>{children}</span>;
}

export function DifficultyBadge({ d }: { d: Difficulty }) {
  return <span className={`badge diff-${d}`}>{d[0].toUpperCase() + d.slice(1)}</span>;
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  if (status === 'complete') return <Badge tone="success">Complete</Badge>;
  if (status === 'partial') return <Badge tone="warning">Partial</Badge>;
  return <Badge tone="outline">Planned</Badge>;
}

const LEVEL_TONE: Record<MasteryLevel, 'info' | 'success' | 'warning' | 'outline' | 'dark'> = {
  'not-started': 'outline', learning: 'outline', practising: 'info', proficient: 'success', 'interview-ready': 'dark',
};
export function LevelBadge({ level }: { level: MasteryLevel }) {
  return <Badge tone={LEVEL_TONE[level]}>{LEVEL_LABEL[level]}</Badge>;
}

export function ConfidenceNote({ c }: { c: Confidence }) {
  const label = c === 'none' ? 'No evidence yet' : c === 'low' ? 'Low confidence (few data points)' : c === 'medium' ? 'Medium confidence' : 'High confidence';
  return <span className="xsmall muted">{label}</span>;
}

export function Progress({ value, tone, label, large }: { value: number; tone?: 'mastery' | 'success'; label: string; large?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`progress${tone ? ` progress--${tone}` : ''}${large ? ' progress--lg' : ''}`} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress__bar" style={{ width: `${v}%` }} />
    </div>
  );
}

export function Stat({ label, value, unit, note }: { label: string; value: ReactNode; unit?: string; note?: ReactNode }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}{unit && <small>{unit}</small>}</span>
      {note && <span className="stat__note">{note}</span>}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <p className="empty__title">{title}</p>
      {children && <div className="small" style={{ maxWidth: 520 }}>{children}</div>}
      {action}
    </div>
  );
}

export function Callout({ tone = 'info', children, title }: { tone?: 'info' | 'warning' | 'success' | 'danger'; children: ReactNode; title?: string }) {
  const Icon = tone === 'warning' ? AlertTriangle : tone === 'success' ? CheckCircle2 : tone === 'danger' ? XCircle : Info;
  return (
    <div className={`callout callout--${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon aria-hidden />
      <div>
        {title && <strong style={{ display: 'block', marginBottom: 2 }}>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function Disclosure({ title, children, defaultOpen, icon, extra }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; icon?: ReactNode; extra?: ReactNode }) {
  return (
    <details className="disclosure" open={defaultOpen}>
      <summary>
        {icon}
        <span>{title}</span>
        {extra}
        <ChevronRight className="chev" aria-hidden />
      </summary>
      <div className="disclosure__body">{children}</div>
    </details>
  );
}

export function SubjectDot({ color }: { color: string }) {
  return <span className="nav__dot" style={{ background: `var(${color})` }} aria-hidden />;
}

export function pct(n: number, d: number): number {
  return d > 0 ? Math.round((100 * n) / d) : 0;
}
