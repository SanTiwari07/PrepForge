import type { MCQ } from '@/content/schema';
import { Markdown } from '@/components/Markdown';
import { CodeBlock } from '@/components/CodeBlock';
import { Badge, DifficultyBadge } from '@/components/ui';
import { CheckCircle2, XCircle } from 'lucide-react';
import { displayOptions } from './optionOrder';

const TYPE_LABEL: Record<string, string> = {
  concept: 'Concept', complexity: 'Complexity', 'code-output': 'Predict the output', 'compile-error': 'Compile error', debug: 'Find the bug',
  'edge-case': 'Edge case', scenario: 'Scenario', command: 'Command', config: 'Configuration', 'which-method': 'Which method runs?', design: 'Design', pattern: 'Which pattern?',
};

export function McqView({ q, selected, onToggle, revealed, index, total }: {
  q: MCQ; selected: string[]; onToggle: (id: string) => void; revealed: boolean; index?: number; total?: number;
}) {
  const multi = q.correct.length > 1;
  const options = displayOptions(q);
  return (
    <div className="mcq">
      <div className="row mb-4" style={{ gap: 6 }}>
        {index !== undefined && total !== undefined && <span className="xsmall muted">Question {index + 1} of {total}</span>}
        <Badge tone="outline">{TYPE_LABEL[q.type] ?? q.type}</Badge>
        <DifficultyBadge d={q.difficulty} />
        {q.verified === 'compiled' && <Badge tone="success" title="The code in this question was compiled and run to confirm the answer.">Output verified</Badge>}
      </div>
      <Markdown md={q.stemMd} className="prose mcq__stem" />
      {q.code && <div className="mt-4"><CodeBlock samples={[q.code]} /></div>}
      {multi && <p className="xsmall muted mt-2">Select all that apply.</p>}
      <div className="mcq__options" role={multi ? 'group' : 'radiogroup'} aria-label="Options">
        {options.map((o, i) => {
          const isSel = selected.includes(o.id);
          const isCorrect = q.correct.includes(o.id);
          const state = revealed ? (isCorrect ? 'correct' : isSel ? 'wrong' : '') : isSel ? 'selected' : '';
          return (
            <button
              key={o.id}
              type="button"
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={isSel}
              className={`mcq__option ${state ? `is-${state}` : ''}`}
              onClick={() => !revealed && onToggle(o.id)}
              disabled={revealed}
            >
              <span className="mcq__key" aria-hidden>{String.fromCharCode(65 + i)}</span>
              <span className="grow"><Markdown md={o.textMd} inline className="" /></span>
              {revealed && isCorrect && <CheckCircle2 size={18} className="icon-success" aria-label="Correct answer" />}
              {revealed && isSel && !isCorrect && <XCircle size={18} className="icon-danger" aria-label="Your incorrect choice" />}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="mcq__explain">
          <h4>Why the answer is correct</h4>
          <Markdown md={q.explanationMd} />
          {options.some((o) => o.whyWrongMd && !q.correct.includes(o.id)) && (
            <>
              <h4 className="mt-4">Why the other options are wrong</h4>
              <ul className="prose">
                {options.filter((o) => o.whyWrongMd && !q.correct.includes(o.id)).map((o) => (
                  <li key={o.id}><strong>{String.fromCharCode(65 + options.indexOf(o))}.</strong> <Markdown md={o.whyWrongMd!} inline className="" /></li>
                ))}
              </ul>
            </>
          )}
          {q.misconceptionsMd && (
            <>
              <h4 className="mt-4">Common misconception</h4>
              <Markdown md={q.misconceptionsMd} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
