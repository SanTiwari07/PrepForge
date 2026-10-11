# PrepForge: Master Roadmap and Source of Truth

> **This file is the persistent source of truth for the project.** Every session must read
> it first, work from the "Next actions" list, and update it before stopping: tick
> completed tasks, record decisions in the Decision Log, and record blockers in Blockers.
> If the code and this file disagree, fix one of them in the same session.

| | |
|---|---|
| Product name | **PrepForge** (the working name "PlacementOS" was replaced at the user's request) |
| Repository | `https://github.com/SanTiwari07/PrepForge.git` (public), branch `main`, local folder `D:\Projects\PlacementResource` |
| Last updated | 2026-10-11 (session 1: audit, roadmap, and the SQL/DBMS college + placement plan; no application code written yet) |
| Open decision | **D-SQL-1:** how to store college materials, given the repo is public (Section 17). Blocks Phase 5A/5B imports only |
| Current phase | Phase 0, Repository setup (not started) |
| Overall status | Planning complete. Verified research data in `research/`. Application not yet implemented. |

> **Git workflow (user requirement): keep pushing.** Commit and push to `origin main` after
> every completed task or meaningful checkpoint, always including the updated `what_to_do.md`.
> Never force-push. Never commit secrets, `.env` files or `node_modules`.

---

## Contents

1. [How to resume (read this first)](#1-how-to-resume-read-this-first)
2. [Repository audit (actual state)](#2-repository-audit-actual-state)
3. [Vision, goals and non-goals](#3-vision-goals-and-non-goals)
4. [Tech stack and architecture decisions](#4-tech-stack-and-architecture-decisions)
5. [Information architecture and routes](#5-information-architecture-and-routes)
6. [Data models](#6-data-models)
7. [Core engines: progress, mastery, revision, readiness, daily plan](#7-core-engines)
8. [Module specifications and curriculum](#8-module-specifications-and-curriculum)
9. [Cross-cutting features](#9-cross-cutting-features)
10. [UI/UX and responsive requirements](#10-uiux-and-responsive-requirements)
11. [Content quality standard](#11-content-quality-standard)
12. [External resources and link verification](#12-external-resources-and-link-verification)
13. [Implementation phases and task checklist](#13-implementation-phases-and-task-checklist)
14. [Testing and QA](#14-testing-and-qa)
15. [Definition of done](#15-definition-of-done)
16. [Blockers and known limitations](#16-blockers-and-known-limitations)
17. [Decision log](#17-decision-log)
18. [Session log](#18-session-log)

**Checkbox legend:** `[x]` done and verified · `[ ]` pending · `[ ] (IN PROGRESS)` started ·
`[ ] (BLOCKED: reason)` cannot proceed · `[ ] (PARTIAL: what exists)` partly done.
Never tick a box for a feature that only exists as a mockup.

---

## 1. How to resume (read this first)

1. Read this file top to bottom, then `DESIGN.md` (visual system) and `research/README.md` (verified data provenance).
2. Find the current phase in [Section 13](#13-implementation-phases-and-task-checklist) and pick up the first unchecked task with no unmet dependency.
3. Before writing content, read [Section 11](#11-content-quality-standard). Before adding any external link, read [Section 12](#12-external-resources-and-link-verification).
4. Run the quality gates in [Section 14](#14-testing-and-qa) before ticking a phase's acceptance criteria.
5. Before ending the session, update the header table, tick tasks, add Decision Log and Session Log entries, and update Blockers. Then commit and `git push origin main`.

**Next actions (in order):**

1. Phase 0: scaffold Vite + React + TypeScript, tooling, design tokens, and CI scripts.
2. Phase 1: app shell, routing, persistence store, content schema and validator, content renderer.
3. Phase 2: the DSA learning loop end to end (topic page → MCQs → problem bank → Problem-Solving Coach → attempt logging → dashboard v1), using the first five DSA topics as the pilot.
4. Ask the learner for decision D-SQL-1 and for the missing college materials in Section 8.2.3, so Phase 5 is not blocked when it starts. Phase 5 (SQL/DBMS) may be pulled forward to follow Phase 2 directly if college exams are near.

---

## 2. Repository audit (actual state)

Audited on 2026-10-11.

| Item | Finding |
|---|---|
| Files | `DESIGN.md` only (plus `research/` and this file, added in session 1). |
| Framework / package manager | None. No `package.json`, no source code, no tests, no build. |
| Git | Was not a git repository at audit time. In session 1 it was initialised and connected to `https://github.com/SanTiwari07/PrepForge.git`, which was empty (public, no branches), so nothing remote was overwritten. |
| Existing features to preserve | None. Nothing to migrate or break. |
| Design system | `DESIGN.md`: a Webflow-inspired system. Near-black `#080808` primary, white canvas, Inter (substitute for WF Visual Sans), weights 400/500/600 only, 4px button radius, 8px card radius, 1px `#d8d8d8` hairlines, 4px spacing base, five chromatic accents (purple/pink/blue/orange/green), and breakpoints at 479/767/991. **Adopt it as the visual spec**, with the adaptations in [Section 10](#10-uiux-and-responsive-requirements). |
| Local toolchain | Node 22.17.1, npm 10.9.2, git 2.53, Python 3.13.6, **g++ 6.3.0 (MinGW, old: C++14, partial C++17)**, **javac/java 23.0.2**, Docker Desktop on PATH. |
| Network research access | LeetCode GraphQL works. GitHub raw, takeuforward.org and amazon.jobs are fetchable. Google Careers and Meta Careers are JS-rendered and need the in-app browser. The WebSearch and WebFetch tools failed in session 1 because of a model configuration error, so use `curl`, Python or the built-in browser instead. |

**Conclusion:** this is a greenfield build. The fastest maintainable strategy is a
static, local-first single-page app. No backend is needed for a single learner, and it
can deploy anywhere for free (see [Section 4](#4-tech-stack-and-architecture-decisions)).

---

## 3. Vision, goals and non-goals

### Vision

PrepForge is an end-to-end, adaptive preparation system. It takes the learner from
"I understand some theory but freeze on unfamiliar OA questions" to "I can independently
recognise patterns, solve unseen DSA, SQL and OOP questions under time pressure, and explain
core CS confidently."

### Target outcomes

- **Target companies:** Google, Amazon, Meta, Apple, Netflix (FAANG); Zscaler; other product-based or high-paying tech companies offering ₹25 LPA or more.
- **Primary skill gap:** solving *unfamiliar* problems: identifying the approach, developing a solution, and finishing under time pressure. This applies to DSA, OOP output and design questions, SQL, and mixed-topic OAs.
- **Every product decision must serve one question:** does this make the learner more capable of solving unseen questions independently and explaining concepts clearly?

### The five questions the dashboard must answer immediately

1. What should I study today?
2. What have I completed?
3. Where am I weak?
4. What should I revise?
5. How close am I to my preparation targets?

### Non-goals and hard rules

- Not a link directory and not a progress-bar tracker. External links supplement native learning and practice; they never replace it.
- No fake functionality: no simulated SQL or code execution, no fake AI, no fabricated metrics, company data, question provenance or question counts.
- No claim that any score guarantees a placement or a ₹25 LPA+ offer. Readiness is *preparation evidence*, not a hiring prediction.
- Never mark unimplemented or empty content as complete. Content status is shown in the UI as **Complete**, **Partial** or **Planned**.
- No copying of copyrighted problem statements. Link the official problem and write original hints, observations and solutions.
- No paid APIs or services unless the dependency is explicit, optional, and the app still works without it.
- Do not optimise only for desktop.

---

## 4. Tech stack and architecture decisions

The repository has no existing stack, so the stack below is chosen for: a single
learner, static deployment, offline use, low maintenance, typed content, and few
dependencies.

| Concern | Decision | Rationale and notes |
|---|---|---|
| Build / dev server | **Vite** | Fast dev server; static `dist/` output. |
| UI | **React 18 + TypeScript (strict)** | Typed content schema catches content errors at compile time. |
| Routing | **React Router v6** (`createBrowserRouter`) | Add an SPA fallback for static hosts (`public/_redirects`, `vercel.json`, or a `404.html` copy for GitHub Pages). |
| Styling | **Plain CSS with design tokens (CSS custom properties) + CSS Modules** | No Tailwind or UI kit. Tokens come from `DESIGN.md`. Global files: `src/styles/tokens.css`, `base.css`, `utilities.css`. |
| Icons | **lucide-react** | Required by spec. No emoji in the product UI. |
| State and persistence | **Zustand + `persist` middleware → `localStorage`**, one versioned key `prepforge:v1` with a `migrate()` function | Synchronous, simple, and sufficient for a single user (estimated under 3 MB after a year of heavy use). JSON export and import is mandatory. If storage exceeds ~3 MB, switch the storage adapter to IndexedDB (`idb-keyval`) without changing slices. |
| Prose content | **Markdown strings inside typed TS content files**, rendered with **`marked`** | Authored content is trusted. User-authored notes are rendered as **escaped plain text** (or through a sanitiser if Markdown is enabled for notes later). |
| Code highlighting | **highlight.js core** with only: cpp, java, sql, bash, yaml, dockerfile, json, python, ini, plaintext | Small bundle; server-free. |
| SQL sandbox | **sql.js (SQLite compiled to WASM)**, lazy-loaded, run inside a **Web Worker** with a hard timeout (terminate the worker after 3 s) | Real execution, fully sandboxed in the browser, no server. Datasets are re-created from seed SQL on every run, so the learner cannot corrupt them. Copy `sql-wasm.wasm` into `public/`. **Dialect caveat:** SQLite, not MySQL. Exercises use portable SQL; MySQL-specific functions (`DATEDIFF`, `DATE_ADD`, `IFNULL` vs `COALESCE`, `LIMIT x,y`) are taught with explicit dialect notes. |
| DSA code execution | **None in v1.** The coach plus self-reported outcome, with a link to LeetCode to submit | Running C++/Java in the browser is not feasible at reasonable size. Optional Phase 11: Judge0 (self-hosted, or the RapidAPI tier, which is **paid**) behind a serverless proxy, clearly labelled. |
| AI coach | **None in v1.** A deterministic, content-driven coach | Optional Phase 11: a serverless proxy (Netlify/Vercel function) calling the Claude API with the key held **server-side only**. The app must remain fully usable with the proxy absent. Never put an API key in client code or localStorage. |
| Charts | **Hand-written SVG components** (horizontal bar, stacked bar, sparkline, heatmap calendar, progress ring) | No chart library. Every chart needs a purpose and a text equivalent. |
| Search | **In-house in-memory index** over titles, tags, topic names and MCQ stems | Upgrade to `minisearch` only if search quality is poor. |
| Unit / component tests | **Vitest + @testing-library/react + jsdom** | Engines (revision, mastery, readiness, scoring, plan) must have unit tests. |
| E2E and visual QA | **Playwright** (chromium) at 320, 375, 768, 1024, 1440, 1920 and 2560 px | Plus manual checks in the in-app browser. |
| Lint / format | **ESLint (typescript-eslint, react-hooks, jsx-a11y) + Prettier** | |
| Content integrity | `scripts/validate-content.ts` (run in `npm test`) | Unique IDs, referential integrity, MCQ answer validity, required fields, status honesty. |
| Code verification | `scripts/verify-code.mjs` compiles every snippet marked `verify: true` with local `g++`/`javac`, runs it, and compares stdout with the recorded expected output | **Blocker:** local g++ is 6.3 (C++14). Install a modern GCC (e.g., MSYS2 UCRT64 GCC 13+) for C++17/20 snippets, or keep verified snippets at C++14. |
| Link verification | `scripts/check-links.mjs` | LeetCode slugs via GraphQL; other sites via GET status; SPA domains (neetcode.io) marked "not HTTP-verifiable". |
| Deployment | Static hosting (Netlify, Vercel, Cloudflare Pages or GitHub Pages) or `npm run preview` locally | No server required for v1. |

### Layered architecture

```
src/
  app/            router, providers, layout shell (sidebar, topbar, mobile drawer)
  components/     reusable UI primitives (Button, Card, Badge, Tabs, Disclosure,
                  CodeBlock, CodeTabs, Table, ProgressBar, Stat, EmptyState,
                  Dialog, Toast, Timer, SearchDialog, Charts/*)
  features/       feature UIs, one folder each:
                  dashboard, roadmap, learn (topic renderer), mcq, problems, coach,
                  sql, oa (assessment runner), revision, companies, analytics,
                  mistakes, notes, mock-interviews, tools (simulators), settings
  engine/         PURE TypeScript business logic, no React:
                  mastery.ts, revision.ts (SM-2), readiness.ts, plan.ts,
                  scoring.ts, recommend.ts, streak.ts, search.ts, sqlCompare.ts
  store/          Zustand slices + persist + migrations + export/import
  content/        typed content (schema.ts + one folder per module) and
                  problems/ (generated from research/*.verified.json + authored
                  coach walkthroughs)
  workers/        sql.worker.ts
  styles/         tokens.css, base.css, utilities.css
scripts/          validate-content, verify-code, check-links, build-problem-bank
tests/            unit (engine), component, e2e (Playwright)
research/         verified raw data and provenance (do not hand-edit)
```

**Rules:** UI never computes mastery or readiness inline; it calls `engine/`. Content is
never mutated at runtime. All persisted user data lives in `store/`. Content IDs are stable
forever (renaming a title is fine; changing an ID requires a store migration).

---

## 5. Information architecture and routes

### Primary navigation

Groups for the sidebar (desktop) and drawer (mobile):

- **Home:** Dashboard, Roadmap / Today's plan
- **Learn:** DSA · SQL & DBMS · OOP (C++) · OOP (Java) · Computer Networks · Operating Systems · System Design · DevOps & Cloud · Core CS
- **Practice:** Problem Bank · Problem-Solving Coach · MCQ Practice · SQL Lab · OA Centre · Mock Interviews
- **Retain:** Revision (due today) · Flashcards · Mistake Journal · Notes & Bookmarks
- **Track:** Readiness & Analytics · Companies
- **Settings** (profile, targets, study time, export/import, reset)

Mobile adds a bottom bar with Today · Learn · Practice · Revise · More.

### Routes

| Route | Page |
|---|---|
| `/` | Dashboard |
| `/plan` | Roadmap and daily plan (adapts to available minutes) |
| `/learn` | All subjects with completion and mastery |
| `/learn/:moduleId` | Subject page: topic map (prerequisite-ordered), progress, module tools |
| `/learn/:moduleId/:topicId` | Topic page with tabs: **Learn · Practice · MCQs · Interview Qs · Revise · Mastery Test · Resources** (deep-linkable via `?tab=`) |
| `/problems` | DSA problem bank (filter, search, sort) |
| `/problems/:slug` | Problem-Solving Coach for one problem |
| `/practice/mcq` | Custom MCQ session builder and runner |
| `/sql/lab` | SQL playground with dataset picker |
| `/sql/exercises/:id` | Auto-graded SQL exercise |
| `/learn/sql-dbms/college` | College Exam mode: unit → topic → question type → difficulty; practice papers; lab and viva drills |
| `/learn/sql-dbms/college/:questionId` | One college question with source, solution and verification status |
| `/oa` | OA Centre: presets, custom builder, history |
| `/oa/run/:attemptId` | Assessment runner (full-screen, timer) |
| `/oa/results/:attemptId` | Results and review |
| `/mock` | Mock interviews (coding, behavioural, system design) |
| `/revision` | Due today, flashcards, revision sheets, recall tests |
| `/mistakes` | Mistake journal (by error category and topic) |
| `/notes` | Notes and bookmarks |
| `/companies`, `/companies/:companyId` | Company tracks |
| `/analytics` | Readiness model with evidence |
| `/tools/:toolId` | CPU scheduling, page replacement, subnet calculator, FD toolkit (closure, keys, superkeys, NF, lossless, dependency preservation), relational algebra evaluator, schedule / serialisability analyser, B+ tree visualiser, Big-O growth |
| `/settings` | Settings and data management |
| `*` | 404 page with search and links |

Global: **Ctrl/Cmd+K** opens search across topics, problems, MCQs, SQL exercises and notes.

---

## 6. Data models

Define these in `src/content/schema.ts` (content) and `src/store/types.ts` (user data).
These are the contracts; extend them, but do not break them without a migration.

### 6.1 Content (static, versioned in code)

```ts
type ModuleId = 'dsa' | 'sql' | 'dbms' | 'oop-cpp' | 'oop-java' | 'cn' | 'os'
  | 'system-design' | 'devops' | 'core-cs';
type Difficulty = 'easy' | 'medium' | 'hard';
type Level = 'foundation' | 'core' | 'advanced';
type ContentStatus = 'complete' | 'partial' | 'planned';   // shown in UI, never inflated
type Provenance = { kind: 'original' | 'adapted' | 'official-list'; source?: string; url?: string };

interface Module {
  id: ModuleId; title: string; description: string; accent: AccentToken;
  tracks?: { id: string; title: string; topicIds: string[] }[]; // e.g. k8s core vs advanced
  topicIds: string[];            // recommended order
  tools?: ToolId[];
}

interface Topic {
  id: string;                    // 'dsa.sliding-window' (module prefix + slug), stable forever
  moduleId: ModuleId; title: string; summary: string; level: Level;
  status: ContentStatus; estMinutes: number;
  prerequisites: string[];       // topic ids, must exist
  related: string[];             // topic ids
  subtopics: { id: string; title: string }[];
  objectives: string[];          // "After this topic you can..."
  sections: LearnSection[];      // ordered; rendered as collapsible sections
  recognition?: RecognitionGuide;// DSA and SQL: how to spot this pattern
  mcqIds: string[];
  interviewQuestions: { id: string; q: string; answerMd: string; followUps?: string[] }[];
  problemIds: string[];          // DSA problem slugs or exercise ids (canonical records)
  revision: { notesMd: string; templates?: CodeSample[]; flashcards: Flashcard[] };
  mastery: MasteryCriteria;
  resources: Resource[];
}

interface LearnSection {
  id: string;
  kind: 'concept' | 'intuition' | 'visual' | 'dry-run' | 'code' | 'complexity'
      | 'mistakes' | 'recognition' | 'comparison' | 'example' | 'diagram';
  title: string; bodyMd: string;
  code?: CodeSample[];           // rendered as language tabs (C++ / Java / SQL / ...)
  trace?: TraceStep[];           // step-through visual (arrays, pointers, stacks, grids)
  collapsedByDefault?: boolean;
}

interface CodeSample { lang: 'cpp' | 'java' | 'sql' | 'python' | 'bash' | 'yaml' | 'dockerfile' | 'json';
  code: string; verify?: boolean; expectedOutput?: string; std?: 'c++14' | 'c++17' | 'c++20' }

interface TraceStep { note: string; array?: (number | string)[]; pointers?: Record<string, number>;
  highlight?: number[]; window?: [number, number]; stack?: (number | string)[];
  table?: string[][]; vars?: Record<string, string | number> }

interface RecognitionGuide { signals: string[]; antiSignals: string[];
  decisionQuestions: string[]; templates: CodeSample[] }

interface MCQ {
  id: string; topicIds: string[]; moduleId: ModuleId;
  type: 'concept' | 'complexity' | 'code-output' | 'compile-error' | 'debug'
      | 'edge-case' | 'scenario' | 'command' | 'config' | 'which-method' | 'design';
  difficulty: Difficulty; stemMd: string; code?: CodeSample;
  options: { id: string; textMd: string; whyWrongMd?: string }[]; // usually 4
  correct: string[];             // usually one id; multi-select allowed when stated
  explanationMd: string;         // why the answer is right
  misconceptionsMd?: string;     // common traps
  provenance: Provenance; verified?: 'compiled' | 'reviewed' | 'unverified';
}

interface Problem {              // canonical DSA problem record (one per slug)
  slug: string; leetcodeId: number; title: string; difficulty: Difficulty;
  premium: boolean; url: string; freeAlternativeUrl?: string;
  lists: ('neetcode150' | 'blind75' | 'top-interview-150' | 'leetcode-75' | 'striver-a2z' | 'curated')[];
  topicIds: string[];            // a problem may belong to several topics
  primaryTopicId: string; patterns: PatternId[];
  prerequisites: string[];       // topic ids
  estMinutes: number;            // derived from difficulty unless authored
  companyTags?: { company: string; source: string; url: string }[]; // ONLY with cited source
  videoUrl?: string;             // NeetCode YouTube from verified dataset
  coach?: CoachWalkthrough;      // present = "Authored walkthrough"; absent = "Pattern guidance"
}

interface CoachWalkthrough {
  understandMd: string;          // restated in own words (no copied statement)
  ioConstraintsMd: string; edgeCases: string[];
  bruteForceMd: string; bruteComplexity: string; bottleneckMd: string;
  hints: [string, string, string, string]; // 1 interpret, 2 pattern, 3 key observation, 4 pseudocode
  optimalMd: string; code: CodeSample[]; finalComplexity: string;
  testCases: { input: string; expected: string; why: string }[];
  takeawaysMd: string;
}

interface SqlExercise {
  id: string; topicIds: string[]; difficulty: Difficulty; datasetId: string;
  promptMd: string; referenceSql: string;        // run at check time to get expected rows
  orderMatters: boolean; hints: string[]; explanationMd: string;
  wrongApproaches?: { sql: string; whyMd: string }[];
  externalRef?: { title: string; url: string };  // e.g. similar LeetCode SQL 50 problem
}

interface Flashcard { id: string; front: string; backMd: string; topicId: string }
interface Resource { title: string; url: string; kind: 'official-docs' | 'article' | 'video'
  | 'practice' | 'course'; verifiedOn?: string; httpVerifiable: boolean }
interface MasteryCriteria { testMcqIds: string[]; testTimeLimitMin: number; passPct: number;
  minIndependentSolves: number; minMediumIndependent: number; retentionDays: number }

interface CompanyTrack {
  id: string; name: string; updatedOn: string;
  facts: { text: string; source: string; url: string; verifiedOn: string }[];
  unverified: string[];          // explicitly labelled "unverified / changes often"
  rounds?: { name: string; description: string; source?: string }[];
  emphasis: { topicIds: string[]; patterns: PatternId[]; weights: Record<DimensionId, number> };
  behavioural?: { framework: string; principles?: { name: string; url: string }[] };
  resources: Resource[]; practiceSetIds: string[];
}
```

### 6.2 User data (persisted, versioned)

```ts
interface PersistedState {
  version: 1;
  profile: { name?: string; targetCompanies: string[]; dailyMinutes: number;
    targetDate?: string; preferredLang: 'cpp' | 'java'; weeklyGoals: WeeklyGoals };
  topicProgress: Record<topicId, { sectionsRead: string[]; startedAt?: string;
    lastVisited?: string; masteryTests: TestResult[] }>;
  problemProgress: Record<slug, { status: 'todo' | 'attempted' | 'solved';
    attempts: ProblemAttempt[]; notesMd: string; bookmarked: boolean }>;
  mcqAttempts: McqAttempt[];         // every answer, with context: 'practice' | 'oa' | 'mastery' | 'review'
  sqlAttempts: SqlAttempt[];
  reviewCards: Record<cardId, ReviewCard>;
  assessments: AssessmentAttempt[];
  mistakes: MistakeEntry[];
  notes: Note[]; bookmarks: Bookmark[];
  mockInterviews: MockInterview[]; stories: StarStory[];
  activity: Record<isoDate, { minutes: number; actions: number }>;
}

interface ProblemAttempt { at: string; durationSec: number; hintsUsed: 0|1|2|3|4;
  solutionViewed: boolean; outcome: 'independent' | 'with-hints' | 'after-solution' | 'gave-up';
  stagesCompleted: CoachStage[]; errorCategories: ErrorCategory[]; reflectionMd?: string;
  timed: boolean; firstSeen: boolean }

type ErrorCategory = 'misread-problem' | 'pattern-not-identified' | 'wrong-data-structure'
  | 'algorithm-not-developed' | 'implementation-bug' | 'wrong-complexity'
  | 'missed-edge-case' | 'time-management';

interface McqAttempt { mcqId: string; at: string; selected: string[]; correct: boolean;
  timeSec: number; context: 'practice' | 'oa' | 'mastery' | 'review'; firstSeen: boolean }

interface ReviewCard { id: string; kind: 'flashcard' | 'mcq' | 'problem' | 'note' | 'template'
  | 'mistake' | 'interview-q'; refId: string; topicId: string;
  ease: number; intervalDays: number; reps: number; lapses: number; due: string; lastReviewed?: string }

interface AssessmentAttempt { id: string; config: AssessmentConfig; startedAt: string;
  endsAt: string; submittedAt?: string; items: AssessmentItem[];
  answers: Record<itemId, Answer>; marked: string[]; timePerItem: Record<itemId, number>;
  result?: AssessmentResult }
```

`firstSeen` is the key field for evidence quality: performance on **unseen** items
carries the most weight in mastery and readiness.

### 6.3 SQL/DBMS and college-material extensions (see Section 8.2)

```ts
type Provenance2 = 'college-official' | 'college-slides' | 'learner-solution'
  | 'derived-notes' | 'ai-generated' | 'prepforge-original' | 'external';
type Verification = 'verified-mysql' | 'verified-sqlite' | 'verified-algorithm'
  | 'official-answer' | 'needs-validation' | 'disputed';
type Unit = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';   // provisional until the official syllabus arrives

interface SourceDocument {           // one per audited file (Section 8.2.2)
  id: string;                        // e.g. 'src.a1-official'
  title: string; provenance: Provenance2; academicYear?: string;
  localPathHint: string;             // where it was found; never a public URL
  contentStatus: 'extracted' | 'needs-transcription' | 'not-inspected' | 'excluded';
  notes?: string;
}

interface CollegeQuestion {
  id: string;                        // 'clg.a1.q05', 'clg.lab3.l2.q07'
  sourceId: string; sourceRef: string;   // e.g. 'Question 5', 'Level 2 #7', 'slide 37'
  originalText: string;              // verbatim; stored in the private content folder (decision D-SQL-1)
  unit?: Unit; topicIds: string[];
  qType: 'mcq' | 'mcq-multi' | 'numerical' | 'short' | 'long' | 'query' | 'ddl'
       | 'lab-observation' | 'viva';
  difficulty: Difficulty; marks?: number;
  options?: { id: string; text: string }[];
  officialAnswer?: string;           // as given by the college, if any
  answer: { finalMd: string; stepsMd: string; keyPoints?: string[] };  // keyPoints = self-marking rubric
  sql?: { mysql: string; sqlite?: string; exerciseId?: string };       // links to an auto-graded SqlExercise
  sheetNotes?: string[];             // ambiguities or schema issues in the original question
  verification: Verification; verificationNote?: string;
}

interface SqlDataset { id: string; title: string; schemaSql: string; seedSql: string;
  hidden?: { id: string; purpose: string; seedSql: string }[] }  // edge-case variants used in grading

// SqlExercise (6.1) is extended with:
//   engine: 'sqlite-ok' | 'mysql-only'; referenceMysql: string; referenceSqlite?: string;
//   expectedMysqlOutput?: string[][];  // captured by scripts/verify-sql-mysql.mjs
//   provenance: Provenance2; collegeQuestionId?: string; verification: Verification;
//   similarTo?: string[];              // links between college, original and external items

// User progress for SQL/DBMS is tracked in SEPARATE slices (never merged into one bar):
//   theoryProgress[topicId]            sections read and revision notes reviewed (completion only)
//   mcqAttempts[]                      (6.2)
//   sqlAttempts[]: { exerciseId, at, sql, passedVisible, passedHidden: string[],
//                    failedHidden: string[], hintsUsed, durationSec, errorCategories }
//   collegeProgress[questionId]: { status: 'todo' | 'attempted' | 'done',
//                    selfScore?: number, keyPointsHit?: string[], autoGraded?: boolean,
//                    correct?: boolean, bookmarked: boolean, notes: string }
//   reviewCards (6.2), with kinds extended by 'college-question' | 'sql-exercise'
```

---

## 7. Core engines

All engines live in `src/engine/` as pure functions with unit tests. The UI shows the
formula and evidence behind every number.

### 7.1 Completion vs mastery (they are separate numbers)

- **Completion (topic):** sections read ÷ total sections, plus "practice attempted" flags. Reading never raises mastery.
- **Mastery (topic), 0 to 100, evidence-based:**
  - MCQ evidence (40%): accuracy on first-seen MCQs for the topic, Laplace-smoothed: `(correct + 1) / (n + 2)`.
  - Application evidence (45%): problem outcomes weighted `independent 1.0`, `with-hints 1.0 − 0.15 × hintsUsed`, `after-solution 0.15`, `gave-up 0`. Medium and hard count 1.5× and 2×. Re-solves of a seen problem count 0.5× unless more than 14 days have passed.
  - Retention evidence (15%): success rate on reviews that happened at least 7 days after the previous success.
  - **Confidence** reflects sample size: low (<5 evidence items), medium (5 to 15), high (>15). Below 5 items, show "Not enough evidence", not a number.
- **Mastery levels:** Not started → Learning (completion > 0) → Practising (any evidence) → Proficient (mastery ≥ 60 with medium confidence) → **Interview-ready**: mastery test passed (≥ 80% in the time limit) **and** `minIndependentSolves` met (at least one medium) **and** at least one retention success after `retentionDays`.
- **"Studied but cannot apply" flag:** completion ≥ 70% and application evidence < 40% across ≥ 3 attempts. This is surfaced on the dashboard as a priority.

### 7.2 Revision engine (spaced repetition, SM-2 variant)

- Cards come from: flashcards; incorrectly answered MCQs (auto-added); problems solved with hints or after the solution (auto-added); manually saved notes, templates, interview questions and mistakes.
- Grade mapping (0 to 5): MCQ correct and fast = 5, correct = 4, wrong = 1. Problem independent = 5, hints 1–2 = 4, hints 3–4 = 3, after-solution = 2, gave up = 0. Flashcards are self-graded Again / Hard / Good / Easy = 1 / 3 / 4 / 5.
- SM-2: `ease = max(1.3, ease + 0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))`. For q < 3: `reps = 0`, `interval = 1`, `lapses++`. Otherwise the interval goes 1 → 6 → `round(prev × ease)`. Cap the interval at 180 days.
- **Forgetting-risk ordering** for "Due today": `overdueRatio = daysOverdue / intervalDays`, plus a bonus for low ease and high lapses. Cap the daily queue at the user's budget (default 20 cards, or about 25% of daily minutes) so it is never an unbounded list.
- Sessions: due today; topic-wise; previously incorrect; a mixed recall test (10 items interleaved across modules, generated weekly).

### 7.3 Placement readiness model

Nine dimensions, each 0 to 100 **with evidence and confidence**:

| Dimension | Evidence used |
|---|---|
| DSA problem-solving | First-seen problem outcomes by difficulty, independence rate, timed solves, mastery across the DSA topic map |
| SQL proficiency | Auto-graded SQL exercises (first attempt), timed SQL sets, SQL MCQs |
| OOP proficiency | C++/Java output, compile-error and design MCQs on first attempt; class-design exercises |
| CN & OS knowledge | First-seen MCQs and scenario questions; simulator exercises |
| System design fundamentals | Foundations MCQs; mock design rubric (self-assessed, weighted lower and labelled) |
| DevOps & cloud | Command, config and YAML-debugging questions |
| OA speed & accuracy | Timed assessments: accuracy, completion rate, time per question vs. target |
| Interview communication | Mock interview rubric scores (**self-assessed, labelled as such, low weight**) |
| Independent consistency | Share of independent solves across distinct days and sessions; variance |

Rules: show the evidence list and "what would raise this score" next to every number. Only
evidence from the last 60 days counts fully (older evidence decays 50%). Show "insufficient
evidence" instead of a number when evidence is below threshold. A per-company readiness view
reweights dimensions using `CompanyTrack.emphasis.weights`. Never display hiring
probabilities or salary claims.

### 7.4 Daily plan generator

Input: available minutes today (settings default, overridable per day), the roadmap
position, due reviews, weak topics, and upcoming mock assessments.

1. Reviews: min(due cards' estimated time, 25% of the budget).
2. Weak-topic practice (~30%): topics flagged "studied but cannot apply" first, then the lowest mastery with high completion, then the most frequent recent error categories mapped to targeted problems.
3. New learning and practice (~45%): the next roadmap topic whose prerequisites are at least "Practising"; one learn block plus 1–3 problems at the right difficulty.
4. If a weekly OA is due, swap in a timed assessment.
5. Difficulty ladder: after 3 consecutive independent solves at a level within a topic, step up. After 2 failures, step down and add a recognition drill.

Output: an ordered checklist with time estimates and one-click starts, regenerated daily
and stable within a day.

### 7.5 Recommendations and smart practice

- Map error categories to interventions: `pattern-not-identified` → recognition drills and "which pattern?" MCQs; `missed-edge-case` → edge-case MCQs plus the coach's edge-case checklist; `implementation-bug` → template review; `time-management` → timed sets; `wrong-data-structure` → data-structure-choice questions.
- Re-introduce previously incorrect items through the revision engine, and into OA item selection (about 20% of a custom OA).
- Track improvement across repeated assessments (trend line per dimension).

### 7.6 Streaks and goals

A day counts towards the streak when it has at least one qualifying action: a problem
attempt, an MCQ session of 5 or more answers, a completed review session, or an
assessment. Weekly goals default to problems solved independently, reviews completed, one
OA and topics reaching "Proficient", and are user-editable.

---

## 8. Module specifications and curriculum

Every topic is a full learning unit (see [Section 11](#11-content-quality-standard)).
Topic IDs are `module.slug`. Levels: **F** foundation, **C** core, **A** advanced.
Checkboxes track **content** status (complete = meets the Section 11 minimums).

### 8.1 DSA (highest priority)

**Features:** topic pages with all 14 elements (concept, intuition, visual and step-through
trace, dry run, C++ and Java code, complexity with justification, common mistakes and
debugging, pattern recognition, beginner/intermediate/advanced problems, MCQs, interview
questions, revision notes and templates, mastery test, resources); the problem bank; the
Problem-Solving Coach; recognition drills ("which pattern fits?" on problem summaries);
a topic prerequisite graph.

**Problem bank (verified):** 383 canonical problems in
`research/dsa-problems.verified.json` (NeetCode 150, Blind 75, Top Interview 150,
LeetCode 75, Striver A2Z LeetCode-linked items). There is one canonical record per slug,
with many topics allowed. Topic mapping is generated by `scripts/build-problem-bank.ts`
with this precedence: NeetCode pattern → Top Interview 150 group → LeetCode 75 group →
A2Z category → LeetCode tags, then **hand-reviewed** (the script emits a review report).
Curated additions (e.g., Codeforces or GFG problems that fill gaps such as difference
arrays, Fenwick and segment trees, or string matching) are added with `lists: ['curated']`
and a verified URL.

**Problem-Solving Coach (the most important feature):**

- Eleven stages, each a guided panel with prompts and a place to type the learner's own answer (saved): understand → inputs/outputs/constraints/edge cases → brute force → brute-force complexity → bottleneck → discover the pattern → optimised approach → write code (link out to LeetCode, plus a local scratchpad) → test (coach-supplied test cases and edge cases) → final complexity → record learning.
- Progressive hints 1 to 4, then the solution. Each reveal requires an explicit click and is logged. The solution is hidden by default.
- Outcome capture: independent / with hints (auto-filled from the hint count) / after solution / gave up. Time is measured by the in-page timer (pausable), and errors are classified with the 8 error categories (multi-select).
- **Two content tiers, labelled honestly:** "Authored walkthrough" (full `CoachWalkthrough`) and "Pattern guidance" (generic stage prompts plus the topic's recognition guide and templates, with no problem-specific hints). The v1 target is authored walkthroughs for the 75 Blind 75 problems first, then the rest of NeetCode 150.
- A timed mode for OA practice (countdown, no hints).

**Curriculum (40 topics):**

Foundations
- [ ] `dsa.complexity` (F): Big-O, Big-Θ, Big-Ω; best/avg/worst; amortised analysis; recurrences and the Master theorem (intro); reading constraints → target complexity (n ≤ 10^5 → O(n log n), and so on)
- [ ] `dsa.recursion` (F): call stack, base cases, recursion trees, tail recursion, recursion → iteration
- [ ] `dsa.stl-collections` (F): C++ STL (vector, string, unordered_map/set, map/set, priority_queue, deque, stack, queue, algorithms, lower_bound) and Java Collections (ArrayList, HashMap, TreeMap, ArrayDeque, PriorityQueue, Collections/Arrays); complexity of each; common pitfalls
- [ ] `dsa.math` (F): GCD/LCM, primes and the sieve, modular arithmetic, fast exponentiation, combinatorics basics, overflow

Arrays and hashing
- [ ] `dsa.arrays-strings` (F): traversal, in-place techniques, string building, char counting
- [ ] `dsa.hashing` (F): hash maps and sets, frequency counting, complement lookup, grouping by key
- [ ] `dsa.prefix-sums` (C): prefix sums, subarray sum = k with a hashmap, 2D prefix sums, **difference arrays**
- [ ] `dsa.kadane` (C): maximum subarray, max-product variant, circular variant

Problem-solving patterns
- [ ] `dsa.two-pointers` (C): opposite ends, same direction, partitioning, k-sum
- [ ] `dsa.sliding-window` (C): fixed, variable (longest/shortest), counting with "at most k" decomposition
- [ ] `dsa.binary-search` (C): classic, boundaries (lower/upper bound), rotated arrays, **binary search on the answer**
- [ ] `dsa.fast-slow-pointers` (C): cycle detection, middle node, Floyd's algorithm on arrays
- [ ] `dsa.monotonic-stack-queue` (C): next greater/smaller, histogram, sliding window maximum (deque)
- [ ] `dsa.intervals` (C): sort and merge, insert, overlap counting, sweep line, meeting rooms
- [ ] `dsa.greedy` (C): exchange arguments, interval scheduling, jump game, when greedy fails
- [ ] `dsa.divide-conquer` (C): merge sort, quickselect, counting inversions
- [ ] `dsa.bit-manipulation` (C): bit tricks, XOR properties, masks, counting bits

Data structures
- [ ] `dsa.linked-lists` (F): reversal, dummy nodes, merge, reorder, LRU-style use
- [ ] `dsa.stacks-queues` (F): parentheses, expression evaluation, queue via stacks, deque
- [ ] `dsa.binary-trees` (C): DFS traversals (recursive and iterative), BFS level order, height/diameter, path problems, construction from traversals, serialisation
- [ ] `dsa.bst` (C): search/insert/delete, validation, inorder properties, kth smallest, LCA
- [ ] `dsa.heaps` (C): heapify, top-k, k-way merge, two heaps (median), scheduling
- [ ] `dsa.tries` (C): insert/search/prefix, word search II, XOR trie (advanced)
- [ ] `dsa.graphs` (C): representations, BFS/DFS on grids and graphs, connected components, cycle detection (directed and undirected), bipartite
- [ ] `dsa.dsu` (C): union-find with path compression and union by rank; Kruskal; dynamic connectivity
- [ ] `dsa.fenwick-segment` (A): Fenwick tree, segment tree (point update / range query), lazy propagation (advanced)

Algorithms
- [ ] `dsa.sorting` (F): bubble/insertion/selection (for analysis), merge, quick, heap, counting/bucket, stability, custom comparators (C++ and Java)
- [ ] `dsa.topological-sort` (C): Kahn's algorithm and DFS ordering, course schedule, alien dictionary
- [ ] `dsa.shortest-paths` (C): BFS on unweighted graphs, 0-1 BFS, Dijkstra, Bellman-Ford, Floyd-Warshall, when to use which
- [ ] `dsa.mst` (C): Kruskal, Prim, proofs by cut property (intuition)
- [ ] `dsa.backtracking` (C): subsets, permutations, combinations, pruning, N-Queens, word search
- [ ] `dsa.dp-1d` (C): recognising DP, state, transition, base case, memoisation → tabulation → space optimisation; climbing stairs, house robber, coin change, word break, LIS (O(n²) and O(n log n))
- [ ] `dsa.dp-2d` (C): grids, LCS, edit distance, knapsack (0/1 and unbounded), DP on strings, stock problems (state machine)
- [ ] `dsa.dp-advanced` (A): interval DP (MCM, burst balloons), bitmask DP, DP on trees, digit DP (intro)
- [ ] `dsa.advanced-graphs` (A): SCC (Kosaraju/Tarjan), bridges and articulation points, Eulerian path (reconstruct itinerary)
- [ ] `dsa.string-matching` (A): KMP (prefix function), Z-algorithm, Rabin-Karp rolling hash

Additional interview topics
- [ ] `dsa.matrix` (C): traversal orders, rotation, spiral, in-place marking, search in a sorted matrix
- [ ] `dsa.design-ds` (C): LRU cache, min stack, LFU (advanced), iterator design, time-based KV store
- [ ] `dsa.implementation` (C): simulation, careful indexing, parsing, OA-style long statements
- [ ] `dsa.advanced-patterns` (A): meet in the middle, coordinate compression, sweep line, randomisation, two-heap and multi-pointer combinations

**Default roadmap order:** complexity → stl-collections → arrays-strings → hashing → two-pointers → sliding-window → prefix-sums → kadane → binary-search → stacks-queues → monotonic-stack-queue → linked-lists → fast-slow → recursion → binary-trees → bst → heaps → backtracking → intervals → greedy → graphs → topological-sort → dsu → shortest-paths → dp-1d → dp-2d → tries → bit-manipulation → matrix → sorting/divide-conquer → design-ds → math → mst → implementation → (advanced track) fenwick-segment, dp-advanced, advanced-graphs, string-matching, advanced-patterns.

### 8.2 SQL and DBMS: one module for college exams, the DBMS lab, and placements

> **Goal:** PrepForge must be the learner's *single* resource for (a) the college DBMS theory
> exams, (b) the DBMS laboratory (MySQL practicals, write-ups, orals), and (c) placement SQL
> and DBMS interviews and OAs. Every topic connects theory → college questions → MCQs →
> practical SQL → interview questions → revision, and each of these is tracked **separately**.

#### 8.2.1 College context (verified from the learner's files on 2026-10-11)

| Fact | Value | Source |
|---|---|---|
| Institute / programme | PICT Pune (autonomous, affiliated to SPPU), T.Y. B.Tech E&TC, AY 2026-27, Semester V | `UG_TY_BTech_ENTC_26-27_Mar26.pdf`; official Assignment 1 header |
| Course | **Database Management Systems (DBMS)**, course code **0505163**, part of Multidisciplinary Minor **MD-6 Software Development**, Sem V. 2 hrs/week lecture, 2 credits. Evaluation: **CIE 20 + ISE 20 + ESE 60 = 100** | `MDM_All_2025.pdf` (MD-6 scheme table) |
| Lab | **DBMS Laboratory (DBMSL)**, course code **0505263**: 2 hrs/week practical, 1 credit, **25 marks** (term work) | `MDM_All_2025.pdf` |
| Lab software | **MySQL 8.0** (the lab write-up explicitly says "MySQL Database"). MySQL Server 8.0 and Workbench 8.0 are installed on the learner's PC | lab write-up template; `C:\Program Files\MySQL` |
| Instructor's unit plan (from slides) | Unit I Introduction to DBMS (7 h) · Unit II Relational Database Design (7 h) · Unit III Basics of SQL (8 h) · Unit IV Database Transactions Management (8 h) · Unit V Parallel Databases (7 h) · Unit VI Distributed Databases (8 h) | `Unit 1-Introduction of dbms (1).pptx`, slide 3 |
| Textbooks named on slides | Silberschatz, Korth, Sudarshan, *Database System Concepts* (6th ed.); C. J. Date et al., *An Introduction to Database Systems* | slides 7 |

> **Conflict to resolve (needs the official syllabus):** slide 2 of the instructor deck shows
> an older scheme (3 hrs/week, In-Sem 30 / End-Sem 70, Oral 25), which disagrees with the
> AY 2026-27 MD-6 scheme above (2 hrs/week, CIE 20 / ISE 20 / ESE 60, lab TW 25). The 6-unit
> plan is therefore **provisional**. Until the official 0505163 syllabus is provided, the app
> labels units "Unit plan from instructor slides; confirm against official syllabus".

#### 8.2.2 Audit of college materials found on the learner's PC

None of these files were inside the repository; they were found by a filename scan of
Desktop and Downloads. They were read in place and **nothing has been copied into the repo**
(see decision D-SQL-1 below).

| ID | File (location) | Provenance class | What it contains | Extraction status |
|---|---|---|---|---|
| `src.syllabus-etc` | `Desktop/College Study Material/TY/UG_TY_BTech_ENTC_26-27_Mar26.pdf` | Official college | TY E&TC syllabus. DBMS appears **only** in the MDM domain listing; there is **no DBMS unit-wise syllabus** | Text extracted |
| `src.mdm-2025` | `.../TY/MDM_All_2025.pdf` | Official college | MDM syllabi for **SY** courses plus the MD-6 scheme table listing DBMS 0505163 / DBMSL 0505263 marks and credits. **No DBMS unit details** | Text extracted |
| `src.slides-u1-intro` | `.../TY/DBMS/Unit 1-Introduction of dbms (1).pptx` (81 slides) | Instructor slides | Data and database concepts, types of databases, file system vs DBMS, SQL vs NoSQL products, embedded/static vs dynamic SQL, applications, purpose of database systems, 3-level architecture and data abstraction, instances and schemas, file-server / 2-tier / 3-tier architecture, DBA functions, data models (hierarchical, network, relational, ER, OO), relational terms (relation, tuple, attribute, domain, degree, cardinality), procedural vs non-procedural languages, DDL/DML/DCL, Codd's rules 0–12, functional dependencies, Armstrong's axioms (reflexive, augmentation, transitivity, union, decomposition, pseudo-transitivity), FD types | Text extracted; several slides are image-only (19–22, 31–32, 73) |
| `src.slides-u1-ra` | `.../TY/DBMS/Unit 1- Relational algebra.pptx` (61 slides) | Instructor slides | σ, π, ρ, ∪, ∩, −, ×, ÷, composite expressions, SQL joins (inner, natural, θ, left/right/full outer), tuple relational calculus (quantifiers, SQL↔TRC), domain relational calculus (title only). **Embedded exercises:** slide 23 (tuple count over P, Q, R; the expression is an image), slide 37 (maximum size of r1 ⋈ r2 given keys and tuple counts), slides 58–59 (convert SQL to TRC) | Text extracted; slide 23 needs visual transcription |
| `src.a1-official` | `Downloads/TY_DBMS_Assignment_Solution_M2.pdf` | **Official college (instructor solutions)** | **DBMS theory Assignment 1**, AY 2026-27 Sem V, all TY divisions: **17 questions with official solutions** on FDs, closure, keys, superkey counting, normal forms, lossless and dependency-preserving decomposition | Q1–Q9 text extracted (arrow symbols "→" are lost in extraction). **Q10–Q17 statements and the table instances in Q7, Q8 and Q14 are images**, so visual transcription is needed. Official answers captured as text for Q1–9, 11, 12, 14, 16, 17 |
| `src.a1-explained` | `Downloads/DBMS_Solutions_Explained.pdf` | Derived study notes (not official; origin unknown, possibly AI-assisted) | Step-by-step re-solutions of the same 17 questions, including text versions of Q10–17 | Text extracted. Use as a cross-check only |
| `src.a1-notes` | `Downloads/DBMS_Theory_Notes.pdf` | Derived study notes | "Normalization crash notes": closure, keys, superkey counting, NF tests, lossless and dependency preservation, with a method map for Q1–Q17 | Text extracted. Cross-check only |
| `src.chatgpt-notes` | `.../TY/ChatGPT - DBMS.pdf` | **AI-generated** (ChatGPT export) | Module 1 notes: purpose of DB systems, relational integrity, relational algebra, ER model, mapping cardinalities | Text extracted. **Unverified**; never shown as authoritative |
| `src.lab-a2-sheet` | `Desktop/College Study Material/DBMS LAB work/Assignment 2_DDL.docx` | Official college (lab sheet) | **Lab Assignment 2: DDL**, about 20 tasks across Create (Department, Course, Student with PK/FK/auto-increment/NOT NULL/CHECK), Describe, Drop vs Truncate, ALTER (ADD/MODIFY/DROP/RENAME on Faculty, add FK), INSERT variants, sequence/auto-increment, SELECT all, Views (E&TC students; id, name, DOB, age; insert/update through single- and multi-table views), Index (EXPLAIN on f_name and S_ID; clustered vs non-clustered; create index and re-EXPLAIN) | Fully extracted |
| `src.lab-a2-writeup` | `.../DBMS LAB work/W_Assignment No. 2.docx` | Official college (write-up template, T.E. E&TCE, AY 2026-27) | Aim, objectives, theory on SQL objects, DDL/DML/DCL/TCL comparison table, CREATE/ALTER/VIEW/INDEX/SEQUENCE/SYNONYM syntax, constraints table, MySQL notes (no SYNONYM, AUTO_INCREMENT vs Oracle sequences, `LAST_INSERT_ID()`) | Fully extracted → source of **lab viva / short-answer** questions |
| `src.lab-a2-scan` | `.../DBMS LAB work/dbms Assignment 2.pdf` | Unknown (scanned, no text layer, 3.2 MB) | Probably a printed copy of the sheet or a submission | **Not inspected visually yet** |
| `src.lab-a3-sheet` | `.../DBMS LAB work/Assignment 3_sql_query_for_students.docx` | Official college (lab sheet) | **Lab Assignment 3: "Database of Institute"**, 7 tables (Department, Course, Student, Faculty, Examination, Employee_account, Student_account), min 10 rows each, then **71 query prompts**: Level 1 Basic (14), Level 2 Intermediate (12), Level 3 Advanced (13), Level 4 Real-life (15), UPDATE and DELETE / referential-integrity experiments (17) | Fully extracted |
| `src.user-a2-sql`, `src.user-a3-sql` | `.../DBMS LAB work/assignment_2_dbms.sql`, `assignment_3_dbms.sql` (identical copies in `Desktop/Coding/MySql/`) | **Learner's own solutions** | A2: schema + DDL demos (partial coverage of the sheet). A3: schema with 5 departments, 7 courses, 8 students, and answers to Levels 1–4; **no UPDATE/DELETE section** | Fully read; statically reviewed (see 8.2.4) |
| `src.user-a2-doc`, `src.user-a3-doc` | `.../DBMS LAB work/<learner-name> Assignment 2.docx` (23 items, 23 screenshots), `<learner-name> Assignment 3.docx` (417 lines, 85 screenshots) | **Learner's own submissions** | A3 submission **does** include the 16 UPDATE/DELETE answers, on a different dataset from the `.sql` file | Text extracted; screenshots not inspected |
| `src.user-other-sql` | `Desktop/Coding/MySql/college_work.sql`, `sample.sql`, `first_hackathon.sql`; `assignment_4_dbms.sql` (**0 bytes**) | Learner's own | Variants of the college schema; a hackathon table; an empty Assignment 4 file | Read |
| — | `.../DBMS LAB work/DBMS2_Assignment_2_Submission.docx`, `DBMS_Assignment_3_Submission.docx` | **A classmate's submissions** (another student's name and roll number) | — | **Excluded** from import for privacy. Not to be used |

#### 8.2.3 Missing college materials (the learner needs to provide these)

Do **not** invent their contents. Until they arrive, the related app sections show "Awaiting
college material" with this list.

1. [ ] **Official AY 2026-27 syllabus for DBMS 0505163**: unit titles, unit contents, hours, course outcomes, textbooks (resolves the scheme conflict in 8.2.1)
2. [ ] **Official DBMS Lab 0505263 syllabus / list of experiments**: the full assignment list, especially **Lab Assignment 1** and **Assignments 4+** (`assignment_4_dbms.sql` is empty and no sheet was found)
3. [ ] **Slides or notes for Units II–VI** (only the two Unit I decks exist locally)
4. [ ] **Question papers**: previous CIE, ISE and ESE DBMS papers (PICT autonomous; SPPU papers as a fallback) and the **exam pattern** (marks per question, MCQ vs descriptive split, duration)
5. [ ] **Course question bank (QB)**, if the department issues one (a `CC QB.pdf` exists for Cloud Computing, so a DBMS QB may exist too)
6. [ ] **Lab oral/viva question list**, if provided by the instructor
7. [ ] **Further theory assignments** (Assignment 2 onward), or the unsolved question copy of Assignment 1, if different
8. [ ] A text or clearer copy of `dbms Assignment 2.pdf` (currently a scan), or confirmation that it duplicates `Assignment 2_DDL.docx`

#### 8.2.4 College question bank: mapping of audited questions

Each college item becomes one `CollegeQuestion` record (Section 6.3) with: the original text
(verbatim, stored privately per D-SQL-1), source file and question number, unit, topic(s),
question type, difficulty, marks if known, the official answer if present, PrepForge's own
step-by-step solution, MySQL solution (and SQLite variant) for query items, and a
**verification status**.

**A. Official theory Assignment 1 (`src.a1-official`, 17 items).** All are MCQ or numerical,
Unit II (provisional).

| Q | Topic | Type | Official answer (as extracted) | Status |
|---|---|---|---|---|
| 1 | Prime attributes from FDs | MCQ | (c) | Official answer; re-derive with the closure tool |
| 2 | Lossless decomposition | MCQ | (c) | Official; **re-check**: the extracted solution says the "primary key … is FileCount", which must be validated against the FDs once the arrows are transcribed |
| 3 | Number of superkeys | MCQ, numerical | (b) 6 | Official; matches the derived notes |
| 4 | Lossless + dependency preserving | MCQ | (b) | Official |
| 5 | Highest normal form | MCQ | (a) 1NF | Official |
| 6 | Candidate keys + highest NF | Numerical | 3 keys, 3NF | Official |
| 7 | FDs that hold on an instance | MCQ (multi) | (b), (c) | Official; table is an image |
| 8 | Impossible candidate key after an insert | MCQ (multi) | (b), (d) | Official; table is an image |
| 9 | Pseudo-transitivity | MCQ | (c) | Official |
| 10 | Guaranteed FDs (closure) | MCQ | not captured (image); derived notes say (b) | **Needs transcription** |
| 11 | Possible candidate keys | MCQ (multi) | (b), (d) | Official; statement is an image |
| 12 | Highest NF | Numerical | 1NF | Official; statement is an image |
| 13 | Non-prime attributes | MCQ | not captured | **Needs transcription** |
| 14 | FDs on an instance | MCQ | (d) | Official; statement is an image |
| 15 | Lossless decomposition | MCQ | not captured | **Needs transcription** |
| 16 | Highest NF | Numerical | 1NF | Official; statement is an image |
| 17 | Highest NF | Numerical | 2NF | Official; statement is an image |

**B. Instructor slide exercises (`src.slides-u1-ra`).** Slide 23 tuple-count question
(needs visual transcription); slide 37 maximum size of r1 ⋈ r2; slides 58–59 SQL ↔ TRC
conversions. Unit I, topics `dbms.relational-algebra` and `dbms.relational-calculus`.

**C. Lab Assignment 2, DDL (`src.lab-a2-sheet`, about 20 tasks)** → topics `sql.ddl-objects`,
`sql.views`, `sql.indexes-plans`, `sql.dml`. Most tasks are **MySQL-specific** (`DESCRIBE`,
`MODIFY`, `AUTO_INCREMENT`, `EXPLAIN` output, `SHOW INDEX`, clustered vs secondary indexes in
InnoDB), so they are verified in MySQL 8.0 (Section 8.2.7), not in the browser. Observation
tasks ("insert/update through a view and comment") become guided experiments with the
expected MySQL behaviour and error codes recorded.

**D. Lab write-up theory (`src.lab-a2-writeup`)** → about 15 short-answer / viva questions:
DDL vs DML vs DCL vs TCL; constraint types; view updatability rules; index trade-offs
(faster SELECT, slower INSERT/UPDATE); clustered (PRIMARY) vs secondary indexes; AUTO_INCREMENT
vs Oracle SEQUENCE; `LAST_INSERT_ID()`; why MySQL has no SYNONYM and the alternatives; DROP vs
TRUNCATE vs DELETE.

**E. Lab Assignment 3, Institute DB (`src.lab-a3-sheet`, 71 prompts)** → auto-graded SQL
exercises on a **PrepForge-authored "Institute" dataset** that implements the sheet's 7-table
schema with at least 10 rows per table **and deliberate edge cases** (a department with no
students, a course with no exams, failing marks below 40 and below 20, NULL
`total_amount`, NULL tax, fee rows for 2023–2025, ties for top scorer and youngest student,
duplicate courses, students sharing totals). Topic mapping:

| Sheet section | Count | Main topics |
|---|---|---|
| Level 1 Basic | 14 | `sql.select-basics`, `sql.null-handling`, `sql.date-string-functions` |
| Level 2 Intermediate | 12 | `sql.aggregation`, `sql.joins` |
| Level 3 Advanced | 13 | `sql.subqueries` (correlated, ANY/ALL), `sql.patterns` (relational division, top-N per group), `sql.joins` |
| Level 4 Real-life | 15 | multi-join aggregation, `sql.case-conditional-agg`, NOT EXISTS, division ("all 3 years") |
| UPDATE / DELETE / integrity | 17 | `sql.dml`, `sql.ddl-objects` (FK, ON DELETE/UPDATE CASCADE), `dbms.keys-constraints` (insert/update/delete anomalies) |

**Sheet issues to surface in the app (not silently fixed).** Show each as a "Sheet note"
with the assumption PrepForge uses:

1. `Faculty` has no salary column; salary is in `Employee_account(E_no)`. Faculty-salary prompts must join on `E_no`.
2. The net-salary formula mentions **Allowance**, which is not in the `Employee_account` schema.
3. `Faculty` has **no City column**, so "students who share the same city as at least one faculty member" is unanswerable without a schema extension. Offer the extension (`Faculty.city`) as an explicit assumption.
4. `Faculty.Course_Id` is single-valued, so "faculty teaching more than one course" is always empty under the given schema. Use it as a normalisation lesson (a `Teaches` relation).
5. "Delete the S_Name and Mumbai from Student table" is ambiguous. The sheet's sample table (S_ID, S_Name, City) suggests "delete the student Verma who lives in Mumbai".
6. "After the year 2000" and "joined after 2020" are ambiguous date boundaries; teach both readings.
7. "More than **any** faculty in another department" is ambiguous in English (`> ANY` vs `> ALL`); teach both.
8. Typos in the sheet (`Groos_Salary`, `Tution_fee`, `Enrollement_no`, `Date of Joning`) are preserved in the original text; PrepForge's dataset uses clean names with a mapping note.

**Static review of the learner's own A3 answers** (`src.user-a3-sql` and `src.user-a3-doc`).
These findings come from reading, **not execution**; they are marked *needs validation*
until run on MySQL 8.0 against the edge-case dataset. They are high-value "common mistakes"
content.

| Prompt | Learner's approach | Likely problem |
|---|---|---|
| Students born after the year 2000 | `dob > '2000-01-01'` | Includes students born during 2000; use `dob >= '2001-01-01'` or `YEAR(dob) > 2000` |
| Each department and number of students; departments and number of courses; courses with fewer than 5 students | `INNER JOIN … GROUP BY` | Drops groups with zero rows; use `LEFT JOIN` and `COUNT(child.id)` |
| Students along with number of failed courses | `WHERE marks < 40 … GROUP BY` | Students with zero failures disappear; use conditional aggregation `SUM(marks < 40)` / `SUM(CASE …)` with `LEFT JOIN` |
| Students who paid exactly the same total as another student | `GROUP BY total_amount HAVING COUNT(*) > 1` over all years | Can match the same student across different years; compare distinct `s_id`s (self-join or window count) |
| Departments where no student failed | Inner join, `HAVING MIN(marks) >= 40` | Excludes departments with no exam rows; decide semantics and teach `NOT EXISTS` |
| Delete all exam records of a student who scored < 20 in **all** courses | `DELETE FROM Examination WHERE Marks < 20` | Deletes individual low rows, not students whose *every* mark is < 20; correct form uses `GROUP BY s_id HAVING MAX(marks) < 20`, wrapped in a derived table to avoid MySQL error 1093 |
| Departments with ≥ 1 faculty and ≥ 10 students | Joins Student × Course × Faculty with `COUNT(DISTINCT …)` | Correct with `DISTINCT`, but a good example of join row multiplication; show the pre-aggregation alternative |

Also: the learner's A3 dataset has fewer than the required 10 rows per table and only one
fee year, so several prompts return empty results and cannot demonstrate correctness. That
is why hidden edge-case datasets exist (8.2.6).

#### 8.2.5 Curriculum (unit-mapped, with relevance tags)

Tags: **[CT]** college theory · **[CL]** college lab · **[PL]** placement. Units follow the
provisional instructor plan. Each topic hub links its notes, college questions, MCQs,
practical exercises, interview questions and revision material.

**Unit I: Introduction to DBMS** (provisional)
- [ ] `dbms.intro` [CT]: data vs information, database, DBMS, file system vs DBMS (redundancy, inconsistency, access difficulty, isolation, integrity, atomicity, concurrent-access anomalies, security), applications, types of databases, SQL vs NoSQL families, DBA roles
- [ ] `dbms.architecture` [CT]: 3-level architecture and data abstraction, physical and logical data independence, instances vs schemas, file-server / 2-tier / 3-tier architectures, DBMS components (query processor, storage manager)
- [ ] `dbms.data-models` [CT]: hierarchical, network, relational, ER, object-oriented and object-relational models, with comparisons
- [ ] `dbms.relational-model` [CT][PL]: relation, tuple, attribute, domain, degree, cardinality, schema vs instance, relational integrity (domain, entity, referential, enterprise constraints), **Codd's rules 0–12**
- [ ] `dbms.languages` [CT][CL]: DDL, DML (procedural vs non-procedural), DCL, TCL; embedded/static vs dynamic SQL
- [ ] `dbms.er-modelling` [CT][PL]: entities and attribute types (simple/composite, single/multi-valued, derived, key), relationship sets and degree, mapping cardinalities, participation, weak entities, EER (specialisation, generalisation, aggregation), **ER → relational mapping**, ER design exercises (institute, bank, library, hospital)
- [ ] `dbms.keys-constraints` [CT][CL][PL]: super, candidate, primary, alternate, foreign and composite keys; prime attributes; integrity constraints; insert/update/delete anomalies
- [ ] `dbms.relational-algebra` [CT][PL]: σ, π, ρ, ∪, ∩, −, ×, ⋈ (natural, θ, equi), outer joins, ÷ (division for "for all" queries), composite expressions, tuple-count reasoning (e.g., maximum size of r1 ⋈ r2), RA ↔ SQL
- [ ] `dbms.relational-calculus` [CT]: TRC and DRC, quantifiers, safety, SQL ↔ TRC conversion

**Unit II: Relational Database Design** (provisional; official Assignment 1 maps here)
- [ ] `dbms.functional-dependencies` [CT][PL]: FD definition, trivial/non-trivial, transitive, multivalued; Armstrong's axioms and derived rules (union, decomposition, pseudo-transitivity); **checking FDs on a table instance**; **attribute closure**; F⁺; equivalence of FD sets; canonical / minimal cover
- [ ] `dbms.keys-from-fds` [CT][PL]: candidate keys via closure, the "never on the right-hand side" shortcut, prime vs non-prime attributes, **counting superkeys** (inclusion-exclusion), candidate keys of an instance
- [ ] `dbms.normalisation` [CT][PL]: anomalies, 1NF, 2NF, 3NF, BCNF, 4NF and 5NF (exam depth); **finding the highest normal form**; 3NF synthesis and BCNF decomposition algorithms
- [ ] `dbms.decomposition` [CT]: lossless-join test (binary common-attribute-is-a-key test; tableau/chase for n-ary), dependency preservation

**Unit III: Basics of SQL** (provisional; Lab Assignments 2 and 3 map here)
- [ ] `sql.ddl-objects` [CL][CT]: CREATE / ALTER (ADD, MODIFY, DROP, RENAME) / DROP / TRUNCATE / RENAME; data types; constraints (NOT NULL, UNIQUE, PK, FK, CHECK, DEFAULT); AUTO_INCREMENT vs Oracle SEQUENCE; SYNONYM (Oracle) and MySQL alternatives; DESCRIBE / SHOW
- [ ] `sql.views` [CL][CT]: creating views; updatable-view rules; insert/update through single- vs multi-table views; WITH CHECK OPTION; dropping views
- [ ] `sql.dml` [CL][PL]: INSERT variants, UPDATE, DELETE; referential actions (CASCADE, SET NULL, RESTRICT); MySQL error 1093 and the derived-table workaround; safe-update habits
- [ ] `sql.dcl-tcl` [CL][CT]: GRANT/REVOKE; COMMIT / ROLLBACK / SAVEPOINT; autocommit
- [ ] `sql.select-basics` [CL][PL]: SELECT, WHERE, ORDER BY, LIMIT, DISTINCT, LIKE, IN, BETWEEN, aliases
- [ ] `sql.null-handling` [CL][PL]: three-valued logic, IS NULL, COALESCE/IFNULL, NULLs in aggregates and joins, the `NOT IN` + NULL trap
- [ ] `sql.aggregation` [CL][PL]: aggregate functions, GROUP BY, HAVING vs WHERE, COUNT(*) vs COUNT(col), zero-count groups
- [ ] `sql.joins` [CL][PL]: INNER, LEFT, RIGHT, FULL (MySQL emulation via UNION), CROSS, natural; anti-joins and semi-joins; join row multiplication
- [ ] `sql.self-joins` [CL][PL]: comparing rows, pairs, hierarchies
- [ ] `sql.subqueries` [CL][PL]: scalar, IN, **correlated**, EXISTS / NOT EXISTS, ANY / ALL, derived tables
- [ ] `sql.set-operations` [CT][PL]: UNION vs UNION ALL, INTERSECT and EXCEPT (MySQL 8.0.31+; emulation for older versions)
- [ ] `sql.cte` [PL]: WITH, multiple CTEs, recursive CTEs
- [ ] `sql.window-functions` [PL]: OVER, PARTITION BY, frames, ROW_NUMBER / RANK / DENSE_RANK, LAG / LEAD, NTILE, running totals, moving averages
- [ ] `sql.case-conditional-agg` [CL][PL]: CASE, conditional aggregation, pivoting
- [ ] `sql.date-string-functions` [CL][PL]: date arithmetic and extraction (MySQL vs SQLite), string functions, LIKE vs REGEXP
- [ ] `sql.patterns` [CL][PL]: duplicates, Nth highest, top-N per group, **relational division in SQL** ("appeared for all courses", "paid in all 3 years"), consecutive records and gaps-and-islands, retention, year-over-year
- [ ] `sql.stored-programs` [CL]: stored procedures, functions, triggers, cursors (MySQL). **Likely lab content; confirm with the lab syllabus.** MySQL-only (the browser engine cannot run them)
- [ ] `dbms.connectivity` [CL]: JDBC / Python connector basics (the course outcomes on the slides mention database connectivity in a project)

**Unit IV: Database Transactions Management** (provisional)
- [ ] `dbms.transactions-acid` [CT][PL]: transaction concept, states, ACID, schedules
- [ ] `dbms.serialisability` [CT][PL]: conflict serialisability (precedence graph), view serialisability, recoverable / cascadeless / strict schedules
- [ ] `dbms.concurrency-control` [CT][PL]: lock-based protocols (shared/exclusive; basic, strict and rigorous 2PL), timestamp ordering and Thomas's write rule, validation-based protocols, MVCC, multiple granularity (intro)
- [ ] `dbms.deadlocks` [CT][PL]: wait-for graph, prevention (wait-die, wound-wait), detection, recovery, starvation
- [ ] `dbms.recovery` [CT]: failure classification, log-based recovery (deferred and immediate), checkpoints, shadow paging, ARIES (intuition)
- [ ] `sql.transactions-isolation` [CL][PL]: practical isolation levels and anomalies (dirty read, non-repeatable read, phantom) demonstrated in MySQL

**Unit V: Parallel Databases** (provisional, per slides)
- [ ] `dbms.parallel-db` [CT]: shared-memory, shared-disk, shared-nothing and hierarchical architectures; speed-up and scale-up; I/O parallelism (round-robin, hash and range partitioning); inter-query, intra-query, intra-operation and inter-operation parallelism; parallel sort and join

**Unit VI: Distributed Databases** (provisional, per slides)
- [ ] `dbms.distributed-db` [CT][PL]: homogeneous vs heterogeneous systems; replication and fragmentation (horizontal, vertical); transparency; distributed transactions; **two-phase commit** (3PC intro); distributed concurrency control and deadlock; distributed query processing (semi-join); links to CAP and System Design

**Storage, indexing and query processing** (placement core; may or may not be in the college syllabus)
- [ ] `dbms.indexing-btrees` [PL][CT?]: ordered indices, dense vs sparse, primary vs secondary, multilevel indices, B-tree vs B+ tree (search and insert), static and dynamic hashing; InnoDB clustered index (links to Lab Assignment 2)
- [ ] `sql.indexes-plans` [CL][PL]: composite indexes and the leftmost prefix, covering indexes, `EXPLAIN` in MySQL vs `EXPLAIN QUERY PLAN` in SQLite, sargability
- [ ] `dbms.query-processing` [PL]: query processing steps, join algorithms (nested-loop, hash, sort-merge), equivalence rules and heuristic optimisation, cost intuition
- [ ] `sql.optimisation` [PL]: rewriting correlated subqueries, keyset vs offset pagination, avoiding functions on indexed columns

#### 8.2.6 Practice system

**Question families (kept separate; each has its own progress):**

1. **Theory notes:** sections read and revision notes reviewed. Completion only; never counts as mastery.
2. **MCQs:** concept, syntax, output-prediction (given tables, what does this query return), find-the-bug, normalisation and FD numericals, transactions and schedules. **Targets:** ≥ 300 SQL/DBMS MCQs across topics (≥ 8 per DBMS topic, ≥ 6 per SQL topic), plus every college MCQ.
3. **Practical SQL exercises (auto-graded):** **Targets:** ≥ 150 exercises, made up of all 71 Lab A3 prompts, the executable Lab A2 tasks, and ≥ 60 PrepForge-original exercises covering beginner → advanced (filtering, aggregation, joins, self joins, subqueries, correlated subqueries, CTEs, window functions, ranking, conditional aggregation, dates, duplicates, gaps-and-islands, division, interview-style).
4. **College questions:** short-answer, long-answer, numerical and query items from 8.2.4, organised **by unit → topic → question type → difficulty**, with the official answer when available.
5. **Interview questions:** ≥ 80 SQL/DBMS questions with model answers (e.g., "WHERE vs HAVING", "clustered vs non-clustered", "why is NOT IN dangerous with NULLs", "explain isolation levels", "normalise this table").
6. **Revision:** flashcards and cards created from wrong answers (Section 7.2).

**Every exercise record** contains: schema (tables, columns, keys); a sample dataset; the
expected output (generated by running the reference query, never hand-typed);
**hidden edge-case datasets** (NULLs, ties, empty groups, duplicates) used in grading;
hints (progressive); a step-by-step explanation; a MySQL solution plus an SQLite variant when
they differ; wrong-approach notes (with the actual wrong output it produces); an external
equivalent link if one exists; and a verification status (8.2.7).

**Grading:** compare result sets on the visible dataset **and** every hidden dataset (column
count; row multiset; order only when the prompt demands it; numeric tolerance 1e-6; NULL-aware;
column names ignored unless required). The UI shows which dataset failed and a diff of the
rows, so an inner-join zero-count bug is caught and explained.

**Theory answers:** numerical items (closure, candidate keys, superkey count, highest NF,
lossless / dependency-preserving checks, serialisability) are **auto-graded by algorithm**
using structured input (e.g., enter candidate keys as attribute sets; the FD engine computes
the truth). Short and long answers use a model answer plus a **key-point checklist**, with
self-marking labelled "self-assessed".

**Interactive tools (real computation, unit-tested):**
- FD toolkit: attribute closure with steps, candidate keys, prime attributes, superkey count, minimal cover, highest NF with the violating FDs, lossless-join test (binary and tableau), dependency preservation
- Relational algebra evaluator over small tables (σ, π, ρ, ∪, ∩, −, ×, ⋈, ÷) with a step-by-step trace
- Schedule analyser: precedence graph, conflict serialisability, recoverability and cascadelessness classification
- Deadlock / wait-for-graph drill; 2PL and timestamp-ordering step simulator
- ER → relational mapping exercises (choose tables, keys and FKs; auto-checked against the reference mapping)
- B+ tree insertion visualiser (order configurable)

**Placement question banks (verified, de-duplicated):**

| Bank | Verified data | Use |
|---|---|---|
| LeetCode SQL 50 | `research/sql-50.verified.json`: 50 problems, all free, LeetCode's own grouping | Linked practice list mapped to topics; each gets an original PrepForge hint ladder and approach notes (no copied statements) |
| LeetCode Database problems | `research/leetcode-database.verified.json`: 323 problems (105 free: 55 E, 39 M, 11 H); **55 free problems beyond SQL 50** (23 E, 22 M, 10 H) | Curate the 55 free extras into topics (window functions, gaps-and-islands, hard patterns); premium ones listed only as "Premium" without detail |
| HackerRank SQL | Domain page `https://www.hackerrank.com/domains/sql` (HTTP 200; real 404s, so per-challenge URLs are HTTP-verifiable) | Curated beginner/intermediate set, each URL checked |
| StrataScratch, DataLemur | Home and question pages HTTP-verifiable (real 404s) | Interview-style practice; only free questions linked; each URL checked |
| SQLZoo, PostgreSQL Exercises | HTTP 200 | Extra drills for joins and aggregation |
| Theory references | Silberschatz book site `https://db-book.com/` (200), CMU 15-445 `https://15445.courses.cs.cmu.edu/` (200), NPTEL DBMS `https://nptel.ac.in/courses/106105175` (200), GeeksforGeeks DBMS `https://www.geeksforgeeks.org/dbms/dbms/` (200), MySQL 8.0 Reference Manual `https://dev.mysql.com/doc/refman/8.0/en/` (returns 403 to bots; official, marked `httpVerifiable: false`), SQLite docs `https://www.sqlite.org/lang.html` (200) | Resource lists per topic |

De-duplication rule: one canonical record per external problem (keyed by platform + slug).
College items and PrepForge-original items are separate records even when similar; they are
linked with `similarTo`.

#### 8.2.7 Execution engines and verification of solutions

| Engine | Where | Used for | Label shown to the learner |
|---|---|---|---|
| **sql.js (SQLite WASM) in a Web Worker** | In the app | Running and grading portable SELECT/DML exercises; `PRAGMA foreign_keys = ON` for FK and cascade demos | "Executed in your browser (SQLite)" |
| **MySQL 8.0** | Offline build step: `scripts/verify-sql-mysql.mjs` against a disposable Docker `mysql:8.0` container (a generated throwaway password lives in a git-ignored `.env.local`), or the learner's local MySQL 8.0 if they prefer | Verifying every MySQL reference solution and expected output, and MySQL-only lab tasks (DESCRIBE, MODIFY, AUTO_INCREMENT, EXPLAIN, SHOW INDEX, error 1093, stored programs, isolation levels) | "Expected output verified on MySQL 8.0 (not executed in your browser)" |

Verification statuses (shown on every item):

- `verified-mysql`: reference solution executed on MySQL 8.0 and output captured.
- `verified-sqlite`: executed in SQLite; the result matches MySQL or the dialect difference is noted.
- `verified-algorithm`: the theory answer is computed by the FD, schedule or RA engine and matches.
- `official-answer`: matches the college's official solution.
- `needs-validation`: not yet verified (default for imported and learner-authored content).
- `disputed`: PrepForge's derivation disagrees with the source; both are shown with reasoning.

Never display "Correct" or "Passed" for anything not produced by a real execution or a
deterministic check.

#### 8.2.8 Learning experience and features

- **Topic hub** per topic with tabs: Notes · College Questions · MCQs · Practice SQL · Interview · Revise · Resources. Each tab shows its own progress.
- **College Exam mode** (`/learn/sql-dbms/college`): browse by **Unit → Topic → Question type (MCQ / short / long / numerical / query / viva) → Difficulty**; unit coverage; weak units; exam date countdowns (learner-entered CIE, ISE, ESE and practical/oral dates).
- **Practice tests:** unit tests (CIE-style), mixed ISE/ESE-style mock papers, lab practical mocks (timed query sets on the Institute DB), and viva drills. Paper formats are **configurable templates labelled "format assumed"** until real question papers are provided (8.2.3 item 4).
- **SQL editor:** schema browser, sample-data preview, run (Ctrl+Enter), formatted result grid, readable errors, query history, reset dataset, dialect switch notes, and a "Check answer" button for exercises.
- **Topic quizzes and timed tests** via the OA engine (Section 8.10) with SQL items auto-graded.
- **Hints** (progressive), answer review with explanations, **bookmarks**, **incorrect-question tracking** (feeds revision and the mistake journal, with SQL-specific error categories: wrong join type, missing zero-count groups, NULL mishandling, wrong grouping level, row multiplication, date-boundary error, dialect error), and progress persistence.
- **Placement view:** the same topics filtered to [PL] with LeetCode / HackerRank / StrataScratch lists and interview questions.

#### 8.2.9 Acceptance criteria for the SQL/DBMS module

1. Every topic in 8.2.5 is either Complete (Section 11 minimums plus a link to at least one item in each relevant family) or explicitly Planned.
2. All 17 Assignment 1 questions, all 71 Lab A3 prompts, the Lab A2 tasks and the slide exercises exist as `CollegeQuestion` records mapped to source, unit, topic, type and difficulty, each with a solution and a verification status. None is `needs-validation` at release, except items awaiting transcription or missing materials.
3. Every SQL reference solution is `verified-mysql`, and every in-app exercise is also `verified-sqlite` or carries an explicit dialect note.
4. Grading catches the learner's documented mistakes in 8.2.4 (unit tests use those exact wrong queries and must fail on a hidden dataset).
5. The FD, RA and schedule tools reproduce the official answers of Assignment 1 (or flag them `disputed` with reasoning).
6. Theory, MCQ, practical, college-question and revision progress are stored and displayed separately and survive a reload.
7. The missing-materials list (8.2.3) is visible in the app until resolved.

### 8.3 OOP in C++ and 8.4 OOP in Java

**Features:** practice formats are predict the output, identify the compile error, debug,
complete the missing code, "which method is called?", trace the constructor/destructor
order, class-design problems, identify OOP/SOLID violations, implement practical examples,
interview questions and language-specific MCQs. **Every code-output and compile-error
question is compile-verified** with `scripts/verify-code.mjs` (`verified: 'compiled'`).
Every question explains why the answer is correct **and** why each tempting alternative is
wrong. Topics show "In Java this differs because…" callouts, and vice versa.

**C++ topics:**
- [ ] `cpp.classes-objects` (F): class vs struct, members, `this`, const member functions
- [ ] `cpp.constructors-destructors` (F): default, parameterised, initialiser lists (and member init order!), delegating, explicit, destructor order, temporaries
- [ ] `cpp.access-encapsulation` (F): public/protected/private, friend, invariants
- [ ] `cpp.inheritance` (C): access in inheritance, constructor/destructor order, multiple inheritance, diamond and virtual inheritance
- [ ] `cpp.polymorphism-virtual` (C): virtual functions, vtables (conceptual), dynamic dispatch, **static vs dynamic binding**, override/final, **virtual destructors**, calling virtuals in constructors, **object slicing**
- [ ] `cpp.overloading` (C): function overloading resolution, default arguments, **operator overloading** (member vs friend, `<<`, `==`, `[]`, `++` pre/post)
- [ ] `cpp.static-members` (C): static data and functions, initialisation, static locals
- [ ] `cpp.copy-semantics` (C): copy constructor, copy assignment, **shallow vs deep copy**, rule of three/five/zero, copy elision
- [ ] `cpp.memory-raii` (C): stack vs heap, new/delete pitfalls, **RAII**, `unique_ptr`, `shared_ptr`, `weak_ptr`, cycles
- [ ] `cpp.move-semantics` (A): lvalues/rvalues, move constructor and assignment, `std::move`, noexcept moves
- [ ] `cpp.abstract-interfaces` (C): pure virtual functions, abstract classes as interfaces
- [ ] `cpp.composition-association` (C): composition vs aggregation vs association, has-a vs is-a
- [ ] `cpp.exceptions` (C): try/catch/throw, stack unwinding, exception safety, noexcept
- [ ] `cpp.templates` (A): function and class templates, specialisation (intro), templates vs Java generics
- [ ] `cpp.solid-patterns` (C): SOLID in C++; Singleton, Factory, Strategy, Observer, Decorator, Adapter (with C++ idioms)

**Java topics:**
- [ ] `java.classes-objects` (F): classes, references vs objects, `this`, pass-by-value of references
- [ ] `java.constructors-init` (F): constructor chaining (`this()`/`super()`), **initialisation order** (static blocks, instance initialisers, field defaults)
- [ ] `java.access-packages` (F): private/default/protected/public, packages, encapsulation
- [ ] `java.inheritance` (C): extends, super, constructor chaining, `Object` methods
- [ ] `java.polymorphism` (C): dynamic dispatch, **fields are not polymorphic**, **static method hiding**, private/final methods, covariant returns, casting and `ClassCastException`
- [ ] `java.overloading-resolution` (C): widening vs boxing vs varargs priority, ambiguity errors
- [ ] `java.abstract-interfaces` (C): abstract classes vs interfaces, default and static methods, diamond resolution, functional interfaces
- [ ] `java.static-final` (C): static members, final variables/methods/classes, effectively final
- [ ] `java.object-equality` (C): `==` vs `equals`, the `hashCode` contract, String pool and immutability, Integer cache
- [ ] `java.exceptions` (C): checked vs unchecked, finally semantics (return-in-finally traps), try-with-resources, custom exceptions, overriding rules
- [ ] `java.generics` (A): type erasure, bounded types, wildcards and PECS, generic methods, generics vs C++ templates
- [ ] `java.collections-internals` (A): HashMap internals (buckets, treeification), `equals`/`hashCode` effects, fail-fast iterators, Comparable vs Comparator
- [ ] `java.memory-gc` (A): stack vs heap, GC basics, references, memory leaks in Java
- [ ] `java.inner-lambdas` (A): inner, static nested and anonymous classes; lambdas and method references
- [ ] `java.solid-patterns` (C): SOLID in Java; the same pattern set as C++, in Java idioms

**Shared object-oriented design (LLD) practice:** parking lot, library management, vending
machine (state pattern), elevator (simplified), rate limiter class, snake and ladder. Each
has requirements, a class diagram (text/SVG), a key-decision discussion, C++ and Java
skeletons, and common mistakes.

### 8.5 Computer Networks

**Features:** protocol and packet-flow diagrams (SVG, step-through), MCQs, scenario and
troubleshooting questions, a subnet calculator tool with practice mode, and interview
questions. Required scenario walkthroughs: "what happens when you type a URL" (DNS →
TCP → TLS → HTTP → render), a failed TCP connection (RST vs timeout vs refused), and
an unexpected DNS result (stale cache, TTL, split-horizon, hosts file).

- [ ] `cn.models` (F): OSI vs TCP/IP, encapsulation, PDUs per layer
- [ ] `cn.ethernet-mac` (F): frames, MAC addresses, switches, broadcast and collision domains, VLAN basics
- [ ] `cn.ip-subnetting` (C): IPv4 addressing, CIDR, subnetting and supernetting, private ranges, IPv6 basics
- [ ] `cn.arp-icmp-dhcp` (C): ARP, ICMP (ping, traceroute), DHCP DORA
- [ ] `cn.routing-switching` (C): routing tables, longest-prefix match, static vs dynamic routing (RIP/OSPF/BGP at interview depth)
- [ ] `cn.tcp-udp` (C): TCP vs UDP, ports, headers, use cases
- [ ] `cn.tcp-lifecycle` (C): 3-way handshake, 4-way termination, TIME_WAIT, sequence and ack numbers, retransmission
- [ ] `cn.flow-congestion` (C): sliding window, flow control, slow start, congestion avoidance, fast retransmit and recovery
- [ ] `cn.dns` (C): resolution path, record types, caching and TTL, recursive vs iterative
- [ ] `cn.http` (C): HTTP/1.1 vs 2 vs 3, methods, status codes, headers, keep-alive, caching headers
- [ ] `cn.tls-https` (C): TLS 1.3 handshake (interview depth), certificates, CAs and chain of trust, HTTPS
- [ ] `cn.sessions-auth` (C): cookies, sessions, tokens (JWT), SameSite, CORS basics, OAuth (overview)
- [ ] `cn.rest-protocols` (C): REST principles, idempotency, WebSockets, gRPC (overview), SMTP/FTP/SSH (brief)
- [ ] `cn.proxies-lb` (C): forward vs reverse proxy, L4 vs L7 load balancing, CDN
- [ ] `cn.nat-firewalls` (C): NAT/PAT, stateful vs stateless firewalls, security groups
- [ ] `cn.sockets` (A): socket API flow (server and client), blocking vs non-blocking, select/epoll (intro)
- [ ] `cn.troubleshooting` (C): ping, traceroute, dig/nslookup, curl -v, netstat/ss, tcpdump basics; scenario drills

### 8.6 Operating Systems

**Features:** a CPU scheduling simulator (FCFS, SJF, SRTF, Priority, Round Robin; Gantt
chart; waiting and turnaround times) with a "solve by hand, then check" mode; a page
replacement simulator (FIFO, LRU, Optimal; fault count and Belady's anomaly demo); Banker's
algorithm exercises; synchronisation code-output questions (C++ threads, Java threads).

- [ ] `os.processes-threads` (F): process vs thread, PCB, address space, user vs kernel threads
- [ ] `os.process-states` (F): state diagram, context switching cost, fork/exec/wait (Linux)
- [ ] `os.cpu-scheduling` (C): algorithms, metrics, starvation and aging, multilevel queues
- [ ] `os.synchronisation` (C): race conditions, critical sections, Peterson's algorithm (conceptual), mutexes, semaphores, monitors, condition variables
- [ ] `os.classic-problems` (C): producer-consumer, readers-writers, dining philosophers
- [ ] `os.deadlocks` (C): Coffman conditions, prevention, avoidance (Banker's), detection, recovery
- [ ] `os.memory-management` (C): contiguous allocation, fragmentation, paging, segmentation
- [ ] `os.virtual-memory` (C): demand paging, page faults, TLB, multi-level page tables, thrashing, working set
- [ ] `os.page-replacement` (C): FIFO, LRU, Optimal, Clock, Belady's anomaly
- [ ] `os.system-calls` (C): user vs kernel mode, traps and interrupts, system call flow
- [ ] `os.ipc` (C): pipes, message queues, shared memory, signals, sockets
- [ ] `os.file-systems` (C): inodes, directories, allocation methods, journaling, hard vs soft links
- [ ] `os.io-management` (A): interrupts vs polling, DMA, disk scheduling (FCFS, SSTF, SCAN, C-SCAN)
- [ ] `os.concurrency-multithreading` (C): concurrency vs parallelism, thread pools, false sharing, atomics (intro)
- [ ] `os.linux-essentials` (C): processes (ps/top), signals, memory (free, /proc), OOM killer, load average

### 8.7 System Design

**Features:** foundations topics; case studies following the 11-step template;
**new-grad vs senior expectation callouts** on every case study; a back-of-envelope
calculator; a timed design-mock checklist with a self-assessed rubric (labelled).

Foundations:
- [ ] `sd.requirements` (F): functional vs non-functional requirements, scoping, clarifying questions
- [ ] `sd.estimation` (F): capacity estimation, powers of two, latency numbers, QPS and storage maths
- [ ] `sd.latency-throughput-availability` (F): SLAs/SLOs, nines, reliability
- [ ] `sd.scalability` (F): vertical vs horizontal, stateless services
- [ ] `sd.load-balancing` (C): algorithms, health checks, L4/L7
- [ ] `sd.caching` (C): cache-aside, write-through/back, eviction, invalidation, CDN
- [ ] `sd.databases` (C): SQL vs NoSQL, indexing, data modelling for access patterns
- [ ] `sd.replication-sharding` (C): replication strategies, sharding keys, consistent hashing, hotspots
- [ ] `sd.consistency-cap` (C): consistency models, CAP, PACELC (intro), quorum reads/writes
- [ ] `sd.messaging` (C): queues vs pub/sub, delivery semantics, idempotency, event-driven architecture
- [ ] `sd.rate-limiting` (C): token bucket, leaky bucket, fixed and sliding windows
- [ ] `sd.api-design` (C): REST resource design, pagination, versioning, idempotency keys
- [ ] `sd.auth` (C): authentication vs authorisation, sessions vs JWT, OAuth2/OIDC (overview), RBAC
- [ ] `sd.observability` (C): logs, metrics, traces, alerting, SLIs
- [ ] `sd.fault-tolerance` (A): retries with backoff, timeouts, circuit breakers, bulkheads, graceful degradation
- [ ] `sd.distributed-fundamentals` (A): clocks, leader election, consensus (Raft intuition), exactly-once myths

Case studies (each: clarification, functional and non-functional requirements, estimation,
high-level architecture, API, data model, components, bottlenecks and failures, scaling,
trade-offs, follow-ups):
- [ ] URL shortener · [ ] Rate limiter · [ ] Pastebin · [ ] Notification service · [ ] File storage service · [ ] Chat application · [ ] News feed · [ ] API gateway · [ ] Logging and monitoring service · [ ] Basic video streaming

### 8.8 DevOps, Docker, Kubernetes, CI/CD and Cloud

**Features:** command-based questions, configuration reading, YAML/Dockerfile debugging
("find the bug" with the corrected version and an explanation), scenario MCQs, and mini-labs
(step lists the learner runs locally with Docker Desktop, plus expected outputs to compare
against; clearly labelled as local labs). Two tracks: **Core (interview fundamentals)** and
**Advanced**. Kubernetes depth beyond core concepts sits in Advanced, because not every SWE
interview needs it.

- [ ] `devops.linux` (F): filesystem hierarchy, permissions (chmod/chown, octal), processes and signals, environment variables, pipes and redirection, grep/sed/awk/find, shell scripting basics
- [ ] `devops.linux-networking` (C): ip/ss/netstat, curl, dig, ping, traceroute, nc, firewall basics
- [ ] `devops.git` (F): branching, merge vs rebase, conflict resolution, reset vs revert, cherry-pick, stash, common workflows (trunk-based, GitFlow), PR etiquette
- [ ] `devops.docker` (C): images vs containers, Dockerfile instructions, layers and caching, volumes vs bind mounts, networks, Compose, multi-stage builds, container security, troubleshooting
- [ ] `devops.k8s-core` (C): architecture (control plane, kubelet, etcd), Pods, Deployments, ReplicaSets, Services (ClusterIP/NodePort/LoadBalancer), ConfigMaps and Secrets, namespaces, probes, requests and limits, kubectl troubleshooting (CrashLoopBackOff, ImagePullBackOff, Pending)
- [ ] `devops.k8s-advanced` (A): Ingress, HPA autoscaling, PersistentVolumes and PVCs, StatefulSets, DaemonSets, Helm fundamentals, RBAC
- [ ] `devops.cicd` (C): pipeline stages, artifacts, GitHub Actions (workflows, jobs, matrix, secrets, caching), deployment strategies (rolling, blue/green, canary), rollback
- [ ] `devops.iac-terraform` (A): IaC principles, Terraform plan/apply/state, modules, drift
- [ ] `devops.aws` (C): IAM (users, roles, policies, least privilege), VPC (subnets, route tables, IGW/NAT, security groups vs NACLs), EC2, S3, RDS, Lambda, CloudWatch
- [ ] `devops.observability` (C): logs, metrics, monitoring, alerting basics
- [ ] `devops.cloud-security` (C): shared responsibility, secrets management, least privilege, image scanning

### 8.9 Core CS interview questions

A cross-cutting rapid-fire bank: short Q&A with model answers, tagged to modules, used for
flashcards and mock rounds.
- [ ] `core.program-execution` (F): compilation vs interpretation, compile/link/load, process memory layout (stack, heap, data, text)
- [ ] `core.data-representation` (F): two's complement, floating point pitfalls, endianness, character encodings (ASCII, UTF-8)
- [ ] `core.security-fundamentals` (C): CIA triad, hashing vs encryption vs encoding, symmetric vs asymmetric, digital signatures, PKI, XSS/CSRF/SQL injection (OWASP Top 10 overview), **zero trust** (important for Zscaler)
- [ ] `core.concurrency-qa` (C): deadlock vs livelock vs starvation, thread safety, immutability
- [ ] `core.oop-dbms-os-cn-rapid` (C): curated top-50 rapid-fire questions across modules (references to topic pages)

### 8.10 Online Assessment Centre

**Formats:** DSA-only, SQL-only, OOP and language MCQs, Core CS MCQs, mixed, coding and
debugging, company-style practice simulations (labelled "Practice simulation, not an
actual company assessment"), and custom (topics × difficulty × count × duration).

**Item types:** MCQ (auto-scored); SQL (auto-scored by real sql.js execution); debugging
(MCQ: choose the bug or the fix); coding (problem link plus in-app timer; the result is
**self-reported** with the outcome and test-case checklist, labelled "self-reported" in
scoring, and kept out of the auto-score); approach questions (choose the correct
pattern/complexity for an unseen problem summary, auto-scored, which directly trains
pattern recognition).

**Runner requirements:** configurable duration; an absolute `endsAt` timestamp, so the timer
survives reloads; question palette navigation (answered, unanswered, marked, current);
mark for review; auto-save on every change; per-question time tracking (active time only);
a confirm-submit dialog listing unanswered and marked items; auto-submit at time-out; the
full-screen layout works on mobile.

**Results:** score, accuracy, attempted vs total, time per question, topic-wise and
difficulty-wise breakdowns, incorrect-answer review with explanations, comparison with
previous attempts, and recommendations (feeding the plan engine). Wrong items enter the
revision queue.

**Smart practice:** item selection mixes ~60% weak-topic, ~20% previously incorrect and
~20% unseen-random items, while maintaining the requested difficulty mix. Difficulty
adapts across attempts per Section 7.4.

### 8.11 Company-specific preparation

Each company page contains: verified facts (with source and verified-on date); clearly
labelled unverified or changing items; rounds (only when sourced); DSA topic and pattern
emphasis (marked as **our preparation recommendation**, not company data); core CS, SQL and
OOP relevance; system design expectations for new grads; behavioural preparation (with a
STAR story builder stored in user data); practice-simulation assessments; and public
resources. Content lives in `src/content/companies/*.ts`, so updates need no redesign.

**Research status (session 1):**

- **Google:** verified on 2026-10-11 from `https://www.google.com/about/careers/applications/how-we-hire/`. Typically about 6–8 weeks. Candidates may take the **Google Hiring Assessment** and possibly role-related assessments such as a coding exercise. There are one or two recruiter conversations, then a panel of interviews (video or in person) using **structured interviewing with consistent rubrics** and open-ended, role-related questions. There are **no brainteasers**, and **AI tools are not permitted during interviews**. Interview-prep sub-page: not yet read.
- **Amazon:** verified on 2026-10-11 from `https://amazon.jobs/content/en/how-we-hire/university/sde-oa`.
  - **University SDE OA (full-time):** coding assessment (average 70 min), Workstyles Assessment (average 15 min), Work Simulation (average 60 min) and a feedback survey. Allow up to 2 hours. The **internship OA** is about 90 min, without the Work Simulation. Public online resources (e.g., language docs) are allowed; copying and pasting is discouraged.
  - From `https://www.amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep` (SDE II, for reference): OA is 90 min for 2 coding questions plus system-design scenarios plus a work-style survey; the loop is four 55-minute interviews with syntactically correct code (no pseudocode) and at least one design question; there is heavy Leadership Principles emphasis (2–3 behavioural questions per interviewer) and no brain teasers.
  - From `https://amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics`, the topic list: programming language, data structures, algorithms, coding, object-oriented design, databases, distributed computing, operating systems, internet topics, general ML/AI.
  - The **16 Leadership Principles** are verified from `https://www.amazon.jobs/content/en/our-workplace/leadership-principles`: Customer Obsession; Ownership; Invent and Simplify; Are Right, A Lot; Learn and Be Curious; Hire and Develop the Best; Insist on the Highest Standards; Think Big; Bias for Action; Frugality; Earn Trust; Dive Deep; Have Backbone; Disagree and Commit; Deliver Results; Strive to be Earth's Best Employer; Success and Scale Bring Broad Responsibility.
- **Meta:** the official page `https://www.metacareers.com/swe-prep-onsite/` is verified to exist, but its details are in a downloadable "Full Loop Interview Guide" PDF that has not been read. **Pending:** read the guide (with the user's permission to download) or `metacareers.com` prep pages via the in-app browser.
- **Apple, Netflix, Zscaler, Microsoft, Uber, Atlassian, Salesforce, Adobe, others:** **not yet researched.** Pages must show "Hiring-process details not yet verified" until sourced. For Zscaler, add a networking, OS and security-fundamentals emphasis (proxies, TLS, DNS, zero trust, Linux, C/C++ fundamentals) as **our recommendation**, labelled as such.
- **Never** state compensation figures, question frequencies, or "asked at X" claims without a cited public source.

### 8.12 Mock interviews and timed assessments

- **Coding mock (45 min):** a random unseen problem matched to the level, with stage timers (clarify 5, approach 10, code 20, test 5, complexity 5) and **no hints**; then a self-assessed rubric (communication, problem solving, code quality, testing, complexity), labelled self-assessed.
- **Behavioural mock:** a random question (Amazon LP-mapped when the Amazon track is active), a STAR template, a 3-minute answer timer, a link to the stored story, and a rubric.
- **System design mock (45 min):** a random case-study prompt, a checklist timer and a rubric; the reference outline is revealed afterwards.
- **Scheduled mocks:** these appear on the dashboard under "Upcoming mock assessments" (weekly by default).

### 8.13 Revision and retention

Covered by Section 7.2. UI: a due-today queue; a flashcard player (keyboard: Space flips,
1–4 grade); revision sheets per topic (notes + templates + key observations, printable);
saved items (difficult questions, incorrect solutions, theory, personal notes, mistakes,
templates, interview questions); and a weekly mixed recall test.

### 8.14 Dashboard

Today's plan (Section 7.4) at the top; a five-question summary row (today, completed, weak,
revise, target progress); subject-wise completion **and** mastery (separate bars); streak
and activity heatmap; daily and weekly goals; independent vs with-hints solve counts; OA
accuracy trend; average solving time by difficulty; reviews due; the weakest concepts with
"why" evidence; upcoming mocks; recommended next actions; and per-company track progress.
**Empty states** must guide a new user ("Set your daily time and targets", "Start with
Complexity Analysis").

### 8.15 Readiness and analytics

Section 7.3, rendered as per-dimension bars with confidence, evidence lists, an
improvement checklist, trend over time, a per-company view, and a fixed disclaimer: "This
score summarises your preparation evidence. It does not predict hiring outcomes."

---

## 9. Cross-cutting features

- [ ] Global search (Ctrl/Cmd+K) across topics, problems, MCQs, SQL exercises and notes
- [ ] Notes per topic, problem and question (plain text, escaped); bookmarks for anything; a notes index page
- [ ] Mistake journal: every logged error category with a link to the source attempt; filter by category and topic; "practise this weakness" buttons
- [ ] Settings: profile, target companies, daily minutes, preferred language (C++/Java default tab), weekly goals
- [ ] Data management: JSON export, JSON import (schema-validated, with a preview and a confirm step), reset with typed confirmation, storage usage display
- [ ] Content status badges (Complete / Partial / Planned) on every module, topic and company page
- [ ] Keyboard shortcuts: search, MCQ answer keys 1–4, flashcard grading, OA navigation
- [ ] Error boundary per route with a friendly fallback; a 404 page

---

## 10. UI/UX and responsive requirements

### Visual system (from `DESIGN.md`, adapted for a learning product)

- **Colours:** canvas `#ffffff`; ink `#080808` for headings and primary buttons; body text `#363636`; secondary `#5a5a5a`; muted `#898989` (**large or non-essential text only**: it is about 3.5:1 on white, so it fails AA for body text); hairline `#d8d8d8`; a subtle surface such as `#f7f7f7` for code and table headers.
- **Adaptation 1, subject accents:** use the five accents as small identity markers per module (a 3px left rule, an icon tint, a chart series), **not** as full-fill cards. Full-fill category cards would be too loud for a study tool, and the spec forbids decoration without purpose.
- **Adaptation 2, semantic colours must pass WCAG AA as text:** brand green `#00d722` and yellow `#ffae13` fail on white. Use darker text variants (e.g., success `#0a7f2e`, warning `#9a5b00`, error `#c4122b`, info `#006acc`) and keep the bright accents for fills and icons only. Verify every pair with a contrast checker.
- **Typography:** Inter 400/500/600 (self-hosted or Google Fonts; never above 600), negative tracking on displays. A mono font (JetBrains Mono or Inconsolata) for code. Use `clamp()` for headings; body is 16px with a line-height around 1.6; prose measure is at most about 72ch.
- **Shape and elevation:** buttons 4px, cards 8px, hairline borders as the default elevation; layered shadows only for dialogs and popovers. No gradients and no emoji.
- **Code blocks:** language tabs (C++ / Java), a copy button, line numbers optional, `overflow-x: auto` with **no wrapping**, a visible scroll affordance, 14px mono on mobile.

### Breakpoints and layouts (CSS pixels)

| Range | Layout |
|---|---|
| 320–479 | Single column; top bar plus **hamburger drawer** and a **bottom tab bar**; tables become stacked cards; OA palette as a bottom sheet; 16px gutters |
| 480–767 | As above, with wider cards; 2-up stat tiles |
| 768–991 (tablet) | Collapsible icon rail sidebar; 2-column grids; the topic TOC as a dropdown |
| 992–1279 (laptop, ~1000) | Persistent sidebar (240px); main content; topic TOC inline |
| 1280–1919 (1440, FHD) | Sidebar + content (max ~760px prose) + right rail (TOC, progress, notes) on topic pages; the dashboard uses a 12-column grid |
| ≥ 1920 (FHD, 2K/2560) | Same structure with the content max-width capped (app container ~1600px, centred). Prose stays at its measure; extra width goes to side rails and dashboard grids, never to stretched paragraphs or giant charts |

Hard requirements: no horizontal page scroll at 320px; touch targets ≥ 44×44px; visible
`:focus-visible` rings; skip-to-content link; full keyboard navigation (drawer focus trap,
Esc closes dialogs); `prefers-reduced-motion` respected; tables in scroll containers with
sticky first column where useful; charts responsive via viewBox, with a text equivalent.
Layout must be verified on real pages (dashboard, topic, problem coach, OA runner, SQL lab,
analytics) at 320, 375, 768, 1024, 1440, 1920 and 2560.

### Required UI states

Loading (skeletons for SQL engine load), empty (with a next action), error (message plus
retry), "content planned" (honest placeholder with a link to the roadmap item, **not** filler
text), and offline (the app works fully offline once loaded).

---

## 11. Content quality standard

**Topic minimums for "Complete" status:**

| Element | DSA | SQL | DBMS / CN / OS / SD / DevOps | OOP C++ / Java |
|---|---|---|---|---|
| Objectives + prerequisites | yes | yes | yes | yes |
| Theory sections | concept, intuition, visual/trace, dry run, code (C++ + Java), complexity, mistakes, recognition | concept, examples with datasets, mistakes, recognition | concept, diagrams/examples, comparisons, mistakes | concept, C++ vs Java callouts, code, pitfalls |
| MCQs | ≥ 8 (concept, complexity, code-output, edge-case) | ≥ 6 | ≥ 8 (incl. scenario) | ≥ 10 (output, compile-error, which-method) |
| Interview questions with model answers | ≥ 5 | ≥ 4 | ≥ 6 | ≥ 6 |
| Practice | ≥ 6 bank problems across E/M/H, with ≥ 1 authored walkthrough | ≥ 4 auto-graded exercises | simulator/tool exercises where a tool exists | ≥ 2 implement or design exercises |
| Revision notes + templates + ≥ 5 flashcards | yes | yes | yes | yes |
| Mastery test (time-limited, from the MCQ pool + problems) | yes | yes | yes | yes |
| ≥ 2 verified external resources | yes | yes | yes | yes |

**Rules:**

1. Original wording only. Never paste problem statements, editorial text or book passages; paraphrase the task in one or two lines and link the source.
2. Accuracy over volume. Code is compiled; outputs are verified; complexity claims are justified in text.
3. Every MCQ has four plausible options (unless the type demands otherwise), one correct id, an explanation of the correct answer, a "why not" for each tempting distractor, topic mapping, difficulty and provenance.
4. No generic filler. Each explanation must contain a concrete example, a trace or a counter-example.
5. A "planned" topic is shown as planned, with its objectives and resources only. It never counts towards module completion denominators as "done".
6. `scripts/validate-content.ts` enforces the structural rules; a human-style review checklist (in this file, per topic) covers correctness.

---

## 12. External resources and link verification

- Prefer stable official URLs: cppreference.com, docs.oracle.com/javase, dev.java, postgresql.org/docs, dev.mysql.com/doc, sqlite.org, kubernetes.io/docs, docs.docker.com, docs.aws.amazon.com, docs.github.com/actions, developer.hashicorp.com/terraform, the RFC editor (rfc-editor.org), man7.org (Linux man pages), and the OSTEP book (pages.cs.wisc.edu/~remzi/OSTEP).
- Practice platforms: LeetCode (problem URLs from verified slugs), NeetCode (practice/roadmap pages plus verified YouTube IDs), GeeksforGeeks (HTTP-verified), HackerRank SQL, StrataScratch, Codeforces (problem URLs are stable: `codeforces.com/problemset/problem/{contest}/{index}`), takeuforward (Striver A2Z sheet page).
- **Never invent URLs.** Every URL in content must pass `scripts/check-links.mjs` or be explicitly marked `httpVerifiable: false` with the reason (SPA / bot-blocked) **and** come from a verified dataset.
- Run the link check before each release; store `verifiedOn` dates.

---

## 13. Implementation phases and task checklist

Priority: **P0** = core learning loop / must-have, **P1** = important, **P2** = nice-to-have.
Each phase lists dependencies and acceptance criteria. Do not start a phase whose
dependencies are unmet.

### Phase R: Audit and research (session 1; core done, some items blocked)

- [x] Audit the repository (greenfield; only `DESIGN.md`; not a git repo)
- [x] Check the local toolchain (Node 22, g++ 6.3, Java 23, Python 3.13)
- [x] Fetch and verify the problem lists: NeetCode 150, Blind 75, Top Interview 150, LeetCode 75, Striver A2Z (LeetCode-linked) → 383 canonical problems, all slugs verified via LeetCode GraphQL → `research/dsa-problems.verified.json`
- [x] Fetch and verify LeetCode SQL 50 → `research/sql-50.verified.json`
- [x] Establish the link-verification method (LeetCode via GraphQL; GFG via HTTP; NeetCode not HTTP-verifiable)
- [x] Verify Google and Amazon hiring-process facts from official pages (Section 8.11)
- [x] Write this roadmap (`what_to_do.md`) and `research/README.md`
- [x] Audit college SQL/DBMS materials on the learner's PC (none were in the repo): syllabus PDFs, Unit I slides, official theory Assignment 1 with solutions, Lab Assignment 2 and 3 sheets and write-up, learner's own SQL and submissions, derived and AI-generated notes. Inventory and mapping in Section 8.2.2–8.2.4
- [x] Verify the LeetCode Database problem list (323 problems, 105 free) → `research/leetcode-database.verified.json`; HTTP-check HackerRank, StrataScratch, DataLemur, SQLZoo, pgexercises, db-book, CMU 15-445, NPTEL, GFG, SQLite docs
- [ ] (BLOCKED: awaiting learner) Missing college materials listed in Section 8.2.3
- [ ] (BLOCKED: guide is a PDF download; needs user permission) Meta Full Loop guide
- [ ] Research Apple, Netflix, Zscaler, Microsoft and other company pages from official sources (P1, can run in parallel with Phases 1–6)
- [ ] Map A2Z items that link to GFG or other non-LeetCode sites (P2)

### Phase 0: Repository setup (P0)

Depends on: nothing.

- [x] `git init`, `.gitignore`, initial commit containing `DESIGN.md`, `what_to_do.md` and `research/`, pushed to `origin main` (done in session 1)
- [ ] Scaffold Vite + React + TS (strict) in place (do not overwrite `DESIGN.md` or `research/`)
- [ ] Add dependencies: react-router-dom, zustand, lucide-react, marked, highlight.js, sql.js; dev: vitest, @testing-library/react, jsdom, playwright, eslint (+ typescript-eslint, react-hooks, jsx-a11y), prettier, tsx
- [ ] Scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:e2e`, `validate:content`, `verify:code`, `check:links`, `build:problems`
- [ ] `src/styles/tokens.css` from DESIGN.md with the Section 10 adaptations (contrast-checked)
- [ ] `.claude/launch.json` for the preview server (dev on port 5173)
- [ ] A short `README.md` (run, build, data storage, limitations), pointing to this file

**Acceptance:** `npm run build`, `typecheck`, `lint` and `test` (with one trivial test) all pass; the app renders "PrepForge" at `/`.

### Phase 1: Foundation (P0)

Depends on: Phase 0.

- [ ] Layout shell: sidebar (desktop), icon rail (tablet), top bar + drawer + bottom tab bar (mobile), skip link, focus management
- [ ] Router with all Section 5 routes (unbuilt pages render an honest "Coming in Phase N" state linked to this roadmap; **no fake content**)
- [ ] UI primitives: Button, IconButton, Card, Badge, StatusBadge, Tabs, Disclosure, CodeBlock/CodeTabs (highlight.js, copy), Table (responsive), ProgressBar, Stat, EmptyState, Dialog, Toast, Timer, Kbd
- [ ] SVG chart primitives: BarList, StackedBar, Sparkline, ActivityHeatmap, ProgressRing
- [ ] Store: slices per Section 6.2, persist to `prepforge:v1`, `migrate()`, export/import/reset with validation; unit tests
- [ ] Content schema (`schema.ts`) and registry; Markdown renderer (marked + highlight.js); TraceStepper component (array/pointer/window/stack visuals)
- [ ] `scripts/validate-content.ts` wired into `npm test`
- [ ] Global search (Ctrl/Cmd+K) over the registry
- [ ] Settings page (profile, targets, daily minutes, language, data management)

**Acceptance:** navigation works on every route at 320/768/1440/2560; data survives a reload; export → reset → import restores state; the validator fails on a deliberately broken fixture.

### Phase 2: DSA learning loop (P0, the most important phase)

Depends on: Phase 1.

- [ ] `scripts/build-problem-bank.ts`: generate `src/content/problems/bank.generated.ts` from `research/dsa-problems.verified.json` (topic mapping precedence plus a review report); hand-review the mapping
- [ ] Topic page (all tabs) rendering the `Topic` schema
- [ ] MCQ engine: single and multi-select, instant feedback in practice mode, explanations and misconception notes, attempt logging with `firstSeen`
- [ ] Problem bank page: filters (topic, pattern, difficulty, list, status, premium, has-walkthrough), search, sort, responsive card/table views, canonical records shown with all list badges
- [ ] Problem-Solving Coach page: 11 stages, saved stage answers, hints 1–4 and solution with logged reveals, pausable timer, outcome capture, error classification, reflection, revision-card creation
- [ ] Engine: `mastery.ts` (Section 7.1) with unit tests
- [ ] Dashboard v1: today's plan (simple version), completion vs mastery per module, recent activity, due reviews count, weakest topics (with evidence), empty states
- [ ] **Pilot content (Complete per Section 11):** `dsa.complexity`, `dsa.hashing`, `dsa.two-pointers`, `dsa.sliding-window`, `dsa.binary-search`
- [ ] Authored coach walkthroughs for the pilot topics' Blind 75 problems (about 15)

**Acceptance:** a learner can open Sliding Window, read it, answer MCQs (logged), open a linked problem, go through the coach with hints, log an outcome with error categories, and see mastery and the dashboard update after a reload. Unit tests cover mastery edge cases (no evidence, all independent, all after-solution).

### Phase 3: Revision, readiness and planning engines (P0)

Depends on: Phase 2.

- [ ] `revision.ts` (SM-2 variant + forgetting-risk ordering) + tests
- [ ] Auto-card creation (wrong MCQs, hinted or solution-viewed problems) + manual "save to revision"
- [ ] Revision page: due today, flashcard player, topic sessions, previously incorrect, revision sheets
- [ ] `readiness.ts` (9 dimensions, evidence, confidence, decay) + tests; Analytics page with evidence and the disclaimer
- [ ] `plan.ts` daily plan generator + tests; Plan page; the dashboard uses it
- [ ] Mistake journal page; `recommend.ts` (error category → interventions)
- [ ] Streaks, activity heatmap, weekly goals

**Acceptance:** with seeded test data, unit tests produce expected intervals, due ordering, readiness values and plans; the UI shows the evidence for each readiness number; due cards appear on the expected dates (tested with a mocked clock).

### Phase 4: OA Centre (P0)

Depends on: Phases 2–3 (needs the MCQ pool, problems and engines).

- [ ] Assessment builder (presets plus custom)
- [ ] Runner: absolute timer, palette, mark for review, autosave, resume after reload, per-question active time, confirm submit, auto-submit
- [ ] Item types: MCQ, approach/pattern MCQ, debugging MCQ, coding (self-reported, labelled), SQL (after Phase 5)
- [ ] `scoring.ts` + tests (partial credit rules documented; self-reported items excluded from the auto-score)
- [ ] Results: score, accuracy, per-topic and per-difficulty breakdown, time per question, review with explanations, comparison with history, recommendations
- [ ] Smart item selection (weak / previously incorrect / unseen mix)

**Acceptance:** a 20-question mixed OA can be taken, refreshed mid-way without loss, auto-submitted at time-out, and scored exactly (verified by unit tests on scoring and an e2e test).

### Phase 5: SQL and DBMS, college and placement (P0)

Depends on: Phase 1 (engines and UI primitives); Phase 2 (MCQ engine); Phase 4 for SQL items
inside OAs. Full specification: Section 8.2. Sub-phases are ordered by priority.

**5A. Data and verification infrastructure (P0)**
- [ ] (BLOCKED: needs the learner's answer to decision D-SQL-1) Create the private college-content folder (`content-private/college/`, git-ignored) and a loader that includes it when present and shows "college material not loaded" otherwise
- [ ] `SourceDocument` registry for all audited files (8.2.2), with status flags
- [ ] Institute dataset: 7-table schema from Lab A3, ≥ 10 rows per table, plus hidden edge-case variants (8.2.4 E). MySQL DDL and SQLite DDL kept in sync
- [ ] Placement datasets (`company`, `shop`, `events`, `school`, `ledger`) with hidden edge-case variants
- [ ] `scripts/verify-sql-mysql.mjs`: starts or uses a disposable Docker `mysql:8.0`, loads datasets, runs every reference solution, captures expected output, records the MySQL version; fails CI on any mismatch
- [ ] sql.js Web Worker engine (lazy-loaded, 3 s timeout, `PRAGMA foreign_keys = ON`, reset per run)
- [ ] `sqlCompare.ts` + unit tests (order, NULLs, floats, duplicates, column-name policy), including tests that the learner's documented wrong queries (8.2.4) **fail** on the hidden datasets

**5B. College question bank (P0)**
- [ ] Transcribe official Assignment 1 Q1–Q17 into `CollegeQuestion` records (render PDF pages to images for Q7, Q8 and Q10–Q17; restore "→" arrows), with official answers, PrepForge step-by-step solutions and verification by the FD engine
- [ ] Import Lab A2 tasks (about 20) and write-up viva questions (about 15) with MySQL solutions and expected behaviour; verify on MySQL
- [ ] Import all 71 Lab A3 prompts with original text, sheet notes, MySQL and SQLite solutions, and expected outputs; verify on MySQL
- [ ] Import slide exercises (slide 23 after visual transcription, slide 37, slides 58–59)
- [ ] Learner-solution review: attach the learner's own answers (from their `.sql` files and submissions) as "Your submitted answer", with execution-based feedback; confirm or retract each static-review finding in 8.2.4 by running it
- [ ] Inspect `dbms Assignment 2.pdf` (scanned) visually and record what it is

**5C. Theory content (P0 for Units I–IV, P1 for V–VI)**
- [ ] Notes for every topic in 8.2.5 meeting Section 11 (definitions, syntax, worked examples, diagrams for architecture / ER / B+ trees / schedules, common mistakes, revision notes, ≥ 5 flashcards)
- [ ] MCQ bank: ≥ 300 SQL/DBMS MCQs with explanations, misconceptions, topic, difficulty and provenance
- [ ] Interview question bank: ≥ 80 with model answers
- [ ] Long-answer model answers with key-point checklists for the main exam topics (Codd's rules, 3-level architecture, file system vs DBMS, normal forms with examples, ACID, 2PL, deadlock handling, 2PC, parallel DB architectures, …)

**5D. Practical SQL (P0)**
- [ ] SQL editor page (schema browser, run, result grid, errors, history, reset, dialect notes)
- [ ] Exercise page (hints, check answer on visible + hidden datasets with row diff, explanation, wrong-approach notes, bookmarks, notes)
- [ ] ≥ 60 PrepForge-original exercises, beginner → advanced, covering every SQL topic in 8.2.5
- [ ] LeetCode SQL 50 list mapped to topics, with original hint ladders; curate the 55 free extra LeetCode Database problems; HackerRank, StrataScratch and DataLemur curated lists with link checks

**5E. Interactive tools (P1)**
- [ ] FD toolkit + unit tests reproducing Assignment 1 answers
- [ ] Relational algebra evaluator + tests
- [ ] Schedule / serialisability analyser + 2PL and timestamp-ordering drills + tests
- [ ] ER → relational mapping exercises; B+ tree visualiser

**5F. College Exam mode and tests (P0 once 5B exists)**
- [ ] Unit → topic → type → difficulty browser with separate progress per family
- [ ] Unit tests, ISE/ESE-style mock papers (template labelled "format assumed" until real papers exist), timed lab-practical mocks, viva drills
- [ ] Exam date countdowns and a weak-unit summary on the dashboard
- [ ] "Missing college materials" panel (8.2.3), visible until resolved

**Acceptance:** all criteria in Section 8.2.9 are met. In addition: a wrong query never shows
as correct; a reference-equivalent query with a different column or row order (when order
doesn't matter) passes; infinite recursive CTEs are stopped by the timeout; every displayed
expected output came from a real execution.

### Phase 6: OOP in C++ and Java (P0)

Depends on: Phase 2 (MCQ engine). Code verification needs `scripts/verify-code.mjs`.

- [ ] `scripts/verify-code.mjs` (g++ / javac compile, run, compare with `expectedOutput`; record compiler version)
- [ ] C++ topics content (Section 8.3), all output and compile-error questions verified
- [ ] Java topics content (Section 8.4), all output and compile-error questions verified
- [ ] LLD practice set (6 problems)

**Acceptance:** `npm run verify:code` passes for every `verify: true` snippet; each topic meets Section 11.

### Phase 7: CN, OS, System Design, DevOps, Core CS (P1)

Depends on: Phase 2.

- [ ] CN content + subnet calculator + the three required scenario walkthroughs
- [ ] OS content + CPU scheduling simulator + page replacement simulator (each with unit-tested algorithms)
- [ ] System design foundations + 10 case studies (new-grad vs senior callouts)
- [ ] DevOps content (core and advanced tracks) + YAML/Dockerfile debugging questions + local mini-labs
- [ ] Core CS rapid-fire bank + security fundamentals

**Acceptance:** each module has a navigable curriculum with all topics either Complete or honestly Planned; the simulators match hand-computed textbook examples in unit tests.

### Phase 8: Companies and mock interviews (P1)

Depends on: Phases 3–4; company research tasks in Phase R.

- [ ] Company content files for Google and Amazon (verified facts), plus Meta, Apple, Netflix, Zscaler and Microsoft, with only verified facts and "not yet verified" labels
- [ ] Company page template; per-company readiness weighting; practice-simulation assessments; STAR story builder
- [ ] Mock interviews (coding, behavioural, system design) with timers and self-assessed rubrics

**Acceptance:** every factual company claim has a source URL and a verified-on date; no compensation or frequency claims exist.

### Phase 9: Content expansion (P0 for DSA, P1 for others)

Depends on: the respective module phases.

- [ ] All 40 DSA topics Complete
- [ ] Authored walkthroughs for all Blind 75 problems, then all NeetCode 150
- [ ] SQL/DBMS, OOP, CN, OS, SD and DevOps topics all Complete
- [ ] Recognition drill bank (≥ 100 "which pattern?" items from problem summaries)

### Phase 10: QA, hardening and release (P0)

Depends on: everything shipped.

- [ ] Full test suite, lint, typecheck, production build
- [ ] Playwright e2e for the core flows (Section 14) plus viewport screenshots at 7 widths
- [ ] Accessibility pass (axe via Playwright, keyboard-only walkthrough, contrast)
- [ ] Link check passes; console free of errors and warnings on all routes
- [ ] Performance: initial JS under ~400KB gzip excluding content chunks; sql.js lazy-loaded; content split per module if needed
- [ ] README: run, deploy, storage, limitations; update this file

### Phase 11: Optional integrations (P2, all optional; the app must work without them)

- [ ] (BLOCKED: requires an API key and a server-side proxy; adds cost) AI coach via the Claude API behind a serverless function. Guiding questions, reasoning review, incremental hints. Key server-side only.
- [ ] (BLOCKED: requires self-hosting or a paid API) Real C++/Java execution via Judge0
- [ ] (P2) Cloud sync (e.g., Supabase) for cross-device progress
- [ ] (P2) Dark mode (tokens already structured for it)

---

## 14. Testing and QA

**Quality gates (run before ticking any phase):**

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Plus `npm run test:e2e`, `npm run verify:code` and `npm run check:links` before releases.

**Unit tests (engine):** mastery (no evidence, mixed evidence, confidence thresholds,
studied-but-cannot-apply), SM-2 intervals and lapses, due ordering, readiness (decay,
thresholds, company weighting), plan allocation within budget, OA scoring (multi-select,
unanswered, self-reported exclusion), SQL result comparison, scheduling and page
replacement simulators, store migration and import validation.

**E2E flows:** first run → settings → dashboard empty states; topic → MCQs → reload →
progress persists; coach with hints → outcome → revision card created → due date correct;
OA → mark for review → reload mid-test → auto-submit → results correct; SQL exercise wrong
then right; export → reset → import; mobile drawer navigation; search navigation.

**Responsive and visual:** screenshots of the dashboard, a topic page, the coach, the OA
runner, the SQL lab and analytics at 320, 375, 768, 1024, 1440, 1920 and 2560. Check for:
no horizontal overflow (`document.documentElement.scrollWidth <= innerWidth`), readable code
blocks, tables scrollable, touch targets ≥ 44px.

**Honesty checks:** grep the content for "asked at", "frequently asked by", "LPA", "guarantee"
and "%" claims without sources; no "passed" UI without execution; every Planned topic is shown
as Planned.

**Test log** (append actual runs; never record tests as passing that were not run):

| Date | Command | Result |
|---|---|---|
| — | — | No tests exist yet (session 1: planning only) |

---

## 15. Definition of done

The project is complete only when **all** of these are verified:

- [ ] Every core subject has a navigable curriculum (all topics Complete or explicitly Planned with a phase)
- [ ] Topics contain real educational content meeting Section 11
- [ ] MCQs work and show explanations; attempts are logged
- [ ] Practice questions are organised, filterable and searchable
- [ ] DSA questions have a working solve-and-hint workflow (Problem-Solving Coach)
- [ ] Progress persists across reloads; export and import work
- [ ] Weaknesses (error categories, studied-but-cannot-apply) and revision needs are tracked
- [ ] Timed assessments work (timer, autosave, resume, submit, auto-submit)
- [ ] Results are calculated accurately (unit-tested)
- [ ] Company-specific preparation is available with sourced facts
- [ ] The interface works at 320–2560px (screenshots reviewed)
- [ ] The production build succeeds
- [ ] Major flows are covered by e2e tests that were actually run
- [ ] Missing content and limitations are documented honestly in this file and the README

---

## 16. Blockers and known limitations

| # | Blocker / limitation | Impact | Workaround / decision |
|---|---|---|---|
| B1 | WebSearch and WebFetch tools failed (model config error) in session 1 | Slower research | Use `curl`, Python text extraction (`research` scripts) or the in-app browser |
| B2 | LeetCode pages return 403 to non-browser clients | Plain HTTP link checks fail | Verify via the LeetCode GraphQL API (works) |
| B3 | neetcode.io is an SPA (200 for any path) | Per-problem NeetCode URLs are unverifiable | Use the verified YouTube IDs + `neetcode.io/practice` |
| B4 | LeetCode company tags are Premium-only | No verified per-problem company tags | Do not show them; company pages use sourced facts + labelled recommendations |
| B5 | Local g++ is 6.3 (C++14) | C++17/20 snippets can't be verified locally | Install a modern GCC (MSYS2) **or** write verified snippets in C++14 and mark the standard |
| B6 | No in-browser C++/Java execution | Coding answers can't be auto-judged | Self-reported outcomes (labelled) + LeetCode links; Judge0 optional (Phase 11) |
| B7 | No AI API configured | No interactive AI coach | Deterministic coach in v1; optional proxy in Phase 11 |
| B8 | localStorage is per-browser and per-device | Progress is not synced; clearing site data deletes it | Export/import JSON; warn in Settings; optional cloud sync (Phase 11) |
| B9 | The Meta Full Loop guide is a PDF download | Meta rounds unverified | Ask the user before downloading; label as unverified meanwhile |
| B10 | sql.js uses SQLite, while the college lab and LeetCode use MySQL | Some syntax and behaviour differ; MySQL-only tasks can't run in the browser | Dual reference solutions; every MySQL solution verified offline on MySQL 8.0 (Docker); clear "where it was executed" labels (Section 8.2.7) |
| B11 | The official DBMS 0505163 unit-wise syllabus and the lab experiment list are missing | Unit mapping is provisional; possible uncovered syllabus items | Use the instructor's 6-unit plan, labelled provisional; learner to provide (8.2.3) |
| B12 | The instructor slides show an older exam scheme (30/70 + oral 25) that conflicts with the AY 2026-27 MD-6 scheme (20/20/60, lab TW 25) | Practice-paper formats are uncertain | Configurable paper templates labelled "format assumed" until question papers arrive |
| B13 | Assignment 1 Q10–Q17 and the table instances in Q7, Q8 and Q14 are images; PDF text extraction also drops "→" | Requires manual visual transcription | Render pages to images and transcribe; cross-check with the derived notes; verify with the FD engine |
| B14 | **The repository is public**, and college sheets are institutional material containing the learner's identity in submissions | Committing them may expose personal data or third-party content | Decision D-SQL-1 pending; nothing from college files has been committed (only metadata, short labels and PrepForge's own analysis) |
| B15 | Learner's A3 answers were reviewed statically only | Findings in 8.2.4 might be wrong in edge cases | Mark them `needs-validation`; confirm by MySQL execution in Phase 5B |

---

## 17. Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-10-11 | Product name is **PrepForge** (replaces the working name PlacementOS); storage key `prepforge:v1` | User instruction; matches the GitHub repository |
| 2026-10-11 | Push to `origin main` after every completed task or checkpoint | User instruction ("keep pushing") |
| 2026-10-11 | Static local-first SPA: Vite + React + TS, Zustand + localStorage | Greenfield; single learner; free deploy; offline; minimal dependencies |
| 2026-10-11 | Plain CSS tokens + CSS Modules instead of Tailwind or a UI kit | `DESIGN.md` defines tokens; fewer dependencies; full control of the look |
| 2026-10-11 | sql.js in a Web Worker for real SQL execution | Genuinely sandboxed, no server, honest grading |
| 2026-10-11 | No code execution or AI in v1; deterministic coach with honest labels | Spec forbids fake functionality; avoids paid services |
| 2026-10-11 | One canonical problem record per LeetCode slug; lists as badges | Spec requires de-duplication across lists |
| 2026-10-11 | Accents used as small subject markers, not full-fill cards; darker semantic text colours | Learning UX and WCAG AA |
| 2026-10-11 | SM-2 variant for spaced repetition | Well understood, deterministic, easy to unit-test; FSRS can replace it later behind the same interface |
| 2026-10-11 | Evidence-based mastery separate from completion; readiness shows evidence and confidence | Spec: reading must not equal interview-ready; no arbitrary percentages |
| 2026-10-11 | DSA is built first and used as the pilot for every engine | Highest-priority gap (unfamiliar OA questions) |
| 2026-10-11 | SQL/DBMS becomes a self-contained module serving college theory, the DBMS lab and placements, with units, relevance tags and separate progress families | User requirement (single preparation resource) |
| 2026-10-11 | MySQL 8.0 is the reference dialect for SQL solutions (college lab and LeetCode both use it); SQLite (sql.js) runs in the browser | College lab uses MySQL; no practical in-browser MySQL exists |
| 2026-10-11 | Grade SQL on visible **and hidden edge-case datasets** | Catches the learner's actual mistake patterns (zero-count groups, NULLs, date boundaries) |
| 2026-10-11 | Classmate's submissions are excluded from all imports | Privacy |
| 2026-10-11 | Derived and AI-generated notes are cross-references only, never authoritative | Unknown provenance |
| **PENDING** | **D-SQL-1: storage of college materials.** Options: (A) keep verbatim college content in a git-ignored `content-private/college/` loaded only in local builds, with the public repo holding mappings and PrepForge's own solutions (**recommended**); (B) make the GitHub repo private and commit everything; (C) commit to the public repo (not recommended: personal data and institutional material) | Repo is public (B14). Awaiting the learner's choice |

---

## 18. Session log

| Session | Date | Summary |
|---|---|---|
| 1 | 2026-10-11 | Audited the repo (greenfield). Verified 383 DSA problems + SQL 50 via LeetCode GraphQL and NeetCode/A2Z sources (saved in `research/`). Verified Google and Amazon hiring facts from official pages. Created this roadmap. Renamed the product to PrepForge, initialised git, and pushed to `SanTiwari07/PrepForge`. **No application code written** (per the user's instruction). Next: Phase 0. |
| 1b | 2026-10-11 | Expanded SQL/DBMS into a college + placement module (Section 8.2, Section 6.3, Phase 5). Audited the college files on the learner's PC (not in the repo): official Assignment 1 (17 Q with solutions), Lab A2 (DDL, about 20 tasks) and A3 (71 prompts), Unit I slides, syllabus PDFs (no DBMS unit syllabus), the learner's own SQL and submissions. Static review found likely bugs in several of the learner's A3 answers (to be validated by execution). Verified the LeetCode Database list (323; 105 free). Listed missing materials (8.2.3). Opened decision D-SQL-1. No app code written. |
