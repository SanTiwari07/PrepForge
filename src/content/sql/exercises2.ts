import type { SqlExercise } from '../schema';

// Original PrepForge exercises, batch 2 (rides, social, ledger datasets and the remaining SQL
// topics). As in batch 1, expected outputs are never hand-written: tests/sql-exercises.test.ts
// runs every reference on the visible and hidden datasets and checks that each wrong approach
// fails somewhere. referenceMysql is given where MySQL syntax differs from SQLite.

const LC = (slug: string, title: string) => ({ title: `LeetCode: ${title}`, url: `https://leetcode.com/problems/${slug}/` });
const v = 'verified-sqlite' as const;

export const exercises2: SqlExercise[] = [
  // ---------- self joins ----------
  {
    id: 'sql-mutual-follows', title: 'Mutual follows', topicIds: ['sql.self-joins'], difficulty: 'easy', datasetId: 'social',
    promptMd: 'Return every pair of users who follow **each other**, once per pair: columns `user_a`, `user_b` (handles), where `user_a` has the smaller user id.',
    referenceSql: `SELECT a.handle AS user_a, b.handle AS user_b
FROM follows f1
JOIN follows f2 ON f2.follower_id = f1.followee_id AND f2.followee_id = f1.follower_id
JOIN users a ON a.id = f1.follower_id
JOIN users b ON b.id = f1.followee_id
WHERE f1.follower_id < f1.followee_id;`,
    orderMatters: false,
    hints: ['A follow is one row. A mutual follow needs two rows of the same table: join follows to itself.', 'The second row must point back: its follower is the first row\'s followee and vice versa.', 'Each mutual pair appears twice (a→b and b→a). Keep one with a < b.'],
    explanationMd: 'Self-join `follows` on the reversed direction. Without `f1.follower_id < f1.followee_id`, every pair appears twice (ana-bo and bo-ana).',
    wrongApproaches: [{ sql: `SELECT a.handle, b.handle FROM follows f1 JOIN follows f2 ON f2.follower_id = f1.followee_id AND f2.followee_id = f1.follower_id JOIN users a ON a.id = f1.follower_id JOIN users b ON b.id = f1.followee_id;`, whyMd: 'Every mutual pair is reported twice, once in each direction.' }],
    targetMinutes: 6, verification: v,
  },
  {
    id: 'sql-quick-rebook', title: 'Rebooked within 30 minutes', topicIds: ['sql.self-joins', 'sql.date-string-functions'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'Find trips that **did not complete** (any status other than `completed`) and were followed by **another request from the same rider within 30 minutes** (strictly later, at most 30 minutes after). Return `cancelled_trip` and `next_trip` (trip ids).',
    referenceSql: `SELECT t1.id AS cancelled_trip, t2.id AS next_trip
FROM trips t1
JOIN trips t2 ON t2.rider_id = t1.rider_id
 AND t2.requested_at > t1.requested_at
 AND t2.requested_at <= datetime(t1.requested_at, '+30 minutes')
WHERE t1.status <> 'completed';`,
    referenceMysql: `SELECT t1.id AS cancelled_trip, t2.id AS next_trip
FROM trips t1
JOIN trips t2 ON t2.rider_id = t1.rider_id
 AND t2.requested_at > t1.requested_at
 AND t2.requested_at <= t1.requested_at + INTERVAL 30 MINUTE
WHERE t1.status <> 'completed';`,
    orderMatters: false,
    hints: ['Pair each trip with other trips of the same rider: a self-join on rider_id.', 'Restrict the second trip to a time window after the first.', 'SQLite: datetime(ts, \'+30 minutes\'); MySQL: ts + INTERVAL 30 MINUTE.'],
    explanationMd: 'Only trip 7 (cancelled by the rider at 10:10) is followed within 30 minutes (trip 8 at 10:25). The timestamps are ISO strings, so string comparison orders them correctly.',
    wrongApproaches: [{ sql: `SELECT t1.id, t2.id FROM trips t1 JOIN trips t2 ON t2.rider_id = t1.rider_id AND t2.requested_at > t1.requested_at WHERE t1.status <> 'completed';`, whyMd: 'Without the 30-minute bound, every later trip by the same rider qualifies.' }],
    targetMinutes: 8, verification: v,
  },
  {
    id: 'sql-follow-suggestions', title: 'Friends-of-friends suggestions', topicIds: ['sql.self-joins', 'sql.subqueries'], difficulty: 'hard', datasetId: 'social',
    promptMd: 'Suggest accounts to follow: for each user U, list every user S that **someone U follows also follows**, where S is not U and U does **not already follow** S. Return distinct (`user`, `suggestion`) handle pairs.',
    referenceSql: `SELECT DISTINCT u.handle AS user, s.handle AS suggestion
FROM follows f1
JOIN follows f2 ON f2.follower_id = f1.followee_id
JOIN users u ON u.id = f1.follower_id
JOIN users s ON s.id = f2.followee_id
WHERE f2.followee_id <> f1.follower_id
  AND NOT EXISTS (SELECT 1 FROM follows x
                  WHERE x.follower_id = f1.follower_id AND x.followee_id = f2.followee_id);`,
    orderMatters: false,
    hints: ['Two hops: U → middle (f1), then middle → S (f2). That is follows joined to itself on f1.followee_id = f2.follower_id.', 'Remove S = U.', 'Remove S that U already follows with NOT EXISTS (or a LEFT JOIN anti-join). Several middles can give the same S: DISTINCT.'],
    explanationMd: 'A two-hop self-join produces candidates; the anti-join removes accounts already followed. `DISTINCT` collapses candidates reached through several middle users.',
    wrongApproaches: [
      { sql: `SELECT DISTINCT u.handle, s.handle FROM follows f1 JOIN follows f2 ON f2.follower_id = f1.followee_id JOIN users u ON u.id = f1.follower_id JOIN users s ON s.id = f2.followee_id WHERE f2.followee_id <> f1.follower_id;`, whyMd: 'Suggests accounts the user already follows (ana already follows cy, reached via bo).' },
      { sql: `SELECT DISTINCT u.handle, s.handle FROM follows f1 JOIN follows f2 ON f2.follower_id = f1.followee_id JOIN users u ON u.id = f1.follower_id JOIN users s ON s.id = f2.followee_id WHERE NOT EXISTS (SELECT 1 FROM follows x WHERE x.follower_id = f1.follower_id AND x.followee_id = f2.followee_id);`, whyMd: 'Suggests users to themselves (ana follows bo, who follows ana).' },
    ],
    targetMinutes: 12, verification: v,
  },
  {
    id: 'sql-reply-authors', title: 'Who replied to whom', topicIds: ['sql.self-joins', 'sql.joins'], difficulty: 'medium', datasetId: 'social',
    promptMd: 'For **every** post return `id`, `author` (handle) and `replying_to`: the handle of the author of the post it replies to, or NULL for top-level posts. Order by post id.',
    referenceSql: `SELECT p.id, a.handle AS author, pa.handle AS replying_to
FROM posts p
JOIN users a ON a.id = p.user_id
LEFT JOIN posts parent ON parent.id = p.reply_to
LEFT JOIN users pa ON pa.id = parent.user_id
ORDER BY p.id;`,
    orderMatters: true,
    hints: ['The parent post is another row of posts: join posts to itself on reply_to.', 'Top-level posts have no parent. Which join keeps them?', 'Both joins that lead to the parent\'s author must be LEFT joins.'],
    explanationMd: 'Two LEFT JOINs walk from a post to its parent and then to the parent\'s author, keeping top-level posts with NULL.',
    wrongApproaches: [{ sql: `SELECT p.id, a.handle, pa.handle FROM posts p JOIN users a ON a.id = p.user_id JOIN posts parent ON parent.id = p.reply_to JOIN users pa ON pa.id = parent.user_id ORDER BY p.id;`, whyMd: 'Inner joins drop every top-level post.' }],
    targetMinutes: 7, verification: v,
  },

  // ---------- set operations ----------
  {
    id: 'sql-active-users', title: 'Users with any activity', topicIds: ['sql.set-operations'], difficulty: 'easy', datasetId: 'social',
    promptMd: 'Return the `handle` of every user who has **posted at least once or follows at least one account** (each user once).',
    referenceSql: `SELECT handle FROM users
WHERE id IN (SELECT user_id FROM posts
             UNION
             SELECT follower_id FROM follows);`,
    orderMatters: false,
    hints: ['Build one list of active user ids from two sources.', 'UNION combines two result sets and removes duplicates.'],
    explanationMd: 'UNION merges the posters and the followers. Only fy-style users with neither activity are excluded (u4 in the hidden data).',
    wrongApproaches: [{ sql: `SELECT u.handle FROM users u JOIN posts p ON p.user_id = u.id;`, whyMd: 'Misses users who follow but never post, and repeats users with several posts.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-lurkers', title: 'Followers who never post', topicIds: ['sql.set-operations'], difficulty: 'easy', datasetId: 'social',
    promptMd: 'Return the `handle` of users who **follow at least one account but have never posted**.',
    referenceSql: `SELECT handle FROM users
WHERE id IN (SELECT follower_id FROM follows
             EXCEPT
             SELECT user_id FROM posts);`,
    orderMatters: false,
    hints: ['Take the set of followers and remove the set of posters.', 'SQL has a set-difference operator: EXCEPT (MINUS in Oracle).'],
    explanationMd: 'EXCEPT keeps follower ids that do not appear among post authors. In MySQL, EXCEPT exists from 8.0.31; NOT EXISTS works everywhere.',
    wrongApproaches: [{ sql: `SELECT DISTINCT u.handle FROM users u JOIN follows f ON f.follower_id = u.id;`, whyMd: 'Lists every follower, including those who also post.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-completed-and-cancelled', title: 'Riders who both rode and cancelled', topicIds: ['sql.set-operations'], difficulty: 'easy', datasetId: 'rides',
    promptMd: 'Return the `rider_id` of every rider who has **at least one completed trip and at least one trip they cancelled themselves** (`cancelled_by_rider`).',
    referenceSql: `SELECT rider_id FROM trips WHERE status = 'completed'
INTERSECT
SELECT rider_id FROM trips WHERE status = 'cancelled_by_rider';`,
    orderMatters: false,
    hints: ['Two conditions on different rows of the same rider: a single WHERE cannot test both on one row.', 'INTERSECT keeps values present in both result sets.'],
    explanationMd: 'INTERSECT of the two rider sets. A single-row filter `status = \'completed\' AND status = \'cancelled_by_rider\'` can never be true.',
    wrongApproaches: [{ sql: `SELECT DISTINCT rider_id FROM trips WHERE status IN ('completed', 'cancelled_by_rider');`, whyMd: 'This is a union (either condition), not an intersection.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-active-days', title: 'Days with account activity', topicIds: ['sql.set-operations', 'sql.aggregation'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'An account is "active" on its opening date and on every date with at least one transaction. For each account return `account_id` and `active_days`, the number of **distinct** active dates.',
    referenceSql: `SELECT a.id AS account_id, COUNT(*) AS active_days
FROM accounts a
JOIN (SELECT id AS account_id, opened AS day FROM accounts
      UNION
      SELECT account_id, txn_date FROM txns) e ON e.account_id = a.id
GROUP BY a.id;`,
    orderMatters: false,
    hints: ['Build one list of (account, day) events from two tables.', 'Should two transactions on the same day count twice? Which set operator removes duplicates?'],
    explanationMd: '`UNION` removes duplicate (account, day) pairs, so several transactions on one day count once. `UNION ALL` keeps duplicates and over-counts.',
    wrongApproaches: [{ sql: `SELECT a.id, COUNT(*) FROM accounts a JOIN (SELECT id AS account_id, opened AS day FROM accounts UNION ALL SELECT account_id, txn_date FROM txns) e ON e.account_id = a.id GROUP BY a.id;`, whyMd: 'UNION ALL counts two transactions on the same day as two days (the hidden data has one).' }],
    targetMinutes: 7, verification: v,
  },

  // ---------- CASE and conditional aggregation ----------
  {
    id: 'sql-city-cancel-rate', title: 'Cancellation rate per city', topicIds: ['sql.case-conditional-agg'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'For each city return `city`, `completed` (number of completed trips) and `cancel_rate`: trips cancelled by the rider **or** the driver divided by **all** requests in that city, rounded to 2 decimals. (`no_driver` requests count in the denominator but are not cancellations.)',
    referenceSql: `SELECT city,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       ROUND(1.0 * SUM(CASE WHEN status LIKE 'cancelled%' THEN 1 ELSE 0 END) / COUNT(*), 2) AS cancel_rate
FROM trips
GROUP BY city;`,
    orderMatters: false,
    hints: ['Count rows that meet a condition inside a group with SUM(CASE WHEN … THEN 1 ELSE 0 END).', 'Integer division truncates in SQLite (and is exact in MySQL). Multiply by 1.0 first.', 'Two statuses count as cancellations.'],
    explanationMd: 'Conditional aggregation computes several counts in one pass over the group. `1.0 *` forces real division in SQLite; without it 2/10 is 0.',
    wrongApproaches: [{ sql: `SELECT city, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), ROUND(SUM(CASE WHEN status LIKE 'cancelled%' THEN 1 ELSE 0 END) / COUNT(*), 2) FROM trips GROUP BY city;`, whyMd: 'Integer division in SQLite makes every rate 0.' }],
    targetMinutes: 7, similarTo: [LC('trips-and-users', 'Trips and Users')], verification: v,
  },
  {
    id: 'sql-driver-bands', title: 'Driver rating bands', topicIds: ['sql.case-conditional-agg', 'sql.null-handling'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'For **every** driver return `name`, `avg_rating` (average of the ratings they received, rounded to 2 decimals) and `band`: `top` if the average is ≥ 4.5, `ok` if ≥ 3.5, `low` otherwise, and `unrated` if they have no ratings at all.',
    referenceSql: `SELECT d.name, ROUND(AVG(t.rating), 2) AS avg_rating,
       CASE WHEN AVG(t.rating) IS NULL THEN 'unrated'
            WHEN AVG(t.rating) >= 4.5 THEN 'top'
            WHEN AVG(t.rating) >= 3.5 THEN 'ok'
            ELSE 'low' END AS band
FROM drivers d
LEFT JOIN trips t ON t.driver_id = d.id
GROUP BY d.id, d.name;`,
    orderMatters: false,
    hints: ['Every driver must appear, even with no trips.', 'AVG ignores NULL ratings and returns NULL when there are none.', 'CASE checks conditions in order: test the NULL case first.'],
    explanationMd: 'A CASE over an aggregate assigns the band. Without the `IS NULL` branch, unrated drivers fall into the ELSE branch and become "low".',
    wrongApproaches: [{ sql: `SELECT d.name, ROUND(AVG(t.rating), 2), CASE WHEN AVG(t.rating) >= 4.5 THEN 'top' WHEN AVG(t.rating) >= 3.5 THEN 'ok' ELSE 'low' END FROM drivers d LEFT JOIN trips t ON t.driver_id = d.id GROUP BY d.id, d.name;`, whyMd: 'Drivers with no ratings get "low" instead of "unrated".' }],
    targetMinutes: 7, verification: v,
  },
  {
    id: 'sql-credits-debits', title: 'Credits, debits and net per account', topicIds: ['sql.case-conditional-agg', 'sql.null-handling'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'For **every** account return `account_id`, `credits` (sum of positive amounts), `debits` (sum of negative amounts, as a positive number) and `net`. Accounts without transactions show 0 in all three.',
    referenceSql: `SELECT a.id AS account_id,
       COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount END), 0) AS credits,
       COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount END), 0) AS debits,
       COALESCE(SUM(t.amount), 0) AS net
FROM accounts a
LEFT JOIN txns t ON t.account_id = a.id
GROUP BY a.id;`,
    orderMatters: false,
    hints: ['Split one column into two sums with CASE inside SUM.', 'Accounts with no transactions need a LEFT JOIN.', 'SUM over no values is NULL, not 0.'],
    explanationMd: 'CASE without ELSE yields NULL, which SUM ignores. COALESCE turns the all-NULL sums of an empty account into 0.',
    wrongApproaches: [{ sql: `SELECT a.id, SUM(CASE WHEN t.amount > 0 THEN t.amount END), SUM(CASE WHEN t.amount < 0 THEN -t.amount END), SUM(t.amount) FROM accounts a LEFT JOIN txns t ON t.account_id = a.id GROUP BY a.id;`, whyMd: 'An account without transactions shows NULL instead of 0.' }],
    targetMinutes: 7, verification: v,
  },

  // ---------- CTEs ----------
  {
    id: 'sql-org-depth', title: 'Depth in the reporting chain', topicIds: ['sql.cte'], difficulty: 'medium', datasetId: 'company',
    promptMd: 'Every employee either has no manager (depth 0) or reports to another employee. Return `name` and `depth`: the number of managers above them.',
    referenceSql: `WITH RECURSIVE chain(id, depth) AS (
  SELECT id, 0 FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, c.depth + 1
  FROM employees e
  JOIN chain c ON e.manager_id = c.id
)
SELECT e.name, c.depth
FROM chain c
JOIN employees e ON e.id = c.id;`,
    orderMatters: false,
    hints: ['Start from the people with no manager (the anchor).', 'Each step finds the direct reports of the people found so far, one level deeper.', 'WITH RECURSIVE … UNION ALL …'],
    explanationMd: 'The anchor selects the top of each chain; the recursive member adds direct reports with depth + 1 until no new rows appear. A fixed number of self-joins cannot handle chains of arbitrary length.',
    wrongApproaches: [{ sql: `SELECT e.name, CASE WHEN e.manager_id IS NULL THEN 0 ELSE 1 END FROM employees e;`, whyMd: 'Only distinguishes "has a manager" from "does not"; Kabir and Priya are two levels down.' }],
    targetMinutes: 10, verification: v,
  },
  {
    id: 'sql-thread-root', title: 'Root post of every thread', topicIds: ['sql.cte'], difficulty: 'medium', datasetId: 'social',
    promptMd: 'Replies can reply to replies. For every post return `post_id` and `root_post`: the id of the top-level post at the start of its thread (a top-level post is its own root).',
    referenceSql: `WITH RECURSIVE up(id, root) AS (
  SELECT id, id FROM posts WHERE reply_to IS NULL
  UNION ALL
  SELECT p.id, up.root
  FROM posts p
  JOIN up ON p.reply_to = up.id
)
SELECT id AS post_id, root AS root_post FROM up;`,
    orderMatters: false,
    hints: ['Start with top-level posts; each is its own root.', 'Then repeatedly attach the replies to posts already found, copying the root along.'],
    explanationMd: 'Walking down from roots carries the root id to every descendant. One self-join would only handle direct replies; post 8 replies to a reply of a reply.',
    wrongApproaches: [{ sql: `SELECT p.id, COALESCE(p.reply_to, p.id) FROM posts p;`, whyMd: 'Gives the direct parent, not the root, for replies to replies.' }],
    targetMinutes: 10, verification: v,
  },
  {
    id: 'sql-monthly-net-gaps', title: 'Monthly net with empty months', topicIds: ['sql.cte', 'sql.date-string-functions'], difficulty: 'hard', datasetId: 'ledger',
    promptMd: 'For every calendar month from the first month with a transaction to the last one, return `month` (`YYYY-MM`) and `net` (the sum of all amounts that month, **0 for months without transactions**).',
    referenceSql: `WITH RECURSIVE months(m) AS (
  SELECT (SELECT MIN(substr(txn_date, 1, 7)) FROM txns) || '-01'
  UNION ALL
  SELECT date(m, '+1 month') FROM months
  WHERE substr(date(m, '+1 month'), 1, 7) <= (SELECT MAX(substr(txn_date, 1, 7)) FROM txns)
)
SELECT substr(m, 1, 7) AS month,
       COALESCE((SELECT SUM(amount) FROM txns WHERE substr(txn_date, 1, 7) = substr(m, 1, 7)), 0) AS net
FROM months;`,
    referenceMysql: `WITH RECURSIVE months(m) AS (
  SELECT DATE_FORMAT(MIN(txn_date), '%Y-%m-01') FROM txns
  UNION ALL
  SELECT m + INTERVAL 1 MONTH FROM months
  WHERE m + INTERVAL 1 MONTH <= (SELECT MAX(txn_date) FROM txns)
)
SELECT DATE_FORMAT(m, '%Y-%m') AS month,
       COALESCE((SELECT SUM(amount) FROM txns WHERE DATE_FORMAT(txn_date, '%Y-%m') = DATE_FORMAT(m, '%Y-%m')), 0) AS net
FROM months;`,
    orderMatters: false,
    hints: ['GROUP BY month only produces months that have data. You need a calendar of months first.', 'A recursive CTE can generate a series: start at the first month and add one month until the last.', 'Then attach each month\'s sum, using COALESCE for empty months.'],
    explanationMd: 'Generating the calendar with a recursive CTE and joining facts to it is the standard way to show gaps. A plain GROUP BY silently skips February in the hidden data.',
    wrongApproaches: [{ sql: `SELECT substr(txn_date, 1, 7), SUM(amount) FROM txns GROUP BY substr(txn_date, 1, 7);`, whyMd: 'Months without transactions are missing instead of showing 0.' }],
    targetMinutes: 14, verification: v,
  },
  {
    id: 'sql-above-average-spenders', title: 'Above-average spenders', topicIds: ['sql.cte', 'sql.subqueries'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'Consider only **shipped** orders. Return the `name` and `total` spend (qty × price) of customers whose total is **strictly greater** than the average total among customers who have shipped orders.',
    referenceSql: `WITH spend AS (
  SELECT o.customer_id, SUM(oi.qty * p.price) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status = 'shipped'
  GROUP BY o.customer_id
)
SELECT c.name, s.total
FROM spend s
JOIN customers c ON c.id = s.customer_id
WHERE s.total > (SELECT AVG(total) FROM spend);`,
    orderMatters: false,
    hints: ['First compute each customer\'s total; then compare each total with the average of those totals.', 'A CTE lets you use the per-customer totals twice.', '"Strictly greater": think about ties with the average.'],
    explanationMd: 'The CTE is referenced twice: once for the rows and once for the average. In the hidden data both customers spend 100, so nobody is strictly above the average.',
    wrongApproaches: [{ sql: `WITH spend AS (SELECT o.customer_id, SUM(oi.qty * p.price) AS total FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE o.status = 'shipped' GROUP BY o.customer_id) SELECT c.name, s.total FROM spend s JOIN customers c ON c.id = s.customer_id WHERE s.total >= (SELECT AVG(total) FROM spend);`, whyMd: '>= includes customers exactly at the average.' }],
    targetMinutes: 9, verification: v,
  },

  // ---------- date and string functions ----------
  {
    id: 'sql-daily-requests', title: 'Requests per day', topicIds: ['sql.date-string-functions', 'sql.aggregation'], difficulty: 'easy', datasetId: 'rides',
    promptMd: 'For each calendar day with at least one request, return `day` (YYYY-MM-DD), `requests` and `completed`, ordered by day.',
    referenceSql: `SELECT date(requested_at) AS day,
       COUNT(*) AS requests,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
FROM trips
GROUP BY date(requested_at)
ORDER BY day;`,
    referenceMysql: `SELECT DATE(requested_at) AS day,
       COUNT(*) AS requests,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
FROM trips
GROUP BY DATE(requested_at)
ORDER BY day;`,
    orderMatters: true,
    hints: ['requested_at includes a time. Group by its date part only.', 'SQLite: date(ts) or substr(ts, 1, 10). MySQL: DATE(ts).'],
    explanationMd: 'Grouping by the full timestamp would give one group per request. `date()` truncates to the day.',
    wrongApproaches: [{ sql: `SELECT requested_at, COUNT(*), SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) FROM trips GROUP BY requested_at ORDER BY requested_at;`, whyMd: 'Groups by the exact timestamp, so every request is its own group.' }],
    targetMinutes: 5, verification: v,
  },
  {
    id: 'sql-late-night', title: 'Late-night requests', topicIds: ['sql.date-string-functions'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'A request is **late-night** if its hour is 22, 23, 0, 1, 2, 3, 4 or 5. For each city with at least one late-night request, return `city` and `late_night` (their number).',
    referenceSql: `SELECT city, COUNT(*) AS late_night
FROM trips
WHERE CAST(strftime('%H', requested_at) AS INTEGER) >= 22
   OR CAST(strftime('%H', requested_at) AS INTEGER) < 6
GROUP BY city;`,
    referenceMysql: `SELECT city, COUNT(*) AS late_night
FROM trips
WHERE HOUR(requested_at) >= 22 OR HOUR(requested_at) < 6
GROUP BY city;`,
    orderMatters: false,
    hints: ['Extract the hour: SQLite strftime(\'%H\', ts), MySQL HOUR(ts).', 'The window wraps around midnight, so it is two ranges joined with OR.', 'Is hour 22 included?'],
    explanationMd: 'A range that crosses midnight cannot be one BETWEEN. In the hidden data, 23:59:59 and 00:00:00 both count.',
    wrongApproaches: [
      { sql: `SELECT city, COUNT(*) FROM trips WHERE CAST(strftime('%H', requested_at) AS INTEGER) > 22 OR CAST(strftime('%H', requested_at) AS INTEGER) < 6 GROUP BY city;`, whyMd: '> 22 drops requests between 22:00 and 22:59.' },
      { sql: `SELECT city, COUNT(*) FROM trips WHERE CAST(strftime('%H', requested_at) AS INTEGER) BETWEEN 22 AND 5 GROUP BY city;`, whyMd: 'BETWEEN 22 AND 5 is an empty range; it never wraps around midnight.' },
    ],
    targetMinutes: 6, verification: v,
  },
  {
    id: 'sql-membership-days', title: 'Days since joining', topicIds: ['sql.date-string-functions'], difficulty: 'easy', datasetId: 'social',
    promptMd: 'As of **2024-03-31**, return each user\'s `handle` in upper case and `days_member`, the whole number of days since they joined. Order by `days_member` descending, then handle.',
    referenceSql: `SELECT UPPER(handle) AS handle,
       CAST(julianday('2024-03-31') - julianday(joined) AS INTEGER) AS days_member
FROM users
ORDER BY days_member DESC, handle;`,
    referenceMysql: `SELECT UPPER(handle) AS handle,
       DATEDIFF('2024-03-31', joined) AS days_member
FROM users
ORDER BY days_member DESC, handle;`,
    orderMatters: true,
    hints: ['Date differences: SQLite julianday(a) − julianday(b); MySQL DATEDIFF(a, b).', 'Ties in days_member need the second sort key.'],
    explanationMd: 'julianday returns fractional day numbers; their difference is a number of days. In the hidden data all users joined on the same day, so the handle tie-break decides the order.',
    wrongApproaches: [{ sql: `SELECT handle, CAST(julianday('2024-03-31') - julianday(joined) AS INTEGER) AS d FROM users ORDER BY d DESC, handle;`, whyMd: 'Returns the handles in their original lower case.' }],
    targetMinutes: 5, verification: v,
  },
  {
    id: 'sql-feb-spend', title: 'February spending by category', topicIds: ['sql.date-string-functions', 'sql.null-handling'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'For debits (negative amounts) dated in **February 2024**, return `category` (use `uncategorised` when NULL) and `spent` as a positive number.',
    referenceSql: `SELECT COALESCE(category, 'uncategorised') AS category, -SUM(amount) AS spent
FROM txns
WHERE amount < 0
  AND txn_date >= '2024-02-01' AND txn_date < '2024-03-01'
GROUP BY COALESCE(category, 'uncategorised');`,
    orderMatters: false,
    hints: ['Use a half-open date range [Feb 1, Mar 1) instead of guessing the last day of February.', 'Group by the COALESCE expression so NULL categories get a name.'],
    explanationMd: 'Half-open ranges avoid leap-year and time-of-day mistakes (2024 has a 29 February).',
    wrongApproaches: [{ sql: `SELECT COALESCE(category, 'uncategorised'), -SUM(amount) FROM txns WHERE amount < 0 AND txn_date BETWEEN '2024-02-01' AND '2024-03-01' GROUP BY COALESCE(category, 'uncategorised');`, whyMd: 'BETWEEN includes 1 March (food −100 for account 3 is added).' }],
    targetMinutes: 6, verification: v,
  },

  // ---------- interview patterns ----------
  {
    id: 'sql-top-driver-per-city', title: 'Top-earning driver per city', topicIds: ['sql.patterns', 'sql.window-functions'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'For each city, return the driver(s) with the highest total fare from **completed** trips: `city`, `name`, `total`. Include ties.',
    referenceSql: `SELECT city, name, total FROM (
  SELECT d.city, d.name, SUM(t.fare) AS total,
         RANK() OVER (PARTITION BY d.city ORDER BY SUM(t.fare) DESC) AS rk
  FROM drivers d
  JOIN trips t ON t.driver_id = d.id AND t.status = 'completed'
  GROUP BY d.id, d.city, d.name
) x
WHERE rk = 1;`,
    orderMatters: false,
    hints: ['Aggregate per driver first, then rank drivers within each city.', 'A window function can rank the aggregated rows: RANK() OVER (PARTITION BY city ORDER BY SUM(fare) DESC).', 'Which ranking function keeps ties?'],
    explanationMd: 'Top-N per group: aggregate, rank inside a subquery, filter rk = 1 outside. RANK (or DENSE_RANK) keeps ties; ROW_NUMBER picks one arbitrarily.',
    wrongApproaches: [{ sql: `SELECT d.city, d.name, MAX(t.fare) FROM drivers d JOIN trips t ON t.driver_id = d.id AND t.status = 'completed' GROUP BY d.city;`, whyMd: 'Returns the largest single fare and a name that is not guaranteed to belong to it.' }],
    targetMinutes: 9, verification: v,
  },
  {
    id: 'sql-running-balance', title: 'Running balance', topicIds: ['sql.window-functions', 'sql.patterns'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'For every transaction return `account_id`, `txn_date`, `amount` and `balance`: the account\'s balance **after** that transaction (transactions apply in date order, then by id). Order by account, date, id.',
    referenceSql: `SELECT account_id, txn_date, amount,
       SUM(amount) OVER (PARTITION BY account_id ORDER BY txn_date, id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance
FROM txns
ORDER BY account_id, txn_date, id;`,
    orderMatters: true,
    hints: ['A running total is SUM() OVER (PARTITION BY … ORDER BY …).', 'Two transactions can share a date: add id to the window ORDER BY.', 'With only ORDER BY txn_date, the default RANGE frame adds every same-day row at once.'],
    explanationMd: 'The default frame with ORDER BY is RANGE … CURRENT ROW, which treats rows with equal sort keys as peers. Ordering by (txn_date, id) and an explicit ROWS frame give a true per-row running balance.',
    wrongApproaches: [{ sql: `SELECT account_id, txn_date, amount, SUM(amount) OVER (PARTITION BY account_id ORDER BY txn_date) FROM txns ORDER BY account_id, txn_date, id;`, whyMd: 'Same-day transactions are peers: both show the end-of-day balance (0 and 0 instead of 100 and 0 in the hidden data).' }],
    targetMinutes: 8, verification: v,
  },
  {
    id: 'sql-ever-overdrawn', title: 'Accounts that went negative', topicIds: ['sql.patterns', 'sql.window-functions'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'Return the `account_id` of every account whose running balance (date order, then id) was **negative at any point**.',
    referenceSql: `SELECT DISTINCT account_id FROM (
  SELECT account_id,
         SUM(amount) OVER (PARTITION BY account_id ORDER BY txn_date, id
                           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS bal
  FROM txns
) x
WHERE bal < 0;`,
    orderMatters: false,
    hints: ['"At any point" is about intermediate balances, not the final one.', 'Compute the running balance with a window function, then filter it in an outer query.', 'Window results cannot be filtered in the same WHERE.'],
    explanationMd: 'Account 2 dips to −500 after spending 2500 on 16 January, although it ends positive. Comparing only the final SUM misses it.',
    wrongApproaches: [{ sql: `SELECT account_id FROM txns GROUP BY account_id HAVING SUM(amount) < 0;`, whyMd: 'Checks only the final balance.' }],
    targetMinutes: 8, verification: v,
  },
  {
    id: 'sql-driver-streak', title: 'Longest streak of working days', topicIds: ['sql.patterns', 'sql.window-functions', 'sql.cte'], difficulty: 'hard', datasetId: 'rides',
    promptMd: 'A driver "works" on a calendar day if they completed at least one trip that day. For each driver who worked at least once, return `name` and `longest_streak`: the most **consecutive** working days.',
    referenceSql: `WITH days AS (
  SELECT DISTINCT driver_id, date(requested_at) AS d
  FROM trips WHERE status = 'completed'
), grp AS (
  SELECT driver_id, d,
         julianday(d) - ROW_NUMBER() OVER (PARTITION BY driver_id ORDER BY d) AS g
  FROM days
)
SELECT dr.name, MAX(cnt) AS longest_streak
FROM (SELECT driver_id, g, COUNT(*) AS cnt FROM grp GROUP BY driver_id, g) s
JOIN drivers dr ON dr.id = s.driver_id
GROUP BY dr.id, dr.name;`,
    orderMatters: false,
    hints: ['Reduce to distinct (driver, day) pairs first.', 'Gaps and islands: for consecutive days, day − row_number is constant.', 'Group by that constant to get streak lengths, then take the maximum per driver.'],
    explanationMd: 'Within an island of consecutive days, both the date and the row number go up by 1, so their difference is constant. DISTINCT matters: two trips on one day must not break the arithmetic.',
    wrongApproaches: [{ sql: `WITH grp AS (SELECT driver_id, date(requested_at) AS d, julianday(date(requested_at)) - ROW_NUMBER() OVER (PARTITION BY driver_id ORDER BY requested_at) AS g FROM trips WHERE status = 'completed') SELECT dr.name, MAX(cnt) FROM (SELECT driver_id, g, COUNT(*) AS cnt FROM grp GROUP BY driver_id, g) s JOIN drivers dr ON dr.id = s.driver_id GROUP BY dr.id, dr.name;`, whyMd: 'Without DISTINCT days, two trips on one day shift the row numbers, so non-consecutive days fall into the same island (Arjun did two trips on 1 March and gets 3).' }],
    targetMinutes: 15, similarTo: [LC('human-traffic-of-stadium', 'Human Traffic of Stadium')], verification: v,
  },

  // ---------- DML and DDL ----------
  {
    id: 'sql-engineering-raise', title: 'Raise for Engineering', topicIds: ['sql.dml-ddl'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Give every employee in the **Engineering** department a 10% raise (new salary = salary × 11 / 10, integer arithmetic). Then end your script with `SELECT id, salary FROM employees ORDER BY id;` so the result can be checked.',
    referenceSql: `UPDATE employees
SET salary = salary * 11 / 10
WHERE dept_id = (SELECT id FROM departments WHERE name = 'Engineering');
SELECT id, salary FROM employees ORDER BY id;`,
    orderMatters: true,
    hints: ['UPDATE … SET … WHERE: the WHERE decides which rows change.', 'The department is identified by name, so look its id up with a subquery.'],
    explanationMd: 'Without the WHERE clause every row is updated, the most common (and most damaging) UPDATE mistake. Run the SELECT with the same WHERE first to see which rows will change.',
    wrongApproaches: [{ sql: `UPDATE employees SET salary = salary * 11 / 10; SELECT id, salary FROM employees ORDER BY id;`, whyMd: 'Raises everyone, not just Engineering.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-purge-cancelled', title: 'Delete cancelled orders', topicIds: ['sql.dml-ddl'], difficulty: 'medium', datasetId: 'shop',
    promptMd: 'Delete every **cancelled** order together with its order items (foreign keys are enforced). End with `SELECT (SELECT COUNT(*) FROM orders) AS orders_left, (SELECT COUNT(*) FROM order_items) AS items_left;`',
    referenceSql: `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE status = 'cancelled');
DELETE FROM orders WHERE status = 'cancelled';
SELECT (SELECT COUNT(*) FROM orders) AS orders_left, (SELECT COUNT(*) FROM order_items) AS items_left;`,
    orderMatters: true,
    hints: ['order_items references orders. What happens if you delete a parent row first?', 'Delete the children first (or declare ON DELETE CASCADE on the foreign key).'],
    explanationMd: 'With foreign keys enforced and no cascade, deleting a referenced order fails. Delete dependent rows first, inside one transaction in production.',
    wrongApproaches: [{ sql: `DELETE FROM orders WHERE status = 'cancelled'; SELECT (SELECT COUNT(*) FROM orders), (SELECT COUNT(*) FROM order_items);`, whyMd: 'Fails with a foreign key error: the order still has items.' }],
    targetMinutes: 6, verification: v,
  },
  {
    id: 'sql-monthly-fee', title: 'Charge a monthly fee', topicIds: ['sql.dml-ddl'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'Insert a fee transaction of **−25** dated `2024-03-31` with category `fee` for every **current** account (let the id be generated). End with each account\'s `id` and `balance` (0 for no transactions), ordered by id.',
    referenceSql: `INSERT INTO txns (account_id, txn_date, amount, category)
SELECT id, '2024-03-31', -25, 'fee' FROM accounts WHERE type = 'current';
SELECT a.id, COALESCE(SUM(t.amount), 0) AS balance
FROM accounts a LEFT JOIN txns t ON t.account_id = a.id
GROUP BY a.id ORDER BY a.id;`,
    orderMatters: true,
    hints: ['INSERT … SELECT inserts one row per selected row.', 'List the target columns so the INTEGER PRIMARY KEY id is generated.'],
    explanationMd: 'INSERT … SELECT is set-based: no loop needed. Naming the columns avoids depending on column order and lets the key be generated.',
    wrongApproaches: [{ sql: `INSERT INTO txns (account_id, txn_date, amount, category) SELECT id, '2024-03-31', -25, 'fee' FROM accounts; SELECT a.id, COALESCE(SUM(t.amount), 0) FROM accounts a LEFT JOIN txns t ON t.account_id = a.id GROUP BY a.id ORDER BY a.id;`, whyMd: 'Charges savings accounts too.' }],
    targetMinutes: 6, verification: v,
  },
  {
    id: 'sql-prune-one-way', title: 'Keep only mutual follows', topicIds: ['sql.dml-ddl', 'sql.subqueries'], difficulty: 'medium', datasetId: 'social',
    promptMd: 'Delete every follow that is **not reciprocated**. End with `SELECT follower_id, followee_id FROM follows ORDER BY follower_id, followee_id;`',
    referenceSql: `DELETE FROM follows
WHERE NOT EXISTS (SELECT 1 FROM follows b
                  WHERE b.follower_id = follows.followee_id
                    AND b.followee_id = follows.follower_id);
SELECT follower_id, followee_id FROM follows ORDER BY follower_id, followee_id;`,
    orderMatters: true,
    hints: ['A correlated NOT EXISTS can refer to the row being deleted by the table name.', 'The reverse row has follower and followee swapped.'],
    explanationMd: 'The subquery is evaluated against the table before the deletion (standard SQL semantics), so removing one side of a non-mutual pair never affects another decision.',
    wrongApproaches: [{ sql: `DELETE FROM follows WHERE follower_id > followee_id; SELECT follower_id, followee_id FROM follows ORDER BY follower_id, followee_id;`, whyMd: 'Deletes by id order, not by whether a reverse follow exists.' }],
    targetMinutes: 7, verification: v,
  },

  // ---------- EXPLAIN and optimisation (results are checked; the lesson explains the plans) ----------
  {
    id: 'sql-keyset-page', title: 'Next page with keyset pagination', topicIds: ['sql.explain-optimisation'], difficulty: 'easy', datasetId: 'shop',
    promptMd: 'The previous page of the product list ended at product id **2**. Return the next page of up to **3** products (`id`, `name`, `price`) in id order, **without using OFFSET**.',
    referenceSql: `SELECT id, name, price
FROM products
WHERE id > 2
ORDER BY id
LIMIT 3;`,
    orderMatters: true,
    hints: ['Remember where the previous page ended and continue from there.', 'WHERE id > last_seen_id ORDER BY id LIMIT n uses the primary-key index and skips nothing.'],
    explanationMd: 'Keyset (seek) pagination starts directly at the next key. OFFSET produces and discards every skipped row, so deep pages get slower; keyset pages stay fast and are stable when rows are inserted earlier in the list.',
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-sargable-year', title: 'Index-friendly date filter', topicIds: ['sql.explain-optimisation', 'sql.date-string-functions'], difficulty: 'easy', datasetId: 'company',
    promptMd: 'Return `name` and `hire_date` of employees hired in **2020**, written so that an index on `hire_date` could be used (no function applied to the column).',
    referenceSql: `SELECT name, hire_date
FROM employees
WHERE hire_date >= '2020-01-01' AND hire_date < '2021-01-01';`,
    orderMatters: false,
    hints: ['WHERE strftime(\'%Y\', hire_date) = \'2020\' is correct but wraps the column in a function.', 'Compare the raw column with a half-open range instead.'],
    explanationMd: 'A predicate is sargable when the indexed column appears bare on one side. Applying a function (YEAR(col), strftime, LOWER) to the column usually forces a full scan.',
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-above-city-avg', title: 'Fares above the city average', topicIds: ['sql.explain-optimisation', 'sql.subqueries'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'Return `id`, `city` and `fare` of completed trips whose fare is **above the average completed fare of their city**. Compute each city average **once** (a derived table, CTE or window function), not once per trip.',
    referenceSql: `SELECT t.id, t.city, t.fare
FROM trips t
JOIN (SELECT city, AVG(fare) AS avg_fare
      FROM trips WHERE status = 'completed'
      GROUP BY city) c ON c.city = t.city
WHERE t.status = 'completed' AND t.fare > c.avg_fare;`,
    orderMatters: false,
    hints: ['A correlated subquery (WHERE fare > (SELECT AVG … WHERE city = t.city)) is correct but may re-run per row.', 'Compute the averages per city in a derived table and join it.', 'AVG(fare) OVER (PARTITION BY city) is another single-pass option.'],
    explanationMd: 'Pre-aggregating the averages makes the work proportional to the table size. Many optimisers decorrelate simple subqueries, but writing the join explicitly does not rely on that. The status filter must apply both to the averages and to the outer rows.',
    targetMinutes: 8, verification: v,
  },
  {
    id: 'sql-latest-txn', title: 'Latest transaction per account', topicIds: ['sql.explain-optimisation', 'sql.window-functions'], difficulty: 'medium', datasetId: 'ledger',
    promptMd: 'For each account with transactions, return its most recent transaction: `account_id`, `txn_date`, `amount`. If several share the latest date, take the one with the highest id.',
    referenceSql: `SELECT account_id, txn_date, amount FROM (
  SELECT account_id, txn_date, amount,
         ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY txn_date DESC, id DESC) AS rn
  FROM txns
) x
WHERE rn = 1;`,
    orderMatters: false,
    hints: ['"Latest per group" is a top-1-per-group problem.', 'ROW_NUMBER() over (PARTITION BY account ORDER BY date DESC, id DESC) and keep rn = 1.', 'An index on (account_id, txn_date, id) serves this ordering directly.'],
    explanationMd: 'One pass with a window function, and a deterministic tie-break. Joining back on MAX(txn_date) returns two rows when two transactions share the latest date.',
    wrongApproaches: [{ sql: `SELECT t.account_id, t.txn_date, t.amount FROM txns t JOIN (SELECT account_id, MAX(txn_date) AS d FROM txns GROUP BY account_id) m ON m.account_id = t.account_id AND m.d = t.txn_date;`, whyMd: 'Returns every transaction on the latest date; the tie-break by id is lost.' }],
    targetMinutes: 7, verification: v,
  },

  // ---------- more practice on the new datasets ----------
  {
    id: 'sql-reliable-drivers', title: 'Drivers who never cancelled', topicIds: ['sql.joins', 'sql.subqueries'], difficulty: 'easy', datasetId: 'rides',
    promptMd: 'Return the `name` of every driver who has **never** had a `cancelled_by_driver` trip (drivers with no trips at all count as never having cancelled).',
    referenceSql: `SELECT d.name
FROM drivers d
WHERE NOT EXISTS (SELECT 1 FROM trips t
                  WHERE t.driver_id = d.id AND t.status = 'cancelled_by_driver');`,
    orderMatters: false,
    hints: ['"Never" means there is no matching row: an anti-join.', 'Filtering trips with status <> \'cancelled_by_driver\' keeps drivers who cancelled once but also completed trips.'],
    explanationMd: 'NOT EXISTS tests the absence of any cancellation. A positive filter on the other statuses answers a different question.',
    wrongApproaches: [{ sql: `SELECT DISTINCT d.name FROM drivers d JOIN trips t ON t.driver_id = d.id WHERE t.status <> 'cancelled_by_driver';`, whyMd: 'Includes drivers who cancelled once but also completed trips, and drops drivers with no trips.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-driver-summary', title: 'Driver scorecard', topicIds: ['sql.aggregation', 'sql.joins'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'For **every** driver return `name`, `completed` (completed trips), `revenue` (sum of their fares, 0 if none) and `avg_rating` (rounded to 2 decimals, NULL if no ratings).',
    referenceSql: `SELECT d.name,
       COUNT(t.id) AS completed,
       COALESCE(SUM(t.fare), 0) AS revenue,
       ROUND(AVG(t.rating), 2) AS avg_rating
FROM drivers d
LEFT JOIN trips t ON t.driver_id = d.id AND t.status = 'completed'
GROUP BY d.id, d.name;`,
    orderMatters: false,
    hints: ['Put the status filter in the ON clause of the LEFT JOIN, not in WHERE.', 'COUNT(t.id), not COUNT(*), so drivers without trips get 0.'],
    explanationMd: 'A WHERE filter on the right table of a LEFT JOIN removes the NULL-extended rows and silently turns it into an inner join. Filtering in ON keeps drivers with no completed trips.',
    wrongApproaches: [{ sql: `SELECT d.name, COUNT(t.id), COALESCE(SUM(t.fare), 0), ROUND(AVG(t.rating), 2) FROM drivers d LEFT JOIN trips t ON t.driver_id = d.id WHERE t.status = 'completed' GROUP BY d.id, d.name;`, whyMd: 'The WHERE filter drops drivers without completed trips (R in the hidden data).' }],
    targetMinutes: 7, verification: v,
  },
  {
    id: 'sql-big-categories', title: 'Expensive categories', topicIds: ['sql.aggregation'], difficulty: 'easy', datasetId: 'ledger',
    promptMd: 'Return each named category (ignore NULL categories) whose total **debits** exceed 1000: `category`, `spent` (positive).',
    referenceSql: `SELECT category, -SUM(amount) AS spent
FROM txns
WHERE amount < 0 AND category IS NOT NULL
GROUP BY category
HAVING -SUM(amount) > 1000;`,
    orderMatters: false,
    hints: ['WHERE filters rows before grouping; HAVING filters groups after aggregation.', 'Debits are negative: negate the sum.'],
    explanationMd: 'Row conditions (debits, non-NULL categories) go in WHERE; the condition on the group total goes in HAVING.',
    wrongApproaches: [{ sql: `SELECT category, SUM(amount) FROM txns WHERE category IS NOT NULL GROUP BY category HAVING SUM(amount) > 1000;`, whyMd: 'Forgets that debits are negative: it returns the big credit categories (salary, transfer) instead.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-previous-amount', title: 'Previous transaction amount', topicIds: ['sql.window-functions'], difficulty: 'easy', datasetId: 'ledger',
    promptMd: 'For every transaction return `id`, `account_id`, `amount` and `prev_amount`: the amount of the same account\'s previous transaction (date order, then id), or NULL for the first. Order by account, date, id.',
    referenceSql: `SELECT id, account_id, amount,
       LAG(amount) OVER (PARTITION BY account_id ORDER BY txn_date, id) AS prev_amount
FROM txns
ORDER BY account_id, txn_date, id;`,
    orderMatters: true,
    hints: ['LAG(col) reads the value from the previous row of the window.', 'Partition by account so the first transaction of each account has no previous one.'],
    explanationMd: 'LAG with PARTITION BY restarts at each account. Without the partition, an account\'s first row would see the previous account\'s last transaction.',
    wrongApproaches: [{ sql: `SELECT id, account_id, amount, LAG(amount) OVER (ORDER BY account_id, txn_date, id) FROM txns ORDER BY account_id, txn_date, id;`, whyMd: 'Without PARTITION BY, the first transaction of account 2 gets account 1\'s last amount.' }],
    targetMinutes: 4, verification: v,
  },
  {
    id: 'sql-driver-rank-city', title: 'Rank drivers by rating within a city', topicIds: ['sql.window-functions'], difficulty: 'medium', datasetId: 'rides',
    promptMd: 'For drivers with at least one rating, return `city`, `name`, `avg_rating` (2 decimals) and `city_rank` (1 = best in the city; equal averages share a rank and ranks have no gaps).',
    referenceSql: `SELECT d.city, d.name, ROUND(AVG(t.rating), 2) AS avg_rating,
       DENSE_RANK() OVER (PARTITION BY d.city ORDER BY AVG(t.rating) DESC) AS city_rank
FROM drivers d
JOIN trips t ON t.driver_id = d.id
WHERE t.rating IS NOT NULL
GROUP BY d.id, d.city, d.name;`,
    orderMatters: false,
    hints: ['Aggregate first, then a window over the aggregated rows (windows are evaluated after GROUP BY).', '"No gaps" means DENSE_RANK.'],
    explanationMd: 'Window functions run after GROUP BY, so ordering a window by AVG(...) is allowed. PARTITION BY city restarts the ranking per city.',
    wrongApproaches: [{ sql: `SELECT d.city, d.name, ROUND(AVG(t.rating), 2), DENSE_RANK() OVER (ORDER BY AVG(t.rating) DESC) FROM drivers d JOIN trips t ON t.driver_id = d.id WHERE t.rating IS NOT NULL GROUP BY d.id, d.city, d.name;`, whyMd: 'Ranks across all cities instead of within each city.' }],
    targetMinutes: 7, verification: v,
  },
  {
    id: 'sql-popular-users', title: 'More followers than average', topicIds: ['sql.subqueries', 'sql.aggregation'], difficulty: 'medium', datasetId: 'social',
    promptMd: 'Return `handle` and `followers` for users whose follower count is **greater than the average follower count over all users** (users with no followers count as 0 in that average).',
    referenceSql: `SELECT u.handle, COUNT(f.follower_id) AS followers
FROM users u
LEFT JOIN follows f ON f.followee_id = u.id
GROUP BY u.id, u.handle
HAVING COUNT(f.follower_id) > (SELECT 1.0 * COUNT(*) / (SELECT COUNT(*) FROM users) FROM follows);`,
    orderMatters: false,
    hints: ['The average over all users is total follows divided by number of users.', 'Averaging only over users who have followers gives a higher bar.'],
    explanationMd: 'The denominator must include users with zero followers. An AVG over a grouped follower count without them computes a different (larger) average.',
    wrongApproaches: [{ sql: `SELECT u.handle, COUNT(*) AS c FROM users u JOIN follows f ON f.followee_id = u.id GROUP BY u.id, u.handle HAVING COUNT(*) > (SELECT AVG(n) FROM (SELECT COUNT(*) AS n FROM follows GROUP BY followee_id));`, whyMd: 'Averages only over users who have followers (2.5 instead of 10/6), so cy drops out.' }],
    targetMinutes: 8, verification: v,
  },
  {
    id: 'sql-longest-trips', title: 'Three longest completed trips', topicIds: ['sql.select-basics'], difficulty: 'easy', datasetId: 'rides',
    promptMd: 'Return `id` and `distance_km` of the 3 longest **completed** trips, longest first; break ties by the smaller id.',
    referenceSql: `SELECT id, distance_km
FROM trips
WHERE status = 'completed'
ORDER BY distance_km DESC, id
LIMIT 3;`,
    orderMatters: true,
    hints: ['Filter, sort, limit.', 'With ties at the cut-off, the tie-break decides which rows appear.'],
    explanationMd: 'In the hidden data two trips share the longest distance; without a tie-break the order (and the third row) is arbitrary.',
    wrongApproaches: [{ sql: `SELECT id, distance_km FROM trips WHERE status = 'completed' ORDER BY distance_km DESC, id DESC LIMIT 3;`, whyMd: 'Breaks ties by the larger id, the opposite of what was asked.' }],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-category-counts', title: 'Transactions per category', topicIds: ['sql.null-handling', 'sql.aggregation'], difficulty: 'easy', datasetId: 'ledger',
    promptMd: 'Return `category` and `n`, the number of transactions in it; label NULL categories as `uncategorised`.',
    referenceSql: `SELECT COALESCE(category, 'uncategorised') AS category, COUNT(*) AS n
FROM txns
GROUP BY COALESCE(category, 'uncategorised');`,
    orderMatters: false,
    hints: ['GROUP BY already puts all NULLs into one group; you only need to name it.', 'COALESCE(x, \'label\') replaces NULL.'],
    explanationMd: 'All NULLs form one group; COALESCE gives it a readable label. Counting COUNT(category) would report 0 for that group.',
    wrongApproaches: [{ sql: `SELECT COALESCE(category, 'uncategorised'), COUNT(category) FROM txns GROUP BY COALESCE(category, 'uncategorised');`, whyMd: 'COUNT(category) ignores NULLs, so the uncategorised group shows 0.' }],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-popular-posts', title: 'Popular posts, most liked first', topicIds: ['sql.select-basics'], difficulty: 'easy', datasetId: 'social',
    promptMd: 'Return `id` and `likes` of posts with **at least 10 likes**, most liked first; break ties by the smaller id.',
    referenceSql: `SELECT id, likes
FROM posts
WHERE likes >= 10
ORDER BY likes DESC, id;`,
    orderMatters: true,
    hints: ['"At least" means >=.', 'Two sort keys: likes descending, then id ascending.'],
    explanationMd: 'In the hidden data three posts have exactly 10 likes, so both the inclusive bound and the tie-break matter.',
    wrongApproaches: [
      { sql: `SELECT id, likes FROM posts WHERE likes > 10 ORDER BY likes DESC, id;`, whyMd: '> 10 drops posts with exactly 10 likes.' },
      { sql: `SELECT id, likes FROM posts WHERE likes >= 10 ORDER BY likes DESC, id DESC;`, whyMd: 'Breaks ties by the larger id.' },
    ],
    targetMinutes: 3, verification: v,
  },
  {
    id: 'sql-pune-riders-page', title: 'Second page of riders', topicIds: ['sql.select-basics'], difficulty: 'easy', datasetId: 'rides',
    promptMd: 'Riders are listed alphabetically by name, 2 per page. Return the `name` of the riders on **page 2**.',
    referenceSql: `SELECT name
FROM riders
ORDER BY name
LIMIT 2 OFFSET 2;`,
    orderMatters: true,
    hints: ['Page 2 skips the first page (2 rows).', 'LIMIT count OFFSET skip; MySQL also accepts LIMIT skip, count.'],
    explanationMd: 'OFFSET is the number of rows to skip: (page − 1) × page size. Without ORDER BY the pages would not be well defined.',
    wrongApproaches: [{ sql: `SELECT name FROM riders ORDER BY name LIMIT 2 OFFSET 1;`, whyMd: 'Skips one row instead of a whole page, so the pages overlap.' }],
    targetMinutes: 3, verification: v,
  },
];
