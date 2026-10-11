// Content contracts. See what_to_do.md Section 6. IDs are stable forever.

export type ModuleId =
  | 'dsa' | 'sql' | 'dbms' | 'oop-cpp' | 'oop-java' | 'cn' | 'os'
  | 'system-design' | 'devops' | 'core-cs';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Level = 'foundation' | 'core' | 'advanced';
export type ContentStatus = 'complete' | 'partial' | 'planned';
export type Lang = 'cpp' | 'java' | 'sql' | 'python' | 'bash' | 'yaml' | 'dockerfile' | 'json' | 'text';

export interface Provenance {
  kind: 'original' | 'adapted' | 'official-list';
  source?: string;
  url?: string;
}

export interface CodeSample {
  lang: Lang;
  code: string;
  label?: string;
  verify?: boolean;
  expectedOutput?: string;
  std?: 'c++14' | 'c++17' | 'c++20';
  /** Compile-error questions: compilation must FAIL, at the line marked "// here". */
  expectCompileError?: boolean;
}

export interface TraceStep {
  note: string;
  array?: (number | string)[];
  pointers?: Record<string, number>;
  highlight?: number[];
  window?: [number, number];
  stack?: (number | string)[];
  vars?: Record<string, string | number>;
}

export type SectionKind =
  | 'concept' | 'intuition' | 'visual' | 'dry-run' | 'code' | 'complexity'
  | 'mistakes' | 'recognition' | 'comparison' | 'example';

export interface LearnSection {
  id: string;
  kind: SectionKind;
  title: string;
  bodyMd: string;
  code?: CodeSample[];
  trace?: TraceStep[];
}

export interface RecognitionGuide {
  signals: string[];
  antiSignals: string[];
  decisionQuestions: string[];
}

export interface InterviewQuestion {
  id: string;
  q: string;
  answerMd: string;
  followUps?: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  backMd: string;
}

export interface Resource {
  title: string;
  url: string;
  kind: 'official-docs' | 'article' | 'video' | 'practice' | 'course' | 'book';
  httpVerifiable?: boolean;
}

export interface MasteryCriteria {
  testSize: number;            // number of MCQs drawn for the mastery test
  testMinutes: number;
  passPct: number;
  minIndependentSolves: number;
  minMediumIndependent: number;
  retentionDays: number;
}

export interface Topic {
  id: string;                  // 'dsa.sliding-window'
  moduleId: ModuleId;
  title: string;
  summary: string;
  level: Level;
  status: ContentStatus;
  estMinutes: number;
  prerequisites: string[];
  related: string[];
  subtopics?: string[];
  objectives: string[];
  sections: LearnSection[];
  recognition?: RecognitionGuide;
  mcqIds: string[];
  interviewQuestions: InterviewQuestion[];
  problemIds: string[];        // DSA problem slugs or SQL exercise ids
  revision: { notesMd: string; templates?: CodeSample[]; flashcards: Flashcard[] };
  mastery: MasteryCriteria;
  resources: Resource[];
}

export type McqType =
  | 'concept' | 'complexity' | 'code-output' | 'compile-error' | 'debug' | 'edge-case'
  | 'scenario' | 'command' | 'config' | 'which-method' | 'design' | 'pattern';

export interface MCQ {
  id: string;
  topicIds: string[];
  moduleId: ModuleId;
  type: McqType;
  difficulty: Difficulty;
  stemMd: string;
  code?: CodeSample;
  options: { id: string; textMd: string; whyWrongMd?: string }[];
  correct: string[];
  explanationMd: string;
  misconceptionsMd?: string;
  provenance: Provenance;
  verified?: 'compiled' | 'executed' | 'reviewed' | 'unverified';
}

export type ProblemList = 'neetcode150' | 'blind75' | 'top-interview-150' | 'leetcode-75' | 'striver-a2z' | 'curated';

export interface CoachWalkthrough {
  understandMd: string;
  ioConstraintsMd: string;
  edgeCases: string[];
  bruteForceMd: string;
  bruteComplexity: string;
  bottleneckMd: string;
  hints: [string, string, string, string];
  optimalMd: string;
  code: CodeSample[];
  finalComplexity: string;
  testCases: { input: string; expected: string; why: string }[];
  takeawaysMd: string;
}

export interface Problem {
  slug: string;
  leetcodeId: number;
  title: string;
  difficulty: Difficulty;
  premium: boolean;
  url: string;
  freeAlternativeUrl?: string;
  lists: ProblemList[];
  topicIds: string[];
  primaryTopicId: string;
  patterns: string[];
  estMinutes: number;
  videoUrl?: string;
}

export interface Module {
  id: ModuleId;
  title: string;
  shortTitle: string;
  description: string;
  color: string;               // CSS variable name for the subject marker
  topicIds: string[];
  tracks?: { id: string; title: string; topicIds: string[] }[];
}

export interface SqlDataset {
  id: string;
  title: string;
  description: string;
  schemaSql: string;
  seedSql: string;
  hidden: { id: string; purpose: string; seedSql: string }[];
}

export interface SqlExercise {
  id: string;
  title: string;
  topicIds: string[];
  difficulty: Difficulty;
  datasetId: string;
  promptMd: string;
  referenceSql: string;          // portable (runs on SQLite and MySQL)
  referenceMysql?: string;       // only when MySQL syntax differs
  orderMatters: boolean;
  hints: string[];
  explanationMd: string;
  wrongApproaches?: { sql: string; whyMd: string }[];
  targetMinutes: number;
  similarTo?: { title: string; url: string }[];
  verification: 'verified-sqlite' | 'verified-mysql' | 'needs-validation';
}

// Content is split for loading (what_to_do.md B13): this lightweight metadata ships in the main
// bundle via src/content/index.generated.ts; full lessons, MCQs and walkthroughs load per module.
export interface TopicMeta extends Omit<Topic, 'sections' | 'interviewQuestions' | 'revision' | 'resources' | 'recognition'> {
  sectionIds: string[];
  counts: { interviewQuestions: number; flashcards: number };
}

export type McqMeta = Pick<MCQ, 'id' | 'topicIds' | 'moduleId' | 'type' | 'difficulty' | 'verified'> & {
  /** First ~90 characters of the stem, markdown stripped; used by search. */
  title: string;
};

export interface ContentPack {
  topics: Topic[];
  mcqs: MCQ[];
  walkthroughs?: Record<string, CoachWalkthrough>;
}
