import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AssessmentAnswer, AssessmentAttempt, Bookmark, CardKind, CoachStage, McqAttempt, MockInterview,
  Note, PersistedState, ProblemAttempt, ProblemProgress, Profile, SqlAttempt, StarStory, MasteryTestResult,
} from './types';
import { STORE_VERSION } from './types';
import { gradeCard, newCard } from '@/engine/revision';
import { today } from '@/engine/dates';

export const STORAGE_KEY = 'prepforge:v1';

export const defaultProfile: Profile = {
  name: '',
  targetCompanies: ['google', 'amazon', 'microsoft'],
  dailyMinutes: 120,
  preferredLang: 'cpp',
  weeklyGoals: { independentSolves: 10, reviews: 60, assessments: 1, mcqs: 60 },
  onboarded: false,
};

export function emptyState(): PersistedState {
  return {
    version: STORE_VERSION,
    profile: { ...defaultProfile },
    topicProgress: {},
    problemProgress: {},
    mcqAttempts: [],
    sqlAttempts: [],
    reviewCards: {},
    assessments: [],
    notes: [],
    bookmarks: [],
    mockInterviews: [],
    stories: [],
    activity: {},
  };
}

export function emptyProblemProgress(): ProblemProgress {
  return { status: 'todo', attempts: [], notes: '', bookmarked: false, stageNotes: {}, hintsRevealed: 0, solutionRevealed: false };
}

interface Actions {
  updateProfile: (p: Partial<Profile>) => void;
  markSectionRead: (topicId: string, sectionId: string, read?: boolean) => void;
  visitTopic: (topicId: string) => void;
  recordMasteryTest: (topicId: string, r: MasteryTestResult) => void;
  recordMcq: (a: Omit<McqAttempt, 'at' | 'firstSeen'>, topicId: string) => McqAttempt;
  setStageNote: (slug: string, stage: CoachStage, text: string) => void;
  revealHint: (slug: string, level: number) => void;
  revealSolution: (slug: string) => void;
  recordProblemAttempt: (slug: string, topicId: string, a: Omit<ProblemAttempt, 'at' | 'firstSeen'>) => void;
  setProblemNotes: (slug: string, notes: string) => void;
  setProblemStatus: (slug: string, status: ProblemProgress['status']) => void;
  recordSql: (a: Omit<SqlAttempt, 'at' | 'firstSeen'>, topicId: string) => void;
  addCard: (kind: CardKind, refId: string, topicId: string) => void;
  removeCard: (id: string) => void;
  reviewCard: (id: string, grade: number) => void;
  startAssessment: (a: AssessmentAttempt) => void;
  answerAssessment: (id: string, itemId: string, answer: AssessmentAnswer) => void;
  toggleMarkAssessment: (id: string, itemId: string) => void;
  setAssessmentCurrent: (id: string, index: number) => void;
  addAssessmentTime: (id: string, itemId: string, sec: number) => void;
  finishAssessment: (id: string, patch: Pick<AssessmentAttempt, 'submittedAt' | 'result'>) => void;
  deleteAssessment: (id: string) => void;
  upsertNote: (n: Omit<Note, 'updatedAt'>) => void;
  deleteNote: (id: string) => void;
  toggleBookmark: (b: Omit<Bookmark, 'createdAt' | 'id'>) => void;
  addMock: (m: MockInterview) => void;
  upsertStory: (s: Omit<StarStory, 'updatedAt'>) => void;
  deleteStory: (id: string) => void;
  logActivity: (actions?: number, minutes?: number) => void;
  importState: (s: PersistedState) => void;
  resetAll: () => void;
}

export type Store = PersistedState & Actions;

function bumpActivity(s: PersistedState, actions = 1, minutes = 0) {
  const d = today();
  const cur = s.activity[d] ?? { actions: 0, minutes: 0 };
  return { ...s.activity, [d]: { actions: cur.actions + actions, minutes: cur.minutes + minutes } };
}

function ensureCard(s: PersistedState, kind: CardKind, refId: string, topicId: string) {
  const id = `${kind}:${refId}`;
  if (s.reviewCards[id]) return s.reviewCards;
  return { ...s.reviewCards, [id]: newCard(kind, refId, topicId) };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...emptyState(),

      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

      markSectionRead: (topicId, sectionId, read = true) =>
        set((s) => {
          const tp = s.topicProgress[topicId] ?? { sectionsRead: [], masteryTests: [] };
          const has = tp.sectionsRead.includes(sectionId);
          if (read === has) return {};
          const sectionsRead = read ? [...tp.sectionsRead, sectionId] : tp.sectionsRead.filter((x) => x !== sectionId);
          return { topicProgress: { ...s.topicProgress, [topicId]: { ...tp, sectionsRead } } };
        }),

      visitTopic: (topicId) =>
        set((s) => {
          const tp = s.topicProgress[topicId] ?? { sectionsRead: [], masteryTests: [] };
          return { topicProgress: { ...s.topicProgress, [topicId]: { ...tp, lastVisited: new Date().toISOString() } } };
        }),

      recordMasteryTest: (topicId, r) =>
        set((s) => {
          const tp = s.topicProgress[topicId] ?? { sectionsRead: [], masteryTests: [] };
          return {
            topicProgress: { ...s.topicProgress, [topicId]: { ...tp, masteryTests: [...tp.masteryTests, r] } },
            activity: bumpActivity(s, 1),
          };
        }),

      recordMcq: (a, topicId) => {
        const s = get();
        const firstSeen = !s.mcqAttempts.some((x) => x.mcqId === a.mcqId);
        const attempt: McqAttempt = { ...a, at: new Date().toISOString(), firstSeen };
        set({
          mcqAttempts: [...s.mcqAttempts, attempt],
          reviewCards: a.correct ? s.reviewCards : ensureCard(s, 'mcq', a.mcqId, topicId),
          activity: bumpActivity(s, 1),
        });
        return attempt;
      },

      setStageNote: (slug, stage, text) =>
        set((s) => {
          const pp = s.problemProgress[slug] ?? emptyProblemProgress();
          return { problemProgress: { ...s.problemProgress, [slug]: { ...pp, stageNotes: { ...pp.stageNotes, [stage]: text } } } };
        }),

      revealHint: (slug, level) =>
        set((s) => {
          const pp = s.problemProgress[slug] ?? emptyProblemProgress();
          return { problemProgress: { ...s.problemProgress, [slug]: { ...pp, hintsRevealed: Math.max(pp.hintsRevealed, level) } } };
        }),

      revealSolution: (slug) =>
        set((s) => {
          const pp = s.problemProgress[slug] ?? emptyProblemProgress();
          return { problemProgress: { ...s.problemProgress, [slug]: { ...pp, solutionRevealed: true } } };
        }),

      recordProblemAttempt: (slug, topicId, a) =>
        set((s) => {
          const pp = s.problemProgress[slug] ?? emptyProblemProgress();
          const attempt: ProblemAttempt = { ...a, at: new Date().toISOString(), firstSeen: pp.attempts.length === 0 };
          const solved = a.outcome !== 'gave-up';
          const status = solved ? 'solved' : pp.status === 'solved' ? 'solved' : 'attempted';
          // Problems that needed help come back for review; independent solves are scheduled further out.
          let reviewCards = s.reviewCards;
          const cardId = `problem:${slug}`;
          if (a.outcome !== 'independent' || s.reviewCards[cardId]) {
            reviewCards = ensureCard(s, 'problem', slug, topicId);
          }
          return {
            problemProgress: {
              ...s.problemProgress,
              [slug]: { ...pp, status, attempts: [...pp.attempts, attempt], hintsRevealed: 0, solutionRevealed: false },
            },
            reviewCards,
            activity: bumpActivity(s, 1, Math.round(a.durationSec / 60)),
          };
        }),

      setProblemNotes: (slug, notes) =>
        set((s) => {
          const pp = s.problemProgress[slug] ?? emptyProblemProgress();
          return { problemProgress: { ...s.problemProgress, [slug]: { ...pp, notes } } };
        }),

      setProblemStatus: (slug, status) =>
        set((s) => {
          const pp = s.problemProgress[slug] ?? emptyProblemProgress();
          return { problemProgress: { ...s.problemProgress, [slug]: { ...pp, status } } };
        }),

      recordSql: (a, topicId) =>
        set((s) => {
          const firstSeen = !s.sqlAttempts.some((x) => x.exerciseId === a.exerciseId);
          return {
            sqlAttempts: [...s.sqlAttempts, { ...a, at: new Date().toISOString(), firstSeen }],
            reviewCards: a.passedAll ? s.reviewCards : ensureCard(s, 'sql', a.exerciseId, topicId),
            activity: bumpActivity(s, 1),
          };
        }),

      addCard: (kind, refId, topicId) => set((s) => ({ reviewCards: ensureCard(s, kind, refId, topicId) })),
      removeCard: (id) =>
        set((s) => {
          const next = { ...s.reviewCards };
          delete next[id];
          return { reviewCards: next };
        }),
      reviewCard: (id, grade) =>
        set((s) => {
          const c = s.reviewCards[id];
          if (!c) return {};
          return { reviewCards: { ...s.reviewCards, [id]: gradeCard(c, grade) }, activity: bumpActivity(s, 1) };
        }),

      startAssessment: (a) => set((s) => ({ assessments: [...s.assessments, a] })),
      answerAssessment: (id, itemId, answer) =>
        set((s) => ({
          assessments: s.assessments.map((a) => (a.id === id ? { ...a, answers: { ...a.answers, [itemId]: answer } } : a)),
        })),
      toggleMarkAssessment: (id, itemId) =>
        set((s) => ({
          assessments: s.assessments.map((a) =>
            a.id === id ? { ...a, marked: a.marked.includes(itemId) ? a.marked.filter((x) => x !== itemId) : [...a.marked, itemId] } : a,
          ),
        })),
      setAssessmentCurrent: (id, index) =>
        set((s) => ({ assessments: s.assessments.map((a) => (a.id === id ? { ...a, current: index } : a)) })),
      addAssessmentTime: (id, itemId, sec) =>
        set((s) => ({
          assessments: s.assessments.map((a) =>
            a.id === id ? { ...a, timePerItem: { ...a.timePerItem, [itemId]: (a.timePerItem[itemId] ?? 0) + sec } } : a,
          ),
        })),
      finishAssessment: (id, patch) =>
        set((s) => ({
          assessments: s.assessments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
          activity: bumpActivity(s, 1),
        })),
      deleteAssessment: (id) => set((s) => ({ assessments: s.assessments.filter((a) => a.id !== id) })),

      upsertNote: (n) =>
        set((s) => {
          const note: Note = { ...n, updatedAt: new Date().toISOString() };
          const exists = s.notes.some((x) => x.id === n.id);
          return { notes: exists ? s.notes.map((x) => (x.id === n.id ? note : x)) : [note, ...s.notes] };
        }),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      toggleBookmark: (b) =>
        set((s) => {
          const id = `${b.refType}:${b.refId}`;
          if (s.bookmarks.some((x) => x.id === id)) return { bookmarks: s.bookmarks.filter((x) => x.id !== id) };
          return { bookmarks: [{ ...b, id, createdAt: new Date().toISOString() }, ...s.bookmarks] };
        }),

      addMock: (m) => set((s) => ({ mockInterviews: [...s.mockInterviews, m], activity: bumpActivity(s, 1, Math.round(m.durationSec / 60)) })),
      upsertStory: (st) =>
        set((s) => {
          const story: StarStory = { ...st, updatedAt: new Date().toISOString() };
          const exists = s.stories.some((x) => x.id === st.id);
          return { stories: exists ? s.stories.map((x) => (x.id === st.id ? story : x)) : [story, ...s.stories] };
        }),
      deleteStory: (id) => set((s) => ({ stories: s.stories.filter((x) => x.id !== id) })),

      logActivity: (actions = 1, minutes = 0) => set((s) => ({ activity: bumpActivity(s, actions, minutes) })),

      importState: (incoming) => set(() => ({ ...emptyState(), ...incoming, version: STORE_VERSION })),
      resetAll: () => set(() => emptyState()),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const out: Partial<PersistedState> = {};
        for (const k of Object.keys(emptyState()) as (keyof PersistedState)[]) {
          (out as Record<string, unknown>)[k] = s[k];
        }
        return out as PersistedState;
      },
      migrate: (persisted) => {
        // v1 is the first version. Future migrations go here, keyed on the stored version.
        return { ...emptyState(), ...(persisted as Partial<PersistedState>) } as Store;
      },
    },
  ),
);

/** Validate an imported JSON backup. Returns an error message or null. */
export function validateImport(data: unknown): string | null {
  if (!data || typeof data !== 'object') return 'The file is not a JSON object.';
  const d = data as Record<string, unknown>;
  if (typeof d.version !== 'number') return 'Missing "version"; this does not look like a PrepForge backup.';
  if (d.version > STORE_VERSION) return `Backup version ${d.version} is newer than this app (${STORE_VERSION}).`;
  const arrays = ['mcqAttempts', 'sqlAttempts', 'assessments', 'notes', 'bookmarks', 'mockInterviews', 'stories'];
  for (const k of arrays) if (d[k] !== undefined && !Array.isArray(d[k])) return `"${k}" must be a list.`;
  const objects = ['profile', 'topicProgress', 'problemProgress', 'reviewCards', 'activity'];
  for (const k of objects) if (d[k] !== undefined && (typeof d[k] !== 'object' || Array.isArray(d[k]))) return `"${k}" must be an object.`;
  return null;
}

export function exportState(): PersistedState {
  const s = useStore.getState();
  const out = emptyState();
  for (const k of Object.keys(out) as (keyof PersistedState)[]) {
    (out as unknown as Record<string, unknown>)[k] = s[k];
  }
  return out;
}
