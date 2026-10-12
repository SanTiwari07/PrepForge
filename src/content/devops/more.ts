import type { MCQ, Resource, Topic } from '../schema';
import { mcq } from '../helpers';
import { dTopic, hcl, q, sh, yaml } from './common';

// DevOps batch 2: Linux networking, CI/CD, AWS, observability for operators, cloud security,
// advanced Kubernetes and Terraform. Numeric answers (CIDR sizes, HPA and rolling-update
// arithmetic, rate() maths, durability) are recomputed in tests/devops-facts.test.ts.

const doc = (title: string, url: string): Resource => ({ title, url, kind: 'official-docs' });

// ---------------------------------------------------------------------------------------
const LN = 'devops.linux-networking';
const linuxNet = dTopic({
  id: LN, title: 'Linux Networking Commands', level: 'core', estMinutes: 45, prerequisites: ['devops.linux'], related: ['cn.troubleshooting', 'cn.nat-firewalls', 'devops.docker'],
  summary: 'ip, ss, curl, dig, ping and traceroute.',
  objectives: ['Inspect interfaces, addresses, routes and neighbours with the `ip` tool and read the output.', 'List listeners and connections with `ss`, and map a port to a process.', 'Test DNS, TCP, TLS and HTTP separately with dig, nc, openssl and curl.', 'Explain how Linux (iptables/nftables, bridges, namespaces) underlies firewalls and container networking.'],
  sections: [
    { id: 'ip', kind: 'concept', title: 'Interfaces, addresses and routes', bodyMd: `The modern tool is **\`ip\`** (iproute2), which replaces \`ifconfig\`, \`route\` and \`arp\`.

\`\`\`
ip -br addr             # brief: interface, state, addresses  (eth0  UP  10.0.1.15/24)
ip route                # routing table: "default via 10.0.1.1 dev eth0" = the default gateway
ip route get 8.8.8.8    # which route and source address would be used for this destination?
ip neigh                # ARP/neighbour cache (IP → MAC)
ip link                 # layer-2 view: state, MTU, MAC
\`\`\`

Reading it:
- \`10.0.1.15/24\` is the host address plus prefix length: its subnet is \`10.0.1.0/24\`, so a destination inside it goes **directly**; anything else goes to the **default gateway** (longest-prefix match).
- **MTU** is normally 1500 on Ethernet; tunnels and overlays (VPN, VXLAN, Docker overlay) reduce it, and a mismatch shows up as "small requests work, large ones hang".
- **\`lo\`** is the loopback (127.0.0.1): a service bound only there is unreachable from other hosts.
- Names: \`/etc/hosts\` (static), \`/etc/resolv.conf\` or \`resolvectl status\` (the configured DNS servers and search domains), and \`/etc/nsswitch.conf\` (lookup order).` },
    { id: 'ss', kind: 'concept', title: 'Sockets, ports and processes', bodyMd: `**\`ss\`** (replaces \`netstat\`) lists sockets from the kernel.

\`\`\`
ss -tlnp              # TCP, Listening, Numeric ports, show Process  → who owns :8080?
ss -tanp state established
ss -s                 # summary counts by state (a pile of TIME_WAIT / CLOSE_WAIT stands out)
ss -tn dst 10.0.2.20  # connections to one peer
lsof -i :8080         # alternative: which process has the port open
\`\`\`

- \`LISTEN 0 4096 0.0.0.0:80\` listens on all interfaces; \`127.0.0.1:5432\` only locally; \`[::]:80\` is IPv6 (usually dual-stack).
- The **Recv-Q/Send-Q** columns show backlog for listeners (accept queue vs its limit) and unread/unacked bytes for connections.
- States: ESTABLISHED, TIME_WAIT (normal after active close), CLOSE_WAIT (peer closed; **your app has not**), SYN-SENT (no answer yet), SYN-RECV (half-open: many suggests a SYN flood or a full accept queue).
- Ports below 1024 need root (or \`CAP_NET_BIND_SERVICE\`); the ephemeral range is in \`/proc/sys/net/ipv4/ip_local_port_range\` (default 32768–60999, so about 28k outbound connections per destination IP:port pair).` },
    { id: 'tools', kind: 'concept', title: 'Testing each layer', bodyMd: `| Layer | Command | What it proves |
|---|---|---|
| Reachability | \`ping -c 3 host\`, \`mtr host\`, \`traceroute -n host\` | ICMP path and loss (may be filtered) |
| DNS | \`dig +short host\`, \`dig @1.1.1.1 host\`, \`dig +trace host\`, \`getent hosts host\` | what names resolve to, and whether the *system* resolver agrees (\`getent\` uses nsswitch) |
| TCP | \`nc -vz host 443\`, \`timeout 3 bash -c '</dev/tcp/host/443'\` | the port accepts connections (refused vs timeout) |
| TLS | \`openssl s_client -connect host:443 -servername host\` | certificate chain, expiry, protocol, SNI |
| HTTP | \`curl -sv -o /dev/null https://host\`, \`curl -w '%{time_connect} %{time_starttransfer}\\n'\` | status, headers, redirects and timings |
| Packets | \`sudo tcpdump -i any -nn port 53 or host 10.0.2.20\` | what is really on the wire |

**SSH tunnels** (also a networking tool): \`ssh -L 5433:db.internal:5432 bastion\` forwards local port 5433 to the private database through a bastion host (local forward); \`ssh -R\` exposes a local port remotely; \`ssh -D 1080\` makes a SOCKS proxy.` },
    { id: 'firewall', kind: 'concept', title: 'Firewalls, NAT and container networking', bodyMd: `Linux filtering and NAT live in the kernel's **netfilter**, managed by **iptables** (legacy), **nftables** (modern) or friendlier wrappers (\`ufw\`, \`firewalld\`).

\`\`\`
sudo iptables -L -n -v                     # filter rules (INPUT / FORWARD / OUTPUT)
sudo iptables -t nat -L -n -v              # NAT table (PREROUTING / POSTROUTING)
sudo ufw allow 22/tcp && sudo ufw enable   # simple host firewall
sudo sysctl net.ipv4.ip_forward            # 1 = the host routes packets between interfaces
\`\`\`

- Rules are matched **top to bottom**, first match wins; the chain has a **default policy** (DROP/ACCEPT). Allow established/related traffic first (stateful, via conntrack), then specific services.
- **SNAT/MASQUERADE** rewrites the source of outgoing packets (private → public); **DNAT** rewrites the destination (port forwarding, Kubernetes Services).
- **Container networking:** each container gets its own **network namespace** with a virtual Ethernet pair (**veth**) attached to a **bridge** (Docker's \`docker0\`, default subnet **172.17.0.0/16**). Docker adds iptables NAT rules so containers reach the Internet (MASQUERADE) and published ports (\`-p 8080:80\`) are DNAT-ed to the container. Kubernetes CNI plugins (Calico, Cilium, Flannel) wire pods similarly, with overlays or routed networking.
- Debug "works from the host, not from the container": check \`ip route\` and DNS inside the namespace (\`docker exec … cat /etc/resolv.conf\`), \`ip_forward\`, firewall rules and the bridge.` },
    { id: 'drill', kind: 'example', title: 'Scenario drill: "the service is up but nobody can connect"', bodyMd: 'A walk through the commands in order.', code: [sh(`# On the server
ss -tlnp | grep 8080          # LISTEN 127.0.0.1:8080 → bound to loopback only; must listen on 0.0.0.0
curl -sI http://127.0.0.1:8080/health   # works locally → the app is fine
sudo iptables -L INPUT -n --line-numbers  # is there a DROP before the allow?

# From the client
dig +short api.example.com    # right address?
nc -vz api.example.com 8080   # refused (RST) = nothing listening/blocked by REJECT; timeout = DROP/security group
traceroute -n -T -p 8080 api.example.com   # TCP traceroute shows where it stops`, 'Connectivity triage')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Using deprecated \`ifconfig\`/\`netstat\` output as if it were authoritative on modern systems (and forgetting container images may not ship \`ip\`/\`ss\`).
2. Binding a service to \`127.0.0.1\` and blaming the firewall.
3. Confusing "refused" (RST) with "timed out" (silent drop).
4. Testing with \`ping\` only, when ICMP is blocked but TCP works.
5. Editing iptables rules over SSH without a safety net (a bad DROP locks you out).
6. Forgetting that \`ip route\`, DNS and firewall rules are per network namespace (host vs container).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you find which process is using port 8080?', answerMd: '`ss -tlnp | grep :8080` (or `lsof -i :8080`) shows the listening socket and the owning PID/process; run it with sudo to see other users\' processes.' },
    { id: 'iq2', q: 'A host can ping 8.8.8.8 but cannot open websites. What do you check?', answerMd: 'IP connectivity works, so check DNS: `/etc/resolv.conf` or `resolvectl status`, `dig example.com` against the configured resolver and against 8.8.8.8, and whether DNS traffic (UDP/TCP 53) is blocked. Then test TCP 443 with nc or curl -v.' },
    { id: 'iq3', q: 'What does `ip route` show and how do you read the default route?', answerMd: 'The kernel routing table. Entries like `10.0.1.0/24 dev eth0` mean the subnet is directly reachable; `default via 10.0.1.1 dev eth0` sends everything else to the gateway. The longest matching prefix wins.' },
    { id: 'iq4', q: 'How does a Docker container reach the Internet?', answerMd: 'The container has a veth interface in its own namespace attached to a bridge on the host (172.17.0.0/16 by default). Its default route points at the bridge address; the host forwards the packets and an iptables MASQUERADE rule rewrites the source address to the host\'s, so replies return to the host and are mapped back.' },
    { id: 'iq5', q: 'How do you reach a database in a private subnet from your laptop?', answerMd: 'Through a bastion host or SSM session: `ssh -L 5433:db.internal:5432 user@bastion` forwards a local port over the SSH connection to the database, which only needs to allow the bastion in its security group.' },
  ],
  revision: { notesMd: `- ip -br addr / ip route / ip neigh / ip link; default route via gateway; MTU 1500 (less in tunnels).
- ss -tlnp (listeners + process), ss -s (summary); CLOSE_WAIT = app not closing; TIME_WAIT normal.
- dig (+short, @server, +trace), nc -vz, openssl s_client, curl -v/-w, tcpdump.
- Refused = RST (no listener), timeout = DROP. Loopback-bound services are unreachable remotely.
- netfilter: iptables/nftables, first match, default policy; SNAT/MASQUERADE vs DNAT; docker0 = 172.17.0.0/16; veth + bridge + namespaces.
- ssh -L (local forward), -R, -D.`, flashcards: [
    { id: 'f1', front: 'Command to list listening TCP ports with processes?', backMd: 'ss -tlnp' },
    { id: 'f2', front: 'Which route is chosen when several match?', backMd: 'The longest prefix.' },
    { id: 'f3', front: 'Default Docker bridge subnet?', backMd: '172.17.0.0/16.' },
    { id: 'f4', front: 'Refused vs timeout?', backMd: 'Refused: RST (no listener). Timeout: dropped packets.' },
    { id: 'f5', front: 'Forward local port 5433 to db:5432 via a bastion?', backMd: 'ssh -L 5433:db:5432 user@bastion' },
    { id: 'f6', front: 'What does MASQUERADE do?', backMd: 'Rewrites the source address of outgoing packets to the host\'s address (source NAT).' },
  ] },
  resources: [doc('ip(8) manual page', 'https://man.archlinux.org/man/ip.8'), doc('ss(8) manual page', 'https://man.archlinux.org/man/ss.8'), doc('Docker docs: Networking overview', 'https://docs.docker.com/engine/network/'), doc('Arch Wiki: nftables', 'https://wiki.archlinux.org/title/Nftables')],
});

const lnMcqs: MCQ[] = [
  mcq({ ...q(LN), id: 'devops.ln.q1', type: 'concept', difficulty: 'easy', stem: 'Which command shows which process is listening on TCP port 5432?', options: ['`ss -tlnp | grep 5432`', ['`ip route | grep 5432`', 'The routing table has no process information.'], ['`ping 5432`', 'ping takes a host, not a port.'], ['`dig 5432`', 'dig performs DNS queries.']], answer: 0, explanation: '-t TCP, -l listening, -n numeric, -p show the owning process.' }),
  mcq({ ...q(LN), id: 'devops.ln.q2', type: 'concept', difficulty: 'medium', stem: '`ss -tlnp` shows `LISTEN 127.0.0.1:8080`. Other machines cannot connect. What is the fix?', options: ['Bind the service to `0.0.0.0` (or the external interface)', ['Open port 8080 in the client\'s firewall', 'The service refuses non-local connections regardless.'], ['Increase the MTU', 'Unrelated.'], ['Run `ping` on the server', 'It does not change the bind address.']], answer: 0, explanation: 'A socket bound to the loopback address only accepts local connections.' }),
  mcq({ ...q(LN), id: 'devops.ln.q3', type: 'concept', difficulty: 'medium', stem: '`nc -vz api.example.com 443` returns "Connection refused" immediately. What does that indicate?', options: ['The host replied with a reset: nothing is listening on that port (or a REJECT rule)', ['A firewall silently dropped the packets', 'A silent drop gives a timeout.'], ['DNS failed', 'The name resolved to an address.'], ['The certificate is invalid', 'No TLS handshake has happened.']], answer: 0, explanation: 'Refused means an active reset came back; drops produce timeouts.' }),
  mcq({ ...q(LN), id: 'devops.ln.q4', type: 'concept', difficulty: 'medium', stem: '`ip route` shows `default via 10.0.1.1 dev eth0` and `10.0.1.0/24 dev eth0`. A packet for 10.0.1.77 and one for 8.8.8.8 are sent. How are they routed?', options: ['10.0.1.77 directly on eth0; 8.8.8.8 via the gateway 10.0.1.1', ['Both via 10.0.1.1', 'The /24 route matches the first and is more specific.'], ['Both directly on eth0', 'The Internet address is not in the local subnet.'], ['8.8.8.8 is dropped', 'The default route handles it.']], answer: 0, explanation: 'Longest-prefix match: /24 beats the default route (/0) for local addresses.' }),
  mcq({ ...q(LN), id: 'devops.ln.q5', type: 'concept', difficulty: 'hard', stem: 'Small API requests work from a VPN client but large responses hang. What is a likely cause?', options: ['An MTU/MSS mismatch on the tunnel (packets above the path MTU are dropped)', ['DNS caching', 'DNS affects name lookup, not response size.'], ['A full disk', 'Unrelated.'], ['Too many users', 'Not size-dependent.']], answer: 0, explanation: 'Tunnels reduce the effective MTU; if fragmentation or Path MTU Discovery fails, large packets disappear.' }),
  mcq({ ...q(LN), id: 'devops.ln.q6', type: 'concept', difficulty: 'medium', stem: 'How does a container on the default Docker bridge reach the Internet?', options: ['Through the host, which forwards its packets and applies source NAT (MASQUERADE)', ['Directly, because containers have public IPs', 'They have private addresses by default.'], ['Via a VPN built into Docker', 'Not how it works.'], ['Only through DNS', 'DNS is not routing.']], answer: 0, explanation: 'IP forwarding plus an iptables NAT rule translate container addresses to the host address.' }),
  mcq({ ...q(LN), id: 'devops.ln.q7', type: 'concept', difficulty: 'easy', stem: 'You need to reach a database that is only reachable from a bastion host. Which command forwards your local port 5433 to it?', options: ['`ssh -L 5433:db.internal:5432 user@bastion`', ['`ssh -R 5433:db.internal:5432 user@bastion`', '-R is a remote forward, in the other direction.'], ['`ssh -D 5433 user@bastion`', 'That starts a SOCKS proxy.'], ['`ping -p 5433 db.internal`', 'ping has no such function.']], answer: 0, explanation: '-L opens a local port and tunnels connections through the SSH server.' }),
];

// ---------------------------------------------------------------------------------------
const CI = 'devops.cicd';
const cicd = dTopic({
  id: CI, title: 'CI/CD and GitHub Actions', level: 'core', estMinutes: 55, prerequisites: ['devops.git'], related: ['devops.docker', 'devops.k8s-core', 'devops.cloud-security'],
  summary: 'Pipelines, GitHub Actions and deployment strategies.',
  objectives: ['Define continuous integration, delivery and deployment, and the stages of a typical pipeline.', 'Read and write a GitHub Actions workflow with triggers, jobs, matrices, caches, secrets and environments.', 'Compare recreate, rolling, blue/green and canary deployments and feature flags, with their rollback behaviour.', 'Explain DORA metrics and good pipeline practice (build once, immutable artifacts, fast feedback).'],
  sections: [
    { id: 'concepts', kind: 'concept', title: 'CI, continuous delivery and continuous deployment', bodyMd: `- **Continuous Integration (CI):** developers merge small changes to the main branch frequently; every change triggers an **automatic build and test run**, so integration problems surface within minutes, not weeks.
- **Continuous Delivery (CD):** every change that passes the pipeline is **releasable** at any time; the final push to production is a **manual** approval.
- **Continuous Deployment:** the same, but the release to production is **automatic** when the pipeline is green.

**A typical pipeline:**
1. **Trigger** (push, pull request, tag, schedule, manual).
2. **Build:** compile, resolve dependencies (cached), produce an **artifact** (a container image or package), tagged with the commit SHA.
3. **Test:** fast unit tests first, then integration/API tests, then slower end-to-end tests (**test pyramid**: many unit, fewer integration, few E2E).
4. **Quality & security gates:** lint, static analysis, dependency and image vulnerability scan, secret scanning, license checks.
5. **Publish** the artifact to a registry.
6. **Deploy** to staging, run smoke tests, then to production (with approval, canary or blue/green).
7. **Verify and monitor**, with automatic rollback on failure.

**Principles:** **build once, deploy the same immutable artifact everywhere** (config differs per environment, the image does not); keep the pipeline **fast** (minutes), **deterministic** and **versioned as code**; fail fast; trunk-based development with short-lived branches and **feature flags** for unfinished work.` },
    { id: 'actions', kind: 'concept', title: 'GitHub Actions in practice', bodyMd: `A **workflow** is a YAML file in \`.github/workflows/\`. **Events** trigger it; it contains **jobs** (run in parallel unless \`needs\` orders them) made of **steps** (shell commands or reusable **actions**) executed on a **runner** (GitHub-hosted VM or self-hosted).

Key ideas:
- \`on:\` events (\`push\`, \`pull_request\`, \`workflow_dispatch\`, \`schedule\`, \`release\`) with branch/path filters.
- \`needs:\` job dependencies; \`if:\` conditions; **matrix** strategy to run a job over combinations (OS × language version); **concurrency** groups to cancel superseded runs.
- **Caching** (\`actions/cache\`, or built-in caching in \`setup-node\`) to speed up dependency installs; **artifacts** pass files between jobs.
- **Secrets** (\`\${{ secrets.NAME }}\`) are masked in logs and not passed to forks' pull requests; **environments** add required reviewers and environment-scoped secrets (a manual approval gate before production).
- **Permissions:** set the \`GITHUB_TOKEN\` to the minimum (\`permissions: contents: read\`).
- **Cloud auth without long-lived keys:** **OIDC** federation lets the workflow request short-lived cloud credentials for its identity (\`id-token: write\`).
- **Supply chain:** pin third-party actions to a **full commit SHA** (tags can move) and treat \`pull_request_target\` and untrusted inputs with care (script injection through branch names or PR titles).`, code: [yaml(`name: ci
on:
  pull_request:
  push: { branches: [main] }
concurrency: { group: ci-\${{ github.ref }}, cancel-in-progress: true }
permissions: { contents: read }

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix: { node: [18, 20, 22], os: [ubuntu-latest, windows-latest] }   # 3 × 2 = 6 jobs
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: \${{ matrix.node }}, cache: npm }
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production            # required reviewers = manual approval
    permissions: { id-token: write, contents: read }   # OIDC to the cloud, no stored keys
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/deploy.sh \${{ github.sha }}`, 'A CI workflow with a matrix and a gated deploy')] },
    { id: 'strategies', kind: 'comparison', title: 'Deployment strategies', bodyMd: `| Strategy | How | Pros | Cons / rollback |
|---|---|---|---|
| **Recreate** | stop the old version, start the new | simplest | **downtime**; rollback = redeploy |
| **Rolling** | replace instances gradually (Kubernetes default) | no downtime, no extra full fleet | two versions run together (needs backward compatibility); rollback = roll forward/back gradually |
| **Blue/green** | stand up a full new environment (green), switch the router/LB when ready | instant cutover and **instant rollback** (switch back) | double capacity during the switch; databases must be compatible with both |
| **Canary** | send a small share (1–5%) to the new version, watch metrics, increase | limits blast radius, real traffic validation | needs good observability and traffic splitting |
| **Feature flags** | ship code dark, enable per user/percentage at runtime | decouples **deploy** from **release**, instant kill switch | flag debt, testing combinations |

**Database changes** are the hard part: use **expand/contract** (backward-compatible migrations): add the new column (expand), deploy code that writes both, backfill, switch reads, then remove the old column (contract) in a later release, so any app version can run against the schema during rollout and rollback.

**Kubernetes rolling update arithmetic:** with 10 replicas, \`maxSurge: 25%\` and \`maxUnavailable: 25%\`, Kubernetes rounds surge **up** (⌈2.5⌉ = 3 extra pods) and unavailability **down** (⌊2.5⌋ = 2): at most 13 pods exist and at least 8 stay available during the update.

**DORA metrics** measure delivery performance: **deployment frequency**, **lead time for changes**, **change failure rate** and **time to restore service (MTTR)**. Elite teams deploy on demand with low failure rates and fast recovery: speed and stability go together.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Rebuilding the artifact separately for each environment (what you tested is not what you ship).
2. Slow, flaky pipelines that people learn to ignore or bypass.
3. Long-lived cloud keys stored as repository secrets (use OIDC and short-lived credentials).
4. Third-party actions pinned to a mutable tag, or secrets exposed to untrusted pull requests.
5. Deploys with no health check, smoke test or automatic rollback.
6. Breaking database migrations that prevent rollback.
7. Treating "deployed" as "released" with no feature flag for risky changes.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'CI vs continuous delivery vs continuous deployment?', answerMd: 'CI merges and automatically builds and tests every change frequently. Continuous delivery keeps every passing change releasable with a manual approval to ship. Continuous deployment removes that manual step and releases every green change automatically.' },
    { id: 'iq2', q: 'Explain blue/green vs canary deployments.', answerMd: 'Blue/green runs two full environments and switches all traffic at once, giving instant rollback by switching back but needing double capacity. Canary shifts a small percentage of traffic to the new version first and increases it as metrics stay healthy, limiting the blast radius at the cost of more traffic-management and monitoring.' },
    { id: 'iq3', q: 'How would you design a pipeline for a containerised web service?', answerMd: 'On pull requests: lint, unit tests, build the image, scan it. On merge to main: build once, tag with the commit SHA, push to the registry, deploy to staging, run smoke/integration tests, then deploy to production with approval using rolling or canary updates, health checks and automatic rollback, with metrics and alerts watching the release.' },
    { id: 'iq4', q: 'How do you handle secrets in CI/CD?', answerMd: 'Never commit them. Use the platform\'s secret store (masked in logs), scope secrets to environments, prefer OIDC federation to short-lived cloud credentials over static keys, give the token minimal permissions, avoid exposing secrets to untrusted pull requests, and scan for leaked secrets.' },
    { id: 'iq5', q: 'How do you roll out a database schema change without downtime?', answerMd: 'Use backward-compatible expand/contract migrations: add the new structure, deploy code that works with both, backfill data, switch reads, and remove the old structure later. Every deployed application version, including the previous one for rollback, must work with the current schema.' },
  ],
  revision: { notesMd: `- CI = frequent merge + automatic build/test; delivery = always releasable (manual ship); deployment = automatic ship.
- Pipeline: trigger → build once (artifact tagged by SHA) → test pyramid → scans → registry → staging → prod → verify/rollback.
- Actions: on / jobs / needs / steps / matrix / cache / artifacts / secrets / environments / OIDC / pin actions by SHA.
- Strategies: recreate (downtime), rolling, blue/green (instant rollback), canary (small share first), feature flags.
- K8s rolling: surge rounds up, unavailable rounds down (10 pods, 25%/25% → ≤13 total, ≥8 available).
- DORA: deployment frequency, lead time, change failure rate, MTTR. Expand/contract DB migrations.`, flashcards: [
    { id: 'f1', front: 'What is "build once, deploy many"?', backMd: 'One immutable artifact is promoted through all environments; only configuration changes.' },
    { id: 'f2', front: 'Matrix of 3 Node versions × 2 OSes?', backMd: '6 jobs.' },
    { id: 'f3', front: 'Fastest rollback strategy?', backMd: 'Blue/green (switch traffic back).' },
    { id: 'f4', front: 'The four DORA metrics?', backMd: 'Deployment frequency, lead time for changes, change failure rate, time to restore.' },
    { id: 'f5', front: 'Why pin an action to a commit SHA?', backMd: 'Tags can be moved to malicious code; a SHA is immutable.' },
    { id: 'f6', front: 'Safe migration pattern?', backMd: 'Expand/contract (backward-compatible steps).' },
  ] },
  resources: [doc('GitHub Actions documentation', 'https://docs.github.com/en/actions'), doc('GitHub: Security hardening for Actions', 'https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions'), { title: 'DORA: Software delivery performance metrics', url: 'https://dora.dev/guides/dora-metrics-four-keys/', kind: 'article' }, doc('Kubernetes: Deployments (rolling update)', 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/')],
});

const ciMcqs: MCQ[] = [
  mcq({ ...q(CI), id: 'devops.ci.q1', type: 'concept', difficulty: 'easy', stem: 'What distinguishes continuous deployment from continuous delivery?', options: ['Continuous deployment releases every green change to production automatically; delivery keeps it releasable with a manual approval', ['Deployment skips tests', 'Both run tests.'], ['Delivery never uses pipelines', 'It does.'], ['They are identical', 'The final release step differs.']], answer: 0, explanation: 'The only difference is whether the last step is automated.' }),
  mcq({ ...q(CI), id: 'devops.ci.q2', type: 'complexity', difficulty: 'easy', stem: 'A workflow job uses `matrix: { node: [18, 20, 22], os: [ubuntu-latest, windows-latest] }`. How many job runs does it create?', options: ['6', ['5', 'There is no exclusion rule.'], ['3', 'That is only the node dimension.'], ['2', 'That is only the OS dimension.']], answer: 0, explanation: 'A matrix is the Cartesian product: 3 × 2 = 6.' }),
  mcq({ ...q(CI), id: 'devops.ci.q3', type: 'concept', difficulty: 'medium', stem: 'Which deployment strategy gives the fastest rollback?', options: ['Blue/green: switch the router back to the old environment', ['Recreate', 'Needs a redeploy and downtime.'], ['Rolling update', 'Needs another gradual rollout.'], ['Manual hotfix on the server', 'Slow and error-prone.']], answer: 0, explanation: 'The old environment is still running, so reverting is a traffic switch.' }),
  mcq({ ...q(CI), id: 'devops.ci.q4', type: 'complexity', difficulty: 'hard', stem: 'A Kubernetes Deployment has 10 replicas with `maxSurge: 25%` and `maxUnavailable: 25%`. During a rolling update, what is the maximum number of pods and the minimum number available?', options: ['13 pods at most; at least 8 available', ['12 pods; 7 available', 'Surge rounds up (3), unavailable rounds down (2).'], ['13 pods; 7 available', 'Unavailable rounds down to 2, so 8 stay available.'], ['10 pods; 10 available', 'The update allows surge and some unavailability.']], answer: 0, explanation: 'Surge ⌈2.5⌉ = 3 gives 13 total; unavailable ⌊2.5⌋ = 2 leaves 8 available.' }),
  mcq({ ...q(CI), id: 'devops.ci.q5', type: 'concept', difficulty: 'medium', stem: 'Why should third-party GitHub Actions be pinned to a full commit SHA?', options: ['Tags and branches are mutable, so a compromised or changed tag could run malicious code in your pipeline', ['SHAs make the action run faster', 'Not a performance feature.'], ['Tags are not supported', 'They are supported but mutable.'], ['It removes the need for secrets', 'Unrelated.']], answer: 0, explanation: 'A SHA is immutable and reviewable.' }),
  mcq({ ...q(CI), id: 'devops.ci.q6', type: 'concept', difficulty: 'medium', stem: 'Which is the best way for a deployment job to access a cloud account?', options: ['OIDC federation giving short-lived credentials to the workflow identity', ['A long-lived admin access key stored as a repository secret', 'A leak would be catastrophic and keys rarely rotate.'], ['Hard-coding credentials in the workflow file', 'Committed secrets.'], ['Email the key to the runner', 'Absurd.']], answer: 0, explanation: 'Short-lived, scoped credentials reduce the blast radius and rotation burden.' }),
  mcq({ ...q(CI), id: 'devops.ci.q7', type: 'concept', difficulty: 'medium', stem: 'Why is "build once, deploy the same artifact to every environment" recommended?', options: ['What you tested in staging is exactly what runs in production; only configuration differs', ['It makes builds slower', 'The opposite.'], ['It removes the need for tests', 'Tests are still needed.'], ['It forces one environment', 'Environments stay separate.']], answer: 0, explanation: 'Rebuilding per environment can produce different binaries.' }),
  mcq({ ...q(CI), id: 'devops.ci.q8', type: 'concept', difficulty: 'medium', stem: 'You want to rename a database column with zero downtime and safe rollback. Which approach fits?', options: ['Expand/contract: add the new column, write to both, backfill, switch reads, drop the old column later', ['Rename the column in the same deploy that updates the code', 'Old and new app versions would break during rollout or rollback.'], ['Take the site down overnight', 'Avoidable downtime.'], ['Never change the schema', 'Impractical.']], answer: 0, explanation: 'Every running app version must work with the current schema.' }),
];

// ---------------------------------------------------------------------------------------
const AW = 'devops.aws';
const aws = dTopic({
  id: AW, title: 'AWS Fundamentals', level: 'core', estMinutes: 60, prerequisites: [], related: ['devops.cloud-security', 'devops.iac-terraform', 'sd.scalability'],
  summary: 'IAM, VPC, EC2, S3, RDS, Lambda and CloudWatch.',
  objectives: ['Explain regions, availability zones and the shared building blocks of a typical AWS architecture.', 'Design a VPC with public/private subnets and choose between security groups and network ACLs.', 'Use IAM correctly (users, roles, policies, least privilege, evaluation logic).', 'Choose between EC2, Lambda and containers, S3 storage classes, and RDS Multi-AZ vs read replicas.'],
  sections: [
    { id: 'global', kind: 'concept', title: 'Regions, AZs and the shared-responsibility model', bodyMd: `- A **region** is a geographic area (for example \`ap-south-1\`, Mumbai) made of several **Availability Zones (AZs)**: physically separate data centres with independent power and networking, linked by low-latency connections. Deploy across **at least two AZs** for high availability; use multiple regions for disaster recovery or global latency.
- **Edge locations** serve CloudFront (CDN) and Route 53 (DNS).
- **Shared responsibility:** AWS secures the cloud (hardware, facilities, the hypervisor, managed-service internals); **you** secure what you put in it (IAM, network rules, OS patches on EC2, data, encryption choices, application code).
- Pricing: pay as you go, per second/hour/request/GB. Cost levers: right-sizing, **reserved/savings plans** for steady load, **spot** instances for interruptible work, S3 storage classes, deleting idle resources, and data-transfer awareness (traffic leaving AWS and crossing AZs/regions costs money).` },
    { id: 'iam', kind: 'concept', title: 'IAM: identities and policies', bodyMd: `**IAM** controls *who* (authentication) can do *what* on *which resources* (authorisation).

- **Root account:** unrestricted: protect with MFA, do not use for daily work.
- **IAM users** (long-lived credentials; use sparingly) and **groups**; prefer **IAM Identity Center/SSO** for people.
- **Roles:** an identity **assumed** temporarily (short-lived credentials from STS) by EC2 instances, Lambda functions, containers, CI pipelines or other accounts. **Workloads should use roles, never access keys in code.**
- **Policies:** JSON documents with \`Effect\`, \`Action\`, \`Resource\` (and optional \`Condition\`). **Identity-based** policies attach to users/roles; **resource-based** policies attach to the resource (S3 bucket policy, SQS queue).

\`\`\`json
{ "Effect": "Allow", "Action": ["s3:GetObject"], "Resource": "arn:aws:s3:::reports-prod/*" }
\`\`\`

**Evaluation logic:** everything is **denied by default** (implicit deny); an explicit **Allow** grants access; an explicit **Deny always wins** over any Allow. Cross-account access needs permission on both sides. Apply **least privilege**: start narrow (specific actions and resources, conditions such as MFA or source VPC) and widen only when needed; review with IAM Access Analyzer.` },
    { id: 'vpc', kind: 'concept', title: 'VPC networking', bodyMd: `A **VPC** is your private virtual network, defined by a CIDR block (for example \`10.0.0.0/16\`, 65,536 addresses). It is divided into **subnets**, each living in **one AZ**.

- **Public subnet:** has a route to an **Internet Gateway (IGW)**; instances with public IPs are reachable from the Internet (load balancers, bastions/NAT).
- **Private subnet:** no direct inbound route from the Internet; instances reach out through a **NAT Gateway** (placed in a public subnet) to fetch updates; databases and app servers live here.
- **Route tables** decide where each subnet's traffic goes (\`0.0.0.0/0 → igw-…\` makes a subnet public).
- AWS reserves **5 addresses per subnet** (network, router, DNS, future use, broadcast), so a /24 gives 256 − 5 = **251** usable addresses. A /16 VPC can hold 2⁸ = **256** /24 subnets.
- **Security groups:** **stateful** virtual firewalls attached to instances/ENIs; **allow rules only**; return traffic is automatically allowed; may reference other security groups ("app tier may reach db tier on 5432").
- **Network ACLs:** **stateless** firewall at the subnet boundary; allow and deny rules, evaluated in order; you must allow **return (ephemeral port) traffic** explicitly. Used as a coarse extra layer.
- **VPC endpoints** (gateway for S3/DynamoDB, interface for others) reach AWS services privately without traversing the Internet or NAT (cheaper and more secure); **peering/Transit Gateway** connect VPCs; **VPN/Direct Connect** connect on-premises.

**Classic 3-tier layout:** ALB in public subnets (2+ AZs) → app servers/containers in private subnets → database in private (isolated) subnets, security groups chained tier to tier.` },
    { id: 'compute-storage', kind: 'comparison', title: 'Compute, storage and databases', bodyMd: `| Service | What it is | Use when |
|---|---|---|
| **EC2** | virtual machines (instance types, AMIs, EBS volumes); **Auto Scaling Groups** + **ELB** | full OS control, long-running or legacy workloads |
| **ECS/EKS/Fargate** | container orchestration (Fargate = serverless containers) | containerised services |
| **Lambda** | functions triggered by events (HTTP via API Gateway, S3, SQS, schedules); pay per invocation; max **15 minutes**; **cold starts**; scales automatically | spiky, event-driven or glue workloads |
| **S3** | object storage, 11 nines durability, strong read-after-write consistency, **versioning**, lifecycle rules, **pre-signed URLs**; classes: Standard, Intelligent-Tiering, Standard-IA, Glacier tiers | files, backups, static sites, data lakes |
| **EBS / EFS** | block volume attached to one instance (EBS); shared NFS file system (EFS) | disks for EC2; shared files |
| **RDS / Aurora** | managed relational DB (backups, patching, failover) | relational data without running servers |
| **DynamoDB** | managed key-value/document NoSQL, single-digit-ms at any scale | huge key-based workloads |
| **ElastiCache** | managed Redis/Memcached | caching, sessions |
| **SQS / SNS / EventBridge** | queue / pub-sub / event bus | decoupling and async work |
| **CloudFront, Route 53** | CDN, DNS (with health-check failover) | global delivery, routing |
| **CloudWatch, CloudTrail** | metrics/logs/alarms; API audit log | monitoring; who did what |

**RDS Multi-AZ vs read replicas:** *Multi-AZ* keeps a **synchronous standby** in another AZ for **high availability** (automatic failover, the standby serves no reads). *Read replicas* are **asynchronous** copies that **scale reads** (and can be promoted), with replication lag.

**S3 durability:** 99.999999999% (11 nines) means that if you store 10 million objects you can expect to lose about **one object every 10,000 years**. Durability (not losing data) differs from **availability** (being able to read it right now, about 99.99% for Standard).` },
    { id: 'monitor', kind: 'concept', title: 'CloudWatch and operations', bodyMd: `- **CloudWatch Metrics** (CPU, network, request counts; custom metrics), **Alarms** (threshold → SNS, Auto Scaling, EC2 recovery), **Logs** (agents and Lambda ship logs; Logs Insights queries), **Dashboards**. Memory and disk metrics on EC2 need the CloudWatch agent.
- **CloudTrail** records API calls (who changed that security group?) and is essential for audits and incident response; **AWS Config** tracks configuration changes and compliance.
- **Auto Scaling:** scale on CPU/request-count/queue-depth targets; spread across AZs; health checks replace failed instances.
- **Backups and DR:** automated RDS snapshots, S3 versioning and cross-region replication, EBS snapshots; define RPO/RTO and test restores.
- **Well-Architected pillars:** operational excellence, security, reliability, performance efficiency, cost optimisation, sustainability.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. A single AZ (or a single instance) for production.
2. Access keys on instances or in code instead of IAM roles.
3. \`Action: "*"\` / \`Resource: "*"\` policies "just to make it work".
4. Public S3 buckets or databases with \`0.0.0.0/0\` security-group rules.
5. Forgetting NAT Gateway and data-transfer charges.
6. Treating a security group like a stateless ACL (or the reverse).
7. Confusing Multi-AZ (availability) with read replicas (read scaling).
8. No MFA on root, no CloudTrail, no budget alarms.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Design a highly available web application on AWS.', answerMd: 'A VPC across at least two AZs. An Application Load Balancer in public subnets, application instances or containers in private subnets in an Auto Scaling Group or ECS service, and a Multi-AZ RDS database in isolated private subnets, with ElastiCache for hot data. Static assets in S3 behind CloudFront, DNS in Route 53, IAM roles for permissions, security groups chaining the tiers, CloudWatch alarms and backups.' },
    { id: 'iq2', q: 'Security group vs network ACL?', answerMd: 'A security group is a stateful firewall at the instance/ENI level with allow rules only; return traffic is automatic. A network ACL is a stateless firewall at the subnet level with ordered allow and deny rules; return traffic must be allowed explicitly. Security groups are the primary control; NACLs are a coarse extra layer.' },
    { id: 'iq3', q: 'How does IAM evaluate permissions?', answerMd: 'Requests are denied by default. If any applicable policy has an explicit Deny, access is denied. Otherwise, an explicit Allow in an applicable policy (and permission boundaries/SCPs permitting) grants access. Cross-account access requires both the identity and the resource policy to allow it.' },
    { id: 'iq4', q: 'EC2 vs Lambda?', answerMd: 'EC2 gives full control of a VM for long-running or specialised workloads but you manage scaling and patching. Lambda runs event-driven functions with automatic scaling and per-invocation pricing, but has execution time limits (15 minutes), cold starts and constrained runtimes; it suits spiky or glue workloads.' },
    { id: 'iq5', q: 'Multi-AZ vs read replicas in RDS?', answerMd: 'Multi-AZ maintains a synchronous standby in another AZ for automatic failover (high availability, no read traffic). Read replicas are asynchronous copies used to scale read traffic and can be promoted, but may lag behind the primary.' },
  ],
  revision: { notesMd: `- Region > AZs (≥ 2 for HA). Shared responsibility: AWS secures the cloud, you secure what is in it.
- IAM: deny by default; explicit Deny wins; roles (STS, short-lived) for workloads; least privilege; MFA on root.
- VPC: public subnet = route to IGW; private uses NAT GW; /24 = 251 usable (5 reserved); /16 holds 256 /24s.
- Security group: stateful, allow-only, instance level. NACL: stateless, allow+deny, subnet level.
- Multi-AZ (sync standby, HA) vs read replica (async, read scale). S3: 11 nines durability, versioning, lifecycle, pre-signed URLs.
- Lambda: events, ≤ 15 min, cold starts. CloudWatch (metrics/logs/alarms), CloudTrail (audit).`, flashcards: [
    { id: 'f1', front: 'Usable addresses in a /24 AWS subnet?', backMd: '251 (AWS reserves 5).' },
    { id: 'f2', front: 'What does an explicit Deny do?', backMd: 'Overrides every Allow.' },
    { id: 'f3', front: 'Security groups: stateful or stateless?', backMd: 'Stateful (return traffic auto-allowed); NACLs are stateless.' },
    { id: 'f4', front: 'How do you let an EC2 instance read S3 safely?', backMd: 'Attach an IAM role with a least-privilege policy; no access keys.' },
    { id: 'f5', front: 'What makes a subnet public?', backMd: 'A route to an Internet Gateway (plus public IPs).' },
    { id: 'f6', front: 'Lambda maximum duration?', backMd: '15 minutes.' },
  ] },
  resources: [doc('AWS Well-Architected Framework', 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html'), doc('Amazon VPC User Guide: How VPC works', 'https://docs.aws.amazon.com/vpc/latest/userguide/how-it-works.html'), doc('IAM: Policy evaluation logic', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html'), doc('Amazon S3 storage classes', 'https://aws.amazon.com/s3/storage-classes/')],
});

const awMcqs: MCQ[] = [
  mcq({ ...q(AW), id: 'devops.aw.q1', type: 'complexity', difficulty: 'medium', stem: 'How many usable IP addresses does an AWS subnet with CIDR `10.0.1.0/24` have?', options: ['251', ['254', 'That is the classic network count; AWS reserves 5 addresses, not 2.'], ['256', 'That ignores all reserved addresses.'], ['250', 'AWS reserves five: 256 − 5 = 251.']], answer: 0, explanation: 'AWS reserves the first four and the last address of every subnet.' }),
  mcq({ ...q(AW), id: 'devops.aw.q2', type: 'concept', difficulty: 'medium', stem: 'An IAM user has a policy that allows `s3:*` on all buckets and another policy that explicitly denies `s3:DeleteObject` on `bucket-a`. Can the user delete an object from `bucket-a`?', options: ['No: an explicit Deny overrides any Allow', ['Yes: the broader Allow wins', 'Explicit denies always win.'], ['Yes, if they use the console', 'The same evaluation applies everywhere.'], ['Only after waiting for policy propagation', 'Not how evaluation works.']], answer: 0, explanation: 'IAM evaluation: default deny, allow if allowed, but an explicit deny always takes precedence.' }),
  mcq({ ...q(AW), id: 'devops.aw.q3', type: 'concept', difficulty: 'easy', stem: 'An application on EC2 needs to read from S3. What is the recommended way to provide credentials?', options: ['Attach an IAM role to the instance with a least-privilege policy', ['Store an access key in the source code', 'Leak risk and hard to rotate.'], ['Use the root account key', 'Never.'], ['Make the bucket public', 'Exposes data to everyone.']], answer: 0, explanation: 'Roles supply short-lived credentials automatically via the instance metadata service.' }),
  mcq({ ...q(AW), id: 'devops.aw.q4', type: 'concept', difficulty: 'medium', stem: 'Which statement about security groups and network ACLs is correct?', options: ['Security groups are stateful and allow-only; NACLs are stateless and support allow and deny rules', ['Both are stateless', 'Security groups are stateful.'], ['NACLs are attached to instances', 'They apply to subnets.'], ['Security groups support explicit deny rules', 'They are allow-only.']], answer: 0, explanation: 'With a NACL you must also allow return traffic (ephemeral ports).' }),
  mcq({ ...q(AW), id: 'devops.aw.q5', type: 'concept', difficulty: 'medium', stem: 'Private-subnet instances must download OS updates from the Internet but must not accept inbound connections from it. What do you add?', options: ['A NAT Gateway in a public subnet, with the private route table sending 0.0.0.0/0 to it', ['An Internet Gateway route in the private subnet', 'That would make the subnet public.'], ['A public IP on every instance', 'Allows inbound exposure.'], ['A bigger instance type', 'Unrelated.']], answer: 0, explanation: 'NAT allows outbound-initiated traffic only.' }),
  mcq({ ...q(AW), id: 'devops.aw.q6', type: 'concept', difficulty: 'medium', stem: 'You need automatic failover for your RDS database in case an AZ fails. Which feature provides it?', options: ['Multi-AZ deployment (synchronous standby in another AZ)', ['A read replica in the same AZ', 'No AZ-level protection and replication is asynchronous.'], ['Larger storage', 'Unrelated.'], ['CloudWatch alarms alone', 'They notify, they do not fail over.']], answer: 0, explanation: 'Read replicas scale reads; Multi-AZ provides high availability.' }),
  mcq({ ...q(AW), id: 'devops.aw.q7', type: 'complexity', difficulty: 'medium', stem: 'S3 offers 99.999999999% (11 nines) durability. If you store 10 million objects, about how many would you expect to lose per year?', options: ['About 0.0001, i.e. one every 10,000 years', ['About 1 per year', 'That would be 8 nines.'], ['About 100 per year', 'Far too high.'], ['None, by guarantee', 'It is a statistical expectation.']], answer: 0, explanation: '10⁷ × 10⁻¹¹ = 10⁻⁴ objects per year.' }),
  mcq({ ...q(AW), id: 'devops.aw.q8', type: 'concept', difficulty: 'medium', stem: 'Which is the best fit for a function that runs for a few seconds when a file lands in S3 and is idle most of the day?', options: ['AWS Lambda triggered by the S3 event', ['A large always-on EC2 instance', 'Pays for idle time.'], ['A dedicated host', 'Wasteful.'], ['A Multi-AZ RDS instance', 'It is a database, not compute for this.']], answer: 0, explanation: 'Event-driven, spiky and short-lived: Lambda scales to zero and bills per invocation.' }),
];

// ---------------------------------------------------------------------------------------
const OB = 'devops.observability';
const observ = dTopic({
  id: OB, title: 'Logs, Metrics and Monitoring', level: 'core', estMinutes: 50, prerequisites: [], related: ['sd.observability', 'sd.case-logging', 'devops.k8s-core', 'devops.aws'],
  summary: 'Observability basics for operators.',
  objectives: ['Use Prometheus-style metrics: counters, gauges and histograms, and read basic PromQL (rate, sum by, histogram_quantile).', 'Collect and query logs (journalctl, kubectl logs, a log aggregator) and use structured logging.', 'Write actionable alert rules with a runbook and avoid alert fatigue.', 'Run an incident: severity, roles, communication, mitigation first, blameless post-mortem.'],
  sections: [
    { id: 'metrics', kind: 'concept', title: 'Metrics with Prometheus and Grafana', bodyMd: `Prometheus **scrapes** an HTTP \`/metrics\` endpoint of each target on an interval (15 s typical) and stores time series; **Grafana** draws dashboards; **Alertmanager** routes alerts.

Metric types:
- **Counter:** only increases (requests, errors). Always query it with **\`rate()\`**.
- **Gauge:** goes up and down (memory, queue length, in-flight requests).
- **Histogram:** counts observations in buckets (\`_bucket{le="0.5"}\`) plus \`_sum\` and \`_count\`; lets you compute percentiles on the server.

Essential PromQL:
\`\`\`
rate(http_requests_total[5m])                                   # per-second rate over 5 minutes
sum by (service) (rate(http_requests_total{status=~"5.."}[5m])) # 5xx per second per service
  / sum by (service) (rate(http_requests_total[5m]))            # → error ratio
histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))   # p99 latency
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes     # fraction of memory still available
\`\`\`

**Worked example:** a counter reads 1,000 at the start of a 5-minute window and 1,600 at the end: \`rate\` = (1,600 − 1,000) / 300 s = **2 requests per second**.

Instrument your own services (client libraries expose \`/metrics\`), watch **cardinality** (never put user ids in labels), and use **exporters** for things you can't instrument (node_exporter for hosts, cAdvisor/kube-state-metrics for containers and Kubernetes objects). Cloud users get the same ideas from **CloudWatch**.` },
    { id: 'logs', kind: 'concept', title: 'Logs: where they are and how to use them', bodyMd: `- **Twelve-factor rule:** applications write logs to **stdout/stderr** as an event stream; the platform collects them (Docker, Kubernetes, systemd), not the app.
- **Single host:** \`journalctl -u myservice -f --since "10 min ago"\`, \`tail -f /var/log/...\`, \`dmesg\` for kernel messages (OOM kills).
- **Kubernetes:** \`kubectl logs <pod> -c <container> [--previous] [-f]\`, \`kubectl logs -l app=api --tail=100\`; remember logs vanish with the pod unless shipped to a **central store** (Loki, Elasticsearch/OpenSearch, CloudWatch Logs, Splunk) by an agent (Fluent Bit, Promtail, the CloudWatch agent).
- **Structured logging** (JSON with fields \`level, ts, service, trace_id, user_id, msg\`) makes logs queryable (\`level=error service=payments | count by msg\`) instead of grep-able prose. Include a **request/trace id**; never log secrets or personal data.
- **Levels:** ERROR (needs attention), WARN (unexpected but handled), INFO (business events), DEBUG (off in production by default).
- **Retention and cost:** keep recent logs hot and searchable, archive the rest cheaply; sample or drop noisy lines.

Logs tell you **what happened in detail**, metrics tell you **how much and how fast**, traces tell you **where in the call chain**; use them together (an alert fires on a metric, you pivot to the logs of that service and window).` },
    { id: 'alerts', kind: 'concept', title: 'Alerting that works', bodyMd: `Alert on **symptoms users feel** (error ratio, latency, availability) and keep **causes** (CPU, disk) for dashboards and secondary alerts.

\`\`\`yaml
groups:
- name: api
  rules:
  - alert: HighErrorRatio
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
    for: 10m                     # must hold for 10 minutes → avoids flapping on blips
    labels: { severity: page }
    annotations:
      summary: "More than 5% of requests fail"
      runbook_url: https://wiki.example.com/runbooks/api-5xx
\`\`\`

- Every page needs to be **urgent, actionable and have a runbook** (what it means, how to check, how to mitigate). Otherwise downgrade it to a ticket or delete it.
- Use \`for:\` durations, **grouping and inhibition** in Alertmanager (don't send 200 alerts for one outage), and route by severity and team (page vs Slack).
- **Blackbox probes** (Prometheus blackbox_exporter, synthetic checks) test the service from outside; add a **dead-man's-switch** alert so silence from the monitoring system itself is noticed.
- Typical host/Kubernetes alerts: disk filling (predict with \`predict_linear\`), pod crash-looping, deployment replicas unavailable, certificate expiring in < 14 days, node not ready.` },
    { id: 'incident', kind: 'concept', title: 'Incident response basics', bodyMd: `1. **Detect and declare:** an alert or report; assign a **severity** (SEV1 = major customer impact) and open an incident channel.
2. **Roles:** **incident commander** (coordinates, decides), **ops/tech lead** (investigates and fixes), **communications** (status page and stakeholder updates); one person per role avoids chaos.
3. **Mitigate first, root-cause later:** roll back the last deploy, fail over, shed load, disable a feature flag, scale up: restore service before understanding everything. Ask "what changed?" first (deploys, config, traffic, dependencies).
4. **Communicate** on a fixed cadence even when there is nothing new.
5. **Resolve and verify** through metrics, not assumptions.
6. **Blameless post-mortem:** timeline, impact (duration, users, error budget burned), root and contributing causes, what went well, and **action items with owners and dates** (better alerts, tests, automation). People are not the root cause; the system allowed the failure.

Useful numbers: **MTTD** (time to detect), **MTTA** (to acknowledge), **MTTR** (to restore). Practising with game days and runbook drills pays off.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Plotting a counter directly instead of its \`rate()\`.
2. Alerting on instantaneous spikes (no \`for:\`), or on causes that don't affect users.
3. Pages with no runbook, or so many pages that they are ignored.
4. High-cardinality labels in metrics.
5. Logging to local files in containers and losing them when the pod dies.
6. Averaging latency instead of looking at percentiles.
7. Hunting for the root cause while customers are still down (mitigate first).
8. Post-mortems that name a person instead of fixing the system.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What are the three pillars of observability?', answerMd: 'Metrics (numeric time series for trends and alerts), logs (detailed event records) and traces (the path and timing of a request across services). Metrics tell you something is wrong, traces show where, logs explain why; a shared request id links them.' },
    { id: 'iq2', q: 'What does `rate(http_requests_total[5m])` compute?', answerMd: 'The per-second average increase of the counter over the last five minutes, handling counter resets. Counters must be wrapped in rate() or increase() because their raw values only grow.' },
    { id: 'iq3', q: 'How do you design a good alert?', answerMd: 'It fires on a user-visible symptom such as error ratio or latency, requires the condition to hold for a period to avoid flapping, is routed by severity, and includes a clear summary and a runbook. If it is not actionable or urgent it should not page anyone.' },
    { id: 'iq4', q: 'A Kubernetes pod keeps restarting. How do you investigate?', answerMd: '`kubectl describe pod` for events and exit codes (OOMKilled, probe failures), `kubectl logs --previous` for the crashed container, check resource limits and recent config or image changes, and look at metrics such as memory and restarts around the time.' },
    { id: 'iq5', q: 'What happens in the first minutes of a major incident?', answerMd: 'Declare it with a severity, assign an incident commander and responders, ask what changed recently, and mitigate first (roll back, fail over, disable a flag) while communicating on a fixed cadence. Root-cause analysis and a blameless post-mortem with owned action items follow after service is restored.' },
  ],
  revision: { notesMd: `- Prometheus: scrape /metrics; counter (rate()), gauge, histogram (histogram_quantile). rate = Δ / seconds (1,000→1,600 in 5 min = 2/s).
- Logs to stdout → agent → central store; structured JSON with trace id; journalctl, kubectl logs (--previous).
- Alerts: symptoms, \`for:\`, severity routing, runbook link, dead-man's switch; avoid alert fatigue.
- Incident: declare + severity, roles (IC, ops, comms), mitigate first, communicate, blameless post-mortem with owned actions.
- MTTD / MTTA / MTTR; avoid high-cardinality labels.`, flashcards: [
    { id: 'f1', front: 'Which PromQL function must wrap a counter?', backMd: 'rate() (or increase()).' },
    { id: 'f2', front: 'How do you get p99 latency from a histogram?', backMd: 'histogram_quantile(0.99, sum by (le) (rate(..._bucket[5m])))' },
    { id: 'f3', front: 'Why use `for:` in an alert rule?', backMd: 'So transient blips do not page anyone.' },
    { id: 'f4', front: 'First priority in an incident?', backMd: 'Mitigate (restore service), then find the root cause.' },
    { id: 'f5', front: 'Where should containerised apps write logs?', backMd: 'stdout/stderr, collected by the platform.' },
    { id: 'f6', front: 'What belongs in a post-mortem?', backMd: 'Timeline, impact, causes, what went well, action items with owners.' },
  ] },
  resources: [doc('Prometheus: Querying basics', 'https://prometheus.io/docs/prometheus/latest/querying/basics/'), doc('Prometheus: Alerting rules', 'https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/'), { title: 'Google SRE Book: Postmortem culture', url: 'https://sre.google/sre-book/postmortem-culture/', kind: 'book' }, { title: 'The Twelve-Factor App: Logs', url: 'https://12factor.net/logs', kind: 'article' }],
});

const obMcqs: MCQ[] = [
  mcq({ ...q(OB), id: 'devops.ob.q1', type: 'complexity', difficulty: 'medium', stem: 'A counter `http_requests_total` is 1,000 at the start of a 5-minute window and 1,600 at the end. What does `rate(http_requests_total[5m])` return (approximately)?', options: ['2 requests per second', ['600 requests per second', 'That is the total increase, not per second.'], ['120 requests per second', 'That is per minute (600 / 5).'], ['0.5 requests per second', 'Not the increase divided by the window in seconds.']], answer: 0, explanation: '600 / 300 s = 2 per second.' }),
  mcq({ ...q(OB), id: 'devops.ob.q2', type: 'concept', difficulty: 'easy', stem: 'Which Prometheus metric type is best for "number of requests currently in flight"?', options: ['Gauge', ['Counter', 'Counters only increase.'], ['Histogram', 'It records distributions of observed values.'], ['Summary of strings', 'Not a metric type.']], answer: 0, explanation: 'A gauge can go up and down.' }),
  mcq({ ...q(OB), id: 'devops.ob.q3', type: 'concept', difficulty: 'medium', stem: 'You want an alert when more than 5% of requests fail, but not for one-minute blips. What should the rule include?', options: ['A ratio expression of 5xx rate over total rate, with `for: 10m`', ['An alert on raw counter value above 5', 'Counters only grow.'], ['An alert on CPU only', 'A cause, not the user-visible symptom.'], ['No condition duration', 'It would flap on blips.']], answer: 0, explanation: 'Alert on the symptom and require it to persist.' }),
  mcq({ ...q(OB), id: 'devops.ob.q4', type: 'concept', difficulty: 'medium', stem: 'A pod crashed and restarted. Which command shows the logs from the container\'s previous run?', options: ['`kubectl logs <pod> --previous`', ['`kubectl get pods`', 'It lists pods, not logs.'], ['`kubectl top pod`', 'It shows resource usage.'], ['`kubectl delete pod`', 'It would destroy evidence.']], answer: 0, explanation: '`--previous` reads the terminated container instance\'s logs.' }),
  mcq({ ...q(OB), id: 'devops.ob.q5', type: 'concept', difficulty: 'medium', stem: 'During a major outage that began right after a deployment, what should the team do first?', options: ['Mitigate (for example roll back the deployment) and communicate, then investigate the root cause', ['Write the post-mortem', 'Comes after recovery.'], ['Find out whose fault it is', 'Blameless culture; restore service first.'], ['Wait for more data', 'Delays recovery.']], answer: 0, explanation: 'Restore service first; "what changed?" usually points to a quick mitigation.' }),
  mcq({ ...q(OB), id: 'devops.ob.q6', type: 'concept', difficulty: 'medium', stem: 'Why should containerised applications write logs to stdout instead of files inside the container?', options: ['The platform can collect stdout streams centrally, and files vanish with the container', ['stdout is encrypted', 'Not the reason.'], ['Files cannot be written in containers', 'They can, but are ephemeral.'], ['It makes the app faster', 'Not the reason.']], answer: 0, explanation: 'Twelve-factor: treat logs as event streams handled by the environment.' }),
  mcq({ ...q(OB), id: 'devops.ob.q7', type: 'concept', difficulty: 'hard', stem: 'Which expression yields the 99th-percentile request latency from a Prometheus histogram?', options: ['`histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))`', ['`avg(http_request_duration_seconds_sum)`', 'An average of a counter is not a percentile.'], ['`max(http_requests_total)`', 'Not a latency measure.'], ['`rate(http_request_duration_seconds_count[5m]) * 0.99`', 'Scales a request rate, not latency.']], answer: 0, explanation: 'Quantiles are estimated from the rate of the cumulative `_bucket` series, aggregated across instances by `le`.' }),
];

// ---------------------------------------------------------------------------------------
const CS = 'devops.cloud-security';
const cloudSec = dTopic({
  id: CS, title: 'Cloud Security Basics', level: 'core', estMinutes: 45, prerequisites: ['devops.aws'], related: ['core.security-fundamentals', 'devops.cicd', 'sd.auth'],
  summary: 'Shared responsibility, secrets and least privilege.',
  objectives: ['Explain shared responsibility and the most common cloud breach causes.', 'Apply least privilege, MFA and role-based access, and manage secrets properly.', 'Secure networks, data (encryption at rest and in transit) and containers at a basic level.', 'Describe logging, detection and supply-chain hygiene.'],
  sections: [
    { id: 'model', kind: 'concept', title: 'Shared responsibility and common failure causes', bodyMd: `The provider secures the **cloud itself** (data centres, hardware, hypervisors, managed-service internals). **You** secure everything you configure: identities, network rules, OS and application patches, data classification and encryption, and application code. The more managed the service, the less you own (Lambda vs EC2), but identity, data and configuration are always yours.

**Most real-world cloud breaches are misconfigurations and credential leaks, not exotic hacking:**
- Publicly readable **storage buckets** or snapshots.
- **Leaked access keys** committed to Git or baked into images and client apps.
- **Over-permissive IAM** (\`*:*\`) so one stolen token owns the account.
- Databases and admin ports (22, 3389, 5432, 6379, Kubernetes API) open to \`0.0.0.0/0\`.
- **SSRF** against the instance metadata service to steal role credentials (mitigate with IMDSv2).
- Unpatched software and vulnerable or untrusted dependencies and images.
- No MFA, no logging, so attacks go unnoticed.` },
    { id: 'identity', kind: 'concept', title: 'Identity, least privilege and secrets', bodyMd: `- **Least privilege:** grant only the actions and resources needed, scoped further by conditions (source IP/VPC, MFA, tags, time). Start with nothing and add; review unused permissions (IAM Access Analyzer, last-used data). Separate **accounts/projects** per environment and use **organization-level guardrails** (SCPs/policies) as hard limits.
- **MFA everywhere**, especially for the root/owner account and privileged users; use SSO with short-lived sessions; remove standing admin access (just-in-time elevation).
- **Workloads use roles/workload identity, not static keys**: temporary credentials that rotate automatically. If a key must exist, scope it narrowly, rotate it and monitor its use.
- **Secrets management:** keep passwords, API keys and certificates in a secrets manager (AWS Secrets Manager/SSM Parameter Store, HashiCorp Vault, GCP Secret Manager), encrypted with KMS, with access policies, audit logs and **automatic rotation**. Don't put secrets in source control, container images, plain environment files or CI logs; environment variables are convenient but leak into crash dumps and process listings, so prefer fetching at runtime or mounting from a secret store.
- **Prevent leaks:** pre-commit and CI **secret scanning** (for example patterns like AWS access key ids \`AKIA…\`); if a secret leaks, **assume compromised: rotate it immediately**; deleting the commit is not enough, since it remains in history and clones.` },
    { id: 'network-data', kind: 'concept', title: 'Network and data protection', bodyMd: `- **Network:** private subnets for apps and databases; only load balancers/gateways are public; security groups allow specific ports from specific sources (never \`0.0.0.0/0\` to databases or SSH); admin access through **SSM Session Manager/bastion/VPN**, not open SSH; **VPC endpoints** so traffic to cloud services stays private; **WAF** and DDoS protection at the edge; egress controls to limit data exfiltration.
- **Encryption in transit:** TLS everywhere, including internal service traffic where feasible (mTLS in a mesh), with certificates managed and rotated automatically (ACM, cert-manager).
- **Encryption at rest:** disks, object storage, databases and backups use provider-managed or customer-managed keys in a **KMS**; control who may use a key separately from who may read the data (envelope encryption: a data key encrypted by a master key).
- **Data lifecycle:** classify data, minimise what you store, set retention and deletion, back up and test restores, enable **versioning/object lock** to survive ransomware or accidents, block public access at the account level.
- **Zero trust mindset:** do not trust a request because it comes from "inside" the network; authenticate and authorise every request, and segment the network.` },
    { id: 'containers', kind: 'concept', title: 'Containers, supply chain and detection', bodyMd: `- **Images:** small trusted base images (distroless/alpine), pin versions/digests, **scan for vulnerabilities** in CI and registry, don't bake secrets, rebuild regularly, sign images.
- **Runtime:** run as a **non-root user**, read-only root filesystem, drop Linux capabilities, no \`--privileged\`, set CPU/memory limits; in Kubernetes use **RBAC** with least privilege, **Pod Security** standards, **NetworkPolicies**, secrets from a store (with encryption at rest), and keep the API server private.
- **Supply chain:** pin and verify dependencies (lockfiles, checksums), scan for known vulnerabilities (SCA), keep an **SBOM**, protect the CI system and its credentials, review third-party actions/plugins, and require code review plus signed builds.
- **Logging and detection:** enable **CloudTrail/audit logs** in every account and send them to a protected, separate account; alert on risky events (root login, IAM policy changes, security groups opened to the world, disabled logging, unusual API activity), and use managed detection (GuardDuty and similar).
- **Incident readiness:** documented procedure to revoke credentials, isolate resources, preserve evidence and restore from clean backups; practise it.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Believing "the cloud provider handles security".
2. Using one over-privileged key/role for everything.
3. Committing secrets, then only deleting the file instead of rotating them.
4. Opening SSH or a database to the whole Internet "temporarily".
5. Encrypting data but giving broad access to the encryption key.
6. Logging nothing, or logging secrets and personal data.
7. Running containers as root with the host Docker socket mounted.
8. Trusting internal traffic and skipping authentication between services.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the shared responsibility model.', answerMd: 'The cloud provider is responsible for the security of the underlying infrastructure (facilities, hardware, hypervisor, managed-service platforms). The customer is responsible for security in the cloud: identities and access, network configuration, data and its encryption, guest OS and application patching, and configuration of the services they use.' },
    { id: 'iq2', q: 'An access key was committed to a public repository. What do you do?', answerMd: 'Treat it as compromised: immediately deactivate and rotate the key, review CloudTrail for activity made with it, revoke any sessions, and remove it from the code, but deleting the commit is not sufficient because it persists in history and forks. Then add secret scanning and move the workload to roles or a secrets manager.' },
    { id: 'iq3', q: 'How do you apply least privilege in practice?', answerMd: 'Grant specific actions on specific resources with conditions, use roles for workloads, separate accounts per environment, add organisation-level guardrails, review permissions regularly using last-accessed data, and use just-in-time elevation for admin tasks instead of standing access.' },
    { id: 'iq4', q: 'How should applications get database passwords?', answerMd: 'From a secrets manager (such as AWS Secrets Manager or Vault) accessed through the workload\'s role at runtime, with encryption, audit logging and rotation; not from source control, container images or shared config files. Better still, use IAM database authentication or short-lived credentials.' },
    { id: 'iq5', q: 'What would you check to harden a Kubernetes cluster?', answerMd: 'Private API endpoint and strong authentication, least-privilege RBAC, Pod Security standards (non-root, no privileged containers), NetworkPolicies for segmentation, secrets from an encrypted store, image scanning and signing, resource limits, audit logging, and timely upgrades.' },
  ],
  revision: { notesMd: `- Shared responsibility: provider = cloud; you = identities, network config, data, OS/app patches.
- Top causes: public buckets, leaked keys, over-permissive IAM, open ports to 0.0.0.0/0, IMDS/SSRF, no MFA/logging.
- Least privilege + MFA + roles/workload identity instead of static keys; separate accounts; guardrails.
- Secrets: manager + KMS + rotation + audit; never in git/images/CI logs; leak ⇒ rotate immediately.
- Network: private subnets, SG allow-lists, no open admin ports (use SSM/VPN), VPC endpoints, WAF. Encrypt at rest (KMS) and in transit (TLS/mTLS).
- Containers: non-root, scanned/signed minimal images, RBAC, NetworkPolicy. CloudTrail/audit logs to a separate account.`, flashcards: [
    { id: 'f1', front: 'First response to a leaked access key?', backMd: 'Deactivate and rotate it, then review audit logs for misuse.' },
    { id: 'f2', front: 'Workloads should authenticate with…', backMd: 'Roles / workload identity (temporary credentials), not static keys.' },
    { id: 'f3', front: 'Safe way to reach a private server?', backMd: 'SSM Session Manager, a bastion or VPN, not SSH open to the Internet.' },
    { id: 'f4', front: 'Where do secrets belong?', backMd: 'In a secrets manager with KMS encryption, access control, audit and rotation.' },
    { id: 'f5', front: 'What does IMDSv2 mitigate?', backMd: 'SSRF-based theft of instance role credentials.' },
    { id: 'f6', front: 'Why does zero trust matter?', backMd: 'Being on the internal network must not imply being authorised.' },
  ] },
  resources: [doc('AWS Shared Responsibility Model', 'https://aws.amazon.com/compliance/shared-responsibility-model/'), doc('AWS IAM: Security best practices', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html'), { title: 'OWASP Cheat Sheet: Secrets Management', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html', kind: 'article' }, doc('Kubernetes: Security checklist', 'https://kubernetes.io/docs/concepts/security/security-checklist/')],
});

const csMcqs: MCQ[] = [
  mcq({ ...q(CS), id: 'devops.cs.q1', type: 'concept', difficulty: 'easy', stem: 'Under the shared responsibility model, who is responsible for the IAM policies and security-group rules of your account?', options: ['You (the customer)', ['The cloud provider', 'The provider secures the infrastructure, not your configuration.'], ['Both equally for every setting', 'Configuration is the customer\'s.'], ['Nobody', 'Someone must be.']], answer: 0, explanation: 'Security "in" the cloud, including configuration, is the customer\'s duty.' }),
  mcq({ ...q(CS), id: 'devops.cs.q2', type: 'scenario', difficulty: 'medium', stem: 'You discover an AWS access key in a public Git repository. What is the correct first action?', options: ['Deactivate and rotate the key immediately, then review CloudTrail for misuse', ['Delete the file in a new commit', 'The key stays in history and forks; it is still valid.'], ['Make the repository private and wait', 'The key may already have been harvested.'], ['Email the team', 'Not an immediate containment.']], answer: 0, explanation: 'Assume compromise. Revoke first, clean up afterwards.' }),
  mcq({ ...q(CS), id: 'devops.cs.q3', type: 'concept', difficulty: 'medium', stem: 'Which security-group rule on a production database is the most dangerous?', options: ['Inbound TCP 5432 from 0.0.0.0/0', ['Inbound TCP 5432 from the app tier\'s security group', 'The intended design.'], ['Inbound TCP 5432 from a bastion\'s security group', 'Limited and auditable.'], ['No inbound rules', 'Safe but unusable; not dangerous.']], answer: 0, explanation: 'A database open to the world is a classic breach path.' }),
  mcq({ ...q(CS), id: 'devops.cs.q4', type: 'concept', difficulty: 'medium', stem: 'How should a service obtain its database password at runtime?', options: ['From a secrets manager via its IAM role, with rotation and audit logging', ['From a plaintext file committed to the repository', 'Anyone with repo access sees it.'], ['From an environment variable baked into the image', 'Image layers expose it.'], ['By hard-coding it in the source', 'Worst option.']], answer: 0, explanation: 'Central, audited, rotating secret storage beats static configuration.' }),
  mcq({ ...q(CS), id: 'devops.cs.q5', type: 'concept', difficulty: 'medium', stem: 'Which practice best limits the damage from a stolen credential?', options: ['Least-privilege, short-lived credentials with MFA and monitoring', ['One admin credential shared by the team', 'Maximum blast radius.'], ['Never rotating keys', 'Extends exposure.'], ['Disabling logging for performance', 'Removes detection.']], answer: 0, explanation: 'Narrow scope and short lifetime reduce what an attacker can do and for how long.' }),
  mcq({ ...q(CS), id: 'devops.cs.q6', type: 'concept', difficulty: 'medium', stem: 'A container image is built to run as root with `--privileged` for convenience. What is the risk?', options: ['A compromise of the app can escalate to the host and other containers', ['The image will be larger', 'Not a security risk.'], ['Logs will be lost', 'Unrelated.'], ['DNS will break', 'Unrelated.']], answer: 0, explanation: 'Run as a non-root user with minimal capabilities and no privileged mode.' }),
  mcq({ ...q(CS), id: 'devops.cs.q7', type: 'concept', difficulty: 'medium', stem: 'Why enable CloudTrail (audit logs) in every account and ship them to a separate, protected account?', options: ['To detect and investigate who did what, with logs an attacker in the workload account cannot tamper with', ['To speed up API calls', 'Not a performance feature.'], ['To encrypt S3 buckets', 'Unrelated.'], ['To avoid needing IAM', 'Does not replace IAM.']], answer: 0, explanation: 'Audit trails are only trustworthy if the attacker cannot delete them.' }),
];

// ---------------------------------------------------------------------------------------
const KA = 'devops.k8s-advanced';
const k8sAdv = dTopic({
  id: KA, title: 'Kubernetes Advanced', level: 'advanced', estMinutes: 60, prerequisites: ['devops.k8s-core'], related: ['devops.docker', 'devops.cloud-security', 'devops.observability'],
  summary: 'Ingress, HPA, persistent volumes, StatefulSets and Helm.',
  objectives: ['Route external traffic with Ingress and Services, and explain the role of an ingress controller.', 'Compute HPA scaling decisions and set resource requests/limits with QoS classes in mind.', 'Choose StatefulSet, DaemonSet, Job/CronJob and Deployment correctly, and use PV/PVC/StorageClass.', 'Package and release with Helm, and apply scheduling, disruption and security controls.'],
  sections: [
    { id: 'ingress', kind: 'concept', title: 'Services, Ingress and controllers', bodyMd: `Service types: **ClusterIP** (virtual IP inside the cluster), **NodePort** (opens a port on every node), **LoadBalancer** (provisions a cloud load balancer, one per Service: costly at scale).

**Ingress** is an API object describing **L7 HTTP(S) routing** (host and path rules → Services, TLS certificates) for many services behind **one** entry point. It does nothing by itself: an **ingress controller** (NGINX, Traefik, HAProxy, cloud ALB controller, Envoy-based gateways) watches Ingress objects and configures a proxy. The newer **Gateway API** is the more expressive successor.

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: web }
spec:
  ingressClassName: nginx
  tls: [{ hosts: [shop.example.com], secretName: shop-tls }]   # cert-manager can issue/renew it
  rules:
  - host: shop.example.com
    http:
      paths:
      - { path: /api, pathType: Prefix, backend: { service: { name: api, port: { number: 80 } } } }
      - { path: /,    pathType: Prefix, backend: { service: { name: web, port: { number: 80 } } } }
\`\`\`

**NetworkPolicy** restricts pod-to-pod traffic (default: everything may talk to everything); it needs a CNI that enforces it (Calico, Cilium).` },
    { id: 'scaling', kind: 'concept', title: 'Resources, QoS and autoscaling', bodyMd: `- **Requests** are what the scheduler **reserves** (a pod fits on a node only if requests fit); **limits** are the cap enforced at runtime: exceeding the **memory limit → OOMKilled**; exceeding the **CPU limit → throttled**, not killed.
- **QoS classes:** **Guaranteed** (requests = limits for all containers), **Burstable** (some requests), **BestEffort** (none). Under node pressure BestEffort pods are evicted first, Guaranteed last.
- **HPA (Horizontal Pod Autoscaler):** adjusts replica count from metrics (CPU or memory utilisation **relative to requests**, or custom/external metrics via metrics-server/Prometheus adapter). The core formula:

  **desiredReplicas = ⌈ currentReplicas × currentMetricValue / targetMetricValue ⌉**

  Example: 4 replicas at 80% average CPU with a 50% target → ⌈4 × 80 / 50⌉ = ⌈6.4⌉ = **7**. HPA has a tolerance (about 10%), stabilisation windows to avoid flapping, and min/max bounds. It **requires CPU requests to be set**.
- **VPA** right-sizes requests/limits per pod; **Cluster Autoscaler/Karpenter** adds nodes when pods are unschedulable and removes idle nodes. Don't let HPA and VPA both act on CPU for the same workload.
- **PodDisruptionBudget (PDB):** limits voluntary disruptions (node drains, upgrades) so a minimum number of pods stays available (\`minAvailable: 2\`).` },
    { id: 'workloads', kind: 'comparison', title: 'Choosing the workload type and handling storage', bodyMd: `| Kind | Use for | Key traits |
|---|---|---|
| **Deployment** | stateless apps | interchangeable pods, rolling updates |
| **StatefulSet** | databases, Kafka, ZooKeeper | **stable network identity** (\`db-0\`, \`db-1\`), **ordered** start/stop, **per-pod PersistentVolumeClaim** that follows the pod |
| **DaemonSet** | one pod per node | log/metrics agents, CNI, node tools |
| **Job / CronJob** | run-to-completion / scheduled batch | retries (\`backoffLimit\`), schedules, \`concurrencyPolicy\` |

**Storage:** a **PersistentVolume (PV)** is a piece of storage; a **PersistentVolumeClaim (PVC)** is a pod's request for it (size, access mode); a **StorageClass** provisions PVs dynamically (for example an EBS gp3 volume). Access modes: **RWO** (one node), **RWX** (many nodes, e.g. NFS/EFS), **ROX**. The \`reclaimPolicy\` (Delete/Retain) decides what happens to data when the PVC is deleted. Volumes are zone-bound for block storage: a pod must schedule in the same AZ as its volume.

**Rolling update arithmetic:** with 10 replicas, \`maxSurge: 25%\`, \`maxUnavailable: 25%\` → surge rounds **up** (3), unavailable rounds **down** (2): up to 13 pods exist, at least 8 are available.

Stateful workloads in Kubernetes need real operational care (backups, failover): often an **Operator** (custom controller + CRDs, e.g. for Postgres) or a managed database service is the better choice.` },
    { id: 'helm', kind: 'concept', title: 'Helm and packaging', bodyMd: `**Helm** is the package manager: a **chart** is a templated set of manifests (\`templates/\`) with defaults in \`values.yaml\`; installing a chart creates a **release** with a revision history.

\`\`\`
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install db bitnami/postgresql -f my-values.yaml --namespace data --create-namespace
helm upgrade --install api ./charts/api --set image.tag=\${GIT_SHA} --atomic --timeout 5m
helm diff upgrade ...      # (plugin) preview changes
helm rollback api 3        # roll back to revision 3
helm template ./charts/api # render manifests locally
\`\`\`

\`--atomic\` rolls back automatically on a failed upgrade. Keep environment differences in **values files** (\`values-prod.yaml\`), not forked charts. **Kustomize** (built into \`kubectl -k\`) is a template-free alternative using overlays and patches. **GitOps** (Argo CD, Flux) keeps the desired state in Git and a controller reconciles the cluster to it, giving auditability and easy rollback.` },
    { id: 'scheduling-security', kind: 'concept', title: 'Scheduling, RBAC and day-2 operations', bodyMd: `- **Scheduling controls:** \`nodeSelector\`/**node affinity** (run on certain nodes), **pod (anti-)affinity** and **topologySpreadConstraints** (spread replicas across zones/nodes), **taints and tolerations** (reserve nodes, e.g. GPUs; a pod runs on a tainted node only if it tolerates the taint).
- **Probes:** *liveness* (restart if stuck), *readiness* (remove from Service endpoints until ready), *startup* (give slow apps time). A bad liveness probe causes restart loops; a bad readiness probe makes a Service return nothing.
- **RBAC:** Roles/ClusterRoles define verbs on resources; RoleBindings attach them to users/groups/ServiceAccounts. Give each workload its own **ServiceAccount** with minimum rights; never use \`cluster-admin\` for apps.
- **ConfigMaps/Secrets:** Secrets are only base64-encoded by default; enable encryption at rest and prefer an external secrets operator.
- **Namespaces + ResourceQuota/LimitRange** for multi-tenant fairness.
- **Debugging:** \`kubectl describe\`, \`kubectl get events --sort-by=.lastTimestamp\`, \`kubectl logs --previous\`, \`kubectl exec\`, \`kubectl debug\` (ephemeral containers), \`kubectl top\`, \`kubectl rollout status/undo\`, and \`kubectl get endpoints\` for Service issues.
- **Upgrades:** one minor version at a time, drain nodes respecting PDBs, test in staging, and watch deprecated APIs.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. No resource requests, so HPA cannot compute utilisation and the scheduler packs nodes blindly.
2. Memory limits set too low (OOMKilled) or CPU limits so low that latency suffers from throttling.
3. One cloud LoadBalancer per service instead of an Ingress.
4. Running databases as plain Deployments with no stable identity or persistent volume.
5. A liveness probe that checks dependencies, killing healthy pods during a downstream outage.
6. Treating Secrets as encrypted.
7. Using \`:latest\` image tags and no rollback plan.
8. Drains that ignore PDBs and take down every replica.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is an Ingress and why does it need a controller?', answerMd: 'An Ingress is a declarative set of HTTP(S) routing rules (host and path to Services, TLS) for one external entry point. It is only data; an ingress controller such as NGINX, Traefik or a cloud load balancer controller watches those objects and configures an actual proxy or load balancer to implement them.' },
    { id: 'iq2', q: 'How does the Horizontal Pod Autoscaler decide the replica count?', answerMd: 'desired = ceil(current replicas × current metric / target metric), within min and max bounds, with a tolerance and stabilisation windows. For CPU it uses utilisation relative to the pods\' CPU requests, so requests must be set. For example 4 pods at 80% with a 50% target scale to 7.' },
    { id: 'iq3', q: 'StatefulSet vs Deployment?', answerMd: 'A Deployment manages interchangeable stateless pods. A StatefulSet gives each pod a stable name and network identity, ordered creation and termination, and its own persistent volume claim that follows it across rescheduling, which suits databases and clustered systems.' },
    { id: 'iq4', q: 'Difference between resource requests and limits?', answerMd: 'Requests are the amount the scheduler reserves and uses for placement; limits are the maximum a container may use. Exceeding a memory limit gets the container OOMKilled; exceeding a CPU limit throttles it. Requests and limits together determine the QoS class and eviction order.' },
    { id: 'iq5', q: 'What does Helm give you over raw manifests?', answerMd: 'Templating with per-environment values, packaging and versioning of an application as a chart, releases with revision history and one-command upgrade or rollback, and a large ecosystem of ready-made charts. Kustomize and GitOps tools address similar needs differently.' },
  ],
  revision: { notesMd: `- Ingress = L7 routing rules; needs an ingress controller; one entry point for many Services (vs one LB per Service).
- Requests = scheduling reservation; limits = cap (memory → OOMKilled, CPU → throttled). QoS: Guaranteed / Burstable / BestEffort.
- HPA: desired = ⌈current × currentMetric / target⌉ (4 pods, 80% vs 50% → 7); needs requests; min/max + stabilisation.
- StatefulSet: stable identity, ordered, per-pod PVC. DaemonSet: one per node. Job/CronJob: batch.
- PV / PVC / StorageClass; RWO vs RWX; zone-bound block volumes.
- Rolling update: surge rounds up, unavailable rounds down. PDB protects availability during drains.
- Helm: chart + values → release, --atomic, rollback. GitOps (Argo CD/Flux).`, flashcards: [
    { id: 'f1', front: 'HPA formula?', backMd: 'desired = ceil(current replicas × current metric / target metric).' },
    { id: 'f2', front: 'What happens when a container exceeds its memory limit?', backMd: 'It is OOMKilled.' },
    { id: 'f3', front: 'What happens when it exceeds its CPU limit?', backMd: 'It is throttled (not killed).' },
    { id: 'f4', front: 'Which workload for a database with stable storage?', backMd: 'StatefulSet (with PVCs), or a managed service/operator.' },
    { id: 'f5', front: 'What does a PodDisruptionBudget do?', backMd: 'Limits voluntary disruptions so a minimum number of pods stays available.' },
    { id: 'f6', front: 'Helm rollback command?', backMd: 'helm rollback <release> <revision>' },
  ] },
  resources: [doc('Kubernetes: Ingress', 'https://kubernetes.io/docs/concepts/services-networking/ingress/'), doc('Kubernetes: Horizontal Pod Autoscaling', 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/'), doc('Kubernetes: StatefulSets', 'https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/'), doc('Helm documentation', 'https://helm.sh/docs/')],
});

const kaMcqs: MCQ[] = [
  mcq({ ...q(KA), id: 'devops.ka.q1', type: 'complexity', difficulty: 'medium', stem: 'A Deployment has 4 replicas with an average CPU utilisation of 80% (relative to requests). The HPA target is 50%. How many replicas does the HPA request?', options: ['7', ['6', 'The formula rounds up: ⌈4 × 80 / 50⌉ = ⌈6.4⌉ = 7.'], ['5', 'That ignores the utilisation ratio.'], ['4', 'The metric is above the target, so it scales out.']], answer: 0, explanation: 'desired = ceil(4 × 80 / 50) = ceil(6.4) = 7.' }),
  mcq({ ...q(KA), id: 'devops.ka.q2', type: 'concept', difficulty: 'medium', stem: 'An HPA based on CPU utilisation shows `<unknown>` for the metric and never scales. What is a likely cause?', options: ['The pods have no CPU requests set (or metrics-server is missing)', ['The pods use too little memory', 'Not related to CPU utilisation targets.'], ['The Service type is ClusterIP', 'Unrelated.'], ['The Ingress is misconfigured', 'Unrelated.']], answer: 0, explanation: 'Utilisation is measured relative to requests; without them there is no denominator.' }),
  mcq({ ...q(KA), id: 'devops.ka.q3', type: 'concept', difficulty: 'medium', stem: 'A container exceeds its CPU limit. What happens?', options: ['It is throttled', ['It is OOMKilled', 'That is for exceeding the memory limit.'], ['The pod is deleted', 'Throttling slows it down but does not kill it.'], ['The node is rebooted', 'No.']], answer: 0, explanation: 'CPU is compressible; memory is not.' }),
  mcq({ ...q(KA), id: 'devops.ka.q4', type: 'concept', difficulty: 'easy', stem: 'You apply an Ingress resource but no traffic is routed. Nothing else is installed. What is missing?', options: ['An ingress controller', ['A bigger node', 'Unrelated.'], ['A ConfigMap named ingress', 'Not required.'], ['A StatefulSet', 'Unrelated.']], answer: 0, explanation: 'Ingress objects are only rules; a controller implements them.' }),
  mcq({ ...q(KA), id: 'devops.ka.q5', type: 'concept', difficulty: 'medium', stem: 'Which workload type fits a 3-node database cluster needing stable names (`db-0`, `db-1`, `db-2`) and per-node persistent disks?', options: ['StatefulSet', ['Deployment', 'Pods are interchangeable and share no per-pod identity.'], ['DaemonSet', 'Runs one pod per node, not a numbered database set.'], ['CronJob', 'For scheduled batch work.']], answer: 0, explanation: 'StatefulSets give ordered, stable identity and volumeClaimTemplates.' }),
  mcq({ ...q(KA), id: 'devops.ka.q6', type: 'complexity', difficulty: 'hard', stem: 'A Deployment of 10 replicas uses `maxSurge: 25%` and `maxUnavailable: 25%`. What are the maximum total pods and the minimum available pods during the rollout?', options: ['13 and 8', ['12 and 7', 'Surge rounds up to 3 and unavailable rounds down to 2.'], ['13 and 7', 'Unavailable rounds down, giving 8 available.'], ['10 and 10', 'Rolling updates allow surge and unavailability.']], answer: 0, explanation: 'Max = 10 + ⌈2.5⌉ = 13; min available = 10 − ⌊2.5⌋ = 8.' }),
  mcq({ ...q(KA), id: 'devops.ka.q7', type: 'concept', difficulty: 'medium', stem: 'You run `helm upgrade` and the release fails halfway. Which flag rolls it back automatically?', options: ['`--atomic`', ['`--dry-run`', 'It only simulates.'], ['`--debug`', 'It prints more output.'], ['`--set image.tag=latest`', 'Not a rollback flag.']], answer: 0, explanation: '`--atomic` rolls back to the previous release if the upgrade does not succeed.' }),
  mcq({ ...q(KA), id: 'devops.ka.q8', type: 'concept', difficulty: 'medium', stem: 'What does a PodDisruptionBudget with `minAvailable: 2` protect against?', options: ['Voluntary disruptions such as node drains reducing the healthy pods below 2', ['Application bugs', 'Unrelated.'], ['Node hardware failure', 'Involuntary disruptions are not blocked by PDBs.'], ['Image pull errors', 'Unrelated.']], answer: 0, explanation: 'A drain waits or is refused if it would violate the budget.' }),
];

// ---------------------------------------------------------------------------------------
const TF = 'devops.iac-terraform';
const terraform = dTopic({
  id: TF, title: 'Infrastructure as Code and Terraform', level: 'advanced', estMinutes: 50, prerequisites: ['devops.aws'], related: ['devops.cicd', 'devops.cloud-security', 'devops.k8s-advanced'],
  summary: 'Plan/apply/state, modules and drift.',
  objectives: ['Explain declarative infrastructure as code, idempotency and why it beats manual console changes.', 'Describe the Terraform workflow (init, plan, apply, destroy) and what the state file does.', 'Use variables, outputs, data sources, count/for_each and modules, and set up a remote backend with locking.', 'Handle drift, imports, secrets in state, and compare Terraform with Ansible, CloudFormation and Pulumi.'],
  sections: [
    { id: 'why', kind: 'concept', title: 'Why infrastructure as code', bodyMd: `Clicking in a cloud console is slow, unrepeatable and invisible. **Infrastructure as Code (IaC)** describes servers, networks, databases and permissions in **version-controlled text files**, giving:
- **Repeatability:** the same code creates identical dev, staging and production environments.
- **Review and audit:** infrastructure changes go through pull requests and CI like application code; Git history is the audit log.
- **Speed and recovery:** rebuild an environment (or a whole region) from code.
- **Less drift:** the code is the source of truth; manual edits are detected and reverted.

**Declarative vs imperative:** declarative tools (**Terraform, CloudFormation**, Kubernetes manifests) state the **desired end state** and the tool works out the steps; imperative scripts (shell, SDK programs) list the steps. Declarative is **idempotent**: applying again changes nothing if reality already matches.

**Tool landscape:** *Terraform/OpenTofu* (multi-cloud, HCL, state file), *CloudFormation/CDK* (AWS-native), *Pulumi* (general-purpose languages), *Ansible/Chef/Puppet* (configuration management inside servers, more procedural). Typical split: Terraform **provisions** the infrastructure; Ansible, user-data, or container images **configure** what runs on it.` },
    { id: 'workflow', kind: 'concept', title: 'The Terraform workflow and state', bodyMd: `\`\`\`
terraform init       # download providers and modules, configure the backend
terraform fmt && terraform validate
terraform plan -out=tfplan   # compute the diff: what will be created (+), changed (~), destroyed (-)
terraform apply tfplan       # make it so
terraform destroy            # tear everything down
\`\`\`

**How it works:** Terraform reads your configuration (desired state), reads the **state file** (what it believes exists and the real resource ids), refreshes against the provider APIs, builds a **dependency graph** (references like \`aws_subnet.a.id\` create ordering; unrelated resources are created in parallel), and produces a **plan**: the minimal set of API calls to converge.

**State** (\`terraform.tfstate\`) maps resource addresses in code to real-world objects. It is essential and **sensitive** (it can contain secrets in plain text):
- Never commit it to Git. Use a **remote backend** (for example an S3 bucket with versioning and encryption plus a lock table such as DynamoDB, Terraform Cloud, or GCS) so the team shares one state and **state locking** prevents two applies running at once.
- Split state per environment/component (blast radius, speed) rather than one giant state.
- **Drift:** someone changed a resource by hand. \`terraform plan\` shows the difference and an apply reverts it (or you update the code). **\`terraform import\`** (or \`import\` blocks) brings an existing resource under management.
- Plans can be unsafe to rubber-stamp: **read the plan**, especially any \`-/+\` (destroy and recreate), such as changing an immutable attribute of a database.` },
    { id: 'language', kind: 'concept', title: 'Configuration language essentials', bodyMd: `- **Providers** connect to platforms (\`aws\`, \`google\`, \`kubernetes\`); pin versions.
- **Resources** create things; **data sources** read existing things; **variables** parameterise; **locals** name expressions; **outputs** expose values (and let modules pass data).
- **\`count\`** and **\`for_each\`** create several similar resources (\`for_each\` keys resources by name, so removing one item in the middle doesn't shift the others like \`count\` would).
- **Modules** are reusable bundles of resources with inputs and outputs (a VPC module, an app-service module): the main way to avoid copy/paste and enforce standards. Pin module versions.
- **Lifecycle** rules: \`prevent_destroy\`, \`create_before_destroy\`, \`ignore_changes\`.
- **Workspaces** give several states for one configuration (many teams prefer separate directories/backends per environment).
- **Sensitive** variables hide values in output but not in state; prefer fetching secrets from a secrets manager at runtime.`, code: [hcl(`terraform {
  required_providers { aws = { source = "hashicorp/aws", version = "~> 5.0" } }
  backend "s3" {                      # remote state with locking
    bucket         = "acme-tfstate"
    key            = "prod/network.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "tf-locks"
    encrypt        = true
  }
}

variable "azs" {
  type    = list(string)
  default = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "private" {
  for_each          = toset(var.azs)                       # 3 subnets, keyed by AZ name
  vpc_id            = aws_vpc.main.id                      # implicit dependency on the VPC
  availability_zone = each.key
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, index(var.azs, each.key))  # 10.0.0.0/24, 10.0.1.0/24, ...
}

output "private_subnet_ids" {
  value = [for s in aws_subnet.private : s.id]
}`, 'Remote backend, for_each and an implicit dependency')] },
    { id: 'practice', kind: 'concept', title: 'IaC in a team and with CI/CD', bodyMd: `- **Pipeline:** on pull request run \`fmt\`, \`validate\`, static analysis/policy checks (tflint, Checkov, tfsec, OPA/Sentinel) and **post the plan** as a comment for review; on merge to main **apply** (with approval for production), using short-lived cloud credentials (OIDC), not stored keys.
- **Environments:** same modules, different variables; promote changes dev → staging → production.
- **Secrets:** don't put them in \`.tf\` files or variables files in Git; state may still hold them, so encrypt and restrict the state bucket.
- **Safety:** least-privilege deployment role, \`prevent_destroy\` on critical data stores, deletion protection on databases, targeted plans reviewed carefully, small changes frequently.
- **Testing:** \`terraform validate\`, plan assertions/policy tests, ephemeral environments, and (for modules) integration tests such as Terratest.
- **Terraform vs CloudFormation:** Terraform is multi-cloud with a large provider ecosystem and a plan step you manage state for; CloudFormation is AWS-only, has no separate state file to manage (AWS holds it) and supports automatic rollback of failed stacks.
- **Terraform vs Ansible:** Terraform builds cloud resources declaratively and tracks them in state; Ansible configures operating systems and applications over SSH procedurally (agentless), and is idempotent only if its modules are written that way.
- **GitOps for Kubernetes** applies the same idea to cluster state; Crossplane/Cluster API extend it to cloud resources.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Local state files, or state committed to Git.
2. Making manual console changes that create drift.
3. Applying without reading the plan (especially destroy/recreate).
4. One giant state for everything: slow plans and a huge blast radius.
5. \`count\` with a list whose items are reordered or removed, recreating resources.
6. Hard-coding secrets or long-lived credentials in code and pipelines.
7. Unpinned provider and module versions, so a re-run behaves differently.
8. No locking, so two engineers apply simultaneously and corrupt state.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is Terraform state and why is remote state important?', answerMd: 'State records the mapping between the resources declared in code and the real objects (with their ids and attributes), so Terraform can compute what to change. Remote state in a shared, versioned, encrypted backend with locking lets a team collaborate safely, prevents concurrent applies and keeps sensitive data out of Git.' },
    { id: 'iq2', q: 'What does `terraform plan` do and why does it matter?', answerMd: 'It compares the desired configuration with the state and the real infrastructure and prints the exact creates, updates and destroys that apply would perform, without changing anything. Reviewing it, especially for destroy and recreate actions, is the safety step before applying.' },
    { id: 'iq3', q: 'Someone changed a security group manually in the console. What happens next time you run Terraform?', answerMd: 'This is drift. `terraform plan` detects the difference between the real resource and the configuration and proposes to revert it. You either apply to restore the declared state, or update the code if the change was intended.' },
    { id: 'iq4', q: 'Why prefer `for_each` over `count` for a set of named resources?', answerMd: 'for_each tracks each instance by a stable key, so adding or removing one item only affects that instance. With count, instances are tracked by index, so removing an element from the middle of a list shifts the indexes and causes unrelated resources to be destroyed and recreated.' },
    { id: 'iq5', q: 'Terraform vs Ansible?', answerMd: 'Terraform is declarative provisioning of infrastructure (networks, instances, databases, permissions) with a state file and a plan/apply cycle. Ansible is agentless configuration management that runs ordered tasks on machines (install packages, template config files, restart services). They are often combined: Terraform creates the servers, Ansible or images configure them.' },
  ],
  revision: { notesMd: `- IaC: repeatable, reviewable (PRs), auditable (Git), recoverable; declarative = desired state, idempotent.
- Workflow: init → fmt/validate → plan → apply → destroy. Plan = diff; read destroy/recreate (-/+).
- State maps code → real resources; sensitive; remote backend (S3 + lock) with versioning/encryption; split per env/component.
- Drift: plan shows, apply reverts; import adopts existing resources.
- for_each (stable keys) vs count (index shifts); modules for reuse (pin versions); lifecycle prevent_destroy.
- CI: validate + policy checks + plan on PR, apply on merge with OIDC creds. Terraform provisions; Ansible configures.`, flashcards: [
    { id: 'f1', front: 'What does terraform plan do?', backMd: 'Shows the creates/updates/destroys needed to match the code, without applying.' },
    { id: 'f2', front: 'Why use remote state with locking?', backMd: 'Shared source of truth and no concurrent applies corrupting state.' },
    { id: 'f3', front: 'What is drift?', backMd: 'Real infrastructure differing from the declared configuration (e.g. manual console edits).' },
    { id: 'f4', front: 'for_each vs count?', backMd: 'for_each keys by stable names; count uses indexes that shift on removal.' },
    { id: 'f5', front: 'How do you bring an existing resource under Terraform?', backMd: 'terraform import (or an import block).' },
    { id: 'f6', front: 'Does Terraform state contain secrets?', backMd: 'It can, in plain text: protect and encrypt the state backend.' },
  ] },
  resources: [doc('Terraform: Core workflow', 'https://developer.hashicorp.com/terraform/intro/core-workflow'), doc('Terraform: State', 'https://developer.hashicorp.com/terraform/language/state'), doc('Terraform: Modules', 'https://developer.hashicorp.com/terraform/language/modules'), doc('OpenTofu documentation', 'https://opentofu.org/docs/')],
});

const tfMcqs: MCQ[] = [
  mcq({ ...q(TF), id: 'devops.tf.q1', type: 'concept', difficulty: 'easy', stem: 'What does `terraform plan` do?', options: ['Shows what changes `apply` would make, without changing anything', ['Creates the resources immediately', 'That is `apply`.'], ['Deletes unused resources', 'That is `destroy` (or an apply that removes them).'], ['Downloads providers only', 'That is `init`.']], answer: 0, explanation: 'Plan compares configuration, state and reality, and prints the proposed actions.' }),
  mcq({ ...q(TF), id: 'devops.tf.q2', type: 'concept', difficulty: 'medium', stem: 'Two engineers run `terraform apply` against the same local state file at the same time. What is the risk, and what prevents it?', options: ['State corruption or conflicting changes; a remote backend with state locking', ['Nothing, Terraform merges them', 'There is no automatic merge.'], ['Providers are downloaded twice', 'Harmless.'], ['Higher cloud costs only', 'The risk is inconsistent state.']], answer: 0, explanation: 'Use a shared remote backend that locks the state during operations.' }),
  mcq({ ...q(TF), id: 'devops.tf.q3', type: 'concept', difficulty: 'medium', stem: 'Someone resized an instance in the console. What does `terraform plan` show?', options: ['A change to bring the instance back to the size declared in code (drift)', ['Nothing, Terraform ignores console changes', 'It refreshes and detects them.'], ['An error because the console was used', 'It is a normal drift case.'], ['A request to delete the state file', 'No.']], answer: 0, explanation: 'Plan refreshes real state and proposes reverting differences from the configuration.' }),
  mcq({ ...q(TF), id: 'devops.tf.q4', type: 'concept', difficulty: 'medium', stem: 'A list of 3 names is used with `count`, and the second name is removed. What typically happens?', options: ['Indexes shift, so the third resource is destroyed and recreated as index 1 (and index 2 removed)', ['Only the second resource is removed', 'That is how `for_each` behaves with stable keys.'], ['Nothing changes', 'The resources are tracked by index.'], ['Terraform renames the resources in place', 'It does not.']], answer: 0, explanation: 'Use `for_each` with stable keys to avoid index-based churn.' }),
  mcq({ ...q(TF), id: 'devops.tf.q5', type: 'concept', difficulty: 'medium', stem: 'Which statement about the Terraform state file is correct?', options: ['It may contain sensitive values in plain text, so it must be stored in an access-controlled, encrypted backend and not committed to Git', ['It is safe to commit because it only has names', 'It contains ids and attributes, possibly secrets.'], ['It is only needed for `destroy`', 'Plan and apply need it.'], ['It is generated from the cloud console', 'It is maintained by Terraform.']], answer: 0, explanation: 'Treat state as a secret store.' }),
  mcq({ ...q(TF), id: 'devops.tf.q6', type: 'concept', difficulty: 'medium', stem: 'Which description best contrasts Terraform with Ansible?', options: ['Terraform declaratively provisions infrastructure and tracks it in state; Ansible procedurally configures machines over SSH', ['Terraform configures operating systems; Ansible creates cloud networks', 'Reversed.'], ['Both require an agent on every server', 'Ansible is agentless; Terraform needs no agent.'], ['They are identical tools', 'Different purposes.']], answer: 0, explanation: 'They are complementary: provision, then configure.' }),
  mcq({ ...q(TF), id: 'devops.tf.q7', type: 'complexity', difficulty: 'medium', stem: 'A VPC has CIDR `10.0.0.0/16`. Using `cidrsubnet(cidr, 8, n)`, how many distinct /24 subnets can be carved from it?', options: ['256', ['65,536', 'That is the number of addresses in the /16.'], ['16', 'That would use 4 extra bits.'], ['24', 'Confuses the prefix length with the count.']], answer: 0, explanation: 'Adding 8 bits to the prefix (/16 → /24) gives 2⁸ = 256 subnets.' }),
  mcq({ ...q(TF), id: 'devops.tf.q8', type: 'concept', difficulty: 'hard', stem: 'The plan for changing a database parameter shows `-/+ destroy and then create replacement`. What should you do?', options: ['Stop and review: replacing a stateful resource may lose data; consider alternatives, backups or `prevent_destroy` before applying', ['Apply immediately; Terraform knows best', 'Replacement can destroy data.'], ['Delete the state file', 'Would orphan resources.'], ['Disable the plan step', 'Removes the safety net.']], answer: 0, explanation: 'Always read destroy/recreate actions for stateful resources.' }),
];

export const topics: Topic[] = [linuxNet, cicd, aws, observ, cloudSec, k8sAdv, terraform];
export const mcqs: MCQ[] = [...lnMcqs, ...ciMcqs, ...awMcqs, ...obMcqs, ...csMcqs, ...kaMcqs, ...tfMcqs];
