import type { MCQ, Resource, Topic } from '../schema';
import { cpp, mcq } from '../helpers';

const MASTERY = { testSize: 6, testMinutes: 12, passPct: 75, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 10 };
const PRIMER: Resource = { title: 'The System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer', kind: 'article' };
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
const sdTopic = (t: TopicInput): Topic => ({ moduleId: 'system-design', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
const q = (topic: string) => ({ topics: [topic], module: 'system-design' as const });

// ---------------------------------------------------------------------------------------
const ES = 'sd.estimation';
const estimation = sdTopic({
  id: ES, title: 'Back-of-the-Envelope Estimation', level: 'foundation', estMinutes: 40, prerequisites: ['sd.requirements'],
  summary: 'QPS, storage and bandwidth maths with latency numbers.',
  objectives: ['Convert daily volumes into average and peak QPS.', 'Estimate storage over years and bandwidth.', 'Use latency numbers to reason about design choices.', 'State assumptions out loud and round aggressively.'],
  sections: [
    { id: 'tools', kind: 'concept', title: 'The handful of numbers you need', bodyMd: `- **1 day ≈ 86,400 s ≈ 10⁵ s** (rounding up is fine). So 1 million requests/day ≈ **12 QPS**, and 1 billion/day ≈ **12,000 QPS**.
- **Peak ≈ 2–3× average** (state your factor).
- Powers of two: 2¹⁰ ≈ 1 thousand (KB), 2²⁰ ≈ 1 million (MB), 2³⁰ ≈ 1 billion (GB), 2⁴⁰ ≈ 1 trillion (TB).
- Read:write ratios: social feeds and URL shorteners are read-heavy (often 100:1 or more).

**Latency intuition** (orders of magnitude): memory reference ~100 ns; SSD random read ~100 µs; round trip within a data centre ~0.5 ms; disk seek ~10 ms; cross-continent round trip ~100–150 ms. Memory is ~1000× faster than SSD; network across regions dominates everything.` },
    { id: 'dry-run', kind: 'dry-run', title: 'Worked example: a URL shortener', bodyMd: `Assume **100 million new URLs per month** and a **100:1** read:write ratio.

- Writes: 10⁸ / (30 × 86,400) ≈ **40 per second**. Reads ≈ **4,000 per second** (peak ~10k).
- Storage: 500 bytes per record × 10⁸ per month = **50 GB/month**, so **3 TB over 5 years**: one large database, or a few shards.
- Keys over 5 years: 6 × 10⁹. Base62 with 7 characters gives 62⁷ ≈ **3.5 × 10¹²** codes: plenty.
- Cache: if 20% of URLs get 80% of traffic, caching the hot set of recent links fits comfortably in memory.

Write the numbers down; the point is to justify decisions (one DB vs sharding, cache size), not precision.` },
    { id: 'recognition', kind: 'recognition', title: 'What the numbers tell you', bodyMd: `| Result | Implication |
|---|---|
| < ~1k QPS | a single well-indexed database and a few app servers are fine |
| ~10k+ QPS reads | add caching and read replicas |
| ~TBs of data growing fast | plan partitioning (sharding) and archival |
| Large media | object storage + CDN, not the database |
| Cross-region users | CDN, regional deployments, async replication |` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Spending ten minutes on arithmetic; round to powers of ten.
2. Forgetting peak traffic and replication factor (3 copies triples storage).
3. Computing numbers and never using them to make a decision.
4. Silent assumptions; say "I'll assume 100M DAU, 10 reads each per day".` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'A service has 50 million daily active users, each making 20 requests a day. What are the average and peak QPS?', answerMd: '50M × 20 = 10⁹ requests/day ÷ ~86,400 ≈ 11,600 average QPS, so roughly 12k. With a 2–3× peak factor, plan for about 25–35k QPS.' },
    { id: 'iq2', q: 'How much storage for 1 billion tweets of 300 bytes each, replicated 3 times?', answerMd: '10⁹ × 300 B = 300 GB, × 3 replicas = 900 GB, before indexes and media. Media (images and video) would be far larger and belongs in object storage.' },
    { id: 'iq3', q: 'Why does it matter that memory is ~1000× faster than SSD?', answerMd: 'It justifies caching hot data in memory (Redis, in-process caches) and keeping working sets in RAM: a cache hit can turn a ~1 ms database query into a ~0.1 ms lookup and offloads the database.' },
    { id: 'iq4', q: 'How long should estimation take in a 45-minute interview?', answerMd: 'Around five minutes. Get rough QPS, storage and bandwidth figures, state the assumptions, and use them to drive design decisions.' },
  ],
  revision: { notesMd: `- 1 day ≈ 86,400 s ≈ 10⁵ s; 1M/day ≈ 12 QPS; 1B/day ≈ 12k QPS.
- Peak = 2–3× average.
- KB, MB, GB, TB ≈ 10³, 10⁶, 10⁹, 10¹² bytes.
- Memory ~100 ns, SSD ~100 µs, DC round trip ~0.5 ms, cross-continent ~150 ms.
- Base62⁷ ≈ 3.5 trillion.`, flashcards: [
    { id: 'f1', front: '1 billion requests/day ≈ how many QPS?', backMd: '≈ 11,600 (about 12k).' },
    { id: 'f2', front: 'Typical peak factor?', backMd: '2–3× average.' },
    { id: 'f3', front: '62⁷ ≈ ?', backMd: '≈ 3.5 × 10¹².' },
    { id: 'f4', front: 'Round trip within a data centre?', backMd: '~0.5 ms.' },
    { id: 'f5', front: '100M records × 500 B?', backMd: '50 GB.' },
  ] },
  resources: [PRIMER, { title: 'Latency numbers every programmer should know (gist)', url: 'https://gist.github.com/jboner/2841832', kind: 'article' }],
});

const esMcqs: MCQ[] = [
  mcq({ ...q(ES), id: 'sd.es.q1', type: 'scenario', difficulty: 'easy', stem: 'About how many requests per second is 1 billion requests per day, on average?', options: ['About 12,000', ['About 1,000', 'Off by an order of magnitude.'], ['About 100,000', 'Off by an order of magnitude.'], ['About 1,000,000', 'Far too high.']], answer: 0, explanation: '10⁹ / 86,400 ≈ 11,574.' }),
  mcq({ ...q(ES), id: 'sd.es.q2', type: 'scenario', difficulty: 'medium', stem: 'A URL shortener stores 100 million new URLs per month at 500 bytes each. Roughly how much storage over 5 years (no replication)?', options: ['About 3 TB', ['About 50 GB', 'That is one month.'], ['About 600 GB', 'That is one year.'], ['About 30 TB', 'Off by 10×.']], answer: 0, explanation: '50 GB/month × 60 months = 3,000 GB ≈ 3 TB.' }),
  mcq({ ...q(ES), id: 'sd.es.q3', type: 'concept', difficulty: 'medium', stem: 'How many distinct 7-character base62 codes exist (approximately)?', options: ['3.5 trillion', ['62 million', 'That is closer to 62⁴ × 4.'], ['3.5 billion', 'That is about 62^5.3; recompute 62⁷.'], ['7 × 62 = 434', 'Combinations multiply.']], answer: 0, explanation: '62⁷ = 3,521,614,606,208 ≈ 3.5 × 10¹².' }),
  mcq({ ...q(ES), id: 'sd.es.q4', type: 'concept', difficulty: 'easy', stem: 'Which is fastest?', options: ['Reading from main memory', ['Random read from an SSD', '~100 µs vs ~100 ns.'], ['A round trip within a data centre', '~0.5 ms.'], ['A cross-continent round trip', '~150 ms.']], answer: 0, explanation: 'Memory access is on the order of 100 ns.' }),
  mcq({ ...q(ES), id: 'sd.es.q5', type: 'scenario', difficulty: 'medium', stem: 'Your estimate shows 300 write QPS and 30,000 read QPS. What is the most sensible first step?', options: ['Add a cache (and read replicas) in front of the database', ['Shard the database by user immediately', 'Writes are low; reads are the problem.'], ['Switch to a message queue for reads', 'Queues do not serve reads.'], ['Nothing; one database handles 30k QPS of anything', 'Risky without caching.']], answer: 0, explanation: 'Read-heavy workloads are solved with caching and replicas first.' }),
  mcq({ ...q(ES), id: 'sd.es.q6', type: 'scenario', difficulty: 'medium', stem: '900 GB of raw data, replication factor 3. How much disk do you need before indexes?', options: ['2.7 TB', ['900 GB', 'Forgot replicas.'], ['300 GB', 'Divided instead of multiplied.'], ['9 TB', 'Off by 3×.']], answer: 0, explanation: '900 GB × 3 = 2,700 GB.' }),
];

// ---------------------------------------------------------------------------------------
const CA = 'sd.caching';
const caching = sdTopic({
  id: CA, title: 'Caching', level: 'core', estMinutes: 50, prerequisites: ['sd.scalability'],
  summary: 'Cache-aside, write-through, eviction and invalidation.',
  objectives: ['Choose a caching pattern (cache-aside, write-through, write-back) and explain its consistency trade-offs.', 'Pick eviction (LRU, LFU, TTL) and TTL values.', 'Handle stampedes, penetration and hot keys.', 'Explain where caches live (client, CDN, application, database).'],
  sections: [
    { id: 'patterns', kind: 'comparison', title: 'Caching patterns', bodyMd: `| Pattern | Read | Write | Trade-off |
|---|---|---|---|
| **Cache-aside (lazy)** | app checks cache; on a miss reads the DB and fills the cache | app writes the DB and **deletes** the cache key | most common; first read after a change is slow; small stale window |
| **Read-through** | the cache itself loads from the DB on a miss | — | simpler app code |
| **Write-through** | — | write cache and DB synchronously | cache always fresh; slower writes |
| **Write-back (behind)** | — | write cache; flush to DB asynchronously | fast writes; **data loss risk** on cache failure |
| **Write-around** | — | write DB only | avoids polluting cache with data never read |

Prefer **deleting** the key on update over writing the new value: two concurrent writers updating the cache can leave it with the older value.` },
    { id: 'problems', kind: 'concept', title: 'Failure modes', bodyMd: `- **Stampede (thundering herd):** a hot key expires and thousands of requests hit the DB at once. Fix: request coalescing (one loader, others wait), a lock per key, early refresh, and **TTL jitter** so keys do not expire together.
- **Penetration:** requests for keys that do not exist bypass the cache every time. Fix: cache negative results briefly, or use a Bloom filter.
- **Hot key:** one key gets a huge share of traffic and overloads one cache node. Fix: replicate the key, add a local in-process cache.
- **Stale data:** pick TTLs per data type; invalidate on writes; accept bounded staleness where the product allows it.` },
    { id: 'code', kind: 'code', title: 'Cache-aside with an LRU', bodyMd: 'In-process LRU (the classic interview data structure) used cache-aside. `loadFromDb` stands for the slow path.', code: [cpp(`#include <list>
#include <string>
#include <unordered_map>
#include <utility>
using namespace std;
class LruCache {
    size_t cap;
    list<pair<string, string>> items;                                  // front = most recent
    unordered_map<string, list<pair<string, string>>::iterator> pos;
public:
    explicit LruCache(size_t c) : cap(c) {}
    bool get(const string& k, string& out) {
        auto it = pos.find(k);
        if (it == pos.end()) return false;
        items.splice(items.begin(), items, it->second);                 // mark as recent
        out = it->second->second;
        return true;
    }
    void put(const string& k, const string& v) {
        auto it = pos.find(k);
        if (it != pos.end()) { it->second->second = v; items.splice(items.begin(), items, it->second); return; }
        if (items.size() == cap) { pos.erase(items.back().first); items.pop_back(); }
        items.emplace_front(k, v);
        pos[k] = items.begin();
    }
    void erase(const string& k) {
        auto it = pos.find(k);
        if (it != pos.end()) { items.erase(it->second); pos.erase(it); }
    }
};

string loadFromDb(const string& key) { return "value-of-" + key; }     // stand-in for the slow path

string getUser(LruCache& cache, const string& key) {
    string v;
    if (cache.get(key, v)) return v;         // hit
    v = loadFromDb(key);                     // miss: read the source of truth
    cache.put(key, v);
    return v;
}`, 'C++')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Adding a cache without saying how it is invalidated.
2. Same TTL for every key, so they expire together (stampede).
3. Write-back for money or orders (data loss on cache crash).
4. Caching per-user data in a shared CDN cache (privacy leak); use \`Cache-Control: private\`.
5. Ignoring the cold start after a cache flush.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain cache-aside and its consistency issue.', answerMd: 'The application reads from the cache and, on a miss, loads from the database and populates the cache; on writes it updates the database then deletes the cache key. A race (a reader loading an old value just before a delete completes) can leave stale data until the TTL, so TTLs bound the staleness.' },
    { id: 'iq2', q: 'What is a cache stampede and how do you prevent it?', answerMd: 'When a hot key expires, many concurrent misses hit the database simultaneously. Prevent it with per-key locks or request coalescing (single flight), refreshing popular keys before expiry, and adding random jitter to TTLs.' },
    { id: 'iq3', q: 'Write-through vs write-back?', answerMd: 'Write-through writes to the cache and the database synchronously: consistent but slower writes. Write-back acknowledges after writing to the cache and flushes later: fast, absorbs bursts, but risks losing data if the cache fails before flushing.' },
    { id: 'iq4', q: 'Where can caches live in a web system?', answerMd: 'Browser (HTTP caching), CDN (static and cacheable responses at the edge), reverse proxy, application (in-process or Redis/Memcached), and the database\'s own buffer pool.' },
  ],
  revision: { notesMd: `- Cache-aside: read miss → DB → fill; write → DB then delete key.
- Write-through: consistent, slower writes. Write-back: fast, loss risk.
- Stampede → single flight, locks, TTL jitter.
- Penetration → negative caching or Bloom filter.
- Hot key → replicate or local cache.`, flashcards: [
    { id: 'f1', front: 'On update in cache-aside, update or delete the key?', backMd: 'Delete (avoids racing writers leaving an old value).' },
    { id: 'f2', front: 'Fix for many keys expiring at once?', backMd: 'Add TTL jitter.' },
    { id: 'f3', front: 'Cache penetration?', backMd: 'Repeated lookups of non-existent keys that always miss and hit the DB.' },
    { id: 'f4', front: 'Pattern with data-loss risk?', backMd: 'Write-back (write-behind).' },
    { id: 'f5', front: 'LRU cache data structures?', backMd: 'Hash map + doubly linked list.' },
  ] },
  resources: [PRIMER, { title: 'Caching challenges and strategies (Amazon Builders\' Library)', url: 'https://builder.aws.com/content/3K9TeXp6strMiJ4vhakpRD7BQWO/caching-challenges-and-strategies', kind: 'article' }],
});

const caMcqs: MCQ[] = [
  mcq({ ...q(CA), id: 'sd.ca.q1', type: 'scenario', difficulty: 'medium', stem: 'A celebrity\'s profile key expires and the database CPU spikes to 100% for a few seconds. What happened and what is the best fix?', options: ['A cache stampede; use single-flight loading (or a per-key lock) and refresh hot keys early', ['Cache penetration; add a Bloom filter', 'The key exists.'], ['Write-back data loss', 'Nothing was lost.'], ['Database deadlock; add an index', 'The cause is concurrent misses.']], answer: 0, explanation: 'Only one request should rebuild the value while others wait or serve stale data.' }),
  mcq({ ...q(CA), id: 'sd.ca.q2', type: 'concept', difficulty: 'medium', stem: 'Which write strategy risks losing acknowledged writes if the cache node crashes?', options: ['Write-back (write-behind)', ['Write-through', 'The DB is written synchronously.'], ['Cache-aside', 'The DB is the source of truth.'], ['Write-around', 'Writes go straight to the DB.']], answer: 0, explanation: 'Writes are acknowledged before reaching durable storage.' }),
  mcq({ ...q(CA), id: 'sd.ca.q3', type: 'scenario', difficulty: 'medium', stem: 'Attackers request random non-existent product IDs, and every request reaches the database. What helps most?', options: ['Cache negative results briefly and/or check a Bloom filter of existing IDs', ['Longer TTLs on existing products', 'The keys requested do not exist.'], ['Write-through caching', 'Not about writes.'], ['A bigger cache', 'Misses for absent keys are unaffected by size.']], answer: 0, explanation: 'This is cache penetration.' }),
  mcq({ ...q(CA), id: 'sd.ca.q4', type: 'concept', difficulty: 'medium', stem: 'In cache-aside, why is it usually better to delete the cache entry on update rather than overwrite it?', options: ['Concurrent updates can interleave so that an older value is written to the cache last', ['Deleting is faster than writing in every cache', 'Not the reason.'], ['Overwriting is not supported by Redis', 'It is.'], ['It avoids database writes', 'The DB is still written.']], answer: 0, explanation: 'After a delete the next reader loads the current value from the database.' }),
  mcq({ ...q(CA), id: 'sd.ca.q5', type: 'concept', difficulty: 'easy', stem: 'Which eviction policy removes the item that has not been accessed for the longest time?', options: ['LRU', ['LFU', 'Least frequently used.'], ['FIFO', 'Oldest inserted.'], ['Random', 'Random choice.']], answer: 0, explanation: 'Least recently used: the entry untouched for the longest time is evicted first.' }),
  mcq({ ...q(CA), id: 'sd.ca.q6', type: 'scenario', difficulty: 'medium', stem: 'A CDN served user A\'s account page to user B. What is the most likely misconfiguration?', options: ['A personalised response was marked publicly cacheable (it needed Cache-Control: private or no-store)', ['TTL too short', 'Short TTLs do not mix users.'], ['DNS caching', 'Unrelated.'], ['The cache used LRU', 'Eviction does not mix users.']], answer: 0, explanation: 'Shared caches must never store per-user responses.' }),
];

// ---------------------------------------------------------------------------------------
const LB = 'sd.load-balancing';
const lb = sdTopic({
  id: LB, title: 'Load Balancing', level: 'core', estMinutes: 35, prerequisites: ['sd.scalability'],
  summary: 'Algorithms, health checks, L4 vs L7.',
  objectives: ['Choose a balancing algorithm for a workload.', 'Compare L4 and L7 load balancers.', 'Explain health checks, connection draining and sticky sessions.', 'Avoid making the load balancer a single point of failure.'],
  sections: [
    { id: 'algos', kind: 'comparison', title: 'Algorithms', bodyMd: `| Algorithm | Good for |
|---|---|
| Round robin / weighted round robin | similar, short requests; weights for bigger machines |
| Least connections / least outstanding requests | requests with very different durations |
| IP or key hash (consistent hashing) | affinity: the same user or key goes to the same server (caches, sessions) |
| Random of two choices ("power of two") | simple and close to least-loaded at scale |` },
    { id: 'l4l7', kind: 'concept', title: 'L4 vs L7', bodyMd: `- **L4** balancers route by IP and port (TCP/UDP) without reading the payload: very fast, protocol-agnostic, cannot route by URL.
- **L7** balancers terminate HTTP(S): route by path, host or header, rewrite headers, terminate TLS, retry, rate limit, cache. More CPU, more features.

Common setup: DNS (or anycast) → L4/L7 load balancer pair → service instances. **Health checks** remove failing instances; **connection draining** lets in-flight requests finish during deploys.` },
    { id: 'state', kind: 'concept', title: 'Sticky sessions vs stateless services', bodyMd: 'Sticky sessions pin a user to one server so in-memory session data works, but they unbalance load and lose sessions when that server dies. Prefer **stateless** app servers with sessions in a shared store (Redis) or a signed token, so any instance can serve any request and scaling is trivial.' },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Drawing one load balancer and calling the design highly available (run a redundant pair, or a managed LB).
2. Round robin for very uneven request costs.
3. Health checks that only check the process is up, not that dependencies work (or the opposite: deep checks that take the whole fleet out when one dependency blips).
4. Relying on sticky sessions for correctness.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'L4 vs L7 load balancer?', answerMd: 'L4 forwards TCP/UDP connections based on addresses and ports without looking at content: fast and simple. L7 understands HTTP, so it can route by path or header, terminate TLS, retry and add auth or rate limiting, at higher CPU cost.' },
    { id: 'iq2', q: 'Why are stateless services preferred behind a load balancer?', answerMd: 'Any instance can serve any request, so you can add, remove or replace instances freely and failures do not lose user state; session data lives in a shared store or a token.' },
    { id: 'iq3', q: 'Which algorithm for requests with very different processing times?', answerMd: 'Least connections or least outstanding requests (or power of two choices), since round robin can pile slow requests onto one server.' },
    { id: 'iq4', q: 'How do you avoid the load balancer being a single point of failure?', answerMd: 'Run redundant load balancers (active-passive with a floating IP, or active-active behind DNS/anycast) or use a managed cloud load balancer that is redundant across zones.' },
  ],
  revision: { notesMd: `- RR for uniform requests; least-connections for uneven ones; hash for affinity.
- L4 = transport (fast, blind); L7 = HTTP (smart routing, TLS termination).
- Health checks + connection draining.
- Stateless services > sticky sessions.
- Redundant LBs.`, flashcards: [
    { id: 'f1', front: 'Can an L4 LB route by URL path?', backMd: 'No; that needs L7.' },
    { id: 'f2', front: 'Algorithm for uneven request durations?', backMd: 'Least connections / least outstanding requests.' },
    { id: 'f3', front: 'Downside of sticky sessions?', backMd: 'Uneven load and lost sessions when a server dies.' },
    { id: 'f4', front: 'Connection draining?', backMd: 'Stop new requests to an instance but let in-flight ones finish.' },
    { id: 'f5', front: 'Algorithm for cache affinity?', backMd: 'Consistent hashing on the key.' },
  ] },
  resources: [PRIMER, { title: 'NGINX: HTTP load balancing', url: 'https://nginx.org/en/docs/http/load_balancing.html', kind: 'official-docs' }],
});

const lbMcqs: MCQ[] = [
  mcq({ ...q(LB), id: 'sd.lb.q1', type: 'concept', difficulty: 'easy', stem: 'You need to route `/api/*` to one service and `/static/*` to another. Which load balancer type?', options: ['Layer 7 (HTTP-aware)', ['Layer 4', 'It cannot see URL paths.'], ['DNS round robin', 'DNS does not see paths.'], ['Any, they are equivalent', 'Only L7 understands HTTP.']], answer: 0, explanation: 'Path-based routing requires parsing HTTP.' }),
  mcq({ ...q(LB), id: 'sd.lb.q2', type: 'scenario', difficulty: 'medium', stem: 'Some requests take 10 ms and others 10 s. Round robin leaves some servers overloaded. Better algorithm?', options: ['Least connections (or least outstanding requests)', ['Weighted round robin', 'Weights describe servers, not request cost.'], ['IP hash', 'That gives affinity, not balance.'], ['Random', 'Same problem as round robin.']], answer: 0, explanation: 'It sends new work to the server with the fewest in-flight requests.' }),
  mcq({ ...q(LB), id: 'sd.lb.q3', type: 'concept', difficulty: 'medium', stem: 'What is the main drawback of sticky sessions?', options: ['Load can become uneven, and sessions are lost when the pinned server fails', ['They require HTTPS', 'Unrelated.'], ['They need L4 load balancers', 'Typically L7 (cookies).'], ['They make requests slower by design', 'Not inherently.']], answer: 0, explanation: 'Store session state externally to make servers interchangeable.' }),
  mcq({ ...q(LB), id: 'sd.lb.q4', type: 'scenario', difficulty: 'medium', stem: 'During deploys, users see errors for requests that were in flight on instances being replaced. What is missing?', options: ['Connection draining (deregistration delay) before stopping instances', ['More health checks', 'They detect failures, not graceful shutdown.'], ['Sticky sessions', 'That would make it worse.'], ['A CDN', 'Unrelated.']], answer: 0, explanation: 'Stop sending new requests, let existing ones complete, then terminate.' }),
  mcq({ ...q(LB), id: 'sd.lb.q5', type: 'concept', difficulty: 'easy', stem: 'What does a health check let the load balancer do?', options: ['Stop sending traffic to unhealthy instances automatically', ['Encrypt traffic', 'That is TLS.'], ['Cache responses', 'That is a cache.'], ['Scale the database', 'Unrelated.']], answer: 0, explanation: 'Failed instances are taken out of rotation until they pass again.' }),
  mcq({ ...q(LB), id: 'sd.lb.q6', type: 'concept', difficulty: 'medium', stem: 'Which algorithm keeps the same user\'s requests on the same cache server while minimising remapping when servers are added?', options: ['Consistent hashing on the user ID', ['Round robin', 'No affinity.'], ['Least connections', 'No affinity.'], ['Modulo hashing (id % N)', 'Changing N remaps almost every key.']], answer: 0, explanation: 'Only about K/N keys move when a node joins or leaves.' }),
];

// ---------------------------------------------------------------------------------------
const RS = 'sd.replication-sharding';
const replShard = sdTopic({
  id: RS, title: 'Replication, Sharding and Consistent Hashing', level: 'core', estMinutes: 55, prerequisites: ['sd.databases'],
  summary: 'Replication strategies, shard keys and hotspots.',
  objectives: ['Compare leader-follower, multi-leader and leaderless replication.', 'Handle replication lag (read-your-writes).', 'Choose a shard key and avoid hotspots.', 'Explain consistent hashing and virtual nodes.'],
  sections: [
    { id: 'replication', kind: 'concept', title: 'Replication', bodyMd: `- **Leader-follower (primary-replica):** writes go to the leader; followers replicate and serve reads. Async replication means **replication lag**: a user may not see their own write if they read from a follower. Fixes: read-your-writes (read from the leader for a short time after writing, or route by user), monotonic reads (stick to one replica).
- **Multi-leader:** several regions accept writes; conflicts must be resolved (last-write-wins, merge).
- **Leaderless (Dynamo-style):** clients write to W of N replicas and read from R; **R + W > N** makes reads overlap the latest write.

Failover promotes a follower when the leader dies; with async replication, the last few writes can be lost.` },
    { id: 'sharding', kind: 'concept', title: 'Sharding (partitioning)', bodyMd: `Split data across machines when one cannot hold the data or the write load.

- **Hash sharding:** shard = hash(key) mod N or consistent hashing. Even spread; range queries hit every shard.
- **Range sharding:** by key ranges (dates, alphabetical). Range queries are efficient; risk of **hotspots** (all of today's writes go to one shard).
- **Shard key choice:** high cardinality, even access, and the key your main queries filter on (user_id for per-user data). Cross-shard joins and transactions are expensive; design to avoid them.
- **Hot keys** (a celebrity): split the key further, or cache it.` },
    { id: 'consistent', kind: 'visual', title: 'Consistent hashing', bodyMd: `Place servers and keys on a hash ring; a key belongs to the first server clockwise. Adding or removing a server moves only the keys in one arc, about **K/N** keys, instead of nearly all keys as with \`hash mod N\`.

**Virtual nodes:** each physical server appears at many points on the ring, smoothing the distribution and spreading a failed node's load across many servers. Used by Dynamo-style stores, Cassandra and distributed caches.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Sharding before needing to (indexes, caching and read replicas come first).
2. Sharding by a low-cardinality or skewed key (country, created date).
3. Using \`hash mod N\` and then adding a node, which remaps almost everything.
4. Forgetting replication lag when a user immediately reloads their own data.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Replication vs sharding?', answerMd: 'Replication copies the same data to several nodes for availability and read scaling. Sharding splits different data across nodes to scale storage and writes. Real systems shard, and replicate each shard.' },
    { id: 'iq2', q: 'A user updates their profile and the page still shows the old value. Why, and how do you fix it?', answerMd: 'The read went to an asynchronous follower that has not yet applied the write (replication lag). Provide read-your-writes consistency: read that user\'s data from the leader for a short window after writes, or track the write\'s log position and only read from replicas that have caught up.' },
    { id: 'iq3', q: 'How does consistent hashing help?', answerMd: 'Keys and nodes are hashed onto a ring; each key maps to the next node clockwise. Adding or removing a node only remaps keys in its arc (about K/N), and virtual nodes keep the load even.' },
    { id: 'iq4', q: 'How would you shard a messages table for a chat app?', answerMd: 'By conversation_id (hash), since the dominant query is "recent messages in this conversation", keeping each conversation on one shard. Within the shard, cluster by (conversation_id, timestamp). Watch for very large group chats as hotspots.' },
  ],
  revision: { notesMd: `- Leader-follower: async lag → read-your-writes issues.
- Leaderless: R + W > N for overlapping quorums.
- Hash sharding: even spread; range sharding: range scans but hotspots.
- Shard key: high cardinality, matches main queries.
- Consistent hashing: ~K/N keys move; virtual nodes balance.`, flashcards: [
    { id: 'f1', front: 'Quorum condition for reading the latest write?', backMd: 'R + W > N.' },
    { id: 'f2', front: 'Keys moved when adding a node with consistent hashing?', backMd: 'About K/N.' },
    { id: 'f3', front: 'Why virtual nodes?', backMd: 'Even distribution and spreading a failed node\'s load.' },
    { id: 'f4', front: 'Range sharding risk?', backMd: 'Hotspots (e.g. all new writes in the latest range).' },
    { id: 'f5', front: 'Read-your-writes fix?', backMd: 'Read from the leader shortly after a write, or from a caught-up replica.' },
  ] },
  resources: [PRIMER, { title: 'Dynamo: Amazon\'s Highly Available Key-value Store (paper)', url: 'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf', kind: 'article' }],
});

const rsMcqs: MCQ[] = [
  mcq({ ...q(RS), id: 'sd.rs.q1', type: 'concept', difficulty: 'medium', stem: 'With N = 3 replicas, which (W, R) choice guarantees that a read overlaps the latest successful write?', options: ['W = 2, R = 2', ['W = 1, R = 1', '1 + 1 = 2 is not > 3.'], ['W = 1, R = 2', '3 is not > 3.'], ['W = 2, R = 1', '3 is not > 3.']], answer: 0, explanation: 'R + W = 4 > 3, so the read and write sets always share a replica.' }),
  mcq({ ...q(RS), id: 'sd.rs.q2', type: 'concept', difficulty: 'medium', stem: 'You have 10 cache servers using `hash(key) % 10`, and you add an 11th. Roughly what fraction of keys move?', options: ['About 90% (almost all)', ['About 10%', 'That is consistent hashing.'], ['None', 'The modulus changed.'], ['Exactly 50%', 'No reason for half.']], answer: 0, explanation: 'A key stays only if hash % 10 == hash % 11, roughly 1 in 11 keys. Consistent hashing moves about 1/11.' }),
  mcq({ ...q(RS), id: 'sd.rs.q3', type: 'scenario', difficulty: 'medium', stem: 'An orders table is range-sharded by order date. Write throughput is poor. Why?', options: ['All new orders go to the shard holding today\'s range (a hotspot)', ['Range sharding prevents indexing', 'It does not.'], ['Dates cannot be hashed', 'They can.'], ['Too many shards', 'The problem is skew.']], answer: 0, explanation: 'Monotonic keys concentrate writes; hash the key (or prefix it) to spread writes.' }),
  mcq({ ...q(RS), id: 'sd.rs.q4', type: 'scenario', difficulty: 'medium', stem: 'Users sometimes do not see a comment they just posted after refreshing. Reads go to async replicas. Which guarantee is missing?', options: ['Read-your-writes consistency', ['Atomicity', 'The write succeeded.'], ['Partition tolerance', 'No partition is involved.'], ['Durability', 'The data is not lost; it is not replicated yet.']], answer: 0, explanation: 'Route the author\'s reads to the leader briefly, or to replicas that have caught up.' }),
  mcq({ ...q(RS), id: 'sd.rs.q5', type: 'concept', difficulty: 'easy', stem: 'What does sharding primarily scale, compared with read replicas?', options: ['Write throughput and total storage', ['Only read throughput', 'Replicas already scale reads.'], ['Network bandwidth to users', 'That is CDNs.'], ['Nothing; it only adds redundancy', 'That is replication.']], answer: 0, explanation: 'Each shard handles a fraction of writes and data.' }),
  mcq({ ...q(RS), id: 'sd.rs.q6', type: 'concept', difficulty: 'medium', stem: 'What is the main risk of failing over to a follower in async leader-follower replication?', options: ['Writes acknowledged by the old leader but not yet replicated can be lost', ['Followers cannot be promoted', 'They can.'], ['Reads stop working forever', 'They resume on the new leader.'], ['Indexes are dropped', 'Unrelated.']], answer: 0, explanation: 'Semi-synchronous replication (at least one follower acks) reduces this risk.' }),
];

// ---------------------------------------------------------------------------------------
const RL = 'sd.rate-limiting';
const rateLimit = sdTopic({
  id: RL, title: 'Rate Limiting', level: 'core', estMinutes: 40, prerequisites: [],
  summary: 'Token bucket, leaky bucket and sliding windows.',
  objectives: ['Implement a token bucket.', 'Compare fixed window, sliding window and token bucket.', 'Design distributed rate limiting with a shared store.', 'Return correct responses (429, Retry-After).'],
  sections: [
    { id: 'algos', kind: 'comparison', title: 'Algorithms', bodyMd: `| Algorithm | Idea | Pros | Cons |
|---|---|---|---|
| Fixed window counter | count per minute bucket | trivial | up to **2× the limit** across a window boundary |
| Sliding window log | store timestamps, count the last 60 s | exact | memory per request |
| Sliding window counter | weight the previous window's count | cheap, close to exact | approximate |
| **Token bucket** | bucket of capacity C refills at r tokens/s; each request takes a token | allows bursts up to C, average rate r | two parameters to tune |
| Leaky bucket | queue drained at a constant rate | smooth output | adds latency; drops bursts |` },
    { id: 'code', kind: 'code', title: 'Token bucket', bodyMd: 'Refill lazily on each call from the elapsed time; no background thread is needed.', code: [cpp(`#include <algorithm>
class TokenBucket {
    double capacity, refillPerSec, tokens, lastTs;
public:
    TokenBucket(double cap, double rate, double now) : capacity(cap), refillPerSec(rate), tokens(cap), lastTs(now) {}
    bool allow(double now) {
        tokens = std::min(capacity, tokens + (now - lastTs) * refillPerSec);
        lastTs = now;
        if (tokens >= 1) { tokens -= 1; return true; }
        return false;                         // caller responds 429 with Retry-After
    }
};`, 'C++')] },
    { id: 'distributed', kind: 'concept', title: 'Distributed rate limiting', bodyMd: `With many API servers, per-server counters let a client exceed the limit by spreading requests. Keep counters in a shared store (Redis) keyed by user or API key, updated **atomically** (a Lua script or INCR with expiry) to avoid read-modify-write races. Place the limiter in the API gateway. Return **429 Too Many Requests** with **Retry-After** and rate-limit headers. Decide fail-open vs fail-closed if Redis is unavailable (usually fail open for user APIs).` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Fixed windows without acknowledging the boundary burst.
2. Non-atomic get-then-set counters in Redis.
3. Rate limiting only by IP (shared NATs punish many users; attackers rotate IPs).
4. Returning 500 or 403 instead of 429.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the token bucket algorithm.', answerMd: 'A bucket holds up to C tokens and refills at r tokens per second. Each request consumes one token; with none left the request is rejected (429). It permits bursts up to C while enforcing an average rate r.' },
    { id: 'iq2', q: 'What is the problem with fixed-window rate limiting?', answerMd: 'A client can send the full limit at the end of one window and again at the start of the next, so up to twice the limit passes in a short interval. Sliding windows or token buckets fix this.' },
    { id: 'iq3', q: 'How do you rate limit across 50 API servers?', answerMd: 'Centralise counters in a fast shared store such as Redis, keyed per client, with atomic operations (Lua or INCR + EXPIRE). Enforce it in the gateway. Optionally keep a small local allowance to reduce Redis calls, accepting slight over-admission.' },
    { id: 'iq4', q: 'What should the API return when a client is limited?', answerMd: 'HTTP 429 Too Many Requests, a Retry-After header, and ideally headers showing the limit and remaining quota.' },
  ],
  revision: { notesMd: `- Token bucket: capacity C (burst), refill r (rate).
- Fixed window: 2× boundary burst.
- Sliding log exact; sliding counter approximate and cheap.
- Distributed: Redis with atomic ops, enforced at the gateway.
- Respond 429 + Retry-After.`, flashcards: [
    { id: 'f1', front: 'Token bucket parameters?', backMd: 'Capacity (burst size) and refill rate.' },
    { id: 'f2', front: 'Fixed window flaw?', backMd: 'Up to 2× the limit around a window boundary.' },
    { id: 'f3', front: 'Status code for rate limiting?', backMd: '429 Too Many Requests.' },
    { id: 'f4', front: 'Atomic counters in Redis?', backMd: 'INCR + EXPIRE, or a Lua script.' },
    { id: 'f5', front: 'Leaky bucket output?', backMd: 'A constant rate (smoothed).' },
  ] },
  resources: [{ title: 'Scaling your API with rate limiters (Stripe engineering blog)', url: 'https://stripe.com/blog/rate-limiters', kind: 'article' }, PRIMER],
});

const rlMcqs: MCQ[] = [
  mcq({ ...q(RL), id: 'sd.rl.q1', type: 'scenario', difficulty: 'medium', stem: 'A token bucket has capacity 10 and refills 1 token per second. It has been idle for a minute, then 15 requests arrive at the same instant. How many are allowed?', options: ['10', ['15', 'The bucket holds at most 10 tokens.'], ['60', 'Tokens are capped at capacity.'], ['1', 'Bursts up to capacity are allowed.']], answer: 0, explanation: 'Tokens are capped at 10; the other 5 are rejected until tokens refill.' }),
  mcq({ ...q(RL), id: 'sd.rl.q2', type: 'concept', difficulty: 'medium', stem: 'Limit: 100 requests per minute, fixed windows. What is the worst case in any 2-second span?', options: ['Up to 200 requests (100 at the end of one window, 100 at the start of the next)', ['100', 'The boundary allows double.'], ['About 3', 'That is the average rate.'], ['Unlimited', 'Each window still caps at 100.']], answer: 0, explanation: 'This boundary burst is why sliding windows or token buckets are preferred.' }),
  mcq({ ...q(RL), id: 'sd.rl.q3', type: 'debug', difficulty: 'medium', stem: 'Each API server does `v = redis.get(key); redis.set(key, v + 1)` to count requests. Clients exceed their limits under load. Why?', options: ['The read-modify-write is not atomic, so concurrent increments are lost', ['Redis is too slow', 'Speed is not the issue.'], ['Keys need to be longer', 'Unrelated.'], ['The servers\' clocks differ', 'Not the main bug.']], answer: 0, explanation: 'Use INCR (atomic) or a Lua script.' }),
  mcq({ ...q(RL), id: 'sd.rl.q4', type: 'concept', difficulty: 'easy', stem: 'Which status code signals that a client has been rate limited?', options: ['429', ['403', 'Permission, not rate.'], ['503', 'The server is unavailable, not the client limited.'], ['400', 'A malformed request.']], answer: 0, explanation: '429 Too Many Requests, ideally with Retry-After.' }),
  mcq({ ...q(RL), id: 'sd.rl.q5', type: 'concept', difficulty: 'medium', stem: 'Which algorithm produces a constant output rate, smoothing bursts by queueing?', options: ['Leaky bucket', ['Token bucket', 'It allows bursts.'], ['Fixed window counter', 'It allows boundary bursts.'], ['Sliding window log', 'It counts; it does not shape.']], answer: 0, explanation: 'Requests drain from the queue at a fixed rate.' }),
  mcq({ ...q(RL), id: 'sd.rl.q6', type: 'scenario', difficulty: 'medium', stem: 'Limiting by client IP blocks an entire university behind one NAT. Better key?', options: ['The authenticated user or API key (with IP limits only as a coarse backstop)', ['The User-Agent header', 'Trivially spoofed and shared.'], ['The request path', 'Not per client.'], ['The TCP source port', 'Changes per connection.']], answer: 0, explanation: 'Identity-based limits are fairer and harder to evade.' }),
];

// ---------------------------------------------------------------------------------------
const CAP = 'sd.consistency-cap';
const cap = sdTopic({
  id: CAP, title: 'Consistency and CAP', level: 'core', estMinutes: 40, prerequisites: [RS],
  summary: 'Consistency models, CAP and quorum reads/writes.',
  objectives: ['State CAP precisely (the choice happens during a partition).', 'Distinguish strong, eventual and causal consistency.', 'Pick consistency per feature in a design.', 'Mention PACELC for the no-partition trade-off.'],
  sections: [
    { id: 'cap', kind: 'concept', title: 'CAP, stated correctly', bodyMd: `In a distributed system, a **network partition** will happen eventually. During a partition you must choose:
- **CP:** refuse or delay some requests to stay consistent (every read sees the latest write).
- **AP:** keep answering on both sides, accepting that replicas diverge and reconcile later.

"CA" is not a real option for a distributed system, because partitions are not optional. **PACELC** adds: *Else* (no partition) you trade **Latency** against **Consistency**.` },
    { id: 'models', kind: 'comparison', title: 'Consistency models', bodyMd: `| Model | Guarantee | Example use |
|---|---|---|
| Strong / linearisable | reads see the latest write, as if one copy | balances, inventory, unique usernames, locks |
| Read-your-writes | you always see your own writes | profile edits, posting comments |
| Causal | causally related events are seen in order | comment replies after the comment |
| Eventual | replicas converge if writes stop | like counts, view counters, feeds |` },
    { id: 'design', kind: 'recognition', title: 'Using it in a design interview', bodyMd: `Decide per feature, not per system. In an e-commerce design: **inventory and payment** need strong consistency (CP); **product reviews, recommendations and view counts** can be eventually consistent (AP) for availability and latency. Say this explicitly; it is a strong signal.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. "Pick any two of three" (partition tolerance is mandatory; the choice is C vs A *during* a partition).
2. Calling a system "CP" or "AP" globally when it is configurable per operation (quorum settings).
3. Choosing strong consistency everywhere and paying latency for counters that do not need it.
4. Confusing CAP consistency (linearisability) with ACID consistency (constraints).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the CAP theorem.', answerMd: 'When a network partition separates replicas, a system must either reject or delay some operations to remain consistent (CP) or keep serving them and accept divergence (AP). Since partitions cannot be ruled out, the real choice is consistency versus availability during partitions.' },
    { id: 'iq2', q: 'Which parts of a booking system need strong consistency?', answerMd: 'Seat or room inventory and payments, to prevent double booking and double charging. Search results, reviews and availability previews can be eventually consistent, with a final strongly consistent check at booking time.' },
    { id: 'iq3', q: 'What is eventual consistency?', answerMd: 'If no new updates are made, all replicas eventually converge to the same value; in the meantime reads may return stale data.' },
    { id: 'iq4', q: 'What does PACELC add to CAP?', answerMd: 'Even without a partition, there is a trade-off between latency and consistency: synchronous replication across replicas is consistent but slower.' },
  ],
  revision: { notesMd: `- CAP: during a partition, choose C (reject) or A (serve and diverge).
- No real "CA" for distributed systems.
- PACELC: else, latency vs consistency.
- Strong for money, inventory, uniqueness; eventual for counters and feeds.
- CAP C ≠ ACID C.`, flashcards: [
    { id: 'f1', front: 'When does CAP force a choice?', backMd: 'During a network partition.' },
    { id: 'f2', front: 'Eventual consistency?', backMd: 'Replicas converge if updates stop; stale reads are possible meanwhile.' },
    { id: 'f3', front: 'PACELC "ELC"?', backMd: 'Else: latency vs consistency.' },
    { id: 'f4', front: 'Feature needing strong consistency in e-commerce?', backMd: 'Inventory and payments.' },
    { id: 'f5', front: 'CAP C means?', backMd: 'Linearisability: every read sees the latest write.' },
  ] },
  resources: [{ title: 'CAP Twelve Years Later: How the "Rules" Have Changed (Eric Brewer, InfoQ)', url: 'https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/', kind: 'article' }, PRIMER],
});

const capMcqs: MCQ[] = [
  mcq({ ...q(CAP), id: 'sd.cap.q1', type: 'concept', difficulty: 'medium', stem: 'Which statement of CAP is most accurate?', options: ['During a network partition, a system must choose between consistency and availability', ['You can pick any two of C, A and P at design time', 'Partitions are not optional.'], ['Consistent systems are never available', 'Only during partitions.'], ['CAP is about ACID transactions', 'Different meaning of consistency.']], answer: 0, explanation: 'Without partitions, you can have both; PACELC covers the latency trade-off then.' }),
  mcq({ ...q(CAP), id: 'sd.cap.q2', type: 'scenario', difficulty: 'easy', stem: 'Which feature can tolerate eventual consistency?', options: ['The like count on a post', ['Bank account balance', 'Needs strong consistency.'], ['Claiming a unique username', 'Needs strong consistency.'], ['Decrementing the last item in stock', 'Needs strong consistency.']], answer: 0, explanation: 'A briefly stale count harms no one.' }),
  mcq({ ...q(CAP), id: 'sd.cap.q3', type: 'scenario', difficulty: 'medium', stem: 'During a partition, a shopping cart service keeps accepting "add to cart" on both sides and merges carts afterwards. This design is:', options: ['AP', ['CP', 'It chose availability.'], ['CA', 'Not meaningful for a distributed system.'], ['ACID', 'A different concept.']], answer: 0, explanation: 'Like Dynamo\'s shopping cart: always writable, reconcile later.' }),
  mcq({ ...q(CAP), id: 'sd.cap.q4', type: 'concept', difficulty: 'medium', stem: 'What does PACELC say about normal operation (no partition)?', options: ['You trade latency against consistency', ['There is no trade-off', 'Synchronous replication costs latency.'], ['You must sacrifice availability', 'Not without a partition.'], ['You trade durability against throughput', 'Not part of PACELC.']], answer: 0, explanation: 'Else: latency or consistency.' }),
  mcq({ ...q(CAP), id: 'sd.cap.q5', type: 'concept', difficulty: 'medium', stem: 'A user posts a reply and then sees it appear before the comment it replies to. Which guarantee is violated?', options: ['Causal consistency', ['Durability', 'Nothing is lost.'], ['Atomicity', 'Each write is whole.'], ['Availability', 'The system answered.']], answer: 0, explanation: 'Causally related writes must be observed in order.' }),
  mcq({ ...q(CAP), id: 'sd.cap.q6', type: 'concept', difficulty: 'easy', stem: 'The "C" in CAP refers to:', options: ['Linearisability: reads reflect the most recent write', ['Database constraints (ACID consistency)', 'Different concept.'], ['Caching', 'No.'], ['Concurrency', 'No.']], answer: 0, explanation: 'A common interview trap: CAP C ≠ ACID C.' }),
];

// ---------------------------------------------------------------------------------------
const UR = 'sd.case-url-shortener';
const urlShort = sdTopic({
  id: UR, title: 'Case Study: URL Shortener', level: 'core', estMinutes: 60, prerequisites: [ES, CA, 'sd.databases'],
  summary: 'The classic new-grad design question end to end.',
  objectives: ['Run a design interview: requirements, estimates, API, data model, high-level design, deep dives.', 'Generate short codes without collisions.', 'Scale reads with caching and handle analytics asynchronously.', 'Discuss trade-offs and failure modes.'],
  sections: [
    { id: 'requirements', kind: 'concept', title: '1. Requirements and estimates', bodyMd: `**Functional:** create a short link for a long URL (optional custom alias, expiry); redirect short → long; basic click analytics.
**Non-functional:** very low redirect latency, high availability for redirects, short codes not guessable in sequence (nice to have), durable links.

Estimates (from the Estimation topic): ~40 writes/s, ~4k reads/s (peak ~10k), 3 TB over 5 years, 7-character base62 codes (3.5 trillion).` },
    { id: 'api', kind: 'concept', title: '2. API and data model', bodyMd: `\`\`\`
POST /api/links        { "url": "...", "alias"?: "...", "expiresAt"?: "..." }  -> 201 { "code": "aZ3k9Qx" }
GET  /{code}           -> 301 or 302 Location: <long url>   (404 if unknown, 410 if expired)
\`\`\`
Table **links**(code PK, long_url, user_id, created_at, expires_at). Lookups are by primary key only, so a key-value store or a simple relational table works; shard by \`code\` if needed.

**301 vs 302:** 301 (permanent) lets browsers cache the redirect, which reduces load but hides repeat clicks from analytics; 302 (temporary) sends every click through you.` },
    { id: 'codes', kind: 'comparison', title: '3. Generating short codes', bodyMd: `| Approach | How | Trade-offs |
|---|---|---|
| Hash the URL (MD5/SHA) and take 7 base62 chars | deterministic | collisions must be detected and retried; same URL gives the same code (could be a feature) |
| **Counter + base62** | unique ID from a DB sequence or ID service, then base62-encode | no collisions; sequential codes are guessable (shuffle or use a bijective scramble); the counter must be distributed (ranges per server) |
| Random 7 chars + uniqueness check | insert with a unique constraint, retry on conflict | simple; collision checks grow as the space fills (rare at 3.5T) |

A strong answer: a **range-allocated counter** (each app server leases a block of 1,000 IDs from a coordinator), base62 encoding, and a unique constraint as a safety net.` },
    { id: 'design', kind: 'visual', title: '4. High-level design and deep dives', bodyMd: `Client → CDN/edge (optional redirect caching) → load balancer → stateless app servers → **cache (Redis)** → database.

- **Read path:** look up the code in the cache; on a miss, read the DB and populate the cache (cache-aside). Hot links stay in memory; at ~10k QPS a few cache nodes suffice.
- **Write path:** allocate an ID from the leased range, encode, insert, return.
- **Analytics:** do not write to the DB on every redirect. Publish click events to a **queue/log (Kafka)** and aggregate asynchronously.
- **Expiry:** check expires_at on read; a background job purges expired rows.
- **Abuse:** rate limit creation per user and scan for malicious URLs.
- **Availability:** replicate the DB; redirects can be served from cache even during a brief DB outage.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Jumping into hashing details before clarifying requirements and scale.
2. Writing analytics synchronously in the redirect path.
3. Ignoring collisions when truncating hashes.
4. Not discussing 301 vs 302.
5. A single database without replication for a read-critical service.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Design a URL shortener (give a 2-minute summary).', answerMd: 'Requirements: create and redirect, low latency, high availability. ~4k redirect QPS, 3 TB over 5 years. API: POST /links, GET /{code}. Codes: range-allocated counter + base62 (7 chars). Store code → URL in a replicated KV/relational DB, shard by code if needed. Cache-aside in Redis for hot links. Clicks go to a queue for async analytics. 302 if we need accurate analytics, otherwise 301.' },
    { id: 'iq2', q: 'How do you avoid two servers generating the same code?', answerMd: 'Give each server a disjoint ID range leased from a coordinator (a database sequence or ZooKeeper/etcd); encode IDs in base62. A unique constraint on the code column acts as a final guard, with retry on conflict for random or hash schemes.' },
    { id: 'iq3', q: 'Why might you choose 302 over 301?', answerMd: '301 is cached by browsers, so repeat clicks never reach your service: cheaper, but analytics undercount and you cannot change the destination. 302 sends every click through your service, giving accurate analytics and flexibility.' },
    { id: 'iq4', q: 'How would you scale redirects to 100k QPS?', answerMd: 'Stateless app servers behind load balancers, a Redis cluster with the hot set in memory, read replicas or a sharded KV store behind it, CDN/edge caching of redirects, and moving analytics fully async.' },
  ],
  revision: { notesMd: `- Requirements → estimates → API → data model → design → deep dives.
- Codes: counter ranges + base62 (no collisions), or hash/random + uniqueness check.
- Cache-aside for redirects; async analytics via a queue.
- 301 cached (cheap, less analytics) vs 302 (every click).
- Rate limit creation; expiry job.`, flashcards: [
    { id: 'f1', front: 'Collision-free code generation?', backMd: 'A distributed counter (leased ranges) + base62 encoding.' },
    { id: 'f2', front: '301 vs 302 for analytics?', backMd: '302: every click reaches the service.' },
    { id: 'f3', front: 'How to record clicks without slowing redirects?', backMd: 'Publish events to a queue; aggregate asynchronously.' },
    { id: 'f4', front: 'Read path?', backMd: 'Cache → DB on a miss → fill the cache.' },
    { id: 'f5', front: 'Status code for an expired link?', backMd: '410 Gone (or 404).' },
  ] },
  resources: [PRIMER, { title: 'MDN: Redirections in HTTP', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections', kind: 'official-docs' }],
});

const urMcqs: MCQ[] = [
  mcq({ ...q(UR), id: 'sd.ur.q1', type: 'concept', difficulty: 'medium', stem: 'Which code-generation scheme guarantees no collisions without checking the database?', options: ['A unique counter (leased ID ranges per server) encoded in base62', ['Taking the first 7 characters of an MD5 hash', 'Truncated hashes can collide.'], ['Random 7-character strings', 'Collisions are possible.'], ['The current timestamp in seconds', 'Two links in the same second collide.']], answer: 0, explanation: 'Distinct integers map to distinct base62 strings.' }),
  mcq({ ...q(UR), id: 'sd.ur.q2', type: 'concept', difficulty: 'medium', stem: 'Product wants accurate click counts for every redirect. Which redirect status?', options: ['302 (temporary), so browsers do not cache the redirect', ['301 (permanent)', 'Browsers cache it and skip your server.'], ['200 with the page content', 'You would have to proxy the target.'], ['404', 'Not a redirect.']], answer: 0, explanation: 'Every click reaches the service and can be counted.' }),
  mcq({ ...q(UR), id: 'sd.ur.q3', type: 'scenario', difficulty: 'medium', stem: 'Redirect latency rises because every redirect increments a counter row in the database. Best fix?', options: ['Publish click events to a queue and aggregate asynchronously', ['Add a database index on the counter', 'Writes are the problem.'], ['Switch to 301', 'It hides clicks entirely.'], ['Use a bigger cache TTL', 'The bottleneck is the synchronous write.']], answer: 0, explanation: 'Keep the redirect path read-only; analytics can lag slightly.' }),
  mcq({ ...q(UR), id: 'sd.ur.q4', type: 'concept', difficulty: 'easy', stem: 'With ~100:1 reads to writes, what is the most important component for redirect latency?', options: ['An in-memory cache of code → URL mappings', ['A message queue for writes', 'Writes are rare.'], ['A batch analytics job', 'Not in the redirect path.'], ['Strong consistency across regions', 'Hurts latency.']], answer: 0, explanation: 'Most redirects are served from memory.' }),
  mcq({ ...q(UR), id: 'sd.ur.q5', type: 'scenario', difficulty: 'medium', stem: 'Codes from a plain auto-increment counter are guessable (aaaaab, aaaaac…), letting people enumerate private links. Mitigation?', options: ['Apply a reversible scramble (or random IDs) before base62 encoding, and do not treat short links as secrets', ['Use base10 instead', 'Still sequential.'], ['Shorter codes', 'Easier to enumerate.'], ['Use 301 redirects', 'Unrelated.']], answer: 0, explanation: 'Unpredictable codes slow enumeration; sensitive targets still need real auth.' }),
  mcq({ ...q(UR), id: 'sd.ur.q6', type: 'concept', difficulty: 'easy', stem: 'What is the correct first step in a system design interview?', options: ['Clarify functional and non-functional requirements and scale', ['Choose the database', 'Premature.'], ['Draw microservices', 'Premature.'], ['Write code', 'Not the focus.']], answer: 0, explanation: 'Requirements drive every later decision.' }),
];

export const topics: Topic[] = [estimation, caching, lb, replShard, rateLimit, cap, urlShort];
export const mcqs: MCQ[] = [...esMcqs, ...caMcqs, ...lbMcqs, ...rsMcqs, ...rlMcqs, ...capMcqs, ...urMcqs];
