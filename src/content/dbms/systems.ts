import type { MCQ, Topic } from '../schema';
import { mcq } from '../helpers';
import { CMU, DBBOOK, dbmsTopic, q } from './common';

// DBMS batch 3: SQL vs NoSQL, replication and sharding, and the advanced track (storage and
// recovery, query processing, distributed transactions).

// ---------------------------------------------------------------------------------------
const NS = 'dbms.sql-vs-nosql';
const sqlNoSql = dbmsTopic({
  id: NS, title: 'SQL vs NoSQL', level: 'core', estMinutes: 40, prerequisites: ['dbms.relational-basics'], related: ['sd.databases', 'dbms.replication-sharding', 'sd.consistency-cap'],
  summary: 'Document, key-value, wide-column and graph stores, and how to choose.',
  objectives: ['Describe the four main NoSQL families (key-value, document, wide-column, graph) with an example system and use case each.', 'Compare relational and NoSQL systems on schema, joins, transactions, consistency and scaling.', 'Model data around access patterns (embedding vs referencing) for a document store.', 'Choose a store for a given product requirement and justify it without hype.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'The families', bodyMd: `| Family | Data model | Examples | Good for |
|---|---|---|---|
| Relational | tables, joins, SQL | PostgreSQL, MySQL | general purpose, transactions, ad-hoc queries |
| Key-value | key → opaque value | Redis, DynamoDB (also document-like), Memcached | caching, sessions, counters, very high throughput lookups |
| Document | key → JSON-like document, queryable fields | MongoDB, Couchbase, Firestore | entities read as a whole, flexible or evolving fields |
| Wide-column | rows with many columns grouped in families, partitioned by key | Cassandra, HBase, Bigtable | huge write volumes, time series, known query patterns |
| Graph | nodes and edges with properties | Neo4j, Amazon Neptune | many-hop relationship queries (social graphs, fraud rings) |

"NoSQL" describes a variety of non-relational systems, many of which now support SQL-like query languages and transactions. The real differences are the **data model**, the **query flexibility**, and how each system **scales and replicates**.` },
    { id: 'comparison', kind: 'comparison', title: 'Trade-offs', bodyMd: `| Dimension | Relational | Typical NoSQL |
|---|---|---|
| Schema | defined up front, enforced | flexible / schema-on-read (validation optional) |
| Joins | first-class | limited; denormalise or join in the application |
| Transactions | multi-row ACID by default | historically single-item; many now offer multi-document transactions with limits |
| Query flexibility | ad-hoc queries over any column | design tables or indexes per query pattern (especially Cassandra/DynamoDB) |
| Scaling | vertical first, read replicas; sharding is extra work | designed for horizontal partitioning from the start |
| Consistency | strong on a single primary | tunable or eventual in many distributed setups |

Rule of thumb for interviews: **start relational** unless you can name a concrete need: extreme write throughput with simple access patterns, documents whose shape varies a lot, low-latency key lookups for caching, or graph traversals. Many systems combine both (PostgreSQL for orders, Redis for sessions, Elasticsearch for search).` },
    { id: 'example', kind: 'example', title: 'Modelling for access patterns', bodyMd: `A blog post with comments in a **document store**:

\`\`\`json
{ "_id": "post42", "title": "…", "author": { "id": "u7", "name": "Asha" },
  "tags": ["sql", "interview"],
  "comments": [ { "by": "u9", "text": "Nice", "at": "2024-03-01T10:00:00Z" } ] }
\`\`\`

- **Embed** what is read together and bounded in size (tags, the latest few comments).
- **Reference** what is large, unbounded or shared (all comments of a viral post, user profiles), storing ids and fetching separately.
- **Duplicate** small read-mostly fields (author name) to avoid lookups, and accept updating copies when they change.

In a **wide-column/DynamoDB** design you start from the queries: "get a user's orders by date" becomes partition key = user_id, sort key = order_date; each different query pattern may need another table or a secondary index.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Choosing NoSQL "because it scales" without a workload that a tuned relational database could not handle.
2. Treating document stores as schemaless forever: the schema moves into application code and gets inconsistent.
3. Unbounded arrays inside documents (all comments ever), hitting size limits (16 MB in MongoDB) and slowing updates.
4. Expecting ad-hoc queries on Cassandra/DynamoDB without designing keys or indexes for them.
5. Forgetting that eventual consistency affects user-visible behaviour (stale reads right after a write).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'When would you choose a NoSQL database over a relational one?', answerMd: 'When the workload has a specific shape that a NoSQL model serves better: very high write throughput with simple key-based access (Cassandra, DynamoDB), flexible nested entities read as a whole (MongoDB), sub-millisecond caching (Redis), or deep relationship traversals (graph databases). Otherwise a relational database is a safer default because of joins, constraints and transactions.' },
    { id: 'iq2', q: 'Embed or reference in a document database?', answerMd: 'Embed data that is read together with the parent and bounded in size; reference data that is large, grows without bound, is shared by many parents, or is updated independently. Duplicate small, rarely changing fields to avoid extra reads.' },
    { id: 'iq3', q: 'Do NoSQL databases support transactions?', answerMd: 'Many do now, with limits: MongoDB has multi-document ACID transactions (with performance costs), DynamoDB has TransactWriteItems across up to 100 items, Cassandra offers lightweight transactions (compare-and-set) on a partition. Single-item operations are always atomic.' },
    { id: 'iq4', q: 'Which database would you use for a social graph "friends of friends who like X" query?', answerMd: 'A graph database (or a graph-processing layer) makes multi-hop traversals natural and fast. In a relational database each hop is a self-join, which is fine for one or two hops but becomes expensive for deep traversals.' },
  ],
  revision: { notesMd: `- Families: key-value (Redis), document (MongoDB), wide-column (Cassandra), graph (Neo4j).
- Relational strengths: joins, constraints, ACID, ad-hoc queries.
- NoSQL strengths: horizontal scaling by design, flexible models, specific access patterns.
- Document modelling: embed bounded co-read data; reference large/shared data.
- Default to relational unless a concrete need says otherwise.`, flashcards: [
    { id: 'f1', front: 'Best fit for sessions and caching?', backMd: 'A key-value store such as Redis.' },
    { id: 'f2', front: 'Best fit for multi-hop relationship queries?', backMd: 'A graph database.' },
    { id: 'f3', front: 'Wide-column store design starts from…?', backMd: 'The query patterns (partition and clustering keys per query).' },
    { id: 'f4', front: 'When to embed in a document store?', backMd: 'When the data is read with the parent and bounded in size.' },
    { id: 'f5', front: 'MongoDB document size limit?', backMd: '16 MB.' },
  ] },
  resources: [CMU, { title: 'NoSQL (Wikipedia)', url: 'https://en.wikipedia.org/wiki/NoSQL', kind: 'article' }],
});

const nsMcqs: MCQ[] = [
  mcq({ ...q(NS), id: 'dbms.ns.q1', type: 'scenario', difficulty: 'easy', stem: 'You need sub-millisecond lookups of session tokens with expiry. Which store fits best?', options: ['A key-value store such as Redis with TTLs', ['A graph database', 'No relationships to traverse.'], ['A data warehouse', 'Built for analytics, not low-latency lookups.'], ['A wide-column store with secondary indexes', 'Possible but heavier than needed.']], answer: 0, explanation: 'Key-value access with built-in expiry is exactly the session workload.' }),
  mcq({ ...q(NS), id: 'dbms.ns.q2', type: 'scenario', difficulty: 'medium', stem: 'A payments ledger needs multi-row atomic transfers, constraints and ad-hoc reporting queries. Which choice is safest?', options: ['A relational database', ['A key-value store', 'No joins or multi-key constraints.'], ['A document store with embedded balances', 'Cross-document invariants are harder to enforce.'], ['A cache', 'Not durable storage.']], answer: 0, explanation: 'ACID transactions across rows, constraints and SQL reporting are relational strengths.' }),
  mcq({ ...q(NS), id: 'dbms.ns.q3', type: 'design', difficulty: 'medium', stem: 'In a document store, a viral post can receive millions of comments. Where should comments go?', options: ['In a separate collection referencing the post id', ['Embedded as an array in the post document', 'Unbounded growth hits document size limits and makes updates slow.'], ['In the user documents', 'They would be scattered and hard to list per post.'], ['Nowhere; compute them', 'They are user data.']], answer: 0, explanation: 'Reference large, unbounded child data; embed only bounded data such as the latest few comments.' }),
  mcq({ ...q(NS), id: 'dbms.ns.q4', type: 'concept', difficulty: 'medium', stem: 'Why do Cassandra and DynamoDB designs start from the query patterns?', options: ['Data is partitioned by key and queries are efficient only along the chosen partition and sort keys', ['They do not support indexes at all', 'They support some secondary indexes.'], ['They store data in tables like SQL', 'The model is key-partitioned, not relational.'], ['Because they lack replication', 'They replicate.']], answer: 0, explanation: 'Ad-hoc queries that do not follow the key design require scans or extra tables/indexes.' }),
  mcq({ ...q(NS), id: 'dbms.ns.q5', type: 'concept', difficulty: 'easy', stem: 'Which statement is accurate?', options: ['Several NoSQL systems now offer multi-item transactions, usually with limits', ['NoSQL means no query language', 'Many have rich query languages, some SQL-like.'], ['Relational databases cannot scale horizontally', 'They can, with replicas and sharding.'], ['Document stores enforce no structure ever', 'Many support schema validation.']], answer: 0, explanation: 'For example MongoDB multi-document transactions and DynamoDB TransactWriteItems.' }),
  mcq({ ...q(NS), id: 'dbms.ns.q6', type: 'scenario', difficulty: 'medium', stem: 'A fraud team wants "accounts linked to this one within 4 hops through shared devices or cards". Best fit?', options: ['A graph database', ['A key-value store', 'Lookups by key only.'], ['A relational database with 4 self-joins', 'Possible, but each hop multiplies the work.'], ['A full-text search engine', 'Not a traversal engine.']], answer: 0, explanation: 'Multi-hop traversals are the core strength of graph databases.' }),
];

// ---------------------------------------------------------------------------------------
const RS = 'dbms.replication-sharding';
const replication = dbmsTopic({
  id: RS, title: 'Replication and Sharding', level: 'core', estMinutes: 50, prerequisites: ['dbms.indexing'], related: ['sd.replication-sharding', 'sd.consistency-cap', 'dbms.distributed-transactions'],
  summary: 'Read replicas, replication lag, partitioning and shard keys.',
  objectives: ['Explain leader-follower replication, synchronous vs asynchronous modes, and failover.', 'Describe replication lag and read-your-writes, and how to work around it.', 'Compare range, hash and directory-based sharding, and choose a shard key that avoids hot spots.', 'Explain the costs sharding introduces: cross-shard queries, transactions and rebalancing.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Replication', bodyMd: `**Replication** keeps copies of the same data on several machines for **availability** (survive a node failure) and **read scaling** (serve reads from replicas).

- **Leader-follower (primary-replica):** all writes go to the leader, which ships its change log (MySQL binlog, PostgreSQL WAL) to followers. Reads can go to followers.
- **Synchronous:** the leader waits for at least one follower to confirm before acknowledging the commit. No data loss if the leader dies, higher write latency. **Semi-synchronous** (MySQL) waits for one replica.
- **Asynchronous:** the leader acknowledges immediately. Fast, but a crash can lose the most recent commits that had not reached a follower.
- **Multi-leader / leaderless** (Dynamo-style quorums): writes accepted in several places; needs conflict resolution.

**Failover:** detect that the leader is down, promote the most up-to-date follower, and redirect clients. Risks: losing unreplicated writes (async) and **split brain** (two nodes believing they are the leader), which fencing and consensus systems prevent.` },
    { id: 'lag', kind: 'example', title: 'Replication lag in practice', bodyMd: `With asynchronous replicas, a follower may be seconds behind. A user who updates their profile and immediately reloads might read the old value from a replica.

Remedies:
- **Read-your-writes:** route a user's reads to the leader for a short time after they write, or read from a replica only if it has applied the user's last write position (log sequence number).
- **Monotonic reads:** pin a user's session to one replica so they never see time go backwards.
- **Critical reads on the leader:** balances and stock levels before a purchase.
- **Monitor lag** (seconds behind source) and remove lagging replicas from the read pool.` },
    { id: 'sharding', kind: 'comparison', title: 'Sharding (horizontal partitioning)', bodyMd: `**Sharding** splits rows of a table across machines so that data and writes exceed what one machine can hold.

| Strategy | How | Pros | Cons |
|---|---|---|---|
| Range | shard by key ranges (A–F, G–M…; or by date) | range scans stay on one shard | hot spots (new dates all hit the last shard) |
| Hash | shard = hash(key) mod N (or consistent hashing) | even spread | range queries hit every shard; resharding moves data (consistent hashing moves ~1/N) |
| Directory | a lookup service maps key → shard | flexible, easy to move tenants | extra lookup, the directory must be highly available |

**Choosing a shard key:** high cardinality, evenly distributed, and present in most queries so they hit one shard (user_id for a social app, tenant_id for B2B SaaS). Avoid monotonically increasing keys with range sharding, and "celebrity" keys that concentrate traffic.

**Costs:** cross-shard joins and aggregations (scatter-gather), cross-shard transactions (two-phase commit or sagas), global unique ids (Snowflake-style ids instead of auto-increment), and rebalancing when shards fill up. Shard only after vertical scaling, indexing, caching and read replicas are exhausted.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Saying replication increases write throughput (with a single leader, every replica applies every write).
2. Ignoring replication lag when reading from replicas.
3. Picking a shard key that most queries do not include, so every query fans out to all shards.
4. Using hash(key) mod N and then changing N, which moves almost every key.
5. Sharding too early, before simpler options are exhausted.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Synchronous vs asynchronous replication?', answerMd: 'Synchronous: the leader waits for follower acknowledgement before confirming a commit, so an acknowledged write survives a leader crash, at the cost of write latency and availability if followers are slow. Asynchronous: the leader confirms immediately; faster, but the latest writes can be lost on failover and replicas can serve stale reads.' },
    { id: 'iq2', q: 'A user updates their profile but sees the old one on refresh. Why, and how do you fix it?', answerMd: 'The read went to an asynchronous replica that had not yet applied the write (replication lag). Fix with read-your-writes: read from the leader for that user for a short window after a write, or only use replicas that have caught up to the user\'s last write position.' },
    { id: 'iq3', q: 'How do you choose a shard key?', answerMd: 'Choose a key with high cardinality and even distribution that appears in most queries, so each query touches one shard and load spreads evenly (user_id, tenant_id). Avoid monotonically increasing keys with range sharding and keys with a few very hot values.' },
    { id: 'iq4', q: 'What problems does sharding introduce?', answerMd: 'Cross-shard queries become scatter-gather, joins across shards move to the application, multi-shard transactions need 2PC or sagas, auto-increment ids no longer work globally, and adding shards requires rebalancing data (consistent hashing reduces movement).' },
    { id: 'iq5', q: 'Does replication help write scalability?', answerMd: 'Not with a single leader: all writes still go through one node and every replica applies every write. Replication scales reads and availability; sharding (or multi-leader designs with conflict handling) scales writes.' },
  ],
  revision: { notesMd: `- Replication = copies for availability + read scaling; leader-follower is the default.
- Sync = no loss, slower; async = fast, possible loss + lag.
- Lag fixes: read-your-writes, monotonic reads, critical reads on the leader.
- Sharding = split rows for capacity and write scaling; range / hash / directory.
- Shard key: high cardinality, even, in most queries. Costs: scatter-gather, cross-shard txns, ids, rebalancing.`, flashcards: [
    { id: 'f1', front: 'What does replication scale?', backMd: 'Reads and availability (not writes, with a single leader).' },
    { id: 'f2', front: 'Risk of asynchronous replication on failover?', backMd: 'Losing recent commits that had not reached the follower.' },
    { id: 'f3', front: 'Read-your-writes?', backMd: 'After a user writes, their reads must reflect that write (e.g. route them to the leader briefly).' },
    { id: 'f4', front: 'Problem with range sharding on a timestamp key?', backMd: 'All new writes go to the newest shard: a hot spot.' },
    { id: 'f5', front: 'Why consistent hashing?', backMd: 'Adding a node moves only about 1/N of the keys instead of nearly all.' },
  ] },
  resources: [DBBOOK, { title: 'Replication, clustering and connection pooling (PostgreSQL wiki)', url: 'https://wiki.postgresql.org/wiki/Replication,_Clustering,_and_Connection_Pooling', kind: 'article' }],
});

const rsMcqs: MCQ[] = [
  mcq({ ...q(RS), id: 'dbms.rs.q1', type: 'concept', difficulty: 'easy', stem: 'Adding three read replicas to a single-leader database primarily improves…', options: ['Read throughput and availability', ['Write throughput', 'All writes still go through the leader and are applied on every replica.'], ['Storage capacity per row', 'Each replica stores the full data set.'], ['Join performance on the leader', 'Unrelated.']], answer: 0, explanation: 'Replicas serve reads and can take over if the leader fails.' }),
  mcq({ ...q(RS), id: 'dbms.rs.q2', type: 'scenario', difficulty: 'medium', stem: 'After changing her password, a user is rejected with the old password check failing randomly for a few seconds. Reads go to async replicas. What is happening?', options: ['Replication lag: some replicas have not applied the update yet', ['A deadlock', 'No lock cycle is involved.'], ['A lost update', 'The write succeeded on the leader.'], ['Index corruption', 'Unlikely and not intermittent like this.']], answer: 0, explanation: 'Route authentication reads (or reads right after a user\'s write) to the leader or to caught-up replicas.' }),
  mcq({ ...q(RS), id: 'dbms.rs.q3', type: 'design', difficulty: 'medium', stem: 'A multi-tenant SaaS app always queries within one company. Which shard key is best?', options: ['tenant_id', ['created_at', 'Range sharding by time creates a hot latest shard and spreads one tenant over many shards.'], ['country', 'Low cardinality and uneven.'], ['A random UUID per row', 'Even spread, but every tenant query fans out to all shards.']], answer: 0, explanation: 'Queries stay on one shard and tenants spread across shards (very large tenants may need special handling).' }),
  mcq({ ...q(RS), id: 'dbms.rs.q4', type: 'concept', difficulty: 'medium', stem: 'With shard = hash(key) mod N, what happens when N grows from 10 to 11?', options: ['Most keys map to a different shard and must move', ['About 1/11 of keys move', 'That is the behaviour of consistent hashing.'], ['No keys move', 'The modulus changes for almost every key.'], ['Only new keys are affected', 'Existing keys now hash to new shards too.']], answer: 0, explanation: 'Consistent hashing (or many virtual buckets mapped to shards) limits movement to roughly 1/N.' }),
  mcq({ ...q(RS), id: 'dbms.rs.q5', type: 'concept', difficulty: 'medium', stem: 'Which guarantee does synchronous replication add over asynchronous?', options: ['An acknowledged commit is on at least one other node, so leader failure does not lose it', ['Higher write throughput', 'Writes get slower.'], ['No replication lag for reads on every replica', 'Only the synchronous follower is guaranteed up to date.'], ['Automatic sharding', 'Unrelated.']], answer: 0, explanation: 'Durability across machines at the cost of commit latency.' }),
  mcq({ ...q(RS), id: 'dbms.rs.q6', type: 'scenario', difficulty: 'hard', stem: 'After sharding orders by order_id hash, the "orders of a customer" page became slow. Why?', options: ['A customer\'s orders are spread over all shards, so the query must fan out to every shard', ['Hash sharding disables indexes', 'Indexes still work within each shard.'], ['Joins are impossible after sharding', 'Joins within a shard are fine.'], ['Order ids are no longer unique', 'Uniqueness is unaffected.']], answer: 0, explanation: 'Choose a shard key that matches the dominant access pattern (customer_id), or maintain a secondary index by customer.' }),
];

// ---------------------------------------------------------------------------------------
const ST = 'dbms.storage-recovery';
const storage = dbmsTopic({
  id: ST, title: 'Storage and Recovery', level: 'advanced', estMinutes: 55, prerequisites: [], related: ['dbms.transactions-acid', 'dbms.indexing', 'os.file-systems'],
  summary: 'Pages, buffer pool, write-ahead logging and crash recovery.',
  objectives: ['Describe how rows live in fixed-size pages and how the buffer pool caches pages in memory.', 'Explain write-ahead logging (WAL) and why it gives atomicity and durability without writing data pages at commit.', 'Outline crash recovery with redo and undo (ARIES: analysis, redo, undo) and the role of checkpoints.', 'Compare steal/no-steal and force/no-force buffer policies.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Pages and the buffer pool', bodyMd: `Disks (and SSDs) are read in blocks, so databases store data in fixed-size **pages** (8 KB in PostgreSQL, 16 KB in InnoDB). A page holds a header, a slot directory and the tuples; an index node is also a page.

The **buffer pool** is an in-memory cache of pages. A query asks for page P: if it is cached (a hit), no I/O happens; otherwise a page is evicted (LRU-like policies, with tweaks so a large scan does not flush the whole cache) and P is read from disk. Modified pages are **dirty** and are written back later, not at every change.

Why databases manage their own cache instead of trusting the OS page cache: they need control over **when** pages reach disk (for recovery), better eviction for database access patterns, and prefetching.` },
    { id: 'wal', kind: 'concept', title: 'Write-ahead logging', bodyMd: `**Rule:** before a modified data page is written to disk, the log records describing that change must be on disk; and a transaction is committed once its **commit log record** is durable.

Each log record has a **log sequence number (LSN)** and describes a change (transaction id, page, before-image for undo, after-image for redo). Appending to a sequential log is far cheaper than writing random data pages, so commits are fast: the database can leave dirty pages in memory (**no-force**) and still guarantee durability, because the log can replay them.

| Policy | Meaning | Needs |
|---|---|---|
| Steal | dirty pages of uncommitted transactions may be written to disk | **undo** on recovery |
| No-force | committed transactions' pages need not be written at commit | **redo** on recovery |

Most systems use **steal + no-force** for performance, which is exactly why recovery needs both redo and undo. **Checkpoints** periodically record which transactions are active and which pages are dirty, bounding how much log must be scanned after a crash.` },
    { id: 'recovery', kind: 'dry-run', title: 'Crash recovery (ARIES in three passes)', bodyMd: `After a crash the database restarts and reads the log from the last checkpoint:

1. **Analysis:** rebuild the table of active transactions and dirty pages at the moment of the crash.
2. **Redo:** replay every logged change (committed or not) from the earliest dirty page's LSN, restoring the exact state of memory at the crash ("repeating history"). A change is skipped if the page's LSN shows it is already on disk.
3. **Undo:** roll back the transactions that had not committed, in reverse log order, writing compensation log records so a crash during recovery is also safe.

Example: T1 committed, T2 was active. Redo re-applies both; undo removes T2's changes. Result: exactly the committed state, which delivers **atomicity** (T2 vanishes) and **durability** (T1 survives).

**Shadow paging** is an alternative (copy-on-write pages, swap a root pointer at commit), used by some embedded and log-structured systems; LSM-tree stores (RocksDB, Cassandra) also rely on a WAL plus immutable files.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Thinking commit writes all changed data pages to disk (that is "force", which most systems avoid).
2. Believing redo is applied only for committed transactions (ARIES redoes everything, then undoes the losers).
3. Forgetting that undo is needed because of the steal policy.
4. Confusing the WAL with the replication log or a backup; it is the recovery mechanism (often also used for replication).
5. Disabling fsync for speed and still expecting durability.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is write-ahead logging and why is it used?', answerMd: 'Every change is first recorded in an append-only log, which is flushed to disk before the corresponding data pages and before a commit is acknowledged. Sequential log writes are cheap, so commits are fast while data pages are written lazily; after a crash the log is used to redo committed changes and undo uncommitted ones.' },
    { id: 'iq2', q: 'Why does recovery need both redo and undo?', answerMd: 'With no-force, committed changes may exist only in the log when the crash happens, so they must be redone. With steal, uncommitted changes may already be on disk, so they must be undone. Steal + no-force is chosen for performance.' },
    { id: 'iq3', q: 'What does a checkpoint do?', answerMd: 'It records the current active transactions and dirty pages (and may flush pages), so recovery can start from the checkpoint instead of the beginning of the log, bounding recovery time.' },
    { id: 'iq4', q: 'What is the buffer pool?', answerMd: 'The database\'s in-memory cache of disk pages. Reads hit memory when the page is cached; modified (dirty) pages are written back later, subject to the WAL rule. Its size and hit ratio are key performance factors (innodb_buffer_pool_size, shared_buffers).' },
  ],
  revision: { notesMd: `- Data lives in fixed-size pages; the buffer pool caches them; dirty pages written later.
- WAL: log before data, commit = commit record durable; LSNs order changes.
- Steal → undo needed; no-force → redo needed; most systems: steal + no-force.
- ARIES: analysis, redo (repeat history), undo (losers) with compensation records.
- Checkpoints bound recovery time.`, flashcards: [
    { id: 'f1', front: 'WAL rule?', backMd: 'Log records for a change must reach disk before the changed page, and the commit record before the commit is acknowledged.' },
    { id: 'f2', front: 'Steal policy implies…?', backMd: 'Uncommitted changes may be on disk, so recovery must undo.' },
    { id: 'f3', front: 'No-force policy implies…?', backMd: 'Committed changes may not be on disk, so recovery must redo.' },
    { id: 'f4', front: 'ARIES passes?', backMd: 'Analysis, redo, undo.' },
    { id: 'f5', front: 'Purpose of a checkpoint?', backMd: 'Limit how much log recovery must process.' },
  ] },
  resources: [CMU, DBBOOK, { title: 'Write-Ahead Logging (PostgreSQL docs)', url: 'https://www.postgresql.org/docs/current/wal-intro.html', kind: 'official-docs' }],
});

const stMcqs: MCQ[] = [
  mcq({ ...q(ST), id: 'dbms.st.q1', type: 'concept', difficulty: 'medium', stem: 'Why can a database acknowledge a commit without writing the changed data pages to disk?', options: ['The commit log record is durable, and the log can redo the changes after a crash', ['Because the OS always flushes on time', 'The OS gives no such guarantee.'], ['Because the changes are in the buffer pool, which survives crashes', 'Memory is lost on a crash.'], ['It cannot; every commit forces all pages', 'Most systems use no-force.']], answer: 0, explanation: 'Write-ahead logging makes durability depend only on the sequential log write.' }),
  mcq({ ...q(ST), id: 'dbms.st.q2', type: 'concept', difficulty: 'medium', stem: 'A buffer policy allows dirty pages of uncommitted transactions to be written to disk. What must recovery therefore do?', options: ['Undo the changes of transactions that did not commit', ['Redo committed transactions only', 'That is required by no-force, not steal.'], ['Nothing special', 'Uncommitted data on disk must be removed.'], ['Delete the log', 'The log is needed for recovery.']], answer: 0, explanation: 'Steal ⇒ undo. No-force ⇒ redo.' }),
  mcq({ ...q(ST), id: 'dbms.st.q3', type: 'concept', difficulty: 'hard', stem: 'In ARIES, which changes does the redo pass reapply?', options: ['All logged changes not yet on disk, including those of transactions that later get undone', ['Only committed transactions', 'ARIES repeats history, then undoes losers.'], ['Only changes after the last checkpoint by committed transactions', 'Redo starts from the earliest dirty page LSN and includes everything.'], ['None; ARIES uses only undo', 'Redo is essential with no-force.']], answer: 0, explanation: 'Repeating history restores the exact pre-crash state; the undo pass then rolls back uncommitted transactions.' }),
  mcq({ ...q(ST), id: 'dbms.st.q4', type: 'concept', difficulty: 'easy', stem: 'What is the purpose of the buffer pool?', options: ['Cache disk pages in memory to avoid I/O', ['Store the transaction log', 'The log has its own buffer and files.'], ['Hold query results for clients', 'That is a result cache, if any.'], ['Replicate data to other nodes', 'Unrelated.']], answer: 0, explanation: 'A high hit ratio means most page requests are served from memory.' }),
  mcq({ ...q(ST), id: 'dbms.st.q5', type: 'concept', difficulty: 'medium', stem: 'Why do databases take periodic checkpoints?', options: ['To bound how much log must be processed during crash recovery', ['To commit all open transactions', 'Checkpoints do not commit transactions.'], ['To compress the database', 'Unrelated.'], ['To release locks', 'Unrelated.']], answer: 0, explanation: 'Recovery can start from the last checkpoint\'s information instead of the beginning of the log.' }),
  mcq({ ...q(ST), id: 'dbms.st.q6', type: 'scenario', difficulty: 'medium', stem: 'Someone disables fsync on the log to speed up writes. What is the risk?', options: ['A power loss can lose commits that were acknowledged, or corrupt the database', ['Slower reads', 'Reads are unaffected.'], ['Deadlocks', 'Unrelated.'], ['No risk; the buffer pool is durable', 'Memory is volatile.']], answer: 0, explanation: 'Durability depends on the log really reaching stable storage before acknowledging a commit.' }),
];

// ---------------------------------------------------------------------------------------
const QP = 'dbms.query-processing';
const queryProcessing = dbmsTopic({
  id: QP, title: 'Query Processing', level: 'advanced', estMinutes: 55, prerequisites: [], related: ['sql.explain-optimisation', 'dbms.indexing', 'dbms.relational-algebra'],
  summary: 'Join algorithms and cost-based optimisation.',
  objectives: ['Trace a query from SQL through parsing, rewriting and optimisation to an execution plan.', 'Compare nested-loop, index nested-loop, hash and sort-merge joins and when each wins.', 'Explain cost-based optimisation: statistics, cardinality estimates and join ordering.', 'Explain why bad estimates lead to bad plans, and what pipelining and materialisation mean.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'From SQL to a plan', bodyMd: `1. **Parse:** SQL text → syntax tree; check names and types against the catalogue.
2. **Rewrite:** expand views, simplify predicates, decorrelate subqueries where possible.
3. **Optimise:** enumerate equivalent plans (join orders, access paths, join algorithms) and pick the cheapest according to a **cost model** that estimates I/O and CPU from **statistics** (row counts, distinct values, histograms).
4. **Execute:** run the plan as a tree of operators. In the classic iterator (Volcano) model each operator pulls rows from its children with next(), so rows **pipeline** through without being stored; blocking operators (sort, hash build) must consume their input first.

EXPLAIN shows step 3's result; EXPLAIN ANALYZE also runs step 4 and shows actual row counts, the best way to spot bad estimates.` },
    { id: 'joins', kind: 'comparison', title: 'Join algorithms', bodyMd: `For R (outer) ⋈ S (inner) on R.a = S.b:

| Algorithm | How | Cost (roughly) | Best when |
|---|---|---|---|
| Nested loop | for each R row, scan S | O(|R| · |S|) | tiny inputs |
| Block nested loop | for each block of R, scan S | O(pages(R) · pages(S) / buffer) | no index, small-ish inputs |
| Index nested loop | for each R row, look up S via an index on b | O(|R| · log |S|) | small outer side, index on the inner join key |
| Hash join | build a hash table on the smaller input, probe with the other | O(|R| + |S|) | equality joins on large unsorted inputs (needs memory; spills to disk otherwise) |
| Sort-merge join | sort both on the key (or use sorted indexes), then merge | O(|R| log |R| + |S| log |S|), O(|R| + |S|) if pre-sorted | inputs already sorted, range-ordered output needed |

Only nested-loop variants support arbitrary (non-equality) join conditions. MySQL got hash joins in 8.0.18; before that, index nested loop was the main tool, which is why indexing foreign keys mattered so much.` },
    { id: 'optimisation', kind: 'example', title: 'Cost-based optimisation in practice', bodyMd: `**Join ordering** dominates cost. For R ⋈ S ⋈ T the optimiser considers (R ⋈ S) ⋈ T, (R ⋈ T) ⋈ S, … The number of orders grows factorially, so optimisers use dynamic programming over subsets (System R style) for small joins and heuristics or genetic search for many tables.

**Selectivity estimates** drive everything: with the predicate city = 'Pune' and a histogram saying 2% of rows match, an index plan looks good. If statistics are stale and 60% of rows actually match, the index plan with millions of random lookups can be far slower than a scan. Fixes: ANALYZE / update statistics, extended statistics for correlated columns, and as a last resort hints.

**Pushdown:** apply selections and projections as early as possible (see the relational algebra equivalences) so joins see fewer, narrower rows.

**Materialisation vs pipelining:** a CTE or subquery may be computed fully (materialised) or streamed into the parent; streaming saves memory and lets LIMIT stop early.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Assuming the optimiser always picks the best plan; it picks the cheapest *estimated* plan.
2. Forgetting that hash joins need memory and only handle equality conditions.
3. Believing nested loops are always bad; index nested loop with a small outer input is often optimal.
4. Never refreshing statistics after bulk loads.
5. Writing queries that hide predicates from the optimiser (functions on columns, OR across tables).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Compare hash join and sort-merge join.', answerMd: 'Hash join builds a hash table on the smaller input and probes it with the larger: linear time for equality joins, needs memory (spills to disk partitions otherwise), output unsorted. Sort-merge sorts both inputs on the join key and merges them: good when inputs are already sorted or sorted output is useful, and it can handle some range conditions; sorting costs O(n log n) otherwise.' },
    { id: 'iq2', q: 'When is a nested-loop join the best choice?', answerMd: 'When the outer input is small and the inner side has an index on the join key (index nested loop): each outer row triggers a cheap index lookup. It is also the only option for arbitrary non-equality join conditions.' },
    { id: 'iq3', q: 'What is cost-based optimisation?', answerMd: 'The optimiser enumerates equivalent execution plans and estimates each plan\'s cost from table statistics (row counts, distinct values, histograms) and a cost model of I/O and CPU, then picks the cheapest. Its quality depends on accurate cardinality estimates.' },
    { id: 'iq4', q: 'A query became slow after a big data load, with no code change. What would you check?', answerMd: 'Stale statistics leading to a different (bad) plan: compare EXPLAIN ANALYZE estimated vs actual rows, refresh statistics (ANALYZE), and check whether the plan switched join algorithm or join order.' },
  ],
  revision: { notesMd: `- Parse → rewrite → optimise (cost model + statistics) → execute (iterator/pipelines).
- Joins: nested loop (tiny/any condition), index NL (small outer + index), hash (equality, large, memory), sort-merge (sorted inputs).
- Join order matters most; DP over subsets for small joins.
- Bad estimates → bad plans; keep statistics fresh; EXPLAIN ANALYZE compares estimates with actuals.`, flashcards: [
    { id: 'f1', front: 'Which join algorithm handles only equality conditions and needs memory?', backMd: 'Hash join.' },
    { id: 'f2', front: 'Index nested-loop join is best when…?', backMd: 'The outer side is small and the inner join column is indexed.' },
    { id: 'f3', front: 'What drives a cost-based optimiser\'s choices?', backMd: 'Cardinality estimates from statistics, plugged into a cost model.' },
    { id: 'f4', front: 'Pipelining?', backMd: 'Rows flow between operators without materialising intermediate results.' },
    { id: 'f5', front: 'First thing to check when a plan suddenly changes after a bulk load?', backMd: 'Stale statistics (run ANALYZE).' },
  ] },
  resources: [CMU, { title: 'Planner/optimizer (PostgreSQL docs)', url: 'https://www.postgresql.org/docs/current/planner-optimizer.html', kind: 'official-docs' }],
});

const qpMcqs: MCQ[] = [
  mcq({ ...q(QP), id: 'dbms.qp.q1', type: 'concept', difficulty: 'medium', stem: 'Joining a 50-row filtered table to a 50-million-row table on an indexed key. Which join is likely best?', options: ['Index nested-loop join (50 index lookups)', ['Hash join building on the large table', 'Building a 50-million-row hash table is wasteful here.'], ['Cartesian product then filter', 'Far too large.'], ['Sort-merge after sorting both', 'Sorting 50 million rows is unnecessary.']], answer: 0, explanation: 'Each of the 50 outer rows needs one cheap B+ tree lookup.' }),
  mcq({ ...q(QP), id: 'dbms.qp.q2', type: 'concept', difficulty: 'medium', stem: 'Which join algorithm cannot be used for the condition `a.start < b.time AND b.time < a.end`?', options: ['Hash join', ['Nested-loop join', 'Nested loops handle any condition.'], ['Block nested-loop join', 'Also handles any condition.'], ['Index nested loop with a B+ tree on b.time', 'A range lookup works with a B+ tree.']], answer: 0, explanation: 'Hashing only finds equal keys.' }),
  mcq({ ...q(QP), id: 'dbms.qp.q3', type: 'concept', difficulty: 'easy', stem: 'What does a cost-based optimiser use to estimate how many rows a predicate returns?', options: ['Table and column statistics (row counts, distinct values, histograms)', ['The query text length', 'Unrelated.'], ['Random sampling at every execution', 'Statistics are gathered beforehand.'], ['The order of tables in FROM only', 'Order in the text does not determine cost.']], answer: 0, explanation: 'Stale statistics are a common source of bad plans.' }),
  mcq({ ...q(QP), id: 'dbms.qp.q4', type: 'scenario', difficulty: 'medium', stem: 'EXPLAIN ANALYZE shows a step estimated at 100 rows that actually produced 2 million. What is the likely consequence?', options: ['The optimiser chose a plan (e.g. nested loops) that is far too slow for the real row count', ['Nothing; estimates do not affect plans', 'Plans are chosen from estimates.'], ['The query returns wrong results', 'Plans differ in speed, not correctness.'], ['The index becomes corrupted', 'Unrelated.']], answer: 0, explanation: 'Refresh statistics or add extended statistics so the estimate matches reality.' }),
  mcq({ ...q(QP), id: 'dbms.qp.q5', type: 'concept', difficulty: 'medium', stem: 'Why is choosing the join order important for a 5-table query?', options: ['Intermediate result sizes, and so the cost, can differ by orders of magnitude between orders', ['SQL requires joins in the written order', 'The optimiser may reorder inner joins.'], ['Only the first join is executed', 'All joins execute.'], ['The result changes with the order', 'Inner joins are associative and commutative.']], answer: 0, explanation: 'Joining the most selective tables first keeps intermediate results small.' }),
  mcq({ ...q(QP), id: 'dbms.qp.q6', type: 'concept', difficulty: 'hard', stem: 'Which operator is blocking (must consume its whole input before producing output) in the iterator model?', options: ['Sort (for ORDER BY without a suitable index)', ['Selection σ', 'Filters row by row.'], ['Projection π without DISTINCT', 'Row by row.'], ['The probe side of a hash join', 'Probing streams; the build side blocks.']], answer: 0, explanation: 'A sort cannot output the first row until it has seen every input row; LIMIT cannot stop it early.' }),
];

// ---------------------------------------------------------------------------------------
const DT = 'dbms.distributed-transactions';
const distributed = dbmsTopic({
  id: DT, title: 'Distributed Transactions', level: 'advanced', estMinutes: 50, prerequisites: [], related: ['dbms.replication-sharding', 'sd.messaging', 'sd.distributed-fundamentals'],
  summary: 'Two-phase commit, its costs, and sagas.',
  objectives: ['Explain two-phase commit (prepare, commit) and what each participant must guarantee after voting yes.', 'Describe 2PC failure modes, especially the blocking problem when the coordinator fails.', 'Design a saga with compensating actions, choosing orchestration or choreography.', 'Use the outbox pattern and idempotency to keep a database and a message broker consistent.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Two-phase commit', bodyMd: `A transaction spans several databases (shards, services). Atomicity means all commit or none do. **Two-phase commit (2PC)** uses a coordinator:

**Phase 1 (prepare):** the coordinator asks every participant "can you commit?". Each participant writes its changes and a *prepare* record to its log, keeps its locks, and votes **yes** (a promise: it will be able to commit even after a crash) or **no**.

**Phase 2 (commit/abort):** if all voted yes, the coordinator logs *commit* and tells everyone to commit; otherwise it tells everyone to abort. Participants apply the decision and release locks.

**The blocking problem:** a participant that voted yes cannot decide on its own. If the coordinator crashes after the prepare phase, prepared participants must wait, holding locks, until it recovers (or another node learns the decision). Three-phase commit and consensus-based commit (Paxos/Raft commit, as in Spanner) reduce this, at more cost.

Costs: at least two round trips plus forced log writes per participant, locks held across the network, and the coordinator as a critical component. XA is the standard interface many databases implement.` },
    { id: 'saga', kind: 'example', title: 'Sagas: a sequence of local transactions', bodyMd: `Microservices rarely use 2PC. A **saga** splits the work into local transactions, each with a **compensating action** that semantically undoes it:

| Step | Action | Compensation |
|---|---|---|
| 1 | Order service: create order (PENDING) | cancel order |
| 2 | Payment service: charge card | refund |
| 3 | Inventory service: reserve stock | release stock |
| 4 | Order service: mark CONFIRMED | (none needed) |

If step 3 fails (out of stock), run compensations in reverse: refund the payment, cancel the order.

- **Orchestration:** a central saga orchestrator calls each service and decides the next step (easy to follow and monitor).
- **Choreography:** services react to each other's events (fewer central parts, but the flow is harder to see).

Sagas give **eventual consistency**, not isolation: other requests can observe intermediate states (an order that is PENDING, money charged before stock is reserved). Mitigations include semantic locks (status fields), reordering steps (reserve stock before charging), and making every step and compensation **idempotent** so retries are safe.` },
    { id: 'outbox', kind: 'comparison', title: 'Keeping a database and a broker consistent: the outbox', bodyMd: `"Save the order and publish an OrderCreated event" is a dual write: if the service crashes between the two, one happens without the other.

**Transactional outbox:** in the same local transaction, insert the order and an outbox row (the event). A relay process (polling or change-data-capture such as Debezium) publishes outbox rows to the broker and marks them sent. Delivery is **at least once**, so consumers must be **idempotent** (deduplicate by event id).

| Approach | Atomicity | Availability | Typical use |
|---|---|---|---|
| 2PC / XA | strong | blocks on coordinator failure | within one organisation's databases, rare in microservices |
| Saga + outbox | eventual | high | microservice workflows (orders, bookings) |
| Single database transaction | strong | — | best option when the data can live together |` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Thinking 2PC is non-blocking; prepared participants wait if the coordinator disappears.
2. Writing to the database and publishing to a queue as two independent steps (dual write).
3. Compensations that are not idempotent or that cannot run after partial failures.
4. Expecting sagas to provide isolation.
5. Splitting data across services when a single database transaction would have been simpler.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain two-phase commit and its main weakness.', answerMd: 'A coordinator asks all participants to prepare (persist changes and promise they can commit); if every vote is yes it tells them to commit, otherwise to abort. Weakness: it is blocking. A participant that voted yes must keep its locks and wait for the decision if the coordinator crashes, and every transaction pays extra round trips and log flushes.' },
    { id: 'iq2', q: 'What is a saga?', answerMd: 'A sequence of local transactions across services, each with a compensating action. If a step fails, the compensations of the completed steps run in reverse order. It provides eventual consistency without distributed locks, but intermediate states are visible.' },
    { id: 'iq3', q: 'How do you reliably publish an event when a database row changes?', answerMd: 'Transactional outbox: write the event to an outbox table in the same transaction as the business change, and have a separate relay (polling or CDC) publish it, giving at-least-once delivery. Consumers deduplicate by event id.' },
    { id: 'iq4', q: 'Orchestration vs choreography in sagas?', answerMd: 'Orchestration: a central coordinator issues commands to each service and tracks the saga\'s state, which makes the flow explicit and easier to monitor. Choreography: services publish and subscribe to events with no central coordinator, reducing coupling to one component but making the overall flow harder to understand and debug.' },
  ],
  revision: { notesMd: `- 2PC: prepare (persist + vote) → commit/abort; blocking if the coordinator fails; costly.
- Saga: local transactions + compensations in reverse on failure; eventual consistency, no isolation.
- Orchestration (central) vs choreography (events).
- Outbox: event row in the same transaction + relay; consumers idempotent.
- Prefer a single database transaction when possible.`, flashcards: [
    { id: 'f1', front: 'What does a participant promise when it votes yes in 2PC?', backMd: 'That it can commit even after a crash (changes and prepare record are durable), and it keeps its locks until the decision.' },
    { id: 'f2', front: 'Main weakness of 2PC?', backMd: 'It blocks prepared participants if the coordinator fails.' },
    { id: 'f3', front: 'Saga failure handling?', backMd: 'Run the compensating actions of completed steps in reverse order.' },
    { id: 'f4', front: 'Dual-write problem fix?', backMd: 'The transactional outbox pattern.' },
    { id: 'f5', front: 'Why must saga steps be idempotent?', backMd: 'Messages are delivered at least once, so steps and compensations may run more than once.' },
  ] },
  resources: [CMU, { title: 'Two-phase commit protocol (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Two-phase_commit_protocol', kind: 'article' }, { title: 'Pattern: Saga (microservices.io)', url: 'https://microservices.io/patterns/data/saga.html', kind: 'article' }],
});

const dtMcqs: MCQ[] = [
  mcq({ ...q(DT), id: 'dbms.dt.q1', type: 'concept', difficulty: 'medium', stem: 'In 2PC, a participant has voted yes and then loses contact with the coordinator. What may it do?', options: ['Wait (holding locks) until it learns the decision', ['Commit on its own', 'Others may have voted no.'], ['Abort on its own', 'The coordinator may already have decided to commit.'], ['Vote again', 'Votes are final.']], answer: 0, explanation: 'This is the blocking problem of two-phase commit.' }),
  mcq({ ...q(DT), id: 'dbms.dt.q2', type: 'design', difficulty: 'medium', stem: 'In an order saga, payment succeeded but stock reservation failed. What happens next?', options: ['Run compensations in reverse: refund the payment, then cancel the order', ['Roll back all services with a global transaction', 'Sagas have no global rollback.'], ['Retry the payment', 'Payment already succeeded.'], ['Leave the order pending forever', 'The saga must reach a consistent end state.']], answer: 0, explanation: 'Each completed local transaction is semantically undone by its compensation.' }),
  mcq({ ...q(DT), id: 'dbms.dt.q3', type: 'scenario', difficulty: 'medium', stem: 'A service saves an order and then publishes an event to Kafka. Sometimes events are missing after crashes. Best fix?', options: ['Write the event to an outbox table in the same DB transaction and publish it from a relay', ['Publish first, then save the order', 'Then orders can be missing for published events.'], ['Retry publishing inside the request three times', 'A crash still loses it.'], ['Use a longer timeout', 'Does not make the two writes atomic.']], answer: 0, explanation: 'The outbox turns a dual write into one local transaction plus at-least-once delivery.' }),
  mcq({ ...q(DT), id: 'dbms.dt.q4', type: 'concept', difficulty: 'easy', stem: 'Which property do sagas NOT provide?', options: ['Isolation: intermediate states are visible to other requests', ['Eventual consistency', 'They aim for it.'], ['Recovery from failures via compensation', 'That is their mechanism.'], ['Use of local ACID transactions', 'Each step is one.']], answer: 0, explanation: 'Design for visible intermediate states (status fields, careful step ordering).' }),
  mcq({ ...q(DT), id: 'dbms.dt.q5', type: 'concept', difficulty: 'medium', stem: 'Why must event consumers be idempotent when using the outbox pattern?', options: ['The relay delivers at least once, so the same event can arrive twice', ['Events arrive out of order only', 'Duplicates are the main issue here.'], ['Kafka deletes events', 'Retention is not the reason.'], ['Idempotency makes events smaller', 'Unrelated.']], answer: 0, explanation: 'Deduplicate by event id or make the handler naturally idempotent.' }),
  mcq({ ...q(DT), id: 'dbms.dt.q6', type: 'concept', difficulty: 'medium', stem: 'Orchestration vs choreography: which statement is correct?', options: ['Orchestration has a central coordinator that drives each step; choreography relies on services reacting to events', ['Choreography always uses 2PC', 'Neither uses 2PC.'], ['Orchestration cannot compensate', 'The orchestrator triggers compensations.'], ['They are the same', 'They differ in where the control flow lives.']], answer: 0, explanation: 'Orchestration makes the workflow explicit; choreography reduces central coupling.' }),
];

export const topics: Topic[] = [sqlNoSql, replication, storage, queryProcessing, distributed];
export const mcqs: MCQ[] = [...nsMcqs, ...rsMcqs, ...stMcqs, ...qpMcqs, ...dtMcqs];
