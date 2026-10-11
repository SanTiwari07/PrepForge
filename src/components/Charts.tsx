import { addDays, today } from '@/engine/dates';

/** Horizontal labelled bars. Values are 0..100; null renders as "insufficient evidence". */
export function BarList({ rows }: { rows: { label: string; value: number | null; note?: string; href?: string }[] }) {
  return (
    <div>
      {rows.map((r) => (
        <div className="meter-row" key={r.label}>
          <span className="truncate" title={r.label}>{r.label}</span>
          <div className="progress progress--mastery" role="img" aria-label={`${r.label}: ${r.value === null ? 'insufficient evidence' : `${r.value}%`}`}>
            <div className="progress__bar" style={{ width: `${r.value ?? 0}%` }} />
          </div>
          <span className="small strong" style={{ textAlign: 'right' }}>{r.value === null ? '—' : `${r.value}%`}</span>
        </div>
      ))}
    </div>
  );
}

/** Activity heatmap for the last N weeks (GitHub-style), with an accessible summary. */
export function ActivityHeatmap({ activity, weeks = 18 }: { activity: Record<string, { actions: number }>; weeks?: number }) {
  const now = today();
  const end = new Date(now + 'T00:00:00');
  const dow = (end.getDay() + 6) % 7;
  const days: { date: string; n: number }[] = [];
  const first = addDays(addDays(now, -dow), -7 * (weeks - 1)); // Monday, (weeks - 1) weeks ago
  for (let d = first; d <= now; d = addDays(d, 1)) days.push({ date: d, n: activity[d]?.actions ?? 0 });
  const cols = Math.ceil(days.length / 7);
  const level = (n: number) => (n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : n < 15 ? 3 : 4);
  const fills = ['var(--surface-2)', '#d9ccff', '#b49aff', '#8d63ff', '#5b23e0'];
  const activeDays = days.filter((d) => d.n > 0).length;
  const size = 12;
  const gap = 3;
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${cols * (size + gap)} ${7 * (size + gap)}`} width="100%" style={{ maxWidth: cols * (size + gap) * 1.4 }} role="img" aria-label={`Activity on ${activeDays} of the last ${days.length} days`}>
        {days.map((d, i) => (
          <rect key={d.date} x={Math.floor(i / 7) * (size + gap)} y={(i % 7) * (size + gap)} width={size} height={size} rx={2} fill={fills[level(d.n)]}>
            <title>{`${d.date}: ${d.n} action${d.n === 1 ? '' : 's'}`}</title>
          </rect>
        ))}
      </svg>
      <figcaption className="xsmall muted mt-2">{activeDays} active days in the last {weeks} weeks</figcaption>
    </figure>
  );
}

/** Small trend line for a series of 0..100 values. */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return <span className="xsmall muted">Not enough data for a trend</span>;
  const w = 160, h = 40;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / 100) * (h - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={`${label}: ${values.join(', ')}`}>
      <polyline points={pts} fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
