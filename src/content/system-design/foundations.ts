import type { MCQ, Topic } from '../schema';
import { mcq } from '../helpers';
import { PRIMER, q, sdTopic } from './common';

// System Design foundations, batch 1: requirements, latency/throughput/availability,
// scalability, databases and messaging. Numeric answers are recomputed in tests/sd-facts.test.ts.

// ---------------------------------------------------------------------------------------
const RQ = 'sd.requirements';
const requirements = sdTopic({
  id: RQ, title: 'Requirements and Scoping', level: 'foundation', estMinutes: 35, prerequisites: [], related: ['sd.estimation', 'sd.api-design'],
  summary: 'Functional vs non-functional requirements and clarifying questions.',
  objectives: ['Separate functional from non-functional requirements and state both for a vague prompt.', 'Ask the clarifying questions that fix scale, consistency, latency and scope.', 'Define explicit out-of-scope items and a minimum viable design.', 'Run a 45-minute interview with a sensible time split.'],
  sections: [
    { id: 'what', kind: 'concept', title: 'Why requirements come first', bodyMd: `"Design Twitter" or "design a chat app" is deliberately vague. The same prompt can mean a weekend project or a global platform, and every later choice (database, caching, consistency) depends on the answer. Interviewers grade you on **how you narrow the problem** at least as much as on the final diagram.

**Functional requirements** say **what the system does**: user-visible features and APIs ("a user can post a message", "a user can follow another user", "the feed shows the latest posts of people I follow").

**Non-functional requirements (NFRs)** say **how well** it does it:
- **Scale:** users, daily active users (DAU), requests per second, data volume, read:write ratio.
- **Latency:** e.g. feed loads in under 200 ms at p99.
- **Availability and reliability:** can it be down? Can data be lost?
- **Consistency:** must a user see their own post immediately? Is a slightly stale feed acceptable?
- **Durability, security, privacy, cost, geographic reach, compliance.**

Rule of thumb: functional requirements shape the **API and data model**; non-functional requirements shape the **architecture** (caching, replication, sharding, queues).` },
    { id: 'questions', kind: 'recognition', title: 'The clarifying questions to ask', bodyMd: `| Area | Ask | Why it matters |
|---|---|---|
| Users | Who uses it, how many (DAU)? Growth? Regions? | scale and latency design |
| Core features | What are the 2–3 must-have flows? What is out of scope? | keeps the design finishable |
| Read/write mix | Read-heavy or write-heavy? Burstiness (events, spikes)? | caching vs write scaling |
| Data | What is stored, how big, how long is it kept? | storage and retention |
| Consistency | Must users see their own writes immediately? Can data be briefly stale? | replication and CAP choices |
| Availability | Is downtime acceptable? Is data loss ever acceptable? | redundancy, backups |
| Latency | Targets for the main operations? | caching, CDN, locality |
| Clients | Web, mobile, public API? | API style, protocols |
| Constraints | Existing tech, budget, compliance? | limits the option space |

Ask 5–8 focused questions, **not 30**. When the interviewer says "your call", **state an assumption and move on** ("I'll assume 50M DAU, read-heavy 100:1, eventual consistency is fine for the feed but not for payments").` },
    { id: 'template', kind: 'concept', title: 'A 45-minute structure', bodyMd: `| Minutes | Step | Output |
|---|---|---|
| 0–5 | Requirements and scope | functional list, NFRs, out-of-scope list |
| 5–10 | Estimation | QPS, storage, bandwidth, what they imply |
| 10–15 | API and data model | endpoints, main tables/collections |
| 15–30 | High-level design | boxes and arrows; walk through the main read and write paths |
| 30–40 | Deep dive on 1–2 hard parts | the bottleneck the interviewer cares about (hot keys, ordering, fan-out) |
| 40–45 | Trade-offs, failures, wrap-up | what breaks, how you would monitor and evolve it |

**New-grad vs senior expectations:** as a new grad you are expected to drive a clean, *working* basic design (clients → load balancer → stateless services → cache → database, with a queue where work is asynchronous), to justify choices with simple numbers, and to name trade-offs. Senior candidates are expected to go deeper on failure modes, consistency, multi-region operation and cost. Do not drown a basic design in buzzwords; a correct simple design beats an incoherent complex one.` },
    { id: 'example', kind: 'example', title: 'Example: scoping "design a chat app"', bodyMd: `**Clarify:** 1-on-1 and group chat? (both, groups up to 100) Media? (text only for now) Message history? (yes, searchable later, out of scope now) Delivery guarantees? (messages must not be lost; order within a conversation) Users? (50M DAU, 40 messages/user/day) Online presence? (nice to have.)

**Functional:** send/receive messages in real time; offline delivery when the recipient reconnects; message history.
**Non-functional:** latency under ~200 ms when both are online; **durable** (no lost messages); **ordering per conversation**; high availability; presence may be eventually consistent.
**Out of scope:** voice/video, end-to-end encryption, search.

Quick estimate: 50M × 40 = 2 × 10⁹ messages/day ≈ 23k messages/s average (peak ~50–70k), which tells you a single database writer will not do and the design needs partitioning.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Starting to draw boxes before knowing the scale or features.
2. Treating every requirement as equally important instead of picking the must-haves.
3. Listing only functional requirements and never mentioning consistency, availability or latency.
4. Asking dozens of questions or waiting for the interviewer to specify everything instead of stating assumptions.
5. Designing for "Google scale" when the prompt does not need it.
6. Never saying what is out of scope.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Functional vs non-functional requirements?', answerMd: 'Functional requirements describe what the system does (features and behaviour visible to users or other systems). Non-functional requirements describe the qualities it must have: scale, latency, availability, consistency, durability, security and cost. Functional requirements drive the API and data model; non-functional ones drive the architecture.' },
    { id: 'iq2', q: 'You get "design Instagram". What do you do in the first five minutes?', answerMd: 'Clarify the core features (upload photos, follow, feed, likes), what is out of scope (stories, DMs), the scale (DAU, photos per day, read:write ratio), the latency and availability targets, and consistency expectations. State assumptions where the interviewer defers, write down the functional and non-functional lists, then move to estimation.' },
    { id: 'iq3', q: 'How do you decide what is in scope?', answerMd: 'Pick the two or three user flows that define the product, include what the interviewer emphasises, and explicitly park the rest ("search and recommendations are out of scope; I can come back to them"). A smaller design that is complete and defended beats a sprawling one.' },
    { id: 'iq4', q: 'Why ask about consistency requirements early?', answerMd: 'It decides replication, caching and database choices. A payment ledger needs strong consistency and transactions; a like counter or feed can be eventually consistent, which allows caches, async replication and higher availability.' },
  ],
  revision: { notesMd: `- Functional = what; non-functional = how well (scale, latency, availability, consistency, durability, security, cost).
- Ask 5–8 questions: users/DAU, core features, read:write, data, consistency, availability, latency, clients.
- State assumptions when told "your call"; list out-of-scope items.
- 45 min: requirements 5 → estimates 5 → API/data 5 → design 15 → deep dive 10 → trade-offs 5.
- New grad: a correct, simple, justified design; seniors: failure modes, multi-region, cost.`, flashcards: [
    { id: 'f1', front: 'What do functional requirements shape?', backMd: 'The API and data model.' },
    { id: 'f2', front: 'What do non-functional requirements shape?', backMd: 'The architecture: caching, replication, sharding, queues.' },
    { id: 'f3', front: 'Name five non-functional requirements.', backMd: 'Scale, latency, availability, consistency, durability (also security, cost).' },
    { id: 'f4', front: 'What to do when the interviewer says "your call"?', backMd: 'State an explicit assumption and continue.' },
    { id: 'f5', front: 'Why list out-of-scope items?', backMd: 'It keeps the design finishable and shows judgement.' },
  ] },
  resources: [PRIMER, { title: 'ByteByteGo: System design interview framework (blog)', url: 'https://blog.bytebytego.com/', kind: 'article' }],
});

const rqMcqs: MCQ[] = [
  mcq({ ...q(RQ), id: 'sd.rq.q1', type: 'concept', difficulty: 'easy', stem: 'Which of these is a non-functional requirement?', options: ['"The feed must load within 200 ms at p99"', ['"Users can follow other users"', 'A feature, so functional.'], ['"Users can upload a profile photo"', 'A feature, so functional.'], ['"Users can delete their account"', 'A feature, so functional.']], answer: 0, explanation: 'A quality target (latency) rather than a feature.' }),
  mcq({ ...q(RQ), id: 'sd.rq.q2', type: 'concept', difficulty: 'easy', stem: 'What is the best first step when given "Design a ride-sharing app"?', options: ['Clarify core features, scale and constraints, and state assumptions', ['Pick a database', 'Premature: depends on requirements.'], ['Draw a microservice per feature', 'Premature.'], ['Estimate server cost', 'Needs scale first.']], answer: 0, explanation: 'Requirements and scale decide every later choice.' }),
  mcq({ ...q(RQ), id: 'sd.rq.q3', type: 'scenario', difficulty: 'medium', stem: 'The interviewer says "You decide the scale". What should you do?', options: ['State a concrete assumption (for example 10M DAU, read-heavy) and proceed', ['Refuse to continue until they decide', 'Unproductive.'], ['Assume the largest possible scale', 'Over-engineering.'], ['Skip estimation', 'The numbers justify the design.']], answer: 0, explanation: 'Stated assumptions show structure and can be corrected.' }),
  mcq({ ...q(RQ), id: 'sd.rq.q4', type: 'concept', difficulty: 'medium', stem: 'Why is the consistency requirement important to clarify early?', options: ['It determines replication, caching and database choices', ['It decides the programming language', 'Unrelated.'], ['It only affects the UI', 'It affects backend design.'], ['It is only relevant for read-only systems', 'The opposite is closer to the truth.']], answer: 0, explanation: 'Strong consistency limits availability and latency options; eventual consistency opens up caches and async replication.' }),
  mcq({ ...q(RQ), id: 'sd.rq.q5', type: 'concept', difficulty: 'medium', stem: 'Which requirement is MOST likely to require strong consistency?', options: ['Account balance updates in a payments system', ['The number of likes on a post', 'A slightly stale count is acceptable.'], ['A "people you may know" list', 'Staleness is fine.'], ['Trending hashtags', 'Approximate is fine.']], answer: 0, explanation: 'Money must not be double-spent; counters and recommendations tolerate staleness.' }),
  mcq({ ...q(RQ), id: 'sd.rq.q6', type: 'concept', difficulty: 'easy', stem: 'Why should out-of-scope items be stated explicitly?', options: ['They keep the discussion finishable and show you prioritised on purpose', ['They reduce the number of tables', 'Not the purpose.'], ['They make the system faster', 'No technical effect.'], ['They are required by every interviewer', 'It is a good habit, not a rule.']], answer: 0, explanation: 'Scoping is a skill being assessed.' }),
];

// ---------------------------------------------------------------------------------------
const LT = 'sd.latency-throughput-availability';
const lta = sdTopic({
  id: LT, title: 'Latency, Throughput and Availability', level: 'foundation', estMinutes: 45, prerequisites: [], related: ['sd.fault-tolerance', 'sd.observability', 'sd.scalability'],
  summary: 'SLAs, SLOs, nines and reliability.',
  objectives: ['Define latency, throughput and bandwidth, and use percentiles instead of averages.', 'Convert availability targets ("nines") into allowed downtime and compute availability of components in series and parallel.', 'Use Little\'s law to relate concurrency, throughput and latency.', 'Distinguish SLI, SLO and SLA, and explain error budgets.'],
  sections: [
    { id: 'metrics', kind: 'concept', title: 'Latency, throughput and percentiles', bodyMd: `- **Latency:** time for one request (or operation) to complete. Measured in ms; it includes network, queueing and processing time.
- **Throughput:** work completed per unit time (requests per second, MB/s). **Bandwidth** is the *maximum* data rate of a link.
- Throughput and latency are related but different: a pipeline can have high throughput *and* high latency (a freight train), and adding parallelism raises throughput without lowering latency.

**Percentiles, not averages.** Latency distributions have a long tail. **p50** (median) is the typical request, **p95/p99** the slow ones. Averages hide outliers: 99 requests at 10 ms and one at 5 s average 60 ms, but one user in 100 waits 5 seconds. Report **p50, p95, p99** (and p99.9 for critical paths).

**Tail latency amplification:** a page that fans out to 100 backends needs *all* of them. If each has a 1% chance of being slow, the page is slow with probability 1 − 0.99¹⁰⁰ ≈ **63%**. Hence timeouts, hedged requests and caches on the critical path.

**Little's law:** the average number of requests in the system **L = λ × W** (arrival rate × average time in system). A service handling 1,000 requests/s with 200 ms average latency has about 1,000 × 0.2 = **200 requests in flight**, which sizes thread pools and connection pools. If latency doubles, concurrency doubles at the same throughput, and queues can blow up.

**Queueing:** as utilisation approaches 100%, wait time grows sharply (non-linearly). Keep headroom (typically run services at 50–70% of capacity) so spikes do not tip them over.` },
    { id: 'availability', kind: 'concept', title: 'Availability and the nines', bodyMd: `**Availability** = uptime / (uptime + downtime) = the fraction of time (or requests) the system works.

| Availability | Allowed downtime per year | per 30-day month |
|---|---|---|
| 99% ("two nines") | 3.65 days | 7.2 hours |
| 99.9% ("three nines") | 8.76 hours | 43.2 minutes |
| 99.99% ("four nines") | 52.6 minutes | 4.32 minutes |
| 99.999% ("five nines") | 5.26 minutes | 25.9 seconds |

Each extra nine costs far more (redundancy, automation, multi-region, on-call).

**Composing availability:**
- **In series** (a request needs all components): multiply. Two 99.9% components in a row give 0.999 × 0.999 = **99.8%**. A chain of ten 99.9% services is only ~99.0%.
- **In parallel / redundant** (any one suffices): 1 − (1 − a)ⁿ. Two independent 99.9% replicas give 1 − 0.001² = **99.9999%**.
So availability comes from **removing single points of failure** (SPOFs) with redundancy, and from not chaining many hard dependencies. Independence is the catch: replicas sharing a power supply, a bad deploy or a region fail together.

**Reliability** is about correct behaviour over time (MTBF, failure rate); **availability** also depends on how quickly you recover (**MTTR**): availability ≈ MTBF / (MTBF + MTTR). Fast detection and recovery often matters more than preventing every failure.` },
    { id: 'slo', kind: 'concept', title: 'SLI, SLO, SLA and error budgets', bodyMd: `- **SLI (indicator):** a measured number, e.g. the fraction of requests answered successfully in under 300 ms.
- **SLO (objective):** the internal target for an SLI, e.g. 99.9% of requests succeed over 30 days.
- **SLA (agreement):** the external contract with consequences (credits, penalties) if you miss it. SLAs are set looser than SLOs.

**Error budget** = 1 − SLO. A 99.9% monthly SLO allows 0.1% failures, i.e. **43.2 minutes** of full outage per 30 days. While budget remains, teams can ship features; when it is spent, they freeze risky changes and invest in reliability. It turns the argument "reliability vs velocity" into a number.

Choose SLIs from the **user's perspective** (success rate, latency of key journeys), not machine metrics only (CPU).` },
    { id: 'design', kind: 'recognition', title: 'Using it in a design', bodyMd: `| Goal | Typical techniques |
|---|---|
| Lower latency | caching, CDN, data locality (regions), fewer sequential calls, async work off the request path, connection reuse |
| Higher throughput | horizontal scaling, batching, queues, sharding, efficient serialisation |
| Higher availability | redundancy at every tier, health checks and failover, multi-AZ then multi-region, graceful degradation, no SPOFs |
| Faster recovery | automation, rollbacks, runbooks, good monitoring |

Always attach a number: "p99 under 300 ms", "99.95% monthly availability". Without a target you cannot tell whether a design is good enough.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Quoting average latency only.
2. Treating "five nines" as a free default.
3. Forgetting that dependencies in series multiply their unavailability.
4. Assuming replicas are independent when they share a failure domain.
5. Confusing bandwidth, throughput and latency.
6. Setting SLAs equal to internal SLOs (no safety margin).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Why use p99 latency instead of the average?', answerMd: 'Averages hide the slow tail. If 1% of requests take seconds the mean barely moves, yet at scale that is a lot of unhappy users, and in fan-out systems tail latency dominates the response. Percentiles show what real users experience.' },
    { id: 'iq2', q: 'How much downtime does 99.9% allow?', answerMd: 'About 8.76 hours per year, 43.8 minutes per average month (43.2 minutes in a 30-day month), or about 1.4 minutes per day.' },
    { id: 'iq3', q: 'Two services with 99.9% availability each are called in sequence. What is the combined availability?', answerMd: 'About 99.8% (0.999 × 0.999 = 0.998), because both must be up. Redundant independent replicas would instead improve availability: two 99.9% replicas in parallel give 99.9999%.' },
    { id: 'iq4', q: 'What is Little\'s law and where do you use it?', answerMd: 'L = λW: the average number of items in a system equals the arrival rate times the average time each spends there. It sizes concurrency: 2,000 req/s at 50 ms average latency means about 100 requests in flight, which tells you thread-pool, connection-pool and queue sizes.' },
    { id: 'iq5', q: 'SLI vs SLO vs SLA?', answerMd: 'An SLI is a measurement (such as the success rate), an SLO is the internal target for it (99.9% over 30 days), and an SLA is the contractual promise to customers with penalties, normally looser than the SLO. The error budget is 1 minus the SLO.' },
  ],
  revision: { notesMd: `- Latency = time per request; throughput = requests/s; bandwidth = max link rate. Use p50/p95/p99.
- Fan-out of N backends at 1% slow each: 1 − 0.99ᴺ slow (N=100 → 63%).
- Little: L = λW (1000 req/s × 0.2 s = 200 in flight).
- Nines: 99.9% = 8.76 h/yr (43.2 min per 30 days); 99.99% = 52.6 min/yr; 99.999% = 5.26 min/yr.
- Series multiply; parallel 1 − (1 − a)ⁿ. Remove SPOFs; replicas must be independent.
- SLI measure → SLO target → SLA contract; error budget = 1 − SLO.`, flashcards: [
    { id: 'f1', front: 'Downtime allowed by 99.9% per year?', backMd: '≈ 8.76 hours.' },
    { id: 'f2', front: 'Little\'s law?', backMd: 'L = λ × W (concurrency = arrival rate × latency).' },
    { id: 'f3', front: 'Availability of two 99.9% services in series?', backMd: '≈ 99.8%.' },
    { id: 'f4', front: 'Error budget for a 99.9% monthly SLO?', backMd: '43.2 minutes of downtime per 30 days.' },
    { id: 'f5', front: 'Why p99, not mean?', backMd: 'The mean hides the slow tail that many users still experience.' },
    { id: 'f6', front: 'Two independent 99.9% replicas in parallel?', backMd: '99.9999% (1 − 0.001²).' },
  ] },
  resources: [{ title: 'Google SRE Book: Service Level Objectives', url: 'https://sre.google/sre-book/service-level-objectives/', kind: 'book' }, { title: 'The Tail at Scale (Dean & Barroso, CACM 2013)', url: 'https://research.google/pubs/the-tail-at-scale/', kind: 'article' }, PRIMER],
});

const ltMcqs: MCQ[] = [
  mcq({ ...q(LT), id: 'sd.lt.q1', type: 'complexity', difficulty: 'easy', stem: 'How much downtime per year does 99.9% availability allow?', options: ['About 8.76 hours', ['About 52.6 minutes', 'That is four nines.'], ['About 3.65 days', 'That is 99%.'], ['About 5.26 minutes', 'That is five nines.']], answer: 0, explanation: '0.1% of 8,760 hours is 8.76 hours.' }),
  mcq({ ...q(LT), id: 'sd.lt.q2', type: 'complexity', difficulty: 'medium', stem: 'A request must pass through two services in sequence, each 99.9% available. What is the overall availability?', options: ['About 99.8%', ['99.9%', 'Both must be up, so it is lower than either.'], ['99.9999%', 'That is the parallel (redundant) formula.'], ['100%', 'Impossible.']], answer: 0, explanation: '0.999 × 0.999 = 0.998001.' }),
  mcq({ ...q(LT), id: 'sd.lt.q3', type: 'complexity', difficulty: 'medium', stem: 'A service receives 2,000 requests/s with an average latency of 50 ms. About how many requests are in flight on average?', options: ['100', ['2,000', 'That is the arrival rate per second, not concurrency.'], ['10', 'Off by a factor of ten.'], ['40,000', 'That divides instead of multiplies.']], answer: 0, explanation: 'Little\'s law: L = 2000 × 0.05 = 100.' }),
  mcq({ ...q(LT), id: 'sd.lt.q4', type: 'concept', difficulty: 'easy', stem: 'Why is average latency a poor sole metric?', options: ['It hides the slow tail that a meaningful share of users experience', ['It is always lower than the median', 'Not necessarily.'], ['It cannot be computed in real time', 'It can.'], ['It only applies to databases', 'It applies to any request.']], answer: 0, explanation: 'Percentiles (p95, p99) show what slow requests look like.' }),
  mcq({ ...q(LT), id: 'sd.lt.q5', type: 'complexity', difficulty: 'hard', stem: 'A page makes 100 parallel calls to backends, each of which is slow (over 1 s) 1% of the time, independently. Roughly what fraction of page loads see at least one slow call?', options: ['About 63%', ['1%', 'That is the per-call probability, not the page.'], ['About 10%', 'Too low: the chance compounds across 100 calls.'], ['About 99%', 'Too high: 1 − 0.99¹⁰⁰ ≈ 0.634.']], answer: 0, explanation: '1 − 0.99^100 ≈ 0.634. This is tail latency amplification.' }),
  mcq({ ...q(LT), id: 'sd.lt.q6', type: 'complexity', difficulty: 'medium', stem: 'A 99.9% monthly SLO (30-day month) gives an error budget of about:', options: ['43 minutes of downtime', ['4.3 minutes', 'That is for 99.99%.'], ['7.2 hours', 'That is for 99%.'], ['8.76 hours', 'That is per year at 99.9%.']], answer: 0, explanation: '0.001 × 30 × 24 × 60 = 43.2 minutes.' }),
  mcq({ ...q(LT), id: 'sd.lt.q7', type: 'concept', difficulty: 'medium', stem: 'Which of these most improves availability?', options: ['Removing single points of failure with redundant, independent components', ['Adding more features', 'Unrelated.'], ['Running one very powerful server', 'It remains a single point of failure.'], ['Using a bigger cache TTL', 'Helps latency, not component failure.']], answer: 0, explanation: 'Redundancy plus failover keeps the service up when one component fails.' }),
  mcq({ ...q(LT), id: 'sd.lt.q8', type: 'concept', difficulty: 'medium', stem: 'What is the difference between an SLO and an SLA?', options: ['An SLO is an internal target; an SLA is a contractual commitment, usually looser, with consequences', ['They are identical', 'The distinction matters.'], ['An SLA is measured, an SLO is not', 'SLIs are measured.'], ['An SLO applies only to databases', 'Any service can have SLOs.']], answer: 0, explanation: 'Teams aim for the SLO so there is a margin before the SLA is breached.' }),
];

// ---------------------------------------------------------------------------------------
const SC = 'sd.scalability';
const scal = sdTopic({
  id: SC, title: 'Scalability', level: 'foundation', estMinutes: 40, prerequisites: [], related: ['sd.load-balancing', 'sd.caching', 'sd.replication-sharding'],
  summary: 'Vertical vs horizontal scaling and stateless services.',
  objectives: ['Compare vertical and horizontal scaling and when each is right.', 'Explain why stateless services scale horizontally and where state should live instead.', 'Describe the usual scaling path of a web system, tier by tier.', 'Identify the bottleneck before adding capacity.'],
  sections: [
    { id: 'vh', kind: 'comparison', title: 'Vertical vs horizontal scaling', bodyMd: `| | **Vertical (scale up)** | **Horizontal (scale out)** |
|---|---|---|
| How | bigger machine (CPU, RAM, disk) | more machines behind a load balancer |
| Simplicity | very simple: no code changes | needs stateless design, data partitioning, coordination |
| Limit | hardware ceiling, cost grows faster than capacity | practically unlimited |
| Availability | one machine is a single point of failure | losing a node is tolerated |
| Downtime to scale | often a restart | add nodes live |

**Start simple:** one well-sized server (plus a replica for availability) carries a surprising amount of traffic. Scale out when you need more than the biggest sensible machine, or fault tolerance, not by default. Real systems combine both (bigger nodes, and more of them).

**Scalability** means capacity grows roughly in proportion to resources added. Anything that serialises work (a single lock, one database writer, one leader) caps it (see Amdahl's law).` },
    { id: 'stateless', kind: 'concept', title: 'Stateless services', bodyMd: `A **stateless** service keeps no per-user state between requests in its own memory or disk: everything needed arrives with the request (token, parameters) or is read from shared storage. Then **any instance can serve any request**, so you can add or remove instances freely behind a load balancer, restart or replace them at any time, and autoscale.

Where does the state go?
- **User session:** a shared store (Redis) or a signed token (JWT) on the client instead of in-memory sessions.
- **Persistent data:** a database or object storage.
- **Uploaded files:** object storage (S3), not local disk.
- **Caches:** a shared cache tier (local caches are fine as an optimisation, never as the source of truth).
- **Background jobs / schedulers:** a queue with competing consumers, or a leader-elected scheduler so a job runs once, not on every instance.

State is what makes scaling hard, so push it into a few well-understood, purpose-built tiers (cache, database, queue) and scale each with its own technique.` },
    { id: 'path', kind: 'concept', title: 'The usual scaling path', bodyMd: `1. **Single server:** app + database together. Fine for a prototype.
2. **Separate the database** from the app server; add backups.
3. **Load balancer + several stateless app servers** (sessions moved out). Add health checks.
4. **Cache** hot reads (Redis/Memcached, browser and CDN caching for static content).
5. **Read replicas** for read-heavy workloads (watch replication lag).
6. **Asynchronous work** moved to queues and workers (emails, thumbnails, analytics).
7. **Shard / partition the database** when writes or data size outgrow one primary (hard; delay as long as possible).
8. **Multiple regions** for latency and disaster recovery.
9. **Split into services** where teams or scaling needs differ (microservices cost operational complexity; don't start there).

At each step ask: **what is the bottleneck now?** Measure (CPU, memory, disk I/O, connections, lock contention, network) before adding capacity; scaling the wrong tier changes nothing. **Autoscaling** adds and removes instances from metrics such as CPU or queue length, with warm-up and cool-down periods to avoid flapping.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Scaling out before measuring or before trying simple fixes (indexes, caching, query tuning).
2. Keeping sessions or uploads on the local instance and then adding a load balancer.
3. Assuming stateless means "no state anywhere" (the state lives in shared tiers).
4. Sharding early: cross-shard queries and transactions are expensive.
5. Treating the database as infinitely scalable because the app tier scales.
6. Ignoring that every added tier adds failure modes and operational cost.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Vertical vs horizontal scaling?', answerMd: 'Vertical scaling gives one machine more resources: simple but capped and a single point of failure. Horizontal scaling adds more machines behind a load balancer: nearly unlimited and fault tolerant, but requires stateless services and a plan for data partitioning and coordination.' },
    { id: 'iq2', q: 'What makes a service stateless and why does it matter?', answerMd: 'It stores no request-to-request state locally; sessions, files and data live in shared stores. Any instance can then handle any request, so instances can be added, removed or replaced freely, which enables load balancing, autoscaling and rolling deploys.' },
    { id: 'iq3', q: 'Your web app gets slow as traffic grows. How do you scale it?', answerMd: 'Measure to find the bottleneck. Typical steps: move sessions out and run multiple stateless app servers behind a load balancer, add caching and a CDN, optimise queries and indexes, add read replicas, move slow work to queues, and only then shard the database or split services.' },
    { id: 'iq4', q: 'Why is the database usually the hardest tier to scale?', answerMd: 'It holds state that must stay consistent. Adding replicas helps reads but not writes, and sharding brings cross-shard queries, transactions, rebalancing and hot-key issues. Application servers are easy because they are stateless.' },
  ],
  revision: { notesMd: `- Vertical = bigger box (simple, capped, SPOF). Horizontal = more boxes (needs stateless design).
- Stateless: sessions → Redis/JWT; files → object storage; jobs → queue/leader election.
- Path: split DB → LB + stateless app → cache/CDN → read replicas → queues → shard → multi-region → services.
- Measure the bottleneck first; shard late.`, flashcards: [
    { id: 'f1', front: 'What makes horizontal scaling easy for app servers?', backMd: 'Statelessness: any instance can serve any request.' },
    { id: 'f2', front: 'Where do sessions go in a stateless design?', backMd: 'A shared store such as Redis, or a signed token on the client.' },
    { id: 'f3', front: 'Why do read replicas not fix write bottlenecks?', backMd: 'All writes still go to the single primary.' },
    { id: 'f4', front: 'First step when asked to scale?', backMd: 'Find the bottleneck by measuring.' },
    { id: 'f5', front: 'Scale-up main drawback?', backMd: 'Hardware ceiling and a single point of failure.' },
  ] },
  resources: [PRIMER, { title: 'AWS Well-Architected: Performance efficiency pillar', url: 'https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html', kind: 'official-docs' }],
});

const scMcqs: MCQ[] = [
  mcq({ ...q(SC), id: 'sd.sc.q1', type: 'concept', difficulty: 'easy', stem: 'Which change makes an application server tier horizontally scalable?', options: ['Move user sessions out of server memory into a shared store', ['Add more RAM to the server', 'That is vertical scaling.'], ['Disable caching', 'Unrelated.'], ['Run everything in one process', 'The opposite of scaling out.']], answer: 0, explanation: 'Statelessness lets any instance handle any request.' }),
  mcq({ ...q(SC), id: 'sd.sc.q2', type: 'concept', difficulty: 'easy', stem: 'What is the main drawback of vertical scaling?', options: ['A hardware ceiling and a single point of failure', ['It needs a load balancer', 'That applies to horizontal scaling.'], ['It requires stateless code', 'It requires no code changes.'], ['It cannot improve performance', 'It can, up to a point.']], answer: 0, explanation: 'There is a biggest machine, and if it fails you are down.' }),
  mcq({ ...q(SC), id: 'sd.sc.q3', type: 'scenario', difficulty: 'medium', stem: 'Users upload profile photos to a local `uploads/` folder on one app server. You add a second server behind a load balancer and photos randomly 404. What is the fix?', options: ['Store uploads in shared object storage (such as S3) and serve them via a CDN', ['Use sticky sessions for every request', 'Hides the problem and hurts balance and availability.'], ['Copy the folder nightly', 'Leaves a window of missing files.'], ['Reduce the number of servers to one', 'Gives up scaling and availability.']], answer: 0, explanation: 'Files are state; move them to a shared tier.' }),
  mcq({ ...q(SC), id: 'sd.sc.q4', type: 'scenario', difficulty: 'medium', stem: 'App servers are idle but database CPU is at 95% under a read-heavy workload. Which step is the best FIRST improvement?', options: ['Add caching and/or read replicas (and check indexes) for reads', ['Add more app servers', 'The app tier is not the bottleneck.'], ['Shard the database by user id immediately', 'Heavy and premature.'], ['Double the load balancer capacity', 'Not the bottleneck.']], answer: 0, explanation: 'Relieve the bottleneck tier with the cheapest effective technique.' }),
  mcq({ ...q(SC), id: 'sd.sc.q5', type: 'concept', difficulty: 'medium', stem: 'Why is sharding usually delayed as long as possible?', options: ['It adds cross-shard queries, transactions, rebalancing and hot-key problems', ['It makes data less durable', 'It does not inherently.'], ['It requires dropping SQL', 'Not necessarily.'], ['It only works with NoSQL', 'It can be done with SQL as well.']], answer: 0, explanation: 'Exhaust caching, indexing, read replicas and vertical scaling first.' }),
  mcq({ ...q(SC), id: 'sd.sc.q6', type: 'scenario', difficulty: 'medium', stem: 'A nightly cleanup job is configured on every app instance. After scaling to 6 instances it runs 6 times and corrupts data. What is a good design?', options: ['Run it from one place: a leader-elected scheduler or a single queue-driven worker', ['Run it more often on each instance', 'Worsens the duplication.'], ['Disable the job', 'Does not solve the need.'], ['Pin every user to one instance', 'Unrelated to the job.']], answer: 0, explanation: 'Background work must be coordinated so it executes once.' }),
];

// ---------------------------------------------------------------------------------------
const DB = 'sd.databases';
const dbs = sdTopic({
  id: DB, title: 'Choosing and Modelling Databases', level: 'core', estMinutes: 50, prerequisites: [], related: ['dbms.sql-vs-nosql', 'dbms.indexing', 'sd.replication-sharding'],
  summary: 'SQL vs NoSQL, indexing and modelling for access patterns.',
  objectives: ['Choose between relational, key-value, document, wide-column, graph, search and time-series stores for a use case.', 'Model data from the access patterns, including denormalisation trade-offs.', 'Explain how indexes speed reads and cost writes, and how to spot a missing index.', 'Justify polyglot persistence and avoid common choices made for fashion.'],
  sections: [
    { id: 'types', kind: 'comparison', title: 'Kinds of data stores', bodyMd: `| Type | Examples | Good for | Watch out for |
|---|---|---|---|
| **Relational (SQL)** | PostgreSQL, MySQL | structured data, relationships, transactions, ad-hoc queries, reporting | single-primary write scaling; sharding is manual |
| **Key-value** | Redis, DynamoDB, Memcached | lookup by key, sessions, caches, counters; very fast and scalable | no rich queries; the key is the only access path |
| **Document** | MongoDB, Firestore | nested, flexible-schema objects read as a unit (profiles, catalogues) | cross-document joins and transactions are weaker; schema drift |
| **Wide-column** | Cassandra, HBase, Bigtable | huge write volume, time-ordered data, known query patterns, multi-region | you must design tables per query; limited ad-hoc queries |
| **Graph** | Neo4j | relationships and traversals (social graph, recommendations, fraud rings) | harder to scale out; niche |
| **Search** | Elasticsearch, OpenSearch | full-text search, faceting, log analytics | not a primary source of truth; eventual consistency |
| **Time-series** | InfluxDB, TimescaleDB | metrics and events by time, downsampling, retention | not general purpose |
| **Object storage** | S3, GCS | blobs: images, video, backups | high latency per object, no queries |

**Default for most products: start with a relational database.** It gives transactions, constraints, flexible queries and mature tooling, and one well-tuned primary with replicas handles more than most candidates assume. Pick a NoSQL store when a *specific* requirement demands it: massive write throughput or horizontal scale, a pure key-based access pattern, flexible nested documents, or search.

**ACID** (atomicity, consistency, isolation, durability) is what relational stores guarantee for transactions; many distributed NoSQL stores offer **BASE**-style behaviour (basically available, soft state, eventually consistent) and now often optional transactions.` },
    { id: 'modelling', kind: 'concept', title: 'Model from the access patterns', bodyMd: `Start from **the queries and writes you must support**, with their frequency and latency targets, then design the schema.

- **Normalised (relational) design** stores each fact once and joins at read time: no duplication, easy updates, flexible queries; joins cost CPU and don't shard well.
- **Denormalised design** duplicates data so a read needs one lookup: fast reads and easy sharding, but updates must touch several places and can go inconsistent. Typical in NoSQL, and in SQL for hot read paths (e.g. storing \`author_name\` and \`like_count\` on a post).

**Example: social posts.** Queries: (1) show a user's profile page with their latest 20 posts, (2) show a post with its comment count, (3) show a home feed.
- SQL: \`users\`, \`posts(user_id, created_at, body)\` with index \`(user_id, created_at DESC)\`, \`comments(post_id, …)\`, plus a denormalised \`comment_count\` on \`posts\` updated on write.
- Key-value/wide-column: row key \`user_id\`, clustering by \`created_at DESC\`, so "latest 20 posts of a user" is one sequential read; the feed is precomputed per user.

**Choose partition/shard keys** with high cardinality and even access so no single partition becomes a **hot spot** (a celebrity user, today's date, a single tenant).` },
    { id: 'indexes', kind: 'concept', title: 'Indexes in one page', bodyMd: `An **index** (usually a **B+ tree**) maps column values to rows so a lookup is O(log n) instead of a full scan O(n). Reads get faster; every insert/update/delete must also maintain the index (**writes get slower, storage grows**).

- A **composite index** \`(a, b, c)\` helps queries filtering on \`a\`, on \`a,b\`, or \`a,b,c\` (the **leftmost prefix** rule), not on \`b\` alone.
- A **covering index** contains every column the query needs, so the table is not touched.
- Indexes are not used when you wrap the column in a function (\`WHERE lower(email) = …\`), use a leading wildcard (\`LIKE '%abc'\`), or when selectivity is low (a boolean column).
- Spot problems with \`EXPLAIN\`: full table scans and large "rows examined" on hot queries.
- Index what you filter, join and sort on, and no more: each index costs write throughput and memory.

At scale, only a **small fraction of the data is hot**, so the indexes and hot rows fit in RAM (the buffer pool), which is why a database that fits its working set in memory is dramatically faster.` },
    { id: 'choose', kind: 'recognition', title: 'Quick decision guide', bodyMd: `| If the requirement says… | Consider |
|---|---|
| orders, payments, inventory, anything needing transactions | relational |
| millions of lookups per second by id, simple values | key-value (Redis cache, DynamoDB) |
| profile or catalogue objects read as a whole | document store (or JSON columns in SQL) |
| write-heavy time-ordered events at huge scale | wide-column or time-series |
| "search by text", filters and facets | search engine alongside the primary DB |
| friends-of-friends, shortest path | graph database (or SQL for small scale) |
| photos, videos, files | object storage + metadata in a DB |

**Polyglot persistence** (several stores, each for what it does best) is normal in large systems, but each extra store adds operational cost and a **synchronisation problem**: keep one source of truth and feed the others from it (change data capture, events).` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Choosing NoSQL "because it scales" without a requirement that SQL cannot meet.
2. Choosing a database before listing the queries.
3. Indexing every column, or none.
4. Using the search engine or cache as the only copy of data.
5. A hot partition key (timestamp, country) that sends all traffic to one shard.
6. Over-normalising a read-heavy path, or denormalising without a plan to keep copies consistent.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'SQL or NoSQL for a new product?', answerMd: 'Default to relational: transactions, constraints, flexible queries and mature tooling go a long way, and one primary with replicas scales further than people expect. Choose a NoSQL type when a concrete requirement demands it: enormous write throughput, key-only access at huge scale, flexible nested documents, graph traversals or full-text search. Often both are used with a single source of truth.' },
    { id: 'iq2', q: 'How would you design the schema for a "posts" feature?', answerMd: 'Start from queries: latest posts by user, a single post with counts, and the feed. A posts table keyed by id with an index on (user_id, created_at DESC) serves the profile page; counters like comment_count are denormalised and updated on write or asynchronously; the feed is built separately (precomputed or merged at read time). Partition by user_id if sharding becomes necessary.' },
    { id: 'iq3', q: 'What is the cost of an index?', answerMd: 'Every write must also update the index, so write latency rises, and the index uses storage and buffer-pool memory. It pays off only for columns used in frequent filters, joins and sorts, so index selectively.' },
    { id: 'iq4', q: 'When would you denormalise?', answerMd: 'When a hot read path would need expensive joins or the data is sharded, and you can tolerate or manage duplicated data: copy the needed fields, update copies on write, or rebuild them asynchronously. Don\'t do it before measuring a read bottleneck.' },
    { id: 'iq5', q: 'What is a hot partition and how do you avoid it?', answerMd: 'A shard receiving a disproportionate share of traffic, for example because the partition key is a timestamp, a celebrity user or a tenant that dominates. Choose high-cardinality, evenly accessed keys, add salting or suffixes for known hot keys, and cache hot data.' },
  ],
  revision: { notesMd: `- Default relational; NoSQL when a specific need: write scale, key-value, documents, graph, search, time series.
- Model from access patterns; normalise for correctness, denormalise for hot reads (with a consistency plan).
- Index = B+ tree: faster reads, slower writes; leftmost prefix; covering; avoid functions on columns.
- Partition key: high cardinality, even access, no hot spots.
- One source of truth; feed search/caches from it (CDC/events).`, flashcards: [
    { id: 'f1', front: 'Best default store for transactional data?', backMd: 'A relational database.' },
    { id: 'f2', front: 'What does a composite index (a, b, c) help?', backMd: 'Queries on a, a+b, or a+b+c (leftmost prefix), not b alone.' },
    { id: 'f3', front: 'Cost of an index?', backMd: 'Slower writes plus extra storage and memory.' },
    { id: 'f4', front: 'When is a wide-column store a fit?', backMd: 'Huge write volume with known, key-based query patterns, such as time-ordered events.' },
    { id: 'f5', front: 'Where should blobs like videos live?', backMd: 'Object storage, with metadata in a database.' },
    { id: 'f6', front: 'Good shard key properties?', backMd: 'High cardinality and evenly distributed access.' },
  ] },
  resources: [PRIMER, { title: 'Use The Index, Luke (SQL indexing)', url: 'https://use-the-index-luke.com/', kind: 'book' }, { title: 'DynamoDB: NoSQL design (AWS docs)', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html', kind: 'official-docs' }],
});

const dbMcqs: MCQ[] = [
  mcq({ ...q(DB), id: 'sd.db.q1', type: 'scenario', difficulty: 'easy', stem: 'An e-commerce checkout updates inventory and creates an order, and both must succeed or neither. Which kind of store fits best for this part?', options: ['A relational database with ACID transactions', ['A cache like Memcached', 'Not durable or transactional.'], ['An object store', 'Not designed for transactional updates.'], ['A search index', 'Not a source of truth.']], answer: 0, explanation: 'Multi-row atomic updates are the relational strength.' }),
  mcq({ ...q(DB), id: 'sd.db.q2', type: 'concept', difficulty: 'medium', stem: 'A table has an index on `(country, city, created_at)`. Which query can use the index efficiently?', options: ['`WHERE country = "IN" AND city = "Pune"`', ['`WHERE city = "Pune"`', 'The leading column is missing.'], ['`WHERE created_at > "2026-01-01"` alone', 'The leading column is missing.'], ['`WHERE lower(country) = "in"`', 'A function on the column prevents using it.']], answer: 0, explanation: 'Composite indexes follow the leftmost-prefix rule.' }),
  mcq({ ...q(DB), id: 'sd.db.q3', type: 'concept', difficulty: 'medium', stem: 'What is the main downside of adding many indexes to a write-heavy table?', options: ['Each write must update every index, increasing latency and storage', ['Reads become slower', 'Reads usually get faster.'], ['Queries return wrong results', 'Correctness is unaffected.'], ['The table cannot be sharded', 'Unrelated.']], answer: 0, explanation: 'Index on what queries need, not on everything.' }),
  mcq({ ...q(DB), id: 'sd.db.q4', type: 'scenario', difficulty: 'medium', stem: 'You store sensor events keyed by timestamp in a sharded database partitioned by `timestamp`. Today\'s writes overload one shard. What is the problem and a fix?', options: ['A hot partition; partition by (device_id, time bucket) so writes spread', ['Too many indexes; drop them', 'The write concentration is the issue.'], ['The cache is too small', 'Not the cause.'], ['Use a larger timestamp', 'Same concentration.']], answer: 0, explanation: 'Monotonic keys send all current writes to the newest shard.' }),
  mcq({ ...q(DB), id: 'sd.db.q5', type: 'concept', difficulty: 'easy', stem: 'Where should user-uploaded videos be stored?', options: ['Object storage (such as S3), with metadata in a database', ['Inside a relational table as BLOBs', 'Expensive and slow at scale.'], ['In the application server\'s memory', 'Not durable.'], ['In the cache only', 'Not durable.']], answer: 0, explanation: 'Object stores handle large blobs cheaply and durably, usually fronted by a CDN.' }),
  mcq({ ...q(DB), id: 'sd.db.q6', type: 'concept', difficulty: 'medium', stem: 'You add Elasticsearch for product search. Which is the sound approach to the data?', options: ['Keep the primary database as the source of truth and feed the search index from it', ['Make Elasticsearch the only copy of the data', 'It is not designed as the system of record.'], ['Write to both from the client independently', 'Easily inconsistent.'], ['Never update the index', 'Search would go stale.']], answer: 0, explanation: 'Use change data capture or events to keep derived stores in sync.' }),
  mcq({ ...q(DB), id: 'sd.db.q7', type: 'concept', difficulty: 'medium', stem: 'Why does denormalisation speed up reads but complicate writes?', options: ['Copies of data avoid joins, but every copy must be updated to stay consistent', ['It removes the need for indexes', 'Indexes still matter.'], ['It prevents duplicate data', 'It introduces duplicates.'], ['It forces strong consistency', 'The opposite risk.']], answer: 0, explanation: 'You trade write complexity and potential inconsistency for read performance.' }),
];

// ---------------------------------------------------------------------------------------
const MS = 'sd.messaging';
const messaging = sdTopic({
  id: MS, title: 'Queues and Event-Driven Architecture', level: 'core', estMinutes: 50, prerequisites: [], related: ['sd.fault-tolerance', 'sd.case-notification', 'sd.rate-limiting'],
  summary: 'Queues vs pub/sub, delivery semantics and idempotency.',
  objectives: ['Explain why asynchronous messaging decouples services and absorbs spikes.', 'Compare work queues, pub/sub topics and partitioned logs (Kafka-style).', 'State at-most-once, at-least-once and exactly-once delivery and design idempotent consumers.', 'Handle ordering, retries, dead-letter queues, back-pressure and the outbox pattern.'],
  sections: [
    { id: 'why', kind: 'concept', title: 'Why use a message queue', bodyMd: `Instead of service A calling service B synchronously and waiting, A puts a **message** on a **broker** and B processes it when ready.

Benefits:
- **Decoupling:** producer and consumer don't need each other online at the same time, nor to know each other.
- **Load levelling (buffering):** a spike of 10,000 requests/s lands in the queue; workers drain it at their own pace instead of falling over.
- **Async work off the request path:** the API returns "accepted" quickly; sending the email or resizing the image happens in the background.
- **Reliability:** failed work is retried; messages survive a worker crash.
- **Independent scaling:** add consumers when the queue grows.

Costs: more moving parts, **eventual consistency**, harder debugging (no single stack trace), and you must handle duplicates, ordering and poison messages. If the caller needs the answer immediately (reading a balance), use a synchronous call.` },
    { id: 'models', kind: 'comparison', title: 'Queue, pub/sub and log', bodyMd: `| Model | Behaviour | Examples |
|---|---|---|
| **Work queue** (point-to-point) | each message is delivered to **one** of several competing consumers, then removed | SQS, RabbitMQ queues |
| **Pub/sub topic** | each message is delivered to **every** subscriber (each has its own queue) | SNS, Google Pub/Sub, RabbitMQ fan-out |
| **Partitioned log** | append-only, ordered per partition, **retained** for days; consumers track an **offset** and can **replay**; consumers in a *group* share partitions | Kafka, Kinesis, Pulsar |

**Kafka-style essentials:**
- A **topic** is split into **partitions**; order is guaranteed **only within a partition**. Choose the **message key** (e.g. \`user_id\`) so all events for one entity go to the same partition and stay ordered.
- Within a **consumer group**, each partition is read by **one** consumer, so parallelism is capped by the partition count: 6 partitions can feed at most 6 active consumers; extra consumers sit idle. Different groups each get all messages.
- Retention lets new consumers or bug fixes **replay** history; a database or search index can be rebuilt from the log.

**Event-driven architecture:** services publish **events** ("OrderPlaced") describing facts; others react (inventory, email, analytics) without the publisher knowing them. It scales organisationally, but the flow is implicit; use tracing and clear event schemas.` },
    { id: 'semantics', kind: 'concept', title: 'Delivery semantics and idempotency', bodyMd: `| Guarantee | Meaning | How it happens |
|---|---|---|
| **At-most-once** | never duplicated, may be **lost** | ack before processing (or fire and forget) |
| **At-least-once** | never lost, may be **duplicated** | ack **after** processing; retry on failure/timeout |
| **Exactly-once** | each message has its effect once | not achievable end to end in general; approximated by **at-least-once + idempotent processing**, or by transactional features inside a closed system (Kafka transactions) |

Since most brokers give at-least-once, **consumers must be idempotent**: processing the same message twice has the same effect as once.
- Give every message a unique **id** (or use a business key) and store processed ids (a unique constraint), or write with **upserts** (\`INSERT … ON CONFLICT DO NOTHING\`).
- Make operations naturally idempotent ("set status = shipped" rather than "increment counter").

**Failure handling:**
- **Retry with exponential backoff and jitter**; limit attempts.
- **Dead-letter queue (DLQ):** after N failures, park the **poison message** for inspection so it doesn't block the queue forever.
- **Visibility timeout** (SQS): a received message is hidden while being processed; if no ack arrives in time, it reappears, so set it longer than the processing time.
- **Back-pressure:** bound queue size / consumer lag, alert on lag, and slow or reject producers when consumers can't keep up.

**Dual-write problem and the outbox pattern:** "save to the database *and* publish an event" can't be atomic: a crash between the two leaves them out of sync. Write the event to an **outbox table in the same transaction** as the data, and have a relay (or CDC) publish it afterwards, giving at-least-once publication with consistent state.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Claiming "exactly-once" without explaining idempotency.
2. Ordering assumptions across partitions or across competing consumers.
3. Acknowledging a message before the work is durably done (lost work on crash).
4. No dead-letter queue: one poison message loops forever.
5. Using a queue where a simple function call would do (needless complexity).
6. Unbounded queues with no lag alerting; a slow consumer silently builds hours of backlog.
7. Publishing an event and writing to the database in two separate steps with no outbox.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Why put a queue between two services?', answerMd: 'To decouple them in time and availability, absorb traffic spikes, run slow work asynchronously, retry failures and scale consumers independently. The price is eventual consistency and extra operations: duplicates, ordering and monitoring need explicit handling.' },
    { id: 'iq2', q: 'At-least-once vs at-most-once vs exactly-once?', answerMd: 'At-most-once may lose messages, at-least-once may deliver duplicates, and true exactly-once end to end is generally not achievable; systems approximate it with at-least-once delivery plus idempotent consumers (deduplication by message id or upserts). Pick at-least-once with idempotency for anything important.' },
    { id: 'iq3', q: 'How do you keep messages for one user in order with many consumers?', answerMd: 'Use a partitioned log and a message key such as user_id so all events for that user land in one partition, which is consumed by one consumer in the group, giving per-key ordering. Global ordering would force a single partition and limit throughput.' },
    { id: 'iq4', q: 'A message keeps failing and blocks processing. What do you do?', answerMd: 'Retry with backoff a limited number of times, then move it to a dead-letter queue for inspection and alerting so the main flow continues. Fix the consumer or data, then replay from the DLQ.' },
    { id: 'iq5', q: 'How do you update a database and publish an event reliably?', answerMd: 'Use the transactional outbox: in one database transaction write the business data and an outbox row; a separate relay or change-data-capture process publishes outbox rows to the broker and marks them sent. This avoids the dual-write inconsistency; consumers handle the possible duplicates idempotently.' },
  ],
  revision: { notesMd: `- Queue: decouple, buffer spikes, async work, retries, independent scaling. Cost: eventual consistency, complexity.
- Work queue (one consumer) vs pub/sub (every subscriber) vs partitioned log (ordered per partition, retained, replayable).
- Consumer group: one consumer per partition → parallelism ≤ partitions. Key = ordering unit.
- At-most-once (may lose) / at-least-once (may duplicate) / "exactly-once" = at-least-once + idempotent consumer.
- Retry + backoff + jitter, DLQ, visibility timeout, lag alerts, outbox pattern.`, flashcards: [
    { id: 'f1', front: 'How is ordering guaranteed in Kafka?', backMd: 'Only within a partition; use a message key to route related events to the same partition.' },
    { id: 'f2', front: 'Max active consumers in a group for 6 partitions?', backMd: '6; extra consumers are idle.' },
    { id: 'f3', front: 'How do you get "exactly once" in practice?', backMd: 'At-least-once delivery plus idempotent processing.' },
    { id: 'f4', front: 'What is a DLQ for?', backMd: 'Parking messages that keep failing so they do not block the queue.' },
    { id: 'f5', front: 'What does the outbox pattern solve?', backMd: 'The dual-write problem between a database update and an event publish.' },
    { id: 'f6', front: 'Ack before or after processing for at-least-once?', backMd: 'After.' },
  ] },
  resources: [PRIMER, { title: 'Apache Kafka: Introduction', url: 'https://kafka.apache.org/documentation/#introduction', kind: 'official-docs' }, { title: 'Amazon SQS: standard queues, visibility timeout and dead-letter queues', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html', kind: 'official-docs' }],
});

const msMcqs: MCQ[] = [
  mcq({ ...q(MS), id: 'sd.ms.q1', type: 'concept', difficulty: 'easy', stem: 'What is a primary benefit of placing a queue between a web API and a slow background task?', options: ['The API can respond quickly and the queue absorbs traffic spikes', ['The task becomes synchronous', 'The opposite.'], ['Messages are guaranteed to be in global order', 'Not guaranteed in general.'], ['No retries are ever needed', 'Retries are still needed.']], answer: 0, explanation: 'Producers and consumers are decoupled in time and rate.' }),
  mcq({ ...q(MS), id: 'sd.ms.q2', type: 'concept', difficulty: 'medium', stem: 'A consumer acknowledges each message immediately after receiving it, then processes it. The consumer crashes mid-processing. What is the delivery behaviour?', options: ['At-most-once: the message is lost', ['At-least-once: it is redelivered', 'Redelivery needs the ack to come after processing.'], ['Exactly-once', 'Not guaranteed.'], ['The broker retries forever', 'It was already acknowledged.']], answer: 0, explanation: 'Ack-before-process loses work on crash; ack-after-process gives at-least-once.' }),
  mcq({ ...q(MS), id: 'sd.ms.q3', type: 'scenario', difficulty: 'medium', stem: 'A payment-event consumer receives the same message twice because of a retry. How do you prevent double processing?', options: ['Make processing idempotent, e.g. record the message id with a unique constraint or use upserts', ['Turn off retries entirely', 'Risks losing work.'], ['Add more partitions', 'Unrelated.'], ['Increase the message size', 'Unrelated.']], answer: 0, explanation: 'At-least-once delivery requires idempotent consumers.' }),
  mcq({ ...q(MS), id: 'sd.ms.q4', type: 'complexity', difficulty: 'medium', stem: 'A topic has 6 partitions. A consumer group has 8 consumers. How many consumers are actively reading?', options: ['6', ['8', 'Each partition is assigned to at most one consumer in the group.'], ['2', 'That is the number idle.'], ['1', 'All partitions are read in parallel.']], answer: 0, explanation: 'Parallelism within a group is capped by the number of partitions; 2 consumers stay idle.' }),
  mcq({ ...q(MS), id: 'sd.ms.q5', type: 'concept', difficulty: 'medium', stem: 'You need all events for one customer processed in order in a Kafka topic. What do you do?', options: ['Use the customer id as the message key so they share a partition', ['Use a random key', 'Events would be spread over partitions with no ordering.'], ['Add more consumers', 'Does not preserve ordering.'], ['Increase retention', 'Unrelated.']], answer: 0, explanation: 'Ordering is only guaranteed per partition.' }),
  mcq({ ...q(MS), id: 'sd.ms.q6', type: 'concept', difficulty: 'easy', stem: 'What is the purpose of a dead-letter queue?', options: ['To hold messages that repeatedly fail so they do not block the main queue', ['To make delivery faster', 'Unrelated.'], ['To store all messages permanently', 'Not its purpose.'], ['To encrypt messages', 'Unrelated.']], answer: 0, explanation: 'Poison messages are parked for inspection and replay.' }),
  mcq({ ...q(MS), id: 'sd.ms.q7', type: 'scenario', difficulty: 'hard', stem: 'A service saves an order to the database and then publishes `OrderPlaced`. After a crash between the two steps, orders exist with no events. Which pattern addresses this?', options: ['Transactional outbox: write the event to an outbox table in the same transaction and publish it afterwards', ['Publish first, then save', 'Reverses the failure mode (events without orders).'], ['Use two separate transactions', 'Still not atomic.'], ['Disable retries', 'Does not fix the gap.']], answer: 0, explanation: 'The dual-write is made atomic through the database; publication then becomes at-least-once.' }),
  mcq({ ...q(MS), id: 'sd.ms.q8', type: 'concept', difficulty: 'medium', stem: 'Which statement distinguishes pub/sub from a work queue?', options: ['In pub/sub every subscriber receives each message; in a work queue each message goes to one consumer', ['Work queues deliver messages to all consumers', 'That is pub/sub.'], ['Pub/sub never retains messages', 'Retention depends on the product.'], ['They are identical', 'The delivery model differs.']], answer: 0, explanation: 'Use a work queue to share work and pub/sub to broadcast events.' }),
];

export const topics: Topic[] = [requirements, lta, scal, dbs, messaging];
export const mcqs: MCQ[] = [...rqMcqs, ...ltMcqs, ...scMcqs, ...dbMcqs, ...msMcqs];
