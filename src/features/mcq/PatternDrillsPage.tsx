import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { PATTERN_DRILLS, type PatternDrill } from '@/content/drills/pattern-drills';
import { TOPIC_BY_ID } from '@/content/registry';
import { PageHeader, Badge } from '@/components/ui';

function shuffle<T>(a: T[]): T[] {
  return a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
}

const title = (id: string) => TOPIC_BY_ID.get(id)?.title ?? id;

interface Round { drill: PatternDrill; options: string[] }

function makeSession(count: number): Round[] {
  return shuffle(PATTERN_DRILLS).slice(0, count).map((drill) => ({ drill, options: shuffle(drill.options) }));
}

export default function PatternDrillsPage() {
  const [count, setCount] = useState(10);
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState<string[]>([]);

  const start = () => { setRounds(makeSession(count)); setI(0); setPicked(null); setMissed([]); };

  if (!rounds) {
    return (
      <div className="stack-lg">
        <PageHeader eyebrow="Practice" title="Pattern drills" lead={`Read a short problem description and name the pattern that solves it. ${PATTERN_DRILLS.length} original scenarios; no code to write. Recognising the pattern quickly is most of the battle in an OA.`} />
        <section className="card row">
          <label className="field" style={{ width: 200 }}><span className="label">Number of drills</span>
            <select className="select" value={count} onChange={(e) => setCount(Number(e.target.value))}>{[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
          <button className="btn btn--primary" onClick={start}>Start drill</button>
        </section>
      </div>
    );
  }

  if (i >= rounds.length) {
    const wrong = rounds.filter((r) => missed.includes(r.drill.id));
    return (
      <div className="stack-lg">
        <PageHeader eyebrow="Practice" title="Drill complete" lead={`${rounds.length - missed.length} of ${rounds.length} patterns recognised.`} actions={<button className="btn btn--primary" onClick={start}>Another round</button>} />
        {wrong.length > 0 && (
          <section className="card stack">
            <h2 className="card__title">Review these</h2>
            <ul className="stack-sm">
              {wrong.map((r) => (
                <li key={r.drill.id}>
                  <p className="small">{r.drill.scenario}</p>
                  <p className="small"><strong>{title(r.drill.answer)}.</strong> {r.drill.why} <Link to={`/learn/dsa/${r.drill.answer}`}>Open the lesson</Link></p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  const { drill, options } = rounds[i];
  const revealed = picked !== null;
  const correctSoFar = i + (revealed ? 1 : 0) - missed.length;
  const choose = (id: string) => {
    if (revealed) return;
    setPicked(id);
    if (id !== drill.answer) setMissed((m) => [...m, drill.id]);
  };
  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Practice" title="Pattern drills" actions={<button className="btn btn--secondary" onClick={() => setRounds(null)}>End session</button>} />
      <section className="card mcq">
        <div className="row mb-4" style={{ gap: 6 }}>
          <span className="xsmall muted">Drill {i + 1} of {rounds.length}</span>
          <Badge tone="outline">Which pattern?</Badge>
          <span className="xsmall muted">{correctSoFar} correct so far</span>
        </div>
        <p className="prose mcq__stem">{drill.scenario}</p>
        <div className="mcq__options" role="radiogroup" aria-label="Patterns">
          {options.map((o, k) => {
            const isCorrect = o === drill.answer;
            const state = revealed ? (isCorrect ? 'correct' : o === picked ? 'wrong' : '') : '';
            return (
              <button key={o} type="button" role="radio" aria-checked={o === picked} disabled={revealed} className={`mcq__option ${state ? `is-${state}` : ''}`} onClick={() => choose(o)}>
                <span className="mcq__key" aria-hidden>{String.fromCharCode(65 + k)}</span>
                <span className="grow">{title(o)}</span>
                {revealed && isCorrect && <CheckCircle2 size={18} className="icon-success" aria-label="Correct answer" />}
                {revealed && o === picked && !isCorrect && <XCircle size={18} className="icon-danger" aria-label="Your incorrect choice" />}
              </button>
            );
          })}
        </div>
        {revealed && (
          <div className="mcq__explain">
            <h4>{picked === drill.answer ? 'Correct' : `The pattern is ${title(drill.answer)}`}</h4>
            <p>{drill.why}</p>
            <div className="row mt-4">
              <button className="btn btn--primary btn--sm" onClick={() => { setPicked(null); setI(i + 1); }}>{i + 1 === rounds.length ? 'Finish' : 'Next drill'}</button>
              <Link className="btn btn--ghost btn--sm" to={`/learn/dsa/${drill.answer}`}>Open the lesson</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
