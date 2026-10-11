// Evidence-based mastery, kept separate from completion. See what_to_do.md Section 7.1.
import type { Difficulty, MCQ, Problem, SqlExercise, TopicMeta } from '@/content/schema';
import type { PersistedState, ProblemAttempt } from '@/store/types';

export type MasteryLevel = 'not-started' | 'learning' | 'practising' | 'proficient' | 'interview-ready';
export type Confidence = 'none' | 'low' | 'medium' | 'high';

export interface TopicMastery {
  completionPct: number;              // sections read; never implies mastery
  masteryPct: number | null;          // null = not enough evidence
  confidence: Confidence;
  level: MasteryLevel;
  evidenceCount: number;
  mcq: { correct: number; total: number };
  application: { independent: number; withHints: number; afterSolution: number; gaveUp: number; mediumIndependent: number; score: number | null; attempts: number };
  retention: { successes: number; lapses: number; score: number | null };
  masteryTestPassed: boolean;
  studiedButCannotApply: boolean;
}

export interface ContentIndex {
  mcqById: Map<string, Pick<MCQ, 'id' | 'moduleId' | 'difficulty'>>;
  problemBySlug: Map<string, Problem>;
  sqlById: Map<string, SqlExercise>;
}

const DIFF_WEIGHT: Record<Difficulty, number> = { easy: 1, medium: 1.5, hard: 2 };
export const MIN_EVIDENCE = 5;

export function attemptCredit(a: ProblemAttempt): number {
  switch (a.outcome) {
    case 'independent': return 1;
    case 'with-hints': return Math.max(0.3, 1 - 0.15 * a.hintsUsed);
    case 'after-solution': return 0.15;
    default: return 0;
  }
}

export function confidenceFor(n: number): Confidence {
  if (n === 0) return 'none';
  if (n < MIN_EVIDENCE) return 'low';
  if (n <= 15) return 'medium';
  return 'high';
}

/** The parts of a topic the mastery engine reads. */
export type MasteryTopic = Pick<TopicMeta, 'id' | 'mcqIds' | 'problemIds' | 'mastery' | 'sectionIds'>;

export function computeTopicMastery(topic: MasteryTopic, s: PersistedState, idx: ContentIndex): TopicMastery {
  const tp = s.topicProgress[topic.id];
  const totalSections = topic.sectionIds.length;
  const completionPct = totalSections ? Math.round((100 * (tp?.sectionsRead.filter((x) => topic.sectionIds.includes(x)).length ?? 0)) / totalSections) : 0;

  // MCQ evidence: first-seen answers only (performance on unseen questions).
  const topicMcqs = new Set(topic.mcqIds);
  let mcqCorrect = 0;
  let mcqTotal = 0;
  for (const a of s.mcqAttempts) {
    if (!a.firstSeen || !topicMcqs.has(a.mcqId)) continue;
    mcqTotal += 1;
    if (a.correct) mcqCorrect += 1;
  }

  // Application evidence: problems (DSA) or SQL exercises.
  const app = { independent: 0, withHints: 0, afterSolution: 0, gaveUp: 0, mediumIndependent: 0, score: null as number | null, attempts: 0 };
  let appNum = 0;
  let appDen = 0;
  for (const pid of topic.problemIds) {
    const prob = idx.problemBySlug.get(pid);
    if (prob) {
      const pp = s.problemProgress[pid];
      if (!pp) continue;
      let prevAt: string | null = null;
      for (const a of pp.attempts) {
        app.attempts += 1;
        if (a.outcome === 'independent') { app.independent += 1; if (prob.difficulty !== 'easy') app.mediumIndependent += 1; }
        else if (a.outcome === 'with-hints') app.withHints += 1;
        else if (a.outcome === 'after-solution') app.afterSolution += 1;
        else app.gaveUp += 1;
        const fresh = a.firstSeen || (prevAt !== null && (Date.parse(a.at) - Date.parse(prevAt)) / 86_400_000 > 14);
        const w = DIFF_WEIGHT[prob.difficulty] * (fresh ? 1 : 0.5);
        appNum += w * attemptCredit(a);
        appDen += w;
        prevAt = a.at;
      }
      continue;
    }
    const ex = idx.sqlById.get(pid);
    if (ex) {
      for (const a of s.sqlAttempts) {
        if (a.exerciseId !== pid) continue;
        app.attempts += 1;
        const credit = a.passedAll ? Math.max(0.4, 1 - 0.2 * a.hintsUsed) : 0;
        if (a.passedAll && a.hintsUsed === 0) { app.independent += 1; if (ex.difficulty !== 'easy') app.mediumIndependent += 1; }
        else if (a.passedAll) app.withHints += 1;
        else app.gaveUp += 1;
        const w = DIFF_WEIGHT[ex.difficulty] * (a.firstSeen ? 1 : 0.5);
        appNum += w * credit;
        appDen += w;
      }
    }
  }
  app.score = appDen > 0 ? appNum / appDen : null;

  // Retention evidence: review cards for this topic that survived a long interval.
  let successes = 0;
  let lapses = 0;
  for (const c of Object.values(s.reviewCards)) {
    if (c.topicId !== topic.id) continue;
    lapses += c.lapses;
    if (c.reps >= 2) successes += c.reps - 1; // reps beyond the first imply passes after >= 1-day and >= 6-day gaps
  }
  const retention = { successes, lapses, score: successes + lapses > 0 ? successes / (successes + lapses) : null };

  const mcqScore = mcqTotal > 0 ? (mcqCorrect + 1) / (mcqTotal + 2) : null;
  const parts: [number | null, number][] = [[mcqScore, 0.4], [app.score, 0.45], [retention.score, 0.15]];
  const avail = parts.filter(([v]) => v !== null) as [number, number][];
  const wsum = avail.reduce((acc, [, w]) => acc + w, 0);
  const evidenceCount = mcqTotal + app.attempts + successes + lapses;
  const raw = wsum > 0 ? avail.reduce((acc, [v, w]) => acc + v * w, 0) / wsum : null;
  const masteryPct = raw !== null && evidenceCount >= MIN_EVIDENCE ? Math.round(raw * 100) : null;
  const confidence = confidenceFor(evidenceCount);

  const masteryTestPassed = (tp?.masteryTests ?? []).some((t) => t.passed);
  const crit = topic.mastery;
  const retentionOk = successes >= 1 || crit.retentionDays === 0;
  let level: MasteryLevel = 'not-started';
  if (completionPct > 0 || evidenceCount > 0) level = 'learning';
  if (evidenceCount > 0) level = 'practising';
  if (masteryPct !== null && masteryPct >= 60 && confidence !== 'low') level = 'proficient';
  if (
    level === 'proficient' && masteryTestPassed && app.independent >= crit.minIndependentSolves &&
    app.mediumIndependent >= crit.minMediumIndependent && retentionOk
  ) level = 'interview-ready';

  const studiedButCannotApply = completionPct >= 70 && app.attempts >= 3 && (app.score ?? 1) < 0.4;

  return {
    completionPct, masteryPct, confidence, level, evidenceCount,
    mcq: { correct: mcqCorrect, total: mcqTotal }, application: app, retention, masteryTestPassed, studiedButCannotApply,
  };
}

export const LEVEL_LABEL: Record<MasteryLevel, string> = {
  'not-started': 'Not started',
  learning: 'Learning',
  practising: 'Practising',
  proficient: 'Proficient',
  'interview-ready': 'Interview-ready',
};
