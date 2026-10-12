import type { MCQ, Topic } from '../schema';
import { mcq } from '../helpers';
import { PRIMER, q, sdTopic } from './common';

// System Design case studies, batch 2: news feed, API gateway, logging and monitoring, and
// basic video streaming. Numbers are recomputed in tests/sd-facts.test.ts.

// ---------------------------------------------------------------------------------------
const NF = 'sd.case-news-feed';
const feed = sdTopic({
  id: NF, title: 'Case Study: News Feed', level: 'core', estMinutes: 60, prerequisites: ['sd.caching'], related: ['sd.case-chat', 'sd.replication-sharding', 'sd.messaging'],
  summary: 'Fan-out on write vs read and ranking.',
  objectives: ['Estimate read and write load for a social feed and see why reads dominate.', 'Compare fan-out on write (push), fan-out on read (pull) and the hybrid used for celebrities.', 'Design the data model, timeline cache and pagination.', 'Discuss ranking, freshness and consistency trade-offs.'],
  sections: [
    { id: 'requirements', kind: 'concept', title: '1. Requirements and estimates', bodyMd: `**Functional:** users **post** (text, images), **follow** others, and see a **home feed** of recent posts from the people they follow, newest first (ranking is an extension); likes and comments exist but are out of scope for the core design.
**Non-functional:** feed loads in **< 300 ms**; **highly available**; posts show up for followers within a few seconds (eventual consistency is fine); scale to hundreds of millions of users with a very skewed follower distribution.

**Estimates:** 300M DAU, each opens the feed 5 times a day: 1.5 × 10⁹ feed reads/day ≈ **17k reads/s**. 100M posts/day ≈ **1.2k writes/s**. Reads outnumber writes ~15:1, so **optimise the read path**. If the average user has 200 followers, fan-out on write creates 100M × 200 = 2 × 10¹⁰ timeline inserts/day ≈ **231k/s**: a lot of write work, but cheap writes into a cache.` },
    { id: 'fanout', kind: 'comparison', title: '2. Fan-out on write vs fan-out on read', bodyMd: `| | **Fan-out on write (push)** | **Fan-out on read (pull)** |
|---|---|---|
| When a user posts | copy the post id into the **timeline of every follower** | store the post once |
| When a user reads | read their precomputed timeline (very fast) | fetch recent posts of each followed user and **merge** them |
| Read latency | low | high (many queries per feed) |
| Write cost | high: proportional to follower count | low |
| Problem | **celebrity with 50M followers** → 50M writes per post, delayed delivery | slow reads, hot rows for popular accounts, wasted work for inactive users |

**Hybrid (what real systems do):** push for ordinary users, **pull for celebrities**. A user's feed = their precomputed timeline (from pushed posts) **merged at read time** with the recent posts of the few celebrities they follow. Also skip fan-out for **inactive users** (build their timeline lazily when they return).

Costs of one celebrity post by push: 50M timeline writes. With a 100k writes/s fan-out pipeline that takes **500 seconds (> 8 minutes)** before the last follower sees it, which is why celebrities use pull.` },
    { id: 'design', kind: 'visual', title: '3. High-level design and data model', bodyMd: `\`\`\`
POST /v1/posts            { "text": "...", "media_ids": [...] }   -> 201 { post_id }
GET  /v1/feed?cursor=...&limit=20                                  -> 200 { posts: [...], next_cursor }
POST /v1/follows/{user_id}
\`\`\`

- **Post service** writes to the **posts store** (sharded by \`post_id\`/\`user_id\`; wide-column or sharded SQL). Media goes to object storage + CDN.
- **Social graph service** stores followers/following (\`follows(follower_id, followee_id)\`, indexed both ways; a graph or sharded KV store).
- **Fan-out service:** on a new post, publish an event to a **queue**; workers read the author's followers in pages and **push the post id** (not the full post) onto each follower's **timeline** in a cache, e.g. a Redis list/sorted set \`timeline:{user_id}\` capped to the latest ~800 ids.
- **Feed service (read path):** load the timeline ids from the cache, merge celebrity posts, **hydrate** ids into full posts via a post cache (multi-get), filter blocked/deleted content, rank, return a page with a **cursor** (post id/score), not an offset.
- **Caches** at every layer: timeline cache, post cache, user-profile cache; CDN for media.
- **Storage economy:** timelines hold ids only (8 bytes each); 300M users × 800 ids × 8 B ≈ 1.9 TB: fits in a cluster of Redis nodes.

**Deleted posts / unfollow:** filter at read time (check against the post store or a tombstone set) rather than rewriting millions of timelines.` },
    { id: 'deep', kind: 'concept', title: '4. Ranking, freshness and failure', bodyMd: `- **Reverse-chronological** is the baseline. **Ranked feeds** score candidate posts (recency, author affinity, engagement prediction, media type) with an ML model; a **candidate generation → ranking → re-ranking** pipeline runs at read time over a few hundred candidates. A new-grad answer should mention it as an extension and keep the basic design chronological.
- **Consistency:** a user should see their **own** post immediately (read-your-writes): insert it into their own timeline synchronously or merge their recent posts at read time. Followers can see it seconds later.
- **Hot keys:** celebrity profiles and posts are read by millions; cache aggressively with replication of hot keys and short TTLs, plus CDN for media.
- **Backfill:** when you follow someone new, insert their recent posts into your timeline asynchronously.
- **Failures:** if the fan-out pipeline lags, the queue absorbs it and feeds are slightly stale; if the timeline cache is cold or lost, rebuild from the posts store using the pull path (slow but correct).
- **Pagination:** cursor-based on (score/time, post_id) to avoid duplicates when new posts arrive.

**New-grad vs senior:** a new grad should compare push and pull, justify the hybrid, and draw the cache-based read path. Seniors discuss ranking infrastructure, cache hierarchy and hot-key mitigation, multi-region replication, and the cost of the fan-out pipeline.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Pure fan-out on write with no plan for celebrities.
2. Pure fan-out on read, with joins across every followee per feed load.
3. Storing full post bodies in every timeline instead of ids.
4. Offset pagination on a feed that changes constantly.
5. Rewriting timelines on delete or unfollow instead of filtering at read time.
6. Forgetting read-your-own-writes.
7. Starting with ML ranking before the basic read path works.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Design a news feed.', answerMd: 'Posts go to a posts store; followers come from a social graph service. On post, a queue-driven fan-out service pushes the post id into each follower\'s timeline cache (Redis) for normal users; celebrities are not pushed, and their recent posts are merged in at read time. The feed service reads the timeline ids, merges celebrity posts, hydrates them from a post cache, filters and ranks, and returns a cursor-paginated page.' },
    { id: 'iq2', q: 'Push vs pull feeds: trade-offs?', answerMd: 'Push (fan-out on write) makes reads fast by precomputing timelines but multiplies writes by the follower count and delays celebrity posts. Pull (fan-out on read) writes once but makes each feed load expensive. A hybrid pushes for ordinary users and pulls for celebrities and inactive users.' },
    { id: 'iq3', q: 'How do you handle a user with 50 million followers?', answerMd: 'Don\'t fan out their posts. Followers fetch the celebrity\'s recent posts at read time and merge them with their precomputed timeline, with heavy caching and a CDN for media. Fanning out 50M writes would take minutes and burden the pipeline.' },
    { id: 'iq4', q: 'Why store only post ids in the timeline?', answerMd: 'It keeps entries tiny (8 bytes), so millions of timelines fit in memory, and avoids duplicating post bodies that can change or be deleted. Posts are hydrated from a shared post cache at read time.' },
    { id: 'iq5', q: 'How do you paginate a feed that gets new posts constantly?', answerMd: 'With a cursor based on the last returned (timestamp or score, post id) so the next request continues after that item. Offset pagination shifts as new posts arrive, producing duplicates or gaps.' },
  ],
  revision: { notesMd: `- 300M DAU × 5 loads ≈ 17k reads/s; 100M posts/day ≈ 1.2k/s; avg 200 followers → ~231k timeline writes/s. Reads dominate.
- Push (precompute timelines, fast reads, write-heavy) vs pull (cheap writes, slow reads); hybrid: push normal users, pull celebrities, lazy for inactive.
- Timeline = list of post ids per user in Redis (cap ~800); hydrate from post cache; filter deleted/blocked at read time.
- Cursor pagination; read-your-own-writes; async backfill on follow; rebuild by pull if cache lost.
- Ranking pipeline as an extension.`, flashcards: [
    { id: 'f1', front: 'Fan-out on write means?', backMd: 'Copy the new post into every follower\'s timeline when it is posted.' },
    { id: 'f2', front: 'Why not push celebrity posts?', backMd: 'A 50M-follower post means 50M writes, delaying delivery by minutes.' },
    { id: 'f3', front: 'What does a timeline store?', backMd: 'Post ids (not bodies), capped to the latest few hundred.' },
    { id: 'f4', front: 'How are deleted posts handled?', backMd: 'Filtered at read time (tombstone check), not by rewriting timelines.' },
    { id: 'f5', front: 'Pagination style?', backMd: 'Cursor-based on (time/score, post id).' },
  ] },
  resources: [PRIMER, { title: 'InfoQ: Timelines at Scale (Twitter)', url: 'https://www.infoq.com/presentations/Twitter-Timeline-Scalability/', kind: 'video' }, { title: 'Redis: Sorted sets', url: 'https://redis.io/docs/latest/develop/data-types/sorted-sets/', kind: 'official-docs' }],
});

const nfMcqs: MCQ[] = [
  mcq({ ...q(NF), id: 'sd.nf.q1', type: 'complexity', difficulty: 'medium', stem: '100 million posts per day, each user having 200 followers on average. With pure fan-out on write, about how many timeline inserts per second are needed?', options: ['About 231,000', ['About 1,200', 'That is the post rate, before fan-out.'], ['About 23,000', 'Off by a factor of ten.'], ['About 2 million', 'Off by a factor of ten.']], answer: 0, explanation: '10⁸ × 200 = 2 × 10¹⁰ per day ÷ 86,400 ≈ 231,000/s.' }),
  mcq({ ...q(NF), id: 'sd.nf.q2', type: 'concept', difficulty: 'medium', stem: 'Why is pure fan-out on write a problem for accounts with tens of millions of followers?', options: ['A single post triggers millions of timeline writes, delaying delivery and loading the pipeline', ['It makes reads slower', 'Reads get faster.'], ['It cannot store post ids', 'It can.'], ['It requires a graph database', 'Unrelated.']], answer: 0, explanation: 'Use a hybrid: pull celebrity posts at read time.' }),
  mcq({ ...q(NF), id: 'sd.nf.q3', type: 'complexity', difficulty: 'medium', stem: 'A celebrity with 50 million followers posts. The fan-out pipeline can do 100,000 timeline writes per second. How long until the last follower\'s timeline is updated?', options: ['About 500 seconds (over 8 minutes)', ['About 5 seconds', 'Off by a factor of 100.'], ['About 50 seconds', 'Off by a factor of ten.'], ['About 5,000 seconds', 'Off by a factor of ten.']], answer: 0, explanation: '50,000,000 / 100,000 = 500 s.' }),
  mcq({ ...q(NF), id: 'sd.nf.q4', type: 'concept', difficulty: 'medium', stem: 'Which hybrid strategy do large feeds typically use?', options: ['Push posts of ordinary users into timelines; merge celebrity posts in at read time', ['Pull everything for everyone', 'Too slow per feed load.'], ['Push everything including celebrities', 'Overloads the pipeline.'], ['Store feeds only on the client', 'Not reliable.']], answer: 0, explanation: 'It balances read latency against write amplification.' }),
  mcq({ ...q(NF), id: 'sd.nf.q5', type: 'concept', difficulty: 'easy', stem: 'What should a cached timeline contain?', options: ['Post ids (hydrated into full posts at read time)', ['Full copies of every post body', 'Wastes memory and goes stale.'], ['Only the author names', 'Not enough to render posts.'], ['Raw image bytes', 'Media belongs in object storage and the CDN.']], answer: 0, explanation: 'Ids are compact, and bodies are fetched from a shared post cache.' }),
  mcq({ ...q(NF), id: 'sd.nf.q6', type: 'scenario', difficulty: 'medium', stem: 'A user deletes a post that has already been pushed into 5,000 follower timelines. What is the simplest correct approach?', options: ['Filter deleted posts at read time using the post store or a tombstone set', ['Rewrite all 5,000 timelines immediately and synchronously', 'Expensive, and can race.'], ['Ignore deletes', 'Users would still see deleted content.'], ['Rebuild every timeline in the system', 'Disproportionate.']], answer: 0, explanation: 'Hydration already looks up posts, so deleted ones are simply dropped.' }),
];

// ---------------------------------------------------------------------------------------
const AG = 'sd.case-api-gateway';
const gateway = sdTopic({
  id: AG, title: 'Case Study: API Gateway', level: 'core', estMinutes: 50, prerequisites: ['sd.api-design'], related: ['sd.case-rate-limiter', 'sd.auth', 'sd.load-balancing', 'sd.observability'],
  summary: 'Routing, auth, rate limiting and observability at the edge.',
  objectives: ['Explain what an API gateway does and what it should not do.', 'Design routing, authentication offload, rate limiting, caching and request transformation.', 'Make the gateway scalable, highly available and non-blocking, and avoid it becoming a bottleneck.', 'Compare it with load balancers, service meshes and BFFs.'],
  sections: [
    { id: 'requirements', kind: 'concept', title: '1. Why a gateway and its requirements', bodyMd: `With many backend services, clients should not know each service's address, authentication scheme or protocol. An **API gateway** is the single entry point (a reverse proxy with API-aware features) that handles **cross-cutting concerns** once:

- **Routing:** map \`/orders/**\` to the orders service, \`/users/**\` to users; version routing; canary splits (5% to a new build).
- **Authentication offload:** validate JWTs/API keys/sessions, then pass identity downstream (trusted headers).
- **Authorisation (coarse):** scopes and route-level rules; fine-grained object checks stay in services.
- **Rate limiting & quotas** per client, **throttling and load shedding**.
- **TLS termination**, request/response **transformation** (header injection, protocol translation REST ↔ gRPC), **aggregation** (a mobile BFF endpoint fanning out to several services).
- **Caching** of safe GET responses, **compression**, **CORS**.
- **Observability:** access logs, metrics (RED), trace id generation and propagation.
- **Resilience:** timeouts, retries (idempotent only), circuit breakers per upstream.

**Non-functional:** adds only **1–5 ms** overhead; must handle the **sum of all traffic** (for example 100k req/s); extremely high availability (it is on every request path); config changes without downtime.` },
    { id: 'design', kind: 'visual', title: '2. High-level design', bodyMd: `Client → DNS/CDN/WAF → **L4 load balancer** → **gateway fleet** (stateless, horizontally scaled) → service discovery → backend services.

Request pipeline inside a gateway node (a chain of **filters/plugins**):
1. **TLS terminate**, parse the request, assign/propagate a **trace id**.
2. **Authenticate:** verify JWT signature locally (cached public keys: no network hop) or validate an API key against a cache (Redis) with a short TTL; reject with 401.
3. **Rate limit** (see Rate Limiter): local token bucket plus shared counters; 429 when exceeded.
4. **Route** match: the route table is an in-memory **trie or radix tree** keyed by host and path, updated from a **control plane** (config store) without restart.
5. **Pick an upstream instance:** from a service-discovery registry (Consul/etcd/Kubernetes endpoints) using least-connections or round robin with **health checks**.
6. **Forward** with timeouts, optional retry on idempotent calls, circuit breaker; stream the response back; apply response filters (headers, compression).
7. **Log & emit metrics** asynchronously (never block the request on logging).

**Control plane vs data plane:** the *data plane* (gateway nodes) proxies traffic using locally cached config; the *control plane* (admin API, config database) distributes route/policy updates. If the control plane fails, traffic still flows with the last known config.` },
    { id: 'deep', kind: 'concept', title: '3. Deep dives and trade-offs', bodyMd: `- **Availability:** run multiple gateway nodes across zones behind an L4 balancer or anycast; no node holds per-request state. Availability maths: a gateway at 99.99% in series with a service at 99.9% yields 0.9999 × 0.999 ≈ **99.89%**, so the gateway must be more reliable than anything behind it.
- **Performance:** use non-blocking I/O (event loop: Nginx, Envoy, Netty); connection pooling and keep-alive to upstreams; avoid per-request remote calls (cache auth keys and config; verify JWTs locally); keep body buffering minimal.
- **Gateway as bottleneck/SPOF:** keep it **thin**. Business logic, heavy orchestration and data joins belong in services (or a BFF), otherwise the gateway becomes a monolith owned by everyone. Scale it horizontally and load test.
- **Failure isolation:** per-upstream circuit breakers, timeouts and bulkheads so one slow service cannot consume all gateway connections; return a clean 503/504 with a trace id.
- **Security:** WAF rules, request size limits, schema validation, strip untrusted internal headers from clients (an attacker must not be able to set \`X-User-Id\`), mTLS to upstreams.
- **Versioning & rollout:** header- or path-based routing, weighted canary routes, blue/green with instant rollback.
- **Gateway vs load balancer vs service mesh:** an L4/L7 load balancer spreads traffic across identical instances; the gateway handles **north-south** (client ↔ platform) concerns with API semantics; a **service mesh** (sidecars like Envoy under Istio) handles **east-west** (service ↔ service) mTLS, retries and telemetry. **BFF (backend for frontend)** is a per-client gateway shaping responses for web vs mobile.
- **Products:** Kong, Envoy/Istio gateway, Nginx, AWS API Gateway, Apigee; building your own is rarely justified.

**New-grad vs senior:** a new grad should list the gateway's responsibilities, show the request pipeline, and explain statelessness and horizontal scaling. Seniors discuss control/data plane separation, config propagation, hot reload, latency budgets, and avoiding a distributed monolith.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Putting business logic or data aggregation into the gateway.
2. Making a remote call (auth service, database) on every request without caching.
3. A single gateway instance (SPOF).
4. Trusting identity headers sent by clients.
5. Retrying non-idempotent requests automatically.
6. Configuration changes that need restarts.
7. No per-upstream timeouts, so one slow service exhausts gateway connections.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What does an API gateway do?', answerMd: 'It is the single entry point that routes requests to backend services and handles cross-cutting concerns: TLS termination, authentication, rate limiting, request transformation, caching, resilience (timeouts, retries, circuit breakers) and observability, so each service does not reimplement them.' },
    { id: 'iq2', q: 'How do you stop the gateway from becoming a bottleneck or single point of failure?', answerMd: 'Keep it stateless and thin, run many nodes across zones behind a load balancer, use non-blocking I/O, cache auth keys and config locally, avoid remote calls on the hot path, isolate upstreams with timeouts and circuit breakers, and load test. The control plane is separate from the data plane, so traffic flows even if config distribution fails.' },
    { id: 'iq3', q: 'How does the gateway authenticate JWTs quickly?', answerMd: 'It verifies the signature locally using cached public keys (JWKS), checks expiry, issuer and audience, and forwards the identity to services in trusted headers; no network call per request. Revocation needs short lifetimes or a small deny-list.' },
    { id: 'iq4', q: 'Gateway vs load balancer vs service mesh?', answerMd: 'A load balancer distributes traffic across instances (L4/L7). A gateway is the edge entry point with API-level features for external clients. A service mesh uses sidecar proxies for service-to-service traffic inside the cluster, giving mTLS, retries and telemetry.' },
    { id: 'iq5', q: 'How do you roll out a new version of a service behind the gateway?', answerMd: 'Register the new version as an upstream, route a small weighted share of traffic (canary) or specific headers to it, watch error rate and latency, increase gradually, and roll back instantly by changing the weights if metrics degrade.' },
  ],
  revision: { notesMd: `- Gateway = edge reverse proxy: routing, authn offload, rate limits, TLS, transform, cache, resilience, observability.
- Pipeline of filters: trace id → auth → rate limit → route → pick healthy upstream → forward (timeouts, breakers) → log async.
- Stateless fleet behind L4 LB; routes in memory (trie), config from control plane; local JWT verification.
- Thin gateway, no business logic; strip client-supplied identity headers; per-upstream isolation.
- Availability: 0.9999 × 0.999 ≈ 99.89%. Mesh = east-west; BFF = per-client gateway.`, flashcards: [
    { id: 'f1', front: 'North-south vs east-west traffic?', backMd: 'North-south: clients to platform (gateway). East-west: service to service (mesh).' },
    { id: 'f2', front: 'How does the gateway validate a JWT without a network call?', backMd: 'Verify the signature locally with cached public keys.' },
    { id: 'f3', front: 'Control plane vs data plane?', backMd: 'Control plane distributes config; data plane proxies requests using the cached config.' },
    { id: 'f4', front: 'Why keep the gateway thin?', backMd: 'Business logic there makes it a bottleneck and a shared monolith.' },
    { id: 'f5', front: 'What is a BFF?', backMd: 'A backend-for-frontend gateway tailored to one client type (web, mobile).' },
  ] },
  resources: [PRIMER, { title: 'Envoy proxy documentation', url: 'https://www.envoyproxy.io/docs/envoy/latest/intro/what_is_envoy', kind: 'official-docs' }, { title: 'Microsoft Azure Architecture: API gateway pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway', kind: 'article' }],
});

const agMcqs: MCQ[] = [
  mcq({ ...q(AG), id: 'sd.ag.q1', type: 'concept', difficulty: 'easy', stem: 'Which of these belongs in an API gateway?', options: ['Authentication, rate limiting and routing', ['Business rules for pricing orders', 'Belongs in the order or pricing service.'], ['Database joins across services', 'Services own their data.'], ['Image resizing algorithms', 'A dedicated service.']], answer: 0, explanation: 'Gateways handle cross-cutting concerns; business logic stays in services.' }),
  mcq({ ...q(AG), id: 'sd.ag.q2', type: 'complexity', difficulty: 'medium', stem: 'A gateway with 99.99% availability sits in front of a service with 99.9% availability. What availability does a client see for that service (ignoring other effects)?', options: ['About 99.89%', ['99.99%', 'The service also has to be up.'], ['99.9999%', 'That is the redundant (parallel) formula.'], ['100%', 'Impossible.']], answer: 0, explanation: '0.9999 × 0.999 ≈ 0.99890.' }),
  mcq({ ...q(AG), id: 'sd.ag.q3', type: 'concept', difficulty: 'medium', stem: 'How can a gateway verify a JWT on each request without calling the auth service?', options: ['Check the signature locally with cached public keys and validate expiry, issuer and audience', ['It cannot; every request needs a call', 'Signature verification is local.'], ['By decrypting the payload', 'JWTs are signed, not encrypted.'], ['By trusting the client', 'Never.']], answer: 0, explanation: 'Local verification keeps latency low and removes a dependency.' }),
  mcq({ ...q(AG), id: 'sd.ag.q4', type: 'scenario', difficulty: 'medium', stem: 'Clients can send `X-User-Id: 1` to your API and impersonate user 1 because services trust that header. What should the gateway do?', options: ['Strip client-supplied identity headers and set them itself after authentication', ['Log the header', 'Logging doesn\'t prevent impersonation.'], ['Require longer headers', 'Meaningless.'], ['Remove authentication to simplify', 'Worse.']], answer: 0, explanation: 'Only trusted components may set identity headers.' }),
  mcq({ ...q(AG), id: 'sd.ag.q5', type: 'concept', difficulty: 'medium', stem: 'One slow upstream service causes all gateway worker connections to hang and every other route times out. Which mechanism prevents this?', options: ['Per-upstream timeouts, circuit breakers and connection limits (bulkheads)', ['Larger request bodies', 'Unrelated.'], ['Turning off logging', 'Unrelated.'], ['Longer client timeouts', 'Makes it worse.']], answer: 0, explanation: 'Isolate failures so a single upstream cannot consume shared gateway resources.' }),
  mcq({ ...q(AG), id: 'sd.ag.q6', type: 'concept', difficulty: 'medium', stem: 'Which statement distinguishes an API gateway from a service mesh?', options: ['A gateway handles client-to-platform (north-south) traffic; a mesh handles service-to-service (east-west) traffic with sidecars', ['They are the same product', 'Different scopes.'], ['A mesh sits outside the cluster only', 'A mesh is inside.'], ['A gateway cannot do routing', 'Routing is its core function.']], answer: 0, explanation: 'They are often used together.' }),
];

// ---------------------------------------------------------------------------------------
const LG = 'sd.case-logging';
const logging = sdTopic({
  id: LG, title: 'Case Study: Logging and Monitoring', level: 'core', estMinutes: 55, prerequisites: ['sd.observability'], related: ['sd.messaging', 'sd.databases', 'devops.observability'],
  summary: 'Ingestion pipelines, storage tiers and alerting.',
  objectives: ['Estimate log volume and storage, and choose retention and tiering.', 'Design a collection → buffer → process → index/store → query pipeline.', 'Design metrics collection (pull vs push), aggregation and alert evaluation.', 'Control cost with sampling, filtering and compression, and keep the pipeline reliable under load.'],
  sections: [
    { id: 'requirements', kind: 'concept', title: '1. Requirements and estimates', bodyMd: `**Functional:** collect **logs** and **metrics** from thousands of servers/containers; search logs by time, service, level, trace id; dashboards; **alerts** on conditions; retention policies; access control.
**Non-functional:** logging must **never slow down or crash the application**; ingestion tolerates bursts; **no silent data loss** for critical logs; search results in seconds for recent data; cost-efficient retention; alerts within ~1 minute.

**Estimates:** 5,000 servers × 200 log lines/s × 300 bytes = 10⁶ lines/s = **300 MB/s ≈ 26 TB/day** raw. With ~10:1 compression about 2.6 TB/day stored. Retention: hot (searchable) 7 days ≈ 18 TB compressed, warm 30–90 days, cold archive 1 year in object storage. Metrics: 5,000 servers × 200 series × one sample per 15 s ≈ 67k samples/s, small compared with logs.` },
    { id: 'pipeline', kind: 'visual', title: '2. Log pipeline design', bodyMd: `\`\`\`
App → local agent (Fluent Bit / Filebeat) → [Kafka topic, partitioned] → stream processors → { search index (hot) | object storage (cold archive) }
                                                                          ↘ alert rules / metrics extraction
Query: UI / API → index (Elasticsearch/OpenSearch/Loki) → results
\`\`\`

1. **Emit:** applications write **structured JSON logs** (timestamp, level, service, trace_id, message, fields) to stdout/files; **never log synchronously over the network from the request path**.
2. **Collect:** a lightweight **agent on every host** (DaemonSet in Kubernetes) tails files, adds metadata (host, pod, version), batches, compresses, and ships with retries and an on-disk buffer.
3. **Buffer:** a **durable message queue (Kafka)** absorbs bursts and decouples producers from consumers; consumers can lag or restart without data loss (retention of hours/days) and several consumers read the same stream.
4. **Process:** stream workers parse, enrich, drop noise, redact secrets/PII, and derive metrics (error counts per service).
5. **Store:** recent logs indexed in a **search engine** (inverted index on time + fields, sharded by time; one index per day makes retention a simple delete); everything also lands in **object storage** (Parquet/compressed) cheaply. Older data moves to **warm/cold tiers** (index lifecycle management).
6. **Query:** time-range + filter queries; because indexes are time-partitioned, only relevant shards are touched.

**Ordering and time:** use event timestamps from the source plus ingestion time; clocks may be skewed, so searches use a small tolerance.` },
    { id: 'metrics-alerts', kind: 'concept', title: '3. Metrics and alerting', bodyMd: `- **Collection:** *pull* (Prometheus scrapes \`/metrics\` endpoints; service discovery finds targets; simple health signal: a failed scrape) versus *push* (agents/StatsD send to a collector; needed for short-lived jobs). Large systems often use both.
- **Storage:** a **time-series database** (Prometheus, VictoriaMetrics, M3, InfluxDB) with compression (delta-of-delta, ~1–2 bytes per sample), **downsampling** (keep 15 s resolution for 15 days, 5-minute rollups for a year) and retention. Shard by metric/series hash; federate or use remote storage (Thanos/Cortex/Mimir) for global views.
- **Alert evaluation:** a rule engine evaluates queries (for example \`error_rate > 5% for 5m\`) every 15–60 s; firing alerts go to an **alert manager** that **deduplicates, groups, silences, routes** (team, severity) and notifies (PagerDuty, Slack), with escalation. Keep the alerting path **independent** from the thing it monitors and add a dead-man's-switch alert so a broken monitoring system is noticed.
- **Dashboards:** query metrics via a UI (Grafana) with templated variables; avoid expensive queries over huge ranges (precomputed recording rules).

**Cardinality** is the main scaling risk of a metrics system (see Observability); enforce label rules at ingestion.` },
    { id: 'deep', kind: 'concept', title: '4. Reliability, cost and security', bodyMd: `- **Back-pressure & loss policy:** if the pipeline is overloaded, agents buffer to disk, then **drop low-priority logs** (DEBUG) first, never block the application. Critical audit logs use a stricter path (acknowledged writes).
- **Hot shards:** one chatty service can flood a partition; partition Kafka by host/service hash, apply per-service quotas, and sample verbose logs (for example keep 1 in 10 INFO lines of a high-volume service, all WARN/ERROR).
- **Cost levers:** drop or sample noisy lines, compress, shorten hot retention, tier to object storage, index fewer fields (Loki indexes only labels), and use columnar formats for long-term analytics.
- **Security & compliance:** redact secrets/PII before storage; encrypt in transit and at rest; **role-based access** per team; immutable/tamper-evident audit logs; retention and deletion policies for privacy rules.
- **Multi-region:** collect locally per region, ship aggregates or searchable indexes on demand rather than moving all raw logs across regions.
- **Self-monitoring:** pipeline lag (Kafka consumer lag), drop counters, indexing latency and disk usage, with alerts; keep a minimal out-of-band path to see the monitoring system's own state.

**New-grad vs senior:** a new grad should show the agent → queue → processor → store → query pipeline with estimates and retention tiers, and explain how alerts are evaluated. Seniors add cardinality governance, cost modelling, multi-region topology, tail-based trace sampling, and the monitoring-of-monitoring problem.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Logging synchronously to a remote service from request threads.
2. Skipping the durable buffer, so a burst or a downstream outage loses logs.
3. Indexing everything forever in the hot tier.
4. Unstructured logs without trace ids.
5. Logging secrets or personal data.
6. Alerts on every error line rather than rates over time.
7. Hosting the monitoring system inside the failure domain it monitors.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Design a centralised logging system.', answerMd: 'Apps emit structured logs; a lightweight agent per host ships them in batches to a Kafka buffer; stream processors parse, enrich, redact and fan out to a time-partitioned search index for recent data and to object storage for cheap long-term archive. Retention is tiered (hot, warm, cold). A query service searches by time and fields. Back-pressure policies drop low-priority logs rather than blocking applications, and the pipeline is monitored for lag and loss.' },
    { id: 'iq2', q: 'Why put Kafka between agents and the search index?', answerMd: 'It absorbs bursts, decouples producers from consumers, retains data while the index is slow or down, lets multiple consumers (index, archive, alert extraction) read the same stream, and allows replay after bugs or reindexing.' },
    { id: 'iq3', q: 'How do you keep logging costs under control?', answerMd: 'Filter and sample noisy logs at the agent or processor, set log levels sensibly, compress, index fewer fields, keep only a short hot retention and move older data to object storage, and set per-service quotas. Measure volume per service to find the offenders.' },
    { id: 'iq4', q: 'Pull vs push for metrics?', answerMd: 'Pull (Prometheus) lets the server control the rate, detect dead targets by failed scrapes and use service discovery; it needs reachable endpoints and struggles with short-lived jobs. Push suits batch jobs and firewalled sources but needs rate control and cannot easily detect "silent" senders. Many systems combine them.' },
    { id: 'iq5', q: 'How do alerts get evaluated and delivered reliably?', answerMd: 'A rule engine runs queries against the time-series store on a schedule and sends firing alerts to an alert manager, which deduplicates, groups, silences, and routes them to on-call tools with escalation. The alerting stack runs redundantly and independently from the monitored system, with a heartbeat alert to detect its own failure.' },
  ],
  revision: { notesMd: `- 5,000 servers × 200 lines/s × 300 B = 300 MB/s ≈ 26 TB/day raw (~2.6 TB compressed at 10:1).
- Pipeline: structured logs → host agent → Kafka → processors (parse, enrich, redact) → search index (hot) + object storage (cold) → query.
- Time-partitioned indices; tiered retention (hot 7d, warm, cold archive).
- Metrics: scrape (pull) + push for jobs; TSDB with downsampling; alert manager dedups/groups/routes; dead-man's switch.
- Never block the app; drop DEBUG first under pressure; sample noisy logs; redact PII; quotas; watch consumer lag.`, flashcards: [
    { id: 'f1', front: 'Why a Kafka buffer in the logging pipeline?', backMd: 'Burst absorption, decoupling, replay and multiple consumers.' },
    { id: 'f2', front: 'Raw log volume for 1M lines/s of 300 B?', backMd: '300 MB/s ≈ 26 TB/day.' },
    { id: 'f3', front: 'How is retention made cheap in a search index?', backMd: 'Time-partitioned (daily) indices so old data is dropped or moved as a whole.' },
    { id: 'f4', front: 'What does the alert manager do?', backMd: 'Deduplicates, groups, silences and routes alerts, with escalation.' },
    { id: 'f5', front: 'What drops first under overload?', backMd: 'Low-priority (DEBUG) logs; critical logs use a stricter path.' },
  ] },
  resources: [PRIMER, { title: 'Prometheus: Overview', url: 'https://prometheus.io/docs/introduction/overview/', kind: 'official-docs' }, { title: 'Elastic: Index lifecycle management', url: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html', kind: 'official-docs' }, { title: 'Grafana Loki overview', url: 'https://grafana.com/docs/loki/latest/get-started/overview/', kind: 'official-docs' }],
});

const lgMcqs: MCQ[] = [
  mcq({ ...q(LG), id: 'sd.lg.q1', type: 'complexity', difficulty: 'medium', stem: 'The fleet produces 1,000,000 log lines per second at 300 bytes each. About how much raw data is that per day?', options: ['About 26 TB', ['About 2.6 TB', 'Off by a factor of ten.'], ['About 260 TB', 'Off by a factor of ten.'], ['About 300 GB', 'That is about 1,000 seconds of data (300 MB per second).']], answer: 0, explanation: '300 MB/s × 86,400 s ≈ 25.9 TB/day.' }),
  mcq({ ...q(LG), id: 'sd.lg.q2', type: 'concept', difficulty: 'medium', stem: 'Why place a durable queue such as Kafka between collection agents and the search index?', options: ['It absorbs bursts and lets consumers lag, restart or be replayed without losing logs', ['It encrypts the logs', 'Not its purpose.'], ['It makes logs smaller', 'Unrelated.'], ['It removes the need for agents', 'Agents still ship data.']], answer: 0, explanation: 'Decoupling by a durable buffer is the standard way to survive downstream slowness.' }),
  mcq({ ...q(LG), id: 'sd.lg.q3', type: 'concept', difficulty: 'easy', stem: 'Application code should send logs to the central system by:', options: ['Writing to stdout/files and letting a local agent ship them asynchronously', ['Calling the log server synchronously in every request', 'A slow log server would slow every request.'], ['Emailing them', 'Silly.'], ['Writing to the primary database', 'Overloads the DB and mixes concerns.']], answer: 0, explanation: 'Logging must never block or crash the application.' }),
  mcq({ ...q(LG), id: 'sd.lg.q4', type: 'concept', difficulty: 'medium', stem: 'Why are search indices usually partitioned by time (for example one per day)?', options: ['Queries filter by time range, and retention becomes dropping whole old indices cheaply', ['Because times are unique', 'Not the reason.'], ['To make logs immutable', 'Unrelated.'], ['To avoid replication', 'Unrelated.']], answer: 0, explanation: 'Time partitioning limits the shards a query touches and makes lifecycle management simple.' }),
  mcq({ ...q(LG), id: 'sd.lg.q5', type: 'concept', difficulty: 'medium', stem: 'The logging pipeline is overloaded. What is the right priority policy?', options: ['Buffer, then drop low-priority logs (such as DEBUG) first, never blocking the application, while critical logs get a stricter path', ['Block application threads until logs drain', 'Turns a logging problem into an outage.'], ['Drop random logs including audit logs', 'Critical logs must be protected.'], ['Stop all alerts', 'Alerts are most needed during incidents.']], answer: 0, explanation: 'Shedding load by priority keeps the product up and preserves what matters.' }),
  mcq({ ...q(LG), id: 'sd.lg.q6', type: 'concept', difficulty: 'medium', stem: 'How can the monitoring system detect its own failure (for example the metrics pipeline silently stopping)?', options: ['A heartbeat (dead-man\'s-switch) alert that fires when expected data stops arriving, evaluated outside the monitored system', ['Nothing can detect it', 'Heartbeats and external probes can.'], ['Ask users to report it', 'Too slow and unreliable.'], ['Disable alerting', 'Removes detection.']], answer: 0, explanation: 'Absence of data is itself a signal worth alerting on.' }),
];

// ---------------------------------------------------------------------------------------
const VD = 'sd.case-video';
const video = sdTopic({
  id: VD, title: 'Case Study: Basic Video Streaming', level: 'core', estMinutes: 55, prerequisites: ['sd.caching'], related: ['sd.case-file-storage', 'sd.databases', 'sd.scalability'],
  summary: 'Upload, transcoding, CDN and adaptive bitrate.',
  objectives: ['Estimate storage and bandwidth for a video platform and see why a CDN is mandatory.', 'Design the upload → transcode → store → deliver pipeline with a job queue.', 'Explain adaptive bitrate streaming (HLS/DASH), segments and manifests.', 'Handle metadata, popularity skew, cost and content protection at a basic level.'],
  sections: [
    { id: 'requirements', kind: 'concept', title: '1. Requirements and estimates', bodyMd: `**Functional:** users **upload** videos, others **watch** them smoothly on varied devices and networks, search/browse metadata (out of scope: recommendations, live streaming, comments).
**Non-functional:** fast start (< 2 s), **no buffering** across bandwidths, high availability for playback, **durable** uploads, cost control (storage and egress dominate), scalable transcoding.

**Estimates:** 1M videos uploaded/day × 10 minutes average. A 10-minute source at 1080p ≈ 500 MB raw upload → **500 TB/day** of uploads; transcoding to ~5 renditions roughly doubles to triples that (renditions are smaller: 1080p ≈ 5 Mbps, so 10 min ≈ 375 MB).
Playback bandwidth: **5 Mbps** per 1080p viewer = 5 × 10⁶ / 8 × 3,600 ≈ **2.25 GB per viewer-hour**. With **1 million concurrent viewers**, that is 10⁶ × 5 Mbps = **5 Tbit/s**, impossible from a few origin servers, so almost all traffic must be served from **CDN edges** near viewers. Reads outnumber writes by orders of magnitude.` },
    { id: 'pipeline', kind: 'visual', title: '2. Upload and processing pipeline', bodyMd: `\`\`\`
Client --(resumable, chunked upload via pre-signed URL)--> Object storage (raw)
        \\--> API: create video record (status=uploading)
Object storage event --> Queue --> Transcoding workers (parallel, per segment/rendition)
                                    --> Object storage (renditions + HLS/DASH segments + manifest + thumbnails)
                                    --> Metadata DB (status=ready) --> notify user
Playback: Client --> CDN edge --(miss)--> origin/object storage
\`\`\`

1. **Upload:** resumable, chunked uploads straight to object storage with pre-signed URLs (don't proxy gigabytes through app servers). Validate size, type and ownership.
2. **Metadata service:** relational/KV store for video id, owner, title, status, renditions, duration, visibility, counts.
3. **Transcoding:** an event queues a job; a pool of workers (CPU/GPU instances, autoscaled on queue length, often spot instances) splits the video into **GOP-aligned segments**, transcodes segments **in parallel** into a **bitrate ladder** (for example 240p, 360p, 480p, 720p, 1080p, plus audio) with codecs such as H.264 (universal) and VP9/AV1 (smaller, slower to encode), and generates thumbnails. Jobs are **idempotent and retried**; a DAG (split → encode → merge/package → thumbnail → publish) manages dependencies.
4. **Packaging:** produce **HLS** (\`.m3u8\` playlists + \`.ts\`/fMP4 segments) or **MPEG-DASH** (\`.mpd\` + segments).
5. **Publish:** mark the video ready; invalidate nothing (new immutable objects).` },
    { id: 'delivery', kind: 'concept', title: '3. Delivery: adaptive bitrate and the CDN', bodyMd: `**Adaptive bitrate streaming (ABR):** the video is cut into short **segments** (2–10 s, for example 4 s: a 10-minute video has 150 segments per rendition) in several quality levels. The player downloads the **manifest** (lists renditions and segment URLs), measures its recent download throughput and buffer level, and **picks the best affordable rendition for each next segment**, switching up or down seamlessly. This is plain HTTP: it works through ordinary CDNs and caches.

**CDN strategy:**
- Segments are **immutable and cacheable** with long TTLs; popular videos stay in edge caches; a **cache hit** never touches the origin.
- **Tiered caching** (edge → regional → origin shield) protects the origin on misses.
- **Popularity is highly skewed** (a small share of videos get most views): cache the head at the edge; serve the long tail from regional/origin storage, accepting slower starts.
- **Pre-warm** (push) new releases expected to be popular; use **anycast/DNS** to route users to nearby edges.
- Large providers peer directly with ISPs or place caches inside them (Netflix Open Connect) to cut transit cost.

**Cost levers:** egress bandwidth is usually the biggest bill. Use efficient codecs, a sensible bitrate ladder, cold storage for rarely watched renditions, deleting unneeded renditions, and CDN contracts. Storage is cheap by comparison.` },
    { id: 'deep', kind: 'concept', title: '4. Deep dives and extras', bodyMd: `- **Fast start:** serve a low-bitrate first segment, then ramp up; keep manifests small; use HTTP/2 or HTTP/3 and TLS session reuse; prefetch the next segments.
- **Resumable uploads & integrity:** chunk with checksums; abandoned uploads are cleaned by a lifecycle rule.
- **Metadata scale:** videos table sharded by video id; view counts handled with a **counter pipeline** (events → stream aggregation → periodic update) rather than a row update per view (hot row).
- **Search/recommendations:** a search index fed from metadata; recommendations are an offline ML pipeline (out of scope).
- **Content protection:** signed, expiring URLs/cookies for private videos; **DRM** (Widevine, FairPlay) for premium content; basic moderation/copyright checks (fingerprinting) at upload.
- **Failure handling:** retry failed transcodes, dead-letter after N attempts and alert; if a rendition is missing the player falls back to another; replicate objects across zones; multi-CDN for resilience.
- **Observability:** startup time, rebuffer ratio, bitrate distribution, CDN hit ratio, transcoding queue lag and failure rate (quality-of-experience metrics).

**New-grad vs senior:** a new grad should explain chunked upload to object storage, queue-based parallel transcoding into multiple bitrates, HLS/DASH ABR and the CDN with the estimates that justify it. Seniors discuss encoding cost (codec choice, per-title encoding), CDN tiering and peering economics, DRM, multi-CDN failover, and QoE-driven operations.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Streaming from origin servers instead of a CDN.
2. Uploading through the application servers.
3. One monolithic transcoding job per video instead of parallel segments and a queue.
4. A single bitrate (no adaptive streaming).
5. Updating a view-count row on every view.
6. Ignoring egress cost.
7. Forgetting private-video access control (unsigned URLs).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Design a basic video streaming service.', answerMd: 'Uploads go in resumable chunks straight to object storage via pre-signed URLs. A queue triggers autoscaled transcoding workers that split the video, encode segments in parallel into a bitrate ladder and package HLS/DASH segments with manifests and thumbnails into object storage, then mark the video ready in the metadata DB. Players fetch the manifest and adaptively choose segments over HTTP through a CDN with tiered caching.' },
    { id: 'iq2', q: 'What is adaptive bitrate streaming?', answerMd: 'The video is encoded at several qualities and cut into short segments. The player measures throughput and buffer and requests each next segment from the best rendition it can sustain, switching smoothly as conditions change, which avoids buffering on slow links and uses high quality on fast ones.' },
    { id: 'iq3', q: 'Why is a CDN essential here?', answerMd: 'Playback bandwidth is huge (1M concurrent 5 Mbps viewers is 5 Tbit/s). Edge caches near viewers serve immutable segments with low latency and offload the origin; without a CDN, origin bandwidth and latency would be impossible and egress cost unmanageable.' },
    { id: 'iq4', q: 'How do you transcode quickly at scale?', answerMd: 'Split the video into independent segments, transcode them in parallel across a pool of workers (autoscaled on queue depth), for each rendition in the ladder, then stitch/package. Make jobs idempotent with retries and a dead-letter queue, and use cheaper preemptible capacity where possible.' },
    { id: 'iq5', q: 'How do you count views without a hot row?', answerMd: 'Emit view events to a stream, aggregate counts in a stream processor or cache (approximate, batched), and write the totals to the database periodically. This avoids a row update per view and tolerates slight delay.' },
  ],
  revision: { notesMd: `- 5 Mbps ≈ 2.25 GB/viewer-hour; 1M concurrent viewers = 5 Tbit/s → CDN mandatory; egress is the big cost.
- Upload: chunked/resumable to object storage (pre-signed URLs) → queue → parallel segment transcoding into a bitrate ladder → HLS/DASH segments + manifest + thumbnails → metadata DB.
- ABR: 2–10 s segments, player picks rendition per segment from throughput/buffer; plain HTTP, CDN-cacheable, immutable.
- CDN: tiered caching, origin shield, pre-warm popular, long tail from origin.
- View counts via event stream; signed URLs/DRM; metrics: startup time, rebuffer ratio, hit ratio.`, flashcards: [
    { id: 'f1', front: 'Data per viewer-hour at 5 Mbps?', backMd: '2.25 GB.' },
    { id: 'f2', front: 'What does the HLS manifest contain?', backMd: 'The list of renditions and segment URLs.' },
    { id: 'f3', front: 'Why transcode in parallel segments?', backMd: 'It cuts total time and allows retrying only failed pieces.' },
    { id: 'f4', front: 'Largest cost in video streaming?', backMd: 'Egress bandwidth.' },
    { id: 'f5', front: 'Why are segments easy to cache?', backMd: 'They are immutable, static files fetched over HTTP.' },
  ] },
  resources: [PRIMER, { title: 'Apple: HTTP Live Streaming (HLS) overview', url: 'https://developer.apple.com/streaming/', kind: 'official-docs' }, { title: 'Netflix Tech Blog: Open Connect', url: 'https://openconnect.netflix.com/en/', kind: 'article' }, { title: 'MDN: Setting up adaptive streaming media sources', url: 'https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery/Setting_up_adaptive_streaming_media_sources', kind: 'official-docs' }],
});

const vdMcqs: MCQ[] = [
  mcq({ ...q(VD), id: 'sd.vd.q1', type: 'complexity', difficulty: 'medium', stem: 'One million viewers watch simultaneously at 5 Mbit/s each. What is the total outgoing bandwidth?', options: ['5 Tbit/s', ['500 Gbit/s', 'Off by a factor of ten.'], ['50 Tbit/s', 'Off by a factor of ten.'], ['5 Gbit/s', 'Off by a factor of 1000.']], answer: 0, explanation: '10⁶ × 5 × 10⁶ bit/s = 5 × 10¹² bit/s, far beyond an origin, hence a CDN.' }),
  mcq({ ...q(VD), id: 'sd.vd.q2', type: 'complexity', difficulty: 'easy', stem: 'How much data does a viewer download in one hour of 5 Mbit/s video?', options: ['About 2.25 GB', ['About 225 MB', 'Off by a factor of ten.'], ['About 22.5 GB', 'Off by a factor of ten.'], ['About 5 GB', 'That forgets dividing bits by 8 and misses the factor.']], answer: 0, explanation: '5 Mbit/s = 0.625 MB/s × 3,600 s = 2,250 MB.' }),
  mcq({ ...q(VD), id: 'sd.vd.q3', type: 'concept', difficulty: 'medium', stem: 'What is the purpose of adaptive bitrate streaming?', options: ['The player switches between quality levels per segment to match available bandwidth and avoid buffering', ['It makes videos smaller on disk', 'Several renditions use more storage.'], ['It encrypts the video', 'Unrelated.'], ['It removes the need for a CDN', 'It works together with a CDN.']], answer: 0, explanation: 'Segments in a ladder of qualities plus a manifest let the client adapt continuously.' }),
  mcq({ ...q(VD), id: 'sd.vd.q4', type: 'concept', difficulty: 'medium', stem: 'Why should large uploads go directly to object storage using pre-signed URLs?', options: ['It avoids proxying gigabytes through app servers, scales better and supports resumable chunked uploads', ['Pre-signed URLs compress videos', 'They don\'t.'], ['It skips authentication entirely', 'URLs are signed, time-limited and scoped.'], ['It makes transcoding unnecessary', 'Unrelated.']], answer: 0, explanation: 'App servers should only authorise the upload, not carry the bytes.' }),
  mcq({ ...q(VD), id: 'sd.vd.q5', type: 'concept', difficulty: 'medium', stem: 'How should transcoding be organised for a 2-hour movie to finish quickly?', options: ['Split into segments and encode them in parallel across workers, per rendition, then package', ['One worker encodes the whole file sequentially', 'Slow and unrecoverable on failure.'], ['The player transcodes on demand', 'Impractical for all devices.'], ['Skip lower bitrates', 'Breaks adaptive streaming.']], answer: 0, explanation: 'Parallel segment encoding also allows retrying only failed segments.' }),
  mcq({ ...q(VD), id: 'sd.vd.q6', type: 'scenario', difficulty: 'medium', stem: 'A viral video\'s view counter is updated with `UPDATE videos SET views = views + 1` on every view and the database slows down. What is the better design?', options: ['Emit view events to a stream, aggregate in memory or a stream processor, and write totals periodically', ['Add more indexes on the views column', 'Makes writes slower.'], ['Remove the counter', 'A product requirement.'], ['Lock the table', 'Worse.']], answer: 0, explanation: 'Avoid a hot row; trade exactness for batching.' }),
];

export const topics: Topic[] = [feed, gateway, logging, video];
export const mcqs: MCQ[] = [...nfMcqs, ...agMcqs, ...lgMcqs, ...vdMcqs];
