# Research data — provenance

Raw, verified source data gathered during the repository audit (2026-10-11). The app's
problem bank must be generated **from these files**, not from memory. Re-run the
verification before shipping, because public lists change.

## `dsa-problems.verified.json` — 383 canonical DSA problems

One record per LeetCode problem (union of the lists below, de-duplicated by slug).

| List | Count | Source used |
|---|---|---|
| NeetCode 150 | 150 | `neetcode150: true` in `https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json` (NeetCode's own site data) |
| Blind 75 | 75 | `blind75: true` in the same file (all 75 are inside NeetCode 150) |
| LeetCode Top Interview 150 | 150 | LeetCode GraphQL `studyPlanV2Detail(planSlug: "top-interview-150")` |
| LeetCode 75 | 75 | LeetCode GraphQL `studyPlanV2Detail(planSlug: "leetcode-75")` |
| Striver A2Z (LeetCode-linked items only) | 229 | LeetCode URLs embedded in `https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet` (A2Z items that link to GFG/other sites are **not** included yet) |

Every slug was then verified with LeetCode GraphQL
`question(titleSlug) { questionFrontendId title difficulty isPaidOnly topicTags }`.
Result: 383/383 exist; 91 Easy / 240 Medium / 52 Hard; 25 are LeetCode Premium
(`premium: true`). For 8 premium NeetCode problems, NeetCode's data provides a free
LintCode alternative (`freeAlternative`).

Fields:

- `groups.nc`: NeetCode pattern for NeetCode 150 problems. `groups.ncAll`: NeetCode pattern for problems from NeetCode's wider list.
- `groups.ti`: Top Interview 150 section. `groups.l75`: LeetCode 75 section. `groups.a2z`: A2Z category slug.
- `leetcodeTags`: LeetCode's own topic tags.
- `neetcodeVideo`: the YouTube solution video ID from NeetCode's dataset (247 problems).

Not available or deliberately excluded:

- **Company tags.** LeetCode company tags are Premium-only and could not be verified. Do not add company tags to problems without a cited source.
- **Per-problem NeetCode page URLs.** `neetcode.io` is a single-page app that returns HTTP 200 for any path, so its per-problem links cannot be verified by HTTP. Link the verified YouTube video and `https://neetcode.io/practice` instead.

## `sql-50.verified.json` — LeetCode SQL 50

From LeetCode GraphQL `studyPlanV2Detail(planSlug: "top-sql-50")`, grouped exactly as
LeetCode groups them: Select (5), Basic Joins (9), Basic Aggregate Functions (8), Sorting and
Grouping (7), Advanced Select and Joins (7), Subqueries (7), Advanced String Functions /
Regex / Clause (7). None are Premium.

## `leetcode-database.verified.json` — all LeetCode Database problems

From LeetCode GraphQL `questionList(categorySlug: "database")`, fetched on 2026-10-11:
323 problems; 105 free (55 Easy, 39 Medium, 11 Hard); 218 Premium. All 50 SQL 50
problems are included (`inSql50: true`). 55 free problems are **not** in SQL 50 (23 E,
22 M, 10 H); these are the curation pool for extra placement SQL practice.

## Other SQL/DBMS resources (HTTP-checked 2026-10-11)

Return 200 and real 404s for bad paths, so per-page links are HTTP-verifiable:
hackerrank.com/domains/sql, stratascratch.com, datalemur.com/questions, geeksforgeeks.org/dbms/dbms/.
Return 200: sqlzoo.net/wiki/SQL_Tutorial, pgexercises.com, db-book.com,
15445.courses.cs.cmu.edu, nptel.ac.in/courses/106105175 (DBMS; "Database Design" lectures),
sqlite.org/lang.html, postgresql.org/docs/current/tutorial-window.html, w3schools.com/sql,
mode.com/sql-tutorial. `dev.mysql.com/doc/refman/8.0/en/` returns 403 to bots (official docs;
mark `httpVerifiable: false`).

## How to re-verify

LeetCode web pages return HTTP 403 to non-browser clients (Cloudflare), so **do not use
HTTP status codes to check LeetCode links**. Use the GraphQL endpoint instead:

```bash
curl -s -X POST https://leetcode.com/graphql -H "Content-Type: application/json" -H "Referer: https://leetcode.com" -d '{"query":"query q($s:String!){question(titleSlug:$s){questionFrontendId title difficulty isPaidOnly}}","variables":{"s":"two-sum"}}'
```

A non-existent slug returns `{"data":{"question":null}}`. GeeksforGeeks and most
documentation sites return real 404s, so plain HTTP checks work for them.

## `curated-problems.verified.json`: PrepForge's curated topic mapping

`research/scripts/verify-curated.mjs` holds PrepForge's own judgement of which topic a
problem practises (for example `maximum-sum-circular-subarray` → Kadane). It verifies every slug
with LeetCode GraphQL (`question(titleSlug)`) and records the title, difficulty, premium flag and
tags from LeetCode. 74 problems were verified on 2026-10-11: 40 were already in the bank (they gain
a topic), and 34 are new, covering topics that no public list maps well (MST, Fenwick/segment
trees, interval and bitmask DP, Euler paths and bridges, KMP/Z/rolling hash, sweep line and
meet in the middle). New problems carry the list badge **Curated**. Re-run the script before a
release; it exits non-zero if any slug no longer exists.
