import type { MCQ, Topic } from '../schema';
import { mcq } from '../helpers';
import { PRIMER, q, sdTopic } from './common';

// System Design foundations, batch 2: API design, authentication and authorisation,
// observability, fault tolerance and distributed-systems fundamentals. Numeric answers are
// recomputed in tests/sd-facts.test.ts.

// ---------------------------------------------------------------------------------------
const AP = 'sd.api-design';
const api = sdTopic({
  id: AP, title: 'API Design', level: 'core', estMinutes: 45, prerequisites: [], related: ['cn.rest-protocols', 'sd.auth', 'sd.rate-limiting', 'sd.case-api-gateway'],
  summary: 'REST resources, pagination, versioning and idempotency keys.',
  objectives: ['Model resources and endpoints for a feature, with correct methods and status codes.', 'Design pagination, filtering and consistent error responses.', 'Make writes retry-safe with idempotency keys and concurrent updates safe with ETags.', 'Evolve an API without breaking clients (versioning, additive changes) and handle long-running work.'],
  sections: [
    { id: 'resources', kind: 'concept', title: 'Resource-oriented design', bodyMd: `Design APIs around **nouns (resources)** and let HTTP methods be the verbs.

\`\`\`
POST   /v1/orders                         create an order            -> 201 Created + Location
GET    /v1/orders/{id}                    read one                   -> 200 / 404
GET    /v1/orders?status=open&limit=20&after=ord_123   list         -> 200 + next cursor
PATCH  /v1/orders/{id}                    partial update             -> 200
DELETE /v1/orders/{id}                    cancel/delete              -> 204
POST   /v1/orders/{id}/cancel             an action that is not CRUD  -> 200 (fine when it is a real operation)
GET    /v1/users/{id}/orders              nested relationship
\`\`\`

- Use **plural nouns**, stable **opaque ids**, and consistent naming; nest at most one level.
- Validate input and return **precise status codes**: 400/422 (bad input), 401 (unauthenticated), 403 (forbidden), 404, 409 (conflict, e.g. duplicate), 429 (rate limited, with \`Retry-After\`).
- Return a **consistent error body**: \`{"error": {"code": "invalid_quantity", "message": "...", "details": [...]}}\` with a machine-readable code.
- Use ISO-8601 UTC timestamps, explicit units (\`amount_cents\`, \`currency\`), and never expose internal ids or database structure by accident.
- **REST vs GraphQL vs gRPC:** REST is the default for public APIs (cacheable, simple). GraphQL lets clients ask for exactly the fields they need in one round trip (good for varied mobile/web clients, but harder caching, rate limiting and N+1 query control). gRPC is typical between internal services (typed, fast, streaming).` },
    { id: 'lists', kind: 'concept', title: 'Pagination, filtering and consistency', bodyMd: `Never return an unbounded list.

- **Offset pagination** (\`?page=3&limit=20\`): simple and allows jumping to a page, but slow on deep pages (the database scans and discards rows) and unstable when rows are inserted or deleted between requests.
- **Cursor (keyset) pagination** (\`?after=<opaque cursor>&limit=20\`): the cursor encodes the last item's sort key (\`created_at, id\`); the query is \`WHERE (created_at, id) < (:c, :i) ORDER BY created_at DESC, id DESC LIMIT 20\`. Fast with an index and stable. Return \`next_cursor\` in the response. This is the right default for feeds and large collections.
- **Filtering and sorting** by whitelisted fields only (each one needs an index); cap \`limit\` (for example 100).
- **Conditional requests:** return an **\`ETag\`**; clients send \`If-None-Match\` to get a cheap \`304 Not Modified\` for reads, and \`If-Match\` on updates so a stale write fails with **\`412 Precondition Failed\`**. This is optimistic concurrency control and prevents the lost-update problem.` },
    { id: 'safety', kind: 'concept', title: 'Idempotency, async work and webhooks', bodyMd: `- **Idempotent methods:** GET, PUT, DELETE (and HEAD/OPTIONS). **POST is not**, so for operations that must not run twice (payments, order creation) accept an **\`Idempotency-Key\`** header: the server stores the key with the first result (key uniqueness enforced atomically) and returns the stored response on a retry. Keys expire after some hours or days.
- **Long-running operations:** return **\`202 Accepted\`** with a \`Location: /v1/jobs/{id}\` the client polls (or a webhook/callback). Don't hold a request open for minutes.
- **Webhooks:** the server calls the client when something happens. Sign the payload (HMAC) so the receiver can verify it, retry with backoff, and let receivers deduplicate by event id (delivery is at-least-once).
- **Bulk endpoints** reduce chatty round trips but need per-item results (partial success).
- **Rate limits:** tell clients their limits (\`X-RateLimit-Remaining\`, \`Retry-After\`).` },
    { id: 'evolution', kind: 'concept', title: 'Versioning and backward compatibility', bodyMd: `Published APIs are contracts; breaking clients is expensive.

- **Additive changes are safe** (new optional fields, new endpoints). Clients must ignore unknown fields.
- **Breaking changes** (removing or renaming a field, changing a type or meaning, new required input) need a **new version**: \`/v2/...\` in the path (most common and visible) or a version header. Run old and new in parallel, announce a **deprecation** date, monitor usage of the old version, then retire it.
- Don't reuse a field with a new meaning. Add a new field, deprecate the old one.
- Use **explicit enums with an "unknown" fallback** on the client so new enum values don't crash old clients.
- Document with **OpenAPI**, generate SDKs and contract tests.

**New-grad vs senior:** a new grad should produce clear resources, methods, status codes, pagination and an idempotency story. Seniors are expected to add versioning strategy, deprecation, rate limiting per client, multi-tenant concerns and API governance.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Verbs in URLs (\`/getUser\`, \`/createOrder\`) and everything as POST.
2. Returning 200 with an error in the body.
3. Unbounded lists, or offset pagination on huge changing data.
4. No idempotency for payment-like POSTs.
5. Breaking changes shipped in place with no version.
6. Leaking internals (stack traces, auto-increment ids that enable enumeration).
7. Putting secrets or tokens in URLs (they land in logs and browser history).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Design the REST API for an order service.', answerMd: 'Resources: orders and order items. POST /v1/orders (201, Location, Idempotency-Key), GET /v1/orders/{id}, GET /v1/orders with filters and cursor pagination, PATCH for changes, POST /v1/orders/{id}/cancel for the action. Standard status codes, a consistent error body, ETags for concurrent updates, auth via bearer token, rate limits with 429 and Retry-After, and a versioned path.' },
    { id: 'iq2', q: 'Why prefer cursor pagination over offset pagination?', answerMd: 'Offset forces the database to skip rows (slow for deep pages) and gives duplicates or gaps when data changes between requests. A cursor continues from the last seen sort key, so the query uses an index, stays fast, and is stable, at the cost of not supporting arbitrary page jumps.' },
    { id: 'iq3', q: 'How do you prevent a retried POST from creating two orders?', answerMd: 'Require an Idempotency-Key. The server atomically records the key with the response of the first successful request (unique constraint) and returns that stored response for any retry with the same key, even if the first request is still in flight (reject or wait).' },
    { id: 'iq4', q: 'How do you evolve an API without breaking clients?', answerMd: 'Make only additive changes within a version, keep clients tolerant of unknown fields, introduce breaking changes as a new version, run versions in parallel, publish deprecation timelines, and measure traffic on old versions before removal.' },
    { id: 'iq5', q: 'Two users edit the same record at the same time. How does the API stop one overwriting the other silently?', answerMd: 'Optimistic concurrency: return an ETag (or version number) with the resource and require If-Match on updates. If the record changed meanwhile, the server responds 412 Precondition Failed (or 409), and the client re-reads and retries.' },
  ],
  revision: { notesMd: `- Resources = plural nouns; methods = verbs; 201 + Location, 204, 400/422, 401/403, 404, 409, 429 + Retry-After.
- Cursor pagination (keyset) for big/changing lists; cap limit; whitelist filters.
- ETag + If-Match → 412 (lost updates); If-None-Match → 304.
- Idempotency-Key for POST; 202 + job URL for long work; signed, retried webhooks.
- Additive changes only within a version; /v2 for breaking; deprecation window.`, flashcards: [
    { id: 'f1', front: 'Status for a rejected stale update using If-Match?', backMd: '412 Precondition Failed.' },
    { id: 'f2', front: 'Why cursor over offset pagination?', backMd: 'Index-friendly and stable under inserts, but no page jumping.' },
    { id: 'f3', front: 'How to make POST /payments retry-safe?', backMd: 'Idempotency-Key header with a stored result.' },
    { id: 'f4', front: 'Status for accepted long-running work?', backMd: '202 Accepted with a job URL to poll.' },
    { id: 'f5', front: 'Is adding an optional response field a breaking change?', backMd: 'No (clients must ignore unknown fields).' },
  ] },
  resources: [PRIMER, { title: 'Microsoft REST API Guidelines', url: 'https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md', kind: 'article' }, { title: 'Stripe API: Idempotent requests', url: 'https://docs.stripe.com/api/idempotent_requests', kind: 'official-docs' }, { title: 'MDN: HTTP conditional requests', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests', kind: 'official-docs' }],
});

const apMcqs: MCQ[] = [
  mcq({ ...q(AP), id: 'sd.ap.q1', type: 'concept', difficulty: 'easy', stem: 'Which URL design is the best REST style for fetching one user\'s orders?', options: ['`GET /v1/users/42/orders`', ['`GET /v1/getOrdersForUser?id=42`', 'A verb in the URL.'], ['`POST /v1/users/42/orders/list`', 'Reads should use GET.'], ['`GET /v1/doOrders/42`', 'Not resource-oriented.']], answer: 0, explanation: 'Plural nouns, nested relationship, and GET for reads.' }),
  mcq({ ...q(AP), id: 'sd.ap.q2', type: 'scenario', difficulty: 'medium', stem: 'Mobile clients page through a feed with `?page=N`. New posts keep arriving, and users see duplicates when they scroll. What is the best fix?', options: ['Switch to cursor (keyset) pagination based on (created_at, id)', ['Increase the page size', 'Duplicates still occur.'], ['Cache pages for an hour', 'Hides new content and does not remove the instability.'], ['Use POST for listing', 'Unrelated to the cause.']], answer: 0, explanation: 'Inserts shift offsets; a cursor continues after the last seen item.' }),
  mcq({ ...q(AP), id: 'sd.ap.q3', type: 'scenario', difficulty: 'medium', stem: 'A client PUTs an edited document, but someone else changed it in the meantime. Which mechanism rejects the stale write?', options: ['`If-Match` with the ETag and a `412 Precondition Failed` response', ['`Cache-Control: no-store`', 'That controls caching.'], ['A larger request timeout', 'Unrelated.'], ['`Retry-After`', 'It tells clients when to retry after throttling.']], answer: 0, explanation: 'Optimistic concurrency control with entity tags prevents lost updates.' }),
  mcq({ ...q(AP), id: 'sd.ap.q4', type: 'concept', difficulty: 'medium', stem: 'Which change to an existing API response is a breaking change?', options: ['Renaming the field `total` to `amount`', ['Adding an optional field `currency`', 'Clients that ignore unknown fields are unaffected.'], ['Adding a new endpoint', 'Additive.'], ['Adding a new optional query parameter', 'Additive.']], answer: 0, explanation: 'Removing or renaming fields breaks existing clients; use a new field and deprecate the old one, or a new version.' }),
  mcq({ ...q(AP), id: 'sd.ap.q5', type: 'scenario', difficulty: 'medium', stem: 'Generating a report takes 2 minutes. What should `POST /v1/reports` do?', options: ['Return 202 Accepted with a job URL to poll (or a webhook), and process in the background', ['Hold the connection open for 2 minutes', 'Ties up resources and times out through proxies.'], ['Return 200 with an empty body', 'Does not tell the client where to get the result.'], ['Return 500 and ask the client to retry', 'A misuse of an error code.']], answer: 0, explanation: 'Asynchronous operations should acknowledge quickly and expose status.' }),
  mcq({ ...q(AP), id: 'sd.ap.q6', type: 'concept', difficulty: 'medium', stem: 'What is an `Idempotency-Key` header for?', options: ['Letting a client safely retry a non-idempotent request (such as a payment) without repeating its effect', ['Authenticating the user', 'It is not an auth mechanism.'], ['Compressing the body', 'Unrelated.'], ['Versioning the API', 'Unrelated.']], answer: 0, explanation: 'The server remembers the result for the key and replays it on retry.' }),
  mcq({ ...q(AP), id: 'sd.ap.q7', type: 'concept', difficulty: 'easy', stem: 'Where should an access token NOT be placed?', options: ['In the URL query string', ['In the `Authorization` header', 'The standard place.'], ['In an `HttpOnly` cookie', 'Reasonable for browser sessions.'], ['In a request body over HTTPS', 'Acceptable for token endpoints.']], answer: 0, explanation: 'URLs are logged by servers, proxies and browsers and leak through the Referer header.' }),
];

// ---------------------------------------------------------------------------------------
const AU = 'sd.auth';
const auth = sdTopic({
  id: AU, title: 'Authentication and Authorisation', level: 'core', estMinutes: 45, prerequisites: [], related: ['cn.sessions-auth', 'core.security-fundamentals', 'sd.api-design'],
  summary: 'Sessions vs JWT, OAuth2/OIDC overview and RBAC.',
  objectives: ['Distinguish authentication from authorisation and apply both at the right layer.', 'Compare sessions, JWTs and API keys, and design access plus refresh tokens.', 'Store passwords correctly and explain MFA and SSO at overview level.', 'Model permissions with RBAC and ABAC, and avoid broken object-level authorisation.'],
  sections: [
    { id: 'authn-authz', kind: 'concept', title: 'Authentication vs authorisation', bodyMd: `- **Authentication (authn):** *who are you?* Prove an identity with something you **know** (password), **have** (phone, hardware key) or **are** (biometrics). Combining factors is **MFA**.
- **Authorisation (authz):** *what are you allowed to do?* A decision about an already-identified principal: "may user 42 read invoice 9?".

Failures map to HTTP: **401** (not authenticated) and **403** (authenticated but forbidden).

Where to enforce: **authenticate at the edge** (API gateway or auth middleware) and **authorise close to the data** (in the service that owns the resource). Never rely on the client (hidden buttons) or on the gateway alone: every service must check permissions for the object it returns.` },
    { id: 'credentials', kind: 'comparison', title: 'Sessions, tokens and API keys', bodyMd: `| Mechanism | How | Pros | Cons |
|---|---|---|---|
| **Server-side session** | opaque id in an \`HttpOnly; Secure; SameSite\` cookie, state in Redis/DB | instant revocation, small cookie | needs a shared store; CSRF considerations |
| **JWT access token** | signed token with claims (\`sub\`, \`exp\`, \`roles\`), verified with a key | no lookup, good for APIs and microservices | hard to revoke before expiry; claims are readable; size |
| **API key** | long random secret per client/app | simple for server-to-server | long-lived, must be stored hashed, rotate and scope them |
| **mTLS / signed requests** | client certificate or request signature | strong service identity | key management overhead |

**Standard token design:** a **short-lived access token** (5–15 minutes) plus a **long-lived refresh token** kept server-side (revocable, **rotated on each use**, with reuse detection). On logout or compromise, revoke the refresh token; the access token dies soon anyway. For immediate revocation keep a small deny-list or use sessions.

**OAuth 2.0** delegates access ("let this app read my calendar") using the **authorization code flow with PKCE**; **OpenID Connect (OIDC)** adds an ID token so apps can log users in ("Sign in with Google"). **SSO** lets one identity provider (IdP) authenticate users for many apps (SAML or OIDC), centralising MFA and offboarding. Prefer a proven provider/library over writing your own.` },
    { id: 'passwords', kind: 'concept', title: 'Storing passwords', bodyMd: `Never store plain-text or reversible passwords, and never use a fast hash such as plain SHA-256 or MD5.

- Store a **salted, slow, memory-hard hash**: **Argon2id**, **bcrypt** or **scrypt**, with a per-user random **salt** and a tuned work factor (aim for roughly 100–500 ms per hash on your hardware). The salt defeats precomputed rainbow tables and hides equal passwords; the slowness limits brute-force guesses after a breach.
- Why speed is the enemy: an 8-character password drawn from 62 characters has 62⁸ ≈ **2.2 × 10¹⁴** combinations; at 10¹⁰ guesses/s (fast hash on GPUs) that falls in about **6 hours**, but a hash costing 100 ms makes each guess 10⁹ times more expensive.
- Add **rate limiting and lockouts/backoff** on login, **breached-password checks**, **MFA**, secure **reset flows** (single-use, short-lived tokens), and uniform error messages ("invalid credentials") to avoid account enumeration.
- Transport everything over **HTTPS**; set cookies \`Secure\`, \`HttpOnly\`, \`SameSite\`.` },
    { id: 'access-control', kind: 'concept', title: 'RBAC, ABAC and object-level checks', bodyMd: `- **RBAC (role-based):** permissions are attached to **roles** (\`admin\`, \`editor\`, \`viewer\`), users are assigned roles. Simple, auditable, the usual starting point. Grows into "role explosion" when rules need context.
- **ABAC (attribute-based):** decisions use attributes of the user, resource and context ("a manager can approve expenses under ₹50,000 for their own department during business hours"). More flexible, harder to reason about.
- **ACLs / relationship-based** (Google Drive style): per-object sharing lists ("Ann can edit this doc"); relationship-based systems (Zanzibar-style) scale this.
- **Principle of least privilege:** give the minimum permissions, scope tokens (OAuth **scopes**), and prefer deny-by-default.

**The most common real-world authz bug is BOLA/IDOR** (broken object-level authorisation): \`GET /invoices/9\` checks that you are logged in but not that invoice 9 is *yours*. Always verify ownership or permission for the specific object, ideally in the data-access layer (\`WHERE id = ? AND tenant_id = ?\`). Unguessable ids help but are not a control.

**Microservices:** propagate the caller's identity (a signed token or headers set by a trusted gateway), authorise at each service, and use **service identities** (mTLS, workload identity) for service-to-service calls.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Equating "logged in" with "allowed".
2. Hashing passwords with a fast hash or without a salt; rolling your own crypto.
3. Long-lived JWTs with no revocation story.
4. Putting secrets or sensitive data in a JWT payload.
5. Trusting client-supplied roles or user ids.
6. Forgetting object-level checks (IDOR) and tenant isolation.
7. Different error messages for "unknown user" and "wrong password".
8. Storing tokens in \`localStorage\` on a page vulnerable to XSS.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Authentication vs authorisation?', answerMd: 'Authentication establishes who the caller is (password, token, MFA); authorisation decides what that identity may do with a specific resource. A failed authentication is a 401; an authenticated user lacking permission gets a 403.' },
    { id: 'iq2', q: 'How do you store user passwords?', answerMd: 'Never in plain text. Hash each password with a slow, salted, memory-hard algorithm (Argon2id, bcrypt or scrypt), using a per-user salt and a tuned work factor, plus rate limiting, MFA and breach checks. The hash cannot be reversed and brute-forcing it is expensive.' },
    { id: 'iq3', q: 'Sessions vs JWT for a new web application?', answerMd: 'For a classic browser app, server-side sessions with a secure cookie are simpler and give instant revocation. For APIs and microservices, short-lived signed JWTs avoid a lookup per call; pair them with revocable refresh tokens. The choice depends on revocation needs, client types and architecture.' },
    { id: 'iq4', q: 'What is an IDOR/BOLA vulnerability and how do you prevent it?', answerMd: 'The API accepts an object id and returns or modifies it without checking that the caller may access that specific object (for example changing /orders/101 to /orders/102). Prevent it with authorisation checks on every object access, scoping queries by the caller\'s identity or tenant, and automated tests for cross-user access.' },
    { id: 'iq5', q: 'Explain OAuth 2.0 vs OpenID Connect.', answerMd: 'OAuth 2.0 lets an app obtain limited access tokens to a user\'s data at another service without seeing their password (authorisation delegation). OpenID Connect is a thin identity layer on OAuth that adds an ID token describing the authenticated user, so it is used for login/SSO.' },
  ],
  revision: { notesMd: `- Authn = who; authz = what allowed. 401 vs 403. Authenticate at the edge, authorise at the data.
- Session (revocable, store) vs JWT (stateless, hard to revoke) vs API key (hash, rotate, scope).
- Access token short (minutes) + refresh token revocable and rotated.
- Passwords: Argon2id/bcrypt/scrypt with per-user salt; rate limit; MFA; generic errors.
- RBAC (roles) vs ABAC (attributes); least privilege; always check object ownership (IDOR/BOLA).
- OAuth2 = delegated authz (code + PKCE); OIDC = login; SSO via an IdP.`, flashcards: [
    { id: 'f1', front: 'Which hash for passwords?', backMd: 'Argon2id (or bcrypt/scrypt) with a per-user salt, never fast hashes like MD5/SHA-256.' },
    { id: 'f2', front: 'What is BOLA/IDOR?', backMd: 'Accessing another user\'s object by changing its id because the API checks login but not ownership.' },
    { id: 'f3', front: 'Typical access token lifetime?', backMd: 'Minutes (5–15), with a revocable refresh token.' },
    { id: 'f4', front: 'RBAC in one line?', backMd: 'Permissions attach to roles; users are assigned roles.' },
    { id: 'f5', front: 'What does OIDC add to OAuth 2.0?', backMd: 'An ID token and standard login (authentication).' },
  ] },
  resources: [PRIMER, { title: 'OWASP Cheat Sheet: Password Storage', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', kind: 'article' }, { title: 'OWASP API Security Top 10', url: 'https://api-security.owasp.org/', kind: 'article' }, { title: 'OAuth 2.0 and OpenID Connect overview (oauth.net)', url: 'https://oauth.net/2/', kind: 'official-docs' }],
});

const auMcqs: MCQ[] = [
  mcq({ ...q(AU), id: 'sd.au.q1', type: 'concept', difficulty: 'easy', stem: 'A user is logged in but requests an admin page and is refused. Which status fits best?', options: ['403 Forbidden', ['401 Unauthorized', 'They are authenticated already.'], ['404 Not Found', 'Possible to hide existence, but 403 is the standard.'], ['200 OK', 'Access should be refused.']], answer: 0, explanation: 'Authenticated but not authorised.' }),
  mcq({ ...q(AU), id: 'sd.au.q2', type: 'concept', difficulty: 'medium', stem: 'Which is the best way to store user passwords?', options: ['A per-user salted hash with Argon2id or bcrypt', ['Encrypt them with AES so they can be recovered', 'Reversible storage is unnecessary risk.'], ['SHA-256 of the password without salt', 'Fast and vulnerable to rainbow tables.'], ['Base64 encode them', 'Not protection at all.']], answer: 0, explanation: 'Slow, salted hashing makes offline guessing expensive and equal passwords look different.' }),
  mcq({ ...q(AU), id: 'sd.au.q3', type: 'scenario', difficulty: 'medium', stem: '`GET /api/invoices/1042` returns the invoice to any logged-in user. A user changes the id to 1043 and sees someone else\'s invoice. What is this flaw?', options: ['Broken object-level authorisation (IDOR/BOLA)', ['SQL injection', 'No injection is involved.'], ['A CSRF attack', 'The user is making their own request.'], ['A weak password', 'Authentication is not the issue.']], answer: 0, explanation: 'Check that the invoice belongs to the caller (or tenant) on every access.' }),
  mcq({ ...q(AU), id: 'sd.au.q4', type: 'concept', difficulty: 'medium', stem: 'Why are access tokens kept short-lived and paired with a refresh token?', options: ['A leaked access token is useful only briefly, while the refresh token can be revoked and rotated server-side', ['Short tokens are faster to verify', 'Not the reason.'], ['Refresh tokens never expire', 'They should be revocable and ideally rotate.'], ['It removes the need for HTTPS', 'HTTPS is still required.']], answer: 0, explanation: 'This limits damage from token theft without hitting a database on every API call.' }),
  mcq({ ...q(AU), id: 'sd.au.q5', type: 'concept', difficulty: 'easy', stem: 'A login endpoint answers "no such user" for unknown emails and "wrong password" for known ones. What is the risk?', options: ['Attackers can enumerate which accounts exist', ['Passwords are stored in plain text', 'Not implied.'], ['Sessions become shared', 'Unrelated.'], ['Tokens never expire', 'Unrelated.']], answer: 0, explanation: 'Use a generic "invalid credentials" message and rate limit attempts.' }),
  mcq({ ...q(AU), id: 'sd.au.q6', type: 'complexity', difficulty: 'medium', stem: 'An 8-character password from 62 possible characters has about how many combinations?', options: ['2.2 × 10¹⁴', ['6.2 × 10¹', 'That is 62 × 1.'], ['4.8 × 10⁵', 'That is 62³.'], ['8 × 10⁶²', 'The exponent and base are swapped.']], answer: 0, explanation: '62⁸ ≈ 218 trillion; a slow salted hash is what makes searching that space expensive.' }),
  mcq({ ...q(AU), id: 'sd.au.q7', type: 'concept', difficulty: 'medium', stem: 'Which statement about OAuth 2.0 and OpenID Connect is correct?', options: ['OAuth 2.0 delegates access; OpenID Connect adds an ID token to authenticate the user', ['OAuth 2.0 is for login; OIDC is for API access', 'Reversed.'], ['They are the same specification', 'OIDC builds on OAuth.'], ['OIDC requires the app to see the user\'s password', 'The point is that it does not.']], answer: 0, explanation: 'Use OIDC for "Sign in with…", OAuth scopes for API access.' }),
];

// ---------------------------------------------------------------------------------------
const OB = 'sd.observability';
const obs = sdTopic({
  id: OB, title: 'Observability', level: 'core', estMinutes: 45, prerequisites: [], related: ['devops.observability', 'sd.latency-throughput-availability', 'sd.case-logging', 'sd.fault-tolerance'],
  summary: 'Logs, metrics, traces and alerting.',
  objectives: ['Explain the three pillars (logs, metrics, traces) and what each answers.', 'Pick metrics with the RED and USE methods and the four golden signals.', 'Design alerts on user-visible symptoms using SLOs and burn rates.', 'Control cardinality, sampling and cost, and propagate correlation ids.'],
  sections: [
    { id: 'pillars', kind: 'comparison', title: 'Logs, metrics and traces', bodyMd: `**Monitoring** tells you *that* something is wrong against known failure modes; **observability** lets you ask new questions about *why* from the data the system emits.

| Pillar | What it is | Answers | Cost / caveat |
|---|---|---|---|
| **Logs** | timestamped event records (ideally **structured JSON** with fields) | "what exactly happened for this request/user?" | high volume and cost; search/retention needed |
| **Metrics** | numeric time series (counters, gauges, histograms) | "how is the system behaving? is it getting worse?" | cheap, aggregated, fast to alert on; lose per-request detail |
| **Traces** | the path of one request across services as **spans** with timing and parent links | "where did the time go? which hop failed?" | needs instrumentation and propagation; usually **sampled** |

How they work together: an **alert on a metric** (error rate up) → open a **dashboard** to find the affected service → follow a **trace** to the slow or failing hop → read the **logs** of that span for the cause.

**Correlation:** generate a **request/trace id** at the edge, pass it in headers (\`traceparent\` in W3C Trace Context) to every downstream call, and include it in every log line. Without it, you cannot join signals across services.` },
    { id: 'what-to-measure', kind: 'concept', title: 'What to measure', bodyMd: `- **Four golden signals (Google SRE):** **latency** (success vs error latency separately), **traffic**, **errors**, **saturation**.
- **RED method** (request-driven services): **R**ate, **E**rrors, **D**uration, per endpoint.
- **USE method** (resources: CPU, memory, disk, network, queues, connection pools): **U**tilisation, **S**aturation, **E**rrors.
- Metric types: **counter** (only goes up: requests, errors; use \`rate()\`), **gauge** (up/down: queue depth, memory), **histogram** (latency buckets → percentiles). Compute percentiles from histograms, never average percentiles across instances.
- **Business metrics** (orders per minute, signups, payment success) often detect problems first.

**Cardinality:** each distinct label combination is a separate time series. Labels like \`endpoint\` and \`status\` are fine (hundreds of series); labels like \`user_id\` or \`request_id\` create millions and can crash the metrics system. High-cardinality detail belongs in logs and traces.

**Logging hygiene:** structured fields, log levels (DEBUG/INFO/WARN/ERROR), no secrets or personal data, one line per event (not multi-line stack dumps scattered), sampling for noisy paths.` },
    { id: 'alerting', kind: 'concept', title: 'Alerting that people can live with', bodyMd: `Alert on **symptoms users feel** (error rate, latency SLO burn), not on every cause (CPU 80%). Causes go on dashboards and in runbooks.

- Every alert must be **actionable, urgent and tied to a runbook**; otherwise it is noise and creates **alert fatigue**.
- **SLO-based alerting with burn rate:** burn rate = (observed error rate) ÷ (error budget rate = 1 − SLO). For a 99.9% SLO, a 1% error rate burns budget at **10×**, so a 30-day budget would be gone in 720 h ÷ 10 = **72 hours**; a 14.4× burn exhausts about 2% of the monthly budget per hour and should page. Use **multi-window** alerts (fast burn pages, slow burn tickets).
- **Page** for imminent user impact; **ticket** for the rest. Add severity, owner, and links to dashboard and runbook.
- Detect the silent failure too: alert when a metric **stops arriving** (dead-man's switch / heartbeat), and probe from outside (synthetic checks) because the monitoring itself can fail.
- Run **blameless post-mortems** and fix the detection gap after each incident.` },
    { id: 'stack', kind: 'example', title: 'A typical stack', bodyMd: `| Need | Common tools |
|---|---|
| Metrics | Prometheus + Grafana, CloudWatch, Datadog |
| Logs | Elasticsearch/OpenSearch (ELK), Loki, CloudWatch Logs, Splunk |
| Traces | OpenTelemetry (instrumentation standard) → Jaeger, Tempo, Datadog APM |
| Alerts / on-call | Alertmanager, PagerDuty, Opsgenie |

**OpenTelemetry** is the vendor-neutral standard for emitting all three signals. **Sampling** keeps trace cost sane: *head-based* (decide at the start, e.g. 1%) is cheap but may miss rare errors, *tail-based* (decide after seeing the whole trace, keep slow/error ones) is smarter but needs buffering.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Alerting on causes (CPU) instead of user-visible symptoms.
2. Averaging latency or averaging percentiles.
3. Putting user ids in metric labels (cardinality explosion).
4. Logging unstructured text, secrets or personal data.
5. No correlation id, so one failed request can't be followed across services.
6. Alerts without owners or runbooks.
7. Only monitoring from the inside (the monitoring and the service share one failure domain).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Logs vs metrics vs traces?', answerMd: 'Metrics are cheap aggregated numbers over time, ideal for dashboards and alerts (is it broken?). Traces follow one request across services with timing (where is it slow or failing?). Logs are detailed event records (what exactly happened?). You alert on metrics, localise with traces and explain with logs, tied together by a correlation id.' },
    { id: 'iq2', q: 'What would you monitor for a web service?', answerMd: 'The golden signals per endpoint: request rate, error rate, latency percentiles, and saturation (CPU, memory, connection pools, queue depth), plus dependency health (database, cache) and business metrics such as successful checkouts. Alert on SLO burn, not on raw CPU.' },
    { id: 'iq3', q: 'How do you debug a slow request that crosses five services?', answerMd: 'Use the distributed trace for that request id to see which span dominates the time, then check that service\'s metrics (saturation, errors) and logs filtered by the trace id. Compare with a healthy trace to spot the difference.' },
    { id: 'iq4', q: 'What is metric cardinality and why does it matter?', answerMd: 'The number of distinct label combinations, each a separate time series. Labels with unbounded values (user ids, request ids, URLs with ids) multiply series into millions, overloading the metrics store and cost. Keep labels bounded and put high-cardinality detail in logs or traces.' },
    { id: 'iq5', q: 'How do you reduce alert fatigue?', answerMd: 'Alert only on actionable, user-impacting symptoms using SLO burn rates, attach runbooks and owners, route low-urgency issues to tickets, delete or tune noisy alerts, and review each incident for detection gaps.' },
  ],
  revision: { notesMd: `- Logs (events), metrics (numbers over time), traces (request path). Correlate with a trace/request id (W3C traceparent).
- Golden signals: latency, traffic, errors, saturation. RED for services; USE for resources.
- Histograms for percentiles; never average percentiles. Watch label cardinality.
- Alert on symptoms/SLO burn: burn rate = error rate ÷ (1 − SLO); 99.9% SLO at 1% errors = 10× → budget gone in 72 h.
- Actionable alerts + runbooks; synthetic probes; dead-man's switch.`, flashcards: [
    { id: 'f1', front: 'The four golden signals?', backMd: 'Latency, traffic, errors, saturation.' },
    { id: 'f2', front: 'RED vs USE?', backMd: 'RED (rate, errors, duration) for services; USE (utilisation, saturation, errors) for resources.' },
    { id: 'f3', front: 'Why not use user_id as a metric label?', backMd: 'Cardinality explosion: one series per user.' },
    { id: 'f4', front: 'Burn rate for a 99.9% SLO with a 1% error rate?', backMd: '10× (the monthly budget would last about 72 hours).' },
    { id: 'f5', front: 'How to follow one request across services?', backMd: 'A propagated trace/correlation id in headers and logs.' },
  ] },
  resources: [{ title: 'Google SRE Book: Monitoring Distributed Systems', url: 'https://sre.google/sre-book/monitoring-distributed-systems/', kind: 'book' }, { title: 'OpenTelemetry: Observability primer', url: 'https://opentelemetry.io/docs/concepts/observability-primer/', kind: 'official-docs' }, { title: 'W3C Trace Context', url: 'https://www.w3.org/TR/trace-context/', kind: 'official-docs' }],
});

const obMcqs: MCQ[] = [
  mcq({ ...q(OB), id: 'sd.ob.q1', type: 'concept', difficulty: 'easy', stem: 'Which telemetry type is best for finding which service in a call chain is adding latency?', options: ['Distributed traces', ['Metrics only', 'They show aggregate behaviour but not the path of one request.'], ['CPU graphs', 'They cannot attribute latency across calls.'], ['Static documentation', 'It shows no runtime data.']], answer: 0, explanation: 'A trace shows each span\'s timing for a single request.' }),
  mcq({ ...q(OB), id: 'sd.ob.q2', type: 'concept', difficulty: 'medium', stem: 'Why is `user_id` a poor label on a Prometheus-style metric?', options: ['It creates one time series per user, exploding cardinality and cost', ['Labels must be numeric', 'Labels are strings.'], ['It leaks passwords', 'The problem is volume, not secrecy.'], ['Counters cannot have labels', 'They can.']], answer: 0, explanation: 'Keep labels bounded; put high-cardinality detail in logs or traces.' }),
  mcq({ ...q(OB), id: 'sd.ob.q3', type: 'complexity', difficulty: 'hard', stem: 'A service has a 99.9% availability SLO. Its error rate rises to 1%. What is the burn rate, and about how long until a 30-day budget is exhausted at that rate?', options: ['10× burn; about 72 hours', ['1× burn; 30 days', '1% is ten times the 0.1% allowed.'], ['100× burn; 7.2 hours', 'Off by a factor of ten.'], ['10× burn; 30 hours', '720 hours ÷ 10 is 72 hours.']], answer: 0, explanation: 'Burn rate = 1% ÷ 0.1% = 10. A 720-hour window lasts 72 hours at that burn.' }),
  mcq({ ...q(OB), id: 'sd.ob.q4', type: 'concept', difficulty: 'medium', stem: 'Which is the better paging alert for an API?', options: ['Fast SLO burn: the success rate is far below target and rising', ['CPU above 80% on one host', 'A cause that may not hurt users.'], ['Disk usage above 50%', 'Not urgent or necessarily user-visible.'], ['A deployment started', 'Informational, not an alert.']], answer: 0, explanation: 'Alert on symptoms users feel; causes belong on dashboards.' }),
  mcq({ ...q(OB), id: 'sd.ob.q5', type: 'concept', difficulty: 'medium', stem: 'You have p99 latency from 10 instances. How do you get the fleet-wide p99?', options: ['Merge the instances\' latency histograms and compute the percentile', ['Average the ten p99 values', 'Averaging percentiles is mathematically wrong.'], ['Take the smallest p99', 'Hides the slow instance.'], ['Add the ten values', 'Meaningless.']], answer: 0, explanation: 'Percentiles don\'t aggregate; histograms do.' }),
  mcq({ ...q(OB), id: 'sd.ob.q6', type: 'concept', difficulty: 'easy', stem: 'What is the purpose of propagating a trace or correlation id through services?', options: ['To join logs and spans from different services into one request story', ['To encrypt traffic', 'Unrelated.'], ['To speed up the database', 'Unrelated.'], ['To authenticate users', 'Not its purpose.']], answer: 0, explanation: 'Pass it in headers (for example `traceparent`) and include it in every log line.' }),
  mcq({ ...q(OB), id: 'sd.ob.q7', type: 'concept', difficulty: 'medium', stem: 'Your monitoring is hosted in the same cluster as the service, and the cluster loses its network. What did you miss?', options: ['Independent external checks (synthetic probes) and a heartbeat/dead-man\'s-switch alert', ['More log lines', 'Logs inside the failed cluster would not arrive either.'], ['Higher metric cardinality', 'Unrelated.'], ['A faster dashboard', 'Does not help detection.']], answer: 0, explanation: 'Monitoring must not share the failure domain it observes.' }),
];

// ---------------------------------------------------------------------------------------
const FT = 'sd.fault-tolerance';
const fault = sdTopic({
  id: FT, title: 'Fault Tolerance', level: 'advanced', estMinutes: 50, prerequisites: [], related: ['sd.latency-throughput-availability', 'sd.messaging', 'sd.observability', 'sd.load-balancing'],
  summary: 'Retries, timeouts, circuit breakers and graceful degradation.',
  objectives: ['Set timeouts and deadlines, and retry safely with backoff, jitter and budgets.', 'Explain retry storms and cascading failures, with the arithmetic of retry amplification.', 'Describe circuit breakers, bulkheads, load shedding and graceful degradation.', 'Plan failover, health checks and recovery, and test them (chaos engineering).'],
  sections: [
    { id: 'failure', kind: 'concept', title: 'Failures are normal', bodyMd: `At scale something is always failing: a disk, a node, a network link, a deploy, a dependency having a bad minute. Design so a **partial failure** stays partial.

The dangerous failures are not crashes but **slow** dependencies: a call that hangs ties up threads and connections in the caller, the caller becomes slow, its callers pile up, and the failure **cascades** upward.

Core defences, in the order requests meet them:
1. **Timeouts** on every network call (connect and read), shorter than the caller's own deadline. No timeout = unbounded resource use.
2. **Retries** for transient errors, safely.
3. **Circuit breakers** to stop calling a failing dependency.
4. **Bulkheads** to isolate resources.
5. **Load shedding** and **graceful degradation** to protect the core.
6. **Redundancy and failover** for the infrastructure itself.` },
    { id: 'retries', kind: 'concept', title: 'Timeouts and retries done right', bodyMd: `- Pass a **deadline** down the call chain; each hop gets the remaining time, and gives up when it is gone.
- **Retry only idempotent operations** (or ones with idempotency keys) and only on retryable errors (timeouts, 503, connection reset), not on 4xx client errors.
- **Exponential backoff with jitter:** wait ~base × 2ⁿ (for example 100 ms, 200 ms, 400 ms, 800 ms) with **random jitter** so thousands of clients don't retry in lockstep (the "thundering herd").
- **Cap attempts** (2–3) and use a **retry budget** (for example retries may add at most 10% extra load).
- **Retry at one layer only.** If each of 3 layers makes up to 3 attempts, one user request can become 3 × 3 × 3 = **27 calls** to the bottom service exactly when it is struggling: a **retry storm** that turns a blip into an outage.
- **Hedged requests** (send a second request after the p95 latency and take the first reply) cut tail latency for idempotent reads at modest extra load.` },
    { id: 'breakers', kind: 'concept', title: 'Circuit breakers, bulkheads and shedding', bodyMd: `**Circuit breaker:** wrap calls to a dependency in a small state machine.
- **Closed:** calls flow; failures are counted.
- **Open:** after the failure rate crosses a threshold (for example 50% of 20 calls), calls **fail immediately** (or use a fallback) for a cool-down period. This protects the dependency from extra load and the caller from wasting threads.
- **Half-open:** after the cool-down, let a few trial calls through; success closes the circuit, failure reopens it.

**Bulkhead:** separate thread/connection pools (or instances) per dependency or per customer tier, so a slow payment provider cannot exhaust the threads needed by the product catalogue (like watertight compartments in a ship).

**Load shedding:** when overloaded, reject excess or low-priority requests early with 503/429 rather than queueing everything and timing out for everyone. Keep queues short; a long queue only adds latency to requests that will time out anyway.

**Graceful degradation:** serve a reduced but useful experience: cached or stale data, default recommendations, disable non-essential features (reviews, personalisation) while checkout keeps working. Decide in advance which features are **critical** and which are not.` },
    { id: 'recovery', kind: 'concept', title: 'Redundancy, failover and testing', bodyMd: `- **Redundancy at every tier** across failure domains: instances across **availability zones**, database primary + replicas with automatic failover, multi-region when the availability target demands it.
- **Health checks** (liveness: should it be restarted? readiness: should it receive traffic?) feed load balancers and orchestrators. Keep checks cheap and avoid making them depend on shared downstream services, or one dependency's blip removes the entire fleet.
- **Failover modes:** active-passive (standby takes over; simple, standby may be cold) and active-active (all serve; better utilisation, harder data consistency). Beware **split brain** (two nodes both think they are primary): use quorum/fencing.
- **Backups and disaster recovery:** define **RPO** (how much data you can lose) and **RTO** (how long you can be down); *a backup you have never restored is not a backup*.
- **Safe deploys:** canary or rolling releases, feature flags, quick rollback.
- **Chaos engineering:** deliberately kill instances, add latency, or fail a dependency in a controlled way (Netflix Chaos Monkey) to prove the defences work before a real incident does.

**New-grad vs senior:** a new grad should name timeouts, retries with backoff, idempotency, redundancy and a circuit breaker. A senior is expected to reason about cascading failure modes, retry budgets, overload control, multi-region failover and RPO/RTO trade-offs.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Calls with no timeout (or a timeout longer than the caller's own).
2. Retrying everything immediately, at every layer.
3. Retrying non-idempotent operations without idempotency keys.
4. Health checks that depend on the database, so a database blip empties the fleet.
5. Treating redundancy as free: both replicas share a failure domain or a bad deploy.
6. Never testing failover or restore.
7. Queueing without bounds during overload instead of shedding.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How should a client retry a failed call?', answerMd: 'Only when the operation is idempotent (or protected by an idempotency key) and the error is transient (timeout, 503, connection reset). Use a small number of attempts, exponential backoff with jitter, a retry budget and the caller\'s deadline, and retry at only one layer of the stack.' },
    { id: 'iq2', q: 'What is a circuit breaker?', answerMd: 'A wrapper that tracks failures of calls to a dependency. When failures pass a threshold it opens and fails fast (or returns a fallback) for a cool-down, then goes half-open to test with a few trial calls before closing again. It prevents wasted threads and stops hammering a struggling dependency, helping it recover.' },
    { id: 'iq3', q: 'What is a cascading failure and how do you prevent it?', answerMd: 'A failure that spreads because slow or failing components cause callers to exhaust threads, queues and retries, which makes them fail too. Prevent it with timeouts, circuit breakers, bulkheads, bounded queues, load shedding, backoff with jitter and capacity headroom.' },
    { id: 'iq4', q: 'Explain RPO and RTO.', answerMd: 'Recovery Point Objective is the maximum acceptable data loss measured in time (for example, 5 minutes of writes); it determines backup or replication frequency. Recovery Time Objective is the maximum acceptable downtime; it determines failover automation and standby readiness.' },
    { id: 'iq5', q: 'What is graceful degradation? Give an example.', answerMd: 'Continuing to provide the core function with reduced features when a part fails. For example, an e-commerce site shows cached recommendations or hides reviews when those services are down, while browsing and checkout continue to work.' },
  ],
  revision: { notesMd: `- Timeouts everywhere; propagate deadlines. Retry only idempotent + transient; backoff + jitter; cap attempts; retry budget; retry at one layer.
- Retry amplification: 3 layers × 3 attempts = 27× load on the bottom service.
- Circuit breaker: closed → open (fail fast) → half-open (trial) → closed.
- Bulkheads isolate pools; shed load early; degrade gracefully (cached/default data).
- Redundancy across AZs/regions; readiness vs liveness checks; avoid split brain (quorum/fencing); RPO/RTO; test restores and failover (chaos).`, flashcards: [
    { id: 'f1', front: 'Why jitter in backoff?', backMd: 'To stop many clients retrying at the same moment (thundering herd).' },
    { id: 'f2', front: 'Circuit breaker states?', backMd: 'Closed, open, half-open.' },
    { id: 'f3', front: 'Retry amplification with 3 layers of 3 attempts?', backMd: '3 × 3 × 3 = 27 calls to the bottom service.' },
    { id: 'f4', front: 'RPO vs RTO?', backMd: 'RPO: acceptable data loss (time). RTO: acceptable downtime.' },
    { id: 'f5', front: 'What does a bulkhead do?', backMd: 'Isolates resource pools so one failing dependency cannot exhaust everything.' },
    { id: 'f6', front: 'Liveness vs readiness?', backMd: 'Liveness: restart it? Readiness: send it traffic?' },
  ] },
  resources: [{ title: 'AWS Builders\' Library: Timeouts, retries and backoff with jitter', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/', kind: 'article' }, { title: 'Google SRE Book: Addressing Cascading Failures', url: 'https://sre.google/sre-book/addressing-cascading-failures/', kind: 'book' }, { title: 'Martin Fowler: Circuit Breaker', url: 'https://martinfowler.com/bliki/CircuitBreaker.html', kind: 'article' }],
});

const ftMcqs: MCQ[] = [
  mcq({ ...q(FT), id: 'sd.ft.q1', type: 'concept', difficulty: 'easy', stem: 'Why must every outbound network call have a timeout?', options: ['A hanging call would hold threads and connections indefinitely and can cascade into an outage', ['It makes responses faster', 'It only bounds the worst case.'], ['It encrypts the connection', 'Unrelated.'], ['It is only needed for databases', 'Applies to every network dependency.']], answer: 0, explanation: 'Unbounded waits turn a slow dependency into a resource exhaustion problem for the caller.' }),
  mcq({ ...q(FT), id: 'sd.ft.q2', type: 'complexity', difficulty: 'medium', stem: 'An API gateway, a service and a data layer each retry a failed call up to 3 times (3 attempts in total per layer). How many calls can a single user request cause at the data layer when it keeps failing?', options: ['27', ['9', 'That is two layers.'], ['3', 'That ignores the multiplication across layers.'], ['81', 'That would be four layers.']], answer: 0, explanation: '3 × 3 × 3 = 27: retries multiply across layers, which creates a retry storm.' }),
  mcq({ ...q(FT), id: 'sd.ft.q3', type: 'concept', difficulty: 'medium', stem: 'Thousands of clients lose a connection at once and all retry after exactly 1 second, then 2 seconds, then 4 seconds. What is missing?', options: ['Random jitter, to spread out the retries', ['A longer password', 'Unrelated.'], ['More retries', 'Worsens the load spikes.'], ['A bigger payload', 'Unrelated.']], answer: 0, explanation: 'Synchronised retries recreate the spike each round; jitter desynchronises them.' }),
  mcq({ ...q(FT), id: 'sd.ft.q4', type: 'concept', difficulty: 'medium', stem: 'A circuit breaker is open. What happens to new calls?', options: ['They fail immediately (or use a fallback) without calling the dependency, until a cool-down ends', ['They are queued indefinitely', 'That defeats the purpose.'], ['They are retried 10 times', 'It stops calls.'], ['They are sent to the dependency anyway', 'That is the closed state.']], answer: 0, explanation: 'Failing fast protects both caller and dependency; half-open then tests recovery.' }),
  mcq({ ...q(FT), id: 'sd.ft.q5', type: 'scenario', difficulty: 'medium', stem: 'The recommendation service is down. Which behaviour shows graceful degradation?', options: ['Show popular items from a cache and keep checkout working', ['Return HTTP 500 for the whole product page', 'A full failure for a non-critical dependency.'], ['Retry recommendations forever before rendering', 'Slows the page.'], ['Disable checkout too', 'Spreads the failure.']], answer: 0, explanation: 'Protect critical paths and degrade non-essential features.' }),
  mcq({ ...q(FT), id: 'sd.ft.q6', type: 'concept', difficulty: 'hard', stem: 'Under heavy overload, a service queues every incoming request, and nearly all of them time out on the client side. What is the better strategy?', options: ['Shed excess load early (reject with 503/429) and keep queues short', ['Make the queue larger', 'Increases latency; requests still time out.'], ['Disable timeouts on clients', 'Makes failures slower and wider.'], ['Retry more aggressively', 'Adds load.']], answer: 0, explanation: 'Serve what you can on time and fail the rest fast.' }),
  mcq({ ...q(FT), id: 'sd.ft.q7', type: 'concept', difficulty: 'medium', stem: 'What does RPO (recovery point objective) specify?', options: ['The maximum acceptable amount of data loss, measured in time', ['The maximum acceptable downtime', 'That is RTO.'], ['The number of replicas', 'Not defined by RPO.'], ['The size of a backup', 'Unrelated.']], answer: 0, explanation: 'An RPO of 5 minutes means you must be able to recover to a state no older than 5 minutes.' }),
];

// ---------------------------------------------------------------------------------------
const DF = 'sd.distributed-fundamentals';
const distributed = sdTopic({
  id: DF, title: 'Distributed Systems Fundamentals', level: 'advanced', estMinutes: 55, prerequisites: [], related: ['sd.consistency-cap', 'sd.replication-sharding', 'sd.fault-tolerance', 'dbms.distributed-transactions'],
  summary: 'Clocks, leader election and consensus intuition.',
  objectives: ['Explain why distributed systems are hard: partial failure, unreliable networks, no shared clock.', 'Order events with Lamport clocks and recognise what vector clocks add.', 'Describe leader election, quorum (majority) logic and why 2f+1 nodes tolerate f failures.', 'Explain split brain and fencing tokens, and the intuition behind Raft-style consensus.'],
  sections: [
    { id: 'hard', kind: 'concept', title: 'Why distribution is hard', bodyMd: `On one machine, a function call either returns or the process dies. Across machines:
- **Partial failure:** some nodes fail while others carry on, and you often can't tell which.
- **Unreliable networks:** messages can be **lost, delayed, duplicated or reordered**. A timeout means "no answer yet", *not* "it failed": the request may have been executed (the **Two Generals** problem shows certainty about delivery is impossible).
- **No shared clock and no shared memory:** each machine has its own clock, drifting by milliseconds (or more); you cannot order events across machines by comparing timestamps.
- **Concurrency and nondeterminism** everywhere, so bugs are rare and hard to reproduce.

Failure detection is only a guess: a node that stops answering heartbeats **may be dead, slow or partitioned**. Long timeouts react slowly; short ones cause false alarms.

Design consequences: make operations **idempotent**, replicate with a clear consistency model, and treat every remote call as something that can fail in ambiguous ways.` },
    { id: 'clocks', kind: 'concept', title: 'Time and ordering', bodyMd: `**Physical clocks** (synchronised with NTP) typically differ by milliseconds, can jump backwards, and must not be used to decide "which write happened last" across nodes (last-write-wins with clock skew silently loses data). Google's Spanner uses GPS/atomic clocks with an explicit uncertainty bound (TrueTime) to get global ordering.

**Logical clocks** capture **causality** ("happened-before") without physical time.

**Lamport clock:** each node keeps a counter \`C\`.
- Before each local event or send: \`C = C + 1\`; attach \`C\` to messages.
- On receiving a message with timestamp \`t\`: \`C = max(C, t) + 1\`.
If event *a* causally precedes *b*, then C(a) < C(b). The converse is false: C(a) < C(b) doesn't prove causality (the events may be concurrent).

**Example:** node A has C=4 and sends a message stamped 5; node B has C=2 and receives it, so B's clock becomes max(2, 5) + 1 = **6**.

**Vector clocks** keep one counter per node, so you can tell whether two events are **causally ordered or concurrent** (needed to detect conflicting writes; used in Dynamo-style stores, then resolved by merge rules or CRDTs). Many systems instead use a single **leader** to impose order, or a replicated **log** where position defines order.` },
    { id: 'election', kind: 'concept', title: 'Leader election, quorums and split brain', bodyMd: `A **leader** simplifies coordination (one node orders writes, runs the scheduler, holds the lock). Failures require **electing** a new one automatically, and the main risk is **split brain**: a network partition leaves two nodes each believing it is the leader and accepting writes.

The fix is **majority quorums**. With \`n\` nodes, a quorum is \`⌊n/2⌋ + 1\`. Any two majorities **overlap in at least one node**, so two conflicting decisions can't both gain a majority. Hence a cluster of \`2f + 1\` nodes tolerates \`f\` failures:

| Nodes | Majority | Failures tolerated |
|---|---|---|
| 3 | 2 | 1 |
| 5 | 3 | 2 |
| 7 | 4 | 3 |

(That's why clusters have an **odd** number of nodes: 4 nodes still tolerate only 1 failure, same as 3.) The minority side of a partition **stops accepting writes**, which is CAP's choice of consistency over availability.

**Fencing tokens:** a paused leader (a long GC pause) may wake up and still believe it holds the lock. Each lock grant carries a **monotonically increasing token**; the storage layer rejects writes with an older token, so a stale leader can't corrupt data. Leases with expiry alone are not safe without this.

**Tools:** use ZooKeeper, etcd or Consul for leader election, locks and configuration instead of inventing it; avoid building your own consensus.` },
    { id: 'consensus', kind: 'concept', title: 'Consensus (Raft intuition)', bodyMd: `**Consensus** lets a group of nodes agree on a value (or a sequence of values, i.e. a **replicated log**) even if some nodes crash. It underpins etcd, ZooKeeper (Zab), Consul, and the metadata layers of many databases. **Paxos** is the classic; **Raft** is designed to be understandable.

Raft in four ideas:
1. **Terms and leader election:** time is divided into numbered terms. A follower that hears no heartbeat from the leader (after a **randomised election timeout**) becomes a candidate, increments the term and requests votes; a **majority** wins. Randomised timeouts avoid repeated ties.
2. **Log replication:** clients send commands to the leader, which appends them to its log and replicates them to followers.
3. **Commit on majority:** an entry is **committed** once stored on a majority; only then is it applied to the state machine and acknowledged.
4. **Safety:** a candidate can win only if its log is at least as up-to-date as a majority's, so committed entries are never lost, even across leader changes.

The cost: every write needs a **majority round trip**, so consensus is for small, critical state (cluster metadata, locks, configuration), not for bulk data. FLP impossibility says consensus can't be guaranteed to terminate in a purely asynchronous network with even one failure; practical systems use timeouts and accept that liveness (not safety) can be lost during partitions.

Other building blocks: **gossip protocols** (spread membership and state epidemically, eventually consistent), **heartbeats and failure detectors**, **two-phase commit** (atomic commit across databases: blocks if the coordinator dies) versus **sagas** (a sequence of local transactions with compensating actions, used across microservices).` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Using wall-clock timestamps from different machines to order writes ("last write wins").
2. Treating a timeout as proof that an operation failed.
3. Even-sized clusters, or two-node clusters expecting fault tolerance.
4. Leader locks without fencing tokens.
5. Writing your own consensus or leader election.
6. Saying "exactly-once delivery" without idempotency.
7. Using 2PC across services and then being surprised by blocking.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Why can\'t you rely on timestamps from different servers to order events?', answerMd: 'Clocks drift and are only loosely synchronised (NTP error is milliseconds, and clocks can step backwards), so two events close in time may be ordered wrongly, silently losing updates under last-write-wins. Use logical clocks, a single leader or a replicated log for ordering, or hardware clocks with bounded uncertainty.' },
    { id: 'iq2', q: 'How many nodes do you need to tolerate 2 failures with a majority quorum?', answerMd: 'Five (2f + 1 with f = 2). A majority of 5 is 3, so the cluster keeps working with 2 nodes down. Odd sizes are preferred because an even size adds a node without increasing the number of tolerated failures.' },
    { id: 'iq3', q: 'What is split brain and how is it prevented?', answerMd: 'After a network partition, two nodes both act as leader and accept conflicting writes. Prevent it with majority quorums (only the side holding a majority can elect a leader or commit) and fencing tokens so a stale leader\'s writes are rejected.' },
    { id: 'iq4', q: 'Explain Raft at a high level.', answerMd: 'Nodes elect a leader for a term using randomised timeouts and majority votes. The leader appends client commands to its log and replicates them; an entry is committed when a majority has stored it, then applied and acknowledged. Election rules ensure a new leader has all committed entries, so committed data survives failures.' },
    { id: 'iq5', q: 'How does a Lamport clock work?', answerMd: 'Each node increments its counter on every event and send, stamps outgoing messages with it, and on receiving sets its counter to max(local, received) + 1. If one event causally precedes another its timestamp is smaller, but a smaller timestamp does not prove causality; vector clocks are needed to detect concurrency.' },
  ],
  revision: { notesMd: `- Hard because: partial failure, unreliable network (timeout ≠ failure), no shared clock.
- Physical clocks skew; use logical clocks. Lamport: tick on event/send; receive → max(local, t) + 1. Vector clocks detect concurrency.
- Majority = ⌊n/2⌋ + 1; 2f + 1 nodes tolerate f failures (3→1, 5→2, 7→3); odd sizes.
- Split brain → quorums + fencing tokens. Don't write your own consensus (use etcd/ZooKeeper).
- Raft: terms, randomised election timeout, log replication, commit on majority, safe elections. 2PC blocks; sagas compensate.`, flashcards: [
    { id: 'f1', front: 'Majority quorum size for 5 nodes?', backMd: '3 (tolerates 2 failures).' },
    { id: 'f2', front: 'Lamport receive rule?', backMd: 'C = max(local, received) + 1.' },
    { id: 'f3', front: 'Why odd cluster sizes?', backMd: 'An extra even node adds no failure tolerance (4 nodes still tolerate 1).' },
    { id: 'f4', front: 'What is a fencing token?', backMd: 'A monotonically increasing number with each lock grant; storage rejects older tokens from stale leaders.' },
    { id: 'f5', front: 'What does a timeout tell you?', backMd: 'Only that no answer arrived in time; the operation may or may not have run.' },
    { id: 'f6', front: 'Which systems are built on consensus?', backMd: 'etcd, ZooKeeper, Consul (and the metadata layers of many databases).' },
  ] },
  resources: [{ title: 'The Raft consensus algorithm (visualisation and paper)', url: 'https://raft.github.io/', kind: 'article' }, { title: 'Martin Kleppmann: Designing Data-Intensive Applications', url: 'https://dataintensive.net/', kind: 'book' }, { title: 'Lamport: Time, Clocks, and the Ordering of Events (1978)', url: 'https://lamport.azurewebsites.net/pubs/time-clocks.pdf', kind: 'article' }],
});

const dfMcqs: MCQ[] = [
  mcq({ ...q(DF), id: 'sd.df.q1', type: 'complexity', difficulty: 'easy', stem: 'A consensus cluster has 5 nodes using majority quorums. How many node failures can it tolerate while still making progress?', options: ['2', ['1', 'A majority of 5 is 3, so 2 failures are tolerated.'], ['3', 'Then only 2 nodes remain, below the majority of 3.'], ['4', 'One node cannot form a majority.']], answer: 0, explanation: '2f + 1 = 5 gives f = 2.' }),
  mcq({ ...q(DF), id: 'sd.df.q2', type: 'concept', difficulty: 'medium', stem: 'Why is a 4-node cluster no better than a 3-node cluster at tolerating failures with majority quorums?', options: ['The majority of 4 is 3, so it still tolerates only 1 failure', ['A 4-node cluster tolerates 2 failures', 'With 2 down, only 2 of 4 remain: no majority.'], ['Even clusters cannot elect leaders', 'They can; they just add no tolerance.'], ['A 3-node cluster tolerates 0', 'It tolerates 1.']], answer: 0, explanation: '⌊4/2⌋ + 1 = 3 and ⌊3/2⌋ + 1 = 2: both tolerate one failure.' }),
  mcq({ ...q(DF), id: 'sd.df.q3', type: 'complexity', difficulty: 'medium', stem: 'Node B\'s Lamport clock is 2. It receives a message stamped 5. What is B\'s clock after processing the receive event?', options: ['6', ['5', 'The receive event itself also ticks the clock.'], ['3', 'It must jump past the received timestamp.'], ['7', 'max(2, 5) + 1 is 6.']], answer: 0, explanation: 'C = max(2, 5) + 1 = 6.' }),
  mcq({ ...q(DF), id: 'sd.df.q4', type: 'concept', difficulty: 'medium', stem: 'A network client sends a write and times out. What can it conclude?', options: ['Nothing certain: the write may have succeeded, failed, or still be in flight', ['The write failed', 'It may have been applied.'], ['The write succeeded', 'It may never have arrived.'], ['The server crashed', 'It could just be slow or the reply was lost.']], answer: 0, explanation: 'This ambiguity is why operations must be idempotent and retries safe.' }),
  mcq({ ...q(DF), id: 'sd.df.q5', type: 'concept', difficulty: 'hard', stem: 'A leader acquires a lock lease, then pauses for a long GC. The lease expires, a new leader takes over, and the old one resumes and writes. How can storage stay safe?', options: ['Require fencing tokens: each lock grant has an increasing number, and storage rejects writes carrying an older token', ['Use a longer lease', 'A longer pause can still outlast it.'], ['Synchronise the clocks better', 'Does not remove the pause problem.'], ['Ignore the old leader\'s messages by IP', 'Does not stop its in-flight writes.']], answer: 0, explanation: 'Fencing makes safety independent of timing assumptions.' }),
  mcq({ ...q(DF), id: 'sd.df.q6', type: 'concept', difficulty: 'medium', stem: 'In Raft, when is a log entry considered committed?', options: ['When it has been stored on a majority of the nodes', ['When the leader has written it locally', 'The leader could fail before replication.'], ['When all nodes have it', 'That would block on a single failed node.'], ['When a client reads it', 'Reads don\'t define commit.']], answer: 0, explanation: 'Majority replication ensures any future leader has the entry.' }),
  mcq({ ...q(DF), id: 'sd.df.q7', type: 'concept', difficulty: 'medium', stem: 'Why is last-write-wins using each server\'s wall clock risky?', options: ['Clock skew can make an older write look newer, silently discarding the real latest update', ['Wall clocks cannot be read in programs', 'They can be read; the issue is accuracy.'], ['It always needs a quorum', 'Unrelated.'], ['It doubles storage', 'Unrelated.']], answer: 0, explanation: 'Use logical clocks, version vectors or a single ordering authority instead.' }),
];

export const topics: Topic[] = [api, auth, obs, fault, distributed];
export const mcqs: MCQ[] = [...apMcqs, ...auMcqs, ...obMcqs, ...ftMcqs, ...dfMcqs];
