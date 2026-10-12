import type { MCQ, Resource, Topic } from '../schema';
import { mcq } from '../helpers';
import { HPBN, RFC, cnTopic, q, sh } from './common';

// CN batch 2: link and network layer plumbing (Ethernet, ARP/ICMP/DHCP, routing, NAT and
// firewalls) and TCP flow/congestion control. Numeric answers are recomputed in
// tests/os-cn-facts.test.ts (longest-prefix match, cwnd trace, throughput and BDP).

const wiki = (title: string, page: string): Resource => ({ title: `${title} (Wikipedia)`, url: `https://en.wikipedia.org/wiki/${page}`, kind: 'article' });

// ---------------------------------------------------------------------------------------
const EM = 'cn.ethernet-mac';
const ethernet = cnTopic({
  id: EM, title: 'Ethernet, MAC and Switching', level: 'foundation', estMinutes: 35, prerequisites: ['cn.models'], related: ['cn.arp-icmp-dhcp', 'cn.routing-switching'],
  summary: 'Frames, MAC addresses, switches and VLAN basics.',
  objectives: ['Describe an Ethernet frame (addresses, EtherType, payload limits, FCS) and a MAC address.', 'Explain how a switch learns, forwards, filters and floods.', 'Count collision and broadcast domains, and explain why loops need STP.', 'Explain VLANs, access vs trunk ports, and why VLANs need a router to talk.'],
  sections: [
    { id: 'frame', kind: 'concept', title: 'Frames and MAC addresses', bodyMd: `An **Ethernet II frame**:

| Field | Size | Notes |
|---|---|---|
| Destination MAC | 6 bytes | first, so a switch can start forwarding early |
| Source MAC | 6 bytes | |
| (802.1Q VLAN tag) | 4 bytes | only on trunk links |
| EtherType | 2 bytes | 0x0800 IPv4, 0x86DD IPv6, 0x0806 ARP |
| Payload | 46–1500 bytes | **1500 is the standard MTU**; shorter payloads are padded |
| FCS | 4 bytes | CRC-32; corrupt frames are dropped, not repaired |

(A preamble and start-frame delimiter precede the frame on the wire.) So frames are 64–1518 bytes (1522 with a VLAN tag).

A **MAC address** is 48 bits, written \`3c:22:fb:12:ab:9e\`. The first 3 bytes are the vendor's OUI. \`ff:ff:ff:ff:ff:ff\` is **broadcast**. Phones and laptops now often use **randomised** (locally administered) MACs per Wi-Fi network for privacy. MAC addresses only matter on the **local link**: routers replace them at every hop.` },
    { id: 'switching', kind: 'concept', title: 'How a switch works', bodyMd: `A switch keeps a **MAC address table** (MAC → port):

1. **Learn:** on every incoming frame, record *source MAC → incoming port* (entries age out, typically after 5 minutes).
2. **Forward:** if the destination MAC is in the table, send the frame out of that one port.
3. **Filter:** if that port is the one it arrived on, drop it.
4. **Flood:** for broadcast, multicast without snooping, or an **unknown unicast** destination, send out of every port except the incoming one.

**Domains:**
- Each switch port is its own **collision domain** (and modern links are full duplex, so collisions do not happen at all). A **hub** repeats bits to every port: one collision domain.
- All ports of a switch (in one VLAN) form one **broadcast domain**. **Routers** separate broadcast domains.

**Loops:** redundant links between switches create loops, and since Ethernet frames have no TTL, a broadcast circulates forever (a **broadcast storm**) and MAC tables flap. **Spanning Tree Protocol (STP, 802.1D; RSTP 802.1w)** elects a root bridge and blocks redundant ports to make a loop-free tree, unblocking them if an active link fails.` },
    { id: 'vlan', kind: 'concept', title: 'VLANs', bodyMd: `A **VLAN** splits one physical switch into several logical ones, each its own broadcast domain (for example \`engineering\`, \`guest Wi-Fi\`, \`VoIP\`).

- **Access port:** belongs to one VLAN; the host sends untagged frames.
- **Trunk port:** carries many VLANs between switches (or to a router), adding an **802.1Q tag** with a **12-bit VLAN ID** (1–4094 usable; 0 and 4095 are reserved).
- Hosts in different VLANs **cannot talk at layer 2**: traffic must go through a router or a layer-3 switch (inter-VLAN routing, "router on a stick").

VLANs limit broadcast traffic and are a basic security boundary; cloud VPC subnets play a similar role in data centres.` },
    { id: 'dry-run', kind: 'dry-run', title: 'Walkthrough: a switch learning', bodyMd: `Hosts A (port 1), B (port 2) and C (port 3); the MAC table starts empty.

1. A sends to B. The switch learns **A → 1**. B is unknown, so the frame is **flooded** to ports 2 and 3. C discards it (not its MAC).
2. B replies to A. The switch learns **B → 2**. A is known, so the frame goes **only to port 1**.
3. A sends to B again: both known, forwarded only to port 2. C no longer sees A↔B traffic.
4. If A is unplugged and moved to port 3, its next frame updates the entry to **A → 3**.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Thinking a switch floods every frame (only broadcast, multicast and unknown unicast).
2. Saying a switch separates broadcast domains (routers and VLANs do).
3. Forgetting that redundant switch links need STP.
4. Expecting two VLANs on the same switch to reach each other without routing.
5. Using MAC addresses as a security control: they are trivially spoofed.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How does a switch learn where to send frames?', answerMd: 'It records the source MAC address of each incoming frame against the port it arrived on. For a destination already in that table it forwards to one port; for unknown destinations and broadcasts it floods to all other ports. Entries age out so moved hosts are relearned.' },
    { id: 'iq2', q: 'Hub vs switch vs router?', answerMd: 'A hub (layer 1) repeats bits out of every port: one collision domain. A switch (layer 2) forwards frames by MAC address: each port is its own collision domain, but all ports share one broadcast domain. A router (layer 3) forwards packets between networks by IP address and separates broadcast domains.' },
    { id: 'iq3', q: 'What is a VLAN and why use one?', answerMd: 'A logical layer-2 network on shared switches; each VLAN is a separate broadcast domain. It isolates groups (guests, servers, phones) without separate hardware, reduces broadcast traffic and limits lateral movement. Trunks carry several VLANs using 802.1Q tags; traffic between VLANs needs a router or L3 switch.' },
    { id: 'iq4', q: 'What problem does Spanning Tree Protocol solve?', answerMd: 'Layer-2 loops. Redundant links between switches would let broadcasts circulate forever (frames have no TTL), causing broadcast storms and MAC table instability. STP blocks redundant ports to form a loop-free tree and re-enables them when an active link fails.' },
  ],
  revision: { notesMd: `- Frame: dst MAC, src MAC, (VLAN tag), EtherType, payload 46–1500 (MTU), FCS (CRC-32).
- MAC 48 bits; broadcast ff:ff:ff:ff:ff:ff; local link only.
- Switch: learn source MAC → port; forward known; flood broadcast/unknown; filter same-port.
- Per-port collision domains; one broadcast domain per VLAN; routers split broadcast domains.
- Loops → broadcast storms → STP. VLAN ID 12 bits (1–4094); inter-VLAN needs routing.`, flashcards: [
    { id: 'f1', front: 'Standard Ethernet MTU?', backMd: '1500 bytes of payload.' },
    { id: 'f2', front: 'What does a switch do with an unknown unicast destination?', backMd: 'Floods it out of every port except the incoming one.' },
    { id: 'f3', front: 'How many bits in a VLAN ID?', backMd: '12 (1–4094 usable).' },
    { id: 'f4', front: 'What separates broadcast domains?', backMd: 'Routers (and VLANs).' },
    { id: 'f5', front: 'What does STP prevent?', backMd: 'Layer-2 loops and broadcast storms.' },
  ] },
  resources: [wiki('Ethernet frame', 'Ethernet_frame'), wiki('IEEE 802.1Q', 'IEEE_802.1Q'), wiki('Spanning Tree Protocol', 'Spanning_Tree_Protocol')],
});

const emMcqs: MCQ[] = [
  mcq({ ...q(EM), id: 'cn.em.q1', type: 'concept', difficulty: 'easy', stem: 'A switch receives a frame whose destination MAC is not in its MAC table. What does it do?', options: ['Floods it out of every port except the one it arrived on', ['Drops it', 'Unknown destinations are flooded so the frame can still arrive.'], ['Sends an ARP request', 'ARP resolves IPs to MACs; switches do not use it to forward.'], ['Returns it to the sender', 'Switches never reflect frames back.']], answer: 0, explanation: 'Flooding until the destination replies; the reply then teaches the switch the port.' }),
  mcq({ ...q(EM), id: 'cn.em.q2', type: 'concept', difficulty: 'medium', stem: 'A 24-port switch with no VLANs connects 24 hosts. How many collision domains and broadcast domains are there?', options: ['24 collision domains, 1 broadcast domain', ['1 collision domain, 24 broadcast domains', 'That reverses the roles of switches and routers.'], ['24 and 24', 'Without VLANs all ports share one broadcast domain.'], ['1 and 1', 'That describes a hub.']], answer: 0, explanation: 'Every switch port is its own collision domain; broadcasts reach every port.' }),
  mcq({ ...q(EM), id: 'cn.em.q3', type: 'concept', difficulty: 'easy', stem: 'What is the maximum payload (MTU) of a standard Ethernet frame?', options: ['1500 bytes', ['64 bytes', 'That is the minimum frame size.'], ['1518 bytes', 'That is the maximum frame size including headers and FCS.'], ['9000 bytes', 'That is a common jumbo-frame size, not the standard.']], answer: 0, explanation: 'Larger IP packets must be fragmented, or Path MTU Discovery lowers the packet size.' }),
  mcq({ ...q(EM), id: 'cn.em.q4', type: 'concept', difficulty: 'medium', stem: 'Two switches are connected by two cables for redundancy, and STP is disabled. A host sends a broadcast. What happens?', options: ['The broadcast loops endlessly (a broadcast storm), saturating links and destabilising MAC tables', ['The second cable doubles the bandwidth automatically', 'That needs link aggregation (LACP), not a loop.'], ['The frame is dropped when its TTL reaches 0', 'Ethernet frames have no TTL.'], ['Nothing unusual', 'Loops are the reason STP exists.']], answer: 0, explanation: 'STP blocks one of the redundant links to keep a loop-free topology.' }),
  mcq({ ...q(EM), id: 'cn.em.q5', type: 'scenario', difficulty: 'medium', stem: 'A laptop in VLAN 10 cannot ping a server in VLAN 20 on the same switch. Both are configured correctly. What is missing?', options: ['A router or layer-3 switch to route between the VLANs', ['A bigger MAC table', 'MAC tables do not cross VLAN boundaries.'], ['A hub between them', 'A hub would not route.'], ['DNS', 'The ping uses an IP address.']], answer: 0, explanation: 'Each VLAN is a separate layer-2 network; crossing between them is routing.' }),
  mcq({ ...q(EM), id: 'cn.em.q6', type: 'concept', difficulty: 'easy', stem: 'What does a switch learn from each incoming frame?', options: ['The source MAC address and the port it arrived on', ['The destination IP address', 'Layer-2 switches do not read IP headers.'], ['The TCP port', 'Layer 4 is not used.'], ['The sender\'s hostname', 'Unrelated.']], answer: 0, explanation: 'Source learning builds the MAC address table used for forwarding.' }),
];

// ---------------------------------------------------------------------------------------
const AD = 'cn.arp-icmp-dhcp';
const arp = cnTopic({
  id: AD, title: 'ARP, ICMP and DHCP', level: 'core', estMinutes: 40, prerequisites: ['cn.ip-subnetting'], related: ['cn.ethernet-mac', 'cn.troubleshooting', 'cn.dns'],
  summary: 'Address resolution, ping/traceroute, and DHCP.',
  objectives: ['Explain ARP request/reply, the ARP cache, gratuitous ARP and ARP spoofing.', 'Use ICMP knowledge to explain ping, traceroute and Path MTU Discovery.', 'Walk through DHCP DORA, leases, renewal and relays.', 'Diagnose common symptoms (169.254.x.x addresses, duplicate IPs, blocked ICMP).'],
  sections: [
    { id: 'arp', kind: 'concept', title: 'ARP: IP → MAC on the local link', bodyMd: `To send a frame to an IP on its subnet (or to its gateway), a host needs the MAC address:

1. Check the **ARP cache** (\`ip neigh\`, \`arp -a\`).
2. If missing, **broadcast** an ARP request: "Who has 192.168.1.1? Tell 192.168.1.10."
3. The owner **unicasts** a reply with its MAC; both sides cache the mapping (minutes).

- **Gratuitous ARP:** a host announces its own IP→MAC (after boot, or when a standby takes over a virtual IP) and detects duplicate addresses.
- **ARP spoofing:** ARP has no authentication, so an attacker on the LAN can claim the gateway's IP and become a man in the middle. Mitigations: Dynamic ARP Inspection with DHCP snooping on switches, and end-to-end encryption (TLS) so interception does not reveal data.
- **IPv6** replaces ARP with **Neighbor Discovery** (ICMPv6 Neighbor Solicitation/Advertisement).` },
    { id: 'icmp', kind: 'concept', title: 'ICMP: errors and diagnostics', bodyMd: `ICMP carries control messages for IP:

| Type | Meaning | Used by |
|---|---|---|
| 8 / 0 | Echo request / reply | \`ping\` |
| 3 | Destination unreachable (code 3 port unreachable; code 4 fragmentation needed) | UDP traceroute end, **Path MTU Discovery** |
| 11 | Time exceeded (TTL reached 0) | \`traceroute\` |
| 5 | Redirect | better first hop on the same link |

**traceroute** sends probes with TTL 1, 2, 3…; each router that decrements TTL to 0 returns *Time Exceeded*, revealing the path. Linux \`traceroute\` uses UDP probes to high ports by default (the destination answers *Port Unreachable*); Windows \`tracert\` uses ICMP echo. \`* * *\` means no reply, often just a router that does not answer probes.

**Do not block all ICMP:** Path MTU Discovery relies on *Fragmentation Needed* messages. Without them, large packets vanish while small ones (like the TCP handshake) work: a classic "connection hangs after login" **PMTU black hole**.` },
    { id: 'dhcp', kind: 'concept', title: 'DHCP: getting an address', bodyMd: `**DORA** (client UDP port 68, server UDP port 67):

1. **Discover:** the client, with no IP yet (source 0.0.0.0), broadcasts.
2. **Offer:** a server offers an address and options.
3. **Request:** the client broadcasts which offer it accepts (so other servers withdraw theirs).
4. **Ack:** the server confirms: IP, subnet mask, default gateway, DNS servers, lease time.

**Leases:** the client renews at **T1 = 50%** of the lease (unicast to its server) and, failing that, rebinds at **T2 = 87.5%** (broadcast to any server).

- DHCP broadcasts do not cross routers: a **DHCP relay** (\`ip helper-address\`) forwards them to a central server.
- No answer at all → the OS self-assigns a **link-local 169.254.x.x** address (APIPA): a strong sign DHCP is broken.
- Rogue DHCP servers and starvation attacks are blocked with **DHCP snooping** on switches.` },
    { id: 'dry-run', kind: 'dry-run', title: 'Walkthrough: a laptop joins Wi-Fi and opens a site', bodyMd: `1. **DHCP DORA** gives 192.168.1.23/24, gateway 192.168.1.1, DNS 192.168.1.1, lease 24 h.
2. The laptop sends a **gratuitous ARP** for 192.168.1.23 to detect a duplicate.
3. To reach DNS (on the gateway), it **ARPs** for 192.168.1.1 and caches the router's MAC.
4. It sends the DNS query (UDP 53) in a frame addressed to the router's MAC.
5. With the site's IP resolved, every packet to the Internet goes in a frame to the same gateway MAC (no new ARP).
6. 12 hours later it renews the lease with a unicast DHCP Request (T1).` },
    { id: 'commands', kind: 'example', title: 'Commands', bodyMd: 'Inspect each protocol on Linux.', code: [sh(`ip neigh show                 # ARP / neighbour cache
ping -c 3 8.8.8.8              # ICMP echo
traceroute -n example.com      # UDP probes by default; -I for ICMP, -T for TCP
tracepath example.com          # also reports the path MTU
sudo dhclient -v wlan0         # watch DHCPDISCOVER/OFFER/REQUEST/ACK`)] },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How does ARP work?', answerMd: 'A host that needs the MAC address for an IP on its link checks its ARP cache; if missing, it broadcasts an ARP request asking who has that IP, and the owner unicasts a reply with its MAC. Both cache the mapping for a while. For off-subnet destinations the host ARPs for the default gateway, not the remote server.' },
    { id: 'iq2', q: 'How does traceroute work?', answerMd: 'It sends probes with increasing TTL starting at 1. Each router decrements TTL; the one that reaches 0 drops the probe and returns ICMP Time Exceeded, revealing its address and the round-trip time. When the probe reaches the destination, it answers (ICMP Port Unreachable for UDP probes, or Echo Reply), and traceroute stops.' },
    { id: 'iq3', q: 'Explain the DHCP process.', answerMd: 'DORA: the client broadcasts Discover, servers reply with Offers, the client broadcasts a Request for one offer, and that server sends an Ack with the IP, mask, gateway, DNS servers and lease time. The client renews at 50% of the lease and rebinds at 87.5%. Relays forward broadcasts to servers on other subnets.' },
    { id: 'iq4', q: 'A machine has a 169.254.x.x address. What does it mean?', answerMd: 'It asked for an address via DHCP and got no answer, so it self-assigned a link-local address. Check the cable or Wi-Fi association, the VLAN, whether the DHCP server or relay is up, and whether the pool is exhausted.' },
    { id: 'iq5', q: 'What is ARP spoofing and how is it prevented?', answerMd: 'An attacker on the LAN sends forged ARP replies mapping the gateway\'s IP to the attacker\'s MAC, so victims send traffic through the attacker (man in the middle). Switch features like Dynamic ARP Inspection (validated against DHCP snooping bindings) block it, and TLS keeps intercepted traffic unreadable and tamper-evident.' },
  ],
  revision: { notesMd: `- ARP: broadcast request, unicast reply, cache; gratuitous ARP; spoofing → DAI + TLS; IPv6 uses NDP.
- ICMP: echo 8/0, unreachable 3 (code 4 → PMTUD), time exceeded 11 (traceroute).
- Never block all ICMP: PMTU black holes.
- DHCP DORA over UDP 67/68; T1 50%, T2 87.5%; relays cross subnets; 169.254 = no DHCP answer.`, flashcards: [
    { id: 'f1', front: 'ARP request: broadcast or unicast?', backMd: 'Broadcast (the reply is unicast).' },
    { id: 'f2', front: 'ICMP message traceroute relies on?', backMd: 'Time Exceeded (type 11).' },
    { id: 'f3', front: 'DHCP steps?', backMd: 'Discover, Offer, Request, Ack.' },
    { id: 'f4', front: 'When does a DHCP client first try to renew?', backMd: 'At 50% of the lease (T1).' },
    { id: 'f5', front: 'What replaces ARP in IPv6?', backMd: 'Neighbor Discovery (ICMPv6).' },
  ] },
  resources: [RFC(826, 'An Ethernet Address Resolution Protocol'), RFC(792, 'Internet Control Message Protocol'), RFC(2131, 'Dynamic Host Configuration Protocol')],
});

const adMcqs: MCQ[] = [
  mcq({ ...q(AD), id: 'cn.ad.q1', type: 'concept', difficulty: 'easy', stem: 'How is an ARP request delivered?', options: ['As a layer-2 broadcast to every host on the local network', ['Unicast to the target\'s MAC', 'The sender does not know that MAC yet; that is the point of ARP.'], ['Routed to the DNS server', 'ARP has nothing to do with DNS.'], ['Multicast across the Internet', 'ARP never leaves the local link.']], answer: 0, explanation: 'Only the owner of the IP replies, by unicast.' }),
  mcq({ ...q(AD), id: 'cn.ad.q2', type: 'concept', difficulty: 'easy', stem: 'What is the order of DHCP messages when a client joins a network?', options: ['Discover, Offer, Request, Ack', ['Request, Offer, Discover, Ack', 'The client first discovers servers.'], ['Offer, Discover, Ack, Request', 'Servers do not offer unprompted.'], ['Discover, Ack, Request, Offer', 'The Ack confirms the request and comes last.']], answer: 0, explanation: 'DORA; Discover and Request are broadcasts because the client has no address yet.' }),
  mcq({ ...q(AD), id: 'cn.ad.q3', type: 'concept', difficulty: 'medium', stem: 'How does traceroute discover each router on the path?', options: ['It sends probes with TTL 1, 2, 3… and each router where TTL hits 0 returns ICMP Time Exceeded', ['Each router appends its address to the packet', 'IP has a record-route option, but traceroute does not rely on it.'], ['It queries DNS for every hop', 'Reverse DNS only names hops already found.'], ['It reads the routers\' routing tables', 'Routers do not expose them.']], answer: 0, explanation: 'Increasing the TTL one step at a time makes each successive router reveal itself.' }),
  mcq({ ...q(AD), id: 'cn.ad.q4', type: 'scenario', difficulty: 'medium', stem: 'A user\'s laptop shows the address 169.254.17.3 and cannot reach anything. Most likely cause?', options: ['The DHCP request got no response, so the OS self-assigned a link-local address', ['The ISP assigned a private address', 'ISP and home private ranges are not 169.254/16.'], ['The DNS server is down', 'DNS failure does not change the IP address.'], ['The laptop has an IPv6 address', '169.254/16 is IPv4 link-local.']], answer: 0, explanation: 'Check the link, VLAN, DHCP server or relay, and pool exhaustion.' }),
  mcq({ ...q(AD), id: 'cn.ad.q5', type: 'scenario', difficulty: 'hard', stem: 'After a firewall change that drops all ICMP, users can connect to a VPN-backed site and log in, but large page loads hang forever. Why?', options: ['Path MTU Discovery broke: "Fragmentation needed" ICMP messages are dropped, so oversized packets vanish', ['TCP handshakes need ICMP', 'Handshakes use TCP and still work, which is why login succeeds.'], ['DNS uses ICMP', 'DNS uses UDP/TCP port 53.'], ['ping is required for HTTP keep-alive', 'Keep-alive is TCP/HTTP, not ICMP.']], answer: 0, explanation: 'Small packets fit the reduced MTU (from VPN overhead); large ones exceed it and are silently dropped. Allow ICMP type 3 code 4 (and ICMPv6 Packet Too Big), or clamp the TCP MSS.' }),
  mcq({ ...q(AD), id: 'cn.ad.q6', type: 'scenario', difficulty: 'medium', stem: 'On a café Wi-Fi, an attacker sends ARP replies claiming to own the gateway\'s IP. What is the attack and the best protection for the user?', options: ['ARP spoofing (man in the middle); end-to-end encryption such as HTTPS/TLS or a VPN keeps traffic confidential', ['DNS amplification; disable DNS', 'Amplification is a DDoS technique against a third party.'], ['SYN flood; enable SYN cookies', 'Not a resource-exhaustion attack.'], ['MAC flooding; buy a bigger switch', 'The attacker forges ARP mappings, not table overflow.']], answer: 0, explanation: 'ARP has no authentication; on networks you do not control, rely on encryption and certificate validation.' }),
];

// ---------------------------------------------------------------------------------------
const RT = 'cn.routing-switching';
const routing = cnTopic({
  id: RT, title: 'Routing', level: 'core', estMinutes: 45, prerequisites: ['cn.ip-subnetting'], related: ['cn.ethernet-mac', 'cn.nat-firewalls', 'cn.troubleshooting'],
  summary: 'Routing tables and longest-prefix match.',
  objectives: ['Read a routing table and apply longest-prefix match, including the default route.', 'Compare static, distance-vector (RIP) and link-state (OSPF) routing.', 'Explain BGP\'s role between autonomous systems and how BGP mistakes cause outages.', 'Describe what a router does to each packet.'],
  sections: [
    { id: 'table', kind: 'concept', title: 'Routing tables and longest-prefix match', bodyMd: `A router (and every host) has a **routing table**: prefix → next hop / interface.

| Prefix | Next hop |
|---|---|
| 10.0.0.0/8 | A |
| 10.1.0.0/16 | B |
| 10.1.2.0/24 | C |
| 0.0.0.0/0 (default route) | D |

**Longest-prefix match:** of all entries that contain the destination, use the **most specific** (longest prefix). The default route \`/0\` matches everything and is used only when nothing else does.

For each packet a router: checks the header checksum, **decrements the TTL** (drops at 0 and sends ICMP Time Exceeded), looks up the destination, ARPs for the next hop if needed, and re-frames it with new MAC addresses.

Route sources: **connected** (interfaces), **static** (configured by hand; simple, no adaptation), and **dynamic** (learned from routing protocols).` },
    { id: 'protocols', kind: 'comparison', title: 'Routing protocols', bodyMd: `| | Distance vector (RIP) | Link state (OSPF) | Path vector (BGP) |
|---|---|---|---|
| Shares | its whole table with neighbours, periodically | link-state advertisements flooded to all routers in the area | reachable prefixes with the full AS path |
| Computes | Bellman-Ford style: neighbour distance + 1 | **Dijkstra** over the full topology map | best path by **policy** (local preference, AS-path length…) |
| Metric | hop count (RIP max **15**; 16 = unreachable) | link cost (bandwidth based) | policy, not speed |
| Convergence | slow; **count-to-infinity** (mitigated by split horizon, poison reverse) | fast | slow, deliberate |
| Scope | small networks (legacy) | inside one organisation (IGP) | **between autonomous systems** (the Internet's EGP) |

**Autonomous system (AS):** a network under one administration with its own AS number (an ISP, a cloud, a large company). BGP glues ASes into the Internet. Because BGP trusts announcements, errors propagate: in October 2021 a faulty maintenance command cut Facebook's backbone, its DNS servers then withdrew their BGP announcements, and Facebook, Instagram and WhatsApp disappeared from the Internet for hours. RPKI route origin validation helps against hijacks and leaks.` },
    { id: 'dry-run', kind: 'dry-run', title: 'Worked example: look up four destinations', bodyMd: `Using the table above:

| Destination | Matching entries | Chosen |
|---|---|---|
| 10.1.2.5 | /8, /16, /24, /0 | **C** (/24 is longest) |
| 10.1.9.9 | /8, /16, /0 | **B** |
| 10.200.0.1 | /8, /0 | **A** |
| 8.8.8.8 | /0 only | **D** (default route) |` },
    { id: 'commands', kind: 'example', title: 'Commands', bodyMd: 'Inspect routes on Linux.', code: [sh(`ip route show                     # the host routing table, including "default via ..."
ip route get 10.1.2.5             # which route and interface the kernel would use
sudo ip route add 10.9.0.0/16 via 192.168.1.254   # a static route`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Picking the first matching entry instead of the longest prefix.
2. Forgetting the default route (hosts usually have just a connected route and a default).
3. Thinking routers change the destination IP (they do not; NAT devices do).
4. Calling BGP a "shortest path" protocol: it is policy-driven.
5. Confusing routing (building the table) with forwarding (using it per packet).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is longest-prefix match?', answerMd: 'When several routing-table entries contain the destination address, the router chooses the one with the longest prefix (most specific network). The default route 0.0.0.0/0 matches everything and is used only when nothing more specific exists.' },
    { id: 'iq2', q: 'Distance vector vs link state?', answerMd: 'Distance-vector routers (RIP) send their distance table to neighbours and trust their computations; simple but slow to converge with count-to-infinity problems. Link-state routers (OSPF) flood descriptions of their links so every router has the full topology and runs Dijkstra; faster convergence, more memory and CPU.' },
    { id: 'iq3', q: 'What is BGP and why does it matter?', answerMd: 'The Border Gateway Protocol exchanges reachability between autonomous systems, so it is how the Internet\'s networks find each other. It is a path-vector protocol chosen by policy. Because it trusts announcements, misconfigurations or hijacks can make large services unreachable or reroute traffic, as in the 2021 Facebook outage.' },
    { id: 'iq4', q: 'What does a router do with each packet?', answerMd: 'Validates the header, decrements TTL (discarding the packet with an ICMP Time Exceeded at 0), looks up the destination with longest-prefix match, resolves the next hop\'s MAC address (ARP), and sends the packet in a new frame on the outgoing interface. Source and destination IPs are unchanged unless NAT applies.' },
  ],
  revision: { notesMd: `- Longest prefix wins; default route 0.0.0.0/0 is the last resort.
- Router per packet: TTL−1, lookup, ARP next hop, new frame; IPs unchanged.
- RIP: distance vector, hop count ≤ 15, count-to-infinity.
- OSPF: link state, Dijkstra, fast convergence, inside an organisation.
- BGP: path vector between autonomous systems, policy-based; mistakes cause global outages.`, flashcards: [
    { id: 'f1', front: 'Destination 10.1.2.5 with routes /8, /16 (10.1.0.0), /24 (10.1.2.0): which wins?', backMd: 'The /24.' },
    { id: 'f2', front: 'Algorithm used by OSPF?', backMd: 'Dijkstra\'s shortest path first.' },
    { id: 'f3', front: 'RIP infinity metric?', backMd: '16 hops (max usable 15).' },
    { id: 'f4', front: 'Which protocol runs between autonomous systems?', backMd: 'BGP.' },
    { id: 'f5', front: 'What does 0.0.0.0/0 mean in a routing table?', backMd: 'The default route.' },
  ] },
  resources: [wiki('Longest prefix match', 'Longest_prefix_match'), RFC(2328, 'OSPF Version 2'), RFC(4271, 'A Border Gateway Protocol 4 (BGP-4)')],
});

const rtMcqs: MCQ[] = [
  mcq({ ...q(RT), id: 'cn.rt.q1', type: 'scenario', difficulty: 'medium', stem: 'Routes: 10.0.0.0/8 → A, 10.1.0.0/16 → B, 10.1.2.0/24 → C, 0.0.0.0/0 → D. Where does a packet to 10.1.2.5 go?', options: ['C', ['A', '/8 matches, but a longer prefix also matches.'], ['B', '/16 matches, but /24 is longer.'], ['D', 'The default route is used only if nothing else matches.']], answer: 0, explanation: 'Longest-prefix match picks the most specific route, the /24.' }),
  mcq({ ...q(RT), id: 'cn.rt.q2', type: 'scenario', difficulty: 'medium', stem: 'Same table. Where does a packet to 10.1.9.9 go?', options: ['B', ['C', '10.1.9.9 is outside 10.1.2.0/24.'], ['A', '10.1.0.0/16 is more specific than /8.'], ['D', 'More specific routes match.']], answer: 0, explanation: '10.1.9.9 falls in 10.0.0.0/8 and 10.1.0.0/16; the /16 is longest.' }),
  mcq({ ...q(RT), id: 'cn.rt.q3', type: 'concept', difficulty: 'medium', stem: 'Which statement describes OSPF?', options: ['A link-state protocol: routers flood link information and each runs Dijkstra on the full topology', ['A distance-vector protocol limited to 15 hops', 'That is RIP.'], ['The protocol that connects autonomous systems on the Internet', 'That is BGP.'], ['A protocol that maps IPs to MACs', 'That is ARP.']], answer: 0, explanation: 'OSPF is the common interior gateway protocol inside organisations.' }),
  mcq({ ...q(RT), id: 'cn.rt.q4', type: 'concept', difficulty: 'easy', stem: 'Which protocol exchanges routes between autonomous systems such as ISPs and cloud providers?', options: ['BGP', ['OSPF', 'An interior protocol within one AS.'], ['RIP', 'An interior distance-vector protocol.'], ['DHCP', 'Assigns host addresses.']], answer: 0, explanation: 'BGP is the Internet\'s exterior gateway protocol; route choice is policy-driven.' }),
  mcq({ ...q(RT), id: 'cn.rt.q5', type: 'concept', difficulty: 'medium', stem: 'What does a router change in an IPv4 packet it forwards (no NAT)?', options: ['The TTL (and header checksum), and it puts the packet in a new frame with new MAC addresses', ['The destination IP address', 'IPs stay end to end without NAT.'], ['The source IP address', 'Only NAT rewrites it.'], ['The TCP sequence numbers', 'Routers do not touch the transport layer.']], answer: 0, explanation: 'The IP header is preserved except TTL and checksum; the link-layer header is rebuilt per hop.' }),
  mcq({ ...q(RT), id: 'cn.rt.q6', type: 'concept', difficulty: 'hard', stem: 'Which problem is characteristic of distance-vector routing, and what mitigates it?', options: ['Count-to-infinity after a link failure; split horizon, poison reverse and a maximum metric', ['Running Dijkstra is too slow; use areas', 'That concerns link-state protocols.'], ['Route hijacking; use RPKI', 'That concerns BGP.'], ['Broadcast storms; use STP', 'That is a layer-2 problem.']], answer: 0, explanation: 'Neighbours keep advertising stale paths to each other, slowly increasing the metric; RIP caps it at 16 = unreachable.' }),
];

// ---------------------------------------------------------------------------------------
const NF = 'cn.nat-firewalls';
const nat = cnTopic({
  id: NF, title: 'NAT and Firewalls', level: 'core', estMinutes: 40, prerequisites: ['cn.ip-subnetting'], related: ['cn.routing-switching', 'cn.proxies-lb', 'cn.troubleshooting'],
  summary: 'NAT/PAT and stateful vs stateless firewalls.',
  objectives: ['Explain NAT and PAT (NAPT) with a translation table, and why inbound connections need port forwarding.', 'Compare stateless packet filters, stateful firewalls and layer-7 firewalls.', 'Write simple allow rules, including return traffic on ephemeral ports for stateless ACLs.', 'Map these ideas to the cloud: security groups vs network ACLs, CGNAT.'],
  sections: [
    { id: 'nat', kind: 'concept', title: 'NAT and PAT', bodyMd: `Private addresses (10/8, 172.16/12, 192.168/16) are not routable on the Internet, so the edge router translates them.

**PAT / NAPT** (what home routers and cloud NAT gateways do): many private hosts share **one public IP**, distinguished by **port**:

| Inside (private) | Outside (public) | Remote |
|---|---|---|
| 192.168.1.10:51000 | 203.0.113.5:40001 | 93.184.216.34:443 |
| 192.168.1.11:51000 | 203.0.113.5:40002 | 93.184.216.34:443 |

Replies arrive at 203.0.113.5:40001, the router looks up the entry and rewrites the destination back to 192.168.1.10:51000.

- **Inbound** connections have no table entry, so they fail unless you configure **port forwarding** (static DNAT, e.g. public :443 → 192.168.1.20:443).
- NAT breaks end-to-end addressing: peer-to-peer apps (WebRTC calls, games) use **STUN/TURN/ICE** to traverse it.
- ISPs short of IPv4 addresses use **carrier-grade NAT** with the shared range **100.64.0.0/10**, so your router's "public" address may itself be private-ish.
- NAT hides internal addresses but is **not a firewall**; IPv6 usually needs no NAT and relies on firewalls instead.` },
    { id: 'firewalls', kind: 'comparison', title: 'Firewall types', bodyMd: `| Type | Decides on | Return traffic | Example |
|---|---|---|---|
| **Stateless** packet filter (ACL) | each packet's 5-tuple: protocol, src/dst IP, src/dst port | must be **explicitly allowed** (including ephemeral ports) | router ACLs, **AWS network ACLs** |
| **Stateful** | packets plus **connection tracking** | replies to allowed connections are allowed automatically | iptables/nftables with conntrack, **AWS security groups** |
| **Layer 7** / WAF / NGFW | application content (URLs, SQL injection patterns, user identity) | stateful | WAFs, next-gen firewalls, zero-trust proxies |

Principles: **default deny**, allow the minimum (least privilege), and remember that ordered rule lists (iptables, NACLs) use the **first match**.

**Ephemeral ports:** clients connect *from* a random high port (Linux uses 32768–60999 by default, Windows 49152–65535). A stateless rule set that allows inbound 443 to a web server must also allow **outbound** traffic to those client ports, or responses never leave.` },
    { id: 'example', kind: 'example', title: 'A minimal stateful host firewall', bodyMd: 'Default-deny inbound, allow replies, SSH from the office range and HTTPS from anywhere.', code: [sh(`iptables -P INPUT DROP
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -s 203.0.113.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p icmp --icmp-type fragmentation-needed -j ACCEPT   # keep PMTUD working`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Treating NAT as security.
2. Forgetting ephemeral-port return rules on stateless ACLs.
3. Opening 0.0.0.0/0 on SSH or database ports "temporarily".
4. Putting a broad allow rule before a specific deny in a first-match list.
5. Blocking all ICMP (breaks Path MTU Discovery).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How does NAT (PAT) let many devices share one public IP?', answerMd: 'The router rewrites each outgoing packet\'s private source IP and port to its public IP and a unique port, recording the mapping in a translation table. Replies to that public port are translated back to the original private address and port. Connections are distinguished by port, so thousands can share one address.' },
    { id: 'iq2', q: 'Stateful vs stateless firewall?', answerMd: 'A stateless filter judges each packet alone by its header fields, so rules must allow both directions, including replies to ephemeral ports. A stateful firewall tracks connections and automatically allows return traffic for connections it permitted, which is simpler and safer. In AWS, security groups are stateful and network ACLs are stateless.' },
    { id: 'iq3', q: 'Why can\'t someone on the Internet connect to a server on your home network?', answerMd: 'Inbound packets arrive at the router\'s public IP with no matching NAT entry, so the router does not know which private host should receive them and drops them. You would need port forwarding (static DNAT) or a tunnel/relay initiated from inside.' },
    { id: 'iq4', q: 'Is NAT a security feature?', answerMd: 'Not by design. It incidentally blocks unsolicited inbound connections and hides internal addresses, but it does not inspect traffic or enforce policy, and port forwards or UPnP open holes. Use a real (stateful) firewall with default deny; in IPv6 there is usually no NAT at all.' },
  ],
  revision: { notesMd: `- PAT: (private IP, port) ↔ (public IP, unique port) in a translation table.
- Inbound needs port forwarding; P2P uses STUN/TURN/ICE; CGNAT 100.64.0.0/10.
- Stateless ACL: per packet, allow return traffic to ephemeral ports. Stateful: conntrack allows replies.
- AWS: security groups stateful (instance), NACLs stateless (subnet, numbered rules).
- Default deny, least privilege, first match wins in ordered lists.`, flashcards: [
    { id: 'f1', front: 'How does PAT tell internal hosts apart?', backMd: 'By the translated source port.' },
    { id: 'f2', front: 'AWS security group: stateful or stateless?', backMd: 'Stateful (network ACLs are stateless).' },
    { id: 'f3', front: 'What is 100.64.0.0/10?', backMd: 'Shared address space for carrier-grade NAT (RFC 6598).' },
    { id: 'f4', front: 'Linux default ephemeral port range?', backMd: '32768–60999.' },
    { id: 'f5', front: 'How do you expose a home server through NAT?', backMd: 'Port forwarding (static DNAT).' },
  ] },
  resources: [RFC(3022, 'Traditional IP Network Address Translator'), RFC(6598, 'IANA-Reserved IPv4 Prefix for Shared Address Space'), { title: 'AWS: Control subnet traffic with network ACLs', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html', kind: 'official-docs' }],
});

const nfMcqs: MCQ[] = [
  mcq({ ...q(NF), id: 'cn.nf.q1', type: 'concept', difficulty: 'easy', stem: 'With PAT, 50 laptops share one public IP. How does the router know which laptop a reply belongs to?', options: ['Each connection gets a unique translated source port, recorded in the NAT table', ['By the laptops\' MAC addresses in the reply', 'MAC addresses do not travel across the Internet.'], ['The reply contains the private IP', 'The remote server only ever saw the public IP.'], ['By DNS lookups', 'Unrelated.']], answer: 0, explanation: 'The (public IP, port) pair maps back to (private IP, port).' }),
  mcq({ ...q(NF), id: 'cn.nf.q2', type: 'scenario', difficulty: 'easy', stem: 'You run a game server on 192.168.1.20 at home. Friends cannot connect to your public IP. What do you configure?', options: ['Port forwarding on the router (static DNAT from the public port to 192.168.1.20)', ['A bigger DHCP pool', 'Address assignment is not the problem.'], ['A new DNS server', 'Friends already use your public IP.'], ['Disable the switch\'s MAC learning', 'Unrelated.']], answer: 0, explanation: 'Unsolicited inbound connections have no NAT entry until you create one.' }),
  mcq({ ...q(NF), id: 'cn.nf.q3', type: 'scenario', difficulty: 'hard', stem: 'A subnet\'s stateless network ACL allows inbound TCP 443 from 0.0.0.0/0 and outbound TCP 443 to 0.0.0.0/0 only. Browsers time out reaching the web server. Why?', options: ['Responses go to the clients\' ephemeral ports (e.g. 49152–65535), which the outbound rule does not allow', ['HTTPS needs port 80 open too', 'Not for HTTPS itself.'], ['ACLs cannot filter TCP', 'They can.'], ['The server needs a public DNS name', 'Clients already reach it by IP or name; replies are the issue.']], answer: 0, explanation: 'Stateless filters do not remember connections; allow outbound to 1024–65535 (or use a stateful security group).' }),
  mcq({ ...q(NF), id: 'cn.nf.q4', type: 'concept', difficulty: 'medium', stem: 'What does a stateful firewall do that a stateless one does not?', options: ['Tracks connections and automatically allows return traffic for permitted connections', ['Inspects HTTP URLs', 'That is a layer-7 firewall/WAF feature.'], ['Translates addresses', 'That is NAT.'], ['Encrypts traffic', 'That is TLS or a VPN.']], answer: 0, explanation: 'Connection tracking is what "stateful" means.' }),
  mcq({ ...q(NF), id: 'cn.nf.q5', type: 'concept', difficulty: 'medium', stem: 'Your home router\'s WAN address is 100.72.14.9. What does that suggest?', options: ['Your ISP uses carrier-grade NAT (100.64.0.0/10 shared address space), so you are behind two NATs', ['It is a public address you can port-forward freely', '100.64/10 is not globally routable.'], ['It is an IPv6 address', 'It is IPv4.'], ['DHCP failed', 'That would be 169.254.x.x.']], answer: 0, explanation: 'Port forwarding on your router will not help; the ISP\'s NAT drops inbound connections first.' }),
  mcq({ ...q(NF), id: 'cn.nf.q6', type: 'concept', difficulty: 'medium', stem: 'In AWS, which is correct?', options: ['Security groups are stateful and attach to instances; network ACLs are stateless and attach to subnets', ['Both are stateless', 'Security groups track connections.'], ['Security groups are stateless; NACLs are stateful', 'The reverse.'], ['NACLs support only allow rules', 'NACLs support allow and deny; security groups only allow.']], answer: 0, explanation: 'NACL rules are evaluated in order by rule number; security group rules are all evaluated together.' }),
];

// ---------------------------------------------------------------------------------------
const FC = 'cn.flow-congestion';
const congestion = cnTopic({
  id: FC, title: 'Flow and Congestion Control', level: 'core', estMinutes: 50, prerequisites: ['cn.tcp-lifecycle'], related: ['cn.tcp-lifecycle', 'cn.http', 'cn.sockets'],
  summary: 'Sliding windows, slow start and congestion avoidance.',
  objectives: ['Explain flow control with the receive window, and compute the throughput limit window / RTT.', 'Trace cwnd through slow start, congestion avoidance, fast retransmit and timeouts.', 'Compute the bandwidth-delay product and explain window scaling.', 'Know modern algorithms (CUBIC, BBR) at an interview level.'],
  sections: [
    { id: 'flow', kind: 'concept', title: 'Flow control: do not overwhelm the receiver', bodyMd: `Each ACK carries the receiver's free buffer space, the **receive window (rwnd)**. The sender may have at most that many unacknowledged bytes in flight: a **sliding window** that advances as ACKs arrive.

- If the receiver's buffer fills, it advertises **rwnd = 0**; the sender pauses and sends occasional **window probes**.
- The 16-bit window field allows at most **65,535 bytes**. The **window scale** option (negotiated in the SYNs) multiplies it by up to 2¹⁴ (about 1 GiB).

**Throughput limit:** at most one window per round trip, so **throughput ≤ window / RTT**. With 65,535 bytes and a 100 ms RTT that is about **5.24 Mbit/s**, whatever the link speed.

**Bandwidth-delay product (BDP)** = bandwidth × RTT = the data needed in flight to fill the pipe. 1 Gbit/s × 50 ms = **6.25 MB**, so long fat links need window scaling and large buffers.` },
    { id: 'congestion', kind: 'concept', title: 'Congestion control: do not overwhelm the network', bodyMd: `The sender also keeps a **congestion window (cwnd)**; it may send **min(cwnd, rwnd)** bytes in flight. Loss is taken as a congestion signal.

1. **Slow start:** cwnd starts small (textbook 1 MSS; Linux uses 10 segments) and grows by 1 MSS per ACK, so it **doubles every RTT**, until it reaches **ssthresh**.
2. **Congestion avoidance:** above ssthresh, cwnd grows by about **1 MSS per RTT** (additive increase).
3. **Three duplicate ACKs** (a single loss, data still flowing): **fast retransmit** the missing segment; Reno's **fast recovery** sets ssthresh = cwnd/2 and continues from there (multiplicative decrease), skipping slow start.
4. **Timeout** (severe loss): ssthresh = cwnd/2, **cwnd = 1 MSS**, back to slow start.

This **AIMD** behaviour makes competing flows converge to a fair share. Modern stacks use **CUBIC** (Linux default: cwnd grows as a cubic function of time since the last loss, better on high-BDP paths) or **BBR** (Google: models bottleneck bandwidth and RTT instead of waiting for loss, which helps on lossy links and avoids filling buffers).

**Flow control protects the receiver; congestion control protects the network.**` },
    { id: 'dry-run', kind: 'dry-run', title: 'Trace: cwnd per round trip', bodyMd: `Textbook model in MSS units: initial cwnd = 1, ssthresh = 16, one window per RTT.

| Round | cwnd | Phase |
|---|---|---|
| 1–5 | 1, 2, 4, 8, 16 | slow start (doubling) |
| 6–9 | 17, 18, 19, 20 | congestion avoidance (+1) |
| (timeout during round 9) | ssthresh = 20 / 2 = 10, cwnd = 1 | |
| 10–14 | 1, 2, 4, 8, 10 | slow start, capped at the new ssthresh |
| 15 | 11 | congestion avoidance |

Had round 9 ended with **three duplicate ACKs** instead (Reno), cwnd would have dropped to 10 and continued 10, 11, 12… with no slow start.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Mixing up rwnd (receiver) and cwnd (network).
2. Saying slow start is slow: it grows exponentially; it only *starts* small.
3. Treating every loss the same: duplicate ACKs → halve; timeout → back to 1 MSS.
4. Blaming bandwidth when a long-RTT transfer is window-limited (check window / RTT).
5. Forgetting that many short HTTP connections spend their whole life in slow start (a reason for connection reuse and HTTP/2).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Flow control vs congestion control?', answerMd: 'Flow control stops the sender from overrunning the receiver: the receiver advertises its free buffer (rwnd) in every ACK. Congestion control stops senders from overloading the network: the sender keeps its own cwnd, grows it while ACKs arrive and cuts it on loss. The sender is limited by min(cwnd, rwnd).' },
    { id: 'iq2', q: 'Explain TCP slow start and congestion avoidance.', answerMd: 'A new connection starts with a small cwnd and increases it by one MSS per ACK, doubling it each RTT, until it reaches ssthresh. Then it switches to congestion avoidance, adding about one MSS per RTT. On three duplicate ACKs it halves (fast retransmit and recovery); on a timeout it sets ssthresh to half and restarts from one MSS.' },
    { id: 'iq3', q: 'Why might a 1 Gbit/s link only give 5 Mbit/s for a single transfer across continents?', answerMd: 'A single TCP connection can send at most one window per RTT. With a 64 KB window (no window scaling) and a 100 ms RTT, the ceiling is about 5.2 Mbit/s. Fix: enable window scaling and larger socket buffers (to cover the bandwidth-delay product), or use parallel connections.' },
    { id: 'iq4', q: 'What is the bandwidth-delay product?', answerMd: 'Bandwidth multiplied by RTT: the amount of unacknowledged data that must be in flight to keep the link full. For 1 Gbit/s and 50 ms it is 6.25 MB, far beyond the 64 KB unscaled TCP window.' },
    { id: 'iq5', q: 'What is BBR and how does it differ from CUBIC?', answerMd: 'CUBIC is loss-based: it grows cwnd until packets are dropped, then backs off. BBR is model-based: it estimates the bottleneck bandwidth and minimum RTT and paces sending at that rate, so it does not need losses to find capacity, keeps queues short, and performs better on lossy, long-distance links.' },
  ],
  revision: { notesMd: `- rwnd (receiver) vs cwnd (network); in flight ≤ min(cwnd, rwnd).
- Throughput ≤ window / RTT; BDP = bandwidth × RTT; window scaling beyond 64 KB.
- Slow start doubles per RTT up to ssthresh; then +1 MSS per RTT.
- 3 dup ACKs: fast retransmit, ssthresh = cwnd/2, cwnd ≈ ssthresh. Timeout: ssthresh = cwnd/2, cwnd = 1.
- CUBIC (Linux default, loss-based), BBR (model-based).`, flashcards: [
    { id: 'f1', front: 'Max throughput with a 65,535-byte window and 100 ms RTT?', backMd: 'About 5.24 Mbit/s.' },
    { id: 'f2', front: 'BDP for 1 Gbit/s and 50 ms?', backMd: '6.25 MB.' },
    { id: 'f3', front: 'cwnd after a timeout?', backMd: '1 MSS (ssthresh = cwnd / 2).' },
    { id: 'f4', front: 'Growth in congestion avoidance?', backMd: 'About 1 MSS per RTT.' },
    { id: 'f5', front: 'Default congestion control on Linux?', backMd: 'CUBIC.' },
  ] },
  resources: [{ title: 'HPBN: Building blocks of TCP', url: 'https://hpbn.co/building-blocks-of-tcp/', kind: 'book' }, RFC(5681, 'TCP Congestion Control'), RFC(7323, 'TCP Extensions for High Performance'), HPBN],
});

const fcMcqs: MCQ[] = [
  mcq({ ...q(FC), id: 'cn.fc.q1', type: 'complexity', difficulty: 'medium', stem: 'A TCP connection without window scaling (max window 65,535 bytes) has an RTT of 100 ms. What is its maximum throughput, roughly?', options: ['About 5.24 Mbit/s', ['About 655 Mbit/s', 'Bytes per second must be multiplied by 8 and divided by the RTT, not the reverse.'], ['About 0.65 Mbit/s', 'That forgets the factor of 8 bits per byte.'], ['Limited only by the link speed', 'A single connection sends at most one window per RTT.']], answer: 0, explanation: '65,535 × 8 bits / 0.1 s ≈ 5.24 Mbit/s.' }),
  mcq({ ...q(FC), id: 'cn.fc.q2', type: 'complexity', difficulty: 'medium', stem: 'Textbook TCP: cwnd starts at 1 MSS, ssthresh = 16 MSS, no loss, one window per RTT. What is cwnd in the 6th round?', options: ['17 MSS', ['32 MSS', 'At 16 it switches from doubling to +1 per RTT.'], ['16 MSS', 'That is round 5.'], ['6 MSS', 'Slow start grows exponentially, not linearly.']], answer: 0, explanation: 'Rounds 1–5: 1, 2, 4, 8, 16 (slow start); round 6: 17 (congestion avoidance).' }),
  mcq({ ...q(FC), id: 'cn.fc.q3', type: 'concept', difficulty: 'medium', stem: 'Under TCP Reno, the sender receives three duplicate ACKs while cwnd = 20 MSS. What happens?', options: ['Fast retransmit of the missing segment; ssthresh = 10 and cwnd continues from about 10 (fast recovery)', ['cwnd = 1 MSS and slow start restarts', 'That is the response to a timeout.'], ['Nothing until the retransmission timer fires', 'Three duplicate ACKs trigger fast retransmit.'], ['cwnd doubles to 40', 'Loss means decrease, not increase.']], answer: 0, explanation: 'Duplicate ACKs show data is still flowing, so Reno halves instead of collapsing.' }),
  mcq({ ...q(FC), id: 'cn.fc.q4', type: 'concept', difficulty: 'easy', stem: 'What limits how much unacknowledged data a TCP sender may have in flight?', options: ['min(cwnd, rwnd)', ['rwnd only', 'The congestion window also applies.'], ['cwnd only', 'The receiver\'s window also applies.'], ['The MTU', 'MTU limits segment size, not the number in flight.']], answer: 0, explanation: 'The sender respects both the receiver (flow control) and the network (congestion control).' }),
  mcq({ ...q(FC), id: 'cn.fc.q5', type: 'concept', difficulty: 'easy', stem: 'Which statement is correct?', options: ['Flow control protects the receiver; congestion control protects the network', ['Flow control protects the network; congestion control protects the receiver', 'The reverse.'], ['Both are handled by IP', 'Both are TCP mechanisms.'], ['UDP provides both', 'UDP provides neither.']], answer: 0, explanation: 'rwnd comes from the receiver; cwnd is the sender\'s estimate of network capacity.' }),
  mcq({ ...q(FC), id: 'cn.fc.q6', type: 'complexity', difficulty: 'medium', stem: 'What is the bandwidth-delay product of a 1 Gbit/s path with a 50 ms RTT?', options: ['6.25 MB', ['50 MB', 'That forgets to divide bits by 8.'], ['64 KB', 'That is the unscaled TCP window limit, far below the BDP.'], ['625 KB', 'Off by a factor of 10.']], answer: 0, explanation: '10⁹ bits/s × 0.05 s = 5 × 10⁷ bits = 6.25 × 10⁶ bytes; filling the link needs window scaling.' }),
  mcq({ ...q(FC), id: 'cn.fc.q7', type: 'concept', difficulty: 'hard', stem: 'How does BBR differ from loss-based algorithms like Reno and CUBIC?', options: ['It estimates bottleneck bandwidth and minimum RTT and paces to that model, instead of treating loss as the main congestion signal', ['It never retransmits lost packets', 'Reliability is unchanged.'], ['It disables slow start and sends at line rate', 'It still probes for bandwidth.'], ['It is a UDP protocol', 'BBR is a TCP congestion control algorithm (also used in QUIC).']], answer: 0, explanation: 'Loss-based algorithms fill buffers until drops occur; BBR aims to keep queues short.' }),
];

export const topics: Topic[] = [ethernet, arp, routing, nat, congestion];
export const mcqs: MCQ[] = [...emMcqs, ...adMcqs, ...rtMcqs, ...nfMcqs, ...fcMcqs];
