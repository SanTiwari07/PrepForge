import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Callout, Badge } from '@/components/ui';
import { schedule, type Algorithm, type Proc } from '@/engine/tools/scheduling';
import { parseRefString, simulatePaging, type PageAlgo } from '@/engine/tools/paging';
import { prefixForHosts, subnetInfo } from '@/engine/tools/subnet';
import { conflicts, formatOp, parseSchedule, precedenceEdges, recoverability, serialOrder, transactions, viewSerialOrder } from '@/engine/tools/schedule';
import { candidateKeys, closure, countSuperkeys, isLosslessBinary, MAX_ATTRS, normalForm, parseAttributes, parseFDs, preservedFDs } from '@/engine/tools/fd';

const TOOLS = [
  { id: 'cpu-scheduling', title: 'CPU scheduling', subject: 'Operating Systems' },
  { id: 'page-replacement', title: 'Page replacement', subject: 'Operating Systems' },
  { id: 'subnet', title: 'Subnet calculator', subject: 'Computer Networks' },
  { id: 'fd', title: 'FD and normalisation toolkit', subject: 'DBMS' },
  { id: 'schedule', title: 'Schedule analyser', subject: 'DBMS' },
];

export default function ToolsPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const active = TOOLS.find((t) => t.id === toolId) ?? TOOLS[0];
  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Practice" title="Tools" lead="Solve the problem by hand first, then check your working here. Every tool computes real results (and is unit-tested against textbook examples)." />
      <div className="tabs" role="tablist" aria-label="Tools">
        {TOOLS.map((t) => <button key={t.id} role="tab" className="tab" aria-selected={active.id === t.id} onClick={() => navigate(`/tools/${t.id}`)}>{t.title}</button>)}
      </div>
      {active.id === 'cpu-scheduling' && <SchedulingTool />}
      {active.id === 'page-replacement' && <PagingTool />}
      {active.id === 'subnet' && <SubnetTool />}
      {active.id === 'fd' && <FdTool />}
      {active.id === 'schedule' && <ScheduleTool />}
    </div>
  );
}

function SchedulingTool() {
  const [rows, setRows] = useState<Proc[]>([
    { id: 'P1', arrival: 0, burst: 5, priority: 2 },
    { id: 'P2', arrival: 1, burst: 3, priority: 1 },
    { id: 'P3', arrival: 2, burst: 8, priority: 3 },
    { id: 'P4', arrival: 3, burst: 6, priority: 2 },
  ]);
  const [algo, setAlgo] = useState<Algorithm>('fcfs');
  const [q, setQ] = useState(2);
  const [show, setShow] = useState(false);
  const valid = rows.length > 0 && rows.every((r) => r.burst > 0 && r.arrival >= 0);
  const res = useMemo(() => (valid ? schedule(rows, algo, q) : null), [rows, algo, q, valid]);
  const total = res ? res.gantt[res.gantt.length - 1].end : 1;
  const upd = (i: number, k: keyof Proc, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: k === 'id' ? v : Math.max(0, Number(v) || 0) } : r)));

  return (
    <div className="stack">
      <section className="card stack">
        <div className="row">
          <label className="field" style={{ minWidth: 220 }}><span className="label">Algorithm</span>
            <select className="select" value={algo} onChange={(e) => { setAlgo(e.target.value as Algorithm); setShow(false); }}>
              <option value="fcfs">FCFS</option><option value="sjf">SJF (non-preemptive)</option><option value="srtf">SRTF (preemptive SJF)</option>
              <option value="priority">Priority (non-preemptive)</option><option value="priority-preemptive">Priority (preemptive)</option><option value="rr">Round Robin</option>
            </select>
          </label>
          {algo === 'rr' && <label className="field" style={{ width: 120 }}><span className="label">Quantum</span><input className="input" type="number" min={1} value={q} onChange={(e) => setQ(Math.max(1, Number(e.target.value) || 1))} /></label>}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Process</th><th>Arrival</th><th>Burst</th><th>Priority (lower = higher)</th><th /></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><input className="input" value={r.id} onChange={(e) => upd(i, 'id', e.target.value)} aria-label="Process id" /></td>
                  <td><input className="input" type="number" min={0} value={r.arrival} onChange={(e) => upd(i, 'arrival', e.target.value)} aria-label="Arrival time" /></td>
                  <td><input className="input" type="number" min={1} value={r.burst} onChange={(e) => upd(i, 'burst', e.target.value)} aria-label="Burst time" /></td>
                  <td><input className="input" type="number" min={0} value={r.priority ?? 0} onChange={(e) => upd(i, 'priority', e.target.value)} aria-label="Priority" /></td>
                  <td><button className="btn btn--ghost btn--sm" onClick={() => setRows(rows.filter((_, j) => j !== i))} disabled={rows.length === 1}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row">
          <button className="btn btn--secondary btn--sm" onClick={() => setRows([...rows, { id: `P${rows.length + 1}`, arrival: 0, burst: 1, priority: 0 }])}>Add process</button>
          <button className="btn btn--primary btn--sm" onClick={() => setShow(true)} disabled={!valid}>I have solved it by hand: show the answer</button>
        </div>
        <p className="xsmall muted">Ties are broken by arrival time, then input order. In Round Robin, processes that arrive during a time slice join the queue before the preempted process.</p>
      </section>
      {show && res && (
        <section className="card stack">
          <h2 className="card__title">Gantt chart</h2>
          <div className="gantt" role="img" aria-label={res.gantt.map((s) => `${s.id ?? 'idle'} ${s.start}-${s.end}`).join(', ')}>
            {res.gantt.map((s, i) => (
              <div key={i} className={`gantt__slice${s.id ? '' : ' is-idle'}`} style={{ flexGrow: s.end - s.start }}>
                <span className="gantt__label">{s.id ?? 'idle'}</span>
                <span className="gantt__time">{s.start}</span>
                {i === res.gantt.length - 1 && <span className="gantt__time gantt__time--end">{s.end}</span>}
              </div>
            ))}
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Process</th><th>Arrival</th><th>Burst</th><th>Completion</th><th>Turnaround</th><th>Waiting</th><th>Response</th></tr></thead>
              <tbody>{res.stats.map((s) => <tr key={s.id}><td>{s.id}</td><td>{s.arrival}</td><td>{s.burst}</td><td>{s.completion}</td><td>{s.turnaround}</td><td>{s.waiting}</td><td>{s.response}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="small">Average waiting <strong>{res.avgWaiting}</strong> · average turnaround <strong>{res.avgTurnaround}</strong> · average response <strong>{res.avgResponse}</strong> · total time {total}</p>
          <p className="xsmall muted">Turnaround = completion − arrival. Waiting = turnaround − burst. Response = first run − arrival.</p>
        </section>
      )}
    </div>
  );
}

function PagingTool() {
  const [refStr, setRefStr] = useState('7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1');
  const [frames, setFrames] = useState(3);
  const refs = parseRefString(refStr);
  const results = useMemo(() => (['fifo', 'lru', 'optimal'] as PageAlgo[]).map((a) => ({ a, r: simulatePaging(refs, frames, a) })), [refStr, frames]); // eslint-disable-line react-hooks/exhaustive-deps
  const [algo, setAlgo] = useState<PageAlgo>('lru');
  const cur = results.find((x) => x.a === algo)!.r;
  return (
    <div className="stack">
      <section className="card stack">
        <label className="field"><span className="label">Reference string</span><input className="input mono" value={refStr} onChange={(e) => setRefStr(e.target.value)} /></label>
        <div className="row">
          <label className="field" style={{ width: 140 }}><span className="label">Frames</span><input className="input" type="number" min={1} max={10} value={frames} onChange={(e) => setFrames(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} /></label>
          <div className="segmented" role="group" aria-label="Algorithm">{(['fifo', 'lru', 'optimal'] as const).map((a) => <button key={a} aria-pressed={algo === a} onClick={() => setAlgo(a)}>{a.toUpperCase()}</button>)}</div>
        </div>
        <p className="small">Page faults: {results.map((x) => <span key={x.a} style={{ marginRight: 12 }}><strong>{x.a.toUpperCase()}</strong> {x.r.faults}</span>)}</p>
        <p className="xsmall muted">Try 1 2 3 4 1 2 5 1 2 3 4 5 with FIFO at 3 and then 4 frames: more frames, more faults (Belady's anomaly).</p>
      </section>
      <section className="card">
        <div className="table-wrap">
          <table className="table table--mono">
            <thead><tr><th>Step</th>{cur.steps.map((s, i) => <th key={i}>{s.page}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: frames }, (_, f) => (
                <tr key={f}><td>Frame {f + 1}</td>{cur.steps.map((s, i) => <td key={i}>{s.frames[f] ?? ''}</td>)}</tr>
              ))}
              <tr><td>Result</td>{cur.steps.map((s, i) => <td key={i}>{s.hit ? <Badge tone="success">H</Badge> : <Badge tone="danger">F</Badge>}</td>)}</tr>
            </tbody>
          </table>
        </div>
        <p className="small mt-4">{algo.toUpperCase()}: {cur.faults} faults, {cur.hits} hits, hit ratio {refs.length ? Math.round((100 * cur.hits) / refs.length) : 0}%.</p>
      </section>
    </div>
  );
}

function SubnetTool() {
  const [cidr, setCidr] = useState('192.168.10.77/26');
  const [hosts, setHosts] = useState(50);
  const info = subnetInfo(cidr);
  return (
    <div className="grid grid-2">
      <section className="card stack">
        <label className="field"><span className="label">IPv4 address with prefix</span><input className="input mono" value={cidr} onChange={(e) => setCidr(e.target.value)} /></label>
        {typeof info === 'string' ? <Callout tone="danger">{info}</Callout> : (
          <dl className="kv">
            {([['Network', info.network], ['Broadcast', info.broadcast], ['First host', info.firstHost], ['Last host', info.lastHost], ['Subnet mask', info.mask], ['Wildcard', info.wildcard], ['Total addresses', info.totalAddresses.toLocaleString()], ['Usable hosts', info.usableHosts.toLocaleString()], ['Class (historic)', info.ipClass], ['Private range', info.isPrivate ? 'Yes (RFC 1918)' : 'No']] as const).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd className="mono">{v}</dd></div>
            ))}
          </dl>
        )}
      </section>
      <section className="card stack">
        <h2 className="card__title">Hosts → prefix</h2>
        <label className="field"><span className="label">Hosts needed</span><input className="input" type="number" min={1} value={hosts} onChange={(e) => setHosts(Math.max(1, Number(e.target.value) || 1))} /></label>
        <p className="small">Smallest subnet: <strong>/{prefixForHosts(hosts)}</strong> ({2 ** (32 - prefixForHosts(hosts)) - 2} usable hosts).</p>
        <p className="xsmall muted">Usable hosts = 2^(32 − prefix) − 2 (network and broadcast addresses are reserved), except /31 point-to-point links and /32 single hosts.</p>
        <Link to="/learn/cn/cn.ip-subnetting" className="small">Subnetting topic →</Link>
      </section>
    </div>
  );
}

function FdTool() {
  const [attrStr, setAttrStr] = useState('A B C D E');
  const [fdStr, setFdStr] = useState('A -> B\nB C -> D\nD -> A');
  const [x, setX] = useState('A C');
  const [r1, setR1] = useState('A B C');
  const [r2, setR2] = useState('A C D E');
  const attrs = parseAttributes(attrStr);
  const fds = parseFDs(fdStr, attrs);
  const tooMany = attrs.length > MAX_ATTRS;
  const analysis = useMemo(() => {
    if (typeof fds === 'string' || tooMany || !attrs.length) return null;
    const keys = candidateKeys(attrs, fds);
    return { keys, superkeys: countSuperkeys(attrs, keys), nf: normalForm(attrs, fds), prime: [...new Set(keys.flat())] };
  }, [attrStr, fdStr]); // eslint-disable-line react-hooks/exhaustive-deps
  const xs = parseAttributes(x).filter((a) => attrs.includes(a));
  const cl = typeof fds === 'string' ? null : closure(xs, fds);
  const p1 = parseAttributes(r1).filter((a) => attrs.includes(a));
  const p2 = parseAttributes(r2).filter((a) => attrs.includes(a));
  const fdText = (f: { lhs: string[]; rhs: string[] }) => `${f.lhs.join(' ')} → ${f.rhs.join(' ')}`;

  return (
    <div className="grid grid-2">
      <section className="card stack">
        <label className="field"><span className="label">Attributes (space- or comma-separated)</span><input className="input mono" value={attrStr} onChange={(e) => setAttrStr(e.target.value)} /></label>
        <label className="field"><span className="label">Functional dependencies (one per line, e.g. B C -&gt; D)</span><textarea className="textarea textarea--code" rows={5} value={fdStr} onChange={(e) => setFdStr(e.target.value)} /></label>
        {typeof fds === 'string' && <Callout tone="danger">{fds}</Callout>}
        {tooMany && <Callout tone="warning">Up to {MAX_ATTRS} attributes are supported.</Callout>}
        <label className="field"><span className="label">Compute the closure of</span><input className="input mono" value={x} onChange={(e) => setX(e.target.value)} /></label>
        {cl && (
          <div className="small">
            <p><strong>({xs.join(' ')})⁺ = {'{'}{cl.result.join(', ')}{'}'}</strong>{cl.result.length === attrs.length ? ' : a superkey' : ''}</p>
            <ol className="prose xsmall">{cl.steps.map((s, i) => <li key={i}>Apply {fdText(s.fd)} → add {s.added.join(', ')}</li>)}</ol>
          </div>
        )}
      </section>
      <section className="card stack">
        <h2 className="card__title">Keys and normal form</h2>
        {analysis ? (
          <>
            <p className="small">Candidate keys: {analysis.keys.map((k) => <Badge key={k.join('')} tone="dark">{'{'}{k.join(', ')}{'}'}</Badge>)}</p>
            <p className="small">Prime attributes: {analysis.prime.join(', ') || 'none'} · Superkeys: <strong>{analysis.superkeys}</strong></p>
            <p className="small">Highest normal form: <strong>{analysis.nf.highest}</strong> (assuming atomic values, i.e. 1NF)</p>
            {analysis.nf.violations.length > 0 && <ul className="prose xsmall">{analysis.nf.violations.map((v, i) => <li key={i}><strong>{v.nf}</strong> violated by {fdText(v.fd)}: {v.reason}</li>)}</ul>}
            <h3 className="eyebrow mt-2">Binary decomposition check</h3>
            <div className="grid grid-2">
              <label className="field"><span className="label">R1</span><input className="input mono" value={r1} onChange={(e) => setR1(e.target.value)} /></label>
              <label className="field"><span className="label">R2</span><input className="input mono" value={r2} onChange={(e) => setR2(e.target.value)} /></label>
            </div>
            {typeof fds !== 'string' && (
              <>
                <p className="small">Lossless join: <strong>{isLosslessBinary(p1, p2, attrs, fds) ? 'Yes' : 'No'}</strong> (R1 ∪ R2 must equal R, and R1 ∩ R2 must determine R1 or R2)</p>
                <ul className="prose xsmall">{preservedFDs([p1, p2], fds).map((p, i) => <li key={i}>{fdText(p.fd)}: {p.preserved ? 'preserved' : <strong>not preserved</strong>}</li>)}</ul>
              </>
            )}
          </>
        ) : <p className="small muted">Enter valid attributes and dependencies.</p>}
      </section>
    </div>
  );
}

function ScheduleTool() {
  const [text, setText] = useState('R1(A) R2(A) W1(A) W2(A) C1 C2');
  const ops = parseSchedule(text);
  const result = useMemo(() => {
    if (typeof ops === 'string' || !ops.length) return null;
    const txs = transactions(ops);
    let view: string[] | null | 'too-many' = null;
    try { view = viewSerialOrder(ops); } catch { view = 'too-many'; }
    return { txs, conflicts: conflicts(ops), edges: precedenceEdges(ops), order: serialOrder(ops), view, rec: recoverability(ops) };
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  const yes = (b: boolean) => <strong>{b ? 'Yes' : 'No'}</strong>;
  return (
    <div className="grid grid-2">
      <section className="card stack">
        <label className="field">
          <span className="label">Schedule (R1(A) = T1 reads A, W2(B) = T2 writes B, C1 = T1 commits, A2 = T2 aborts)</span>
          <textarea className="textarea textarea--code" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        {typeof ops === 'string' && <Callout tone="danger">{ops}</Callout>}
        <div className="row" style={{ gap: 6 }}>
          {['R1(A) W1(A) R2(A) W2(A) R1(B) W1(B) R2(B) W2(B) C1 C2', 'R1(A) W2(A) W1(A) W3(A)', 'W1(A) R2(A) C2 C1', 'W1(A) C1 R2(A) C2'].map((ex) => (
            <button key={ex} className="btn btn--ghost btn--sm mono" onClick={() => setText(ex)}>{ex}</button>
          ))}
        </div>
        {result && (
          <div className="small stack-sm">
            <h2 className="eyebrow">Conflicting pairs</h2>
            {result.conflicts.length ? <ul className="prose xsmall">{result.conflicts.map((c, i) => <li key={i}>{formatOp(c.first)} before {formatOp(c.second)} → edge T{c.first.tx} → T{c.second.tx}</li>)}</ul> : <p className="xsmall muted">No conflicts.</p>}
          </div>
        )}
      </section>
      <section className="card stack">
        <h2 className="card__title">Analysis</h2>
        {result ? (
          <div className="small stack-sm">
            <p>Transactions: {result.txs.map((t) => <Badge key={t} tone="dark">T{t}</Badge>)}</p>
            <p>Precedence graph edges: {result.edges.length ? result.edges.map(([a, b]) => `T${a} → T${b}`).join(', ') : 'none'}</p>
            <p>Conflict serialisable: {yes(result.order !== null)}{result.order ? ` (equivalent serial order ${result.order.map((t) => `T${t}`).join(' → ')})` : ' (the precedence graph has a cycle)'}</p>
            <p>View serialisable: {result.view === 'too-many' ? 'not checked (more than 6 transactions)' : <>{yes(result.view !== null)}{result.view ? ` (serial order ${result.view.map((t) => `T${t}`).join(' → ')})` : ''}</>}</p>
            <h3 className="eyebrow mt-2">Recoverability</h3>
            <p>Recoverable: {yes(result.rec.recoverable)} · Cascadeless: {yes(result.rec.cascadeless)} · Strict: {yes(result.rec.strict)}</p>
            {result.rec.notes.length > 0 && <ul className="prose xsmall">{result.rec.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
            <p className="xsmall muted">Recoverability needs commit (C) and abort (A) operations; a transaction without one is treated as still running.</p>
          </div>
        ) : <p className="small muted">Enter a schedule.</p>}
      </section>
    </div>
  );
}
