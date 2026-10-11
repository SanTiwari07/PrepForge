import type { MCQ, Resource, Topic } from '../schema';
import { mcq, sqlCode } from '../helpers';

// SQL lessons. Output-prediction MCQs carry `expectedOutput` and are executed in tests
// (format: rows separated by newlines, columns by " | ", NULL as "NULL").

const SQLITE_SELECT: Resource = { title: 'SELECT (SQLite docs)', url: 'https://www.sqlite.org/lang_select.html', kind: 'official-docs' };
const MODE: Resource = { title: 'SQL Tutorial (ThoughtSpot, formerly Mode)', url: 'https://www.thoughtspot.com/sql-tutorial', kind: 'course' };
const LC_SQL50: Resource = { title: 'LeetCode SQL 50 study plan', url: 'https://leetcode.com/studyplan/top-sql-50/', kind: 'practice', httpVerifiable: false };
const MASTERY = { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 2, minMediumIndependent: 1, retentionDays: 7 };

type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
const sqlTopic = (t: TopicInput): Topic => ({ moduleId: 'sql', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
const q = (topic: string) => ({ topics: [topic], module: 'sql' as const });
const out = (code: string, expected: string) => ({ ...sqlCode(code), expectedOutput: expected, verify: true });

// ---------------------------------------------------------------------------------------
const SB = 'sql.select-basics';
const selectBasics = sqlTopic({
  id: SB, title: 'SELECT Fundamentals', level: 'foundation', estMinutes: 45, prerequisites: [],
  summary: 'Filtering, sorting, limiting, and the logical order in which SQL runs.',
  objectives: ['Write SELECT with WHERE, ORDER BY, LIMIT/OFFSET and DISTINCT correctly.', 'Explain the logical processing order and why aliases fail in WHERE.', 'Use IN, BETWEEN and LIKE, and know their boundary behaviour.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'The logical order of a query', bodyMd: `You write SQL in this order: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT. The database **logically evaluates** it in a different order:

1. **FROM / JOIN**: build the rows.
2. **WHERE**: filter individual rows.
3. **GROUP BY**: form groups.
4. **HAVING**: filter groups.
5. **SELECT**: compute output columns (aliases are created here).
6. **DISTINCT**: remove duplicate output rows.
7. **ORDER BY**: sort (aliases *can* be used here).
8. **LIMIT / OFFSET**: cut the result.

This order explains many errors: a column alias defined in SELECT does not exist yet in WHERE, and aggregate functions cannot appear in WHERE because groups do not exist yet.` },
    { id: 'filters', kind: 'example', title: 'Filtering operators and their boundaries', bodyMd: `| Operator | Meaning | Watch out |
|---|---|---|
| \`BETWEEN a AND b\` | a ≤ x ≤ b | **Inclusive at both ends** |
| \`IN (…)\` | equals any listed value | \`NOT IN\` with a NULL in the list returns no rows |
| \`LIKE 'ab%'\` | starts with "ab" | \`%\` = any run of characters, \`_\` = exactly one |
| \`x = NULL\` | never true | use \`IS NULL\` |

\`ORDER BY a DESC, b\` sorts by a descending, then b ascending within ties. Without ORDER BY, **row order is not guaranteed**, even if it looks stable.` , code: [sqlCode(`-- Second page of 10 products, most expensive first, ties by name
SELECT name, price
FROM products
WHERE category IN ('electronics', 'home')
ORDER BY price DESC, name
LIMIT 10 OFFSET 10;`)] },
    { id: 'distinct', kind: 'concept', title: 'DISTINCT and LIMIT', bodyMd: `\`DISTINCT\` applies to the **whole output row**, not to the first column: \`SELECT DISTINCT city, name\` returns distinct (city, name) pairs.

\`LIMIT n OFFSET m\` (MySQL also accepts \`LIMIT m, n\`, which puts the offset first, a common trap). Large OFFSETs are slow because skipped rows are still produced. Keyset pagination (\`WHERE id > last_id ORDER BY id LIMIT n\`) scales better.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Using a SELECT alias in WHERE (\`WHERE total > 100\` where total is an alias). Repeat the expression or use a subquery/CTE.
2. Assuming a row order without ORDER BY.
3. \`BETWEEN '2024-01-01' AND '2024-01-31'\` on DATETIME values misses times on the 31st after midnight. Use \`>= start AND < next_day\`.
4. \`LIKE\` is case-sensitive or insensitive depending on engine and collation (MySQL is often insensitive; SQLite's LIKE is insensitive for ASCII; PostgreSQL's LIKE is sensitive).
5. Confusing MySQL \`LIMIT offset, count\` with \`LIMIT count OFFSET offset\`.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Why can you use a column alias in ORDER BY but not in WHERE?', answerMd: 'Logically, WHERE runs before SELECT (where aliases are defined), while ORDER BY runs after it. Some engines (MySQL) allow aliases in HAVING/GROUP BY as an extension, but WHERE never sees them.' },
    { id: 'iq2', q: 'Is BETWEEN inclusive?', answerMd: 'Yes, at both ends: x BETWEEN a AND b means a ≤ x ≤ b. With timestamps prefer half-open ranges (>= start AND < end).' },
    { id: 'iq3', q: 'How would you paginate efficiently through millions of rows?', answerMd: 'Keyset (seek) pagination: remember the last key and query WHERE key > last ORDER BY key LIMIT n. It uses the index and does not scan skipped rows like OFFSET does.' },
    { id: 'iq4', q: 'Does DISTINCT apply to one column?', answerMd: 'No: it applies to the entire selected row. Use GROUP BY or window functions when you need distinct values of one column with other data.' },
  ],
  revision: { notesMd: `- Logical order: FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT.
- Aliases are not visible in WHERE; they are visible in ORDER BY.
- BETWEEN is inclusive; prefer half-open ranges for dates.
- No ORDER BY means no guaranteed order.
- MySQL \`LIMIT 5, 10\` = skip 5, take 10.`, flashcards: [
    { id: 'f1', front: 'Logical evaluation order of a SELECT?', backMd: 'FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT.' },
    { id: 'f2', front: 'Is `BETWEEN 1 AND 5` inclusive?', backMd: 'Yes, both ends.' },
    { id: 'f3', front: 'Can WHERE use a SELECT alias?', backMd: 'No: WHERE is evaluated before SELECT.' },
    { id: 'f4', front: 'MySQL `LIMIT 20, 10` means?', backMd: 'Skip 20 rows, return 10.' },
    { id: 'f5', front: 'LIKE wildcards?', backMd: '% any sequence (including empty); _ exactly one character.' },
  ] },
  resources: [SQLITE_SELECT, MODE, LC_SQL50],
});

const sbMcqs: MCQ[] = [
  mcq({ ...q(SB), id: 'sql.sb.q1', type: 'concept', difficulty: 'easy', stem: 'Which clause is logically evaluated **first**?', options: ['FROM', ['SELECT', 'SELECT is evaluated after filtering and grouping.'], ['WHERE', 'WHERE needs the rows produced by FROM.'], ['ORDER BY', 'Sorting is one of the last steps.']], answer: 0, explanation: 'Rows must exist (FROM/JOIN) before they can be filtered, grouped or projected.' }),
  mcq({ ...q(SB), id: 'sql.sb.q2', type: 'debug', difficulty: 'easy', stem: 'Why does `SELECT price * qty AS total FROM items WHERE total > 100;` fail in standard SQL?', options: ['The alias total does not exist yet when WHERE is evaluated', ['Arithmetic is not allowed in SELECT', 'It is allowed.'], ['WHERE cannot compare numbers', 'It can.'], ['AS is optional, so it is ignored', 'The alias is defined; WHERE just cannot see it.']], answer: 0, explanation: 'Write WHERE price * qty > 100, or compute the alias in a subquery/CTE and filter outside it.' }),
  mcq({ ...q(SB), id: 'sql.sb.q3', type: 'code-output', difficulty: 'easy', stem: 'What does the final query return?', code: out(`CREATE TABLE t (x INTEGER);
INSERT INTO t VALUES (1), (2), (3), (4), (5);
SELECT COUNT(*) AS n FROM t WHERE x BETWEEN 2 AND 4;`, '3'), options: [['2', 'BETWEEN includes both 2 and 4.'], '3', ['4', 'Only 2, 3 and 4 qualify.'], ['5', 'The filter removes 1 and 5.']], answer: 1, explanation: 'BETWEEN is inclusive: 2, 3 and 4 match.', verified: 'executed' }),
  mcq({ ...q(SB), id: 'sql.sb.q4', type: 'code-output', difficulty: 'medium', stem: 'How many rows does the final query return?', code: out(`CREATE TABLE p (city TEXT, name TEXT);
INSERT INTO p VALUES ('Pune','A'), ('Pune','A'), ('Pune','B'), ('Delhi','A');
SELECT COUNT(*) FROM (SELECT DISTINCT city, name FROM p) AS d;`, '3'), options: [['2', 'DISTINCT applies to (city, name) pairs, not to city alone.'], '3', ['4', 'One duplicate pair (Pune, A) is removed.'], ['1', 'There are several distinct pairs.']], answer: 1, explanation: 'Distinct pairs: (Pune, A), (Pune, B), (Delhi, A).', verified: 'executed' }),
  mcq({ ...q(SB), id: 'sql.sb.q5', type: 'concept', difficulty: 'medium', stem: 'In MySQL, what does `LIMIT 10, 5` return?', options: ['5 rows, skipping the first 10', ['10 rows, skipping the first 5', 'In this form the offset comes first.'], ['Rows 5 to 10', 'It is offset then count.'], ['A syntax error', 'It is valid MySQL.']], answer: 0, explanation: 'MySQL\'s two-argument form is LIMIT offset, count, equivalent to LIMIT 5 OFFSET 10.' }),
  mcq({ ...q(SB), id: 'sql.sb.q6', type: 'edge-case', difficulty: 'medium', stem: 'A DATETIME column holds `2024-01-31 14:00:00`. Does `WHERE ts BETWEEN \'2024-01-01\' AND \'2024-01-31\'` include it?', options: ['No: the upper bound means 2024-01-31 00:00:00', ['Yes: BETWEEN is inclusive', 'It is inclusive of the exact bound value, which is midnight.'], ['Only in MySQL', 'This boundary behaviour is the same across engines.'], ['It raises an error', 'Comparing dates and strings is allowed here.']], answer: 0, explanation: 'Use ts >= \'2024-01-01\' AND ts < \'2024-02-01\' to include the whole of 31 January.' }),
];

// ---------------------------------------------------------------------------------------
const NH = 'sql.null-handling';
const nullHandling = sqlTopic({
  id: NH, title: 'NULL Handling', level: 'foundation', estMinutes: 40, prerequisites: [SB],
  summary: 'Three-valued logic, COALESCE, and the NOT IN + NULL trap.',
  objectives: ['Explain three-valued logic (TRUE, FALSE, UNKNOWN) and how WHERE treats UNKNOWN.', 'Use IS NULL, COALESCE and NULLIF correctly.', 'Predict how aggregates and joins treat NULLs.', 'Avoid the NOT IN + NULL trap.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'NULL means "unknown"', bodyMd: `NULL is not a value; it marks a missing or unknown value. Any comparison with NULL (\`=\`, \`<>\`, \`<\`) yields **UNKNOWN**, and WHERE keeps only rows where the condition is TRUE.

| Expression | Result |
|---|---|
| \`NULL = NULL\` | UNKNOWN (not TRUE) |
| \`NULL <> 5\` | UNKNOWN |
| \`TRUE AND UNKNOWN\` | UNKNOWN |
| \`TRUE OR UNKNOWN\` | TRUE |
| \`NOT UNKNOWN\` | UNKNOWN |

Use \`IS NULL\` / \`IS NOT NULL\` to test for NULL. Arithmetic with NULL gives NULL (\`5 + NULL\` is NULL).` },
    { id: 'aggregates', kind: 'concept', title: 'NULLs in aggregates and joins', bodyMd: `- \`COUNT(*)\` counts rows; \`COUNT(col)\` counts **non-NULL** values.
- \`SUM\`, \`AVG\`, \`MIN\`, \`MAX\` ignore NULLs. \`AVG(col)\` divides by the count of non-NULL values. If every value is NULL (or there are no rows), SUM returns **NULL**, not 0.
- \`GROUP BY\` puts all NULLs into **one** group.
- Join conditions never match NULL to NULL (\`a.k = b.k\` is UNKNOWN).
- \`COALESCE(x, y, …)\` returns the first non-NULL argument; \`NULLIF(a, b)\` returns NULL when a = b (handy to avoid division by zero: \`x / NULLIF(y, 0)\`).` },
    { id: 'notin', kind: 'mistakes', title: 'The NOT IN trap', bodyMd: `\`x NOT IN (1, 2, NULL)\` means \`x <> 1 AND x <> 2 AND x <> NULL\`. The last part is UNKNOWN, so the whole condition is never TRUE and the query returns **no rows**.

This happens silently with subqueries: \`WHERE id NOT IN (SELECT manager_id FROM employees)\` returns nothing if any manager_id is NULL. Use \`NOT EXISTS\` or a \`LEFT JOIN … IS NULL\` anti-join instead. Both are NULL-safe.`, code: [sqlCode(`-- NULL-safe anti-join
SELECT d.name
FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id);`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. \`WHERE col = NULL\` (always empty) instead of \`IS NULL\`.
2. \`WHERE col <> 'x'\` silently drops NULL rows. Add \`OR col IS NULL\` if they should be kept.
3. Reporting SUM over no rows as NULL when 0 is expected. Wrap it in COALESCE.
4. Assuming \`COUNT(col)\` equals \`COUNT(*)\`.
5. \`NOT IN\` with a nullable subquery.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is three-valued logic in SQL?', answerMd: 'Conditions evaluate to TRUE, FALSE or UNKNOWN; comparisons involving NULL are UNKNOWN. WHERE, HAVING and JOIN ON keep only TRUE rows, so UNKNOWN behaves like FALSE for filtering, but NOT UNKNOWN is still UNKNOWN.' },
    { id: 'iq2', q: 'COUNT(*) vs COUNT(column)?', answerMd: 'COUNT(*) counts all rows (including all-NULL rows); COUNT(column) counts rows where that column is not NULL. COUNT(DISTINCT column) counts distinct non-NULL values.' },
    { id: 'iq3', q: 'Why prefer NOT EXISTS over NOT IN?', answerMd: 'If the subquery returns any NULL, NOT IN yields no rows (UNKNOWN for everyone). NOT EXISTS checks for the absence of matching rows and is unaffected by NULLs. It is also often optimised as an anti-join.' },
    { id: 'iq4', q: 'How do you avoid division by zero in SQL?', answerMd: 'Use NULLIF on the divisor: a / NULLIF(b, 0) returns NULL instead of an error when b = 0. Wrap it in COALESCE if a default number is needed.' },
  ],
  revision: { notesMd: `- Comparisons with NULL are UNKNOWN; WHERE keeps only TRUE.
- IS NULL / IS NOT NULL; COALESCE(x, default); NULLIF(a, b).
- COUNT(*) counts rows; COUNT(col) skips NULLs; SUM of nothing is NULL.
- NOT IN with a NULL in the list means no rows; use NOT EXISTS.
- GROUP BY groups all NULLs together; joins never match NULL = NULL.`, flashcards: [
    { id: 'f1', front: 'Result of `NULL = NULL`?', backMd: 'UNKNOWN (not TRUE).' },
    { id: 'f2', front: 'Why can `NOT IN (subquery)` return nothing?', backMd: 'Any NULL in the subquery makes the predicate UNKNOWN for every row.' },
    { id: 'f3', front: 'SUM over zero rows returns?', backMd: 'NULL. Use COALESCE(SUM(x), 0).' },
    { id: 'f4', front: 'AVG ignores NULLs: what is the denominator?', backMd: 'The count of non-NULL values.' },
    { id: 'f5', front: 'Safe division?', backMd: 'a / NULLIF(b, 0).' },
  ] },
  resources: [{ title: 'NULL Handling in SQLite vs other engines (SQLite docs)', url: 'https://www.sqlite.org/nulls.html', kind: 'official-docs' }, MODE],
});

const nhMcqs: MCQ[] = [
  mcq({ ...q(NH), id: 'sql.nh.q1', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE t (v INTEGER);
INSERT INTO t VALUES (1), (2), (NULL);
SELECT COUNT(*) AS rows_, COUNT(v) AS vals, SUM(v) AS s, AVG(v) AS a FROM t;`, '3 | 2 | 3 | 1.5'), options: ['3 | 2 | 3 | 1.5', ['3 | 3 | 3 | 1.0', 'COUNT(v) and AVG(v) skip the NULL.'], ['3 | 2 | NULL | NULL', 'SUM and AVG ignore NULLs; they do not become NULL.'], ['2 | 2 | 3 | 1.5', 'COUNT(*) counts all rows, including the NULL row.']], answer: 0, explanation: 'COUNT(*) = 3 rows; COUNT(v) = 2 non-NULL values; SUM = 3; AVG = 3 / 2 = 1.5.', verified: 'executed' }),
  mcq({ ...q(NH), id: 'sql.nh.q2', type: 'code-output', difficulty: 'hard', stem: 'How many rows does the final query count?', code: out(`CREATE TABLE a (id INTEGER);
CREATE TABLE b (id INTEGER);
INSERT INTO a VALUES (1), (2), (3);
INSERT INTO b VALUES (1), (NULL);
SELECT COUNT(*) FROM a WHERE id NOT IN (SELECT id FROM b);`, '0'), options: ['0', ['2', 'That would be correct if b had no NULL.'], ['3', 'The predicate is never TRUE.'], ['1', 'NULL in the list makes every row UNKNOWN.']], answer: 0, explanation: 'id NOT IN (1, NULL) is (id <> 1 AND id <> NULL); the second part is UNKNOWN, so no row qualifies.', verified: 'executed' }),
  mcq({ ...q(NH), id: 'sql.nh.q3', type: 'concept', difficulty: 'easy', stem: 'Which condition finds rows where `email` is missing?', options: ['email IS NULL', ['email = NULL', 'Always UNKNOWN.'], ["email = ''", 'An empty string is a value, not NULL (except in Oracle).'], ['email <> NULL', 'Always UNKNOWN.']], answer: 0, explanation: 'Only IS NULL tests for NULL.' }),
  mcq({ ...q(NH), id: 'sql.nh.q4', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE s (amt INTEGER);
SELECT SUM(amt) AS raw_sum, COALESCE(SUM(amt), 0) AS safe_sum FROM s;`, 'NULL | 0'), options: ['NULL | 0', ['0 | 0', 'SUM over no rows is NULL.'], ['No rows', 'An aggregate without GROUP BY always returns one row.'], ['NULL | NULL', 'COALESCE replaces the NULL.']], answer: 0, explanation: 'An aggregate over an empty table still returns one row; SUM of nothing is NULL.', verified: 'executed' }),
  mcq({ ...q(NH), id: 'sql.nh.q5', type: 'concept', difficulty: 'medium', stem: '`SELECT … WHERE status <> \'shipped\'`: what happens to rows where status IS NULL?', options: ['They are excluded', ['They are included', "NULL <> 'shipped' is UNKNOWN, not TRUE."], ['The query fails', 'It runs fine.'], ['They are included only in MySQL', 'All standard engines behave the same here.']], answer: 0, explanation: "Add OR status IS NULL if those rows are meant to be included." }),
  mcq({ ...q(NH), id: 'sql.nh.q6', type: 'code-output', difficulty: 'medium', stem: 'How many groups does the final query return?', code: out(`CREATE TABLE e (dept TEXT);
INSERT INTO e VALUES ('a'), (NULL), ('a'), (NULL), ('b');
SELECT COUNT(*) FROM (SELECT dept FROM e GROUP BY dept) AS g;`, '3'), options: [['2', 'NULLs form their own group.'], '3', ['4', 'All NULLs fall into a single group.'], ['5', 'Groups collapse duplicates.']], answer: 1, explanation: 'Groups: a, b, and one NULL group.', verified: 'executed' }),
];

// ---------------------------------------------------------------------------------------
const AG = 'sql.aggregation';
const aggregation = sqlTopic({
  id: AG, title: 'Aggregation, GROUP BY and HAVING', level: 'foundation', estMinutes: 50, prerequisites: [SB],
  summary: 'Summaries per group, HAVING vs WHERE, and zero-count groups.',
  objectives: ['Group rows and compute COUNT/SUM/AVG/MIN/MAX per group.', 'Choose WHERE (rows) vs HAVING (groups) correctly.', 'Include zero-count groups with LEFT JOIN and COUNT(col).', 'Know the "every selected column must be grouped or aggregated" rule.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Collapsing rows into groups', bodyMd: `GROUP BY collapses rows that share the same values in the grouping columns into one output row per group. Each output column must be either a grouping column or an aggregate. (MySQL's ONLY_FULL_GROUP_BY mode enforces this; older permissive modes return an arbitrary value, which is a common source of wrong answers.)

**WHERE vs HAVING:** WHERE filters rows *before* grouping; HAVING filters groups *after* aggregation. A condition on an aggregate (\`COUNT(*) > 2\`) must go in HAVING. A plain row condition belongs in WHERE (it is also faster, because fewer rows are grouped).` },
    { id: 'zero', kind: 'example', title: 'Zero-count groups', bodyMd: 'Groups only exist for rows that exist. To list every department **including those with no employees**, start from departments, LEFT JOIN employees, and count a column from the right side (which is NULL for the padded row).', code: [sqlCode(`SELECT d.name, COUNT(e.id) AS headcount   -- COUNT(*) would give 1 for empty departments
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
GROUP BY d.id, d.name;`)] },
    { id: 'patterns', kind: 'example', title: 'Useful aggregate patterns', bodyMd: `- Duplicates: \`GROUP BY email HAVING COUNT(*) > 1\`.
- Groups where *all* rows satisfy a condition: \`HAVING MIN(score) >= 40\` or \`HAVING SUM(CASE WHEN bad THEN 1 ELSE 0 END) = 0\`.
- Distinct counts: \`COUNT(DISTINCT user_id)\`.
- Ratios: \`AVG(CASE WHEN cond THEN 1.0 ELSE 0 END)\` gives the fraction of rows meeting a condition (note the 1.0 to avoid integer division).` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Putting an aggregate condition in WHERE (an error).
2. Selecting a non-grouped column (an error in strict modes, a random value in permissive MySQL).
3. Losing zero-count groups by using INNER JOIN or \`COUNT(*)\` with a LEFT JOIN.
4. Integer division: in SQLite, PostgreSQL and SQL Server \`SUM(int)/COUNT(*)\` truncates; multiply by 1.0. (MySQL \`/\` returns a decimal.)
5. Join multiplication before aggregation (joining two child tables to the same parent multiplies rows; aggregate each separately first).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'WHERE vs HAVING?', answerMd: 'WHERE filters rows before grouping and cannot use aggregates; HAVING filters groups after aggregation. Put plain row conditions in WHERE for correctness and speed.' },
    { id: 'iq2', q: 'How do you list categories with zero sales?', answerMd: 'Start from the category table, LEFT JOIN the sales, GROUP BY category, and count or sum a right-side column with COALESCE: COUNT(s.id) or COALESCE(SUM(s.amount), 0).' },
    { id: 'iq3', q: 'How do you find duplicate emails?', answerMd: 'SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1. To list the full duplicate rows, join back or use COUNT(*) OVER (PARTITION BY email).' },
    { id: 'iq4', q: 'Why might SUM over a join be wrong?', answerMd: 'If the join multiplies rows (one order joined to several items and several payments), each amount is repeated. Aggregate each child table to the parent grain first, then join.' },
  ],
  revision: { notesMd: `- Every SELECT column is grouped or aggregated.
- WHERE (rows) runs before GROUP BY; HAVING (groups) after.
- Zero groups: LEFT JOIN + COUNT(right.col).
- "All rows satisfy X": HAVING MIN(...) / SUM(CASE ...) = 0.
- Watch integer division and join multiplication.`, flashcards: [
    { id: 'f1', front: 'Filter on COUNT(*) > 2: WHERE or HAVING?', backMd: 'HAVING.' },
    { id: 'f2', front: 'Count employees per department including empty ones?', backMd: 'departments LEFT JOIN employees … COUNT(e.id).' },
    { id: 'f3', front: 'Fraction of rows meeting a condition?', backMd: 'AVG(CASE WHEN cond THEN 1.0 ELSE 0 END).' },
    { id: 'f4', front: 'Groups where every score ≥ 40?', backMd: 'HAVING MIN(score) >= 40.' },
    { id: 'f5', front: 'Why does joining two child tables break SUM?', backMd: 'Rows multiply; pre-aggregate each child first.' },
  ] },
  resources: [{ title: 'Aggregate functions (SQLite docs)', url: 'https://www.sqlite.org/lang_aggfunc.html', kind: 'official-docs' }, MODE, LC_SQL50],
});

const agMcqs: MCQ[] = [
  mcq({ ...q(AG), id: 'sql.ag.q1', type: 'concept', difficulty: 'easy', stem: 'You need departments with more than 5 employees. Where does `COUNT(*) > 5` go?', options: ['HAVING', ['WHERE', 'Aggregates are not available in WHERE.'], ['ORDER BY', 'That only sorts.'], ['GROUP BY', 'GROUP BY lists grouping columns, not conditions.']], answer: 0, explanation: 'Group-level conditions go in HAVING, which is evaluated after aggregation.' }),
  mcq({ ...q(AG), id: 'sql.ag.q2', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return for department "Legal", which has no employees?', code: out(`CREATE TABLE d (id INTEGER, name TEXT);
CREATE TABLE e (id INTEGER, dept_id INTEGER);
INSERT INTO d VALUES (1, 'Eng'), (2, 'Legal');
INSERT INTO e VALUES (10, 1), (11, 1);
SELECT COUNT(*) AS star, COUNT(e.id) AS col
FROM d LEFT JOIN e ON e.dept_id = d.id
WHERE d.name = 'Legal'
GROUP BY d.id;`, '1 | 0'), options: ['1 | 0', ['0 | 0', 'COUNT(*) counts the NULL-padded row.'], ['1 | 1', 'COUNT(e.id) skips NULL.'], ['No row', 'The LEFT JOIN keeps Legal.']], answer: 0, explanation: 'The LEFT JOIN produces one row for Legal with NULL employee columns: COUNT(*) = 1, COUNT(e.id) = 0.', verified: 'executed' }),
  mcq({ ...q(AG), id: 'sql.ag.q3', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return in SQLite?', code: out(`CREATE TABLE r (score INTEGER);
INSERT INTO r VALUES (1), (2);
SELECT SUM(score) / COUNT(*) AS int_avg, SUM(score) * 1.0 / COUNT(*) AS real_avg FROM r;`, '1 | 1.5'), options: ['1 | 1.5', ['1.5 | 1.5', 'Integer division truncates in SQLite.'], ['2 | 1.5', 'It truncates, it does not round up.'], ['1 | 1', 'Multiplying by 1.0 forces real division.']], answer: 0, explanation: '3 / 2 with integers is 1 in SQLite (also PostgreSQL and SQL Server); 3.0 / 2 = 1.5. MySQL\'s / would return 1.5000 for both.', verified: 'executed' }),
  mcq({ ...q(AG), id: 'sql.ag.q4', type: 'pattern', difficulty: 'medium', stem: 'Find customers whose **every** order was shipped. Which HAVING clause works (on orders grouped by customer)?', options: ["HAVING SUM(CASE WHEN status <> 'shipped' THEN 1 ELSE 0 END) = 0", ["HAVING status = 'shipped'", 'status is not grouped; this is ambiguous or an error.'], ["WHERE status = 'shipped'", 'That finds customers with at least one shipped order.'], ['HAVING COUNT(*) > 0', 'That matches every customer with orders.']], answer: 0, explanation: 'Counting violations per group and requiring zero expresses "for all". MIN/MAX tricks work too for boolean-like columns.' }),
  mcq({ ...q(AG), id: 'sql.ag.q5', type: 'debug', difficulty: 'hard', stem: 'Orders join to both `items` (2 rows for order 1) and `payments` (3 rows for order 1). `SUM(p.amount)` after joining all three tables reports twice the real payments. Why?', options: ['Each payment row is repeated once per item row (2 × 3 = 6 joined rows)', ['SUM double-counts by design', 'SUM adds what it is given.'], ['The GROUP BY is missing a column', 'The grain issue remains with any grouping.'], ['Payments contain NULLs', 'NULLs would lower the sum, not double it.']], answer: 0, explanation: 'Joining two independent child tables to the same parent creates a cross product per parent. Pre-aggregate each child to the order level, then join.' }),
  mcq({ ...q(AG), id: 'sql.ag.q6', type: 'code-output', difficulty: 'easy', stem: 'How many rows does the final query return?', code: out(`CREATE TABLE u (email TEXT);
INSERT INTO u VALUES ('a@x'), ('b@x'), ('a@x'), ('c@x'), ('b@x'), ('a@x');
SELECT COUNT(*) FROM (SELECT email FROM u GROUP BY email HAVING COUNT(*) > 1) AS dup;`, '2'), options: [['1', 'Both a@x and b@x repeat.'], '2', ['3', 'c@x appears once.'], ['5', 'The outer query counts groups, not rows.']], answer: 1, explanation: 'a@x (3 times) and b@x (2 times) are duplicated.', verified: 'executed' }),
];

// ---------------------------------------------------------------------------------------
const JN = 'sql.joins';
const joins = sqlTopic({
  id: JN, title: 'Joins', level: 'core', estMinutes: 60, prerequisites: [AG],
  summary: 'Inner, outer, cross, anti- and semi-joins, and join row multiplication.',
  objectives: ['Predict the rows produced by INNER, LEFT, RIGHT, FULL and CROSS joins.', 'Write anti-joins (rows without a match) and semi-joins (rows with at least one match).', 'Know that a WHERE on the right table turns a LEFT JOIN into an INNER JOIN.', 'Reason about row multiplication when keys are not unique.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'What each join keeps', bodyMd: `| Join | Keeps |
|---|---|
| \`INNER JOIN\` | only pairs that match the ON condition |
| \`LEFT JOIN\` | every left row; right columns NULL when no match |
| \`RIGHT JOIN\` | every right row (rewrite as LEFT by swapping tables) |
| \`FULL OUTER JOIN\` | every row from both sides (MySQL: emulate with LEFT ∪ RIGHT) |
| \`CROSS JOIN\` | every pair (n × m rows) |

A join on a **non-unique** key multiplies rows: if a left row matches 3 right rows, it appears 3 times. This is correct SQL but often a logic bug before aggregating.` },
    { id: 'anti', kind: 'example', title: 'Anti-join and semi-join', bodyMd: '"Customers who never ordered" is an anti-join; "customers who ordered at least once" (each customer listed once) is a semi-join.', code: [sqlCode(`-- Anti-join: customers with no orders
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- Semi-join: customers with at least one order (no duplicates)
SELECT c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);`)] },
    { id: 'on-vs-where', kind: 'concept', title: 'ON vs WHERE in outer joins', bodyMd: `For an **outer** join, a condition on the optional (right) table behaves very differently in ON and in WHERE:

- \`LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'shipped'\`: every customer is kept; only shipped orders are attached.
- \`LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'shipped'\`: customers without a shipped order have NULL status, the WHERE removes them, and the result behaves like an INNER JOIN.

For INNER joins, ON and WHERE are equivalent.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Filtering the right table in WHERE after a LEFT JOIN (an accidental inner join).
2. Using JOIN + DISTINCT to fake a semi-join; EXISTS is clearer and avoids multiplication.
3. Forgetting the join condition, which turns into a cross join (n × m rows).
4. Joining on columns with NULLs: NULL never equals NULL.
5. Summing after joining several one-to-many tables (row multiplication).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the difference between INNER and LEFT JOIN with an example.', answerMd: 'INNER keeps only matching pairs: customers who have orders. LEFT keeps every customer and fills order columns with NULL when there is no match, so customers without orders still appear.' },
    { id: 'iq2', q: 'How do you find rows in A with no match in B?', answerMd: 'LEFT JOIN B and filter WHERE B.key IS NULL, or use WHERE NOT EXISTS (correlated). Avoid NOT IN when B.key can be NULL.' },
    { id: 'iq3', q: 'Why can a LEFT JOIN return more rows than the left table?', answerMd: 'If a left row matches several right rows, it is repeated once per match. LEFT JOIN guarantees at least one row per left row, not exactly one.' },
    { id: 'iq4', q: 'How do you do a FULL OUTER JOIN in MySQL?', answerMd: 'A LEFT JOIN UNION a RIGHT JOIN (or a LEFT JOIN UNION ALL the unmatched rows of the right table found with an anti-join). MySQL has no FULL OUTER JOIN keyword.' },
  ],
  revision: { notesMd: `- INNER = matches only; LEFT = all left rows plus NULL padding.
- Anti-join: LEFT JOIN … WHERE right.key IS NULL, or NOT EXISTS.
- Semi-join: EXISTS (no duplicates).
- A right-table filter goes in ON to keep left rows.
- Non-unique keys multiply rows.`, flashcards: [
    { id: 'f1', front: 'Customers with no orders (two ways)?', backMd: 'LEFT JOIN … WHERE o.id IS NULL; or WHERE NOT EXISTS (…).' },
    { id: 'f2', front: 'Effect of WHERE right.col = x after a LEFT JOIN?', backMd: 'It removes unmatched rows, so it behaves like an INNER JOIN.' },
    { id: 'f3', front: 'Rows from CROSS JOIN of n and m rows?', backMd: 'n × m.' },
    { id: 'f4', front: 'FULL OUTER JOIN in MySQL?', backMd: 'LEFT JOIN UNION RIGHT JOIN.' },
    { id: 'f5', front: 'Semi-join without duplicates?', backMd: 'WHERE EXISTS (correlated subquery).' },
  ] },
  resources: [{ title: 'Join types (ThoughtSpot SQL tutorial)', url: 'https://www.thoughtspot.com/sql-tutorial/sql-joins', kind: 'course' }, SQLITE_SELECT, LC_SQL50],
});

const jnMcqs: MCQ[] = [
  mcq({ ...q(JN), id: 'sql.jn.q1', type: 'code-output', difficulty: 'medium', stem: 'How many rows does the final query return?', code: out(`CREATE TABLE c (id INTEGER);
CREATE TABLE o (cid INTEGER);
INSERT INTO c VALUES (1), (2), (3);
INSERT INTO o VALUES (1), (1), (2), (4);
SELECT COUNT(*) FROM c LEFT JOIN o ON o.cid = c.id;`, '4'), options: [['3', 'Customer 1 matches two orders, so it appears twice.'], '4', ['5', 'Order 4 has no customer, so a LEFT JOIN from c drops it.'], ['6', 'Only matching pairs plus unmatched left rows are kept.']], answer: 1, explanation: 'Customer 1 gives 2 rows, customer 2 gives 1, customer 3 gives 1 (NULL padded): 4 rows.', verified: 'executed' }),
  mcq({ ...q(JN), id: 'sql.jn.q2', type: 'debug', difficulty: 'medium', stem: '`SELECT c.name, o.id FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = \'shipped\';` drops customers without shipped orders. Fix?', options: ["Move o.status = 'shipped' into the ON clause", ['Use RIGHT JOIN', 'That keeps all orders, not all customers.'], ['Add DISTINCT', 'Duplicates are not the problem.'], ["Use WHERE o.status = 'shipped' OR o.id IS NOT NULL", 'This still removes customers with no shipped orders.']], answer: 0, explanation: 'Conditions in ON restrict which right rows attach; WHERE filters the joined result, removing the NULL-padded rows.' }),
  mcq({ ...q(JN), id: 'sql.jn.q3', type: 'concept', difficulty: 'easy', stem: 'A query joins `employees` (100 rows) to `departments` (5 rows) but forgets the ON condition (written as a comma join with no WHERE). How many rows?', options: ['500', ['100', 'Without a condition, every employee pairs with every department.'], ['105', 'That would be a UNION.'], ['5', 'Far too few.']], answer: 0, explanation: 'This is a Cartesian product: 100 × 5.' }),
  mcq({ ...q(JN), id: 'sql.jn.q4', type: 'code-output', difficulty: 'medium', stem: 'What does the final query count?', code: out(`CREATE TABLE a (k INTEGER);
CREATE TABLE b (k INTEGER);
INSERT INTO a VALUES (1), (NULL);
INSERT INTO b VALUES (1), (NULL);
SELECT COUNT(*) FROM a JOIN b ON a.k = b.k;`, '1'), options: ['1', ['2', 'NULL = NULL is not TRUE, so the NULLs do not join.'], ['4', 'That is the cross product.'], ['0', 'The 1s match.']], answer: 0, explanation: 'Only 1 = 1 matches; NULL never equals NULL in a join condition.', verified: 'executed' }),
  mcq({ ...q(JN), id: 'sql.jn.q5', type: 'pattern', difficulty: 'medium', stem: 'List each product that has been ordered at least once, **once**, with no duplicates. Best approach?', options: ['WHERE EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id)', ['INNER JOIN order_items without DISTINCT', 'Products ordered several times appear several times.'], ['LEFT JOIN … WHERE oi.product_id IS NULL', 'That finds products never ordered.'], ['CROSS JOIN order_items', 'That pairs every product with every item.']], answer: 0, explanation: 'EXISTS is a semi-join: each product row is returned at most once. JOIN + DISTINCT also works but does more work.' }),
  mcq({ ...q(JN), id: 'sql.jn.q6', type: 'code-output', difficulty: 'hard', stem: 'What does the final query return (customer 2 has only a cancelled order)?', code: out(`CREATE TABLE c (id INTEGER, name TEXT);
CREATE TABLE o (cid INTEGER, status TEXT);
INSERT INTO c VALUES (1, 'A'), (2, 'B');
INSERT INTO o VALUES (1, 'shipped'), (2, 'cancelled');
SELECT c.name, COUNT(o.cid) AS shipped
FROM c LEFT JOIN o ON o.cid = c.id AND o.status = 'shipped'
GROUP BY c.id, c.name
ORDER BY c.name;`, 'A | 1\nB | 0'), options: ['A | 1 and B | 0', ['Only A | 1', 'The status filter is in ON, so B is kept.'], ['A | 1 and B | 1', "B's cancelled order does not satisfy the ON condition."], ['A | 0 and B | 0', "A's shipped order matches."]], answer: 0, explanation: 'Because the filter is part of ON, B stays with a NULL-padded row and counts 0.', verified: 'executed' }),
];

// ---------------------------------------------------------------------------------------
const WF = 'sql.window-functions';
const windowFns = sqlTopic({
  id: WF, title: 'Window Functions', level: 'core', estMinutes: 70, prerequisites: [AG, 'sql.cte'],
  summary: 'Ranking, LAG/LEAD, running totals and moving averages without collapsing rows.',
  objectives: ['Explain how OVER (PARTITION BY … ORDER BY …) differs from GROUP BY.', 'Choose ROW_NUMBER vs RANK vs DENSE_RANK for ties.', 'Use LAG/LEAD for previous/next comparisons and SUM OVER for running totals.', 'Filter on window results via a subquery or CTE (they cannot go in WHERE).'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Aggregates that keep every row', bodyMd: `A window function computes a value **for each row** from a set of related rows (its window), without collapsing rows like GROUP BY does.

\`func(...) OVER (PARTITION BY p ORDER BY o ROWS/RANGE frame)\`
- **PARTITION BY**: split rows into independent groups (like GROUP BY, but rows are kept).
- **ORDER BY**: order within the partition (needed for ranking, LAG/LEAD and running totals).
- **Frame**: which rows around the current one are included. With ORDER BY, the default frame is "from the partition start to the current row" (for RANGE, including peers with equal ORDER BY values).

Window functions are evaluated after WHERE/GROUP BY/HAVING, so to filter on them (\`rn = 1\`), wrap the query in a subquery or CTE.` },
    { id: 'ranking', kind: 'comparison', title: 'ROW_NUMBER vs RANK vs DENSE_RANK', bodyMd: `For salaries 300, 300, 200:

| Function | Values | Use |
|---|---|---|
| ROW_NUMBER | 1, 2, 3 | exactly one row per position (ties broken arbitrarily unless you add a tie-breaker) |
| RANK | 1, 1, 3 | ties share a rank; gaps after ties ("Olympic" ranking) |
| DENSE_RANK | 1, 1, 2 | ties share a rank; no gaps ("Nth highest distinct value") |

**Top-N per group:** \`ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)\`, then keep rn ≤ N. Use RANK/DENSE_RANK instead if ties must all be included.` },
    { id: 'lag', kind: 'example', title: 'LAG, LEAD and running totals', bodyMd: 'LAG/LEAD read a value from a previous/next row in the window order: day-over-day change, consecutive events, gaps.', code: [sqlCode(`SELECT login_date,
       COUNT(*) AS logins,
       COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY login_date)       AS change_vs_prev_day,
       SUM(COUNT(*)) OVER (ORDER BY login_date)                 AS running_total,
       AVG(COUNT(*)) OVER (ORDER BY login_date
                           ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg_3
FROM logins
GROUP BY login_date;`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Putting a window function in WHERE (not allowed). Filter it in an outer query.
2. Using ROW_NUMBER when ties must be kept (or RANK when exactly one row is required).
3. Forgetting a deterministic tie-breaker in ORDER BY, which makes results non-repeatable.
4. Running totals with duplicate ORDER BY values: the default RANGE frame includes all peers, so tied rows show the same total. Use \`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\` for a strict row-by-row total.
5. MySQL before 8.0 has no window functions (most OAs now use 8.0+).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'GROUP BY vs window functions?', answerMd: 'GROUP BY returns one row per group; window functions keep every row and add a computed column per row, based on its partition. Use windows for rankings, running totals and comparisons with neighbours.' },
    { id: 'iq2', q: 'How do you get the top 3 earners per department?', answerMd: 'Compute DENSE_RANK() (or ROW_NUMBER, if exactly 3 rows are required) OVER (PARTITION BY dept ORDER BY salary DESC) in a CTE, then filter rnk <= 3 in the outer query.' },
    { id: 'iq3', q: 'How do you compute a running total?', answerMd: 'SUM(amount) OVER (ORDER BY date, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW). Add PARTITION BY for per-group running totals.' },
    { id: 'iq4', q: 'How do you find users with logins on consecutive days?', answerMd: 'Either use LAG(date) OVER (PARTITION BY user ORDER BY date) and compare with date − 1 day, or the gaps-and-islands trick: date − ROW_NUMBER() is constant within a consecutive run. Deduplicate dates first.' },
  ],
  revision: { notesMd: `- OVER keeps rows; PARTITION BY = groups; ORDER BY = order within them.
- ROW_NUMBER 1,2,3 · RANK 1,1,3 · DENSE_RANK 1,1,2.
- Filter window results in an outer query or CTE.
- LAG/LEAD for neighbours; SUM OVER (ORDER BY) for running totals.
- Add a tie-breaker; use ROWS frames for strict running sums.`, flashcards: [
    { id: 'f1', front: 'Ranks for 300, 300, 200 with RANK and DENSE_RANK?', backMd: 'RANK 1, 1, 3; DENSE_RANK 1, 1, 2.' },
    { id: 'f2', front: 'Where can you filter on ROW_NUMBER?', backMd: 'Only in an outer query or CTE, not in WHERE of the same SELECT.' },
    { id: 'f3', front: 'Previous row value?', backMd: 'LAG(col) OVER (PARTITION BY … ORDER BY …).' },
    { id: 'f4', front: 'Moving average of 3 rows?', backMd: 'AVG(x) OVER (ORDER BY d ROWS BETWEEN 2 PRECEDING AND CURRENT ROW).' },
    { id: 'f5', front: 'Gaps-and-islands key?', backMd: 'date − ROW_NUMBER() OVER (PARTITION BY user ORDER BY date).' },
  ] },
  resources: [{ title: 'Window functions (PostgreSQL tutorial)', url: 'https://www.postgresql.org/docs/current/tutorial-window.html', kind: 'official-docs' }, { title: 'Window functions (SQLite docs)', url: 'https://www.sqlite.org/windowfunctions.html', kind: 'official-docs' }, LC_SQL50],
});

const wfMcqs: MCQ[] = [
  mcq({ ...q(WF), id: 'sql.wf.q1', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE s (v INTEGER);
INSERT INTO s VALUES (300), (300), (200);
SELECT v,
       RANK()       OVER (ORDER BY v DESC) AS r,
       DENSE_RANK() OVER (ORDER BY v DESC) AS d
FROM s
ORDER BY v DESC, r;`, '300 | 1 | 1\n300 | 1 | 1\n200 | 3 | 2'), options: ['300|1|1, 300|1|1, 200|3|2', ['300|1|1, 300|2|2, 200|3|3', 'That is ROW_NUMBER behaviour.'], ['300|1|1, 300|1|1, 200|2|2', 'RANK leaves a gap after ties.'], ['300|1|1, 300|1|1, 200|3|3', 'DENSE_RANK does not leave gaps.']], answer: 0, explanation: 'RANK: 1, 1, 3 (gap). DENSE_RANK: 1, 1, 2 (no gap).', verified: 'executed' }),
  mcq({ ...q(WF), id: 'sql.wf.q2', type: 'debug', difficulty: 'easy', stem: '`SELECT name, ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn FROM emp WHERE rn = 1;` fails. Why?', options: ['Window functions are computed after WHERE, so rn is not available there', ['ROW_NUMBER needs PARTITION BY', 'PARTITION BY is optional.'], ['rn is a reserved word', 'It is not.'], ['ORDER BY is not allowed in OVER', 'It is required for ROW_NUMBER semantics.']], answer: 0, explanation: 'Wrap it: SELECT * FROM (… ) t WHERE rn = 1, or use a CTE.' }),
  mcq({ ...q(WF), id: 'sql.wf.q3', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE d (day INTEGER, amt INTEGER);
INSERT INTO d VALUES (1, 10), (2, 5), (3, 20);
SELECT day, SUM(amt) OVER (ORDER BY day) AS run,
       amt - LAG(amt) OVER (ORDER BY day) AS diff
FROM d ORDER BY day;`, '1 | 10 | NULL\n2 | 15 | -5\n3 | 35 | 15'), options: ['1|10|NULL, 2|15|-5, 3|35|15', ['1|10|0, 2|15|-5, 3|35|15', 'LAG on the first row is NULL, so the difference is NULL.'], ['1|10|NULL, 2|5|-5, 3|20|15', 'SUM OVER (ORDER BY) is cumulative.'], ['1|35|NULL, 2|35|-5, 3|35|15', 'With ORDER BY the frame ends at the current row.']], answer: 0, explanation: 'Running sum: 10, 15, 35. LAG: NULL, 10, 5, giving differences NULL, −5, 15.', verified: 'executed' }),
  mcq({ ...q(WF), id: 'sql.wf.q4', type: 'pattern', difficulty: 'medium', stem: 'Return the single most recent order per customer (exactly one row each, ties broken by the higher order id). Which function?', options: ['ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC)', ['RANK() OVER (ORDER BY order_date DESC)', 'Missing PARTITION BY; ties would also repeat.'], ['DENSE_RANK() OVER (PARTITION BY customer_id ORDER BY order_date DESC)', 'Ties on the same date would return several rows.'], ['MAX(order_date) GROUP BY customer_id', 'That gives the date, not the whole order row.']], answer: 0, explanation: 'ROW_NUMBER with a deterministic tie-breaker yields exactly one row per partition at rn = 1.' }),
  mcq({ ...q(WF), id: 'sql.wf.q5', type: 'concept', difficulty: 'medium', stem: 'What does PARTITION BY do in a window function?', options: ['Splits rows into independent groups for the computation while keeping every row', ['Collapses each group into one row', 'That is GROUP BY.'], ['Sorts the final output', 'That is the outer ORDER BY.'], ['Creates physical table partitions', 'That is a DDL feature, unrelated.']], answer: 0, explanation: 'Each partition is processed separately; rankings restart at 1 in every partition.' }),
  mcq({ ...q(WF), id: 'sql.wf.q6', type: 'code-output', difficulty: 'hard', stem: 'Two rows share day = 2. What does the default-frame running sum return for them?', code: out(`CREATE TABLE t (day INTEGER, amt INTEGER);
INSERT INTO t VALUES (1, 10), (2, 5), (2, 7);
SELECT day, amt, SUM(amt) OVER (ORDER BY day) AS run FROM t ORDER BY day, amt;`, '1 | 10 | 10\n2 | 5 | 22\n2 | 7 | 22'), options: ['Both rows show 22', ['15 and 22', 'That is ROWS framing; the default RANGE frame includes peers.'], ['Both rows show 15', 'Both tied rows are included.'], ['5 and 7', 'The sum is cumulative.']], answer: 0, explanation: 'The default frame with ORDER BY is RANGE … CURRENT ROW, which includes all rows tied on day = 2. Use ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW for a strict row-by-row total.', verified: 'executed' }),
];

// ---------------------------------------------------------------------------------------
const SQ = 'sql.subqueries';
const subqueries = sqlTopic({
  id: SQ, title: 'Subqueries', level: 'core', estMinutes: 50, prerequisites: [JN],
  summary: 'Scalar, IN, correlated, EXISTS and ANY/ALL subqueries.',
  objectives: ['Use scalar, IN and EXISTS subqueries appropriately.', 'Write correlated subqueries that refer to the outer row.', 'Understand ANY/ALL semantics and the empty-set edge cases.', 'Rewrite subqueries as joins or CTEs when clearer.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Kinds of subqueries', bodyMd: `- **Scalar**: returns one value; usable anywhere an expression is (\`salary > (SELECT AVG(salary) FROM emp)\`). If it returns no rows the value is NULL; if it returns several rows it is an error (except in MySQL with some settings and in SQLite, which takes the first row).
- **IN / NOT IN**: membership in a one-column result.
- **EXISTS / NOT EXISTS**: true if the subquery returns any row; the selected columns do not matter (\`SELECT 1\`).
- **Derived table**: a subquery in FROM (needs an alias in MySQL).
- **Correlated**: references the outer query's row, so it is logically re-evaluated per outer row (\`WHERE e.salary > (SELECT AVG(salary) FROM emp WHERE dept = e.dept)\`).` },
    { id: 'anyall', kind: 'concept', title: 'ANY and ALL', bodyMd: `\`x > ANY (S)\`: true if x is greater than **at least one** value (that is, greater than the minimum). \`x > ALL (S)\`: greater than **every** value (greater than the maximum).

Edge cases: \`x > ALL (empty set)\` is **TRUE**; \`x > ANY (empty set)\` is **FALSE**. NULLs in S can make ALL return UNKNOWN. SQLite does not support ANY/ALL; MySQL and PostgreSQL do. MIN/MAX rewrites are portable.` },
    { id: 'example', kind: 'example', title: 'Correlated subquery: above the department average', bodyMd: 'Each employee is compared with the average of their own department.', code: [sqlCode(`SELECT e.name, e.salary
FROM employees e
WHERE e.salary > (SELECT AVG(e2.salary)
                  FROM employees e2
                  WHERE e2.dept_id = e.dept_id);`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. A scalar subquery that can return several rows (an error at runtime).
2. NOT IN with NULLs (see NULL Handling).
3. Forgetting the alias for a derived table (an error in MySQL).
4. Writing a correlated subquery that re-computes a heavy aggregate for every row on huge tables. Consider a pre-aggregated join or a window function.
5. Using \`= (SELECT …)\` where \`IN (SELECT …)\` was needed.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is a correlated subquery?', answerMd: 'A subquery that references columns of the outer query, so it is conceptually evaluated once per outer row (for example, comparing each employee with their department average). Optimisers often rewrite it as a join.' },
    { id: 'iq2', q: 'EXISTS vs IN?', answerMd: 'IN compares against a list of values; EXISTS tests for the presence of a matching row. EXISTS is NULL-safe for the negated form and stops at the first match. Modern optimisers often produce similar plans for the positive forms.' },
    { id: 'iq3', q: 'Find employees earning more than their department average without a correlated subquery.', answerMd: 'Pre-aggregate: join employees to (SELECT dept_id, AVG(salary) avg_sal FROM employees GROUP BY dept_id) and filter salary > avg_sal. Or use AVG(salary) OVER (PARTITION BY dept_id) in a CTE.' },
    { id: 'iq4', q: 'What does x > ALL (empty) return?', answerMd: 'TRUE, since there is no value to violate it (vacuous truth). x > ANY (empty) is FALSE.' },
  ],
  revision: { notesMd: `- Scalar subquery: one value or NULL.
- EXISTS: presence of a row; NOT EXISTS is NULL-safe.
- Correlated: references the outer row.
- > ANY means > min; > ALL means > max; ALL(empty) is TRUE.
- Derived tables need an alias (MySQL).`, flashcards: [
    { id: 'f1', front: 'Scalar subquery returns no row: value?', backMd: 'NULL.' },
    { id: 'f2', front: 'x > ANY (S) equals?', backMd: 'x > MIN(S) (for non-empty S without NULLs).' },
    { id: 'f3', front: 'x > ALL (empty set)?', backMd: 'TRUE (vacuous).' },
    { id: 'f4', front: 'Define a correlated subquery.', backMd: 'A subquery that references the outer query row.' },
    { id: 'f5', front: 'NULL-safe "not in B"?', backMd: 'NOT EXISTS (… WHERE b.k = a.k).' },
  ] },
  resources: [{ title: 'Subqueries (ThoughtSpot SQL tutorial)', url: 'https://www.thoughtspot.com/sql-tutorial/sql-subquery', kind: 'course' }, SQLITE_SELECT],
});

const sqMcqs: MCQ[] = [
  mcq({ ...q(SQ), id: 'sql.sq.q1', type: 'code-output', difficulty: 'medium', stem: 'How many employees earn more than their own department average?', code: out(`CREATE TABLE e (name TEXT, dept INTEGER, sal INTEGER);
INSERT INTO e VALUES ('a',1,100), ('b',1,200), ('c',1,300), ('d',2,50), ('e',2,50);
SELECT COUNT(*) FROM e
WHERE sal > (SELECT AVG(e2.sal) FROM e e2 WHERE e2.dept = e.dept);`, '1'), options: ['1', ['2', 'Dept 1 average is 200, so only c (300) is above it.'], ['0', 'c is above its average.'], ['3', 'Dept 2 has equal salaries, so nobody is strictly above.']], answer: 0, explanation: 'Dept 1 average = 200: only c. Dept 2 average = 50: nobody is strictly greater.', verified: 'executed' }),
  mcq({ ...q(SQ), id: 'sql.sq.q2', type: 'concept', difficulty: 'medium', stem: '`salary > ANY (SELECT salary FROM interns)` is equivalent to:', options: ['salary > (SELECT MIN(salary) FROM interns), for a non-empty set without NULLs', ['salary > (SELECT MAX(salary) FROM interns)', 'That is > ALL.'], ['salary IN (SELECT salary FROM interns)', 'That is = ANY.'], ['salary > (SELECT AVG(salary) FROM interns)', 'ANY is about existence, not averages.']], answer: 0, explanation: 'Being greater than at least one value is the same as being greater than the smallest value.' }),
  mcq({ ...q(SQ), id: 'sql.sq.q3', type: 'code-output', difficulty: 'easy', stem: 'What does the final query return?', code: out(`CREATE TABLE t (x INTEGER);
INSERT INTO t VALUES (5), (7);
SELECT (SELECT x FROM t WHERE x > 100) AS v;`, 'NULL'), options: ['NULL', ['No rows', 'The outer SELECT always produces one row here.'], ['0', 'Missing values are NULL, not 0.'], ['An error', 'An empty scalar subquery is NULL.']], answer: 0, explanation: 'A scalar subquery with no rows evaluates to NULL.', verified: 'executed' }),
  mcq({ ...q(SQ), id: 'sql.sq.q4', type: 'pattern', difficulty: 'medium', stem: 'Find products that appear in **every** order (relational division). Which formulation works?', options: ['Products where NOT EXISTS an order that does NOT EXISTS an item for that product', ['Products with COUNT(*) > 0 in order_items', 'That is "at least one order".'], ['A LEFT JOIN with IS NULL', 'That finds products in no orders.'], ['Products with MAX(order_id) = MAX over all orders', 'That only checks the last order.']], answer: 0, explanation: 'Double NOT EXISTS expresses "for all". Equivalently: GROUP BY product HAVING COUNT(DISTINCT order_id) = (SELECT COUNT(*) FROM orders).' }),
  mcq({ ...q(SQ), id: 'sql.sq.q5', type: 'debug', difficulty: 'medium', stem: '`SELECT name FROM emp WHERE dept_id = (SELECT id FROM dept WHERE city = \'Pune\');` errors when Pune has two departments. Fix?', options: ['Use IN instead of =', ['Add LIMIT 1 to the subquery', 'That silently picks one department and drops the other.'], ['Use ALL', '= ALL would require one department to equal every id.'], ['Add DISTINCT', 'Two distinct ids remain.']], answer: 0, explanation: '= expects a single value; IN accepts a set.' }),
  mcq({ ...q(SQ), id: 'sql.sq.q6', type: 'code-output', difficulty: 'medium', stem: 'How many customers have at least one order?', code: out(`CREATE TABLE c (id INTEGER);
CREATE TABLE o (cid INTEGER);
INSERT INTO c VALUES (1), (2), (3);
INSERT INTO o VALUES (1), (1), (3), (3), (3);
SELECT COUNT(*) FROM c WHERE EXISTS (SELECT 1 FROM o WHERE o.cid = c.id);`, '2'), options: ['2', ['5', 'EXISTS does not multiply rows like a join.'], ['3', 'Customer 2 has no orders.'], ['1', 'Customers 1 and 3 both have orders.']], answer: 0, explanation: 'EXISTS is a semi-join: each customer counts once if any order exists.', verified: 'executed' }),
];

export const topics: Topic[] = [selectBasics, nullHandling, aggregation, joins, windowFns, subqueries];
export const mcqs: MCQ[] = [...sbMcqs, ...nhMcqs, ...agMcqs, ...jnMcqs, ...wfMcqs, ...sqMcqs];
