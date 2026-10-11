import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, CheckCircle2, Circle, ExternalLink, Plus } from 'lucide-react';
import { MODULE_BY_ID, PROBLEM_BY_SLUG, SQL_EXERCISE_BY_ID, TOPIC_BY_ID, MCQ_BY_ID } from '@/content/registry';
import type { Topic } from '@/content/schema';
import { useStore } from '@/store/store';
import { useMasteryMap } from '@/hooks/useDerived';
import { Markdown } from '@/components/Markdown';
import { CodeBlock } from '@/components/CodeBlock';
import { TraceStepper } from '@/components/TraceStepper';
import { Badge, Callout, ConfidenceNote, DifficultyBadge, Disclosure, EmptyState, LevelBadge, PageHeader, Progress, StatusBadge } from '@/components/ui';
import { McqSession } from '@/features/mcq/McqSession';
import { formatDuration } from '@/engine/dates';
import { Flashcards } from '@/features/revision/Flashcards';
import NotFound from '@/features/NotFound';

const TABS = ['learn', 'practice', 'mcqs', 'interview', 'revise', 'mastery', 'resources'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = { learn: 'Learn', practice: 'Practice', mcqs: 'MCQs', interview: 'Interview Qs', revise: 'Revise', mastery: 'Mastery test', resources: 'Resources' };

export default function TopicPage() {
  const { moduleId, topicId } = useParams();
  const topic = TOPIC_BY_ID.get(topicId ?? '');
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as Tab) ? params.get('tab') : 'learn') as Tab;
  const visitTopic = useStore((s) => s.visitTopic);
  useEffect(() => { if (topic) visitTopic(topic.id); }, [topic, visitTopic]);
  const mastery = useMasteryMap();
  if (!topic || topic.moduleId !== moduleId) return <NotFound />;
  const mod = MODULE_BY_ID.get(topic.moduleId)!;
  const m = mastery.get(topic.id)!;

  const counts: Partial<Record<Tab, number>> = { practice: topic.problemIds.length, mcqs: topic.mcqIds.length, interview: topic.interviewQuestions.length };
  const setTab = (t: Tab) => setParams(t === 'learn' ? {} : { tab: t }, { replace: true });

  return (
    <div className="topic-layout">
      <div className="topic-main">
        <PageHeader
          crumbs={[{ to: '/learn', label: 'Learn' }, { to: `/learn/${mod.id}`, label: mod.shortTitle }]}
          eyebrow={`${mod.shortTitle} · ${topic.level}`}
          title={topic.title}
          lead={topic.summary}
          actions={<><StatusBadge status={topic.status} /><LevelBadge level={m.level} /></>}
        />
        <div className="tabs" role="tablist" aria-label="Topic sections">
          {TABS.map((t) => (
            <button key={t} role="tab" className="tab" aria-selected={tab === t} onClick={() => setTab(t)} id={`tab-${t}`} aria-controls={`panel-${t}`}>
              {TAB_LABEL[t]}{counts[t] ? <span className="count">{counts[t]}</span> : null}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'learn' && <LearnTab topic={topic} />}
          {tab === 'practice' && <PracticeTab topic={topic} />}
          {tab === 'mcqs' && (topic.mcqIds.length ? <McqSession ids={topic.mcqIds} title={topic.title} /> : <EmptyState title="No MCQs yet">MCQs for this topic are planned.</EmptyState>)}
          {tab === 'interview' && <InterviewTab topic={topic} />}
          {tab === 'revise' && <ReviseTab topic={topic} />}
          {tab === 'mastery' && <MasteryTab topic={topic} />}
          {tab === 'resources' && <ResourcesTab topic={topic} />}
        </div>
      </div>
      <aside className="topic-rail" aria-label="Topic progress">
        <div className="card card--compact stack-sm">
          <h2 className="eyebrow">Your evidence</h2>
          <div className="row-between small"><span>Reading completion</span><strong>{m.completionPct}%</strong></div>
          <Progress value={m.completionPct} label="Reading completion" />
          <div className="row-between small mt-2"><span>Mastery</span><strong>{m.masteryPct === null ? '—' : `${m.masteryPct}%`}</strong></div>
          <Progress value={m.masteryPct ?? 0} tone="mastery" label="Mastery" />
          <ConfidenceNote c={m.confidence} />
          <ul className="evidence-list xsmall">
            <li>First-try MCQs: {m.mcq.correct}/{m.mcq.total} correct</li>
            <li>Problems: {m.application.independent} independent, {m.application.withHints} with hints, {m.application.afterSolution} after solution</li>
            <li>Mastery test: {m.masteryTestPassed ? 'passed' : 'not passed yet'}</li>
            <li>Retention: {m.retention.successes} delayed recalls, {m.retention.lapses} lapses</li>
          </ul>
          {m.studiedButCannotApply && <Callout tone="warning">You have read most of this topic, but your problem results are weak. Practise easier problems with the coach.</Callout>}
        </div>
        <TopicNotes topic={topic} />
        {topic.prerequisites.length > 0 && (
          <div className="card card--compact">
            <h2 className="eyebrow mb-2">Prerequisites</h2>
            <ul className="list-plain small stack-sm">
              {topic.prerequisites.map((p) => { const t = TOPIC_BY_ID.get(p); return t ? <li key={p}><Link to={`/learn/${t.moduleId}/${t.id}`}>{t.title}</Link> <LevelBadge level={mastery.get(p)!.level} /></li> : null; })}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function LearnTab({ topic }: { topic: Topic }) {
  const read = useStore((s) => s.topicProgress[topic.id]?.sectionsRead ?? []);
  const mark = useStore((s) => s.markSectionRead);
  if (topic.status === 'planned') return <PlannedTopic topic={topic} />;
  return (
    <div className="stack">
      {topic.objectives.length > 0 && (
        <div className="card card--muted">
          <h2 className="eyebrow mb-2">Learning objectives</h2>
          <ul className="prose" style={{ margin: 0 }}>{topic.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
          <p className="xsmall muted mt-2">About {topic.estMinutes} minutes. Marking sections as read tracks completion only; mastery comes from practice.</p>
        </div>
      )}
      {topic.sections.map((s, i) => {
        const isRead = read.includes(s.id);
        return (
          <Disclosure key={s.id} defaultOpen={i === 0} title={s.title} icon={isRead ? <CheckCircle2 size={18} className="icon-success" aria-label="Read" /> : <Circle size={18} className="muted" aria-label="Not read" />}>
            <Markdown md={s.bodyMd} />
            {s.trace && <div className="mt-4"><TraceStepper steps={s.trace} /></div>}
            {s.code && <div className="mt-4"><CodeBlock samples={s.code} /></div>}
            <div className="mt-4">
              <label className="check"><input type="checkbox" checked={isRead} onChange={(e) => mark(topic.id, s.id, e.target.checked)} /> Mark this section as read</label>
            </div>
          </Disclosure>
        );
      })}
      {topic.recognition && (
        <section className="card">
          <h2 className="card__title mb-4">Pattern recognition: when to use this</h2>
          <div className="grid grid-2">
            <div><h3 className="eyebrow mb-2">Signals</h3><ul className="prose">{topic.recognition.signals.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><h3 className="eyebrow mb-2">Looks similar, but use something else</h3><ul className="prose">{topic.recognition.antiSignals.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div>
          <h3 className="eyebrow mt-6 mb-2">Questions to ask yourself on an unfamiliar problem</h3>
          <ol className="prose">{topic.recognition.decisionQuestions.map((x) => <li key={x}>{x}</li>)}</ol>
        </section>
      )}
    </div>
  );
}

function PlannedTopic({ topic }: { topic: Topic }) {
  return (
    <div className="stack">
      <Callout tone="info" title="Lessons for this topic are planned">
        This topic is part of the curriculum, but its full lesson (explanations, dry runs, MCQs and mastery test) is not written yet. It is tracked in the roadmap file <code>what_to_do.md</code>. Practice below is real and verified.
      </Callout>
      {topic.prerequisites.length > 0 && <p className="small">Prerequisites: {topic.prerequisites.map((p) => TOPIC_BY_ID.get(p)?.title ?? p).join(', ')}</p>}
      {topic.problemIds.length > 0 && <p className="small">{topic.problemIds.length} verified practice items are available in the Practice tab, each with pattern-level coaching.</p>}
    </div>
  );
}

function PracticeTab({ topic }: { topic: Topic }) {
  const progress = useStore((s) => s.problemProgress);
  const sqlAttempts = useStore((s) => s.sqlAttempts);
  const items = topic.problemIds;
  if (!items.length) return <EmptyState title="No practice items yet">Practice for this topic is planned. Use the MCQs and interview questions meanwhile.</EmptyState>;
  if (topic.moduleId === 'sql') {
    return (
      <div className="topic-list">
        {items.map((id) => {
          const e = SQL_EXERCISE_BY_ID.get(id);
          if (!e) return null;
          const passed = sqlAttempts.some((a) => a.exerciseId === id && a.passedAll);
          return (
            <Link key={id} to={`/sql/exercises/${id}`} className="topic-row">
              <span className="grow"><span className="topic-row__title">{e.title}</span></span>
              <span className="topic-row__meta"><DifficultyBadge d={e.difficulty} />{passed && <Badge tone="success">Passed</Badge>}</span>
            </Link>
          );
        })}
      </div>
    );
  }
  const probs = items.map((id) => PROBLEM_BY_SLUG.get(id)).filter((p) => !!p);
  const groups = [
    { title: 'Beginner', d: 'easy' as const },
    { title: 'Intermediate', d: 'medium' as const },
    { title: 'Advanced', d: 'hard' as const },
  ];
  return (
    <div className="stack">
      <p className="small muted">Open a problem to work through it with the Problem-Solving Coach: understand, brute force, bottleneck, pattern, code, test, reflect. Hints are revealed one at a time.</p>
      {groups.map((g) => {
        const list = probs.filter((p) => p!.difficulty === g.d).sort((a, b) => Number(b!.primaryTopicId === topic.id) - Number(a!.primaryTopicId === topic.id));
        if (!list.length) return null;
        return (
          <section key={g.d}>
            <h3 className="eyebrow mb-2">{g.title} ({list.length})</h3>
            <div className="topic-list">
              {list.map((p) => {
                const st = progress[p!.slug]?.status ?? 'todo';
                return (
                  <Link key={p!.slug} to={`/problems/${p!.slug}`} className="topic-row">
                    <span className="grow">
                      <span className="topic-row__title">{p!.title}</span>
                      <span className="xsmall muted">#{p!.leetcodeId} · {p!.patterns.slice(0, 3).join(', ') || 'Pattern guidance'}</span>
                    </span>
                    <span className="topic-row__meta">
                      {p!.premium && <Badge tone="warning">Premium</Badge>}
                      {st === 'solved' && <Badge tone="success">Solved</Badge>}
                      {st === 'attempted' && <Badge tone="info">Attempted</Badge>}
                      <DifficultyBadge d={p!.difficulty} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function InterviewTab({ topic }: { topic: Topic }) {
  const addCard = useStore((s) => s.addCard);
  const cards = useStore((s) => s.reviewCards);
  if (!topic.interviewQuestions.length) return <EmptyState title="No interview questions yet">Interview questions for this topic are planned.</EmptyState>;
  return (
    <div className="stack">
      <p className="small muted">Answer aloud first, then open the model answer. Save questions you could not answer well to your revision queue.</p>
      {topic.interviewQuestions.map((q) => {
        const id = `${topic.id}:${q.id}`;
        const saved = !!cards[`interview-q:${id}`];
        return (
          <Disclosure key={q.id} title={q.q}>
            <Markdown md={q.answerMd} />
            {q.followUps && q.followUps.length > 0 && (
              <>
                <h4 className="mt-4">Likely follow-ups</h4>
                <ul className="prose">{q.followUps.map((f) => <li key={f}>{f}</li>)}</ul>
              </>
            )}
            <button className="btn btn--secondary btn--sm mt-4" disabled={saved} onClick={() => addCard('interview-q', id, topic.id)}>
              {saved ? <><BookmarkCheck /> In revision queue</> : <><Plus /> Add to revision</>}
            </button>
          </Disclosure>
        );
      })}
    </div>
  );
}

function ReviseTab({ topic }: { topic: Topic }) {
  if (topic.status === 'planned') return <EmptyState title="Revision notes are planned">They will appear here when the lesson is written.</EmptyState>;
  return (
    <div className="stack">
      <section className="card">
        <h2 className="card__title mb-4">Quick revision notes</h2>
        <Markdown md={topic.revision.notesMd} />
      </section>
      {topic.revision.templates && topic.revision.templates.length > 0 && (
        <section className="stack-sm">
          <h2 className="eyebrow">Templates</h2>
          {topic.revision.templates.map((t, i) => <CodeBlock key={i} samples={[t]} />)}
        </section>
      )}
      {topic.revision.flashcards.length > 0 && <Flashcards topicId={topic.id} cards={topic.revision.flashcards} />}
    </div>
  );
}

function MasteryTab({ topic }: { topic: Topic }) {
  const tests = useStore((s) => s.topicProgress[topic.id]?.masteryTests ?? []);
  const record = useStore((s) => s.recordMasteryTest);
  const attempts = useStore((s) => s.mcqAttempts);
  const [running, setRunning] = useState<string[] | null>(null);
  const crit = topic.mastery;
  const pick = useMemo(() => () => {
    const seen = new Set(attempts.map((a) => a.mcqId));
    const unseen = topic.mcqIds.filter((id) => !seen.has(id));
    const seenIds = topic.mcqIds.filter((id) => seen.has(id));
    const shuffle = (a: string[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
    return [...shuffle(unseen), ...shuffle(seenIds)].slice(0, Math.min(crit.testSize, topic.mcqIds.length)).filter((id) => MCQ_BY_ID.has(id));
  }, [attempts, topic, crit.testSize]);

  if (topic.mcqIds.length < 4) return <EmptyState title="Mastery test not available yet">A mastery test needs at least 4 MCQs for this topic.</EmptyState>;

  if (running) {
    return (
      <McqSession
        ids={running}
        mode="test"
        context="mastery"
        timeLimitSec={crit.testMinutes * 60}
        title="Mastery test"
        onFinish={(r) => record(topic.id, { at: new Date().toISOString(), correct: r.correct, total: r.total, scorePct: Math.round((100 * r.correct) / r.total), durationSec: r.durationSec, passed: (100 * r.correct) / r.total >= crit.passPct })}
      />
    );
  }

  return (
    <div className="stack">
      <section className="card">
        <h2 className="card__title">Mastery test</h2>
        <p className="small muted mt-2">A timed check that you can apply this topic. Unseen questions are chosen first, and answers are revealed only after you submit.</p>
        <ul className="prose mt-4">
          <li>{Math.min(crit.testSize, topic.mcqIds.length)} questions in {crit.testMinutes} minutes; pass mark {crit.passPct}%.</li>
          <li><strong>Interview-ready</strong> also requires mastery ≥ 60% with enough evidence, {crit.minIndependentSolves} independent problem solves ({crit.minMediumIndependent} medium or harder), and at least one successful delayed recall.</li>
        </ul>
        <button className="btn btn--primary mt-4" onClick={() => setRunning(pick())}>Start mastery test</button>
      </section>
      {tests.length > 0 && (
        <section className="card">
          <h3 className="eyebrow mb-2">Previous attempts</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Score</th><th>Time</th><th>Result</th></tr></thead>
              <tbody>
                {[...tests].reverse().map((t) => (
                  <tr key={t.at}><td>{new Date(t.at).toLocaleString()}</td><td>{t.correct}/{t.total} ({t.scorePct}%)</td><td>{formatDuration(t.durationSec)}</td><td>{t.passed ? <Badge tone="success">Passed</Badge> : <Badge tone="danger">Not passed</Badge>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ResourcesTab({ topic }: { topic: Topic }) {
  const resources = topic.resources;
  return (
    <div className="stack">
      {resources.length === 0 ? <EmptyState title="No external resources listed yet" /> : (
        <ul className="resource-list">
          {resources.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="resource">
                <span className="grow"><span className="strong small">{r.title}</span><span className="xsmall muted" style={{ display: 'block' }}>{new URL(r.url).hostname}</span></span>
                <Badge tone="outline">{r.kind}</Badge>
                <ExternalLink size={16} aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="xsmall muted">External links supplement PrepForge; they are checked by the link-verification script. Sites that block automated checks are marked as not HTTP-verifiable.</p>
    </div>
  );
}

function TopicNotes({ topic }: { topic: Topic }) {
  const noteId = `topic:${topic.id}`;
  const note = useStore((s) => s.notes.find((n) => n.id === noteId));
  const upsert = useStore((s) => s.upsertNote);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const bookmarked = useStore((s) => s.bookmarks.some((b) => b.id === `topic:${topic.id}`));
  const [text, setText] = useState(note?.body ?? '');
  useEffect(() => { setText(note?.body ?? ''); }, [note?.body]);
  return (
    <div className="card card--compact stack-sm">
      <div className="row-between">
        <h2 className="eyebrow">My notes</h2>
        <button className="btn btn--ghost btn--sm" onClick={() => toggleBookmark({ refType: 'topic', refId: topic.id, title: topic.title })} aria-pressed={bookmarked}>
          {bookmarked ? <BookmarkCheck /> : <Bookmark />} {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
      </div>
      <textarea
        className="textarea"
        placeholder="Key observations, mistakes you made, templates to remember…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { if (text !== (note?.body ?? '')) upsert({ id: noteId, refType: 'topic', refId: topic.id, title: topic.title, body: text }); }}
        aria-label={`Notes for ${topic.title}`}
      />
      <span className="xsmall muted">Saved when you click outside the box.</span>
    </div>
  );
}
