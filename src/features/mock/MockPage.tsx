import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { PROBLEMS, TOPICS } from '@/content/registry';
import { COMPANY_BY_ID } from '@/content/companies';
import { useStore } from '@/store/store';
import { formatClock, formatDuration } from '@/engine/dates';
import { Badge, Callout, EmptyState, PageHeader } from '@/components/ui';

type Kind = 'coding' | 'behavioural' | 'system-design';

// Original, generic behavioural prompts (not attributed to any company).
const BEHAVIOURAL = [
  { q: 'Tell me about a time you had to learn something new quickly to finish a task.', tags: ['Learn and Be Curious', 'Deliver Results'] },
  { q: 'Describe a project where you took ownership beyond what was asked of you.', tags: ['Ownership'] },
  { q: 'Tell me about a time you disagreed with a teammate. What did you do?', tags: ['Have Backbone; Disagree and Commit', 'Earn Trust'] },
  { q: 'Describe a time you made a mistake. How did you handle it?', tags: ['Earn Trust', 'Ownership'] },
  { q: 'Tell me about the most technically difficult problem you have solved.', tags: ['Dive Deep', 'Invent and Simplify'] },
  { q: 'Describe a time you had to make a decision with incomplete information.', tags: ['Bias for Action', 'Are Right, A Lot'] },
  { q: 'Tell me about a time you simplified a process or a piece of code.', tags: ['Invent and Simplify', 'Frugality'] },
  { q: 'Describe a time you missed a deadline or nearly did. What did you learn?', tags: ['Deliver Results', 'Ownership'] },
  { q: 'Tell me about a time you raised the quality bar on a team project.', tags: ['Insist on the Highest Standards'] },
  { q: 'Describe a situation where you put the user or customer first.', tags: ['Customer Obsession'] },
  { q: 'Tell me about a time you helped a teammate grow or get unblocked.', tags: ['Hire and Develop the Best'] },
  { q: 'Describe an ambitious goal you set and how you pursued it.', tags: ['Think Big'] },
];

const RUBRICS: Record<Kind, string[]> = {
  coding: ['Clarified the problem and constraints', 'Explained the approach before coding', 'Code correctness', 'Tested with edge cases', 'Stated complexity correctly'],
  behavioural: ['Clear situation and task', 'Specific actions (I, not we)', 'Measurable result', 'Reflection or learning', 'Within about 3 minutes'],
  'system-design': ['Clarified requirements', 'Estimated scale', 'Clear high-level design', 'Data model and API', 'Discussed trade-offs and bottlenecks'],
};

const DURATION: Record<Kind, number> = { coding: 45 * 60, behavioural: 3 * 60, 'system-design': 45 * 60 };

function random<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

export default function MockPage() {
  const [tab, setTab] = useState<'mock' | 'stories' | 'history'>('mock');
  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Practice" title="Mock interviews" lead="Timed rehearsals with a rubric. Scores are self-assessed and labelled as such; they feed only the communication dimension, at low weight." />
      <div className="tabs" role="tablist">
        {(['mock', 'stories', 'history'] as const).map((t) => <button key={t} role="tab" className="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t === 'mock' ? 'Start a mock' : t === 'stories' ? 'STAR stories' : 'History'}</button>)}
      </div>
      {tab === 'mock' && <MockRunner />}
      {tab === 'stories' && <Stories />}
      {tab === 'history' && <History />}
    </div>
  );
}

function MockRunner() {
  const progress = useStore((s) => s.problemProgress);
  const addMock = useStore((s) => s.addMock);
  const [kind, setKind] = useState<Kind | null>(null);
  const [ref, setRef] = useState('');
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [rubric, setRubric] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!kind || done) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [kind, done]);

  const sdCases = useMemo(() => TOPICS.filter((t) => t.id.startsWith('sd.case-')), []);

  const start = (k: Kind) => {
    let r = '';
    if (k === 'coding') {
      const pool = PROBLEMS.filter((p) => !p.premium && p.difficulty === 'medium' && !(progress[p.slug]?.attempts.length));
      r = random(pool.length ? pool : PROBLEMS.filter((p) => !p.premium)).slug;
    } else if (k === 'behavioural') r = String(Math.floor(Math.random() * BEHAVIOURAL.length));
    else r = random(sdCases).id;
    setKind(k); setRef(r); setStartedAt(Date.now()); setNow(Date.now()); setRubric({}); setNotes(''); setDone(false);
  };

  if (!kind) {
    return (
      <div className="grid grid-3">
        <div className="card stack-sm"><h2 className="card__title">Coding (45 min)</h2><p className="small muted">A random unseen medium problem with no hints. Suggested split: clarify 5, approach 10, code 20, test 5, complexity 5 minutes.</p><button className="btn btn--primary btn--sm" onClick={() => start('coding')}>Start coding mock</button></div>
        <div className="card stack-sm"><h2 className="card__title">Behavioural (3 min)</h2><p className="small muted">A random behavioural question. Answer aloud in STAR form within 3 minutes.</p><button className="btn btn--primary btn--sm" onClick={() => start('behavioural')}>Start behavioural mock</button></div>
        <div className="card stack-sm"><h2 className="card__title">System design (45 min)</h2><p className="small muted">A new-grad case study prompt with a checklist timer. Lessons for case studies are planned; use the checklist.</p><button className="btn btn--primary btn--sm" onClick={() => start('system-design')}>Start design mock</button></div>
      </div>
    );
  }

  const elapsed = (now - startedAt) / 1000;
  const left = DURATION[kind] - elapsed;
  const problem = kind === 'coding' ? PROBLEMS.find((p) => p.slug === ref) : undefined;
  const bq = kind === 'behavioural' ? BEHAVIOURAL[Number(ref)] : undefined;
  const sd = kind === 'system-design' ? sdCases.find((t) => t.id === ref) : undefined;

  if (done) {
    return <Callout tone="success" title="Mock saved">Your self-assessment was saved. <button className="btn btn--secondary btn--sm" onClick={() => setKind(null)}>Start another</button></Callout>;
  }

  return (
    <div className="grid-12">
      <section className="card span-7 stack">
        <div className="row-between"><Badge tone="dark">{kind}</Badge><span className={`clock${left < 0 ? ' text-danger' : ''}`}>{left >= 0 ? formatClock(left) : `+${formatClock(-left)}`}</span></div>
        {problem && <><h2 className="card__title">{problem.title}</h2><p className="small">Open it on LeetCode and solve it aloud, as if explaining to an interviewer. No hints.</p><a className="btn btn--secondary" href={problem.url} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'flex-start' }}>Open on LeetCode</a></>}
        {bq && <><h2 className="card__title">{bq.q}</h2><p className="xsmall muted">Often maps to: {bq.tags.join(', ')} (Amazon Leadership Principles).</p></>}
        {sd && <><h2 className="card__title">Design: {sd.title.replace('Case Study: ', '')}</h2><ol className="prose small"><li>Clarify functional and non-functional requirements</li><li>Estimate traffic and storage</li><li>Draw the high-level architecture</li><li>Define the API and data model</li><li>Deep-dive one component</li><li>Bottlenecks, failures and trade-offs</li></ol></>}
        <label className="field"><span className="label">Notes</span><textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      </section>
      <section className="card span-5 stack">
        <h2 className="card__title">Self-assessment rubric</h2>
        <p className="xsmall muted">1 = weak, 4 = strong. Be honest; this is for you.</p>
        {RUBRICS[kind].map((r) => (
          <div key={r} className="stack-sm">
            <span className="small">{r}</span>
            <div className="segmented">{[1, 2, 3, 4].map((n) => <button key={n} type="button" aria-pressed={rubric[r] === n} onClick={() => setRubric({ ...rubric, [r]: n })}>{n}</button>)}</div>
          </div>
        ))}
        <div className="row">
          <button className="btn btn--primary" disabled={Object.keys(rubric).length < RUBRICS[kind].length} onClick={() => { addMock({ id: `mock-${Date.now()}`, kind, at: new Date().toISOString(), refId: ref, durationSec: Math.round(elapsed), rubric, notes }); setDone(true); }}>Finish and save</button>
          <button className="btn btn--ghost" onClick={() => setKind(null)}>Discard</button>
        </div>
      </section>
    </div>
  );
}

function Stories() {
  const stories = useStore((s) => s.stories);
  const upsert = useStore((s) => s.upsertStory);
  const del = useStore((s) => s.deleteStory);
  const principles = COMPANY_BY_ID.get('amazon')?.behavioural?.principles ?? [];
  const [draft, setDraft] = useState({ id: '', title: '', situation: '', task: '', action: '', result: '', principles: [] as string[] });
  const save = () => {
    if (!draft.title.trim()) return;
    upsert({ ...draft, id: draft.id || `story-${Date.now()}` });
    setDraft({ id: '', title: '', situation: '', task: '', action: '', result: '', principles: [] });
  };
  const covered = new Set(stories.flatMap((s) => s.principles));
  return (
    <div className="grid-12">
      <section className="card span-7 stack">
        <h2 className="card__title">{draft.id ? 'Edit story' : 'New STAR story'}</h2>
        <input className="input" placeholder="Short title, e.g. 'Fixed the flaky CI pipeline'" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} aria-label="Story title" />
        {(['situation', 'task', 'action', 'result'] as const).map((k) => (
          <label key={k} className="field"><span className="label">{k[0].toUpperCase() + k.slice(1)}</span><textarea className="textarea" rows={2} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} /></label>
        ))}
        <fieldset className="field" style={{ border: 0, padding: 0 }}>
          <legend className="label mb-2">Principles it demonstrates</legend>
          <div className="row" style={{ gap: 6 }}>{principles.map((p) => <label key={p} className="check chip-check"><input type="checkbox" checked={draft.principles.includes(p)} onChange={(e) => setDraft({ ...draft, principles: e.target.checked ? [...draft.principles, p] : draft.principles.filter((x) => x !== p) })} />{p}</label>)}</div>
        </fieldset>
        <button className="btn btn--primary" onClick={save} style={{ alignSelf: 'flex-start' }}><Plus /> Save story</button>
      </section>
      <section className="card span-5 stack">
        <h2 className="card__title">Your stories ({stories.length})</h2>
        <p className="xsmall muted">Principle coverage: {covered.size}/{principles.length}</p>
        {stories.length === 0 ? <EmptyState title="No stories yet">Aim for 6–8 strong stories that together cover most principles.</EmptyState> : (
          <ul className="list-plain stack-sm">
            {stories.map((s) => (
              <li key={s.id} className="card card--compact">
                <div className="row-between"><button className="history-item strong small" onClick={() => setDraft({ id: s.id, title: s.title, situation: s.situation, task: s.task, action: s.action, result: s.result, principles: s.principles })}>{s.title}</button><button className="icon-btn" aria-label="Delete story" onClick={() => { if (window.confirm('Delete this story?')) del(s.id); }}><Trash2 size={16} /></button></div>
                <div className="row" style={{ gap: 4 }}>{s.principles.map((p) => <Badge key={p} tone="outline">{p}</Badge>)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function History() {
  const mocks = useStore((s) => s.mockInterviews);
  if (!mocks.length) return <EmptyState title="No mocks yet">Your self-assessed mock results appear here.</EmptyState>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Date</th><th>Type</th><th>Item</th><th>Duration</th><th>Average rubric</th></tr></thead>
        <tbody>
          {[...mocks].reverse().map((m) => {
            const v = Object.values(m.rubric);
            const avg = v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '—';
            return (
              <tr key={m.id}>
                <td className="small">{new Date(m.at).toLocaleString()}</td>
                <td><Badge tone="outline">{m.kind}</Badge></td>
                <td className="small">{m.kind === 'coding' ? <Link to={`/problems/${m.refId}`}>{PROBLEMS.find((p) => p.slug === m.refId)?.title}</Link> : m.kind === 'behavioural' ? BEHAVIOURAL[Number(m.refId)]?.q : m.refId}</td>
                <td className="small">{formatDuration(m.durationSec)}</td>
                <td className="small">{avg} / 4</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
