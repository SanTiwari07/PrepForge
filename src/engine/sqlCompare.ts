// Result-set comparison for auto-graded SQL exercises. See what_to_do.md Section 8.2.3.
export type Cell = string | number | null;
export interface ResultSet { columns: string[]; rows: Cell[][] }

export interface CompareOptions {
  orderMatters: boolean;
  tolerance?: number;
}

export interface CompareResult {
  equal: boolean;
  reason?: string;
  missing: Cell[][];   // rows expected but not produced
  extra: Cell[][];     // rows produced but not expected
}

function normCell(v: Cell, tol: number): string {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return String(v);
    // Round to the tolerance so 0.1 + 0.2 equals 0.3.
    const digits = Math.max(0, Math.round(-Math.log10(tol)));
    const r = Number(v.toFixed(digits));
    return `n:${Object.is(r, -0) ? 0 : r}`;
  }
  const s = String(v);
  // Numeric strings compare as numbers (SQLite and MySQL type results differently).
  if (/^-?\d+(\.\d+)?$/.test(s.trim())) return normCell(Number(s), tol);
  return `s:${s}`;
}

function rowKey(r: Cell[], tol: number): string {
  return r.map((c) => normCell(c, tol)).join('\u0001');
}

export function compareResults(expected: ResultSet, actual: ResultSet, opts: CompareOptions): CompareResult {
  const tol = opts.tolerance ?? 1e-6;
  if (expected.columns.length !== actual.columns.length) {
    return { equal: false, reason: `Expected ${expected.columns.length} column(s) but your query returned ${actual.columns.length}.`, missing: [], extra: [] };
  }
  const ek = expected.rows.map((r) => rowKey(r, tol));
  const ak = actual.rows.map((r) => rowKey(r, tol));
  if (opts.orderMatters) {
    const n = Math.max(ek.length, ak.length);
    for (let i = 0; i < n; i++) {
      if (ek[i] !== ak[i]) {
        const sameMultiset = [...ek].sort().join('|') === [...ak].sort().join('|');
        return {
          equal: false,
          reason: sameMultiset ? 'The right rows, but in the wrong order. This question requires a specific ORDER BY.' : `Row ${i + 1} differs from the expected output.`,
          missing: sameMultiset ? [] : diff(expected.rows, ek, ak),
          extra: sameMultiset ? [] : diff(actual.rows, ak, ek),
        };
      }
    }
    return { equal: true, missing: [], extra: [] };
  }
  const missing = diff(expected.rows, ek, ak);
  const extra = diff(actual.rows, ak, ek);
  if (missing.length || extra.length) {
    const reason = expected.rows.length !== actual.rows.length
      ? `Expected ${expected.rows.length} row(s) but got ${actual.rows.length}.`
      : 'Same number of rows, but some values differ.';
    return { equal: false, reason, missing, extra };
  }
  return { equal: true, missing: [], extra: [] };
}

/** Rows in `rows` (with keys `keys`) that are not matched in `other` (multiset difference). */
function diff(rows: Cell[][], keys: string[], other: string[]): Cell[][] {
  const counts = new Map<string, number>();
  for (const k of other) counts.set(k, (counts.get(k) ?? 0) + 1);
  const out: Cell[][] = [];
  keys.forEach((k, i) => {
    const c = counts.get(k) ?? 0;
    if (c > 0) counts.set(k, c - 1);
    else out.push(rows[i]);
  });
  return out;
}
