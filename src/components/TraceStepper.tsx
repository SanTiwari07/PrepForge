import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { TraceStep } from '@/content/schema';

export function TraceStepper({ steps }: { steps: TraceStep[] }) {
  const [i, setI] = useState(0);
  const step = steps[i];
  const ptrAt = (idx: number) => Object.entries(step.pointers ?? {}).filter(([, v]) => v === idx).map(([k]) => k);
  const inWindow = (idx: number) => !!step.window && idx >= step.window[0] && idx <= step.window[1];

  return (
    <div className="trace" aria-roledescription="step-through visualisation">
      {step.array && (
        <div className="trace__array" role="list" aria-label="Array state">
          {step.array.map((v, idx) => (
            <div key={idx} role="listitem" className={`trace__cell${step.highlight?.includes(idx) ? ' is-hl' : ''}${inWindow(idx) ? ' is-win' : ''}`}>
              <span className="trace__val">{String(v)}</span>
              <span className="trace__idx">{idx}</span>
              <span className="trace__ptr">{ptrAt(idx).join(',')}</span>
            </div>
          ))}
        </div>
      )}
      {step.stack && (
        <div className="trace__stack" aria-label="Stack (bottom to top)">
          {step.stack.map((v, k) => <span key={k} className="trace__chip">{String(v)}</span>)}
        </div>
      )}
      {step.vars && (
        <dl className="trace__vars">
          {Object.entries(step.vars).map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd className="mono">{String(v)}</dd></div>
          ))}
        </dl>
      )}
      <p className="trace__note" aria-live="polite">{step.note}</p>
      <div className="row-between">
        <span className="xsmall muted">Step {i + 1} of {steps.length}</span>
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setI(0)} disabled={i === 0} aria-label="Restart"><RotateCcw /></button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}><ChevronLeft /> Prev</button>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setI((x) => Math.min(steps.length - 1, x + 1))} disabled={i === steps.length - 1}>Next <ChevronRight /></button>
        </div>
      </div>
    </div>
  );
}
