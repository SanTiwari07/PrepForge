// Daily plan generator. See what_to_do.md Section 7.4. Deterministic for a given day and state.
import type { Difficulty, Problem, TopicMeta as Topic } from '@/content/schema';
import type { PersistedState } from '@/store/types';
import { dueCards } from './revision';
import type { TopicMastery } from './mastery';
import { daysBetween, today } from './dates';

export interface PlanTask {
  id: string;
  kind: 'review' | 'weak' | 'learn' | 'practice' | 'fundamentals' | 'assessment';
  title: string;
  detail: string;
  minutes: number;
  href: string;
  reason: string;
}

// Recommended DSA order (what_to_do.md Section 8.1).
export const DSA_ORDER = [
  'dsa.complexity', 'dsa.stl-collections', 'dsa.arrays-strings', 'dsa.hashing', 'dsa.two-pointers', 'dsa.sliding-window',
  'dsa.prefix-sums', 'dsa.kadane', 'dsa.binary-search', 'dsa.stacks-queues', 'dsa.monotonic-stack-queue', 'dsa.linked-lists',
  'dsa.fast-slow-pointers', 'dsa.recursion', 'dsa.binary-trees', 'dsa.bst', 'dsa.heaps', 'dsa.backtracking', 'dsa.sorting',
  'dsa.intervals', 'dsa.greedy', 'dsa.graphs', 'dsa.topological-sort', 'dsa.dsu', 'dsa.shortest-paths', 'dsa.dp-1d', 'dsa.dp-2d',
  'dsa.tries', 'dsa.bit-manipulation', 'dsa.matrix', 'dsa.divide-conquer', 'dsa.design-ds', 'dsa.math', 'dsa.mst', 'dsa.implementation',
];

export const FUNDAMENTALS_ROTATION = ['sql', 'dbms', 'oop-cpp', 'oop-java', 'os', 'cn', 'system-design', 'devops', 'core-cs'];

const levelRank = { 'not-started': 0, learning: 1, practising: 2, proficient: 3, 'interview-ready': 4 } as const;

export function targetDifficulty(m: TopicMastery | undefined): Difficulty {
  if (!m) return 'easy';
  const indep = m.application.independent;
  if (indep < 2) return 'easy';
  if (m.application.mediumIndependent < 3 || indep < 6) return 'medium';
  return (m.masteryPct ?? 0) >= 70 ? 'hard' : 'medium';
}

export function nextProblemFor(
  topic: Topic, s: PersistedState, problemBySlug: Map<string, Problem>, difficulty: Difficulty, exclude: Set<string> = new Set(),
): Problem | undefined {
  const order: Difficulty[] = difficulty === 'easy' ? ['easy', 'medium', 'hard'] : difficulty === 'medium' ? ['medium', 'easy', 'hard'] : ['hard', 'medium', 'easy'];
  const candidates = topic.problemIds.map((id) => problemBySlug.get(id)).filter((p): p is Problem => !!p && !p.premium && !exclude.has(p.slug));
  // Prefer problems whose primary topic is this one, then those in curated lists (NeetCode/Blind first).
  const rank = (p: Problem) => (p.primaryTopicId === topic.id ? 0 : 1) * 10 + (p.lists.includes('blind75') ? 0 : p.lists.includes('neetcode150') ? 1 : p.lists.includes('top-interview-150') ? 2 : 3);
  for (const d of order) {
    const pool = candidates.filter((p) => p.difficulty === d && s.problemProgress[p.slug]?.status !== 'solved').sort((a, b) => rank(a) - rank(b));
    if (pool.length) return pool[0];
  }
  return undefined;
}

export interface PlanInput {
  state: PersistedState;
  topicById: Map<string, Topic>;
  topics: Topic[];
  mastery: Map<string, TopicMastery>;
  problemBySlug: Map<string, Problem>;
  minutes: number;
  now?: string;
}

export function buildDailyPlan(input: PlanInput): PlanTask[] {
  const { state: s, topicById, mastery, problemBySlug } = input;
  const now = input.now ?? today();
  const budget = Math.max(30, input.minutes);
  const tasks: PlanTask[] = [];
  let used = 0;
  const used_ = new Set<string>();

  // 1. Reviews (capped at ~25% of the budget).
  const due = dueCards(Object.values(s.reviewCards), now);
  if (due.length) {
    const minutes = Math.min(Math.ceil(due.length * 1.5), Math.round(budget * 0.25));
    const count = Math.min(due.length, Math.max(1, Math.floor(minutes / 1.5)));
    tasks.push({ id: 'review', kind: 'review', title: `Review ${count} due item${count === 1 ? '' : 's'}`, detail: `${due.length} due today, highest forgetting risk first.`, minutes, href: '/revision', reason: 'Spaced repetition keeps what you have already learned.' });
    used += minutes;
  }

  // 2. Weak topic practice (~30%).
  const weak = input.topics
    .filter((t) => t.moduleId === 'dsa')
    .map((t) => ({ t, m: mastery.get(t.id)! }))
    .filter(({ m }) => m && (m.studiedButCannotApply || (m.masteryPct !== null && m.masteryPct < 60)))
    .sort((a, b) => Number(b.m.studiedButCannotApply) - Number(a.m.studiedButCannotApply) || (a.m.masteryPct ?? 0) - (b.m.masteryPct ?? 0));
  if (weak.length && used < budget) {
    const { t, m } = weak[0];
    const p = nextProblemFor(t, s, problemBySlug, m.studiedButCannotApply ? 'easy' : targetDifficulty(m), used_);
    if (p) {
      used_.add(p.slug);
      const minutes = Math.min(p.estMinutes + 10, Math.round(budget * 0.3));
      tasks.push({
        id: `weak-${t.id}`, kind: 'weak', title: `Weak spot: ${t.title}`, detail: `Solve "${p.title}" (${p.difficulty}) with the coach.`, minutes,
        href: `/problems/${p.slug}`,
        reason: m.studiedButCannotApply ? 'You have read this topic but your application evidence is low.' : `Mastery ${m.masteryPct}% is below 60%.`,
      });
      used += minutes;
    }
  }

  // 3. Next roadmap topic: learn + practise.
  const next = DSA_ORDER.map((id) => topicById.get(id)).find((t) => {
    if (!t) return false;
    const m = mastery.get(t.id);
    if (m && levelRank[m.level] >= 3) return false;
    return t.prerequisites.every((pid) => {
      const pm = mastery.get(pid);
      const pt = topicById.get(pid);
      return !pt || pt.status === 'planned' || (pm && levelRank[pm.level] >= 2);
    });
  });
  if (next && used < budget) {
    const m = mastery.get(next.id);
    if (next.status !== 'planned' && (m?.completionPct ?? 0) < 100) {
      const minutes = Math.min(Math.max(20, Math.round(next.estMinutes / 2)), Math.max(15, budget - used));
      tasks.push({ id: `learn-${next.id}`, kind: 'learn', title: `Learn: ${next.title}`, detail: `${m?.completionPct ?? 0}% read. Then answer its MCQs.`, minutes, href: `/learn/dsa/${next.id}`, reason: 'Next topic on your DSA roadmap.' });
      used += minutes;
    }
    if (used < budget) {
      // If this topic has no practice problems (e.g. Complexity), practise the next roadmap topic that does.
      const practiceTopic = next.problemIds.length ? next : DSA_ORDER.slice(DSA_ORDER.indexOf(next.id) + 1).map((id) => topicById.get(id)).find((t) => t && t.problemIds.length) ?? next;
      const pm = mastery.get(practiceTopic.id);
      const p = nextProblemFor(practiceTopic, s, problemBySlug, targetDifficulty(pm), used_);
      if (p) {
        used_.add(p.slug);
        const minutes = p.estMinutes + 5;
        tasks.push({ id: `practice-${p.slug}`, kind: 'practice', title: `Practise: ${p.title}`, detail: `${p.difficulty[0].toUpperCase() + p.difficulty.slice(1)} · ${practiceTopic.title}. Use hints only after a real attempt.`, minutes, href: `/problems/${p.slug}`, reason: 'Apply the current topic to an unseen problem.' });
        used += minutes;
      }
    }
  }

  // 4. Fundamentals rotation (one subject per day).
  if (used < budget) {
    const dayIndex = Math.abs(daysBetween('2026-01-01', now));
    for (let k = 0; k < FUNDAMENTALS_ROTATION.length; k++) {
      const mod = FUNDAMENTALS_ROTATION[(dayIndex + k) % FUNDAMENTALS_ROTATION.length];
      const t = input.topics.find((x) => x.moduleId === mod && x.status !== 'planned' && levelRank[mastery.get(x.id)?.level ?? 'not-started'] < 3);
      if (t) {
        const minutes = Math.min(25, Math.max(10, budget - used));
        tasks.push({ id: `fund-${t.id}`, kind: 'fundamentals', title: `Fundamentals: ${t.title}`, detail: 'Read one section and answer its MCQs.', minutes, href: `/learn/${mod}/${t.id}`, reason: 'Short daily CS-fundamentals block (OA MCQs and interview questions).' });
        used += minutes;
        break;
      }
    }
  }

  // 5. Weekly timed assessment.
  const lastOa = s.assessments.filter((a) => a.submittedAt).map((a) => a.submittedAt!.slice(0, 10)).sort().pop();
  if (budget >= 60 && (!lastOa || daysBetween(lastOa, now) >= 7)) {
    tasks.push({ id: 'oa', kind: 'assessment', title: 'Weekly timed assessment', detail: 'A 30-minute mixed set under time pressure.', minutes: 30, href: '/oa', reason: lastOa ? `Last assessment was ${daysBetween(lastOa, now)} days ago.` : 'You have not taken a timed assessment yet.' });
  }
  return tasks;
}
