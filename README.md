# PrepForge

An adaptive, evidence-based preparation platform for **fresher (SDE-1 / new-grad) roles at big
product companies**. It covers DSA, SQL and DBMS, OOP (C++ and Java), operating systems,
networks, system design and DevOps. It teaches, makes you practise, tracks evidence, and
schedules revision.

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
| `npm run verify:code` | Compile every C++/Java snippet with `g++`/`javac` and run the code-output MCQs (requires both on PATH) |
| `npm run build:problems` | Regenerate the problem bank from `research/dsa-problems.verified.json` |

Deploy `dist/` to any static host. SPA fallbacks are included for Netlify (`public/_redirects`)
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

## Sources

The problem lists come from NeetCode's public site data, LeetCode study plans (Top Interview 150,
LeetCode 75, SQL 50) and the Striver A2Z sheet. Every slug was verified against LeetCode's API.
See [`research/README.md`](research/README.md). Problem statements are not copied; each problem
links to the official page.
