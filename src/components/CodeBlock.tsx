import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { CodeSample } from '@/content/schema';
import { highlight } from '@/lib/highlight';
import { useStore } from '@/store/store';

const LANG_LABEL: Record<string, string> = { cpp: 'C++', java: 'Java', sql: 'SQL', python: 'Python', bash: 'Shell', yaml: 'YAML', dockerfile: 'Dockerfile', json: 'JSON', text: 'Text' };

export function CodeBlock({ samples, title }: { samples: CodeSample[]; title?: string }) {
  const preferred = useStore((s) => s.profile.preferredLang);
  const initial = Math.max(0, samples.findIndex((x) => x.lang === preferred));
  const [active, setActive] = useState(initial);
  const [copied, setCopied] = useState(false);
  const sample = samples[Math.min(active, samples.length - 1)];
  const html = useMemo(() => highlight(sample.code, sample.lang), [sample]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sample.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: ignore */
    }
  };

  return (
    <div className="code">
      <div className="code__bar">
        {samples.length > 1 ? (
          <div className="code__tabs" role="tablist" aria-label={title ?? 'Code language'}>
            {samples.map((s, i) => (
              <button key={i} type="button" role="tab" className="code__tab" aria-selected={i === active} onClick={() => setActive(i)}>
                {s.label ?? LANG_LABEL[s.lang] ?? s.lang}
              </button>
            ))}
          </div>
        ) : (
          <span className="code__label">{title ?? sample.label ?? LANG_LABEL[sample.lang]}</span>
        )}
        <button type="button" className="btn btn--ghost btn--sm" onClick={copy} aria-label="Copy code">
          {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre tabIndex={0}>
        <code className={`hljs language-${sample.lang}`} dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
