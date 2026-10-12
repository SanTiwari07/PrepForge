import type { SqlExercise } from '../schema';
import { exercises2 } from './exercises2';

// Original PrepForge exercises modelled on common interview patterns (not copied).
// Expected outputs are never hand-written: they are produced by running referenceSql
// on the visible and hidden datasets. tests/sql-exercises.test.ts executes every
// reference (and checks that each listed wrong approach fails on at least one dataset).

const LC = (slug: string, title: string) => ({ title: `LeetCode: ${title}`, url: `https://leetcode.com/problems/${slug}/` });

const batch1: SqlExercise[] = [
  // ---------- company ----------
  {
    id: 'sql-high-earners', title: 'High earners, highest first', topicIds: ['sql.select-basics'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Return the `name` and `salary` of employees earning **more than 150000**, highest salary first. Break ties by name (A→Z).',
    referenceSql: `SELECT name, salary
FROM employees
WHERE salary > 150000
ORDER BY salary DESC, name ASC;`,
    orderMatters: true,
    hints: ['Filter rows with WHERE before sorting.', 'ORDER BY can take several columns: the second one breaks ties in the first.'],
    explanationMd: '`WHERE` keeps rows with salary > 150000; `ORDER BY salary DESC, name` sorts by salary, then alphabetically for equal salaries (Ravi and Meera both earn 180000).',
    wrongApproaches: [{ sql: 'SELECT name, salary FROM employees WHERE salary > 150000 ORDER BY salary DESC;', whyMd: 'Equal salaries come back in an arbitrary order; the question fixes the tie-break.' }],
    targetMinutes: 3, verification: 'verified-sqlite',
  },
  {
    id: 'sql-no-department', title: 'Employees without a department', topicIds: ['sql.null-handling'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'List the `name` of every employee who is **not assigned to any department**.',
    referenceSql: `SELECT name FROM employees WHERE dept_id IS NULL;`,
    orderMatters: false,
    hints: ['A missing department is stored as NULL.', 'Comparisons with NULL using = are never true. SQL has a dedicated operator.'],
    explanationMd: '`dept_id = NULL` evaluates to UNKNOWN for every row, so it returns nothing. Use `IS NULL`.',
    wrongApproaches: [{ sql: 'SELECT name FROM employees WHERE dept_id = NULL;', whyMd: '`= NULL` is UNKNOWN, never TRUE, so no rows are returned.' }],
    targetMinutes: 2, verification: 'verified-sqlite',
  },
  {
    id: 'sql-dept-headcount', title: 'Headcount per department (including empty ones)', topicIds: ['sql.joins', 'sql.aggregation'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'For **every** department, return its `name` and `headcount` (number of employees). Departments with no employees must appear with 0.',
    referenceSql: `SELECT d.name, COUNT(e.id) AS headcount
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
GROUP BY d.id, d.name;`,
    orderMatters: false,
    hints: ['Which join keeps departments that have no matching employee?', 'COUNT(*) counts rows, including the all-NULL row a LEFT JOIN creates. What should you count instead?'],
    explanationMd: 'A `LEFT JOIN` keeps every department; for an empty one it produces a single row with NULL employee columns. `COUNT(e.id)` ignores NULLs, so it gives 0, while `COUNT(*)` would give 1.',
    wrongApproaches: [
      { sql: 'SELECT d.name, COUNT(*) AS headcount FROM departments d JOIN employees e ON e.dept_id = d.id GROUP BY d.id, d.name;', whyMd: 'An INNER JOIN drops departments with no employees (Legal disappears).' },
      { sql: 'SELECT d.name, COUNT(*) AS headcount FROM departments d LEFT JOIN employees e ON e.dept_id = d.id GROUP BY d.id, d.name;', whyMd: '`COUNT(*)` counts the NULL-padded row, so empty departments show 1 instead of 0.' },
    ],
    targetMinutes: 4, verification: 'verified-sqlite',
  },
  {
    id: 'sql-avg-salary-dept', title: 'Average salary in larger departments', topicIds: ['sql.aggregation'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'For departments with **at least 2 employees**, return the department `name` and `avg_salary` rounded to 2 decimal places.',
    referenceSql: `SELECT d.name, ROUND(AVG(e.salary), 2) AS avg_salary
FROM employees e
JOIN departments d ON d.id = e.dept_id
GROUP BY d.id, d.name
HAVING COUNT(*) >= 2;`,
    orderMatters: false,
    hints: ['Group by department.', 'A condition on an aggregate (a count per group) cannot go in WHERE.'],
    explanationMd: '`WHERE` filters rows before grouping; `HAVING` filters groups after aggregation, so the count condition belongs in `HAVING`.',
    targetMinutes: 4, verification: 'verified-sqlite',
  },
  {
    id: 'sql-second-highest', title: 'Second highest salary', topicIds: ['sql.patterns', 'sql.subqueries'], difficulty: 'medium', datasetId: 'company',
    promptMd: 'Return the **second highest distinct** salary as a single column `second_highest`. If there is no such salary, return **one row containing NULL**.',
    referenceSql: `SELECT (
  SELECT DISTINCT salary
  FROM employees
  ORDER BY salary DESC
  LIMIT 1 OFFSET 1
) AS second_highest;`,
    orderMatters: false,
    hints: ['"Distinct" matters: two people can share the top salary.', 'A scalar subquery that finds no row evaluates to NULL. Use that to always return exactly one row.'],
    explanationMd: '`DISTINCT` collapses duplicate salaries so OFFSET 1 skips the top *value*, not the top *row*. Wrapping the query as a scalar subquery turns "no row" into NULL.',
    wrongApproaches: [
      { sql: 'SELECT salary AS second_highest FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;', whyMd: 'Without DISTINCT, a tie at the top (300, 300, 200) returns 300 again. With one employee it returns no row instead of NULL.' },
    ],
    targetMinutes: 6, similarTo: [LC('second-highest-salary', 'Second Highest Salary')], verification: 'verified-sqlite',
  },
  {
    id: 'sql-earn-more-than-manager', title: 'Earning more than their manager', topicIds: ['sql.self-joins'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Return the `name` of employees who earn **strictly more** than their direct manager.',
    referenceSql: `SELECT e.name
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;`,
    orderMatters: false,
    hints: ['Each row needs the employee and the manager side by side.', 'Join the table to itself with two aliases.'],
    explanationMd: 'A self-join pairs each employee row `e` with the manager row `m`. Employees without a manager have no partner in an inner join, which is correct here.',
    targetMinutes: 4, similarTo: [LC('employees-earning-more-than-their-managers', 'Employees Earning More Than Their Managers')], verification: 'verified-sqlite',
  },
  {
    id: 'sql-manager-names', title: 'Everyone with their manager', topicIds: ['sql.self-joins', 'sql.joins'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Return every employee as `employee` with their manager\'s name as `manager`. Employees with no manager must still appear, with `manager` NULL.',
    referenceSql: `SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;`,
    orderMatters: false,
    hints: ['Self-join employees to employees.', 'Which join keeps rows that have no match?'],
    explanationMd: 'A LEFT self-join keeps top-level employees (NULL manager_id) with a NULL manager name.',
    wrongApproaches: [{ sql: 'SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id;', whyMd: 'An inner join drops employees who have no manager.' }],
    targetMinutes: 3, verification: 'verified-sqlite',
  },
  {
    id: 'sql-top-paid-per-dept', title: 'Highest-paid employee(s) in each department', topicIds: ['sql.patterns', 'sql.window-functions', 'sql.subqueries'], difficulty: 'medium', datasetId: 'company',
    promptMd: 'For each department, return `department`, `employee` and `salary` of its highest-paid employee. **If several share the top salary, return all of them.** Ignore employees without a department.',
    referenceSql: `SELECT department, employee, salary
FROM (
  SELECT d.name AS department, e.name AS employee, e.salary,
         RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS rnk
  FROM employees e
  JOIN departments d ON d.id = e.dept_id
) t
WHERE rnk = 1;`,
    orderMatters: false,
    hints: ['This is "top-N per group" with N = 1.', 'Which ranking function gives tied rows the same rank: ROW_NUMBER, RANK or DENSE_RANK?'],
    explanationMd: '`RANK()` (or `DENSE_RANK()`) assigns rank 1 to every tied top earner. `ROW_NUMBER()` picks one of them arbitrarily. A correlated `salary = (SELECT MAX(...))` subquery is an equally valid answer.',
    wrongApproaches: [{ sql: `SELECT department, employee, salary FROM (SELECT d.name AS department, e.name AS employee, e.salary, ROW_NUMBER() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS rn FROM employees e JOIN departments d ON d.id = e.dept_id) t WHERE rn = 1;`, whyMd: 'ROW_NUMBER breaks ties arbitrarily, so tied top earners are lost (A and B both earn 300 in a hidden dataset).' }],
    targetMinutes: 8, similarTo: [LC('department-highest-salary', 'Department Highest Salary')], verification: 'verified-sqlite',
  },
  {
    id: 'sql-dense-rank-salaries', title: 'Rank salaries within each department', topicIds: ['sql.window-functions'], difficulty: 'medium', datasetId: 'company',
    promptMd: 'For employees that have a department, return `department`, `employee`, `salary` and `salary_rank`, where rank 1 is the highest salary **in that department**, equal salaries share a rank, and ranks have **no gaps** (1, 1, 2…).',
    referenceSql: `SELECT d.name AS department, e.name AS employee, e.salary,
       DENSE_RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS salary_rank
FROM employees e
JOIN departments d ON d.id = e.dept_id;`,
    orderMatters: false,
    hints: ['"Within each department" means PARTITION BY.', 'RANK leaves gaps after ties; DENSE_RANK does not.'],
    explanationMd: 'In Engineering, salaries 250000, 180000, 180000, 120000 get DENSE_RANK 1, 2, 2, 3. RANK would give 1, 2, 2, 4.',
    wrongApproaches: [{ sql: 'SELECT d.name AS department, e.name AS employee, e.salary, RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS salary_rank FROM employees e JOIN departments d ON d.id = e.dept_id;', whyMd: 'RANK skips a number after a tie (1, 2, 2, 4).' }],
    targetMinutes: 5, verification: 'verified-sqlite',
  },
  {
    id: 'sql-running-payroll', title: 'Running payroll by hire date', topicIds: ['sql.window-functions'], difficulty: 'medium', datasetId: 'company',
    promptMd: 'List every employee\'s `name`, `hire_date` and `running_total`: the sum of salaries of everyone hired **on or before** that employee (by hire date, then by id). Order the output by hire date, then id.',
    referenceSql: `SELECT name, hire_date,
       SUM(salary) OVER (ORDER BY hire_date, id) AS running_total
FROM employees
ORDER BY hire_date, id;`,
    orderMatters: true,
    hints: ['An aggregate with OVER (ORDER BY …) becomes cumulative.', 'Add a tie-breaker so equal dates are ordered deterministically.'],
    explanationMd: 'With `ORDER BY` inside `OVER`, the default frame runs from the first row to the current row, which produces a running sum.',
    targetMinutes: 5, verification: 'verified-sqlite',
  },
  {
    id: 'sql-hired-in-2020', title: 'Hired during 2020', topicIds: ['sql.date-string-functions'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Return the `name` of employees hired at any time in calendar year **2020** (dates are stored as `YYYY-MM-DD`).',
    referenceSql: `SELECT name FROM employees
WHERE hire_date >= '2020-01-01' AND hire_date < '2021-01-01';`,
    orderMatters: false,
    hints: ['Use a half-open range: inclusive start, exclusive end.', 'Check both the very first and the very last day of the year.'],
    explanationMd: 'A half-open range `[2020-01-01, 2021-01-01)` includes both boundary days and stays correct even if the column later stores times. It is also index-friendly (sargable), unlike wrapping the column in a function.',
    wrongApproaches: [{ sql: `SELECT name FROM employees WHERE hire_date > '2020-01-01' AND hire_date < '2020-12-31';`, whyMd: 'Strict comparisons drop people hired on 1 January and 31 December.' }],
    targetMinutes: 3, verification: 'verified-sqlite',
  },
  {
    id: 'sql-empty-departments', title: 'Departments with no employees', topicIds: ['sql.subqueries', 'sql.null-handling'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Return the `name` of every department that has **no employees**.',
    referenceSql: `SELECT d.name
FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id);`,
    orderMatters: false,
    hints: ['This is an anti-join: rows in A with no match in B.', 'Be careful: employees.dept_id contains NULLs. How does NOT IN behave when the list contains NULL?'],
    explanationMd: '`x NOT IN (list)` is UNKNOWN when the list contains NULL, so it filters out every row. `NOT EXISTS` (or a LEFT JOIN … IS NULL) is NULL-safe.',
    wrongApproaches: [{ sql: 'SELECT name FROM departments WHERE id NOT IN (SELECT dept_id FROM employees);', whyMd: 'Zoya has a NULL dept_id, so the NOT IN list contains NULL and the predicate is never TRUE: the result is empty.' }],
    targetMinutes: 4, verification: 'verified-sqlite',
  },
  {
    id: 'sql-above-dept-average', title: 'Above their department average', topicIds: ['sql.subqueries'], difficulty: 'medium', datasetId: 'company',
    promptMd: 'Return the `name` and `salary` of employees earning **more than the average salary of their own department**.',
    referenceSql: `SELECT e.name, e.salary
FROM employees e
WHERE e.salary > (
  SELECT AVG(e2.salary) FROM employees e2 WHERE e2.dept_id = e.dept_id
);`,
    orderMatters: false,
    hints: ['The comparison value changes per row: it depends on that row\'s department.', 'A correlated subquery can refer to the outer row.'],
    explanationMd: 'The subquery re-runs for each outer row with its `dept_id`. Employees with NULL dept_id get a NULL average, so the comparison is UNKNOWN and they are excluded.',
    targetMinutes: 5, verification: 'verified-sqlite',
  },
  {
    id: 'sql-salary-bands', title: 'Salary bands', topicIds: ['sql.case-conditional-agg'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Classify salaries into bands, `high` (≥ 150000), `mid` (100000–149999) and `low` (< 100000), and return each `band` with its `employees` count. Bands with no employees may be omitted.',
    referenceSql: `SELECT CASE
         WHEN salary >= 150000 THEN 'high'
         WHEN salary >= 100000 THEN 'mid'
         ELSE 'low'
       END AS band,
       COUNT(*) AS employees
FROM employees
GROUP BY band;`,
    orderMatters: false,
    hints: ['CASE evaluates conditions top to bottom and stops at the first match.', 'You can group by the CASE expression.'],
    explanationMd: 'Because CASE stops at the first true branch, the `mid` test only needs `>= 100000`. In MySQL you can also `GROUP BY band`; in strict SQL you would repeat the expression.',
    targetMinutes: 4, verification: 'verified-sqlite',
  },
  {
    id: 'sql-hiring-pivot', title: 'Hiring before and after 2020, per department', topicIds: ['sql.case-conditional-agg', 'sql.joins'], difficulty: 'medium', datasetId: 'company',
    promptMd: 'For **every** department, return `name`, `before_2020` (employees hired before 2020-01-01) and `from_2020` (hired on or after). Empty departments show 0 and 0.',
    referenceSql: `SELECT d.name,
       SUM(CASE WHEN e.hire_date <  '2020-01-01' THEN 1 ELSE 0 END) AS before_2020,
       SUM(CASE WHEN e.hire_date >= '2020-01-01' THEN 1 ELSE 0 END) AS from_2020
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
GROUP BY d.id, d.name;`,
    orderMatters: false,
    hints: ['Conditional aggregation: SUM(CASE WHEN … THEN 1 ELSE 0 END).', 'Keep empty departments with a LEFT JOIN, and make sure their counts are 0, not NULL.'],
    explanationMd: 'For an empty department the joined hire_date is NULL, both comparisons are UNKNOWN, CASE falls to `ELSE 0`, and the sums are 0.',
    wrongApproaches: [{ sql: `SELECT d.name, SUM(CASE WHEN e.hire_date < '2020-01-01' THEN 1 END) AS before_2020, SUM(CASE WHEN e.hire_date >= '2020-01-01' THEN 1 END) AS from_2020 FROM departments d LEFT JOIN employees e ON e.dept_id = d.id GROUP BY d.id, d.name;`, whyMd: 'Without ELSE 0, groups with no matching rows sum to NULL instead of 0.' }],
    targetMinutes: 6, verification: 'verified-sqlite',
  },
  {
    id: 'sql-reporting-chain', title: 'Everyone under employee 1', topicIds: ['sql.cte'], difficulty: 'hard', datasetId: 'company',
    promptMd: 'Return the `name` and `level` of every direct or indirect report of the employee with **id = 1**. Direct reports are level 1, their reports level 2, and so on. Do not include employee 1.',
    referenceSql: `WITH RECURSIVE chain(id, name, level) AS (
  SELECT id, name, 0 FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.name, c.level + 1
  FROM employees e
  JOIN chain c ON e.manager_id = c.id
)
SELECT name, level FROM chain WHERE level > 0;`,
    orderMatters: false,
    hints: ['The depth is unknown, so a fixed number of self-joins will not work.', 'A recursive CTE has an anchor (the starting row) and a recursive step that joins back to the CTE.'],
    explanationMd: 'The anchor selects employee 1 at level 0; each recursive step adds employees whose manager is already in the chain, at level + 1. Recursion stops when a step adds no rows.',
    targetMinutes: 10, verification: 'verified-sqlite',
  },

  // ---------- shop ----------
  {
    id: 'sql-unknown-or-delhi', title: 'Customers in Delhi or with no city', topicIds: ['sql.null-handling', 'sql.select-basics'], difficulty: 'easy', datasetId: 'shop',
    promptMd: 'Return the `name` of customers who live in **Delhi** or whose city is **not recorded**.',
    referenceSql: `SELECT name FROM customers WHERE city = 'Delhi' OR city IS NULL;`,
    orderMatters: false,
    hints: ['NULL is not equal (or unequal) to anything.', 'Handle the missing value explicitly.'],
    explanationMd: '`city <> \'Pune\'` style filters silently drop NULL cities, because comparisons with NULL are UNKNOWN. Test `IS NULL` explicitly.',
    wrongApproaches: [{ sql: `SELECT name FROM customers WHERE city NOT IN ('Pune', 'Mumbai');`, whyMd: 'NOT IN on a NULL city is UNKNOWN, so customers without a city are dropped (and other cities would sneak in).' }],
    targetMinutes: 2, verification: 'verified-sqlite',
  },
  {
    id: 'sql-order-totals', title: 'Value of each shipped order', topicIds: ['sql.joins', 'sql.aggregation'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'For each **shipped** order, return `order_id` and `total` = Σ(qty × price) over its items.',
    referenceSql: `SELECT o.id AS order_id, SUM(oi.qty * p.price) AS total
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'shipped'
GROUP BY o.id;`,
    orderMatters: false,
    hints: ['You need three tables: orders, order_items and products.', 'Compute qty × price per item row, then sum per order.'],
    explanationMd: 'Join down to item level, compute the line value, and aggregate back up to the order with GROUP BY.',
    targetMinutes: 5, verification: 'verified-sqlite',
  },
  {
    id: 'sql-customer-spend', title: 'Total spend for every customer', topicIds: ['sql.joins', 'sql.null-handling'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'For **every** customer, return `name` and `spend`: the total value (qty × price) of their **shipped** orders. Customers with no shipped orders show 0.',
    referenceSql: `SELECT c.name,
       COALESCE(SUM(CASE WHEN o.status = 'shipped' THEN oi.qty * p.price END), 0) AS spend
FROM customers c
LEFT JOIN orders o       ON o.customer_id = c.id
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p     ON p.id = oi.product_id
GROUP BY c.id, c.name;`,
    orderMatters: false,
    hints: ['Keep every customer: LEFT JOIN all the way down.', 'A WHERE on the right-hand table turns a LEFT JOIN back into an inner join. Where else can the status condition go?'],
    explanationMd: 'Putting `o.status = \'shipped\'` in WHERE removes the NULL-padded rows of customers without shipped orders. Moving the condition into a CASE inside SUM (or into the ON clause) keeps them, and COALESCE turns a NULL sum into 0.',
    wrongApproaches: [{ sql: `SELECT c.name, COALESCE(SUM(oi.qty * p.price), 0) AS spend FROM customers c LEFT JOIN orders o ON o.customer_id = c.id LEFT JOIN order_items oi ON oi.order_id = o.id LEFT JOIN products p ON p.id = oi.product_id WHERE o.status = 'shipped' GROUP BY c.id, c.name;`, whyMd: 'The WHERE filter discards customers whose orders are not shipped (or who have none), so they vanish instead of showing 0.' }],
    targetMinutes: 8, verification: 'verified-sqlite',
  },
  {
    id: 'sql-never-ordered', title: 'Products never ordered', topicIds: ['sql.joins'], difficulty: 'easy', datasetId: 'shop',
    promptMd: 'Return the `name` of products that do not appear in any order item.',
    referenceSql: `SELECT p.name
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE oi.product_id IS NULL;`,
    orderMatters: false,
    hints: ['Anti-join: LEFT JOIN, then keep the rows where the right side is missing.'],
    explanationMd: 'After a LEFT JOIN, unmatched products have NULLs in every order_items column; filtering on `IS NULL` keeps exactly those. NOT EXISTS is equivalent.',
    targetMinutes: 3, similarTo: [LC('customers-who-never-order', 'Customers Who Never Order')], verification: 'verified-sqlite',
  },
  {
    id: 'sql-category-revenue', title: 'Revenue per category', topicIds: ['sql.aggregation', 'sql.case-conditional-agg'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'For **every** product category, return `category` and `revenue` from **shipped** orders (qty × price). Categories with no shipped sales show 0.',
    referenceSql: `SELECT p.category,
       COALESCE(SUM(CASE WHEN o.status = 'shipped' THEN oi.qty * p.price END), 0) AS revenue
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o       ON o.id = oi.order_id
GROUP BY p.category;`,
    orderMatters: false,
    hints: ['Start from products so every category appears.', 'Count only shipped orders without dropping categories.'],
    explanationMd: 'Same idea as customer spend: start from the side that must be complete, LEFT JOIN, and move the status filter into conditional aggregation.',
    targetMinutes: 7, verification: 'verified-sqlite',
  },
  {
    id: 'sql-repeat-customers', title: 'Customers with at least two orders', topicIds: ['sql.aggregation', 'sql.joins'], difficulty: 'easy', datasetId: 'shop',
    promptMd: 'Return the `name` of customers who placed **at least 2 orders that were not cancelled**.',
    referenceSql: `SELECT c.name
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status <> 'cancelled'
GROUP BY c.id, c.name
HAVING COUNT(*) >= 2;`,
    orderMatters: false,
    hints: ['Count orders, not order items.', 'Which table should you join, and which should you leave out?'],
    explanationMd: 'Joining order_items multiplies each order by its number of items, which inflates COUNT(*). Count at the order grain (or use COUNT(DISTINCT o.id)).',
    wrongApproaches: [{ sql: `SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'cancelled' GROUP BY c.id, c.name HAVING COUNT(*) >= 2;`, whyMd: 'Row multiplication: one order with two items counts as 2, so Diya (one non-cancelled order with two items) is wrongly included.' }],
    targetMinutes: 4, verification: 'verified-sqlite',
  },
  {
    id: 'sql-first-order', title: "Each customer's first order", topicIds: ['sql.window-functions', 'sql.patterns'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'For each customer who has ordered, return `name`, `order_id` and `order_date` of their **earliest** order (use the lower order id if two orders share a date).',
    referenceSql: `SELECT name, order_id, order_date
FROM (
  SELECT c.name, o.id AS order_id, o.order_date,
         ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.order_date, o.id) AS rn
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
) t
WHERE rn = 1;`,
    orderMatters: false,
    hints: ['"First per group" means ranking within each customer.', 'Here exactly one row per customer is wanted, so ROW_NUMBER with a tie-breaker fits.'],
    explanationMd: 'Partition by customer, order by date then id, and keep row number 1. Here we want exactly one row, so ROW_NUMBER is correct (contrast with the ties exercise).',
    targetMinutes: 6, verification: 'verified-sqlite',
  },
  {
    id: 'sql-same-day-customers', title: 'Different customers ordering on the same day', topicIds: ['sql.self-joins'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'Return each `order_date` together with `customer_a` and `customer_b`: pairs of **different** customers who both placed an order that day. List each pair once (customer_a has the smaller customer id).',
    referenceSql: `SELECT DISTINCT o1.order_date, c1.name AS customer_a, c2.name AS customer_b
FROM orders o1
JOIN orders o2 ON o1.order_date = o2.order_date AND o1.customer_id < o2.customer_id
JOIN customers c1 ON c1.id = o1.customer_id
JOIN customers c2 ON c2.id = o2.customer_id;`,
    orderMatters: false,
    hints: ['Self-join orders on the date.', 'How do you avoid pairing a customer with themselves and listing (A, B) and (B, A)?'],
    explanationMd: 'The condition `o1.customer_id < o2.customer_id` removes self-pairs and mirrored duplicates in one go. DISTINCT handles customers with several orders on the same day.',
    wrongApproaches: [{ sql: 'SELECT o1.order_date, c1.name AS customer_a, c2.name AS customer_b FROM orders o1 JOIN orders o2 ON o1.order_date = o2.order_date AND o1.customer_id <> o2.customer_id JOIN customers c1 ON c1.id = o1.customer_id JOIN customers c2 ON c2.id = o2.customer_id;', whyMd: 'Using <> lists every pair twice: (A, B) and (B, A).' }],
    targetMinutes: 6, verification: 'verified-sqlite',
  },
  {
    id: 'sql-shipped-and-cancelled', title: 'Customers with both shipped and cancelled orders', topicIds: ['sql.set-operations', 'sql.subqueries'], difficulty: 'easy', datasetId: 'shop',
    promptMd: 'Return the `name` of customers who have **at least one shipped and at least one cancelled** order.',
    referenceSql: `SELECT name FROM customers
WHERE id IN (
  SELECT customer_id FROM orders WHERE status = 'shipped'
  INTERSECT
  SELECT customer_id FROM orders WHERE status = 'cancelled'
);`,
    orderMatters: false,
    hints: ['Find the set of customers for each condition, then take the common part.', 'A single WHERE status = \'shipped\' AND status = \'cancelled\' can never be true for one row.'],
    explanationMd: 'INTERSECT returns customer ids present in both sets (MySQL supports it from 8.0.31; otherwise use two EXISTS clauses or GROUP BY with conditional counts).',
    wrongApproaches: [{ sql: `SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'shipped' AND o.status = 'cancelled';`, whyMd: 'A single row cannot have two statuses, so this always returns nothing.' }],
    targetMinutes: 4, verification: 'verified-sqlite',
  },
  {
    id: 'sql-monthly-orders', title: 'Orders per month', topicIds: ['sql.date-string-functions', 'sql.aggregation'], difficulty: 'easy', datasetId: 'shop',
    promptMd: 'Return `month` (formatted `YYYY-MM`) and `orders` (count of **non-cancelled** orders), ordered by month.',
    referenceSql: `SELECT substr(order_date, 1, 7) AS month, COUNT(*) AS orders
FROM orders
WHERE status <> 'cancelled'
GROUP BY month
ORDER BY month;`,
    referenceMysql: `SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, COUNT(*) AS orders
FROM orders
WHERE status <> 'cancelled'
GROUP BY month
ORDER BY month;`,
    orderMatters: true,
    hints: ['Derive the month from the date, then group by it.', 'In SQLite, strftime(\'%Y-%m\', d) or substr(d, 1, 7); in MySQL, DATE_FORMAT(d, \'%Y-%m\').'],
    explanationMd: 'Grouping by a derived month key buckets dates. Date functions differ between engines, so the MySQL version uses DATE_FORMAT.',
    targetMinutes: 4, verification: 'verified-sqlite',
  },

  // ---------- events ----------
  {
    id: 'sql-daily-active-users', title: 'Daily active users', topicIds: ['sql.aggregation'], difficulty: 'easy', datasetId: 'events',
    promptMd: 'Return `login_date` and `dau`, the number of **distinct** users who logged in that day, ordered by date.',
    referenceSql: `SELECT login_date, COUNT(DISTINCT user_id) AS dau
FROM logins
GROUP BY login_date
ORDER BY login_date;`,
    orderMatters: true,
    hints: ['A user can log in several times a day.'],
    explanationMd: '`COUNT(DISTINCT user_id)` counts each user once per day; `COUNT(*)` counts logins.',
    wrongApproaches: [{ sql: 'SELECT login_date, COUNT(user_id) AS dau FROM logins GROUP BY login_date ORDER BY login_date;', whyMd: 'Repeated logins on 2024-03-02 count user 1 twice.' }],
    targetMinutes: 3, verification: 'verified-sqlite',
  },
  {
    id: 'sql-never-logged-in', title: 'Users who never logged in', topicIds: ['sql.joins', 'sql.subqueries'], difficulty: 'easy', datasetId: 'events',
    promptMd: 'Return the `name` of users with **no** login records.',
    referenceSql: `SELECT u.name FROM users u
WHERE NOT EXISTS (SELECT 1 FROM logins l WHERE l.user_id = u.id);`,
    orderMatters: false,
    hints: ['Anti-join.'],
    explanationMd: 'NOT EXISTS (or LEFT JOIN … WHERE l.user_id IS NULL) finds users with no matching rows.',
    targetMinutes: 2, verification: 'verified-sqlite',
  },
  {
    id: 'sql-duplicate-logins', title: 'Duplicate login records', topicIds: ['sql.patterns', 'sql.aggregation'], difficulty: 'easy', datasetId: 'events',
    promptMd: 'Find duplicate rows: return `user_id`, `login_date` and `times` for every (user, date) pair that appears **more than once**.',
    referenceSql: `SELECT user_id, login_date, COUNT(*) AS times
FROM logins
GROUP BY user_id, login_date
HAVING COUNT(*) > 1;`,
    orderMatters: false,
    hints: ['Group by all the columns that define "the same row".', 'Filter groups by their size.'],
    explanationMd: 'GROUP BY the duplicate key and HAVING COUNT(*) > 1 is the standard duplicate-detection pattern.',
    targetMinutes: 3, similarTo: [LC('duplicate-emails', 'Duplicate Emails')], verification: 'verified-sqlite',
  },
  {
    id: 'sql-three-day-streak', title: 'Logged in on 3 consecutive days', topicIds: ['sql.patterns', 'sql.window-functions'], difficulty: 'hard', datasetId: 'events',
    promptMd: 'Return the `name` of users who logged in on **at least 3 consecutive calendar days** at some point. Watch out for repeated logins on the same day and for month boundaries.',
    referenceSql: `WITH d AS (
  SELECT DISTINCT user_id, login_date FROM logins
),
g AS (
  SELECT user_id, login_date,
         julianday(login_date) - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS grp
  FROM d
)
SELECT DISTINCT u.name
FROM g
JOIN users u ON u.id = g.user_id
GROUP BY g.user_id, g.grp, u.name
HAVING COUNT(*) >= 3;`,
    referenceMysql: `WITH d AS (
  SELECT DISTINCT user_id, login_date FROM logins
),
g AS (
  SELECT user_id, login_date,
         DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) DAY) AS grp
  FROM d
)
SELECT DISTINCT u.name
FROM g
JOIN users u ON u.id = g.user_id
GROUP BY g.user_id, g.grp, u.name
HAVING COUNT(*) >= 3;`,
    orderMatters: false,
    hints: ['Remove same-day duplicates first.', 'Gaps and islands: within a run of consecutive dates, (date − row number) is constant.', 'Group by that constant and count the run length.'],
    explanationMd: 'After de-duplicating, number each user\'s dates 1, 2, 3, … Subtracting the row number from the date maps every consecutive run to the same value (the "island" key). Counting rows per island gives the streak length. Date arithmetic (not string arithmetic) makes month and leap-year boundaries work.',
    wrongApproaches: [{ sql: `WITH x AS (SELECT user_id, login_date, LAG(login_date, 2) OVER (PARTITION BY user_id ORDER BY login_date) AS p2 FROM logins) SELECT DISTINCT u.name FROM x JOIN users u ON u.id = x.user_id WHERE julianday(login_date) - julianday(p2) = 2;`, whyMd: 'Without de-duplicating first, a repeated login shifts LAG by one row, so real streaks are missed.' }],
    targetMinutes: 12, similarTo: [LC('consecutive-numbers', 'Consecutive Numbers')], verification: 'verified-sqlite',
  },
  {
    id: 'sql-longest-streak', title: 'Longest login streak per user', topicIds: ['sql.patterns', 'sql.window-functions', 'sql.cte'], difficulty: 'hard', datasetId: 'events',
    promptMd: 'For every user who logged in at least once, return `name` and `longest_streak`: the length of their longest run of consecutive login days.',
    referenceSql: `WITH d AS (SELECT DISTINCT user_id, login_date FROM logins),
g AS (
  SELECT user_id,
         julianday(login_date) - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) AS grp
  FROM d
),
runs AS (SELECT user_id, COUNT(*) AS len FROM g GROUP BY user_id, grp)
SELECT u.name, MAX(r.len) AS longest_streak
FROM runs r
JOIN users u ON u.id = r.user_id
GROUP BY u.id, u.name;`,
    orderMatters: false,
    hints: ['Reuse the islands technique from the 3-day streak exercise.', 'Compute every run length, then take the maximum per user.'],
    explanationMd: 'Two levels of aggregation: first count the days in each island (user, grp), then take MAX over islands per user. CTEs keep each step readable.',
    targetMinutes: 12, verification: 'verified-sqlite',
  },
  {
    id: 'sql-next-day-retention', title: 'Next-day retention', topicIds: ['sql.patterns', 'sql.date-string-functions'], difficulty: 'hard', datasetId: 'events',
    promptMd: 'For every user who has logged in, return `name`, `first_login` (their earliest login date) and `returned` = 1 if they also logged in on the **day after** their first login, else 0.',
    referenceSql: `WITH f AS (
  SELECT user_id, MIN(login_date) AS first_login FROM logins GROUP BY user_id
)
SELECT u.name, f.first_login,
       CASE WHEN EXISTS (
         SELECT 1 FROM logins l
         WHERE l.user_id = f.user_id AND l.login_date = date(f.first_login, '+1 day')
       ) THEN 1 ELSE 0 END AS returned
FROM f
JOIN users u ON u.id = f.user_id;`,
    referenceMysql: `WITH f AS (
  SELECT user_id, MIN(login_date) AS first_login FROM logins GROUP BY user_id
)
SELECT u.name, f.first_login,
       CASE WHEN EXISTS (
         SELECT 1 FROM logins l
         WHERE l.user_id = f.user_id AND l.login_date = DATE_ADD(f.first_login, INTERVAL 1 DAY)
       ) THEN 1 ELSE 0 END AS returned
FROM f
JOIN users u ON u.id = f.user_id;`,
    orderMatters: false,
    hints: ['First find each user\'s first login date.', 'Then check for a login exactly one day later. Use date arithmetic, not string manipulation.'],
    explanationMd: 'A CTE computes the first login; EXISTS checks for the next day. SQLite uses `date(d, \'+1 day\')`, MySQL `DATE_ADD(d, INTERVAL 1 DAY)`. Both handle month ends.',
    targetMinutes: 10, similarTo: [LC('game-play-analysis-iv', 'Game Play Analysis IV')], verification: 'verified-sqlite',
  },
  {
    id: 'sql-active-users-by-country', title: 'Active users per country', topicIds: ['sql.joins', 'sql.aggregation'], difficulty: 'easy', datasetId: 'events',
    promptMd: 'For **every** country that has users, return `country` and `active_users`: the number of distinct users from that country with at least one login (0 if none).',
    referenceSql: `SELECT u.country, COUNT(DISTINCT l.user_id) AS active_users
FROM users u
LEFT JOIN logins l ON l.user_id = u.id
GROUP BY u.country;`,
    orderMatters: false,
    hints: ['Keep countries whose users never logged in.', 'Users log in many times: count users, not logins.'],
    explanationMd: '`COUNT(DISTINCT l.user_id)` ignores NULLs from unmatched users (giving 0) and duplicates from repeated logins.',
    targetMinutes: 4, verification: 'verified-sqlite',
  },
];

export const exercises: SqlExercise[] = [...batch1, ...exercises2];
