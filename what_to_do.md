# PrepForge: Master Roadmap and Source of Truth

> **This file is the persistent source of truth for the project.** Every session must read
> it first, work from the "Next actions" list, and update it before stopping: tick
> completed tasks, record decisions in the Decision Log, and record blockers in Blockers.
> If the code and this file disagree, fix one of them in the same session.

| | |
|---|---|
| Product name | **PrepForge** (the working name "PlacementOS" was replaced at the user's request) |
| Repository | `https://github.com/SanTiwari07/PrepForge.git` (public), branch `main`, local folder `D:\Projects\PlacementResource` |
| Production | **https://prep-forge-omega.vercel.app** (Vercel, auto-deploys every push to `main`; GitHub shows each deploy under Deployments → Production) |
| Last updated | 2026-10-12 (session 4: SQL 14/14 with 120 exercises and 3 new datasets, DBMS 16/16, C++ 15/15, Java 15/15, CN 17/17, OS 15/15, System Design 26/26 plus 6 LLD problems, DevOps 11/11, Core CS 5/5 (all 180 catalogued topics Complete), schedule analyser, Vercel blank-page fix) |
| Target role | **Fresher / new-grad (SDE-1, internship-to-FTE)** at big product companies. College syllabi and assignments are out of scope (user decision) |
| Current phase | Phase 9, Content expansion (Phases 0–4 done; **DSA 40/40, SQL 14/14, DBMS 16/16, C++ 15/15, Java 15/15, CN 17/17, OS 15/15, System Design 32/32, DevOps 11/11, Core CS 5/5 complete: every catalogued topic**; other subjects partly complete, the rest honestly labelled Planned). Phase 10 QA largely done (e2e, axe, link check, performance split) |
| Overall status | Working app with **180 complete topics out of 180 catalogued** (DSA 40/40, SQL 14/14, DBMS 16/16, C++ 15/15, Java 15/15, CN 17/17, OS 15/15, System Design 32/32 including the 6-problem LLD practice set, DevOps 11/11, Core CS 5/5), **1,235 MCQs**, **417-problem bank** (383 from public lists + 34 curated, all verified via LeetCode GraphQL), **158 coach walkthroughs** (Blind 75 75/75, NeetCode 150 150/150, Top Interview 150 77/150, LeetCode 75 21/75), SQL lab with real execution (120 exercises over 6 datasets), OA centre, revision (SM-2), readiness, companies, mocks, 7 tools. 584 unit tests pass (33 Playwright e2e tests pass, re-run in session 7); 687 C++/Java samples compile (and run where output is claimed), 0 skipped; 350/356 links checked automatically (1 csapp.cs.cmu.edu outage, 5 bot-walled Cloudflare pages). |

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

1. Content is complete for every catalogued topic (180/180). What remains is depth, tools and polish, in this order:
2. SQL/DBMS gaps: MySQL verification only (the 120-exercise target is met; the isolation simulator and B+ tree visualiser are done).
3. Walkthroughs: Blind 75 and NeetCode 150 are complete (158 authored). Remaining gaps: Top Interview 150 (73 without one) and LeetCode 75 (54). Method: write both languages with a test `main` (and randomised brute-force checks for tricky ones), run them, then embed (generator kept in the session scratch; see the session 6 log).
4. Performance: B14 is mostly resolved (walkthroughs now load from their own lazy chunk, only on problem pages that have one: DSA lessons pack 221 KB gzip, walkthrough chunk 138 KB gzip); B15 (eager content index 127 KB gzip) remains: load per-module metadata lazily. Any new lazy chunk must follow `chunking.ts`.
5. `scripts/verify-sql-mysql.mjs` with Docker `mysql:8.0` (Docker Desktop is installed but was not started in session 3).

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
- **Target level: fresher / new grad** (SDE-1, campus or off-campus new-grad hiring, internship-to-FTE). Every module is calibrated to what new-grad OAs and interview loops test: DSA under time pressure first; CS fundamentals (DBMS, OS, CN, OOP) at interview depth; low-level design and *basic* system design. Senior-level material appears only in clearly labelled advanced tracks.
- **Out of scope:** college syllabi, college assignments and university exam preparation (user decision, 2026-10-11).
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
| `/oa` | OA Centre: presets, custom builder, history |
| `/oa/run/:attemptId` | Assessment runner (full-screen, timer) |
| `/oa/results/:attemptId` | Results and review |
| `/mock` | Mock interviews (coding, behavioural, system design) |
| `/revision` | Due today, flashcards, revision sheets, recall tests |
| `/mistakes` | Mistake journal (by error category and topic) |
| `/notes` | Notes and bookmarks |
| `/companies`, `/companies/:companyId` | Company tracks |
| `/analytics` | Readiness model with evidence |
| `/tools/:toolId` | CPU scheduling, page replacement, subnet calculator, FD toolkit (closure, keys, superkeys, NF, lossless, dependency preservation), schedule / serialisability analyser, isolation-anomaly simulator, B+ tree visualiser, Big-O growth |
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

### 6.3 SQL extensions (see Section 8.2)

```ts
type Verification = 'verified-mysql' | 'verified-sqlite' | 'verified-algorithm' | 'needs-validation';

interface SqlDataset { id: string; title: string; schemaSql: string; seedSql: string;
  hidden: { id: string; purpose: string; seedSql: string }[] }  // edge-case variants used in grading

// SqlExercise (6.1) is extended with:
//   engine: 'sqlite-ok' | 'mysql-only'; referenceMysql: string; referenceSqlite?: string;
//   expectedMysqlOutput?: string[][];  // captured by scripts/verify-sql-mysql.mjs
//   targetMinutes: number; verification: Verification; similarTo?: string[]  // e.g. a LeetCode slug

// SQL progress is stored separately from concept reading and MCQs:
//   sqlAttempts[]: { exerciseId, at, sql, passedVisible, passedHidden: string[],
//                    failedHidden: string[], hintsUsed, durationSec, errorCategories, timed }
```

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
- [x] `dsa.complexity` (F): Big-O, Big-Θ, Big-Ω; best/avg/worst; amortised analysis; recurrences and the Master theorem (intro); reading constraints → target complexity (n ≤ 10^5 → O(n log n), and so on)
- [x] `dsa.recursion` (F): call stack, base cases, recursion trees, tail recursion, recursion → iteration
- [x] `dsa.stl-collections` (F): C++ STL (vector, string, unordered_map/set, map/set, priority_queue, deque, stack, queue, algorithms, lower_bound) and Java Collections (ArrayList, HashMap, TreeMap, ArrayDeque, PriorityQueue, Collections/Arrays); complexity of each; common pitfalls
- [x] `dsa.math` (F): GCD/LCM, primes and the sieve, modular arithmetic, fast exponentiation, combinatorics basics, overflow

Arrays and hashing
- [x] `dsa.arrays-strings` (F): traversal, in-place techniques, string building, char counting
- [x] `dsa.hashing` (F): hash maps and sets, frequency counting, complement lookup, grouping by key
- [x] `dsa.prefix-sums` (C): prefix sums, subarray sum = k with a hashmap, 2D prefix sums, **difference arrays**
- [x] `dsa.kadane` (C): maximum subarray, max-product variant, circular variant

Problem-solving patterns
- [x] `dsa.two-pointers` (C): opposite ends, same direction, partitioning, k-sum
- [x] `dsa.sliding-window` (C): fixed, variable (longest/shortest), counting with "at most k" decomposition
- [x] `dsa.binary-search` (C): classic, boundaries (lower/upper bound), rotated arrays, **binary search on the answer**
- [x] `dsa.fast-slow-pointers` (C): cycle detection, middle node, Floyd's algorithm on arrays
- [x] `dsa.monotonic-stack-queue` (C): next greater/smaller, histogram, sliding window maximum (deque)
- [x] `dsa.intervals` (C): sort and merge, insert, overlap counting, sweep line, meeting rooms
- [x] `dsa.greedy` (C): exchange arguments, interval scheduling, jump game, when greedy fails
- [x] `dsa.divide-conquer` (C): merge sort, quickselect, counting inversions
- [x] `dsa.bit-manipulation` (C): bit tricks, XOR properties, masks, counting bits

Data structures
- [x] `dsa.linked-lists` (F): reversal, dummy nodes, merge, reorder, LRU-style use
- [x] `dsa.stacks-queues` (F): parentheses, expression evaluation, queue via stacks, deque
- [x] `dsa.binary-trees` (C): DFS traversals (recursive and iterative), BFS level order, height/diameter, path problems, construction from traversals, serialisation
- [x] `dsa.bst` (C): search/insert/delete, validation, inorder properties, kth smallest, LCA
- [x] `dsa.heaps` (C): heapify, top-k, k-way merge, two heaps (median), scheduling
- [x] `dsa.tries` (C): insert/search/prefix, word search II, XOR trie (advanced)
- [x] `dsa.graphs` (C): representations, BFS/DFS on grids and graphs, connected components, cycle detection (directed and undirected), bipartite
- [x] `dsa.dsu` (C): union-find with path compression and union by rank; Kruskal; dynamic connectivity
- [x] `dsa.fenwick-segment` (A): Fenwick tree, segment tree (point update / range query), lazy propagation (advanced)

Algorithms
- [x] `dsa.sorting` (F): bubble/insertion/selection (for analysis), merge, quick, heap, counting/bucket, stability, custom comparators (C++ and Java)
- [x] `dsa.topological-sort` (C): Kahn's algorithm and DFS ordering, course schedule, alien dictionary
- [x] `dsa.shortest-paths` (C): BFS on unweighted graphs, 0-1 BFS, Dijkstra, Bellman-Ford, Floyd-Warshall, when to use which
- [x] `dsa.mst` (C): Kruskal, Prim, proofs by cut property (intuition)
- [x] `dsa.backtracking` (C): subsets, permutations, combinations, pruning, N-Queens, word search
- [x] `dsa.dp-1d` (C): recognising DP, state, transition, base case, memoisation → tabulation → space optimisation; climbing stairs, house robber, coin change, word break, LIS (O(n²) and O(n log n))
- [x] `dsa.dp-2d` (C): grids, LCS, edit distance, knapsack (0/1 and unbounded), DP on strings, stock problems (state machine)
- [x] `dsa.dp-advanced` (A): interval DP (MCM, burst balloons), bitmask DP, DP on trees, digit DP (intro)
- [x] `dsa.advanced-graphs` (A): SCC (Kosaraju/Tarjan), bridges and articulation points, Eulerian path (reconstruct itinerary)
- [x] `dsa.string-matching` (A): KMP (prefix function), Z-algorithm, Rabin-Karp rolling hash

Additional interview topics
- [x] `dsa.matrix` (C): traversal orders, rotation, spiral, in-place marking, search in a sorted matrix
- [x] `dsa.design-ds` (C): LRU cache, min stack, LFU (advanced), iterator design, time-based KV store
- [x] `dsa.implementation` (C): simulation, careful indexing, parsing, OA-style long statements
- [x] `dsa.advanced-patterns` (A): meet in the middle, coordinate compression, sweep line, randomisation, two-heap and multi-pointer combinations

**Default roadmap order:** complexity → stl-collections → arrays-strings → hashing → two-pointers → sliding-window → prefix-sums → kadane → binary-search → stacks-queues → monotonic-stack-queue → linked-lists → fast-slow → recursion → binary-trees → bst → heaps → backtracking → intervals → greedy → graphs → topological-sort → dsu → shortest-paths → dp-1d → dp-2d → tries → bit-manipulation → matrix → sorting/divide-conquer → design-ds → math → mst → implementation → (advanced track) fenwick-segment, dp-advanced, advanced-graphs, string-matching, advanced-patterns.

### 8.2 SQL and DBMS (fresher / new-grad placement focus)

> **Scope (user decision, 2026-10-11):** this module targets **fresher (SDE-1 / new-grad)
> interviews and online assessments at big product companies only**. College syllabi,
> assignments and exam preparation are **out of scope**. Do not import or reference college
> material. Depth is chosen by what new-grad loops and OAs actually test: SQL query writing
> under time pressure, DBMS concept questions in interviews, and DBMS MCQs in mixed OAs.

#### 8.2.1 What freshers are tested on (drives priorities)

| Where it shows up | What is tested | Priority |
|---|---|---|
| Coding OAs and SQL rounds (e.g., LeetCode-style SQL, HackerRank SQL sections) | Writing correct queries fast: joins, aggregation, subqueries, window functions, edge cases (NULLs, ties, empty groups) | **P0** |
| Mixed OAs with CS-fundamentals MCQs | Keys, FDs and normalisation numericals, joins and output prediction, transactions and isolation, indexing | **P0** |
| Technical interviews (core CS round or project discussion) | Explaining ACID, isolation levels, indexing (B+ trees, clustered vs secondary), normalisation trade-offs, SQL vs NoSQL, transactions and locking, schema design for a feature | **P0** |
| Low-level design and new-grad system design | Data modelling for a feature, choosing keys and indexes, basic replication and sharding vocabulary | P1 (linked to System Design) |
| Database internals (query optimiser, recovery, distributed transactions) | Rarely asked of freshers; useful for strong candidates | P2 (advanced track) |

Verified official signal: Amazon's SDE interview topics page lists **Databases** among the
technical topics (Section 8.11). No other company-specific SQL claims are made without a source.

#### 8.2.2 Curriculum

Tags: **[Q]** query writing · **[C]** concept / interview · **[A]** advanced track.

**SQL querying (P0)**
- [x] `sql.select-basics` [Q]: SELECT, WHERE, ORDER BY, LIMIT/OFFSET, DISTINCT, LIKE, IN, BETWEEN, aliases, logical query processing order (FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT)
- [x] `sql.null-handling` [Q][C]: three-valued logic, IS NULL, COALESCE/IFNULL, NULLs in aggregates, joins and comparisons, the `NOT IN` + NULL trap
- [x] `sql.aggregation` [Q]: aggregate functions, GROUP BY, HAVING vs WHERE, COUNT(*) vs COUNT(col) vs COUNT(DISTINCT), **zero-count groups**
- [x] `sql.joins` [Q][C]: INNER, LEFT, RIGHT, FULL (MySQL emulation via UNION), CROSS; anti-joins and semi-joins; **join row multiplication**; join vs subquery
- [x] `sql.self-joins` [Q]: comparing rows, manager–employee, pairs, consecutive rows without window functions
- [x] `sql.subqueries` [Q]: scalar, IN, correlated, EXISTS / NOT EXISTS, ANY / ALL, derived tables
- [x] `sql.set-operations` [Q]: UNION vs UNION ALL, INTERSECT and EXCEPT (with emulation)
- [x] `sql.cte` [Q]: WITH, chained CTEs, recursive CTEs (hierarchies, number series)
- [x] `sql.window-functions` [Q][C]: OVER, PARTITION BY, ORDER BY, frames; ROW_NUMBER / RANK / DENSE_RANK; LAG / LEAD; NTILE; running totals; moving averages
- [x] `sql.case-conditional-agg` [Q]: CASE, conditional aggregation, pivoting rows to columns
- [x] `sql.date-string-functions` [Q]: date arithmetic and extraction (MySQL vs SQLite differences), date-boundary pitfalls, string functions, LIKE vs REGEXP
- [x] `sql.patterns` [Q]: duplicates, Nth highest, top-N per group, relational division ("for all"), consecutive records and gaps-and-islands, first/last event per user, retention and cohorts, year-over-year, median
- [x] `sql.dml-ddl` [Q][C]: INSERT / UPDATE / DELETE, CREATE / ALTER, constraints (PK, FK, UNIQUE, CHECK, NOT NULL, DEFAULT), referential actions, DELETE vs TRUNCATE vs DROP, views and when they are updatable

**DBMS concepts (P0 unless marked)**
- [x] `dbms.relational-basics` [C]: relation, tuple, attribute, schema vs instance; DBMS vs file system (the interview version: why databases exist)
- [x] `dbms.keys-constraints` [C]: super, candidate, primary, alternate, foreign and composite keys; prime attributes; integrity constraints
- [x] `dbms.er-modelling` [C]: entities, attributes, relationships, cardinality, weak entities; **ER → tables**; design exercises for typical product features (e-commerce orders, ride booking, social follows)
- [x] `dbms.relational-algebra` [C]: σ, π, ⋈, ∪, −, ×, ÷ at OA-MCQ depth (output size and equivalence questions)
- [x] `dbms.functional-dependencies` [C]: FDs, Armstrong's axioms, **attribute closure**, candidate keys from FDs, prime attributes, superkey counting (common OA MCQs)
- [x] `dbms.normalisation` [C]: anomalies, 1NF, 2NF, 3NF, BCNF; finding the highest normal form; lossless join and dependency preservation; **when to denormalise** (interview trade-off)
- [x] `dbms.transactions-acid` [C]: transactions, ACID with concrete failure examples, commit and rollback
- [x] `dbms.isolation-concurrency` [C]: dirty read, non-repeatable read, phantom, lost update; READ UNCOMMITTED → SERIALIZABLE; locks (shared/exclusive), 2PL, MVCC (how InnoDB and PostgreSQL avoid read locks), optimistic vs pessimistic locking
- [x] `dbms.serialisability` [C]: conflict serialisability via precedence graphs, recoverable and cascadeless schedules (OA MCQs)
- [x] `dbms.deadlocks` [C]: how deadlocks happen in databases, detection and wait-for graphs, prevention (lock ordering, timeouts), wait-die / wound-wait
- [x] `dbms.indexing` [C]: why indexes speed reads and slow writes; B-tree vs B+ tree; clustered (InnoDB primary key) vs secondary indexes; composite indexes and the leftmost prefix; covering indexes; hash indexes; when an index is not used (functions on columns, low selectivity, leading wildcard)
- [x] `sql.explain-optimisation` [C][Q]: reading `EXPLAIN` (MySQL) / `EXPLAIN QUERY PLAN` (SQLite), sargable predicates, rewriting correlated subqueries, keyset vs offset pagination, N+1 queries
- [x] `dbms.sql-vs-nosql` [C]: relational vs document, key-value, wide-column and graph stores; choosing for a use case; schema flexibility vs consistency
- [x] `dbms.replication-sharding` [C] (P1): leader–follower replication, replication lag, read replicas, partitioning and sharding keys, hotspots (links to System Design 8.7)
- [x] `dbms.storage-recovery` [A] (P2): pages, buffer pool, write-ahead logging, crash recovery intuition
- [x] `dbms.query-processing` [A] (P2): join algorithms (nested-loop, hash, sort-merge), cost-based optimisation intuition
- [x] `dbms.distributed-transactions` [A] (P2): two-phase commit, why it is avoided at scale, sagas (links to System Design)

**Default order:** select-basics → null-handling → aggregation → joins → self-joins →
subqueries → set-operations → case-conditional-agg → cte → window-functions →
date-string-functions → patterns → dml-ddl, interleaved with keys → ER → normalisation and FDs →
transactions → isolation → indexing → explain → SQL vs NoSQL → (P1/P2 tracks).

#### 8.2.3 Practice system

Four families with **separate progress**: concept notes (completion only), MCQs, SQL
exercises (auto-graded) and interview questions, plus revision cards from mistakes.

- **MCQs:** at least 200 total. Types: concept; output prediction (given small tables, what does this query return); find the bug; FD and normalisation numericals; schedule and isolation scenarios; indexing choices. Each has an explanation, the misconception behind each distractor, topic, difficulty and provenance.
- **SQL exercises:** at least 120 PrepForge-original, auto-graded exercises from easy to hard, covering every [Q] topic and modelled on interview patterns (not copied). Every exercise has:
  - a schema;
  - a visible sample dataset;
  - an expected output generated by running the reference solution;
  - **hidden edge-case datasets** (NULLs, ties, empty groups, duplicates, date boundaries);
  - a progressive hint ladder;
  - a step-by-step explanation;
  - MySQL and SQLite reference solutions;
  - wrong-approach notes showing the wrong output each produces;
  - target solve time;
  - a verification status.
- **Interview questions:** at least 80, with model answers and follow-ups (e.g., "WHERE vs HAVING", "how does an index make lookups faster and what does it cost", "explain isolation levels with an example", "design the tables for a URL shortener", "when would you denormalise", "why is `NOT IN` dangerous with NULLs").
- **Timed SQL sets** via the OA engine (Section 8.10): 3–5 queries in 30–45 minutes, mimicking OA SQL sections.
- **SQL mistake taxonomy** (feeds the mistake journal and recommendations): wrong join type, lost zero-count groups, NULL mishandling, wrong grouping level, join row multiplication, date-boundary error, ties not handled, dialect error, misread requirement.

**Datasets (original, seeded SQL):** `company` (employees, departments, salaries, managers),
`shop` (customers, orders, order_items, products, payments), `events` (users, logins,
sessions; for streaks, retention, gaps-and-islands), `rides` (drivers, riders, trips,
cancellations), `social` (users, follows, posts, likes), `ledger` (accounts, transactions;
running balances). Each has hidden edge-case variants.

**Grading:** compare result sets on the visible dataset **and** every hidden dataset (column
count; row multiset; order only when the prompt requires it; numeric tolerance 1e-6; NULL-aware;
column names ignored unless required). On failure, show which dataset failed and a row diff.

**Interactive tools (real computation, unit-tested):** FD toolkit (closure, candidate keys,
superkey count, highest normal form, lossless and dependency-preservation checks);
schedule analyser (precedence graph, conflict serialisability); an isolation-level anomaly
simulator (two interleaved transactions stepped side by side); B+ tree insertion visualiser.

**External placement banks (verified, de-duplicated by platform + slug):**

| Bank | Verified data | Use |
|---|---|---|
| LeetCode SQL 50 | `research/sql-50.verified.json`: 50 problems, all free | The core external list, mapped to topics, each with an original PrepForge hint ladder and approach notes (no copied statements) |
| LeetCode Database | `research/leetcode-database.verified.json`: 323 problems, 105 free; **55 free beyond SQL 50** (23 E, 22 M, 10 H) | Curate the 55 free extras into topics (window functions, gaps-and-islands, hard patterns); Premium problems listed as "Premium" only |
| HackerRank SQL | `https://www.hackerrank.com/domains/sql` (real 404s, so per-challenge URLs are HTTP-verifiable) | Speed drills for OA-style SQL |
| DataLemur, StrataScratch | Question pages HTTP-verifiable | Interview-style SQL; free questions only; every URL checked |
| References | CMU 15-445 `https://15445.courses.cs.cmu.edu/`, the Silberschatz book site `https://db-book.com/`, PostgreSQL window-function tutorial, SQLite docs (all return 200); MySQL 8.0 Reference Manual (returns 403 to bots, official, `httpVerifiable: false`); GeeksforGeeks DBMS (HTTP-verifiable) | Per-topic resource lists |

#### 8.2.4 Execution and verification

| Engine | Where | Used for | Label shown |
|---|---|---|---|
| sql.js (SQLite WASM) in a Web Worker | In the app | Running and grading exercises; `PRAGMA foreign_keys = ON` for FK demos | "Executed in your browser (SQLite)" |
| MySQL 8.0 | Offline: `scripts/verify-sql-mysql.mjs` against a disposable Docker `mysql:8.0` container (throwaway password in a git-ignored `.env.local`) | Verifying every MySQL reference solution and expected output, since LeetCode and most OAs default to MySQL | "Verified on MySQL 8.0" |

Verification statuses: `verified-mysql`, `verified-sqlite`, `verified-algorithm` (FD and
schedule answers computed by the toolkit), `needs-validation`. Never display "Correct" for
anything not produced by real execution or a deterministic check.

#### 8.2.5 Acceptance criteria

1. Every P0 topic in 8.2.2 meets Section 11, with links to at least one item in each family.
2. Every SQL reference solution is `verified-mysql`; every in-app exercise is `verified-sqlite` or has an explicit dialect note.
3. The grader's unit tests include classic wrong queries (inner join losing zero-count groups, `NOT IN` with NULL, off-by-one date boundaries, `RANK` vs `DENSE_RANK` mix-ups, join multiplication), and each must fail on a hidden dataset.
4. FD and schedule MCQ answers are reproduced by the toolkit.
5. Concept, MCQ, SQL-exercise and revision progress are stored and displayed separately and survive a reload.
6. A timed SQL set can be taken, auto-graded by real execution, and reviewed.

### 8.3 OOP in C++ and 8.4 OOP in Java

**Features:** practice formats are predict the output, identify the compile error, debug,
complete the missing code, "which method is called?", trace the constructor/destructor
order, class-design problems, identify OOP/SOLID violations, implement practical examples,
interview questions and language-specific MCQs. **Every code-output and compile-error
question is compile-verified** with `scripts/verify-code.mjs` (`verified: 'compiled'`).
Every question explains why the answer is correct **and** why each tempting alternative is
wrong. Topics show "In Java this differs because…" callouts, and vice versa.

**C++ topics:**
- [x] `cpp.classes-objects` (F): class vs struct, members, `this`, const member functions
- [x] `cpp.constructors-destructors` (F): default, parameterised, initialiser lists (and member init order!), delegating, explicit, destructor order, temporaries
- [x] `cpp.access-encapsulation` (F): public/protected/private, friend, invariants
- [x] `cpp.inheritance` (C): access in inheritance, constructor/destructor order, multiple inheritance, diamond and virtual inheritance
- [x] `cpp.polymorphism-virtual` (C): virtual functions, vtables (conceptual), dynamic dispatch, **static vs dynamic binding**, override/final, **virtual destructors**, calling virtuals in constructors, **object slicing**
- [x] `cpp.overloading` (C): function overloading resolution, default arguments, **operator overloading** (member vs friend, `<<`, `==`, `[]`, `++` pre/post)
- [x] `cpp.static-members` (C): static data and functions, initialisation, static locals
- [x] `cpp.copy-semantics` (C): copy constructor, copy assignment, **shallow vs deep copy**, rule of three/five/zero, copy elision
- [x] `cpp.memory-raii` (C): stack vs heap, new/delete pitfalls, **RAII**, `unique_ptr`, `shared_ptr`, `weak_ptr`, cycles
- [x] `cpp.move-semantics` (A): lvalues/rvalues, move constructor and assignment, `std::move`, noexcept moves
- [x] `cpp.abstract-interfaces` (C): pure virtual functions, abstract classes as interfaces
- [x] `cpp.composition-association` (C): composition vs aggregation vs association, has-a vs is-a
- [x] `cpp.exceptions` (C): try/catch/throw, stack unwinding, exception safety, noexcept
- [x] `cpp.templates` (A): function and class templates, specialisation (intro), templates vs Java generics
- [x] `cpp.solid-patterns` (C): SOLID in C++; Singleton, Factory, Strategy, Observer, Decorator, Adapter (with C++ idioms)

**Java topics:**
- [x] `java.classes-objects` (F): classes, references vs objects, `this`, pass-by-value of references
- [x] `java.constructors-init` (F): constructor chaining (`this()`/`super()`), **initialisation order** (static blocks, instance initialisers, field defaults)
- [x] `java.access-packages` (F): private/default/protected/public, packages, encapsulation
- [x] `java.inheritance` (C): extends, super, constructor chaining, `Object` methods
- [x] `java.polymorphism` (C): dynamic dispatch, **fields are not polymorphic**, **static method hiding**, private/final methods, covariant returns, casting and `ClassCastException`
- [x] `java.overloading-resolution` (C): widening vs boxing vs varargs priority, ambiguity errors
- [x] `java.abstract-interfaces` (C): abstract classes vs interfaces, default and static methods, diamond resolution, functional interfaces
- [x] `java.static-final` (C): static members, final variables/methods/classes, effectively final
- [x] `java.object-equality` (C): `==` vs `equals`, the `hashCode` contract, String pool and immutability, Integer cache
- [x] `java.exceptions` (C): checked vs unchecked, finally semantics (return-in-finally traps), try-with-resources, custom exceptions, overriding rules
- [x] `java.generics` (A): type erasure, bounded types, wildcards and PECS, generic methods, generics vs C++ templates
- [x] `java.collections-internals` (A): HashMap internals (buckets, treeification), `equals`/`hashCode` effects, fail-fast iterators, Comparable vs Comparator
- [x] `java.memory-gc` (A): stack vs heap, GC basics, references, memory leaks in Java
- [x] `java.inner-lambdas` (A): inner, static nested and anonymous classes; lambdas and method references
- [x] `java.solid-patterns` (C): SOLID in Java; the same pattern set as C++, in Java idioms

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

- [x] `cn.models` (F): OSI vs TCP/IP, encapsulation, PDUs per layer
- [x] `cn.ethernet-mac` (F): frames, MAC addresses, switches, broadcast and collision domains, VLAN basics
- [x] `cn.ip-subnetting` (C): IPv4 addressing, CIDR, subnetting and supernetting, private ranges, IPv6 basics
- [x] `cn.arp-icmp-dhcp` (C): ARP, ICMP (ping, traceroute), DHCP DORA
- [x] `cn.routing-switching` (C): routing tables, longest-prefix match, static vs dynamic routing (RIP/OSPF/BGP at interview depth)
- [x] `cn.tcp-udp` (C): TCP vs UDP, ports, headers, use cases
- [x] `cn.tcp-lifecycle` (C): 3-way handshake, 4-way termination, TIME_WAIT, sequence and ack numbers, retransmission
- [x] `cn.flow-congestion` (C): sliding window, flow control, slow start, congestion avoidance, fast retransmit and recovery
- [x] `cn.dns` (C): resolution path, record types, caching and TTL, recursive vs iterative
- [x] `cn.http` (C): HTTP/1.1 vs 2 vs 3, methods, status codes, headers, keep-alive, caching headers
- [x] `cn.tls-https` (C): TLS 1.3 handshake (interview depth), certificates, CAs and chain of trust, HTTPS
- [x] `cn.sessions-auth` (C): cookies, sessions, tokens (JWT), SameSite, CORS basics, OAuth (overview)
- [x] `cn.rest-protocols` (C): REST principles, idempotency, WebSockets, gRPC (overview), SMTP/FTP/SSH (brief)
- [x] `cn.proxies-lb` (C): forward vs reverse proxy, L4 vs L7 load balancing, CDN
- [x] `cn.nat-firewalls` (C): NAT/PAT, stateful vs stateless firewalls, security groups
- [x] `cn.sockets` (A): socket API flow (server and client), blocking vs non-blocking, select/epoll (intro)
- [x] `cn.troubleshooting` (C): ping, traceroute, dig/nslookup, curl -v, netstat/ss, tcpdump basics; scenario drills

### 8.6 Operating Systems

**Features:** a CPU scheduling simulator (FCFS, SJF, SRTF, Priority, Round Robin; Gantt
chart; waiting and turnaround times) with a "solve by hand, then check" mode; a page
replacement simulator (FIFO, LRU, Optimal; fault count and Belady's anomaly demo); Banker's
algorithm exercises; synchronisation code-output questions (C++ threads, Java threads).

- [x] `os.processes-threads` (F): process vs thread, PCB, address space, user vs kernel threads
- [x] `os.process-states` (F): state diagram, context switching cost, fork/exec/wait (Linux)
- [x] `os.cpu-scheduling` (C): algorithms, metrics, starvation and aging, multilevel queues
- [x] `os.synchronisation` (C): race conditions, critical sections, Peterson's algorithm (conceptual), mutexes, semaphores, monitors, condition variables
- [x] `os.classic-problems` (C): producer-consumer, readers-writers, dining philosophers
- [x] `os.deadlocks` (C): Coffman conditions, prevention, avoidance (Banker's), detection, recovery
- [x] `os.memory-management` (C): contiguous allocation, fragmentation, paging, segmentation
- [x] `os.virtual-memory` (C): demand paging, page faults, TLB, multi-level page tables, thrashing, working set
- [x] `os.page-replacement` (C): FIFO, LRU, Optimal, Clock, Belady's anomaly
- [x] `os.system-calls` (C): user vs kernel mode, traps and interrupts, system call flow
- [x] `os.ipc` (C): pipes, message queues, shared memory, signals, sockets
- [x] `os.file-systems` (C): inodes, directories, allocation methods, journaling, hard vs soft links
- [x] `os.io-management` (A): interrupts vs polling, DMA, disk scheduling (FCFS, SSTF, SCAN, C-SCAN)
- [x] `os.concurrency-multithreading` (C): concurrency vs parallelism, thread pools, false sharing, atomics (intro)
- [x] `os.linux-essentials` (C): processes (ps/top), signals, memory (free, /proc), OOM killer, load average

### 8.7 System Design

**Features:** foundations topics; case studies following the 11-step template;
**new-grad vs senior expectation callouts** on every case study; a back-of-envelope
calculator; a timed design-mock checklist with a self-assessed rubric (labelled).

Foundations:
- [x] `sd.requirements` (F): functional vs non-functional requirements, scoping, clarifying questions
- [x] `sd.estimation` (F): capacity estimation, powers of two, latency numbers, QPS and storage maths
- [x] `sd.latency-throughput-availability` (F): SLAs/SLOs, nines, reliability
- [x] `sd.scalability` (F): vertical vs horizontal, stateless services
- [x] `sd.load-balancing` (C): algorithms, health checks, L4/L7
- [x] `sd.caching` (C): cache-aside, write-through/back, eviction, invalidation, CDN
- [x] `sd.databases` (C): SQL vs NoSQL, indexing, data modelling for access patterns
- [x] `sd.replication-sharding` (C): replication strategies, sharding keys, consistent hashing, hotspots
- [x] `sd.consistency-cap` (C): consistency models, CAP, PACELC (intro), quorum reads/writes
- [x] `sd.messaging` (C): queues vs pub/sub, delivery semantics, idempotency, event-driven architecture
- [x] `sd.rate-limiting` (C): token bucket, leaky bucket, fixed and sliding windows
- [x] `sd.api-design` (C): REST resource design, pagination, versioning, idempotency keys
- [x] `sd.auth` (C): authentication vs authorisation, sessions vs JWT, OAuth2/OIDC (overview), RBAC
- [x] `sd.observability` (C): logs, metrics, traces, alerting, SLIs
- [x] `sd.fault-tolerance` (A): retries with backoff, timeouts, circuit breakers, bulkheads, graceful degradation
- [x] `sd.distributed-fundamentals` (A): clocks, leader election, consensus (Raft intuition), exactly-once myths

Case studies (each: clarification, functional and non-functional requirements, estimation,
high-level architecture, API, data model, components, bottlenecks and failures, scaling,
trade-offs, follow-ups):
- [x] URL shortener · [x] Rate limiter · [x] Pastebin · [x] Notification service · [x] File storage service · [x] Chat application · [x] News feed · [x] API gateway · [x] Logging and monitoring service · [x] Basic video streaming (all ten are Complete topics; see Section 13, Phase 7)

### 8.8 DevOps, Docker, Kubernetes, CI/CD and Cloud

**Features:** command-based questions, configuration reading, YAML/Dockerfile debugging
("find the bug" with the corrected version and an explanation), scenario MCQs, and mini-labs
(step lists the learner runs locally with Docker Desktop, plus expected outputs to compare
against; clearly labelled as local labs). Two tracks: **Core (interview fundamentals)** and
**Advanced**. Kubernetes depth beyond core concepts sits in Advanced, because not every SWE
interview needs it.

- [x] `devops.linux` (F): filesystem hierarchy, permissions (chmod/chown, octal), processes and signals, environment variables, pipes and redirection, grep/sed/awk/find, shell scripting basics
- [x] `devops.linux-networking` (C): ip/ss/netstat, curl, dig, ping, traceroute, nc, firewall basics
- [x] `devops.git` (F): branching, merge vs rebase, conflict resolution, reset vs revert, cherry-pick, stash, common workflows (trunk-based, GitFlow), PR etiquette
- [x] `devops.docker` (C): images vs containers, Dockerfile instructions, layers and caching, volumes vs bind mounts, networks, Compose, multi-stage builds, container security, troubleshooting
- [x] `devops.k8s-core` (C): architecture (control plane, kubelet, etcd), Pods, Deployments, ReplicaSets, Services (ClusterIP/NodePort/LoadBalancer), ConfigMaps and Secrets, namespaces, probes, requests and limits, kubectl troubleshooting (CrashLoopBackOff, ImagePullBackOff, Pending)
- [x] `devops.k8s-advanced` (A): Ingress, HPA autoscaling, PersistentVolumes and PVCs, StatefulSets, DaemonSets, Helm fundamentals, RBAC
- [x] `devops.cicd` (C): pipeline stages, artifacts, GitHub Actions (workflows, jobs, matrix, secrets, caching), deployment strategies (rolling, blue/green, canary), rollback
- [x] `devops.iac-terraform` (A): IaC principles, Terraform plan/apply/state, modules, drift
- [x] `devops.aws` (C): IAM (users, roles, policies, least privilege), VPC (subnets, route tables, IGW/NAT, security groups vs NACLs), EC2, S3, RDS, Lambda, CloudWatch
- [x] `devops.observability` (C): logs, metrics, monitoring, alerting basics
- [x] `devops.cloud-security` (C): shared responsibility, secrets management, least privilege, image scanning

### 8.9 Core CS interview questions

A cross-cutting rapid-fire bank: short Q&A with model answers, tagged to modules, used for
flashcards and mock rounds.
- [x] `core.program-execution` (F): compilation vs interpretation, compile/link/load, process memory layout (stack, heap, data, text)
- [x] `core.data-representation` (F): two's complement, floating point pitfalls, endianness, character encodings (ASCII, UTF-8)
- [x] `core.security-fundamentals` (C): CIA triad, hashing vs encryption vs encoding, symmetric vs asymmetric, digital signatures, PKI, XSS/CSRF/SQL injection (OWASP Top 10 overview), **zero trust** (important for Zscaler)
- [x] `core.concurrency-qa` (C): deadlock vs livelock vs starvation, thread safety, immutability
- [x] `core.oop-dbms-os-cn-rapid` (C): curated top-50 rapid-fire questions across modules (references to topic pages)

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

- [x] Global search (Ctrl/Cmd+K) across topics, problems, MCQs, SQL exercises and notes
- [x] Notes per topic, problem and question (plain text, escaped); bookmarks for anything; a notes index page
- [x] Mistake journal: every logged error category with a link to the source attempt; filter by category and topic; "practise this weakness" buttons
- [x] Settings: profile, target companies, daily minutes, preferred language (C++/Java default tab), weekly goals
- [x] Data management: JSON export, JSON import (schema-validated, with a preview and a confirm step), reset with typed confirmation, storage usage display
- [x] Content status badges (Complete / Partial / Planned) on every module, topic and company page
- [x] Keyboard shortcuts: Ctrl/Cmd+K search, MCQ answer keys 1–4, revision: Space reveals and 1–4 grade Again/Hard/Good/Easy, OA: Alt+N next, Alt+P previous, Alt+M mark (Alt+arrows avoided: browser history); e2e `keyboard:` test
- [x] Error boundary per route with a friendly fallback; a 404 page

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
- [x] Verify the LeetCode Database problem list (323 problems, 105 free) → `research/leetcode-database.verified.json`; HTTP-check HackerRank, StrataScratch, DataLemur, SQLZoo, pgexercises, db-book, CMU 15-445, NPTEL, GFG, SQLite docs
- [ ] (BLOCKED: guide is a PDF download; needs user permission) Meta Full Loop guide
- [x] Research Apple, Netflix, Zscaler, Microsoft and other company pages from official sources (P1; the pages exist with sourced facts and verification dates)
- [ ] Map A2Z items that link to GFG or other non-LeetCode sites (P2)

### Phase 0: Repository setup (P0)

Depends on: nothing.

- [x] `git init`, `.gitignore`, initial commit containing `DESIGN.md`, `what_to_do.md` and `research/`, pushed to `origin main` (done in session 1)
- [x] Scaffold Vite + React + TS (strict) in place (do not overwrite `DESIGN.md` or `research/`)
- [x] (PARTIAL: Prettier not installed; Playwright 1.64 + axe added in session 3) Add dependencies: react-router-dom, zustand, lucide-react, marked, highlight.js, sql.js; dev: vitest, @testing-library/react, jsdom, playwright, eslint (+ typescript-eslint, react-hooks, jsx-a11y), prettier, tsx
- [x] (`validate:content` runs inside `npm test`; `build:index` added in session 3) Scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:e2e`, `validate:content`, `verify:code`, `check:links`, `build:problems`
- [x] `src/styles/tokens.css` from DESIGN.md with the Section 10 adaptations (contrast-checked)
- [x] `.claude/launch.json` for the preview server (dev on port 5173)
- [x] A short `README.md` (run, build, data storage, limitations), pointing to this file

**Acceptance:** `npm run build`, `typecheck`, `lint` and `test` (with one trivial test) all pass; the app renders "PrepForge" at `/`.

### Phase 1: Foundation (P0)

Depends on: Phase 0.

- [x] Layout shell: sidebar (desktop), icon rail (tablet), top bar + drawer + bottom tab bar (mobile), skip link, focus management
- [x] Router with all Section 5 routes (every route is built; planned topics render an honest Planned state) (unbuilt pages render an honest "Coming in Phase N" state linked to this roadmap; **no fake content**)
- [x] UI primitives: Button, IconButton, Card, Badge, StatusBadge, Tabs, Disclosure, CodeBlock/CodeTabs (highlight.js, copy), Table (responsive), ProgressBar, Stat, EmptyState, Dialog, Toast, Timer, Kbd
- [x] (PARTIAL: BarList, Sparkline, ActivityHeatmap built; StackedBar and ProgressRing not needed yet) SVG chart primitives
- [x] (PARTIAL: export/import/reset verified manually; no dedicated store unit test yet) Store: slices per Section 6.2, persist to `prepforge:v1`, `migrate()`, export/import/reset with validation; unit tests
- [x] Content schema (`schema.ts`) and registry; Markdown renderer (marked + highlight.js); TraceStepper component (array/pointer/window/stack visuals)
- [x] Content validator implemented as `tests/content.test.ts` (runs in `npm test`)
- [x] Global search (Ctrl/Cmd+K) over the registry
- [x] Settings page (profile, targets, daily minutes, language, data management)

**Acceptance:** navigation works on every route at 320/768/1440/2560; data survives a reload; export → reset → import restores state; the validator fails on a deliberately broken fixture.

### Phase 2: DSA learning loop (P0, the most important phase)

Depends on: Phase 1.

- [x] (PARTIAL: implemented as `scripts/build-problem-bank.mjs`; manual review of the topic mapping still pending) `scripts/build-problem-bank.ts`: generate `src/content/problems/bank.generated.ts` from `research/dsa-problems.verified.json` (topic mapping precedence plus a review report); hand-review the mapping
- [x] Topic page (all tabs) rendering the `Topic` schema
- [x] MCQ engine: single and multi-select, instant feedback in practice mode, explanations and misconception notes, attempt logging with `firstSeen`
- [x] Problem bank page: filters (topic, pattern, difficulty, list, status, premium, has-walkthrough), search, sort, responsive card/table views, canonical records shown with all list badges
- [x] Problem-Solving Coach page: 11 stages, saved stage answers, hints 1–4 and solution with logged reveals, pausable timer, outcome capture, error classification, reflection, revision-card creation
- [x] Engine: `mastery.ts` (Section 7.1) with unit tests
- [x] Dashboard v1: today's plan (simple version), completion vs mastery per module, recent activity, due reviews count, weakest topics (with evidence), empty states
- [x] **Pilot content (Complete per Section 11):** `dsa.complexity`, `dsa.hashing`, `dsa.two-pointers`, `dsa.sliding-window`, `dsa.binary-search`
- [x] Authored coach walkthroughs for the pilot topics (14 problems)

**Acceptance:** a learner can open Sliding Window, read it, answer MCQs (logged), open a linked problem, go through the coach with hints, log an outcome with error categories, and see mastery and the dashboard update after a reload. Unit tests cover mastery edge cases (no evidence, all independent, all after-solution).

### Phase 3: Revision, readiness and planning engines (P0)

Depends on: Phase 2.

- [x] `revision.ts` (SM-2 variant + forgetting-risk ordering) + tests
- [x] Auto-card creation (wrong MCQs, hinted or solution-viewed problems) + manual "save to revision"
- [x] Revision page: due today, flashcard player, topic sessions, previously incorrect, revision sheets
- [x] `readiness.ts` (9 dimensions, evidence, confidence, decay) + tests; Analytics page with evidence and the disclaimer
- [x] `plan.ts` daily plan generator + tests; Plan page; the dashboard uses it
- [x] Mistake journal page; `recommend.ts` (error category → interventions)
- [x] Streaks, activity heatmap, weekly goals

**Acceptance:** with seeded test data, unit tests produce expected intervals, due ordering, readiness values and plans; the UI shows the evidence for each readiness number; due cards appear on the expected dates (tested with a mocked clock).

### Phase 4: OA Centre (P0)

Depends on: Phases 2–3 (needs the MCQ pool, problems and engines).

- [x] Assessment builder (presets plus custom)
- [x] Runner: absolute timer, palette, mark for review, autosave, resume after reload, per-question active time, confirm submit, auto-submit
- [x] Item types: MCQ, approach/pattern MCQ, debugging MCQ, coding (self-reported, labelled), SQL (after Phase 5)
- [x] `scoring.ts` + tests (partial credit rules documented; self-reported items excluded from the auto-score)
- [x] Results: score, accuracy, per-topic and per-difficulty breakdown, time per question, review with explanations, comparison with history, recommendations
- [x] Smart item selection (weak / previously incorrect / unseen mix)

**Acceptance:** a 20-question mixed OA can be taken, refreshed mid-way without loss, auto-submitted at time-out, and scored exactly (verified by unit tests on scoring and an e2e test).

### Phase 5: SQL and DBMS, fresher placement focus (P0)

Depends on: Phase 1 (engines and UI primitives); Phase 2 (MCQ engine); Phase 4 for timed SQL
sets in OAs. Full specification: Section 8.2.

**5A. Engine and verification (P0)**
- [x] sql.js Web Worker engine (lazy-loaded, 3 s timeout, `PRAGMA foreign_keys = ON`, reset per run)
- [x] Datasets `company`, `shop`, `events`, `rides`, `social`, `ledger`, each with hidden edge-case variants; MySQL and SQLite DDL kept in sync
- [ ] `scripts/verify-sql-mysql.mjs` (Docker `mysql:8.0`; runs every reference solution, captures expected output, fails on mismatch)
- [x] `sqlCompare.ts` + unit tests (order, NULLs, floats, duplicates, column-name policy, classic wrong queries must fail)

**5B. Practical SQL (P0)**
- [x] SQL editor page (schema browser, sample-data preview, run with Ctrl+Enter, result grid, readable errors, history, reset, dialect notes)
- [x] Exercise page (hint ladder, check on visible + hidden datasets with row diff, explanation, wrong-approach notes, target time, bookmarks, notes)
- [x] (120 exercises over 6 datasets, every reference executed on every variant and every wrong approach proven to fail) ≥ 120 original exercises covering every [Q] topic (start with 40 covering joins, aggregation, subqueries and window functions)
- [ ] LeetCode SQL 50 mapped to topics with original hint ladders; curate the 55 free LeetCode Database extras; HackerRank, DataLemur and StrataScratch lists with link checks
- [x] Timed SQL sets in the OA engine

**5C. Concepts (P0)**
- [x] Notes for every P0 concept topic in 8.2.2 (definitions, worked examples, diagrams for B+ trees, isolation anomalies and schedules, common mistakes, revision notes, flashcards)
- [x] 200 SQL/DBMS MCQs (91 SQL with 29 executed in SQLite, 109 DBMS) and 126 interview questions with model answers

**5D. Tools (P1)**
- [x] FD toolkit + tests
- [x] Schedule analyser + isolation-anomaly simulator + tests (`src/engine/tools/isolation.ts`: 5 scenarios, 4 levels, per-level step log; 21 unit tests with `btree`)
- [x] B+ tree visualiser (`src/engine/tools/btree.ts`: insert, delete with borrow/merge, range scan over the leaf chain, invariant-checked in tests)

**5E. Advanced track (P2)**
- [x] `dbms.storage-recovery`, `dbms.query-processing`, `dbms.distributed-transactions`

**Acceptance:** Section 8.2.5. In addition: a wrong query never shows as correct; an
equivalent query with a different column or row order (when order doesn't matter) passes;
infinite recursive CTEs are stopped by the timeout.

### Phase 6: OOP in C++ and Java (P0)

Depends on: Phase 2 (MCQ engine). Code verification needs `scripts/verify-code.mjs`.

- [x] `scripts/verify-code.ts` (g++ / javac compile, run, compare with `expectedOutput`; expected-compile-error mode with a `// here` line check; toolchain capability probe that reports SKIPs)
- [x] C++ topics content (Section 8.3), all output and compile-error questions verified (15/15 topics, 90 MCQs, all verified with g++)
- [x] Java topics content (Section 8.4), all output and compile-error questions verified (15/15 topics, 90 MCQs, all verified with JDK 23)
- [x] LLD practice set (6 problems): parking lot, library, vending machine (State), elevator (LOOK), rate limiter class, snake and ladder; each has requirements, text class diagram, key decisions, C++ and Java skeletons (both compiled and run, outputs identical), mistakes, 4 interview questions and 6 MCQs. Lives in the System Design module as `sd.lld-*` (`system-design/lld.ts`)

**Acceptance:** `npm run verify:code` passes for every `verify: true` snippet; each topic meets Section 11.

### Phase 7: CN, OS, System Design, DevOps, Core CS (P1)

Depends on: Phase 2.

- [x] CN content + subnet calculator + scenario walkthroughs (17/17 topics; the type-a-URL flow is in the HTTP topic and failed-connection diagnosis in the troubleshooting topic; numeric answers tested against the calculator and in `os-cn-facts.test.ts`)
- [x] OS content + CPU scheduling simulator + page replacement simulator (15/15 topics; numeric MCQ answers tested against the simulators or by direct computation; fork/pipe/signal/thread samples compiled and run via WSL g++)
- [x] System design foundations + 10 case studies (new-grad vs senior callouts) (26/26 topics: 16 foundations and 10 case studies; numeric facts tested in `sd-facts.test.ts`)
- [x] (PARTIAL: no interactive local mini-labs) DevOps content (core and advanced tracks) (11/11 topics including Kubernetes advanced and Terraform; YAML and Dockerfile samples are illustrative, not machine-validated; Git facts tested against real git)
- [x] Core CS rapid-fire bank + security fundamentals (4/4 topics: data representation, program execution, security fundamentals, concurrency concepts with compiled Java samples)

**Acceptance:** each module has a navigable curriculum with all topics either Complete or honestly Planned; the simulators match hand-computed textbook examples in unit tests.

### Phase 8: Companies and mock interviews (P1)

Depends on: Phases 3–4; company research tasks in Phase R.

- [x] Company content files for Google and Amazon (verified facts), plus Meta, Apple, Netflix, Zscaler and Microsoft, with only verified facts and "not yet verified" labels (`src/content/companies.ts`, 7 companies)
- [x] Company page template; per-company readiness weighting; practice-simulation assessments; STAR story builder (`features/companies`, weights labelled as recommendations)
- [x] Mock interviews (coding, behavioural, system design) with timers and self-assessed rubrics (`features/mock`)

**Acceptance:** every factual company claim has a source URL and a verified-on date; no compensation or frequency claims exist.

### Phase 9: Content expansion (P0 for DSA, P1 for others)

Depends on: the respective module phases.

- [x] All 40 DSA topics Complete (40/40, session 3)
- [ ] (PARTIAL: Blind 75 75/75 and NeetCode 150 150/150 done; Top Interview 150 77/150, LeetCode 75 21/75) Authored walkthroughs for all Blind 75 and NeetCode 150 problems (158 authored in total, each solution compiled and run against its listed tests in both C++ and Java, with randomised brute-force checks for the trickiest)
- [x] SQL/DBMS, OOP, CN, OS, SD and DevOps topics all Complete (180/180)
- [x] Recognition drill bank: 125 original "which pattern?" scenarios over 33 DSA patterns (`src/content/drills/pattern-drills.ts`, page `/practice/patterns`; kept outside `content/dsa/` so it does not join the DSA pack; guarded by `tests/pattern-drills.test.ts`)

### Phase 10: QA, hardening and release (P0)

Depends on: everything shipped.

- [x] Full test suite, lint, typecheck (app + e2e), production build (session 3)
- [x] Playwright e2e for the core flows (Section 14) plus viewport screenshots at 7 widths (`e2e/`, runs on the production build in the installed Chrome; screenshots in `test-results/screens`)
- [x] (PARTIAL: full keyboard-only walkthrough of every flow not done) Accessibility pass: axe (WCAG 2.1 AA) on 14 routes with no serious/critical violations, skip-link test, a tab-count contrast bug fixed
- [x] Link check passes (LeetCode links via GraphQL; 0 broken); e2e flows and the 7-width sweep fail on any console error or page error
- [x] (PARTIAL: DSA pack is 264 KB gzip, see B14) Performance: eager JS ≈ 186 KB gzip (app 27, React 68, content index 70, problem bank 21); module packs load on demand; sql.js lazy-loaded
- [x] README: run, deploy, storage, limitations; update this file

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
| 2026-10-11 | `npx tsc -p tsconfig.app.json --noEmit` | Pass (a probe file confirmed errors are detected) |
| 2026-10-11 | `npx eslint .` | Pass |
| 2026-10-11 | `npx vite build` | Pass (content chunk 335 KB, gzip 79 KB) |
| 2026-10-11 | `npx vitest run` | 134/134 pass (5 files) |
| 2026-10-11 | `npx vite-node scripts/verify-code.ts` | 48 C++/Java samples, 0 failures (g++ 6.3 -std=c++14, javac 23) |
| 2026-10-11 | `npx vitest run` (after the content packs) | 190/190 pass (10 files: engines, tools, SQL exercises + executed SQL MCQs, content validator, plan/readiness, DBMS FD facts, OS/CN simulator facts, SD numeric facts, DevOps facts with real git) |
| 2026-10-11 | `npm run verify:code` | 202 C++/Java samples checked, 0 failures, 3 skipped (local MinGW g++ lacks `<mutex>` and POSIX headers; see B11) |
| 2026-10-11 | `npm run check:links` | 108 links: 103 OK, 0 broken, 5 bot-walled (LeetCode study plans, Cloudflare Learning; the Cloudflare pages returned HTTP 200 in the browser) |
| 2026-10-11 | `npx vite build` | Pass (content chunk 932 KB, gzip 266 KB; app chunk gzip 28 KB) |
| 2026-10-11 | Manual browser QA (built-in browser) | 29 routes render without errors at 320 px with no horizontal overflow (a plan-page overflow was fixed); onboarding, MCQ, SQL grading (a wrong `NOT IN` was caught on hidden data) and the OA flow (reload-resume, submit, results) checked at 1440 px |
| 2026-10-12 | `npm run verify:code` | 362 C++/Java samples, 0 failures, 0 skipped (3 compiled and run with WSL g++ 15.2) |
| 2026-10-12 | `npx vitest run` | 191/191 pass (11 files; new: content-index staleness test) |
| 2026-10-12 | `npm run test:e2e` | 31/31 pass in Chrome on the production build: 8 core flows (onboarding, topic MCQ + reload, coach → revision card due tomorrow, OA mark/reload/auto-submit with an independently recomputed score, SQL wrong → right, export/reset/import, mobile drawer, search), overflow + screenshots at 320/375/768/1024/1440/1920/2560, axe on 14 routes, skip link |
| 2026-10-12 | `npm run check:links` | 171 links: 168 OK (LeetCode via GraphQL), 0 broken, 3 bot-walled (Cloudflare Learning, browser-checked) |
| 2026-10-12 | `npx vite build` | Pass. Eager JS ≈ 186 KB gzip; packs load on demand (DSA 264 KB gzip, others 10–19 KB) |
| 2026-10-12 | `node research/scripts/verify-curated.mjs` | 74 curated problems verified via LeetCode GraphQL, 0 failed |
| 2026-10-12 | `npm run verify:code` (session 4, after Java batch 2) | 429 C++/Java samples, 0 failures, 0 skipped (3 via WSL g++ 15.2) |
| 2026-10-12 | `npx vitest run` (session 4) | 353/353 pass (11 files; includes 22 executed SQL output MCQs, the schedule analyser and the eager-import chunk guard) |
| 2026-10-12 | `npm run check:links` (session 4) | 216 links: 213 OK, 0 broken, 3 bot-walled |
| 2026-10-12 | Production check | https://prep-forge-omega.vercel.app loads after the chunk fix; a SQL lesson's lazy chunk loads with no console errors |
| 2026-10-12 | Browser (dev server) | Java topic `java.abstract-interfaces` renders with 6 MCQs, no console errors |
| 2026-10-12 | `npm run verify:code` (after Java batch 3) | 452 C++/Java samples, 0 failures, 0 skipped |
| 2026-10-12 | `npx vitest run` (after Java batch 3) | 353/353 pass (caught 6 duplicate MCQ ids, renamed to `java.col.*`) |
| 2026-10-12 | `npm run check:links` (after Java batch 3) | 225 links: 222 OK, 0 broken, 3 bot-walled |
| 2026-10-12 | Browser (dev server) | `java.inner-lambdas` renders with 6 MCQs and 5 interview questions, no console errors |
| 2026-10-12 | `npx vitest run` (after CN batch 2) | 357/357 pass (4 new CN fact tests: longest-prefix match, cwnd trace, window/RTT throughput, BDP) |
| 2026-10-12 | `npm run check:links` (after CN batch 2) | 240 links: 237 OK, 0 broken, 3 bot-walled |

---

## 15. Definition of done

The project is complete only when **all** of these are verified:

- [x] Every core subject has a navigable curriculum (all topics Complete or explicitly Planned with a phase) (all 180 catalogued topics are Complete (including the Core CS rapid-fire top-50 added late in session 6))
- [x] Topics contain real educational content meeting Section 11 (enforced by `tests/content.test.ts`)
- [x] MCQs work and show explanations; attempts are logged (covered by e2e)
- [x] Practice questions are organised, filterable and searchable (problem bank, MCQ practice and global search)
- [x] DSA questions have a working solve-and-hint workflow (Problem-Solving Coach) (158 authored walkthroughs plus pattern guidance for the rest)
- [x] Progress persists across reloads; export and import work (covered by e2e)
- [x] Weaknesses (error categories, studied-but-cannot-apply) and revision needs are tracked (mistake journal, analytics and SM-2 revision)
- [x] Timed assessments work (timer, autosave, resume, submit, auto-submit) (covered by the OA e2e test)
- [x] Results are calculated accurately (unit-tested) (`tests/plan-readiness.test.ts`, `tests/engines.test.ts`)
- [ ] Company-specific preparation is available with sourced facts
- [ ] The interface works at 320–2560px (screenshots reviewed)
- [x] The production build succeeds (Vercel deploys every push)
- [x] Major flows are covered by e2e tests that were actually run (31 Playwright tests, last run at the end of session 6)
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
| B11 | ~~Local MinGW g++ lacks `<mutex>` and POSIX headers~~ **Resolved (session 3)** | none | g++ 15 installed in WSL Ubuntu; `verify-code.ts` compiles samples needing those capabilities there (3 samples), so 0 are skipped |
| B12 | man7.org is unreachable from this network and the browser; Cloudflare Learning returns 403 to scripts | Those links cannot be auto-checked | man7 links replaced with man.archlinux.org pages (verified 200); Cloudflare listed as bot-walled in the checker after a manual browser check |
| B13 | ~~One 932 KB content chunk~~ **Resolved (session 3)** | none | Per-module packs loaded on demand (`src/content/loader.ts`); eager metadata in `index.generated.ts` (regenerated by `npm run build:index`, staleness-tested) |
| B15 | The eager content index is 555 KB (127 KB gzip) now that it lists 1,235 MCQs and 180 topics | Every page load downloads metadata for all modules | Load per-module metadata lazily, or drop `title` from MCQ metadata; the generator now emits chunks of 250 entries because TypeScript fails on ~1,000-literal arrays |
| B16 | `csapp.cs.cmu.edu` (Core CS, program execution) fails from scripts and the in-app browser on 2026-10-12 | One resource link unverified | Keep the link (the site has been reachable before); re-check, or replace it with the CS:APP book page on a stable host |
| B14 | ~~The DSA pack was 859 KB (264 KB gzip)~~ **Mostly resolved (session 6)** | Walkthroughs are now a separate lazy chunk (`pack-dsa-walkthroughs`, 138 KB gzip) loaded only on problem pages that have one; the DSA lessons pack is 221 KB gzip | Optional: split the lessons pack per topic |
| B10 | sql.js uses SQLite, while LeetCode and most OAs default to MySQL | Some syntax and behaviour differ | Dual reference solutions; every MySQL solution verified offline on MySQL 8.0 (Docker); clear "where it was executed" labels (Section 8.2.4) |

---

## 17. Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-10-11 | Product name is **PrepForge** (replaces the working name PlacementOS); storage key `prepforge:v1` | User instruction; matches the GitHub repository |
| 2026-10-11 | Push to `origin main` after every completed task or checkpoint | User instruction ("keep pushing") |
| 2026-10-11 | Global CSS with component class prefixes (`tokens.css`, `base.css`, `features.css`) instead of CSS Modules | Faster to build a consistent system; still no UI kit or Tailwind |
| 2026-10-11 | Content validator as a Vitest suite; code verifier runs via `vite-node scripts/verify-code.ts` | Reuses the TypeScript content directly; no extra tooling |
| 2026-10-11 | SQL execution uses statement iteration (`src/lib/sqlExec.ts`), not `Database.exec()` | `exec()` drops column names for empty results, which broke grading of correct empty answers |
| 2026-10-11 | Verified C++ is kept at C++14 | The local compiler is g++ 6.3 (blocker B5) |
| 2026-10-11 | Static local-first SPA: Vite + React + TS, Zustand + localStorage | Greenfield; single learner; free deploy; offline; minimal dependencies |
| 2026-10-11 | Plain CSS tokens + CSS Modules instead of Tailwind or a UI kit | `DESIGN.md` defines tokens; fewer dependencies; full control of the look |
| 2026-10-11 | sql.js in a Web Worker for real SQL execution | Genuinely sandboxed, no server, honest grading |
| 2026-10-11 | No code execution or AI in v1; deterministic coach with honest labels | Spec forbids fake functionality; avoids paid services |
| 2026-10-11 | One canonical problem record per LeetCode slug; lists as badges | Spec requires de-duplication across lists |
| 2026-10-11 | Accents used as small subject markers, not full-fill cards; darker semantic text colours | Learning UX and WCAG AA |
| 2026-10-11 | SM-2 variant for spaced repetition | Well understood, deterministic, easy to unit-test; FSRS can replace it later behind the same interface |
| 2026-10-11 | Evidence-based mastery separate from completion; readiness shows evidence and confidence | Spec: reading must not equal interview-ready; no arbitrary percentages |
| 2026-10-11 | DSA is built first and used as the pilot for every engine | Highest-priority gap (unfamiliar OA questions) |
| 2026-10-11 | MySQL 8.0 is the reference dialect for SQL solutions; SQLite (sql.js) runs in the browser | LeetCode and most OAs default to MySQL; no practical in-browser MySQL exists |
| 2026-10-11 | Grade SQL on visible **and hidden edge-case datasets** | Catches the classic interview mistakes (zero-count groups, NULLs, ties, date boundaries) that a single sample dataset hides |
| 2026-10-11 | Verified questions must never depend on undefined, unspecified or implementation-defined behaviour (e.g. C++ argument evaluation order, signed overflow, char signedness) | A compiler run proves only one compiler's choice; such questions teach wrong rules |
| 2026-10-11 | Compile-error questions use `cppErr`/`javaErr`; the verifier requires a compile failure on the line marked `// here` | Proves the question points at the real error |
| 2026-10-11 | Numeric answers in OS/CN/SD/DBMS MCQs are cross-checked in unit tests against the in-app simulators or direct computation; SQL output MCQs are executed in sql.js; Git facts are checked against real git | Content correctness is tested, not assumed |
| 2026-10-11 | Toolchain gaps are reported as SKIP by the verifier, never as passes | Honesty rule: no verified claim without an actual run |
| 2026-10-11 | **Scope: fresher / new-grad placement at big product companies only. No college syllabus, assignments or exam prep**; college material is never imported. Depth everywhere follows new-grad interview and OA expectations, with senior-level material only in labelled advanced tracks | User instruction |
| 2026-10-12 | Content ships as per-module packs loaded on demand; a generated metadata index (`index.generated.ts`) is eager and a test fails if it is stale | One 932 KB bundle slowed first load; all pages still need topic/MCQ metadata synchronously |
| 2026-10-12 | Tests and scripts import full content from `src/content/all.ts`; the app never does | Keeps the eager bundle small while tests still check everything |
| 2026-10-12 | E2E runs on the production build in the locally installed Chrome (`channel: chrome`) | No browser download needed; tests what users get |
| 2026-10-12 | Curated problems outside the public lists are allowed only via `research/scripts/verify-curated.mjs` (GraphQL-verified) and carry the "Curated" badge | Several topics (MST, Fenwick, advanced graphs) had too few list problems; never invent slugs |
| 2026-10-12 | LeetCode links are verified through GraphQL in the link checker | leetcode.com returns 403 to scripts; GraphQL is the same verification used for the research data |
| 2026-10-12 | Samples needing threads/POSIX are compiled with WSL g++ | Local MinGW lacks those headers; skipped samples are never counted as verified |
| 2026-10-12 | The LLD practice set lives in the System Design module (`sd.lld-*`), not in a new module | A new module touches nav, plans, readiness, chunking and OA presets; LLD is design practice and each problem ships both C++ and Java skeletons |

---

## 18. Session log

| Session | Date | Summary |
|---|---|---|
| 1 | 2026-10-11 | Audited the repo (greenfield). Verified 383 DSA problems + SQL 50 via LeetCode GraphQL and NeetCode/A2Z sources (saved in `research/`). Verified Google and Amazon hiring facts from official pages. Created this roadmap. Renamed the product to PrepForge, initialised git, and pushed to `SanTiwari07/PrepForge`. **No application code written** (per the user's instruction). Next: Phase 0. |
| 2 | 2026-10-11 | Implemented Phases 0–4 and the Phase 5 engine: full app, 5 complete DSA topics, 14 walkthroughs, 33 SQL exercises, tools, 134 tests and the code verifier. Manual QA in the browser (see the Test log). |
| 1b | 2026-10-11 | Drafted a college + placement SQL/DBMS plan; the user then rejected the college scope. Rewrote SQL/DBMS (Section 8.2, 6.3, Phase 5) for fresher placement only and removed all college material from the plan. Added the verified LeetCode Database list (323; 105 free). No app code written. |
| 2c | 2026-10-11 | Autonomous content run (user away): DSA topics 5 to 15 and walkthroughs 14 to 34; SQL lessons (6), DBMS (6), OOP C++ (5) and Java (5) with compiler-verified questions; then OS (6), CN (7), System Design (7), DevOps (4) and Core CS (3). Added fact tests, the toolchain-capability probe, section-program execution in the verifier, and `scripts/check-links.ts`. All pushed. |
| 3 | 2026-10-12 | Resolved B11 (WSL g++) and B13 (per-module content packs). Added the Playwright e2e suite with axe and a 7-width sweep, which found and fixed a contrast bug and a search bug (hover stole the keyboard selection). Verified 74 curated problems via GraphQL (bank 383 → 417). Wrote the remaining 25 DSA topics (DSA 40/40) with 200+ MCQs and 25 walkthroughs, all compiler-verified, with numeric answers cross-checked by script. Link checker now verifies LeetCode via GraphQL. Not done: SQL/DBMS/OOP/CN/OS/SD/DevOps remaining topics, SQL exercises to 120, MySQL verification, B14. The history-rewrite question (institute name in commit `92c5b9c`) still needs the user's decision. |
| 4 | 2026-10-12 | SQL: datasets `rides`, `social`, `ledger` with hidden variants, 41 new exercises (74 total), 8 lessons with 48 MCQs (22 executed); SQL 14/14. DBMS: schedule analyser tool and 10 topics (DBMS 16/16). C++: 10 topics (15/15). Java: 10 topics (15/15). CN: 5 topics (12/17) with numeric answers recomputed in tests against the graded option. Fixed a blank production page on Vercel (circular chunk import → TDZ crash) with a shared chunk rule and a guard test. Recorded the production URL. Not done: LLD practice set, last 5 CN topics, OS/SD/DevOps/Core CS remainder, SQL exercises to 120, MySQL verification, B14, e2e rerun. |
| 5 | 2026-10-12 | CN: last 5 topics (17/17). OS: 9 topics (15/15) with g++-verified fork/pipe/signal/thread samples (471 samples, 0 failures). System Design: 19 topics (26/26): 10 foundations and 9 case studies, each with new-grad vs senior callouts, numeric answers recomputed in `tests/sd-facts.test.ts`. Content index generator now emits chunks (TS union-complexity error at ~1,000 entries). Not done: LLD practice set, DevOps/Core CS remainder, SQL exercises to 120, walkthroughs, MySQL verification, B14/B15, e2e rerun. |
| 6 | 2026-10-12 | DevOps: 7 topics (11/11). Core CS: concurrency concepts (4/4). LLD practice set: 6 problems with verified C++ and Java skeletons (System Design 32/32). Core CS rapid-fire top-50 interview questions topic (180/180 topics, 1,235 MCQs). SQL exercises 74 → 120 (46 new in `sql/exercises3.ts`, covering every SQL topic; each reference run on all dataset variants and each wrong approach proven to fail, MySQL variants given where syntax differs). All 180 catalogued topics Complete; 489 code samples compile and run with 0 failures (the verifier caught a real deadlock in a lock-ordering sample, fixed). SQL/DBMS reached 200 MCQs (7 new executed SQL output questions, 12 DBMS questions checked with the FD toolkit). Blind 75 walkthroughs complete (43 new: each solution written in C++ and Java, run against its listed test cases, plus randomised brute-force checks for LIS, sliding window, palindromes and intervals; generated into `dsa/walkthroughs4.ts`). NeetCode 150 walkthroughs complete (99 new in `walkthroughs4.ts`, 158 in total). Walkthroughs moved to their own lazy chunk (B14), e2e re-run: 31/31 pass. Isolation-anomaly simulator and B+ tree visualiser added (584 unit tests pass). Not done: Top Interview 150 / LeetCode 75 walkthrough gaps, B15, MySQL verification. |
