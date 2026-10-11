import { Link } from 'react-router-dom';
import { useStore } from '@/store/store';
import { ERROR_CATEGORIES, ERROR_LABEL } from '@/features/coach/errorCategories';
import { PROBLEM_BY_SLUG, SQL_EXERCISE_BY_ID, TOPIC_BY_ID } from '@/content/registry';
import { errorCategoryCounts } from '@/engine/stats';
import { useEvidenceState } from '@/hooks/useDerived';
import { Badge, EmptyState, PageHeader } from '@/components/ui';
import { BarList } from '@/components/Charts';

export default function MistakesPage() {
  const s = useEvidenceState();
  const problemProgress = useStore((x) => x.problemProgress);
  const counts30 = errorCategoryCounts(s, 30);
  const countsAll = errorCategoryCounts(s, 3650);
  const total = Object.values(countsAll).reduce((a, b) => a + b, 0);

  const entries = Object.entries(problemProgress).flatMap(([slug, pp]) => pp.attempts.filter((a) => a.errorCategories.length || a.outcome !== 'independent').map((a) => ({ slug, a })))
    .sort((x, y) => y.a.at.localeCompare(x.a.at));
  const sqlEntries = s.sqlAttempts.filter((a) => !a.passedAll).slice(-20).reverse();

  // Topic-level weakness: count hinted/unsolved attempts per primary topic.
  const byTopic: Record<string, number> = {};
  for (const { slug, a } of entries) {
    if (a.outcome === 'independent') continue;
    const t = PROBLEM_BY_SLUG.get(slug)?.primaryTopicId;
    if (t) byTopic[t] = (byTopic[t] ?? 0) + 1;
  }

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Retain" title="Mistake journal" lead="Every error category you record in the coach, and every failed SQL check. Use it to choose targeted practice." />
      {total === 0 && entries.length === 0 ? (
        <EmptyState title="No mistakes recorded yet">When you log a problem attempt, tick what went wrong. Patterns appear here.</EmptyState>
      ) : (
        <>
          <div className="grid-12">
            <section className="card span-6">
              <h2 className="card__title mb-4">Error categories (all time)</h2>
              <BarList rows={ERROR_CATEGORIES.map((c) => ({ label: c.label, value: total ? Math.round((100 * (countsAll[c.id] ?? 0)) / total) : 0 }))} />
              <p className="xsmall muted mt-4">Bars show each category's share of all recorded errors. Last 30 days: {Object.entries(counts30).map(([k, v]) => `${ERROR_LABEL[k] ?? k} ${v}`).join(' · ') || 'none'}.</p>
            </section>
            <section className="card span-6">
              <h2 className="card__title mb-4">What to do about it</h2>
              <ul className="list-plain stack">
                {ERROR_CATEGORIES.filter((c) => countsAll[c.id]).sort((a, b) => (countsAll[b.id] ?? 0) - (countsAll[a.id] ?? 0)).slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <span className="strong small">{c.label}</span> <Badge tone="warning">{countsAll[c.id]}</Badge>
                    <p className="small muted">{c.remedy}</p>
                    <Link to={c.href} className="small">Practise this →</Link>
                  </li>
                ))}
              </ul>
              {Object.keys(byTopic).length > 0 && (
                <>
                  <h3 className="eyebrow mt-6 mb-2">Topics where you needed help most</h3>
                  <div className="row">{Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, n]) => <Link key={t} to={`/learn/dsa/${t}`}><Badge tone="outline">{TOPIC_BY_ID.get(t)?.title} · {n}</Badge></Link>)}</div>
                </>
              )}
            </section>
          </div>
          <section className="card">
            <h2 className="card__title mb-4">Recent attempts that needed help</h2>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Problem</th><th>Outcome</th><th>Errors</th><th>Takeaway</th><th>Date</th></tr></thead>
                <tbody>
                  {entries.slice(0, 50).map(({ slug, a }) => (
                    <tr key={slug + a.at}>
                      <td><Link to={`/problems/${slug}`}>{PROBLEM_BY_SLUG.get(slug)?.title ?? slug}</Link></td>
                      <td className="small">{a.outcome}</td>
                      <td><span className="row" style={{ gap: 4 }}>{a.errorCategories.map((c) => <Badge key={c} tone="warning">{ERROR_LABEL[c]}</Badge>)}</span></td>
                      <td className="small">{a.reflection || '—'}</td>
                      <td className="small nowrap">{new Date(a.at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {sqlEntries.length > 0 && (
            <section className="card">
              <h2 className="card__title mb-4">Recent failed SQL checks</h2>
              <ul className="list-plain stack-sm">
                {sqlEntries.map((a) => <li key={a.at} className="small"><Link to={`/sql/exercises/${a.exerciseId}`}>{SQL_EXERCISE_BY_ID.get(a.exerciseId)?.title}</Link> · failed: {a.failedHidden.join(', ') || 'sample data'}</li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
