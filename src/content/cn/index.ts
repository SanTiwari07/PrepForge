import type { MCQ, Topic } from '../schema';
import { mcq } from '../helpers';
import { HPBN, MDN_HTTP, cnTopic, q, sh } from './common';
import * as network from './network';
import * as application from './application';

// ---------------------------------------------------------------------------------------
const MO = 'cn.models';
const models = cnTopic({
  id: MO, title: 'OSI and TCP/IP Models', level: 'foundation', estMinutes: 35, prerequisites: [],
  summary: 'Layers, encapsulation and PDUs.',
  objectives: ['Name the OSI and TCP/IP layers and map protocols to them.', 'Explain encapsulation and name the PDU at each layer.', 'Place hubs, switches and routers at the right layer.'],
  sections: [
    { id: 'layers', kind: 'comparison', title: 'Layers and protocols', bodyMd: `| OSI layer | TCP/IP layer | PDU | Examples | Device |
|---|---|---|---|---|
| 7 Application | Application | data | HTTP, DNS, SMTP, SSH | |
| 6 Presentation | Application | data | TLS (encryption), encoding | |
| 5 Session | Application | data | session management | |
| 4 Transport | Transport | segment (TCP) / datagram (UDP) | TCP, UDP | (L4 load balancer) |
| 3 Network | Internet | packet | IP, ICMP | router |
| 2 Data link | Link | frame | Ethernet, Wi-Fi, ARP* | switch |
| 1 Physical | Link | bits | cables, radio | hub, repeater |

*ARP sits between layers 2 and 3: it resolves IP addresses to MAC addresses on the local network.

Mnemonic (top-down): **A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing.` },
    { id: 'encap', kind: 'concept', title: 'Encapsulation', bodyMd: `Sending data wraps it in headers layer by layer: HTTP request → TCP header (ports, sequence numbers) → IP header (source and destination IP, TTL) → Ethernet header and trailer (MAC addresses, FCS) → bits. The receiver unwraps in reverse.

Key consequence: **MAC addresses change at every hop** (each link has its own frame) while **IP addresses stay end-to-end** (except through NAT).` },
    { id: 'dry-run', kind: 'dry-run', title: 'Walkthrough: sending to another network', bodyMd: `Host A (192.168.1.10) sends to a server at 93.184.216.34:

1. A compares the destination with its own subnet (192.168.1.0/24). It is off-subnet, so the packet must go to the **default gateway** 192.168.1.1.
2. A needs the gateway's MAC address. If it is not in the ARP cache, A broadcasts an **ARP request** ("who has 192.168.1.1?"), and the router replies with its MAC.
3. A builds a frame: destination MAC = router, destination IP = server. The **switch** looks up the router's MAC in its MAC table and forwards the frame out of that port only.
4. The router strips the frame, decrements the TTL, looks up the destination IP in its routing table (longest-prefix match), and re-frames the packet for the next link with new MAC addresses.
5. This repeats hop by hop until the server's network delivers it.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Putting routers at layer 2 or switches at layer 3 (layer-3 switches exist, but the classic answer is switch = L2, router = L3).
2. Saying TCP works at the network layer.
3. Thinking the destination MAC address in a frame is the final server's MAC; it is the next hop's (usually the default gateway).
4. Treating the OSI model as how the Internet is actually built; the TCP/IP model is what is implemented, while OSI is the vocabulary.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the OSI model briefly.', answerMd: 'Seven layers from physical (bits on a wire) to application (HTTP and friends). Each layer provides a service to the one above and adds its own header: data link frames with MAC addresses, network packets with IP addresses, transport segments with ports and reliability. In practice the Internet uses the four-layer TCP/IP model.' },
    { id: 'iq2', q: 'Switch vs router?', answerMd: 'A switch forwards frames within a LAN using MAC addresses (layer 2) and learns which port each MAC is on. A router forwards packets between networks using IP addresses and a routing table (layer 3).' },
    { id: 'iq3', q: 'When a packet crosses three routers, which addresses change?', answerMd: 'The source and destination MAC addresses change on every link. The source and destination IP addresses stay the same end to end (unless NAT rewrites them); the TTL is decremented at each router.' },
    { id: 'iq4', q: 'At which layer does TLS operate?', answerMd: 'Between transport and application. In OSI terms it is usually described as presentation or session layer; in TCP/IP terms it is part of the application layer running on top of TCP.' },
  ],
  revision: { notesMd: `- OSI: physical, data link, network, transport, session, presentation, application.
- PDUs: bits, frame, packet, segment/datagram, data.
- Hub L1, switch L2 (MAC), router L3 (IP).
- MACs change per hop; IPs stay end-to-end.`, flashcards: [
    { id: 'f1', front: 'PDU at the transport layer (TCP)?', backMd: 'Segment.' },
    { id: 'f2', front: 'Layer of a router?', backMd: 'Network (3).' },
    { id: 'f3', front: 'Which address changes at every hop?', backMd: 'The MAC address.' },
    { id: 'f4', front: 'TCP/IP model layers?', backMd: 'Link, Internet, Transport, Application.' },
    { id: 'f5', front: 'What does ARP resolve?', backMd: 'An IP address to a MAC address on the local network.' },
  ] },
  resources: [HPBN, { title: 'Cloudflare Learning: What is the OSI model?', url: 'https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/', kind: 'article' }],
});

const moMcqs: MCQ[] = [
  mcq({ ...q(MO), id: 'cn.mo.q1', type: 'concept', difficulty: 'easy', stem: 'At which OSI layer does a router primarily operate?', options: ['Network (layer 3)', ['Data link (layer 2)', 'That is a switch.'], ['Transport (layer 4)', 'Routers do not look at ports for forwarding.'], ['Physical (layer 1)', 'That is a hub or repeater.']], answer: 0, explanation: 'Routers forward packets based on destination IP addresses.' }),
  mcq({ ...q(MO), id: 'cn.mo.q2', type: 'concept', difficulty: 'easy', stem: 'What is the PDU called at the data link layer?', options: ['Frame', ['Packet', 'That is the network layer.'], ['Segment', 'That is the transport layer (TCP).'], ['Bit', 'That is the physical layer.']], answer: 0, explanation: 'Ethernet frames carry MAC addresses and a frame check sequence.' }),
  mcq({ ...q(MO), id: 'cn.mo.q3', type: 'scenario', difficulty: 'medium', stem: 'Your laptop sends a packet to a server on the Internet. What is the destination MAC address in the frame that leaves the laptop?', options: ['The MAC address of the default gateway (router)', ['The server\'s MAC address', 'MAC addresses are only meaningful on the local link.'], ['The broadcast MAC FF:FF:FF:FF:FF:FF', 'That is used for ARP requests, not data.'], ['The laptop\'s own MAC', 'That is the source.']], answer: 0, explanation: 'Off-subnet traffic goes to the gateway; the IP destination is still the server.' }),
  mcq({ ...q(MO), id: 'cn.mo.q4', type: 'concept', difficulty: 'easy', stem: 'Which protocol pair belongs to the transport layer?', options: ['TCP and UDP', ['IP and ICMP', 'Network layer.'], ['HTTP and DNS', 'Application layer.'], ['Ethernet and ARP', 'Link layer.']], answer: 0, explanation: 'The transport layer provides process-to-process delivery using ports.' }),
  mcq({ ...q(MO), id: 'cn.mo.q5', type: 'concept', difficulty: 'medium', stem: 'Which header field changes at every router hop, besides the link-layer addresses?', options: ['IP TTL (and therefore the IP header checksum)', ['Destination IP address', 'It stays end-to-end without NAT.'], ['TCP destination port', 'Routers do not modify it.'], ['HTTP Host header', 'Routers never touch application data.']], answer: 0, explanation: 'Each router decrements TTL and drops the packet when it reaches 0 (traceroute exploits this).' }),
  mcq({ ...q(MO), id: 'cn.mo.q6', type: 'concept', difficulty: 'easy', stem: 'A switch decides where to forward a frame using:', options: ['Its MAC address table (learned from source MACs of incoming frames)', ['A routing table of IP prefixes', 'That is a router.'], ['DNS', 'Unrelated.'], ['The TCP port', 'Layer 4, not used by a plain switch.']], answer: 0, explanation: 'Unknown destinations are flooded until learned.' }),
];

// ---------------------------------------------------------------------------------------
const IP = 'cn.ip-subnetting';
const ipSub = cnTopic({
  id: IP, title: 'IP Addressing and Subnetting', level: 'core', estMinutes: 50, prerequisites: [MO],
  summary: 'IPv4, CIDR, subnetting and IPv6 basics.',
  objectives: ['Compute network, broadcast, host range and host count for any CIDR block.', 'Pick the smallest prefix for a required number of hosts.', 'Recognise private ranges and special addresses.', 'Explain why IPv6 exists and its basic notation.'],
  sections: [
    { id: 'cidr', kind: 'concept', title: 'CIDR in one page', bodyMd: `An IPv4 address is 32 bits. **/n** means the first n bits are the network part.

- Addresses in the block = 2^(32 − n). **Usable hosts = 2^(32 − n) − 2** (network and broadcast addresses are reserved; /31 and /32 are special cases).
- **Network address** = IP AND mask; **broadcast** = network OR (NOT mask).
- Masks: /24 = 255.255.255.0, /25 = .128, /26 = .192, /27 = .224, /28 = .240, /20 = 255.255.240.0.

Quick method: the **block size** in the interesting octet is 256 − mask octet. For /26 it is 64, so networks start at .0, .64, .128, .192.

Use the **Subnet calculator** on the Tools page to check your answers.` },
    { id: 'dry-run', kind: 'dry-run', title: 'Worked example: 192.168.10.77/26', bodyMd: `- /26 gives mask 255.255.255.192 and block size 64.
- 77 lies in the block 64–127, so the **network is 192.168.10.64** and the **broadcast is 192.168.10.127**.
- Hosts are .65 to .126: **62 usable**.` },
    { id: 'special', kind: 'concept', title: 'Private and special addresses', bodyMd: `| Range | Use |
|---|---|
| 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 | private (RFC 1918), not routed on the Internet; reach it via NAT |
| 127.0.0.0/8 | loopback |
| 169.254.0.0/16 | link-local (no DHCP answer) |
| 0.0.0.0 | "this host" / any address when binding |

**IPv6:** 128-bit addresses written as 8 groups of hex (\`2001:db8::1\`, where \`::\` compresses zeros). Created because IPv4's ~4.3 billion addresses ran out; no broadcast; NAT is generally unnecessary.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Forgetting the −2 for network and broadcast.
2. Choosing /26 (62 hosts) when 64 hosts are needed; you need /25.
3. Computing the network address by rounding the IP instead of using the block boundaries.
4. Thinking 172.32.x.x is private (the private block is 172.16.0.0–172.31.255.255).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How many usable hosts are in a /27?', answerMd: '2^(32−27) − 2 = 32 − 2 = 30.' },
    { id: 'iq2', q: 'What are the private IPv4 ranges?', answerMd: '10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16 (RFC 1918).' },
    { id: 'iq3', q: 'Why was CIDR introduced?', answerMd: 'Classful addressing (A/B/C) wasted addresses and bloated routing tables. CIDR allows any prefix length, so allocations fit needs and routes can be aggregated (supernetting).' },
    { id: 'iq4', q: 'Why IPv6?', answerMd: 'IPv4 exhaustion. IPv6 provides 2¹²⁸ addresses, simplified headers, built-in autoconfiguration (SLAAC) and removes the need for NAT in most designs.' },
  ],
  revision: { notesMd: `- Usable = 2^(32 − n) − 2.
- Block size = 256 − mask octet.
- /24 .0, /25 .128, /26 .192, /27 .224, /28 .240, /30 = 2 hosts.
- Private: 10/8, 172.16/12, 192.168/16.
- IPv6: 128 bits, hex, :: compression.`, flashcards: [
    { id: 'f1', front: 'Network and broadcast of 192.168.10.77/26?', backMd: '192.168.10.64 and 192.168.10.127.' },
    { id: 'f2', front: 'Usable hosts in a /30?', backMd: '2 (point-to-point links).' },
    { id: 'f3', front: 'Mask for /20?', backMd: '255.255.240.0.' },
    { id: 'f4', front: 'Smallest prefix for 100 hosts?', backMd: '/25 (126 usable).' },
    { id: 'f5', front: 'Private range starting with 172?', backMd: '172.16.0.0/12 (172.16.0.0 to 172.31.255.255).' },
  ] },
  resources: [{ title: 'RFC 1918: Address Allocation for Private Internets', url: 'https://www.rfc-editor.org/rfc/rfc1918', kind: 'official-docs' }, { title: 'RFC 4632: Classless Inter-domain Routing (CIDR)', url: 'https://www.rfc-editor.org/rfc/rfc4632', kind: 'official-docs' }],
});

const ipMcqs: MCQ[] = [
  mcq({ ...q(IP), id: 'cn.ip.q1', type: 'scenario', difficulty: 'medium', stem: 'What is the network address of 192.168.10.77/26?', options: ['192.168.10.64', ['192.168.10.0', 'That would be /24.'], ['192.168.10.77', 'That is the host address.'], ['192.168.10.127', 'That is the broadcast address.']], answer: 0, explanation: 'Block size 64: the blocks are 0, 64, 128, 192, and 77 falls in 64–127.' }),
  mcq({ ...q(IP), id: 'cn.ip.q2', type: 'concept', difficulty: 'easy', stem: 'How many usable host addresses does a /27 provide?', options: ['30', ['32', 'Subtract network and broadcast.'], ['62', 'That is /26.'], ['14', 'That is /28.']], answer: 0, explanation: '2^(32 − 27) − 2 = 32 − 2 = 30 (network and broadcast are reserved).' }),
  mcq({ ...q(IP), id: 'cn.ip.q3', type: 'scenario', difficulty: 'medium', stem: 'A subnet must hold 50 hosts. What is the longest (smallest) prefix that works?', options: ['/26', ['/27', 'Only 30 usable hosts.'], ['/25', 'It works, but it is larger than needed.'], ['/24', 'Much larger than needed.']], answer: 0, explanation: '/26 gives 62 usable hosts ≥ 50; /27 gives only 30.' }),
  mcq({ ...q(IP), id: 'cn.ip.q4', type: 'concept', difficulty: 'easy', stem: 'Which address is NOT in a private (RFC 1918) range?', options: ['172.32.1.1', ['10.200.3.4', '10.0.0.0/8 is private.'], ['192.168.0.10', '192.168.0.0/16 is private.'], ['172.20.5.5', 'Inside 172.16.0.0/12.']], answer: 0, explanation: '172.16.0.0/12 ends at 172.31.255.255.' }),
  mcq({ ...q(IP), id: 'cn.ip.q5', type: 'concept', difficulty: 'medium', stem: 'What is the subnet mask for a /20?', options: ['255.255.240.0', ['255.255.255.240', 'That is /28.'], ['255.255.248.0', 'That is /21.'], ['255.240.0.0', 'That is /12.']], answer: 0, explanation: '20 bits = 8 + 8 + 4, and the third octet 11110000 = 240.' }),
  mcq({ ...q(IP), id: 'cn.ip.q6', type: 'concept', difficulty: 'medium', stem: 'Into how many /27 subnets can a /24 be divided?', options: ['8', ['4', 'That is /26.'], ['16', 'That is /28.'], ['32', 'That is the size of each /27.']], answer: 0, explanation: '2^(27 − 24) = 8 subnets of 32 addresses each.' }),
];

// ---------------------------------------------------------------------------------------
const TU = 'cn.tcp-udp';
const tcpUdp = cnTopic({
  id: TU, title: 'TCP vs UDP', level: 'core', estMinutes: 35, prerequisites: [MO],
  summary: 'Ports, headers and when to use which.',
  objectives: ['Contrast TCP and UDP guarantees and costs.', 'Choose the right protocol for a scenario.', 'Explain ports and the 4-tuple that identifies a connection.', 'Know common well-known ports.'],
  sections: [
    { id: 'compare', kind: 'comparison', title: 'Comparison', bodyMd: `| | TCP | UDP |
|---|---|---|
| Connection | connection-oriented (handshake) | connectionless |
| Reliability | retransmission, acknowledgements | none (application decides) |
| Ordering | in-order byte stream | datagrams may arrive out of order or duplicated |
| Flow and congestion control | yes | no |
| Header | 20–60 bytes | 8 bytes |
| Boundaries | byte stream (no message boundaries) | preserves datagram boundaries |
| Typical use | HTTP/1.1 and HTTP/2, SSH, databases, email | DNS queries, VoIP, video calls, games, QUIC (HTTP/3) |` },
    { id: 'ports', kind: 'concept', title: 'Ports and sockets', bodyMd: `A connection is identified by the **4-tuple** (source IP, source port, destination IP, destination port) plus the protocol. That is how one server port (443) serves thousands of clients at once.

Well-known ports: SSH **22**, SMTP **25**, DNS **53**, HTTP **80**, HTTPS **443**, MySQL **3306**, PostgreSQL **5432**. Clients use ephemeral ports (for example 49152–65535).` },
    { id: 'when', kind: 'recognition', title: 'Choosing in interviews', bodyMd: `- "Every byte must arrive, in order" (payments, file transfer, APIs): **TCP**.
- "Late data is useless" (live voice and video, game state): **UDP**, with the application handling loss (or newer state replacing lost state).
- "Single small request-response" (DNS): **UDP**, falling back to TCP for large responses.
- Need reliability but no head-of-line blocking across streams: **QUIC** (built on UDP).` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Saying UDP is "unreliable, so never use it in production"; DNS, video calls and HTTP/3 rely on it.
2. Assuming TCP preserves message boundaries; two \`send()\` calls can arrive as one \`recv()\`. You need framing (length prefix or delimiter).
3. Thinking a server needs a new port per client.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'TCP vs UDP?', answerMd: 'TCP is connection-oriented and provides reliable, ordered, flow- and congestion-controlled byte streams at the cost of handshake latency and overhead. UDP is connectionless, sends independent datagrams with an 8-byte header and no guarantees; the application handles loss if it cares.' },
    { id: 'iq2', q: 'Why do video calls use UDP?', answerMd: 'Retransmitting a lost frame arrives too late to be useful and would stall newer data (head-of-line blocking). With UDP the application can skip lost packets and use techniques such as forward error correction.' },
    { id: 'iq3', q: 'How can one web server port handle many clients?', answerMd: 'Each connection is a distinct 4-tuple; the client IP and ephemeral port differ, so the kernel demultiplexes them to different sockets even though the server port is the same.' },
    { id: 'iq4', q: 'Does DNS use TCP or UDP?', answerMd: 'Mostly UDP port 53 for queries. TCP is used for responses too large for UDP (truncated responses), zone transfers, and DNS over TLS.' },
  ],
  revision: { notesMd: `- TCP: reliable, ordered stream, flow and congestion control, 20+ byte header.
- UDP: datagrams, 8-byte header, no guarantees, low latency.
- 4-tuple identifies a connection.
- Ports: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS.
- TCP has no message boundaries, so frame your messages.`, flashcards: [
    { id: 'f1', front: 'UDP header size?', backMd: '8 bytes.' },
    { id: 'f2', front: 'Minimum TCP header size?', backMd: '20 bytes.' },
    { id: 'f3', front: 'What identifies a TCP connection?', backMd: 'The 4-tuple: source IP and port, destination IP and port.' },
    { id: 'f4', front: 'HTTP/3 runs over?', backMd: 'QUIC, which runs over UDP.' },
    { id: 'f5', front: 'Does TCP preserve message boundaries?', backMd: 'No; it is a byte stream.' },
  ] },
  resources: [HPBN, { title: 'RFC 9293: Transmission Control Protocol', url: 'https://www.rfc-editor.org/rfc/rfc9293', kind: 'official-docs' }],
});

const tuMcqs: MCQ[] = [
  mcq({ ...q(TU), id: 'cn.tu.q1', type: 'scenario', difficulty: 'easy', stem: 'Which protocol suits a multiplayer game sending player positions 30 times a second?', options: ['UDP: stale positions are useless, so retransmission only adds delay', ['TCP: every position must arrive', 'A lost update is superseded by the next one.'], ['SMTP', 'An email protocol.'], ['ARP', 'A link-layer protocol.']], answer: 0, explanation: 'Real-time state favours low latency over reliability.' }),
  mcq({ ...q(TU), id: 'cn.tu.q2', type: 'concept', difficulty: 'easy', stem: 'How large is the UDP header?', options: ['8 bytes', ['20 bytes', 'Minimum TCP header.'], ['40 bytes', 'IPv6 header.'], ['4 bytes', 'Too small: it has ports, length and checksum.']], answer: 0, explanation: 'Source port, destination port, length and checksum, 2 bytes each.' }),
  mcq({ ...q(TU), id: 'cn.tu.q3', type: 'debug', difficulty: 'medium', stem: 'A client sends two 100-byte messages with two `send()` calls over TCP. The server\'s single `recv()` returns 200 bytes. What is going on?', options: ['Normal: TCP is a byte stream with no message boundaries, so the application must frame messages', ['Packet duplication', 'Bytes are not duplicated.'], ['A bug in the server OS', 'This is expected behaviour.'], ['UDP was used by mistake', 'UDP would preserve the boundaries.']], answer: 0, explanation: 'Use a length prefix or delimiter to split messages.' }),
  mcq({ ...q(TU), id: 'cn.tu.q4', type: 'concept', difficulty: 'easy', stem: 'Which port does HTTPS use by default?', options: ['443', ['80', 'Plain HTTP.'], ['22', 'SSH.'], ['53', 'DNS.']], answer: 0, explanation: 'TLS-wrapped HTTP uses port 443 by default.' }),
  mcq({ ...q(TU), id: 'cn.tu.q5', type: 'concept', difficulty: 'medium', stem: 'A web server on port 443 has 10,000 active connections. How are they told apart?', options: ['By the 4-tuple (client IP, client port, server IP, server port)', ['Each uses a different server port', 'All use 443.'], ['By TCP sequence numbers alone', 'Sequence numbers are per connection, not identifiers.'], ['By MAC address', 'Most clients are behind routers.']], answer: 0, explanation: 'The kernel maps each 4-tuple to its own socket.' }),
  mcq({ ...q(TU), id: 'cn.tu.q6', type: 'concept', difficulty: 'medium', stem: 'Which statement about UDP is FALSE?', options: ['UDP retransmits lost datagrams after a timeout', ['UDP preserves datagram boundaries', 'True.'], ['UDP has no congestion control', 'True.'], ['DNS queries normally use UDP', 'True.']], answer: 0, explanation: 'UDP never retransmits; reliability, if needed, is the application\'s job (as in QUIC).' }),
];

// ---------------------------------------------------------------------------------------
const TL = 'cn.tcp-lifecycle';
const tcpLife = cnTopic({
  id: TL, title: 'TCP Connection Lifecycle', level: 'core', estMinutes: 45, prerequisites: [TU],
  summary: 'Handshake, teardown, TIME_WAIT, sequence numbers and retransmission.',
  objectives: ['Draw the three-way handshake and the four-way teardown.', 'Explain why TIME_WAIT exists and who enters it.', 'Explain sequence and acknowledgement numbers, retransmission and fast retransmit.', 'Distinguish flow control from congestion control.'],
  sections: [
    { id: 'handshake', kind: 'concept', title: 'Three-way handshake', bodyMd: `1. Client → server: **SYN** (seq = x).
2. Server → client: **SYN-ACK** (seq = y, ack = x + 1).
3. Client → server: **ACK** (ack = y + 1). The connection is established; the client may send data with this segment.

Why three and not two? Both sides must choose and confirm their initial sequence numbers, and the third message protects against old duplicate SYNs creating bogus connections.

A **SYN flood** attack sends many SYNs without completing the handshake, filling the server's half-open queue; SYN cookies mitigate it.` },
    { id: 'teardown', kind: 'concept', title: 'Teardown and TIME_WAIT', bodyMd: `Each direction closes separately: **FIN → ACK, FIN → ACK** (the middle two can be combined). The side that closes first (**active close**) enters **TIME_WAIT** for 2 × MSL (maximum segment lifetime) so that (a) its final ACK can be retransmitted if lost and (b) delayed segments of the old connection die before the same 4-tuple is reused.

Many sockets in TIME_WAIT on a busy client (for example, a service making many short outbound connections) can exhaust ephemeral ports; connection pooling and keep-alive fix this. **CLOSE_WAIT** piling up means the application received FIN but never called close(), which is a bug in your code.` },
    { id: 'reliability', kind: 'concept', title: 'Reliability, flow and congestion control', bodyMd: `- **Sequence numbers** count bytes; **ACKs** are cumulative ("I have everything before N").
- Lost data is retransmitted after a **timeout (RTO)**, or sooner with **fast retransmit** after 3 duplicate ACKs.
- **Flow control** protects the *receiver*: the receiver advertises a window (rwnd) of how much it can buffer.
- **Congestion control** protects the *network*: the sender keeps a congestion window (cwnd). **Slow start** grows it exponentially until a threshold, then **congestion avoidance** grows it additively; on loss it is cut multiplicatively (AIMD).
- The sender sends at most min(rwnd, cwnd) unacknowledged bytes.` },
    { id: 'tools', kind: 'example', title: 'Seeing it on a real machine', bodyMd: 'List sockets by state on Linux:', code: [sh(`ss -tan state time-wait | head      # sockets in TIME_WAIT
ss -tan state close-wait           # CLOSE_WAIT: the app forgot to close()
ss -tlnp                           # listening TCP sockets with owning processes`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Saying the server always enters TIME_WAIT (the active closer does).
2. Confusing flow control (receiver buffer) with congestion control (network capacity).
3. Thinking ACK numbers count packets (they count bytes).
4. Blaming the network for CLOSE_WAIT build-up (it is your application not closing sockets).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the TCP three-way handshake.', answerMd: 'SYN with the client\'s initial sequence number; SYN-ACK with the server\'s ISN and an ack of the client\'s ISN + 1; ACK of the server\'s ISN + 1. Both sides have now agreed on sequence numbers and know the other can send and receive.' },
    { id: 'iq2', q: 'Why does TIME_WAIT exist?', answerMd: 'To make sure the final ACK can be resent if it is lost, and to let stray segments from the old connection expire before the same 4-tuple is reused. It lasts 2 × MSL on the side that closed first.' },
    { id: 'iq3', q: 'Flow control vs congestion control?', answerMd: 'Flow control stops the sender overwhelming the receiver, using the receiver-advertised window. Congestion control stops senders overwhelming the network, using a sender-side congestion window adjusted by slow start, AIMD and loss signals.' },
    { id: 'iq4', q: 'Your server shows thousands of connections in CLOSE_WAIT. What does that mean?', answerMd: 'The peer closed its side, but your application has not called close() on those sockets, typically a leak (missing close in an error path, or not returning connections to a pool). Fix the code; tuning the kernel will not help.' },
  ],
  revision: { notesMd: `- Handshake: SYN, SYN-ACK, ACK.
- Teardown: FIN/ACK each direction; the active closer gets TIME_WAIT (2 MSL).
- CLOSE_WAIT build-up means the app is not calling close().
- Fast retransmit after 3 duplicate ACKs.
- Flow control = rwnd (receiver); congestion control = cwnd (network), slow start + AIMD.`, flashcards: [
    { id: 'f1', front: 'Handshake segments?', backMd: 'SYN, SYN-ACK, ACK.' },
    { id: 'f2', front: 'Who enters TIME_WAIT?', backMd: 'The side that closes first (active close).' },
    { id: 'f3', front: 'Trigger for fast retransmit?', backMd: 'Three duplicate ACKs.' },
    { id: 'f4', front: 'Window that protects the receiver?', backMd: 'The receive window (rwnd), i.e. flow control.' },
    { id: 'f5', front: 'Slow start growth?', backMd: 'Exponential (cwnd roughly doubles every RTT) until ssthresh.' },
  ] },
  resources: [HPBN, { title: 'RFC 9293: Transmission Control Protocol', url: 'https://www.rfc-editor.org/rfc/rfc9293', kind: 'official-docs' }],
});

const tlMcqs: MCQ[] = [
  mcq({ ...q(TL), id: 'cn.tl.q1', type: 'concept', difficulty: 'easy', stem: 'What is the correct order of the TCP three-way handshake?', options: ['SYN → SYN-ACK → ACK', ['SYN → ACK → SYN-ACK', 'The server responds with SYN-ACK second.'], ['ACK → SYN → FIN', 'FIN closes connections.'], ['SYN → SYN → ACK', 'The server\'s SYN carries an ACK.']], answer: 0, explanation: 'Each side sends its SYN and acknowledges the other\'s.' }),
  mcq({ ...q(TL), id: 'cn.tl.q2', type: 'concept', difficulty: 'medium', stem: 'Which side of a TCP connection enters TIME_WAIT?', options: ['The side that sends the first FIN (active close)', ['Always the server', 'Only if the server closes first.'], ['Always the client', 'Only if the client closes first.'], ['Both sides always', 'The passive closer goes through CLOSE_WAIT and LAST_ACK instead.']], answer: 0, explanation: 'TIME_WAIT lasts 2 × MSL on the active closer.' }),
  mcq({ ...q(TL), id: 'cn.tl.q3', type: 'scenario', difficulty: 'medium', stem: '`ss` shows 5,000 sockets in CLOSE_WAIT on your API server. What is the most likely cause?', options: ['The application is not closing sockets after the peer closed (a leak)', ['Network congestion', 'CLOSE_WAIT is a local application state.'], ['Too short TIME_WAIT', 'A different state on the other side.'], ['A SYN flood', 'That shows up as SYN_RECV.']], answer: 0, explanation: 'CLOSE_WAIT means a FIN was received and the app has not called close().' }),
  mcq({ ...q(TL), id: 'cn.tl.q4', type: 'concept', difficulty: 'medium', stem: 'The receiver advertises a small window because its buffer is nearly full. This mechanism is:', options: ['Flow control', ['Congestion control', 'That reacts to the network, not the receiver.'], ['Slow start', 'Part of congestion control.'], ['Fast retransmit', 'Loss recovery.']], answer: 0, explanation: 'The advertised receive window limits in-flight data to what the receiver can hold.' }),
  mcq({ ...q(TL), id: 'cn.tl.q5', type: 'concept', difficulty: 'medium', stem: 'What does an ACK number of 5001 mean?', options: ['The receiver has all bytes up to 5000 and expects byte 5001 next', ['The receiver got packet number 5001', 'ACKs count bytes, not packets.'], ['5001 bytes were lost', 'It acknowledges, not reports loss.'], ['The window is 5001 bytes', 'That is the window field.']], answer: 0, explanation: 'TCP ACKs are cumulative byte numbers.' }),
  mcq({ ...q(TL), id: 'cn.tl.q6', type: 'concept', difficulty: 'hard', stem: 'Why does TCP use a three-way rather than a two-way handshake?', options: ['Both sides must confirm the other\'s initial sequence number, and it prevents old duplicate SYNs from opening bogus connections', ['To make connections slower and therefore safer', 'Latency is a cost, not a goal.'], ['Because IP requires three packets', 'IP has no such rule.'], ['To exchange encryption keys', 'TCP does not encrypt; TLS does.']], answer: 0, explanation: 'With two messages, the server could not know the client received its ISN.' }),
];

// ---------------------------------------------------------------------------------------
const DN = 'cn.dns';
const dns = cnTopic({
  id: DN, title: 'DNS', level: 'core', estMinutes: 40, prerequisites: [TU],
  summary: 'Resolution path, record types, caching and TTL.',
  objectives: ['Walk through recursive and iterative resolution.', 'Use the right record type (A, AAAA, CNAME, MX, NS, TXT).', 'Explain caching and TTL trade-offs, including slow propagation of changes.', 'Debug DNS with dig.'],
  sections: [
    { id: 'resolution', kind: 'concept', title: 'How a name is resolved', bodyMd: `For \`www.example.com\`:
1. Browser cache, then OS cache (and the hosts file).
2. The **recursive resolver** (ISP, 8.8.8.8, 1.1.1.1) is asked. If it has no cached answer, it resolves iteratively:
3. A **root server** refers it to the \`.com\` **TLD servers**.
4. A TLD server refers it to the **authoritative nameservers** for example.com.
5. The authoritative server returns the A/AAAA record. The resolver caches it for the record's **TTL** and answers the client.

The client asks recursively (give me the answer); the resolver asks iteratively (tell me where to go next).` },
    { id: 'records', kind: 'comparison', title: 'Record types', bodyMd: `| Type | Meaning |
|---|---|
| A / AAAA | name → IPv4 / IPv6 address |
| CNAME | alias of another name (not allowed at the zone apex alongside other records) |
| MX | mail servers for the domain, with priorities |
| NS | authoritative nameservers for the zone |
| TXT | free text: SPF, domain verification |
| PTR | reverse lookup (IP → name) |
| SOA | zone metadata (primary server, serial, timers) |` },
    { id: 'dig', kind: 'example', title: 'Debugging with dig', bodyMd: 'Use `dig` to see what resolvers actually return, including TTLs:', code: [sh(`dig example.com A +short          # just the addresses
dig example.com MX                 # mail servers
dig +trace www.example.com         # follow root -> TLD -> authoritative yourself
dig @8.8.8.8 example.com           # ask a specific resolver`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Expecting a DNS change to be visible instantly; old answers stay cached until their TTL expires. Lower the TTL **before** a planned migration.
2. Putting a CNAME at the zone apex (example.com) next to MX/NS records.
3. Saying DNS only uses TCP or only uses UDP.
4. Forgetting negative caching (an NXDOMAIN answer is cached too).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What happens when you resolve www.google.com?', answerMd: 'Check browser and OS caches; ask the configured recursive resolver; on a miss it queries a root server (referral to .com), a .com TLD server (referral to google.com\'s nameservers), then the authoritative server for the record. The answer is cached at each level for its TTL.' },
    { id: 'iq2', q: 'A vs CNAME record?', answerMd: 'An A record maps a name directly to an IPv4 address. A CNAME makes a name an alias of another name, which is then resolved; it is useful for pointing at provider hostnames (CDNs, load balancers) whose IPs change.' },
    { id: 'iq3', q: 'How do you migrate a service to a new IP with minimal downtime?', answerMd: 'Days before, lower the record\'s TTL (for example to 60 s). Run old and new servers in parallel, switch the record, wait for the old TTL to expire, verify traffic has moved, then raise the TTL again and retire the old server.' },
    { id: 'iq4', q: 'Can DNS be used for load balancing?', answerMd: 'Yes, roughly: multiple A records (round robin) or GeoDNS returning different answers by location. It is coarse, because client caching ignores load and failover is limited by TTL, so it is usually combined with real load balancers.' },
  ],
  revision: { notesMd: `- Cache → recursive resolver → root → TLD → authoritative.
- A/AAAA address, CNAME alias, MX mail, NS nameservers, TXT text, PTR reverse.
- TTL controls caching; lower it before migrations.
- UDP 53 normally; TCP for large responses and zone transfers.
- dig +trace shows the full path.`, flashcards: [
    { id: 'f1', front: 'Record for IPv6 addresses?', backMd: 'AAAA.' },
    { id: 'f2', front: 'Record for mail servers?', backMd: 'MX.' },
    { id: 'f3', front: 'Who does iterative queries?', backMd: 'The recursive resolver (to root, TLD and authoritative servers).' },
    { id: 'f4', front: 'Why do DNS changes take time?', backMd: 'Resolvers cache old answers until the TTL expires.' },
    { id: 'f5', front: 'Reverse DNS record type?', backMd: 'PTR.' },
  ] },
  resources: [{ title: 'Cloudflare Learning: What is DNS?', url: 'https://www.cloudflare.com/learning/dns/what-is-dns/', kind: 'article' }, { title: 'RFC 1034: Domain Names, Concepts and Facilities', url: 'https://www.rfc-editor.org/rfc/rfc1034', kind: 'official-docs' }],
});

const dnMcqs: MCQ[] = [
  mcq({ ...q(DN), id: 'cn.dn.q1', type: 'concept', difficulty: 'easy', stem: 'Which record type maps a hostname to an IPv6 address?', options: ['AAAA', ['A', 'IPv4.'], ['CNAME', 'An alias to another name.'], ['PTR', 'Reverse lookup.']], answer: 0, explanation: 'AAAA ("quad A") records hold 128-bit addresses.' }),
  mcq({ ...q(DN), id: 'cn.dn.q2', type: 'concept', difficulty: 'medium', stem: 'On a cache miss, what does the recursive resolver contact first?', options: ['A root nameserver', ['The authoritative server directly', 'It does not yet know which server that is.'], ['The TLD server directly', 'It learns the TLD servers from the root (unless cached).'], ['The browser', 'The browser is the client.']], answer: 0, explanation: 'Root → TLD → authoritative, each giving a referral to the next.' }),
  mcq({ ...q(DN), id: 'cn.dn.q3', type: 'scenario', difficulty: 'medium', stem: 'You changed an A record an hour ago, but some users still reach the old server. The record\'s TTL is 86400. Why?', options: ['Resolvers cached the old answer and may keep it for up to 24 hours', ['DNS changes need a server restart', 'No restart is involved.'], ['Users must clear their cookies', 'Cookies are unrelated.'], ['The A record type does not support changes', 'Any record can change.']], answer: 0, explanation: 'Lower the TTL well before a migration.' }),
  mcq({ ...q(DN), id: 'cn.dn.q4', type: 'concept', difficulty: 'medium', stem: 'When does DNS use TCP instead of UDP?', options: ['For responses too large for UDP (truncated) and for zone transfers', ['Never', 'It does use TCP.'], ['For every query since 2010', 'UDP is still the norm.'], ['Only for MX records', 'Record type does not decide it.']], answer: 0, explanation: 'The TC (truncated) flag tells the client to retry over TCP.' }),
  mcq({ ...q(DN), id: 'cn.dn.q5', type: 'scenario', difficulty: 'medium', stem: 'You want `shop.example.com` to follow your CDN provider\'s hostname, whose IPs change frequently. Which record?', options: ['CNAME to the provider\'s hostname', ['A record with today\'s IPs', 'It would break when the provider changes IPs.'], ['MX record', 'For mail.'], ['NS record', 'Delegates a whole zone.']], answer: 0, explanation: 'The CNAME is re-resolved, so you always get the provider\'s current IPs.' }),
  mcq({ ...q(DN), id: 'cn.dn.q6', type: 'concept', difficulty: 'easy', stem: 'Which tool shows each step of a resolution from the root down?', options: ['`dig +trace`', ['`ping`', 'Only resolves once and tests reachability.'], ['`netstat`', 'Shows sockets.'], ['`curl -I`', 'Fetches HTTP headers.']], answer: 0, explanation: 'dig +trace performs iterative resolution itself and prints each referral.' }),
];

// ---------------------------------------------------------------------------------------
const HT = 'cn.http';
const http = cnTopic({
  id: HT, title: 'HTTP', level: 'core', estMinutes: 50, prerequisites: [TL],
  summary: 'Methods, status codes, headers, caching and HTTP/1.1 vs 2 vs 3.',
  objectives: ['Use methods and status codes correctly, including idempotency.', 'Explain caching headers (Cache-Control, ETag).', 'Compare HTTP/1.1, HTTP/2 and HTTP/3.', 'Answer "what happens when you type a URL and press Enter" end to end.'],
  sections: [
    { id: 'methods', kind: 'concept', title: 'Methods and status codes', bodyMd: `| Method | Safe | Idempotent | Use |
|---|---|---|---|
| GET | yes | yes | read |
| POST | no | no | create or trigger an action |
| PUT | no | yes | replace a resource |
| PATCH | no | not necessarily | partial update |
| DELETE | no | yes | remove |

**Idempotent** means repeating the request has the same effect as doing it once, which is what makes retries safe.

Status codes: **2xx** success (200 OK, 201 Created, 204 No Content); **3xx** redirect (301 permanent, 302/307 temporary, 304 Not Modified); **4xx** client error (400, **401 unauthenticated**, **403 forbidden** (authenticated but not allowed), 404, 409 conflict, 429 too many requests); **5xx** server error (500, **502 bad gateway**, **503 unavailable**, **504 gateway timeout**).` },
    { id: 'caching', kind: 'concept', title: 'Caching', bodyMd: `- \`Cache-Control: max-age=3600\` lets caches reuse a response for an hour; \`no-store\` forbids storing; \`no-cache\` means revalidate before reuse; \`private\` is browser-only.
- **Validators:** the server sends an \`ETag\` (or \`Last-Modified\`). The client later sends \`If-None-Match\`; if unchanged, the server replies **304 Not Modified** with no body.
- Static assets with content-hashed filenames can be cached "forever" (\`max-age=31536000, immutable\`).` },
    { id: 'versions', kind: 'comparison', title: 'HTTP/1.1 vs HTTP/2 vs HTTP/3', bodyMd: `| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| Transport | TCP | TCP | QUIC over UDP |
| Format | text | binary frames | binary frames |
| Concurrency | one request at a time per connection (browsers open ~6) | many streams multiplexed on one connection | multiplexed, independent streams |
| Head-of-line blocking | at the HTTP level | at the TCP level (one lost packet stalls all streams) | removed (per-stream loss recovery) |
| Headers | repeated text | HPACK compression | QPACK compression |` },
    { id: 'url', kind: 'example', title: 'What happens when you type a URL', bodyMd: `1. The browser parses the URL; checks HSTS and its caches.
2. **DNS** resolves the host to an IP (caches → resolver → root/TLD/authoritative).
3. **TCP handshake** to port 443 (or a QUIC handshake for HTTP/3).
4. **TLS handshake**: certificate validation, key agreement.
5. **HTTP request** (GET /, Host, cookies). Possibly via CDN, load balancer, reverse proxy → application server → caches and databases.
6. **Response**: status, headers, HTML. The browser parses HTML, builds the DOM and CSSOM, fetches sub-resources (CSS, JS, images, often over the same connection), runs JS, lays out and paints.

Interviewers usually let you choose which step to go deep on; pick one you know well (DNS, TLS or load balancing).`, code: [sh(`curl -v https://example.com/ -o /dev/null     # shows DNS, connect, TLS and HTTP headers
curl -I https://example.com/                   # response headers only`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Returning 403 when the user is not logged in (that is 401) or 401 when they lack permission (403).
2. Using GET for actions with side effects (crawlers and prefetchers will trigger them).
3. Retrying non-idempotent POSTs blindly (use idempotency keys).
4. Saying HTTP/2 fixes all head-of-line blocking (TCP-level blocking remains; HTTP/3 fixes it).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What happens when you type google.com in the browser?', answerMd: 'URL parsing and HSTS; DNS resolution; TCP (or QUIC) handshake; TLS handshake with certificate validation; HTTP request through CDN and load balancers to servers; response; HTML parsing, sub-resource fetching, JS execution, layout and paint. Then go deep on whichever step the interviewer picks.' },
    { id: 'iq2', q: 'PUT vs POST vs PATCH?', answerMd: 'POST creates or triggers processing and is not idempotent. PUT replaces the resource at a known URI and is idempotent. PATCH applies a partial modification and is not guaranteed to be idempotent.' },
    { id: 'iq3', q: '401 vs 403?', answerMd: '401 Unauthorized means not authenticated (missing or invalid credentials). 403 Forbidden means authenticated but not permitted.' },
    { id: 'iq4', q: 'How does HTTP/2 improve on HTTP/1.1, and what does HTTP/3 add?', answerMd: 'HTTP/2 multiplexes many streams over one TCP connection with binary framing and header compression, removing HTTP-level head-of-line blocking. HTTP/3 runs over QUIC (UDP), so a lost packet only stalls its own stream, and it combines the transport and TLS handshakes for faster setup.' },
  ],
  revision: { notesMd: `- Idempotent: GET, PUT, DELETE (and HEAD, OPTIONS). POST is not.
- 401 = not authenticated; 403 = not allowed; 429 = rate limited; 502/503/504 = upstream problems.
- Cache-Control max-age; ETag + If-None-Match → 304.
- HTTP/2: multiplexing on TCP. HTTP/3: QUIC/UDP, no TCP HOL blocking.`, flashcards: [
    { id: 'f1', front: 'Is PUT idempotent?', backMd: 'Yes.' },
    { id: 'f2', front: 'Status for a rate limit?', backMd: '429 Too Many Requests.' },
    { id: 'f3', front: '304 means?', backMd: 'Not Modified: use your cached copy (after conditional revalidation).' },
    { id: 'f4', front: '502 vs 504?', backMd: '502: invalid response from upstream. 504: upstream timed out.' },
    { id: 'f5', front: 'What does HTTP/3 run on?', backMd: 'QUIC over UDP.' },
  ] },
  resources: [MDN_HTTP, { title: 'RFC 9110: HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110', kind: 'official-docs' }, HPBN],
});

const htMcqs: MCQ[] = [
  mcq({ ...q(HT), id: 'cn.ht.q1', type: 'concept', difficulty: 'easy', stem: 'Which HTTP method is NOT idempotent?', options: ['POST', ['PUT', 'Replacing with the same body twice has the same effect.'], ['DELETE', 'Deleting twice leaves the resource deleted.'], ['GET', 'Safe and idempotent.']], answer: 0, explanation: 'Two POSTs can create two orders; use idempotency keys for safe retries.' }),
  mcq({ ...q(HT), id: 'cn.ht.q2', type: 'scenario', difficulty: 'easy', stem: 'A logged-in user requests an admin-only page. Which status code is correct?', options: ['403 Forbidden', ['401 Unauthorized', 'They are authenticated.'], ['404 Not Found', 'Sometimes used to hide existence, but 403 is the standard answer.'], ['500 Internal Server Error', 'Nothing failed.']], answer: 0, explanation: '401 is for missing or invalid authentication; 403 is for lacking permission.' }),
  mcq({ ...q(HT), id: 'cn.ht.q3', type: 'scenario', difficulty: 'medium', stem: 'The browser sends `If-None-Match: "abc123"` and the resource has not changed. What should the server return?', options: ['304 Not Modified with no body', ['200 OK with the full body', 'That wastes bandwidth.'], ['412 Precondition Failed', 'Used for conditional writes.'], ['204 No Content', 'Not the caching response.']], answer: 0, explanation: 'The client reuses its cached copy.' }),
  mcq({ ...q(HT), id: 'cn.ht.q4', type: 'concept', difficulty: 'medium', stem: 'What does HTTP/3 fix that HTTP/2 cannot?', options: ['TCP-level head-of-line blocking, by running over QUIC (UDP) with independent streams', ['Lack of multiplexing', 'HTTP/2 already multiplexes.'], ['Text-based headers', 'HTTP/2 is already binary.'], ['Lack of encryption', 'HTTP/2 is used over TLS in browsers.']], answer: 0, explanation: 'In HTTP/2, a lost TCP packet stalls every stream on the connection.' }),
  mcq({ ...q(HT), id: 'cn.ht.q5', type: 'scenario', difficulty: 'medium', stem: 'A load balancer returns 504 to clients. What does that most likely indicate?', options: ['The upstream application server did not respond in time', ['The client sent a malformed request', 'That is 400.'], ['The client is rate limited', 'That is 429.'], ['The URL does not exist', 'That is 404.']], answer: 0, explanation: '504 Gateway Timeout: the proxy gave up waiting for the upstream.' }),
  mcq({ ...q(HT), id: 'cn.ht.q6', type: 'concept', difficulty: 'medium', stem: 'Which header lets a CDN cache a response for 10 minutes?', options: ['Cache-Control: max-age=600 (or s-maxage=600 for shared caches)', ['Expires: 600', 'Expires takes an absolute date.'], ['ETag: 600', 'ETag is a validator, not a lifetime.'], ['Content-Length: 600', 'The body size.']], answer: 0, explanation: 's-maxage overrides max-age for shared caches such as CDNs.' }),
];

// ---------------------------------------------------------------------------------------
const TS = 'cn.tls-https';
const tls = cnTopic({
  id: TS, title: 'TLS and HTTPS', level: 'core', estMinutes: 40, prerequisites: [HT],
  summary: 'The TLS handshake, certificates and the chain of trust.',
  objectives: ['Explain what TLS guarantees (confidentiality, integrity, authentication).', 'Describe the TLS 1.3 handshake at interview depth.', 'Explain certificates and the chain of trust.', 'Explain why both asymmetric and symmetric crypto are used.'],
  sections: [
    { id: 'what', kind: 'concept', title: 'What TLS gives you', bodyMd: `- **Confidentiality:** traffic is encrypted.
- **Integrity:** tampering is detected (AEAD ciphers such as AES-GCM).
- **Authentication:** the server proves it owns the domain via a **certificate**; optionally the client too (mutual TLS).

**Asymmetric crypto** (ECDHE key exchange, RSA/ECDSA signatures) is slow but lets strangers agree on a secret and prove identity. **Symmetric crypto** (AES, ChaCha20) is fast and encrypts the bulk data with the agreed keys.` },
    { id: 'handshake', kind: 'concept', title: 'TLS 1.3 handshake (1 RTT)', bodyMd: `1. **ClientHello:** supported cipher suites, a key share (ephemeral ECDHE public key), SNI (the hostname).
2. **ServerHello:** chosen suite and the server's key share. Both sides now compute the shared secret; everything after this is encrypted.
3. Server sends its **certificate chain** and a **CertificateVerify** signature proving it holds the private key, then Finished.
4. Client validates the chain and hostname, sends Finished, and application data flows.

TLS 1.2 needed 2 RTTs; TLS 1.3 needs 1, and resumption can send **0-RTT** data (which can be replayed, so only for idempotent requests). Ephemeral key exchange gives **forward secrecy**: stealing the server's private key later does not decrypt past sessions.` },
    { id: 'certs', kind: 'concept', title: 'Certificates and the chain of trust', bodyMd: `A certificate binds a public key to a domain name and is signed by a **Certificate Authority**. Browsers trust a set of **root CAs**; servers send their leaf certificate plus **intermediate** certificates, and the client verifies each signature up to a trusted root, plus the validity dates, hostname (SAN) and revocation status.

Common production failures: an expired certificate, a missing intermediate, or a hostname mismatch.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Saying HTTPS encrypts with the server's public key for the whole session (only the handshake is asymmetric).
2. Confusing hashing, encryption and signing.
3. Thinking HTTPS hides which site you visit (the IP is visible, and SNI is usually visible).
4. Disabling certificate verification in clients "to make it work".` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How does HTTPS work?', answerMd: 'HTTP runs inside a TLS session. In the handshake, client and server agree on a cipher, do an ephemeral Diffie-Hellman key exchange to derive symmetric keys, and the server proves its identity with a CA-signed certificate. Afterwards all HTTP data is encrypted and integrity-protected with fast symmetric ciphers.' },
    { id: 'iq2', q: 'Why not use asymmetric encryption for everything?', answerMd: 'It is orders of magnitude slower. Asymmetric crypto is used only to authenticate and agree on keys; symmetric ciphers then encrypt the bulk data.' },
    { id: 'iq3', q: 'What is forward secrecy?', answerMd: 'Session keys come from ephemeral key exchanges, so compromising the server\'s long-term private key later does not let an attacker decrypt previously recorded sessions. TLS 1.3 requires it.' },
    { id: 'iq4', q: 'How does the browser know a certificate is legitimate?', answerMd: 'It verifies the signature chain from the leaf through intermediates to a root CA in its trust store, checks validity dates, that the hostname matches the certificate\'s SAN, and revocation status.' },
  ],
  revision: { notesMd: `- TLS: confidentiality, integrity, authentication.
- Asymmetric for key exchange and identity; symmetric for data.
- TLS 1.3: 1-RTT handshake; 0-RTT resumption (replayable).
- ECDHE gives forward secrecy.
- Chain: leaf → intermediates → trusted root; check dates, hostname, revocation.`, flashcards: [
    { id: 'f1', front: 'TLS 1.3 full handshake RTTs?', backMd: '1 (0-RTT possible on resumption).' },
    { id: 'f2', front: 'What gives forward secrecy?', backMd: 'Ephemeral (EC)DHE key exchange.' },
    { id: 'f3', front: 'Bulk data is encrypted with?', backMd: 'Symmetric ciphers (AES-GCM, ChaCha20-Poly1305).' },
    { id: 'f4', front: 'SNI is for?', backMd: 'Telling the server which hostname the client wants, so it can present the right certificate.' },
    { id: 'f5', front: 'Common certificate failures?', backMd: 'Expired, missing intermediate, hostname mismatch.' },
  ] },
  resources: [{ title: 'RFC 8446: TLS 1.3', url: 'https://www.rfc-editor.org/rfc/rfc8446', kind: 'official-docs' }, { title: 'Cloudflare Learning: What happens in a TLS handshake?', url: 'https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/', kind: 'article' }],
});

const tsMcqs: MCQ[] = [
  mcq({ ...q(TS), id: 'cn.ts.q1', type: 'concept', difficulty: 'medium', stem: 'In HTTPS, how is the bulk of the application data encrypted?', options: ['With symmetric keys derived during the handshake', ['With the server\'s RSA public key', 'Only used (if at all) in the handshake.'], ['With the CA\'s private key', 'The CA is not involved in sessions.'], ['It is only hashed, not encrypted', 'Hashing is not encryption.']], answer: 0, explanation: 'Asymmetric crypto agrees on keys; symmetric AEAD ciphers protect the data.' }),
  mcq({ ...q(TS), id: 'cn.ts.q2', type: 'concept', difficulty: 'medium', stem: 'What property ensures that a stolen server private key cannot decrypt previously recorded sessions?', options: ['Forward secrecy (ephemeral key exchange)', ['Certificate pinning', 'That defends against fake certificates.'], ['HSTS', 'That forces HTTPS.'], ['Long RSA keys', 'Size does not help if the key is stolen.']], answer: 0, explanation: 'Each session uses fresh ephemeral keys that are discarded.' }),
  mcq({ ...q(TS), id: 'cn.ts.q3', type: 'scenario', difficulty: 'medium', stem: 'Browsers accept your site, but a Java client fails with "unable to find valid certification path". The likely cause?', options: ['The server is not sending its intermediate certificate (browsers sometimes fetch or cache it; other clients do not)', ['The domain has no A record', 'Then it would not connect at all.'], ['TLS 1.3 is not supported by Java', 'Modern Java supports it.'], ['The certificate is too new', 'Not a failure mode.']], answer: 0, explanation: 'Always serve the full chain (leaf + intermediates).' }),
  mcq({ ...q(TS), id: 'cn.ts.q4', type: 'concept', difficulty: 'easy', stem: 'How many round trips does a full TLS 1.3 handshake take?', options: ['1', ['2', 'TLS 1.2.'], ['0', 'Only on resumption with 0-RTT.'], ['3', 'TCP handshake plus TLS 1.2-ish, not TLS 1.3 itself.']], answer: 0, explanation: 'The key share is sent in the ClientHello.' }),
  mcq({ ...q(TS), id: 'cn.ts.q5', type: 'concept', difficulty: 'medium', stem: 'Why should 0-RTT early data only be used for idempotent requests?', options: ['Early data can be replayed by an attacker', ['It is not encrypted', 'It is encrypted.'], ['It is limited to 1 byte', 'There is no such limit.'], ['It disables certificate checks', 'It does not.']], answer: 0, explanation: '0-RTT lacks replay protection, so a captured POST could be resent.' }),
  mcq({ ...q(TS), id: 'cn.ts.q6', type: 'concept', difficulty: 'easy', stem: 'What does a TLS certificate bind together?', options: ['A public key and a domain name (identity), signed by a CA', ['A private key and an IP address', 'Private keys are never in certificates.'], ['A session key and a cookie', 'Unrelated.'], ['A username and a password', 'Not a certificate.']], answer: 0, explanation: 'The CA\'s signature vouches that the key belongs to that name.' }),
];

export const topics: Topic[] = [models, ipSub, tcpUdp, tcpLife, dns, http, tls, ...network.topics, ...application.topics];
export const mcqs: MCQ[] = [...moMcqs, ...ipMcqs, ...tuMcqs, ...tlMcqs, ...dnMcqs, ...htMcqs, ...tsMcqs, ...network.mcqs, ...application.mcqs];
