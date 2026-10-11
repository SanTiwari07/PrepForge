import type { PersistedState } from '@/store/types';
import { addDays, today } from './dates';

/** Consecutive days (ending today or yesterday) with at least one qualifying action. */
export function currentStreak(s: PersistedState, now: string = today()): number {
  const active = (d: string) => (s.activity[d]?.actions ?? 0) > 0;
  let d = active(now) ? now : addDays(now, -1);
  let n = 0;
  while (active(d)) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

export function longestStreak(s: PersistedState): number {
  const days = Object.keys(s.activity).filter((d) => s.activity[d].actions > 0).sort();
  let best = 0, run = 0, prev: string | null = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function weekStart(now: string = today()): string {
  const d = new Date(now + 'T00:00:00');
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(now, -dow);
}

export interface WeeklyProgress {
  independentSolves: number;
  reviews: number;
  assessments: number;
  mcqs: number;
}

export function weeklyProgress(s: PersistedState, now: string = today()): WeeklyProgress {
  const start = weekStart(now);
  const inWeek = (iso: string) => iso.slice(0, 10) >= start && iso.slice(0, 10) <= now;
  let independentSolves = 0;
  for (const pp of Object.values(s.problemProgress)) for (const a of pp.attempts) if (a.outcome === 'independent' && inWeek(a.at)) independentSolves += 1;
  for (const a of s.sqlAttempts) if (a.passedAll && a.hintsUsed === 0 && inWeek(a.at)) independentSolves += 1;
  const reviews = Object.values(s.reviewCards).filter((c) => c.lastReviewed && inWeek(c.lastReviewed)).length;
  const assessments = s.assessments.filter((a) => a.submittedAt && inWeek(a.submittedAt)).length;
  const mcqs = s.mcqAttempts.filter((a) => inWeek(a.at)).length;
  return { independentSolves, reviews, assessments, mcqs };
}

export function solveStats(s: PersistedState) {
  let independent = 0, withHints = 0, afterSolution = 0, gaveUp = 0, solvedTime = 0, solvedCount = 0;
  for (const pp of Object.values(s.problemProgress)) {
    for (const a of pp.attempts) {
      if (a.outcome === 'independent') independent += 1;
      else if (a.outcome === 'with-hints') withHints += 1;
      else if (a.outcome === 'after-solution') afterSolution += 1;
      else gaveUp += 1;
      if (a.outcome === 'independent' || a.outcome === 'with-hints') { solvedTime += a.durationSec; solvedCount += 1; }
    }
  }
  return { independent, withHints, afterSolution, gaveUp, avgSolveSec: solvedCount ? solvedTime / solvedCount : null };
}

export function errorCategoryCounts(s: PersistedState, sinceDays = 30, now: Date = new Date()): Record<string, number> {
  const cutoff = now.getTime() - sinceDays * 86_400_000;
  const out: Record<string, number> = {};
  for (const pp of Object.values(s.problemProgress)) {
    for (const a of pp.attempts) {
      if (Date.parse(a.at) < cutoff) continue;
      for (const c of a.errorCategories) out[c] = (out[c] ?? 0) + 1;
    }
  }
  for (const a of s.sqlAttempts) {
    if (Date.parse(a.at) < cutoff) continue;
    for (const c of a.errorCategories) out[c] = (out[c] ?? 0) + 1;
  }
  return out;
}

export function oaAccuracy(s: PersistedState): number | null {
  const done = s.assessments.filter((a) => a.result && a.result.autoTotal > 0);
  if (!done.length) return null;
  const score = done.reduce((acc, a) => acc + a.result!.score, 0);
  const total = done.reduce((acc, a) => acc + a.result!.autoTotal, 0);
  return Math.round((100 * score) / total);
}
