import type { MCQ, Resource, Topic } from '../schema';
import { mcq } from '../helpers';
import { MODE, LC_SQL50, sqlTopic, q, out } from './topics';

// SQL lessons, batch 2: self joins, set operations, CASE, CTEs, dates and strings, interview
// patterns, DML/DDL and EXPLAIN. Output-prediction MCQs are executed in tests (format: rows by
// newline, columns by " | ", NULL as "NULL").

const doc = (title: string, url: string): Resource => ({ title, url, kind: 'official-docs' });

// ---------------------------------------------------------------------------------------
const SJ = 'sql.self-joins';
const selfJoins = sqlTopic({
  id: SJ, title: 'Self Joins', level: 'core', estMinutes: 40, prerequisites: ['sql.joins'], related: ['sql.joins', 'sql.window-functions', 'sql.cte'],
  summary: 'Comparing rows of the same table: managers, pairs and consecutive rows.',
  objectives: ['Join a table to itself with two aliases and state what each alias represents.', 'Use self joins for hierarchies (employee → manager), pairs (mutual relationships) and ordered comparisons (consecutive events).', 'Avoid duplicate and self pairs with a < b, and keep rows without a partner with LEFT JOIN.', 'Recognise when LAG/LEAD or a recursive CTE is clearer than a self join.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'One table, two roles', bodyMd: `A self join treats one table as two: give it two aliases and decide what each one means.

\`\`\`sql
SELECT e.name AS employee, m.name AS manager
FROM employees e               -- e = the employee
LEFT JOIN employees m          -- m = that employee's manager
  ON m.id = e.manager_id;
\`\`\`

Three families of problems:
1. **Hierarchy (one level):** employee and manager, post and parent post. Use LEFT JOIN to keep the top of the hierarchy (no manager).
2. **Pairs:** two rows that share something (same city, mutual follows, same rider). Join on the shared attribute and add \`a.id < b.id\` so each pair appears once and nobody pairs with themselves.
3. **Ordered comparisons:** a row compared with another row of the same entity at a later time ("rebooked within 30 minutes", "temperature higher than yesterday").` },
    { id: 'example', kind: 'example', title: 'Worked examples on the company and social data', bodyMd: `**Employees who earn more than their manager:**

\`\`\`sql
SELECT e.name
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary;
\`\`\`

**Mutual follows, once per pair:** a follow a→b is mutual when the reverse row b→a exists.

\`\`\`sql
SELECT f1.follower_id, f1.followee_id
FROM follows f1
JOIN follows f2 ON f2.follower_id = f1.followee_id AND f2.followee_id = f1.follower_id
WHERE f1.follower_id < f1.followee_id;
\`\`\`

**Pairs in the same department:** \`JOIN employees b ON b.dept_id = a.dept_id AND a.id < b.id\`. With n employees in a department this produces n(n−1)/2 rows, so self joins on a low-cardinality column can explode in size.` },
    { id: 'comparison', kind: 'comparison', title: 'Self join, window function or recursive CTE?', bodyMd: `| Need | Best tool |
|---|---|
| The previous/next row of the same entity in time order | \`LAG\`/\`LEAD\` (one pass, no join) |
| One level of a hierarchy | self join |
| Any number of levels (whole reporting chain, thread root) | recursive CTE |
| All pairs satisfying a condition | self join with \`a.id < b.id\` |
| Rows within a time window of another row | self join with a range condition |

Interviewers often accept either a self join or LAG for "compared with the previous day"; mention both. LeetCode's Rising Temperature is the classic: \`JOIN weather y ON y.recordDate = DATE_SUB(t.recordDate, INTERVAL 1 DAY)\` (MySQL) handles missing days correctly, while LAG compares with the previous **row**, which may not be the previous **day**.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. **Forgetting which alias is which** in SELECT (printing the manager's name as the employee's).
2. **Inner join for hierarchies**, which drops the root (the CEO has no manager).
3. **Pairs twice or with themselves:** missing \`a.id < b.id\` (or using \`<>\`, which still gives both orders).
4. **Row explosion:** self joins on columns with few distinct values multiply rows quadratically.
5. **"Previous day" via LAG** when days can be missing; join on the date arithmetic instead.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Find employees who earn more than their managers.', answerMd: 'Self join employees e to employees m on m.id = e.manager_id and filter e.salary > m.salary. An inner join is fine here because employees without a manager cannot satisfy the condition.' },
    { id: 'iq2', q: 'How do you list each pair of rows only once?', answerMd: 'Add a strict ordering condition such as a.id < b.id. It removes both the self pair (a = b) and the mirrored duplicate (b, a). Using <> removes only the self pair.' },
    { id: 'iq3', q: 'Rising Temperature: self join or LAG?', answerMd: 'Self join on the date being exactly one day later (yesterday\'s row) is correct even when some dates are missing. LAG compares with the previous row, which is only the previous day if there are no gaps; you would need to check the date difference as well.' },
    { id: 'iq4', q: 'When would a self join be a bad idea?', answerMd: 'When it creates a quadratic number of rows (joining on a low-cardinality column), or when the relationship spans an unknown number of levels (use a recursive CTE), or when a window function computes the same thing in one pass.' },
  ],
  revision: { notesMd: `- Two aliases, two roles; name them clearly (e = employee, m = manager).
- Hierarchy one level: LEFT JOIN to keep the root.
- Pairs once: a.id < b.id.
- Previous/next row: prefer LAG/LEAD; previous calendar day: join on date arithmetic.
- Unknown depth: recursive CTE.`, flashcards: [
    { id: 'f1', front: 'How do you keep the CEO in an employee–manager self join?', backMd: 'Use LEFT JOIN employees m ON m.id = e.manager_id.' },
    { id: 'f2', front: 'Condition to list unordered pairs once?', backMd: 'a.id < b.id.' },
    { id: 'f3', front: 'Why can a self join be slow?', backMd: 'Joining on a column with few distinct values creates up to n² rows.' },
    { id: 'f4', front: 'Self join vs LAG for "yesterday"?', backMd: 'LAG gives the previous row; a self join on date − 1 gives the previous calendar day.' },
    { id: 'f5', front: 'Tool for a hierarchy of unknown depth?', backMd: 'A recursive CTE.' },
  ] },
  resources: [doc('SELECT: joins (SQLite docs)', 'https://www.sqlite.org/lang_select.html'), MODE, LC_SQL50],
});

const sjMcqs: MCQ[] = [
  mcq({ ...q(SJ), id: 'sql.sj.q1', type: 'code-output', difficulty: 'easy', stem: 'What does the final query return?', code: out(`CREATE TABLE emp (id INTEGER, name TEXT, mgr INTEGER);
INSERT INTO emp VALUES (1,'A',NULL), (2,'B',1), (3,'C',1), (4,'D',2);
SELECT e.name, m.name FROM emp e LEFT JOIN emp m ON m.id = e.mgr ORDER BY e.id;`, 'A | NULL\nB | A\nC | A\nD | B'), options: ['A | NULL, B | A, C | A, D | B', ['B | A, C | A, D | B', 'LEFT JOIN keeps A, whose manager is NULL.'], ['A | B, A | C, B | D', 'The aliases are reversed: that lists manager first.'], ['A | A, B | B, C | C, D | D', 'The join is on mgr, not on id.']], answer: 0, explanation: 'Each employee row is matched with the row whose id equals its mgr; A has no manager and keeps a NULL.', verified: 'executed' }),
  mcq({ ...q(SJ), id: 'sql.sj.q2', type: 'code-output', difficulty: 'medium', stem: 'How many rows does the final query return?', code: out(`CREATE TABLE p (id INTEGER, city TEXT);
INSERT INTO p VALUES (1,'X'), (2,'X'), (3,'X'), (4,'Y');
SELECT COUNT(*) FROM p a JOIN p b ON a.city = b.city AND a.id < b.id;`, '3'), options: [['6', 'That would count both orders (a.id <> b.id).'], '3', ['10', 'That includes self pairs in both orders.'], ['4', 'Y has nobody to pair with.']], answer: 1, explanation: 'Three people in X give C(3, 2) = 3 unordered pairs; Y alone gives none.', verified: 'executed' }),
  mcq({ ...q(SJ), id: 'sql.sj.q3', type: 'concept', difficulty: 'easy', stem: 'Why is a LEFT JOIN usually needed when joining employees to their managers?', options: ['Employees with no manager would disappear with an inner join', ['LEFT JOIN is faster', 'Speed is not the reason.'], ['Self joins require LEFT JOIN', 'Inner self joins are valid.'], ['To avoid duplicate rows', 'LEFT JOIN does not remove duplicates.']], answer: 0, explanation: 'The top of the hierarchy has manager_id NULL, which never matches in an inner join.' }),
  mcq({ ...q(SJ), id: 'sql.sj.q4', type: 'debug', difficulty: 'medium', stem: '`SELECT a.id, b.id FROM p a JOIN p b ON a.city = b.city AND a.id <> b.id` is meant to list each pair of same-city people once. What is wrong?', options: ['Each pair appears twice, as (a, b) and (b, a)', ['It includes self pairs', '<> excludes them.'], ['It misses pairs', 'All pairs appear, twice.'], ['It cannot compile', 'It is valid SQL.']], answer: 0, explanation: 'Replace <> with < so that only one ordering of each pair survives.' }),
  mcq({ ...q(SJ), id: 'sql.sj.q5', type: 'code-output', difficulty: 'medium', stem: 'Readings exist for days 1, 2 and 4. What does the final query return?', code: out(`CREATE TABLE w (day INTEGER, temp INTEGER);
INSERT INTO w VALUES (1, 10), (2, 15), (4, 20);
SELECT t.day FROM w t JOIN w y ON y.day = t.day - 1 WHERE t.temp > y.temp;`, '2'), options: ['2', ['2 and 4', 'Day 3 is missing, so day 4 has no "yesterday" row.'], ['4', 'Day 4 has no matching day 3.'], ['Nothing', 'Day 2 is warmer than day 1.']], answer: 0, explanation: 'The self join pairs each day with the calendar day before it. A LAG-based query would compare day 4 with day 2 and wrongly include it.', verified: 'executed' }),
  mcq({ ...q(SJ), id: 'sql.sj.q6', type: 'concept', difficulty: 'medium', stem: 'You need every employee\'s entire chain of managers up to the CEO, of unknown length. Which tool fits?', options: ['A recursive CTE', ['One self join', 'One join goes up one level only.'], ['A fixed number of self joins', 'The depth is unknown.'], ['GROUP BY manager_id', 'Grouping does not follow links.']], answer: 0, explanation: 'WITH RECURSIVE repeats the "find the manager" step until the top is reached.' }),
];

// ---------------------------------------------------------------------------------------
const SO = 'sql.set-operations';
const setOps = sqlTopic({
  id: SO, title: 'Set Operations', level: 'core', estMinutes: 35, prerequisites: ['sql.select-basics'], related: ['sql.subqueries', 'sql.joins'],
  summary: 'UNION, UNION ALL, INTERSECT and EXCEPT.',
  objectives: ['Combine result sets with UNION, UNION ALL, INTERSECT and EXCEPT, and state the column-compatibility rules.', 'Choose UNION ALL when duplicates are impossible or wanted, and know that UNION costs a de-duplication.', 'Rewrite INTERSECT and EXCEPT as EXISTS / NOT EXISTS for engines that lack them.', 'Place ORDER BY and LIMIT correctly in compound queries.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Stacking result sets', bodyMd: `Set operators combine the **rows** of two queries with the same number of columns (and compatible types). Column names come from the first query.

| Operator | Result | Duplicates |
|---|---|---|
| \`UNION ALL\` | all rows of both | kept |
| \`UNION\` | rows in either | removed |
| \`INTERSECT\` | rows in both | removed |
| \`EXCEPT\` (Oracle: \`MINUS\`) | rows in the first but not the second | removed |

Rows are compared as whole tuples, and **NULLs compare as equal** for de-duplication (unlike \`=\` in WHERE).

ORDER BY and LIMIT apply to the **whole** compound result and go at the end. To sort or limit one branch, wrap it in a subquery.

**Engine support:** PostgreSQL and SQLite have all four. MySQL had only UNION / UNION ALL until 8.0.31, which added INTERSECT and EXCEPT; many interview solutions still use EXISTS / NOT EXISTS for portability.` },
    { id: 'example', kind: 'example', title: 'Examples', bodyMd: `\`\`\`sql
-- Users with any activity (posted or followed someone)
SELECT user_id FROM posts
UNION
SELECT follower_id FROM follows;

-- Followers who never post
SELECT follower_id FROM follows
EXCEPT
SELECT user_id FROM posts;

-- Portable form of the same EXCEPT
SELECT DISTINCT f.follower_id
FROM follows f
WHERE NOT EXISTS (SELECT 1 FROM posts p WHERE p.user_id = f.follower_id);
\`\`\`

**Building one timeline from two tables** (UNION ALL with a type column):

\`\`\`sql
SELECT id AS account_id, opened AS day, 'opened' AS kind FROM accounts
UNION ALL
SELECT account_id, txn_date, 'txn' FROM txns
ORDER BY account_id, day;
\`\`\`` },
    { id: 'comparison', kind: 'comparison', title: 'UNION vs UNION ALL vs JOIN', bodyMd: `- **UNION ALL** is the default choice: it is cheaper (no sort/hash to remove duplicates) and keeps the counts honest. Use **UNION** only when you want duplicates removed.
- Set operators stack rows **vertically**; joins combine columns **horizontally**. "Customers who are also suppliers" can be an INTERSECT of ids or a join; "orders and refunds in one list" is a UNION ALL.
- \`UNION\` between two queries that already return distinct rows still pays for de-duplication.
- Counting after a UNION: \`SELECT COUNT(*) FROM (… UNION …)\` counts distinct rows; with UNION ALL it counts all rows.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. **Column count or order mismatch:** columns are matched by position, not by name; swapping two columns silently mixes data.
2. **UNION when you needed UNION ALL**, losing legitimate duplicates (two equal transactions).
3. **ORDER BY inside a branch** without a subquery: a syntax error in most engines.
4. **Using INTERSECT / EXCEPT on MySQL before 8.0.31.**
5. **Expecting EXCEPT to keep duplicates** of the first query: it returns distinct rows (EXCEPT ALL exists in PostgreSQL).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is the difference between UNION and UNION ALL?', answerMd: 'UNION removes duplicate rows from the combined result (which costs a sort or hash), UNION ALL keeps every row. Prefer UNION ALL unless you need distinct rows.' },
    { id: 'iq2', q: 'How do you emulate EXCEPT in an engine without it?', answerMd: 'SELECT DISTINCT a.x FROM A a WHERE NOT EXISTS (SELECT 1 FROM B b WHERE b.x = a.x), or a LEFT JOIN B on the key with WHERE b.x IS NULL. Use NOT EXISTS rather than NOT IN if B.x can be NULL.' },
    { id: 'iq3', q: 'Where does ORDER BY go in a UNION query?', answerMd: 'At the end, applying to the combined result, and it may only reference output columns (by name of the first branch or by position). To order a single branch, wrap it in a derived table.' },
    { id: 'iq4', q: 'How do set operators treat NULLs?', answerMd: 'For duplicate elimination and INTERSECT/EXCEPT, two NULLs in the same position are treated as equal ("not distinct"), unlike the = comparison in WHERE or ON, which yields UNKNOWN.' },
  ],
  revision: { notesMd: `- UNION ALL keeps all; UNION de-duplicates; INTERSECT both; EXCEPT first minus second.
- Same number of columns, matched by position; names from the first query.
- ORDER BY / LIMIT at the end of the compound query.
- NULLs are "not distinct" for set operations.
- MySQL: INTERSECT/EXCEPT only from 8.0.31; use EXISTS / NOT EXISTS.`, flashcards: [
    { id: 'f1', front: 'Cheaper: UNION or UNION ALL?', backMd: 'UNION ALL; UNION must remove duplicates.' },
    { id: 'f2', front: 'Are set-operation columns matched by name or position?', backMd: 'By position.' },
    { id: 'f3', front: 'Does UNION treat two NULLs as duplicates?', backMd: 'Yes.' },
    { id: 'f4', front: 'Portable EXCEPT?', backMd: 'NOT EXISTS (or LEFT JOIN … IS NULL).' },
    { id: 'f5', front: 'Oracle\'s name for EXCEPT?', backMd: 'MINUS.' },
  ] },
  resources: [doc('Compound SELECT (SQLite docs)', 'https://www.sqlite.org/lang_select.html#compound_select_statements'), doc('Combining queries (PostgreSQL docs)', 'https://www.postgresql.org/docs/current/queries-union.html'), MODE],
});

const soMcqs: MCQ[] = [
  mcq({ ...q(SO), id: 'sql.so.q1', type: 'code-output', difficulty: 'easy', stem: 'What does the final query return?', code: out(`CREATE TABLE a (x INTEGER); CREATE TABLE b (x INTEGER);
INSERT INTO a VALUES (1), (2), (2), (3);
INSERT INTO b VALUES (2), (4);
SELECT (SELECT COUNT(*) FROM (SELECT x FROM a UNION SELECT x FROM b)) AS u,
       (SELECT COUNT(*) FROM (SELECT x FROM a UNION ALL SELECT x FROM b)) AS ua;`, '4 | 6'), options: ['4 | 6', ['6 | 6', 'UNION removes the duplicate 2s.'], ['4 | 4', 'UNION ALL keeps every row.'], ['3 | 6', 'Distinct values are 1, 2, 3, 4.']], answer: 0, explanation: 'UNION: {1, 2, 3, 4} = 4 rows. UNION ALL: all 4 + 2 = 6 rows.', verified: 'executed' }),
  mcq({ ...q(SO), id: 'sql.so.q2', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE a (x INTEGER); CREATE TABLE b (x INTEGER);
INSERT INTO a VALUES (1), (2), (2), (NULL);
INSERT INTO b VALUES (2), (NULL);
SELECT COUNT(*) FROM (SELECT x FROM a EXCEPT SELECT x FROM b);`, '1'), options: ['1', ['2', 'The duplicate 1s? There is only one 1, and EXCEPT returns distinct rows.'], ['3', 'Both 2s and the NULL are removed.'], ['0', 'The value 1 is not in b.']], answer: 0, explanation: 'EXCEPT returns distinct rows of a not in b. 2 is removed, and NULL is removed too because set operations treat NULLs as equal. Only 1 remains.', verified: 'executed' }),
  mcq({ ...q(SO), id: 'sql.so.q3', type: 'concept', difficulty: 'easy', stem: 'Two queries in a UNION return columns (id, name) and (name, id). What happens?', options: ['Columns are matched by position, so ids and names are mixed in the same columns', ['They are matched by name and combined correctly', 'Set operators match by position.'], ['A syntax error always', 'Compatible types may silently combine.'], ['The second query is ignored', 'Both contribute rows.']], answer: 0, explanation: 'Always list columns in the same order in every branch.' }),
  mcq({ ...q(SO), id: 'sql.so.q4', type: 'concept', difficulty: 'medium', stem: 'Which statement about ORDER BY in `SELECT … UNION SELECT … ORDER BY 1` is correct?', options: ['It sorts the combined result of both branches', ['It sorts only the second branch', 'ORDER BY at the end applies to the whole compound query.'], ['It is not allowed', 'It is allowed at the end.'], ['It sorts each branch separately', 'The result is one set.']], answer: 0, explanation: 'To sort one branch alone (for example with LIMIT), wrap it in a subquery.' }),
  mcq({ ...q(SO), id: 'sql.so.q5', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE s (name TEXT, course TEXT);
INSERT INTO s VALUES ('ana','db'), ('ana','os'), ('bo','db'), ('cy','os');
SELECT name FROM s WHERE course = 'db'
INTERSECT
SELECT name FROM s WHERE course = 'os';`, 'ana'), options: ['ana', ['ana, bo, cy', 'That is a UNION.'], ['bo', 'bo takes only db.'], ['Nothing', 'ana takes both.']], answer: 0, explanation: 'INTERSECT keeps names present in both result sets: only ana takes both courses.', verified: 'executed' }),
  mcq({ ...q(SO), id: 'sql.so.q6', type: 'scenario', difficulty: 'medium', stem: 'You need a list of all deposits and all refunds (two tables), keeping every row, sorted by date. Best choice?', options: ['UNION ALL of the two SELECTs with the same columns, then ORDER BY date', ['UNION', 'It would merge identical deposits on the same day.'], ['A JOIN on date', 'That pairs rows instead of stacking them.'], ['INTERSECT', 'It keeps only rows present in both.']], answer: 0, explanation: 'Stacking rows with duplicates preserved is exactly UNION ALL, and it avoids the de-duplication cost.' }),
];

// ---------------------------------------------------------------------------------------
const CA = 'sql.case-conditional-agg';
const caseAgg = sqlTopic({
  id: CA, title: 'CASE and Conditional Aggregation', level: 'core', estMinutes: 45, prerequisites: ['sql.aggregation'], related: ['sql.aggregation', 'sql.null-handling', 'sql.patterns'],
  summary: 'Branching logic, pivoting and counting by condition.',
  objectives: ['Write searched and simple CASE expressions and predict their result, including the missing-ELSE NULL.', 'Count and sum by condition inside one GROUP BY with SUM(CASE …) or COUNT(CASE …).', 'Pivot rows into columns (one column per category or month).', 'Compute rates correctly (real division, the right denominator, zero-division guards).'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'CASE is an expression', bodyMd: `\`\`\`sql
CASE
  WHEN rating >= 4.5 THEN 'top'
  WHEN rating >= 3.5 THEN 'ok'
  ELSE 'low'
END
\`\`\`

- Branches are tested **in order**; the first true one wins.
- Without ELSE, a CASE that matches nothing returns **NULL**.
- All branches should return compatible types.
- CASE works anywhere an expression does: SELECT, WHERE, ORDER BY (custom sort orders), GROUP BY, and inside aggregates.

The **simple** form compares one value: \`CASE status WHEN 'completed' THEN 1 WHEN 'no_driver' THEN 0 END\`. Note that \`CASE x WHEN NULL\` never matches, because it uses =.` },
    { id: 'example', kind: 'example', title: 'Conditional aggregation and pivots', bodyMd: `Several counts in one pass over each group:

\`\`\`sql
SELECT city,
       COUNT(*) AS requests,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       ROUND(1.0 * SUM(CASE WHEN status LIKE 'cancelled%' THEN 1 ELSE 0 END) / COUNT(*), 2) AS cancel_rate
FROM trips
GROUP BY city;
\`\`\`

**Pivot:** one output column per category.

\`\`\`sql
SELECT account_id,
       SUM(CASE WHEN category = 'rent' THEN -amount ELSE 0 END) AS rent,
       SUM(CASE WHEN category = 'food' THEN -amount ELSE 0 END) AS food
FROM txns
GROUP BY account_id;
\`\`\`

Equivalent forms: \`COUNT(CASE WHEN cond THEN 1 END)\` (counts non-NULLs), \`SUM(cond)\` in MySQL and SQLite (a boolean is 0/1), and \`COUNT(*) FILTER (WHERE cond)\` in PostgreSQL and SQLite.` },
    { id: 'comparison', kind: 'comparison', title: 'Rates: denominators and division', bodyMd: `| Question | Numerator | Denominator |
|---|---|---|
| Cancellation rate of requests | cancelled requests | all requests |
| Share of completed trips rated | rated completed trips | completed trips |
| Confirmation rate of signups (LeetCode 1934) | confirmed actions | all actions, 0 for users without any |

- **Integer division:** in SQLite and PostgreSQL, \`2 / 10 = 0\`. Multiply by \`1.0\` (or cast). MySQL's \`/\` always returns a decimal.
- **Zero denominators:** \`x / NULLIF(y, 0)\` returns NULL instead of an error; wrap in COALESCE if the question wants 0.
- **Rounding:** ROUND(value, 2) at the end, not on intermediate values.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. **Missing ELSE** turning "no match" into NULL, which then disappears from SUM or AVG.
2. **Wrong branch order:** \`WHEN rating >= 3.5 … WHEN rating >= 4.5 …\` never reaches the second branch.
3. **Integer division** giving 0 for every rate.
4. **Filtering in WHERE** when you want several conditional counts: WHERE removes rows from every count at once.
5. **CASE x WHEN NULL**: never true; use a searched CASE with IS NULL.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you count rows satisfying different conditions in one query?', answerMd: 'Conditional aggregation: SUM(CASE WHEN cond THEN 1 ELSE 0 END) (or COUNT(CASE WHEN cond THEN 1 END)) per condition inside the same GROUP BY. One scan, many counts.' },
    { id: 'iq2', q: 'How would you pivot monthly revenue into columns Jan, Feb, Mar?', answerMd: 'GROUP BY the row key and write SUM(CASE WHEN month = \'01\' THEN revenue ELSE 0 END) AS jan, one expression per month. Engines with PIVOT syntax (SQL Server, Oracle) offer a shortcut, but the CASE form is portable.' },
    { id: 'iq3', q: 'What does a CASE without ELSE return when no branch matches?', answerMd: 'NULL. Inside SUM that is harmless (NULLs are ignored), but inside COUNT(*) or as a label it changes results; be explicit.' },
    { id: 'iq4', q: 'Why might a cancellation rate query return 0 for every city?', answerMd: 'Integer division: SUM(…) / COUNT(*) with integer operands truncates in SQLite and PostgreSQL. Multiply by 1.0 or cast to a decimal before dividing.' },
  ],
  revision: { notesMd: `- CASE tests branches in order; no ELSE → NULL.
- Conditional counts: SUM(CASE WHEN … THEN 1 ELSE 0 END) or COUNT(CASE WHEN … THEN 1 END).
- Pivot: one SUM(CASE …) per output column.
- Rates: right denominator, 1.0 * for real division, NULLIF for zero.
- CASE x WHEN NULL never matches.`, flashcards: [
    { id: 'f1', front: 'CASE with no matching branch and no ELSE returns?', backMd: 'NULL.' },
    { id: 'f2', front: 'Count completed trips inside a GROUP BY without a WHERE?', backMd: 'SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END).' },
    { id: 'f3', front: 'Avoid integer division in SQLite?', backMd: 'Multiply by 1.0 (or CAST AS REAL).' },
    { id: 'f4', front: 'Guard against division by zero?', backMd: 'x / NULLIF(y, 0).' },
    { id: 'f5', front: 'Does CASE x WHEN NULL THEN … ever match?', backMd: 'No: it compares with =.' },
  ] },
  resources: [doc('CASE expression (SQLite docs)', 'https://www.sqlite.org/lang_expr.html#the_case_expression'), doc('Conditional expressions (PostgreSQL docs)', 'https://www.postgresql.org/docs/current/functions-conditional.html'), LC_SQL50],
});

const caMcqs: MCQ[] = [
  mcq({ ...q(CA), id: 'sql.ca.q1', type: 'code-output', difficulty: 'easy', stem: 'What does the final query return?', code: out(`CREATE TABLE r (v INTEGER);
INSERT INTO r VALUES (5), (4), (2), (NULL);
SELECT v, CASE WHEN v >= 4 THEN 'hi' WHEN v >= 3 THEN 'mid' END FROM r;`, '5 | hi\n4 | hi\n2 | NULL\nNULL | NULL'), options: ['5 | hi, 4 | hi, 2 | NULL, NULL | NULL', ['5 | hi, 4 | hi, 2 | mid, NULL | NULL', '2 matches no branch.'], ['5 | hi, 4 | mid, 2 | NULL, NULL | NULL', '4 >= 4 matches the first branch.'], ['5 | hi, 4 | hi, 2 | low, NULL | low', 'There is no ELSE branch.']], answer: 0, explanation: 'Without ELSE, unmatched rows (2 and NULL) get NULL.', verified: 'executed' }),
  mcq({ ...q(CA), id: 'sql.ca.q2', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE t (city TEXT, status TEXT);
INSERT INTO t VALUES ('X','done'), ('X','cancel'), ('X','done'), ('Y','cancel');
SELECT city, SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), SUM(CASE WHEN status = 'cancel' THEN 1 ELSE 0 END) / COUNT(*)
FROM t GROUP BY city ORDER BY city;`, 'X | 2 | 0\nY | 0 | 1'), options: ['X | 2 | 0, Y | 0 | 1', ['X | 2 | 0.33, Y | 0 | 1', 'Integer division truncates 1/3 to 0 in SQLite.'], ['X | 2 | 1, Y | 0 | 1', 'The cancel count for X is 1 out of 3.'], ['X | 3 | 0, Y | 1 | 1', 'Only "done" rows are counted in the second column.']], answer: 0, explanation: '1 / 3 is integer division in SQLite (0). Write 1.0 * SUM(...) / COUNT(*) to get 0.33.', verified: 'executed' }),
  mcq({ ...q(CA), id: 'sql.ca.q3', type: 'debug', difficulty: 'medium', stem: '`CASE WHEN score >= 50 THEN \'pass\' WHEN score >= 90 THEN \'distinction\' ELSE \'fail\' END` never returns distinction. Why?', options: ['Branches are checked in order; any score ≥ 90 already matched the first branch', ['CASE cannot compare numbers', 'It can.'], ['ELSE overrides the other branches', 'ELSE is used only if nothing matched.'], ['>= is not allowed in CASE', 'It is.']], answer: 0, explanation: 'Put the most specific condition first: WHEN score >= 90 … WHEN score >= 50 ….' }),
  mcq({ ...q(CA), id: 'sql.ca.q4', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE s (k TEXT, m TEXT, amt INTEGER);
INSERT INTO s VALUES ('a','jan',10), ('a','feb',5), ('b','jan',7), ('a','jan',1);
SELECT k, SUM(CASE WHEN m = 'jan' THEN amt ELSE 0 END) AS jan, SUM(CASE WHEN m = 'feb' THEN amt ELSE 0 END) AS feb
FROM s GROUP BY k ORDER BY k;`, 'a | 11 | 5\nb | 7 | 0'), options: ['a | 11 | 5, b | 7 | 0', ['a | 10 | 5, b | 7 | 0', 'Both January rows of a are summed.'], ['a | 11 | 5, b | 7 | NULL', 'ELSE 0 makes the empty February sum 0.'], ['a | 16 | 16, b | 7 | 7', 'Each column sums only its month.']], answer: 0, explanation: 'A pivot with one conditional SUM per output column.', verified: 'executed' }),
  mcq({ ...q(CA), id: 'sql.ca.q5', type: 'concept', difficulty: 'easy', stem: 'Why use conditional aggregation instead of WHERE status = \'completed\' when you also need the total number of requests?', options: ['WHERE removes the other rows from every aggregate, so the total would be wrong', ['WHERE cannot filter text', 'It can.'], ['Conditional aggregation is required by SQL', 'It is a technique, not a rule.'], ['WHERE runs after GROUP BY', 'WHERE runs before GROUP BY, which is exactly the problem.']], answer: 0, explanation: 'Keep all rows in the group and count each condition separately.' }),
  mcq({ ...q(CA), id: 'sql.ca.q6', type: 'edge-case', difficulty: 'medium', stem: 'Which expression returns NULL instead of failing when `y` is 0?', options: ['x / NULLIF(y, 0)', ['x / COALESCE(y, 0)', 'COALESCE replaces NULL, not 0.'], ['x / CASE WHEN y = 0 THEN 0 ELSE y END', 'Still divides by 0.'], ['x / ABS(y)', 'ABS(0) = 0.']], answer: 0, explanation: 'NULLIF(y, 0) is NULL when y = 0, and any arithmetic with NULL is NULL. (SQLite returns NULL for division by zero anyway; MySQL returns NULL; PostgreSQL raises an error.)' }),
];

// ---------------------------------------------------------------------------------------
const CT = 'sql.cte';
const ctes = sqlTopic({
  id: CT, title: 'Common Table Expressions', level: 'core', estMinutes: 50, prerequisites: ['sql.subqueries'], related: ['sql.subqueries', 'sql.window-functions', 'sql.patterns', 'sql.self-joins'],
  summary: 'Readable multi-step queries and recursive hierarchies.',
  objectives: ['Write multi-step queries with WITH, naming each intermediate result.', 'Write recursive CTEs (anchor + recursive member) for hierarchies, threads and series.', 'Generate calendars or number series to show gaps, and stop recursion safely.', 'Explain when a CTE is equivalent to a subquery and what "materialised" means.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Named steps', bodyMd: `\`\`\`sql
WITH spend AS (
  SELECT customer_id, SUM(amount) AS total FROM payments GROUP BY customer_id
),
avg_spend AS (
  SELECT AVG(total) AS a FROM spend
)
SELECT s.customer_id, s.total
FROM spend s, avg_spend
WHERE s.total > avg_spend.a;
\`\`\`

A CTE is a named, query-scoped result. Benefits:
- **Readability:** each step has a name and can be tested on its own.
- **Reuse:** \`spend\` is referenced twice above without repeating its definition.
- **Recursion:** only CTEs can be recursive.

Semantically, a non-recursive CTE is like a derived table. Whether the engine computes it once (materialises it) or inlines it into the outer query is an optimiser decision: PostgreSQL 12+ inlines by default unless you write \`AS MATERIALIZED\`; MySQL 8 may do either.` },
    { id: 'recursive', kind: 'example', title: 'Recursive CTEs', bodyMd: `\`\`\`sql
WITH RECURSIVE chain(id, depth) AS (
  SELECT id, 0 FROM employees WHERE manager_id IS NULL          -- anchor: the roots
  UNION ALL
  SELECT e.id, c.depth + 1                                       -- recursive member
  FROM employees e JOIN chain c ON e.manager_id = c.id
)
SELECT * FROM chain;
\`\`\`

Execution: run the anchor; then repeatedly run the recursive member **on the rows produced by the previous step only**, appending the results, until a step produces no rows.

**Series and calendars:**

\`\`\`sql
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 10)
SELECT i FROM n;                                  -- 1..10
\`\`\`

Join a generated calendar to facts with a LEFT JOIN (or a correlated subquery) to report **empty days or months** with 0.

**Safety:** the WHERE in the recursive member is the stop condition. Data with cycles (A manages B, B manages A) recurses forever unless you track visited ids or cap the depth; engines also have limits (MySQL \`cte_max_recursion_depth\`, default 1000).` },
    { id: 'comparison', kind: 'comparison', title: 'CTE, subquery, temp table, window', bodyMd: `| Tool | Use when |
|---|---|
| Derived table / subquery | a one-off step used once |
| CTE | several steps, a step used more than once, or recursion |
| Temporary table | a large intermediate reused across several statements, or needing an index |
| Window function | per-row values that depend on other rows (ranks, running totals) without collapsing rows |

CTEs often combine with windows: rank inside a CTE, filter rk = 1 in the outer query.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. **Missing RECURSIVE** keyword (required in PostgreSQL, MySQL and SQLite for self-referencing CTEs).
2. **No stop condition**, or cyclic data, causing infinite recursion (or hitting the engine limit).
3. **UNION instead of UNION ALL** in the recursion: it removes duplicates at every step, which is slower and can hide paths you wanted.
4. **Referencing the CTE twice in the recursive member** or using aggregates there (not allowed in most engines).
5. **Assuming a CTE is computed once**: performance depends on the engine.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How does a recursive CTE execute?', answerMd: 'The anchor member runs once. Then the recursive member runs repeatedly, each time seeing only the rows produced by the previous iteration, and its output is appended (UNION ALL). It stops when an iteration produces no rows. The final result is everything produced.' },
    { id: 'iq2', q: 'How would you find all subordinates of a manager, at any depth?', answerMd: 'WITH RECURSIVE sub AS (SELECT id FROM employees WHERE manager_id = :m UNION ALL SELECT e.id FROM employees e JOIN sub s ON e.manager_id = s.id) SELECT * FROM sub. Add a depth column or a visited path if the data could contain cycles.' },
    { id: 'iq3', q: 'How do you report days with zero sales?', answerMd: 'Generate the calendar with a recursive CTE (or a calendar table), LEFT JOIN the aggregated sales per day to it, and use COALESCE(sum, 0). GROUP BY on the sales table alone can never produce a day with no rows.' },
    { id: 'iq4', q: 'Is a CTE faster than a subquery?', answerMd: 'Not inherently. Most engines treat a non-recursive CTE like a derived table and may inline it. It can be faster if the engine materialises a CTE that is referenced several times, or slower if materialisation prevents pushing filters down. Choose CTEs for clarity; check the plan for performance.' },
  ],
  revision: { notesMd: `- WITH name AS (…) names a step; reusable within the statement.
- WITH RECURSIVE: anchor UNION ALL recursive member; stops when a step yields no rows.
- Stop conditions and cycle guards; MySQL default depth limit 1000.
- Calendars/series via recursion; LEFT JOIN facts for gaps.
- CTE ≈ derived table semantically; materialisation is engine-dependent.`, flashcards: [
    { id: 'f1', front: 'Two parts of a recursive CTE?', backMd: 'An anchor member and a recursive member, combined with UNION ALL.' },
    { id: 'f2', front: 'When does recursion stop?', backMd: 'When the recursive member returns no new rows.' },
    { id: 'f3', front: 'Generate 1..10 in SQL?', backMd: 'WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 10) SELECT i FROM n.' },
    { id: 'f4', front: 'How do you show months with no data?', backMd: 'Generate a month series and LEFT JOIN (or correlate) the facts, with COALESCE(…, 0).' },
    { id: 'f5', front: 'Is a CTE always materialised?', backMd: 'No: it depends on the engine and hints (e.g. PostgreSQL AS MATERIALIZED).' },
  ] },
  resources: [doc('WITH clause (SQLite docs)', 'https://www.sqlite.org/lang_with.html'), doc('WITH queries (PostgreSQL docs)', 'https://www.postgresql.org/docs/current/queries-with.html'), MODE],
});

const ctMcqs: MCQ[] = [
  mcq({ ...q(CT), id: 'sql.ct.q1', type: 'code-output', difficulty: 'easy', stem: 'What does the final query return?', code: out(`WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i * 2 FROM n WHERE i < 20)
SELECT group_concat(i, ',') FROM n;`, '1,2,4,8,16,32'), options: ['1,2,4,8,16,32', ['1,2,4,8,16', 'The condition is checked on the previous row (16 < 20), so 32 is still produced.'], ['2,4,8,16,32', 'The anchor row 1 is part of the result.'], ['1,2,4,8,16,20', 'Values double; 20 never appears.']], answer: 0, explanation: 'The stop condition filters the input row of each step: from 16 (< 20) the step produces 32; from 32 it produces nothing.', verified: 'executed' }),
  mcq({ ...q(CT), id: 'sql.ct.q2', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE e (id INTEGER, mgr INTEGER);
INSERT INTO e VALUES (1, NULL), (2, 1), (3, 2), (4, 2), (5, 1);
WITH RECURSIVE sub(id, d) AS (SELECT id, 0 FROM e WHERE id = 2 UNION ALL SELECT e.id, d + 1 FROM e JOIN sub ON e.mgr = sub.id)
SELECT COUNT(*), MAX(d) FROM sub;`, '3 | 1'), options: ['3 | 1', ['2 | 1', 'The anchor row (2 itself) is included.'], ['5 | 2', 'Only 2 and its subordinates are reached.'], ['3 | 2', '3 and 4 report directly to 2: depth 1.']], answer: 0, explanation: 'Rows: (2, 0), (3, 1), (4, 1). Employee 5 reports to 1, not to 2.', verified: 'executed' }),
  mcq({ ...q(CT), id: 'sql.ct.q3', type: 'concept', difficulty: 'medium', stem: 'In each iteration, which rows does the recursive member of a CTE see?', options: ['Only the rows produced by the previous iteration', ['All rows produced so far', 'It sees just the last step\'s output (the working table).'], ['Only the anchor rows', 'Only in the first iteration.'], ['The whole base table', 'It sees the base tables plus the previous step.']], answer: 0, explanation: 'This "working table" semantics is why recursion terminates when a step adds nothing.' }),
  mcq({ ...q(CT), id: 'sql.ct.q4', type: 'debug', difficulty: 'medium', stem: 'A manager chain query never finishes on production data. What is the most likely cause?', options: ['The data contains a cycle (A reports to B and B to A), and nothing stops the recursion', ['UNION ALL is too slow', 'It would still finish on acyclic data.'], ['The anchor selects too many rows', 'That makes it bigger, not infinite.'], ['CTEs cannot recurse more than twice', 'They can recurse many times.']], answer: 0, explanation: 'Guard with a depth limit (WHERE depth < 50) or by tracking the visited path and skipping ids already on it.' }),
  mcq({ ...q(CT), id: 'sql.ct.q5', type: 'code-output', difficulty: 'medium', stem: 'Sales exist only on days 1 and 3. What does the final query return?', code: out(`CREATE TABLE sales (day INTEGER, amt INTEGER);
INSERT INTO sales VALUES (1, 10), (3, 5), (3, 2);
WITH RECURSIVE d(day) AS (SELECT 1 UNION ALL SELECT day + 1 FROM d WHERE day < 3)
SELECT d.day, COALESCE(SUM(s.amt), 0) FROM d LEFT JOIN sales s ON s.day = d.day GROUP BY d.day ORDER BY d.day;`, '1 | 10\n2 | 0\n3 | 7'), options: ['1 | 10, 2 | 0, 3 | 7', ['1 | 10, 3 | 7', 'The generated calendar includes day 2.'], ['1 | 10, 2 | NULL, 3 | 7', 'COALESCE turns the empty sum into 0.'], ['1 | 10, 2 | 0, 3 | 5', 'Both day-3 sales are summed.']], answer: 0, explanation: 'Generate the calendar, LEFT JOIN the facts, and COALESCE the empty aggregates.', verified: 'executed' }),
  mcq({ ...q(CT), id: 'sql.ct.q6', type: 'concept', difficulty: 'easy', stem: 'Which statement about non-recursive CTEs is accurate?', options: ['They are semantically like derived tables; whether they are computed once depends on the engine', ['They are always faster than subqueries', 'Performance depends on the plan.'], ['They persist after the query ends', 'They exist only for one statement.'], ['They cannot be referenced twice', 'Reuse is a main benefit.']], answer: 0, explanation: 'Use them for clarity and reuse; check EXPLAIN for performance.' }),
];

// ---------------------------------------------------------------------------------------
const DS = 'sql.date-string-functions';
const dates = sqlTopic({
  id: DS, title: 'Date and String Functions', level: 'core', estMinutes: 45, prerequisites: ['sql.select-basics'], related: ['sql.select-basics', 'sql.patterns', 'sql.explain-optimisation'],
  summary: 'Date arithmetic, boundaries and string handling across MySQL and SQLite.',
  objectives: ['Extract parts of dates and timestamps and group by day, month or hour in MySQL and SQLite.', 'Do date arithmetic (add intervals, differences in days) and filter ranges with half-open boundaries.', 'Use the core string functions (concat, substring, case, trim, length, replace, LIKE) and know dialect differences.', 'Avoid the timestamp, time-zone and non-sargable-filter traps.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Dialect cheat sheet', bodyMd: `| Task | MySQL | SQLite |
|---|---|---|
| Date part of a timestamp | \`DATE(ts)\` | \`date(ts)\` |
| Year / month / hour | \`YEAR(d)\`, \`MONTH(d)\`, \`HOUR(ts)\` | \`strftime('%Y', d)\`, \`'%m'\`, \`'%H'\` (text) |
| Format as YYYY-MM | \`DATE_FORMAT(d, '%Y-%m')\` | \`strftime('%Y-%m', d)\` or \`substr(d, 1, 7)\` |
| Add 7 days | \`d + INTERVAL 7 DAY\` / \`DATE_ADD(d, INTERVAL 7 DAY)\` | \`date(d, '+7 days')\` |
| Difference in days | \`DATEDIFF(a, b)\` | \`julianday(a) − julianday(b)\` |
| Today | \`CURDATE()\` | \`date('now')\` |
| Concatenate | \`CONCAT(a, b)\` | \`a \\|\\| b\` |
| Substring | \`SUBSTRING(s, start, len)\` | \`substr(s, start, len)\` |
| Length (characters) | \`CHAR_LENGTH(s)\` (\`LENGTH\` is bytes) | \`length(s)\` |

SQLite stores dates as text; ISO 8601 strings (\`YYYY-MM-DD HH:MM:SS\`) sort and compare correctly as strings, which is why the datasets use them.` },
    { id: 'example', kind: 'example', title: 'Boundaries done right', bodyMd: `**Half-open ranges** are the safest way to filter a period:

\`\`\`sql
-- All of February 2024, whatever the time of day, leap year included
WHERE ts >= '2024-02-01' AND ts < '2024-03-01'
\`\`\`

\`BETWEEN '2024-02-01' AND '2024-02-29'\` misses everything on the 29th after midnight when ts has a time part, and it needs you to know the month length.

**Wrap-around windows** (late night 22:00–05:59) are two ranges: \`HOUR(ts) >= 22 OR HOUR(ts) < 6\`.

**Grouping by month:** \`GROUP BY DATE_FORMAT(ts, '%Y-%m')\` (MySQL) or \`substr(ts, 1, 7)\` (SQLite). Grouping by MONTH(ts) alone merges January 2023 with January 2024.

**Strings:** \`TRIM\`, \`UPPER\`/\`LOWER\`, \`REPLACE(s, from, to)\`, \`LIKE 'a%'\` (any run) and \`'_b%'\` (exactly one character, then b). Fix Names (LeetCode 1667): \`CONCAT(UPPER(LEFT(name, 1)), LOWER(SUBSTRING(name, 2)))\`.` },
    { id: 'comparison', kind: 'comparison', title: 'Sargable vs non-sargable date filters', bodyMd: `| Filter | Index on ts usable? |
|---|---|
| \`ts >= '2024-01-01' AND ts < '2025-01-01'\` | yes (range scan) |
| \`YEAR(ts) = 2024\` | usually no (function on the column) |
| \`DATE(ts) = '2024-03-01'\` | usually no; rewrite as a one-day half-open range |
| \`ts LIKE '2024-03%'\` (text dates) | yes for a prefix pattern in some engines; fragile |

Rule of thumb: keep the column bare and move the computation to the constant side.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. **BETWEEN on timestamps** dropping the last day.
2. **Grouping by month number only** across years.
3. **Comparing text dates in non-ISO formats** ('03/01/2024' does not sort chronologically).
4. **strftime returns text in SQLite:** compare with '22' or CAST to INTEGER, not with 22 (text vs integer comparison rules differ).
5. **LENGTH vs CHAR_LENGTH in MySQL** for non-ASCII text.
6. **Time zones:** storing local times without a zone makes "per day" counts depend on the server; store UTC and convert for display.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you select all rows from March 2024 when ts is a DATETIME?', answerMd: 'WHERE ts >= \'2024-03-01\' AND ts < \'2024-04-01\'. It covers every time on 31 March, needs no knowledge of month length, and keeps ts bare so an index can be used.' },
    { id: 'iq2', q: 'Find users who logged in on consecutive days.', answerMd: 'Either self join logins a and b with b.day = a.day + 1 (DATE_ADD in MySQL, date(d, \'+1 day\') in SQLite), or use LAG(day) per user and check that the difference is 1 day. De-duplicate days first if a user can log in several times a day.' },
    { id: 'iq3', q: 'Why is WHERE YEAR(created_at) = 2024 potentially slow?', answerMd: 'Applying a function to the indexed column prevents a normal index range scan, so the engine evaluates YEAR() for every row. Rewrite as a half-open range on the bare column, or create a functional/generated-column index.' },
    { id: 'iq4', q: 'How do you compute the number of days between two dates in MySQL and SQLite?', answerMd: 'MySQL: DATEDIFF(later, earlier). SQLite: julianday(later) − julianday(earlier), cast to an integer if needed. PostgreSQL: subtracting two dates gives an integer number of days.' },
  ],
  revision: { notesMd: `- MySQL DATE/YEAR/MONTH/HOUR/DATE_FORMAT/DATEDIFF/INTERVAL; SQLite date/strftime/julianday/modifiers.
- Half-open ranges: >= start AND < next.
- Group months by year-month, not month number.
- Wrap-around hour windows need OR.
- Keep the column bare for index use.
- Concat: CONCAT (MySQL) vs || (SQLite/PostgreSQL).`, flashcards: [
    { id: 'f1', front: 'Add 7 days in MySQL and SQLite?', backMd: 'MySQL: d + INTERVAL 7 DAY; SQLite: date(d, \'+7 days\').' },
    { id: 'f2', front: 'Days between two dates in SQLite?', backMd: 'julianday(a) − julianday(b).' },
    { id: 'f3', front: 'Safest filter for "all of February 2024"?', backMd: 'ts >= \'2024-02-01\' AND ts < \'2024-03-01\'.' },
    { id: 'f4', front: 'What type does SQLite strftime return?', backMd: 'Text.' },
    { id: 'f5', front: 'MySQL string concatenation?', backMd: 'CONCAT(a, b) (|| is logical OR by default in MySQL).' },
  ] },
  resources: [doc('Date and time functions (SQLite docs)', 'https://www.sqlite.org/lang_datefunc.html'), doc('Date/time functions (PostgreSQL docs)', 'https://www.postgresql.org/docs/current/functions-datetime.html'), LC_SQL50],
});

const dsMcqs: MCQ[] = [
  mcq({ ...q(DS), id: 'sql.ds.q1', type: 'code-output', difficulty: 'easy', stem: 'What does this SQLite query return?', code: out(`SELECT date('2024-02-28', '+1 day'), date('2023-02-28', '+1 day'), strftime('%Y-%m', '2024-12-31 23:59:59');`, '2024-02-29 | 2023-03-01 | 2024-12'), options: ['2024-02-29 | 2023-03-01 | 2024-12', ['2024-03-01 | 2023-03-01 | 2024-12', '2024 is a leap year.'], ['2024-02-29 | 2023-02-29 | 2024-12', '2023 is not a leap year.'], ['2024-02-29 | 2023-03-01 | 2025-01', 'Formatting does not round the time.']], answer: 0, explanation: 'Date modifiers follow the real calendar, leap years included.', verified: 'executed' }),
  mcq({ ...q(DS), id: 'sql.ds.q2', type: 'code-output', difficulty: 'medium', stem: 'How many rows does the final query count?', code: out(`CREATE TABLE ev (ts TEXT);
INSERT INTO ev VALUES ('2024-02-01 00:00:00'), ('2024-02-29 13:00:00'), ('2024-03-01 00:00:00');
SELECT COUNT(*) FROM ev WHERE ts BETWEEN '2024-02-01' AND '2024-02-29';`, '1'), options: ['1', ['2', '\'2024-02-29 13:00:00\' is greater than \'2024-02-29\' as a string, so it is excluded.'], ['3', 'March is outside the range.'], ['0', 'The first event is inside the range.']], answer: 0, explanation: 'Only the 1 February event qualifies: the 29 February afternoon is after the upper bound \'2024-02-29\'. Use ts >= \'2024-02-01\' AND ts < \'2024-03-01\'.', verified: 'executed' }),
  mcq({ ...q(DS), id: 'sql.ds.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this SQLite query return?', code: out(`SELECT CAST(julianday('2024-03-31') - julianday('2024-03-01') AS INTEGER), upper(substr('placement', 1, 1)) || substr('placement', 2), length('  ab  '), length(trim('  ab  '));`, '30 | Placement | 6 | 2'), options: ['30 | Placement | 6 | 2', ['31 | Placement | 6 | 2', 'From 1 March to 31 March is 30 days.'], ['30 | PLACEMENT | 6 | 2', 'Only the first letter is upper-cased.'], ['30 | Placement | 2 | 2', 'length counts the spaces before trimming.']], answer: 0, explanation: 'julianday differences count days; substr is 1-based; trim removes the surrounding spaces.', verified: 'executed' }),
  mcq({ ...q(DS), id: 'sql.ds.q4', type: 'concept', difficulty: 'easy', stem: 'Why can `GROUP BY MONTH(order_date)` give wrong monthly totals?', options: ['It merges the same month of different years', ['MONTH is not a SQL function', 'It is a MySQL function.'], ['It groups by day instead', 'It groups by month number.'], ['It ignores NULL dates', 'That is not the main issue.']], answer: 0, explanation: 'Group by year and month together, for example DATE_FORMAT(order_date, \'%Y-%m\').' }),
  mcq({ ...q(DS), id: 'sql.ds.q5', type: 'debug', difficulty: 'medium', stem: 'In SQLite, `WHERE strftime(\'%H\', ts) >= 22` returns unexpected rows. Why?', options: ['strftime returns text; comparing text with an integer follows SQLite type-affinity rules, not numeric comparison of the hour', ['%H is minutes', 'It is hours.'], ['strftime needs a timezone', 'It does not.'], ['>= cannot be used with functions', 'It can.']], answer: 0, explanation: 'In SQLite a TEXT value is always considered greater than an INTEGER, so every row matches. CAST(strftime(\'%H\', ts) AS INTEGER) >= 22 or strftime(\'%H\', ts) >= \'22\' compares like with like.' }),
  mcq({ ...q(DS), id: 'sql.ds.q6', type: 'concept', difficulty: 'medium', stem: 'Which filter lets a B-tree index on `created_at` be used for "rows from 2024"?', options: ["created_at >= '2024-01-01' AND created_at < '2025-01-01'", ['YEAR(created_at) = 2024', 'The function hides the column from the index.'], ["DATE_FORMAT(created_at, '%Y') = '2024'", 'Same problem.'], ["CAST(created_at AS CHAR) LIKE '2024%'", 'Still a function on the column.']], answer: 0, explanation: 'Keep the indexed column bare and put the computation on the constants.' }),
];

// ---------------------------------------------------------------------------------------
const PT = 'sql.patterns';
const patterns = sqlTopic({
  id: PT, title: 'Interview SQL Patterns', level: 'core', estMinutes: 70, prerequisites: ['sql.window-functions'], related: ['sql.window-functions', 'sql.cte', 'sql.subqueries', 'sql.case-conditional-agg'],
  summary: 'Top-N per group, Nth highest, gaps-and-islands, retention and division.',
  objectives: ['Solve top-N per group and Nth-highest with window functions, handling ties as asked.', 'Solve gaps-and-islands (streaks, consecutive values) with the row-number difference trick.', 'Compute retention, running totals and "ever/never" conditions over sequences.', 'Solve relational division ("customers who bought every product").'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'The pattern catalogue', bodyMd: `| Pattern | Recognise by | Core technique |
|---|---|---|
| Top-N per group | "highest-paid per department", "top 3 per category" | \`RANK/DENSE_RANK/ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC)\` in a subquery, filter rank ≤ N |
| Nth highest | "second highest salary", NULL if none | \`DENSE_RANK\` = N, or \`MAX(x) WHERE x < (SELECT MAX(x))\`, wrapped to return NULL |
| Gaps and islands | "consecutive days", "streaks", "3 rows in a row" | \`date − ROW_NUMBER()\` is constant inside an island |
| Running / cumulative | "balance after each transaction", "cumulative signups" | \`SUM() OVER (ORDER BY …)\` with a deterministic order |
| Ever / never along a sequence | "balance ever negative" | window running value, then filter outside |
| Retention / cohorts | "users active the day after signup" | self join or LEFT JOIN on date + 1, conditional counts |
| Relational division | "bought **every** product" | \`GROUP BY customer HAVING COUNT(DISTINCT product) = (SELECT COUNT(*) FROM products)\` |
| Deduplicate keeping one | "keep the latest row per key" | \`ROW_NUMBER() … = 1\` |` },
    { id: 'example', kind: 'example', title: 'Gaps and islands step by step', bodyMd: `Login days for one user: 1, 2, 3, 5, 6, 9 (as day numbers).

| day | row_number | day − rn |
|---|---|---|
| 1 | 1 | 0 |
| 2 | 2 | 0 |
| 3 | 3 | 0 |
| 5 | 4 | 1 |
| 6 | 5 | 1 |
| 9 | 6 | 3 |

Rows with the same difference form one island: {1, 2, 3}, {5, 6}, {9}. Group by (user, difference) to get each streak's start, end and length.

\`\`\`sql
WITH d AS (SELECT DISTINCT user_id, login_date FROM logins),
g AS (
  SELECT user_id, login_date,
         julianday(login_date) - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS grp
  FROM d
)
SELECT user_id, MIN(login_date) AS start_day, COUNT(*) AS len
FROM g GROUP BY user_id, grp;
\`\`\`

**De-duplicate first**: two logins on the same day would get different row numbers and break the arithmetic.` },
    { id: 'comparison', kind: 'comparison', title: 'Ties: ROW_NUMBER vs RANK vs DENSE_RANK', bodyMd: `Salaries 300, 300, 200, 100:

| salary | ROW_NUMBER | RANK | DENSE_RANK |
|---|---|---|---|
| 300 | 1 | 1 | 1 |
| 300 | 2 | 1 | 1 |
| 200 | 3 | 3 | 2 |
| 100 | 4 | 4 | 3 |

- "Top earner(s) per department, include ties" → RANK = 1 or DENSE_RANK = 1.
- "Second highest **distinct** salary" → DENSE_RANK = 2 (200). RANK = 2 does not exist here.
- "Exactly one row per group" → ROW_NUMBER, with a deterministic tie-break in ORDER BY.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. **ROW_NUMBER when ties must be included**, silently dropping a tied top earner.
2. **Filtering a window result in the same WHERE**: windows are computed after WHERE; filter in an outer query or CTE.
3. **Nth highest returning no row** instead of NULL: wrap in \`SELECT (subquery)\` so an empty result becomes NULL.
4. **Gaps and islands without de-duplication.**
5. **Running totals with ties in the ORDER BY** using the default RANGE frame, which groups peers.
6. **Division with COUNT(*) instead of COUNT(DISTINCT …)** when a customer bought the same product twice.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Return the second highest salary, or NULL if it does not exist.', answerMd: 'SELECT (SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1) AS second_highest. The outer scalar SELECT turns an empty result into NULL. With windows: SELECT MAX(salary) FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM employees) t WHERE r = 2.' },
    { id: 'iq2', q: 'Find the top 3 earners in each department, including ties.', answerMd: 'Compute DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) in a subquery or CTE, then filter rank ≤ 3 outside. DENSE_RANK keeps everyone with one of the top three distinct salaries (LeetCode 185).' },
    { id: 'iq3', q: 'How do you find each user\'s longest streak of consecutive login days?', answerMd: 'De-duplicate (user, day); compute day − ROW_NUMBER() per user ordered by day; rows with the same value form an island. Count rows per (user, value) and take the maximum per user.' },
    { id: 'iq4', q: 'Which customers bought every product?', answerMd: 'GROUP BY customer_id HAVING COUNT(DISTINCT product_id) = (SELECT COUNT(*) FROM products). The double NOT EXISTS formulation ("there is no product the customer did not buy") is the classic relational-division alternative.' },
    { id: 'iq5', q: 'How do you keep only the latest row per key in a table with duplicates?', answerMd: 'ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC, id DESC) AS rn and keep rn = 1 (for a DELETE, delete rows where rn > 1 via the key and id).' },
  ],
  revision: { notesMd: `- Top-N per group: rank in a subquery, filter outside; choose RANK/DENSE_RANK/ROW_NUMBER by the tie rule.
- Nth highest: DENSE_RANK = N, wrapped so "none" becomes NULL.
- Islands: DISTINCT first; date − ROW_NUMBER constant per island.
- Running totals: deterministic ORDER BY + ROWS frame.
- Ever/never: running value in a subquery, filter outside.
- Division: HAVING COUNT(DISTINCT x) = total.`, flashcards: [
    { id: 'f1', front: 'Which ranking keeps ties without gaps?', backMd: 'DENSE_RANK.' },
    { id: 'f2', front: 'Gaps-and-islands key expression?', backMd: 'value − ROW_NUMBER() OVER (PARTITION BY entity ORDER BY value).' },
    { id: 'f3', front: 'How do you return NULL when no second-highest salary exists?', backMd: 'Wrap the query as a scalar subquery: SELECT (SELECT … LIMIT 1 OFFSET 1).' },
    { id: 'f4', front: 'Why can\'t you filter on a window function in WHERE?', backMd: 'Windows are evaluated after WHERE; filter in an outer query.' },
    { id: 'f5', front: 'Customers who bought every product?', backMd: 'GROUP BY customer HAVING COUNT(DISTINCT product) = (SELECT COUNT(*) FROM products).' },
  ] },
  resources: [doc('Window functions (SQLite docs)', 'https://www.sqlite.org/windowfunctions.html'), doc('Window functions tutorial (PostgreSQL docs)', 'https://www.postgresql.org/docs/current/tutorial-window.html'), LC_SQL50],
});

const ptMcqs: MCQ[] = [
  mcq({ ...q(PT), id: 'sql.pt.q1', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE s (salary INTEGER);
INSERT INTO s VALUES (300), (300), (200), (100);
SELECT (SELECT MAX(salary) FROM (SELECT salary, RANK() OVER (ORDER BY salary DESC) AS r FROM s) WHERE r = 2) AS by_rank,
       (SELECT MAX(salary) FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM s) WHERE r = 2) AS by_dense;`, 'NULL | 200'), options: ['NULL | 200', ['300 | 200', 'With RANK, the two 300s share rank 1 and the next rank is 3.'], ['200 | 200', 'No row has RANK 2.'], ['NULL | NULL', 'DENSE_RANK 2 is 200.']], answer: 0, explanation: 'RANK values are 1, 1, 3, 4: no rank 2, so MAX over no rows is NULL. DENSE_RANK values are 1, 1, 2, 3.', verified: 'executed' }),
  mcq({ ...q(PT), id: 'sql.pt.q2', type: 'code-output', difficulty: 'hard', stem: 'Days are integers. What does the final query return (streak start and length)?', code: out(`CREATE TABLE lg (day INTEGER);
INSERT INTO lg VALUES (1), (2), (2), (3), (5), (6), (9);
WITH d AS (SELECT DISTINCT day FROM lg),
g AS (SELECT day, day - ROW_NUMBER() OVER (ORDER BY day) AS grp FROM d)
SELECT MIN(day), COUNT(*) FROM g GROUP BY grp ORDER BY MIN(day);`, '1 | 3\n5 | 2\n9 | 1'), options: ['1 | 3, 5 | 2, 9 | 1', ['1 | 4, 5 | 2, 9 | 1', 'DISTINCT removes the duplicate day 2.'], ['1 | 2, 3 | 1, 5 | 2, 9 | 1', 'Days 1, 2 and 3 form one island.'], ['1 | 6', 'Gaps at 4, 7 and 8 split the islands.']], answer: 0, explanation: 'After de-duplication, day − row_number is 0 for {1, 2, 3}, 1 for {5, 6} and 3 for {9}.', verified: 'executed' }),
  mcq({ ...q(PT), id: 'sql.pt.q3', type: 'concept', difficulty: 'medium', stem: '"Return the highest-paid employee(s) in each department, including ties." Which ranking function?', options: ['RANK or DENSE_RANK, filtering rank = 1', ['ROW_NUMBER, filtering = 1', 'It keeps exactly one employee per department.'], ['NTILE(1)', 'Puts everyone in one bucket.'], ['LAG', 'Not a ranking function.']], answer: 0, explanation: 'Both give tied top earners rank 1.' }),
  mcq({ ...q(PT), id: 'sql.pt.q4', type: 'code-output', difficulty: 'medium', stem: 'Which customers bought every product? (final query output)', code: out(`CREATE TABLE products (id INTEGER); CREATE TABLE buys (cust TEXT, product INTEGER);
INSERT INTO products VALUES (1), (2);
INSERT INTO buys VALUES ('a',1), ('a',2), ('b',1), ('b',1), ('c',2);
SELECT cust FROM buys GROUP BY cust HAVING COUNT(DISTINCT product) = (SELECT COUNT(*) FROM products);`, 'a'), options: ['a', ['a, b', 'b bought product 1 twice but never product 2; COUNT(DISTINCT) is 1.'], ['a, b, c', 'c bought only product 2.'], ['Nothing', 'a bought both.']], answer: 0, explanation: 'Relational division with COUNT(DISTINCT). With COUNT(*), b would wrongly qualify.', verified: 'executed' }),
  mcq({ ...q(PT), id: 'sql.pt.q5', type: 'debug', difficulty: 'medium', stem: '`SELECT name, RANK() OVER (ORDER BY salary DESC) AS r FROM employees WHERE r <= 3` fails. Why?', options: ['Window functions are computed after WHERE, so r does not exist there', ['RANK needs PARTITION BY', 'PARTITION BY is optional.'], ['Aliases are never allowed', 'They are allowed, just not in WHERE.'], ['<= is not allowed with ranks', 'It is, in an outer query.']], answer: 0, explanation: 'Compute the rank in a subquery or CTE and filter it outside (some engines offer QUALIFY, but not MySQL or SQLite).' }),
  mcq({ ...q(PT), id: 'sql.pt.q6', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return (balance after each transaction)?', code: out(`CREATE TABLE tx (id INTEGER, d TEXT, amt INTEGER);
INSERT INTO tx VALUES (1, '2024-01-01', 100), (2, '2024-01-01', -100), (3, '2024-01-02', 50);
SELECT id, SUM(amt) OVER (ORDER BY d) FROM tx ORDER BY id;`, '1 | 0\n2 | 0\n3 | 50'), options: ['1 | 0, 2 | 0, 3 | 50', ['1 | 100, 2 | 0, 3 | 50', 'With ORDER BY d only, rows 1 and 2 are peers and share the end-of-day total.'], ['1 | 100, 2 | -100, 3 | 50', 'SUM accumulates.'], ['1 | 50, 2 | 50, 3 | 50', 'The frame stops at the current peer group.']], answer: 0, explanation: 'The default frame is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, which includes all peers with the same d. Order by (d, id) with a ROWS frame for a per-row balance.', verified: 'executed' }),
];

// ---------------------------------------------------------------------------------------
const DM = 'sql.dml-ddl';
const dml = sqlTopic({
  id: DM, title: 'DML, DDL and Constraints', level: 'core', estMinutes: 50, prerequisites: ['sql.select-basics'], related: ['sql.joins', 'sql.subqueries', 'dbms.keys-constraints', 'dbms.transactions-acid'],
  summary: 'INSERT/UPDATE/DELETE, constraints, referential actions and views.',
  objectives: ['Write INSERT (values and INSERT … SELECT), UPDATE and DELETE with correct WHERE clauses and subqueries.', 'Define tables with PRIMARY KEY, UNIQUE, NOT NULL, CHECK, DEFAULT and FOREIGN KEY constraints.', 'Explain referential actions (RESTRICT, CASCADE, SET NULL) and the order of deletes and inserts they force.', 'Compare DELETE, TRUNCATE and DROP, and know what views are for.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Changing data safely', bodyMd: `\`\`\`sql
INSERT INTO txns (account_id, txn_date, amount, category)
VALUES (1, '2024-03-31', -25, 'fee');

INSERT INTO txns (account_id, txn_date, amount, category)      -- set-based: one row per account
SELECT id, '2024-03-31', -25, 'fee' FROM accounts WHERE type = 'current';

UPDATE employees SET salary = salary * 11 / 10
WHERE dept_id = (SELECT id FROM departments WHERE name = 'Engineering');

DELETE FROM follows
WHERE NOT EXISTS (SELECT 1 FROM follows b
                  WHERE b.follower_id = follows.followee_id AND b.followee_id = follows.follower_id);
\`\`\`

Habits that prevent disasters:
1. **Run the SELECT first** with the same WHERE and check the rows.
2. **List the target columns** in INSERT, so column order changes do not break it.
3. **Use a transaction** for multi-statement changes (\`BEGIN; … COMMIT;\`), so a failure leaves nothing half-done.
4. **UPDATE/DELETE without WHERE** affect every row; MySQL's \`--safe-updates\` mode refuses them.

**Upserts:** MySQL \`INSERT … ON DUPLICATE KEY UPDATE\`; PostgreSQL and SQLite \`INSERT … ON CONFLICT (key) DO UPDATE SET …\`.` },
    { id: 'ddl', kind: 'example', title: 'DDL and constraints', bodyMd: `\`\`\`sql
CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'shipped', 'cancelled')),
  total       INTEGER NOT NULL CHECK (total >= 0),
  coupon      TEXT UNIQUE
);
\`\`\`

| Constraint | Guarantees |
|---|---|
| PRIMARY KEY | unique and not NULL; one per table |
| UNIQUE | no duplicates (multiple NULLs are usually allowed) |
| NOT NULL | a value is always present |
| CHECK | a row-level condition holds (MySQL enforces CHECK from 8.0.16) |
| DEFAULT | value used when the column is omitted |
| FOREIGN KEY | every value exists in the referenced key (or is NULL) |

**Referential actions** on the parent row being deleted or updated: \`RESTRICT\`/\`NO ACTION\` (refuse, the default), \`CASCADE\` (delete/update the children too), \`SET NULL\`, \`SET DEFAULT\`. Without CASCADE you must delete children before parents and insert parents before children.

**ALTER TABLE** adds or drops columns and constraints; on large production tables some ALTERs rewrite the table and lock it, which is why online schema-change tools exist.` },
    { id: 'comparison', kind: 'comparison', title: 'DELETE vs TRUNCATE vs DROP; views', bodyMd: `| | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| Removes | rows matching WHERE (or all) | all rows | the table itself |
| WHERE allowed | yes | no | no |
| Triggers fire | yes | no (typically) | no |
| Speed on big tables | row by row, logged | very fast (deallocates) | fast |
| Rollback | yes, in a transaction | engine-dependent (implicit commit in MySQL) | engine-dependent |
| Auto-increment | kept | reset (MySQL) | gone |

A **view** is a stored SELECT: \`CREATE VIEW active_users AS SELECT … WHERE …\`. It simplifies repeated queries and can restrict which columns users see, but a plain view stores no data; a **materialised view** (PostgreSQL) stores the result and must be refreshed.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. **UPDATE/DELETE without WHERE.**
2. **Deleting parents before children** with foreign keys and no CASCADE (the statement fails).
3. **INSERT without a column list**, breaking when columns are added.
4. **Assuming UNIQUE forbids multiple NULLs** (in most engines it does not; SQL Server is the exception).
5. **Relying on CHECK in old MySQL versions** (parsed but ignored before 8.0.16).
6. **Long transactions** holding locks while doing large updates; batch them.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is the difference between DELETE, TRUNCATE and DROP?', answerMd: 'DELETE removes rows (optionally filtered), is fully logged and fires triggers. TRUNCATE removes all rows quickly by deallocating storage, cannot filter, usually does not fire triggers and resets auto-increment in MySQL (and implicitly commits there). DROP removes the table definition and its data.' },
    { id: 'iq2', q: 'What does ON DELETE CASCADE do, and when is it dangerous?', answerMd: 'Deleting a parent row automatically deletes the child rows that reference it. It is convenient for owned data (order → order items) but dangerous for shared data: one delete can remove large amounts of related data silently.' },
    { id: 'iq3', q: 'How do you write an upsert?', answerMd: 'MySQL: INSERT … VALUES (…) ON DUPLICATE KEY UPDATE col = VALUES(col) (or an alias in 8.0.20+). PostgreSQL/SQLite: INSERT … ON CONFLICT (key) DO UPDATE SET col = excluded.col. It relies on a unique or primary key to detect the conflict.' },
    { id: 'iq4', q: 'Primary key vs unique constraint?', answerMd: 'Both enforce uniqueness. A table has one primary key, which is also NOT NULL and is the main identity (often the clustered index in InnoDB). It can have many unique constraints, which usually allow NULLs.' },
    { id: 'iq5', q: 'How would you safely run a large UPDATE in production?', answerMd: 'Test the WHERE with a SELECT; take a backup or make it reversible; run in a transaction; for millions of rows, update in batches by key range to avoid long locks and huge undo logs; verify counts before committing.' },
  ],
  revision: { notesMd: `- INSERT with a column list; INSERT … SELECT for set-based inserts.
- UPDATE/DELETE: WHERE, test with SELECT, use transactions.
- Constraints: PK, UNIQUE, NOT NULL, CHECK, DEFAULT, FK.
- FK actions: RESTRICT (default), CASCADE, SET NULL; children before parents when deleting.
- DELETE (rows, logged) vs TRUNCATE (all rows, fast) vs DROP (table).
- Upsert: ON DUPLICATE KEY UPDATE (MySQL), ON CONFLICT (PostgreSQL/SQLite).`, flashcards: [
    { id: 'f1', front: 'Which removes the table definition: DELETE, TRUNCATE or DROP?', backMd: 'DROP.' },
    { id: 'f2', front: 'Delete a parent with children and no CASCADE?', backMd: 'Delete the children first, or the statement fails.' },
    { id: 'f3', front: 'MySQL upsert syntax?', backMd: 'INSERT … ON DUPLICATE KEY UPDATE ….' },
    { id: 'f4', front: 'Does UNIQUE usually allow several NULLs?', backMd: 'Yes (PostgreSQL, MySQL, SQLite); SQL Server allows one.' },
    { id: 'f5', front: 'Safest habit before an UPDATE?', backMd: 'Run a SELECT with the same WHERE and check the rows.' },
  ] },
  resources: [doc('INSERT (SQLite docs)', 'https://www.sqlite.org/lang_insert.html'), doc('Foreign key support (SQLite docs)', 'https://www.sqlite.org/foreignkeys.html'), doc('Constraints (PostgreSQL docs)', 'https://www.postgresql.org/docs/current/ddl-constraints.html')],
});

const dmMcqs: MCQ[] = [
  mcq({ ...q(DM), id: 'sql.dm.q1', type: 'code-output', difficulty: 'easy', stem: 'What does the final query return?', code: out(`CREATE TABLE t (id INTEGER PRIMARY KEY, v INTEGER);
INSERT INTO t (v) VALUES (10), (20), (30);
UPDATE t SET v = v + 1 WHERE v > 15;
DELETE FROM t WHERE id = 1;
SELECT id, v FROM t ORDER BY id;`, '2 | 21\n3 | 31'), options: ['2 | 21, 3 | 31', ['1 | 10, 2 | 21, 3 | 31', 'Row 1 was deleted.'], ['2 | 20, 3 | 30', 'The UPDATE changed both rows with v > 15.'], ['2 | 21, 3 | 30', '30 > 15, so it was updated too.']], answer: 0, explanation: 'The ids are generated 1, 2, 3; rows 2 and 3 are updated, row 1 is deleted.', verified: 'executed' }),
  mcq({ ...q(DM), id: 'sql.dm.q2', type: 'code-output', difficulty: 'medium', stem: 'Foreign keys are enforced. What does the final query return?', code: out(`PRAGMA foreign_keys = ON;
CREATE TABLE p (id INTEGER PRIMARY KEY);
CREATE TABLE c (id INTEGER PRIMARY KEY, pid INTEGER REFERENCES p(id) ON DELETE CASCADE);
INSERT INTO p VALUES (1), (2);
INSERT INTO c VALUES (10, 1), (11, 1), (12, 2);
DELETE FROM p WHERE id = 1;
SELECT (SELECT COUNT(*) FROM p), (SELECT COUNT(*) FROM c);`, '1 | 1'), options: ['1 | 1', ['1 | 3', 'ON DELETE CASCADE removed the two children of parent 1.'], ['2 | 3', 'Parent 1 was deleted.'], ['An error', 'With CASCADE the delete is allowed.']], answer: 0, explanation: 'Deleting parent 1 cascades to children 10 and 11; parent 2 and child 12 remain.', verified: 'executed' }),
  mcq({ ...q(DM), id: 'sql.dm.q3', type: 'concept', difficulty: 'easy', stem: 'Which statement removes rows but keeps the table, and can be filtered with WHERE?', options: ['DELETE', ['TRUNCATE', 'TRUNCATE cannot filter.'], ['DROP', 'DROP removes the table.'], ['ALTER', 'ALTER changes the structure.']], answer: 0, explanation: 'DELETE … WHERE removes the matching rows only.' }),
  mcq({ ...q(DM), id: 'sql.dm.q4', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE u (email TEXT UNIQUE, n INTEGER);
INSERT INTO u VALUES ('a@x', 1);
INSERT INTO u VALUES ('a@x', 5) ON CONFLICT (email) DO UPDATE SET n = n + excluded.n;
INSERT INTO u VALUES (NULL, 1), (NULL, 2);
SELECT COUNT(*), SUM(n) FROM u;`, '3 | 9'), options: ['3 | 9', ['2 | 9', 'Two NULL emails do not conflict with each other under UNIQUE.'], ['4 | 9', 'The second a@x became an update, not a new row.'], ['An error', 'The upsert avoids the duplicate-key error.']], answer: 0, explanation: 'The upsert turns a@x into n = 1 + 5 = 6; UNIQUE allows several NULLs; rows: 6, 1, 2 → count 3, sum 9.', verified: 'executed' }),
  mcq({ ...q(DM), id: 'sql.dm.q5', type: 'debug', difficulty: 'medium', stem: 'With foreign keys enforced (no CASCADE), `DELETE FROM orders WHERE status = \'cancelled\'` fails. What is the fix?', options: ['Delete the matching order_items first, then the orders, in one transaction', ['Disable foreign keys permanently', 'That allows orphaned rows.'], ['Use TRUNCATE orders', 'It would remove every order and still conflicts with references.'], ['Add WHERE 1 = 1', 'Irrelevant.']], answer: 0, explanation: 'Children reference parents; remove the references before the referenced rows (or define ON DELETE CASCADE).' }),
  mcq({ ...q(DM), id: 'sql.dm.q6', type: 'concept', difficulty: 'medium', stem: 'Why should production INSERT statements list their target columns?', options: ['Adding or reordering columns later would otherwise break the statement or put values in the wrong columns', ['It makes inserts faster', 'Not meaningfully.'], ['SQL requires it', 'It is optional.'], ['To allow NULLs', 'Omitted columns get defaults either way.']], answer: 0, explanation: 'Explicit column lists make the statement independent of the table\'s column order and let omitted columns take their defaults.' }),
];

// ---------------------------------------------------------------------------------------
const EX = 'sql.explain-optimisation';
const explain = sqlTopic({
  id: EX, title: 'EXPLAIN and Query Optimisation', level: 'advanced', estMinutes: 55, prerequisites: ['sql.joins'], related: ['dbms.indexing', 'sql.date-string-functions', 'sql.window-functions'],
  summary: 'Reading plans, sargable predicates and pagination.',
  objectives: ['Read an EXPLAIN plan: full scan vs index seek, join order and the estimated rows.', 'Write sargable predicates and choose composite index column order (equality first, then range or sort).', 'Replace slow patterns: OFFSET pagination, SELECT *, per-row correlated subqueries and functions on indexed columns.', 'Explain covering indexes and why an index is sometimes not used.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'What EXPLAIN tells you', bodyMd: `\`EXPLAIN\` shows the plan the optimiser chose without running the query (\`EXPLAIN ANALYZE\` in PostgreSQL and MySQL 8.0.18+ runs it and adds real timings and row counts).

What to look for:
- **Access method per table:** a full table scan (MySQL \`type: ALL\`, PostgreSQL \`Seq Scan\`, SQLite \`SCAN t\`) vs an index lookup (\`ref\`/\`range\`, \`Index Scan\`, \`SEARCH t USING INDEX …\`).
- **Estimated rows** at each step: a huge estimate on an inner loop is the classic slow nested-loop join.
- **Join order and algorithm:** nested loop (good with an index on the inner side), hash join, merge join.
- **Extra work:** \`Using filesort\`, \`Using temporary\` (MySQL) or explicit Sort nodes for ORDER BY / GROUP BY without a suitable index.

SQLite's form is \`EXPLAIN QUERY PLAN SELECT …\`, printing lines such as \`SEARCH employees USING INDEX idx_dept (dept_id=?)\`.` },
    { id: 'indexes', kind: 'example', title: 'Sargable predicates and composite indexes', bodyMd: `A predicate is **sargable** (Search ARGument-able) when the engine can turn it into an index range:

| Not sargable | Sargable rewrite |
|---|---|
| \`WHERE YEAR(hire_date) = 2020\` | \`WHERE hire_date >= '2020-01-01' AND hire_date < '2021-01-01'\` |
| \`WHERE salary * 12 > 1200000\` | \`WHERE salary > 100000\` |
| \`WHERE LOWER(email) = 'a@x.com'\` | store normalised emails, or use a functional index |
| \`WHERE name LIKE '%son'\` | (leading wildcard: no B-tree range; use full-text or a reversed column) |

**Composite index column order:** for \`WHERE city = ? AND requested_at >= ? ORDER BY requested_at\`, the index \`(city, requested_at)\` serves the equality, the range and the sort. Rule of thumb: **equality columns first, then the range or sort column**. The index \`(requested_at, city)\` is much weaker for this query. The leftmost-prefix rule: \`(a, b, c)\` helps queries on a, (a, b) or (a, b, c), not on b alone.

**Covering index:** if every column the query needs is in the index, the engine never touches the table rows ("Using index"). \`SELECT *\` defeats this.` },
    { id: 'patterns', kind: 'comparison', title: 'Slow patterns and their fixes', bodyMd: `| Pattern | Problem | Fix |
|---|---|---|
| \`LIMIT 20 OFFSET 100000\` | produces and discards 100 000 rows | keyset: \`WHERE id > :last ORDER BY id LIMIT 20\` |
| Correlated subquery per row | may run once per outer row | pre-aggregate in a derived table/CTE and join, or a window function |
| \`NOT IN (subquery with NULLs)\` | wrong results, and often slow | \`NOT EXISTS\` |
| \`SELECT *\` | reads unneeded columns, prevents covering indexes | list columns |
| \`OR\` across different columns | may prevent a single index range | \`UNION ALL\` of two indexed queries (deduplicate if needed) |
| Function on an indexed column | full scan | rewrite as a range or add a functional index |
| Missing index on a join key | nested loop scans the inner table each time | index the foreign key |

**Why an index might not be used:** low selectivity (the filter matches a large share of rows, so a scan is cheaper), stale statistics, type mismatches (comparing a string column to a number forces a conversion), or a leading wildcard.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. **Indexing every column:** each index slows inserts and updates and costs storage.
2. **Composite index in the wrong order** (range column before the equality column).
3. **Trusting EXPLAIN estimates blindly**; use EXPLAIN ANALYZE to compare estimated and actual rows.
4. **Deep OFFSET pagination** on large tables.
5. **Assuming the optimiser rewrites everything**: correlated subqueries, ORs and functions often survive into the plan.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'A query on a 50-million-row table is slow. How do you approach it?', answerMd: 'Run EXPLAIN (or EXPLAIN ANALYZE) and find the step with the most rows or time: full scans, bad join order, filesorts. Check that the filter and join columns are indexed and the predicates are sargable; consider a composite or covering index; reduce selected columns; rewrite OFFSET pagination and correlated subqueries; then measure again.' },
    { id: 'iq2', q: 'What is a covering index?', answerMd: 'An index that contains every column the query needs (filter, sort and output), so the engine answers from the index alone without reading table rows. Example: an index on (customer_id, order_date, total) for SELECT order_date, total FROM orders WHERE customer_id = ? ORDER BY order_date.' },
    { id: 'iq3', q: 'Why is OFFSET pagination slow for deep pages, and what is the alternative?', answerMd: 'OFFSET n still produces and discards n rows, so page 5000 does 5000 pages of work. Keyset pagination remembers the last key and asks for WHERE key > last ORDER BY key LIMIT size, which is an index seek regardless of depth (it cannot jump to an arbitrary page number, though).' },
    { id: 'iq4', q: 'Given WHERE status = ? AND created_at > ? ORDER BY created_at, which composite index do you create?', answerMd: '(status, created_at): equality first, then the range/sort column. The engine seeks to the status value, scans created_at in order, and needs no extra sort. (created_at, status) would scan a large range and check status row by row.' },
    { id: 'iq5', q: 'When might the optimiser ignore an index?', answerMd: 'When the predicate is not selective (a scan is cheaper than many random lookups), statistics are stale, the predicate is not sargable (functions, leading wildcards, implicit type conversions), or the index column order does not match the query.' },
  ],
  revision: { notesMd: `- EXPLAIN: access method (scan vs index), rows, join order, sorts/temporaries; EXPLAIN ANALYZE for actuals.
- Sargable: bare column, constants transformed; no leading %.
- Composite index: equality columns first, then range/sort; leftmost-prefix rule.
- Covering index: all needed columns in the index.
- Keyset pagination instead of deep OFFSET; pre-aggregate instead of per-row subqueries.`, flashcards: [
    { id: 'f1', front: 'SQLite command to see a plan?', backMd: 'EXPLAIN QUERY PLAN SELECT ….' },
    { id: 'f2', front: 'Sargable rewrite of YEAR(d) = 2024?', backMd: "d >= '2024-01-01' AND d < '2025-01-01'." },
    { id: 'f3', front: 'Composite index order for WHERE a = ? AND b > ??', backMd: '(a, b): equality first, then range.' },
    { id: 'f4', front: 'Keyset pagination query shape?', backMd: 'WHERE id > :last_id ORDER BY id LIMIT :n.' },
    { id: 'f5', front: 'Why can SELECT * hurt performance?', backMd: 'It reads unneeded columns and prevents covering-index plans.' },
  ] },
  resources: [doc('EXPLAIN QUERY PLAN (SQLite docs)', 'https://www.sqlite.org/eqp.html'), doc('The SQLite query optimizer overview', 'https://www.sqlite.org/optoverview.html'), doc('Using EXPLAIN (PostgreSQL docs)', 'https://www.postgresql.org/docs/current/using-explain.html')],
});

const exMcqs: MCQ[] = [
  mcq({ ...q(EX), id: 'sql.ex.q1', type: 'concept', difficulty: 'easy', stem: 'Which predicate lets a B-tree index on `hire_date` be used for a range scan?', options: ["hire_date >= '2020-01-01' AND hire_date < '2021-01-01'", ['YEAR(hire_date) = 2020', 'A function on the column.'], ["strftime('%Y', hire_date) = '2020'", 'Also a function on the column.'], ["hire_date LIKE '%2020%'", 'A leading wildcard cannot use a range.']], answer: 0, explanation: 'Keeping the column bare lets the engine seek to the start of the range.' }),
  mcq({ ...q(EX), id: 'sql.ex.q2', type: 'scenario', difficulty: 'medium', stem: 'The query is `WHERE city = ? AND requested_at >= ? ORDER BY requested_at`. Which index serves it best?', options: ['(city, requested_at)', ['(requested_at, city)', 'The range column first means scanning a wide range and checking city per row.'], ['(city) only', 'Still needs a sort and filters dates row by row.'], ['Separate indexes on each column', 'Usually only one is used; the other condition is checked per row.']], answer: 0, explanation: 'Equality first, then the range/sort column: the engine seeks to the city and reads requested_at in order, with no extra sort.' }),
  mcq({ ...q(EX), id: 'sql.ex.q3', type: 'concept', difficulty: 'medium', stem: 'An index exists on (a, b, c). Which WHERE clause can use it as a prefix?', options: ['WHERE a = 1 AND b = 2', ['WHERE b = 2', 'The leftmost column a is missing.'], ['WHERE c = 3', 'Not a prefix.'], ['WHERE b = 2 AND c = 3', 'Not a prefix.']], answer: 0, explanation: 'Leftmost-prefix rule: (a), (a, b) and (a, b, c) are usable prefixes.' }),
  mcq({ ...q(EX), id: 'sql.ex.q4', type: 'scenario', difficulty: 'medium', stem: 'A feed uses `ORDER BY id LIMIT 20 OFFSET 200000` and page loads get slower the deeper users scroll. Best fix?', options: ['Keyset pagination: WHERE id > :last_seen ORDER BY id LIMIT 20', ['Add an index on id', 'id is already the primary key; OFFSET still walks 200 000 rows.'], ['Increase the page size', 'Fewer requests, but each one is slower.'], ['Cache the COUNT(*)', 'Unrelated to the scan cost.']], answer: 0, explanation: 'The seek starts exactly at the next key, so every page costs the same.' }),
  mcq({ ...q(EX), id: 'sql.ex.q5', type: 'concept', difficulty: 'medium', stem: 'Why might the optimiser choose a full table scan even though `status` is indexed and the query is `WHERE status = \'active\'`?', options: ['Most rows are active, so reading the whole table sequentially is cheaper than many index lookups', ['Indexes never work on text columns', 'They do.'], ['Equality predicates cannot use indexes', 'They are the best case.'], ['Because of the quotes', 'Literals are fine.']], answer: 0, explanation: 'Selectivity matters: an index pays off when it narrows the rows substantially.' }),
  mcq({ ...q(EX), id: 'sql.ex.q6', type: 'concept', difficulty: 'hard', stem: 'What is a covering index for `SELECT order_date, total FROM orders WHERE customer_id = ? ORDER BY order_date`?', options: ['(customer_id, order_date, total)', ['(order_date)', 'Does not filter by customer.'], ['(total, customer_id)', 'Wrong order for the filter and sort.'], ['(customer_id)', 'Filters, but the engine must still read table rows and sort.']], answer: 0, explanation: 'Filter column first, then the sort column, then the remaining output column: the query is answered from the index alone, already sorted.' }),
];

export const topics: Topic[] = [selfJoins, setOps, caseAgg, ctes, dates, patterns, dml, explain];
export const mcqs: MCQ[] = [...sjMcqs, ...soMcqs, ...caMcqs, ...ctMcqs, ...dsMcqs, ...ptMcqs, ...dmMcqs, ...exMcqs];

