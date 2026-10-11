import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Repeat, Target, TriangleAlert } from 'lucide-react';
import { useStore } from '@/store/store';
import { useEvidenceState, useMasteryMap, useReadiness } from '@/hooks/useDerived';
import { MODULES, PROBLEM_BY_SLUG, TOPICS, TOPIC_BY_ID, topicsOf, topicTitle } from '@/content/registry';
import { buildDailyPlan } from '@/engine/plan';
import { currentStreak, errorCategoryCounts, oaAccuracy, solveStats, weeklyProgress } from '@/engine/stats';
import { dueCards } from '@/engine/revision';
import { formatDuration } from '@/engine/dates';
import { ActivityHeatmap, BarList } from '@/components/Charts';
import { Badge, Callout, EmptyState, LevelBadge, PageHeader, Progress, Stat } from '@/components/ui';
import { ERROR_LABEL } from '@/features/coach/errorCategories';
import { PlanList } from '@/features/plan/PlanList';
import { Onboarding } from './Onboarding';

export function Dashboard() {
  const s = useEvidenceState();
  const profile = useStore((x) => x.profile);
  const mastery = useMasteryMap();
  const readiness = useReadiness();

  const plan = useMemo(
    () => buildDailyPlan({ state: s, topicById: TOPIC_BY_ID, topics: TOPICS, mastery, problemBySlug: PROBLEM_BY_SLUG, minutes: profile.dailyMinutes }),
    [s, mastery, profile.dailyMinutes],
  );
  const due = useMemo(() => dueCards(Object.values(s.reviewCards)), [s.reviewCards]);
  const streak = currentStreak(s);
  const solves = solveStats(s);
  const week = weeklyProgress(s);
  const oa = oaAccuracy(s);
  const errors = Object.entries(errorCategoryCounts(s)).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const weakest = TOPICS
    .map((t) => ({ t, m: mastery.get(t.id)! }))
    .filter(({ m }) => m.studiedButCannotApply || (m.masteryPct !== null && m.masteryPct < 60))
    .sort((a, b) => Number(b.m.studiedButCannotApply) - Number(a.m.studiedButCannotApply) || (a.m.masteryPct ?? 0) - (b.m.masteryPct ?? 0))
    .slice(0, 4);

  const subjectRows = MODULES.map((m) => {
    const ts = topicsOf(m.id).filter((t) => t.status !== 'planned');
    const all = topicsOf(m.id);
    const comp = ts.length ? Math.round(ts.reduce((acc, t) => acc + (mastery.get(t.id)?.completionPct ?? 0), 0) / ts.length) : 0;
    const ms = ts.map((t) => mastery.get(t.id)?.masteryPct).filter((v): v is number => v !== null && v !== undefined);
    return { m, comp, mastery: ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null, ready: ts.length, total: all.length };
  });

  const solvedProblems = Object.values(s.problemProgress).filter((p) => p.status === 'solved').length;
  const topicsReady = TOPICS.filter((t) => mastery.get(t.id)?.level === 'interview-ready').length;
  const goals = profile.weeklyGoals;

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        title={profile.name ? `Welcome back, ${profile.name}` : 'Your preparation'}
        lead="What to do today, what you have done, where you are weak, and what to revise."
        actions={<Link to="/plan" className="btn btn--primary">Open today's plan <ArrowRight /></Link>}
      />

      {!profile.onboarded && <Onboarding />}

      <section className="grid grid-4" aria-label="Summary">
        <div className="card card--compact"><Stat label="Current streak" value={streak} unit={streak === 1 ? 'day' : 'days'} note={<><Flame size={12} aria-hidden style={{ display: 'inline', verticalAlign: '-1px' }} /> One qualifying action per day</>} /></div>
        <div className="card card--compact"><Stat label="Solved independently" value={solves.independent} note={`${solves.withHints} with hints · ${solves.afterSolution} after solution`} /></div>
        <div className="card card--compact"><Stat label="OA accuracy" value={oa === null ? '—' : oa} unit={oa === null ? undefined : '%'} note={oa === null ? 'No timed assessments yet' : 'Across submitted assessments'} /></div>
        <div className="card card--compact"><Stat label="Average solve time" value={solves.avgSolveSec === null ? '—' : formatDuration(solves.avgSolveSec)} note="Independent and hinted solves" /></div>
      </section>

      <div className="grid-12">
        <section className="card span-7" aria-labelledby="today-h">
          <div className="card__head">
            <div>
              <h2 id="today-h" className="card__title">1. What should I study today?</h2>
              <p className="card__sub">{plan.reduce((a, t) => a + t.minutes, 0)} of {profile.dailyMinutes} minutes planned. The plan adapts to your evidence.</p>
            </div>
          </div>
          <PlanList tasks={plan.slice(0, 5)} />
        </section>

        <section className="card span-5" aria-labelledby="revise-h">
          <div className="card__head">
            <div>
              <h2 id="revise-h" className="card__title">4. What should I revise?</h2>
              <p className="card__sub">Ordered by forgetting risk, not by date added.</p>
            </div>
            <Repeat size={18} aria-hidden className="muted" />
          </div>
          {due.length === 0 ? (
            <EmptyState title="Nothing due">Wrong MCQ answers and problems you solved with help are scheduled here automatically.</EmptyState>
          ) : (
            <div className="stack-sm">
              <p className="stat__value">{due.length}<small>due now</small></p>
              <ul className="list-plain">
                {due.slice(0, 5).map((c) => (
                  <li key={c.id} className="row-between small"><span className="truncate">{c.kind === 'problem' ? PROBLEM_BY_SLUG.get(c.refId)?.title ?? c.refId : topicTitle(c.topicId)}</span><Badge tone="outline">{c.kind}</Badge></li>
                ))}
              </ul>
              <Link to="/revision" className="btn btn--secondary btn--block mt-2">Start review session</Link>
            </div>
          )}
        </section>

        <section className="card span-6" aria-labelledby="done-h">
          <div className="card__head"><h2 id="done-h" className="card__title">2. What have I completed?</h2></div>
          <div className="grid grid-3 mb-4">
            <Stat label="Problems solved" value={solvedProblems} note={`of ${PROBLEM_BY_SLUG.size} in the bank`} />
            <Stat label="MCQs answered" value={s.mcqAttempts.length} />
            <Stat label="Interview-ready topics" value={topicsReady} note={`of ${TOPICS.length}`} />
          </div>
          <p className="xsmall muted mb-2">Reading progress (completion) and evidence-based mastery are shown separately. Reading never counts as mastery.</p>
          <div className="stack-sm">
            {subjectRows.map(({ m, comp, mastery: mm, ready, total }) => (
              <Link key={m.id} to={`/learn/${m.id}`} className="subject-row">
                <span className="row" style={{ gap: 8, minWidth: 0 }}><span className="nav__dot" style={{ background: `var(${m.color})`, margin: 0 }} aria-hidden /><span className="truncate">{m.shortTitle}</span></span>
                <span className="subject-row__bars">
                  <Progress value={comp} label={`${m.shortTitle} reading completion`} />
                  <Progress value={mm ?? 0} tone="mastery" label={`${m.shortTitle} mastery`} />
                </span>
                <span className="xsmall muted nowrap">{ready}/{total} topics</span>
              </Link>
            ))}
          </div>
          <p className="xsmall muted mt-2"><span className="legend legend--ink" /> completion <span className="legend legend--mastery" /> mastery</p>
        </section>

        <section className="card span-6" aria-labelledby="weak-h">
          <div className="card__head">
            <h2 id="weak-h" className="card__title">3. Where am I weak?</h2>
            <TriangleAlert size={18} aria-hidden className="muted" />
          </div>
          {weakest.length === 0 && errors.length === 0 ? (
            <EmptyState title="No weak spots detected yet">Weaknesses are detected from evidence: wrong first-attempt MCQs, hinted solves and the error categories you record in the coach.</EmptyState>
          ) : (
            <div className="stack">
              {weakest.map(({ t, m }) => (
                <Link key={t.id} to={`/learn/${t.moduleId}/${t.id}`} className="row-between weak-row">
                  <span className="grow">
                    <span className="strong small" style={{ display: 'block' }}>{t.title}</span>
                    <span className="xsmall muted">
                      {m.studiedButCannotApply ? `Studied (${m.completionPct}% read) but application score is low` : `Mastery ${m.masteryPct}% · ${m.mcq.correct}/${m.mcq.total} first-try MCQs`}
                    </span>
                  </span>
                  <LevelBadge level={m.level} />
                </Link>
              ))}
              {errors.length > 0 && (
                <div>
                  <p className="xsmall muted mb-2">Most frequent mistakes (last 30 days)</p>
                  <div className="row">{errors.map(([k, v]) => <Badge key={k} tone="warning">{ERROR_LABEL[k] ?? k} · {v}</Badge>)}</div>
                  <Link to="/mistakes" className="small mt-2" style={{ display: 'inline-block' }}>Open mistake journal →</Link>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="card span-7" aria-labelledby="target-h">
          <div className="card__head">
            <div>
              <h2 id="target-h" className="card__title">5. How close am I to my targets?</h2>
              <p className="card__sub">Evidence-based readiness by dimension. It does not predict hiring outcomes.</p>
            </div>
            <Target size={18} aria-hidden className="muted" />
          </div>
          <BarList rows={readiness.map((d) => ({ label: d.title, value: d.score }))} />
          <p className="xsmall muted mt-4">“—” means insufficient evidence. <Link to="/analytics">See the evidence behind each score →</Link></p>
        </section>

        <section className="card span-5" aria-labelledby="week-h">
          <div className="card__head"><h2 id="week-h" className="card__title">This week</h2></div>
          <div className="stack">
            {([
              ['Independent solves', week.independentSolves, goals.independentSolves],
              ['Reviews completed', week.reviews, goals.reviews],
              ['MCQs answered', week.mcqs, goals.mcqs],
              ['Timed assessments', week.assessments, goals.assessments],
            ] as const).map(([label, v, g]) => (
              <div key={label}>
                <div className="row-between small"><span>{label}</span><span className="strong">{v} / {g}</span></div>
                <Progress value={(100 * v) / Math.max(1, g)} tone="success" label={label} />
              </div>
            ))}
          </div>
          <hr className="divider" />
          <ActivityHeatmap activity={s.activity} />
        </section>
      </div>

      {TOPICS.filter((t) => t.status === 'planned').length > 0 && (
        <Callout tone="info" title="Content status is shown honestly">
          {TOPICS.filter((t) => t.status !== 'planned').length} of {TOPICS.length} topics have full learning content today. Planned topics still link to verified practice problems and are marked “Planned”.
        </Callout>
      )}
    </div>
  );
}
