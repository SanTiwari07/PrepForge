import type { SqlExercise } from '../schema';

// SQL exercises, batch 3 (46 exercises, bringing the total to 120). Like the earlier batches,
// expected outputs are never hand-written: tests/sql-exercises.test.ts runs every referenceSql on
// the visible and hidden datasets and proves that every listed wrong approach fails somewhere.
// referenceMysql is given where MySQL 8.0 syntax differs from SQLite.

const v = 'verified-sqlite' as const;

export const exercises3: SqlExercise[] = [
  // ---------- SELECT basics ----------
  {
    id: 'sql-vowel-names', title: 'Names that start with a vowel', topicIds: ['sql.select-basics'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Return the `name` of every employee whose name **starts with a vowel** (A, E, I, O or U), sorted alphabetically.',
    referenceSql: `SELECT name FROM employees
WHERE UPPER(SUBSTR(name, 1, 1)) IN ('A', 'E', 'I', 'O', 'U')
ORDER BY name;`,
    orderMatters: true,
    hints: ['You only care about the first character. Which function extracts it?', 'Compare it with a list of vowels using IN.'],
    explanationMd: '`SUBSTR(name, 1, 1)` is the first letter; `UPPER` makes the test independent of case. `LIKE \'A%\' OR LIKE \'E%\' …` also works, `LIKE \'%a%\'` does not: it matches any name that merely contains an "a".',
    wrongApproaches: [{ sql: `SELECT name FROM employees WHERE name LIKE '%a%' ORDER BY name;`, whyMd: 'Matches names that contain an "a" anywhere (Meera, Nina, Priya …), not names that start with a vowel.' }],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-top-distinct-salaries', title: 'Three highest distinct salaries', topicIds: ['sql.select-basics'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Return the **three highest distinct salaries**, highest first (one column, `salary`). Two people earning the same amount count once.',
    referenceSql: `SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 3;`,
    orderMatters: true,
    hints: ['LIMIT 3 on its own would count duplicates as separate rows.', 'Remove duplicates before limiting.'],
    explanationMd: '`DISTINCT` is applied before `ORDER BY … LIMIT`, so ties collapse into one value. Without it, 180000 would appear twice and push 160000 out of the top three.',
    wrongApproaches: [{ sql: `SELECT salary FROM employees ORDER BY salary DESC LIMIT 3;`, whyMd: 'Equal salaries occupy two of the three rows, so you get fewer than three distinct values.' }],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-salary-page-two', title: 'Page two of the salary list', topicIds: ['sql.select-basics'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'A report shows employees **3 per page**, ordered by `salary` descending and, for equal salaries, by `id`. Return `name` and `salary` for **page 2**.',
    referenceSql: `SELECT name, salary FROM employees
ORDER BY salary DESC, id
LIMIT 3 OFFSET 3;`,
    orderMatters: true,
    hints: ['Page 2 skips the rows of page 1: how many?', 'Without a tie-break the order of equal salaries is not defined, so pages could overlap.'],
    explanationMd: '`LIMIT 3 OFFSET 3` skips the first page and returns the next three. Paging needs a deterministic order: `id` breaks salary ties so a row never appears on two pages.',
    wrongApproaches: [{ sql: `SELECT name, salary FROM employees ORDER BY salary DESC, id LIMIT 3 OFFSET 2;`, whyMd: 'Off by one: the last row of page 1 is repeated on page 2.' }],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-salary-range', title: 'Salaries in a range', topicIds: ['sql.select-basics'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Return the `name` of employees earning **between 90000 and 140000, boundaries included**.',
    referenceSql: `SELECT name FROM employees WHERE salary BETWEEN 90000 AND 140000;`,
    orderMatters: false,
    hints: ['Is BETWEEN inclusive or exclusive?', 'Check Omar (90000) and Tara (140000).'],
    explanationMd: '`BETWEEN a AND b` is inclusive on both ends, equivalent to `salary >= a AND salary <= b`.',
    wrongApproaches: [{ sql: `SELECT name FROM employees WHERE salary > 90000 AND salary < 140000;`, whyMd: 'Strict comparisons drop people earning exactly 90000 or 140000.' }],
    targetMinutes: 2, verification: v,
  },

  // ---------- NULL handling ----------
  {
    id: 'sql-city-not-pune', title: 'Customers outside Pune (including unknown city)', topicIds: ['sql.null-handling'], difficulty: 'easy', datasetId: 'shop',
    promptMd: 'Return the `name` of every customer who is **not known to live in Pune**. Customers with no recorded city (NULL) must be included.',
    referenceSql: `SELECT name FROM customers WHERE city IS NULL OR city <> 'Pune';`,
    orderMatters: false,
    hints: ['What does `city <> \'Pune\'` return when city is NULL?', 'You must handle the NULL case explicitly.'],
    explanationMd: 'For a NULL city, `city <> \'Pune\'` is UNKNOWN, and WHERE keeps only TRUE rows, so the customer silently disappears. Add `OR city IS NULL` (or use `COALESCE(city, \'\') <> \'Pune\'`).',
    wrongApproaches: [{ sql: `SELECT name FROM customers WHERE city <> 'Pune';`, whyMd: 'Rows with a NULL city evaluate to UNKNOWN and are dropped (Ishaan disappears).' }],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-unrated-completed', title: 'Completed trips without a rating', topicIds: ['sql.null-handling'], difficulty: 'easy', datasetId: 'rides',
    promptMd: 'Return the `id` of every **completed** trip that has **no rating** yet.',
    referenceSql: `SELECT id FROM trips WHERE status = 'completed' AND rating IS NULL;`,
    orderMatters: false,
    hints: ['A missing rating is NULL.', 'Cancelled trips also have NULL ratings: filter by status too.'],
    explanationMd: 'Use `IS NULL`; `rating = NULL` never matches. Cancelled and unmatched trips are NULL as well, so the status filter is part of the question.',
    wrongApproaches: [
      { sql: `SELECT id FROM trips WHERE rating IS NULL;`, whyMd: 'Includes cancelled and no-driver trips whose rating is NULL by design.' },
      { sql: `SELECT id FROM trips WHERE status = 'completed' AND rating = NULL;`, whyMd: '`= NULL` is never TRUE, so the result is empty.' },
    ],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-uncategorised-spend', title: 'Spend by category with a label for NULL', topicIds: ['sql.null-handling', 'sql.aggregation'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'Considering only **debits** (negative amounts), return each `category` and the total `spent` (as a positive number). Transactions with no category must be grouped under the label **`uncategorised`**.',
    referenceSql: `SELECT COALESCE(category, 'uncategorised') AS category, SUM(-amount) AS spent
FROM txns
WHERE amount < 0
GROUP BY COALESCE(category, 'uncategorised');`,
    orderMatters: false,
    hints: ['Which function replaces NULL with a label?', 'Group by the same expression you select.'],
    explanationMd: '`COALESCE(category, \'uncategorised\')` turns the NULL group into a readable label. NULLs form a single group in GROUP BY, but returning a bare NULL for it is confusing in reports.',
    wrongApproaches: [{ sql: `SELECT category, SUM(-amount) AS spent FROM txns WHERE amount < 0 GROUP BY category;`, whyMd: 'The uncategorised group is returned with a NULL label instead of "uncategorised".' }],
    targetMinutes: 5, verification: v,
  },

  // ---------- Joins ----------
  {
    id: 'sql-products-never-sold', title: 'Products that were never ordered', topicIds: ['sql.joins'], difficulty: 'easy', datasetId: 'shop',
    promptMd: 'Return the `name` of every product that does **not appear in any order item**.',
    referenceSql: `SELECT p.name
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE oi.product_id IS NULL;`,
    orderMatters: false,
    hints: ['Which join keeps products that have no match?', 'After a LEFT JOIN, unmatched products have NULL in the order_items columns.'],
    explanationMd: 'An anti-join: LEFT JOIN and keep the rows where the right side is NULL. (`NOT EXISTS` is equivalent and also NULL-safe; `NOT IN` breaks if the subquery returns a NULL.)',
    wrongApproaches: [{ sql: `SELECT p.name FROM products p JOIN order_items oi ON oi.product_id = p.id WHERE oi.product_id IS NULL;`, whyMd: 'An INNER JOIN has no unmatched rows, so the IS NULL test can never be true.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-order-lines', title: 'Order lines with totals', topicIds: ['sql.joins'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'For every order item return `order_id`, the product `name`, and `line_total` (`qty × price`). Sort by `order_id`, then product `name`.',
    referenceSql: `SELECT oi.order_id, p.name, oi.qty * p.price AS line_total
FROM order_items oi
JOIN products p ON p.id = oi.product_id
ORDER BY oi.order_id, p.name;`,
    orderMatters: true,
    hints: ['order_items stores the quantity, products stores the price: join them.', 'The line total multiplies two columns from different tables.'],
    explanationMd: 'Join on the foreign key `product_id = products.id`, then compute the total in the SELECT list. Forgetting the join condition would produce a cross join (every item with every product).',
    wrongApproaches: [{ sql: `SELECT oi.order_id, p.name, p.price AS line_total FROM order_items oi JOIN products p ON p.id = oi.product_id ORDER BY oi.order_id, p.name;`, whyMd: 'Reports the unit price instead of qty × price.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-shipped-per-customer', title: 'Shipped orders per customer, zeros included', topicIds: ['sql.joins', 'sql.aggregation'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'For **every** customer return `name` and `shipped_orders`: the number of their orders with status `shipped` (0 if none).',
    referenceSql: `SELECT c.name, COUNT(o.id) AS shipped_orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'shipped'
GROUP BY c.id, c.name;`,
    orderMatters: false,
    hints: ['Customers without shipped orders must still appear.', 'Where should the status condition live so it does not remove the NULL-padded rows?'],
    explanationMd: 'With a LEFT JOIN, a condition on the right-hand table belongs in `ON`. Moving `status = \'shipped\'` into `WHERE` turns the outer join into an inner join, because the NULL-padded rows fail the test.',
    wrongApproaches: [{ sql: `SELECT c.name, COUNT(o.id) AS shipped_orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'shipped' GROUP BY c.id, c.name;`, whyMd: 'The WHERE clause removes customers with no shipped order instead of showing 0.' }],
    targetMinutes: 5, verification: v,
  },
  {
    id: 'sql-city-pair-counts', title: 'Rider–driver combinations per city', topicIds: ['sql.joins'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'For each `city`, return the number of possible **(rider, driver) pairs** where both live in that city. Return `city` and `combos`.',
    referenceSql: `SELECT r.city, COUNT(*) AS combos
FROM riders r
JOIN drivers d ON d.city = r.city
GROUP BY r.city;`,
    orderMatters: false,
    hints: ['Which condition links a rider to a driver?', 'Without a join condition you get every rider with every driver.'],
    explanationMd: 'Joining on `city` multiplies riders by drivers inside each city only. A cross join would pair every rider with every driver in all cities. Join row multiplication is exactly what makes this count.',
    wrongApproaches: [{ sql: `SELECT r.city, COUNT(*) AS combos FROM riders r CROSS JOIN drivers d GROUP BY r.city;`, whyMd: 'A cross join pairs riders with drivers of every city, inflating each count.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-rider-driver-pairs', title: 'Who rode with whom', topicIds: ['sql.joins', 'sql.aggregation'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'Return each **rider name**, **driver name** and `trips`: the number of **completed** trips they had together. Only pairs with at least one completed trip.',
    referenceSql: `SELECT ri.name AS rider, dr.name AS driver, COUNT(*) AS trips
FROM trips t
JOIN riders ri ON ri.id = t.rider_id
JOIN drivers dr ON dr.id = t.driver_id
WHERE t.status = 'completed'
GROUP BY ri.id, ri.name, dr.id, dr.name;`,
    orderMatters: false,
    hints: ['Trips link riders and drivers; join both dimension tables.', 'Filter to completed trips before counting.'],
    explanationMd: 'Two joins to the dimension tables, a status filter, and a GROUP BY on the pair. Cancelled trips between the same people must not be counted, and trips with no driver drop out of the inner join anyway.',
    wrongApproaches: [{ sql: `SELECT ri.name AS rider, dr.name AS driver, COUNT(*) AS trips FROM trips t JOIN riders ri ON ri.id = t.rider_id JOIN drivers dr ON dr.id = t.driver_id GROUP BY ri.id, ri.name, dr.id, dr.name;`, whyMd: 'Counts cancelled trips as well.' }],
    targetMinutes: 5, verification: v,
  },

  // ---------- Aggregation ----------
  {
    id: 'sql-city-fare-summary', title: 'Fare summary per city', topicIds: ['sql.aggregation'], difficulty: 'easy', datasetId: 'rides',
    promptMd: 'For each `city`, return the number of **completed** trips (`trips`), the total `fare` (`total_fare`) and the average fare rounded to 1 decimal (`avg_fare`). Only cities with at least one completed trip.',
    referenceSql: `SELECT city, COUNT(*) AS trips, SUM(fare) AS total_fare, ROUND(AVG(fare), 1) AS avg_fare
FROM trips
WHERE status = 'completed'
GROUP BY city;`,
    orderMatters: false,
    hints: ['Filter before grouping with WHERE.', 'AVG, SUM and COUNT all see only the filtered rows.'],
    explanationMd: 'The status filter in WHERE runs before grouping, so every aggregate sees completed trips only. Counting all trips would include cancelled ones whose fare is NULL.',
    wrongApproaches: [{ sql: `SELECT city, COUNT(*) AS trips, SUM(fare) AS total_fare, ROUND(AVG(fare), 1) AS avg_fare FROM trips GROUP BY city;`, whyMd: '`COUNT(*)` includes cancelled and unmatched trips.' }],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-category-buyers', title: 'Distinct buyers per category', topicIds: ['sql.aggregation', 'sql.joins'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'For each product `category`, return how many **different customers** bought from it, ignoring cancelled orders. Return `category` and `buyers`.',
    referenceSql: `SELECT p.category, COUNT(DISTINCT o.customer_id) AS buyers
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
JOIN products p ON p.id = oi.product_id
GROUP BY p.category;`,
    orderMatters: false,
    hints: ['One customer can buy several products of the same category, in several orders.', 'What should you count: rows or distinct people?'],
    explanationMd: '`COUNT(DISTINCT customer_id)` counts people once per category no matter how many items or orders they bought. A plain `COUNT(*)` counts order items.',
    wrongApproaches: [{ sql: `SELECT p.category, COUNT(o.customer_id) AS buyers FROM order_items oi JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled' JOIN products p ON p.id = oi.product_id GROUP BY p.category;`, whyMd: 'Counts items instead of distinct customers (Aarav is counted three times in "stationery").' }],
    targetMinutes: 5, verification: v,
  },

  // ---------- Patterns ----------
  {
    id: 'sql-second-highest-fare', title: 'Second highest distinct fare', topicIds: ['sql.patterns'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'Return the **second highest distinct fare** among completed trips as a single value `second_highest_fare`, or **NULL** if there is none.',
    referenceSql: `SELECT (SELECT DISTINCT fare FROM trips
        WHERE status = 'completed' AND fare IS NOT NULL
        ORDER BY fare DESC LIMIT 1 OFFSET 1) AS second_highest_fare;`,
    orderMatters: false,
    hints: ['Duplicates must not count as separate ranks.', 'A scalar subquery returns NULL when it finds no row: a free way to produce the NULL case.'],
    explanationMd: '`SELECT DISTINCT … ORDER BY … LIMIT 1 OFFSET 1` skips the largest distinct value and returns the next. Wrapping it in an outer SELECT makes the result one row even when no second value exists (NULL).',
    wrongApproaches: [{ sql: `SELECT (SELECT fare FROM trips WHERE status = 'completed' AND fare IS NOT NULL ORDER BY fare DESC LIMIT 1 OFFSET 1) AS second_highest_fare;`, whyMd: 'Without DISTINCT, a tie for the maximum is returned as the "second" value.' }],
    targetMinutes: 5, verification: v,
  },
  {
    id: 'sql-top2-posts-per-user', title: 'Two most-liked posts per user', topicIds: ['sql.patterns', 'sql.window-functions'], difficulty: 'medium', datasetId: 'social',
    promptMd: 'For every user return their **two most-liked posts**: `handle`, `post_id` and `likes`. Break like ties by the lower `post_id`. Users with fewer than two posts return what they have.',
    referenceSql: `SELECT u.handle, r.id AS post_id, r.likes
FROM (
  SELECT id, user_id, likes,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY likes DESC, id) AS rn
  FROM posts
) r
JOIN users u ON u.id = r.user_id
WHERE r.rn <= 2;`,
    orderMatters: false,
    hints: ['Rank posts inside each user: PARTITION BY.', 'Window functions cannot be filtered in the same SELECT: use a derived table or CTE.'],
    explanationMd: 'Top-N per group: `ROW_NUMBER()` partitioned by user and ordered by likes, then keep `rn <= 2` in an outer query. The id in the ORDER BY makes the choice deterministic when likes tie.',
    wrongApproaches: [{ sql: `SELECT u.handle, p.id AS post_id, p.likes FROM posts p JOIN users u ON u.id = p.user_id ORDER BY p.likes DESC LIMIT 2;`, whyMd: 'LIMIT applies to the whole result, not to each user.' }],
    targetMinutes: 7, verification: v,
  },
  {
    id: 'sql-signup-cohorts', title: 'Cohort sizes by first login month', topicIds: ['sql.patterns', 'sql.date-string-functions'], difficulty: 'medium', datasetId: 'events',
    promptMd: 'A user\'s **cohort** is the month (`YYYY-MM`) of their first login. Return each `cohort` and the number of `users` in it.',
    referenceSql: `SELECT substr(first_login, 1, 7) AS cohort, COUNT(*) AS users
FROM (SELECT user_id, MIN(login_date) AS first_login FROM logins GROUP BY user_id) f
GROUP BY substr(first_login, 1, 7);`,
    referenceMysql: `SELECT DATE_FORMAT(first_login, '%Y-%m') AS cohort, COUNT(*) AS users
FROM (SELECT user_id, MIN(login_date) AS first_login FROM logins GROUP BY user_id) f
GROUP BY DATE_FORMAT(first_login, '%Y-%m');`,
    orderMatters: false,
    hints: ['Find each user\'s first login first (one row per user).', 'Then group those rows by month.'],
    explanationMd: 'Two levels of aggregation: `MIN(login_date)` per user, then `COUNT(*)` of users per month. Grouping the raw logins by month would count every login, not every user.',
    wrongApproaches: [{ sql: `SELECT substr(login_date, 1, 7) AS cohort, COUNT(DISTINCT user_id) AS users FROM logins GROUP BY substr(login_date, 1, 7);`, whyMd: 'Counts every user active in a month, not only users whose first login was in that month (Ana appears again in April).' }],
    targetMinutes: 6, verification: v,
  },
  {
    id: 'sql-median-fare', title: 'Median fare of completed trips', topicIds: ['sql.patterns', 'sql.window-functions'], difficulty: 'hard', datasetId: 'rides',
    promptMd: 'Return the **median** `fare` of completed trips as `median_fare`. For an even number of trips, the median is the average of the two middle values.',
    referenceSql: `WITH f AS (
  SELECT fare,
         ROW_NUMBER() OVER (ORDER BY fare, id) AS rn,
         COUNT(*) OVER () AS cnt
  FROM trips
  WHERE status = 'completed' AND fare IS NOT NULL
)
SELECT AVG(fare) AS median_fare
FROM f
WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2);`,
    orderMatters: false,
    hints: ['Number the fares in sorted order and also know the total count.', 'For an odd count the two middle positions coincide; for an even count they differ by one.', 'Average the fare at the middle position(s).'],
    explanationMd: 'With `cnt` rows, the middle positions are `(cnt + 1) / 2` and `(cnt + 2) / 2` (integer division): equal when cnt is odd, adjacent when it is even. Averaging them handles both cases with one expression.',
    wrongApproaches: [
      { sql: `SELECT AVG(fare) AS median_fare FROM trips WHERE status = 'completed' AND fare IS NOT NULL;`, whyMd: 'That is the mean, not the median.' },
      { sql: `WITH f AS (SELECT fare, ROW_NUMBER() OVER (ORDER BY fare, id) AS rn, COUNT(*) OVER () AS cnt FROM trips WHERE status = 'completed' AND fare IS NOT NULL) SELECT AVG(fare) AS median_fare FROM f WHERE rn = cnt / 2 + 1;`, whyMd: 'Picks only one middle value, which is wrong for an even number of trips.' },
    ],
    targetMinutes: 10, verification: v,
  },
  {
    id: 'sql-all-stationery', title: 'Customers who bought every stationery product', topicIds: ['sql.patterns'], difficulty: 'hard', datasetId: 'shop',
    promptMd: 'Return the `name` of every customer who has bought **every product in the `stationery` category** in non-cancelled orders.',
    referenceSql: `SELECT c.name
FROM customers c
JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled'
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id AND p.category = 'stationery'
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT p.id) = (SELECT COUNT(*) FROM products WHERE category = 'stationery');`,
    orderMatters: false,
    hints: ['"For all" questions compare a count to the size of the full set.', 'Count DISTINCT products: one product can be bought many times.'],
    explanationMd: 'Relational division: restrict to the category, count how many different products each customer bought, and keep customers whose count equals the number of products in the category. Without `DISTINCT` repeated purchases would inflate the count.',
    wrongApproaches: [
      { sql: `SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled' JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id AND p.category = 'stationery' GROUP BY c.id, c.name HAVING COUNT(p.id) = (SELECT COUNT(*) FROM products WHERE category = 'stationery');`, whyMd: 'Counts purchased lines, not distinct products, so repeat buyers fail the equality.' },
      { sql: `SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE p.category = 'stationery';`, whyMd: 'Returns anyone who bought at least one stationery product.' },
    ],
    targetMinutes: 9, verification: v,
  },

  // ---------- Subqueries ----------
  {
    id: 'sql-customers-with-shipped', title: 'Customers with a shipped order', topicIds: ['sql.subqueries'], difficulty: 'easy', datasetId: 'shop',
    promptMd: 'Return the `name` of every customer who has **at least one shipped order**, each customer once.',
    referenceSql: `SELECT c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'shipped');`,
    orderMatters: false,
    hints: ['You only need to know whether a matching order exists.', 'A plain join would repeat a customer for every shipped order.'],
    explanationMd: '`EXISTS` is a semi-join: it tests for a match without multiplying rows, so each customer appears once. An inner join returns one row per shipped order unless you add `DISTINCT`.',
    wrongApproaches: [{ sql: `SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'shipped';`, whyMd: 'Aarav has two shipped orders and is returned twice.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-earn-more-than-sales', title: 'Earning more than everyone in Sales', topicIds: ['sql.subqueries'], difficulty: 'medium', datasetId: 'company',
    promptMd: 'Return the `name` of employees who earn **more than every employee in the Sales department**.',
    referenceSql: `SELECT name FROM employees
WHERE salary > (SELECT MAX(salary) FROM employees
                WHERE dept_id = (SELECT id FROM departments WHERE name = 'Sales'));`,
    orderMatters: false,
    hints: ['"More than all of them" means more than the maximum.', 'The department is named, so look its id up with a subquery.'],
    explanationMd: '`> ALL (subquery)` is equivalent to `> (SELECT MAX(...))`. Comparing with the minimum would answer "more than someone in Sales" instead. (SQLite has no ALL operator, so the aggregate form is the portable one.)',
    wrongApproaches: [{ sql: `SELECT name FROM employees WHERE salary > (SELECT MIN(salary) FROM employees WHERE dept_id = (SELECT id FROM departments WHERE name = 'Sales'));`, whyMd: 'More than the lowest Sales salary is not "more than everyone".' }],
    targetMinutes: 5, verification: v,
  },
  {
    id: 'sql-category-revenue-share', title: 'Revenue share per category', topicIds: ['sql.subqueries', 'sql.aggregation'], difficulty: 'hard', datasetId: 'shop',
    promptMd: 'Considering non-cancelled orders only, return each product `category` and its share of total revenue as `pct`, a percentage rounded to 1 decimal. Revenue is `qty × price`.',
    referenceSql: `WITH rev AS (
  SELECT p.category, SUM(oi.qty * p.price) AS revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
  JOIN products p ON p.id = oi.product_id
  GROUP BY p.category
)
SELECT category, ROUND(100.0 * revenue / (SELECT SUM(revenue) FROM rev), 1) AS pct
FROM rev;`,
    orderMatters: false,
    hints: ['Compute revenue per category first, then divide by the grand total.', 'Integer division truncates: make one operand a decimal.'],
    explanationMd: 'A CTE holds revenue per category; the scalar subquery `SELECT SUM(revenue) FROM rev` supplies the total for every row. `100.0 *` forces decimal arithmetic: `100 * revenue / total` with integers would truncate to whole percents.',
    wrongApproaches: [{ sql: `WITH rev AS (SELECT p.category, SUM(oi.qty * p.price) AS revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled' JOIN products p ON p.id = oi.product_id GROUP BY p.category) SELECT category, 100 * revenue / (SELECT SUM(revenue) FROM rev) AS pct FROM rev;`, whyMd: 'Integer division truncates the percentages and does not round them to 1 decimal.' }],
    targetMinutes: 8, verification: v,
  },

  // ---------- Self joins ----------
  {
    id: 'sql-equal-salary-pairs', title: 'Pairs with the same salary', topicIds: ['sql.self-joins'], difficulty: 'medium', datasetId: 'company',
    promptMd: 'Return every **pair of employees with the same salary** as `first` and `second` (names), each pair once.',
    referenceSql: `SELECT a.name AS first, b.name AS second
FROM employees a
JOIN employees b ON a.salary = b.salary AND a.id < b.id;`,
    orderMatters: false,
    hints: ['Join the table with itself on equal salary.', 'How do you avoid pairing someone with themselves, and listing both (A, B) and (B, A)?'],
    explanationMd: '`a.id < b.id` removes self-pairs and keeps exactly one of the two mirror-image rows. `a.id <> b.id` would list each pair twice.',
    wrongApproaches: [{ sql: `SELECT a.name AS first, b.name AS second FROM employees a JOIN employees b ON a.salary = b.salary AND a.id <> b.id;`, whyMd: 'Each pair appears twice, once in each order.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-skip-level-manager', title: 'Manager of the manager', topicIds: ['sql.self-joins'], difficulty: 'medium', datasetId: 'company',
    promptMd: 'For every employee return their `name` and `skip_level`: the name of their **manager\'s manager**, or NULL if there is none.',
    referenceSql: `SELECT e.name, g.name AS skip_level
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
LEFT JOIN employees g ON g.id = m.manager_id;`,
    orderMatters: false,
    hints: ['Join employees to employees twice: once for the manager, once for the manager\'s manager.', 'Use LEFT JOINs so people near the top of the hierarchy are not dropped.'],
    explanationMd: 'Each LEFT JOIN climbs one level and yields NULL when the chain ends. INNER JOINs would keep only employees at least two levels below the top.',
    wrongApproaches: [{ sql: `SELECT e.name, g.name AS skip_level FROM employees e JOIN employees m ON m.id = e.manager_id JOIN employees g ON g.id = m.manager_id;`, whyMd: 'INNER JOINs drop everyone who has no manager or no skip-level manager.' }],
    targetMinutes: 6, verification: v,
  },
  {
    id: 'sql-same-city-rider-pairs', title: 'Riders from the same city', topicIds: ['sql.self-joins'], difficulty: 'easy', datasetId: 'rides',
    promptMd: 'Return every pair of **different riders living in the same city**: `rider_a`, `rider_b` (names), each pair once, with `rider_a` having the lower id.',
    referenceSql: `SELECT a.name AS rider_a, b.name AS rider_b
FROM riders a
JOIN riders b ON a.city = b.city AND a.id < b.id;`,
    orderMatters: false,
    hints: ['Self-join riders on city.', 'Use an inequality on id to get each pair once and no self-pairs.'],
    explanationMd: 'Joining a table to itself on `city` produces every ordered pair, including (x, x). The `a.id < b.id` condition keeps the pair once.',
    wrongApproaches: [{ sql: `SELECT a.name AS rider_a, b.name AS rider_b FROM riders a JOIN riders b ON a.city = b.city;`, whyMd: 'Includes self-pairs and both orderings of every pair.' }],
    targetMinutes: 3, verification: v,
  },

  // ---------- Window functions ----------
  {
    id: 'sql-fare-quartiles', title: 'Fare quartiles', topicIds: ['sql.window-functions'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'Split the completed trips into **4 quartiles by fare** (1 = cheapest). Return `id`, `fare` and `quartile`. Order fares ascending, breaking ties by `id`.',
    referenceSql: `SELECT id, fare, NTILE(4) OVER (ORDER BY fare, id) AS quartile
FROM trips
WHERE status = 'completed' AND fare IS NOT NULL;`,
    orderMatters: false,
    hints: ['Which window function distributes rows into N buckets?', 'The OVER clause decides the order in which rows are handed out.'],
    explanationMd: '`NTILE(4)` deals the rows (in the window order) into four groups whose sizes differ by at most one. The window ORDER BY must be the fare, otherwise the buckets are unrelated to price; the `id` makes ties deterministic.',
    wrongApproaches: [{ sql: `SELECT id, fare, NTILE(4) OVER (ORDER BY id) AS quartile FROM trips WHERE status = 'completed' AND fare IS NOT NULL;`, whyMd: 'Orders by id, so the buckets do not correspond to fare ranges.' }],
    targetMinutes: 5, verification: v,
  },
  {
    id: 'sql-moving-average', title: 'Moving average of the last three transactions', topicIds: ['sql.window-functions'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'For each transaction return `id`, `account_id` and `moving_avg`: the average `amount` of the **current and previous two** transactions of the same account (fewer at the start), rounded to 1 decimal. Order transactions by `txn_date`, then `id`.',
    referenceSql: `SELECT id, account_id,
       ROUND(AVG(amount) OVER (PARTITION BY account_id ORDER BY txn_date, id
                               ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS moving_avg
FROM txns;`,
    orderMatters: false,
    hints: ['AVG can be a window function.', 'A frame clause limits which rows around the current one are averaged.'],
    explanationMd: '`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` defines a sliding frame of three rows. Without a frame, an ordered window averages from the first row to the current one (a running average).',
    wrongApproaches: [{ sql: `SELECT id, account_id, ROUND(AVG(amount) OVER (PARTITION BY account_id ORDER BY txn_date, id), 1) AS moving_avg FROM txns;`, whyMd: 'The default frame starts at the first row, producing a running average from the beginning, not a 3-row moving average.' }],
    targetMinutes: 6, verification: v,
  },
  {
    id: 'sql-next-trip-time', title: 'When is the rider\'s next trip?', topicIds: ['sql.window-functions'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'For every trip return `id`, `rider_id` and `next_trip_at`: the `requested_at` of the **same rider\'s next trip** (NULL for their last one). Order each rider\'s trips by `requested_at`, then `id`.',
    referenceSql: `SELECT id, rider_id,
       LEAD(requested_at) OVER (PARTITION BY rider_id ORDER BY requested_at, id) AS next_trip_at
FROM trips;`,
    orderMatters: false,
    hints: ['LEAD looks at a later row of the window.', 'PARTITION BY keeps the comparison inside one rider.'],
    explanationMd: '`LEAD(col)` returns the value from the next row of the window; the last row of each partition gets NULL. Without `PARTITION BY rider_id` it would look at the next trip of someone else.',
    wrongApproaches: [{ sql: `SELECT id, rider_id, LEAD(requested_at) OVER (ORDER BY requested_at, id) AS next_trip_at FROM trips;`, whyMd: 'No partition: the "next trip" may belong to a different rider.' }],
    targetMinutes: 5, verification: v,
  },
  {
    id: 'sql-fare-share-in-city', title: 'Share of the city\'s fares', topicIds: ['sql.window-functions'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'For every completed trip return `id`, `city` and `share_pct`: its fare as a percentage of the **total fares of completed trips in the same city**, rounded to 1 decimal.',
    referenceSql: `SELECT id, city,
       ROUND(100.0 * fare / SUM(fare) OVER (PARTITION BY city), 1) AS share_pct
FROM trips
WHERE status = 'completed' AND fare IS NOT NULL;`,
    orderMatters: false,
    hints: ['An aggregate used as a window function keeps every row.', 'What should the window be partitioned by?'],
    explanationMd: '`SUM(fare) OVER (PARTITION BY city)` attaches the city total to each row without collapsing the result, so the share can be computed in the same SELECT.',
    wrongApproaches: [{ sql: `SELECT id, city, ROUND(100.0 * fare / SUM(fare) OVER (PARTITION BY driver_id), 1) AS share_pct FROM trips WHERE status = 'completed' AND fare IS NOT NULL;`, whyMd: 'Partitions by driver, so the percentages are relative to the wrong total.' }],
    targetMinutes: 5, verification: v,
  },

  // ---------- Dates and strings ----------
  {
    id: 'sql-trips-by-hour', title: 'Trips per hour of the day', topicIds: ['sql.date-string-functions', 'sql.aggregation'], difficulty: 'easy', datasetId: 'rides',
    promptMd: 'Return `hour` (two characters, `00`–`23`, taken from `requested_at`) and the number of trips `requested` in that hour, across all dates.',
    referenceSql: `SELECT strftime('%H', requested_at) AS hour, COUNT(*) AS requested
FROM trips
GROUP BY strftime('%H', requested_at);`,
    referenceMysql: `SELECT DATE_FORMAT(requested_at, '%H') AS hour, COUNT(*) AS requested
FROM trips
GROUP BY DATE_FORMAT(requested_at, '%H');`,
    orderMatters: false,
    hints: ['Extract the hour from the timestamp.', 'Group by the same expression.'],
    explanationMd: 'Timestamps are strings `YYYY-MM-DD HH:MM:SS`; `strftime(\'%H\', …)` (SQLite) or `DATE_FORMAT(…, \'%H\')` (MySQL) extracts the hour, and the GROUP BY must use the same expression.',
    wrongApproaches: [{ sql: `SELECT substr(requested_at, 1, 2) AS hour, COUNT(*) AS requested FROM trips GROUP BY substr(requested_at, 1, 2);`, whyMd: 'Takes the first two characters of the string, which are the century digits, not the hour.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-weekend-trips', title: 'Weekend trips', topicIds: ['sql.date-string-functions'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'Return the `id` of every trip requested on a **Saturday or Sunday**.',
    referenceSql: `SELECT id FROM trips WHERE strftime('%w', requested_at) IN ('0', '6');`,
    referenceMysql: `SELECT id FROM trips WHERE DAYOFWEEK(requested_at) IN (1, 7);`,
    orderMatters: false,
    hints: ['Find the function that returns the day of the week.', 'The numbering differs per database: check which number is Sunday.'],
    explanationMd: 'In SQLite, `strftime(\'%w\', …)` gives 0 for Sunday through 6 for Saturday; MySQL\'s `DAYOFWEEK` gives 1 for Sunday through 7 for Saturday. Always confirm the numbering of the dialect you are on.',
    wrongApproaches: [{ sql: `SELECT id FROM trips WHERE strftime('%w', requested_at) = '0';`, whyMd: 'Only Sundays: Saturday trips are missing.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-capitalised-handle', title: 'Capitalise the first letter', topicIds: ['sql.date-string-functions'], difficulty: 'easy', datasetId: 'social',
    promptMd: 'Return each user\'s `handle` with only its **first letter capitalised** (for example `ana` → `Ana`) as `display`.',
    referenceSql: `SELECT UPPER(SUBSTR(handle, 1, 1)) || SUBSTR(handle, 2) AS display FROM users;`,
    referenceMysql: `SELECT CONCAT(UPPER(SUBSTR(handle, 1, 1)), SUBSTR(handle, 2)) AS display FROM users;`,
    orderMatters: false,
    hints: ['Split the string into the first character and the rest.', 'SQLite concatenates with ||, MySQL with CONCAT().'],
    explanationMd: '`SUBSTR(handle, 1, 1)` is the first character and `SUBSTR(handle, 2)` is everything after it. Upper-case the first part and glue them back together.',
    wrongApproaches: [{ sql: `SELECT UPPER(handle) AS display FROM users;`, whyMd: 'Upper-cases the whole handle instead of only the first letter.' }],
    targetMinutes: 3, verification: v,
  },

  // ---------- CASE and conditional aggregation ----------
  {
    id: 'sql-trip-status-pivot', title: 'Trip outcomes per city, side by side', topicIds: ['sql.case-conditional-agg'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'For each `city` return three counts as columns: `completed`, `cancelled` (cancelled by rider **or** driver) and `unmatched` (status `no_driver`).',
    referenceSql: `SELECT city,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN status IN ('cancelled_by_rider', 'cancelled_by_driver') THEN 1 ELSE 0 END) AS cancelled,
       SUM(CASE WHEN status = 'no_driver' THEN 1 ELSE 0 END) AS unmatched
FROM trips
GROUP BY city;`,
    orderMatters: false,
    hints: ['Conditional aggregation: SUM(CASE WHEN … THEN 1 ELSE 0 END).', 'Two different statuses share the "cancelled" column.'],
    explanationMd: 'Each CASE turns a row into 1 or 0 for one column, and SUM counts the matches, pivoting rows into columns in a single pass over the table.',
    wrongApproaches: [{ sql: `SELECT city, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed, SUM(CASE WHEN status = 'cancelled_by_rider' THEN 1 ELSE 0 END) AS cancelled, SUM(CASE WHEN status = 'no_driver' THEN 1 ELSE 0 END) AS unmatched FROM trips GROUP BY city;`, whyMd: 'Ignores trips cancelled by the driver.' }],
    targetMinutes: 5, verification: v,
  },
  {
    id: 'sql-fare-buckets', title: 'Fare buckets', topicIds: ['sql.case-conditional-agg'], difficulty: 'easy', datasetId: 'rides',
    promptMd: 'Classify completed trips as `low` (fare below 150), `mid` (150 to 299) or `high` (300 and above). Return `bucket` and the number of `trips` in it. Buckets with no trips may be omitted.',
    referenceSql: `SELECT CASE WHEN fare < 150 THEN 'low' WHEN fare < 300 THEN 'mid' ELSE 'high' END AS bucket,
       COUNT(*) AS trips
FROM trips
WHERE status = 'completed' AND fare IS NOT NULL
GROUP BY CASE WHEN fare < 150 THEN 'low' WHEN fare < 300 THEN 'mid' ELSE 'high' END;`,
    orderMatters: false,
    hints: ['CASE evaluates its conditions in order.', 'You can GROUP BY the same CASE expression.'],
    explanationMd: 'Because CASE stops at the first matching branch, `fare < 300` after `fare < 150` means 150 to 299. Boundary values belong to exactly one bucket (150 is mid, 300 is high).',
    wrongApproaches: [{ sql: `SELECT CASE WHEN fare <= 150 THEN 'low' WHEN fare <= 300 THEN 'mid' ELSE 'high' END AS bucket, COUNT(*) AS trips FROM trips WHERE status = 'completed' AND fare IS NOT NULL GROUP BY CASE WHEN fare <= 150 THEN 'low' WHEN fare <= 300 THEN 'mid' ELSE 'high' END;`, whyMd: 'Boundaries are off by one: 150 lands in "low" and 300 in "mid".' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-credits-debits-net', title: 'Credits, debits and net per account', topicIds: ['sql.case-conditional-agg', 'sql.joins'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'For **every account** return `owner`, `credits` (sum of positive amounts), `debits` (sum of the absolute value of negative amounts) and `net`. Accounts without transactions show 0 everywhere.',
    referenceSql: `SELECT a.owner,
       COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount END), 0) AS credits,
       COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount END), 0) AS debits,
       COALESCE(SUM(t.amount), 0) AS net
FROM accounts a
LEFT JOIN txns t ON t.account_id = a.id
GROUP BY a.id, a.owner;`,
    orderMatters: false,
    hints: ['Keep accounts without transactions: which join?', 'SUM of nothing is NULL: replace it with 0.'],
    explanationMd: 'A LEFT JOIN keeps empty accounts; `SUM` over their NULL-padded row is NULL, so `COALESCE(…, 0)` turns it into 0. CASE without an ELSE yields NULL, which SUM ignores.',
    wrongApproaches: [{ sql: `SELECT a.owner, SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) AS credits, SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END) AS debits, SUM(t.amount) AS net FROM accounts a JOIN txns t ON t.account_id = a.id GROUP BY a.id, a.owner;`, whyMd: 'The inner join drops accounts with no transactions.' }],
    targetMinutes: 6, verification: v,
  },

  // ---------- CTEs ----------
  {
    id: 'sql-daily-txn-calendar', title: 'Transactions per day, including empty days', topicIds: ['sql.cte', 'sql.date-string-functions'], difficulty: 'hard', datasetId: 'ledger',
    promptMd: 'For **every day from 2024-02-01 to 2024-02-07** return `day` and `txns` (the number of transactions on that day, 0 if none).',
    referenceSql: `WITH RECURSIVE days(d) AS (
  SELECT '2024-02-01'
  UNION ALL
  SELECT date(d, '+1 day') FROM days WHERE d < '2024-02-07'
)
SELECT d AS day, (SELECT COUNT(*) FROM txns WHERE txn_date = d) AS txns
FROM days;`,
    referenceMysql: `WITH RECURSIVE days(d) AS (
  SELECT DATE '2024-02-01'
  UNION ALL
  SELECT d + INTERVAL 1 DAY FROM days WHERE d < DATE '2024-02-07'
)
SELECT d AS day, (SELECT COUNT(*) FROM txns WHERE txn_date = d) AS txns
FROM days;`,
    orderMatters: false,
    hints: ['A table of transactions cannot produce days that have none: generate the calendar yourself.', 'A recursive CTE adds one day per step until the end date.'],
    explanationMd: 'The recursive CTE manufactures one row per day; counting transactions with a correlated subquery (or a LEFT JOIN) then gives 0 for days without activity. Grouping the transactions table alone would silently skip empty days.',
    wrongApproaches: [{ sql: `SELECT txn_date AS day, COUNT(*) AS txns FROM txns WHERE txn_date BETWEEN '2024-02-01' AND '2024-02-07' GROUP BY txn_date;`, whyMd: 'Only days that have transactions appear; empty days are missing.' }],
    targetMinutes: 9, verification: v,
  },
  {
    id: 'sql-org-subtree', title: 'Everyone under employee 1', topicIds: ['sql.cte'], difficulty: 'hard', datasetId: 'company',
    promptMd: 'Return the `name` of **everyone who reports to employee 1**, directly or through other managers (employee 1 themselves is excluded).',
    referenceSql: `WITH RECURSIVE under AS (
  SELECT id FROM employees WHERE manager_id = 1
  UNION ALL
  SELECT e.id FROM employees e JOIN under u ON e.manager_id = u.id
)
SELECT e.name FROM employees e JOIN under u ON u.id = e.id;`,
    orderMatters: false,
    hints: ['Start from the direct reports.', 'Repeat: add employees whose manager is already in the result.'],
    explanationMd: 'The anchor member selects the direct reports; the recursive member keeps joining employees to the people found so far, so deeper levels are added until no new rows appear. A plain join only finds the first level.',
    wrongApproaches: [{ sql: `SELECT name FROM employees WHERE manager_id = 1;`, whyMd: 'Finds only direct reports and misses people reporting through them.' }],
    targetMinutes: 8, verification: v,
  },
  {
    id: 'sql-driver-load-by-city', title: 'Average completed trips per working driver', topicIds: ['sql.cte', 'sql.aggregation'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'Per `city`, compute the **average number of completed trips per driver**, counting only drivers who completed at least one trip. Return `city` and `avg_trips` rounded to 2 decimals. Use a CTE for the per-driver counts.',
    referenceSql: `WITH per_driver AS (
  SELECT driver_id, city, COUNT(*) AS completed
  FROM trips
  WHERE status = 'completed'
  GROUP BY driver_id, city
)
SELECT city, ROUND(AVG(completed), 2) AS avg_trips
FROM per_driver
GROUP BY city;`,
    orderMatters: false,
    hints: ['First count completed trips per driver, then average those counts per city.', 'Averaging raw trips would average over trips, not drivers.'],
    explanationMd: 'Two-step aggregation: the CTE produces one row per driver with their count; the outer query averages those per-driver numbers. Averaging over raw trip rows answers a different question.',
    wrongApproaches: [{ sql: `SELECT city, ROUND(AVG(fare), 2) AS avg_trips FROM trips WHERE status = 'completed' GROUP BY city;`, whyMd: 'Averages fares instead of per-driver trip counts.' }],
    targetMinutes: 6, verification: v,
  },

  // ---------- Set operations ----------
  {
    id: 'sql-posted-or-followed', title: 'Users who posted or followed', topicIds: ['sql.set-operations'], difficulty: 'easy', datasetId: 'social',
    promptMd: 'Return the `id` of every user who has **posted at least once or follows at least one person**, each id once.',
    referenceSql: `SELECT user_id AS id FROM posts
UNION
SELECT follower_id FROM follows;`,
    orderMatters: false,
    hints: ['Two lists, combined without duplicates.', 'UNION removes duplicates; UNION ALL keeps them.'],
    explanationMd: '`UNION` merges the two result sets and removes duplicate rows, so someone who both posts and follows appears once. `UNION ALL` would list them twice.',
    wrongApproaches: [{ sql: `SELECT user_id AS id FROM posts UNION ALL SELECT follower_id FROM follows;`, whyMd: 'UNION ALL keeps duplicates, so users in both lists (and users with several posts) repeat.' }],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-both-categories', title: 'Bought electronics and stationery', topicIds: ['sql.set-operations'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'Return the `name` of customers who bought **both** an `electronics` product **and** a `stationery` product in non-cancelled orders.',
    referenceSql: `SELECT c.name FROM customers c
JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled'
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE p.category = 'electronics'
INTERSECT
SELECT c.name FROM customers c
JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled'
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE p.category = 'stationery';`,
    referenceMysql: `SELECT c.name FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id
              WHERE o.customer_id = c.id AND o.status <> 'cancelled' AND p.category = 'electronics')
  AND EXISTS (SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id
              WHERE o.customer_id = c.id AND o.status <> 'cancelled' AND p.category = 'stationery');`,
    orderMatters: false,
    hints: ['Build one list per category and keep the customers who are in both.', 'INTERSECT does that; two EXISTS tests are an equivalent alternative.'],
    explanationMd: '`INTERSECT` returns rows present in both queries. A single WHERE with `category = \'electronics\' AND category = \'stationery\'` would return nothing, because one row has one category; `OR` would return customers who bought either.',
    wrongApproaches: [{ sql: `SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled' JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE p.category IN ('electronics', 'stationery');`, whyMd: 'IN means either category; customers who bought only one of them are included.' }],
    targetMinutes: 7, verification: v,
  },
  {
    id: 'sql-posted-never-followed', title: 'Posted but never followed anyone', topicIds: ['sql.set-operations'], difficulty: 'medium', datasetId: 'social',
    promptMd: 'Return the `handle` of users who have **posted at least once but do not follow anyone**.',
    referenceSql: `SELECT handle FROM users
WHERE id IN (SELECT user_id FROM posts)
  AND id NOT IN (SELECT follower_id FROM follows);`,
    orderMatters: false,
    hints: ['This is "set A minus set B": EXCEPT, or NOT IN / NOT EXISTS.', 'Be careful about which set is subtracted from which.'],
    explanationMd: 'Users with posts, minus users who follow someone. `follower_id` is declared NOT NULL, so `NOT IN` is safe here; with a nullable column prefer `NOT EXISTS`. The reversed difference answers a different question.',
    wrongApproaches: [{ sql: `SELECT handle FROM users WHERE id IN (SELECT follower_id FROM follows) AND id NOT IN (SELECT user_id FROM posts);`, whyMd: 'Reversed: users who follow someone but never posted.' }],
    targetMinutes: 5, verification: v,
  },
  {
    id: 'sql-big-movements-feed', title: 'Feed of large credits and debits', topicIds: ['sql.set-operations'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'Build a feed of **large movements**: credits of at least 2000 labelled `credit`, and debits of at most −2000 labelled `debit`. Return `txn_date`, `kind` and `amount`, ordered by `txn_date`, then `amount`.',
    referenceSql: `SELECT txn_date, 'credit' AS kind, amount FROM txns WHERE amount >= 2000
UNION ALL
SELECT txn_date, 'debit' AS kind, amount FROM txns WHERE amount <= -2000
ORDER BY txn_date, amount;`,
    orderMatters: true,
    hints: ['Two filtered queries with different labels.', 'ORDER BY applies to the whole combined result and goes at the end.'],
    explanationMd: 'Each branch selects one kind of movement and adds a constant label column; `UNION ALL` stacks them without the cost of duplicate removal (there can be none, because the labels differ). The final `ORDER BY` sorts the combined rows.',
    wrongApproaches: [{ sql: `SELECT txn_date, 'credit' AS kind, amount FROM txns WHERE amount >= 2000 AND amount <= -2000 ORDER BY txn_date, amount;`, whyMd: 'No amount can satisfy both conditions at once, so the result is empty.' }],
    targetMinutes: 5, verification: v,
  },

  // ---------- DML and DDL ----------
  {
    id: 'sql-summary-table', title: 'Build a driver summary table', topicIds: ['sql.dml-ddl'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'Create a table `driver_summary(driver_id INTEGER PRIMARY KEY, completed INTEGER, total_fare INTEGER)` and fill it from the trips: one row per driver who completed at least one trip. End your script with `SELECT driver_id, completed, total_fare FROM driver_summary ORDER BY driver_id;`.',
    referenceSql: `CREATE TABLE driver_summary (driver_id INTEGER PRIMARY KEY, completed INTEGER, total_fare INTEGER);
INSERT INTO driver_summary (driver_id, completed, total_fare)
SELECT driver_id, COUNT(*), SUM(fare) FROM trips WHERE status = 'completed' GROUP BY driver_id;
SELECT driver_id, completed, total_fare FROM driver_summary ORDER BY driver_id;`,
    orderMatters: true,
    hints: ['CREATE TABLE first, then INSERT … SELECT.', 'Only completed trips count, and drivers appear once.'],
    explanationMd: '`INSERT INTO … SELECT` copies the result of a query into a table in one statement. The primary key guarantees one row per driver; without the status filter cancelled trips would be counted.',
    wrongApproaches: [{ sql: `CREATE TABLE driver_summary (driver_id INTEGER PRIMARY KEY, completed INTEGER, total_fare INTEGER); INSERT INTO driver_summary SELECT driver_id, COUNT(*), SUM(fare) FROM trips WHERE driver_id IS NOT NULL GROUP BY driver_id; SELECT driver_id, completed, total_fare FROM driver_summary ORDER BY driver_id;`, whyMd: 'Counts every trip with a driver, including cancelled ones.' }],
    targetMinutes: 6, verification: v,
  },
  {
    id: 'sql-seniority-bonus', title: 'Seniority bonus', topicIds: ['sql.dml-ddl'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Give a **5000 bonus** (add it to `salary`) to every employee hired **before 2019-01-01**. End with `SELECT id, salary FROM employees ORDER BY id;`.',
    referenceSql: `UPDATE employees SET salary = salary + 5000 WHERE hire_date < '2019-01-01';
SELECT id, salary FROM employees ORDER BY id;`,
    orderMatters: true,
    hints: ['UPDATE … SET … WHERE: the WHERE chooses the rows.', 'Dates stored as YYYY-MM-DD strings compare correctly as text.'],
    explanationMd: 'Without the WHERE clause everyone would receive the bonus. Running `SELECT … WHERE hire_date < \'2019-01-01\'` first shows exactly which rows an UPDATE will touch.',
    wrongApproaches: [{ sql: `UPDATE employees SET salary = salary + 5000; SELECT id, salary FROM employees ORDER BY id;`, whyMd: 'Updates every employee, not only those hired before 2019.' }],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-add-status-column', title: 'Add a status column and close idle accounts', topicIds: ['sql.dml-ddl'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'Add a column `status TEXT NOT NULL DEFAULT \'open\'` to `accounts`, then set `status = \'dormant\'` for accounts with **no transactions at all**. End with `SELECT id, status FROM accounts ORDER BY id;`.',
    referenceSql: `ALTER TABLE accounts ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
UPDATE accounts SET status = 'dormant' WHERE NOT EXISTS (SELECT 1 FROM txns t WHERE t.account_id = accounts.id);
SELECT id, status FROM accounts ORDER BY id;`,
    orderMatters: true,
    hints: ['ALTER TABLE … ADD COLUMN with a DEFAULT fills existing rows.', 'Use NOT EXISTS to find accounts without transactions.'],
    explanationMd: 'A column added with a `NOT NULL DEFAULT` gives every existing row the default value, so no backfill is needed. `NOT EXISTS` is the NULL-safe way to find parents without children.',
    wrongApproaches: [{ sql: `ALTER TABLE accounts ADD COLUMN status TEXT NOT NULL DEFAULT 'open'; UPDATE accounts SET status = 'dormant'; SELECT id, status FROM accounts ORDER BY id;`, whyMd: 'Marks every account dormant because the WHERE clause is missing.' }],
    targetMinutes: 5, verification: v,
  },

  // ---------- EXPLAIN and optimisation ----------
  {
    id: 'sql-one-day-sargable', title: 'All trips of one day, index-friendly', topicIds: ['sql.explain-optimisation', 'sql.date-string-functions'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'Return the `id` of every trip requested on **2024-03-02**, written so an index on `requested_at` could be used (do not wrap the column in a function).',
    referenceSql: `SELECT id FROM trips
WHERE requested_at >= '2024-03-02' AND requested_at < '2024-03-03';`,
    orderMatters: false,
    hints: ['A predicate is index-friendly when the column stands alone on one side.', 'Use a half-open range from midnight to the next midnight.'],
    explanationMd: 'Wrapping the column (`date(requested_at) = …`) forces the database to compute the function for every row. A range on the raw column can use a B-tree index. Comparing with a plain date string via `=` would miss every row, because the stored values carry a time.',
    wrongApproaches: [{ sql: `SELECT id FROM trips WHERE requested_at = '2024-03-02';`, whyMd: 'The stored values include a time of day, so equality with a bare date matches nothing.' }],
    targetMinutes: 4, verification: v,
  },
];
