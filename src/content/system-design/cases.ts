import type { MCQ, Topic } from '../schema';
import { mcq } from '../helpers';
import { PRIMER, q, sdTopic } from './common';

// System Design case studies, batch 1: rate limiter, pastebin, notification service, file
// storage and chat. Each follows requirements -> estimates -> API/data -> design -> deep dive
// and ends with a new-grad vs senior expectation callout. Numbers are recomputed in
// tests/sd-facts.test.ts.

// ---------------------------------------------------------------------------------------
const RL = 'sd.case-rate-limiter';
const rateLimiter = sdTopic({
  id: RL, title: 'Case Study: Rate Limiter', level: 'core', estMinutes: 55, prerequisites: ['sd.rate-limiting'], related: ['sd.case-api-gateway', 'sd.caching', 'sd.fault-tolerance'],
  summary: 'Designing a distributed rate limiter.',
  objectives: ['Scope a rate limiter: who is limited, by what key, at which limit, and what happens on rejection.', 'Choose an algorithm and implement the check atomically in a shared store.', 'Handle distribution: central vs local counters, race conditions and failure of the limiter.', 'Return correct responses (429, Retry-After) and make limits configurable.'],
  sections: [
    { id: 'requirements', kind: 'concept', title: '1. Requirements and estimates', bodyMd: `**Functional:** limit requests per **client key** (API key, user id or IP) per rule (for example 100 requests/minute per user, 10 login attempts/minute per IP); different limits per endpoint and tier; reject excess with a clear response.
**Non-functional:** adds **< 5 ms** to each request; **highly available** (the limiter must not take the product down); accurate enough (small overshoot acceptable); works across **many API servers**; configurable without redeploy.

Estimate: 100k requests/s across the fleet; 10M active keys. A counter entry (key + counter + expiry) in Redis costs roughly 100–150 bytes with overhead, so 10M keys ≈ **1–1.5 GB**: fits a single Redis node's memory, with a replica and shards for throughput (each check is an O(1) in-memory operation, handling ~100k ops/s per node).` },
    { id: 'algorithm', kind: 'comparison', title: '2. Algorithm choice', bodyMd: `| Algorithm | Memory per key | Pros | Cons |
|---|---|---|---|
| **Fixed window counter** | 1 counter | trivial, cheap | burst of up to **2× the limit** across a window boundary |
| **Sliding window log** | one timestamp per request | exact | memory heavy at high limits |
| **Sliding window counter** | 2 counters | cheap, smooth, good approximation | slightly approximate |
| **Token bucket** | tokens + last refill time | allows controlled bursts, widely used | two fields to update atomically |
| **Leaky bucket** | queue/level | smooth constant output rate | no bursts; queue management |

**Sliding window counter** estimates the rolling window as \`previous_count × (1 − elapsed_fraction) + current_count\`. Example: limit 100/min, previous minute had 80 requests, current minute has 30, and we are 25% into the current minute: 80 × 0.75 + 30 = **90** → allow (under 100).

A strong default for APIs: **token bucket** (refill rate = sustained limit, capacity = allowed burst).` },
    { id: 'design', kind: 'visual', title: '3. High-level design', bodyMd: `Client → (CDN/WAF for coarse IP limits) → **API gateway / middleware with a limiter** → **Redis (shared counters)** → application servers. A **rules service/config store** supplies the limits (cached locally).

**Check flow:**
1. Build the key: \`rl:{rule}:{client_id}\`.
2. Run an **atomic** "check-and-update" in Redis. A **Lua script** (or \`INCR\` + \`EXPIRE\` for fixed windows) does read-modify-write in one step; a separate GET then SET would let two concurrent requests both read 99 and both pass (a race).
3. If allowed, forward the request with headers \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`. If denied, return **429 Too Many Requests** with \`Retry-After\`.

\`\`\`
-- token bucket in Redis (pseudo-Lua): tokens = min(cap, tokens + (now - last) * rate)
-- if tokens >= 1 then tokens = tokens - 1; allow else deny   (all inside one script)
\`\`\`

**Where to place it:** in the **gateway/middleware** (central, consistent, one place to change), not in each service. For very hot paths add a **local in-memory pre-check** to cut Redis calls.` },
    { id: 'deep', kind: 'concept', title: '4. Deep dives: distribution and failure', bodyMd: `- **Many servers, one limit:** a shared Redis gives a global count. Per-server local counters (limit ÷ N) avoid the network hop but are inaccurate if load is uneven. A hybrid syncs local counters to Redis periodically (**approximate** global limits, high speed).
- **Redis as hot spot:** shard keys across a Redis cluster by key hash; one very hot client key is still a single-key hotspot (accept it, or limit at the edge first).
- **Limiter failure policy:** if Redis is unreachable, **fail open** (allow traffic, protect availability) for most APIs, or **fail closed** for security-critical limits such as login attempts or SMS sends. Decide per rule and alert loudly.
- **Race conditions:** use atomic scripts, never read-then-write from application code. Multi-datacentre: either limit per region or accept eventual consistency.
- **Time:** use the store's clock (Redis \`TIME\`) rather than each server's, to avoid clock skew.
- **Fairness and abuse:** identify clients by API key/user when authenticated, by IP otherwise (careful with NAT and proxies: use \`X-Forwarded-For\` only from trusted proxies). Add progressive penalties (temporary ban) for repeat offenders.
- **Observability:** metrics on allowed/denied per rule, so a wrong limit is noticed quickly.

**New-grad vs senior:** a new grad should pick an algorithm, explain the atomicity issue and Redis-based design, and return 429 properly. Seniors discuss fail-open vs fail-closed, multi-region accuracy, hot keys, dynamic rule distribution, and layering (edge, gateway, per-service) with cost.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Non-atomic read-then-write counters (race conditions let bursts through).
2. Fixed windows without mentioning the boundary burst.
3. In-memory counters on each server, then scaling to many servers.
4. No decision for limiter outage (fail open or closed).
5. Rate limiting by IP only (shared NAT, proxies, spoofed headers).
6. Dropping requests silently instead of a clear 429 with Retry-After.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Design a distributed rate limiter (2-minute summary).', answerMd: 'Rules keyed by user/API key/IP. A limiter in the API gateway checks a shared Redis using a token bucket or sliding window counter implemented as an atomic Lua script, then allows the request or returns 429 with Retry-After. Counters expire automatically, Redis is replicated and sharded, rules come from a cached config service, and the limiter fails open for ordinary endpoints and closed for sensitive ones. Metrics track allow/deny.' },
    { id: 'iq2', q: 'What goes wrong with a fixed window counter?', answerMd: 'A client can send the full limit at the end of one window and again at the start of the next, producing up to twice the limit in a short interval. Sliding windows or token buckets smooth that out.' },
    { id: 'iq3', q: 'Why must the check-and-increment be atomic?', answerMd: 'With separate read and write steps, two concurrent requests can both read the same count below the limit and both be allowed, exceeding the limit. An atomic Redis script (or INCR) serialises the decision.' },
    { id: 'iq4', q: 'If the rate-limiter store goes down, should requests be allowed?', answerMd: 'Usually yes (fail open) so the limiter does not cause an outage, with alerts and maybe a coarse local limit as fallback. For abuse-sensitive operations such as login or OTP sending, fail closed or use a strict local limit.' },
    { id: 'iq5', q: 'How do you rate limit across several data centres?', answerMd: 'Either limit per region (simple, fast, allows up to N × limit globally), or replicate counters asynchronously for approximate global limits, or route each client\'s limit to a home region. Choose according to how strict the limit must be.' },
  ],
  revision: { notesMd: `- Key = client + rule; algorithm: token bucket / sliding window counter; fixed window has a 2× boundary burst.
- Sliding window counter: prev × (1 − elapsed) + curr (80×0.75 + 30 = 90).
- Atomic check in Redis (Lua / INCR+EXPIRE); use Redis clock; shard keys.
- 429 + Retry-After + X-RateLimit-* headers. Place in gateway; local pre-check optional.
- Outage policy: fail open (default) vs fail closed (login/OTP). Metrics per rule.`, flashcards: [
    { id: 'f1', front: 'Status code when rate limited?', backMd: '429 Too Many Requests, with Retry-After.' },
    { id: 'f2', front: 'Why Lua in Redis?', backMd: 'Makes read-modify-write atomic.' },
    { id: 'f3', front: 'Fixed window weakness?', backMd: 'Up to 2× burst around the window boundary.' },
    { id: 'f4', front: 'Sliding window counter formula?', backMd: 'prev × (1 − elapsed fraction) + current.' },
    { id: 'f5', front: 'Fail open or closed for login attempts?', backMd: 'Closed (or a strict local limit).' },
  ] },
  resources: [PRIMER, { title: 'Stripe: Scaling your API with rate limiters', url: 'https://stripe.com/blog/rate-limiters', kind: 'article' }, { title: 'Redis: INCR pattern for rate limiting', url: 'https://redis.io/docs/latest/commands/incr/', kind: 'official-docs' }],
});

const rlMcqs: MCQ[] = [
  mcq({ ...q(RL), id: 'sd.crl.q1', type: 'complexity', difficulty: 'medium', stem: 'A sliding-window-counter limiter allows 100 requests/min. The previous minute had 80 requests, the current minute so far has 30, and we are 25% through the current minute. What is the weighted count?', options: ['90', ['110', 'That adds the full previous window.'], ['30', 'That ignores the previous window.'], ['105', 'That weights the previous window by 25% instead of 75%.']], answer: 0, explanation: '80 × (1 − 0.25) + 30 = 90, under the limit of 100, so the request is allowed.' }),
  mcq({ ...q(RL), id: 'sd.crl.q2', type: 'concept', difficulty: 'medium', stem: 'Two API servers each read a counter value of 99 (limit 100) from Redis, then each writes 100. What is the flaw?', options: ['The check-then-update was not atomic, so both requests were allowed and the limit was exceeded', ['Redis cannot store counters', 'It can.'], ['The limit should have been 99', 'The issue is concurrency.'], ['TTLs were too long', 'Unrelated.']], answer: 0, explanation: 'Use an atomic script or INCR so the read and update happen as one step.' }),
  mcq({ ...q(RL), id: 'sd.crl.q3', type: 'concept', difficulty: 'easy', stem: 'What should a rejected request receive?', options: ['429 Too Many Requests with a `Retry-After` header', ['500 Internal Server Error', 'This is not a server fault.'], ['200 OK with an empty body', 'Hides the rejection.'], ['301 Moved Permanently', 'Unrelated.']], answer: 0, explanation: 'Tell clients clearly when they can retry.' }),
  mcq({ ...q(RL), id: 'sd.crl.q4', type: 'concept', difficulty: 'medium', stem: 'The Redis cluster that backs the limiter becomes unreachable. For a public product-catalogue API, what is the usual policy?', options: ['Fail open (allow requests) and alert, so the limiter does not cause an outage', ['Fail closed and reject all traffic', 'Turns a limiter failure into a full outage.'], ['Shut down the API servers', 'Worse.'], ['Switch to unlimited retries for clients', 'Unrelated.']], answer: 0, explanation: 'For security-sensitive endpoints (login, OTP) failing closed may be preferred.' }),
  mcq({ ...q(RL), id: 'sd.crl.q5', type: 'concept', difficulty: 'easy', stem: 'Which algorithm permits a controlled burst while enforcing a sustained rate?', options: ['Token bucket', ['Fixed window with no burst handling', 'Allows boundary bursts, but not in a controlled way.'], ['Random sampling', 'Not a rate limit.'], ['Round robin', 'Unrelated.']], answer: 0, explanation: 'Capacity sets the burst size; the refill rate sets the sustained limit.' }),
  mcq({ ...q(RL), id: 'sd.crl.q6', type: 'scenario', difficulty: 'medium', stem: 'You limit by client IP. A large university shares one public NAT address, and its students are blocked. What is a reasonable improvement?', options: ['Limit by authenticated user or API key where available, and use IP limits only as a coarse backstop', ['Remove rate limiting', 'Opens the service to abuse.'], ['Lower the per-IP limit', 'Worsens the problem.'], ['Block the university', 'Unfair.']], answer: 0, explanation: 'Identify callers by the most specific stable key you can authenticate.' }),
];

// ---------------------------------------------------------------------------------------
const PB = 'sd.case-pastebin';
const pastebin = sdTopic({
  id: PB, title: 'Case Study: Pastebin', level: 'core', estMinutes: 50, prerequisites: ['sd.estimation'], related: ['sd.case-url-shortener', 'sd.caching', 'sd.databases'],
  summary: 'Object storage, expiry and read-heavy traffic.',
  objectives: ['Estimate storage and bandwidth for a read-heavy text-sharing service.', 'Separate metadata (database) from content (object storage) and justify it.', 'Design key generation, expiry/cleanup and caching.', 'Discuss abuse handling and privacy of unlisted pastes.'],
  sections: [
    { id: 'requirements', kind: 'concept', title: '1. Requirements and estimates', bodyMd: `**Functional:** create a paste (text, optional title, language, expiry, visibility public/unlisted), get a paste by its short key, optional deletion by the owner. **Out of scope:** accounts and search (mention as extensions).
**Non-functional:** reads are fast (< 200 ms); high availability for reads; durable; pastes expire automatically; unguessable keys for unlisted pastes.

**Estimates:** 1M new pastes/day, average 10 KB, read:write = 5:1.
- Writes: 10⁶ / 86,400 ≈ **12/s**; reads ≈ **58/s** average (peak a few hundred/s).
- Storage: 1M × 10 KB = **10 GB/day** → about **18 TB over 5 years** (1.83 billion pastes), more than one comfortable database but trivial for object storage.
- Keys: 1.83 × 10⁹ pastes; 8 base62 characters give 62⁸ ≈ 2.2 × 10¹⁴ combinations, so random keys collide rarely and are practically unguessable.` },
    { id: 'design', kind: 'visual', title: '2. Design: metadata and content split', bodyMd: `\`\`\`
POST /v1/pastes   { "content": "...", "expires_in": 86400, "visibility": "unlisted" } -> 201 { "key": "k3Jx9aQz" }
GET  /v1/pastes/{key}                                                                 -> 200 { content, created_at, ... } | 404 | 410
\`\`\`

- **Metadata** (key, owner, created_at, expires_at, size, language, visibility, content location) is small and queried by key: a relational or key-value database.
- **Content** (text up to e.g. 10 MB) goes to **object storage** (S3-style): cheap, durable and effectively unlimited; the metadata row stores the object path.
- **Write path:** the app server generates a random 8-character key (retry on a unique-constraint conflict, or pre-generate keys with a **key generation service** that hands out unused keys in batches), uploads the content, inserts the metadata, returns the key.
- **Read path:** CDN/edge cache → cache (Redis) → database for metadata → object store for content. Small pastes can be cached whole; popular pastes stay in memory.
- **Immutable content** is a gift: pastes are never edited, so **caches never need invalidation** except on delete or expiry, and they can be cached for a long time at the CDN.

Components: load balancer → stateless API servers → cache → metadata DB (with replicas) → object store, plus a cleanup worker.` },
    { id: 'expiry', kind: 'concept', title: '3. Expiry, cleanup and abuse', bodyMd: `- **Check on read:** if \`expires_at\` is in the past, return **410 Gone** (or 404) even before cleanup has run, so correctness doesn't depend on the background job.
- **Cleanup:** a scheduled worker deletes expired rows and objects in batches (index on \`expires_at\`); object stores also support **lifecycle rules** that delete objects after N days. Deletion from caches uses TTLs set to the remaining lifetime.
- **Unlisted privacy:** random 8-character keys act as capability URLs; they must not appear in public listings or be sequential. Rate limit creation and key probing (404 floods).
- **Abuse:** limit paste size and creation rate, scan for malware/spam and illegal content, offer a report/takedown path, serve content as plain text with correct headers (\`Content-Type: text/plain\`, \`X-Content-Type-Options: nosniff\`) so pasted HTML or scripts can't execute (XSS).
- **Scaling:** read replicas for metadata; shard by key hash if needed; object storage scales by itself; add a CDN for hot pastes.
- **Durability:** replicate the metadata DB; object stores replicate across zones.

**New-grad vs senior:** a new grad should split metadata from blobs, justify key generation, cover expiry and caching. Seniors add multi-region reads, cost tiering (cold storage for old pastes), abuse pipelines, and capacity planning of the key service.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Storing 10 KB–10 MB blobs in the relational database.
2. Sequential keys for private pastes.
3. Relying only on the cleanup job for expiry (stale pastes remain readable).
4. Serving pasted content as HTML.
5. Forgetting that immutable data makes aggressive caching easy.
6. No size and rate limits.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Design Pastebin.', answerMd: 'Metadata (key, expiry, size, owner, visibility, blob path) in a database; content in object storage. Write: generate a random 8-character base62 key, upload content, save metadata, return the key. Read: CDN, then Redis, then the database and object store. Expiry is enforced on read and cleaned by a batch job or storage lifecycle rules. Rate limit and scan for abuse.' },
    { id: 'iq2', q: 'Why store content in object storage and not in the database?', answerMd: 'Blobs are large and rarely queried; object storage is cheaper, scales almost infinitely, is highly durable and can be served through a CDN, while the database stays small and fast for key lookups.' },
    { id: 'iq3', q: 'How do you generate unique keys?', answerMd: 'Either random 8-character base62 keys with a unique constraint and retry on collision (collisions are very rare in a 2×10¹⁴ space), or a key-generation service that pre-allocates unused keys in batches to app servers, avoiding collision checks on the hot path.' },
    { id: 'iq4', q: 'How do you handle expiring pastes?', answerMd: 'Store expires_at, check it on every read (return 410 if past), run a background cleanup of expired metadata and objects, and use cache TTLs equal to the remaining lifetime. Storage lifecycle rules can delete objects automatically.' },
  ],
  revision: { notesMd: `- 1M pastes/day × 10 KB = 10 GB/day ≈ 18 TB over 5 years; 12 writes/s, ~58 reads/s.
- Metadata in DB, content in object storage; immutable → cache aggressively.
- 8-char base62 random keys (2.2×10¹⁴) or key service; unique constraint.
- Expire on read + cleanup job/lifecycle rules; 410 Gone.
- Serve as text/plain + nosniff; size and rate limits; abuse scanning.`, flashcards: [
    { id: 'f1', front: 'Where does paste content live?', backMd: 'Object storage; the database holds only metadata.' },
    { id: 'f2', front: 'Why is caching easy for pastes?', backMd: 'They are immutable, so there is nothing to invalidate except delete or expiry.' },
    { id: 'f3', front: 'Status for an expired paste?', backMd: '410 Gone (or 404).' },
    { id: 'f4', front: 'Combinations for 8 base62 characters?', backMd: '≈ 2.2 × 10¹⁴.' },
    { id: 'f5', front: 'Key header to prevent script execution of pasted content?', backMd: 'Content-Type text/plain with X-Content-Type-Options: nosniff.' },
  ] },
  resources: [PRIMER, { title: 'Amazon S3 Lifecycle configuration', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html', kind: 'official-docs' }],
});

const pbMcqs: MCQ[] = [
  mcq({ ...q(PB), id: 'sd.pb.q1', type: 'complexity', difficulty: 'medium', stem: 'A pastebin receives 1 million new pastes per day at an average of 10 KB. About how much content is stored over 5 years (ignoring replication)?', options: ['About 18 TB', ['About 1.8 TB', 'Off by a factor of ten.'], ['About 180 TB', 'Off by a factor of ten.'], ['About 18 GB', 'That is under two days of data.']], answer: 0, explanation: '10 GB/day × 365 × 5 ≈ 18.25 TB.' }),
  mcq({ ...q(PB), id: 'sd.pb.q2', type: 'concept', difficulty: 'easy', stem: 'Where should the text of a 5 MB paste be stored?', options: ['In object storage, with metadata (including the object path) in the database', ['In the application server\'s memory', 'Not durable.'], ['In a cookie', 'Size limits and security issues.'], ['Only in the cache', 'Not durable.']], answer: 0, explanation: 'Object stores are cheap, durable and CDN-friendly.' }),
  mcq({ ...q(PB), id: 'sd.pb.q3', type: 'concept', difficulty: 'medium', stem: 'Why can pastes be cached aggressively at the CDN?', options: ['Content is immutable, so nothing needs invalidation except on delete or expiry', ['The CDN stores them forever regardless of deletion', 'Deletion and expiry still must be honoured.'], ['Pastes are small', 'Size is unrelated to invalidation.'], ['The CDN is faster than databases', 'True but not the reason it is safe.']], answer: 0, explanation: 'No updates means no stale-content risk.' }),
  mcq({ ...q(PB), id: 'sd.pb.q4', type: 'scenario', difficulty: 'medium', stem: 'The cleanup job is down for three days. What should the read API do for a paste whose `expires_at` has passed?', options: ['Return 410 Gone (or 404) based on `expires_at`, independent of the cleanup job', ['Serve it, since it still exists', 'Violates the expiry promise.'], ['Return 500', 'Not a server error.'], ['Extend its expiry', 'Wrong behaviour.']], answer: 0, explanation: 'Correctness must not depend on the background job; cleanup only reclaims space.' }),
  mcq({ ...q(PB), id: 'sd.pb.q5', type: 'concept', difficulty: 'medium', stem: 'A user pastes `<script>…</script>` and shares the link. How do you prevent script execution when others open it?', options: ['Serve it as `text/plain` with `X-Content-Type-Options: nosniff` (or escape/render safely in a sandbox)', ['Trust users', 'XSS risk.'], ['Compress the paste', 'Does not change how it is interpreted.'], ['Use a shorter key', 'Unrelated.']], answer: 0, explanation: 'Pasted content is untrusted input and must never be served as HTML from your origin.' }),
  mcq({ ...q(PB), id: 'sd.pb.q6', type: 'complexity', difficulty: 'easy', stem: '1 million pastes per day with a 5:1 read:write ratio gives roughly what average read rate?', options: ['About 58 reads/s', ['About 12 reads/s', 'That is the write rate.'], ['About 5,800 reads/s', 'Off by 100×.'], ['About 1 read/s', 'Far too low.']], answer: 0, explanation: '10⁶ / 86,400 ≈ 11.6 writes/s; × 5 ≈ 58 reads/s.' }),
];

// ---------------------------------------------------------------------------------------
const NT = 'sd.case-notification';
const notification = sdTopic({
  id: NT, title: 'Case Study: Notification Service', level: 'core', estMinutes: 55, prerequisites: ['sd.messaging'], related: ['sd.fault-tolerance', 'sd.rate-limiting', 'sd.observability'],
  summary: 'Fan-out, queues, retries and user preferences.',
  objectives: ['Design a multi-channel (push, SMS, email) notification pipeline around queues.', 'Handle fan-out for campaigns, retries with backoff, deduplication and idempotency.', 'Respect user preferences, quiet hours and rate limits.', 'Track delivery status and handle provider failures.'],
  sections: [
    { id: 'requirements', kind: 'concept', title: '1. Requirements and estimates', bodyMd: `**Functional:** other services send notifications (transactional: OTPs, order updates; marketing campaigns) over **push, SMS, email** (and in-app); templates with variables; **user preferences** (channels on/off, quiet hours, unsubscribe); schedule for later; track status (sent, delivered, failed, opened).
**Non-functional:** OTP/transactional latency < ~5 s; campaigns can lag minutes; **at-least-once** delivery without visible duplicates; do not lose notifications; survive provider outages; respect rate limits of providers and users.

**Estimates:** 100M notifications/day ≈ **1,160/s** average; a marketing blast to 50M users within 10 minutes means 50M / 600 s ≈ **83k/s** for ten minutes (the peak that drives the design). Payload ~1 KB.` },
    { id: 'design', kind: 'visual', title: '2. High-level design', bodyMd: `Producers (order service, auth, marketing tool) → **Notification API** (validates, authenticates, applies idempotency key) → **priority queues/topics** → **workers per channel** → **provider adapters** (FCM/APNs for push, Twilio-style SMS gateway, SES/SendGrid-style email) → users. A **status store** records the lifecycle, and **provider webhooks** report delivery/bounce.

\`\`\`
POST /v1/notifications { "user_id": "...", "type": "order_shipped", "channels": ["push","email"], "data": {...}, "idempotency_key": "..." } -> 202 Accepted { id }
\`\`\`

Pipeline steps:
1. **Accept** (202) and persist/enqueue quickly; the API never waits for the provider.
2. **Enrichment worker:** load user preferences and contact tokens, render the **template** (locale), check **opt-outs, quiet hours** and per-user frequency caps, then fan out to channel queues.
3. **Channel workers** call providers with **retry + exponential backoff + jitter**, honouring provider rate limits (token bucket per provider).
4. On final failure: **fallback channel** (push fails → SMS for critical alerts) or **dead-letter queue** plus alert.
5. Update status; webhooks mark delivered/bounced; bounced emails and invalid tokens are suppressed.

**Separate queues by priority:** OTPs and security alerts must never wait behind a 50M-user marketing campaign. Use a dedicated high-priority queue and worker pool; campaigns go through a throttled low-priority path.` },
    { id: 'deep', kind: 'concept', title: '3. Deep dives', bodyMd: `- **Fan-out for campaigns:** don't expand 50M recipients inside one request. Store the campaign and segment query, then a **batch job** pages through recipients and enqueues them in chunks (for example 1,000 per message), paced to the provider limit.
- **Idempotency & duplicates:** the producer's \`idempotency_key\` (or a deterministic id like \`order_123:shipped\`) is stored with a unique constraint; consumers check "already sent?" before calling the provider. Because queues are at-least-once, the *send* step must be idempotent or deduplicated, though providers cannot always dedupe, so a rare duplicate is the accepted trade-off versus losing OTPs.
- **Ordering:** rarely strict; if needed per user, partition by \`user_id\`.
- **Provider failure:** circuit breaker per provider, failover to a secondary provider (SMS), queue buildup is acceptable, and alert on lag.
- **User controls:** preference service with caching; every marketing message carries an unsubscribe link; legal requirements (consent, do-not-disturb windows, regional rules) are enforced centrally, not in each producer.
- **Scheduling:** a time-ordered store (delayed queue or a scheduler scanning a \`send_at\` index) releases notifications at the right time, in the user's time zone.
- **Observability:** delivery rate, latency per channel, queue lag, provider error rates, bounce rates; per-notification trace.
- **Storage:** notification logs in a write-optimised store (wide-column or sharded DB), retained for N days.

**New-grad vs senior:** a new grad should show the async pipeline with queues, retries, DLQ, templates, preferences and idempotency. Seniors add provider failover economics, priority isolation, compliance, backpressure design, and large-scale campaign scheduling.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Sending synchronously from the caller's request path.
2. One shared queue, so a marketing blast delays OTPs.
3. No idempotency, so retries message people twice.
4. Ignoring user preferences, quiet hours and unsubscribe rules.
5. Retrying forever with no DLQ.
6. Hard-coding one provider with no failover.
7. Expanding a huge recipient list in one synchronous call.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Design a notification service for push, SMS and email.', answerMd: 'An API accepts requests with an idempotency key and returns 202 after enqueuing. Priority-separated queues feed workers that load preferences, render templates, apply opt-outs/quiet hours/rate limits, and fan out to channel queues. Channel workers call providers with retries and backoff, fall back or dead-letter on failure, and record status from provider webhooks. Campaigns are expanded in batches and throttled.' },
    { id: 'iq2', q: 'How do you avoid sending a duplicate notification?', answerMd: 'Use an idempotency key unique per logical notification and check/record it atomically before sending; make consumers idempotent because queues deliver at least once. Providers sometimes lack dedup, so accept a tiny duplicate risk rather than losing critical messages like OTPs.' },
    { id: 'iq3', q: 'How do you keep OTPs fast during a big marketing campaign?', answerMd: 'Isolate by priority: separate queues, worker pools and provider quotas for transactional/security messages, and throttle campaign traffic at the source so it cannot exhaust shared resources.' },
    { id: 'iq4', q: 'The SMS provider is down. What happens?', answerMd: 'Retries with backoff while a circuit breaker trips, then failover to a secondary provider or fallback channel for critical messages. Remaining messages stay queued (bounded) with alerts on lag; after the retry budget they go to a DLQ for replay.' },
    { id: 'iq5', q: 'How do you handle a 50M-user campaign?', answerMd: 'Persist the campaign and its audience definition, have a batch job page through recipients and enqueue chunked messages at a controlled rate matching provider limits, spread it over time and time zones, and track progress by campaign id. Never fan out inside the original API request.' },
  ],
  revision: { notesMd: `- 100M/day ≈ 1.2k/s average; a 50M campaign in 10 min ≈ 83k/s.
- API → 202 + idempotency key → priority queues → enrichment (prefs, template, quiet hours) → channel workers → providers.
- Retry + backoff + jitter, circuit breaker per provider, DLQ, fallback channel.
- Separate OTP/transactional from marketing; throttle campaigns; batch fan-out.
- Status via provider webhooks; suppress bounces; unsubscribe and consent handled centrally.`, flashcards: [
    { id: 'f1', front: 'Why 202 Accepted?', backMd: 'The request is queued; delivery happens asynchronously.' },
    { id: 'f2', front: 'Why separate queues by priority?', backMd: 'So OTPs are never stuck behind bulk campaigns.' },
    { id: 'f3', front: 'How is a duplicate send avoided?', backMd: 'Idempotency key + atomic already-sent check.' },
    { id: 'f4', front: 'What do you do with a message that keeps failing?', backMd: 'Move it to a dead-letter queue and alert.' },
    { id: 'f5', front: 'How to send to 50M users?', backMd: 'Batch job pages recipients into chunked messages, throttled to provider limits.' },
  ] },
  resources: [PRIMER, { title: 'Firebase Cloud Messaging overview', url: 'https://firebase.google.com/docs/cloud-messaging', kind: 'official-docs' }, { title: 'Amazon SQS dead-letter queues', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html', kind: 'official-docs' }],
});

const ntMcqs: MCQ[] = [
  mcq({ ...q(NT), id: 'sd.nt.q1', type: 'complexity', difficulty: 'medium', stem: 'A campaign must reach 50 million users within 10 minutes. About what sustained send rate is required?', options: ['About 83,000 per second', ['About 8,300 per second', 'Off by a factor of ten.'], ['About 830 per second', 'Far too low.'], ['About 5 million per second', 'Far too high.']], answer: 0, explanation: '50,000,000 / 600 ≈ 83,333 messages per second.' }),
  mcq({ ...q(NT), id: 'sd.nt.q2', type: 'concept', difficulty: 'easy', stem: 'Why should the notification API return `202 Accepted` instead of waiting for the SMS provider?', options: ['Provider calls are slow and may fail; queuing decouples the caller and allows retries', ['SMS providers require 202', 'No such requirement.'], ['It guarantees delivery', 'It only confirms acceptance.'], ['It avoids authentication', 'Unrelated.']], answer: 0, explanation: 'Async handling keeps callers fast and isolates provider problems.' }),
  mcq({ ...q(NT), id: 'sd.nt.q3', type: 'scenario', difficulty: 'medium', stem: 'A marketing blast delays login OTP messages by several minutes. What is the structural fix?', options: ['Separate high-priority queues, worker pools and provider quotas for transactional messages, and throttle campaigns', ['Add more retries to OTPs', 'Does not remove the head-of-line blocking.'], ['Send OTPs by email only', 'Does not fix the shared bottleneck.'], ['Delete the campaign queue', 'Not a design.']], answer: 0, explanation: 'Priority isolation prevents bulk traffic from starving critical traffic.' }),
  mcq({ ...q(NT), id: 'sd.nt.q4', type: 'concept', difficulty: 'medium', stem: 'Because the queue delivers at least once, a worker may process the same "order shipped" notification twice. Which is the best protection?', options: ['A deterministic idempotency key checked and recorded atomically before sending', ['Larger queue messages', 'Unrelated.'], ['Turning off retries', 'Risks lost notifications.'], ['Sending twice on purpose', 'The opposite of the goal.']], answer: 0, explanation: 'Deduplicate by a key such as `order_123:shipped`.' }),
  mcq({ ...q(NT), id: 'sd.nt.q5', type: 'concept', difficulty: 'medium', stem: 'A message to an unreachable device token fails permanently (token invalid). What should the system do?', options: ['Stop retrying, mark the token invalid/suppress it, and record the failure', ['Retry every second forever', 'Wastes resources.'], ['Delete the user', 'Wrong.'], ['Send duplicates to other users', 'Wrong.']], answer: 0, explanation: 'Distinguish transient failures (retry) from permanent ones (suppress).' }),
  mcq({ ...q(NT), id: 'sd.nt.q6', type: 'concept', difficulty: 'medium', stem: 'Where should quiet hours and unsubscribe rules be enforced?', options: ['Centrally in the notification service, so every producer gets them consistently', ['In each producing service independently', 'Inconsistent and easy to miss.'], ['Only in the mobile app', 'Server must not send in the first place.'], ['Nowhere; users can ignore messages', 'Violates user expectations and regulations.']], answer: 0, explanation: 'Central policy enforcement avoids drift between teams.' }),
];

// ---------------------------------------------------------------------------------------
const FSV = 'sd.case-file-storage';
const fileStorage = sdTopic({
  id: FSV, title: 'Case Study: File Storage Service', level: 'core', estMinutes: 55, prerequisites: ['sd.databases'], related: ['sd.case-pastebin', 'sd.replication-sharding', 'sd.messaging'],
  summary: 'Chunking, metadata and sync.',
  objectives: ['Split a Dropbox/Drive-like service into metadata, block storage and sync/notification services.', 'Explain chunking, content hashing, deduplication and delta sync with numbers.', 'Handle resumable uploads, versioning, sharing and conflicts.', 'Estimate storage, and reason about consistency of metadata.'],
  sections: [
    { id: 'requirements', kind: 'concept', title: '1. Requirements and estimates', bodyMd: `**Functional:** upload/download files, organise in folders, **sync across devices**, share with others (view/edit), version history, work with large files (up to e.g. 10 GB), resume interrupted uploads.
**Non-functional:** **durability** (never lose a file: the headline requirement), reasonable availability, efficient sync (don't re-upload unchanged data), consistency of the folder view, security (encryption, access control).

**Estimates:** 50M users × 10 GB average stored = **500 PB** raw before replication (object storage with erasure coding ~1.5× overhead; replication 3×). 10M DAU, each uploading ~2 files/day: 20M uploads/day ≈ **230/s**; reads about 3× that. Sync notifications are far more numerous than uploads (every connected device wants to know about changes).` },
    { id: 'chunking', kind: 'concept', title: '2. Chunking, hashing and delta sync', bodyMd: `Treat a file as an ordered list of **chunks** (blocks), typically 4 MB:
- A 1 GB file = 1,024 MB / 4 MB = **256 chunks**.
- Each chunk is identified by its **content hash** (SHA-256). The file's **metadata** is just the ordered list of chunk hashes (256 × 32 bytes ≈ **8 KB** for a 1 GB file).

Benefits:
- **Delta sync:** edit one place in the 1 GB file and only the **changed chunk(s)** (4 MB) are uploaded, not 1 GB. The client hashes chunks locally and asks the server "which of these hashes do you lack?".
- **Deduplication:** identical chunks (same content hash) are stored **once** across files and users, saving storage for copies and shared files (cross-user dedup has privacy implications: be careful about leaking that a file exists).
- **Resumable, parallel upload:** upload chunks independently, retry only failed ones, and commit when all are present.
- **Integrity:** verify hashes end to end.

Chunk boundaries based on fixed size break if you insert a byte at the start (every later chunk shifts); **content-defined chunking** (rolling hash) keeps boundaries stable for inserts. Mention it as an optimisation. Compression and client-side encryption happen before hashing/upload depending on the dedup/privacy trade-off.` },
    { id: 'design', kind: 'visual', title: '3. High-level design', bodyMd: `Clients (desktop sync agent, mobile, web) → API gateway/LB → three logical services:

1. **Metadata service** (database): users, folders, files, versions, the chunk list per version, sharing ACLs. Needs **strong consistency** (a folder tree must not show half-applied moves), so a relational DB (sharded by \`user_id\`/namespace) with transactions is a good fit. Read replicas and caches for listings.
2. **Block (chunk) storage:** object storage keyed by chunk hash, replicated or erasure-coded across zones; **immutable** chunks, with reference counts (or periodic garbage collection) so a chunk is deleted only when no file version references it.
3. **Sync / notification service:** a long-lived connection (WebSocket/long polling) tells a user's other devices "namespace X changed, new version N"; devices then fetch the metadata diff since their last cursor. A **message queue** decouples metadata commits from notification fan-out.

**Upload flow:** client chunks and hashes → sends the hash list to the metadata service → server answers which chunks are missing → client uploads missing chunks directly to block storage (pre-signed URLs) in parallel → client **commits** the new file version (atomic metadata transaction) → sync service notifies other devices.

**Download:** metadata gives the chunk list; chunks are fetched in parallel (via CDN for hot/shared content) and reassembled.` },
    { id: 'deep', kind: 'concept', title: '4. Deep dives: conflicts, sharing, durability', bodyMd: `- **Conflicts:** two devices edit the same file offline. Each commit carries the **base version**; the server accepts a commit only if the base matches the current head (optimistic concurrency). Otherwise it keeps both: the loser is saved as a **"conflicted copy"** (Dropbox style) or merged (Docs-style real-time editing needs operational transformation/CRDTs, a different problem).
- **Versioning:** each commit creates a new version pointing to chunk lists; old versions retained for N days. Because chunks are shared, versions of a lightly edited file cost little.
- **Sharing:** ACL entries on files/folders (owner, editor, viewer, link-share with expiry); permission checks on every metadata and chunk access; pre-signed, short-lived URLs for block access.
- **Durability:** multi-AZ replication or erasure coding for chunks; metadata DB replicated and backed up; periodic integrity scrubbing comparing hashes; soft delete and trash with recovery windows.
- **Large listings and moves:** moving a folder should update one pointer, not rewrite millions of rows (store folder as a tree with parent pointers or closure/materialised paths carefully).
- **Security:** TLS in transit, encryption at rest with per-user or per-file keys, optional client-side encryption (breaks server-side dedup and search).

**New-grad vs senior:** a new grad should give the metadata/block/sync split, chunking with hashing, resumable upload and conflict handling. Seniors add content-defined chunking, cross-region replication cost, GC of unreferenced chunks, hot-shard handling for popular shared folders, and end-to-end encryption trade-offs.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Uploading whole files for every edit instead of chunks.
2. Putting file contents and metadata in the same store.
3. Ignoring concurrent edits and silently overwriting one.
4. Deleting a chunk still referenced by another file or version.
5. Eventual consistency for the folder tree (users see files vanish and reappear).
6. Forgetting durability checks and the trash/recovery path.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How does a Dropbox-like service upload only the changed part of a large file?', answerMd: 'The file is split into chunks (for example 4 MB) identified by content hashes. The client compares its hash list with the server\'s version and uploads only the chunks whose hashes are new, then commits an updated chunk list. Editing one region of a 1 GB file therefore uploads about 4 MB.' },
    { id: 'iq2', q: 'How does deduplication work and what are its downsides?', answerMd: 'Chunks are stored under their content hash, so identical chunks from any file or user are stored once and referenced many times. Downsides: reference counting and garbage collection complexity, loss of dedup with client-side encryption, and privacy leakage if the server reveals that a hash already exists to other users.' },
    { id: 'iq3', q: 'Two devices edit the same file offline. What happens on sync?', answerMd: 'Each commit names the version it was based on. The first commit succeeds; the second finds the head has moved, so the server rejects the fast-forward and keeps the second device\'s content as a conflicted copy (or triggers a merge for mergeable formats), and the user resolves it.' },
    { id: 'iq4', q: 'Why use a relational database for metadata but object storage for chunks?', answerMd: 'Metadata (tree, permissions, versions) is small, relational and needs transactions and strong consistency. Chunks are large, immutable, accessed by hash, and need cheap, durable, scalable storage, which object stores provide.' },
    { id: 'iq5', q: 'How do other devices learn about a change quickly?', answerMd: 'After a commit the metadata service publishes an event to a queue; a notification service pushes a "namespace changed" signal over a persistent connection (WebSocket or long poll), and each device fetches changes since its stored cursor. Devices also poll occasionally as a safety net.' },
  ],
  revision: { notesMd: `- Services: metadata DB (strong consistency, relational), chunk/object storage (immutable, content-addressed), sync/notification.
- Chunks ~4 MB, SHA-256 id: 1 GB = 256 chunks; metadata ≈ 8 KB of hashes. Edit one chunk → upload 4 MB.
- Dedup by hash (refcount/GC); resumable parallel upload with pre-signed URLs; commit atomically.
- Conflicts: optimistic base-version check, conflicted copy. Versions share chunks.
- Durability: multi-AZ / erasure coding, scrubbing, trash. Notify devices with events + cursor-based sync.`, flashcards: [
    { id: 'f1', front: 'Chunks in a 1 GB file with 4 MB chunks?', backMd: '256.' },
    { id: 'f2', front: 'How is a chunk identified?', backMd: 'By its content hash (for example SHA-256).' },
    { id: 'f3', front: 'Why is metadata kept in a relational DB?', backMd: 'It needs transactions and strong consistency for the folder tree and permissions.' },
    { id: 'f4', front: 'How are edit conflicts handled?', backMd: 'Optimistic base-version check; the loser becomes a conflicted copy.' },
    { id: 'f5', front: 'When can a chunk be deleted?', backMd: 'When no file version references it (refcount/GC).' },
  ] },
  resources: [PRIMER, { title: 'Dropbox Tech Blog: Scaling to exabytes and beyond', url: 'https://dropbox.tech/infrastructure/magic-pocket-infrastructure', kind: 'article' }, { title: 'Amazon S3 pre-signed URLs', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html', kind: 'official-docs' }],
});

const fsvMcqs: MCQ[] = [
  mcq({ ...q(FSV), id: 'sd.fsv.q1', type: 'complexity', difficulty: 'easy', stem: 'A 1 GB file is split into 4 MB chunks. How many chunks is that?', options: ['256', ['25', 'That would be 40 MB chunks.'], ['1,024', 'That would be 1 MB chunks.'], ['4', 'That is the chunk size in MB, not the count.']], answer: 0, explanation: '1,024 MB / 4 MB = 256.' }),
  mcq({ ...q(FSV), id: 'sd.fsv.q2', type: 'scenario', difficulty: 'medium', stem: 'A user edits one paragraph in the middle of a 1 GB file synced with 4 MB fixed-size chunks (the edit does not change the file size). Roughly how much data is uploaded?', options: ['About 4 MB (the one changed chunk)', ['1 GB', 'That ignores delta sync.'], ['About 256 MB', 'Only the changed chunk differs.'], ['Nothing', 'The new chunk must be uploaded.']], answer: 0, explanation: 'Only chunks whose hashes changed are sent.' }),
  mcq({ ...q(FSV), id: 'sd.fsv.q3', type: 'concept', difficulty: 'medium', stem: 'Why are chunks stored under their content hash?', options: ['Identical chunks are stored once (deduplication) and integrity can be verified', ['It makes chunks mutable', 'Content-addressed chunks are immutable.'], ['It hides the file names', 'Not its purpose.'], ['It speeds up the database', 'Unrelated.']], answer: 0, explanation: 'Content addressing enables dedup and end-to-end integrity checks.' }),
  mcq({ ...q(FSV), id: 'sd.fsv.q4', type: 'concept', difficulty: 'medium', stem: 'Two devices edit the same file offline and then sync. How does the server detect the conflict?', options: ['The second commit names a base version that is no longer the head', ['Both commits have the same timestamp', 'Clocks are not a reliable signal.'], ['Checksums of the chunks match', 'Matching content wouldn\'t conflict.'], ['The file name is different', 'Same file, same name.']], answer: 0, explanation: 'Optimistic concurrency by version, then keep both as a conflicted copy.' }),
  mcq({ ...q(FSV), id: 'sd.fsv.q5', type: 'concept', difficulty: 'medium', stem: 'Which store is the best fit for the file-tree metadata (folders, permissions, versions)?', options: ['A transactional relational database', ['An in-memory cache only', 'Not durable enough.'], ['Object storage', 'No transactional semantics.'], ['A CDN', 'Not a datastore.']], answer: 0, explanation: 'The tree must be updated atomically and consistently.' }),
  mcq({ ...q(FSV), id: 'sd.fsv.q6', type: 'concept', difficulty: 'hard', stem: 'Two files share a chunk. The user deletes one file. What must happen to the shared chunk?', options: ['It remains, because another file still references it (reference counting / garbage collection)', ['It is deleted immediately', 'The other file would be corrupted.'], ['It is copied twice', 'Wasteful.'], ['It is moved to the CDN', 'Unrelated.']], answer: 0, explanation: 'Chunks are removed only when their reference count reaches zero (or a GC finds them unreferenced).' }),
];

// ---------------------------------------------------------------------------------------
const CH = 'sd.case-chat';
const chat = sdTopic({
  id: CH, title: 'Case Study: Chat Application', level: 'core', estMinutes: 60, prerequisites: ['sd.messaging'], related: ['cn.rest-protocols', 'sd.case-notification', 'sd.replication-sharding'],
  summary: 'WebSockets, message ordering and presence.',
  objectives: ['Estimate connections, message rate and storage for a chat system.', 'Design real-time delivery with WebSocket gateways and routing between servers.', 'Guarantee per-conversation ordering, delivery acknowledgements and offline delivery.', 'Model presence, group fan-out and message storage.'],
  sections: [
    { id: 'requirements', kind: 'concept', title: '1. Requirements and estimates', bodyMd: `**Functional:** 1-on-1 and group chat (up to ~100 members), real-time delivery, **offline delivery** when a user reconnects, message history, delivery/read receipts, online presence. **Out of scope:** voice/video, end-to-end encryption, search, large channels (mention as extensions).
**Non-functional:** low latency (< 200 ms online-to-online), **no message loss**, **per-conversation ordering**, high availability, support multiple devices per user.

**Estimates:** 50M DAU × 40 messages/day = 2 × 10⁹ messages/day ≈ **23k messages/s** average (peak 2–3×). At 100 bytes per message: **200 GB/day ≈ 73 TB/year** of message text. Concurrent connections: if 20% of DAU are online at once, **10M persistent WebSocket connections**; at ~50k connections per gateway server that is about **200 gateway servers**.` },
    { id: 'design', kind: 'visual', title: '2. High-level design', bodyMd: `Use **WebSockets** (a persistent, full-duplex connection) for real-time send/receive, and plain HTTPS for everything else (login, history, media upload).

Components:
- **WebSocket gateways** (stateful: they hold the open connections). A load balancer assigns each client to a gateway; a **session registry** (Redis: \`user_id → gateway_id\`) records where each user is connected.
- **Chat service** (stateless): validates, assigns ordering, persists, and routes.
- **Message store:** a write-heavy, partitioned store; **wide-column (Cassandra/HBase)** or a sharded database with the partition key \`conversation_id\` and a time-ordered clustering key, so "latest N messages of a conversation" is one sequential read.
- **Message queue / pub-sub** between chat service and gateways to reach users on other gateways.
- **Push notification service** for offline users (FCM/APNs).
- **Presence service** and **media service** (object storage + CDN for images/files).

**1-on-1 send flow:**
1. Alice's client sends \`{conversation_id, client_msg_id, text}\` over her WebSocket.
2. The chat service assigns a **server-side sequence number** in the conversation, **persists** the message, then acks Alice ("sent").
3. It looks up Bob in the session registry. If online, it publishes to Bob's gateway, which pushes it down his socket; Bob's client acks ("delivered"). If offline, it stores it as undelivered and sends a push notification.
4. When Bob reconnects, his client says "my last seen seq in each conversation is N", and the server **replays** messages after N (sync by cursor).` },
    { id: 'deep', kind: 'concept', title: '3. Deep dives: ordering, groups, presence', bodyMd: `- **Ordering:** timestamps from clients/servers are unreliable. Use a **per-conversation sequence number** assigned by a single writer: route all messages of a conversation to the same partition/server (partition by \`conversation_id\`), or use a counter in the store. Clients display by sequence number. Global ordering across conversations is unnecessary.
- **Idempotent sends:** the client includes a \`client_msg_id\`; if a send is retried (timeout, reconnect) the server dedups by it, so the message is not posted twice (at-least-once delivery + idempotency).
- **Delivery states:** sent → delivered → read, each acknowledged and stored, so a reconnecting client resumes accurately.
- **Group chat:** store the message **once** and fan out to members. For small groups (≤ 100) *fan-out on write* (push to each online member's gateway, mark unread counts) is fine; for huge channels use *fan-out on read* (clients pull from the shared channel log).
- **Multiple devices:** the session registry maps a user to several connections; each device tracks its own cursor.
- **Presence:** each client sends a **heartbeat** every ~5–30 s; the presence service stores \`last_seen\` with a TTL in Redis. A user is "online" while the key lives. Broadcast presence changes only to people who are viewing that user (friends currently looking at the chat list), not to all contacts. Presence is **eventually consistent** and can be approximate.
- **Scaling gateways:** connections are stateful, so deploys need connection draining and client **reconnect with jittered backoff**; use consistent hashing or a registry to route cross-gateway messages.
- **Storage growth:** 73 TB/year is shardable; archive old messages to cheaper storage.
- **Security:** TLS, token auth on the WebSocket handshake, per-user rate limiting, authorisation on every conversation (membership check).

**New-grad vs senior:** a new grad should show WebSockets, the send/ack/offline flow, ordering by sequence numbers, and the data model partitioned by conversation. Seniors add cross-region routing, backpressure on slow clients, end-to-end encryption, large-group fan-out strategies, and failure modes of the session registry.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Polling for new messages instead of persistent connections (or using HTTP for the real-time path).
2. Ordering by client timestamps.
3. Losing messages when the recipient is offline or the gateway restarts (persist before acking).
4. No idempotency: retries duplicate messages.
5. Broadcasting presence to every contact on every change.
6. Treating gateways as stateless and not planning for reconnect storms on deploy.
7. Using one global counter or one database partition for all conversations.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Design a chat application (1-on-1 and groups).', answerMd: 'Clients keep WebSocket connections to gateway servers; a session registry maps users to gateways. The chat service persists each message with a per-conversation sequence number, acks the sender, and routes to online recipients through a pub-sub layer, otherwise stores it and sends a push notification. Messages are stored in a store partitioned by conversation id. Reconnecting clients sync from their last sequence number. Presence uses heartbeats with TTLs.' },
    { id: 'iq2', q: 'How do you guarantee message ordering in a conversation?', answerMd: 'Assign sequence numbers per conversation from a single logical writer by partitioning on conversation id, and have clients order by that number rather than by timestamps. Ordering across different conversations is not required.' },
    { id: 'iq3', q: 'How do you avoid duplicates when the client retries?', answerMd: 'The client generates a unique client_msg_id; the server stores it with the message and ignores repeats of the same id (idempotent write), returning the original ack.' },
    { id: 'iq4', q: 'How is presence implemented?', answerMd: 'Clients send periodic heartbeats; the presence service refreshes a key with a short TTL (for example 30–60 s) per user. If heartbeats stop, the key expires and the user appears offline. Updates are sent only to interested subscribers, and slight staleness is acceptable.' },
    { id: 'iq5', q: 'How many gateway servers for 10 million concurrent connections?', answerMd: 'If one well-tuned server holds about 50,000 idle WebSocket connections (limited by memory, file descriptors and traffic), 10M / 50k = 200 servers, plus headroom for failures and deploys. The real number depends on message rate and per-connection memory.' },
  ],
  revision: { notesMd: `- 50M DAU × 40 msgs ≈ 2×10⁹/day ≈ 23k/s; 100 B each → 200 GB/day ≈ 73 TB/year. 10M connections / 50k per server = 200 gateways.
- WebSocket gateways (stateful) + session registry (user → gateway) + stateless chat service + queue/pub-sub + message store (partition by conversation_id) + push for offline.
- Persist before ack; sequence number per conversation; client_msg_id for idempotency; sync by cursor.
- Groups: store once, fan-out (write for small, read for huge). Presence = heartbeat + TTL, eventually consistent.
- Reconnect with jittered backoff; draining on deploy.`, flashcards: [
    { id: 'f1', front: 'Transport for real-time delivery?', backMd: 'WebSockets (persistent full-duplex connection).' },
    { id: 'f2', front: 'How is ordering defined in a conversation?', backMd: 'A per-conversation sequence number from a single writer/partition.' },
    { id: 'f3', front: 'What stops duplicate messages on retry?', backMd: 'An idempotent client_msg_id.' },
    { id: 'f4', front: 'Partition key for the message store?', backMd: 'conversation_id (clustered by time/sequence).' },
    { id: 'f5', front: 'How is presence stored?', backMd: 'A heartbeat-refreshed key with a TTL.' },
  ] },
  resources: [PRIMER, { title: 'MDN: WebSockets API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', kind: 'official-docs' }, { title: 'Discord Engineering: How Discord stores trillions of messages', url: 'https://discord.com/blog/how-discord-stores-trillions-of-messages', kind: 'article' }],
});

const chMcqs: MCQ[] = [
  mcq({ ...q(CH), id: 'sd.ch.q1', type: 'complexity', difficulty: 'medium', stem: '50 million daily active users send 40 messages each per day. About how many messages per second is that on average?', options: ['About 23,000', ['About 2,300', 'Off by a factor of ten.'], ['About 230,000', 'Off by a factor of ten.'], ['About 2 billion', 'That is messages per day.']], answer: 0, explanation: '2 × 10⁹ / 86,400 ≈ 23,148 messages/s.' }),
  mcq({ ...q(CH), id: 'sd.ch.q2', type: 'complexity', difficulty: 'medium', stem: '10 million concurrent WebSocket connections must be served. One gateway server handles about 50,000. How many gateways are needed (before headroom)?', options: ['200', ['20', 'That would be 500k connections per server.'], ['2,000', 'That would be 5,000 per server.'], ['50', 'Too few.']], answer: 0, explanation: '10,000,000 / 50,000 = 200.' }),
  mcq({ ...q(CH), id: 'sd.ch.q3', type: 'concept', difficulty: 'medium', stem: 'Why are client timestamps a bad way to order messages in a conversation?', options: ['Device clocks differ and can be wrong, so orders become inconsistent between viewers', ['Timestamps cannot be stored', 'They can.'], ['They are too long', 'Unrelated.'], ['The database forbids them', 'Unrelated.']], answer: 0, explanation: 'Use a server-assigned per-conversation sequence number.' }),
  mcq({ ...q(CH), id: 'sd.ch.q4', type: 'concept', difficulty: 'medium', stem: 'The recipient is offline when a message arrives. What should the system do?', options: ['Persist it, send a push notification, and deliver it when the client reconnects and syncs from its last sequence number', ['Drop it', 'Messages must not be lost.'], ['Keep the sender\'s socket open until the recipient returns', 'Does not scale and is fragile.'], ['Email it to the sender', 'Wrong.']], answer: 0, explanation: 'Durability plus cursor-based sync handles offline users.' }),
  mcq({ ...q(CH), id: 'sd.ch.q5', type: 'scenario', difficulty: 'medium', stem: 'A phone loses signal just after sending, and the app retries the same message on reconnect. How do you prevent a duplicate in the conversation?', options: ['The client sends a unique `client_msg_id` and the server ignores repeats of it', ['Reject all retries', 'The first send might not have arrived.'], ['Wait 10 minutes before delivering', 'Unrelated.'], ['Use UDP', 'Does not address duplicates.']], answer: 0, explanation: 'Idempotent writes make at-least-once sending safe.' }),
  mcq({ ...q(CH), id: 'sd.ch.q6', type: 'concept', difficulty: 'medium', stem: 'Which partition key gives an efficient "latest messages in this conversation" query?', options: ['conversation_id, with messages clustered by sequence/time', ['message_id only, random', 'Messages of one conversation would be scattered.'], ['user_id of the sender', 'Splits one conversation across partitions.'], ['The date only', 'Creates hot partitions.']], answer: 0, explanation: 'All messages of a conversation sit together and are read sequentially.' }),
];

export const topics: Topic[] = [rateLimiter, pastebin, notification, fileStorage, chat];
export const mcqs: MCQ[] = [...rlMcqs, ...pbMcqs, ...ntMcqs, ...fsvMcqs, ...chMcqs];
