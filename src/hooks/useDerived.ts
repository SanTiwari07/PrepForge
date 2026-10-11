import { useMemo } from 'react';
import { useStore } from '@/store/store';
import type { PersistedState } from '@/store/types';
import { computeTopicMastery, type ContentIndex, type TopicMastery } from '@/engine/mastery';
import { MCQ_BY_ID, PROBLEM_BY_SLUG, SQL_EXERCISE_BY_ID, TOPICS } from '@/content/registry';
import { computeReadiness } from '@/engine/readiness';

export const CONTENT_INDEX: ContentIndex = { mcqById: MCQ_BY_ID, problemBySlug: PROBLEM_BY_SLUG, sqlById: SQL_EXERCISE_BY_ID };

/** Snapshot of the persisted slices that evidence engines read. Re-renders when any of them change. */
export function useEvidenceState(): PersistedState {
  const profile = useStore((s) => s.profile);
  const topicProgress = useStore((s) => s.topicProgress);
  const problemProgress = useStore((s) => s.problemProgress);
  const mcqAttempts = useStore((s) => s.mcqAttempts);
  const sqlAttempts = useStore((s) => s.sqlAttempts);
  const reviewCards = useStore((s) => s.reviewCards);
  const assessments = useStore((s) => s.assessments);
  const mockInterviews = useStore((s) => s.mockInterviews);
  const activity = useStore((s) => s.activity);
  const notes = useStore((s) => s.notes);
  const bookmarks = useStore((s) => s.bookmarks);
  const stories = useStore((s) => s.stories);
  return useMemo(
    () => ({ version: 1, profile, topicProgress, problemProgress, mcqAttempts, sqlAttempts, reviewCards, assessments, mockInterviews, activity, notes, bookmarks, stories }),
    [profile, topicProgress, problemProgress, mcqAttempts, sqlAttempts, reviewCards, assessments, mockInterviews, activity, notes, bookmarks, stories],
  );
}

export function useMasteryMap(): Map<string, TopicMastery> {
  const s = useEvidenceState();
  return useMemo(() => new Map(TOPICS.map((t) => [t.id, computeTopicMastery(t, s, CONTENT_INDEX)])), [s]);
}

export function useReadiness() {
  const s = useEvidenceState();
  return useMemo(() => computeReadiness(s, MCQ_BY_ID, PROBLEM_BY_SLUG), [s]);
}
