import { displayOptions } from './optionOrder';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bookmark, BookmarkCheck, RotateCcw } from 'lucide-react';
import type { MCQ } from '@/content/schema';
import { modulesOfMcqs } from '@/content/registry';
import { getMcq, useModules } from '@/content/loader';
import { PackStatus } from '@/components/PackStatus';
import { useStore } from '@/store/store';
import type { McqContext } from '@/store/types';
import { isMcqCorrect } from '@/engine/scoring';
import { formatClock } from '@/engine/dates';
import { Callout, EmptyState, Stat } from '@/components/ui';
import { McqView } from './McqView';

export interface SessionResult { correct: number; total: number; durationSec: number; answers: { id: string; correct: boolean }[] }

/**
 * Practice mode: instant feedback per question.
 * Test mode: no feedback until submitted, optional time limit, review at the end.
 */
interface SessionProps {
  ids: string[]; mode?: 'practice' | 'test'; context?: McqContext; timeLimitSec?: number; onFinish?: (r: SessionResult) => void; title?: string;
}

export function McqSession(props: SessionProps) {
  const modules = useMemo(() => modulesOfMcqs(props.ids), [props.ids]);
  const state = useModules(modules);
  if (state !== 'ready') return <PackStatus state={state} modules={modules} />;
  return <LoadedSession {...props} />;
}

/** Rendered once the packs holding these MCQs have loaded (so a test timer starts after loading). */
function LoadedSession({ ids, mode = 'practice', context = 'practice', timeLimitSec, onFinish, title }: SessionProps) {
  const questions = useMemo(() => ids.map((id) => getMcq(id)).filter((q): q is MCQ => !!q), [ids]);
  const recordMcq = useStore((s) => s.recordMcq);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const bookmarks = useStore((s) => s.bookmarks);
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());
  const qStart = useRef(Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (mode !== 'test' || !timeLimitSec || finished) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [mode, timeLimitSec, finished]);

  const q = questions[i];

  const toggle = useCallback((optId: string) => {
    if (!q) return;
    setSelected((s) => {
      const cur = s[q.id] ?? [];
      const multi = q.correct.length > 1;
      const next = multi ? (cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId]) : [optId];
      return { ...s, [q.id]: next };
    });
  }, [q]);

  const check = useCallback(() => {
    if (!q || revealed[q.id] || !(selected[q.id]?.length)) return;
    const correct = isMcqCorrect(q, selected[q.id]);
    recordMcq({ mcqId: q.id, selected: selected[q.id], correct, timeSec: Math.round((Date.now() - qStart.current) / 1000), context }, q.topicIds[0]);
    setRevealed((r) => ({ ...r, [q.id]: true }));
  }, [q, revealed, selected, recordMcq, context]);

  const submitTest = useCallback(() => {
    if (finished) return;
    const per = Math.round((Date.now() - startedAt.current) / 1000 / Math.max(1, questions.length));
    const answers = questions.map((qq) => {
      const correct = isMcqCorrect(qq, selected[qq.id]);
      if (selected[qq.id]?.length) recordMcq({ mcqId: qq.id, selected: selected[qq.id], correct, timeSec: per, context }, qq.topicIds[0]);
      return { id: qq.id, correct };
    });
    const r = { correct: answers.filter((a) => a.correct).length, total: questions.length, durationSec: Math.round((Date.now() - startedAt.current) / 1000), answers };
    setRevealed(Object.fromEntries(questions.map((qq) => [qq.id, true])));
    setFinished(true);
    setI(0);
    onFinish?.(r);
  }, [finished, questions, selected, recordMcq, context, onFinish]);

  const remaining = timeLimitSec ? timeLimitSec - (now - startedAt.current) / 1000 : null;
  useEffect(() => { if (remaining !== null && remaining <= 0 && !finished) submitTest(); }, [remaining, finished, submitTest]);

  const next = useCallback(() => {
    if (i < questions.length - 1) { setI(i + 1); qStart.current = Date.now(); }
    else if (mode === 'practice') {
      setFinished(true);
      const answers = questions.map((qq) => ({ id: qq.id, correct: isMcqCorrect(qq, selected[qq.id]) }));
      onFinish?.({ correct: answers.filter((a) => a.correct).length, total: questions.length, durationSec: Math.round((Date.now() - startedAt.current) / 1000), answers });
    }
  }, [i, questions, mode, selected, onFinish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !q) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length && !revealed[q.id]) toggle(displayOptions(q)[n - 1].id);
      if (e.key === 'Enter' && mode === 'practice') { if (revealed[q.id]) next(); else check(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, revealed, toggle, check, next, mode]);

  if (!questions.length) return <EmptyState title="No questions yet">There are no MCQs for this selection yet.</EmptyState>;

  if (finished && mode === 'practice') {
    const correct = questions.filter((qq) => isMcqCorrect(qq, selected[qq.id])).length;
    return (
      <div className="card stack">
        <h3>{title ?? 'Session'} complete</h3>
        <div className="grid grid-3">
          <Stat label="Correct" value={`${correct}/${questions.length}`} />
          <Stat label="Accuracy" value={Math.round((100 * correct) / questions.length)} unit="%" />
          <Stat label="Time" value={formatClock((Date.now() - startedAt.current) / 1000)} />
        </div>
        <p className="small muted">Incorrect answers were added to your revision queue automatically.</p>
        <div className="row">
          <button className="btn btn--secondary" onClick={() => { setI(0); setSelected({}); setRevealed({}); setFinished(false); startedAt.current = Date.now(); }}><RotateCcw /> Try again</button>
        </div>
      </div>
    );
  }

  const isBookmarked = bookmarks.some((b) => b.id === `mcq:${q.id}`);
  const answeredCount = questions.filter((qq) => selected[qq.id]?.length).length;

  return (
    <div className="stack">
      {mode === 'test' && (
        <div className="row-between card card--compact card--muted">
          <span className="small">{finished ? 'Review your answers' : `${answeredCount} of ${questions.length} answered`}</span>
          {remaining !== null && !finished && <span className={`mono strong ${remaining < 60 ? 'text-danger' : ''}`} aria-live="off">{formatClock(remaining)}</span>}
        </div>
      )}
      {mode === 'test' && (
        <div className="q-palette" role="navigation" aria-label="Question navigation">
          {questions.map((qq, k) => {
            const ok = finished ? isMcqCorrect(qq, selected[qq.id]) : null;
            return (
              <button key={qq.id} type="button" className={`q-palette__btn${k === i ? ' is-current' : ''}${selected[qq.id]?.length ? ' is-answered' : ''}${ok === true ? ' is-correct' : ok === false ? ' is-wrong' : ''}`} onClick={() => setI(k)} aria-label={`Question ${k + 1}`} aria-current={k === i}>
                {k + 1}
              </button>
            );
          })}
        </div>
      )}
      <div className="card">
        <McqView q={q} selected={selected[q.id] ?? []} onToggle={toggle} revealed={!!revealed[q.id]} index={i} total={questions.length} />
        <div className="row-between mt-6">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleBookmark({ refType: 'mcq', refId: q.id, title: q.stemMd.slice(0, 80) })} aria-pressed={isBookmarked}>
            {isBookmarked ? <BookmarkCheck /> : <Bookmark />} {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <div className="row">
            {mode === 'practice' && !revealed[q.id] && (
              <button className="btn btn--primary" onClick={check} disabled={!(selected[q.id]?.length)}>Check answer <kbd style={{ background: 'transparent', color: '#fff', borderColor: '#555' }}>Enter</kbd></button>
            )}
            {mode === 'practice' && revealed[q.id] && (
              <button className="btn btn--primary" onClick={next}>{i < questions.length - 1 ? 'Next question' : 'Finish'} <ArrowRight /></button>
            )}
            {mode === 'test' && (
              <>
                <button className="btn btn--secondary" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>Previous</button>
                {i < questions.length - 1 ? (
                  <button className="btn btn--primary" onClick={() => setI(i + 1)}>Next</button>
                ) : !finished ? (
                  <button className="btn btn--primary" onClick={submitTest}>Submit test</button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
      {mode === 'practice' && <p className="xsmall muted">Keys: <kbd>1</kbd>–<kbd>4</kbd> select, <kbd>Enter</kbd> check / next. Only your first attempt at each question counts as evidence.</p>}
      {mode === 'test' && finished && <Callout tone="info">Answers are revealed above. Use the question buttons to review each one.</Callout>}
    </div>
  );
}
