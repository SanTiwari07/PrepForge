// Transparent placement-readiness model. See what_to_do.md Section 7.3.
// Scores summarise preparation evidence; they never predict hiring outcomes.
import type { MCQ, ModuleId, Problem } from '@/content/schema';

type McqTags = Pick<MCQ, 'moduleId'>;
import type { PersistedState } from '@/store/types';
import { attemptCredit, confidenceFor, type Confidence, MIN_EVIDENCE } from './mastery';

export type DimensionId =
  | 'dsa' | 'sql' | 'oop' | 'cn-os' | 'system-design' | 'devops' | 'oa' | 'communication' | 'consistency';

export interface Dimension {
  id: DimensionId;
  title: string;
  score: number | null;        // null = insufficient evidence
  confidence: Confidence;
  evidence: string[];
  improve: string[];
  selfAssessed?: boolean;
}

const DAY = 86_400_000;
const HALF_LIFE_CUTOFF_DAYS = 60;

function recencyWeight(at: string, now: number): number {
  return (now - Date.parse(at)) / DAY > HALF_LIFE_CUTOFF_DAYS ? 0.5 : 1;
}

function mcqDimension(
  s: PersistedState, mcqById: Map<string, McqTags>, modules: ModuleId[], now: number,
): { score: number | null; n: number; correct: number } {
  let num = 0;
  let den = 0;
  let n = 0;
  let correct = 0;
  for (const a of s.mcqAttempts) {
    if (!a.firstSeen) continue;
    const q = mcqById.get(a.mcqId);
    if (!q || !modules.includes(q.moduleId)) continue;
    const w = recencyWeight(a.at, now) * (a.context === 'oa' || a.context === 'mastery' ? 1.25 : 1);
    num += w * (a.correct ? 1 : 0);
    den += w;
    n += 1;
    if (a.correct) correct += 1;
  }
  return { score: den > 0 && n >= MIN_EVIDENCE ? Math.round((100 * num) / den) : null, n, correct };
}

export function computeReadiness(
  s: PersistedState, mcqById: Map<string, McqTags>, problemBySlug: Map<string, Problem>, nowDate: Date = new Date(),
): Dimension[] {
  const now = nowDate.getTime();
  const dims: Dimension[] = [];

  // DSA: first-seen problem outcomes weighted by difficulty, plus DSA MCQs.
  {
    let num = 0, den = 0, n = 0, indep = 0, med = 0, hard = 0;
    for (const [slug, pp] of Object.entries(s.problemProgress)) {
      const p = problemBySlug.get(slug);
      if (!p) continue;
      for (const a of pp.attempts) {
        if (!a.firstSeen) continue;
        const w = (p.difficulty === 'easy' ? 1 : p.difficulty === 'medium' ? 1.6 : 2.2) * recencyWeight(a.at, now) * (a.timed ? 1.15 : 1);
        num += w * attemptCredit(a);
        den += w;
        n += 1;
        if (a.outcome === 'independent') { indep += 1; if (p.difficulty === 'medium') med += 1; if (p.difficulty === 'hard') hard += 1; }
      }
    }
    const m = mcqDimension(s, mcqById, ['dsa'], now);
    const probScore = den > 0 ? num / den : null;
    const combined = probScore === null ? (m.score !== null ? m.score / 100 : null) : m.score === null ? probScore : 0.75 * probScore + 0.25 * (m.score / 100);
    const total = n + m.n;
    dims.push({
      id: 'dsa', title: 'DSA problem solving',
      score: combined !== null && total >= MIN_EVIDENCE ? Math.round(combined * 100) : null,
      confidence: confidenceFor(total),
      evidence: [`${n} first-attempt problems (${indep} independent: ${med} medium, ${hard} hard)`, `${m.n} first-seen DSA MCQs (${m.correct} correct)`],
      improve: [
        med < 10 ? `Solve medium problems independently (${med}/10 so far).` : 'Keep adding timed medium/hard solves.',
        'Use the coach on unfamiliar problems and record error categories.',
      ],
    });
  }

  // SQL: auto-graded exercises plus SQL/DBMS MCQs.
  {
    let num = 0, den = 0, n = 0, passed = 0;
    for (const a of s.sqlAttempts) {
      if (!a.firstSeen) continue;
      const w = recencyWeight(a.at, now);
      num += w * (a.passedAll ? Math.max(0.4, 1 - 0.2 * a.hintsUsed) : 0);
      den += w;
      n += 1;
      if (a.passedAll) passed += 1;
    }
    const m = mcqDimension(s, mcqById, ['sql', 'dbms'], now);
    const ex = den > 0 ? num / den : null;
    const combined = ex === null ? (m.score !== null ? m.score / 100 : null) : m.score === null ? ex : 0.7 * ex + 0.3 * (m.score / 100);
    const total = n + m.n;
    dims.push({
      id: 'sql', title: 'SQL and databases',
      score: combined !== null && total >= MIN_EVIDENCE ? Math.round(combined * 100) : null,
      confidence: confidenceFor(total),
      evidence: [`${n} first-attempt SQL exercises (${passed} passed all hidden checks)`, `${m.n} first-seen SQL/DBMS MCQs (${m.correct} correct)`],
      improve: ['Solve SQL exercises without hints; they are graded on hidden edge-case data.', 'Take a timed SQL set in the OA Centre.'],
    });
  }

  const mcqOnly = (id: DimensionId, title: string, modules: ModuleId[], improve: string[]) => {
    const m = mcqDimension(s, mcqById, modules, now);
    dims.push({
      id, title, score: m.score, confidence: confidenceFor(m.n),
      evidence: [`${m.n} first-seen MCQs (${m.correct} correct), counted only on first attempt`], improve,
    });
  };
  mcqOnly('oop', 'OOP (C++ and Java)', ['oop-cpp', 'oop-java'], ['Practise output-prediction and compile-error questions.', 'Take the mastery tests for polymorphism and copy semantics.']);
  mcqOnly('cn-os', 'Networks and operating systems', ['cn', 'os'], ['Answer scenario questions on TCP, DNS and scheduling.', 'Use the OS simulators and check your hand calculations.']);

  // System design: MCQs plus self-assessed mocks (lower weight).
  {
    const m = mcqDimension(s, mcqById, ['system-design'], now);
    const mocks = s.mockInterviews.filter((x) => x.kind === 'system-design');
    const mockAvg = mocks.length ? mocks.reduce((acc, x) => acc + avgRubric(x.rubric), 0) / mocks.length : null;
    const combined = m.score === null ? null : mockAvg === null ? m.score / 100 : 0.8 * (m.score / 100) + 0.2 * ((mockAvg - 1) / 3);
    dims.push({
      id: 'system-design', title: 'System design fundamentals',
      score: combined !== null ? Math.round(combined * 100) : null,
      confidence: confidenceFor(m.n + mocks.length),
      evidence: [`${m.n} first-seen MCQs (${m.correct} correct)`, `${mocks.length} design mocks (self-assessed)`],
      improve: ['Study foundations before case studies.', 'Run a timed design mock and score it with the rubric.'],
    });
  }
  mcqOnly('devops', 'DevOps and cloud', ['devops'], ['Practise command and YAML-debugging questions.']);

  // OA: timed assessments.
  {
    const done = s.assessments.filter((a) => a.result);
    let num = 0, den = 0;
    for (const a of done) {
      const r = a.result!;
      if (!r.autoTotal) continue;
      const w = recencyWeight(a.startedAt, now);
      const completion = r.attempted / Math.max(1, a.items.length);
      num += w * (0.8 * (r.score / r.autoTotal) + 0.2 * completion);
      den += w;
    }
    const totalItems = done.reduce((acc, a) => acc + (a.result?.autoTotal ?? 0), 0);
    dims.push({
      id: 'oa', title: 'OA speed and accuracy',
      score: den > 0 && totalItems >= MIN_EVIDENCE ? Math.round((100 * num) / den) : null,
      confidence: confidenceFor(totalItems),
      evidence: [`${done.length} completed timed assessments (${totalItems} auto-scored items)`],
      improve: ['Take one timed mixed assessment per week.', 'Review every incorrect answer after submission.'],
    });
  }

  // Communication: self-assessed mock rubric.
  {
    const mocks = s.mockInterviews;
    const avg = mocks.length ? mocks.reduce((acc, x) => acc + avgRubric(x.rubric), 0) / mocks.length : null;
    dims.push({
      id: 'communication', title: 'Interview communication', selfAssessed: true,
      score: avg !== null && mocks.length >= 3 ? Math.round(((avg - 1) / 3) * 100) : null,
      confidence: confidenceFor(mocks.length * 2),
      evidence: [`${mocks.length} mock interviews (self-assessed rubric)`],
      improve: ['Do coding mocks that explain the approach aloud before coding.', 'Write STAR stories for behavioural questions.'],
    });
  }

  // Consistency: independent solves spread across distinct days.
  {
    const days = new Set<string>();
    let indep = 0, total = 0;
    for (const pp of Object.values(s.problemProgress)) {
      for (const a of pp.attempts) {
        total += 1;
        if (a.outcome === 'independent') { indep += 1; days.add(a.at.slice(0, 10)); }
      }
    }
    const rate = total ? indep / total : 0;
    const spread = Math.min(1, days.size / 14);
    dims.push({
      id: 'consistency', title: 'Independent problem-solving consistency',
      score: total >= MIN_EVIDENCE ? Math.round(100 * (0.6 * rate + 0.4 * spread)) : null,
      confidence: confidenceFor(total),
      evidence: [`${indep}/${total} attempts solved independently`, `Independent solves on ${days.size} distinct days (target 14)`],
      improve: ['Solve at least one problem without hints every day.', 'Re-solve hinted problems after a few days.'],
    });
  }

  return dims;
}

function avgRubric(r: Record<string, number>): number {
  const v = Object.values(r);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 1;
}

/** Company view: weighted average of the dimensions that have evidence. */
export function weightedReadiness(dims: Dimension[], weights: Partial<Record<DimensionId, number>>): { score: number | null; coverage: number } {
  let num = 0, den = 0, all = 0;
  for (const [id, w] of Object.entries(weights) as [DimensionId, number][]) {
    all += w;
    const d = dims.find((x) => x.id === id);
    if (!d || d.score === null) continue;
    num += w * d.score;
    den += w;
  }
  return { score: den > 0 ? Math.round(num / den) : null, coverage: all > 0 ? den / all : 0 };
}
