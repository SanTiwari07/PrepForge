// Spaced repetition: an SM-2 variant with forgetting-risk ordering.
// See what_to_do.md Section 7.2.
import type { CardKind, ProblemOutcome, ReviewCard } from '@/store/types';
import { addDays, daysBetween, today } from './dates';

export const MAX_INTERVAL_DAYS = 180;
export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;

export function newCard(kind: CardKind, refId: string, topicId: string, now: string = today(), dueOffsetDays = 1): ReviewCard {
  return {
    id: `${kind}:${refId}`,
    kind,
    refId,
    topicId,
    ease: INITIAL_EASE,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    due: addDays(now, dueOffsetDays),
    createdAt: now,
  };
}

/** Apply an SM-2 grade (0..5) and return the updated card. Pure. */
export function gradeCard(card: ReviewCard, grade: number, now: string = today()): ReviewCard {
  const q = Math.max(0, Math.min(5, Math.round(grade)));
  const ease = Math.max(MIN_EASE, card.ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  let reps = card.reps;
  let lapses = card.lapses;
  let interval: number;
  if (q < 3) {
    reps = 0;
    lapses += 1;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(Math.max(1, card.intervalDays) * ease);
  }
  interval = Math.min(MAX_INTERVAL_DAYS, Math.max(1, interval));
  return { ...card, ease, reps, lapses, intervalDays: interval, due: addDays(now, interval), lastReviewed: now, lastGrade: q };
}

export function gradeFromProblemOutcome(outcome: ProblemOutcome, hintsUsed: number): number {
  switch (outcome) {
    case 'independent': return 5;
    case 'with-hints': return hintsUsed <= 2 ? 4 : 3;
    case 'after-solution': return 2;
    default: return 0;
  }
}

export function gradeFromMcq(correct: boolean, timeSec: number, targetSec = 60): number {
  if (!correct) return 1;
  return timeSec <= targetSec * 0.6 ? 5 : 4;
}

/** Forgetting risk: overdue ratio plus penalties for low ease and lapses. Higher = review first. */
export function forgettingRisk(card: ReviewCard, now: string = today()): number {
  const overdue = Math.max(0, daysBetween(card.due, now));
  const ratio = overdue / Math.max(1, card.intervalDays);
  return ratio + (INITIAL_EASE - card.ease) * 0.5 + card.lapses * 0.25 + (card.reps === 0 ? 0.2 : 0);
}

export function dueCards(cards: ReviewCard[], now: string = today()): ReviewCard[] {
  return cards
    .filter((c) => daysBetween(c.due, now) >= 0)
    .sort((a, b) => forgettingRisk(b, now) - forgettingRisk(a, now));
}

export function upcomingCounts(cards: ReviewCard[], days: number, now: string = today()): number[] {
  const out = new Array(days).fill(0);
  for (const c of cards) {
    const d = daysBetween(now, c.due);
    if (d <= 0) out[0] += 1;
    else if (d < days) out[d] += 1;
  }
  return out;
}
