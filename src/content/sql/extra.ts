import type { MCQ } from '../schema';
import { mcq } from '../helpers';
import { out, q } from './topics';

// Extra SQL output-prediction MCQs (7). Every one carries `expectedOutput` and is executed by
// tests/sql-exercises.test.ts against sql.js (SQLite): rows on separate lines, columns joined by " | ".

export const mcqs: MCQ[] = [
  mcq({ ...q('sql.window-functions'), id: 'sql.xm.q1', type: 'code-output', difficulty: 'medium', stem: 'What does the query return for the row of student `c`?', code: out(`CREATE TABLE s (name TEXT, score INTEGER);
INSERT INTO s VALUES ('a', 90), ('b', 90), ('c', 80), ('d', 70);
SELECT name, RANK() OVER (ORDER BY score DESC) AS r, DENSE_RANK() OVER (ORDER BY score DESC) AS d
FROM s ORDER BY name;`, 'a | 1 | 1\nb | 1 | 1\nc | 3 | 2\nd | 4 | 3'), options: ['rank 3, dense rank 2', ['rank 2, dense rank 2', 'RANK leaves a gap after ties: two rows share rank 1, so the next rank is 3.'], ['rank 3, dense rank 3', 'DENSE_RANK has no gaps, so the next value after 1 is 2.'], ['rank 2, dense rank 3', 'Both values are swapped.']], answer: 0, explanation: 'After two rows tie for rank 1, RANK skips to 3 while DENSE_RANK continues with 2.', verified: 'executed' }),
  mcq({ ...q('sql.null-handling'), id: 'sql.xm.q2', type: 'code-output', difficulty: 'hard', stem: 'What does the final query return?', code: out(`CREATE TABLE a (x INTEGER);
CREATE TABLE b (y INTEGER);
INSERT INTO a VALUES (1), (2), (3);
INSERT INTO b VALUES (1), (NULL);
SELECT COUNT(*) AS n FROM a WHERE x NOT IN (SELECT y FROM b);`, '0'), options: ['0', ['2', 'That ignores the NULL: x NOT IN (1, NULL) is never true for x = 2 or 3.'], ['3', 'The row with x = 1 is excluded as well, and the NULL excludes the rest.'], ['NULL', 'COUNT(*) always returns a number.']], answer: 0, explanation: '`x NOT IN (1, NULL)` expands to `x <> 1 AND x <> NULL`; the second comparison is unknown for every x, so no row passes. Use NOT EXISTS or filter the NULLs out.', verified: 'executed' }),
  mcq({ ...q('sql.joins'), id: 'sql.xm.q3', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE d (id INTEGER, name TEXT);
CREATE TABLE e (id INTEGER, dept_id INTEGER, sal INTEGER);
INSERT INTO d VALUES (1, 'Eng'), (2, 'Legal');
INSERT INTO e VALUES (10, 1, 100), (11, 1, 50);
SELECT d.name, COUNT(e.id) AS n
FROM d LEFT JOIN e ON e.dept_id = d.id
WHERE e.sal > 60
GROUP BY d.name ORDER BY d.name;`, 'Eng | 1'), options: ['One row: Eng | 1', ['Two rows: Eng | 1 and Legal | 0', 'The WHERE clause removes the NULL-extended Legal row after the join.'], ['Two rows: Eng | 2 and Legal | 0', 'Only one employee earns more than 60, and Legal is filtered out.'], ['No rows', 'Eng has an employee with sal 100.']], answer: 0, explanation: 'A filter on the right table in WHERE turns the LEFT JOIN into an inner join: the NULL salary of Legal fails `> 60`. Put the condition in the ON clause to keep Legal with a count of 0.', verified: 'executed' }),
  mcq({ ...q('sql.aggregation'), id: 'sql.xm.q4', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE o (cust TEXT, product TEXT);
INSERT INTO o VALUES ('a', 'x'), ('a', 'x'), ('a', 'y'), ('b', 'x'), ('b', 'x');
SELECT cust, COUNT(*) AS orders, COUNT(DISTINCT product) AS kinds
FROM o GROUP BY cust HAVING COUNT(DISTINCT product) > 1;`, 'a | 3 | 2'), options: ['a | 3 | 2', ['a | 2 | 2', 'COUNT(*) counts every row of the group, including repeated products.'], ['a | 3 | 2 and b | 2 | 1', 'Customer b has only one distinct product, so HAVING removes it.'], ['b | 2 | 1', 'b fails the HAVING condition.']], answer: 0, explanation: 'Customer a has 3 orders over 2 distinct products; b has 2 orders but a single product, so HAVING (> 1) drops b.', verified: 'executed' }),
  mcq({ ...q('sql.set-operations'), id: 'sql.xm.q5', type: 'code-output', difficulty: 'easy', stem: 'What does the final query return?', code: out(`CREATE TABLE p (v INTEGER);
CREATE TABLE r (v INTEGER);
INSERT INTO p VALUES (1), (2), (2);
INSERT INTO r VALUES (2), (3);
SELECT COUNT(*) AS n FROM (SELECT v FROM p UNION SELECT v FROM r);`, '3'), options: ['3', ['5', 'That is the result of UNION ALL, which keeps duplicates.'], ['2', 'UNION keeps the distinct values 1, 2 and 3.'], ['4', 'Duplicates inside one table are removed as well.']], answer: 0, explanation: 'UNION removes duplicates across and within the inputs: {1, 2, 3}. UNION ALL would return 5 rows.', verified: 'executed' }),
  mcq({ ...q('sql.case-conditional-agg'), id: 'sql.xm.q6', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE sales (region TEXT, q INTEGER, amt INTEGER);
INSERT INTO sales VALUES ('N', 1, 10), ('N', 2, 20), ('S', 1, 5), ('S', 1, 7);
SELECT region,
       SUM(CASE WHEN q = 1 THEN amt ELSE 0 END) AS q1,
       SUM(CASE WHEN q = 2 THEN amt ELSE 0 END) AS q2
FROM sales GROUP BY region ORDER BY region;`, 'N | 10 | 20\nS | 12 | 0'), options: ['N | 10 | 20 and S | 12 | 0', ['N | 10 | 20 and S | 12 | NULL', 'The ELSE 0 makes the SUM 0, not NULL.'], ['N | 30 | 0 and S | 12 | 0', 'Quarter 2 is summed separately from quarter 1.'], ['Four rows, one per sales row', 'GROUP BY collapses rows to one per region.']], answer: 0, explanation: 'Conditional aggregation pivots rows into columns: each CASE adds the amount only for its quarter, and ELSE 0 keeps empty cells at 0.', verified: 'executed' }),
  mcq({ ...q('sql.window-functions'), id: 'sql.xm.q7', type: 'code-output', difficulty: 'medium', stem: 'What does the final query return?', code: out(`CREATE TABLE t (d INTEGER, v INTEGER);
INSERT INTO t VALUES (1, 10), (2, 15), (3, 12);
SELECT d, v - LAG(v) OVER (ORDER BY d) AS diff FROM t ORDER BY d;`, '1 | NULL\n2 | 5\n3 | -3'), options: ['1 | NULL, 2 | 5, 3 | -3', ['1 | 0, 2 | 5, 3 | -3', 'LAG returns NULL when there is no previous row, and NULL arithmetic gives NULL, not 0.'], ['1 | 10, 2 | 5, 3 | -3', 'The first row has no previous value to subtract.'], ['2 | 5, 3 | -3 only', 'The first row is still returned, with a NULL difference.']], answer: 0, explanation: 'LAG(v) is the previous row\'s value in the ordering; the first row has none, so its difference is NULL.', verified: 'executed' }),
];
