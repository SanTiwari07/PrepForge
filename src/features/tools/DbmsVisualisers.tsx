import { useMemo, useState } from 'react';
import { Callout, Badge } from '@/components/ui';
import { BPlusTree } from '@/engine/tools/btree';
import { LEVELS, SCENARIOS, parseIsoSchedule, simulate, type Level } from '@/engine/tools/isolation';

export function IsolationTool() {
  const [sid, setSid] = useState(SCENARIOS[0].id);
  const sc = SCENARIOS.find((x) => x.id === sid) ?? SCENARIOS[0];
  const [text, setText] = useState(sc.schedule);
  const [initialText, setInitialText] = useState(JSON.stringify(sc.initial));
  const [level, setLevel] = useState<Level>(LEVELS[1]);
  const pick = (id: string) => {
    const n = SCENARIOS.find((x) => x.id === id) ?? SCENARIOS[0];
    setSid(id);
    setText(n.schedule);
    setInitialText(JSON.stringify(n.initial));
  };
  const parsed = useMemo(() => parseIsoSchedule(text), [text]);
  const initial = useMemo(() => {
    try {
      const v = JSON.parse(initialText);
      if (v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'number' && Number.isFinite(x))) return v as Record<string, number>;
    } catch { /* invalid JSON is reported below */ }
    return null;
  }, [initialText]);
  const outcomes = useMemo(() => (typeof parsed === 'string' || !initial ? null : LEVELS.map((l) => simulate(initial, parsed, l))), [parsed, initial]);
  const cur = outcomes?.find((o) => o.level === level);
  return (
    <div className="stack">
      <section className="card stack">
        <div className="row" style={{ gap: 6 }}>
          {SCENARIOS.map((x) => <button key={x.id} className="btn btn--ghost btn--sm" aria-pressed={sid === x.id} onClick={() => pick(x.id)}>{x.title}</button>)}
        </div>
        <p className="small muted">{sc.blurb}</p>
        <div className="grid grid-2">
          <label className="field"><span className="label">Schedule: T1:R(x) read, T2:W(x,5) write, T1:Q(&gt;=10) count rows with value ≥ 10, T2:I(k,7) insert, :C commit, :A abort</span>
            <textarea className="textarea textarea--code" rows={7} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label className="field"><span className="label">Initial table (JSON of key → number)</span>
            <textarea className="textarea textarea--code" rows={3} value={initialText} onChange={(e) => setInitialText(e.target.value)} />
          </label>
        </div>
        {typeof parsed === 'string' && <Callout tone="danger">{parsed}</Callout>}
        {!initial && <Callout tone="danger">The initial table must be a JSON object of numbers, for example {'{"x": 100}'}.</Callout>}
      </section>
      {outcomes && (
        <>
          <section className="card stack">
            <h2 className="card__title">What happens at each level</h2>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Isolation level</th><th>Anomalies that occurred</th><th>Aborted</th><th>Final table</th></tr></thead>
                <tbody>{outcomes.map((o) => (
                  <tr key={o.level}>
                    <td><button className="btn btn--ghost btn--sm" aria-pressed={level === o.level} onClick={() => setLevel(o.level)}>{o.level}</button></td>
                    <td>{o.anomalies.length ? o.anomalies.map((a) => <Badge key={a} tone="dark">{a}</Badge>) : <span className="muted">none</span>}</td>
                    <td>{o.aborted.length ? o.aborted.map((t) => `T${t}`).join(', ') : '–'}</td>
                    <td className="mono xsmall">{Object.entries(o.finalState).map(([k, v]) => `${k}=${v}`).join(', ') || '(empty)'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <p className="xsmall muted">Semantics: READ UNCOMMITTED sees uncommitted values; READ COMMITTED sees the newest committed value; REPEATABLE READ is snapshot isolation (PostgreSQL style, so no phantoms) and aborts a writer whose row changed after its snapshot; SERIALIZABLE adds a commit-time check that nothing it read has changed (stricter than real SSI, so it can abort a harmless schedule but never admits an anomalous one). Writers hold row locks until they finish. MySQL InnoDB differs in details: REPEATABLE READ uses gap locks, and UPDATE reads the latest row version.</p>
          </section>
          {cur && (
            <section className="card stack">
              <h2 className="card__title">Step by step at {cur.level}</h2>
              <ol className="prose small">{cur.log.map((l, i) => <li key={i}><code>{l.text}</code>{l.note ? <> → {l.note}</> : null}</li>)}</ol>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function BPlusTool() {
  const [maxKeys, setMaxKeys] = useState(3);
  const [tree, setTree] = useState(() => new BPlusTree(3));
  const [version, bump] = useState(0);
  const [input, setInput] = useState('');
  const [rangeLo, setRangeLo] = useState('');
  const [rangeHi, setRangeHi] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const keys = input.split(/[\s,]+/).filter(Boolean).map(Number);
  const valid = keys.length > 0 && keys.every((n) => Number.isInteger(n));
  const apply = (kind: 'insert' | 'delete') => {
    const out: string[] = [];
    for (const k of keys) {
      out.push(`${kind === 'insert' ? 'Insert' : 'Delete'} ${k}`);
      out.push(...(kind === 'insert' ? tree.insert(k) : tree.delete(k)).steps.map((x) => `  ${x}`));
    }
    setSteps(out);
    bump((n) => n + 1);
    setInput('');
  };
  const reset = (m: number) => {
    setMaxKeys(m);
    setTree(new BPlusTree(m));
    setSteps([]);
  };
  const { levels, height } = useMemo(() => tree.levels(), [tree, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const lo = Number(rangeLo);
  const hi = Number(rangeHi);
  const range = rangeLo !== '' && rangeHi !== '' && Number.isInteger(lo) && Number.isInteger(hi) ? tree.range(lo, hi) : null;
  const total = tree.leafKeys().length;
  return (
    <div className="stack">
      <section className="card stack">
        <div className="row">
          <label className="field" style={{ width: 170 }}><span className="label">Max keys per node</span>
            <select className="select" value={maxKeys} onChange={(e) => reset(Number(e.target.value))}>{[3, 4, 5, 6, 7, 8].map((m) => <option key={m} value={m}>{m} (order {m + 1})</option>)}</select>
          </label>
          <label className="field" style={{ minWidth: 220, flex: 1 }}><span className="label">Keys (integers separated by spaces or commas)</span>
            <input className="input mono" value={input} onChange={(e) => setInput(e.target.value)} placeholder="10 20 5 6 12 30 7 17" />
          </label>
        </div>
        <div className="row">
          <button className="btn btn--primary btn--sm" disabled={!valid} onClick={() => apply('insert')}>Insert</button>
          <button className="btn btn--secondary btn--sm" disabled={!valid} onClick={() => apply('delete')}>Delete</button>
          <button className="btn btn--ghost btn--sm" onClick={() => reset(maxKeys)}>Clear tree</button>
        </div>
        <div className="row">
          <label className="field" style={{ width: 120 }}><span className="label">Range from</span><input className="input" type="number" value={rangeLo} onChange={(e) => setRangeLo(e.target.value)} /></label>
          <label className="field" style={{ width: 120 }}><span className="label">to</span><input className="input" type="number" value={rangeHi} onChange={(e) => setRangeHi(e.target.value)} /></label>
          {range && <p className="small">Range scan: <strong className="mono">{range.keys.join(' ') || 'no keys'}</strong> (descend once, then walk {range.leavesVisited} leaf chain node{range.leavesVisited === 1 ? '' : 's'})</p>}
        </div>
      </section>
      <section className="card stack">
        <h2 className="card__title">Tree · {total} key{total === 1 ? '' : 's'} · height {height}</h2>
        <div className="stack-sm" role="img" aria-label={levels.map((l, i) => `Level ${i}: ${l.map((n) => `[${n.join(' ')}]`).join(' ')}`).join('. ')}>
          {levels.map((lvl, i) => (
            <div key={i} className="row" style={{ justifyContent: 'center', gap: 8 }}>
              {lvl.map((ks, j) => (
                <span key={j} className="mono small" style={{ border: '1px solid var(--hairline)', borderRadius: 6, padding: '4px 8px', background: i === levels.length - 1 ? 'var(--surface)' : 'var(--info-bg)', minWidth: 28, textAlign: 'center' }}>
                  {ks.length ? ks.join(' | ') : '·'}
                </span>
              ))}
              <span className="xsmall muted">{i === 0 ? 'root' : i === levels.length - 1 ? 'leaves (linked left to right)' : ''}</span>
            </div>
          ))}
        </div>
        <p className="xsmall muted">A leaf split copies the first key of the new right leaf up; an internal split moves the middle key up. Minimums: leaf {tree.minLeaf} keys, internal node {tree.minInternal} keys (the root is exempt). Deleting borrows from a sibling with a spare key, otherwise merges.</p>
      </section>
      {steps.length > 0 && (
        <section className="card stack">
          <h2 className="card__title">What just happened</h2>
          <pre className="mono xsmall" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{steps.join('\n')}</pre>
        </section>
      )}
    </div>
  );
}
