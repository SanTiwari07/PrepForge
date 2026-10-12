// Transaction schedule analyser: conflicts, precedence graph, conflict and view serialisability,
// and recoverability classes. Used by the Tools page and to check DBMS MCQ answers in tests.

export type OpKind = 'R' | 'W' | 'C' | 'A';
export interface Op { tx: string; kind: OpKind; item?: string; index: number }

/**
 * Parses schedules such as "R1(A) W2(A) R1(B) C1 C2" or "r1(x), w2(x), c1, a2".
 * R = read, W = write, C = commit, A = abort. Transaction ids are digits; items are words.
 */
export function parseSchedule(s: string): Op[] | string {
  const tokens = s.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
  const ops: Op[] = [];
  for (const t of tokens) {
    const m = t.match(/^([RrWw])(\d+)\(\s*([A-Za-z]\w*)\s*\)$/) ?? t.match(/^([CcAa])(\d+)$/);
    if (!m) return `Cannot parse "${t}". Use R1(A), W2(B), C1 (commit) or A1 (abort).`;
    const kind = m[1].toUpperCase() as OpKind;
    ops.push({ tx: m[2], kind, ...(m[3] ? { item: m[3] } : {}), index: ops.length });
  }
  return ops;
}

export const transactions = (ops: Op[]) => [...new Set(ops.map((o) => o.tx))].sort((a, b) => Number(a) - Number(b));

export interface Conflict { first: Op; second: Op }

/** Pairs of operations of different transactions on the same item where at least one is a write. */
export function conflicts(ops: Op[]): Conflict[] {
  const out: Conflict[] = [];
  const data = ops.filter((o) => o.kind === 'R' || o.kind === 'W');
  for (let i = 0; i < data.length; i++)
    for (let j = i + 1; j < data.length; j++) {
      const a = data[i], b = data[j];
      if (a.tx !== b.tx && a.item === b.item && (a.kind === 'W' || b.kind === 'W')) out.push({ first: a, second: b });
    }
  return out;
}

/** Precedence graph edges "Ti -> Tj", one per ordered pair. */
export function precedenceEdges(ops: Op[]): [string, string][] {
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const c of conflicts(ops)) {
    const k = `${c.first.tx}>${c.second.tx}`;
    if (!seen.has(k)) { seen.add(k); edges.push([c.first.tx, c.second.tx]); }
  }
  return edges;
}

/** Topological order of the precedence graph (smallest id first), or null if it has a cycle. */
export function serialOrder(ops: Op[]): string[] | null {
  const txs = transactions(ops);
  const edges = precedenceEdges(ops);
  const indeg = new Map(txs.map((t) => [t, 0]));
  for (const [, b] of edges) indeg.set(b, indeg.get(b)! + 1);
  const order: string[] = [];
  const ready = txs.filter((t) => indeg.get(t) === 0);
  while (ready.length) {
    ready.sort((a, b) => Number(a) - Number(b));
    const t = ready.shift()!;
    order.push(t);
    for (const [a, b] of edges) if (a === t) { indeg.set(b, indeg.get(b)! - 1); if (indeg.get(b) === 0) ready.push(b); }
  }
  return order.length === txs.length ? order : null;
}

export const isConflictSerialisable = (ops: Op[]) => serialOrder(ops) !== null;

/** For each read, the transaction it reads from ('0' = the initial value). Aborted writers are ignored. */
function readsFrom(ops: Op[]): { read: Op; from: string }[] {
  const out: { read: Op; from: string }[] = [];
  const aborted = new Set(ops.filter((o) => o.kind === 'A').map((o) => o.tx));
  for (const r of ops.filter((o) => o.kind === 'R')) {
    let from = '0';
    for (let k = r.index - 1; k >= 0; k--) {
      const w = ops[k];
      if (w.kind === 'W' && w.item === r.item) {
        if (w.tx === r.tx) { from = r.tx; break; }
        if (!aborted.has(w.tx) || ops.findIndex((o) => o.kind === 'A' && o.tx === w.tx) > r.index) { from = w.tx; break; }
      }
    }
    if (from !== r.tx) out.push({ read: r, from });
  }
  return out;
}

const finalWriters = (ops: Op[]) => {
  const m = new Map<string, string>();
  for (const o of ops) if (o.kind === 'W') m.set(o.item!, o.tx);
  return m;
};

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

/**
 * View serialisability by brute force over serial orders (fine for up to 6 transactions; the
 * general problem is NP-complete). Compares reads-from relations and final writers.
 */
export function viewSerialOrder(ops: Op[]): string[] | null {
  const data = ops.filter((o) => o.kind === 'R' || o.kind === 'W');
  const txs = transactions(data);
  if (txs.length > 6) throw new Error('View serialisability check supports at most 6 transactions.');
  const key = (os: Op[]) => {
    const rf = readsFrom(os).map((x) => `${x.read.tx}:${x.read.item}:${x.from}:${os.filter((o) => o.tx === x.read.tx && o.kind === 'R' && o.item === x.read.item && o.index < x.read.index).length}`).sort();
    return JSON.stringify([rf, [...finalWriters(os).entries()].sort()]);
  };
  const target = key(data.map((o, i) => ({ ...o, index: i })));
  for (const order of permutations(txs)) {
    const serial = order.flatMap((t) => data.filter((o) => o.tx === t)).map((o, i) => ({ ...o, index: i }));
    if (key(serial) === target) return order;
  }
  return null;
}

export interface Recoverability { recoverable: boolean; cascadeless: boolean; strict: boolean; notes: string[] }

/**
 * Recoverable: whenever Tj reads from Ti, Ti commits before Tj commits.
 * Cascadeless (avoids cascading aborts): every read is from a committed transaction.
 * Strict: no item written by an uncommitted Ti is read or overwritten by another transaction.
 */
export function recoverability(ops: Op[]): Recoverability {
  const end = (t: string) => {
    const i = ops.findIndex((o) => (o.kind === 'C' || o.kind === 'A') && o.tx === t);
    return i === -1 ? Infinity : i;
  };
  const commitAt = (t: string) => {
    const i = ops.findIndex((o) => o.kind === 'C' && o.tx === t);
    return i === -1 ? Infinity : i;
  };
  const notes: string[] = [];
  let recoverable = true, cascadeless = true, strict = true;
  for (const { read, from } of readsFrom(ops)) {
    if (from === '0') continue;
    if (commitAt(read.tx) !== Infinity && commitAt(from) > commitAt(read.tx)) {
      recoverable = false;
      notes.push(`T${read.tx} reads ${read.item} from T${from} but commits before T${from} does.`);
    }
    if (commitAt(from) > read.index) {
      cascadeless = false;
      notes.push(`T${read.tx} reads ${read.item} written by T${from} before T${from} commits (a dirty read).`);
    }
  }
  for (const w of ops.filter((o) => o.kind === 'W')) {
    for (let k = w.index + 1; k < Math.min(end(w.tx), ops.length); k++) {
      const o = ops[k];
      if (o.tx !== w.tx && o.item === w.item && (o.kind === 'R' || o.kind === 'W')) {
        strict = false;
        notes.push(`T${o.tx} ${o.kind === 'R' ? 'reads' : 'overwrites'} ${o.item} while T${w.tx}'s write is uncommitted.`);
        break;
      }
    }
  }
  return { recoverable, cascadeless, strict, notes: [...new Set(notes)] };
}

export const formatOp = (o: Op) => (o.item ? `${o.kind}${o.tx}(${o.item})` : `${o.kind}${o.tx}`);
