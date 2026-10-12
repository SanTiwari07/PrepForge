import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, ExternalLink, Eye, Lightbulb, Pause, Play, PlayCircle, Timer } from 'lucide-react';
import { PROBLEM_BY_SLUG, WALKTHROUGH_SET } from '@/content/registry';
import { getFullTopic, getWalkthrough, useModules, useWalkthroughs } from '@/content/loader';
import { PackStatus } from '@/components/PackStatus';
import type { CoachWalkthrough, Problem, Topic } from '@/content/schema';
import { emptyProblemProgress, useStore } from '@/store/store';
import type { CoachStage, ErrorCategory, ProblemOutcome } from '@/store/types';
import { Markdown } from '@/components/Markdown';
import { CodeBlock } from '@/components/CodeBlock';
import { Badge, Callout, DifficultyBadge, PageHeader } from '@/components/ui';
import { formatClock, formatDuration } from '@/engine/dates';
import { ERROR_CATEGORIES } from './errorCategories';
import NotFound from '@/features/NotFound';
import { LIST_LABEL } from '@/content/lists';

const STAGES: { id: CoachStage; title: string; prompt: string }[] = [
  { id: 'understand', title: '1. Understand the problem', prompt: 'Restate the task in your own words. What exactly must you return?' },
  { id: 'io', title: '2. Inputs, outputs, constraints, edge cases', prompt: 'List input sizes and ranges. What target complexity do the constraints allow? Which edge cases could break a naive solution?' },
  { id: 'brute', title: '3. Brute force', prompt: 'Describe the simplest correct approach, even if it is slow.' },
  { id: 'brute-complexity', title: '4. Brute-force complexity', prompt: 'What are its time and space? Does it fit the constraints?' },
  { id: 'bottleneck', title: '5. Identify the bottleneck', prompt: 'Which part repeats work or searches repeatedly? That is what you must remove.' },
  { id: 'pattern', title: '6. Discover the pattern', prompt: 'Which technique removes the bottleneck? (hashing, two pointers, window, binary search, heap, DP, graph search…)' },
  { id: 'optimal', title: '7. Optimised approach', prompt: 'Write the steps of the faster algorithm, then dry-run it on a small example.' },
  { id: 'code', title: '8. Write the code', prompt: 'Code it on LeetCode (or your editor). Paste key lines here if you like.' },
  { id: 'test', title: '9. Test it', prompt: 'Run the given examples, then your edge cases. What failed, and why?' },
  { id: 'final-complexity', title: '10. Final complexity', prompt: 'State the time and space of your final solution and justify them.' },
  { id: 'reflect', title: '11. Record what you learned', prompt: 'What was the key observation? How would you recognise this pattern next time?' },
];

function useStopwatch(running: boolean) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  return [sec, setSec] as const;
}

/** Pattern-level guidance for problems without an authored walkthrough. Clearly labelled. */
function patternHints(p: Problem, topic: Topic | undefined): [string, string, string, string] {
  const rec = topic?.recognition;
  return [
    'Restate the problem and write two small examples by hand, including one edge case. Read the constraints and decide the target complexity first (see Complexity Analysis).',
    `Pattern family: **${topic?.title ?? 'see topic'}**${p.patterns.length ? `. LeetCode tags this problem with: ${p.patterns.join(', ')}` : ''}.`,
    rec ? `Ask yourself:\n\n${rec.decisionQuestions.map((q) => `- ${q}`).join('\n')}` : 'Identify what your brute force recomputes and find a structure that avoids it.',
    topic && topic.status !== 'planned' ? `Open the **${topic.title}** lesson and adapt its template (Learn tab → code section).` : 'Write pseudocode for the optimised idea before coding, then dry-run it on your example.',
  ];
}

export default function CoachPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const timedMode = params.get('timed') === '1';
  const problem = PROBLEM_BY_SLUG.get(slug);
  const pp = useStore((s) => s.problemProgress[slug]) ?? emptyProblemProgress();
  const setStageNote = useStore((s) => s.setStageNote);
  const revealHint = useStore((s) => s.revealHint);
  const revealSolution = useStore((s) => s.revealSolution);
  const recordAttempt = useStore((s) => s.recordProblemAttempt);
  const setNotes = useStore((s) => s.setProblemNotes);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const bookmarked = useStore((s) => s.bookmarks.some((b) => b.id === `problem:${slug}`));
  const [running, setRunning] = useState(false);
  const [sec, setSec] = useStopwatch(running);
  const [stage, setStage] = useState<CoachStage>('understand');
  const [showLog, setShowLog] = useState(false);
  const [saved, setSaved] = useState<null | { outcome: ProblemOutcome; sec: number }>(null);
  const [notes, setLocalNotes] = useState(pp.notes);
  const startedRef = useRef(false);

  const dsaPack = useModules(['dsa']);
  const wtState = useWalkthroughs(WALKTHROUGH_SET.has(slug));
  const pack = dsaPack === 'ready' && wtState === 'ready' ? 'ready' : dsaPack === 'error' || wtState === 'error' ? 'error' : 'loading';
  const wt: CoachWalkthrough | undefined = pack === 'ready' ? getWalkthrough(slug) : undefined;
  const topic = problem && pack === 'ready' ? getFullTopic(problem.primaryTopicId) : undefined;
  const hints = useMemo(() => (problem ? (wt ? wt.hints : patternHints(problem, topic)) : null), [problem, wt, topic]);

  useEffect(() => { setLocalNotes(pp.notes); }, [pp.notes]);
  if (!problem || !hints) return <NotFound />;
  if (pack !== 'ready') return <div className="stack"><PageHeader crumbs={[{ to: '/problems', label: 'Problem bank' }]} title={problem.title} /><PackStatus state={pack} modules={['dsa']} /></div>;

  const startIfNeeded = () => { if (!startedRef.current) { startedRef.current = true; setRunning(true); } };
  const limitSec = problem.estMinutes * 60;
  const overtime = timedMode && sec > limitSec;

  return (
    <div className="coach-layout">
      <div className="coach-main stack">
        <PageHeader
          crumbs={[{ to: '/problems', label: 'Problem bank' }, ...(topic ? [{ to: `/learn/dsa/${topic.id}`, label: topic.title }] : [])]}
          eyebrow={`#${problem.leetcodeId} · ${wt ? 'Authored walkthrough' : 'Pattern guidance'}`}
          title={problem.title}
          actions={
            <>
              <DifficultyBadge d={problem.difficulty} />
              {problem.premium && <Badge tone="warning">LeetCode Premium</Badge>}
              <button className="btn btn--ghost btn--sm" onClick={() => toggleBookmark({ refType: 'problem', refId: slug, title: problem.title })} aria-pressed={bookmarked}>{bookmarked ? <BookmarkCheck /> : <Bookmark />} {bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
            </>
          }
        />

        <div className="card card--compact row-between">
          <div className="stack-sm">
            <span className="small">Read the official statement, then work through the stages here. Submit your code on LeetCode; PrepForge does not run C++/Java code.</span>
            <span className="row" style={{ gap: 6 }}>
              {problem.lists.map((l) => <Badge key={l} tone="outline">{LIST_LABEL[l]}</Badge>)}
              {problem.patterns.map((p) => <Badge key={p}>{p}</Badge>)}
            </span>
          </div>
          <div className="row">
            <a className="btn btn--primary" href={problem.url} target="_blank" rel="noopener noreferrer" onClick={startIfNeeded}>Open on LeetCode <ExternalLink /></a>
            {problem.freeAlternativeUrl && <a className="btn btn--secondary" href={problem.freeAlternativeUrl} target="_blank" rel="noopener noreferrer">Free version (LintCode) <ExternalLink /></a>}
          </div>
        </div>

        {!wt && (
          <Callout tone="info" title="Pattern guidance (no authored walkthrough yet)">
            Hints for this problem are generated from its topic and tags, not written for this specific problem. Authored walkthroughs exist for {WALKTHROUGH_SET.size} problems so far.
          </Callout>
        )}

        <section className="card" aria-labelledby="stages-h">
          <h2 id="stages-h" className="card__title mb-4">Work through the problem</h2>
          <div className="stage-tabs" role="tablist" aria-label="Problem-solving stages">
            {STAGES.map((s, idx) => (
              <button key={s.id} role="tab" aria-selected={stage === s.id} className={`stage-tab${pp.stageNotes[s.id] ? ' is-done' : ''}`} onClick={() => { setStage(s.id); startIfNeeded(); }}>
                {idx + 1}
              </button>
            ))}
          </div>
          {STAGES.filter((s) => s.id === stage).map((s) => (
            <div key={s.id} className="stack mt-4" role="tabpanel">
              <h3 style={{ fontSize: 'var(--fs-md)' }}>{s.title}</h3>
              <p className="small muted">{s.prompt}</p>
              <textarea
                className="textarea"
                rows={5}
                value={pp.stageNotes[s.id] ?? ''}
                onChange={(e) => { startIfNeeded(); setStageNote(slug, s.id, e.target.value); }}
                aria-label={s.title}
                placeholder="Your thinking (saved automatically)"
              />
              {wt && <StageReference stage={s.id} wt={wt} />}
              <div className="row-between">
                <button className="btn btn--secondary btn--sm" disabled={s.id === 'understand'} onClick={() => setStage(STAGES[STAGES.findIndex((x) => x.id === s.id) - 1].id)}>Previous stage</button>
                {s.id !== 'reflect' ? (
                  <button className="btn btn--primary btn--sm" onClick={() => setStage(STAGES[STAGES.findIndex((x) => x.id === s.id) + 1].id)}>Next stage</button>
                ) : (
                  <button className="btn btn--primary btn--sm" onClick={() => setShowLog(true)}>Log the outcome</button>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="card" aria-labelledby="hints-h">
          <div className="row-between mb-4">
            <h2 id="hints-h" className="card__title">Progressive hints</h2>
            <span className="xsmall muted">{pp.hintsRevealed}/4 revealed{pp.solutionRevealed ? ' · solution viewed' : ''}</span>
          </div>
          {timedMode ? (
            <Callout tone="warning">Timed mode: hints and the solution are disabled until you log the outcome.</Callout>
          ) : (
            <div className="stack">
              {(['Interpret the problem', 'Point to a pattern', 'Key observation', 'Pseudocode / direct approach'] as const).map((label, k) => {
                const level = k + 1;
                const shown = pp.hintsRevealed >= level;
                const canReveal = pp.hintsRevealed === level - 1;
                return (
                  <div key={label} className={`hint${shown ? ' is-shown' : ''}`}>
                    <div className="row-between">
                      <span className="strong small"><Lightbulb size={14} aria-hidden style={{ display: 'inline', verticalAlign: '-2px' }} /> Hint {level}: {label}</span>
                      {!shown && <button className="btn btn--secondary btn--sm" disabled={!canReveal} onClick={() => { startIfNeeded(); revealHint(slug, level); }}>Reveal</button>}
                    </div>
                    {shown && <div className="mt-2"><Markdown md={hints[k]} /></div>}
                  </div>
                );
              })}
              <div className={`hint${pp.solutionRevealed ? ' is-shown' : ''}`}>
                <div className="row-between">
                  <span className="strong small"><Eye size={14} aria-hidden style={{ display: 'inline', verticalAlign: '-2px' }} /> Full solution</span>
                  {!pp.solutionRevealed && (
                    <button className="btn btn--danger btn--sm" onClick={() => { if (window.confirm('Viewing the solution marks this attempt as "after solution". Continue?')) { startIfNeeded(); revealSolution(slug); } }}>Show solution</button>
                  )}
                </div>
                {pp.solutionRevealed && (wt ? <Solution wt={wt} /> : (
                  <div className="mt-2 stack-sm">
                    <p className="small">No authored solution exists for this problem yet. External explanations:</p>
                    <div className="row">
                      {problem.videoUrl && <a className="btn btn--secondary btn--sm" href={problem.videoUrl} target="_blank" rel="noopener noreferrer"><PlayCircle /> NeetCode video</a>}
                      <a className="btn btn--secondary btn--sm" href={`${problem.url}editorial/`} target="_blank" rel="noopener noreferrer">LeetCode editorial (may be Premium) <ExternalLink /></a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="coach-rail stack">
        <div className="card card--compact stack-sm">
          <div className="row-between">
            <span className="eyebrow">{timedMode ? 'Timed attempt' : 'Time on this attempt'}</span>
            <Timer size={16} aria-hidden className="muted" />
          </div>
          <span className={`clock${overtime ? ' text-danger' : ''}`}>{timedMode ? formatClock(limitSec - sec) : formatClock(sec)}</span>
          <span className="xsmall muted">Target: about {problem.estMinutes} min for a {problem.difficulty} problem.</span>
          <div className="row">
            <button className="btn btn--secondary btn--sm" onClick={() => { startedRef.current = true; setRunning((r) => !r); }}>{running ? <><Pause /> Pause</> : <><Play /> {sec ? 'Resume' : 'Start'}</>}</button>
            <button className="btn btn--primary btn--sm" onClick={() => setShowLog(true)}>Log outcome</button>
          </div>
          {!timedMode && <Link to={`/problems/${slug}?timed=1`} className="xsmall">Switch to a timed attempt (no hints)</Link>}
        </div>

        <div className="card card--compact stack-sm">
          <span className="eyebrow">History</span>
          {pp.attempts.length === 0 ? <span className="small muted">No attempts logged yet.</span> : (
            <ul className="list-plain small stack-sm">
              {[...pp.attempts].reverse().slice(0, 5).map((a) => (
                <li key={a.at} className="row-between"><span>{new Date(a.at).toLocaleDateString()}</span><span className="row" style={{ gap: 4 }}><OutcomeBadge o={a.outcome} /><span className="xsmall muted">{formatDuration(a.durationSec)}</span></span></li>
              ))}
            </ul>
          )}
        </div>

        <div className="card card--compact stack-sm">
          <label className="eyebrow" htmlFor="pnotes">My notes and mistakes</label>
          <textarea id="pnotes" className="textarea" value={notes} onChange={(e) => setLocalNotes(e.target.value)} onBlur={() => notes !== pp.notes && setNotes(slug, notes)} placeholder="What tripped you up? What would you do differently?" />
        </div>
      </aside>

      {showLog && (
        <LogOutcome
          problem={problem}
          hintsUsed={pp.hintsRevealed}
          solutionViewed={pp.solutionRevealed}
          seconds={sec}
          timed={timedMode}
          onCancel={() => setShowLog(false)}
          onSave={(outcome, cats, reflection) => {
            recordAttempt(slug, problem.primaryTopicId, { durationSec: sec, hintsUsed: pp.hintsRevealed, solutionViewed: pp.solutionRevealed, outcome, errorCategories: cats, reflection, timed: timedMode });
            setSaved({ outcome, sec });
            setShowLog(false);
            setRunning(false);
            setSec(0);
            startedRef.current = false;
          }}
        />
      )}
      {saved && (
        <div className="toast-stack" role="status">
          <div className="toast">Logged: <OutcomeText o={saved.outcome} /> in {formatDuration(saved.sec)}. {saved.outcome !== 'independent' ? 'Added to your revision queue.' : ''} <button className="btn btn--ghost btn--sm" style={{ color: '#fff' }} onClick={() => setSaved(null)}>Dismiss</button></div>
        </div>
      )}
    </div>
  );
}

function StageReference({ stage, wt }: { stage: CoachStage; wt: CoachWalkthrough }) {
  const content: Partial<Record<CoachStage, { label: string; md: string }>> = {
    understand: { label: 'Compare with the coach\'s restatement', md: wt.understandMd },
    io: { label: 'Compare constraints and edge cases', md: `${wt.ioConstraintsMd}\n\n**Edge cases to test:**\n\n${wt.edgeCases.map((e) => `- ${e}`).join('\n')}` },
    brute: { label: 'Compare with a brute force', md: wt.bruteForceMd },
    'brute-complexity': { label: 'Check the brute-force complexity', md: wt.bruteComplexity },
    test: { label: 'Coach test cases', md: wt.testCases.map((t) => `- **${t.input}** → ${t.expected} *(${t.why})*`).join('\n') },
  };
  const c = content[stage];
  if (!c) return <p className="xsmall muted">The bottleneck, pattern and optimal approach are revealed through the progressive hints below, one level at a time.</p>;
  return (
    <details className="ref">
      <summary className="small">{c.label} (after you have written yours)</summary>
      <div className="mt-2"><Markdown md={c.md} /></div>
    </details>
  );
}

function Solution({ wt }: { wt: CoachWalkthrough }) {
  return (
    <div className="stack mt-2">
      <div><h4>Bottleneck</h4><Markdown md={wt.bottleneckMd} /></div>
      <div><h4>Optimal approach</h4><Markdown md={wt.optimalMd} /></div>
      <CodeBlock samples={wt.code} />
      <p className="small"><strong>Complexity:</strong> {wt.finalComplexity}</p>
      <div><h4>Takeaway</h4><Markdown md={wt.takeawaysMd} /></div>
    </div>
  );
}

function OutcomeText({ o }: { o: ProblemOutcome }) {
  return <>{o === 'independent' ? 'solved independently' : o === 'with-hints' ? 'solved with hints' : o === 'after-solution' ? 'solved after viewing the solution' : 'not solved'}</>;
}

function OutcomeBadge({ o }: { o: ProblemOutcome }) {
  const tone = o === 'independent' ? 'success' : o === 'with-hints' ? 'info' : o === 'after-solution' ? 'warning' : 'danger';
  const label = o === 'independent' ? 'Independent' : o === 'with-hints' ? 'With hints' : o === 'after-solution' ? 'After solution' : 'Gave up';
  return <Badge tone={tone}>{label}</Badge>;
}

function LogOutcome({ problem, hintsUsed, solutionViewed, seconds, timed, onCancel, onSave }: {
  problem: Problem; hintsUsed: number; solutionViewed: boolean; seconds: number; timed: boolean;
  onCancel: () => void; onSave: (o: ProblemOutcome, cats: ErrorCategory[], reflection: string) => void;
}) {
  const solvedOutcome: ProblemOutcome = solutionViewed ? 'after-solution' : hintsUsed > 0 ? 'with-hints' : 'independent';
  const [solved, setSolved] = useState<boolean | null>(null);
  const [cats, setCats] = useState<ErrorCategory[]>([]);
  const [reflection, setReflection] = useState('');
  const outcome: ProblemOutcome | null = solved === null ? null : solved ? solvedOutcome : 'gave-up';
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="log-h">
        <div className="dialog__head"><h2 id="log-h" style={{ fontSize: 'var(--fs-lg)' }}>Log your attempt: {problem.title}</h2></div>
        <div className="dialog__body stack">
          <p className="small muted">Time: {formatDuration(seconds)} · Hints used: {hintsUsed}/4 · Solution viewed: {solutionViewed ? 'yes' : 'no'}{timed ? ' · Timed' : ''}</p>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label mb-2">Did your code pass on LeetCode (or your own tests)?</legend>
            <div className="segmented">
              <button type="button" aria-pressed={solved === true} onClick={() => setSolved(true)}>Yes, it passed</button>
              <button type="button" aria-pressed={solved === false} onClick={() => setSolved(false)}>No / gave up</button>
            </div>
            {outcome && <p className="small mt-2">This will be recorded as <strong><OutcomeText o={outcome} /></strong>. This is self-reported, because PrepForge cannot run your code.</p>}
          </fieldset>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label mb-2">What went wrong or slowed you down? (select all that apply)</legend>
            <div className="stack-sm">
              {ERROR_CATEGORIES.map((c) => (
                <label key={c.id} className="check">
                  <input type="checkbox" checked={cats.includes(c.id)} onChange={(e) => setCats((x) => (e.target.checked ? [...x, c.id] : x.filter((y) => y !== c.id)))} />
                  <span><strong>{c.label}</strong> <span className="xsmall muted">{c.help}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span className="label">Key takeaway (optional)</span>
            <textarea className="textarea" rows={3} value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="e.g. 'Pair search on sorted data means two pointers, not a hash map'" />
          </label>
        </div>
        <div className="dialog__foot">
          <button className="btn btn--secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary" disabled={!outcome} onClick={() => outcome && onSave(outcome, cats, reflection.trim())}>Save attempt</button>
        </div>
      </div>
    </div>
  );
}
