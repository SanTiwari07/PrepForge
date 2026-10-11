import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useStore } from '@/store/store';
import type { ReviewCard } from '@/store/types';
import { dueCards, upcomingCounts } from '@/engine/revision';
import { MCQ_BY_ID, PROBLEM_BY_SLUG, SQL_EXERCISE_BY_ID, TOPIC_BY_ID, topicTitle } from '@/content/registry';
import { Markdown } from '@/components/Markdown';
import { Badge, EmptyState, PageHeader, Stat } from '@/components/ui';
import { McqView } from '@/features/mcq/McqView';
import { isMcqCorrect, } from '@/engine/scoring';
import { gradeFromMcq } from '@/engine/revision';
import { relativeDay } from '@/engine/dates';

function cardContent(c: ReviewCard): { front: string; back?: string; href?: string; title: string } {
  if (c.kind === 'flashcard' || c.kind === 'interview-q') {
    const [topicId, localId] = [c.refId.slice(0, c.refId.lastIndexOf(':')), c.refId.slice(c.refId.lastIndexOf(':') + 1)];
    const t = TOPIC_BY_ID.get(topicId);
    if (c.kind === 'flashcard') {
      const f = t?.revision.flashcards.find((x) => x.id === localId);
      return { title: t?.title ?? topicId, front: f?.front ?? 'Card not found', back: f?.backMd };
    }
    const q = t?.interviewQuestions.find((x) => x.id === localId);
    return { title: t?.title ?? topicId, front: q?.q ?? 'Question not found', back: q?.answerMd };
  }
  if (c.kind === 'problem') {
    const p = PROBLEM_BY_SLUG.get(c.refId);
    return { title: p?.title ?? c.refId, front: `Re-solve **${p?.title}** without hints. Before opening it, recall the key observation and the pattern.`, href: `/problems/${c.refId}` };
  }
  if (c.kind === 'sql') {
    const e = SQL_EXERCISE_BY_ID.get(c.refId);
    return { title: e?.title ?? c.refId, front: `Re-solve the SQL exercise **${e?.title}**.`, href: `/sql/exercises/${c.refId}` };
  }
  return { title: topicTitle(c.topicId), front: 'Review item' };
}

export default function RevisionPage() {
  const cards = useStore((s) => s.reviewCards);
  const review = useStore((s) => s.reviewCard);
  const remove = useStore((s) => s.removeCard);
  const recordMcq = useStore((s) => s.recordMcq);
  const [session, setSession] = useState<string[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mcqSel, setMcqSel] = useState<string[]>([]);
  const [mcqRevealed, setMcqRevealed] = useState(false);
  const all = Object.values(cards);
  const due = useMemo(() => dueCards(all), [all]);
  const upcoming = useMemo(() => upcomingCounts(all, 7), [all]);

  const startSession = (ids: string[]) => { setSession(ids); setIdx(0); setFlipped(false); setMcqSel([]); setMcqRevealed(false); };
  const advance = () => {
    if (!session) return;
    if (idx + 1 >= session.length) { setSession(null); return; }
    setIdx(idx + 1); setFlipped(false); setMcqSel([]); setMcqRevealed(false);
  };

  if (session) {
    const card = cards[session[idx]];
    if (!card) {
      return <EmptyState title="This item was removed" action={<button className="btn btn--primary" onClick={advance}>Continue</button>} />;
    }
    const c = cardContent(card);
    const q = card.kind === 'mcq' ? MCQ_BY_ID.get(card.refId) : undefined;
    return (
      <div className="stack-lg">
        <PageHeader eyebrow={`Review ${idx + 1} of ${session.length}`} title={c.title} actions={<button className="btn btn--secondary" onClick={() => setSession(null)}>End session</button>} />
        {q ? (
          <div className="card">
            <McqView q={q} selected={mcqSel} onToggle={(id) => setMcqSel(q.correct.length > 1 ? (mcqSel.includes(id) ? mcqSel.filter((x) => x !== id) : [...mcqSel, id]) : [id])} revealed={mcqRevealed} />
            <div className="row mt-6">
              {!mcqRevealed ? (
                <button className="btn btn--primary" disabled={!mcqSel.length} onClick={() => {
                  const ok = isMcqCorrect(q, mcqSel);
                  recordMcq({ mcqId: q.id, selected: mcqSel, correct: ok, timeSec: 30, context: 'review' }, card.topicId);
                  review(card.id, gradeFromMcq(ok, 30));
                  setMcqRevealed(true);
                }}>Check answer</button>
              ) : <button className="btn btn--primary" onClick={advance}>Next</button>}
            </div>
          </div>
        ) : (
          <div className="card stack">
            <Markdown md={c.front} />
            {c.href && <Link to={c.href} className="btn btn--secondary" target="_blank">Open it in a new tab</Link>}
            {c.back && !flipped && <button className="btn btn--primary" onClick={() => setFlipped(true)}>Show answer</button>}
            {(flipped || !c.back) && (
              <>
                {c.back && <div className="card card--muted"><Markdown md={c.back} /></div>}
                <p className="small muted">How well did you recall it?</p>
                <div className="grade-row">
                  {([['Again', 1], ['Hard', 3], ['Good', 4], ['Easy', 5]] as const).map(([label, g]) => (
                    <button key={label} className="btn btn--secondary" onClick={() => { review(card.id, g); advance(); }}>{label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Retain" title="Revision" lead="Spaced repetition (an SM-2 variant). Wrong MCQs, hinted problems and failed SQL exercises are added automatically; due items are ordered by forgetting risk." />
      <div className="grid grid-4">
        <div className="card card--compact"><Stat label="Due now" value={due.length} /></div>
        <div className="card card--compact"><Stat label="In queue" value={all.length} /></div>
        <div className="card card--compact"><Stat label="Due in next 7 days" value={upcoming.slice(1).reduce((a, b) => a + b, 0)} /></div>
        <div className="card card--compact"><Stat label="Lapses (forgotten)" value={all.reduce((a, c) => a + c.lapses, 0)} /></div>
      </div>
      <div className="row">
        <button className="btn btn--primary" disabled={!due.length} onClick={() => startSession(due.slice(0, 30).map((c) => c.id))}>Review {Math.min(30, due.length)} due items</button>
        <button className="btn btn--secondary" disabled={!all.some((c) => c.kind === 'mcq')} onClick={() => startSession(all.filter((c) => c.kind === 'mcq').sort(() => Math.random() - 0.5).slice(0, 10).map((c) => c.id))}>Previously incorrect MCQs</button>
        <button className="btn btn--secondary" disabled={all.length < 3} onClick={() => startSession([...all].sort(() => Math.random() - 0.5).slice(0, 10).map((c) => c.id))}>Mixed recall test (10)</button>
      </div>
      {all.length === 0 ? (
        <EmptyState title="Your revision queue is empty">Answer MCQs, solve problems with the coach, or add flashcards from a topic's Revise tab.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Item</th><th>Type</th><th>Topic</th><th>Next review</th><th>Ease</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {[...all].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 200).map((c) => (
                <tr key={c.id}>
                  <td className="truncate" style={{ maxWidth: 320 }}>{cardContent(c).title}</td>
                  <td><Badge tone="outline">{c.kind}</Badge></td>
                  <td className="small">{topicTitle(c.topicId)}</td>
                  <td className="small">{relativeDay(c.due)}</td>
                  <td className="small">{c.ease.toFixed(2)}</td>
                  <td><button className="icon-btn" aria-label="Remove from revision" onClick={() => remove(c.id)}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
