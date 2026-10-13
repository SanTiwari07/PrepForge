# PrepForge

An adaptive, evidence-based preparation platform for **fresher (SDE-1 / new-grad) roles at big
product companies**. It covers DSA, SQL and DBMS, OOP (C++ and Java), operating systems,
networks, system design and DevOps. It teaches, makes you practise, tracks evidence, and
schedules revision.

**Live:** https://prep-forge-omega.vercel.app (deployed by Vercel on every push to `main`).

> The master roadmap and source of truth is [`what_to_do.md`](what_to_do.md). It lists
> what is done, what is partial, and what is planned.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run build` | Type-check and build the static site into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit, content-integrity and SQL-execution tests (Vitest) |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run test:e2e` | Build, then run the Playwright end-to-end, viewport and accessibility tests in the locally installed Chrome |
| `npm run verify:code` | Compile every C++/Java snippet with `g++`/`javac` and run the code-output MCQs (requires both on PATH; on Windows, samples needing threads or POSIX headers use `g++` inside WSL) |
| `npm run check:links` | Check every external link (LeetCode links via LeetCode's GraphQL API) |
| `npm run build:index` | Regenerate `src/content/index.generated.ts` after editing content (also runs before `npm run build`; a test fails if it is stale) |
| `npm run build:problems` | Regenerate the problem bank from `research/dsa-problems.verified.json` |

The live site is on Vercel, which builds and deploys every push to `main`. To host it
elsewhere, deploy `dist/` to any static host. SPA fallbacks are included for Netlify (`public/_redirects`)
and Vercel (`vercel.json`).

## How progress is stored

All progress is stored **only in your browser** (`localStorage`, key `prepforge:v1`). There is
no server and no account. Clearing site data or switching browser or device loses it. Use
**Settings → Export backup** regularly, and **Import** to restore.

## What is real and what is not

- **SQL is executed for real** in the browser (SQLite via sql.js/WebAssembly, in a Web Worker with
  a 3-second limit). Exercises are graded on sample data **and hidden edge-case datasets**.
- **C++/Java code is not executed in the app.** Solve on LeetCode and self-report the outcome.
  Self-reported results are labelled and excluded from auto-scored totals.
- **No AI.** The Problem-Solving Coach uses authored hints, or pattern guidance derived from the topic.
- **Scores are preparation evidence,** not hiring predictions.

## Limitations

- **Single learner, single browser.** No accounts or sync; progress lives in `localStorage` (see above).
- **No real code execution.** C++/Java snippets were compiled and run when the content was written (`npm run verify:code`), but the app does not run your code. Only SQL runs in the browser.
- **SQL dialect.** The SQL lab runs SQLite. Exercises note where MySQL/PostgreSQL syntax differs; the answers have not yet been verified against a real MySQL server.
- **Coach walkthroughs are partial.** Blind 75 and NeetCode 150 have authored walkthroughs; the rest of Top Interview 150 and LeetCode 75 get pattern guidance only, and that is labelled in the app.
- **Content breadth.** Every catalogued topic is complete; depth is not uniform. Company pages cite sources and dates and should be re-checked before an interview.
- **Scores are evidence, not predictions.**

## Sources

The problem lists come from NeetCode's public site data, LeetCode study plans (Top Interview 150,
LeetCode 75, SQL 50) and the Striver A2Z sheet. Every slug was verified against LeetCode's API.
See [`research/README.md`](research/README.md). Problem statements are not copied; each problem
links to the official page.
