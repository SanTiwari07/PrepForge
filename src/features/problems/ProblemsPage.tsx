import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlayCircle, Search } from 'lucide-react';
import { PROBLEMS, TOPIC_BY_ID, WALKTHROUGHS, topicsOf } from '@/content/registry';
import type { Difficulty, ProblemList } from '@/content/schema';
import { useStore } from '@/store/store';
import { Badge, DifficultyBadge, EmptyState, PageHeader } from '@/components/ui';

const LIST_LABEL: Record<ProblemList, string> = { blind75: 'Blind 75', neetcode150: 'NeetCode 150', 'top-interview-150': 'Top Interview 150', 'leetcode-75': 'LeetCode 75', 'striver-a2z': 'Striver A2Z', curated: 'Curated' };
const PAGE = 50;

export default function ProblemsPage() {
  const [params, setParams] = useSearchParams();
  const progress = useStore((s) => s.problemProgress);
  const [q, setQ] = useState(params.get('q') ?? '');
  const [limit, setLimit] = useState(PAGE);
  const topic = params.get('topic') ?? '';
  const diff = (params.get('difficulty') ?? '') as Difficulty | '';
  const list = (params.get('list') ?? '') as ProblemList | '';
  const status = params.get('status') ?? '';
  const coach = params.get('coach') ?? '';
  const hidePremium = params.get('premium') !== 'show';

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
    setLimit(PAGE);
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PROBLEMS.filter((p) => {
      if (topic && !p.topicIds.includes(topic)) return false;
      if (diff && p.difficulty !== diff) return false;
      if (list && !p.lists.includes(list)) return false;
      if (hidePremium && p.premium) return false;
      if (coach === 'authored' && !WALKTHROUGHS[p.slug]) return false;
      const st = progress[p.slug]?.status ?? 'todo';
      if (status && st !== status) return false;
      if (needle && !(`${p.title} ${p.leetcodeId} ${p.patterns.join(' ')}`.toLowerCase().includes(needle))) return false;
      return true;
    }).sort((a, b) => {
      const order = { easy: 0, medium: 1, hard: 2 };
      return (Number(!!WALKTHROUGHS[b.slug]) - Number(!!WALKTHROUGHS[a.slug])) || (order[a.difficulty] - order[b.difficulty]) || a.leetcodeId - b.leetcodeId;
    });
  }, [q, topic, diff, list, status, coach, hidePremium, progress]);

  const solved = PROBLEMS.filter((p) => progress[p.slug]?.status === 'solved').length;

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Practice"
        title="Problem bank"
        lead={`${PROBLEMS.length} canonical problems from NeetCode 150, Blind 75, LeetCode Top Interview 150, LeetCode 75 and Striver A2Z, each verified against LeetCode. One record per problem; list memberships are shown as tags.`}
        actions={<Badge tone="outline">{solved} solved</Badge>}
      />
      <div className="card card--compact">
        <div className="filters">
          <label className="field filters__search">
            <span className="sr-only">Search problems</span>
            <span className="input-icon"><Search size={16} aria-hidden /><input className="input" placeholder="Search title, number or pattern" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} /></span>
          </label>
          <select className="select" aria-label="Topic" value={topic} onChange={(e) => set('topic', e.target.value)}>
            <option value="">All topics</option>
            {topicsOf('dsa').map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <select className="select" aria-label="Difficulty" value={diff} onChange={(e) => set('difficulty', e.target.value)}>
            <option value="">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
          <select className="select" aria-label="List" value={list} onChange={(e) => set('list', e.target.value)}>
            <option value="">All lists</option>
            {(Object.keys(LIST_LABEL) as ProblemList[]).filter((l) => l !== 'curated').map((l) => <option key={l} value={l}>{LIST_LABEL[l]}</option>)}
          </select>
          <select className="select" aria-label="Status" value={status} onChange={(e) => set('status', e.target.value)}>
            <option value="">Any status</option><option value="todo">To do</option><option value="attempted">Attempted</option><option value="solved">Solved</option>
          </select>
          <select className="select" aria-label="Coaching" value={coach} onChange={(e) => set('coach', e.target.value)}>
            <option value="">Any coaching</option><option value="authored">Authored walkthrough</option>
          </select>
          <label className="check"><input type="checkbox" checked={!hidePremium} onChange={(e) => set('premium', e.target.checked ? 'show' : '')} /> Show Premium</label>
        </div>
      </div>
      <p className="small muted" aria-live="polite">{filtered.length} problems{topic ? ` in ${TOPIC_BY_ID.get(topic)?.title}` : ''}.</p>
      {filtered.length === 0 ? (
        <EmptyState title="No problems match these filters" action={<button className="btn btn--secondary" onClick={() => { setParams({}); setQ(''); }}>Clear filters</button>} />
      ) : (
        <div className="table-wrap problem-table">
          <table className="table">
            <thead><tr><th>Problem</th><th>Topic</th><th>Difficulty</th><th>Lists</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.slice(0, limit).map((p) => {
                const st = progress[p.slug]?.status ?? 'todo';
                const last = progress[p.slug]?.attempts.at(-1);
                return (
                  <tr key={p.slug}>
                    <td data-label="Problem">
                      <Link to={`/problems/${p.slug}`} className="strong" style={{ color: 'var(--ink)' }}>{p.title}</Link>
                      <span className="xsmall muted" style={{ display: 'block' }}>#{p.leetcodeId}{WALKTHROUGHS[p.slug] ? ' · Authored walkthrough' : ' · Pattern guidance'}{p.videoUrl ? ' · ' : ''}{p.videoUrl && <PlayCircle size={11} aria-label="Video available" style={{ display: 'inline', verticalAlign: '-1px' }} />}</span>
                    </td>
                    <td data-label="Topic"><span className="small">{TOPIC_BY_ID.get(p.primaryTopicId)?.title}</span></td>
                    <td data-label="Difficulty"><DifficultyBadge d={p.difficulty} /></td>
                    <td data-label="Lists"><span className="row" style={{ gap: 4 }}>{p.lists.slice(0, 3).map((l) => <Badge key={l} tone="outline">{LIST_LABEL[l]}</Badge>)}{p.premium && <Badge tone="warning">Premium</Badge>}</span></td>
                    <td data-label="Status">
                      {st === 'solved' ? <Badge tone="success">{last?.outcome === 'independent' ? 'Solved independently' : 'Solved'}</Badge> : st === 'attempted' ? <Badge tone="info">Attempted</Badge> : <span className="xsmall muted">To do</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length > limit && <button className="btn btn--secondary" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, filtered.length - limit)} more</button>}
    </div>
  );
}
