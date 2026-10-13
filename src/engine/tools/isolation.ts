// Isolation-anomaly simulator.
//
// Replays one interleaved schedule of transactions against a tiny key/value table under each isolation level and reports
// which anomalies actually happened. The semantics are deliberately simple and PostgreSQL-flavoured, and they are stated
// here because they are what the tests pin down:
//
//   READ UNCOMMITTED  reads see the newest value, even one that another transaction has not committed.
//   READ COMMITTED    every read sees the newest committed value (plus the transaction's own writes).
//   REPEATABLE READ   every read sees the snapshot taken when the transaction started (snapshot isolation); a write to a
//                     row that was committed by someone else after the snapshot aborts the writer (first committer wins).
//   SERIALIZABLE      snapshot isolation plus validation at commit (read-only transactions just keep their snapshot): if anything the transaction read (a key or a
//                     query result) has been changed by a transaction that committed since, it aborts. This is stricter
//                     than real SSI (it can abort schedules that were fine) but it never lets a non-serialisable one through.
//
// Writes take an exclusive row lock until commit/abort (no dirty writes at any level): a writer that hits a locked row
// waits, and its later operations wait behind it. Operations are written T1:R(x), T2:W(x,5), T1:Q(>=10), T2:I(k,7), T1:C, T2:A.

export type Level = 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
export const LEVELS: Level[] = ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'];

export type IsoOp =
  | { tx: number; kind: 'R'; key: string }
  | { tx: number; kind: 'W'; key: string; value: number }
  | { tx: number; kind: 'Q'; min: number }
  | { tx: number; kind: 'C' }
  | { tx: number; kind: 'A' };

export type Anomaly = 'dirty read' | 'non-repeatable read' | 'phantom read' | 'lost update' | 'write skew';

export interface LogEntry {
  text: string;
  note?: string;
}

export interface LevelOutcome {
  level: Level;
  anomalies: Anomaly[];
  aborted: number[];
  log: LogEntry[];
  finalState: Record<string, number>;
}

export type Table = Record<string, number>;

export function parseIsoSchedule(text: string): IsoOp[] | string {
  const ops: IsoOp[] = [];
  const parts = text.split(/[\n;]+|,\s*(?=T\d)/).map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const m = /^T(\d+)\s*[:.]?\s*(.+)$/i.exec(p);
    if (!m) return `Cannot read "${p}". Write operations like T1:R(x), T2:W(x,5), T1:Q(>=10), T2:I(k,7), T1:C, T2:A.`;
    const tx = Number(m[1]);
    const body = m[2].trim();
    let r: RegExpExecArray | null;
    if ((r = /^R\(\s*([A-Za-z_]\w*)\s*\)$/i.exec(body))) ops.push({ tx, kind: 'R', key: r[1] });
    else if ((r = /^[WI]\(\s*([A-Za-z_]\w*)\s*,\s*(-?\d+)\s*\)$/i.exec(body))) ops.push({ tx, kind: 'W', key: r[1], value: Number(r[2]) });
    else if ((r = /^Q\(\s*>=?\s*(-?\d+)\s*\)$/i.exec(body))) ops.push({ tx, kind: 'Q', min: Number(r[1]) });
    else if (/^C(OMMIT)?$/i.test(body)) ops.push({ tx, kind: 'C' });
    else if (/^(A|ROLLBACK|ABORT)$/i.test(body)) ops.push({ tx, kind: 'A' });
    else return `Cannot read "${p}". Write operations like T1:R(x), T2:W(x,5), T1:Q(>=10), T2:I(k,7), T1:C, T2:A.`;
  }
  if (!ops.length) return 'Enter a schedule.';
  if (new Set(ops.map((o) => o.tx)).size > 4) return 'Use at most 4 transactions.';
  return ops;
}

export function formatIsoOp(o: IsoOp): string {
  switch (o.kind) {
    case 'R': return `T${o.tx}:R(${o.key})`;
    case 'W': return `T${o.tx}:W(${o.key},${o.value})`;
    case 'Q': return `T${o.tx}:Q(>=${o.min})`;
    case 'C': return `T${o.tx}:C`;
    default: return `T${o.tx}:A`;
  }
}

interface Version { seq: number; value: number | null; by: number }

interface Tx {
  id: number;
  startSeq: number;
  status: 'active' | 'committed' | 'aborted';
  writes: Map<string, number>;
  readKeys: Map<string, { value: number | undefined; seq: number }>;
  queries: { min: number; count: number; committedMatches: string }[];
  firstSeen: Map<string, number | undefined>;
  queryCounts: Map<number, number>;
  commitSeq: number;
  blockedOn: number | null;
  queue: IsoOp[];
}

export function simulate(initial: Table, ops: IsoOp[], level: Level): LevelOutcome {
  const versions = new Map<string, Version[]>();
  for (const [k, v] of Object.entries(initial)) versions.set(k, [{ seq: 0, value: v, by: 0 }]);
  let seq = 0;
  const txs = new Map<number, Tx>();
  const locks = new Map<string, number>();
  const log: LogEntry[] = [];
  const anomalies = new Set<Anomaly>();
  const get = (id: number): Tx => {
    let t = txs.get(id);
    if (!t) {
      t = { id, startSeq: seq, status: 'active', writes: new Map(), readKeys: new Map(), queries: [], firstSeen: new Map(), queryCounts: new Map(), commitSeq: -1, blockedOn: null, queue: [] };
      txs.set(id, t);
    }
    return t;
  };
  const committedAt = (key: string, upto: number): number | undefined => {
    const vs = versions.get(key) ?? [];
    for (let i = vs.length - 1; i >= 0; i--) if (vs[i].seq <= upto) return vs[i].value ?? undefined;
    return undefined;
  };
  const allKeys = () => new Set<string>([...versions.keys(), ...[...txs.values()].flatMap((t) => [...t.writes.keys()])]);
  // the value `t` would see for `key` under `level`; `dirty` names the writer when the value is uncommitted
  const visible = (t: Tx, key: string): { value: number | undefined; dirty?: number } => {
    if (t.writes.has(key)) return { value: t.writes.get(key) };
    if (level === 'READ UNCOMMITTED') {
      const w = [...txs.values()].find((o) => o.id !== t.id && o.status === 'active' && o.writes.has(key));
      if (w) return { value: w.writes.get(key), dirty: w.id };
    }
    return { value: committedAt(key, level === 'READ UNCOMMITTED' || level === 'READ COMMITTED' ? seq : t.startSeq) };
  };
  const snapshotLike = level === 'REPEATABLE READ' || level === 'SERIALIZABLE';
  const emit = (text: string, note?: string) => log.push({ text, note });

  const release = (t: Tx) => {
    for (const [k, owner] of [...locks]) if (owner === t.id) locks.delete(k);
    for (const o of txs.values()) {
      if (o.blockedOn === t.id) {
        o.blockedOn = null;
        const pending = o.queue.splice(0);
        emit(`T${o.id} resumes`, `T${t.id} released its locks`);
        for (const p of pending) run(p);
      }
    }
  };
  const abort = (t: Tx, why: string) => {
    t.status = 'aborted';
    emit(`T${t.id}:A`, why);
    release(t);
  };

  function run(op: IsoOp) {
    const t = get(op.tx);
    if (t.status !== 'active') { emit(formatIsoOp(op), `ignored: T${t.id} already ${t.status}`); return; }
    if (t.blockedOn !== null) { t.queue.push(op); emit(formatIsoOp(op), `queued behind the lock wait of T${t.id}`); return; }
    switch (op.kind) {
      case 'R': {
        const r = visible(t, op.key);
        const own = t.writes.has(op.key);
        if (!own) {
          if (t.firstSeen.has(op.key) && t.firstSeen.get(op.key) !== r.value) anomalies.add('non-repeatable read');
          if (!t.firstSeen.has(op.key)) t.firstSeen.set(op.key, r.value);
          if (!t.readKeys.has(op.key)) t.readKeys.set(op.key, { value: r.value, seq });
        }
        if (r.dirty !== undefined) anomalies.add('dirty read');
        emit(formatIsoOp(op), `${op.key} = ${r.value ?? 'absent'}${r.dirty !== undefined ? ` (uncommitted value written by T${r.dirty})` : ''}`);
        break;
      }
      case 'Q': {
        let count = 0;
        const matching: string[] = [];
        for (const k of allKeys()) {
          const v = visible(t, k);
          if (v.dirty !== undefined) anomalies.add('dirty read');
          if (v.value !== undefined && v.value >= op.min) { count++; matching.push(k); }
        }
        if (t.queryCounts.has(op.min) && t.queryCounts.get(op.min) !== count) anomalies.add('phantom read');
        t.queryCounts.set(op.min, count);
        t.queries.push({ min: op.min, count, committedMatches: [...allKeys()].filter((k) => (committedAt(k, t.startSeq) ?? -Infinity) >= op.min).sort().join(',') });
        emit(formatIsoOp(op), `${count} row${count === 1 ? '' : 's'} (${matching.sort().join(', ') || 'none'})`);
        break;
      }
      case 'W': {
        const holder = locks.get(op.key);
        if (holder !== undefined && holder !== t.id) {
          t.blockedOn = holder;
          t.queue.push(op);
          emit(formatIsoOp(op), `blocked: row ${op.key} is locked by T${holder}`);
          return;
        }
        if (snapshotLike) {
          const latest = (versions.get(op.key) ?? []).at(-1);
          if (latest && latest.seq > t.startSeq && latest.by !== t.id) { abort(t, `serialization failure: ${op.key} was changed by T${latest.by}, committed after T${t.id}'s snapshot`); return; }
        }
        locks.set(op.key, t.id);
        t.writes.set(op.key, op.value);
        emit(formatIsoOp(op), `${op.key} := ${op.value} (uncommitted, row locked)`);
        break;
      }
      case 'A':
        abort(t, 'rolled back: its writes disappear');
        break;
      case 'C': {
        if (level === 'SERIALIZABLE' && t.writes.size > 0) {
          for (const [k, r] of t.readKeys) {
            if (t.writes.has(k)) continue;
            if (committedAt(k, seq) !== r.value) { abort(t, `serialization failure: ${k} read by T${t.id} was changed by a committed transaction`); return; }
          }
          for (const q of t.queries) {
            const now = [...allKeys()].filter((k) => (committedAt(k, seq) ?? -Infinity) >= q.min).sort().join(',');
            if (now !== q.committedMatches) { abort(t, `serialization failure: the result of Q(>=${q.min}) changed`); return; }
          }
        }
        // lost update: a key this transaction read and then wrote was changed by someone else in between
        for (const k of t.writes.keys()) {
          const r = t.readKeys.get(k);
          if (!r) continue;
          const newer = (versions.get(k) ?? []).find((v) => v.seq > r.seq && v.by !== t.id);
          if (newer) anomalies.add('lost update');
        }
        seq++;
        t.commitSeq = seq;
        for (const [k, v] of t.writes) {
          const vs = versions.get(k) ?? [];
          vs.push({ seq, value: v, by: t.id });
          versions.set(k, vs);
        }
        t.status = 'committed';
        emit(formatIsoOp(op), t.writes.size ? `committed: ${[...t.writes].map(([k, v]) => `${k}=${v}`).join(', ')} now visible` : 'committed (read-only)');
        release(t);
        break;
      }
    }
  }

  for (const op of ops) run(op);

  // transactions still waiting or open at the end are rolled back so the final state is well defined
  for (const t of txs.values()) if (t.status === 'active') { t.status = 'aborted'; emit(`T${t.id}`, t.blockedOn !== null ? 'never finished (still waiting for a lock): rolled back' : 'never committed: rolled back'); }

  // write skew: two committed transactions with disjoint write sets, each having read a key the other wrote
  const done = [...txs.values()].filter((t) => t.status === 'committed');
  const readOrQueried = (t: Tx) => new Set<string>([...t.readKeys.keys(), ...(t.queries.length ? allKeys() : [])]);
  for (let i = 0; i < done.length; i++) {
    for (let j = i + 1; j < done.length; j++) {
      const a = done[i];
      const b = done[j];
      if (!a.writes.size || !b.writes.size) continue;
      if ([...a.writes.keys()].some((k) => b.writes.has(k))) continue;
      const concurrent = a.startSeq < b.commitSeq && b.startSeq < a.commitSeq;
      const ra = readOrQueried(a);
      const rb = readOrQueried(b);
      if (concurrent && [...b.writes.keys()].some((k) => ra.has(k)) && [...a.writes.keys()].some((k) => rb.has(k))) anomalies.add('write skew');
    }
  }

  const finalState: Table = {};
  for (const [k, vs] of versions) { const v = vs.at(-1)!.value; if (v !== null && v !== undefined) finalState[k] = v; }
  const order: Anomaly[] = ['dirty read', 'non-repeatable read', 'phantom read', 'lost update', 'write skew'];
  return { level, anomalies: order.filter((a) => anomalies.has(a)), aborted: [...txs.values()].filter((t) => t.status === 'aborted').map((t) => t.id), log, finalState };
}

export interface Scenario {
  id: string;
  title: string;
  initial: Table;
  schedule: string;
  blurb: string;
}

export const SCENARIOS: Scenario[] = [
  { id: 'dirty', title: 'Dirty read', initial: { x: 100 }, schedule: 'T1:W(x,50)\nT2:R(x)\nT1:A\nT2:C', blurb: 'T2 reads a value T1 wrote and then rolled back.' },
  { id: 'non-repeatable', title: 'Non-repeatable read', initial: { x: 100 }, schedule: 'T1:R(x)\nT2:W(x,200)\nT2:C\nT1:R(x)\nT1:C', blurb: 'T1 reads x twice and sees two different committed values.' },
  { id: 'phantom', title: 'Phantom read', initial: { a: 10, b: 20 }, schedule: 'T1:Q(>=10)\nT2:I(c,30)\nT2:C\nT1:Q(>=10)\nT1:C', blurb: 'T1 repeats a range query and a new row appears.' },
  { id: 'lost-update', title: 'Lost update', initial: { x: 100 }, schedule: 'T1:R(x)\nT2:R(x)\nT1:W(x,110)\nT1:C\nT2:W(x,120)\nT2:C', blurb: 'Both add to a balance they read earlier; one addition overwrites the other.' },
  { id: 'write-skew', title: 'Write skew (on-call doctors)', initial: { alice: 1, bob: 1 }, schedule: 'T1:Q(>=1)\nT2:Q(>=1)\nT1:W(alice,0)\nT2:W(bob,0)\nT1:C\nT2:C', blurb: 'Each doctor goes off call after checking that someone else is still on call; nobody ends up on call.' },
];
