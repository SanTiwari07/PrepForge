import { useMemo } from 'react';
import type { SqlDataset } from '@/content/schema';
import type { Cell } from '@/engine/sqlCompare';

export function ResultTable({ columns, rows, caption, highlightRows }: { columns: string[]; rows: Cell[][]; caption?: string; highlightRows?: Set<number> }) {
  if (!columns.length) return <p className="small muted">The statement ran but returned no result set.</p>;
  return (
    <div className="table-wrap result-table">
      <table className="table table--mono">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead><tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="muted" style={{ fontFamily: 'var(--font-sans)' }}>0 rows</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className={highlightRows?.has(i) ? 'row-diff' : undefined}>
              {r.map((v, j) => <td key={j}>{v === null ? <span className="null">NULL</span> : String(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Parses CREATE TABLE statements in a dataset schema into table → columns for display. */
export function SchemaBrowser({ dataset }: { dataset: SqlDataset }) {
  const tables = useMemo(() => {
    const out: { name: string; cols: string[] }[] = [];
    const re = /CREATE TABLE (\w+)\s*\(([\s\S]*?)\);/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(dataset.schemaSql))) {
      const cols = m[2].split('\n').map((l) => l.trim().replace(/,$/, '')).filter((l) => l && !/^PRIMARY KEY/i.test(l));
      out.push({ name: m[1], cols });
    }
    return out;
  }, [dataset]);
  return (
    <div className="schema">
      {tables.map((t) => (
        <details key={t.name} open className="schema__table">
          <summary className="mono strong small">{t.name}</summary>
          <ul className="list-plain">
            {t.cols.map((c) => {
              const [name, ...rest] = c.split(/\s+/);
              return <li key={c} className="xsmall"><span className="mono strong">{name}</span> <span className="muted mono">{rest.join(' ')}</span></li>;
            })}
          </ul>
        </details>
      ))}
    </div>
  );
}

export function SqlEditor({ value, onChange, onRun, label = 'SQL query' }: { value: string; onChange: (v: string) => void; onRun: () => void; label?: string }) {
  return (
    <textarea
      className="textarea textarea--code sql-editor"
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onRun(); }
        if (e.key === 'Tab') {
          e.preventDefault();
          const el = e.currentTarget;
          const s = el.selectionStart;
          const next = value.slice(0, s) + '  ' + value.slice(el.selectionEnd);
          onChange(next);
          requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
        }
      }}
      aria-label={label}
      rows={10}
    />
  );
}
