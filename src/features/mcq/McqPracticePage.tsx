import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MCQS, MODULES, TOPIC_BY_ID } from '@/content/registry';
import type { Difficulty, McqType, ModuleId } from '@/content/schema';
import { useStore } from '@/store/store';
import { PageHeader, EmptyState } from '@/components/ui';
import { McqSession } from './McqSession';

const TYPES: McqType[] = ['concept', 'complexity', 'code-output', 'compile-error', 'debug', 'edge-case', 'pattern', 'scenario', 'which-method', 'command', 'config', 'design'];

function shuffle<T>(a: T[]): T[] {
  return a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
}

export default function McqPracticePage() {
  const [params] = useSearchParams();
  const attempts = useStore((s) => s.mcqAttempts);
  const [moduleId, setModuleId] = useState<ModuleId | ''>((params.get('module') as ModuleId) ?? '');
  const [type, setType] = useState<McqType | ''>((params.get('type') as McqType) ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [source, setSource] = useState<'all' | 'unseen' | 'incorrect'>('all');
  const [count, setCount] = useState(10);
  const [session, setSession] = useState<string[] | null>(() => {
    const ids = params.get('ids');
    return ids ? ids.split(',') : null;
  });

  const wrongIds = useMemo(() => {
    const last = new Map<string, boolean>();
    for (const a of attempts) last.set(a.mcqId, a.correct);
    return new Set([...last].filter(([, c]) => !c).map(([id]) => id));
  }, [attempts]);
  const seen = useMemo(() => new Set(attempts.map((a) => a.mcqId)), [attempts]);

  const pool = useMemo(() => MCQS.filter((q) =>
    (!moduleId || q.moduleId === moduleId) && (!type || q.type === type) && (!difficulty || q.difficulty === difficulty) &&
    (source === 'all' || (source === 'unseen' ? !seen.has(q.id) : wrongIds.has(q.id)))), [moduleId, type, difficulty, source, seen, wrongIds]);

  if (session) {
    return (
      <div className="stack-lg">
        <PageHeader eyebrow="Practice" title="MCQ session" actions={<button className="btn btn--secondary" onClick={() => setSession(null)}>New session</button>} />
        <McqSession ids={session} />
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Practice" title="MCQ practice" lead="Build a session from any subject, question type and difficulty. Instant feedback with explanations. Only first attempts count as mastery evidence." />
      <section className="card">
        <div className="grid grid-3">
          <label className="field"><span className="label">Subject</span>
            <select className="select" value={moduleId} onChange={(e) => setModuleId(e.target.value as ModuleId | '')}>
              <option value="">All subjects</option>
              {MODULES.map((m) => <option key={m.id} value={m.id}>{m.title} ({MCQS.filter((q) => q.moduleId === m.id).length})</option>)}
            </select>
          </label>
          <label className="field"><span className="label">Question type</span>
            <select className="select" value={type} onChange={(e) => setType(e.target.value as McqType | '')}>
              <option value="">Any type</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="field"><span className="label">Difficulty</span>
            <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}>
              <option value="">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </label>
          <label className="field"><span className="label">Source</span>
            <select className="select" value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
              <option value="all">All questions</option>
              <option value="unseen">Only unseen ({MCQS.filter((q) => !seen.has(q.id)).length})</option>
              <option value="incorrect">Previously incorrect ({wrongIds.size})</option>
            </select>
          </label>
          <label className="field"><span className="label">Number of questions</span>
            <select className="select" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn--primary" disabled={!pool.length} onClick={() => setSession(shuffle(pool).slice(0, count).map((q) => q.id))}>
              Start ({Math.min(count, pool.length)} of {pool.length} available)
            </button>
          </div>
        </div>
      </section>
      {pool.length === 0 && <EmptyState title="No questions match">Try another subject or type. Several subjects do not have MCQs yet; their content is planned.</EmptyState>}
      {pool.length > 0 && (
        <p className="small muted">Topics covered: {[...new Set(pool.flatMap((q) => q.topicIds))].map((t) => TOPIC_BY_ID.get(t)?.title ?? t).join(', ')}</p>
      )}
    </div>
  );
}
