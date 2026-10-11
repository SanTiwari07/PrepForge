// IPv4 subnet calculator.
export interface SubnetInfo {
  address: string; prefix: number; mask: string; wildcard: string; network: string; broadcast: string;
  firstHost: string; lastHost: string; totalAddresses: number; usableHosts: number; ipClass: string; isPrivate: boolean;
}

export function ipToInt(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

export function intToIp(n: number): string {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
}

export function parseCidr(input: string): { ip: number; prefix: number } | string {
  const m = input.trim().match(/^([\d.]+)\s*\/\s*(\d{1,2})$/);
  if (!m) return 'Use CIDR notation, for example 192.168.10.77/26';
  const ip = ipToInt(m[1]);
  if (ip === null) return 'Invalid IPv4 address';
  const prefix = Number(m[2]);
  if (prefix < 0 || prefix > 32) return 'Prefix must be between 0 and 32';
  return { ip, prefix };
}

export function subnetInfo(input: string): SubnetInfo | string {
  const parsed = parseCidr(input);
  if (typeof parsed === 'string') return parsed;
  const { ip, prefix } = parsed;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);
  let usable: number, first: number, last: number;
  if (prefix === 32) { usable = 1; first = last = network; }
  else if (prefix === 31) { usable = 2; first = network; last = broadcast; }       // RFC 3021 point-to-point
  else { usable = total - 2; first = network + 1; last = broadcast - 1; }
  const o1 = ip >>> 24;
  const ipClass = o1 < 128 ? 'A' : o1 < 192 ? 'B' : o1 < 224 ? 'C' : o1 < 240 ? 'D (multicast)' : 'E (reserved)';
  const isPrivate = (o1 === 10) || (o1 === 172 && ((ip >>> 16) & 255) >= 16 && ((ip >>> 16) & 255) <= 31) || (o1 === 192 && ((ip >>> 16) & 255) === 168);
  return {
    address: intToIp(ip), prefix, mask: intToIp(mask), wildcard: intToIp(~mask >>> 0), network: intToIp(network), broadcast: intToIp(broadcast),
    firstHost: intToIp(first), lastHost: intToIp(last), totalAddresses: total, usableHosts: usable, ipClass, isPrivate,
  };
}

/** Smallest prefix length that provides at least `hosts` usable addresses (classic subnetting question). */
export function prefixForHosts(hosts: number): number {
  for (let p = 30; p >= 0; p--) if (2 ** (32 - p) - 2 >= hosts) return p;
  return 0;
}
