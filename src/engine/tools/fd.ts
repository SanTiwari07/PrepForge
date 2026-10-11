// Functional-dependency toolkit: closure, candidate keys, superkeys, normal forms, decomposition checks.
export interface FD { lhs: string[]; rhs: string[] }

/** Parses attributes like "A B C" / "A,B,C" / "ABC" (single letters) and FDs like "A->B; BC->D, AB → CD". */
export function parseAttributes(s: string): string[] {
  const t = s.trim();
  if (!t) return [];
  if (/[\s,]/.test(t)) return [...new Set(t.split(/[\s,]+/).filter(Boolean))];
  return [...new Set(t.split(''))];
}

function parseSide(s: string, attrs: string[]): string[] {
  const t = s.trim();
  if (/[\s,]/.test(t)) return t.split(/[\s,]+/).filter(Boolean);
  // Greedy match of multi-character attribute names, falling back to single characters.
  const sorted = [...attrs].sort((a, b) => b.length - a.length);
  const out: string[] = [];
  let i = 0;
  while (i < t.length) {
    const hit = sorted.find((a) => t.startsWith(a, i));
    if (hit) { out.push(hit); i += hit.length; } else { out.push(t[i]); i += 1; }
  }
  return out;
}

export function parseFDs(s: string, attrs: string[]): FD[] | string {
  const out: FD[] = [];
  for (const raw of s.split(/[;\n]+/).map((x) => x.trim()).filter(Boolean)) {
    const m = raw.split(/->|→|=>/);
    if (m.length !== 2) return `Cannot parse "${raw}". Use the form AB -> C.`;
    const lhs = parseSide(m[0], attrs);
    const rhs = parseSide(m[1], attrs);
    const unknown = [...lhs, ...rhs].filter((a) => !attrs.includes(a));
    if (unknown.length) return `Unknown attribute(s) in "${raw}": ${unknown.join(', ')}`;
    if (!lhs.length || !rhs.length) return `Empty side in "${raw}".`;
    out.push({ lhs, rhs });
  }
  return out;
}

export function closure(x: string[], fds: FD[]): { result: string[]; steps: { fd: FD; added: string[] }[] } {
  const res = new Set(x);
  const steps: { fd: FD; added: string[] }[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const fd of fds) {
      if (fd.lhs.every((a) => res.has(a))) {
        const added = fd.rhs.filter((a) => !res.has(a));
        if (added.length) { added.forEach((a) => res.add(a)); steps.push({ fd, added }); changed = true; }
      }
    }
  }
  return { result: [...res], steps };
}

const covers = (x: string[], attrs: string[], fds: FD[]) => closure(x, fds).result.length === attrs.length;

function subsets<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  const n = arr.length;
  for (let mask = 0; mask < 1 << n; mask++) out.push(arr.filter((_, i) => mask & (1 << i)));
  return out.sort((a, b) => a.length - b.length);
}

export const MAX_ATTRS = 14;

export function candidateKeys(attrs: string[], fds: FD[]): string[][] {
  // Attributes never on any RHS must be in every key; attributes only on RHS are never in a key.
  const rhs = new Set(fds.flatMap((f) => f.rhs));
  const lhs = new Set(fds.flatMap((f) => f.lhs));
  const core = attrs.filter((a) => !rhs.has(a));
  const optional = attrs.filter((a) => rhs.has(a) && lhs.has(a));
  const keys: string[][] = [];
  for (const extra of subsets(optional)) {
    const cand = [...core, ...extra];
    if (keys.some((k) => k.every((a) => cand.includes(a)))) continue;
    if (covers(cand, attrs, fds)) keys.push(cand);
  }
  return keys.map((k) => attrs.filter((a) => k.includes(a)));
}

export function countSuperkeys(attrs: string[], keys: string[][]): number {
  // Inclusion-exclusion over candidate keys: |∪ supersets(K_i)|.
  let total = 0;
  const n = keys.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const union = new Set<string>();
    let bits = 0;
    keys.forEach((k, i) => { if (mask & (1 << i)) { bits += 1; k.forEach((a) => union.add(a)); } });
    total += (bits % 2 ? 1 : -1) * 2 ** (attrs.length - union.size);
  }
  return total;
}

export interface NfReport { highest: '1NF' | '2NF' | '3NF' | 'BCNF'; violations: { nf: '2NF' | '3NF' | 'BCNF'; fd: FD; reason: string }[] }

export function normalForm(attrs: string[], fds: FD[]): NfReport {
  const keys = candidateKeys(attrs, fds);
  const prime = new Set(keys.flat());
  const isSuper = (x: string[]) => covers(x, attrs, fds);
  const violations: NfReport['violations'] = [];
  // Work on singleton-RHS, non-trivial FDs.
  const single = fds.flatMap((f) => f.rhs.filter((r) => !f.lhs.includes(r)).map((r) => ({ lhs: f.lhs, rhs: [r] })));
  for (const fd of single) {
    const a = fd.rhs[0];
    const superLhs = isSuper(fd.lhs);
    if (!superLhs) violations.push({ nf: 'BCNF', fd, reason: `${fd.lhs.join('')} is not a superkey` });
    if (!superLhs && !prime.has(a)) violations.push({ nf: '3NF', fd, reason: `${fd.lhs.join('')} is not a superkey and ${a} is non-prime` });
    const partial = !prime.has(a) && keys.some((k) => fd.lhs.every((x) => k.includes(x)) && fd.lhs.length < k.length);
    if (partial) violations.push({ nf: '2NF', fd, reason: `${a} (non-prime) depends on ${fd.lhs.join('')}, a proper subset of a candidate key` });
  }
  const has = (nf: string) => violations.some((v) => v.nf === nf);
  const highest = has('2NF') ? '1NF' : has('3NF') ? '2NF' : has('BCNF') ? '3NF' : 'BCNF';
  return { highest, violations };
}

/** Binary lossless-join test: R1 ∩ R2 → R1 or R1 ∩ R2 → R2. */
export function isLosslessBinary(r1: string[], r2: string[], attrs: string[], fds: FD[]): boolean {
  if (new Set([...r1, ...r2]).size !== attrs.length) return false;
  const common = r1.filter((a) => r2.includes(a));
  const c = closure(common, fds).result;
  return r1.every((a) => c.includes(a)) || r2.every((a) => c.includes(a));
}

/** Dependency preservation via the standard closure-over-projections algorithm. */
export function preservedFDs(parts: string[][], fds: FD[]): { fd: FD; preserved: boolean }[] {
  return fds.map((fd) => {
    let z = new Set(fd.lhs);
    let changed = true;
    while (changed) {
      changed = false;
      for (const ri of parts) {
        const t = closure([...z].filter((a) => ri.includes(a)), fds).result.filter((a) => ri.includes(a));
        for (const a of t) if (!z.has(a)) { z.add(a); changed = true; }
      }
    }
    z = new Set(z);
    return { fd, preserved: fd.rhs.every((a) => z.has(a)) };
  });
}
