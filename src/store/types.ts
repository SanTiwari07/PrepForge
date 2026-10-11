// Persisted user data. See what_to_do.md Section 6.2. Bump STORE_VERSION and add a
// migration in store.ts when changing shapes.

export const STORE_VERSION = 1;

export type ErrorCategory =
  | 'misread-problem' | 'pattern-not-identified' | 'wrong-data-structure'
  | 'algorithm-not-developed' | 'implementation-bug' | 'wrong-complexity'
  | 'missed-edge-case' | 'time-management';

export type SqlErrorCategory =
  | 'wrong-join-type' | 'lost-zero-groups' | 'null-handling' | 'wrong-grouping'
  | 'row-multiplication' | 'date-boundary' | 'ties-not-handled' | 'dialect' | 'misread-requirement';

export type ProblemOutcome = 'independent' | 'with-hints' | 'after-solution' | 'gave-up';

export type CoachStage =
  | 'understand' | 'io' | 'brute' | 'brute-complexity' | 'bottleneck' | 'pattern'
  | 'optimal' | 'code' | 'test' | 'final-complexity' | 'reflect';

export interface ProblemAttempt {
  at: string;
  durationSec: number;
  hintsUsed: number;           // 0..4
  solutionViewed: boolean;
  outcome: ProblemOutcome;
  errorCategories: ErrorCategory[];
  reflection?: string;
  timed: boolean;
  firstSeen: boolean;
}

export interface ProblemProgress {
  status: 'todo' | 'attempted' | 'solved';
  attempts: ProblemAttempt[];
  notes: string;
  bookmarked: boolean;
  stageNotes: Partial<Record<CoachStage, string>>;
  hintsRevealed: number;       // persistent for the current attempt
  solutionRevealed: boolean;
}

export type McqContext = 'practice' | 'oa' | 'mastery' | 'review' | 'drill';

export interface McqAttempt {
  mcqId: string;
  at: string;
  selected: string[];
  correct: boolean;
  timeSec: number;
  context: McqContext;
  firstSeen: boolean;
}

export interface SqlAttempt {
  exerciseId: string;
  at: string;
  sql: string;
  passedVisible: boolean;
  passedAll: boolean;
  failedHidden: string[];
  hintsUsed: number;
  durationSec: number;
  errorCategories: SqlErrorCategory[];
  timed: boolean;
  firstSeen: boolean;
}

export type CardKind = 'flashcard' | 'mcq' | 'problem' | 'note' | 'sql' | 'interview-q';

export interface ReviewCard {
  id: string;                  // `${kind}:${refId}`
  kind: CardKind;
  refId: string;
  topicId: string;
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  due: string;                 // ISO date (yyyy-mm-dd)
  lastReviewed?: string;
  lastGrade?: number;
  createdAt: string;
}

export interface MasteryTestResult {
  at: string;
  scorePct: number;
  correct: number;
  total: number;
  durationSec: number;
  passed: boolean;
}

export interface TopicProgress {
  sectionsRead: string[];
  lastVisited?: string;
  masteryTests: MasteryTestResult[];
}

export type AssessmentItemKind = 'mcq' | 'sql' | 'coding';

export interface AssessmentItem {
  id: string;                  // unique within the attempt
  kind: AssessmentItemKind;
  refId: string;               // mcq id, sql exercise id, or problem slug
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AssessmentAnswer {
  selected?: string[];         // mcq
  sql?: string;                // sql
  sqlPassed?: boolean;         // computed by real execution at answer time
  selfReport?: 'solved' | 'partial' | 'not-solved'; // coding (self-reported)
}

export interface AssessmentConfig {
  title: string;
  preset: string;
  durationMin: number;
  modules: string[];
  topicIds: string[];
  difficulty: 'mixed' | 'easy' | 'medium' | 'hard';
  count: number;
}

export interface AssessmentResult {
  score: number;               // auto-scored correct items
  autoTotal: number;           // auto-scorable items
  accuracyPct: number;
  attempted: number;
  selfReported: { solved: number; total: number };
  byTopic: Record<string, { correct: number; total: number }>;
  byDifficulty: Record<string, { correct: number; total: number }>;
  durationSec: number;
}

export interface AssessmentAttempt {
  id: string;
  config: AssessmentConfig;
  items: AssessmentItem[];
  startedAt: string;
  endsAt: string;
  submittedAt?: string;
  answers: Record<string, AssessmentAnswer>;
  marked: string[];
  timePerItem: Record<string, number>;
  current: number;
  result?: AssessmentResult;
}

export interface Note {
  id: string;
  refType: 'topic' | 'problem' | 'mcq' | 'sql' | 'general';
  refId: string;
  title: string;
  body: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;                  // `${refType}:${refId}`
  refType: 'topic' | 'problem' | 'mcq' | 'sql';
  refId: string;
  title: string;
  createdAt: string;
}

export interface MockInterview {
  id: string;
  kind: 'coding' | 'behavioural' | 'system-design';
  at: string;
  refId: string;
  durationSec: number;
  rubric: Record<string, number>; // 1..4 per criterion (self-assessed)
  notes: string;
}

export interface StarStory {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  principles: string[];
  updatedAt: string;
}

export interface Profile {
  name: string;
  targetCompanies: string[];
  dailyMinutes: number;
  preferredLang: 'cpp' | 'java';
  targetDate?: string;
  weeklyGoals: { independentSolves: number; reviews: number; assessments: number; mcqs: number };
  onboarded: boolean;
}

export interface PersistedState {
  version: number;
  profile: Profile;
  topicProgress: Record<string, TopicProgress>;
  problemProgress: Record<string, ProblemProgress>;
  mcqAttempts: McqAttempt[];
  sqlAttempts: SqlAttempt[];
  reviewCards: Record<string, ReviewCard>;
  assessments: AssessmentAttempt[];
  notes: Note[];
  bookmarks: Bookmark[];
  mockInterviews: MockInterview[];
  stories: StarStory[];
  activity: Record<string, { actions: number; minutes: number }>;
}
