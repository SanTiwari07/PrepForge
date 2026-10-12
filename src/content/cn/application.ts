import type { MCQ, Resource, Topic } from '../schema';
import { mcq } from '../helpers';
import { HPBN, MDN_HTTP, RFC, cnTopic, q, sh } from './common';

// CN batch 3: application-layer topics (sessions/auth, REST and protocols, proxies and load
// balancers), the socket API and a troubleshooting playbook. Numeric claims (the sample JWT,
// hash-mod-N remapping) are recomputed in tests/os-cn-facts.test.ts.

const mdn = (title: string, path: string): Resource => ({ title: `MDN: ${title}`, url: `https://developer.mozilla.org/en-US/docs/${path}`, kind: 'official-docs' });
const cf = (title: string, path: string): Resource => ({ title: `Cloudflare Learning: ${title}`, url: `https://www.cloudflare.com/learning/${path}`, kind: 'article' });

// ---------------------------------------------------------------------------------------
const SA = 'cn.sessions-auth';
const sessions = cnTopic({
  id: SA, title: 'Cookies, Sessions and Auth Basics', level: 'core', estMinutes: 50, prerequisites: ['cn.http'], related: ['cn.tls-https', 'cn.rest-protocols', 'cn.proxies-lb'],
  summary: 'Cookies, sessions, JWTs, CORS and an OAuth overview.',
  objectives: ['Explain how cookies and server-side sessions give stateless HTTP a login state, and what HttpOnly, Secure and SameSite do.', 'Describe a JWT (structure, what the signature does and does not give you) and compare it with sessions, including revocation.', 'Explain the same-origin policy, CORS, simple vs preflighted requests, and why CORS is enforced by the browser.', 'Describe CSRF and XSS and the defence for each.', 'Outline OAuth 2.0 authorization code flow with PKCE and how OpenID Connect adds login.'],
  sections: [
    { id: 'cookies-sessions', kind: 'concept', title: 'Cookies and sessions', bodyMd: `HTTP is stateless: the server does not remember the previous request. **Cookies** let the server hand the browser a small piece of state, which the browser sends back on every matching request.

\`\`\`
HTTP/1.1 200 OK
Set-Cookie: sid=9f3a1c...; Path=/; Max-Age=3600; Secure; HttpOnly; SameSite=Lax
\`\`\`

| Attribute | Effect |
|---|---|
| \`Max-Age\` / \`Expires\` | Lifetime. Without either, it is a **session cookie** (dropped when the browser closes). |
| \`Domain\` / \`Path\` | Which hosts and paths receive it. With no \`Domain\`, only the exact host gets it. |
| \`Secure\` | Sent only over HTTPS. |
| \`HttpOnly\` | **JavaScript cannot read it** (\`document.cookie\`), so an XSS bug cannot steal the session id directly. |
| \`SameSite\` | \`Strict\`: never sent on cross-site requests. \`Lax\`: sent on top-level navigations with safe methods (GET), not on cross-site POSTs, images or fetches. \`None\`: always sent, and requires \`Secure\`. Modern browsers treat a missing attribute as \`Lax\`. |

**Server-side session:** the cookie holds only a random, unguessable **session id**; the data (user id, cart, roles) lives on the server in memory, Redis or a database. Logging out or banning a user means deleting that record, which takes effect immediately. The cost is a lookup per request and a shared session store once you run several servers.

Never put secrets or trusted data in a cookie the client can edit unless it is signed (or encrypted).` },
    { id: 'jwt', kind: 'concept', title: 'JWTs and tokens', bodyMd: `A **JSON Web Token** is three base64url parts separated by dots: \`header.payload.signature\`.

- **Header:** algorithm and type, for example \`{"alg":"HS256","typ":"JWT"}\`.
- **Payload (claims):** \`sub\` (user), \`iat\`/\`exp\` (issued/expiry, in seconds since the epoch), \`iss\`, \`aud\`, roles, and so on.
- **Signature:** HMAC (shared secret) or RSA/ECDSA (private key) over \`header.payload\`.

**What the signature gives you:** *integrity and authenticity*. The server can verify the token was issued by someone holding the key and has not been modified, **without a database lookup**.
**What it does not give you:** *confidentiality*. The payload is only encoded, not encrypted: anyone holding the token can read it. Do not put secrets in it.

| | Server-side session | JWT (self-contained) |
|---|---|---|
| State | On the server | In the token |
| Revocation | Delete the session: instant | Hard: valid until \`exp\` unless you keep a deny-list (which reintroduces state) |
| Scaling | Needs a shared store | Any service with the key can verify |
| Typical use | Classic web apps | APIs and service-to-service calls |

Good practice: **short-lived access token** (minutes) plus a **refresh token** (stored server-side, revocable), always over HTTPS; verify \`alg\`, \`exp\`, \`iss\` and \`aud\`; never accept \`alg: none\`. Storing tokens in \`localStorage\` exposes them to XSS; an \`HttpOnly; Secure; SameSite\` cookie is usually safer for browsers.

**401 vs 403:** 401 Unauthorized means *not authenticated* (no or bad credentials). 403 Forbidden means *authenticated but not allowed*.` },
    { id: 'cors', kind: 'concept', title: 'Same-origin policy and CORS', bodyMd: `An **origin** is the triple **scheme + host + port**. \`https://shop.example.com\` and \`https://shop.example.com:8443\` are different origins, as are \`http://…\` vs \`https://…\` and \`api.example.com\` vs \`shop.example.com\`.

The **same-origin policy** stops a script on one origin from *reading responses* from another origin (otherwise any page you visit could read your webmail). **CORS** (Cross-Origin Resource Sharing) is how a server *opts in* to being read by other origins, using response headers:

\`\`\`
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600
\`\`\`

- **Simple requests** (GET/HEAD/POST with only basic headers and a form-style content type) go straight out; the browser then checks \`Access-Control-Allow-Origin\` on the response and hides it from the script if it does not match.
- **Preflighted requests** (methods like PUT/DELETE, custom headers such as \`Authorization\`, or \`Content-Type: application/json\`) first send an automatic **\`OPTIONS\`** request with \`Origin\` and \`Access-Control-Request-Method/Headers\`. Only if the server's answer allows it does the real request follow. \`Access-Control-Max-Age\` caches the answer.
- With credentials (cookies), \`Access-Control-Allow-Origin\` **cannot be \`*\`**: name the origin, and send \`Allow-Credentials: true\`.

**CORS is enforced by the browser, not the server.** \`curl\` and server-to-server calls ignore it, and the server still *receives* a simple request even when CORS blocks the script from reading the answer. So CORS is not an authentication mechanism and does not stop CSRF.` },
    { id: 'attacks', kind: 'concept', title: 'CSRF and XSS', bodyMd: `**CSRF (cross-site request forgery):** while you are logged in to \`bank.com\`, \`evil.com\` makes your browser send \`POST bank.com/transfer\`; the browser attaches your cookie automatically. Defences: **\`SameSite=Lax/Strict\` cookies**, **anti-CSRF tokens** (a per-session secret that must appear in the request body or a header, which another site cannot read), checking \`Origin\`, and requiring non-simple headers for APIs.

**XSS (cross-site scripting):** an attacker gets JavaScript to run in *your* site's origin (unescaped user input rendered as HTML). That script can read non-\`HttpOnly\` data and act as the user. Defences: **escape output** by context (frameworks do this by default), a **Content-Security-Policy**, \`HttpOnly\` cookies, and avoiding \`innerHTML\` with untrusted data.

They are different bugs: CSRF *uses* the victim's browser to send requests blindly; XSS *runs code* inside the victim's session. An XSS bug defeats CSRF tokens too.` },
    { id: 'oauth', kind: 'concept', title: 'OAuth 2.0 and OpenID Connect (overview)', bodyMd: `**OAuth 2.0** lets an app (the **client**) get *limited access* to a user's data held by another service (the **resource server**) **without ever seeing the user's password**. The **authorization server** issues tokens after the user consents.

**Authorization code flow (with PKCE)**, used by web, mobile and single-page apps:

1. The app redirects the user to the authorization server with \`client_id\`, \`redirect_uri\`, requested \`scope\`, a random \`state\`, and a **PKCE** \`code_challenge\` (hash of a secret \`code_verifier\`).
2. The user logs in and approves the scopes.
3. The server redirects back to \`redirect_uri\` with a short-lived **authorization code** (and your \`state\`, which you must check, to stop CSRF on the callback).
4. The app's back end (or the app itself, for public clients) POSTs the code plus the \`code_verifier\` to the token endpoint and receives an **access token** (and maybe a refresh token).
5. The app calls the API with \`Authorization: Bearer <token>\`.

PKCE ensures a stolen authorization code is useless without the verifier. **OpenID Connect (OIDC)** adds an **ID token** (a JWT about the user) on top of OAuth, which is what "Sign in with Google" actually uses. Remember: **OAuth is authorization (delegated access); OIDC is authentication (who the user is).**` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Believing a JWT is encrypted (it is signed; the payload is readable).
2. Using JWTs everywhere and then needing to log users out or ban them instantly.
3. Saying CORS protects the server (it protects users' browsers from other sites reading responses).
4. Setting \`Access-Control-Allow-Origin: *\` together with cookies, or reflecting any \`Origin\` header back.
5. Mixing up 401 and 403.
6. Storing a long-lived token in \`localStorage\` on a page that renders untrusted content.
7. Skipping the \`state\` check in OAuth callbacks.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Sessions vs JWTs: how do you choose?', answerMd: 'Server-side sessions keep state on the server behind an opaque cookie, so logout and revocation are instant but a shared store is required. JWTs are self-contained and verifiable without a lookup, which suits APIs and microservices, but they cannot easily be revoked before expiry. A common design is a short-lived JWT access token plus a revocable refresh token. For a classic web app, sessions are simpler and safer.' },
    { id: 'iq2', q: 'What are HttpOnly, Secure and SameSite for?', answerMd: 'HttpOnly hides the cookie from JavaScript so XSS cannot read it. Secure sends it only over HTTPS. SameSite controls whether it is attached to cross-site requests: Strict never, Lax only on top-level GET navigations, None always (with Secure). SameSite is the main browser-level CSRF defence.' },
    { id: 'iq3', q: 'A frontend at app.example.com calls api.example.com and fails with a CORS error. Why, and how do you fix it?', answerMd: 'The two hosts are different origins, so the browser blocks the script from reading the response unless the API opts in. The fix is on the API: respond with Access-Control-Allow-Origin set to the app\'s origin (and Allow-Credentials, Allow-Methods and Allow-Headers as needed), and handle the OPTIONS preflight for non-simple requests. Disabling the check in the browser, or proxying through the same origin, are workarounds, not fixes.' },
    { id: 'iq4', q: 'What is CSRF and how do you prevent it?', answerMd: 'A malicious site makes the victim\'s browser send a state-changing request to a site where they are logged in, and the browser attaches the cookies automatically. Prevent it with SameSite cookies, per-session anti-CSRF tokens, Origin checks, and never changing state on GET.' },
    { id: 'iq5', q: 'Walk me through OAuth 2.0 authorization code flow.', answerMd: 'The app redirects the user to the authorization server with its client id, scopes, state and a PKCE challenge. The user authenticates and consents; the server redirects back with a short-lived code. The app exchanges the code (plus the PKCE verifier) at the token endpoint for an access token, then calls the API with it as a Bearer token. OAuth delegates access; OpenID Connect adds an ID token to say who the user is.' },
  ],
  revision: { notesMd: `- Cookie flags: HttpOnly (no JS), Secure (HTTPS only), SameSite (Strict / Lax / None+Secure), Max-Age.
- Session = opaque id in a cookie + server state (instant revocation). JWT = header.payload.signature: signed, NOT encrypted.
- Short access token + revocable refresh token. 401 = not authenticated; 403 = not allowed.
- Origin = scheme + host + port. CORS is browser-enforced; preflight = OPTIONS for non-simple requests; no \`*\` with credentials.
- CSRF → SameSite + tokens. XSS → escape output + CSP + HttpOnly.
- OAuth 2.0 = delegated authorization (code flow + PKCE); OIDC = authentication (ID token).`, flashcards: [
    { id: 'f1', front: 'What does HttpOnly do?', backMd: 'Prevents JavaScript from reading the cookie, limiting what XSS can steal.' },
    { id: 'f2', front: 'Is a JWT payload encrypted?', backMd: 'No: it is base64url-encoded and signed. Anyone with the token can read it.' },
    { id: 'f3', front: 'What makes two URLs the same origin?', backMd: 'Same scheme, host and port.' },
    { id: 'f4', front: 'When does a browser send a CORS preflight?', backMd: 'For non-simple requests (e.g. PUT/DELETE, Authorization header, JSON content type): an automatic OPTIONS request first.' },
    { id: 'f5', front: '401 vs 403?', backMd: '401: not authenticated. 403: authenticated but not permitted.' },
    { id: 'f6', front: 'OAuth 2.0 vs OpenID Connect?', backMd: 'OAuth: delegated authorization (access tokens). OIDC: authentication layer on top (ID token).' },
  ] },
  resources: [mdn('Using HTTP cookies', 'Web/HTTP/Cookies'), mdn('Cross-Origin Resource Sharing (CORS)', 'Web/HTTP/CORS'), RFC(6265, 'HTTP State Management Mechanism (cookies)'), RFC(7519, 'JSON Web Token'), RFC(6749, 'The OAuth 2.0 Authorization Framework')],
});

const saMcqs: MCQ[] = [
  mcq({ ...q(SA), id: 'cn.sa.q1', type: 'concept', difficulty: 'easy', stem: 'Which URL has the same origin as `https://shop.example.com/cart`?', options: ['`https://shop.example.com/checkout?step=2`', ['`http://shop.example.com/cart`', 'The scheme differs (http vs https).'], ['`https://api.shop.example.com/cart`', 'The host differs.'], ['`https://shop.example.com:8443/cart`', 'The port differs (443 is the default for https).']], answer: 0, explanation: 'An origin is scheme + host + port; the path and query do not matter.' }),
  mcq({ ...q(SA), id: 'cn.sa.q2', type: 'concept', difficulty: 'easy', stem: 'What does the `HttpOnly` cookie attribute prevent?', options: ['JavaScript reading the cookie through `document.cookie`', ['The cookie being sent over plain HTTP', 'That is the `Secure` attribute.'], ['The cookie being sent on cross-site requests', 'That is `SameSite`.'], ['The cookie from expiring', 'Lifetime is set by `Max-Age`/`Expires`.']], answer: 0, explanation: 'HttpOnly keeps the value out of script reach, so an XSS bug cannot read the session id directly (it can still make requests as the user).' }),
  mcq({ ...q(SA), id: 'cn.sa.q3', type: 'concept', difficulty: 'medium', stem: 'A JWT signed with HS256 is stolen from a log file. What can the attacker do?', options: ['Read every claim in its payload and replay it until it expires', ['Nothing: the payload is encrypted', 'JWTs are signed, not encrypted; base64url is trivially decoded.'], ['Forge new tokens with any claims', 'Without the signing key they cannot produce a valid signature.'], ['Nothing: replay is impossible because of the signature', 'The signature does not stop a valid token being reused.']], answer: 0, explanation: 'The signature protects integrity, not secrecy or replay. This is why tokens are short-lived and sent only over HTTPS.' }),
  mcq({ ...q(SA), id: 'cn.sa.q4', type: 'concept', difficulty: 'medium', stem: 'An evil page triggers a hidden `POST https://bank.example/transfer` using the victim\'s logged-in browser. Which defence mainly stops this?', options: ['`SameSite=Lax`/`Strict` session cookies plus an anti-CSRF token', ['`HttpOnly` cookies', 'HttpOnly stops scripts reading the cookie; the browser still attaches it to the forged request.'], ['Setting `Access-Control-Allow-Origin: *`', 'That makes cross-origin reads easier, and CORS does not stop the request being sent.'], ['Using HTTPS', 'HTTPS protects the transport, not against requests the victim\'s own browser makes.']], answer: 0, explanation: 'CSRF abuses automatic cookie attachment; SameSite withholds cookies on cross-site POSTs and tokens prove the request came from your own page.' }),
  mcq({ ...q(SA), id: 'cn.sa.q5', type: 'concept', difficulty: 'medium', stem: 'Who enforces the CORS policy?', options: ['The browser, which hides cross-origin responses from scripts unless the server\'s headers allow them', ['The server, which refuses requests from other origins', 'The server only sends headers; for simple requests it still processes the request.'], ['The network firewall', 'Firewalls do not understand CORS headers.'], ['TLS during the handshake', 'TLS is unrelated.']], answer: 0, explanation: 'curl and other servers ignore CORS entirely, so it is not an access-control mechanism for your API.' }),
  mcq({ ...q(SA), id: 'cn.sa.q6', type: 'concept', difficulty: 'medium', stem: 'From a page on `https://app.example.com`, JavaScript calls `fetch("https://api.example.com/items", {method: "PUT", headers: {"Authorization": "Bearer abc"}})`. What does the browser do first?', options: ['Sends an `OPTIONS` preflight request to the API', ['Sends the `PUT` directly and checks the response afterwards', 'A PUT with an Authorization header is not a simple request.'], ['Blocks it because the origins differ', 'Cross-origin calls are allowed when the server opts in via CORS.'], ['Opens a WebSocket', 'fetch does not do that.']], answer: 0, explanation: 'Non-simple requests (PUT, custom/Authorization headers, JSON content type) are preceded by an automatic preflight; the real request is sent only if the answer allows it.' }),
  mcq({ ...q(SA), id: 'cn.sa.q7', type: 'concept', difficulty: 'easy', stem: 'A logged-in user without admin rights requests `/admin`. Which status code is the best fit?', options: ['403 Forbidden', ['401 Unauthorized', '401 means the caller is not authenticated; here they are authenticated but not permitted.'], ['404 Not Found', 'Possible to hide the page\'s existence, but 403 is the standard answer.'], ['400 Bad Request', 'The request itself is well-formed.']], answer: 0, explanation: '401: who are you? 403: I know who you are, and the answer is no.' }),
  mcq({ ...q(SA), id: 'cn.sa.q8', type: 'concept', difficulty: 'hard', stem: 'Your API uses long-lived self-contained JWTs and an employee\'s account is compromised. What is the main difficulty?', options: ['Tokens already issued stay valid until they expire unless the API keeps a deny-list or checks a session store', ['The signature must be recomputed for every request', 'Verification is cheap and needs no lookup.'], ['JWTs cannot be sent over HTTPS', 'They are normally sent over HTTPS.'], ['The user must change the algorithm in the header', 'The header does not drive revocation.']], answer: 0, explanation: 'Statelessness is the feature and the problem: revoking needs extra state. Short-lived access tokens plus revocable refresh tokens limit the damage window.' }),
  mcq({ ...q(SA), id: 'cn.sa.q9', type: 'concept', difficulty: 'hard', stem: 'In the OAuth 2.0 authorization code flow, what is PKCE\'s purpose?', options: ['It makes a stolen authorization code useless, because exchanging it requires the secret `code_verifier` that only the original client has', ['It encrypts the access token', 'PKCE protects the code exchange; it does not encrypt tokens.'], ['It replaces the user\'s consent screen', 'The user still consents.'], ['It authenticates the user\'s password to the client', 'OAuth exists so the client never sees the password.']], answer: 0, explanation: 'The client sends a hash (code_challenge) at the start and the original secret (code_verifier) at the end; an attacker who intercepts only the code cannot complete the exchange.' }),
];

// ---------------------------------------------------------------------------------------
const RP = 'cn.rest-protocols';
const rest = cnTopic({
  id: RP, title: 'REST and Application Protocols', level: 'core', estMinutes: 45, prerequisites: ['cn.http'], related: ['cn.sessions-auth', 'cn.sockets', 'cn.proxies-lb'],
  summary: 'REST, idempotency, WebSockets, gRPC and the classic mail, file and shell protocols.',
  objectives: ['Design resource-oriented REST URLs and choose methods and status codes correctly.', 'Distinguish safe from idempotent methods and make a POST retry-safe with an idempotency key.', 'Compare polling, long polling, Server-Sent Events, WebSockets and gRPC streaming, and pick one for a scenario.', 'Place SMTP, IMAP, FTP and SSH by purpose and port, and explain why plain FTP is avoided.'],
  sections: [
    { id: 'rest', kind: 'concept', title: 'REST in practice', bodyMd: `**REST** is an architectural style where an API exposes **resources** (nouns) identified by URLs and manipulated with the standard HTTP methods. The key constraints are a **client–server** split, **stateless** requests (each carries everything the server needs, such as an auth token), **cacheable** responses, a **uniform interface**, and layered intermediaries (proxies, CDNs).

\`\`\`
GET    /users/42              fetch one user
GET    /users/42/orders?status=open&limit=20
POST   /users                 create (server picks the id)
PUT    /users/42              replace the whole resource
PATCH  /users/42              partial update
DELETE /users/42
\`\`\`

- Use **plural nouns**, not verbs: \`/orders\`, not \`/getOrders\`.
- **Status codes:** 200 OK, **201 Created** (+ \`Location\` header), **204 No Content**, 400 malformed, 401/403 auth, 404 not found, **409 Conflict**, 422 validation failed, **429 Too Many Requests** (+ \`Retry-After\`), 500/502/503/504 server-side.
- **Pagination:** *offset* (\`?page=3&limit=20\`) is simple but slow on deep pages and unstable when rows are inserted; *cursor/keyset* (\`?after=<opaque id>\`) is stable and fast and is preferred for large or fast-changing lists.
- **Versioning:** \`/v1/...\` or a header; never break existing clients silently.
- Return consistent error bodies (code, message, field errors).` },
    { id: 'idempotency', kind: 'concept', title: 'Safe, idempotent and retry-safe', bodyMd: `- **Safe** methods do not change server state: GET, HEAD, OPTIONS.
- **Idempotent** methods give the same *final state* when repeated: GET, HEAD, OPTIONS, **PUT, DELETE** (the second DELETE may return 404, but the state is the same).
- **POST is not idempotent** and **PATCH is not guaranteed to be** (\`PATCH {"balance": "+10"}\` is not, \`PATCH {"name": "Ann"}\` is).

Idempotency matters because networks fail: a client that times out does not know whether the server processed its request, so it must retry. Retrying \`POST /payments\` could charge twice. The fix is an **idempotency key**:

1. The client generates a unique key per logical operation and sends \`Idempotency-Key: 7c1e...\`.
2. The server stores the key with the response of the first successful attempt.
3. A retry with the same key returns the stored response instead of charging again.

Combine with **exponential backoff and jitter** on retries, and only auto-retry idempotent requests (or those with keys).` },
    { id: 'realtime', kind: 'comparison', title: 'Polling, SSE, WebSockets and gRPC', bodyMd: `| Technique | How it works | Direction | Good for |
|---|---|---|---|
| **Polling** | Client asks every N seconds | client → server | Rare updates, simplicity |
| **Long polling** | Server holds the request open until there is data | client → server | Fallback, modest scale |
| **Server-Sent Events (SSE)** | One long HTTP response, \`text/event-stream\` | server → client only; auto-reconnect | Notifications, live feeds, progress |
| **WebSocket** | HTTP \`Upgrade\` (a **101 Switching Protocols** response), then a persistent full-duplex TCP connection with small framing | both ways | Chat, multiplayer games, collaborative editing |
| **gRPC** | HTTP/2 + Protocol Buffers; generated clients; unary and streaming calls | both ways | Internal service-to-service calls |

**WebSocket details:** the handshake is an ordinary HTTP GET with \`Upgrade: websocket\` and \`Sec-WebSocket-Key\`; \`ws://\` is port 80, \`wss://\` (TLS) is port 443. Connections are long-lived, so servers must manage many open sockets, load balancers need long idle timeouts and sticky routing (or a pub/sub backplane such as Redis so any server can reach any client), and clients need reconnect-with-backoff logic and heartbeats (ping/pong).

**gRPC vs REST/JSON:** protobuf is compact and strongly typed with a schema (\`.proto\`) and code generation, HTTP/2 gives multiplexing and streaming, and deadlines are built in. The downsides are poor browser support without a proxy (gRPC-Web), binary payloads that are harder to debug, and less cache/CDN friendliness. Typical split: **gRPC inside, REST/JSON at the public edge**.` },
    { id: 'classic', kind: 'concept', title: 'SMTP, IMAP, FTP and SSH', bodyMd: `| Protocol | Purpose | Port(s) | Notes |
|---|---|---|---|
| **SMTP** | Send mail (client → server, server → server) | 25 (server relay), **587** (submission, STARTTLS), 465 (implicit TLS) | Text commands (\`HELO\`, \`MAIL FROM\`, \`RCPT TO\`, \`DATA\`); sender authenticity relies on SPF, DKIM and DMARC DNS records |
| **IMAP** | Read mail kept on the server, synced across devices | 143 / 993 (TLS) | Newer and more common than POP3 |
| **POP3** | Download mail and usually delete it from the server | 110 / 995 (TLS) | Single-device model |
| **FTP** | File transfer | 21 (control) + 20 or a negotiated data port | Sends passwords **in clear text**; separate data connection is awkward for firewalls and NAT |
| **SFTP** | File transfer over SSH | 22 | Not "FTP over TLS" (that is FTPS) |
| **SSH** | Encrypted remote shell, tunnels, file copy (\`scp\`), Git over SSH | 22 | Host keys prevent MITM; use key pairs, not passwords |

Interview shortcut: *SMTP pushes mail, IMAP/POP3 pull it; FTP is legacy and insecure, so use SFTP/SCP or HTTPS; SSH is the standard for secure admin access.*` },
    { id: 'example', kind: 'example', title: 'Example: retry-safe payment API', bodyMd: 'A mobile client times out after posting a payment. See how the idempotency key prevents a double charge.', code: [sh(`# First attempt: server charges and stores the result under the key
curl -i -X POST https://api.example.com/v1/payments \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Idempotency-Key: 7c1e5b0a-3f4d-4e61-9d2a-b4f1c0d9a001' \\
  -H 'Content-Type: application/json' \\
  -d '{"amount": 4999, "currency": "INR", "order_id": "ord_123"}'

# Client never saw the response (timeout), so it retries with the SAME key.
# The server finds the key and replays the stored 201 response; no second charge.`, 'Idempotency key')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Verbs in URLs and everything as POST.
2. Returning 200 with an error message in the body.
3. Claiming PUT and POST are interchangeable: PUT is idempotent and replaces at a known URL; POST creates and is not idempotent.
4. Using offset pagination on huge, constantly changing tables.
5. Choosing WebSockets for something SSE or plain polling solves more simply.
6. Retrying non-idempotent requests blindly.
7. Calling FTP "secure FTP" when it is not.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What does it mean for a method to be idempotent, and which HTTP methods are?', answerMd: 'Repeating the request leaves the server in the same final state as sending it once. GET, HEAD, OPTIONS, PUT and DELETE are idempotent; POST is not, and PATCH is not guaranteed to be. Idempotency is what makes retries after a timeout safe.' },
    { id: 'iq2', q: 'How do you stop a client retry from charging a customer twice?', answerMd: 'Use an idempotency key: the client sends a unique key with the first attempt, the server records the key together with the result, and any retry with the same key returns the stored result instead of repeating the work. Enforce uniqueness atomically (for example a unique constraint) so two concurrent retries cannot both proceed.' },
    { id: 'iq3', q: 'WebSockets vs Server-Sent Events vs polling?', answerMd: 'Polling is simplest but wasteful and slow. SSE gives one-way server-to-client push over plain HTTP with automatic reconnect, ideal for feeds and notifications. WebSockets give a persistent full-duplex channel, needed for chat or games, at the cost of stateful connections that are harder to scale and balance. Pick the simplest that meets the direction and latency need.' },
    { id: 'iq4', q: 'When would you choose gRPC over REST?', answerMd: 'For internal service-to-service calls where you want a typed contract, generated clients, low latency, streaming and deadlines. REST/JSON remains better for public APIs because browsers, caches, proxies and humans work with it directly.' },
    { id: 'iq5', q: 'Offset vs cursor pagination?', answerMd: 'Offset (page/limit) is simple but scans and discards skipped rows (slow for deep pages) and shows duplicates or gaps when data changes between requests. Cursor (keyset) pagination remembers the last seen sort key and queries after it, so it is fast and stable, but does not allow jumping to an arbitrary page.' },
  ],
  revision: { notesMd: `- REST: nouns, standard methods, stateless, cacheable. 201 + Location, 204, 409, 422, 429 + Retry-After.
- Safe: GET/HEAD/OPTIONS. Idempotent: those + PUT, DELETE. POST not; PATCH depends.
- Idempotency-Key + stored response makes POST retry-safe; retries use backoff + jitter.
- Polling → long polling → SSE (one-way, HTTP) → WebSocket (101 Upgrade, full duplex) → gRPC (HTTP/2 + protobuf).
- SMTP 25/587/465 send; IMAP 143/993 read; FTP 21 insecure; SSH 22 secure shell, SFTP over SSH.`, flashcards: [
    { id: 'f1', front: 'Which HTTP methods are idempotent?', backMd: 'GET, HEAD, OPTIONS, PUT, DELETE (not POST; PATCH only if the patch is absolute).' },
    { id: 'f2', front: 'Status code and header after creating a resource?', backMd: '201 Created with a Location header.' },
    { id: 'f3', front: 'How does a WebSocket start?', backMd: 'An HTTP GET with Upgrade: websocket; the server answers 101 Switching Protocols.' },
    { id: 'f4', front: 'Transport and format of gRPC?', backMd: 'HTTP/2 with Protocol Buffers.' },
    { id: 'f5', front: 'Port for SSH / SMTP submission?', backMd: 'SSH 22; SMTP submission 587.' },
    { id: 'f6', front: 'Why is cursor pagination better for big lists?', backMd: 'It seeks past the last key instead of scanning skipped rows and stays stable as data changes.' },
  ] },
  resources: [mdn('HTTP request methods', 'Web/HTTP/Methods'), mdn('Writing WebSocket client applications', 'Web/API/WebSockets_API/Writing_WebSocket_client_applications'), RFC(9110, 'HTTP Semantics'), RFC(6455, 'The WebSocket Protocol'), { title: 'gRPC: Introduction', url: 'https://grpc.io/docs/what-is-grpc/introduction/', kind: 'official-docs' }],
});

const rpMcqs: MCQ[] = [
  mcq({ ...q(RP), id: 'cn.rp.q1', type: 'concept', difficulty: 'easy', stem: 'Which HTTP method is NOT idempotent?', options: ['POST', ['PUT', 'Repeating a PUT leaves the same final state.'], ['DELETE', 'After the first delete the resource is gone; repeats do not change that.'], ['GET', 'Reads do not change state at all.']], answer: 0, explanation: 'Two identical POSTs can create two resources or two charges.' }),
  mcq({ ...q(RP), id: 'cn.rp.q2', type: 'concept', difficulty: 'easy', stem: 'A `POST /users` request creates a user successfully. Which response fits best?', options: ['201 Created with a `Location` header for the new user', ['200 OK with an empty body and no location', 'Valid HTTP, but 201 is the specific signal for creation.'], ['204 No Content', 'That tells the client nothing about the new resource.'], ['302 Found', 'A redirect is not a creation signal.']], answer: 0, explanation: '201 plus Location lets the client find the new resource.' }),
  mcq({ ...q(RP), id: 'cn.rp.q3', type: 'concept', difficulty: 'medium', stem: 'A payment POST times out and the mobile client retries. Which mechanism prevents double charging?', options: ['An idempotency key stored with the first result and replayed on retries', ['Switching the call to GET', 'GET must not change state, and it would not solve the duplicate problem.'], ['Using HTTP/2', 'The protocol version has no effect on duplicate processing.'], ['A longer client timeout', 'It reduces timeouts but cannot make a retry safe.']], answer: 0, explanation: 'The server recognises the repeated logical operation and returns the earlier outcome.' }),
  mcq({ ...q(RP), id: 'cn.rp.q4', type: 'concept', difficulty: 'medium', stem: 'A live sports page only needs the server to push score updates to browsers. Which is the simplest fitting technology?', options: ['Server-Sent Events', ['WebSockets, because only they can push', 'SSE also pushes, with less machinery, and reconnects automatically.'], ['Polling every 50 ms', 'Wasteful and still not truly live.'], ['FTP', 'It is unrelated to browser updates.']], answer: 0, explanation: 'One-way server-to-client push over plain HTTP is exactly what SSE is for; use WebSockets when the client also needs to send frequently.' }),
  mcq({ ...q(RP), id: 'cn.rp.q5', type: 'concept', difficulty: 'medium', stem: 'Which HTTP response status completes a WebSocket handshake?', options: ['101 Switching Protocols', ['200 OK', 'A 200 would be an ordinary response with no protocol switch.'], ['301 Moved Permanently', 'That is a redirect.'], ['426 Upgrade Required', 'That is the server demanding the client upgrade, not accepting the upgrade.']], answer: 0, explanation: 'The client sends `Upgrade: websocket`; the server agrees with 101 and the TCP connection then carries WebSocket frames.' }),
  mcq({ ...q(RP), id: 'cn.rp.q6', type: 'concept', difficulty: 'medium', stem: 'Why is offset pagination (`LIMIT 20 OFFSET 100000`) a poor choice for huge, frequently changing tables?', options: ['The database still scans and discards the skipped rows, and inserts between page requests cause duplicates or gaps', ['OFFSET is not valid SQL', 'It is valid; the problem is performance and stability.'], ['It returns rows in random order', 'Order is defined by `ORDER BY`.'], ['It only works on the first page', 'It works on any page, just slowly.']], answer: 0, explanation: 'Keyset (cursor) pagination uses `WHERE id > :last ORDER BY id LIMIT 20`, which is index-friendly and stable.' }),
  mcq({ ...q(RP), id: 'cn.rp.q7', type: 'concept', difficulty: 'easy', stem: 'Which protocol sends email from a mail client to a mail server?', options: ['SMTP', ['IMAP', 'IMAP reads mail stored on the server.'], ['FTP', 'FTP transfers files.'], ['SNMP', 'SNMP is for network management.']], answer: 0, explanation: 'SMTP sends (submission uses port 587); IMAP and POP3 retrieve.' }),
  mcq({ ...q(RP), id: 'cn.rp.q8', type: 'concept', difficulty: 'medium', stem: 'Why do teams often use gRPC between internal services but REST/JSON for public APIs?', options: ['gRPC offers typed contracts, compact binary messages and streaming over HTTP/2, while REST/JSON works with browsers, caches and everyday tools', ['gRPC is slower but safer', 'It is normally faster, not slower, and safety is not the reason.'], ['REST cannot be used over HTTPS', 'REST is routinely used over HTTPS.'], ['gRPC works over UDP so it needs no connections', 'gRPC runs over HTTP/2, which uses TCP.']], answer: 0, explanation: 'Choose by the audience: machines you control versus clients you do not.' }),
  mcq({ ...q(RP), id: 'cn.rp.q9', type: 'concept', difficulty: 'hard', stem: 'Which is true of `PATCH`?', options: ['It is not guaranteed to be idempotent: `{"balance": "+10"}` changes state on every call, while `{"name": "Ann"}` does not', ['It is always idempotent like PUT', 'It depends on the patch semantics.'], ['It is always safe', 'It modifies the resource, so it is not safe.'], ['It must replace the entire resource', 'That describes PUT.']], answer: 0, explanation: 'Relative updates break idempotency; absolute ones keep it.' }),
];

// ---------------------------------------------------------------------------------------
const PL = 'cn.proxies-lb';
const proxies = cnTopic({
  id: PL, title: 'Proxies, Load Balancers and CDNs', level: 'core', estMinutes: 45, prerequisites: ['cn.http'], related: ['cn.tls-https', 'cn.nat-firewalls', 'cn.dns'],
  summary: 'Forward vs reverse proxies, L4 vs L7 balancing, algorithms, health checks and CDNs.',
  objectives: ['Distinguish forward proxies, reverse proxies and load balancers by who they work for.', 'Compare L4 and L7 load balancing and say what each can inspect.', 'Choose a balancing algorithm (round robin, weighted, least connections, hashing) and explain why plain hash-mod-N breaks when servers change.', 'Explain TLS termination, health checks, sticky sessions and the X-Forwarded-For header.', 'Describe how a CDN reduces latency and origin load.'],
  sections: [
    { id: 'proxies', kind: 'concept', title: 'Forward and reverse proxies', bodyMd: `A **proxy** is an intermediary that handles requests on behalf of someone else.

- **Forward proxy** works for the **client**. The client is configured to send requests through it (corporate gateways, content filtering, caching, anonymity, VPN-like egress). *The server sees the proxy's IP, not the client's.*
- **Reverse proxy** works for the **server**. Clients think they are talking to the real site; the proxy decides which back end handles the request. Uses: **load balancing, TLS termination, caching, compression, rate limiting, WAF, hiding internal topology**. Nginx, HAProxy, Envoy and cloud load balancers all act as reverse proxies. *The client does not know the proxy exists.*

A **load balancer** is a reverse proxy whose main job is spreading traffic across several servers for **capacity and availability**; an **API gateway** is a reverse proxy that also handles authentication, routing by path and rate limiting for APIs.

Because the back end sees the proxy's address, the original client IP is passed along in a header: \`X-Forwarded-For: 203.0.113.9, 10.0.0.4\` (or the standard \`Forwarded\`), plus \`X-Forwarded-Proto\`. Only trust these from your own proxies, otherwise clients can spoof them.` },
    { id: 'l4-l7', kind: 'comparison', title: 'L4 vs L7 load balancing', bodyMd: `| | **L4 (transport)** | **L7 (application)** |
|---|---|---|
| Sees | IPs, ports, TCP/UDP | Full HTTP: path, host, headers, cookies |
| Decision | Per connection (5-tuple) | Per request |
| Connections | Often forwards packets/connection without parsing the payload | Terminates the client connection and opens separate ones to back ends |
| TLS | Can pass TLS through untouched | Needs TLS termination to read the request |
| Speed / cost | Very fast, cheap, protocol-agnostic | More CPU and latency, far more flexible |
| Features | Simple spreading, any TCP/UDP protocol | Path/host routing (\`/api\` vs \`/static\`), header rules, redirects, canary releases, gRPC/HTTP/2 awareness, WAF |

Typical cloud picture: a fast **L4** load balancer in front (AWS NLB), **L7** reverse proxies behind it (ALB, Nginx or Envoy) routing to services.

**TLS termination** at the load balancer offloads certificate handling and enables L7 features; traffic to back ends is then plain or re-encrypted. **TLS passthrough** keeps end-to-end encryption but the balancer can only use L4 information (and SNI).` },
    { id: 'algorithms', kind: 'concept', title: 'Balancing algorithms, health and stickiness', bodyMd: `| Algorithm | Idea | Use when |
|---|---|---|
| **Round robin** | Rotate through servers | Equal servers, similar request cost |
| **Weighted round robin** | More requests to bigger servers | Mixed capacities |
| **Least connections** | Send to the server with the fewest active connections | Long or uneven requests (websockets, uploads) |
| **IP / key hash** | \`hash(client or key) mod N\` | You need the same client to hit the same server (caches, stickiness without cookies) |
| **Consistent hashing** | Servers and keys on a ring; a key goes to the next server clockwise | Caches and shards where servers come and go |

**Why not just hash mod N?** Going from N to N+1 servers changes \`hash mod N\` for most keys. For N=3→4 only **1 in 4** keys (25%) keep their server, so about **75%** are remapped, and a cache cluster would lose most of its contents. Consistent hashing remaps only about **1/(N+1)** of the keys.

**Health checks:** the balancer probes each back end (TCP connect, or HTTP \`GET /healthz\` expecting 200) every few seconds and removes it after several failures, re-adding it after several successes. Use a *shallow* check for liveness and be careful with deep checks that call dependencies, or one database blip can pull every server out at once.

**Sticky sessions** (session affinity, by cookie or source IP) pin a user to one server, which works around servers keeping session state in memory. It unbalances load and loses state when that server dies, so prefer **stateless servers with a shared session store**. Also useful: **connection draining** (let in-flight requests finish before removing a server) and **slow start** (ramp traffic to a new server).

The balancer is itself a single point of failure unless it is redundant: active-passive pairs with a floating IP, multiple nodes behind **anycast** or DNS, or a managed cloud service.` },
    { id: 'cdn', kind: 'concept', title: 'CDNs', bodyMd: `A **content delivery network** is a globally distributed set of **reverse-proxy caches** (edge servers or PoPs) placed close to users.

1. DNS or **anycast** routing sends the user to a nearby edge.
2. **Cache hit:** the edge answers immediately (milliseconds, no trip to the origin).
3. **Cache miss:** the edge fetches from the **origin** (often via a regional or "shield" cache to protect it), stores the response according to \`Cache-Control\`/\`Expires\`, and serves it.

Benefits: **lower latency** (shorter distance and fewer long-haul round trips, with TLS terminated near the user), **less origin load and egress cost**, **absorbing traffic spikes and DDoS attacks**, and reusing warm, optimised connections to the origin. Best for static assets (images, JS/CSS, video segments); dynamic content can also benefit from edge TLS and connection reuse or be cached briefly.

Operational points: **cache keys** (path + selected headers/query), **versioned file names** (\`app.4f9c2.js\`) so you can cache for a year and still ship changes, **purge/invalidation** for urgent fixes, and \`Vary\` headers that must not fragment the cache. Never let a CDN cache personalised or \`private\` responses for everyone.` },
    { id: 'dry-run', kind: 'dry-run', title: 'Walkthrough: one request through the stack', bodyMd: `A user in Pune opens \`https://shop.example.com/api/orders\`:

1. DNS returns an anycast address of the CDN/edge; the user's TCP + TLS handshake ends at a nearby PoP.
2. The CDN sees \`/api/orders\` is not cacheable and forwards it to the origin's **L4 load balancer** (new connection, adds \`X-Forwarded-For\`).
3. The L4 balancer picks a healthy **L7 proxy** by connection hashing.
4. The L7 proxy matches the \`/api\` prefix, picks the *least-connections* server of the "orders" service and forwards the request; a health check had removed one failing instance minutes earlier.
5. The response travels back the same way; a request for \`/static/app.4f9c2.js\` would have been answered straight from the edge cache.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Mixing up forward and reverse proxies (a forward proxy hides the *client*; a reverse proxy hides the *servers*).
2. Using sticky sessions to hide in-memory session state.
3. Hash-mod-N for a cache fleet that scales.
4. Trusting \`X-Forwarded-For\` from the open internet.
5. Deep health checks that fail everything when a shared dependency hiccups.
6. Forgetting that the load balancer needs redundancy too.
7. Caching personalised pages at the CDN.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Forward proxy vs reverse proxy?', answerMd: 'A forward proxy sits in front of clients and fetches on their behalf (filtering, caching, anonymity); servers see the proxy. A reverse proxy sits in front of servers and clients are unaware of it; it does load balancing, TLS termination, caching and protection. A load balancer is a reverse proxy focused on distributing load.' },
    { id: 'iq2', q: 'L4 vs L7 load balancer: when do you use each?', answerMd: 'L4 balances connections using IPs and ports; it is fast, protocol-agnostic and can pass TLS through. L7 understands HTTP, so it can route by host and path, inspect headers and cookies, terminate TLS, retry and do canaries, at higher cost. Use L4 for raw throughput or non-HTTP protocols, L7 when routing decisions need request content; the two are often layered.' },
    { id: 'iq3', q: 'Why does hash(key) mod N break when you add a server, and what is the fix?', answerMd: 'Changing N changes the result for most keys: going from 3 to 4 servers keeps only a quarter of the keys in place, so a cache cluster suddenly misses on most lookups. Consistent hashing places servers and keys on a ring so adding or removing a server only moves about 1/N of the keys (virtual nodes smooth the distribution).' },
    { id: 'iq4', q: 'How would you design health checks for a load balancer?', answerMd: 'Probe each instance on an interval (HTTP GET /healthz expecting 200 within a short timeout), mark it unhealthy after several consecutive failures and healthy again after several successes to avoid flapping. Keep the check cheap and local (can this process serve?), separate liveness from readiness, and avoid making every instance depend on a shared dependency check that could eject the whole fleet at once.' },
    { id: 'iq5', q: 'How does a CDN improve performance?', answerMd: 'It caches content on edge servers near users, so hits skip the long trip to the origin, cutting latency and origin load. It also terminates TLS close to the user, reuses optimised connections to the origin, and absorbs traffic spikes and attacks. Effectiveness depends on cache-friendly headers (Cache-Control), good cache keys and versioned asset names.' },
  ],
  revision: { notesMd: `- Forward proxy = for clients; reverse proxy = for servers (LB, TLS termination, cache, WAF).
- L4: IP+port, fast, protocol-agnostic. L7: HTTP-aware routing, TLS termination, more CPU.
- Algorithms: round robin, weighted, least connections, hash, consistent hashing.
- hash mod N: adding 1 server to 3 remaps ~75% of keys; consistent hashing remaps ~1/(N+1).
- Health checks (shallow), draining, slow start; sticky sessions are a workaround; LB needs HA.
- X-Forwarded-For carries the client IP. CDN = edge caches + Cache-Control + versioned assets.`, flashcards: [
    { id: 'f1', front: 'Which proxy hides the servers from clients?', backMd: 'A reverse proxy.' },
    { id: 'f2', front: 'What can an L7 balancer see that an L4 cannot?', backMd: 'HTTP path, host, headers and cookies (after TLS termination).' },
    { id: 'f3', front: 'Best algorithm for long-lived, uneven connections?', backMd: 'Least connections.' },
    { id: 'f4', front: 'What fraction of keys keeps its server when hash mod 3 becomes hash mod 4?', backMd: '1/4 (25%).' },
    { id: 'f5', front: 'Header that carries the original client IP through proxies?', backMd: 'X-Forwarded-For (or the standard Forwarded).' },
    { id: 'f6', front: 'Why version static file names?', backMd: 'So they can be cached for a long time and a new name forces fresh content on deploy.' },
  ] },
  resources: [cf('What is load balancing?', 'performance/what-is-load-balancing/'), cf('What is a CDN?', 'cdn/what-is-a-cdn/'), mdn('Proxy servers and tunneling', 'Web/HTTP/Proxy_servers_and_tunneling'), mdn('HTTP caching', 'Web/HTTP/Caching'), HPBN],
});

const plMcqs: MCQ[] = [
  mcq({ ...q(PL), id: 'cn.pl.q1', type: 'concept', difficulty: 'easy', stem: 'Which proxy hides the identity and number of back-end servers from clients?', options: ['A reverse proxy', ['A forward proxy', 'A forward proxy hides clients from servers.'], ['A DNS resolver', 'Resolvers do not forward application traffic.'], ['A hub', 'A hub is a layer-1 repeater.']], answer: 0, explanation: 'Clients talk to the reverse proxy as if it were the site; it chooses the back end.' }),
  mcq({ ...q(PL), id: 'cn.pl.q2', type: 'concept', difficulty: 'medium', stem: 'You need to route `/api/*` to one service and `/images/*` to another on the same hostname. What kind of balancer is required?', options: ['A layer-7 (HTTP-aware) load balancer', ['A layer-4 load balancer', 'It sees only IPs and ports and cannot read the URL path.'], ['A layer-2 switch', 'Switches forward frames by MAC address.'], ['A NAT gateway', 'NAT rewrites addresses; it does not route by URL.']], answer: 0, explanation: 'Path-based routing needs the HTTP request, so the balancer must terminate the connection and parse it.' }),
  mcq({ ...q(PL), id: 'cn.pl.q3', type: 'concept', difficulty: 'medium', stem: 'Requests have very different durations (some uploads last minutes). Which algorithm spreads load best?', options: ['Least connections', ['Plain round robin', 'It ignores how busy each server is, so slow requests can pile up on one server.'], ['Random on IP only', 'It also ignores server load.'], ['Always the first server', 'That is no balancing.']], answer: 0, explanation: 'Counting active connections reflects actual load when request costs vary.' }),
  mcq({ ...q(PL), id: 'cn.pl.q4', type: 'complexity', difficulty: 'medium', stem: 'A cache cluster picks a server with `hash(key) mod 3`. A fourth server is added and the formula becomes `mod 4`. For keys 0 through 11 (hash = key), how many keys still map to the same server?', options: ['3 of 12 (25%)', ['9 of 12 (75%)', 'That is the share that moves, not the share that stays.'], ['6 of 12 (50%)', 'Check each key: key mod 3 equals key mod 4 only for keys 0, 1 and 2.'], ['12 of 12', 'Only a few keys keep their server.']], answer: 0, explanation: 'Keys 0, 1 and 2 are unchanged; the other nine move. Consistent hashing would move only about a quarter of the keys.' }),
  mcq({ ...q(PL), id: 'cn.pl.q5', type: 'concept', difficulty: 'easy', stem: 'Behind a reverse proxy, the application logs the proxy\'s IP for every request. Which header normally carries the real client IP?', options: ['`X-Forwarded-For`', ['`Host`', 'It names the requested site.'], ['`Content-Length`', 'It gives the body size.'], ['`Accept-Language`', 'It expresses language preference.']], answer: 0, explanation: 'The proxy appends the client address; the app must trust it only when it comes from its own proxies.' }),
  mcq({ ...q(PL), id: 'cn.pl.q6', type: 'concept', difficulty: 'medium', stem: 'What is the main drawback of sticky sessions?', options: ['Load can become uneven and a user\'s in-memory state is lost if their server fails', ['They disable HTTPS', 'Stickiness is independent of TLS.'], ['They stop the balancer checking health', 'Health checks still run.'], ['They require UDP', 'Stickiness works for TCP/HTTP.']], answer: 0, explanation: 'Prefer stateless servers with a shared session store so any server can handle any request.' }),
  mcq({ ...q(PL), id: 'cn.pl.q7', type: 'concept', difficulty: 'medium', stem: 'Why do deployments often name static files like `app.4f9c2.js` and serve them from a CDN with `Cache-Control: max-age=31536000, immutable`?', options: ['The content hash changes whenever the file changes, so a new deploy gets a new URL while old URLs stay cacheable forever', ['The hash encrypts the file', 'It is a fingerprint, not encryption.'], ['It disables browser caching', 'The header does the opposite.'], ['It makes DNS faster', 'DNS is unrelated.']], answer: 0, explanation: 'Immutable URLs allow very long caching without stale-content risk.' }),
  mcq({ ...q(PL), id: 'cn.pl.q8', type: 'concept', difficulty: 'hard', stem: 'Every health check calls `/healthz`, which queries the shared database. The database stalls for 20 seconds. What is the likely effect?', options: ['All instances fail their checks and are removed together, turning a database slowdown into a full outage', ['Only one instance is removed', 'All instances depend on the same database, so all fail.'], ['Nothing, the balancer ignores slow checks', 'A timeout counts as a failure.'], ['The CDN serves traffic instead of the origin', 'Dynamic traffic still needs the origin.']], answer: 0, explanation: 'Keep liveness checks shallow, and handle dependency failures with graceful degradation instead of ejecting every server.' }),
];

// ---------------------------------------------------------------------------------------
const SK = 'cn.sockets';
const sockets = cnTopic({
  id: SK, title: 'Sockets', level: 'advanced', estMinutes: 45, prerequisites: ['cn.tcp-lifecycle'], related: ['cn.flow-congestion', 'cn.tcp-udp', 'cn.troubleshooting'],
  summary: 'The socket API, blocking vs non-blocking I/O and select/epoll.',
  objectives: ['List the server and client call sequences for TCP sockets and map them to the TCP handshake and states.', 'Explain the listen backlog, the accept queue and why TCP is a byte stream (no message boundaries).', 'Compare blocking, thread-per-connection, non-blocking with select/poll/epoll, and event loops, and explain the C10K problem.', 'Explain level- vs edge-triggered readiness and why non-blocking I/O needs care with partial reads and writes.'],
  sections: [
    { id: 'api', kind: 'concept', title: 'The socket API', bodyMd: `A **socket** is an OS handle (a file descriptor on Unix) for one end of a communication channel, identified for TCP by the 5-tuple *(protocol, local IP, local port, remote IP, remote port)*.

| Step | Server (TCP) | Client (TCP) |
|---|---|---|
| 1 | \`socket()\` create | \`socket()\` create |
| 2 | \`bind()\` attach to a local IP:port | (optional; the OS picks an ephemeral port) |
| 3 | \`listen()\` mark as passive, set the backlog | |
| 4 | \`accept()\` blocks until a connection completes, returns a **new** socket for that client | \`connect()\` performs the 3-way handshake |
| 5 | \`recv()\` / \`send()\` | \`send()\` / \`recv()\` |
| 6 | \`close()\` (sends FIN) | \`close()\` |

- The **listening socket** only accepts; each accepted connection gets its own socket. One server port serves thousands of clients because the 5-tuples differ.
- The kernel completes handshakes itself. Finished connections wait in the **accept queue** (size bounded by \`listen(backlog)\` and \`net.core.somaxconn\`); half-open ones wait in the SYN queue. If the application is too slow to \`accept()\`, the queue fills and new connections are dropped or time out.
- **UDP** has no connection: \`socket(SOCK_DGRAM)\`, \`bind()\` on the server, then \`sendto()\` / \`recvfrom()\` with an address each time. One datagram in = one datagram out (message boundaries preserved).
- Common errors: **EADDRINUSE** (port already bound; set \`SO_REUSEADDR\` so a restarted server can bind while old connections are in TIME_WAIT), **ECONNREFUSED** (nothing listening: an RST came back), **ETIMEDOUT** (no answer), **EPIPE/ECONNRESET** (peer closed or reset).` },
    { id: 'stream', kind: 'concept', title: 'TCP is a byte stream', bodyMd: `\`send(100 bytes)\` twice does **not** guarantee two \`recv()\` calls of 100 bytes. TCP preserves order and content but **not message boundaries**: one \`recv\` may return half a message, or two and a half. A \`recv\` returning **0** means the peer closed its sending side (orderly FIN); **-1** is an error.

Protocols therefore frame their messages:
- **Length prefix** (4-byte length, then payload) is the most common for binary protocols,
- **delimiter** (\`\\r\\n\` in HTTP headers/SMTP, newline-delimited JSON),
- or a fixed size.

Always loop until the full message is read (or written: \`send\` may accept fewer bytes than requested), and handle byte order (**network byte order** is big-endian: \`htons/htonl\`).` },
    { id: 'io-models', kind: 'comparison', title: 'Handling many connections', bodyMd: `\`accept\`, \`recv\` and \`send\` **block** by default, which creates the scaling question: how do you serve many clients at once?

| Model | How | Trade-off |
|---|---|---|
| **Iterative** | Handle one client, then the next | Trivial; one slow client blocks all |
| **Process / thread per connection** | Fork or spawn a thread per \`accept\` | Easy to write; each thread costs stack memory and context switches, so it struggles beyond thousands of connections |
| **Thread pool** | Bounded workers take connections or requests | Caps resources; blocking calls still tie up threads |
| **Non-blocking + readiness notification** | One (or a few) thread(s) wait for *which sockets are ready*, then read/write without blocking | Scales to 100k+ idle connections; code is event-driven and more intricate |

**The C10K problem** (handling 10,000 concurrent connections) drove the move from thread-per-connection to event-driven servers (Nginx, Node.js, Redis, Netty).

**Readiness APIs on Linux:**
- \`select()\`: pass a bitmap of descriptors; limited to \`FD_SETSIZE\` (1024) and **O(n)** per call because the kernel and the app both scan the set.
- \`poll()\`: array of descriptors, no fixed limit, still O(n) per call.
- **\`epoll\`**: register descriptors once (\`epoll_ctl\`); \`epoll_wait\` returns **only the ready ones**, so the cost scales with active, not total, connections. (BSD/macOS: \`kqueue\`; Windows: IOCP; newer Linux: \`io_uring\`.)

**Level- vs edge-triggered epoll:** level-triggered reports a socket *as long as* data remains unread (forgiving); edge-triggered reports only on *new* data arriving, so you must read until \`EAGAIN\` or you will stall.

With a **non-blocking** socket, calls that would block return \`EAGAIN/EWOULDBLOCK\` immediately. An event loop must therefore keep **per-connection buffers and state machines** for partial reads and writes, and avoid long CPU work or blocking calls inside the loop (they stall every client).` },
    { id: 'code', kind: 'code', title: 'A TCP echo server and client (Python)', bodyMd: 'The same call sequence as in C, with Python\'s thin `socket` wrapper. `sendall` loops until all bytes are sent; the server handles one client at a time (iterative).', code: [{ lang: 'python', label: 'echo_server.py', code: `import socket

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as srv:
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)  # rebind during TIME_WAIT
    srv.bind(("127.0.0.1", 9000))
    srv.listen(128)                      # backlog of completed connections
    while True:
        conn, addr = srv.accept()        # blocks; returns a NEW socket
        with conn:
            while True:
                data = conn.recv(4096)   # may return any number of bytes
                if not data:             # b"" means the peer sent FIN
                    break
                conn.sendall(data)       # loop until everything is sent` }, { lang: 'python', label: 'echo_client.py', code: `import socket

with socket.create_connection(("127.0.0.1", 9000)) as s:   # socket + connect
    s.sendall(b"hello")
    print(s.recv(4096))                  # b'hello'` }, { lang: 'python', label: 'Non-blocking server with selectors (epoll on Linux)', code: `import selectors, socket

sel = selectors.DefaultSelector()        # epoll / kqueue / select, chosen by the OS
srv = socket.socket()
srv.bind(("127.0.0.1", 9000)); srv.listen(); srv.setblocking(False)
sel.register(srv, selectors.EVENT_READ)

while True:
    for key, _ in sel.select():          # wait until some socket is ready
        sock = key.fileobj
        if sock is srv:
            conn, _ = srv.accept(); conn.setblocking(False)
            sel.register(conn, selectors.EVENT_READ)
        else:
            data = sock.recv(4096)
            if data: sock.send(data)     # a real server buffers partial writes
            else: sel.unregister(sock); sock.close()` }] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Assuming one \`send\` equals one \`recv\` on TCP.
2. Ignoring the return value of \`send\`/\`write\` (partial writes) and \`recv\` returning 0.
3. Forgetting \`SO_REUSEADDR\`, then hitting "Address already in use" after a restart.
4. Doing blocking work (disk, DNS, heavy CPU) inside an event loop.
5. Using edge-triggered epoll without reading until EAGAIN.
6. Saying a server needs one port per client (the 5-tuple distinguishes clients).
7. Ignoring byte order when sending integers.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Walk me through the socket calls for a TCP server and client.', answerMd: 'Server: socket, bind to an address and port, listen with a backlog, then accept in a loop; each accept returns a new connected socket on which it recv and send before closing. Client: socket then connect, which triggers the three-way handshake, then send and recv and close. The kernel completes handshakes and queues finished connections until accept takes them.' },
    { id: 'iq2', q: 'Why does TCP need message framing?', answerMd: 'TCP is a byte stream: it guarantees order and delivery but not boundaries, so one recv can return part of a message or several messages. Applications add framing such as a length prefix or delimiters and loop until a whole message has been read.' },
    { id: 'iq3', q: 'How does a server handle 100,000 concurrent connections?', answerMd: 'Not with a thread per connection. It uses non-blocking sockets and an event loop on epoll (kqueue, IOCP) so one or a few threads handle only the sockets that are ready, with per-connection buffers and state, plus multiple loop threads or processes to use all cores. Memory per connection, file descriptor limits and kernel buffer tuning matter too.' },
    { id: 'iq4', q: 'select vs poll vs epoll?', answerMd: 'select and poll take the whole descriptor set on every call and the kernel scans it, so cost is O(n) in total connections (select is also capped at FD_SETSIZE). epoll registers interest once and returns only ready descriptors, so cost grows with active connections, which is why it suits servers with many mostly idle connections.' },
    { id: 'iq5', q: 'What happens if the server calls accept too slowly?', answerMd: 'Completed connections queue up in the accept queue, bounded by the listen backlog and the system limit. Once it is full, further handshakes are dropped or the final ACK is ignored, so clients see timeouts or retransmitted SYNs. Fix by accepting faster (dedicated accept thread, multiple accepts per wake-up), raising the backlog, or adding capacity.' },
  ],
  revision: { notesMd: `- Server: socket → bind → listen → accept (new socket per client) → recv/send → close. Client: socket → connect.
- TCP socket = 5-tuple; one listening port serves many clients. accept queue bounded by backlog / somaxconn.
- TCP is a byte stream: frame messages (length prefix / delimiter); recv()==0 means FIN; handle partial send/recv.
- Errors: EADDRINUSE (use SO_REUSEADDR), ECONNREFUSED (RST), ETIMEDOUT, ECONNRESET.
- Scaling: thread-per-connection → thread pool → non-blocking + select/poll/epoll event loop (C10K).
- epoll: register once, returns only ready fds; edge-triggered needs read-until-EAGAIN.`, flashcards: [
    { id: 'f1', front: 'Order of server-side socket calls?', backMd: 'socket, bind, listen, accept, recv/send, close.' },
    { id: 'f2', front: 'What does accept() return?', backMd: 'A new connected socket for that client; the listening socket stays open.' },
    { id: 'f3', front: 'recv() returns 0 on TCP. Meaning?', backMd: 'The peer closed its side (FIN received).' },
    { id: 'f4', front: 'Why is epoll faster than select for many idle connections?', backMd: 'It returns only ready descriptors instead of scanning all of them each call.' },
    { id: 'f5', front: 'What is SO_REUSEADDR for?', backMd: 'Lets a restarted server bind its port even though old connections are in TIME_WAIT.' },
    { id: 'f6', front: 'Network byte order?', backMd: 'Big-endian (use htons/htonl).' },
  ] },
  resources: [{ title: "Beej's Guide to Network Programming", url: 'https://beej.us/guide/bgnet/', kind: 'book' }, { title: 'Python docs: Socket Programming HOWTO', url: 'https://docs.python.org/3/howto/sockets.html', kind: 'official-docs' }, { title: 'The C10K problem (Wikipedia)', url: 'https://en.wikipedia.org/wiki/C10k_problem', kind: 'article' }],
});

const skMcqs: MCQ[] = [
  mcq({ ...q(SK), id: 'cn.sk.q1', type: 'concept', difficulty: 'easy', stem: 'What is the correct order of calls for a TCP server?', options: ['socket, bind, listen, accept', ['socket, connect, listen, accept', '`connect` is a client call.'], ['bind, socket, accept, listen', 'A socket must exist before it can be bound, and `listen` comes before `accept`.'], ['socket, listen, bind, accept', '`bind` assigns the address before `listen`.']], answer: 0, explanation: 'Create the socket, give it an address, mark it passive, then take connections.' }),
  mcq({ ...q(SK), id: 'cn.sk.q2', type: 'concept', difficulty: 'easy', stem: 'A TCP server\'s `accept()` returns. Which socket should it use to talk to that client?', options: ['The newly returned connected socket', ['The listening socket', 'The listening socket only accepts new connections.'], ['A new UDP socket', 'The connection is TCP.'], ['Either; they are identical', 'They have different roles.']], answer: 0, explanation: 'Each client gets its own socket, which is how one port serves many clients.' }),
  mcq({ ...q(SK), id: 'cn.sk.q3', type: 'concept', difficulty: 'medium', stem: 'A client calls `send()` with two separate 100-byte messages. The server\'s first `recv(4096)` returns 200 bytes. Why?', options: ['TCP is a byte stream with no message boundaries, so data can be coalesced', ['The server has a bug in `recv`', '`recv` is behaving correctly.'], ['TCP always merges exactly two sends', 'Segmentation depends on timing, buffering and MSS; nothing is guaranteed.'], ['The client used UDP', 'UDP preserves datagram boundaries.']], answer: 0, explanation: 'Applications must frame messages themselves, for example with a length prefix.' }),
  mcq({ ...q(SK), id: 'cn.sk.q4', type: 'concept', difficulty: 'medium', stem: 'You restart a server and `bind()` fails with "Address already in use" although the old process is gone. What is the usual fix?', options: ['Set `SO_REUSEADDR` before `bind()`', ['Use a different protocol', 'The problem is a lingering TIME_WAIT socket on the port.'], ['Call `listen` twice', 'That does not affect `bind`.'], ['Reboot the machine', 'Unnecessary; waiting for TIME_WAIT or setting the option fixes it.']], answer: 0, explanation: 'Connections left in TIME_WAIT hold the local port; SO_REUSEADDR allows rebinding.' }),
  mcq({ ...q(SK), id: 'cn.sk.q5', type: 'concept', difficulty: 'medium', stem: 'A client\'s `connect()` fails immediately with ECONNREFUSED. What does this mean?', options: ['The host replied with a TCP RST: nothing is listening on that port', ['A firewall silently dropped the SYN', 'A silent drop produces a timeout, not an immediate refusal.'], ['The DNS lookup failed', 'That gives a name-resolution error before any connect.'], ['The server\'s accept queue is full', 'That usually shows up as a timeout.']], answer: 0, explanation: 'Refused = an active rejection (RST); timeout = no answer at all.' }),
  mcq({ ...q(SK), id: 'cn.sk.q6', type: 'concept', difficulty: 'medium', stem: 'Why can `epoll` handle 100,000 mostly idle connections better than `select`?', options: ['`epoll_wait` returns only the ready descriptors, instead of scanning every registered one on each call', ['It uses UDP internally', 'epoll is an OS readiness API, unrelated to the transport.'], ['It creates one thread per connection', 'That is the opposite of its purpose.'], ['It compresses data', 'It does no data processing.']], answer: 0, explanation: 'Cost scales with active connections, not total connections; `select` is O(n) per call and capped by FD_SETSIZE.' }),
  mcq({ ...q(SK), id: 'cn.sk.q7', type: 'concept', difficulty: 'hard', stem: 'With edge-triggered `epoll`, a handler reads only 1 KB from a socket that has 10 KB waiting and then returns to `epoll_wait`. What happens?', options: ['The remaining data is not reported again until new data arrives, so the connection can stall', ['epoll reports the socket again immediately', 'That is level-triggered behaviour.'], ['The kernel discards the extra 9 KB', 'It stays in the socket buffer.'], ['The socket is closed', 'Nothing closes the socket.']], answer: 0, explanation: 'With edge-triggered mode, read (and accept) in a loop until EAGAIN.' }),
  mcq({ ...q(SK), id: 'cn.sk.q8', type: 'concept', difficulty: 'medium', stem: 'Why does a thread-per-connection server struggle with tens of thousands of mostly idle clients?', options: ['Every thread consumes stack memory and scheduler work even while waiting on a blocking `recv`', ['Threads cannot call `recv`', 'They can; that is how the model works.'], ['TCP forbids more than 1,000 connections per port', 'The 5-tuple allows far more.'], ['Threads make connections UDP', 'The transport is unaffected.']], answer: 0, explanation: 'This is the C10K problem and the motivation for event-driven servers.' }),
];

// ---------------------------------------------------------------------------------------
const TR = 'cn.troubleshooting';
const trouble = cnTopic({
  id: TR, title: 'Network Troubleshooting', level: 'core', estMinutes: 50, prerequisites: ['cn.dns', 'cn.tcp-lifecycle'], related: ['cn.arp-icmp-dhcp', 'cn.routing-switching', 'cn.http', 'cn.tls-https'],
  summary: 'ping, traceroute, dig, curl -v and ss in realistic scenarios.',
  objectives: ['Follow a layered method (link, IP, DNS, TCP, TLS, HTTP) to localise a fault.', 'Use ping, traceroute, dig, curl -v, nc and ss, and read their output.', 'Tell connection refused, timeout, reset and TLS failures apart, and map each to a likely cause.', 'Break a slow request into DNS, connect, TLS, first-byte and transfer time with curl.'],
  sections: [
    { id: 'method', kind: 'concept', title: 'A layered method', bodyMd: `Work **bottom-up** (or bisect), changing one thing at a time, and ask *what is the smallest test that separates two hypotheses?*

| Step | Question | Tool |
|---|---|---|
| 1. Link | Do I have an interface, a cable or Wi-Fi association, an IP and gateway? | \`ip addr\`, \`ip route\`, \`ip neigh\` |
| 2. IP | Can I reach the gateway, then an outside **IP address**? | \`ping 192.168.1.1\`, \`ping 8.8.8.8\`, \`traceroute\`/\`mtr\` |
| 3. DNS | Does the **name** resolve, to the right address, from the right server? | \`dig\`, \`nslookup\` |
| 4. TCP | Does a connection to that port open? Is something listening? | \`nc -vz host 443\`, \`curl -v\`, \`ss -tlnp\` |
| 5. TLS | Is the certificate valid for this name, and the chain complete? | \`curl -v\`, \`openssl s_client -connect host:443 -servername host\` |
| 6. HTTP | What status and headers come back? Which backend answered? | \`curl -i\`, logs |

Quick splits: *ping by IP works but by name fails → DNS.* *Name resolves but connect hangs → routing/firewall.* *Connects but the page is wrong → application.*

Always compare with a **known-good vantage point** (another machine, another network, or from the server itself) to decide whether the fault is client-side, in the path, or server-side.` },
    { id: 'tools', kind: 'concept', title: 'The core tools', bodyMd: `- **ping** sends ICMP echo. A reply proves IP reachability both ways and gives RTT and loss. *No reply does not prove the host is down*: ICMP is often filtered. Check TTL, loss % and RTT variation.
- **traceroute / tracepath / mtr** (Windows: \`tracert\`) lists routers by incrementing TTL. A \`* * *\` hop is usually a router that does not answer probes, not necessarily a fault; what matters is whether the trace reaches the destination, and where latency or loss *starts and persists* in later hops.
- **dig** queries DNS directly: \`dig example.com A +short\`, \`dig @1.1.1.1 example.com\` (ask a specific resolver), \`dig +trace example.com\` (walk root → TLD → authoritative), \`dig -x 8.8.8.8\` (reverse). Read the status (**NOERROR**, **NXDOMAIN** = does not exist, **SERVFAIL** = resolver could not get an answer), the answer TTL and the \`AA\` flag. \`nslookup\` / \`Resolve-DnsName\` are the Windows equivalents.
- **curl** drives HTTP(S): \`-v\` shows DNS, TCP, TLS and headers; \`-I\` HEAD only; \`--resolve host:443:IP\` forces an address (test one backend); \`-w\` prints timings; \`--max-time\` and \`--connect-timeout\` bound the wait.
- **nc** (netcat) or \`Test-NetConnection host -Port 443\` tests a raw TCP connection without HTTP or TLS in the way.
- **ss -tlnp** (modern \`netstat\`) lists listeners and the owning process; \`ss -tan\` shows connection states; \`ss -s\` summarises (many TIME_WAIT, CLOSE_WAIT or SYN-RECV entries tell a story).
- **tcpdump / Wireshark** capture packets as the last resort: \`sudo tcpdump -i any -nn host 10.0.0.5 and port 443\`. See SYNs with no SYN-ACK (drop), an RST (refused/closed), or retransmissions (loss).` },
    { id: 'symptoms', kind: 'comparison', title: 'Reading the symptom', bodyMd: `| Symptom | What it means | Likely causes |
|---|---|---|
| **NXDOMAIN** | The name does not exist | Typo, record missing, wrong zone/search domain |
| **SERVFAIL** / DNS timeout | Resolver could not answer | Broken DNSSEC, dead upstream, blocked UDP/TCP 53 |
| **Connection refused** (immediate) | Host answered with RST: nothing listens on that port | Service down, wrong port, bound to 127.0.0.1 only |
| **Connection timed out** | No answer to SYN | Firewall/security group *drop*, wrong IP, route or NAT problem, host down |
| **Connection reset** (mid-stream) | Peer or middlebox sent RST | App crash, idle-timeout in a load balancer or NAT, proxy limits |
| **TLS handshake / certificate error** | Cert mismatch, expired, incomplete chain, wrong SNI, protocol or cipher mismatch, or clock skew | Check with \`openssl s_client\` and dates |
| **502 Bad Gateway** | Proxy got an invalid reply or could not reach the upstream | Upstream crashed or refused |
| **503 Service Unavailable** | No healthy upstream, overloaded or in maintenance | All health checks failing, capacity |
| **504 Gateway Timeout** | Upstream too slow | Slow query, a dependency, a proxy timeout lower than the work time |
| **Slow but working** | Time is going somewhere specific | Use \`curl -w\` to find which phase |` },
    { id: 'drills', kind: 'example', title: 'Scenario drills', bodyMd: `**Drill 1: "The site is down for me only."** \`ping 8.8.8.8\` works, \`ping example.com\` says *unknown host*. → IP is fine, **DNS** is broken. \`dig example.com @8.8.8.8\` works → your configured resolver is the problem (check \`/etc/resolv.conf\`, DHCP-provided DNS, VPN).

**Drill 2: "Deploy done but the API times out."** \`dig\` returns the right IP; \`nc -vz api.example.com 443\` hangs. → name fine, packets do not arrive: **security group/firewall or routing**. Compare \`nc\` from inside the VPC; if it connects there, an inbound rule is missing.

**Drill 3: "Connection refused on port 8080."** The host is reachable (\`nc\` gets an immediate RST). On the server, \`ss -tlnp | grep 8080\` shows nothing → **the service is not running**; if it shows \`127.0.0.1:8080\`, it listens on loopback only and must bind \`0.0.0.0\`.

**Drill 4: "Page loads in 8 seconds."** \`curl -o /dev/null -s -w 'dns %{time_namelookup} connect %{time_connect} tls %{time_appconnect} ttfb %{time_starttransfer} total %{time_total}\\n' https://example.com\` prints cumulative times: if *ttfb* jumps by ~7 s the back end is slow; if *dns* is 5 s, the resolver is; if *connect* is slow, suspect distance or packet loss.

**Drill 5: "Works with the IP, certificate error with the name."** \`curl -v https://203.0.113.5\` shows a name mismatch because the cert is issued to \`example.com\`. Use \`curl --resolve example.com:443:203.0.113.5 https://example.com\` to test that exact server with the right name and SNI.

**Drill 6: "Thousands of CLOSE_WAIT sockets."** \`ss -tan state close-wait | wc -l\` is huge: the remote closed, but **our application never called close()**: a connection/file-descriptor leak, not a network problem. (Many **TIME_WAIT** sockets on the side that closes first is normal.)` },
    { id: 'commands', kind: 'example', title: 'Command cheat sheet', bodyMd: 'Linux/macOS commands; PowerShell equivalents are in comments.', code: [sh(`ip addr; ip route                     # my address and default gateway   (ipconfig /all, route print)
ping -c 4 1.1.1.1                      # IP reachability, RTT, loss
mtr -rwc 20 example.com                # traceroute + loss per hop        (tracert example.com)
dig example.com A +short               # what does DNS say?               (Resolve-DnsName example.com)
dig @8.8.8.8 example.com               # ask a specific resolver
dig +trace example.com                 # follow delegation from the root
nc -vz example.com 443                 # can I open the TCP port?          (Test-NetConnection example.com -Port 443)
curl -sv -o /dev/null https://example.com    # DNS, connect, TLS, headers
curl -I --resolve example.com:443:203.0.113.5 https://example.com
openssl s_client -connect example.com:443 -servername example.com </dev/null | openssl x509 -noout -dates -subject
ss -tlnp                               # who is listening on which port?   (netstat -ano)
ss -tan state established | wc -l      # connection counts by state
sudo tcpdump -i any -nn 'port 53'      # watch DNS queries on the wire`, 'Troubleshooting toolkit')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Treating "ping fails" as "host down" (ICMP may be blocked while TCP works).
2. Reading \`* * *\` hops in traceroute as the failure point.
3. Testing a hostname when the question is about connectivity (or the reverse), so DNS and network problems get mixed up.
4. Confusing *refused* (RST, quick) with *timeout* (silence), which point to opposite causes.
5. Forgetting local caches (browser, OS, \`systemd-resolved\`) and negative DNS caching when a record has just changed.
6. Changing several things at once, so you cannot tell which one fixed it.
7. Testing only from your laptop, not from the failing machine's own vantage point.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'A user says "the website is not working". How do you troubleshoot?', answerMd: 'Clarify scope first (one user or all, one site or all, since when, what error). Then go layer by layer: local network config and gateway ping, an outside IP ping, DNS resolution of the name, TCP connect to the port, TLS handshake and certificate, and finally the HTTP response and server logs. Compare with another machine or network to decide whether the fault is the client, the path or the server.' },
    { id: 'iq2', q: 'What is the difference between "connection refused" and "connection timed out"?', answerMd: 'Refused means the host is reachable and replied with a TCP RST: no process is listening on that port (or something actively rejects it). Timed out means no reply at all, usually a firewall or security group silently dropping packets, a routing problem, or a dead host.' },
    { id: 'iq3', q: 'ping works, but the website does not load. What next?', answerMd: 'IP connectivity is fine, so test the layers above: does the name resolve to the right IP (dig), does the TCP port open (nc or curl -v), is there a TLS error, and what does the HTTP response say (curl -i)? The fault could be a firewall on that port, the service being down, a certificate problem, or an application error.' },
    { id: 'iq4', q: 'How do you find where a slow request spends its time?', answerMd: 'Use curl with -w to print cumulative timings: name lookup, TCP connect, TLS handshake, time to first byte and total. The jump between consecutive values shows the guilty phase: DNS, network distance/loss, TLS setup, server processing, or transfer. Then dig deeper with traces, server logs or tcpdump.' },
    { id: 'iq5', q: 'What do 502, 503 and 504 mean?', answerMd: '502: a gateway or proxy received an invalid response or could not connect to the upstream. 503: the service is unavailable (overloaded, no healthy backends, or in maintenance). 504: the proxy waited too long for the upstream. They all point past the proxy to the back end.' },
  ],
  revision: { notesMd: `- Method: link → IP → DNS → TCP → TLS → HTTP; change one thing; compare vantage points.
- ping by IP ok + by name fails → DNS. Name ok + connect hangs → firewall/route. Refused = RST (no listener); timeout = silence (drop).
- dig: NOERROR / NXDOMAIN / SERVFAIL; @server, +trace, +short. curl: -v, -I, --resolve, -w timings.
- ss -tlnp (listeners), ss -tan (states). CLOSE_WAIT piling up = app not closing; TIME_WAIT is normal.
- 502 bad upstream reply, 503 unavailable, 504 upstream timeout.
- ICMP can be filtered; \`* * *\` in traceroute is not necessarily a fault.`, flashcards: [
    { id: 'f1', front: 'Refused vs timed out?', backMd: 'Refused: immediate RST, nothing listening. Timed out: no answer, usually a firewall drop or routing problem.' },
    { id: 'f2', front: 'ping IP works, ping name fails. Layer?', backMd: 'DNS.' },
    { id: 'f3', front: 'Command to test one backend with the right Host/SNI?', backMd: 'curl --resolve host:443:IP https://host' },
    { id: 'f4', front: 'dig status for a name that does not exist?', backMd: 'NXDOMAIN.' },
    { id: 'f5', front: 'Many sockets in CLOSE_WAIT mean what?', backMd: 'The peer closed but the local application has not called close(): a leak in the app.' },
    { id: 'f6', front: 'What does 504 mean?', backMd: 'The gateway/proxy timed out waiting for the upstream.' },
  ] },
  resources: [mdn('HTTP response status codes', 'Web/HTTP/Status'), { title: 'curl man page (--write-out timing variables)', url: 'https://curl.se/docs/manpage.html', kind: 'official-docs' }, { title: 'BIND dig manual (ISC)', url: 'https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility', kind: 'official-docs' }, MDN_HTTP],
});

const trMcqs: MCQ[] = [
  mcq({ ...q(TR), id: 'cn.tr.q1', type: 'concept', difficulty: 'easy', stem: '`ping 8.8.8.8` succeeds but `ping example.com` reports "unknown host". Where is the problem?', options: ['DNS resolution', ['The physical cable', 'If the cable were bad, pinging an IP would fail too.'], ['The default gateway', 'The gateway works, since the IP ping succeeded.'], ['TCP congestion control', 'No TCP connection is involved in the failure.']], answer: 0, explanation: 'IP reachability is fine; only name resolution fails, so check the resolver configuration (`resolv.conf`, DHCP DNS, VPN).' }),
  mcq({ ...q(TR), id: 'cn.tr.q2', type: 'concept', difficulty: 'medium', stem: '`nc -vz api.example.com 443` fails after ~30 seconds with no message from the host, though `dig` returns the correct IP. Most likely cause?', options: ['A firewall or security group silently dropping the SYN packets', ['No process is listening on port 443', 'That would produce an immediate "connection refused" (RST).'], ['The domain does not exist', 'DNS resolved fine.'], ['The certificate has expired', 'No TLS handshake has happened at this point.']], answer: 0, explanation: 'Silence means drops: check security groups, network ACLs, host firewall and routing. A closed port answers quickly with an RST.' }),
  mcq({ ...q(TR), id: 'cn.tr.q3', type: 'concept', difficulty: 'medium', stem: 'On the server, `ss -tlnp` shows the service as `127.0.0.1:8080`. Remote clients get "connection refused". Why?', options: ['It listens only on the loopback interface; it must bind `0.0.0.0` (or the public interface)', ['Port 8080 is reserved', 'It is not reserved; the issue is the bind address.'], ['The kernel blocks ports above 1024', 'Unprivileged ports are fine.'], ['TLS is disabled', 'TLS is irrelevant to the refusal.']], answer: 0, explanation: 'Loopback-bound sockets are unreachable from other hosts, so remote SYNs get an RST.' }),
  mcq({ ...q(TR), id: 'cn.tr.q4', type: 'complexity', difficulty: 'medium', stem: 'A `curl -w` run prints cumulative times: `namelookup 0.012  connect 0.045  appconnect 0.110  starttransfer 2.350  total 2.400`. Where does the time go?', options: ['Server processing: about 2.2 s between TLS completion and the first response byte', ['DNS resolution', 'Name lookup took only 12 ms.'], ['TLS handshake', 'It took about 65 ms (0.110 − 0.045).'], ['Downloading the body', 'Transfer took about 50 ms (2.400 − 2.350).']], answer: 0, explanation: 'Differences of the cumulative values: TLS 0.065 s, wait for first byte 2.240 s, transfer 0.050 s, so the back end is slow.' }),
  mcq({ ...q(TR), id: 'cn.tr.q5', type: 'concept', difficulty: 'medium', stem: 'A browser reaches your site through a reverse proxy and shows 504 Gateway Timeout. What does this indicate?', options: ['The proxy connected to the upstream but did not get a response in time', ['The client\'s DNS server is down', 'The browser reached the proxy, so DNS worked.'], ['The client\'s password was wrong', 'That would be 401.'], ['The proxy has no route to the client', 'The proxy returned a response, so the client path works.']], answer: 0, explanation: '504 = upstream too slow. 502 = bad or no upstream reply. 503 = unavailable or no healthy backends.' }),
  mcq({ ...q(TR), id: 'cn.tr.q6', type: 'concept', difficulty: 'hard', stem: 'A server shows thousands of connections in CLOSE_WAIT. What does that suggest?', options: ['The remote side closed, but the local application is not calling close() on its sockets (a leak)', ['The network is losing packets', 'Loss would show as retransmissions, not CLOSE_WAIT.'], ['The local machine is waiting 2×MSL to be safe', 'That is TIME_WAIT.'], ['The firewall is blocking FIN packets', 'CLOSE_WAIT means a FIN was received.']], answer: 0, explanation: 'CLOSE_WAIT is entered after receiving a FIN and persists until the local app closes its end.' }),
  mcq({ ...q(TR), id: 'cn.tr.q7', type: 'concept', difficulty: 'medium', stem: 'In `traceroute` output, hop 6 shows `* * *` but hops 7–10 respond normally and the destination is reached. What is the best interpretation?', options: ['Hop 6 likely does not answer probes (rate-limited or filtered); it is not necessarily a fault', ['The path is broken at hop 6', 'Later hops responded, so traffic passed through hop 6.'], ['The destination is down', 'The destination was reached.'], ['The TTL is too high', 'TTL is increased by traceroute itself.']], answer: 0, explanation: 'Look for a hop where latency or loss starts and continues to the end, rather than isolated silent hops.' }),
  mcq({ ...q(TR), id: 'cn.tr.q8', type: 'concept', difficulty: 'medium', stem: 'You want to test one specific backend (203.0.113.5) of `https://example.com` with the correct hostname and SNI. Which command is best?', options: ['`curl --resolve example.com:443:203.0.113.5 https://example.com`', ['`curl https://203.0.113.5`', 'This uses the IP as the name, so the certificate and virtual host will not match.'], ['`ping 203.0.113.5`', 'Ping tests ICMP reachability, not the HTTPS service.'], ['`dig example.com`', 'That queries DNS only.']], answer: 0, explanation: '`--resolve` overrides DNS for that name while keeping the Host header and SNI intact.' }),
];

export const topics: Topic[] = [sessions, rest, proxies, sockets, trouble];
export const mcqs: MCQ[] = [...saMcqs, ...rpMcqs, ...plMcqs, ...skMcqs, ...trMcqs];
