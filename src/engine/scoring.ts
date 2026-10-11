// Assessment scoring. Self-reported coding items never count towards the auto score.
import type { MCQ } from '@/content/schema';
import type { AssessmentAttempt, AssessmentResult } from '@/store/types';

export function isMcqCorrect(q: MCQ, selected: string[] | undefined): boolean {
  if (!selected || selected.length === 0) return false;
  const a = [...selected].sort().join(',');
  const b = [...q.correct].sort().join(',');
  return a === b;
}

export function scoreAssessment(attempt: AssessmentAttempt, mcqById: Map<string, MCQ>, now: Date = new Date()): AssessmentResult {
  const byTopic: AssessmentResult['byTopic'] = {};
  const byDifficulty: AssessmentResult['byDifficulty'] = {};
  let score = 0;
  let autoTotal = 0;
  let attempted = 0;
  let selfSolved = 0;
  let selfTotal = 0;

  for (const item of attempt.items) {
    const ans = attempt.answers[item.id];
    if (item.kind === 'coding') {
      selfTotal += 1;
      if (ans?.selfReport) attempted += 1;
      if (ans?.selfReport === 'solved') selfSolved += 1;
      continue;
    }
    autoTotal += 1;
    let correct = false;
    if (item.kind === 'mcq') {
      const q = mcqById.get(item.refId);
      if (ans?.selected && ans.selected.length) attempted += 1;
      correct = q ? isMcqCorrect(q, ans?.selected) : false;
    } else if (item.kind === 'sql') {
      if (ans?.sql && ans.sql.trim()) attempted += 1;
      correct = ans?.sqlPassed === true;
    }
    if (correct) score += 1;
    const t = (byTopic[item.topicId] ??= { correct: 0, total: 0 });
    t.total += 1;
    if (correct) t.correct += 1;
    const d = (byDifficulty[item.difficulty] ??= { correct: 0, total: 0 });
    d.total += 1;
    if (correct) d.correct += 1;
  }

  const end = attempt.submittedAt ? Date.parse(attempt.submittedAt) : now.getTime();
  const durationSec = Math.max(0, Math.round((Math.min(end, Date.parse(attempt.endsAt)) - Date.parse(attempt.startedAt)) / 1000));
  return {
    score,
    autoTotal,
    accuracyPct: autoTotal ? Math.round((100 * score) / autoTotal) : 0,
    attempted,
    selfReported: { solved: selfSolved, total: selfTotal },
    byTopic,
    byDifficulty,
    durationSec,
  };
}
